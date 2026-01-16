import type { z } from 'zod'
import type { ConversationStateSchema } from '#schemas/conversation-state.schema'

export type ConversationState = z.infer<typeof ConversationStateSchema>
