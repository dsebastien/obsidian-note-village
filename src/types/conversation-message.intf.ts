import type { z } from 'zod'
import type { ConversationMessageSchema } from '#schemas/conversation-message.schema'

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>
