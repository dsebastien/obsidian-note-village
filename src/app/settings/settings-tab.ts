import { App, PluginSettingTab, Setting } from 'obsidian'
import type { NoteVillagePlugin } from '../plugin'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'
import { FolderSuggester } from '../../ui/folder-suggester'
import { TagSuggester } from '../../ui/tag-suggester'

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
                        this.plugin.regenerateVillage()
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
                        this.plugin.regenerateVillage()
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
                        this.plugin.regenerateVillage()
                    })
            )

        // Excluded folders section
        this.renderExcludedFolders(containerEl)

        // Excluded tags section
        this.renderExcludedTags(containerEl)

        new Setting(containerEl)
            .setName('Regenerate village')
            .setDesc('Regenerate the village layout with current settings')
            .addButton((button) =>
                button.setButtonText('Regenerate').onClick(() => {
                    this.plugin.regenerateVillage()
                })
            )
    }

    private renderExcludedFolders(containerEl: HTMLElement): void {
        const excludedFolders = this.plugin.settings.excludedFolders

        new Setting(containerEl)
            .setName('Excluded folders')
            .setDesc(
                'Folders to exclude from village generation (notes in these folders will not become villagers)'
            )

        // Container for the excluded folders list
        const foldersContainer = containerEl.createDiv({ cls: 'note-village-excluded-folders' })

        // Render each excluded folder with a remove button
        for (const folder of excludedFolders) {
            this.renderExcludedFolder(foldersContainer, folder)
        }

        // Add new folder input
        const addFolderSetting = new Setting(containerEl)
            .setClass('note-village-add-folder')
            .addText((text) => {
                const inputEl = text.inputEl
                inputEl.placeholder = 'Type folder path...'

                // Add folder suggester
                new FolderSuggester(this.app, inputEl)

                return text
            })
            .addButton((button) =>
                button
                    .setButtonText('Add')
                    .setCta()
                    .onClick(async () => {
                        const inputEl = addFolderSetting.controlEl.querySelector('input')
                        if (!inputEl) return

                        const folderPath = inputEl.value.trim()
                        if (!folderPath) return

                        // Check if folder exists
                        const folder = this.app.vault.getAbstractFileByPath(folderPath)
                        if (!folder) {
                            // Folder doesn't exist, but still allow adding it
                            // (user might want to exclude a folder they'll create later)
                        }

                        // Check if already excluded
                        if (excludedFolders.includes(folderPath)) {
                            inputEl.value = ''
                            return
                        }

                        // Add to excluded folders
                        const newExcludedFolders = [...excludedFolders, folderPath]
                        await this.plugin.updateSetting('excludedFolders', newExcludedFolders)
                        this.plugin.regenerateVillage()

                        // Clear input and refresh display
                        inputEl.value = ''
                        this.display()
                    })
            )
    }

    private renderExcludedFolder(container: HTMLElement, folderPath: string): void {
        const folderEl = container.createDiv({ cls: 'note-village-excluded-folder' })

        // Folder path
        folderEl.createSpan({
            cls: 'note-village-excluded-folder-path',
            text: folderPath
        })

        // Remove button
        const removeBtn = folderEl.createEl('button', {
            cls: 'note-village-excluded-folder-remove',
            attr: { 'aria-label': 'Remove folder' }
        })
        removeBtn.innerHTML = '×'
        removeBtn.addEventListener('click', async () => {
            const newExcludedFolders = this.plugin.settings.excludedFolders.filter(
                (f) => f !== folderPath
            )
            await this.plugin.updateSetting('excludedFolders', newExcludedFolders)
            this.plugin.regenerateVillage()
            this.display()
        })
    }

    private renderExcludedTags(containerEl: HTMLElement): void {
        const excludedTags = this.plugin.settings.excludedTags

        new Setting(containerEl)
            .setName('Excluded tags')
            .setDesc(
                'Tags to exclude from zone selection (notes with only these tags will not become villagers)'
            )

        // Container for the excluded tags list
        const tagsContainer = containerEl.createDiv({ cls: 'note-village-excluded-tags' })

        // Render each excluded tag with a remove button
        for (const tag of excludedTags) {
            this.renderExcludedTag(tagsContainer, tag)
        }

        // Add new tag input
        const addTagSetting = new Setting(containerEl)
            .setClass('note-village-add-tag')
            .addText((text) => {
                const inputEl = text.inputEl
                inputEl.placeholder = 'Type tag name...'

                // Add tag suggester
                new TagSuggester(this.app, inputEl)

                return text
            })
            .addButton((button) =>
                button
                    .setButtonText('Add')
                    .setCta()
                    .onClick(async () => {
                        const inputEl = addTagSetting.controlEl.querySelector('input')
                        if (!inputEl) return

                        // Normalize tag (remove # prefix if present, lowercase)
                        const rawTag = inputEl.value.trim()
                        if (!rawTag) return
                        const tag = rawTag.replace(/^#/, '').toLowerCase()

                        // Check if already excluded
                        if (excludedTags.includes(tag)) {
                            inputEl.value = ''
                            return
                        }

                        // Add to excluded tags
                        const newExcludedTags = [...excludedTags, tag]
                        await this.plugin.updateSetting('excludedTags', newExcludedTags)
                        this.plugin.regenerateVillage()

                        // Clear input and refresh display
                        inputEl.value = ''
                        this.display()
                    })
            )
    }

    private renderExcludedTag(container: HTMLElement, tag: string): void {
        const tagEl = container.createDiv({ cls: 'note-village-excluded-tag' })

        // Tag name
        tagEl.createSpan({
            cls: 'note-village-excluded-tag-name',
            text: tag
        })

        // Remove button
        const removeBtn = tagEl.createEl('button', {
            cls: 'note-village-excluded-tag-remove',
            attr: { 'aria-label': 'Remove tag' }
        })
        removeBtn.innerHTML = '×'
        removeBtn.addEventListener('click', async () => {
            const newExcludedTags = this.plugin.settings.excludedTags.filter((t) => t !== tag)
            await this.plugin.updateSetting('excludedTags', newExcludedTags)
            this.plugin.regenerateVillage()
            this.display()
        })
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
