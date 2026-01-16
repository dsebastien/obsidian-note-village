import * as ex from 'excalibur'
import { WandererComponent } from '../components/wanderer.component'

/**
 * System that processes wandering behavior for actors with WandererComponent.
 * Actors alternate between idle and walking states within their wander radius.
 */
export class WanderSystem extends ex.System {
    systemType = ex.SystemType.Update
    query: ex.Query<typeof ex.TransformComponent | typeof WandererComponent>

    constructor(world: ex.World) {
        super()
        this.query = world.query([ex.TransformComponent, WandererComponent])
    }

    override update(delta: number): void {
        for (const entity of this.query.entities) {
            const wanderer = entity.get(WandererComponent)
            const transform = entity.get(ex.TransformComponent)

            if (!wanderer || !transform) continue

            // Update state timer
            wanderer.stateTimer -= delta

            if (wanderer.stateTimer <= 0) {
                // Time to switch states
                if (wanderer.state === 'idle') {
                    this.startWalking(wanderer)
                } else {
                    this.startIdle(entity, wanderer)
                }
            }

            // Process current state
            if (wanderer.state === 'walking' && wanderer.targetPosition) {
                this.processWalking(entity, wanderer, transform)
            }
        }
    }

    private startIdle(entity: ex.Entity, wanderer: WandererComponent): void {
        wanderer.state = 'idle'
        wanderer.stateTimer = this.randomRange(wanderer.minIdleTime, wanderer.maxIdleTime)
        wanderer.targetPosition = null

        // Stop movement
        const actor = entity as ex.Actor
        if (actor.vel) {
            actor.vel = ex.Vector.Zero
        }
    }

    private startWalking(wanderer: WandererComponent): void {
        wanderer.state = 'walking'
        wanderer.stateTimer = this.randomRange(wanderer.minWalkTime, wanderer.maxWalkTime)

        // Pick random target within wander radius
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * wanderer.wanderRadius
        wanderer.targetPosition = new ex.Vector(
            wanderer.homePosition.x + Math.cos(angle) * distance,
            wanderer.homePosition.y + Math.sin(angle) * distance
        )
    }

    private processWalking(
        entity: ex.Entity,
        wanderer: WandererComponent,
        transform: ex.TransformComponent
    ): void {
        if (!wanderer.targetPosition) return

        const currentPos = transform.pos
        const direction = wanderer.targetPosition.sub(currentPos)
        const distance = direction.magnitude

        // Reached target
        if (distance < 5) {
            this.startIdle(entity, wanderer)
            return
        }

        // Move toward target
        const actor = entity as ex.Actor
        if (actor.vel !== undefined) {
            actor.vel = direction.normalize().scale(wanderer.walkSpeed)
        }
    }

    private randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min)
    }
}
