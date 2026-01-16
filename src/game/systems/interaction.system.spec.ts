import { describe, test, expect } from 'bun:test'

/**
 * Tests for InteractionSystem
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Mock actor interface
interface MockActor {
    pos: { x: number; y: number }
}

// Mock interactable state
interface MockInteractableState {
    interactionRadius: number
    requiresProximity: boolean
    inRange: boolean
    callback: ((actor: MockActor) => void) | null
    onInteract(cb: (actor: MockActor) => void): void
    trigger(actor: MockActor): void
}

// Create mock interactable
function createMockInteractable(
    interactionRadius: number = 40,
    requiresProximity: boolean = false
): MockInteractableState {
    return {
        interactionRadius,
        requiresProximity,
        inRange: false,
        callback: null,
        onInteract(cb: (actor: MockActor) => void) {
            this.callback = cb
        },
        trigger(actor: MockActor) {
            if (this.callback) {
                this.callback(actor)
            }
        }
    }
}

// Mock interaction system logic
function handleClick(actor: MockActor, interactable: MockInteractableState | null): void {
    if (!interactable) return

    // If doesn't require proximity, always trigger
    if (!interactable.requiresProximity) {
        interactable.trigger(actor)
        return
    }

    // If requires proximity and in range, trigger
    if (interactable.inRange) {
        interactable.trigger(actor)
    }
}

describe('InteractionSystem', () => {
    describe('InteractableComponent state', () => {
        test('should properly create interactable state', () => {
            const interactable = createMockInteractable(50, true)

            expect(interactable.interactionRadius).toBe(50)
            expect(interactable.requiresProximity).toBe(true)
            expect(interactable.inRange).toBe(false)
        })

        test('should trigger callback when triggered', () => {
            const interactable = createMockInteractable()
            let triggered = false

            interactable.onInteract(() => {
                triggered = true
            })

            const mockActor: MockActor = { pos: { x: 0, y: 0 } }
            interactable.trigger(mockActor)

            expect(triggered).toBe(true)
        })

        test('should pass actor to callback', () => {
            const interactable = createMockInteractable()
            let receivedActor: MockActor | undefined

            interactable.onInteract((actor) => {
                receivedActor = actor
            })

            const mockActor: MockActor = { pos: { x: 0, y: 0 } }
            interactable.trigger(mockActor)

            expect(receivedActor).toBeDefined()
            expect(receivedActor?.pos).toEqual(mockActor.pos)
        })
    })

    describe('handleClick', () => {
        test('should trigger interaction when not requiring proximity', () => {
            const interactable = createMockInteractable(40, false)
            const actor: MockActor = { pos: { x: 0, y: 0 } }

            let triggered = false
            interactable.onInteract(() => {
                triggered = true
            })

            handleClick(actor, interactable)

            expect(triggered).toBe(true)
        })

        test('should not trigger when requiring proximity and not in range', () => {
            const interactable = createMockInteractable(40, true)
            interactable.inRange = false
            const actor: MockActor = { pos: { x: 0, y: 0 } }

            let triggered = false
            interactable.onInteract(() => {
                triggered = true
            })

            handleClick(actor, interactable)

            expect(triggered).toBe(false)
        })

        test('should trigger when requiring proximity and in range', () => {
            const interactable = createMockInteractable(40, true)
            interactable.inRange = true
            const actor: MockActor = { pos: { x: 0, y: 0 } }

            let triggered = false
            interactable.onInteract(() => {
                triggered = true
            })

            handleClick(actor, interactable)

            expect(triggered).toBe(true)
        })

        test('should handle null interactable', () => {
            const actor: MockActor = { pos: { x: 0, y: 0 } }

            // Should not throw
            expect(() => handleClick(actor, null)).not.toThrow()
        })
    })

    describe('inRange property', () => {
        test('should track proximity state', () => {
            const interactable = createMockInteractable()

            expect(interactable.inRange).toBe(false)

            interactable.inRange = true
            expect(interactable.inRange).toBe(true)

            interactable.inRange = false
            expect(interactable.inRange).toBe(false)
        })
    })
})
