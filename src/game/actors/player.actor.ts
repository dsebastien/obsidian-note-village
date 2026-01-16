import * as ex from 'excalibur'
import { log } from '../../utils/log'
import {
    SpriteManager,
    DirectionComponent,
    AnimatedSpriteComponent
} from '../graphics/sprite-manager'

/**
 * Player character controlled by the user.
 * Features JRPG-style pixel art with 4-direction walking animations.
 */
export class Player extends ex.Actor {
    private speed = 120
    private directionComponent: DirectionComponent
    private animatedSprite: AnimatedSpriteComponent | null = null

    constructor(spawnPoint: ex.Vector) {
        super({
            pos: spawnPoint,
            anchor: ex.Vector.Half,
            width: 16,
            height: 24,
            collisionType: ex.CollisionType.Active
        })

        this.directionComponent = new DirectionComponent()
        this.addComponent(this.directionComponent)

        // Z-index for proper layering
        this.z = 10
    }

    override onInitialize(engine: ex.Engine): void {
        log('Player initialized', 'debug')
        this.setupSprite()
        this.setupInput(engine)
    }

    /**
     * Set up player sprite with animations
     */
    private setupSprite(): void {
        const spriteManager = SpriteManager.getInstance()
        const animations = spriteManager.getHeroAnimations()

        if (animations) {
            this.animatedSprite = new AnimatedSpriteComponent(animations)
            this.addComponent(this.animatedSprite)
            this.animatedSprite.setAnimation('idle-down')
        } else {
            // Fallback to colored rectangle if sprites not loaded
            log('Sprites not loaded, using fallback', 'warn')
            this.graphics.use(
                new ex.Rectangle({
                    width: 16,
                    height: 24,
                    color: ex.Color.fromHex('#4169E1')
                })
            )
        }
    }

    /**
     * Set up player input handling
     */
    private setupInput(engine: ex.Engine): void {
        // Track pressed keys for smooth movement
        const pressedKeys = new Set<ex.Keys>()

        engine.input.keyboard.on('press', (evt) => {
            pressedKeys.add(evt.key)
        })

        engine.input.keyboard.on('release', (evt) => {
            pressedKeys.delete(evt.key)
        })

        // Update velocity based on pressed keys every frame
        this.on('preupdate', () => {
            const direction = ex.Vector.Zero.clone()

            if (pressedKeys.has(ex.Keys.W) || pressedKeys.has(ex.Keys.Up)) direction.y = -1
            if (pressedKeys.has(ex.Keys.S) || pressedKeys.has(ex.Keys.Down)) direction.y = 1
            if (pressedKeys.has(ex.Keys.A) || pressedKeys.has(ex.Keys.Left)) direction.x = -1
            if (pressedKeys.has(ex.Keys.D) || pressedKeys.has(ex.Keys.Right)) direction.x = 1

            if (!direction.equals(ex.Vector.Zero)) {
                this.vel = direction.normalize().scale(this.speed)
            } else if (pressedKeys.size === 0 && !this.actions.getQueue().hasNext()) {
                this.vel = ex.Vector.Zero
            }

            // Update direction and animation
            this.updateAnimation()
        })

        // Click-to-move
        engine.input.pointers.primary.on('down', (evt) => {
            this.actions.clearActions()
            this.actions.moveTo(evt.worldPos, this.speed)
        })
    }

    /**
     * Update animation based on current velocity
     */
    private updateAnimation(): void {
        this.directionComponent.updateFromVelocity(this.vel)

        if (this.animatedSprite) {
            this.animatedSprite.updateAnimation(
                this.directionComponent.direction,
                this.directionComponent.isMoving
            )
        }
    }

    /**
     * Get the player's current speed
     */
    getSpeed(): number {
        return this.speed
    }

    /**
     * Set the player's speed
     */
    setSpeed(speed: number): void {
        this.speed = speed
    }

    /**
     * Get current facing direction
     */
    getDirection(): string {
        return this.directionComponent.direction
    }
}
