import { describe, expect, mock, test } from 'bun:test'
import { setupExcaliburMock } from '../test/excalibur-mocks'
import type { SecretStore } from '#types/secret-store.intf'

/**
 * API key lifecycle through the plugin: per-device bootstrap on load, use-time
 * reads, rotation, clearing and the legacy-copy purge.
 */

setupExcaliburMock()
void mock.module('../ui/village-view', () => ({
    VillageView: class VillageView {}
}))

const { NoteVillagePlugin } = await import('./plugin')
const { NoteVillageSettingTab } = await import('./settings/settings-tab')
const { DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME } = await import('#types/plugin-settings.intf')

const NAME = DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME
const DAY_MS = 24 * 60 * 60 * 1000

function createStore(initial: Record<string, string> = {}): SecretStore & {
    secrets: Map<string, string>
} {
    const secrets = new Map(Object.entries(initial))
    return {
        secrets,
        getSecret: (id: string): string | null => secrets.get(id) ?? null,
        setSecret: (id: string, secret: string): void => {
            secrets.set(id, secret)
        },
        listSecrets: (): string[] => [...secrets.keys()]
    }
}

function createPlugin(
    dataJson: unknown,
    store: SecretStore
): {
    plugin: InstanceType<typeof NoteVillagePlugin>
    tab: InstanceType<typeof NoteVillageSettingTab>
    saved: () => Record<string, unknown> | undefined
} {
    let disk: unknown = dataJson
    const plugin = Object.create(NoteVillagePlugin.prototype) as InstanceType<
        typeof NoteVillagePlugin
    >
    const internals = plugin as unknown as Record<string, unknown>
    internals['app'] = { secretStorage: store }
    internals['settingsWriteChain'] = Promise.resolve()
    internals['loadData'] = (): Promise<unknown> => Promise.resolve(disk)
    internals['saveData'] = (data: unknown): Promise<void> => {
        // Round-trip through JSON like data.json does (undefined fields vanish).
        disk = JSON.parse(JSON.stringify(data)) as unknown
        return Promise.resolve()
    }

    const tab = Object.create(NoteVillageSettingTab.prototype) as InstanceType<
        typeof NoteVillageSettingTab
    >
    const tabInternals = tab as unknown as Record<string, unknown>
    tabInternals['plugin'] = plugin
    tabInternals['update'] = (): void => {}

    return { plugin, tab, saved: () => disk as Record<string, unknown> | undefined }
}

describe('API key secret lifecycle', () => {
    test('first device: migrates the legacy key, keeps the plaintext as bootstrap for other devices', async () => {
        const store = createStore()
        const { plugin, saved } = createPlugin({ anthropicApiKey: 'sk-1' }, store)

        await plugin.loadSettings()

        expect(store.getSecret(NAME)).toBe('sk-1')
        expect(plugin.getAnthropicApiKey()).toBe('sk-1')
        expect(saved()?.['anthropicApiKey']).toBe('sk-1')
        expect(saved()?.['anthropicApiKeySecretName']).toBe(NAME)
        expect(typeof saved()?.['legacySecretMigratedAt']).toBe('string')
    })

    test('device B: synced data.json with the legacy key and empty SecretStorage stays logged in', async () => {
        const deviceA = createStore()
        const a = createPlugin({ anthropicApiKey: 'sk-1' }, deviceA)
        await a.plugin.loadSettings()

        const deviceB = createStore()
        const b = createPlugin(a.saved(), deviceB)
        await b.plugin.loadSettings()

        expect(deviceB.getSecret(NAME)).toBe('sk-1')
        expect(b.plugin.getAnthropicApiKey()).toBe('sk-1')
    })

    test('rotate: picking a secret removes the stale legacy copy and writes only the name', async () => {
        const store = createStore()
        const { plugin, tab, saved } = createPlugin({ anthropicApiKey: 'sk-1' }, store)
        await plugin.loadSettings()

        store.setSecret('rotated-key', 'sk-2')
        await tab.setApiKeySecretName('rotated-key')

        expect(saved()?.['anthropicApiKey']).toBeUndefined()
        expect(saved()?.['anthropicApiKeySecretName']).toBe('rotated-key')
        expect(JSON.stringify(saved())).not.toContain('sk-2')
        expect(plugin.getAnthropicApiKey()).toBe('sk-2')
    })

    test('rejects a non-string secret name', async () => {
        const { tab } = createPlugin(undefined, createStore())
        let caught: unknown
        await tab.setApiKeySecretName(42).catch((error: unknown) => {
            caught = error
        })
        expect(caught).toBeInstanceOf(Error)
    })

    test('clear: empties this device secret and deletes the legacy copy', async () => {
        const store = createStore()
        const { plugin, saved } = createPlugin({ anthropicApiKey: 'sk-1' }, store)
        await plugin.loadSettings()

        await plugin.clearAnthropicApiKey()

        expect(store.getSecret(NAME)).toBe('')
        expect(saved()?.['anthropicApiKey']).toBeUndefined()
        expect(plugin.getAnthropicApiKey()).toBe('')
    })

    test('60-day purge: the legacy copy is removed on load after the grace period', async () => {
        const store = createStore()
        const { plugin, saved } = createPlugin(
            {
                anthropicApiKey: 'sk-1',
                legacySecretMigratedAt: new Date(Date.now() - 61 * DAY_MS).toISOString()
            },
            store
        )

        await plugin.loadSettings()

        expect(saved()?.['anthropicApiKey']).toBeUndefined()
        expect(plugin.getAnthropicApiKey()).toBe('sk-1')
    })

    test('button purge: removes the legacy copy now, the key keeps working on this device', async () => {
        const store = createStore()
        const { plugin, saved } = createPlugin({ anthropicApiKey: 'sk-1' }, store)
        await plugin.loadSettings()

        await plugin.removeLegacyApiKeyCopy()

        expect(saved()?.['anthropicApiKey']).toBeUndefined()
        expect(plugin.getAnthropicApiKey()).toBe('sk-1')
    })

    test('fresh install: no legacy key, nothing written to SecretStorage or disk', async () => {
        const store = createStore()
        const { plugin, saved } = createPlugin(undefined, store)
        await plugin.loadSettings()

        expect(store.secrets.size).toBe(0)
        expect(saved()).toBeUndefined()
        expect(plugin.getAnthropicApiKey()).toBe('')
    })
})
