import { App, PluginSettingTab, Setting } from 'obsidian'
import type { NoteVillagePlugin } from '../plugin'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'

export class NoteVillageSettingTab extends PluginSettingTab {
    plugin: NoteVillagePlugin

    constructor(app: App, plugin: NoteVillagePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this
        containerEl.empty()

        this.renderVillageConfiguration(containerEl)
        this.renderDisplaySettings(containerEl)
        this.renderAIConfiguration(containerEl)
        this.renderConversationSettings(containerEl)
        this.renderSupportSection(containerEl)
    }

    private renderVillageConfiguration(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Village configuration').setHeading()

        new Setting(containerEl)
            .setName('Village seed')
            .setDesc('Seed for village generation. Leave empty to use vault name as seed.')
            .addText((text) =>
                text
                    .setPlaceholder('Leave empty for vault-based seed')
                    .setValue(this.plugin.settings.villageSeed)
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('villageSeed', value)
                    })
            )

        new Setting(containerEl)
            .setName('Number of zones')
            .setDesc('Number of top tags to use as village zones (3-20)')
            .addSlider((slider) =>
                slider
                    .setLimits(3, 20, 1)
                    .setValue(this.plugin.settings.topTagCount)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('topTagCount', value)
                    })
            )

        new Setting(containerEl)
            .setName('Maximum villagers')
            .setDesc('Maximum number of villagers to display in the village (10-500)')
            .addSlider((slider) =>
                slider
                    .setLimits(10, 500, 10)
                    .setValue(this.plugin.settings.maxVillagers)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('maxVillagers', value)
                    })
            )

        new Setting(containerEl)
            .setName('Regenerate village')
            .setDesc('Regenerate the village layout with current settings')
            .addButton((button) =>
                button.setButtonText('Regenerate').onClick(() => {
                    this.plugin.regenerateVillage()
                })
            )
    }

    private renderDisplaySettings(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Display').setHeading()

        new Setting(containerEl)
            .setName('Render quality')
            .setDesc('Graphics quality setting')
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(RenderQuality.LOW, 'Low')
                    .addOption(RenderQuality.MEDIUM, 'Medium')
                    .addOption(RenderQuality.HIGH, 'High')
                    .setValue(this.plugin.settings.renderQuality)
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('renderQuality', value as RenderQuality)
                    })
            )
    }

    private renderAIConfiguration(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('AI configuration').setHeading()

        new Setting(containerEl)
            .setName('Anthropic API key')
            .setDesc('Your Anthropic API key for AI-powered conversations')
            .addText((text) =>
                text
                    .setPlaceholder('sk-ant-...')
                    .setValue(this.plugin.settings.anthropicApiKey)
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('anthropicApiKey', value)
                    })
            )
            .then((setting) => {
                const inputEl = setting.controlEl.querySelector('input')
                if (inputEl) {
                    inputEl.type = 'password'
                }
            })

        new Setting(containerEl)
            .setName('AI model')
            .setDesc('Claude model to use for conversations')
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(AIModel.CLAUDE_3_HAIKU, 'Claude 3 Haiku (Fast)')
                    .addOption(AIModel.CLAUDE_3_5_SONNET, 'Claude 3.5 Sonnet')
                    .addOption(AIModel.CLAUDE_SONNET_4, 'Claude Sonnet 4 (Recommended)')
                    .setValue(this.plugin.settings.aiModel)
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('aiModel', value as AIModel)
                    })
            )
    }

    private renderConversationSettings(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Conversations').setHeading()

        new Setting(containerEl)
            .setName('Save conversations')
            .setDesc('Save AI conversations to your vault')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.saveConversations).onChange(async (value) => {
                    await this.plugin.updateSetting('saveConversations', value)
                })
            )

        new Setting(containerEl)
            .setName('Conversation folder')
            .setDesc('Folder to save conversations in')
            .addText((text) =>
                text
                    .setPlaceholder('village-conversations')
                    .setValue(this.plugin.settings.conversationFolder)
                    .onChange(async (value) => {
                        await this.plugin.updateSetting('conversationFolder', value)
                    })
            )
    }

    private renderSupportSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Support').setHeading()

        new Setting(containerEl)
            .setName('Follow me on X')
            .setDesc('Sébastien Dubois (@dSebastien)')
            .addButton((button) => {
                button.setCta()
                button.setButtonText('Follow me on X').onClick(() => {
                    window.open('https://x.com/dSebastien')
                })
            })

        const supportDesc = new DocumentFragment()
        supportDesc.createDiv({
            text: 'Buy me a coffee to support the development of this plugin'
        })

        new Setting(containerEl).setDesc(supportDesc)

        this.renderBuyMeACoffeeBadge(containerEl)
    }

    private renderBuyMeACoffeeBadge(contentEl: HTMLElement, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src =
            'https://github.com/dsebastien/obsidian-plugin-template/blob/main/src/assets/buy-me-a-coffee.png?raw=true'
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
