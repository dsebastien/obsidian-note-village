/**
 * Shared Excalibur mocks for tests
 * Import this file in tests that need excalibur mocking
 */

import { mock } from 'bun:test'

// Mock Vector class
export class MockVector {
    constructor(
        public x: number,
        public y: number
    ) {}

    distance(other: MockVector): number {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return Math.sqrt(dx * dx + dy * dy)
    }
}

// Mock Component class
export class MockComponent {
    readonly type: string = 'mock'
}

// Mock Query class
export class MockQuery {
    entities: unknown[] = []

    getEntities(): unknown[] {
        return this.entities
    }
}

// Mock World class
export class MockWorld {
    query(_types: unknown[]): MockQuery {
        return new MockQuery()
    }
}

// Mock System class
export class MockSystem {
    systemType = 'Update'
    query: MockQuery = new MockQuery()

    constructor(_world: MockWorld) {}
}

// Mock Actor class
export class MockActor {
    pos: MockVector
    name: string = ''
    color: unknown = null
    width: number = 0
    height: number = 0
    components = new Map<string, MockComponent>()

    constructor(config?: {
        name?: string
        pos?: MockVector
        color?: unknown
        width?: number
        height?: number
    }) {
        this.pos = config?.pos ?? new MockVector(0, 0)
        this.name = config?.name ?? ''
        this.color = config?.color
        this.width = config?.width ?? 0
        this.height = config?.height ?? 0
    }

    addComponent(component: MockComponent): void {
        this.components.set(component.type, component)
    }

    get<T extends MockComponent>(_ComponentClass: new (...args: unknown[]) => T): T | undefined {
        // Simple implementation - find by type
        for (const comp of this.components.values()) {
            if (comp.type === 'interactable') {
                return comp as T
            }
        }
        return undefined
    }
}

// Define SystemType enum
export const MockSystemType = {
    Update: 'Update',
    Draw: 'Draw'
}

// Setup the mock module - call this before importing any excalibur-dependent modules
export function setupExcaliburMock(): void {
    mock.module('excalibur', () => ({
        Component: MockComponent,
        Vector: MockVector,
        World: MockWorld,
        System: MockSystem,
        SystemType: MockSystemType,
        Query: MockQuery,
        Actor: MockActor,
        Color: { fromHex: () => ({}) }
    }))
}
