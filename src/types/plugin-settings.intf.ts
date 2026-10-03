import type { z } from 'zod'
import type { PluginSettingsSchema } from '#schemas/plugin-settings.schema'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'

/**
 * Plugin settings interface derived from Zod schema
 */
export type PluginSettings = z.infer<typeof PluginSettingsSchema>

/**
 * Default SecretStorage name for the Anthropic API key (`<plugin-id>-<what>`,
 * lowercase alphanumeric and dashes as SecretStorage requires).
 */
export const DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME = 'note-village-anthropic-api-key'

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: PluginSettings = {
    enabled: true,
    villageSeed: '',
    topTagCount: 10,
    maxVillagers: 100,
    excludedFolders: [],
    excludedTags: [],
    renderQuality: RenderQuality.HIGH,
    anthropicApiKeySecretName: DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME,
    legacySecretMigratedAt: '',
    aiModel: AIModel.CLAUDE_SONNET_4,
    saveConversations: true,
    conversationFolder: 'village-conversations',
    debugMode: false
}
