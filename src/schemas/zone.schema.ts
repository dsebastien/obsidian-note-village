import { z } from 'zod'

/**
 * Zod schema for zone definition - rectangular JRPG-style zones
 */
export const ZoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    tag: z.string(),
    color: z.string(),
    // Rectangular bounds (JRPG grid layout)
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    noteCount: z.number()
})
