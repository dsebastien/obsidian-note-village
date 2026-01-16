import { describe, test, expect, beforeEach } from 'bun:test'
import { SeededRandom } from './seeded-random'

describe('SeededRandom', () => {
    describe('constructor', () => {
        test('should accept numeric seed', () => {
            const rng = new SeededRandom(12345)
            expect(rng.getSeed()).toBe(12345)
        })

        test('should convert string seed to number via hash', () => {
            const rng = new SeededRandom('test-seed')
            expect(typeof rng.getSeed()).toBe('number')
            expect(rng.getSeed()).toBeGreaterThan(0)
        })

        test('should produce same hash for same string', () => {
            const rng1 = new SeededRandom('hello')
            const rng2 = new SeededRandom('hello')
            expect(rng1.getSeed()).toBe(rng2.getSeed())
        })

        test('should produce different hash for different strings', () => {
            const rng1 = new SeededRandom('hello')
            const rng2 = new SeededRandom('world')
            expect(rng1.getSeed()).not.toBe(rng2.getSeed())
        })
    })

    describe('next', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return number between 0 and 1', () => {
            for (let i = 0; i < 100; i++) {
                const val = rng.next()
                expect(val).toBeGreaterThanOrEqual(0)
                expect(val).toBeLessThan(1)
            }
        })

        test('should be deterministic with same seed', () => {
            const rng1 = new SeededRandom(12345)
            const rng2 = new SeededRandom(12345)

            for (let i = 0; i < 50; i++) {
                expect(rng1.next()).toBe(rng2.next())
            }
        })

        test('should produce different sequences for different seeds', () => {
            const rng1 = new SeededRandom(111)
            const rng2 = new SeededRandom(222)

            // At least one of the first 10 values should differ
            let hasDifferent = false
            for (let i = 0; i < 10; i++) {
                if (rng1.next() !== rng2.next()) {
                    hasDifferent = true
                    break
                }
            }
            expect(hasDifferent).toBe(true)
        })

        test('should update internal seed after each call', () => {
            const initialSeed = rng.getSeed()
            rng.next()
            expect(rng.getSeed()).not.toBe(initialSeed)
        })
    })

    describe('nextInt', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return integer within range (inclusive)', () => {
            for (let i = 0; i < 100; i++) {
                const val = rng.nextInt(1, 10)
                expect(Number.isInteger(val)).toBe(true)
                expect(val).toBeGreaterThanOrEqual(1)
                expect(val).toBeLessThanOrEqual(10)
            }
        })

        test('should return single value when min equals max', () => {
            for (let i = 0; i < 10; i++) {
                expect(rng.nextInt(5, 5)).toBe(5)
            }
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(999)
            const rng2 = new SeededRandom(999)

            for (let i = 0; i < 20; i++) {
                expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100))
            }
        })

        test('should handle negative ranges', () => {
            for (let i = 0; i < 50; i++) {
                const val = rng.nextInt(-10, -1)
                expect(val).toBeGreaterThanOrEqual(-10)
                expect(val).toBeLessThanOrEqual(-1)
            }
        })

        test('should handle ranges crossing zero', () => {
            for (let i = 0; i < 50; i++) {
                const val = rng.nextInt(-5, 5)
                expect(val).toBeGreaterThanOrEqual(-5)
                expect(val).toBeLessThanOrEqual(5)
            }
        })
    })

    describe('nextFloat', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return float within range', () => {
            for (let i = 0; i < 100; i++) {
                const val = rng.nextFloat(0, 10)
                expect(val).toBeGreaterThanOrEqual(0)
                expect(val).toBeLessThan(10)
            }
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(777)
            const rng2 = new SeededRandom(777)

            for (let i = 0; i < 20; i++) {
                expect(rng1.nextFloat(0, 100)).toBe(rng2.nextFloat(0, 100))
            }
        })

        test('should handle negative ranges', () => {
            for (let i = 0; i < 50; i++) {
                const val = rng.nextFloat(-10.5, -0.5)
                expect(val).toBeGreaterThanOrEqual(-10.5)
                expect(val).toBeLessThan(-0.5)
            }
        })
    })

    describe('nextBool', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return boolean', () => {
            const val = rng.nextBool()
            expect(typeof val).toBe('boolean')
        })

        test('should respect probability of 0', () => {
            for (let i = 0; i < 50; i++) {
                expect(rng.nextBool(0)).toBe(false)
            }
        })

        test('should respect probability of 1', () => {
            for (let i = 0; i < 50; i++) {
                expect(rng.nextBool(1)).toBe(true)
            }
        })

        test('should use 0.5 as default probability', () => {
            // With enough samples and seed 42, should get mix of true/false
            let trueCount = 0
            for (let i = 0; i < 100; i++) {
                if (rng.nextBool()) trueCount++
            }
            // Should be roughly balanced (not all true or all false)
            expect(trueCount).toBeGreaterThan(20)
            expect(trueCount).toBeLessThan(80)
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(555)
            const rng2 = new SeededRandom(555)

            for (let i = 0; i < 30; i++) {
                expect(rng1.nextBool(0.3)).toBe(rng2.nextBool(0.3))
            }
        })
    })

    describe('pick', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return undefined for empty array', () => {
            expect(rng.pick([])).toBeUndefined()
        })

        test('should return the only element for single-element array', () => {
            expect(rng.pick(['only'])).toBe('only')
        })

        test('should return element from array', () => {
            const arr = ['a', 'b', 'c', 'd', 'e']
            for (let i = 0; i < 20; i++) {
                const picked = rng.pick(arr)
                expect(picked).toBeDefined()
                expect(arr).toContain(picked as string)
            }
        })

        test('should be deterministic', () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            const rng1 = new SeededRandom(123)
            const rng2 = new SeededRandom(123)

            for (let i = 0; i < 20; i++) {
                expect(rng1.pick(arr)).toBe(rng2.pick(arr))
            }
        })

        test('should work with different types', () => {
            const numbers = [1, 2, 3]
            const strings = ['a', 'b', 'c']
            const objects = [{ id: 1 }, { id: 2 }]

            expect(typeof rng.pick(numbers)).toBe('number')
            expect(typeof rng.pick(strings)).toBe('string')
            expect(typeof rng.pick(objects)).toBe('object')
        })
    })

    describe('shuffle', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return same array reference (in-place)', () => {
            const arr = [1, 2, 3, 4, 5]
            const result = rng.shuffle(arr)
            expect(result).toBe(arr)
        })

        test('should contain all original elements', () => {
            const arr = [1, 2, 3, 4, 5]
            const original = [...arr]
            rng.shuffle(arr)

            expect(arr.length).toBe(original.length)
            for (const item of original) {
                expect(arr).toContain(item)
            }
        })

        test('should actually shuffle (change order)', () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            const original = [...arr]
            rng.shuffle(arr)

            // Not every position should match (statistically very unlikely)
            let samePositions = 0
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === original[i]) samePositions++
            }
            expect(samePositions).toBeLessThan(arr.length)
        })

        test('should be deterministic', () => {
            const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

            const rng1 = new SeededRandom(99)
            const rng2 = new SeededRandom(99)

            rng1.shuffle(arr1)
            rng2.shuffle(arr2)

            expect(arr1).toEqual(arr2)
        })

        test('should handle single element array', () => {
            const arr = ['only']
            rng.shuffle(arr)
            expect(arr).toEqual(['only'])
        })

        test('should handle empty array', () => {
            const arr: number[] = []
            rng.shuffle(arr)
            expect(arr).toEqual([])
        })
    })

    describe('nextPointInCircle', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return point within circle', () => {
            const centerX = 100
            const centerY = 200
            const radius = 50

            for (let i = 0; i < 100; i++) {
                const point = rng.nextPointInCircle(centerX, centerY, radius)
                const distance = Math.sqrt(
                    Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
                )
                expect(distance).toBeLessThanOrEqual(radius)
            }
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(42)
            const rng2 = new SeededRandom(42)

            for (let i = 0; i < 10; i++) {
                const p1 = rng1.nextPointInCircle(0, 0, 100)
                const p2 = rng2.nextPointInCircle(0, 0, 100)
                expect(p1.x).toBe(p2.x)
                expect(p1.y).toBe(p2.y)
            }
        })

        test('should handle zero radius', () => {
            const point = rng.nextPointInCircle(50, 50, 0)
            expect(point.x).toBe(50)
            expect(point.y).toBe(50)
        })

        test('should respect center coordinates', () => {
            const points: Array<{ x: number; y: number }> = []
            for (let i = 0; i < 50; i++) {
                points.push(rng.nextPointInCircle(1000, 2000, 10))
            }

            // All points should be near center
            for (const p of points) {
                expect(p.x).toBeGreaterThan(980)
                expect(p.x).toBeLessThan(1020)
                expect(p.y).toBeGreaterThan(1980)
                expect(p.y).toBeLessThan(2020)
            }
        })
    })

    describe('nextPointInRing', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return point within ring (annulus)', () => {
            const centerX = 0
            const centerY = 0
            const innerRadius = 50
            const outerRadius = 100

            for (let i = 0; i < 100; i++) {
                const point = rng.nextPointInRing(centerX, centerY, innerRadius, outerRadius)
                const distance = Math.sqrt(point.x * point.x + point.y * point.y)

                // Should be between inner and outer radius
                expect(distance).toBeGreaterThanOrEqual(innerRadius - 0.001) // Small epsilon for float precision
                expect(distance).toBeLessThanOrEqual(outerRadius + 0.001)
            }
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(42)
            const rng2 = new SeededRandom(42)

            for (let i = 0; i < 10; i++) {
                const p1 = rng1.nextPointInRing(0, 0, 20, 50)
                const p2 = rng2.nextPointInRing(0, 0, 20, 50)
                expect(p1.x).toBe(p2.x)
                expect(p1.y).toBe(p2.y)
            }
        })
    })

    describe('nextPointInWedge', () => {
        let rng: SeededRandom

        beforeEach(() => {
            rng = new SeededRandom(42)
        })

        test('should return point within wedge', () => {
            const centerX = 0
            const centerY = 0
            const innerRadius = 30
            const outerRadius = 80
            const startAngle = 0
            const endAngle = Math.PI / 2 // 90 degrees

            for (let i = 0; i < 100; i++) {
                const point = rng.nextPointInWedge(
                    centerX,
                    centerY,
                    innerRadius,
                    outerRadius,
                    startAngle,
                    endAngle
                )

                const distance = Math.sqrt(point.x * point.x + point.y * point.y)
                const angle = Math.atan2(point.y, point.x)

                // Check distance constraints
                expect(distance).toBeGreaterThanOrEqual(innerRadius - 0.001)
                expect(distance).toBeLessThanOrEqual(outerRadius + 0.001)

                // Check angle constraints (accounting for atan2 range)
                expect(angle).toBeGreaterThanOrEqual(startAngle - 0.001)
                expect(angle).toBeLessThanOrEqual(endAngle + 0.001)
            }
        })

        test('should be deterministic', () => {
            const rng1 = new SeededRandom(42)
            const rng2 = new SeededRandom(42)

            for (let i = 0; i < 10; i++) {
                const p1 = rng1.nextPointInWedge(0, 0, 10, 50, 0, Math.PI)
                const p2 = rng2.nextPointInWedge(0, 0, 10, 50, 0, Math.PI)
                expect(p1.x).toBe(p2.x)
                expect(p1.y).toBe(p2.y)
            }
        })
    })

    describe('getSeed / setSeed', () => {
        test('should get current seed', () => {
            const rng = new SeededRandom(12345)
            expect(rng.getSeed()).toBe(12345)
        })

        test('should set seed to new value', () => {
            const rng = new SeededRandom(100)
            rng.setSeed(200)
            expect(rng.getSeed()).toBe(200)
        })

        test('should allow restoring state', () => {
            const rng = new SeededRandom(42)

            // Generate some values
            rng.next()
            rng.next()

            // Save state
            const savedSeed = rng.getSeed()

            // Generate more values
            const val1 = rng.next()
            const val2 = rng.next()

            // Restore state
            rng.setSeed(savedSeed)

            // Should get same values
            expect(rng.next()).toBe(val1)
            expect(rng.next()).toBe(val2)
        })
    })
})
