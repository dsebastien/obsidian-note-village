# Village Decoration Plan

A comprehensive plan to enhance the Note Village with decorative elements, environmental details, and ambient features for a more immersive JRPG experience.

---

## Current State

**Existing visual elements:**

- Grid-based village with zone tiles (stone pavement)
- Central plaza with fountain and benches
- Houses scattered in zones
- Forest border (dense trees as world boundary)
- Cobblestone roads between zones
- Zone signs with labels
- Animated villagers and player

**What's missing:**

- Environmental variety (flowers, bushes, rocks)
- Ambient life (birds, butterflies)
- Zone-themed decorations
- Dynamic effects (water, smoke, particles)
- Atmospheric elements (clouds, lighting)

---

## Decoration Categories

### 1. Static Decorations (Structures)

New structure types to add to the existing system:

| Structure    | Size  | Placement               | Blocking | Description                     |
| ------------ | ----- | ----------------------- | -------- | ------------------------------- |
| Flower bed   | 24x16 | Zones, plaza edges      | No       | Colorful flower clusters        |
| Bush         | 20x18 | Zone edges, near houses | No       | Small shrubs                    |
| Well         | 32x32 | Random zones            | Yes      | Stone well with roof            |
| Lamp post    | 16x40 | Roads, plaza corners    | No       | Street lighting                 |
| Barrel       | 16x20 | Near houses             | No       | Wooden storage barrel           |
| Crate        | 16x16 | Near houses             | No       | Wooden supply crate             |
| Market stall | 48x32 | Larger zones            | No       | Open-air vendor booth           |
| Wagon        | 40x24 | Road edges              | No       | Parked cart                     |
| Statue       | 24x40 | Plaza, zone centers     | No       | Stone hero/creature statue      |
| Bird bath    | 20x24 | Gardens                 | No       | Decorative water basin          |
| Rock         | 16x12 | Random, zone edges      | No       | Natural boulder                 |
| Tall grass   | 24x16 | Zone edges, near forest | No       | Swaying grass clumps            |
| Pond         | 64x48 | Open areas              | No       | Small water body with lily pads |
| Bridge       | 32x24 | Over ponds              | No       | Wooden footbridge               |
| Windmill     | 48x64 | Zone edges              | Yes      | Animated spinning blades        |
| Scarecrow    | 24x40 | Farm-themed zones       | No       | Friendly scarecrow              |
| Picnic table | 32x24 | Park areas              | No       | Table with benches              |

### 2. Zone Entrance Features

**Entrance Arches:**

- Decorative archways at zone entrances
- Zone name displayed on arch
- Zone-colored accents
- Placement: where roads meet zone edges

**Corner Posts:**

- Decorative posts at zone corners
- Stone or wooden pillars
- Zone-colored flags or banners

### 3. Animated Decorations

**Fountain Enhancement:**

- Animated water spray particles
- Ripple effect on water surface
- 3-4 frame animation loop

**Chimney Smoke:**

- Smoke particles rising from houses
- Slow upward drift with slight randomness
- Semi-transparent gray puffs

**Windmill Blades:**

- Rotating blade animation
- Slow continuous rotation
- 8 frames for smooth motion

**Swaying Elements:**

- Tall grass swaying in wind
- Tree leaves rustling
- Banner/flag fluttering
- 2-3 frame subtle animation

### 4. Ambient Creatures

**Birds:**

- Small pixel birds (8x8)
- Flying patterns across the sky
- Occasionally landing on roofs/trees
- 2-3 bird types with color variants

**Butterflies:**

- Tiny butterflies (6x6) near flowers
- Flutter around flower beds
- Random slow movement patterns
- 4-5 color variants

**Fish:**

- Visible in ponds
- Simple jumping animation
- Ripple effect on water

### 5. Particle Effects

**Falling Leaves (Autumn Mode):**

- Leaves drifting from trees
- Brown/orange/red colors
- Slow zigzag fall pattern

**Fireflies (Night Mode):**

- Glowing dots appearing at dusk
- Slow random movement
- Yellow/green glow

**Dust Motes:**

- Subtle particles in sunbeams
- Very slow drift
- Near-transparent

### 6. Atmospheric Elements

**Sky Layer:**

- Clouds slowly moving across
- Day/night color gradient
- Sun/moon position indicator

**Weather Effects (Future):**

- Rain particles
- Snow falling
- Fog overlay
- Puddles on ground after rain

**Lighting (Future):**

- Day/night cycle
- Warm lamp glow at night
- Window lights in houses

---

## Implementation Phases

### Phase 1: Core Static Decorations

**Goal:** Add variety of static decorations using existing structure system.

**Tasks:**

1. Add new structure types to `StructureType` enum
2. Create pixel art sprites for each decoration type:
    - Flower beds (3 color variants)
    - Bushes (2 variants)
    - Rocks (3 sizes)
    - Barrels and crates
    - Tall grass clumps
3. Update `SpriteManager` with new sprite generation
4. Update `VillageGenerator` with decoration placement logic:
    - Scatter decorations within zones (weighted random)
    - Place flowers near houses
    - Add rocks/grass at zone edges
    - Add barrels/crates near houses
5. Update `VillageScene` to render new structures
6. Add decoration density setting to plugin settings

**New Files:**

- None (extend existing files)

**Modified Files:**

- `src/game/graphics/pixel-art-generator.ts` - new sprite functions
- `src/game/graphics/sprite-manager.ts` - new sprite types
- `src/game/world/village-generator.ts` - decoration placement
- `src/schemas/structure-data.schema.ts` - new structure types

