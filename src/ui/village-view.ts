import { ItemView, TFile, WorkspaceLeaf } from 'obsidian'
import { VillageGame } from '../game/village-game'
import type { VillageData } from '#types/village-data.intf'
import { VillageGenerator } from '../game/world/village-generator'
import type { Villager } from '../game/actors/villager.actor'
import { ChatPanel } from './chat/chat-panel'
import { SpeechBubble } from './chat/speech-bubble'
import { ConversationManager } from '../ai/conversation-manager'
import { ConversationStorage } from '../ai/conversation-storage'
import type { NoteVillagePlugin } from '../app/plugin'
import { NOTE_VILLAGE_VIEW_TYPE } from '../app/plugin'
import { log } from '../utils/log'

/**
 * Obsidian ItemView that hosts the Note Village game
 */
export class VillageView extends ItemView {
    private game: VillageGame | null = null
    private canvas: HTMLCanvasElement | null = null
    private resizeObserver: ResizeObserver | null = null
    private chatPanel: ChatPanel | null = null
    private speechBubble: SpeechBubble | null = null
    private currentVillager: Villager | null = null
    private conversationManager: ConversationManager | null = null
    private conversationStorage: ConversationStorage | null = null

    constructor(
        leaf: WorkspaceLeaf,
        private plugin: NoteVillagePlugin
    ) {
        super(leaf)
    }

    override getViewType(): string {
        return NOTE_VILLAGE_VIEW_TYPE
    }

    override getDisplayText(): string {
        return 'Note Village'
    }

    override getIcon(): string {
        return 'home'
    }

    override async onOpen(): Promise<void> {
        log('Opening VillageView', 'debug')

        const container = this.containerEl.children[1]
        if (!container) {
            log('Container not found', 'error')
            return
        }

        container.empty()
        container.addClass('note-village-container')

        // Create canvas element
        this.canvas = container.createEl('canvas', {
            cls: 'note-village-canvas'
        })

        // Set canvas size
        this.updateCanvasSize()

        // Create UI components
        this.chatPanel = new ChatPanel(container as HTMLElement)
        this.speechBubble = new SpeechBubble(container as HTMLElement)

        // Initialize AI components
        this.conversationManager = new ConversationManager(
            this.plugin.settings.anthropicApiKey,
            this.plugin.settings.aiModel
        )
        this.conversationStorage = new ConversationStorage(
            this.app,
            this.plugin.settings.conversationFolder
        )

        // Set up chat panel callbacks
        this.chatPanel.setSendMessageCallback(async (message) => {
            await this.handleChatMessage(message)
        })
        this.chatPanel.setOnCloseCallback(() => {
            this.handleChatClose()
        })

        // Create game instance
        this.game = new VillageGame(this.canvas, this.plugin.settings.renderQuality)

        // Generate village data and initialize game
        const villageData = this.generateVillageData()
        await this.game.initialize(villageData)

        // Set up villager interaction callback
        const scene = this.game.getScene()
        if (scene) {
            scene.setVillagerInteractionCallback((villager) => {
                this.handleVillagerInteraction(villager)
            })

            // Load villagers in the background after game is ready
            // This prevents blocking the initial render
            scene.spawnVillagersInBatches(10)
        }

        // Set up resize observer
        this.resizeObserver = new ResizeObserver(() => {
            this.handleResize()
        })
        this.resizeObserver.observe(container as Element)

        log('VillageView opened', 'debug')
    }

    override async onClose(): Promise<void> {
        log('Closing VillageView', 'debug')

        // Save conversation if in progress
        await this.saveCurrentConversation()

        // Clean up resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }

        // Clean up UI components
        if (this.chatPanel) {
            this.chatPanel.destroy()
            this.chatPanel = null
        }
        if (this.speechBubble) {
            this.speechBubble.destroy()
            this.speechBubble = null
        }

        // Destroy game
        if (this.game) {
            this.game.destroy()
            this.game = null
        }

        this.canvas = null
        this.currentVillager = null
        this.conversationManager = null
        this.conversationStorage = null

        log('VillageView closed', 'debug')
    }

    /**
     * Handle villager interaction (click or E key)
     */
    private async handleVillagerInteraction(villager: Villager): Promise<void> {
        log('Villager interaction', 'debug', { name: villager.getNoteName() })

        // Save previous conversation if any
        await this.saveCurrentConversation()

        this.currentVillager = villager

        // Load note content for AI
        const noteContent = await this.loadNoteContent(villager.getNotePath())
        villager.updateNoteContent(noteContent)

        // Start new conversation
        if (this.conversationManager) {
            this.conversationManager.startConversation(
                villager.getNoteName(),
                villager.getNotePath(),
                noteContent
            )
        }

        // Open chat panel
        if (this.chatPanel) {
            this.chatPanel.open(villager)
        }

        // Show initial greeting in speech bubble
        if (this.speechBubble && this.game) {
            this.speechBubble.show(
                'Hello! What would you like to talk about?',
                villager,
                this.game.getEngine()
            )
        }
    }

