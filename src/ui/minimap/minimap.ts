import type { VillageScene } from '../../game/scenes/village-scene'
import type { VillageData } from '#types/village-data.intf'

/**
 * Minimap showing player and villager positions.
 * Positioned in the top-left corner of the game view.
 */
export class Minimap {
    private container: HTMLElement
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D | null = null
    private animationFrameId: number | null = null
    private scene: VillageScene | null = null
    private villageData: VillageData | null = null

    // Minimap dimensions
    private readonly size = 150
    private readonly padding = 8

    // Colors
    private readonly playerColor = '#4A90D9' // Blue
    private readonly villagerColor = '#5AAF5A' // Green
    private readonly backgroundColor = 'rgba(0, 0, 0, 0.6)'
    private readonly borderColor = 'rgba(255, 255, 255, 0.3)'
    private readonly forestColor = 'rgba(30, 80, 30, 0.5)' // Dark green for forest border
    private readonly zoneAlpha = 0.3

    constructor(parent: HTMLElement) {
        // Create container
        this.container = parent.createDiv({ cls: 'note-village-minimap' })

        // Create canvas
        this.canvas = this.container.createEl('canvas', {
            cls: 'note-village-minimap-canvas'
        })
        this.canvas.width = this.size
        this.canvas.height = this.size

        this.ctx = this.canvas.getContext('2d')
    }

    /**
     * Start rendering the minimap
     */
    start(scene: VillageScene): void {
        this.scene = scene
        this.villageData = scene.getVillageData()
        this.container.style.display = 'block'
        this.startRenderLoop()
    }

    /**
     * Stop rendering and hide the minimap
     */
    stop(): void {
        this.stopRenderLoop()
        this.container.style.display = 'none'
        this.scene = null
        this.villageData = null
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stopRenderLoop()
        this.container.remove()
    }

    /**
     * Start the render loop
     */
    private startRenderLoop(): void {
        const render = (): void => {
            this.render()
            this.animationFrameId = requestAnimationFrame(render)
        }
        this.animationFrameId = requestAnimationFrame(render)
    }

    /**
     * Stop the render loop
     */
    private stopRenderLoop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
    }

    /**
     * Render a single frame
     */
    private render(): void {
        if (!this.ctx || !this.scene || !this.villageData) return

        const ctx = this.ctx
        const { width: worldWidth, height: worldHeight } = this.villageData.worldSize

        // Calculate scale to fit world in minimap
        const scale = Math.min(
            (this.size - this.padding * 2) / worldWidth,
            (this.size - this.padding * 2) / worldHeight
        )

        // Calculate offset to center the map
        const scaledWidth = worldWidth * scale
        const scaledHeight = worldHeight * scale
        const offsetX = (this.size - scaledWidth) / 2
        const offsetY = (this.size - scaledHeight) / 2

        // Clear canvas
        ctx.clearRect(0, 0, this.size, this.size)

        // Draw background
        ctx.fillStyle = this.backgroundColor
        ctx.beginPath()
        ctx.roundRect(0, 0, this.size, this.size, 8)
        ctx.fill()

        // Draw border
        ctx.strokeStyle = this.borderColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(0.5, 0.5, this.size - 1, this.size - 1, 8)
        ctx.stroke()

        // Draw forest border (the area outside the playable zone)
        if (this.villageData.playableArea) {
            const playable = this.villageData.playableArea
            ctx.fillStyle = this.forestColor

            // Top forest strip
            ctx.fillRect(offsetX, offsetY, scaledWidth, playable.y * scale)

            // Bottom forest strip
            const bottomY = (playable.y + playable.height) * scale
            ctx.fillRect(offsetX, offsetY + bottomY, scaledWidth, scaledHeight - bottomY)

            // Left forest strip (between top and bottom)
            ctx.fillRect(
                offsetX,
                offsetY + playable.y * scale,
                playable.x * scale,
                playable.height * scale
            )

            // Right forest strip (between top and bottom)
            const rightX = (playable.x + playable.width) * scale
            ctx.fillRect(
                offsetX + rightX,
                offsetY + playable.y * scale,
                scaledWidth - rightX,
                playable.height * scale
            )
        }

        // Draw zones
        for (const zone of this.villageData.zones) {
            const zoneX = offsetX + zone.x * scale
            const zoneY = offsetY + zone.y * scale
            const zoneWidth = zone.width * scale
            const zoneHeight = zone.height * scale

            ctx.fillStyle = this.hexToRgba(zone.color, this.zoneAlpha)
            ctx.fillRect(zoneX, zoneY, zoneWidth, zoneHeight)
        }

        // Draw villagers as small dots
        const villagerIds = this.scene.getVillagerIds()
        ctx.fillStyle = this.villagerColor
        for (const id of villagerIds) {
            const villager = this.scene.getVillager(id)
            if (villager) {
                const x = offsetX + villager.pos.x * scale
                const y = offsetY + villager.pos.y * scale
                ctx.beginPath()
                ctx.arc(x, y, 2, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Draw player as a larger dot
        const player = this.scene.getPlayer()
        if (player) {
            const x = offsetX + player.pos.x * scale
            const y = offsetY + player.pos.y * scale

            // Player dot with outline for visibility
            ctx.fillStyle = this.playerColor
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.stroke()
        }
    }

    /**
     * Convert hex color to rgba string
     */
    private hexToRgba(hex: string, alpha: number): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        if (!result || !result[1] || !result[2] || !result[3]) {
            return `rgba(128, 128, 128, ${alpha})`
        }
        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
}
