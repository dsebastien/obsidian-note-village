import * as ex from 'excalibur'
import { Player } from '../actors/player.actor'
import { Villager } from '../actors/villager.actor'
import { WanderSystem } from '../systems/wander.system'
import { InteractionSystem } from '../systems/interaction.system'
import { SpriteManager } from '../graphics/sprite-manager'
import type { VillageData } from '#types/village-data.intf'
import type { VillagerData } from '#types/villager-data.intf'
import type { Zone } from '#types/zone.intf'
import type { StructureData } from '#types/structure-data.intf'
import type { VillagerInteractionCallback } from '#types/villager-interaction-callback.intf'
import { toExVector } from '../../utils/vector-utils'
import { log } from '../../utils/log'

/**
 * Main village scene containing all game actors.
 * Features beautiful JRPG-style pixel art terrain and structures.
 */
export class VillageScene extends ex.Scene {
    private player: Player | null = null
    private villagers: Map<string, Villager> = new Map()
    private structures: Map<string, ex.Actor> = new Map()
    private interactionSystem: InteractionSystem | null = null
    private onVillagerInteract: VillagerInteractionCallback | null = null
    private spriteManager: SpriteManager

    constructor(private villageData: VillageData) {
        super()
        this.spriteManager = SpriteManager.getInstance()
    }

    override onInitialize(_engine: ex.Engine): void {
        log('Initializing village scene', 'debug')

        // Add ECS systems
        const wanderSystem = new WanderSystem(this.world)
        this.interactionSystem = new InteractionSystem(this.world)
        this.world.add(wanderSystem)
        this.world.add(this.interactionSystem)

        // Create ground/terrain with beautiful pixel art
        this.createTerrain()

        // Spawn structures (houses, signs, decorations)
        this.spawnStructures()

        // NOTE: Villagers are NOT spawned here - they are loaded asynchronously
        // via spawnVillagersInBatches() after the scene is ready

        // Create and add player
        this.player = new Player(toExVector(this.villageData.spawnPoint))
        this.add(this.player)

        // Camera follows player with smooth tracking
        this.camera.strategy.lockToActor(this.player)
        this.camera.zoom = 2.5

        log('Village scene initialized (villagers will load in background)', 'debug')
    }

    /**
     * Set callback for villager interaction
     */
    setVillagerInteractionCallback(callback: VillagerInteractionCallback): void {
        this.onVillagerInteract = callback
        // Update existing villagers
        for (const villager of this.villagers.values()) {
            villager.setOnInteract(callback)
        }
    }

    /**
     * Create ground terrain with pixel art tiles (JRPG grid style)
     */
    private createTerrain(): void {
        const { width, height } = this.villageData.worldSize

        // Create tiled grass background
        const grassCanvas = new ex.Canvas({
            width,
            height,
            cache: true,
            draw: (ctx) => {
                // Draw base grass color
                ctx.fillStyle = '#4A7C59'
                ctx.fillRect(0, 0, width, height)

                // Add grass texture variation
                const tileSize = 16
                const tilesX = Math.ceil(width / tileSize)
                const tilesY = Math.ceil(height / tileSize)

                for (let tx = 0; tx < tilesX; tx++) {
                    for (let ty = 0; ty < tilesY; ty++) {
                        const x = tx * tileSize
                        const y = ty * tileSize

                        // Vary grass color slightly for natural look
                        const variation = Math.random()
                        if (variation < 0.3) {
                            ctx.fillStyle = '#3D6B4D'
                            ctx.fillRect(x + 2, y + 2, 2, 2)
                        } else if (variation < 0.5) {
                            ctx.fillStyle = '#5A8C69'
                            ctx.fillRect(x + 8, y + 6, 2, 2)
                        }

                        // Grass blades
                        if (Math.random() < 0.2) {
                            ctx.fillStyle = '#6B9C7A'
                            ctx.fillRect(x + 4, y + 10, 1, 3)
                            ctx.fillRect(x + 12, y + 4, 1, 3)
                        }
                    }
                }
            }
        })

        const ground = new ex.Actor({
            pos: new ex.Vector(width / 2, height / 2),
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.PreventCollision
        })
        ground.graphics.use(grassCanvas)
        ground.z = -100
        this.add(ground)

        // Draw rectangular zones with colored overlays
        for (const zone of this.villageData.zones) {
            this.drawZone(zone)
        }

        // Draw central plaza with stone tiles (square)
        this.drawPlaza()
    }

