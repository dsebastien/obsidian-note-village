import { z } from 'zod'

/**
 * Zod schema for villager appearance
 */
export const VillagerAppearanceSchema = z.object({
    spriteIndex: z.number(),
    colorTint: z.string().optional(),
    scale: z.number().default(1)
})
