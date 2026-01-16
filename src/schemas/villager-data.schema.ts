import { z } from 'zod'
import { Vector2DSchema } from '#schemas/vector2d.schema'
import { VillagerAppearanceSchema } from '#schemas/villager-appearance.schema'

/**
 * Zod schema for villager data
 */
export const VillagerDataSchema = z.object({
    id: z.string(),
    notePath: z.string(),
    noteName: z.string(),
    noteLength: z.number(),
    homePosition: Vector2DSchema,
    zoneId: z.string(),
    appearance: VillagerAppearanceSchema
})
