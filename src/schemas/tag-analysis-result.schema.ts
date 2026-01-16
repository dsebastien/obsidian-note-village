import { z } from 'zod'
import { TagCountSchema } from '#schemas/tag-count.schema'

/**
 * Zod schema for tag analysis result
 */
export const TagAnalysisResultSchema = z.object({
    tags: z.array(TagCountSchema),
    totalNotes: z.number().int().nonnegative(),
    totalTags: z.number().int().nonnegative()
})
