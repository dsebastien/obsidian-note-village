import { describe, test, expect, beforeEach, mock } from 'bun:test'
import type { App, TFile } from 'obsidian'
import type { TagCount } from '#types/tag-count.intf'
import type { ScannedNote } from '#types/scanned-note.intf'

// Mock dependencies before importing
mock.module('../../utils/log', () => ({
    log: () => {}
}))

// Create mock implementations
const mockTopTags: TagCount[] = []
const mockNotesByTag = new Map<string, ScannedNote[]>()

mock.module('../../vault/tag-analyzer', () => ({
    TagAnalyzer: class MockTagAnalyzer {
        getTopTags(_count: number): TagCount[] {
            return mockTopTags
        }
    }
}))

mock.module('../../vault/note-scanner', () => ({
    NoteScanner: class MockNoteScanner {
        getNotesGroupedByTag(_tags: string[]): Map<string, ScannedNote[]> {
            return mockNotesByTag
        }
    }
}))

// Import after mocking
const { VillageGenerator } = await import('./village-generator')

// Helper to create mock ScannedNote
function createMockNote(name: string, tag: string, size = 1000): ScannedNote {
    return {
        file: { path: `notes/${name}.md` } as TFile,
        path: `notes/${name}.md`,
        name,
        tags: [tag],
        primaryTag: tag,
        contentLength: size,
        createdTime: Date.now(),
        modifiedTime: Date.now()
    }
}

