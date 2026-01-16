import type { z } from 'zod'
import type { VillagerDataSchema } from '#schemas/villager-data.schema'

export type VillagerData = z.infer<typeof VillagerDataSchema>
