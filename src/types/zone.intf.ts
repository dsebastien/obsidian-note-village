import type { z } from 'zod'
import type { ZoneSchema } from '#schemas/zone.schema'

export type Zone = z.infer<typeof ZoneSchema>
