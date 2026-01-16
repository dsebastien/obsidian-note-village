import type * as ex from 'excalibur'

/**
 * Speech bubble that appears above actors during conversations
 */
export class SpeechBubble {
    private container: HTMLElement
    private textEl: HTMLElement
    private targetActor: ex.Actor | null = null
    private engine: ex.Engine | null = null
    private animationFrameId: number | null = null

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
        this.startTracking()
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
        this.stopTracking()
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
     * Start continuously tracking the target actor's position
     */
    private startTracking(): void {
        this.stopTracking()
        const track = (): void => {
            this.updatePosition()
            this.animationFrameId = requestAnimationFrame(track)
        }
        this.animationFrameId = requestAnimationFrame(track)
    }

    /**
     * Stop tracking the target actor
     */
    private stopTracking(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
    }

    /**
     * Update position to follow actor
     */
    updatePosition(): void {
        if (!this.targetActor || !this.engine) return

        // Convert world position to screen position
        const worldPos = this.targetActor.pos
        const screenPos = this.engine.screen.worldToScreenCoordinates(worldPos)

        // Position bubble above actor (accounting for actor height and camera zoom)
        const zoom = this.engine.currentScene?.camera?.zoom ?? 1
        const offsetY = -40 * zoom // Above the actor, scaled by zoom
        this.container.style.left = `${screenPos.x}px`
        this.container.style.top = `${screenPos.y + offsetY}px`
    }

    /**
     * Destroy the speech bubble
     */
    destroy(): void {
        this.stopTracking()
        this.container.remove()
    }
}
