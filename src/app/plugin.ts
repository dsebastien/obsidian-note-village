import { Plugin } from 'obsidian'
import { PluginSettingsSchema } from '#schemas/plugin-settings.schema'
import type { PluginSettings } from '#types/plugin-settings.intf'
import { DEFAULT_SETTINGS } from '#types/plugin-settings.intf'
import { NoteVillageSettingTab } from './settings/settings-tab'
import { VillageView } from '../ui/village-view'
import { log } from '../utils/log'

/**
 * View type identifier for the village view
 */
export const NOTE_VILLAGE_VIEW_TYPE = 'note-village-view'

/**
 * Note Village plugin - A 2D pixel art village where notes become villagers
 */
export class NoteVillagePlugin extends Plugin {
    /**
     * Plugin settings
     */
    settings: PluginSettings = { ...DEFAULT_SETTINGS }

    /**
     * Executed as soon as the plugin loads
     */
    override async onload(): Promise<void> {
        log('Initializing Note Village', 'debug')
        await this.loadSettings()

        // Register the village view
        this.registerView(NOTE_VILLAGE_VIEW_TYPE, (leaf) => new VillageView(leaf, this))

        // Add command to open the village view
        this.addCommand({
            id: 'open-note-village',
            name: 'Open Note Village',
            callback: () => {
                this.activateVillageView()
            }
        })

        // Add ribbon icon
        this.addRibbonIcon('home', 'Open Note Village', () => {
            this.activateVillageView()
        })

        // Add a settings screen for the plugin
        this.addSettingTab(new NoteVillageSettingTab(this.app, this))
    }

    override onunload(): void {
        log('Unloading Note Village', 'debug')
    }

    /**
     * Load the plugin settings
     */
    async loadSettings(): Promise<void> {
        log('Loading settings', 'debug')
        const loadedData = await this.loadData()

        if (!loadedData) {
            log('Using default settings', 'debug')
            this.settings = { ...DEFAULT_SETTINGS }
            return
        }

        // Parse and validate settings with Zod
        const parseResult = PluginSettingsSchema.safeParse(loadedData)

        if (parseResult.success) {
            this.settings = parseResult.data
            log('Settings loaded', 'debug', this.settings)
        } else {
            log('Invalid settings, using defaults', 'warn', parseResult.error)
            this.settings = { ...DEFAULT_SETTINGS }
        }
    }

    /**
     * Save the plugin settings
     */
    async saveSettings(): Promise<void> {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        log('Settings saved', 'debug', this.settings)
    }

    /**
     * Update a specific setting
     */
    async updateSetting<K extends keyof PluginSettings>(
        key: K,
        value: PluginSettings[K]
    ): Promise<void> {
        this.settings = { ...this.settings, [key]: value }
        await this.saveSettings()
    }

    /**
     * Activate the village view
     */
    async activateVillageView(): Promise<void> {
        const { workspace } = this.app

        let leaf = workspace.getLeavesOfType(NOTE_VILLAGE_VIEW_TYPE)[0]

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false)
            if (rightLeaf) {
                leaf = rightLeaf
                await leaf.setViewState({
                    type: NOTE_VILLAGE_VIEW_TYPE,
                    active: true
                })
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf)
        }
    }

    /**
     * Regenerate the village with current settings
     */
    regenerateVillage(): void {
        log('Regenerating village', 'info')
        const leaves = this.app.workspace.getLeavesOfType(NOTE_VILLAGE_VIEW_TYPE)
        for (const leaf of leaves) {
            const view = leaf.view
            if (view instanceof VillageView) {
                view.regenerate()
            }
        }
    }
}
