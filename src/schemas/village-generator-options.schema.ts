import { z } from 'zod'

/**
 * Zod schema for generator options
 */
export const VillageGeneratorOptionsSchema = z.object({
    seed: z.string(),
    topTagCount: z.number().int().min(3).max(20).default(10),
    maxVillagers: z.number().int().min(10).max(500).default(100),
    plazaRadius: z.number().default(100),
    zoneInnerRadius: z.number().default(150),
    zoneWidth: z.number().default(300),
    housesPerVillager: z.number().default(0.3),
    decorationDensity: z.number().default(0.1)
})
