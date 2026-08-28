import { describe, expect, test, mock, beforeEach, afterEach, spyOn } from 'bun:test'
import { setupExcaliburMock } from '../../test/excalibur-mocks'
import { AIModel } from '#types/ai-model.intf'

/**
 * Behavioral coverage for the settings write path.
 *
 * Nothing in CI renders a settings pane, so these tests exercise the
 * properties no UI test can reach: writes are serialized, memory is committed
 * only after persistence succeeds, a rejected value never reaches the store,
 * and the debug-mode side effect tracks the COMMITTED state.
 */

// The obsidian package is types-only (no runtime code); the plugin and tab
// modules need runtime stand-ins for the classes they extend or construct.
void mock.module('obsidian', () => ({
    Notice: class Notice {},
    App: class App {},
    Plugin: class Plugin {},
    PluginSettingTab: class PluginSettingTab {},
    ItemView: class ItemView {},
    Component: class Component {},
    Modal: class Modal {},
    WorkspaceLeaf: class WorkspaceLeaf {},
    Setting: class Setting {},
    TAbstractFile: class TAbstractFile {},
    TFile: class TFile {},
    TFolder: class TFolder {},
    AbstractInputSuggest: class AbstractInputSuggest {},
    SearchComponent: class SearchComponent {},
    MarkdownRenderer: { render: async () => {} },
    setIcon: () => {},
    setTooltip: () => {}
}))
setupExcaliburMock()
// The plugin module imports VillageView, whose scene graph reaches excalibur
// classes the shared mock does not model (ex.Scene et al.). The view itself is
// irrelevant to the write path, so stub the module instead of widening the
// excalibur mock.
void mock.module('../../ui/village-view', () => ({
    VillageView: class VillageView {}
}))

// Import after mocking.
const { NoteVillagePlugin } = await import('../plugin')
const { NoteVillageSettingTab } = await import('./settings-tab')
const { DEFAULT_SETTINGS } = await import('#types/plugin-settings.intf')
const { log, setDebugMode } = await import('../../utils/log')

async function expectRejection(promise: Promise<unknown>, contains: string): Promise<void> {
    let caught: unknown
    await promise.catch((error: unknown) => {
        caught = error
    })
    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toContain(contains)
}

interface Harness {
    plugin: InstanceType<typeof NoteVillagePlugin>
    tab: InstanceType<typeof NoteVillageSettingTab>
    saveData: ReturnType<typeof mock>
    regenerateVillage: ReturnType<typeof mock>
}

function createHarness(options?: { saveData?: () => Promise<void> }): Harness {
    const saveData = mock(async () => {
        if (options?.saveData) {
            await options.saveData()
        }
    })
    const regenerateVillage = mock(() => {})

    const plugin = Object.create(NoteVillagePlugin.prototype) as InstanceType<
        typeof NoteVillagePlugin
    >
    const internals = plugin as unknown as Record<string, unknown>
    internals['settings'] = { ...DEFAULT_SETTINGS }
    internals['settingsWriteChain'] = Promise.resolve()
    internals['saveData'] = saveData
    internals['regenerateVillage'] = regenerateVillage

    const tab = Object.create(NoteVillageSettingTab.prototype) as InstanceType<
        typeof NoteVillageSettingTab
    >
    const tabInternals = tab as unknown as Record<string, unknown>
    tabInternals['plugin'] = plugin
    tabInternals['update'] = () => {}

    return { plugin, tab, saveData, regenerateVillage }
}

beforeEach(() => {
    setDebugMode(false)
})

afterEach(() => {
    setDebugMode(false)
})

