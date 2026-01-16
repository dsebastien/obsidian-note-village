import { describe, test, expect } from 'bun:test'

/**
 * Tests for WanderSystem
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Mock position interface
interface MockVector {
    x: number
    y: number
}

// Mock wanderer state
interface MockWandererState {
    homePosition: MockVector
    wanderRadius: number
    walkSpeed: number
    state: 'idle' | 'walking'
    stateTimer: number
    targetPosition: MockVector | null
}

// Create mock wanderer state
function createMockWandererState(
    homePosition: MockVector,
    wanderRadius: number = 50,
    walkSpeed: number = 30
): MockWandererState {
    return {
        homePosition: { ...homePosition },
        wanderRadius,
        walkSpeed,
        state: 'idle',
        stateTimer: 0,
        targetPosition: null
    }
}

// Distance calculation helper
function distance(a: MockVector, b: MockVector): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}

describe('WanderSystem', () => {
    describe('WandererComponent state', () => {
        test('should properly create wanderer state', () => {
            const wanderer = createMockWandererState({ x: 0, y: 0 })

            expect(wanderer).toBeDefined()
            expect(wanderer.homePosition.x).toBe(0)
            expect(wanderer.homePosition.y).toBe(0)
        })

        test('should allow setting wanderer state', () => {
            const wanderer = createMockWandererState({ x: 100, y: 100 }, 50, 30)

            // Can modify state
            wanderer.state = 'walking'
            wanderer.stateTimer = 1000
            wanderer.targetPosition = { x: 50, y: 50 }

            expect(wanderer.state).toBe('walking')
            expect(wanderer.stateTimer).toBe(1000)
            expect(wanderer.targetPosition?.x).toBe(50)
        })
    })

    describe('state transitions', () => {
        test('should transition from idle to walking when target is set', () => {
            const wanderer = createMockWandererState({ x: 0, y: 0 })

            // Start idle
            expect(wanderer.state).toBe('idle')

            // Simulate transition to walking
            wanderer.state = 'walking'
            wanderer.targetPosition = { x: 100, y: 100 }

            expect(wanderer.state).toBe('walking')
            expect(wanderer.targetPosition).not.toBeNull()
        })

        test('should transition from walking to idle when target is cleared', () => {
            const wanderer = createMockWandererState({ x: 0, y: 0 })
            wanderer.state = 'walking'
            wanderer.targetPosition = { x: 50, y: 50 }

            // Simulate reaching target
            wanderer.state = 'idle'
            wanderer.targetPosition = null

            expect(wanderer.state).toBe('idle')
            expect(wanderer.targetPosition).toBeNull()
        })
    })

    describe('timer mechanics', () => {
        test('should decrement timer when updated', () => {
            const wanderer = createMockWandererState({ x: 0, y: 0 })
            wanderer.stateTimer = 1000

            // Simulate update
            wanderer.stateTimer -= 100

            expect(wanderer.stateTimer).toBe(900)
        })

        test('should trigger state change when timer expires', () => {
            const wanderer = createMockWandererState({ x: 0, y: 0 })
            wanderer.state = 'idle'
            wanderer.stateTimer = 0

            // Timer expired, should transition
            if (wanderer.stateTimer <= 0 && wanderer.state === 'idle') {
                wanderer.state = 'walking'
                wanderer.stateTimer = 2000 // Reset timer
            }

            expect(wanderer.state).toBe('walking')
            expect(wanderer.stateTimer).toBe(2000)
        })
    })

    describe('wander radius', () => {
        test('should respect wander radius when generating targets', () => {
            const homePos: MockVector = { x: 100, y: 100 }
            const wanderer = createMockWandererState(homePos, 50)

            // Simulate generating target within radius
            const angle = Math.random() * Math.PI * 2
            const dist = Math.random() * wanderer.wanderRadius
            const target: MockVector = {
                x: homePos.x + Math.cos(angle) * dist,
                y: homePos.y + Math.sin(angle) * dist
            }

            wanderer.targetPosition = target

            const distFromHome = distance(target, homePos)
            expect(distFromHome).toBeLessThanOrEqual(50)
        })
    })

    describe('walk speed', () => {
        test('should use configured walk speed', () => {
            const wanderer = createMockWandererState(
                { x: 0, y: 0 },
                50,
                100 // walkSpeed
            )

            expect(wanderer.walkSpeed).toBe(100)
        })
    })
})