    /**
     * Handle chat panel close
     */
    private async handleChatClose(): Promise<void> {
        await this.saveCurrentConversation()
        this.speechBubble?.hide()
        this.currentVillager = null
    }

    /**
     * Handle chat message from user
     */
    private async handleChatMessage(message: string): Promise<void> {
        if (!this.currentVillager || !this.conversationManager) return

        log('Chat message', 'debug', { message })

        let response: string

        if (this.conversationManager.isConfigured()) {
            // Get AI response
            response = await this.conversationManager.sendMessage(message)
        } else {
            // Fallback when no API key
            response = `I'm ${this.currentVillager.getNoteName()}. To have a real conversation, please add your Anthropic API key in the plugin settings.`
        }

        // Add assistant message to chat
        if (this.chatPanel) {
            this.chatPanel.addMessage('assistant', response)
        }

        // Update speech bubble with truncated response
        if (this.speechBubble && this.game && this.currentVillager) {
            const truncated = response.length > 60 ? response.slice(0, 57) + '...' : response
            this.speechBubble.updateText(truncated)
        }
    }

    /**
     * Load note content from vault
     */
    private async loadNoteContent(notePath: string): Promise<string> {
        try {
            const file = this.app.vault.getAbstractFileByPath(notePath)
            if (file instanceof TFile) {
                return await this.app.vault.read(file)
            }
        } catch (error) {
            log('Failed to load note content', 'error', error)
        }
        return ''
    }

    /**
     * Save current conversation to vault
     */
    private async saveCurrentConversation(): Promise<void> {
        if (
            !this.conversationManager ||
            !this.conversationStorage ||
            !this.plugin.settings.saveConversations
        ) {
            return
        }

        const conversation = this.conversationManager.endConversation()
        if (conversation && conversation.messages.length > 0) {
            await this.conversationStorage.saveConversation(conversation)
        }
    }

    /**
     * Update canvas size to fill container.
     * Returns true if canvas has valid dimensions.
     */
    private updateCanvasSize(): boolean {
        if (!this.canvas) return false

        const container = this.containerEl.children[1]
        if (!container) return false

        const rect = container.getBoundingClientRect()

        // Ensure minimum size to prevent WebGL framebuffer errors
        const MIN_SIZE = 100
        const width = Math.max(MIN_SIZE, rect.width || MIN_SIZE)
        const height = Math.max(MIN_SIZE, rect.height || MIN_SIZE)

        this.canvas.width = width
        this.canvas.height = height

        return width > 0 && height > 0
    }

    /**
     * Handle container resize
     */
    private handleResize(): void {
        this.updateCanvasSize()

        if (this.game && this.canvas) {
            this.game.resize(this.canvas.width, this.canvas.height)
        }
    }

    /**
     * Generate village data from vault analysis
     */
    private generateVillageData(): VillageData {
        const generator = new VillageGenerator(
            this.app,
            {
                seed: this.plugin.settings.villageSeed || this.app.vault.getName(),
                topTagCount: this.plugin.settings.topTagCount,
                maxVillagers: this.plugin.settings.maxVillagers
            },
            this.plugin.settings.excludedFolders
        )

        return generator.generate()
    }

    /**
     * Get the game instance
     */
    getGame(): VillageGame | null {
        return this.game
    }

    /**
     * Get the chat panel
     */
    getChatPanel(): ChatPanel | null {
        return this.chatPanel
    }

    /**
     * Get the conversation manager
     */
    getConversationManager(): ConversationManager | null {
        return this.conversationManager
    }

    /**
     * Update settings (called when settings change)
     */
    updateSettings(): void {
        if (this.conversationManager) {
            this.conversationManager.setApiKey(this.plugin.settings.anthropicApiKey)
            this.conversationManager.setModel(this.plugin.settings.aiModel)
        }
        if (this.conversationStorage) {
            this.conversationStorage.setFolderPath(this.plugin.settings.conversationFolder)
        }
    }

    /**
     * Regenerate the village
     */
    async regenerate(): Promise<void> {
        if (!this.game || !this.canvas) return

        // Close chat if open
        if (this.chatPanel?.isOpen()) {
            await this.saveCurrentConversation()
            this.chatPanel.close()
        }

        this.game.destroy()
        this.game = new VillageGame(this.canvas, this.plugin.settings.renderQuality)
        const villageData = this.generateVillageData()
        await this.game.initialize(villageData)

        // Re-wire villager interaction and load villagers in background
        const scene = this.game.getScene()
        if (scene) {
            scene.setVillagerInteractionCallback((villager) => {
                this.handleVillagerInteraction(villager)
            })

            // Load villagers in the background
            scene.spawnVillagersInBatches(10)
        }
    }
}
