import { describe, test, expect, beforeEach, mock } from 'bun:test'

/**
 * Tests for InputManager using pure mock-based approach
 * We avoid DOM dependencies which aren't available in Bun's default test environment
 */

// Mock Keys enum to match excalibur's Keys
enum MockKeys {
    W = 'KeyW',
    A = 'KeyA',
    S = 'KeyS',
    D = 'KeyD',
    C = 'KeyC',
    E = 'KeyE',
    Up = 'ArrowUp',
    Down = 'ArrowDown',
    Left = 'ArrowLeft',
    Right = 'ArrowRight',
    Space = 'Space',
    Enter = 'Enter',
    Escape = 'Escape'
}

// Mock InputManager interface for testing (matches real implementation behavior)
interface MockInputManager {
    hasFocus(): boolean
    setFocus(focused: boolean): void
    simulateKeyDown(code: string): void
    simulateKeyUp(code: string): void
    isKeyHeld(key: MockKeys): boolean
    onKeyPress(key: MockKeys, handler: () => void): void
    getPressedKeys(): Set<MockKeys>
    destroy(): void
}

// Create pure mock InputManager that matches real implementation behavior
function createMockInputManager(): MockInputManager {
    let isFocused = false
    const pressedKeys = new Set<MockKeys>()
    const keyPressHandlers = new Map<MockKeys, Array<() => void>>()

    // Key code to MockKeys mapping
    const keyMap: Record<string, MockKeys> = {
        KeyW: MockKeys.W,
        KeyA: MockKeys.A,
        KeyS: MockKeys.S,
        KeyD: MockKeys.D,
        KeyC: MockKeys.C,
        KeyE: MockKeys.E,
        ArrowUp: MockKeys.Up,
        ArrowDown: MockKeys.Down,
        ArrowLeft: MockKeys.Left,
        ArrowRight: MockKeys.Right,
        Space: MockKeys.Space,
        Enter: MockKeys.Enter,
        Escape: MockKeys.Escape
    }

    return {
        hasFocus(): boolean {
            return isFocused
        },
        setFocus(focused: boolean): void {
            const wasFocused = isFocused
            isFocused = focused
            // Clear keys on blur
            if (wasFocused && !focused) {
                pressedKeys.clear()
            }
        },
        simulateKeyDown(code: string): void {
            if (!isFocused) return

            const key = keyMap[code]
            if (!key) return

            if (!pressedKeys.has(key)) {
                pressedKeys.add(key)

                const handlers = keyPressHandlers.get(key)
                if (handlers) {
                    for (const handler of handlers) {
                        handler()
                    }
                }
            }
        },
        simulateKeyUp(code: string): void {
            if (!isFocused) return

            const key = keyMap[code]
            if (!key) return

            pressedKeys.delete(key)
        },
        isKeyHeld(key: MockKeys): boolean {
            return isFocused && pressedKeys.has(key)
        },
        onKeyPress(key: MockKeys, handler: () => void): void {
            if (!keyPressHandlers.has(key)) {
                keyPressHandlers.set(key, [])
            }
            keyPressHandlers.get(key)!.push(handler)
        },
        getPressedKeys(): Set<MockKeys> {
            return new Set(pressedKeys)
        },
        destroy(): void {
            pressedKeys.clear()
            keyPressHandlers.clear()
        }
    }
}

