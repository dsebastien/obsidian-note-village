import { z } from 'zod'
import { Vector2DSchema } from '#schemas/vector2d.schema'

/**
 * Zod schema for structure data
 */
export const StructureDataSchema = z.object({
    id: z.string(),
    type: z.enum([
        'house',
        'sign',
        'tree',
        'fence',
        'fountain',
        'bench',
        'forest',
        // Decorations (Phase 1)
        'flowerBed',
        'bush',
        'rock',
        'tallGrass',
        'barrel',
        'crate'
    ]),
    position: Vector2DSchema,
    zoneId: z.string().optional(),
    label: z.string().optional(),
    /** Whether this structure blocks movement (used for forest borders) */
    isBlocking: z.boolean().optional(),
    /** Variant index for visual variety */
    variant: z.number().optional()
})
