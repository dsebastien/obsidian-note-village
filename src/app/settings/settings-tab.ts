import { Notice, PluginSettingTab } from 'obsidian'
import type { App, SearchComponent, SettingDefinitionItem } from 'obsidian'
import type { NoteVillagePlugin } from '../plugin'
import type { PluginSettings } from '#types/plugin-settings.intf'
import { AIModel } from '#types/ai-model.intf'
import { RenderQuality } from '#types/render-quality.intf'
import { FolderSuggester } from '../../ui/folder-suggester'
import { TagSuggester } from '../../ui/tag-suggester'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { renderSupportSection } from '../ui/support-links'

/**
 * The settings keys owned by plain declarative controls, i.e. everything the
 * `getControlValue`/`setControlValue` pair addresses. The API key and the two
 * exclusion lists go through their own render/list definitions instead.
 */
type ControlKey =
    | 'villageSeed'
    | 'topTagCount'
    | 'maxVillagers'
    | 'renderQuality'
    | 'aiModel'
    | 'saveConversations'
    | 'conversationFolder'
    | 'debugMode'

/** Control writes after which the village layout must be rebuilt. */
const VILLAGE_SHAPE_KEYS: ReadonlySet<string> = new Set([
    'villageSeed',
    'topTagCount',
    'maxVillagers'
])

/**
 * Settings tab, declared rather than rendered (Obsidian 1.13+).
 *
 * `getSettingDefinitions()` REPLACES `display()`: when it returns a non-empty
 * array, `display()` is never called. There is no partial adoption — the whole
 * settings UI is declarative, or none of it. In exchange, Obsidian owns
 * navigation, focus and ARIA, and every declared `name`/`desc` is indexed by
 * the settings search.
 *
 * Rules that each cost a shipped bug the first time they were broken:
 *
 * - A `render:` hook renders the ROW. Write into `setting.settingEl` only;
 *   anything written outside it (e.g. `group.listEl`) is the framework's to
 *   discard, and the control simply does not appear.
 * - `defaultValue` is the fallback for a RESOLVER returning undefined/null,
 *   NOT for a cleared input.
 * - A row `action:` fires on the whole row, not on a button. Button rows use
 *   `render:` with `addButton` instead.
 * - `setControlValue` MUST reject on failure. Resolving tells the framework
 *   the write landed, so the pane keeps showing a value that was never stored.
 * - `onDelete(index)` indexes the list as it was DRAWN: resolve the entry to a
 *   value immediately, then filter against the committed array INSIDE the
 *   mutator.
 */
export class NoteVillageSettingTab extends PluginSettingTab {
    plugin: NoteVillagePlugin

