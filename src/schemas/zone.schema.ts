import { z } from 'zod'

/**
 * Zod schema for zone definition
 */
export const ZoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    tag: z.string(),
    color: z.string(),
    startAngle: z.number(),
    endAngle: z.number(),
    innerRadius: z.number(),
    outerRadius: z.number(),
    noteCount: z.number()
})
