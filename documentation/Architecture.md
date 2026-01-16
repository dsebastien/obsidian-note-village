# Architecture

## Overview

Note Village is an Obsidian plugin that renders vault notes as villagers in a 2D pixel art game. Uses Excalibur.js for game rendering and Anthropic SDK for AI conversations.

## Layers

```
┌─────────────────────────────────────────────┐
│              Obsidian Plugin                │
│  (src/app/plugin.ts, settings, commands)    │
├─────────────────────────────────────────────┤
│              UI Layer                       │
│  (src/ui/village-view.ts, chat, overlays)   │
├─────────────────────────────────────────────┤
│              Game Engine                    │
│  (Excalibur.js - scenes, actors, systems)   │
├─────────────────────────────────────────────┤
│              World Generation               │
│  (village-generator, zones, placement)      │
├─────────────────────────────────────────────┤
│              Vault Analysis                 │
│  (tag-analyzer, note-scanner)               │
├─────────────────────────────────────────────┤
│              AI Conversations               │
│  (Anthropic SDK, system prompts)            │
└─────────────────────────────────────────────┘
```

## Key Components

### Plugin (src/app/)

- `plugin.ts`: Entry point, registers view/commands, manages settings
- `settings-tab.ts`: Settings UI for all configuration
- `plugin-settings.intf.ts`: Settings types with Zod schemas

### Game (src/game/)

- `village-game.ts`: Excalibur Engine wrapper
- `scenes/village-scene.ts`: Main game scene
- `actors/player.actor.ts`: Player character
- `world/village-generator.ts`: Procedural village layout
- `types.ts`: Game data types (Zone, VillagerData, StructureData)

### UI (src/ui/)

- `village-view.ts`: Obsidian ItemView hosting game canvas

### Vault (src/vault/)

- `tag-analyzer.ts`: Analyzes tag frequency for zone distribution
- `note-scanner.ts`: Scans notes with specific tags

### Utils (src/utils/)

- `seeded-random.ts`: Deterministic random generator
- `log.ts`: Logging utility

## Data Flow

1. Plugin loads → settings loaded from disk
2. User opens village view → VillageView created
3. VillageView calls VillageGenerator
4. Generator uses TagAnalyzer + NoteScanner to analyze vault
5. Generator creates VillageData (zones, villagers, structures)
6. VillageGame initializes Excalibur with VillageData
7. VillageScene spawns all actors from data
8. Player interacts → triggers AI conversations (TODO)

## Village Layout

Radial design:

- Central plaza at (0,0) with fountain
- Zones as wedges radiating outward
- Zone size proportional to tag frequency
- Villagers placed within their zone's wedge
- Structures scattered for visual interest
