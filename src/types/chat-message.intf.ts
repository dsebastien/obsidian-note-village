/**
 * Message in UI chat
 */
export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}
