import type { App } from 'obsidian'
import { VillageGeneratorOptionsSchema } from '#schemas/village-generator-options.schema'
import { SeededRandom } from '../../utils/seeded-random'
import { TagAnalyzer } from '../../vault/tag-analyzer'
import { NoteScanner } from '../../vault/note-scanner'
import type { VillageData } from '#types/village-data.intf'
import type { Zone } from '#types/zone.intf'
import type { VillagerData } from '#types/villager-data.intf'
import type { StructureData } from '#types/structure-data.intf'
import type { VillageGeneratorOptions } from '#types/village-generator-options.intf'
import type { ScannedNote } from '#types/scanned-note.intf'
import { log } from '../../utils/log'

/**
 * Zone color palette - earthy, village-like colors for JRPG style
 */
const ZONE_COLORS = [
    '#8B4513', // Saddle brown
    '#6B8E23', // Olive drab
    '#2E8B57', // Sea green
    '#4682B4', // Steel blue
    '#CD853F', // Peru
    '#708090', // Slate gray
    '#9ACD32', // Yellow green
    '#BC8F8F', // Rosy brown
    '#8FBC8F', // Dark sea green
    '#DEB887', // Burlywood
    '#5F9EA0', // Cadet blue
    '#D2691E', // Chocolate
    '#6495ED', // Cornflower blue
    '#DC143C', // Crimson
    '#00CED1', // Dark turquoise
    '#9932CC', // Dark orchid
    '#FF8C00', // Dark orange
    '#556B2F', // Dark olive green
    '#8B008B', // Dark magenta
    '#483D8B' // Dark slate blue
]

/** Size of the central plaza (square) */
const PLAZA_SIZE = 200

/** Size of each zone tile */
const ZONE_SIZE = 300

/** Gap between zones */
const ZONE_GAP = 20

/**
 * Generates village layout from vault data with JRPG-style rectangular grid
 */
export class VillageGenerator {
    private random: SeededRandom
    private tagAnalyzer: TagAnalyzer
    private noteScanner: NoteScanner

    constructor(
        app: App,
        options: Partial<VillageGeneratorOptions> & { seed: string },
        excludedFolders: string[] = []
    ) {
        // Parse options with defaults
        this.options = VillageGeneratorOptionsSchema.parse(options)
        this.random = new SeededRandom(this.options.seed)
        this.tagAnalyzer = new TagAnalyzer(app)
        this.noteScanner = new NoteScanner(app)

        // Set excluded folders
        this.tagAnalyzer.setExcludedFolders(excludedFolders)
        this.noteScanner.setExcludedFolders(excludedFolders)
    }

    private options: VillageGeneratorOptions

    /**
     * Generate complete village data with rectangular grid layout
     */
    generate(): VillageData {
        log('Generating village with grid layout', 'debug', this.options)

        // Get top tags for zones
        const topTags = this.tagAnalyzer.getTopTags(this.options.topTagCount)
        const tagNames = topTags.map((t) => t.tag)

        // Get notes grouped by tag
        const notesByTag = this.noteScanner.getNotesGroupedByTag(tagNames)

        // Generate zones in a grid pattern
        const zones = this.generateZones(topTags)

        // Generate villagers
        const villagers = this.generateVillagers(zones, notesByTag)

        // Generate structures
        const structures = this.generateStructures(zones, villagers)

        // Calculate world size based on grid
        const gridCols = Math.ceil(Math.sqrt(topTags.length + 1)) // +1 for plaza
        const gridRows = Math.ceil((topTags.length + 1) / gridCols)
        const worldWidth = gridCols * (ZONE_SIZE + ZONE_GAP) + ZONE_GAP + 200
        const worldHeight = gridRows * (ZONE_SIZE + ZONE_GAP) + ZONE_GAP + 200
        const worldSize = { width: worldWidth, height: worldHeight }

        // Spawn point is at the center of the plaza
        const spawnPoint = { x: worldWidth / 2, y: worldHeight / 2 }

        return {
            seed: this.options.seed,
            zones,
            villagers,
            structures,
            spawnPoint,
            worldSize
        }
    }

    /**
     * Generate zones as rectangular areas in a grid pattern around central plaza
     */
    private generateZones(topTags: Array<{ tag: string; count: number }>): Zone[] {
        const zones: Zone[] = []

        // Calculate grid dimensions
        const numZones = topTags.length
        const gridCols = Math.ceil(Math.sqrt(numZones + 1)) // +1 for plaza
        const gridRows = Math.ceil((numZones + 1) / gridCols)

        // Plaza is at the center
        const plazaCenterCol = Math.floor(gridCols / 2)
        const plazaCenterRow = Math.floor(gridRows / 2)

        let zoneIndex = 0
        for (let row = 0; row < gridRows && zoneIndex < numZones; row++) {
            for (let col = 0; col < gridCols && zoneIndex < numZones; col++) {
                // Skip the plaza cell
                if (row === plazaCenterRow && col === plazaCenterCol) {
                    continue
                }

                const tagData = topTags[zoneIndex]
                if (!tagData) continue

                // Calculate zone position (top-left corner)
                const zoneX = ZONE_GAP + col * (ZONE_SIZE + ZONE_GAP)
                const zoneY = ZONE_GAP + row * (ZONE_SIZE + ZONE_GAP)

                const zone: Zone = {
                    id: `zone-${zoneIndex}`,
                    name: this.formatTagAsZoneName(tagData.tag),
                    tag: tagData.tag,
                    color: ZONE_COLORS[zoneIndex % ZONE_COLORS.length] ?? '#808080',
                    x: zoneX,
                    y: zoneY,
                    width: ZONE_SIZE,
                    height: ZONE_SIZE,
                    noteCount: tagData.count
                }

                zones.push(zone)
                zoneIndex++
            }
        }

        // Store plaza info for later use (as a pseudo-zone for structures)
        this.plazaX =
            ZONE_GAP + plazaCenterCol * (ZONE_SIZE + ZONE_GAP) + (ZONE_SIZE - PLAZA_SIZE) / 2
        this.plazaY =
            ZONE_GAP + plazaCenterRow * (ZONE_SIZE + ZONE_GAP) + (ZONE_SIZE - PLAZA_SIZE) / 2
        this.plazaWidth = PLAZA_SIZE
        this.plazaHeight = PLAZA_SIZE

        return zones
    }

