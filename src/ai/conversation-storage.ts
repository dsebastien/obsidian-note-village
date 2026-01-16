import type { App, TFile } from 'obsidian'
import type { ConversationState } from '#types/conversation-state.intf'
import { log } from '../utils/log'

/**
 * Stores conversations to the Obsidian vault
 */
export class ConversationStorage {
    constructor(
        private app: App,
        private folderPath: string
    ) {}

    /**
     * Update the folder path
     */
    setFolderPath(folderPath: string): void {
        this.folderPath = folderPath
    }

    /**
     * Save a conversation to the vault
     */
    async saveConversation(conversation: ConversationState): Promise<TFile | null> {
        if (!this.folderPath || conversation.messages.length === 0) {
            return null
        }

        try {
            // Ensure folder exists
            await this.ensureFolderExists()

            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const safeName = conversation.villagerName.replace(/[\\/:*?"<>|]/g, '_')
            const filename = `${safeName}-${timestamp}.md`
            const filepath = `${this.folderPath}/${filename}`

            // Generate content
            const content = this.formatConversation(conversation)

            // Create file
            const file = await this.app.vault.create(filepath, content)
            log('Saved conversation', 'debug', { filepath })

            return file
        } catch (error) {
            log('Failed to save conversation', 'error', error)
            return null
        }
    }

    /**
     * Ensure the conversation folder exists
     */
    private async ensureFolderExists(): Promise<void> {
        const folder = this.app.vault.getAbstractFileByPath(this.folderPath)
        if (!folder) {
            await this.app.vault.createFolder(this.folderPath)
        }
    }

    /**
     * Format conversation as markdown
     */
    private formatConversation(conversation: ConversationState): string {
        const lines: string[] = []

        // Frontmatter
        lines.push('---')
        lines.push(`villager: "[[${conversation.notePath}|${conversation.villagerName}]]"`)
        lines.push(`started: ${conversation.startedAt}`)
        if (conversation.lastMessageAt) {
            lines.push(`ended: ${conversation.lastMessageAt}`)
        }
        lines.push('---')
        lines.push('')

        // Title
        lines.push(`# Conversation with ${conversation.villagerName}`)
        lines.push('')

        // Messages
        for (const message of conversation.messages) {
            if (message.role === 'user') {
                lines.push('**You:**')
            } else {
                lines.push(`**${conversation.villagerName}:**`)
            }
            lines.push(message.content)
            lines.push('')
        }

        return lines.join('\n')
    }

    /**
     * Load conversations with a specific villager
     */
    async loadConversationsForVillager(villagerName: string): Promise<ConversationState[]> {
        const conversations: ConversationState[] = []

        const folder = this.app.vault.getAbstractFileByPath(this.folderPath)
        if (!folder) return conversations

        const files = this.app.vault
            .getMarkdownFiles()
            .filter(
                (f) => f.path.startsWith(this.folderPath) && f.basename.startsWith(villagerName)
            )

        for (const file of files) {
            try {
                const content = await this.app.vault.read(file)
                const parsed = this.parseConversation(content, villagerName)
                if (parsed) {
                    conversations.push(parsed)
                }
            } catch {
                // Skip files that can't be parsed
            }
        }

        return conversations.sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
    }

    /**
     * Parse a conversation file back to state
     */
    private parseConversation(content: string, villagerName: string): ConversationState | null {
        const messages: ConversationState['messages'] = []

        // Split by speaker
        const lines = content.split('\n')
        let currentRole: 'user' | 'assistant' | null = null
        let currentContent: string[] = []

        for (const line of lines) {
            if (line.startsWith('**You:**')) {
                if (currentRole && currentContent.length > 0) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.join('\n').trim()
                    })
                }
                currentRole = 'user'
                currentContent = []
            } else if (line.startsWith(`**${villagerName}:**`)) {
                if (currentRole && currentContent.length > 0) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.join('\n').trim()
                    })
                }
                currentRole = 'assistant'
                currentContent = []
            } else if (currentRole && !line.startsWith('---') && !line.startsWith('#')) {
                currentContent.push(line)
            }
        }

        // Add last message
        if (currentRole && currentContent.length > 0) {
            messages.push({
                role: currentRole,
                content: currentContent.join('\n').trim()
            })
        }

        if (messages.length === 0) return null

        return {
            villagerName,
            notePath: '',
            noteContent: '',
            messages,
            startedAt: new Date().toISOString()
        }
    }
}
