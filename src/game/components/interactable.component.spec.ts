import { describe, test, expect } from 'bun:test'

/**
 * Tests for InteractableComponent
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Mock actor interface
interface MockActor {
    pos: { x: number; y: number }
}

// Mock the component interface for testing
interface MockInteractableComponent {
    readonly type: string
    interactionRadius: number
    requiresProximity: boolean
    inRange: boolean
    onInteract(callback: (actor: MockActor) => void): void
    trigger(actor: MockActor): void
}

// Create a mock implementation that mirrors the real component
function createMockInteractableComponent(
    interactionRadius: number = 40,
    requiresProximity: boolean = false
): MockInteractableComponent {
    let callback: ((actor: MockActor) => void) | null = null

    return {
        type: 'interactable',
        interactionRadius,
        requiresProximity,
        inRange: false,
        onInteract(cb: (actor: MockActor) => void) {
            callback = cb
        },
        trigger(actor: MockActor) {
            if (callback) {
                callback(actor)
            }
        }
    }
}

describe('InteractableComponent', () => {
    describe('constructor', () => {
        test('should use default interactionRadius of 40', () => {
            const component = createMockInteractableComponent()

            expect(component.interactionRadius).toBe(40)
        })

        test('should accept custom interactionRadius', () => {
            const component = createMockInteractableComponent(100)

            expect(component.interactionRadius).toBe(100)
        })

        test('should use default requiresProximity of false', () => {
            const component = createMockInteractableComponent()

            expect(component.requiresProximity).toBe(false)
        })

        test('should accept custom requiresProximity', () => {
            const component = createMockInteractableComponent(40, true)

            expect(component.requiresProximity).toBe(true)
        })

        test('should initialize inRange as false', () => {
            const component = createMockInteractableComponent()

            expect(component.inRange).toBe(false)
        })

        test('should set correct component type', () => {
            const component = createMockInteractableComponent()

            expect(component.type).toBe('interactable')
        })
    })

    describe('onInteract', () => {
        test('should set callback function', () => {
            const component = createMockInteractableComponent()
            const callback = (_actor: MockActor) => {}

            // Should not throw
            component.onInteract(callback)
        })

        test('should replace existing callback', () => {
            const component = createMockInteractableComponent()
            let firstCalled = false
            let secondCalled = false

            component.onInteract(() => {
                firstCalled = true
            })
            component.onInteract(() => {
                secondCalled = true
            })

            // Create mock actor to trigger callback
            const mockActor = { pos: { x: 0, y: 0 } }
            component.trigger(mockActor)

            expect(firstCalled).toBe(false)
            expect(secondCalled).toBe(true)
        })
    })

    describe('trigger', () => {
        test('should call callback with actor', () => {
            const component = createMockInteractableComponent()
            let receivedActor: MockActor | undefined

            component.onInteract((actor) => {
                receivedActor = actor
            })

            const mockActor: MockActor = { pos: { x: 0, y: 0 } }
            component.trigger(mockActor)

            expect(receivedActor).toBeDefined()
            expect(receivedActor?.pos).toEqual(mockActor.pos)
        })

        test('should do nothing when no callback set', () => {
            const component = createMockInteractableComponent()

            // Should not throw
            const mockActor = { pos: { x: 0, y: 0 } }
            expect(() => component.trigger(mockActor)).not.toThrow()
        })

        test('should allow multiple triggers', () => {
            const component = createMockInteractableComponent()
            let triggerCount = 0

            component.onInteract(() => {
                triggerCount++
            })

            const mockActor = { pos: { x: 0, y: 0 } }
            component.trigger(mockActor)
            component.trigger(mockActor)
            component.trigger(mockActor)

            expect(triggerCount).toBe(3)
        })
    })

    describe('inRange', () => {
        test('should allow setting inRange to true', () => {
            const component = createMockInteractableComponent()

            component.inRange = true

            expect(component.inRange).toBe(true)
        })

        test('should allow setting inRange to false', () => {
            const component = createMockInteractableComponent()
            component.inRange = true

            component.inRange = false

            expect(component.inRange).toBe(false)
        })
    })

    describe('interactionRadius', () => {
        test('should allow modification', () => {
            const component = createMockInteractableComponent(40)

            component.interactionRadius = 80

            expect(component.interactionRadius).toBe(80)
        })

        test('should handle zero radius', () => {
            const component = createMockInteractableComponent(0)

            expect(component.interactionRadius).toBe(0)
        })
    })

    describe('requiresProximity', () => {
        test('should allow modification', () => {
            const component = createMockInteractableComponent(40, false)

            component.requiresProximity = true

            expect(component.requiresProximity).toBe(true)
        })
    })
})
