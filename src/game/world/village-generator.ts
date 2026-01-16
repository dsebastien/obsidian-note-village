import type { App } from 'obsidian'
import { VillageGeneratorOptionsSchema } from '#schemas/village-generator-options.schema'
import { SeededRandom } from '../../utils/seeded-random'
import { TagAnalyzer } from '../../vault/tag-analyzer'
import { NoteScanner } from '../../vault/note-scanner'
import type { VillageData } from '#types/village-data.intf'
import type { Zone } from '#types/zone.intf'
import type { VillagerData } from '#types/villager-data.intf'
import type { StructureData } from '#types/structure-data.intf'
import type { Vector2D } from '#types/vector2d.intf'
import type { VillageGeneratorOptions } from '#types/village-generator-options.intf'
import type { ScannedNote } from '#types/scanned-note.intf'
import { log } from '../../utils/log'

/**
 * Zone color palette - earthy, village-like colors
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

/**
 * Generates village layout from vault data
 */
export class VillageGenerator {
    private random: SeededRandom
    private tagAnalyzer: TagAnalyzer
    private noteScanner: NoteScanner

    constructor(app: App, options: Partial<VillageGeneratorOptions> & { seed: string }) {
        // Parse options with defaults
        this.options = VillageGeneratorOptionsSchema.parse(options)
        this.random = new SeededRandom(this.options.seed)
        this.tagAnalyzer = new TagAnalyzer(app)
        this.noteScanner = new NoteScanner(app)
    }

    private options: VillageGeneratorOptions

    /**
     * Generate complete village data
     */
    generate(): VillageData {
        log('Generating village', 'debug', this.options)

        // Get top tags for zones
        const topTags = this.tagAnalyzer.getTopTags(this.options.topTagCount)
        const tagNames = topTags.map((t) => t.tag)

        // Get notes grouped by tag
        const notesByTag = this.noteScanner.getNotesGroupedByTag(tagNames)

        // Generate zones
        const zones = this.generateZones(topTags)

        // Generate villagers
        const villagers = this.generateVillagers(zones, notesByTag)

        // Generate structures
        const structures = this.generateStructures(zones, villagers)

        // Calculate world size
        const outerRadius = this.options.zoneInnerRadius + this.options.zoneWidth + 100
        const worldSize = { width: outerRadius * 2.5, height: outerRadius * 2.5 }

        return {
            seed: this.options.seed,
            zones,
            villagers,
            structures,
            spawnPoint: { x: 0, y: this.options.plazaRadius + 50 },
            worldSize
        }
    }

    /**
     * Generate zones as wedges around the plaza
     */
    private generateZones(topTags: Array<{ tag: string; count: number }>): Zone[] {
        const zones: Zone[] = []
        const totalNotes = topTags.reduce((sum, t) => sum + t.count, 0)

        let currentAngle = -Math.PI / 2 // Start from top

        for (let i = 0; i < topTags.length; i++) {
            const tagData = topTags[i]
            if (!tagData) continue

            // Angle proportional to note count (minimum 20 degrees)
            const minAngle = (20 * Math.PI) / 180
            const proportionalAngle =
                totalNotes > 0
                    ? (tagData.count / totalNotes) * Math.PI * 2
                    : (Math.PI * 2) / topTags.length
            const wedgeAngle = Math.max(minAngle, proportionalAngle)

            const zone: Zone = {
                id: `zone-${i}`,
                name: this.formatTagAsZoneName(tagData.tag),
                tag: tagData.tag,
                color: ZONE_COLORS[i % ZONE_COLORS.length] ?? '#808080',
                startAngle: currentAngle,
                endAngle: currentAngle + wedgeAngle,
                innerRadius: this.options.zoneInnerRadius,
                outerRadius: this.options.zoneInnerRadius + this.options.zoneWidth,
                noteCount: tagData.count
            }

            zones.push(zone)
            currentAngle += wedgeAngle
        }

        return zones
    }

    /**
     * Generate villagers from notes
     */
    private generateVillagers(
        zones: Zone[],
        notesByTag: Map<string, ScannedNote[]>
    ): VillagerData[] {
        const villagers: VillagerData[] = []

        for (const zone of zones) {
            const notes = notesByTag.get(zone.tag) ?? []

            for (const note of notes) {
                const position = this.random.nextPointInWedge(
                    0,
                    0,
                    zone.innerRadius + 30,
                    zone.outerRadius - 30,
                    zone.startAngle,
                    zone.endAngle
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

        return villagers
    }

    /**
     * Generate structures (houses, signs, decorations)
     */
    private generateStructures(zones: Zone[], villagers: VillagerData[]): StructureData[] {
        const structures: StructureData[] = []

        // Central fountain
        structures.push({
            id: 'fountain-central',
            type: 'fountain',
            position: { x: 0, y: 0 }
        })

        // Benches around plaza
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2
            const distance = this.options.plazaRadius - 30
            structures.push({
                id: `bench-${i}`,
                type: 'bench',
                position: {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance
                }
            })
        }

        // Zone signs at entrances
        for (const zone of zones) {
            const midAngle = (zone.startAngle + zone.endAngle) / 2
            const signPos = this.getPointOnAngle(midAngle, zone.innerRadius - 20)
            structures.push({
                id: `sign-${zone.id}`,
                type: 'sign',
                position: signPos,
                zoneId: zone.id,
                label: zone.name
            })
        }

        // Houses (some villagers get houses)
        const housedVillagers = villagers.filter(() =>
            this.random.nextBool(this.options.housesPerVillager)
        )

        for (const villager of housedVillagers) {
            const houseOffset = this.random.nextPointInCircle(0, 0, 30)
            structures.push({
                id: `house-${villager.id}`,
                type: 'house',
                position: {
                    x: villager.homePosition.x + houseOffset.x,
                    y: villager.homePosition.y + houseOffset.y
                },
                zoneId: villager.zoneId
            })
        }

        // Decorations (trees, fences)
        for (const zone of zones) {
            const numDecorations = Math.floor(zone.noteCount * this.options.decorationDensity * 5)

            for (let i = 0; i < numDecorations; i++) {
                const pos = this.random.nextPointInWedge(
                    0,
                    0,
                    zone.innerRadius,
                    zone.outerRadius,
                    zone.startAngle,
                    zone.endAngle
                )

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

    /**
     * Get a point at a given angle and distance from center
     */
    private getPointOnAngle(angle: number, distance: number): Vector2D {
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
        }
    }
}
