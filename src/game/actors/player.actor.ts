import * as ex from 'excalibur'
import { log } from '../../utils/log'
import {
    SpriteManager,
    DirectionComponent,
    AnimatedSpriteComponent
} from '../graphics/sprite-manager'
import type { InputManager } from '../input/input-manager'

/**
 * Player character controlled by the user.
 * Features JRPG-style pixel art with 4-direction walking animations.
 * Uses focus-aware input handling - only responds when game canvas is focused.
 */
/** Bounds for the playable area (player cannot move outside) */
interface PlayableBounds {
    x: number
    y: number
    width: number
    height: number
}

export class Player extends ex.Actor {
    private speed = 120
    private directionComponent: DirectionComponent
    private animatedSprite: AnimatedSpriteComponent | null = null
    private inputManager: InputManager
    private playableArea: PlayableBounds | null = null

    constructor(spawnPoint: ex.Vector, inputManager: InputManager) {
        super({
            pos: spawnPoint,
            anchor: ex.Vector.Half,
            width: 16,
            height: 24,
            collisionType: ex.CollisionType.Active
        })

        this.inputManager = inputManager
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
     * Set up player input handling using focus-aware InputManager.
     * Only processes input when the game canvas is focused.
     */
    private setupInput(engine: ex.Engine): void {
        // Update velocity based on pressed keys every frame
        this.on('preupdate', () => {
            // Only process input if canvas is focused
            if (!this.inputManager.hasFocus()) {
                // Stop movement when focus is lost
                if (!this.actions.getQueue().hasNext()) {
                    this.vel = ex.Vector.Zero
                }
                this.updateAnimation()
                return
            }

            const direction = ex.Vector.Zero.clone()

            if (this.inputManager.isKeyHeld(ex.Keys.W) || this.inputManager.isKeyHeld(ex.Keys.Up)) {
                direction.y = -1
            }
            if (
                this.inputManager.isKeyHeld(ex.Keys.S) ||
                this.inputManager.isKeyHeld(ex.Keys.Down)
            ) {
                direction.y = 1
            }
            if (
                this.inputManager.isKeyHeld(ex.Keys.A) ||
                this.inputManager.isKeyHeld(ex.Keys.Left)
            ) {
                direction.x = -1
            }
            if (
                this.inputManager.isKeyHeld(ex.Keys.D) ||
                this.inputManager.isKeyHeld(ex.Keys.Right)
            ) {
                direction.x = 1
            }

            const pressedKeys = this.inputManager.getPressedKeys()
            if (!direction.equals(ex.Vector.Zero)) {
                this.vel = direction.normalize().scale(this.speed)
            } else if (pressedKeys.size === 0 && !this.actions.getQueue().hasNext()) {
                this.vel = ex.Vector.Zero
            }

            // Update direction and animation
            this.updateAnimation()

            // Clamp position to playable area (handles keyboard movement)
            this.clampToPlayableArea()
        })

        // Clamp position after all updates (handles click-to-move)
        this.on('postupdate', () => {
            this.clampToPlayableArea()
        })

        // Click-to-move (only when canvas is focused)
        engine.input.pointers.primary.on('down', (evt) => {
            // Focus the canvas when clicking
            this.inputManager.focus()

            // Only move if already focused (second click)
            if (this.inputManager.hasFocus()) {
                this.actions.clearActions()
                this.actions.moveTo(evt.worldPos, this.speed)
            }
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

    /**
     * Set the playable area bounds.
     * The player's position will be clamped to stay within these bounds.
     */
    setPlayableArea(bounds: PlayableBounds): void {
        this.playableArea = bounds
    }

    /**
     * Clamp position to stay within playable area bounds.
     * Called after movement updates to enforce boundaries.
     */
    private clampToPlayableArea(): void {
        if (!this.playableArea) return

        // Get player half-dimensions for collision
        const halfWidth = this.width / 2
        const halfHeight = this.height / 2

        // Calculate min/max bounds (accounting for player size)
        const minX = this.playableArea.x + halfWidth
        const maxX = this.playableArea.x + this.playableArea.width - halfWidth
        const minY = this.playableArea.y + halfHeight
        const maxY = this.playableArea.y + this.playableArea.height - halfHeight

        // Clamp position
        const clampedX = Math.max(minX, Math.min(maxX, this.pos.x))
        const clampedY = Math.max(minY, Math.min(maxY, this.pos.y))

        // Update position if it changed
        if (clampedX !== this.pos.x || clampedY !== this.pos.y) {
            this.pos.x = clampedX
            this.pos.y = clampedY

            // Also stop velocity in the blocked direction to prevent "sliding" at edges
            if (clampedX !== this.pos.x) this.vel.x = 0
            if (clampedY !== this.pos.y) this.vel.y = 0
        }
    }
}
