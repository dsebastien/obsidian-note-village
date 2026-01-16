import * as ex from 'excalibur'
import { log } from '../../utils/log'

/**
 * Key event handler callback
 */
export type KeyEventHandler = (evt: KeyboardEvent) => void

/**
 * Input manager that handles focus-aware keyboard input for the game.
 * Only processes input when the game canvas is focused.
 * Prevents keyboard events from propagating to other Obsidian elements.
 */
export class InputManager {
    private canvas: HTMLCanvasElement
    private isFocused = false
    private pressedKeys = new Set<ex.Keys>()
    private keyPressHandlers: Map<ex.Keys, KeyEventHandler[]> = new Map()
    private boundKeyDownHandler: (e: KeyboardEvent) => void
    private boundKeyUpHandler: (e: KeyboardEvent) => void
    private boundFocusHandler: () => void
    private boundBlurHandler: () => void
    private boundClickHandler: () => void

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        // Make canvas focusable
        this.canvas.tabIndex = 0
        this.canvas.style.outline = 'none' // Hide focus outline

        // Bind handlers
        this.boundKeyDownHandler = this.handleKeyDown.bind(this)
        this.boundKeyUpHandler = this.handleKeyUp.bind(this)
        this.boundFocusHandler = this.handleFocus.bind(this)
        this.boundBlurHandler = this.handleBlur.bind(this)
        this.boundClickHandler = this.handleClick.bind(this)

        // Set up event listeners on the canvas
        this.canvas.addEventListener('keydown', this.boundKeyDownHandler)
        this.canvas.addEventListener('keyup', this.boundKeyUpHandler)
        this.canvas.addEventListener('focus', this.boundFocusHandler)
        this.canvas.addEventListener('blur', this.boundBlurHandler)
        this.canvas.addEventListener('click', this.boundClickHandler)
        this.canvas.addEventListener('mousedown', this.boundClickHandler)

        log('InputManager initialized', 'debug')
    }

    /**
     * Handle focus event
     */
    private handleFocus(): void {
        this.isFocused = true
        log('Game canvas focused', 'debug')
    }

    /**
     * Handle blur event
     */
    private handleBlur(): void {
        this.isFocused = false
        this.pressedKeys.clear() // Clear all pressed keys on blur
        log('Game canvas blurred', 'debug')
    }

    /**
     * Handle click event - focus the canvas
     */
    private handleClick(): void {
        if (!this.isFocused) {
            this.canvas.focus()
        }
    }

    /**
     * Handle keydown event
     */
    private handleKeyDown(e: KeyboardEvent): void {
        if (!this.isFocused) return

        const key = this.keyboardEventToExcaliburKey(e)
        if (key === null) return

        // Stop propagation to prevent Obsidian from receiving the event
        e.preventDefault()
        e.stopPropagation()

        // Track pressed state
        if (!this.pressedKeys.has(key)) {
            this.pressedKeys.add(key)

            // Trigger key press handlers
            const handlers = this.keyPressHandlers.get(key)
            if (handlers) {
                for (const handler of handlers) {
                    handler(e)
                }
            }
        }
    }

    /**
     * Handle keyup event
     */
    private handleKeyUp(e: KeyboardEvent): void {
        if (!this.isFocused) return

        const key = this.keyboardEventToExcaliburKey(e)
        if (key === null) return

        // Stop propagation
        e.preventDefault()
        e.stopPropagation()

        this.pressedKeys.delete(key)
    }

    /**
     * Convert a KeyboardEvent to Excalibur key
     */
    private keyboardEventToExcaliburKey(e: KeyboardEvent): ex.Keys | null {
        const keyMap: Record<string, ex.Keys> = {
            KeyW: ex.Keys.W,
            KeyA: ex.Keys.A,
            KeyS: ex.Keys.S,
            KeyD: ex.Keys.D,
            KeyC: ex.Keys.C,
            KeyE: ex.Keys.E,
            ArrowUp: ex.Keys.Up,
            ArrowDown: ex.Keys.Down,
            ArrowLeft: ex.Keys.Left,
            ArrowRight: ex.Keys.Right,
            Space: ex.Keys.Space,
            Enter: ex.Keys.Enter,
            Escape: ex.Keys.Escape
        }
        return keyMap[e.code] ?? null
    }

    /**
     * Check if a key is currently pressed
     */
    isKeyHeld(key: ex.Keys): boolean {
        return this.isFocused && this.pressedKeys.has(key)
    }

    /**
     * Register a key press handler
     */
    onKeyPress(key: ex.Keys, handler: KeyEventHandler): void {
        if (!this.keyPressHandlers.has(key)) {
            this.keyPressHandlers.set(key, [])
        }
        this.keyPressHandlers.get(key)!.push(handler)
    }

    /**
     * Check if the game canvas is focused
     */
    hasFocus(): boolean {
        return this.isFocused
    }

    /**
     * Focus the game canvas
     */
    focus(): void {
        this.canvas.focus()
    }

    /**
     * Get all currently pressed keys
     */
    getPressedKeys(): Set<ex.Keys> {
        return new Set(this.pressedKeys)
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
        this.canvas.removeEventListener('keydown', this.boundKeyDownHandler)
        this.canvas.removeEventListener('keyup', this.boundKeyUpHandler)
        this.canvas.removeEventListener('focus', this.boundFocusHandler)
        this.canvas.removeEventListener('blur', this.boundBlurHandler)
        this.canvas.removeEventListener('click', this.boundClickHandler)
        this.canvas.removeEventListener('mousedown', this.boundClickHandler)
        this.pressedKeys.clear()
        this.keyPressHandlers.clear()
        log('InputManager destroyed', 'debug')
    }
}