    /**
     * Draw central plaza with stone pattern (JRPG square style)
     */
    private drawPlaza(): void {
        // Calculate plaza position from zones (center of the grid)
        const zones = this.villageData.zones
        if (zones.length === 0) return

        // Find the center of all zones
        const firstZone = zones[0]!
        let minX = firstZone.x
        let minY = firstZone.y
        let maxX = firstZone.x + firstZone.width
        let maxY = firstZone.y + firstZone.height

        for (const zone of zones) {
            minX = Math.min(minX, zone.x)
            minY = Math.min(minY, zone.y)
            maxX = Math.max(maxX, zone.x + zone.width)
            maxY = Math.max(maxY, zone.y + zone.height)
        }

        // Plaza is at the center of the world
        const plazaSize = 200
        const { width: worldWidth, height: worldHeight } = this.villageData.worldSize
        const plazaX = worldWidth / 2 - plazaSize / 2
        const plazaY = worldHeight / 2 - plazaSize / 2

        const plazaCanvas = new ex.Canvas({
            width: plazaSize,
            height: plazaSize,
            cache: true,
            draw: (ctx) => {
                // Base color
                ctx.fillStyle = '#D4A574'
                ctx.fillRect(0, 0, plazaSize, plazaSize)

                // Stone tile pattern
                const tileSize = 16
                for (let x = 0; x < plazaSize; x += tileSize) {
                    for (let y = 0; y < plazaSize; y += tileSize) {
                        // Offset every other row for brick pattern
                        const offsetX = (Math.floor(y / tileSize) % 2) * (tileSize / 2)

                        // Tile color variation
                        const variation = Math.random()
                        if (variation < 0.3) {
                            ctx.fillStyle = '#C49464'
                        } else if (variation < 0.6) {
                            ctx.fillStyle = '#E4B584'
                        } else {
                            ctx.fillStyle = '#D4A574'
                        }
                        ctx.fillRect(x + offsetX, y, tileSize - 1, tileSize - 1)

                        // Grout lines
                        ctx.fillStyle = '#A47454'
                        ctx.fillRect(x + offsetX + tileSize - 1, y, 1, tileSize)
                        ctx.fillRect(x + offsetX, y + tileSize - 1, tileSize, 1)
                    }
                }

                // Decorative border (square)
                ctx.strokeStyle = '#8B7355'
                ctx.lineWidth = 4
                ctx.strokeRect(3, 3, plazaSize - 6, plazaSize - 6)

                ctx.strokeStyle = '#A0896A'
                ctx.lineWidth = 2
                ctx.strokeRect(6, 6, plazaSize - 12, plazaSize - 12)
            }
        })

        const plaza = new ex.Actor({
            pos: new ex.Vector(plazaX + plazaSize / 2, plazaY + plazaSize / 2),
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.PreventCollision
        })
        plaza.graphics.use(plazaCanvas)
        plaza.z = -50
        this.add(plaza)
    }

