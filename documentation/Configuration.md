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

| Setting                   | Type         | Default                          | Description                                                       |
| ------------------------- | ------------ | -------------------------------- | ----------------------------------------------------------------- |
| anthropicApiKeySecretName | string       | "note-village-anthropic-api-key" | NAME of the SecretStorage entry holding the key (never the value) |
| anthropicApiKey           | string?      | absent                           | LEGACY plaintext key; read-only per-device bootstrap, see below   |
| legacySecretMigratedAt    | string (ISO) | ""                               | Date of the first legacy-key migration ("" = never)               |
| aiModel                   | AIModel enum | CLAUDE_SONNET_4                  | Claude model for conversations                                    |

API key lifecycle (`src/app/services/api-key-secret.ts`):

- Read at use time via `plugin.getAnthropicApiKey()`: SecretStorage first, then the legacy field (copied into SecretStorage on read). Never cached in settings.
- Load (every device): legacy key present and secret absent on this device → `setSecret(name, legacy)`. First migration picks a name that never overwrites a different secret (`-2`, `-3`, ... suffix) and records `legacySecretMigratedAt`. Secret differs from legacy → rotated, legacy removed. Legacy removed 60 days after the first migration.
- Picking a secret (settings) and **Clear API key** remove the legacy field; clear also sets this device's secret to '' (no delete API; '' = absent). **Remove plain-text copy now** removes the legacy field.
- Settings hint only when a name is set and both SecretStorage and the legacy field are empty.

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
