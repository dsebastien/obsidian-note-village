import { z } from 'zod'
import { AIModel } from '#types/ai-model.intf'

/**
 * Zod schema for AI model
 */
export const AIModelSchema = z.nativeEnum(AIModel)
