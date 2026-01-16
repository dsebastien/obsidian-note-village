import type { z } from 'zod'
import type { TagCountSchema } from '#schemas/tag-count.schema'

export type TagCount = z.infer<typeof TagCountSchema>
