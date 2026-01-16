import type { z } from 'zod'
import type { VillagerAppearanceSchema } from '#schemas/villager-appearance.schema'

export type VillagerAppearance = z.infer<typeof VillagerAppearanceSchema>
