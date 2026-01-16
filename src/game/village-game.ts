import * as ex from 'excalibur'
import { VillageScene } from './scenes/village-scene'
import type { VillageData } from '#types/village-data.intf'
import { log } from '../utils/log'
import { RenderQuality } from '#types/render-quality.intf'

/**
 * Excalibur Engine wrapper for the Note Village game
 */
export class VillageGame {
    private engine: ex.Engine
    private villageScene: VillageScene | null = null
    private isRunning = false

    constructor(canvas: HTMLCanvasElement, quality: RenderQuality = RenderQuality.HIGH) {
        const antialiasing = quality !== RenderQuality.LOW
        const pixelRatio =
            quality === RenderQuality.LOW ? 1 : quality === RenderQuality.MEDIUM ? 1.5 : 2

        this.engine = new ex.Engine({
            canvasElement: canvas,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            backgroundColor: ex.Color.fromHex('#4a7c59'), // Grass green
            pixelArt: true,
            pixelRatio,
            antialiasing,
            suppressPlayButton: true,
            displayMode: ex.DisplayMode.FillContainer
        })

        log('VillageGame engine created', 'debug')
    }

    /**
     * Initialize the game with village data
     */
    async initialize(villageData: VillageData): Promise<void> {
        log('Initializing village game', 'debug', villageData)

        this.villageScene = new VillageScene(villageData)
        this.engine.add('village', this.villageScene)

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
    }
}
