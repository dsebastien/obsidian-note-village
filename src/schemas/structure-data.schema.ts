import { z } from 'zod'
import { Vector2DSchema } from '#schemas/vector2d.schema'

/**
 * Zod schema for structure data
 */
export const StructureDataSchema = z.object({
    id: z.string(),
    type: z.enum(['house', 'sign', 'tree', 'fence', 'fountain', 'bench']),
    position: Vector2DSchema,
    zoneId: z.string().optional(),
    label: z.string().optional()
})
