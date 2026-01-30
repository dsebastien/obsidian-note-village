# Configuration

All settings are accessible via **Settings → Note Village**.

## Village Settings

### Village Seed

- **Type**: Text
- **Default**: Empty (uses vault name)
- **Description**: Seed for procedural generation. Same seed = same layout.

### Top Tag Count

- **Type**: Number
- **Default**: 10
- **Range**: 3-20
- **Description**: Number of top tags to use as village zones.

### Max Villagers

- **Type**: Number
- **Default**: 100
- **Range**: 10-500
- **Description**: Maximum number of notes to show as villagers.

### Excluded Folders

- **Type**: List
- **Default**: Empty
- **Description**: Folders to exclude from village generation.

## Display Settings

### Render Quality

- **Type**: Dropdown
- **Default**: HIGH
- **Options**: LOW, MEDIUM, HIGH
- **Description**: Graphics quality level. Lower = better performance.

## AI Settings

### Anthropic API Key

- **Type**: Password
- **Default**: Empty
- **Description**: Your Anthropic API key for Claude conversations.

### AI Model

- **Type**: Dropdown
- **Default**: Claude Sonnet 4
- **Options**:
    - Claude 3 Haiku (fastest)
    - Claude 3.5 Sonnet (balanced)
    - Claude Sonnet 4 (most capable)

### Save Conversations

- **Type**: Toggle
- **Default**: true
- **Description**: Save conversations as markdown files in your vault.

### Conversation Folder

- **Type**: Text
- **Default**: `village-conversations`
- **Description**: Folder where conversations are saved.

## Generator Options

These advanced options control village generation:

| Option              | Default | Description                       |
| ------------------- | ------- | --------------------------------- |
| Plaza Radius        | 100px   | Size of the central plaza         |
| Zone Inner Radius   | 150px   | Distance from plaza to zone start |
| Zone Width          | 300px   | Width of each zone                |
| Houses Per Villager | 0.3     | Ratio of houses to villagers      |
| Decoration Density  | 0.1     | Density of decorations            |

## Recommended Configurations

### Small Vault (< 100 notes)

```
topTagCount: 5
maxVillagers: 50
renderQuality: HIGH
```

### Medium Vault (100-500 notes)

```
topTagCount: 10
maxVillagers: 100
renderQuality: MEDIUM
```

### Large Vault (500+ notes)

```
topTagCount: 15
maxVillagers: 200
renderQuality: LOW
excludedFolders: ["archive", "templates"]
```

## Resetting Configuration

To reset all settings to defaults:

1. Close Obsidian
2. Delete `data.json` in `.obsidian/plugins/note-village/`
3. Reopen Obsidian
