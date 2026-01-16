import { z } from 'zod'
import { RenderQuality } from '#types/render-quality.intf'

/**
 * Zod schema for render quality
 */
export const RenderQualitySchema = z.nativeEnum(RenderQuality)
