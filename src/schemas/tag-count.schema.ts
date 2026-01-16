import { z } from 'zod'

/**
 * Zod schema for tag count
 */
export const TagCountSchema = z.object({
    tag: z.string(),
    count: z.number().int().nonnegative()
})
