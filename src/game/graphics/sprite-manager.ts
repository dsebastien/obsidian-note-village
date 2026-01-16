/**
 * Sprite Manager - Handles sprite caching and animation for the game.
 * Uses Excalibur's sprite system with procedurally generated pixel art.
 */
import * as ex from 'excalibur'
import {
    generateCharacterSpriteSheet,
    getVillagerPalette,
    getHeroPalette,
    generateStructureSprite,
    type Direction
} from './pixel-art-generator'
import { log } from '../../utils/log'

/** Cached sprite data */
interface CachedCharacter {
    spriteSheet: ex.SpriteSheet
    animations: Map<string, ex.Animation>
}

/**
 * Manages all game sprites with caching for performance.
 * Sprites are generated once and reused.
 */
export class SpriteManager {
    private static instance: SpriteManager | null = null

    private heroSprites: CachedCharacter | null = null
    private villagerSprites: Map<number, CachedCharacter> = new Map()
    private structureSprites: Map<string, ex.Sprite> = new Map()

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    static getInstance(): SpriteManager {
        if (!SpriteManager.instance) {
            SpriteManager.instance = new SpriteManager()
        }
        return SpriteManager.instance
    }

    /**
     * Initialize all sprites (call once at game start)
     * Now properly loads all ImageSources before creating sprites
     */
    async initialize(): Promise<void> {
        log('SpriteManager: Starting sprite initialization', 'debug')

        // Pre-generate hero sprites
        this.heroSprites = await this.createCharacterSprites(getHeroPalette())
        log('SpriteManager: Hero sprites loaded', 'debug')

        // Pre-generate villager sprites for all palette variations
        for (let i = 0; i < 8; i++) {
            const palette = getVillagerPalette(i)
            this.villagerSprites.set(i, await this.createCharacterSprites(palette))
        }
        log('SpriteManager: Villager sprites loaded', 'debug')

        // Pre-generate structure sprites
        const structureTypes = ['house', 'tree', 'fountain', 'bench', 'sign', 'fence']
        for (const type of structureTypes) {
            for (let variant = 0; variant < 4; variant++) {
                const key = `${type}-${variant}`
                const canvas = generateStructureSprite(type, variant)
                this.structureSprites.set(key, await this.canvasToSprite(canvas))
            }
        }
        log('SpriteManager: Structure sprites loaded', 'debug')
        log('SpriteManager: All sprites initialized', 'debug')
    }

    /**
     * Create character sprite sheet and animations from palette
     * Now properly loads the ImageSource before creating sprites
     */
    private async createCharacterSprites(
        palette: ReturnType<typeof getVillagerPalette>
    ): Promise<CachedCharacter> {
        const canvas = generateCharacterSpriteSheet(palette)
        const imageSource = await this.canvasToImageSource(canvas)

        const spriteSheet = ex.SpriteSheet.fromImageSource({
            image: imageSource,
            grid: {
                rows: 1,
                columns: 8,
                spriteWidth: 16,
                spriteHeight: 24
            }
        })

        const animations = new Map<string, ex.Animation>()

        // Create animations for each direction
        // Layout: down0, down1, left0, left1, right0, right1, up0, up1
        const directionMap: Record<Direction, number[]> = {
            down: [0, 1],
            left: [2, 3],
            right: [4, 5],
            up: [6, 7]
        }

        for (const [direction, frames] of Object.entries(directionMap)) {
            // Idle animation (single frame)
            // getSprite(column, row) - our sheet has 8 columns and 1 row
            const idleSprite = spriteSheet.getSprite(frames[0]!, 0)
            if (idleSprite) {
                animations.set(
                    `idle-${direction}`,
                    new ex.Animation({
                        frames: [{ graphic: idleSprite, duration: 200 }],
                        strategy: ex.AnimationStrategy.Loop
                    })
                )
            }

            // Walk animation (two frames)
            const walkSprites = frames.map((f) => spriteSheet.getSprite(f, 0)).filter(Boolean)
            if (walkSprites.length === 2) {
                animations.set(
                    `walk-${direction}`,
                    new ex.Animation({
                        frames: walkSprites.map((sprite) => ({ graphic: sprite!, duration: 150 })),
                        strategy: ex.AnimationStrategy.Loop
                    })
                )
            }
        }

        return { spriteSheet, animations }
    }

