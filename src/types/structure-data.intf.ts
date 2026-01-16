import type { z } from 'zod'
import type { StructureDataSchema } from '#schemas/structure-data.schema'

export type StructureData = z.infer<typeof StructureDataSchema>
