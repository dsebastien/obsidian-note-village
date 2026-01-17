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

/** Gap between zones (for roads/alleys) */
const ZONE_GAP = 100

/** Width of the forest border around the world */
const FOREST_BORDER_WIDTH = 80

/** Spacing between forest trees */
const FOREST_TREE_SPACING = 24

/** House dimensions for collision detection (width, height) */
const HOUSE_SIZE = 48

/** Minimum spacing between houses */
const HOUSE_SPACING = 10

/** Maximum attempts to find a non-overlapping position for a house */
const MAX_HOUSE_PLACEMENT_ATTEMPTS = 20

/** Maximum attempts to find a non-overlapping position for a decoration */
const MAX_DECORATION_PLACEMENT_ATTEMPTS = 15

/** Minimum spacing between decorations */
const DECORATION_SPACING = 8

/** Decoration sizes for collision detection */
const DECORATION_SIZES: Record<string, { width: number; height: number }> = {
    flowerBed: { width: 24, height: 16 },
    bush: { width: 20, height: 18 },
    rock: { width: 16, height: 12 },
    tallGrass: { width: 24, height: 16 },
    barrel: { width: 16, height: 20 },
    crate: { width: 16, height: 16 }
}

/** Bounding box for collision detection */
interface BoundingBox {
    x: number
    y: number
    width: number
    height: number
}

/**
 * Check if two bounding boxes overlap
 */
