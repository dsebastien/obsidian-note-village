import * as ex from 'excalibur'
import { VillageScene } from './scenes/village-scene'
import { SpriteManager } from './graphics/sprite-manager'
import type { VillageData } from '#types/village-data.intf'
import { log } from '../utils/log'
import { RenderQuality } from '#types/render-quality.intf'

/**
 * Excalibur Engine wrapper for the Note Village game.
 * Features JRPG-style pixel art graphics with optimized performance.
 */
export class VillageGame {
    private engine: ex.Engine
    private villageScene: VillageScene | null = null
    private isRunning = false
    private spriteManager: SpriteManager

    constructor(canvas: HTMLCanvasElement, quality: RenderQuality = RenderQuality.HIGH) {
        // Quality settings for optimal performance
        const { antialiasing, pixelRatio, maxFps } = this.getQualitySettings(quality)

        this.engine = new ex.Engine({
            canvasElement: canvas,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            backgroundColor: ex.Color.fromHex('#4a7c59'), // Grass green
            pixelArt: true, // Enable pixel art mode for crisp sprites
            pixelRatio,
            antialiasing,
            suppressPlayButton: true,
            displayMode: ex.DisplayMode.FillContainer,
            fixedUpdateFps: 60, // Fixed physics update rate
            maxFps // Cap frame rate for performance
        })

        // Get sprite manager singleton
        this.spriteManager = SpriteManager.getInstance()

        log('VillageGame engine created', 'debug')
    }

    /**
     * Get quality-based engine settings
     */
    private getQualitySettings(quality: RenderQuality): {
        antialiasing: boolean
        pixelRatio: number
        maxFps: number
    } {
        switch (quality) {
            case RenderQuality.LOW:
                return { antialiasing: false, pixelRatio: 1, maxFps: 30 }
            case RenderQuality.MEDIUM:
                return { antialiasing: false, pixelRatio: 1.5, maxFps: 60 }
            case RenderQuality.HIGH:
            default:
                return { antialiasing: false, pixelRatio: 2, maxFps: 60 }
        }
    }

    /**
     * Initialize the game with village data
     */
    async initialize(villageData: VillageData): Promise<void> {
        log('Initializing village game', 'debug', villageData)

        // Initialize sprites first (this caches all sprites)
        log('Loading sprites...', 'debug')
        await this.spriteManager.initialize()
        log('Sprites loaded', 'debug')

        // Create scene with village data
        this.villageScene = new VillageScene(villageData)
        this.engine.add('village', this.villageScene)

        // Start engine
        await this.engine.start()
        this.engine.goToScene('village')
        this.isRunning = true

        log('Village game initialized and running', 'debug')
    }

    /**
     * Resize the game canvas
     */
    resize(width: number, height: number): void {
        if (!this.isRunning) return

        this.engine.screen.viewport = { width, height }
        this.engine.screen.applyResolutionAndViewport()
    }

    /**
     * Get the current village scene
     */
    getScene(): VillageScene | null {
        return this.villageScene
    }

    /**
     * Get the engine instance
     */
    getEngine(): ex.Engine {
        return this.engine
    }

    /**
     * Check if the game is running
     */
    getIsRunning(): boolean {
        return this.isRunning
    }

    /**
     * Stop and destroy the game
     */
    destroy(): void {
        log('Destroying village game', 'debug')
        this.isRunning = false
        this.engine.stop()
        this.spriteManager.destroy()
    }
}
