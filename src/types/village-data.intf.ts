import type { z } from 'zod'
import type { VillageDataSchema } from '#schemas/village-data.schema'

export type VillageData = z.infer<typeof VillageDataSchema>
