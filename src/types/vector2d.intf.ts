import type { z } from 'zod'
import type { Vector2DSchema } from '#schemas/vector2d.schema'

export type Vector2D = z.infer<typeof Vector2DSchema>
