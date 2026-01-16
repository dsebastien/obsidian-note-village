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
        setExcludedFolders(_folders: string[]): void {
            // Mock implementation
        }
        getTopTags(_count: number): TagCount[] {
            return mockTopTags
        }
    }
}))

mock.module('../../vault/note-scanner', () => ({
    NoteScanner: class MockNoteScanner {
        setExcludedFolders(_folders: string[]): void {
            // Mock implementation
        }
        getNotesGroupedByTag(_tags: string[]): Map<string, ScannedNote[]> {
            return mockNotesByTag
        }
    }
}))

// Import after mocking
const { VillageGenerator } = await import('./village-generator')

// Helper to create mock ScannedNote
function createMockNote(
    name: string,
    tag: string,
    size = 1000,
    modifiedTime?: number,
    updated?: number
): ScannedNote {
    return {
        file: { path: `notes/${name}.md` } as TFile,
        path: `notes/${name}.md`,
        name,
        tags: [tag],
        primaryTag: tag,
        contentLength: size,
        createdTime: Date.now(),
        modifiedTime: modifiedTime ?? Date.now(),
        updated
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

        test('should create rectangular zones in grid layout', () => {
            mockTopTags.push({ tag: 'large', count: 20 }, { tag: 'small', count: 5 })
            mockNotesByTag.set('large', [])
            mockNotesByTag.set('small', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // All zones should have rectangular bounds
            for (const zone of data.zones) {
                expect(zone.x).toBeDefined()
                expect(zone.y).toBeDefined()
                expect(zone.width).toBeGreaterThan(0)
                expect(zone.height).toBeGreaterThan(0)
            }
        })

        test('should position zones in a grid pattern', () => {
            mockTopTags.push(
                { tag: 'zone1', count: 10 },
                { tag: 'zone2', count: 10 },
                { tag: 'zone3', count: 10 }
            )
            mockNotesByTag.set('zone1', [])
            mockNotesByTag.set('zone2', [])
            mockNotesByTag.set('zone3', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // Zones should be positioned at different grid cells
            const positions = data.zones.map((z) => ({ x: z.x, y: z.y }))
            const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`))

            // Each zone should have a unique position
            expect(uniquePositions.size).toBe(positions.length)
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

                // Should be within rectangular zone bounds (with padding)
                expect(x).toBeGreaterThanOrEqual(zone.x)
                expect(x).toBeLessThanOrEqual(zone.x + zone.width)
                expect(y).toBeGreaterThanOrEqual(zone.y)
                expect(y).toBeLessThanOrEqual(zone.y + zone.height)
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

    describe('villager distribution (weighted round-robin)', () => {
        test('should distribute villagers proportionally across zones', () => {
            // Zone1 has 10 notes, Zone2 has 5 notes, Zone3 has 5 notes
            // With maxVillagers=10 and total 20 notes:
            // Zone1 should get ~50% (5), Zone2 ~25% (2-3), Zone3 ~25% (2-3)
            mockTopTags.push(
                { tag: 'zone1', count: 10 },
                { tag: 'zone2', count: 5 },
                { tag: 'zone3', count: 5 }
            )
            mockNotesByTag.set(
                'zone1',
                Array.from({ length: 10 }, (_, i) => createMockNote(`z1-note${i}`, 'zone1'))
            )
            mockNotesByTag.set(
                'zone2',
                Array.from({ length: 5 }, (_, i) => createMockNote(`z2-note${i}`, 'zone2'))
            )
            mockNotesByTag.set(
                'zone3',
                Array.from({ length: 5 }, (_, i) => createMockNote(`z3-note${i}`, 'zone3'))
            )

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 10 })
            const data = generator.generate()

            const zone1 = data.zones.find((z) => z.tag === 'zone1')
            const zone2 = data.zones.find((z) => z.tag === 'zone2')
            const zone3 = data.zones.find((z) => z.tag === 'zone3')

            const villagersInZone1 = data.villagers.filter((v) => v.zoneId === zone1?.id)
            const villagersInZone2 = data.villagers.filter((v) => v.zoneId === zone2?.id)
            const villagersInZone3 = data.villagers.filter((v) => v.zoneId === zone3?.id)

            expect(data.villagers.length).toBe(10)
            // Zone1 should have more villagers than Zone2 and Zone3
            expect(villagersInZone1.length).toBeGreaterThan(villagersInZone2.length)
            expect(villagersInZone1.length).toBeGreaterThan(villagersInZone3.length)
            // All zones should have at least some villagers
            expect(villagersInZone1.length).toBeGreaterThan(0)
            expect(villagersInZone2.length).toBeGreaterThan(0)
            expect(villagersInZone3.length).toBeGreaterThan(0)
        })

        test('should prioritize older notes (by modifiedTime when updated is absent)', () => {
            const oldTime = Date.now() - 1000000
            const newTime = Date.now()

            mockTopTags.push({ tag: 'test', count: 20 })
            // Create 20 notes with different modification times
            // Only the 10 oldest should become villagers
            const notes = []
            for (let i = 0; i < 10; i++) {
                notes.push(createMockNote(`oldest${i}`, 'test', 1000, oldTime - (10 - i) * 1000))
            }
            for (let i = 0; i < 10; i++) {
                notes.push(createMockNote(`newest${i}`, 'test', 1000, newTime + i * 1000))
            }
            mockNotesByTag.set('test', notes)

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 10 })
            const data = generator.generate()

            expect(data.villagers.length).toBe(10)
            const villagerNames = data.villagers.map((v) => v.noteName)
            // Should have the oldest notes
            for (let i = 0; i < 10; i++) {
                expect(villagerNames).toContain(`oldest${i}`)
            }
            // Should NOT have the newest notes
            for (let i = 0; i < 10; i++) {
                expect(villagerNames).not.toContain(`newest${i}`)
            }
        })

        test('should use updated property over modifiedTime when available', () => {
            const baseTime = Date.now()

            mockTopTags.push({ tag: 'test', count: 20 })
            // Create notes with various updated/modifiedTime combinations
            // Notes with older "updated" should be prioritized
            const notes = [
                // These should be selected (old updated values)
                createMockNote('veryOldUpdated', 'test', 1000, baseTime, baseTime - 50000), // new mtime, very old updated
                createMockNote('oldUpdated1', 'test', 1000, baseTime, baseTime - 40000),
                createMockNote('oldUpdated2', 'test', 1000, baseTime, baseTime - 35000),
                createMockNote('oldUpdated3', 'test', 1000, baseTime, baseTime - 30000),
                createMockNote('oldUpdated4', 'test', 1000, baseTime, baseTime - 25000),
                createMockNote('noUpdated1', 'test', 1000, baseTime - 20000), // falls back to mtime
                createMockNote('noUpdated2', 'test', 1000, baseTime - 18000),
                createMockNote('noUpdated3', 'test', 1000, baseTime - 16000),
                createMockNote('noUpdated4', 'test', 1000, baseTime - 14000),
                createMockNote('noUpdated5', 'test', 1000, baseTime - 12000),
                // These should NOT be selected (recent updated values)
                createMockNote('recentUpdated1', 'test', 1000, baseTime - 50000, baseTime - 5000), // old mtime, recent updated
                createMockNote('recentUpdated2', 'test', 1000, baseTime - 50000, baseTime - 4000),
                createMockNote('recentUpdated3', 'test', 1000, baseTime - 50000, baseTime - 3000),
                createMockNote('recentUpdated4', 'test', 1000, baseTime - 50000, baseTime - 2000),
                createMockNote('recentUpdated5', 'test', 1000, baseTime - 50000, baseTime - 1000),
                createMockNote('noUpdatedRecent1', 'test', 1000, baseTime - 1000),
                createMockNote('noUpdatedRecent2', 'test', 1000, baseTime - 800),
                createMockNote('noUpdatedRecent3', 'test', 1000, baseTime - 600),
                createMockNote('noUpdatedRecent4', 'test', 1000, baseTime - 400),
                createMockNote('noUpdatedRecent5', 'test', 1000, baseTime - 200)
            ]
            mockNotesByTag.set('test', notes)

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 10 })
            const data = generator.generate()

            expect(data.villagers.length).toBe(10)
            const villagerNames = data.villagers.map((v) => v.noteName)
            // Should prioritize by updated, falling back to modifiedTime
            // veryOldUpdated has oldest updated, then oldUpdated1-4, then noUpdated1-5
            expect(villagerNames).toContain('veryOldUpdated')
            expect(villagerNames).toContain('oldUpdated1')
            // Should NOT have recentUpdated notes despite their old mtime
            expect(villagerNames).not.toContain('recentUpdated1')
            expect(villagerNames).not.toContain('recentUpdated5')
        })

        test('should redistribute remaining capacity to zones with available notes', () => {
            // Zone1 has only 3 notes, Zone2 has 20 notes
            // With maxVillagers=12, Zone1's proportional share is ~2 but it has 3 notes
            // Zone2's proportional share is ~10
            mockTopTags.push({ tag: 'zone1', count: 3 }, { tag: 'zone2', count: 20 })
            mockNotesByTag.set('zone1', [
                createMockNote('z1-note1', 'zone1'),
                createMockNote('z1-note2', 'zone1'),
                createMockNote('z1-note3', 'zone1')
            ])
            mockNotesByTag.set(
                'zone2',
                Array.from({ length: 20 }, (_, i) => createMockNote(`z2-note${i}`, 'zone2'))
            )

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 12 })
            const data = generator.generate()

            const zone1 = data.zones.find((z) => z.tag === 'zone1')
            const zone2 = data.zones.find((z) => z.tag === 'zone2')

            const villagersInZone1 = data.villagers.filter((v) => v.zoneId === zone1?.id)
            const villagersInZone2 = data.villagers.filter((v) => v.zoneId === zone2?.id)

            expect(data.villagers.length).toBe(12)
            // Both zones should have villagers
            expect(villagersInZone1.length).toBeGreaterThan(0)
            expect(villagersInZone2.length).toBeGreaterThan(0)
            // Zone2 has more notes, so it gets more villagers
            expect(villagersInZone2.length).toBeGreaterThan(villagersInZone1.length)
        })

        test('should handle zone with zero notes', () => {
            mockTopTags.push(
                { tag: 'hasNotes', count: 15 },
                { tag: 'emptyZone', count: 0 } // Zone with no notes
            )
            mockNotesByTag.set(
                'hasNotes',
                Array.from({ length: 15 }, (_, i) => createMockNote(`note${i}`, 'hasNotes'))
            )
            mockNotesByTag.set('emptyZone', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 10 })
            const data = generator.generate()

            const emptyZone = data.zones.find((z) => z.tag === 'emptyZone')
            const villagersInEmptyZone = data.villagers.filter((v) => v.zoneId === emptyZone?.id)

            // Empty zone should have 0 villagers
            expect(villagersInEmptyZone.length).toBe(0)
            // All villagers should be in the other zone
            expect(data.villagers.length).toBe(10)
        })

        test('should create all villagers when maxVillagers exceeds total notes', () => {
            mockTopTags.push({ tag: 'zone1', count: 2 }, { tag: 'zone2', count: 3 })
            mockNotesByTag.set('zone1', [
                createMockNote('z1-note1', 'zone1'),
                createMockNote('z1-note2', 'zone1')
            ])
            mockNotesByTag.set('zone2', [
                createMockNote('z2-note1', 'zone2'),
                createMockNote('z2-note2', 'zone2'),
                createMockNote('z2-note3', 'zone2')
            ])

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 100 })
            const data = generator.generate()

            // All 5 notes become villagers
            expect(data.villagers.length).toBe(5)
        })

        test('should return empty array when no notes exist', () => {
            mockTopTags.push({ tag: 'empty', count: 0 })
            mockNotesByTag.set('empty', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 10 })
            const data = generator.generate()

            expect(data.villagers.length).toBe(0)
        })

        test('should distribute evenly when all zones have same proportion', () => {
            // 3 zones with equal notes
            mockTopTags.push(
                { tag: 'zone1', count: 10 },
                { tag: 'zone2', count: 10 },
                { tag: 'zone3', count: 10 }
            )
            mockNotesByTag.set(
                'zone1',
                Array.from({ length: 10 }, (_, i) => createMockNote(`z1-note${i}`, 'zone1'))
            )
            mockNotesByTag.set(
                'zone2',
                Array.from({ length: 10 }, (_, i) => createMockNote(`z2-note${i}`, 'zone2'))
            )
            mockNotesByTag.set(
                'zone3',
                Array.from({ length: 10 }, (_, i) => createMockNote(`z3-note${i}`, 'zone3'))
            )

            const generator = new VillageGenerator(mockApp, { seed: 'test', maxVillagers: 12 })
            const data = generator.generate()

            const zone1 = data.zones.find((z) => z.tag === 'zone1')
            const zone2 = data.zones.find((z) => z.tag === 'zone2')
            const zone3 = data.zones.find((z) => z.tag === 'zone3')

            const villagersInZone1 = data.villagers.filter((v) => v.zoneId === zone1?.id)
            const villagersInZone2 = data.villagers.filter((v) => v.zoneId === zone2?.id)
            const villagersInZone3 = data.villagers.filter((v) => v.zoneId === zone3?.id)

            expect(data.villagers.length).toBe(12)
            // Each zone should have exactly 4 villagers (equal distribution)
            expect(villagersInZone1.length).toBe(4)
            expect(villagersInZone2.length).toBe(4)
            expect(villagersInZone3.length).toBe(4)
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
            // Fountain is in the plaza (center of the grid)
            expect(fountain?.position.x).toBeGreaterThan(0)
            expect(fountain?.position.y).toBeGreaterThan(0)
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
        test('should set spawn point at center of world', () => {
            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // Spawn point should be at center of the world (plaza area)
            expect(data.spawnPoint.x).toBe(data.worldSize.width / 2)
            expect(data.spawnPoint.y).toBe(data.worldSize.height / 2)
        })
    })

    describe('world size', () => {
        test('should calculate world size based on grid dimensions', () => {
            mockTopTags.push(
                { tag: 'zone1', count: 10 },
                { tag: 'zone2', count: 10 },
                { tag: 'zone3', count: 10 }
            )
            mockNotesByTag.set('zone1', [])
            mockNotesByTag.set('zone2', [])
            mockNotesByTag.set('zone3', [])

            const generator = new VillageGenerator(mockApp, { seed: 'test' })
            const data = generator.generate()

            // World size should be positive and large enough to contain all zones
            expect(data.worldSize.width).toBeGreaterThan(0)
            expect(data.worldSize.height).toBeGreaterThan(0)

            // All zones should fit within world bounds
            for (const zone of data.zones) {
                expect(zone.x + zone.width).toBeLessThanOrEqual(data.worldSize.width)
                expect(zone.y + zone.height).toBeLessThanOrEqual(data.worldSize.height)
            }
        })
    })
})
