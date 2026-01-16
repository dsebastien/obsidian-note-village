/**
 * Simple seeded pseudo-random number generator
 * Uses a simple LCG (Linear Congruential Generator)
 */
export class SeededRandom {
    private seed: number

    constructor(seed: string | number) {
        this.seed = typeof seed === 'string' ? this.hashString(seed) : seed
    }

    /**
     * Hash a string to a number for seeding
     */
    private hashString(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
    }

    /**
     * Get the next random number between 0 and 1
     */
    next(): number {
        // LCG constants (same as java.util.Random)
        const a = 1103515245
        const c = 12345
        const m = Math.pow(2, 31)
        this.seed = (a * this.seed + c) % m
        return this.seed / m
    }

    /**
     * Get a random integer between min and max (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    /**
     * Get a random float between min and max
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min
    }

    /**
     * Get a random boolean with given probability of being true
     */
    nextBool(probability = 0.5): boolean {
        return this.next() < probability
    }

    /**
     * Pick a random element from an array
     */
    pick<T>(array: T[]): T | undefined {
        if (array.length === 0) return undefined
        return array[this.nextInt(0, array.length - 1)]
    }

    /**
     * Shuffle an array in place
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i)
            const temp = array[i]
            const jElement = array[j]
            if (temp !== undefined && jElement !== undefined) {
                array[i] = jElement
                array[j] = temp
            }
        }
        return array
    }

    /**
     * Get a random point within a circle
     */
    nextPointInCircle(centerX: number, centerY: number, radius: number): { x: number; y: number } {
        const angle = this.next() * Math.PI * 2
        const r = Math.sqrt(this.next()) * radius
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        }
    }

    /**
     * Get a random point within a ring (annulus)
     */
    nextPointInRing(
        centerX: number,
        centerY: number,
        innerRadius: number,
        outerRadius: number
    ): { x: number; y: number } {
        const angle = this.next() * Math.PI * 2
        const r = Math.sqrt(
            this.next() * (outerRadius * outerRadius - innerRadius * innerRadius) +
                innerRadius * innerRadius
        )
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        }
    }

    /**
     * Get a random point within a wedge (sector of ring)
     */
    nextPointInWedge(
        centerX: number,
        centerY: number,
        innerRadius: number,
        outerRadius: number,
        startAngle: number,
        endAngle: number
    ): { x: number; y: number } {
        const angle = this.nextFloat(startAngle, endAngle)
        const r = Math.sqrt(
            this.next() * (outerRadius * outerRadius - innerRadius * innerRadius) +
                innerRadius * innerRadius
        )
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        }
    }

    /**
     * Get a random point within a rectangle
     */
    nextPointInRect(
        x: number,
        y: number,
        width: number,
        height: number,
        padding = 0
    ): { x: number; y: number } {
        return {
            x: this.nextFloat(x + padding, x + width - padding),
            y: this.nextFloat(y + padding, y + height - padding)
        }
    }

    /**
     * Get current seed (for saving/restoring state)
     */
    getSeed(): number {
        return this.seed
    }

    /**
     * Set seed (for restoring state)
     */
    setSeed(seed: number): void {
        this.seed = seed
    }
}
