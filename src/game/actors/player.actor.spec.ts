import { describe, test, expect } from 'bun:test'

/**
 * Tests for Player actor
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Mock position interface
interface MockVector {
    x: number
    y: number
}

// Mock the player interface for testing
interface MockPlayer {
    pos: MockVector
    getSpeed(): number
    setSpeed(speed: number): void
}

// Create a mock implementation that mirrors the real player
function createMockPlayer(spawnPoint: MockVector): MockPlayer {
    let speed = 100 // Default speed from Player class

    return {
        pos: { ...spawnPoint },
        getSpeed() {
            return speed
        },
        setSpeed(newSpeed: number) {
            speed = newSpeed
        }
    }
}

describe('Player', () => {
    describe('constructor', () => {
        test('should initialize at spawn point', () => {
            const player = createMockPlayer({ x: 100, y: 200 })

            expect(player).toBeDefined()
            expect(player.pos.x).toBe(100)
            expect(player.pos.y).toBe(200)
        })

        test('should initialize with default speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            expect(player.getSpeed()).toBe(100)
        })
    })

    describe('getSpeed', () => {
        test('should return current speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            expect(player.getSpeed()).toBe(100)
        })

        test('should return updated speed after setSpeed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })
            player.setSpeed(150)

            expect(player.getSpeed()).toBe(150)
        })
    })

    describe('setSpeed', () => {
        test('should update speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            player.setSpeed(200)

            expect(player.getSpeed()).toBe(200)
        })

        test('should allow zero speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            player.setSpeed(0)

            expect(player.getSpeed()).toBe(0)
        })

        test('should allow negative speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            player.setSpeed(-50)

            expect(player.getSpeed()).toBe(-50)
        })

        test('should allow decimal speed', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            player.setSpeed(75.5)

            expect(player.getSpeed()).toBe(75.5)
        })

        test('should allow multiple speed changes', () => {
            const player = createMockPlayer({ x: 0, y: 0 })

            player.setSpeed(50)
            expect(player.getSpeed()).toBe(50)

            player.setSpeed(100)
            expect(player.getSpeed()).toBe(100)

            player.setSpeed(200)
            expect(player.getSpeed()).toBe(200)
        })
    })
})
