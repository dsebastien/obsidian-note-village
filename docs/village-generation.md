# Village Generation

Note Village creates a procedurally-generated village based on your vault's structure.

## How It Works

### 1. Vault Analysis

The plugin scans your vault to collect:

- All markdown notes (respecting excluded folders)
- Tags from each note's frontmatter and content
- Tag frequency across the vault

### 2. Zone Planning

Top tags become zones in the village:

- **Tag ranking**: Tags sorted by note count
- **Zone count**: Limited by `topTagCount` setting (default: 10)
- **Zone sizing**: Proportional to the number of notes with that tag

### 3. Layout Generation

The village uses a radial layout:

```
        [Zone 1]
           |
[Zone 4]--Plaza--[Zone 2]
           |
        [Zone 3]
```

- **Central Plaza**: Fixed position at village center
- **Zones**: Arranged in wedges around the plaza
- **Roads**: Cobblestone paths connect plaza to each zone

### 4. Structure Placement

Within each zone:

- **Houses**: Placed proportionally (0.3 houses per villager by default)
- **Decorations**: Trees, flowers, bushes distributed randomly
- **Boundaries**: Fences mark zone edges

### 5. Villager Assignment

Each note becomes a villager:

- Assigned to primary tag's zone
- Given a unique pixel art sprite
- Positioned randomly within zone bounds

## Village Seed

The **Village seed** determines randomization:

- Same seed = same layout
- Empty seed uses vault name
- Change seed to regenerate village

## Excluded Folders

Some folders can be excluded from village generation:

- Templates folder
- Archive folders
- System folders

Configure in **Settings → Note Village → Excluded folders**.

## Decoration Types

### Plaza Decorations

- Fountain (center)
- Benches
- Lamp posts
- Flowers

### Zone Decorations

- Trees (various sizes)
- Bushes
- Flower beds
- Rocks
- Tall grass
- Barrels and crates

### Boundaries

- Forest border around world edge
- Fences between zones
- Cobblestone roads

## Performance Considerations

### Large Vaults

For vaults with many notes:

- Use `maxVillagers` setting to limit villager count
- Exclude irrelevant folders
- Lower `topTagCount` for fewer zones

### Render Quality

Adjust `renderQuality` setting:

| Quality | Description                        |
| ------- | ---------------------------------- |
| LOW     | Reduced detail, better performance |
| MEDIUM  | Balanced                           |
| HIGH    | Full detail (default)              |