### Phase 2: Larger Decorations

**Goal:** Add more substantial decorative structures.

**Tasks:**

1. Create sprites for:
    - Wells
    - Market stalls
    - Wagons/carts
    - Statues
    - Lamp posts
    - Picnic tables
    - Bird baths
2. Add placement rules:
    - Wells: max 1 per zone, larger zones only
    - Market stalls: zones with many notes
    - Statues: plaza and large zone centers
    - Lamp posts: along roads and plaza corners
3. Implement blocking collision for wells

### Phase 3: Water Features

**Goal:** Add ponds and water elements.

**Tasks:**

1. Create pond sprite with:
    - Water base (animated shimmer)
    - Lily pads
    - Reeds at edges
2. Create small bridge sprite
3. Add pond placement logic:
    - Open areas away from roads
    - Max 1-2 per village
    - Bridge connects if near walkway
4. Optional: Add fish jumping animation

### Phase 4: Zone Entrances

**Goal:** Add visual markers at zone boundaries.

**Tasks:**

1. Create entrance arch sprite (zone-colored)
2. Create corner post sprites
3. Detect zone entrance points (where roads meet zones)
4. Place arches at entrances
5. Place corner posts at zone vertices

### Phase 5: Animated Elements

**Goal:** Add life to static decorations.

**Tasks:**

1. Create fountain water animation:
    - Water particle sprites
    - Spawn particles above fountain
    - Arc trajectory with gravity
    - Fade out on landing
2. Create chimney smoke effect:
    - Smoke puff sprites (3 frames)
    - Spawn above house roofs
    - Slow upward drift with random X offset
    - Fade out at height
3. Create swaying grass animation:
    - 2-3 frame animation
    - Wind direction consistency
    - Random phase offsets
4. Create windmill structure with animated blades

**New Files:**

- `src/game/particles/particle-system.ts` - particle management
- `src/game/particles/particle-emitter.ts` - spawn and update particles
- `src/game/particles/effects/` - specific effect definitions

### Phase 6: Ambient Creatures

**Goal:** Add living creatures that move around the village.

**Tasks:**

1. Create bird system:
    - Bird sprites (3 types, 4 directions)
    - Flying animation (2 frames)
    - Perching animation
    - State machine: flying, perching, taking off
    - Flight paths across village
    - Land on trees, roofs, ground
2. Create butterfly system:
    - Tiny butterfly sprites (4 colors)
    - Flutter animation
    - Stay near flower beds
    - Slow random movement
3. Add creature count to settings (0-50)

**New Files:**

- `src/game/actors/ambient/bird.actor.ts`
- `src/game/actors/ambient/butterfly.actor.ts`
- `src/game/systems/ambient-creature.system.ts`

### Phase 7: Atmospheric Layer

**Goal:** Add sky and atmospheric effects.

**Tasks:**

1. Create sky background layer:
    - Gradient sky color
    - Cloud sprites (2-3 sizes)
    - Slow horizontal cloud movement
    - Parallax effect (clouds move slower than ground)
2. Add sun/moon indicator
3. Optional: simple day/night cycle (visual only)

**New Files:**

- `src/game/layers/sky-layer.ts`
- `src/game/layers/cloud.ts`

### Phase 8: Settings & Polish

**Goal:** User control and performance optimization.

**Tasks:**

1. Add decoration settings:
    - Decoration density (none, sparse, normal, dense)
    - Enable/disable ambient creatures
    - Enable/disable particles
    - Enable/disable sky layer
2. Performance optimizations:
    - Cull off-screen particles
    - Pool particle objects
    - Reduce creature count on low quality
3. Add decoration variety based on zone tags:
    - Detect theme keywords (garden, tech, book, etc.)
    - Apply themed decorations

---

## Sprite Design Guidelines

**Pixel Dimensions:**

- Small decorations: 16x16 or 24x16
- Medium decorations: 32x32 or 48x32
- Large decorations: 48x48 or 64x48
- Creatures: 8x8 (birds), 6x6 (butterflies)
- Particles: 4x4 to 8x8

**Color Palette:**

- Use existing village palette
- Decorations should blend with zone colors
- Flowers: bright accent colors (red, yellow, purple, pink)
- Rocks: gray/brown tones
- Water: blue with white highlights

**Style Consistency:**

- Match existing 16-bit JRPG aesthetic
- Black outline on sprites (1px)
- Limited color palette per sprite (4-8 colors)
- Subtle dithering for gradients

---

## Settings Schema Additions

```typescript
// New decoration settings
decorationDensity: z.enum(['none', 'sparse', 'normal', 'dense']).default('normal')
enableAmbientCreatures: z.boolean().default(true)
ambientCreatureCount: z.number().min(0).max(50).default(20)
enableParticleEffects: z.boolean().default(true)
enableSkyLayer: z.boolean().default(true)
enableAnimatedDecorations: z.boolean().default(true)
```

---

## Performance Considerations

1. **Object pooling** for particles and creatures
2. **Culling** decorations outside camera viewport
3. **Quality scaling:**
    - LOW: no particles, no creatures, sparse decorations
    - MEDIUM: reduced particles, fewer creatures
    - HIGH: full effects
4. **Lazy loading** decorations as zones come into view
5. **Sprite caching** (already implemented in SpriteManager)

---

## Dependencies

- None (uses existing Excalibur.js features)
- All sprites generated procedurally (no external assets)

---

## Success Metrics

- Village feels alive and detailed
- No performance degradation on normal hardware
- User can customize decoration level
- Decorations enhance rather than distract from gameplay
