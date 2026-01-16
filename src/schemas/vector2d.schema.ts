import { z } from 'zod'

/**
 * Zod schema for 2D vector position
 */
export const Vector2DSchema = z.object({
    x: z.number(),
    y: z.number()
})
