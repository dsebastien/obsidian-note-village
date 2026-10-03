import { describe, expect, test } from 'bun:test'
import {
    LEGACY_API_KEY_GRACE_PERIOD_MS,
    bootstrapApiKeySecret,
    isApiKeySecretMissing,
    resolveApiKey
} from './api-key-secret'
import {
    DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME,
    DEFAULT_SETTINGS
} from '#types/plugin-settings.intf'
import type { PluginSettings } from '#types/plugin-settings.intf'
import type { SecretStore } from '#types/secret-store.intf'

const DEFAULT_NAME = DEFAULT_ANTHROPIC_API_KEY_SECRET_NAME
const NOW = new Date('2026-10-03T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

type TestStore = SecretStore & { secrets: Map<string, string>; writes: number }

/** In-memory SecretStorage double that enforces the real id format. */
function createStore(initial: Record<string, string> = {}): TestStore {
    const secrets = new Map(Object.entries(initial))
    const store: TestStore = {
        secrets,
        writes: 0,
        getSecret: (id: string): string | null => secrets.get(id) ?? null,
        setSecret: (id: string, secret: string): void => {
            if (!/^[a-z0-9-]+$/.test(id)) {
                throw new Error(`Invalid secret id: ${id}`)
            }
            store.writes++
            secrets.set(id, secret)
        },
        listSecrets: (): string[] => [...secrets.keys()]
    }
    return store
}

function settings(overrides: Partial<PluginSettings> = {}): PluginSettings {
    return { ...DEFAULT_SETTINGS, ...overrides }
}

describe('bootstrapApiKeySecret', () => {
    test('first device: copies the legacy key into the default secret and records the date, keeping the legacy copy', () => {
        const store = createStore()
        const result = bootstrapApiKeySecret(settings({ anthropicApiKey: 'sk-1' }), store, NOW)

        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-1')
        expect(result.anthropicApiKeySecretName).toBe(DEFAULT_NAME)
        expect(result.legacySecretMigratedAt).toBe(NOW.toISOString())
        expect(result.anthropicApiKey).toBe('sk-1')
    })

    test('device B: synced data.json with the legacy key and an empty SecretStorage gets migrated', () => {
        const synced = settings({
            anthropicApiKey: 'sk-1',
            legacySecretMigratedAt: new Date(NOW.getTime() - 5 * DAY_MS).toISOString()
        })
        const store = createStore()
        const result = bootstrapApiKeySecret(synced, store, NOW)

        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-1')
        expect(resolveApiKey(result, store)).toBe('sk-1')
        expect(result).toBe(synced) // nothing to persist
    })

    test('treats a cleared ("") secret as absent and re-bootstraps it', () => {
        const store = createStore({ [DEFAULT_NAME]: '' })
        bootstrapApiKeySecret(settings({ anthropicApiKey: 'sk-1' }), store, NOW)
        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-1')
    })

    test('first migration never overwrites a different existing secret', () => {
        const store = createStore({ [DEFAULT_NAME]: 'sk-other' })
        const result = bootstrapApiKeySecret(settings({ anthropicApiKey: 'sk-mine' }), store, NOW)

        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-other')
        expect(store.getSecret(`${DEFAULT_NAME}-2`)).toBe('sk-mine')
        expect(result.anthropicApiKeySecretName).toBe(`${DEFAULT_NAME}-2`)
        expect(result.anthropicApiKey).toBe('sk-mine')
    })

    test('first migration reuses a secret that already holds the same value', () => {
        const store = createStore({ [DEFAULT_NAME]: 'sk-1' })
        const result = bootstrapApiKeySecret(settings({ anthropicApiKey: 'sk-1' }), store, NOW)

        expect(store.writes).toBe(0)
        expect(result.anthropicApiKeySecretName).toBe(DEFAULT_NAME)
    })

    test('rotation detected (secret differs from the legacy copy after migration): removes the stale legacy copy', () => {
        const store = createStore({ [DEFAULT_NAME]: 'sk-new' })
        const result = bootstrapApiKeySecret(
            settings({ anthropicApiKey: 'sk-old', legacySecretMigratedAt: NOW.toISOString() }),
            store,
            NOW
        )

        expect(result.anthropicApiKey).toBeUndefined()
        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-new')
    })

    test('removes the legacy copy once the 60-day grace period has elapsed', () => {
        const store = createStore()
        const migratedAt = new Date(NOW.getTime() - LEGACY_API_KEY_GRACE_PERIOD_MS)
        const result = bootstrapApiKeySecret(
            settings({ anthropicApiKey: 'sk-1', legacySecretMigratedAt: migratedAt.toISOString() }),
            store,
            NOW
        )

        expect(LEGACY_API_KEY_GRACE_PERIOD_MS).toBe(60 * DAY_MS)
        expect(result.anthropicApiKey).toBeUndefined()
        // This device still got the key before the purge.
        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-1')
    })

    test('keeps the legacy copy one day before the grace period ends', () => {
        const migratedAt = new Date(NOW.getTime() - 59 * DAY_MS)
        const result = bootstrapApiKeySecret(
            settings({ anthropicApiKey: 'sk-1', legacySecretMigratedAt: migratedAt.toISOString() }),
            createStore(),
            NOW
        )
        expect(result.anthropicApiKey).toBe('sk-1')
    })

    test('drops a blank legacy field without touching SecretStorage', () => {
        const store = createStore()
        const result = bootstrapApiKeySecret(settings({ anthropicApiKey: '  ' }), store, NOW)

        expect(result.anthropicApiKey).toBeUndefined()
        expect(result.legacySecretMigratedAt).toBe('')
        expect(store.writes).toBe(0)
    })

    test('returns the same object when there is no legacy key', () => {
        const input = settings()
        expect(bootstrapApiKeySecret(input, createStore(), NOW)).toBe(input)
    })

    test('is idempotent', () => {
        const store = createStore()
        const first = bootstrapApiKeySecret(settings({ anthropicApiKey: 'sk-1' }), store, NOW)
        const second = bootstrapApiKeySecret(first, store, NOW)

        expect(second).toBe(first)
        expect(store.writes).toBe(1)
        expect(store.listSecrets()).toEqual([DEFAULT_NAME])
    })
})

describe('resolveApiKey', () => {
    test('prefers SecretStorage', () => {
        const store = createStore({ [DEFAULT_NAME]: 'sk-secret' })
        expect(resolveApiKey(settings({ anthropicApiKey: 'sk-legacy' }), store)).toBe('sk-secret')
    })

    test('falls back to the legacy field and migrates it at that moment', () => {
        const store = createStore()
        expect(resolveApiKey(settings({ anthropicApiKey: 'sk-legacy' }), store)).toBe('sk-legacy')
        expect(store.getSecret(DEFAULT_NAME)).toBe('sk-legacy')
    })

    test('returns an empty string when neither source has a key', () => {
        expect(resolveApiKey(settings(), createStore())).toBe('')
    })

    test('does not write a secret when no name is configured', () => {
        const store = createStore()
        expect(
            resolveApiKey(settings({ anthropicApiKeySecretName: '', anthropicApiKey: 'k' }), store)
        ).toBe('k')
        expect(store.writes).toBe(0)
    })
})

describe('isApiKeySecretMissing', () => {
    test('is true only when a name is set and both sources are empty', () => {
        expect(isApiKeySecretMissing(settings(), createStore())).toBe(true)
    })

    test('is false when the legacy field can still bootstrap the key', () => {
        expect(isApiKeySecretMissing(settings({ anthropicApiKey: 'k' }), createStore())).toBe(false)
    })

    test('is false when the secret exists', () => {
        expect(isApiKeySecretMissing(settings(), createStore({ [DEFAULT_NAME]: 'k' }))).toBe(false)
    })

    test('is false when no name is configured', () => {
        expect(
            isApiKeySecretMissing(settings({ anthropicApiKeySecretName: '' }), createStore())
        ).toBe(false)
    })
})