describe('updateSettings', () => {
    test('commits to memory only after the write is persisted', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        const { plugin, saveData } = createHarness({ saveData: () => gate })

        const pending = plugin.updateSettings((draft) => {
            draft.villageSeed = 'committed'
        })

        // Let the queued write start and reach its save await; a bare
        // synchronous assertion would pass even with the ordering reversed,
        // because the chain defers the work to a microtask.
        await Promise.resolve()
        await Promise.resolve()
        expect(saveData).toHaveBeenCalledTimes(1)
        expect(plugin.settings.villageSeed).toBe(DEFAULT_SETTINGS.villageSeed)

        release()
        await pending
        expect(plugin.settings.villageSeed).toBe('committed')
    })

    test('leaves memory untouched and rejects when persistence fails', async () => {
        const { plugin } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })

        await expectRejection(
            plugin.updateSettings((draft) => {
                draft.topTagCount = 19
            }),
            'disk full'
        )
        expect(plugin.settings.topTagCount).toBe(DEFAULT_SETTINGS.topTagCount)
    })

    test('serializes overlapping writes so both land', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        let first = true
        const { plugin } = createHarness({
            saveData: () => {
                if (first) {
                    first = false
                    return gate
                }
                return Promise.resolve()
            }
        })

        const a = plugin.updateSettings((draft) => {
            draft.villageSeed = 'first'
        })
        const b = plugin.updateSettings((draft) => {
            draft.topTagCount = 17
        })
        release()
        await Promise.all([a, b])
        expect(plugin.settings.villageSeed).toBe('first')
        expect(plugin.settings.topTagCount).toBe(17)
    })

    test('applies the debug-mode side effect only after a successful commit', async () => {
        const { plugin } = createHarness()
        const debugSpy = spyOn(console, 'debug').mockImplementation(() => {})
        try {
            log('before enabling', 'debug')
            expect(debugSpy).not.toHaveBeenCalled()

            await plugin.updateSettings((draft) => {
                draft.debugMode = true
            })
            log('after enabling', 'debug')
            expect(debugSpy).toHaveBeenCalledTimes(1)
        } finally {
            debugSpy.mockRestore()
        }
    })

    test('does not enable debug logging when the enabling write fails', async () => {
        const { plugin } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })
        const debugSpy = spyOn(console, 'debug').mockImplementation(() => {})
        try {
            await expectRejection(
                plugin.updateSettings((draft) => {
                    draft.debugMode = true
                }),
                'disk full'
            )
            log('after failed enable', 'debug')
            expect(debugSpy).not.toHaveBeenCalled()
        } finally {
            debugSpy.mockRestore()
        }
    })
})

describe('addExclusion', () => {
    test('trims folders and refuses blanks without writing', async () => {
        const { tab, plugin, saveData } = createHarness()
        expect(await tab.addExclusion('excludedFolders', '   ')).toBe(false)
        expect(saveData).not.toHaveBeenCalled()

        expect(await tab.addExclusion('excludedFolders', '  Projects/Active  ')).toBe(true)
        expect(plugin.settings.excludedFolders).toEqual(['Projects/Active'])
    })

    test('normalizes tags (strips # and lowercases)', async () => {
        const { tab, plugin } = createHarness()
        expect(await tab.addExclusion('excludedTags', '#Archive')).toBe(true)
        expect(plugin.settings.excludedTags).toEqual(['archive'])
    })

    test('refuses duplicates against the committed list', async () => {
        const { tab, plugin, regenerateVillage } = createHarness()
        expect(await tab.addExclusion('excludedTags', 'daily')).toBe(true)
        regenerateVillage.mockClear()
        expect(await tab.addExclusion('excludedTags', '#Daily')).toBe(false)
        expect(plugin.settings.excludedTags).toEqual(['daily'])
        expect(regenerateVillage).not.toHaveBeenCalled()
    })

    test('rebuilds the village after a successful addition', async () => {
        const { tab, regenerateVillage } = createHarness()
        await tab.addExclusion('excludedFolders', 'Templates')
        expect(regenerateVillage).toHaveBeenCalledTimes(1)
    })
})

describe('setControlValue', () => {
    test('persists a village-shape write and rebuilds the village', async () => {
        const { tab, plugin, regenerateVillage } = createHarness()
        await tab.setControlValue('villageSeed', 'my-seed')
        expect(plugin.settings.villageSeed).toBe('my-seed')
        expect(regenerateVillage).toHaveBeenCalledTimes(1)
    })

    test('does not rebuild the village for non-shape writes', async () => {
        const { tab, plugin, regenerateVillage } = createHarness()
        await tab.setControlValue('saveConversations', true)
        expect(plugin.settings.saveConversations).toBe(true)
        expect(regenerateVillage).not.toHaveBeenCalled()
    })

    test('rejects a type-mismatched value without writing', async () => {
        const { tab, plugin, saveData } = createHarness()
        await expectRejection(tab.setControlValue('topTagCount', 'twelve'), 'expects a number')
        expect(saveData).not.toHaveBeenCalled()
        expect(plugin.settings.topTagCount).toBe(DEFAULT_SETTINGS.topTagCount)
    })

    test('rejects a dropdown value outside the declared options', async () => {
        const { tab, plugin } = createHarness()
        await expectRejection(
            tab.setControlValue('aiModel', 'gpt-4'),
            'expects one of the declared options'
        )
        expect(plugin.settings.aiModel).toBe(DEFAULT_SETTINGS.aiModel)

        await tab.setControlValue('aiModel', AIModel.CLAUDE_3_HAIKU)
        expect(plugin.settings.aiModel).toBe(AIModel.CLAUDE_3_HAIKU)
    })

    test('rejects an unknown key', async () => {
        const { tab, saveData } = createHarness()
        await expectRejection(
            tab.setControlValue('__proto__', 'x'),
            'does not address a known field'
        )
        expect(saveData).not.toHaveBeenCalled()
    })
})
