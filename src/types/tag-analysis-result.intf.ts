import type { z } from 'zod'
import type { TagAnalysisResultSchema } from '#schemas/tag-analysis-result.schema'

export type TagAnalysisResult = z.infer<typeof TagAnalysisResultSchema>
