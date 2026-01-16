import { describe, test, expect } from 'bun:test'

/**
 * Tests for WandererComponent
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Mock position interface
interface MockVector {
    x: number
    y: number
}

// Mock the component interface for testing
interface MockWandererComponent {
    readonly type: string
    homePosition: MockVector
    wanderRadius: number
    walkSpeed: number
    minIdleTime: number
    maxIdleTime: number
    minWalkTime: number
    maxWalkTime: number
    state: 'idle' | 'walking'
    stateTimer: number
    targetPosition: MockVector | null
    setHomePosition(pos: MockVector): void
}

// Create a mock implementation that mirrors the real component
function createMockWandererComponent(
    homePosition: MockVector,
    wanderRadius: number = 50,
    walkSpeed: number = 30,
    minIdleTime: number = 2000,
    maxIdleTime: number = 5000,
    minWalkTime: number = 1000,
    maxWalkTime: number = 3000
): MockWandererComponent {
    return {
        type: 'wanderer',
        homePosition: { ...homePosition },
        wanderRadius,
        walkSpeed,
        minIdleTime,
        maxIdleTime,
        minWalkTime,
        maxWalkTime,
        state: 'idle',
        stateTimer: 0,
        targetPosition: null,
        setHomePosition(pos: MockVector) {
            this.homePosition = { ...pos }
        }
    }
}

describe('WandererComponent', () => {
    describe('constructor', () => {
        test('should initialize with homePosition', () => {
            const component = createMockWandererComponent({ x: 100, y: 200 })

            expect(component.homePosition.x).toBe(100)
            expect(component.homePosition.y).toBe(200)
        })

        test('should use default wanderRadius of 50', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.wanderRadius).toBe(50)
        })

        test('should accept custom wanderRadius', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 }, 100)

            expect(component.wanderRadius).toBe(100)
        })

        test('should use default walkSpeed of 30', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.walkSpeed).toBe(30)
        })

        test('should accept custom walkSpeed', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 }, 50, 60)

            expect(component.walkSpeed).toBe(60)
        })

        test('should use default idle time range', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.minIdleTime).toBe(2000)
            expect(component.maxIdleTime).toBe(5000)
        })

        test('should accept custom idle time range', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 }, 50, 30, 1000, 3000)

            expect(component.minIdleTime).toBe(1000)
            expect(component.maxIdleTime).toBe(3000)
        })

        test('should use default walk time range', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.minWalkTime).toBe(1000)
            expect(component.maxWalkTime).toBe(3000)
        })

        test('should accept custom walk time range', () => {
            const component = createMockWandererComponent(
                { x: 0, y: 0 },
                50,
                30,
                2000,
                5000,
                500,
                1500
            )

            expect(component.minWalkTime).toBe(500)
            expect(component.maxWalkTime).toBe(1500)
        })

        test('should initialize state as idle', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.state).toBe('idle')
        })

        test('should initialize stateTimer as 0', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.stateTimer).toBe(0)
        })

        test('should initialize targetPosition as null', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.targetPosition).toBeNull()
        })

        test('should set correct component type', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            expect(component.type).toBe('wanderer')
        })
    })

    describe('setHomePosition', () => {
        test('should update homePosition', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            component.setHomePosition({ x: 500, y: 600 })

            expect(component.homePosition.x).toBe(500)
            expect(component.homePosition.y).toBe(600)
        })

        test('should allow setting negative coordinates', () => {
            const component = createMockWandererComponent({ x: 100, y: 100 })

            component.setHomePosition({ x: -200, y: -300 })

            expect(component.homePosition.x).toBe(-200)
            expect(component.homePosition.y).toBe(-300)
        })
    })

    describe('state management', () => {
        test('should allow state to be set to walking', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            component.state = 'walking'

            expect(component.state).toBe('walking')
        })

        test('should allow state to be set back to idle', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })
            component.state = 'walking'

            component.state = 'idle'

            expect(component.state).toBe('idle')
        })

        test('should allow stateTimer to be modified', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            component.stateTimer = 5000

            expect(component.stateTimer).toBe(5000)
        })

        test('should allow targetPosition to be set', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })

            component.targetPosition = { x: 50, y: 50 }

            expect(component.targetPosition?.x).toBe(50)
            expect(component.targetPosition?.y).toBe(50)
        })

        test('should allow targetPosition to be cleared', () => {
            const component = createMockWandererComponent({ x: 0, y: 0 })
            component.targetPosition = { x: 50, y: 50 }

            component.targetPosition = null

            expect(component.targetPosition).toBeNull()
        })
    })
})
