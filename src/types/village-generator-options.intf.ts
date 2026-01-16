import type { z } from 'zod'
import type { VillageGeneratorOptionsSchema } from '#schemas/village-generator-options.schema'

export type VillageGeneratorOptions = z.infer<typeof VillageGeneratorOptionsSchema>
