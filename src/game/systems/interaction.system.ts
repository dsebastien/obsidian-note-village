import * as ex from 'excalibur'
import { InteractableComponent } from '../components/interactable.component'
import { Player } from '../actors/player.actor'

/**
 * System that handles player-actor interactions.
 * Tracks proximity and handles click/key interactions.
 */
export class InteractionSystem extends ex.System {
    systemType = ex.SystemType.Update
    query: ex.Query<typeof ex.TransformComponent | typeof InteractableComponent>

    private player: Player | null = null
    private nearestInteractable: ex.Actor | null = null
    private scene: ex.Scene | null = null

    constructor(world: ex.World) {
        super()
        this.query = world.query([ex.TransformComponent, InteractableComponent])
    }

    override initialize(_world: ex.World, scene: ex.Scene): void {
        this.scene = scene

        // Find player in scene
        for (const entity of scene.entities) {
            if (entity instanceof Player) {
                this.player = entity
                break
            }
        }

        // Set up keyboard interaction (E key)
        if (scene.engine) {
            scene.engine.input.keyboard.on('press', (evt) => {
                if (evt.key === ex.Keys.E && this.nearestInteractable) {
                    const interactable = this.nearestInteractable.get(InteractableComponent)
                    if (interactable?.inRange) {
                        interactable.trigger(this.nearestInteractable)
                    }
                }
            })
        }
    }

    override update(_delta: number): void {
        if (!this.player) {
            // Try to find player again if not found during init
            if (this.scene) {
                for (const entity of this.scene.entities) {
                    if (entity instanceof Player) {
                        this.player = entity
                        break
                    }
                }
            }
            if (!this.player) return
        }

        const playerPos = this.player.pos
        let closestDist = Infinity
        this.nearestInteractable = null

        for (const entity of this.query.entities) {
            const interactable = entity.get(InteractableComponent)
            const transform = entity.get(ex.TransformComponent)

            if (!interactable || !transform) continue

            const distance = playerPos.distance(transform.pos)
            interactable.inRange = distance <= interactable.interactionRadius

            // Track closest interactable
            if (interactable.inRange && distance < closestDist) {
                closestDist = distance
                this.nearestInteractable = entity as ex.Actor
            }
        }
    }

    /**
     * Handle click on interactable actor
     */
    handleClick(actor: ex.Actor): void {
        const interactable = actor.get(InteractableComponent)
        if (!interactable) return

        // If requires proximity, check player is in range
        if (interactable.requiresProximity && !interactable.inRange) {
            return
        }

        interactable.trigger(actor)
    }

    /**
     * Get the nearest interactable actor in range
     */
    getNearestInteractable(): ex.Actor | null {
        return this.nearestInteractable
    }
}