    constructor(app: App, plugin: NoteVillagePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                type: 'group',
                heading: 'Village configuration',
                items: [
                    {
                        name: 'Village seed',
                        desc: 'Seed for village generation. Leave empty to use vault name as seed.',
                        control: {
                            type: 'text',
                            key: 'villageSeed',
                            placeholder: 'Leave empty for vault-based seed'
                        }
                    },
                    {
                        name: 'Number of zones',
                        desc: 'Number of top tags to use as village zones (3-20)',
                        control: {
                            type: 'slider',
                            key: 'topTagCount',
                            min: 3,
                            max: 20,
                            step: 1
                        }
                    },
                    {
                        name: 'Maximum villagers',
                        desc: 'Maximum number of villagers to display in the village (10-500)',
                        control: {
                            type: 'slider',
                            key: 'maxVillagers',
                            min: 10,
                            max: 500,
                            step: 10
                        }
                    }
                ]
            },
            // The exclusion lists sit at the top level: a group's `items`
            // cannot host a `type: 'list'` definition (the type forbids it).
            ...this.exclusionListDefinitions(
                'excludedFolders',
                'Excluded folders',
                'Folders to exclude from village generation (notes in these folders will not become villagers)',
                'No folders excluded.'
            ),
            ...this.exclusionListDefinitions(
                'excludedTags',
                'Excluded tags',
                'Tags to exclude from zone selection (notes with only these tags will not become villagers)',
                'No tags excluded.'
            ),
            {
                name: 'Regenerate village',
                desc: 'Regenerate the village layout with current settings',
                // A button, not a row `action:` — `action:` makes the WHOLE
                // row clickable and draws no button at all. Kept after the
                // exclusion lists so, as in the previous tab, the action
                // follows every input it applies to.
                render: (setting): void => {
                    setting.addButton((button) =>
                        button.setButtonText('Regenerate').onClick(() => {
                            this.plugin.regenerateVillage()
                        })
                    )
                }
            },
            {
                type: 'group',
                heading: 'Display',
                items: [
                    {
                        name: 'Render quality',
                        desc: 'Graphics quality setting',
                        control: {
                            type: 'dropdown',
                            key: 'renderQuality',
                            options: {
                                [RenderQuality.LOW]: 'Low',
                                [RenderQuality.MEDIUM]: 'Medium',
                                [RenderQuality.HIGH]: 'High'
                            }
                        }
                    }
                ]
            },
            {
                type: 'group',
                heading: 'AI configuration',
                items: [
                    {
                        name: 'Anthropic API key',
                        desc: 'Your Anthropic API key for AI-powered conversations',
                        // A render row rather than a text control: the input is
                        // masked (type=password), which the declarative text
                        // control cannot express. Keystroke writes go through
                        // the serialized write path and never re-sync the
                        // input — not on success (a re-sync would clobber text
                        // typed ahead of the queued save) and not on failure
                        // either: every write carries the WHOLE displayed
                        // value, so leaving the typed text means the next
                        // keystroke re-persists exactly what the user sees,
                        // while a failure re-sync could roll the input back
                        // underneath newer queued writes and make the display
                        // diverge from what later persists.
                        render: (setting): void => {
                            setting.addText((text) => {
                                text.inputEl.type = 'password'
                                text.setPlaceholder('sk-ant-...')
                                    .setValue(this.plugin.settings.anthropicApiKey)
                                    .onChange((value) => {
                                        this.plugin
                                            .updateSettings((draft) => {
                                                draft.anthropicApiKey = value
                                            })
                                            .catch(() => {
                                                new Notice('Failed to save settings.')
                                            })
                                    })
                            })
                        }
                    },
                    {
                        name: 'AI model',
                        desc: 'Claude model to use for conversations',
                        control: {
                            type: 'dropdown',
                            key: 'aiModel',
                            options: {
                                [AIModel.CLAUDE_3_HAIKU]: 'Claude 3 Haiku (fast)',
                                [AIModel.CLAUDE_3_5_SONNET]: 'Claude 3.5 Sonnet',
                                [AIModel.CLAUDE_SONNET_4]: 'Claude Sonnet 4 (recommended)'
                            }
                        }
                    }
                ]
            },
            {
                type: 'group',
                heading: 'Conversations',
                items: [
                    {
                        name: 'Save conversations',
                        desc: 'Save AI conversations to your vault',
                        control: { type: 'toggle', key: 'saveConversations' }
                    },
                    {
                        name: 'Conversation folder',
                        desc: 'Folder to save conversations in',
                        control: {
                            type: 'text',
                            key: 'conversationFolder',
                            placeholder: 'village-conversations'
                        }
                    }
                ]
            },
            {
                type: 'group',
                heading: 'Advanced',
                items: [
                    {
                        name: 'Debug mode',
                        desc: 'Log verbose diagnostic messages to the developer console. Leave off unless troubleshooting.',
                        control: { type: 'toggle', key: 'debugMode' }
                    }
                ]
            },
            {
                type: 'group',
                // No heading: renderSupportSection draws its own.
                items: [
                    {
                        name: 'Support',
                        // Not a setting — keep it out of the settings search.
                        searchable: false,
                        render: (setting): void => {
                            // Render INSIDE the row (settingEl), never into
                            // group.listEl — see the class docs above.
                            setting.infoEl.remove() // the section draws its own headings
                            // `.setting-item` is a flex ROW. The support block
                            // is a stack of full-width rows, so without this it
                            // would lay its heading, buttons and badge out side
                            // by side.
                            setting.settingEl.addClass('settings-stack')
                            renderSupportSection(setting.settingEl, (el) => {
                                this.renderBuyMeACoffeeBadge(el)
                            })
                        }
                    }
                ]
            }
        ]
    }

    /**
     * Append an entry to one of the exclusion lists.
     *
     * Extracted from the add button so the write can be tested without a DOM.
     * Normalizes (tags lose their leading `#` and are lowercased, folders are
     * trimmed) and deduplicates, preserving the previous tab's behavior.
     * Returns whether anything was written, so the caller knows whether to
     * clear its input and re-render.
     *
     * The duplicate check runs against the COMMITTED list inside the mutator:
     * the write chain runs each mutation against the previously committed
     * state, and deciding out here would capture a pre-await snapshot — two
     * quick additions would each build on the same base, the second silently
     * dropping the first.
     */
    async addExclusion(
        key: 'excludedFolders' | 'excludedTags',
        raw: string
    ): Promise<'added' | 'duplicate' | 'empty'> {
        const value =
            key === 'excludedTags' ? raw.trim().replace(/^#/, '').toLowerCase() : raw.trim()
        if (value === '') {
            return 'empty'
        }
        let added = false
        await this.plugin.updateSettings((draft) => {
            if (draft[key].includes(value)) {
                return
            }
            draft[key] = [...draft[key], value]
            added = true
        })
        if (added) {
            this.plugin.regenerateVillage()
            return 'added'
        }
        return 'duplicate'
    }

    /**
     * One exclusion list: a header row carrying the description and the
     * add-an-entry control, then the entries as a native list.
     *
     * The add control stays an inline search box with autocomplete rather
     * than the framework's `addItem` affordance, because `addItem` hands back
     * a bare element and the whole point here is the suggester completion the
     * old tab had.
     */
    private exclusionListDefinitions(
        key: 'excludedFolders' | 'excludedTags',
        name: string,
        desc: string,
        emptyState: string
    ): SettingDefinitionItem[] {
        return [
            {
                name,
                desc,
                render: (setting): void => {
                    let searchInput: SearchComponent | undefined
                    setting.addSearch((cb) => {
                        searchInput = cb
                        if (key === 'excludedFolders') {
                            new FolderSuggester(this.app, cb.inputEl)
                            cb.setPlaceholder('Type folder path...')
                        } else {
                            new TagSuggester(this.app, cb.inputEl)
                            cb.setPlaceholder('Type tag name...')
                        }
                    })
                    setting.addButton((cb) => {
                        cb.setIcon('plus')
                        cb.setTooltip(key === 'excludedFolders' ? 'Add folder' : 'Add tag')
                        cb.onClick(() => {
                            const raw = searchInput?.getValue() ?? ''
                            void (async (): Promise<void> => {
                                const outcome = await this.addExclusion(key, raw)
                                // The previous tab cleared the input for
                                // duplicates too — the entry is present either
                                // way. Re-render only when something was
                                // written: a rebuild on a no-op would still
                                // discard unsaved edits elsewhere in the pane.
                                if (outcome !== 'empty') {
                                    searchInput?.setValue('')
                                }
                                if (outcome === 'added') {
                                    this.update()
                                }
                            })().catch(() => {
                                new Notice('Failed to save settings.')
                            })
                        })
                    })
                }
            },
            {
                type: 'list',
                emptyState,
                // The framework hands back a position into the list as it was
                // DRAWN. Resolve the entry to a value here, while that position
                // is still meaningful, then filter INSIDE the mutator against
                // the committed array. Filtering a snapshot captured out here
                // would let two quick deletions each write a stale whole array,
                // resurrecting the entry the other one removed.
                onDelete: (index: number): void => {
                    const target = this.plugin.settings[key][index]
                    if (target === undefined) {
                        return
                    }
                    void (async (): Promise<void> => {
                        await this.plugin.updateSettings((draft) => {
                            draft[key] = draft[key].filter((value) => value !== target)
                        })
                        this.plugin.regenerateVillage()
                        this.update()
                    })().catch(() => {
                        // The committed list is unchanged on failure, so no
                        // rebuild is needed — just say the write did not land.
                        new Notice('Failed to save settings.')
                    })
                },
                items: this.plugin.settings[key].map((entry) => ({
                    name: entry,
                    // Entries are data, not settings: keep them out of search.
                    searchable: false
                }))
            }
        ]
    }

    /**
     * Reads the value behind a control `key`. Returning undefined/null makes
     * the framework fall back to the control's declared `defaultValue`.
     */
    override getControlValue(key: string): unknown {
        switch (key as ControlKey) {
            case 'villageSeed':
                return this.plugin.settings.villageSeed
            case 'topTagCount':
                return this.plugin.settings.topTagCount
            case 'maxVillagers':
                return this.plugin.settings.maxVillagers
            case 'renderQuality':
                return this.plugin.settings.renderQuality
            case 'aiModel':
                return this.plugin.settings.aiModel
            case 'saveConversations':
                return this.plugin.settings.saveConversations
            case 'conversationFolder':
                return this.plugin.settings.conversationFolder
            case 'debugMode':
                return this.plugin.settings.debugMode
            default:
                return undefined
        }
    }

    /**
     * Persists a control edit. Rejecting (not resolving) on failure is what
     * lets the framework roll the control back to the stored truth.
     *
     * Village-shape writes rebuild the village AFTER the successful commit,
     * matching the previous tab's write-then-regenerate behavior.
     */
    override async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key as ControlKey) {
            case 'villageSeed':
                await this.writeString(key, value, (draft, next) => {
                    draft.villageSeed = next
                })
                break
            case 'topTagCount':
                await this.writeNumber(key, value, 3, 20, (draft, next) => {
                    draft.topTagCount = next
                })
                break
            case 'maxVillagers':
                await this.writeNumber(key, value, 10, 500, (draft, next) => {
                    draft.maxVillagers = next
                })
                break
            case 'renderQuality': {
                const next = this.expectOption(key, value, RenderQuality)
                await this.plugin.updateSettings((draft) => {
                    draft.renderQuality = next
                })
                break
            }
            case 'aiModel': {
                const next = this.expectOption(key, value, AIModel)
                await this.plugin.updateSettings((draft) => {
                    draft.aiModel = next
                })
                break
            }
            case 'saveConversations': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.saveConversations = next
                })
                break
            }
            case 'conversationFolder':
                await this.writeString(key, value, (draft, next) => {
                    draft.conversationFolder = next
                })
                break
            case 'debugMode': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.debugMode = next
                })
                break
            }
            default:
                new Notice('Failed to save settings.')
                throw new Error(`Setting "${key}" does not address a known field.`)
        }
        if (VILLAGE_SHAPE_KEYS.has(key)) {
            this.plugin.regenerateVillage()
        }
    }

    private async writeString(
        key: string,
        value: unknown,
        write: (draft: PluginSettings, next: string) => void
    ): Promise<void> {
        if (typeof value !== 'string') {
            throw new Error(`Setting "${key}" expects a string.`)
        }
        await this.plugin.updateSettings((draft) => {
            write(draft, value)
        })
    }

    /**
     * The slider constrains what the UI can produce, but `setControlValue` is
     * a public write surface: an unconstrained value (`Infinity` serializes as
     * `null` and makes the next load reject the whole settings object) must
     * never reach the store.
     */
    private async writeNumber(
        key: string,
        value: unknown,
        min: number,
        max: number,
        write: (draft: PluginSettings, next: number) => void
    ): Promise<void> {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
            throw new Error(`Setting "${key}" expects a whole number.`)
        }
        if (value < min || value > max) {
            throw new Error(`Setting "${key}" expects a value between ${min} and ${max}.`)
        }
        await this.plugin.updateSettings((draft) => {
            write(draft, value)
        })
    }

    private expectBoolean(key: string, value: unknown): boolean {
        if (typeof value !== 'boolean') {
            throw new Error(`Setting "${key}" expects a boolean.`)
        }
        return value
    }

    /**
     * Narrows a dropdown write to the enum's own values: membership over
     * `Object.values`, never a `typeof` check (which would accept any string)
     * and never a prototype-chain lookup.
     */
    private expectOption<T extends Record<string, string>>(
        key: string,
        value: unknown,
        options: T
    ): T[keyof T] {
        if (typeof value !== 'string' || !Object.values(options).includes(value)) {
            throw new Error(`Setting "${key}" expects one of the declared options.`)
        }
        return value as T[keyof T]
    }

    private renderBuyMeACoffeeBadge(contentEl: HTMLElement, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
