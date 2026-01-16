import type { TFile } from 'obsidian'
import { z } from 'zod'

/**
 * Zod schema for scanned note data
 */
export const ScannedNoteSchema = z.object({
    file: z.custom<TFile>(),
    path: z.string(),
    name: z.string(),
    tags: z.array(z.string()),
    primaryTag: z.string(),
    contentLength: z.number().int().nonnegative(),
    createdTime: z.number(),
    modifiedTime: z.number()
})
