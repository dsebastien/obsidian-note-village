# Note Village Plugin - Remaining Work

## Overview

Core functionality is implemented. This document tracks remaining enhancements.

---

## Remaining Phases

### Phase 6: Sprites & Animations

1. Create/source pixel art assets:
    - Villager sprite sheet (4 directions, idle, walk)
    - Player hero sprite sheet
    - House variations
    - Trees, fences, decorations
    - Zone signs, market stalls
    - Fountain, benches
2. Configure Excalibur animations
3. Implement size-scaled sprite rendering
4. Add walking animations to WanderSystem

### Phase 7: UI Overlays (Remaining)

1. Build minimap (HTML canvas overlay)
    - Show player position
    - Show zone boundaries
    - Clickable for navigation
2. Create zone quick-travel dropdown
3. Implement villager search modal
4. Add right-click context menu
    - Open note
    - Teleport to villager
    - Start conversation

### Phase 9: Polish

1. **Live Updates** (`src/vault/note-watcher.ts`)
    - `modify`: Update villager size, check tag changes
    - `rename`: Update villager name display
    - `delete`: Remove villager with fade-out
    - `create`: Add new villager if has qualifying tag
    - Smooth zone transitions when tag changes

2. **Performance**
    - Actor culling (don't render off-screen)
    - Lazy villager spawning for large vaults
    - Debounce vault change events

3. **Error Handling**
    - API rate limiting feedback
    - Missing API key graceful fallback
    - Network error recovery

4. **Mobile Compatibility**
    - Touch controls for movement
    - Responsive chat panel
    - Test on iOS/Android

---

## Files to Create

```
src/
├── game/
│   └── resources/
│       ├── sprite-sheets.ts      # Load and configure sprite sheets
│       └── animations.ts         # Animation definitions
├── ui/
│   ├── overlays/
│   │   ├── minimap.ts            # HTML minimap overlay
│   │   ├── zone-nav.ts           # Zone quick-travel dropdown
│   │   └── villager-search.ts    # Note/villager search modal
│   └── context-menu.ts           # Right-click menu
└── vault/
    └── note-watcher.ts           # Watch for note changes
```

---

## Testing

### Manual Testing Checklist

- [ ] Sprites render correctly at different sizes
- [ ] Walking animations play during movement
- [ ] Minimap shows accurate positions
- [ ] Zone dropdown teleports player
- [ ] Search finds villagers by name
- [ ] Right-click menu works
- [ ] Note edits update villager size in real-time
- [ ] Tag changes move villager to new zone
- [ ] Works on mobile devices

### Automated Tests to Add

- `sprite-sheets.spec.ts` - Asset loading
- `note-watcher.spec.ts` - Event handling
- `minimap.spec.ts` - Position calculations

---

## Future Improvements (Post-MVP)

- Day/night cycle with lighting
- Weather effects (rain, snow)
- Seasonal village themes
- Density control for crowded zones
- Visible NPC-to-NPC conversations
- Multiple village save slots
- Pathfinding for click-to-move obstacles
