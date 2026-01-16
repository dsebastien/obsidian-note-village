import * as ex from 'excalibur'
import { Player } from '../actors/player.actor'
import { Villager } from '../actors/villager.actor'
import { WanderSystem } from '../systems/wander.system'
import { InteractionSystem } from '../systems/interaction.system'
import type { VillageData } from '#types/village-data.intf'
import type { VillagerData } from '#types/villager-data.intf'
import type { Zone } from '#types/zone.intf'
import type { VillagerInteractionCallback } from '#types/villager-interaction-callback.intf'
import { toExVector } from '../../utils/vector-utils'
import { log } from '../../utils/log'

/**
 * Main village scene containing all game actors
 */
export class VillageScene extends ex.Scene {
    private player: Player | null = null
    private villagers: Map<string, Villager> = new Map()
    private structures: Map<string, ex.Actor> = new Map()
    private interactionSystem: InteractionSystem | null = null
    private onVillagerInteract: VillagerInteractionCallback | null = null

    constructor(private villageData: VillageData) {
        super()
    }

    override onInitialize(_engine: ex.Engine): void {
        log('Initializing village scene', 'debug')

        // Add ECS systems
        const wanderSystem = new WanderSystem(this.world)
        this.interactionSystem = new InteractionSystem(this.world)
        this.world.add(wanderSystem)
        this.world.add(this.interactionSystem)

        // Create ground/terrain
        this.createTerrain()

        // Spawn structures (houses, signs, decorations)
        this.spawnStructures()

        // Spawn villagers from notes
        this.spawnVillagers()

        // Create and add player
        this.player = new Player(toExVector(this.villageData.spawnPoint))
        this.add(this.player)

        // Camera follows player
        this.camera.strategy.lockToActor(this.player)
        this.camera.zoom = 2

        log('Village scene initialized', 'debug')
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
     * Create ground terrain
     */
    private createTerrain(): void {
        // Create a simple ground actor as background
        const { width, height } = this.villageData.worldSize
        const ground = new ex.Actor({
            pos: ex.Vector.Zero,
            anchor: ex.Vector.Zero,
            width,
            height,
            color: ex.Color.fromHex('#4a7c59')
        })
        ground.z = -100 // Behind everything
        this.add(ground)

        // Draw zone wedges as colored regions
        for (const zone of this.villageData.zones) {
            this.drawZone(zone)
        }

        // Draw central plaza
        const plaza = new ex.Actor({
            pos: ex.Vector.Zero,
            anchor: ex.Vector.Half,
            radius: 100,
            color: ex.Color.fromHex('#d4a574') // Sandy color
        })
        plaza.z = -50
        this.add(plaza)
    }

    /**
     * Draw a zone wedge
     */
    private drawZone(zone: { color: string; innerRadius: number; outerRadius: number }): void {
        // Simplified zone visualization - just a colored circle at the zone's area
        const zoneActor = new ex.Actor({
            pos: ex.Vector.Zero,
            anchor: ex.Vector.Half,
            radius: zone.outerRadius,
            color: ex.Color.fromHex(zone.color).desaturate(0.5).lighten(0.3)
        })
        zoneActor.z = -90
        this.add(zoneActor)
    }

    /**
     * Spawn structures in the village
     */
    private spawnStructures(): void {
        for (const structure of this.villageData.structures) {
            const actor = new ex.Actor({
                pos: toExVector(structure.position),
                anchor: ex.Vector.Half,
                width: structure.type === 'house' ? 48 : 24,
                height: structure.type === 'house' ? 48 : 24,
                color: this.getStructureColor(structure.type)
            })

            // Add label for signs
            if (structure.type === 'sign' && structure.label) {
                const label = new ex.Label({
                    text: structure.label,
                    pos: new ex.Vector(0, -20),
                    font: new ex.Font({
                        size: 10,
                        color: ex.Color.White
                    })
                })
                actor.addChild(label)
            }

            this.structures.set(structure.id, actor)
            this.add(actor)
        }
    }

    /**
     * Get color for structure type
     */
    private getStructureColor(type: string): ex.Color {
        switch (type) {
            case 'house':
                return ex.Color.fromHex('#8B4513') // Brown
            case 'sign':
                return ex.Color.fromHex('#DEB887') // Tan
            case 'tree':
                return ex.Color.fromHex('#228B22') // Forest green
            case 'fence':
                return ex.Color.fromHex('#A0522D') // Sienna
            case 'fountain':
                return ex.Color.fromHex('#4169E1') // Royal blue
            case 'bench':
                return ex.Color.fromHex('#8B7355') // Wood brown
            default:
                return ex.Color.Gray
        }
    }

    /**
     * Spawn villagers in the village
     */
    private spawnVillagers(): void {
        for (const villagerData of this.villageData.villagers) {
            this.addVillager(villagerData)
        }
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