function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
    return (
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    )
}

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
        excludedFolders: string[] = [],
        excludedTags: string[] = []
    ) {
        // Parse options with defaults
        this.options = VillageGeneratorOptionsSchema.parse(options)
        this.random = new SeededRandom(this.options.seed)
        this.tagAnalyzer = new TagAnalyzer(app)
        this.noteScanner = new NoteScanner(app)

        // Set excluded folders
        this.tagAnalyzer.setExcludedFolders(excludedFolders)
        this.noteScanner.setExcludedFolders(excludedFolders)

        // Set excluded tags
        this.tagAnalyzer.setExcludedTags(excludedTags)
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

        // Calculate world size based on grid (with forest border)
        const gridCols = Math.ceil(Math.sqrt(topTags.length + 1)) // +1 for plaza
        const gridRows = Math.ceil((topTags.length + 1) / gridCols)
        // Add forest border on all sides
        const innerWidth = gridCols * (ZONE_SIZE + ZONE_GAP) + ZONE_GAP + 200
        const innerHeight = gridRows * (ZONE_SIZE + ZONE_GAP) + ZONE_GAP + 200
        const worldWidth = innerWidth + FOREST_BORDER_WIDTH * 2
        const worldHeight = innerHeight + FOREST_BORDER_WIDTH * 2
        const worldSize = { width: worldWidth, height: worldHeight }

        // Store playable area bounds (inside the forest)
        this.playableArea = {
            x: FOREST_BORDER_WIDTH,
            y: FOREST_BORDER_WIDTH,
            width: innerWidth,
            height: innerHeight
        }

        // Spawn point is at the center of the plaza
        const spawnPoint = {
            x: this.plazaX + this.plazaWidth / 2,
            y: this.plazaY + this.plazaHeight / 2
        }

        return {
            seed: this.options.seed,
            zones,
            villagers,
            structures,
            spawnPoint,
            worldSize,
            playableArea: this.playableArea,
            plazaBounds: {
                x: this.plazaX,
                y: this.plazaY,
                width: this.plazaWidth,
                height: this.plazaHeight
            }
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

                // Calculate zone position (top-left corner, offset by forest border)
                const zoneX = FOREST_BORDER_WIDTH + ZONE_GAP + col * (ZONE_SIZE + ZONE_GAP)
                const zoneY = FOREST_BORDER_WIDTH + ZONE_GAP + row * (ZONE_SIZE + ZONE_GAP)

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

        // Store plaza info for later use (as a pseudo-zone for structures, offset by forest border)
        this.plazaX =
            FOREST_BORDER_WIDTH +
            ZONE_GAP +
            plazaCenterCol * (ZONE_SIZE + ZONE_GAP) +
            (ZONE_SIZE - PLAZA_SIZE) / 2
        this.plazaY =
            FOREST_BORDER_WIDTH +
            ZONE_GAP +
            plazaCenterRow * (ZONE_SIZE + ZONE_GAP) +
            (ZONE_SIZE - PLAZA_SIZE) / 2
        this.plazaWidth = PLAZA_SIZE
        this.plazaHeight = PLAZA_SIZE

        return zones
    }

    private plazaX = 0
    private plazaY = 0
    private plazaWidth = PLAZA_SIZE
    private plazaHeight = PLAZA_SIZE
    private playableArea = { x: 0, y: 0, width: 0, height: 0 }

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
     * Get playable area bounds (inside the forest border)
     */
    getPlayableArea(): { x: number; y: number; width: number; height: number } {
        return { ...this.playableArea }
    }

    /**
     * Generate villagers from notes using weighted round-robin distribution.
     * Distributes villagers proportionally across zones based on note count,
     * prioritizing least recently updated notes.
     */
    private generateVillagers(
        zones: Zone[],
        notesByTag: Map<string, ScannedNote[]>
    ): VillagerData[] {
        const maxVillagers = this.options.maxVillagers

        // Phase 1: Prepare zone buckets with sorted notes
        // Sort by "updated" timestamp if available, otherwise by "modifiedTime" (oldest first)
        const zoneBuckets = zones.map((zone) => {
            const notes = notesByTag.get(zone.tag) ?? []
            const sortedNotes = [...notes].sort((a, b) => {
                const timeA = a.updated ?? a.modifiedTime
                const timeB = b.updated ?? b.modifiedTime
                return timeA - timeB // Ascending: oldest/least recently modified first
            })
            return { zone, notes: sortedNotes, allocated: 0 }
        })

        // Phase 2 & 3: Calculate proportional allocations
        const totalNotes = zoneBuckets.reduce((sum, b) => sum + b.notes.length, 0)
        if (totalNotes === 0) {
            log('No notes found for any zone', 'debug')
            return []
        }

        // Initial proportional allocation (capped at available notes)
        for (const bucket of zoneBuckets) {
            const proportion = bucket.notes.length / totalNotes
            const target = Math.floor(proportion * maxVillagers)
            bucket.allocated = Math.min(target, bucket.notes.length)
        }

        // Phase 4: Redistribute remaining capacity using round-robin
        let remaining = maxVillagers - zoneBuckets.reduce((sum, b) => sum + b.allocated, 0)

        while (remaining > 0) {
            const bucketsWithCapacity = zoneBuckets.filter((b) => b.allocated < b.notes.length)
            if (bucketsWithCapacity.length === 0) break

            for (const bucket of bucketsWithCapacity) {
                if (remaining <= 0) break
                bucket.allocated++
                remaining--
            }
        }

        // Phase 5: Create villagers from allocated notes
        const villagers: VillagerData[] = []
        for (const bucket of zoneBuckets) {
            for (let i = 0; i < bucket.allocated; i++) {
                const note = bucket.notes[i]
                if (!note) continue

                // Place villager within the rectangular zone with padding
                const position = this.random.nextPointInRect(
                    bucket.zone.x,
                    bucket.zone.y,
                    bucket.zone.width,
                    bucket.zone.height,
                    30 // padding from edges
                )

                villagers.push({
                    id: `villager-${note.path}`,
                    notePath: note.path,
                    noteName: note.name,
                    noteLength: note.contentLength,
                    homePosition: position,
                    zoneId: bucket.zone.id,
                    appearance: {
                        spriteIndex: this.random.nextInt(0, 7),
                        scale: 1
                    }
                })
            }
        }

        log(
            `Generated ${villagers.length} villagers across ${zones.length} zones (max: ${maxVillagers})`,
            'debug'
        )
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

        // Track placed house bounding boxes to avoid overlaps
        const placedHouses: BoundingBox[] = []
        const houseFullSize = HOUSE_SIZE + HOUSE_SPACING // Include spacing in collision box

        for (const villager of housedVillagers) {
            // Find the zone for this villager to keep house within bounds
            const zone = zones.find((z) => z.id === villager.zoneId)
            if (!zone) continue

            // Try to find a non-overlapping position for the house
            const housePosition = this.findNonOverlappingHousePosition(
                villager.homePosition,
                zone,
                placedHouses,
                houseFullSize
            )

            if (!housePosition) {
                // Could not find a valid position, skip this house
                continue
            }

            // Record this house's bounding box
            placedHouses.push({
                x: housePosition.x - houseFullSize / 2,
                y: housePosition.y - houseFullSize / 2,
                width: houseFullSize,
                height: houseFullSize
            })

            structures.push({
                id: `house-${villager.id}`,
                type: 'house',
                position: housePosition,
                zoneId: villager.zoneId
            })
        }

        // Convert house bounding boxes to placed structures list for decoration collision
        const placedStructures: BoundingBox[] = [...placedHouses]

        // Also add benches and fountain to collision list
        const fountainSize = 48
        placedStructures.push({
            x: this.plazaX + this.plazaWidth / 2 - fountainSize / 2,
            y: this.plazaY + this.plazaHeight / 2 - fountainSize / 2,
            width: fountainSize,
            height: fountainSize
        })
        for (const offset of benchOffsets) {
            placedStructures.push({
                x: this.plazaX + offset.x - 16,
                y: this.plazaY + offset.y - 10,
                width: 32,
                height: 20
            })
        }

        // Generate decorations with collision detection
        this.generateDecorations(zones, structures, placedStructures)

        // Generate forest border around the world
        this.generateForestBorder(structures)

        return structures
    }

    /**
     * Generate decorations throughout the village
     * Places decorations with collision detection and symmetry
     */
    private generateDecorations(
        zones: Zone[],
        structures: StructureData[],
        placedStructures: BoundingBox[]
    ): void {
        let decorationIndex = 0

        // 1. Plaza decorations - symmetric flower beds around the plaza edges
        decorationIndex = this.generatePlazaDecorations(
            structures,
            placedStructures,
            decorationIndex
        )

        // 2. Zone decorations - varied decorations within each zone
        for (const zone of zones) {
            decorationIndex = this.generateZoneDecorations(
                zone,
                structures,
                placedStructures,
                decorationIndex
            )
        }

        log(`Generated ${decorationIndex} decorations`, 'debug')
    }

    /**
     * Generate symmetric decorations around the plaza
     */
    private generatePlazaDecorations(
        structures: StructureData[],
        placedStructures: BoundingBox[],
        startIndex: number
    ): number {
        let index = startIndex

        // Symmetric flower beds along plaza edges
        const edgeOffset = 15
        const flowerBedSize = DECORATION_SIZES['flowerBed']!

        // Top edge - symmetrically placed flower beds
        const topPositions = [
            { x: this.plazaX + this.plazaWidth * 0.25, y: this.plazaY + edgeOffset },
            { x: this.plazaX + this.plazaWidth * 0.75, y: this.plazaY + edgeOffset }
        ]

        // Bottom edge
        const bottomPositions = [
            {
                x: this.plazaX + this.plazaWidth * 0.25,
                y: this.plazaY + this.plazaHeight - edgeOffset
            },
            {
                x: this.plazaX + this.plazaWidth * 0.75,
                y: this.plazaY + this.plazaHeight - edgeOffset
            }
        ]

        // Left edge
        const leftPositions = [
            { x: this.plazaX + edgeOffset, y: this.plazaY + this.plazaHeight * 0.25 },
            { x: this.plazaX + edgeOffset, y: this.plazaY + this.plazaHeight * 0.75 }
        ]

        // Right edge
        const rightPositions = [
            {
                x: this.plazaX + this.plazaWidth - edgeOffset,
                y: this.plazaY + this.plazaHeight * 0.25
            },
            {
                x: this.plazaX + this.plazaWidth - edgeOffset,
                y: this.plazaY + this.plazaHeight * 0.75
            }
        ]

        const allPositions = [
            ...topPositions,
            ...bottomPositions,
            ...leftPositions,
            ...rightPositions
        ]

        for (const pos of allPositions) {
            const box: BoundingBox = {
                x: pos.x - flowerBedSize.width / 2 - DECORATION_SPACING,
                y: pos.y - flowerBedSize.height / 2 - DECORATION_SPACING,
                width: flowerBedSize.width + DECORATION_SPACING * 2,
                height: flowerBedSize.height + DECORATION_SPACING * 2
            }

            // Check for overlaps
            let hasOverlap = false
            for (const existing of placedStructures) {
                if (boxesOverlap(box, existing)) {
                    hasOverlap = true
                    break
                }
            }

            if (!hasOverlap) {
                structures.push({
                    id: `decoration-${index++}`,
                    type: 'flowerBed',
                    position: pos,
                    variant: this.random.nextInt(0, 2)
                })
                placedStructures.push(box)
            }
        }

        return index
    }

    /**
     * Generate decorations within a single zone
     */
    private generateZoneDecorations(
        zone: Zone,
        structures: StructureData[],
        placedStructures: BoundingBox[],
        startIndex: number
    ): number {
        let index = startIndex

        // Filter structures in this zone for house positions
        const zoneHouses = structures
            .filter((s) => s.type === 'house' && s.zoneId === zone.id)
            .map((s) => s.position)

        // Decoration types and their placement preferences
        const decorationTypes: Array<{
            type: string
            count: number
            nearHouses: boolean
            atEdges: boolean
        }> = [
            { type: 'bush', count: 2, nearHouses: false, atEdges: true },
            { type: 'rock', count: 2, nearHouses: false, atEdges: true },
            { type: 'tallGrass', count: 2, nearHouses: false, atEdges: true },
            { type: 'barrel', count: 1, nearHouses: true, atEdges: false },
            { type: 'crate', count: 1, nearHouses: true, atEdges: false }
        ]

        for (const decorationType of decorationTypes) {
            for (let i = 0; i < decorationType.count; i++) {
                const size = DECORATION_SIZES[decorationType.type]!
                let position: { x: number; y: number } | null = null

                if (decorationType.nearHouses && zoneHouses.length > 0) {
                    // Place near a house
                    const house = this.random.pick(zoneHouses)
                    if (house) {
                        position = this.findDecorationPosition(
                            zone,
                            placedStructures,
                            size,
                            house,
                            30 // near radius
                        )
                    }
                } else if (decorationType.atEdges) {
                    // Place at zone edges
                    position = this.findEdgeDecorationPosition(zone, placedStructures, size)
                } else {
                    // Place randomly in zone
                    position = this.findDecorationPosition(zone, placedStructures, size, null, 0)
                }

                if (position) {
                    const box: BoundingBox = {
                        x: position.x - size.width / 2 - DECORATION_SPACING,
                        y: position.y - size.height / 2 - DECORATION_SPACING,
                        width: size.width + DECORATION_SPACING * 2,
                        height: size.height + DECORATION_SPACING * 2
                    }

                    structures.push({
                        id: `decoration-${index++}`,
                        type: decorationType.type as
                            | 'flowerBed'
                            | 'bush'
                            | 'rock'
                            | 'tallGrass'
                            | 'barrel'
                            | 'crate',
                        position,
                        zoneId: zone.id,
                        variant: this.random.nextInt(0, 3)
                    })
                    placedStructures.push(box)
                }
            }
        }

        return index
    }

    /**
     * Find a non-overlapping position for a decoration
     */
    private findDecorationPosition(
        zone: Zone,
        placedStructures: BoundingBox[],
        size: { width: number; height: number },
        nearPoint: { x: number; y: number } | null,
        nearRadius: number
    ): { x: number; y: number } | null {
        const padding = Math.max(size.width, size.height) / 2 + DECORATION_SPACING
        const minX = zone.x + padding
        const maxX = zone.x + zone.width - padding
        const minY = zone.y + padding
        const maxY = zone.y + zone.height - padding

        if (maxX <= minX || maxY <= minY) return null

        for (let attempt = 0; attempt < MAX_DECORATION_PLACEMENT_ATTEMPTS; attempt++) {
            let candidateX: number
            let candidateY: number

            if (nearPoint && nearRadius > 0) {
                // Place near the given point
                const angle = this.random.nextFloat(0, Math.PI * 2)
                const distance = this.random.nextFloat(nearRadius * 0.5, nearRadius)
                candidateX = nearPoint.x + Math.cos(angle) * distance
                candidateY = nearPoint.y + Math.sin(angle) * distance

                // Clamp to zone bounds
                candidateX = Math.max(minX, Math.min(maxX, candidateX))
                candidateY = Math.max(minY, Math.min(maxY, candidateY))
            } else {
                // Random position in zone
                candidateX = this.random.nextFloat(minX, maxX)
                candidateY = this.random.nextFloat(minY, maxY)
            }

            const candidateBox: BoundingBox = {
                x: candidateX - size.width / 2 - DECORATION_SPACING,
                y: candidateY - size.height / 2 - DECORATION_SPACING,
                width: size.width + DECORATION_SPACING * 2,
                height: size.height + DECORATION_SPACING * 2
            }

            let hasOverlap = false
            for (const existing of placedStructures) {
                if (boxesOverlap(candidateBox, existing)) {
                    hasOverlap = true
                    break
                }
            }

            if (!hasOverlap) {
                return { x: candidateX, y: candidateY }
            }
        }

        return null
    }

    /**
     * Find a position for a decoration at zone edges
     */
    private findEdgeDecorationPosition(
        zone: Zone,
        placedStructures: BoundingBox[],
        size: { width: number; height: number }
    ): { x: number; y: number } | null {
        const padding = Math.max(size.width, size.height) / 2 + DECORATION_SPACING
        const edgeMargin = 30 // How close to the edge

        for (let attempt = 0; attempt < MAX_DECORATION_PLACEMENT_ATTEMPTS; attempt++) {
            // Pick a random edge (0=top, 1=right, 2=bottom, 3=left)
            const edge = this.random.nextInt(0, 3)
            let candidateX: number
            let candidateY: number

            switch (edge) {
                case 0: // Top edge
                    candidateX = this.random.nextFloat(
                        zone.x + padding,
                        zone.x + zone.width - padding
                    )
                    candidateY = zone.y + edgeMargin
                    break
                case 1: // Right edge
                    candidateX = zone.x + zone.width - edgeMargin
                    candidateY = this.random.nextFloat(
                        zone.y + padding,
                        zone.y + zone.height - padding
                    )
                    break
                case 2: // Bottom edge
                    candidateX = this.random.nextFloat(
                        zone.x + padding,
                        zone.x + zone.width - padding
                    )
                    candidateY = zone.y + zone.height - edgeMargin
                    break
                default: // Left edge
                    candidateX = zone.x + edgeMargin
                    candidateY = this.random.nextFloat(
                        zone.y + padding,
                        zone.y + zone.height - padding
                    )
                    break
            }

            const candidateBox: BoundingBox = {
                x: candidateX - size.width / 2 - DECORATION_SPACING,
                y: candidateY - size.height / 2 - DECORATION_SPACING,
                width: size.width + DECORATION_SPACING * 2,
                height: size.height + DECORATION_SPACING * 2
            }

            let hasOverlap = false
            for (const existing of placedStructures) {
                if (boxesOverlap(candidateBox, existing)) {
                    hasOverlap = true
                    break
                }
            }

            if (!hasOverlap) {
                return { x: candidateX, y: candidateY }
            }
        }

        return null
    }

    /**
     * Generate dense forest border around the world perimeter
     * The forest acts as an impassable barrier
     */
    private generateForestBorder(structures: StructureData[]): void {
        const worldWidth = this.playableArea.width + FOREST_BORDER_WIDTH * 2
        const worldHeight = this.playableArea.height + FOREST_BORDER_WIDTH * 2

        let forestIndex = 0

        // Generate trees in the forest border (all four edges)
        // Top edge
        for (let x = 0; x < worldWidth; x += FOREST_TREE_SPACING) {
            for (let y = 0; y < FOREST_BORDER_WIDTH; y += FOREST_TREE_SPACING) {
                const offsetX = this.random.nextFloat(-4, 4)
                const offsetY = this.random.nextFloat(-4, 4)
                structures.push({
                    id: `forest-${forestIndex++}`,
                    type: 'forest',
                    position: { x: x + offsetX, y: y + offsetY },
                    isBlocking: true
                })
            }
        }

        // Bottom edge
        for (let x = 0; x < worldWidth; x += FOREST_TREE_SPACING) {
            for (
                let y = worldHeight - FOREST_BORDER_WIDTH;
                y < worldHeight;
                y += FOREST_TREE_SPACING
            ) {
                const offsetX = this.random.nextFloat(-4, 4)
                const offsetY = this.random.nextFloat(-4, 4)
                structures.push({
                    id: `forest-${forestIndex++}`,
                    type: 'forest',
                    position: { x: x + offsetX, y: y + offsetY },
                    isBlocking: true
                })
            }
        }

        // Left edge (excluding corners already covered)
        for (let x = 0; x < FOREST_BORDER_WIDTH; x += FOREST_TREE_SPACING) {
            for (
                let y = FOREST_BORDER_WIDTH;
                y < worldHeight - FOREST_BORDER_WIDTH;
                y += FOREST_TREE_SPACING
            ) {
                const offsetX = this.random.nextFloat(-4, 4)
                const offsetY = this.random.nextFloat(-4, 4)
                structures.push({
                    id: `forest-${forestIndex++}`,
                    type: 'forest',
                    position: { x: x + offsetX, y: y + offsetY },
                    isBlocking: true
                })
            }
        }

        // Right edge (excluding corners already covered)
        for (let x = worldWidth - FOREST_BORDER_WIDTH; x < worldWidth; x += FOREST_TREE_SPACING) {
            for (
                let y = FOREST_BORDER_WIDTH;
                y < worldHeight - FOREST_BORDER_WIDTH;
                y += FOREST_TREE_SPACING
            ) {
                const offsetX = this.random.nextFloat(-4, 4)
                const offsetY = this.random.nextFloat(-4, 4)
                structures.push({
                    id: `forest-${forestIndex++}`,
                    type: 'forest',
                    position: { x: x + offsetX, y: y + offsetY },
                    isBlocking: true
                })
            }
        }

        log(`Generated ${forestIndex} forest border trees`, 'debug')
    }

    /**
     * Find a non-overlapping position for a house within a zone.
     * Starts near the villager's position and expands search if needed.
     * @returns The position if found, null if no valid position exists
     */
    private findNonOverlappingHousePosition(
        villagerPos: { x: number; y: number },
        zone: Zone,
        placedHouses: BoundingBox[],
        houseSize: number
    ): { x: number; y: number } | null {
        // Padding from zone edges to keep houses fully inside
        const edgePadding = houseSize / 2 + 10
        const minX = zone.x + edgePadding
        const maxX = zone.x + zone.width - edgePadding
        const minY = zone.y + edgePadding
        const maxY = zone.y + zone.height - edgePadding

        // If zone is too small for even one house, skip
        if (maxX <= minX || maxY <= minY) {
            return null
        }

        // Try random positions with increasing search radius
        for (let attempt = 0; attempt < MAX_HOUSE_PLACEMENT_ATTEMPTS; attempt++) {
            // Expand search radius with each attempt
            const searchRadius = 30 + attempt * 15

            // Generate a candidate position near the villager
            const candidateX = this.random.nextFloat(
                Math.max(minX, villagerPos.x - searchRadius),
                Math.min(maxX, villagerPos.x + searchRadius)
            )
            const candidateY = this.random.nextFloat(
                Math.max(minY, villagerPos.y - searchRadius),
                Math.min(maxY, villagerPos.y + searchRadius)
            )

            // Create bounding box for collision check (centered on position)
            const candidateBox: BoundingBox = {
                x: candidateX - houseSize / 2,
                y: candidateY - houseSize / 2,
                width: houseSize,
                height: houseSize
            }

            // Check if this position overlaps with any placed house
            let hasOverlap = false
            for (const existingHouse of placedHouses) {
                if (boxesOverlap(candidateBox, existingHouse)) {
                    hasOverlap = true
                    break
                }
            }

            if (!hasOverlap) {
                return { x: candidateX, y: candidateY }
            }
        }

        // Could not find a valid position
        return null
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