    /**
     * Draw a zone as a rectangular area (JRPG grid style)
     */
    private drawZone(zone: Zone): void {
        const { x, y, width, height, color } = zone

        const zoneCanvas = new ex.Canvas({
            width,
            height,
            cache: true,
            draw: (ctx) => {
                // Fill with semi-transparent zone color
                const zoneColor = this.hexToRgba(color, 0.2)
                ctx.fillStyle = zoneColor
                ctx.fillRect(0, 0, width, height)

                // Add subtle texture variation
                const numPatches = Math.floor((width * height) / 2000)
                for (let i = 0; i < numPatches; i++) {
                    const px = Math.random() * width
                    const py = Math.random() * height

                    ctx.fillStyle = this.hexToRgba(color, 0.1)
                    ctx.fillRect(px, py, 8 + Math.random() * 12, 8 + Math.random() * 12)
                }

                // Zone border (JRPG style with corner decorations)
                ctx.strokeStyle = this.hexToRgba(color, 0.5)
                ctx.lineWidth = 3
                ctx.strokeRect(2, 2, width - 4, height - 4)

                // Inner border
                ctx.strokeStyle = this.hexToRgba(color, 0.3)
                ctx.lineWidth = 1
                ctx.strokeRect(6, 6, width - 12, height - 12)

                // Corner decorations (JRPG style)
                const cornerSize = 12
                ctx.fillStyle = this.hexToRgba(color, 0.4)

                // Top-left corner
                ctx.fillRect(0, 0, cornerSize, 4)
                ctx.fillRect(0, 0, 4, cornerSize)

                // Top-right corner
                ctx.fillRect(width - cornerSize, 0, cornerSize, 4)
                ctx.fillRect(width - 4, 0, 4, cornerSize)

                // Bottom-left corner
                ctx.fillRect(0, height - 4, cornerSize, 4)
                ctx.fillRect(0, height - cornerSize, 4, cornerSize)

                // Bottom-right corner
                ctx.fillRect(width - cornerSize, height - 4, cornerSize, 4)
                ctx.fillRect(width - 4, height - cornerSize, 4, cornerSize)
            }
        })

        const zoneActor = new ex.Actor({
            pos: new ex.Vector(x + width / 2, y + height / 2),
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.PreventCollision
        })
        zoneActor.graphics.use(zoneCanvas)
        zoneActor.z = -90
        this.add(zoneActor)
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

    /**
     * Spawn structures in the village with pixel art sprites
     */
    private spawnStructures(): void {
        for (const structure of this.villageData.structures) {
            this.spawnStructure(structure)
        }
    }

    /**
     * Spawn a single structure with proper sprite
     */
    private spawnStructure(structure: StructureData): void {
        const pos = toExVector(structure.position)
        const variant = this.getStructureVariant(structure.id)

        const sprite = this.spriteManager.getStructureSprite(structure.type, variant)
        const { width, height } = this.getStructureSize(structure.type)

        const actor = new ex.Actor({
            pos,
            anchor: ex.Vector.Half,
            width,
            height,
            collisionType: ex.CollisionType.PreventCollision
        })

        if (sprite) {
            actor.graphics.use(sprite)
        } else {
            // Fallback to colored rectangle
            actor.graphics.use(
                new ex.Rectangle({
                    width,
                    height,
                    color: this.getStructureColor(structure.type)
                })
            )
        }

        // Set z-index based on structure type
        actor.z = this.getStructureZIndex(structure.type)

        // Add label for signs
        if (structure.type === 'sign' && structure.label) {
            const label = new ex.Label({
                text: structure.label,
                pos: new ex.Vector(0, -24),
                font: new ex.Font({
                    size: 9,
                    color: ex.Color.White,
                    shadow: {
                        blur: 2,
                        offset: new ex.Vector(1, 1),
                        color: ex.Color.Black
                    }
                })
            })
            actor.addChild(label)
        }

        this.structures.set(structure.id, actor)
        this.add(actor)
    }

    /**
     * Get structure size by type
     */
    private getStructureSize(type: string): { width: number; height: number } {
        switch (type) {
            case 'house':
                return { width: 48, height: 48 }
            case 'tree':
                return { width: 32, height: 40 }
            case 'fountain':
                return { width: 48, height: 48 }
            case 'bench':
                return { width: 32, height: 20 }
            case 'sign':
                return { width: 24, height: 32 }
            case 'fence':
                return { width: 24, height: 20 }
            default:
                return { width: 24, height: 24 }
        }
    }

    /**
     * Get structure z-index for proper layering
     */
    private getStructureZIndex(type: string): number {
        switch (type) {
            case 'tree':
                return 2 // Trees are tall, should render above most things
            case 'house':
                return 1
            case 'fountain':
                return 1
            case 'sign':
                return 0
            case 'bench':
                return -1
            case 'fence':
                return -1
            default:
                return 0
        }
    }

    /**
     * Get variant based on structure ID (deterministic)
     */
    private getStructureVariant(id: string): number {
        let hash = 0
        for (let i = 0; i < id.length; i++) {
            const char = id.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash
        }
        return Math.abs(hash) % 4
    }

    /**
     * Get fallback color for structure type
     */
    private getStructureColor(type: string): ex.Color {
        switch (type) {
            case 'house':
                return ex.Color.fromHex('#8B4513')
            case 'sign':
                return ex.Color.fromHex('#DEB887')
            case 'tree':
                return ex.Color.fromHex('#228B22')
            case 'fence':
                return ex.Color.fromHex('#A0522D')
            case 'fountain':
                return ex.Color.fromHex('#4169E1')
            case 'bench':
                return ex.Color.fromHex('#8B7355')
            default:
                return ex.Color.Gray
        }
    }

    /**
     * Spawn villagers in batches asynchronously.
     * Call this after the scene is initialized to load villagers in the background.
     * @param batchSize Number of villagers to spawn per batch (default 10)
     */
    async spawnVillagersInBatches(batchSize = 10): Promise<void> {
        const villagersToSpawn = this.villageData.villagers
        const totalVillagers = villagersToSpawn.length

        log(`Starting deferred villager loading: ${totalVillagers} villagers`, 'debug')

        for (let i = 0; i < totalVillagers; i += batchSize) {
            const batch = villagersToSpawn.slice(i, i + batchSize)

            for (const villagerData of batch) {
                this.addVillager(villagerData)
            }

            // Yield to the event loop between batches for smooth loading
            if (i + batchSize < totalVillagers) {
                await new Promise((resolve) => requestAnimationFrame(resolve))
            }
        }

        log(`Finished loading ${this.villagers.size} villagers`, 'debug')
    }

    /**
     * Find zone by ID
     */
    private findZone(zoneId: string): Zone | undefined {
        return this.villageData.zones.find((z) => z.id === zoneId)
    }

    /**
     * Add a single villager to the scene
     */
    addVillager(villagerData: VillagerData): void {
        const zone = this.findZone(villagerData.zoneId)

        const villager = new Villager(villagerData, zone, this.onVillagerInteract ?? undefined)

        this.villagers.set(villagerData.id, villager)
        this.add(villager)
    }

    /**
     * Remove a villager from the scene
     */
    removeVillager(id: string): void {
        const villager = this.villagers.get(id)
        if (villager) {
            villager.kill()
            this.villagers.delete(id)
        }
    }

    /**
     * Update a villager's size (when note content changes)
     */
    updateVillagerSize(id: string, newContentLength: number): void {
        const villager = this.villagers.get(id)
        if (villager) {
            villager.updateSize(newContentLength)
        }
    }

    /**
     * Get the player actor
     */
    getPlayer(): Player | null {
        return this.player
    }

    /**
     * Get a villager by ID
     */
    getVillager(id: string): Villager | undefined {
        return this.villagers.get(id)
    }

    /**
     * Get all villager IDs
     */
    getVillagerIds(): string[] {
        return Array.from(this.villagers.keys())
    }

    /**
     * Get village data
     */
    getVillageData(): VillageData {
        return this.villageData
    }

    /**
     * Get the interaction system (for external use)
     */
    getInteractionSystem(): InteractionSystem | null {
        return this.interactionSystem
    }
}
