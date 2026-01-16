import type { z } from 'zod'
import type { PluginSettingsSchema } from '#schemas/plugin-settings.schema'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'

/**
 * Plugin settings interface derived from Zod schema
 */
export type PluginSettings = z.infer<typeof PluginSettingsSchema>

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
    anthropicApiKey: '',
    aiModel: AIModel.CLAUDE_SONNET_4,
    saveConversations: true,
    conversationFolder: 'village-conversations'
}