    private plazaX = 0
    private plazaY = 0
    private plazaWidth = PLAZA_SIZE
    private plazaHeight = PLAZA_SIZE

    /**
     * Get plaza bounds for external use
     */
    getPlazaBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.plazaX,
            y: this.plazaY,
            width: this.plazaWidth,
            height: this.plazaHeight
        }
    }

    /**
     * Generate villagers from notes (limited by maxVillagers)
     */
    private generateVillagers(
        zones: Zone[],
        notesByTag: Map<string, ScannedNote[]>
    ): VillagerData[] {
        const villagers: VillagerData[] = []
        const maxVillagers = this.options.maxVillagers

        for (const zone of zones) {
            if (villagers.length >= maxVillagers) break

            const notes = notesByTag.get(zone.tag) ?? []

            for (const note of notes) {
                if (villagers.length >= maxVillagers) break

                // Place villager within the rectangular zone with padding
                const position = this.random.nextPointInRect(
                    zone.x,
                    zone.y,
                    zone.width,
                    zone.height,
                    30 // padding from edges
                )

                const villager: VillagerData = {
                    id: `villager-${note.path}`,
                    notePath: note.path,
                    noteName: note.name,
                    noteLength: note.contentLength,
                    homePosition: position,
                    zoneId: zone.id,
                    appearance: {
                        spriteIndex: this.random.nextInt(0, 7),
                        scale: 1
                    }
                }

                villagers.push(villager)
            }
        }

        log(`Generated ${villagers.length} villagers (max: ${maxVillagers})`, 'debug')
        return villagers
    }

    /**
     * Generate structures (houses, signs, decorations) with rectangular layout
     */
    private generateStructures(zones: Zone[], villagers: VillagerData[]): StructureData[] {
        const structures: StructureData[] = []

        // Central fountain in the plaza
        structures.push({
            id: 'fountain-central',
            type: 'fountain',
            position: {
                x: this.plazaX + this.plazaWidth / 2,
                y: this.plazaY + this.plazaHeight / 2
            }
        })

        // Benches around the plaza (at corners)
        const benchOffsets = [
            { x: 30, y: 30 },
            { x: this.plazaWidth - 30, y: 30 },
            { x: 30, y: this.plazaHeight - 30 },
            { x: this.plazaWidth - 30, y: this.plazaHeight - 30 }
        ]
        for (let i = 0; i < benchOffsets.length; i++) {
            const offset = benchOffsets[i]!
            structures.push({
                id: `bench-${i}`,
                type: 'bench',
                position: {
                    x: this.plazaX + offset.x,
                    y: this.plazaY + offset.y
                }
            })
        }

        // Zone signs at the top-center of each zone
        for (const zone of zones) {
            structures.push({
                id: `sign-${zone.id}`,
                type: 'sign',
                position: {
                    x: zone.x + zone.width / 2,
                    y: zone.y + 20
                },
                zoneId: zone.id,
                label: zone.name
            })
        }

        // Houses (some villagers get houses)
        const housedVillagers = villagers.filter(() =>
            this.random.nextBool(this.options.housesPerVillager)
        )

        for (const villager of housedVillagers) {
            // Find the zone for this villager to keep house within bounds
            const zone = zones.find((z) => z.id === villager.zoneId)
            if (!zone) continue

            // Place house near villager but within zone
            const houseX = Math.max(
                zone.x + 30,
                Math.min(
                    zone.x + zone.width - 60,
                    villager.homePosition.x + this.random.nextFloat(-30, 30)
                )
            )
            const houseY = Math.max(
                zone.y + 30,
                Math.min(
                    zone.y + zone.height - 60,
                    villager.homePosition.y + this.random.nextFloat(-30, 30)
                )
            )

            structures.push({
                id: `house-${villager.id}`,
                type: 'house',
                position: { x: houseX, y: houseY },
                zoneId: villager.zoneId
            })
        }

        // Decorations (trees, fences) within each zone
        for (const zone of zones) {
            const numDecorations = Math.floor(zone.noteCount * this.options.decorationDensity * 5)

            for (let i = 0; i < numDecorations; i++) {
                const pos = this.random.nextPointInRect(zone.x, zone.y, zone.width, zone.height, 10)
                const decorationType = this.random.nextBool(0.7) ? 'tree' : 'fence'

                structures.push({
                    id: `decoration-${zone.id}-${i}`,
                    type: decorationType,
                    position: pos,
                    zoneId: zone.id
                })
            }
        }

        return structures
    }

    /**
     * Format tag as human-readable zone name
     */
    private formatTagAsZoneName(tag: string): string {
        // Remove # prefix and capitalize first letter of each word
        return tag
            .replace(/^#/, '')
            .split(/[-_]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
}
