import { z } from 'zod'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'
import { AIModelSchema } from '#schemas/ai-model.schema'
import { RenderQualitySchema } from '#schemas/render-quality.schema'

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
    anthropicApiKey: z.string().default(''),
    aiModel: AIModelSchema.default(AIModel.CLAUDE_SONNET_4),
    saveConversations: z.boolean().default(true),
    conversationFolder: z.string().default('village-conversations')
})