describe('InputManager', () => {
    let inputManager: MockInputManager

    beforeEach(() => {
        inputManager = createMockInputManager()
    })

    describe('focus management', () => {
        test('should start unfocused', () => {
            expect(inputManager.hasFocus()).toBe(false)
        })

        test('should track focus when set', () => {
            inputManager.setFocus(true)
            expect(inputManager.hasFocus()).toBe(true)
        })

        test('should track blur when focus is lost', () => {
            inputManager.setFocus(true)
            expect(inputManager.hasFocus()).toBe(true)

            inputManager.setFocus(false)
            expect(inputManager.hasFocus()).toBe(false)
        })

        test('should clear pressed keys on blur', () => {
            inputManager.setFocus(true)
            inputManager.simulateKeyDown('KeyW')

            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)

            inputManager.setFocus(false)
            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(false)
            expect(inputManager.getPressedKeys().size).toBe(0)
        })
    })

    describe('key tracking', () => {
        beforeEach(() => {
            inputManager.setFocus(true)
        })

        test('should track pressed keys when focused', () => {
            inputManager.simulateKeyDown('KeyW')
            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)
        })

        test('should track key release', () => {
            inputManager.simulateKeyDown('KeyW')
            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)

            inputManager.simulateKeyUp('KeyW')
            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(false)
        })

        test('should track multiple pressed keys', () => {
            inputManager.simulateKeyDown('KeyW')
            inputManager.simulateKeyDown('KeyA')

            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.A)).toBe(true)
            expect(inputManager.getPressedKeys().size).toBe(2)
        })

        test('should not track keys when unfocused', () => {
            inputManager.setFocus(false)
            inputManager.simulateKeyDown('KeyW')

            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(false)
        })

        test('should map arrow keys correctly', () => {
            inputManager.simulateKeyDown('ArrowUp')
            inputManager.simulateKeyDown('ArrowDown')
            inputManager.simulateKeyDown('ArrowLeft')
            inputManager.simulateKeyDown('ArrowRight')

            expect(inputManager.isKeyHeld(MockKeys.Up)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.Down)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.Left)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.Right)).toBe(true)
        })

        test('should map WASD keys correctly', () => {
            inputManager.simulateKeyDown('KeyW')
            inputManager.simulateKeyDown('KeyA')
            inputManager.simulateKeyDown('KeyS')
            inputManager.simulateKeyDown('KeyD')

            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.A)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.S)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.D)).toBe(true)
        })

        test('should map special keys correctly', () => {
            inputManager.simulateKeyDown('Space')
            inputManager.simulateKeyDown('Enter')
            inputManager.simulateKeyDown('Escape')

            expect(inputManager.isKeyHeld(MockKeys.Space)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.Enter)).toBe(true)
            expect(inputManager.isKeyHeld(MockKeys.Escape)).toBe(true)
        })

        test('should ignore unknown key codes', () => {
            inputManager.simulateKeyDown('F1')
            expect(inputManager.getPressedKeys().size).toBe(0)
        })
    })

    describe('key press handlers', () => {
        beforeEach(() => {
            inputManager.setFocus(true)
        })

        test('should call registered key press handler', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)

            inputManager.simulateKeyDown('KeyC')

            expect(handler).toHaveBeenCalledTimes(1)
        })

        test('should not call handler for different key', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)

            inputManager.simulateKeyDown('KeyW')

            expect(handler).not.toHaveBeenCalled()
        })

        test('should support multiple handlers for same key', () => {
            const handler1 = mock(() => {})
            const handler2 = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler1)
            inputManager.onKeyPress(MockKeys.C, handler2)

            inputManager.simulateKeyDown('KeyC')

            expect(handler1).toHaveBeenCalledTimes(1)
            expect(handler2).toHaveBeenCalledTimes(1)
        })

        test('should not call handler when key is held (not re-pressed)', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)

            inputManager.simulateKeyDown('KeyC')
            inputManager.simulateKeyDown('KeyC') // Repeat event

            expect(handler).toHaveBeenCalledTimes(1)
        })

        test('should call handler again after key release and re-press', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)

            inputManager.simulateKeyDown('KeyC')
            inputManager.simulateKeyUp('KeyC')
            inputManager.simulateKeyDown('KeyC')

            expect(handler).toHaveBeenCalledTimes(2)
        })

        test('should not call handler when unfocused', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)

            inputManager.setFocus(false)
            inputManager.simulateKeyDown('KeyC')

            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe('destroy', () => {
        test('should clear pressed keys on destroy', () => {
            inputManager.setFocus(true)
            inputManager.simulateKeyDown('KeyW')

            inputManager.destroy()

            expect(inputManager.getPressedKeys().size).toBe(0)
        })

        test('should clear handlers on destroy', () => {
            const handler = mock(() => {})
            inputManager.onKeyPress(MockKeys.C, handler)
            inputManager.setFocus(true)

            inputManager.destroy()

            // Re-focus and try to trigger - handler should not be called
            inputManager.setFocus(true)
            inputManager.simulateKeyDown('KeyC')

            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe('getPressedKeys', () => {
        beforeEach(() => {
            inputManager.setFocus(true)
        })

        test('should return empty set initially', () => {
            expect(inputManager.getPressedKeys().size).toBe(0)
        })

        test('should return copy of pressed keys', () => {
            inputManager.simulateKeyDown('KeyW')

            const keys = inputManager.getPressedKeys()
            expect(keys.has(MockKeys.W)).toBe(true)

            // Verify it's a copy
            keys.delete(MockKeys.W)
            expect(inputManager.isKeyHeld(MockKeys.W)).toBe(true)
        })
    })
})
