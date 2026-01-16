import * as ex from 'excalibur'
import { log } from '../../utils/log'

/**
 * Player character controlled by the user
 */
export class Player extends ex.Actor {
    private speed = 100

    constructor(spawnPoint: ex.Vector) {
        super({
            pos: spawnPoint,
            anchor: ex.Vector.Half,
            width: 24,
            height: 32,
            color: ex.Color.fromHex('#4169E1'), // Royal blue
            collisionType: ex.CollisionType.Active
        })
    }

    override onInitialize(engine: ex.Engine): void {
        log('Player initialized', 'debug')
        this.setupSprite()
        this.setupInput(engine)
    }

    /**
     * Set up player sprite (placeholder)
     */
    private setupSprite(): void {
        // TODO: Load actual sprite sheet and animations
        // For now using the colored rectangle from constructor
    }

    /**
     * Set up player input handling
     */
    private setupInput(engine: ex.Engine): void {
        // Keyboard movement (WASD + Arrows)
        engine.input.keyboard.on('hold', (evt) => {
            const direction = ex.Vector.Zero.clone()

            if (evt.key === ex.Keys.W || evt.key === ex.Keys.Up) direction.y = -1
            if (evt.key === ex.Keys.S || evt.key === ex.Keys.Down) direction.y = 1
            if (evt.key === ex.Keys.A || evt.key === ex.Keys.Left) direction.x = -1
            if (evt.key === ex.Keys.D || evt.key === ex.Keys.Right) direction.x = 1

            if (!direction.equals(ex.Vector.Zero)) {
                this.vel = direction.normalize().scale(this.speed)
            }
        })

        engine.input.keyboard.on('release', () => {
            this.vel = ex.Vector.Zero
        })

        // Click-to-move
        engine.input.pointers.primary.on('down', (evt) => {
            this.actions.clearActions()
            this.actions.moveTo(evt.worldPos, this.speed)
        })
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
}
