import type * as ex from 'excalibur'

/**
 * Speech bubble that appears above actors during conversations
 */
export class SpeechBubble {
    private container: HTMLElement
    private textEl: HTMLElement
    private targetActor: ex.Actor | null = null
    private engine: ex.Engine | null = null

    constructor(parentEl: HTMLElement) {
        this.container = parentEl.createDiv({ cls: 'note-village-speech-bubble' })
        this.container.style.display = 'none'

        this.textEl = this.container.createDiv({ cls: 'note-village-speech-bubble-text' })

        // Add arrow/pointer
        this.container.createDiv({ cls: 'note-village-speech-bubble-arrow' })
    }

    /**
     * Show speech bubble above an actor
     */
    show(text: string, actor: ex.Actor, engine: ex.Engine): void {
        this.targetActor = actor
        this.engine = engine
        this.textEl.setText(text)
        this.container.style.display = 'block'
        this.updatePosition()
    }

    /**
     * Update text without changing target
     */
    updateText(text: string): void {
        this.textEl.setText(text)
    }

    /**
     * Hide speech bubble
     */
    hide(): void {
        this.container.style.display = 'none'
        this.targetActor = null
        this.engine = null
    }

    /**
     * Check if visible
     */
    isVisible(): boolean {
        return this.container.style.display !== 'none'
    }

    /**
     * Update position to follow actor
     * Call this each frame if actor moves
     */
    updatePosition(): void {
        if (!this.targetActor || !this.engine) return

        // Convert world position to screen position
        const worldPos = this.targetActor.pos
        const screenPos = this.engine.screen.worldToScreenCoordinates(worldPos)

        // Position bubble above actor
        const offsetY = -60 // Above the actor
        this.container.style.left = `${screenPos.x}px`
        this.container.style.top = `${screenPos.y + offsetY}px`
    }

    /**
     * Destroy the speech bubble
     */
    destroy(): void {
        this.container.remove()
    }
}