    /**
     * Convert canvas to Excalibur ImageSource and load it
     */
    private async canvasToImageSource(canvas: HTMLCanvasElement): Promise<ex.ImageSource> {
        // Create an ImageSource from the canvas data URL
        const dataUrl = canvas.toDataURL('image/png')
        const imageSource = new ex.ImageSource(dataUrl)

        // CRITICAL: Load the image before returning
        await imageSource.load()

        return imageSource
    }

    /**
     * Convert canvas to Excalibur Sprite (properly loaded)
     */
    private async canvasToSprite(canvas: HTMLCanvasElement): Promise<ex.Sprite> {
        const imageSource = await this.canvasToImageSource(canvas)
        return imageSource.toSprite()
    }

    /**
     * Get hero animation by name
     */
    getHeroAnimation(name: string): ex.Animation | undefined {
        return this.heroSprites?.animations.get(name)
    }

    /**
     * Get all hero animations
     */
    getHeroAnimations(): Map<string, ex.Animation> | undefined {
        return this.heroSprites?.animations
    }

    /**
     * Get villager animation by palette index and name
     */
    getVillagerAnimation(paletteIndex: number, name: string): ex.Animation | undefined {
        const normalizedIndex = paletteIndex % 8
        return this.villagerSprites.get(normalizedIndex)?.animations.get(name)
    }

    /**
     * Get all villager animations for a palette
     */
    getVillagerAnimations(paletteIndex: number): Map<string, ex.Animation> | undefined {
        const normalizedIndex = paletteIndex % 8
        return this.villagerSprites.get(normalizedIndex)?.animations
    }

    /**
     * Get structure sprite
     */
    getStructureSprite(type: string, variant: number = 0): ex.Sprite | undefined {
        const normalizedVariant = variant % 4
        return this.structureSprites.get(`${type}-${normalizedVariant}`)
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.heroSprites = null
        this.villagerSprites.clear()
        this.structureSprites.clear()
        SpriteManager.instance = null
    }
}

/**
 * Direction component for tracking which way an actor is facing
 */
export class DirectionComponent extends ex.Component {
    readonly type = 'direction'
    direction: Direction = 'down'
    isMoving: boolean = false

    /**
     * Update direction based on velocity
     */
    updateFromVelocity(vel: ex.Vector): void {
        if (vel.magnitude < 0.1) {
            this.isMoving = false
            return
        }

        this.isMoving = true

        // Determine primary direction from velocity
        if (Math.abs(vel.x) > Math.abs(vel.y)) {
            this.direction = vel.x > 0 ? 'right' : 'left'
        } else {
            this.direction = vel.y > 0 ? 'down' : 'up'
        }
    }
}

/**
 * Animated sprite component for characters.
 * Manages animation state and updates graphics.
 */
export class AnimatedSpriteComponent extends ex.Component {
    readonly type = 'animatedSprite'
    private animations: Map<string, ex.Animation>
    private currentAnimation: string = 'idle-down'
    private actorRef: ex.Actor | null = null

    constructor(animations: Map<string, ex.Animation>) {
        super()
        this.animations = animations
    }

    override onAdd(entity: ex.Entity): void {
        if (entity instanceof ex.Actor) {
            this.actorRef = entity
            this.setAnimation('idle-down')
        }
    }

    /**
     * Set the current animation
     */
    setAnimation(name: string): void {
        if (name === this.currentAnimation) return

        const animation = this.animations.get(name)
        if (animation && this.actorRef) {
            this.currentAnimation = name
            this.actorRef.graphics.use(animation)
        }
    }

    /**
     * Update animation based on direction component
     */
    updateAnimation(direction: Direction, isMoving: boolean): void {
        const prefix = isMoving ? 'walk' : 'idle'
        this.setAnimation(`${prefix}-${direction}`)
    }

    /**
     * Get current animation name
     */
    getCurrentAnimation(): string {
        return this.currentAnimation
    }
}