describe('VillageGenerator', () => {
    let mockApp: App

    beforeEach(() => {
        mockApp = {} as App

        // Reset mock data
        mockTopTags.length = 0
        mockNotesByTag.clear()
    })

    describe('constructor', () => {
        test('should initialize with required options', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test-seed' })
            expect(generator).toBeDefined()
        })

        test('should use defaults for optional options', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // Should work without errors (using defaults)
            expect(data).toBeDefined()
            expect(data.seed).toBe('test')
        })
    })

    describe('generate', () => {
        test('should return village data structure', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data).toHaveProperty('seed')
            expect(data).toHaveProperty('zones')
            expect(data).toHaveProperty('villagers')
            expect(data).toHaveProperty('structures')
            expect(data).toHaveProperty('spawnPoint')
            expect(data).toHaveProperty('worldSize')
        })

        test('should use provided seed', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'my-seed' })
            const data = generator.generate()

            expect(data.seed).toBe('my-seed')
        })

        test('should generate deterministic results with same seed', () => {
            mockTopTags.push({ tag: 'test', count: 5 })
            mockNotesByTag.set('test', [
                createMockNote('note1', 'test'),
                createMockNote('note2', 'test')
            ])

            const gen1 = new VillageGenerator(mockApp, { seed: 'same-seed' })
            const gen2 = new VillageGenerator(mockApp, { seed: 'same-seed' })

            const data1 = gen1.generate()
            const data2 = gen2.generate()

            // Villager positions should match
            expect(data1.villagers.length).toBe(data2.villagers.length)
            for (let i = 0; i < data1.villagers.length; i++) {
                expect(data1.villagers[i]?.homePosition.x).toBe(data2.villagers[i]?.homePosition.x)
                expect(data1.villagers[i]?.homePosition.y).toBe(data2.villagers[i]?.homePosition.y)
            }
        })

        test('should generate different results with different seeds', () => {
            mockTopTags.push({ tag: 'test', count: 5 })
            mockNotesByTag.set('test', [
                createMockNote('note1', 'test'),
                createMockNote('note2', 'test')
            ])

            const gen1 = new VillageGenerator(mockApp, { seed: 'seed-a' })
            const gen2 = new VillageGenerator(mockApp, { seed: 'seed-b' })

            const data1 = gen1.generate()
            const data2 = gen2.generate()

            // At least some positions should differ
            let hasDifference = false
            for (let i = 0; i < data1.villagers.length; i++) {
                if (
                    data1.villagers[i]?.homePosition.x !== data2.villagers[i]?.homePosition.x ||
                    data1.villagers[i]?.homePosition.y !== data2.villagers[i]?.homePosition.y
                ) {
                    hasDifference = true
                    break
                }
            }
            if (data1.villagers.length > 0) {
                expect(hasDifference).toBe(true)
            }
        })
    })

    describe('zones', () => {
        test('should generate zones for each top tag', () => {
            mockTopTags.push(
                { tag: 'project', count: 10 },
                { tag: 'personal', count: 5 },
                { tag: 'work', count: 3 }
            )
            mockNotesByTag.set('project', [])
            mockNotesByTag.set('personal', [])
            mockNotesByTag.set('work', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data.zones.length).toBe(3)
        })

        test('should format zone names from tags', () => {
            mockTopTags.push({ tag: 'my-project', count: 5 })
            mockNotesByTag.set('my-project', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // Should be capitalized with spaces
            expect(data.zones[0]?.name).toBe('My Project')
        })

        test('should assign colors to zones', () => {
            mockTopTags.push({ tag: 'test1', count: 5 }, { tag: 'test2', count: 3 })
            mockNotesByTag.set('test1', [])
            mockNotesByTag.set('test2', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data.zones[0]?.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
            expect(data.zones[1]?.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
        })

        test('should set zone angles proportional to note count', () => {
            mockTopTags.push({ tag: 'large', count: 20 }, { tag: 'small', count: 5 })
            mockNotesByTag.set('large', [])
            mockNotesByTag.set('small', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const largeZone = data.zones.find((z) => z.tag === 'large')
            const smallZone = data.zones.find((z) => z.tag === 'small')

            // Larger zone should have larger angle span
            const largeAngle = (largeZone?.endAngle ?? 0) - (largeZone?.startAngle ?? 0)
            const smallAngle = (smallZone?.endAngle ?? 0) - (smallZone?.startAngle ?? 0)

            expect(largeAngle).toBeGreaterThan(smallAngle)
        })

        test('should enforce minimum angle for zones', () => {
            mockTopTags.push({ tag: 'huge', count: 100 }, { tag: 'tiny', count: 1 })
            mockNotesByTag.set('huge', [])
            mockNotesByTag.set('tiny', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const tinyZone = data.zones.find((z) => z.tag === 'tiny')
            const tinyAngle = (tinyZone?.endAngle ?? 0) - (tinyZone?.startAngle ?? 0)

            // Minimum angle is 20 degrees
            const minAngle = (20 * Math.PI) / 180
            expect(tinyAngle).toBeGreaterThanOrEqual(minAngle - 0.001)
        })
    })

    describe('villagers', () => {
        test('should create villager for each note', () => {
            mockTopTags.push({ tag: 'test', count: 3 })
            mockNotesByTag.set('test', [
                createMockNote('note1', 'test'),
                createMockNote('note2', 'test'),
                createMockNote('note3', 'test')
            ])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data.villagers.length).toBe(3)
        })

        test('should assign villagers to correct zones', () => {
            mockTopTags.push({ tag: 'zone1', count: 2 }, { tag: 'zone2', count: 1 })
            mockNotesByTag.set('zone1', [createMockNote('note1', 'zone1')])
            mockNotesByTag.set('zone2', [createMockNote('note2', 'zone2')])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const zone1 = data.zones.find((z) => z.tag === 'zone1')
            const zone2 = data.zones.find((z) => z.tag === 'zone2')

            const villagersInZone1 = data.villagers.filter((v) => v.zoneId === zone1?.id)
            const villagersInZone2 = data.villagers.filter((v) => v.zoneId === zone2?.id)

            expect(villagersInZone1.length).toBe(1)
            expect(villagersInZone2.length).toBe(1)
        })

        test('should include note metadata in villager data', () => {
            mockTopTags.push({ tag: 'test', count: 1 })
            mockNotesByTag.set('test', [createMockNote('TestNote', 'test', 2500)])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data.villagers[0]?.notePath).toBe('notes/TestNote.md')
            expect(data.villagers[0]?.noteName).toBe('TestNote')
            expect(data.villagers[0]?.noteLength).toBe(2500)
        })

        test('should position villagers within zone boundaries', () => {
            mockTopTags.push({ tag: 'test', count: 5 })
            mockNotesByTag.set('test', [
                createMockNote('n1', 'test'),
                createMockNote('n2', 'test'),
                createMockNote('n3', 'test')
            ])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const zone = data.zones[0]
            if (!zone) return

            for (const villager of data.villagers) {
                const x = villager.homePosition.x
                const y = villager.homePosition.y
                const distance = Math.sqrt(x * x + y * y)

                // Should be within zone radius (with some margin for inner/outer padding)
                expect(distance).toBeGreaterThan(zone.innerRadius)
                expect(distance).toBeLessThan(zone.outerRadius)
            }
        })

        test('should assign sprite appearance data', () => {
            mockTopTags.push({ tag: 'test', count: 1 })
            mockNotesByTag.set('test', [createMockNote('note', 'test')])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            expect(data.villagers[0]?.appearance).toBeDefined()
            expect(data.villagers[0]?.appearance.spriteIndex).toBeGreaterThanOrEqual(0)
            expect(data.villagers[0]?.appearance.spriteIndex).toBeLessThanOrEqual(7)
            expect(data.villagers[0]?.appearance.scale).toBe(1)
        })
    })

    describe('structures', () => {
        test('should always include central fountain', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const fountain = data.structures.find(
                (s) => s.type === 'fountain' && s.id === 'fountain-central'
            )
            expect(fountain).toBeDefined()
            expect(fountain?.position).toEqual({ x: 0, y: 0 })
        })

        test('should include benches around plaza', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const benches = data.structures.filter((s) => s.type === 'bench')
            expect(benches.length).toBe(4)
        })

        test('should include zone signs', () => {
            mockTopTags.push({ tag: 'zone1', count: 5 }, { tag: 'zone2', count: 3 })
            mockNotesByTag.set('zone1', [])
            mockNotesByTag.set('zone2', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            const signs = data.structures.filter((s) => s.type === 'sign')
            expect(signs.length).toBe(2)

            // Signs should have labels
            expect(signs.every((s) => s.label)).toBe(true)
        })

        test('should generate houses for some villagers', () => {
            mockTopTags.push({ tag: 'test', count: 10 })
            mockNotesByTag.set(
                'test',
                Array.from({ length: 10 }, (_, i) => createMockNote(`note${i}`, 'test'))
            )

            const generator = new VillageGenerator(mockApp, {
                seed: 'test',
                housesPerVillager: 0.5
            })
            const data = generator.generate()

            const houses = data.structures.filter((s) => s.type === 'house')
            // With 50% probability, should have some but not all
            expect(houses.length).toBeGreaterThan(0)
            expect(houses.length).toBeLessThan(10)
        })

        test('should generate decorations based on density', () => {
            mockTopTags.push({ tag: 'test', count: 10 })
            mockNotesByTag.set('test', [])

            const generator = new VillageGenerator(mockApp, {
                seed: 'test',
                decorationDensity: 0.2
            })
            const data = generator.generate()

            const decorations = data.structures.filter(
                (s) => s.type === 'tree' || s.type === 'fence'
            )
            expect(decorations.length).toBeGreaterThan(0)
        })
    })

    describe('spawn point', () => {
        test('should set spawn point near plaza edge', () => {
            const generator = new VillageGenerator(mockApp, {
                seed: 'test',
                plazaRadius: 100
            })
            const data = generator.generate()

            expect(data.spawnPoint.x).toBe(0)
            expect(data.spawnPoint.y).toBe(150) // plazaRadius + 50
        })
    })

    describe('world size', () => {
        test('should calculate world size based on zone dimensions', () => {
            const generator = new VillageGenerator(mockApp, {
                seed: 'test',
                zoneInnerRadius: 150,
                zoneWidth: 300
            })
            const data = generator.generate()

            // outerRadius = 150 + 300 + 100 = 550
            // worldSize = 550 * 2.5 = 1375
            expect(data.worldSize.width).toBe(1375)
            expect(data.worldSize.height).toBe(1375)
        })
    })
})
