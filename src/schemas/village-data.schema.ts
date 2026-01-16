import { z } from 'zod'
import { Vector2DSchema } from '#schemas/vector2d.schema'
import { ZoneSchema } from '#schemas/zone.schema'
import { VillagerDataSchema } from '#schemas/villager-data.schema'
import { StructureDataSchema } from '#schemas/structure-data.schema'

/**
 * Zod schema for village data
 */
export const VillageDataSchema = z.object({
    seed: z.string(),
    zones: z.array(ZoneSchema),
    villagers: z.array(VillagerDataSchema),
    structures: z.array(StructureDataSchema),
    spawnPoint: Vector2DSchema,
    worldSize: z.object({
        width: z.number(),
        height: z.number()
    })
})
