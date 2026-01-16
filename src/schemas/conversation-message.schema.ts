import { z } from 'zod'

/**
 * Message in a conversation
 */
export const ConversationMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
})
