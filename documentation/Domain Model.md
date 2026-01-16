# Domain Model

## Core Entities

### Zone

Represents a themed area of the village based on a tag.

```typescript
{
    id: string
    name: string // Human-readable (e.g., "Personal Notes")
    tag: string // Original tag (e.g., "personal-notes")
    color: string // Hex color for zone
    startAngle: number // Wedge start (radians)
    endAngle: number // Wedge end (radians)
    innerRadius: number
    outerRadius: number
    noteCount: number // Notes in this zone
}
```

### VillagerData

Represents a note as a villager NPC.

```typescript
{
    id: string
    notePath: string // Path to the note file
    noteName: string // Note basename
    noteLength: number // Content length (affects size)
    homePosition: Vector2D // Spawn/home location
    zoneId: string // Which zone they belong to
    appearance: VillagerAppearance
}
```

### StructureData

Represents buildings and decorations.

```typescript
{
    id: string
    type: 'house' | 'sign' | 'tree' | 'fence' | 'fountain' | 'bench'
    position: Vector2D
    zoneId?: string   // Optional zone association
    label?: string    // For signs
}
```

### VillageData

Complete village state.

```typescript
{
    seed: string
    zones: Zone[]
    villagers: VillagerData[]
    structures: StructureData[]
    spawnPoint: Vector2D
    worldSize: { width: number, height: number }
}
```

## Relationships

```
Vault
  └── Tags → Zones (top N tags become zones)
  └── Notes → Villagers (notes with zone tags)

Village
  ├── Central Plaza
  │     └── Fountain, Benches
  └── Zones (radial wedges)
        ├── Sign at entrance
        ├── Villagers (from notes)
        ├── Houses (some villagers)
        └── Decorations (trees, fences)
```

## Sizing Rules

Villager size based on note content length:

- Minimum: 16px (short notes < 500 chars)
- Maximum: 48px (long notes > 2000 chars)
- Formula: `min(48, max(16, 16 + sqrt(length) * 0.5))`

## Zone Distribution

Zone wedge angle proportional to note count:

- Minimum angle: 20° per zone
- If no notes, equal distribution
