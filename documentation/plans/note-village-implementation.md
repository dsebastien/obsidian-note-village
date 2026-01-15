# Note Village Plugin - Implementation Plan

## Overview

A 2D pixel art village game view for Obsidian where notes become villagers. Players explore the village, interact with villagers (notes), and have AI-powered conversations using Claude.

**Game Library:** [Excalibur.js](https://excaliburjs.com/) - TypeScript-first 2D game engine

---

## Why Excalibur

- **TypeScript-native**: Built from ground up in TypeScript with excellent type definitions
- **Beginner-friendly**: Clean, intuitive API with good documentation
- **Built-in features**: Actors, Scenes, Input, Camera, Animations, TileMaps, Collisions
- **Active development**: Regular updates, responsive community
- **Small footprint**: ~200KB gzipped, suitable for Obsidian plugin

---

## Architecture

### File Structure

```
src/
├── main.ts                           # Plugin entry (minimal)
├── app/
│   ├── plugin.ts                     # Plugin lifecycle, register view/commands
│   ├── settings/
│   │   └── settings-tab.ts           # Settings UI
│   └── types/
│       └── plugin-settings.intf.ts   # Settings interface
├── game/
│   ├── village-game.ts               # Excalibur Engine wrapper + initialization
│   ├── scenes/
│   │   └── village-scene.ts          # Main game scene (extends ex.Scene)
│   ├── actors/
│   │   ├── villager.actor.ts         # NPC villager (extends ex.Actor)
│   │   ├── player.actor.ts           # Player character (extends ex.Actor)
│   │   ├── house.actor.ts            # House structure (extends ex.Actor)
│   │   ├── sign.actor.ts             # Zone sign (extends ex.Actor)
│   │   └── decoration.actor.ts       # Trees, fences, etc. (extends ex.Actor)
│   ├── components/                   # Excalibur ECS components
│   │   ├── note-link.component.ts    # Links actor to Obsidian TFile
│   │   ├── wanderer.component.ts     # Wandering behavior within radius
│   │   └── interactable.component.ts # Click/proximity interaction
│   ├── systems/                      # Excalibur ECS systems
│   │   ├── wander.system.ts          # Processes wandering behaviors
│   │   └── interaction.system.ts     # Handles player-villager interactions
│   ├── world/
│   │   ├── village-generator.ts      # Procedural village generation
│   │   ├── zone.ts                   # Zone/district data structures
│   │   └── pathfinding.ts            # A* pathfinding utilities
│   ├── resources/
│   │   ├── sprite-sheets.ts          # Load and configure sprite sheets
│   │   └── animations.ts             # Animation definitions
│   └── utils/
│       └── seeded-random.ts          # Deterministic random generation
├── ui/
│   ├── village-view.ts               # Obsidian ItemView (hosts Excalibur canvas)
│   ├── overlays/
│   │   ├── minimap.ts                # HTML minimap overlay
│   │   ├── zone-nav.ts               # Zone quick-travel dropdown
│   │   └── villager-search.ts        # Note/villager search modal
│   ├── chat/
│   │   ├── chat-panel.ts             # Side panel chat UI
│   │   └── speech-bubble.ts          # In-game speech bubble (HTML positioned)
│   └── context-menu.ts               # Right-click menu
├── ai/
│   ├── conversation-manager.ts       # Claude API integration
│   ├── system-prompts.ts             # NPC system prompts
│   └── conversation-storage.ts       # Save conversations to vault
├── vault/
│   ├── note-scanner.ts               # Scan vault for tagged notes
│   ├── tag-analyzer.ts               # Analyze top N tags for zones
│   └── note-watcher.ts               # Watch for note changes
└── utils/
    ├── log.ts                        # Logging utility (existing)
    └── hash.ts                       # Hash functions for seeds
```

---

## Excalibur Integration

### Engine Setup (`src/game/village-game.ts`)

```typescript
import * as ex from 'excalibur'
import { VillageScene } from './scenes/village-scene'

export class VillageGame {
    private engine: ex.Engine

    constructor(canvas: HTMLCanvasElement) {
        this.engine = new ex.Engine({
            canvasElement: canvas,
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            backgroundColor: ex.Color.fromHex('#4a7c59'), // Grass green
            pixelArt: true, // Crisp pixel rendering
            pixelRatio: 1, // Consistent pixel size
            antialiasing: false, // Sharp edges
            suppressPlayButton: true // Auto-start
        })
    }

    async initialize(villageData: VillageData): Promise<void> {
        const villageScene = new VillageScene(villageData)
        this.engine.add('village', villageScene)
        await this.engine.start()
        this.engine.goToScene('village')
    }

    destroy(): void {
        this.engine.stop()
    }
}
```

### Village Scene (`src/game/scenes/village-scene.ts`)

```typescript
import * as ex from 'excalibur'
import { Player } from '../actors/player.actor'
import { Villager } from '../actors/villager.actor'
import { WanderSystem } from '../systems/wander.system'
import { InteractionSystem } from '../systems/interaction.system'

export class VillageScene extends ex.Scene {
    private player!: Player
    private villagers: Map<string, Villager> = new Map()

    constructor(private villageData: VillageData) {
        super()
    }

    override onInitialize(engine: ex.Engine): void {
        // Add ECS systems
        this.world.add(new WanderSystem())
        this.world.add(new InteractionSystem())

        // Create terrain tilemap
        this.createTerrain()

        // Spawn structures (houses, signs, decorations)
        this.spawnStructures()

        // Spawn villagers from notes
        this.spawnVillagers()

        // Create and add player
        this.player = new Player(this.villageData.spawnPoint)
        this.add(this.player)

        // Camera follows player
        this.camera.strategy.lockToActor(this.player)
        this.camera.zoom = 2 // Pixel art zoom
    }
}
```

### Villager Actor (`src/game/actors/villager.actor.ts`)

```typescript
import * as ex from 'excalibur'
import { NoteLinkComponent } from '../components/note-link.component'
import { WandererComponent } from '../components/wanderer.component'
import { InteractableComponent } from '../components/interactable.component'
import type { TFile } from 'obsidian'

export class Villager extends ex.Actor {
    constructor(
        public readonly noteFile: TFile,
        public readonly noteName: string,
        public readonly noteLength: number,
        homePosition: ex.Vector,
        zone: Zone,
        appearance: VillagerAppearance
    ) {
        // Size based on note length
        const size = Villager.calculateSize(noteLength)

        super({
            pos: homePosition,
            width: size,
            height: size,
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.Passive
        })

        // Add ECS components
        this.addComponent(new NoteLinkComponent(noteFile))
        this.addComponent(new WandererComponent(homePosition, 50)) // 50px wander radius
        this.addComponent(new InteractableComponent())

        // Set up sprite based on appearance
        this.setupSprite(appearance, size)
    }

    private static calculateSize(contentLength: number): number {
        const minSize = 16
        const maxSize = 48
        return Math.min(maxSize, Math.max(minSize, minSize + Math.sqrt(contentLength) * 0.5))
    }

    private setupSprite(appearance: VillagerAppearance, size: number): void {
        // Graphics setup based on zone theme + randomness
        // Scale sprite to match calculated size
    }
}
```

### Player Actor (`src/game/actors/player.actor.ts`)

```typescript
import * as ex from 'excalibur'

export class Player extends ex.Actor {
    private speed = 100

    constructor(spawnPoint: ex.Vector) {
        super({
            pos: spawnPoint,
            width: 24,
            height: 32,
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.Active
        })
    }

    override onInitialize(engine: ex.Engine): void {
        this.setupSprite()
        this.setupInput(engine)
    }

    private setupInput(engine: ex.Engine): void {
        // Keyboard movement (WASD + Arrows)
        engine.input.keyboard.on('hold', (evt) => {
            const direction = ex.Vector.Zero.clone()

            if (evt.key === ex.Keys.W || evt.key === ex.Keys.Up) direction.y = -1
            if (evt.key === ex.Keys.S || evt.key === ex.Keys.Down) direction.y = 1
            if (evt.key === ex.Keys.A || evt.key === ex.Keys.Left) direction.x = -1
            if (evt.key === ex.Keys.D || evt.key === ex.Keys.Right) direction.x = 1

            this.vel = direction.normalize().scale(this.speed)
        })

        engine.input.keyboard.on('release', () => {
            this.vel = ex.Vector.Zero
        })

        // Click-to-move
        engine.input.pointers.primary.on('down', (evt) => {
            const worldPos = this.scene?.camera.screenToWorldCoordinates(evt.screenPos)
            if (worldPos) {
                this.actions.moveTo(worldPos, this.speed)
            }
        })
    }
}
```

---

## Core Components

### 1. Plugin Settings (`src/app/types/plugin-settings.intf.ts`)

```typescript
export interface PluginSettings {
    enabled: boolean

    // Village
    villageSeed: string // Empty = use vault name hash
    topTagCount: number // Number of top tags for zones (default: 10)

    // Display
    renderQuality: 'low' | 'medium' | 'high'

    // AI
    anthropicApiKey: string
    aiModel: 'claude-3-haiku-20240307' | 'claude-3-5-sonnet-20241022' | 'claude-sonnet-4-20250514'

    // Conversations
    saveConversations: boolean
    conversationFolder: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
    enabled: true,
    villageSeed: '',
    topTagCount: 10,
    renderQuality: 'high',
    anthropicApiKey: '',
    aiModel: 'claude-sonnet-4-20250514',
    saveConversations: true,
    conversationFolder: 'village-conversations'
}
```

### 2. Village View (`src/ui/village-view.ts`)

- Custom `ItemView` extending Obsidian's view system
- View type: `note-village-view`
- Creates canvas element for Excalibur
- Hosts HTML overlay elements (minimap, chat panel, dropdowns)
- Handles view lifecycle (attach engine on open, destroy on close)

### 3. Village Generator (`src/game/world/village-generator.ts`)

**Layout: Radial/Circular**

- Central plaza at origin (0, 0)
- Zones as wedges radiating outward
- Roads along zone boundaries and through centers
- Ring roads at different radii

**Generation Algorithm:**

1. Get top N tags from vault → zone definitions
2. Calculate wedge angles (proportional to tag frequency)
3. Generate central plaza (fountain actor, benches)
4. For each zone wedge:
    - Place zone entrance sign
    - Generate houses along internal roads
    - Assign houses to villagers
    - Scatter decorations (trees, fences, stalls per theme)
5. Add water features at specific positions
6. Return spawn positions and structure data

### 4. Villager Sizing

```typescript
// Note length → villager pixel size
// Short notes (< 500 chars) → 16-20px (thin)
// Medium notes (500-2000 chars) → 20-32px
// Long notes (> 2000 chars) → 32-48px (fat)

function calculateVillagerSize(contentLength: number): number {
    const minSize = 16
    const maxSize = 48
    const scaleFactor = 0.5
    return Math.min(maxSize, Math.max(minSize, minSize + Math.sqrt(contentLength) * scaleFactor))
}
```

### 5. Chat System (`src/ai/conversation-manager.ts`)

**System Prompt:**

```
You are an NPC villager in a peaceful village. A player has approached you to have a conversation.

Your background and personality come from your life experiences, which will be provided next.

Guidelines:
- Stay in character based on your background
- Be friendly but authentic to your personality
- Keep responses concise (2-3 sentences)
- Respond naturally as this character would

Prefix your response with "NPC: " for parsing.
```

**Conversation Flow:**

1. Player clicks villager OR presses E near one
2. Load note content for that villager
3. Open chat panel + show speech bubble
4. System prompt + note content → Claude
5. Player types → "Player: {message}" sent
6. Claude responds with "NPC: {response}"
7. Display in chat panel + speech bubble
8. On conversation end → save to vault file

### 6. Live Updates (`src/vault/note-watcher.ts`)

Using Obsidian's vault events:

- `modify`: Update villager size, check tag changes
- `rename`: Update villager name display
- `delete`: Remove villager with fade-out
- `create`: Add new villager if has qualifying tag

When main zone tag changes:

1. Calculate new zone assignment
2. Use Excalibur's `actions.moveTo()` for smooth pathfinding
3. Update home position in WandererComponent

---

## Implementation Phases

### Phase 1: Foundation

1. Update `manifest.json` with plugin name "Note Village"
2. Update `package.json`:
    - Add `excalibur` dependency
    - Add `@anthropic-ai/sdk` dependency
3. Create extended settings interface
4. Implement settings tab UI with all options
5. Register basic view type

### Phase 2: Excalibur Integration

1. Create `VillageGame` wrapper class
2. Implement `VillageView` with canvas setup
3. Create basic `VillageScene` with player
4. Set up camera following
5. Test keyboard + click movement

### Phase 3: Vault Analysis

1. Implement `tag-analyzer.ts` (find top N tags)
2. Implement `note-scanner.ts` (get notes with tags)
3. Create zone data structures
4. Test with sample vault

### Phase 4: Village Generation

1. Implement seeded random generator
2. Build radial zone layout algorithm
3. Create house placement logic
4. Generate roads and paths
5. Add zone signs with labels

### Phase 5: Actors & Components

1. Create `Villager` actor with size calculation
2. Implement `WandererComponent` + `WanderSystem`
3. Add `InteractableComponent` + `InteractionSystem`
4. Create structure actors (House, Sign, Decoration)
5. Link villagers to notes via component

### Phase 6: Sprites & Animations

1. Create/source pixel art assets:
    - Villager sprite sheet (4 directions, idle, walk)
    - Player hero sprite sheet
    - House variations
    - Trees, fences, decorations
    - Zone signs, market stalls
2. Configure Excalibur animations
3. Implement size-scaled rendering

### Phase 7: UI Overlays

1. Build minimap (HTML canvas overlay)
2. Create zone quick-travel dropdown
3. Implement villager search modal
4. Add right-click context menu
5. Create chat panel component
6. Position speech bubbles above actors

### Phase 8: AI Integration

1. Set up Anthropic SDK client
2. Build conversation manager
3. Create system prompt templates
4. Implement conversation storage
5. Connect chat UI to conversation manager
6. Handle streaming responses

### Phase 9: Polish

1. Wire up vault change events
2. Implement smooth zone transitions (pathfinding)
3. Add villager-to-villager interactions
4. Performance optimization (actor culling)
5. Error handling and edge cases
6. Update documentation

---

## Key Files to Create/Modify

### Modify

- `manifest.json` - Plugin name, description
- `package.json` - Add excalibur and anthropic-sdk
- `src/app/plugin.ts` - Register view, commands, ribbon
- `src/app/types/plugin-settings.intf.ts` - Extended settings
- `src/app/settings/settings-tab.ts` - Settings UI

### Create (Critical Path)

1. `src/ui/village-view.ts` - Obsidian ItemView
2. `src/game/village-game.ts` - Excalibur engine wrapper
3. `src/game/scenes/village-scene.ts` - Main scene
4. `src/game/actors/player.actor.ts` - Player
5. `src/game/actors/villager.actor.ts` - NPC
6. `src/game/world/village-generator.ts` - World gen
7. `src/vault/tag-analyzer.ts` - Zone discovery
8. `src/vault/note-scanner.ts` - Note discovery
9. `src/ai/conversation-manager.ts` - Claude integration
10. `src/ui/chat/chat-panel.ts` - Chat UI

---

## Dependencies

```json
{
    "dependencies": {
        "excalibur": "^0.30.0",
        "@anthropic-ai/sdk": "^0.52.0"
    }
}
```

---

## Verification Plan

### Manual Testing

1. **View Loading**: Command palette → "Open Note Village" → view opens with game
2. **Village Layout**: Zones arranged radially, signs visible at entrances
3. **Villagers**: Appear for tagged notes, sizes vary by note length
4. **Player**: WASD/arrows move, click-to-move works
5. **Interaction**: Click villager → chat opens; E near villager → chat opens
6. **AI Chat**: Message sent → NPC responds in character
7. **Navigation**: Minimap shows position, zone dropdown teleports, search finds villager
8. **Note Access**: Right-click → "Open Note" works; O key near villager opens note
9. **Live Updates**: Edit note → size changes; change tag → villager walks to new zone
10. **Conversations Saved**: Check configured folder for conversation files

### Automated Tests

- `tag-analyzer.spec.ts` - Tag frequency ranking
- `seeded-random.spec.ts` - Determinism verification
- `village-generator.spec.ts` - Zone layout geometry
- `villager.actor.spec.ts` - Size calculation
- `conversation-manager.spec.ts` - Message formatting, file storage

---

## Settings UI Layout

```
Note Village Settings
├── Village Configuration
│   ├── Village Seed (text, placeholder: "Leave empty for vault-based seed")
│   ├── Number of Zones (slider: 3-20, default: 10)
│   └── [Regenerate Village] button
├── Display
│   └── Render Quality (dropdown: Low/Medium/High)
├── AI Configuration
│   ├── Anthropic API Key (password input)
│   └── AI Model (dropdown: Haiku/Sonnet 3.5/Sonnet 4)
├── Conversations
│   ├── Save Conversations (toggle, default: on)
│   └── Conversation Folder (text, default: "village-conversations")
└── Support section
```

---

## Future Improvements (Not in MVP)

- Day/night cycle with lighting
- Weather effects (rain, snow)
- Seasonal village themes
- Density control for crowded zones
- Visible NPC-to-NPC conversations
- Multiple village save slots
