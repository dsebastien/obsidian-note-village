import { z } from 'zod'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'
import { AIModelSchema } from '#schemas/ai-model.schema'
import { RenderQualitySchema } from '#schemas/render-quality.schema'
import { DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME } from '#types/plugin-settings.intf'

/**
 * Zod schema for plugin settings
 */
export const PluginSettingsSchema = z.object({
    enabled: z.boolean().default(true),
    villageSeed: z.string().default(''),
    topTagCount: z.number().int().min(3).max(20).default(10),
    maxVillagers: z.number().int().min(10).max(500).default(100),
    excludedFolders: z.array(z.string()).default([]),
    excludedTags: z.array(z.string()).default([]),
    renderQuality: RenderQualitySchema.default(RenderQuality.HIGH),
    /**
     * NAME of the Obsidian SecretStorage entry holding the Anthropic API key.
     * The key itself never lives in data.json.
     */
    anthropicApiKeySecretName: z.string().default(DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME),
    /**
     * LEGACY plaintext API key written by versions before SecretStorage.
     * Read-only bootstrap: each device copies it into its own SecretStorage on
     * load. Never written with a new value; removed on rotate/clear, after the
     * grace period, or from the settings button.
     */
    anthropicApiKey: z.string().optional(),
    /** ISO date of the first migration of the legacy key ('' = never). */
    legacySecretMigratedAt: z.string().default(''),
    aiModel: AIModelSchema.default(AIModel.CLAUDE_SONNET_4),
    saveConversations: z.boolean().default(true),
    conversationFolder: z.string().default('village-conversations'),
    debugMode: z.boolean().default(false)
})
