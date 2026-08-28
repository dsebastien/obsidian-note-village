import { registerWhatsNewView } from './whats-new'
import { Plugin } from 'obsidian'
import { produce } from 'immer'
import type { Draft } from 'immer'
import { PluginSettingsSchema } from '#schemas/plugin-settings.schema'
import type { PluginSettings } from '#types/plugin-settings.intf'
import { DEFAULT_SETTINGS } from '#types/plugin-settings.intf'
import { NoteVillageSettingTab } from './settings/settings-tab'
import { VillageView } from '../ui/village-view'
import { log, setDebugMode } from '../utils/log'

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
    override settings: PluginSettings = { ...DEFAULT_SETTINGS }

    /**
     * Executed as soon as the plugin loads
     */
    override async onload(): Promise<void> {
        // Must run before anything can call saveData (fresh-install detection)
        registerWhatsNewView(this)
        await this.loadSettings()
        setDebugMode(this.settings.debugMode)
        log('Initializing Note Village', 'debug')

        // Register the village view
        this.registerView(NOTE_VILLAGE_VIEW_TYPE, (leaf) => new VillageView(leaf, this))

        // Add command to open the village view
        this.addCommand({
            id: 'open',
            name: 'Open village',
            callback: () => {
                void this.activateVillageView()
            }
        })

        // Add ribbon icon
        this.addRibbonIcon('home', 'Open Note Village', () => {
            void this.activateVillageView()
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
        const loadedData: unknown = await this.loadData()

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

    /** Serializes settings writes; see updateSettings. */
    private settingsWriteChain: Promise<void> = Promise.resolve()

    /**
     * Apply a mutation to the settings (via immer) and persist the result.
     * The single write path — the declarative settings tab routes every
     * control edit through here so persistence happens in exactly one place.
     *
     * Persist-then-commit: memory is swapped only after saveData() succeeds,
     * so a rejected write rolls the control back to the on-disk truth.
     * Serialized: writes queue and each mutation derives from the previous
     * COMMITTED state — without this, overlapping calls produce from the same
     * base across the save await and the second commit silently drops the
     * first edit.
     *
     * Side effects run strictly AFTER a successful commit: debug logging
     * tracks the committed debugMode value.
     */
    updateSettings(mutator: (draft: Draft<PluginSettings>) => void): Promise<void> {
        const run = async (): Promise<void> => {
            const next = produce(this.settings, mutator)
            await this.saveData(next)
            const previousDebugMode = this.settings.debugMode
            this.settings = next
            if (next.debugMode !== previousDebugMode) {
                setDebugMode(next.debugMode)
            }
        }
        const p = this.settingsWriteChain.then(run, run)
        this.settingsWriteChain = p.catch(() => {})
        return p
    }

    /**
     * Activate the village view
     */
    async activateVillageView(): Promise<void> {
        const { workspace } = this.app

        let leaf = workspace.getLeavesOfType(NOTE_VILLAGE_VIEW_TYPE)[0]

        if (!leaf) {
            // Open in a regular tab in the main editor area
            leaf = workspace.getLeaf('tab')
            await leaf.setViewState({
                type: NOTE_VILLAGE_VIEW_TYPE,
                active: true
            })
        }

        await workspace.revealLeaf(leaf)
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
                void view.regenerate()
            }
        }
    }
}
