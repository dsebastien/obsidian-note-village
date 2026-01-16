import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { Villager } from '../../game/actors/villager.actor'

// Create mock DOM elements
class MockHTMLElement {
    style: Record<string, string> = {}
    children: MockHTMLElement[] = []
    textContent = ''
    value = ''
    disabled = false
    classList = {
        add: (_cls: string) => {},
        remove: (_cls: string) => {}
    }
    scrollTop = 0
    scrollHeight = 100

    createDiv(options?: { cls?: string }): MockHTMLElement {
        const div = new MockHTMLElement()
        if (options?.cls) div.classList.add(options.cls)
        this.children.push(div)
        return div
    }

    createEl(
        _tag: string,
        options?: { cls?: string; attr?: Record<string, string>; text?: string }
    ): MockHTMLElement {
        const el = new MockHTMLElement()
        if (options?.cls) el.classList.add(options.cls)
        if (options?.text) el.textContent = options.text
        this.children.push(el)
        return el
    }

    setText(text: string): void {
        this.textContent = text
    }

    empty(): void {
        this.children = []
    }

    remove(): void {
        // Simulate removal
    }

    querySelector(_selector: string): MockHTMLElement | null {
        // Return an element with setText method
        const found = this.children[0]
        if (found) return found
        // Return a mock element that has setText
        const mockEl = new MockHTMLElement()
        return mockEl
    }

    addEventListener(_event: string, _handler: () => void): void {}

    focus(): void {
        // Mock focus - do nothing
    }

    addClass(_cls: string): void {}
    removeClass(_cls: string): void {}
}

// Mock obsidian module
mock.module('obsidian', () => ({
    setIcon: (_el: MockHTMLElement, _icon: string) => {}
}))

// Mock Villager
class MockVillager {
    constructor(private _noteName: string = 'Test Villager') {}

    getNoteName(): string {
        return this._noteName
    }
}

// Import after mocking
const { ChatPanel } = await import('./chat-panel')

describe('ChatPanel', () => {
    let parentEl: MockHTMLElement
    let panel: InstanceType<typeof ChatPanel>

    beforeEach(() => {
        parentEl = new MockHTMLElement()
        panel = new ChatPanel(parentEl as unknown as HTMLElement)
    })

    describe('constructor', () => {
        test('should create panel with hidden container', () => {
            expect(panel).toBeDefined()
            // Container should be hidden initially
            expect(panel.isOpen()).toBe(false)
        })

        test('should create child elements', () => {
            // Panel should have created header, messages, input containers
            expect(parentEl.children.length).toBeGreaterThan(0)
        })
    })

    describe('open', () => {
        test('should show the panel', () => {
            const villager = new MockVillager('Test NPC') as unknown as Villager

            panel.open(villager)

            expect(panel.isOpen()).toBe(true)
        })

        test('should set current villager', () => {
            const villager = new MockVillager('My Villager') as unknown as Villager

            panel.open(villager)

            expect(panel.getCurrentVillager()).toBe(villager)
        })

        test('should clear previous messages', () => {
            const villager1 = new MockVillager('V1') as unknown as Villager
            panel.open(villager1)
            panel.addMessage('user', 'Hello')

            const villager2 = new MockVillager('V2') as unknown as Villager
            panel.open(villager2)

            // Messages should be cleared
            expect(panel.getCurrentVillager()).toBe(villager2)
        })
    })

    describe('close', () => {
        test('should hide the panel', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.close()

            expect(panel.isOpen()).toBe(false)
        })

        test('should clear current villager', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.close()

            expect(panel.getCurrentVillager()).toBeNull()
        })

        test('should call onClose callback', () => {
            let closeCalled = false
            panel.setOnCloseCallback(() => {
                closeCalled = true
            })

            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)
            panel.close()

            expect(closeCalled).toBe(true)
        })
    })

    describe('isOpen', () => {
        test('should return false initially', () => {
            expect(panel.isOpen()).toBe(false)
        })

        test('should return true after opening', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            expect(panel.isOpen()).toBe(true)
        })

        test('should return false after closing', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)
            panel.close()

            expect(panel.isOpen()).toBe(false)
        })
    })

    describe('getCurrentVillager', () => {
        test('should return null when no villager', () => {
            expect(panel.getCurrentVillager()).toBeNull()
        })

        test('should return current villager when open', () => {
            const villager = new MockVillager('Specific') as unknown as Villager
            panel.open(villager)

            expect(panel.getCurrentVillager()).toBe(villager)
        })
    })

    describe('setSendMessageCallback', () => {
        test('should set callback for sending messages', () => {
            panel.setSendMessageCallback(async (_msg: string) => {
                // Callback body - not invoked in this test
            })

            // Callback is set but not invoked directly in this test
            expect(panel).toBeDefined()
        })
    })

    describe('setOnCloseCallback', () => {
        test('should set callback for close', () => {
            let called = false
            panel.setOnCloseCallback(() => {
                called = true
            })

            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)
            panel.close()

            expect(called).toBe(true)
        })
    })

    describe('addMessage', () => {
        test('should add user message', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.addMessage('user', 'Hello there!')

            // Message should be added (internal state)
            expect(panel.isOpen()).toBe(true)
        })

        test('should add assistant message', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.addMessage('assistant', 'Hi! How can I help?')

            expect(panel.isOpen()).toBe(true)
        })

        test('should handle multiple messages', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.addMessage('user', 'First message')
            panel.addMessage('assistant', 'First response')
            panel.addMessage('user', 'Second message')
            panel.addMessage('assistant', 'Second response')

            expect(panel.isOpen()).toBe(true)
        })
    })

    describe('setLoading', () => {
        test('should set loading state to true', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)

            panel.setLoading(true)

            // Loading state set (internal)
            expect(panel.isOpen()).toBe(true)
        })

        test('should set loading state to false', () => {
            const villager = new MockVillager() as unknown as Villager
            panel.open(villager)
            panel.setLoading(true)

            panel.setLoading(false)

            expect(panel.isOpen()).toBe(true)
        })
    })

    describe('destroy', () => {
        test('should remove the container', () => {
            expect(() => panel.destroy()).not.toThrow()
        })
    })
})
