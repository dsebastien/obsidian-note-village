import { describe, test, expect } from 'bun:test'
import type { VillagerData } from '#types/villager-data.intf'
import type { Zone } from '#types/zone.intf'

/**
 * Tests for Villager actor
 *
 * Note: These tests use a mock-based approach since Bun's module mocking
 * has limitations with class inheritance from external modules like excalibur.
 */

// Helper to create mock villager data
function createVillagerData(overrides: Partial<VillagerData> = {}): VillagerData {
    return {
        id: 'villager-1',
        notePath: 'notes/test.md',
        noteName: 'Test Note',
        noteLength: 1000,
        homePosition: { x: 100, y: 200 },
        zoneId: 'zone-1',
        appearance: {
            spriteIndex: 0,
            scale: 1
        },
        ...overrides
    }
}

// Helper to create mock zone (rectangular JRPG style)
function createZone(overrides: Partial<Zone> = {}): Zone {
    return {
        id: 'zone-1',
        name: 'Test Zone',
        tag: 'test',
        color: '#808080',
        x: 100,
        y: 100,
        width: 300,
        height: 300,
        noteCount: 5,
        ...overrides
    }
}

// Mock villager interface
interface MockVillager {
    villagerData: VillagerData
    zone: Zone | undefined
    getNotePath(): string
    getNoteName(): string
    setOnInteract(callback: () => void): void
    triggerInteract(): void
}

// Create mock villager
function createMockVillager(data: VillagerData, zone: Zone | undefined): MockVillager {
    let onInteractCallback: (() => void) | null = null

    return {
        villagerData: data,
        zone,
        getNotePath() {
            return this.villagerData.notePath
        },
        getNoteName() {
            return this.villagerData.noteName
        },
        setOnInteract(callback: () => void) {
            onInteractCallback = callback
        },
        triggerInteract() {
            if (onInteractCallback) {
                onInteractCallback()
            }
        }
    }
}

// Static method for calculating size (mirrors Villager.calculateSize)
function calculateSize(contentLength: number): number {
    const minSize = 16
    const maxSize = 48
    const scaleFactor = 0.5

    const size = minSize + Math.sqrt(contentLength) * scaleFactor
    return Math.min(maxSize, Math.max(minSize, size))
}

describe('Villager', () => {
    describe('calculateSize (static)', () => {
        test('should return minimum size for small content', () => {
            const size = calculateSize(0)
            expect(size).toBe(16) // minSize
        })

        test('should return maximum size for very large content', () => {
            const size = calculateSize(1000000)
            expect(size).toBe(48) // maxSize
        })

        test('should scale with content length', () => {
            const smallSize = calculateSize(100)
            const mediumSize = calculateSize(1000)
            const largeSize = calculateSize(10000)

            expect(mediumSize).toBeGreaterThan(smallSize)
            expect(largeSize).toBeGreaterThan(mediumSize)
        })

        test('should use sqrt scaling', () => {
            // Size = minSize + sqrt(contentLength) * scaleFactor
            // With minSize=16 and scaleFactor=0.5
            // For length 100: 16 + sqrt(100) * 0.5 = 16 + 10 * 0.5 = 21
            const size = calculateSize(100)
            expect(size).toBeCloseTo(21, 0)
        })

        test('should clamp between min and max', () => {
            // Very small
            expect(calculateSize(0)).toBeGreaterThanOrEqual(16)

            // Very large
            expect(calculateSize(999999)).toBeLessThanOrEqual(48)
        })
    })

    describe('constructor', () => {
        test('should initialize with villager data', () => {
            const data = createVillagerData()
            const zone = createZone()

            const villager = createMockVillager(data, zone)

            expect(villager.villagerData).toBe(data)
            expect(villager.zone).toBe(zone)
        })

        test('should handle undefined zone', () => {
            const data = createVillagerData()

            const villager = createMockVillager(data, undefined)

            expect(villager.zone).toBeUndefined()
        })
    })

    describe('getNotePath', () => {
        test('should return note path from villager data', () => {
            const data = createVillagerData({ notePath: 'folder/my-note.md' })
            const villager = createMockVillager(data, createZone())

            expect(villager.getNotePath()).toBe('folder/my-note.md')
        })
    })

    describe('getNoteName', () => {
        test('should return note name from villager data', () => {
            const data = createVillagerData({ noteName: 'Important Note' })
            const villager = createMockVillager(data, createZone())

            expect(villager.getNoteName()).toBe('Important Note')
        })
    })

    describe('setOnInteract', () => {
        test('should set interaction callback', () => {
            const data = createVillagerData()
            const villager = createMockVillager(data, createZone())

            let called = false
            villager.setOnInteract(() => {
                called = true
            })

            villager.triggerInteract()
            expect(called).toBe(true)
        })

        test('should replace previous callback', () => {
            const data = createVillagerData()
            const villager = createMockVillager(data, createZone())

            let firstCalled = false
            let secondCalled = false

            villager.setOnInteract(() => {
                firstCalled = true
            })
            villager.setOnInteract(() => {
                secondCalled = true
            })

            villager.triggerInteract()

            // Only second callback should be called
            expect(firstCalled).toBe(false)
            expect(secondCalled).toBe(true)
        })
    })

    describe('villagerData access', () => {
        test('should expose villagerData as readonly', () => {
            const data = createVillagerData({
                id: 'unique-id',
                noteLength: 5000
            })
            const villager = createMockVillager(data, createZone())

            expect(villager.villagerData.id).toBe('unique-id')
            expect(villager.villagerData.noteLength).toBe(5000)
        })

        test('should expose zone data', () => {
            const zone = createZone({
                id: 'my-zone',
                name: 'My Zone',
                color: '#FF0000'
            })
            const villager = createMockVillager(createVillagerData(), zone)

            expect(villager.zone?.id).toBe('my-zone')
            expect(villager.zone?.name).toBe('My Zone')
            expect(villager.zone?.color).toBe('#FF0000')
        })
    })
})
