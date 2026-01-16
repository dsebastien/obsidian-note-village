import { z } from 'zod'
import { ConversationMessageSchema } from '#schemas/conversation-message.schema'

/**
 * Conversation state
 */
export const ConversationStateSchema = z.object({
    villagerName: z.string(),
    notePath: z.string(),
    noteContent: z.string(),
    messages: z.array(ConversationMessageSchema),
    startedAt: z.string(),
    lastMessageAt: z.string().optional()
})
