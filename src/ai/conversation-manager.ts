import Anthropic from '@anthropic-ai/sdk'
import { generateVillagerPrompt } from './system-prompts'
import { log } from '../utils/log'
import type { AIModel } from '#types/ai-model.intf'
import type { ConversationMessage } from '#types/conversation-message.intf'
import type { ConversationState } from '#types/conversation-state.intf'

/**
 * Manages AI conversations with villagers
 */
export class ConversationManager {
    private client: Anthropic | null = null
    /** The key `client` was built with, so a changed key rebuilds it. */
    private clientApiKey = ''
    private currentConversation: ConversationState | null = null
    private model: AIModel

    /**
     * @param getApiKey Reads the API key at use time (from SecretStorage), so
     * a key set, changed or removed in settings applies to the next message.
     */
    constructor(
        private readonly getApiKey: () => string,
        model: AIModel
    ) {
        this.model = model
    }

    /**
     * Check if an API key is available
     */
    isConfigured(): boolean {
        return this.getApiKey() !== ''
    }

    /**
     * The client for the current API key, rebuilt when the key changes and
     * null when there is none.
     */
    private resolveClient(): Anthropic | null {
        const apiKey = this.getApiKey()
        if (apiKey === '') {
            this.client = null
            this.clientApiKey = ''
            return null
        }
        if (!this.client || this.clientApiKey !== apiKey) {
            this.client = new Anthropic({
                apiKey,
                dangerouslyAllowBrowser: true // Required for browser environment
            })
            this.clientApiKey = apiKey
        }
        return this.client
    }

    /**
     * Start a new conversation with a villager
     */
    startConversation(villagerName: string, notePath: string, noteContent: string): void {
        this.currentConversation = {
            villagerName,
            notePath,
            noteContent,
            messages: [],
            startedAt: new Date().toISOString()
        }
        log('Started conversation', 'debug', { villagerName })
    }

    /**
     * End the current conversation
     */
    endConversation(): ConversationState | null {
        const conversation = this.currentConversation
        this.currentConversation = null
        return conversation
    }

    /**
     * Get current conversation state
     */
    getCurrentConversation(): ConversationState | null {
        return this.currentConversation
    }

    /**
     * Send a message and get a response
     */
    async sendMessage(userMessage: string): Promise<string> {
        const client = this.resolveClient()
        if (!client) {
            return 'AI is not configured. Set your Anthropic API key in the plugin settings (secrets are stored per device).'
        }

        if (!this.currentConversation) {
            return 'No active conversation.'
        }

        // Add user message
        this.currentConversation.messages.push({
            role: 'user',
            content: userMessage
        })
        this.currentConversation.lastMessageAt = new Date().toISOString()

        try {
            // Build messages for API
            const systemPrompt = generateVillagerPrompt(
                this.currentConversation.villagerName,
                this.currentConversation.noteContent
            )

            const messages = this.currentConversation.messages.map((m) => ({
                role: m.role,
                content: m.content
            }))

            log('Sending to Claude', 'debug', { messageCount: messages.length })

            const response = await client.messages.create({
                model: this.model,
                max_tokens: 300,
                system: systemPrompt,
                messages
            })

            // Extract response text
            const assistantMessage = response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map((block) => block.text)
                .join('')

            // Add assistant message to history
            this.currentConversation.messages.push({
                role: 'assistant',
                content: assistantMessage
            })

            log('Received response', 'debug', { length: assistantMessage.length })

            return assistantMessage
        } catch (error) {
            log('API error', 'error', error)

            if (error instanceof Anthropic.APIError) {
                if (error.status === 401) {
                    return 'Invalid API key. Please check your Anthropic API key in settings.'
                }
                if (error.status === 429) {
                    return 'Rate limited. Please wait a moment and try again.'
                }
                return `API error: ${error.message}`
            }

            return 'An error occurred while communicating with the AI.'
        }
    }

    /**
     * Get conversation history for display
     */
    getMessages(): ConversationMessage[] {
        return this.currentConversation?.messages ?? []
    }

    /**
     * Update the model
     */
    setModel(model: AIModel): void {
        this.model = model
    }
}
