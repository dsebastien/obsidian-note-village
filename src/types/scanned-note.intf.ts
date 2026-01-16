import type { z } from 'zod'
import type { ScannedNoteSchema } from '#schemas/scanned-note.schema'

export type ScannedNote = z.infer<typeof ScannedNoteSchema>
