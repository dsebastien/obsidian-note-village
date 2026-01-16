import { describe, test, expect, mock } from 'bun:test'
import type { Vector2D } from '#types/vector2d.intf'

// Mock excalibur module
const mockExVector = class MockVector {
    constructor(
        public x: number,
        public y: number
    ) {}
}

mock.module('excalibur', () => ({
    Vector: mockExVector
}))

// Import after mocking
const { toExVector, fromExVector } = await import('./vector-utils')
const ex = await import('excalibur')

describe('vector-utils', () => {
    describe('toExVector', () => {
        test('should convert Vector2D to Excalibur Vector', () => {
            const input: Vector2D = { x: 10, y: 20 }
            const result = toExVector(input)

            expect(result).toBeInstanceOf(ex.Vector)
            expect(result.x).toBe(10)
            expect(result.y).toBe(20)
        })

        test('should handle zero coordinates', () => {
            const input: Vector2D = { x: 0, y: 0 }
            const result = toExVector(input)

            expect(result.x).toBe(0)
            expect(result.y).toBe(0)
        })

        test('should handle negative coordinates', () => {
            const input: Vector2D = { x: -100, y: -50 }
            const result = toExVector(input)

            expect(result.x).toBe(-100)
            expect(result.y).toBe(-50)
        })

        test('should handle float coordinates', () => {
            const input: Vector2D = { x: 10.5, y: 20.75 }
            const result = toExVector(input)

            expect(result.x).toBe(10.5)
            expect(result.y).toBe(20.75)
        })

        test('should handle large coordinates', () => {
            const input: Vector2D = { x: 1000000, y: 2000000 }
            const result = toExVector(input)

            expect(result.x).toBe(1000000)
            expect(result.y).toBe(2000000)
        })
    })

    describe('fromExVector', () => {
        test('should convert Excalibur Vector to Vector2D', () => {
            const input = new ex.Vector(30, 40)
            const result = fromExVector(input)

            expect(result).toEqual({ x: 30, y: 40 })
        })

        test('should handle zero coordinates', () => {
            const input = new ex.Vector(0, 0)
            const result = fromExVector(input)

            expect(result).toEqual({ x: 0, y: 0 })
        })

        test('should handle negative coordinates', () => {
            const input = new ex.Vector(-25, -75)
            const result = fromExVector(input)

            expect(result).toEqual({ x: -25, y: -75 })
        })

        test('should handle float coordinates', () => {
            const input = new ex.Vector(1.25, 2.5)
            const result = fromExVector(input)

            expect(result).toEqual({ x: 1.25, y: 2.5 })
        })

        test('should return plain object (not instance)', () => {
            const input = new ex.Vector(10, 20)
            const result = fromExVector(input)

            // Should be plain object, not Vector instance
            expect(result).not.toBeInstanceOf(ex.Vector)
            expect(typeof result).toBe('object')
            expect(Object.keys(result)).toEqual(['x', 'y'])
        })
    })

    describe('round-trip conversion', () => {
        test('should preserve values through toExVector -> fromExVector', () => {
            const original: Vector2D = { x: 123, y: 456 }

            const exVector = toExVector(original)
            const result = fromExVector(exVector)

            expect(result).toEqual(original)
        })

        test('should preserve float precision through round-trip', () => {
            const original: Vector2D = { x: 0.123456789, y: 0.987654321 }

            const exVector = toExVector(original)
            const result = fromExVector(exVector)

            expect(result.x).toBe(original.x)
            expect(result.y).toBe(original.y)
        })
    })
})
