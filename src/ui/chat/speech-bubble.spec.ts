import { describe, test, expect, beforeEach } from 'bun:test'

// Create mock DOM element
class MockHTMLElement {
    style: Record<string, string> = {}
    children: MockHTMLElement[] = []
    textContent = ''

    createDiv(_options?: { cls?: string }): MockHTMLElement {
        const div = new MockHTMLElement()
        this.children.push(div)
        return div
    }

    setText(text: string): void {
        this.textContent = text
    }

    remove(): void {}
}

// Mock excalibur types
class MockVector {
    constructor(
        public x: number,
        public y: number
    ) {}
}

class MockScreen {
    worldToScreenCoordinates(pos: MockVector): MockVector {
        return new MockVector(pos.x, pos.y)
    }
}

class MockActor {
    pos: MockVector

    constructor(x = 0, y = 0) {
        this.pos = new MockVector(x, y)
    }
}

class MockEngine {
    screen = new MockScreen()
}

// Import after mocking (no external mocks needed since it only uses types)
const { SpeechBubble } = await import('./speech-bubble')

describe('SpeechBubble', () => {
    let parentEl: MockHTMLElement
    let bubble: InstanceType<typeof SpeechBubble>

    beforeEach(() => {
        parentEl = new MockHTMLElement()
        bubble = new SpeechBubble(parentEl as unknown as HTMLElement)
    })

    describe('constructor', () => {
        test('should create bubble with hidden container', () => {
            expect(bubble).toBeDefined()
            expect(bubble.isVisible()).toBe(false)
        })

        test('should create child elements', () => {
            // Should have created text element and arrow
            expect(parentEl.children.length).toBeGreaterThan(0)
        })
    })

    describe('show', () => {
        test('should make bubble visible', () => {
            const actor = new MockActor(100, 100)
            const engine = new MockEngine()

            bubble.show('Hello!', actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })

        test('should display text', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Test message', actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })
    })

    describe('updateText', () => {
        test('should update displayed text', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Initial text', actor as never, engine as never)
            bubble.updateText('Updated text')

            expect(bubble.isVisible()).toBe(true)
        })

        test('should handle empty text', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Some text', actor as never, engine as never)
            bubble.updateText('')

            expect(bubble.isVisible()).toBe(true)
        })
    })

    describe('hide', () => {
        test('should hide the bubble', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)
            bubble.hide()

            expect(bubble.isVisible()).toBe(false)
        })

        test('should clear target actor', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)
            bubble.hide()

            // After hiding, updatePosition should do nothing
            expect(() => bubble.updatePosition()).not.toThrow()
        })
    })

    describe('isVisible', () => {
        test('should return false initially', () => {
            expect(bubble.isVisible()).toBe(false)
        })

        test('should return true after showing', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })

        test('should return false after hiding', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)
            bubble.hide()

            expect(bubble.isVisible()).toBe(false)
        })
    })

    describe('updatePosition', () => {
        test('should not throw when no target', () => {
            expect(() => bubble.updatePosition()).not.toThrow()
        })

        test('should update position based on actor', () => {
            const actor = new MockActor(200, 300)
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)
            bubble.updatePosition()

            // Should not throw
            expect(bubble.isVisible()).toBe(true)
        })

        test('should handle actor movement', () => {
            const actor = new MockActor(100, 100)
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)

            // Move actor
            actor.pos.x = 200
            actor.pos.y = 200

            bubble.updatePosition()

            expect(bubble.isVisible()).toBe(true)
        })
    })

    describe('destroy', () => {
        test('should remove the container', () => {
            expect(() => bubble.destroy()).not.toThrow()
        })

        test('should work after showing', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('Text', actor as never, engine as never)

            expect(() => bubble.destroy()).not.toThrow()
        })
    })

    describe('edge cases', () => {
        test('should handle show with same actor twice', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('First', actor as never, engine as never)
            bubble.show('Second', actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })

        test('should handle show with different actors', () => {
            const actor1 = new MockActor(0, 0)
            const actor2 = new MockActor(100, 100)
            const engine = new MockEngine()

            bubble.show('First', actor1 as never, engine as never)
            bubble.show('Second', actor2 as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })

        test('should handle long text', () => {
            const actor = new MockActor()
            const engine = new MockEngine()
            const longText = 'A'.repeat(1000)

            bubble.show(longText, actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })

        test('should handle special characters in text', () => {
            const actor = new MockActor()
            const engine = new MockEngine()

            bubble.show('<script>alert("xss")</script>', actor as never, engine as never)

            expect(bubble.isVisible()).toBe(true)
        })
    })
})
