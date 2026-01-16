# Configuration

## Settings (src/app/types/plugin-settings.intf.ts)

All settings use Zod schemas for validation.

### Village Configuration

| Setting     | Type   | Default | Description                                      |
| ----------- | ------ | ------- | ------------------------------------------------ |
| villageSeed | string | ""      | Seed for village generation (empty = vault name) |
| topTagCount | number | 10      | Number of top tags to use as zones (3-20)        |

### Display

| Setting       | Type               | Default | Description                          |
| ------------- | ------------------ | ------- | ------------------------------------ |
| renderQuality | RenderQuality enum | HIGH    | Graphics quality (LOW, MEDIUM, HIGH) |

### AI Configuration

| Setting         | Type         | Default         | Description                            |
| --------------- | ------------ | --------------- | -------------------------------------- |
| anthropicApiKey | string       | ""              | Anthropic API key for AI conversations |
| aiModel         | AIModel enum | CLAUDE_SONNET_4 | Claude model for conversations         |

### Conversations

| Setting            | Type    | Default                 | Description                    |
| ------------------ | ------- | ----------------------- | ------------------------------ |
| saveConversations  | boolean | true                    | Save conversations to vault    |
| conversationFolder | string  | "village-conversations" | Folder for saved conversations |

## Enums

### RenderQuality

```typescript
enum RenderQuality {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}
```

### AIModel

```typescript
enum AIModel {
    CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
    CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
    CLAUDE_SONNET_4 = 'claude-sonnet-4-20250514'
}
```

## Village Generator Options

| Option            | Default | Description                        |
| ----------------- | ------- | ---------------------------------- |
| plazaRadius       | 100     | Central plaza radius in pixels     |
| zoneInnerRadius   | 150     | Distance from center to zone start |
| zoneWidth         | 300     | Width of zone ring                 |
| housesPerVillager | 0.3     | Probability of house per villager  |
| decorationDensity | 0.1     | Decoration density multiplier      |
