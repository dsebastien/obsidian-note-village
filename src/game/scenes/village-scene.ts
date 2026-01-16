import * as ex from 'excalibur'
import { Player } from '../actors/player.actor'
import { Villager } from '../actors/villager.actor'
import { WanderSystem } from '../systems/wander.system'
import { InteractionSystem } from '../systems/interaction.system'
import { SpriteManager } from '../graphics/sprite-manager'
import type { InputManager } from '../input/input-manager'
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
    private inputManager: InputManager

    constructor(
        private villageData: VillageData,
        inputManager: InputManager
    ) {
        super()
        this.spriteManager = SpriteManager.getInstance()
        this.inputManager = inputManager
    }

    override onInitialize(_engine: ex.Engine): void {
        log('Initializing village scene', 'debug')

        // Add ECS systems
        const wanderSystem = new WanderSystem(this.world)
        this.interactionSystem = new InteractionSystem(this.world, this.inputManager)
        this.world.add(wanderSystem)
        this.world.add(this.interactionSystem)

        // Create ground/terrain with beautiful pixel art
        this.createTerrain()

        // Spawn structures (houses, signs, decorations)
        this.spawnStructures()

        // NOTE: Villagers are NOT spawned here - they are loaded asynchronously
        // via spawnVillagersInBatches() after the scene is ready

        // Create and add player with focus-aware input
        this.player = new Player(toExVector(this.villageData.spawnPoint), this.inputManager)
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

        // Draw paved roads in the alleys between zones
        this.drawRoads()

        // Draw rectangular zones with colored overlays
        for (const zone of this.villageData.zones) {
            this.drawZone(zone)
        }

        // Draw central plaza with stone tiles (square)
        this.drawPlaza()
    }

    /**
     * Draw paved roads in the alleys between zones
     * Creates cobblestone paths connecting zones to the plaza
     */
    private drawRoads(): void {
        const zones = this.villageData.zones
        if (zones.length === 0) return

        // Calculate road network from zone positions
        // Roads are drawn in the gaps between zones and connect to the plaza

        // Find the grid structure by analyzing zone positions
        const zonePositions = zones.map((z) => ({
            x: z.x,
            y: z.y,
            width: z.width,
            height: z.height,
            right: z.x + z.width,
            bottom: z.y + z.height
        }))

        // Find unique horizontal and vertical lines where roads should be
        const horizontalRoads: Array<{ y: number; xStart: number; xEnd: number }> = []
        const verticalRoads: Array<{ x: number; yStart: number; yEnd: number }> = []

        // Gap size (should match ZONE_GAP from village-generator)
        const gapSize = 100

        // Find horizontal gaps (between vertically adjacent zones)
        const uniqueBottoms = [...new Set(zonePositions.map((z) => z.bottom))].sort((a, b) => a - b)
        for (const bottom of uniqueBottoms) {
            // Check if there are zones below this bottom edge
            const zonesAbove = zonePositions.filter((z) => Math.abs(z.bottom - bottom) < 1)
            const zonesBelow = zonePositions.filter((z) => Math.abs(z.y - (bottom + gapSize)) < 1)

            if (zonesAbove.length > 0 && zonesBelow.length > 0) {
                // Find the extent of the road
                const allZones = [...zonesAbove, ...zonesBelow]
                const xStart = Math.min(...allZones.map((z) => z.x))
                const xEnd = Math.max(...allZones.map((z) => z.right))

                horizontalRoads.push({
                    y: bottom,
                    xStart: xStart - gapSize,
                    xEnd: xEnd + gapSize
                })
            }
        }

        // Find vertical gaps (between horizontally adjacent zones)
        const uniqueRights = [...new Set(zonePositions.map((z) => z.right))].sort((a, b) => a - b)
        for (const right of uniqueRights) {
            // Check if there are zones to the right of this edge
            const zonesLeft = zonePositions.filter((z) => Math.abs(z.right - right) < 1)
            const zonesRight = zonePositions.filter((z) => Math.abs(z.x - (right + gapSize)) < 1)

            if (zonesLeft.length > 0 && zonesRight.length > 0) {
                // Find the extent of the road
                const allZones = [...zonesLeft, ...zonesRight]
                const yStart = Math.min(...allZones.map((z) => z.y))
                const yEnd = Math.max(...allZones.map((z) => z.bottom))

                verticalRoads.push({
                    x: right,
                    yStart: yStart - gapSize,
                    yEnd: yEnd + gapSize
                })
            }
        }

        // Also add roads connecting the edge zones to the world boundary (for the outer alleys)
        const minX = Math.min(...zonePositions.map((z) => z.x))
        const maxRight = Math.max(...zonePositions.map((z) => z.right))
        const minY = Math.min(...zonePositions.map((z) => z.y))
        const maxBottom = Math.max(...zonePositions.map((z) => z.bottom))

        // Add roads around the perimeter connecting to the plaza area
        // Left edge
        if (minX > gapSize) {
            verticalRoads.push({
                x: minX - gapSize,
                yStart: minY - gapSize,
                yEnd: maxBottom + gapSize
            })
        }
        // Right edge
        verticalRoads.push({
            x: maxRight,
            yStart: minY - gapSize,
            yEnd: maxBottom + gapSize
        })
        // Top edge
        if (minY > gapSize) {
            horizontalRoads.push({
                y: minY - gapSize,
                xStart: minX - gapSize,
                xEnd: maxRight + gapSize
            })
        }
        // Bottom edge
        horizontalRoads.push({
            y: maxBottom,
            xStart: minX - gapSize,
            xEnd: maxRight + gapSize
        })

        // Draw horizontal roads
        for (const road of horizontalRoads) {
            this.drawHorizontalRoad(road.xStart, road.y, road.xEnd - road.xStart, gapSize)
        }

        // Draw vertical roads
        for (const road of verticalRoads) {
            this.drawVerticalRoad(road.x, road.yStart, gapSize, road.yEnd - road.yStart)
        }
    }

    /**
     * Draw a horizontal cobblestone road segment
     */
    private drawHorizontalRoad(x: number, y: number, width: number, height: number): void {
        const roadCanvas = new ex.Canvas({
            width,
            height,
            cache: true,
            draw: (ctx) => {
                // Base road color (dirt/cobblestone)
                ctx.fillStyle = '#9B8B7A'
                ctx.fillRect(0, 0, width, height)

                // Cobblestone pattern
                const stoneSize = 8
                for (let sx = 0; sx < width; sx += stoneSize) {
                    for (let sy = 0; sy < height; sy += stoneSize) {
                        // Offset every other row
                        const offsetX = (Math.floor(sy / stoneSize) % 2) * (stoneSize / 2)

                        // Stone color variation
                        const variation = ((sx * 7 + sy * 11) % 100) / 100
                        if (variation < 0.25) {
                            ctx.fillStyle = '#8B7B6A' // Darker
                        } else if (variation < 0.5) {
                            ctx.fillStyle = '#AB9B8A' // Lighter
                        } else if (variation < 0.75) {
                            ctx.fillStyle = '#A0907F' // Medium
                        } else {
                            ctx.fillStyle = '#9B8B7A' // Base
                        }
                        ctx.fillRect(sx + offsetX, sy, stoneSize - 1, stoneSize - 1)

                        // Stone gaps/mortar
                        ctx.fillStyle = '#6B5B4A'
                        ctx.fillRect(sx + offsetX + stoneSize - 1, sy, 1, stoneSize)
                        ctx.fillRect(sx + offsetX, sy + stoneSize - 1, stoneSize, 1)
                    }
                }

                // Road edges (slightly darker border)
                ctx.fillStyle = '#7B6B5A'
                ctx.fillRect(0, 0, width, 2)
                ctx.fillRect(0, height - 2, width, 2)
            }
        })

        const roadActor = new ex.Actor({
            pos: new ex.Vector(x + width / 2, y + height / 2),
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.PreventCollision
        })
        roadActor.graphics.use(roadCanvas)
        roadActor.z = -95 // Between grass (-100) and zones (-90)
        this.add(roadActor)
    }

    /**
     * Draw a vertical cobblestone road segment
     */
    private drawVerticalRoad(x: number, y: number, width: number, height: number): void {
        const roadCanvas = new ex.Canvas({
            width,
            height,
            cache: true,
            draw: (ctx) => {
                // Base road color (dirt/cobblestone)
                ctx.fillStyle = '#9B8B7A'
                ctx.fillRect(0, 0, width, height)

                // Cobblestone pattern
                const stoneSize = 8
                for (let sx = 0; sx < width; sx += stoneSize) {
                    for (let sy = 0; sy < height; sy += stoneSize) {
                        // Offset every other column for vertical roads
                        const offsetY = (Math.floor(sx / stoneSize) % 2) * (stoneSize / 2)

                        // Stone color variation
                        const variation = ((sx * 13 + sy * 7) % 100) / 100
                        if (variation < 0.25) {
                            ctx.fillStyle = '#8B7B6A' // Darker
                        } else if (variation < 0.5) {
                            ctx.fillStyle = '#AB9B8A' // Lighter
                        } else if (variation < 0.75) {
                            ctx.fillStyle = '#A0907F' // Medium
                        } else {
                            ctx.fillStyle = '#9B8B7A' // Base
                        }
                        ctx.fillRect(sx, sy + offsetY, stoneSize - 1, stoneSize - 1)

                        // Stone gaps/mortar
                        ctx.fillStyle = '#6B5B4A'
                        ctx.fillRect(sx + stoneSize - 1, sy + offsetY, 1, stoneSize)
                        ctx.fillRect(sx, sy + offsetY + stoneSize - 1, stoneSize, 1)
                    }
                }

                // Road edges (slightly darker border)
                ctx.fillStyle = '#7B6B5A'
                ctx.fillRect(0, 0, 2, height)
                ctx.fillRect(width - 2, 0, 2, height)
            }
        })

        const roadActor = new ex.Actor({
            pos: new ex.Vector(x + width / 2, y + height / 2),
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.PreventCollision
        })
        roadActor.graphics.use(roadCanvas)
        roadActor.z = -95 // Between grass (-100) and zones (-90)
        this.add(roadActor)
    }

    /**
     * Draw central plaza with stone pattern (JRPG square style)
     */
    private drawPlaza(): void {
        // Use plaza bounds from village data (calculated by generator)
        const plazaBounds = this.villageData.plazaBounds
        if (!plazaBounds) return

        const plazaX = plazaBounds.x
        const plazaY = plazaBounds.y
        const plazaSize = plazaBounds.width // Assuming square plaza

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
     * Draw a zone as a rectangular area with beautiful stone pavement (JRPG grid style)
     */
    private drawZone(zone: Zone): void {
        const { x, y, width, height, color } = zone

        // Get color variations for tile pattern
        const baseColor = this.hexToRgb(color)
        const tileColors = this.generateTileColorPalette(baseColor)

        const zoneCanvas = new ex.Canvas({
            width,
            height,
            cache: true,
            draw: (ctx) => {
                // Draw stone tile pavement (similar to plaza but zone-colored)
                const tileSize = 16
                for (let tx = 0; tx < width; tx += tileSize) {
                    for (let ty = 0; ty < height; ty += tileSize) {
                        // Offset every other row for brick pattern
                        const offsetX = (Math.floor(ty / tileSize) % 2) * (tileSize / 2)

                        // Tile color variation (deterministic based on position)
                        const variation = ((tx * 7 + ty * 13) % 100) / 100
                        let tileColor: string
                        if (variation < 0.3) {
                            tileColor = tileColors.dark
                        } else if (variation < 0.6) {
                            tileColor = tileColors.light
                        } else {
                            tileColor = tileColors.base
                        }
                        ctx.fillStyle = tileColor
                        ctx.fillRect(tx + offsetX, ty, tileSize - 1, tileSize - 1)

                        // Grout/mortar lines
                        ctx.fillStyle = tileColors.grout
                        ctx.fillRect(tx + offsetX + tileSize - 1, ty, 1, tileSize)
                        ctx.fillRect(tx + offsetX, ty + tileSize - 1, tileSize, 1)
                    }
                }

                // Add subtle decorative elements (small darker patches)
                const numPatches = Math.floor((width * height) / 4000)
                for (let i = 0; i < numPatches; i++) {
                    const px = (i * 127) % width
                    const py = (i * 193) % height
                    ctx.fillStyle = this.hexToRgba(color, 0.15)
                    ctx.fillRect(px, py, 4, 4)
                }

                // Decorative border (like plaza)
                ctx.strokeStyle = tileColors.borderDark
                ctx.lineWidth = 4
                ctx.strokeRect(3, 3, width - 6, height - 6)

                ctx.strokeStyle = tileColors.borderLight
                ctx.lineWidth = 2
                ctx.strokeRect(6, 6, width - 12, height - 12)

                // Corner decorations (JRPG style, more prominent)
                const cornerSize = 16
                ctx.fillStyle = tileColors.cornerAccent

                // Top-left corner
                ctx.fillRect(0, 0, cornerSize, 5)
                ctx.fillRect(0, 0, 5, cornerSize)
                ctx.fillRect(2, 2, cornerSize - 4, 2)
                ctx.fillRect(2, 2, 2, cornerSize - 4)

                // Top-right corner
                ctx.fillRect(width - cornerSize, 0, cornerSize, 5)
                ctx.fillRect(width - 5, 0, 5, cornerSize)
                ctx.fillRect(width - cornerSize + 2, 2, cornerSize - 4, 2)
                ctx.fillRect(width - 4, 2, 2, cornerSize - 4)

                // Bottom-left corner
                ctx.fillRect(0, height - 5, cornerSize, 5)
                ctx.fillRect(0, height - cornerSize, 5, cornerSize)
                ctx.fillRect(2, height - 4, cornerSize - 4, 2)
                ctx.fillRect(2, height - cornerSize + 2, 2, cornerSize - 4)

                // Bottom-right corner
                ctx.fillRect(width - cornerSize, height - 5, cornerSize, 5)
                ctx.fillRect(width - 5, height - cornerSize, 5, cornerSize)
                ctx.fillRect(width - cornerSize + 2, height - 4, cornerSize - 4, 2)
                ctx.fillRect(width - 4, height - cornerSize + 2, 2, cornerSize - 4)
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
     * Convert hex color to RGB object
     */
    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        if (!result || !result[1] || !result[2] || !result[3]) {
            return { r: 128, g: 128, b: 128 }
        }
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
    }

    /**
     * Generate a color palette for zone tiles based on a base color
     * Creates lighter/darker variations for visual interest
     */
    private generateTileColorPalette(baseColor: { r: number; g: number; b: number }): {
        base: string
        light: string
        dark: string
        grout: string
        borderDark: string
        borderLight: string
        cornerAccent: string
    } {
        const { r, g, b } = baseColor

        // Blend with a neutral beige/tan to make colors more "stone-like"
        const stoneR = 180
        const stoneG = 160
        const stoneB = 140
        const blendFactor = 0.5 // How much of the original color to keep

        const blendedR = Math.round(r * blendFactor + stoneR * (1 - blendFactor))
        const blendedG = Math.round(g * blendFactor + stoneG * (1 - blendFactor))
        const blendedB = Math.round(b * blendFactor + stoneB * (1 - blendFactor))

        const clamp = (v: number): number => Math.max(0, Math.min(255, v))

        return {
            base: `rgb(${blendedR}, ${blendedG}, ${blendedB})`,
            light: `rgb(${clamp(blendedR + 20)}, ${clamp(blendedG + 20)}, ${clamp(blendedB + 20)})`,
            dark: `rgb(${clamp(blendedR - 25)}, ${clamp(blendedG - 25)}, ${clamp(blendedB - 25)})`,
            grout: `rgb(${clamp(blendedR - 40)}, ${clamp(blendedG - 40)}, ${clamp(blendedB - 40)})`,
            borderDark: `rgb(${clamp(blendedR - 50)}, ${clamp(blendedG - 50)}, ${clamp(blendedB - 50)})`,
            borderLight: `rgb(${clamp(blendedR - 25)}, ${clamp(blendedG - 25)}, ${clamp(blendedB - 25)})`,
            cornerAccent: `rgb(${clamp(r - 30)}, ${clamp(g - 30)}, ${clamp(b - 30)})`
        }
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

        // Use 'tree' sprite for forest structures
        const spriteType = structure.type === 'forest' ? 'tree' : structure.type
        const sprite = this.spriteManager.getStructureSprite(spriteType, variant)
        const { width, height } = this.getStructureSize(structure.type)

        // Use Fixed collision for blocking structures (forest border)
        const collisionType = structure.isBlocking
            ? ex.CollisionType.Fixed
            : ex.CollisionType.PreventCollision

        // For blocking structures, use a smaller collision box at the base
        const collisionWidth = structure.isBlocking ? width * 0.6 : width
        const collisionHeight = structure.isBlocking ? height * 0.3 : height

        const actor = new ex.Actor({
            pos,
            anchor: ex.Vector.Half,
            width: collisionWidth,
            height: collisionHeight,
            collisionType
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
            case 'forest':
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
            case 'forest':
                return 2 // Forest trees same as regular trees
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
            case 'forest':
                return ex.Color.fromHex('#1B5E20') // Darker green for forest trees
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
