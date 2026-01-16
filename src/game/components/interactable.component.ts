import * as ex from 'excalibur'

export type InteractionCallback = (actor: ex.Actor) => void

/**
 * Makes an actor interactable via click or proximity.
 */
export class InteractableComponent extends ex.Component {
    readonly type = 'interactable'

    /** Whether player is currently in range */
    inRange = false

    /** Callback when interaction occurs */
    private onInteractCallback: InteractionCallback | null = null

    constructor(
        public interactionRadius: number = 40,
        public requiresProximity: boolean = false
    ) {
        super()
    }

    /**
     * Set callback for when interaction occurs
     */
    onInteract(callback: InteractionCallback): void {
        this.onInteractCallback = callback
    }

    /**
     * Trigger the interaction
     */
    trigger(actor: ex.Actor): void {
        if (this.onInteractCallback) {
            this.onInteractCallback(actor)
        }
    }
}
