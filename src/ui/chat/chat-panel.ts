import { setIcon } from 'obsidian'
import type { Villager } from '../../game/actors/villager.actor'
import type { ChatMessage } from '#types/chat-message.intf'
import type { SendMessageCallback } from '#types/send-message-callback.intf'

/**
 * Chat panel UI for conversations with villagers
 */
export class ChatPanel {
    private container: HTMLElement
    private header: HTMLElement
    private messagesContainer: HTMLElement
    private inputContainer: HTMLElement
    private textInput: HTMLTextAreaElement
    private sendButton: HTMLButtonElement
    private closeButton: HTMLButtonElement

    private currentVillager: Villager | null = null
    private messages: ChatMessage[] = []
    private onSendMessage: SendMessageCallback | null = null
    private onClose: (() => void) | null = null
    private isLoading = false

    constructor(parentEl: HTMLElement) {
        // Create main container
        this.container = parentEl.createDiv({ cls: 'note-village-chat-panel' })
        this.container.style.display = 'none'

        // Header
        this.header = this.container.createDiv({ cls: 'note-village-chat-header' })
        const titleEl = this.header.createDiv({ cls: 'note-village-chat-title' })
        titleEl.setText('Chat')

        this.closeButton = this.header.createEl('button', { cls: 'note-village-chat-close' })
        setIcon(this.closeButton, 'x')
        this.closeButton.addEventListener('click', () => this.close())

        // Messages area
        this.messagesContainer = this.container.createDiv({ cls: 'note-village-chat-messages' })

        // Input area
        this.inputContainer = this.container.createDiv({ cls: 'note-village-chat-input-container' })

        this.textInput = this.inputContainer.createEl('textarea', {
            cls: 'note-village-chat-input',
            attr: { placeholder: 'Type a message...', rows: '2' }
        })

        this.sendButton = this.inputContainer.createEl('button', {
            cls: 'note-village-chat-send'
        })
        setIcon(this.sendButton, 'send')

        // Event listeners
        this.sendButton.addEventListener('click', () => this.handleSend())
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                this.handleSend()
            }
        })
    }

    /**
     * Open chat panel with a villager
     */
    open(villager: Villager): void {
        this.currentVillager = villager
        this.messages = []
        this.renderMessages()

        // Update header
        const titleEl = this.header.querySelector('.note-village-chat-title')
        if (titleEl) {
            titleEl.setText(`Chat with ${villager.getNoteName()}`)
        }

        this.container.style.display = 'flex'
        this.textInput.focus()
    }

    /**
     * Close chat panel
     */
    close(): void {
        this.container.style.display = 'none'
        this.currentVillager = null
        this.messages = []
        if (this.onClose) {
            this.onClose()
        }
    }

    /**
     * Check if panel is open
     */
    isOpen(): boolean {
        return this.container.style.display !== 'none'
    }

    /**
     * Get current villager
     */
    getCurrentVillager(): Villager | null {
        return this.currentVillager
    }

    /**
     * Set callback for sending messages
     */
    setSendMessageCallback(callback: SendMessageCallback): void {
        this.onSendMessage = callback
    }

    /**
     * Set callback for close
     */
    setOnCloseCallback(callback: () => void): void {
        this.onClose = callback
    }

    /**
     * Add a message to the chat
     */
    addMessage(role: 'user' | 'assistant', content: string): void {
        this.messages.push({
            role,
            content,
            timestamp: new Date()
        })
        this.renderMessages()
        this.scrollToBottom()
    }

    /**
     * Set loading state
     */
    setLoading(loading: boolean): void {
        this.isLoading = loading
        this.sendButton.disabled = loading
        this.textInput.disabled = loading

        if (loading) {
            this.sendButton.addClass('loading')
        } else {
            this.sendButton.removeClass('loading')
        }
    }

    /**
     * Handle send button click
     */
    private async handleSend(): Promise<void> {
        const message = this.textInput.value.trim()
        if (!message || this.isLoading) return

        this.textInput.value = ''
        this.addMessage('user', message)

        if (this.onSendMessage) {
            this.setLoading(true)
            try {
                await this.onSendMessage(message)
            } finally {
                this.setLoading(false)
            }
        }
    }

    /**
     * Render all messages
     */
    private renderMessages(): void {
        this.messagesContainer.empty()

        if (this.messages.length === 0) {
            const emptyEl = this.messagesContainer.createDiv({ cls: 'note-village-chat-empty' })
            emptyEl.setText('Start a conversation...')
            return
        }

        for (const message of this.messages) {
            const messageEl = this.messagesContainer.createDiv({
                cls: `note-village-chat-message note-village-chat-message-${message.role}`
            })

            const contentEl = messageEl.createDiv({ cls: 'note-village-chat-message-content' })
            contentEl.setText(message.content)

            const timeEl = messageEl.createDiv({ cls: 'note-village-chat-message-time' })
            timeEl.setText(this.formatTime(message.timestamp))
        }
    }

    /**
     * Scroll to bottom of messages
     */
    private scrollToBottom(): void {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }

    /**
     * Format timestamp
     */
    private formatTime(date: Date): string {
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    /**
     * Destroy the panel
     */
    destroy(): void {
        this.container.remove()
    }
}
