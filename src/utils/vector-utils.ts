import * as ex from 'excalibur'
import type { Vector2D } from '#types/vector2d.intf'

/**
 * Convert Vector2D to Excalibur Vector
 */
export function toExVector(v: Vector2D): ex.Vector {
    return new ex.Vector(v.x, v.y)
}

/**
 * Convert Excalibur Vector to Vector2D
 */
export function fromExVector(v: ex.Vector): Vector2D {
    return { x: v.x, y: v.y }
}
