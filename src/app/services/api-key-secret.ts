import { produce } from 'immer'
import type { PluginSettings } from '#types/plugin-settings.intf'
import type { SecretStore } from '#types/secret-store.intf'

/**
 * How long the legacy plaintext key stays in data.json after the first
 * migration, so every synced device can copy it into its own SecretStorage.
 */
export const LEGACY_API_KEY_GRACE_PERIOD_MS = 60 * 24 * 60 * 60 * 1000

/** The legacy plaintext key, or '' when absent/blank. */
function legacyKey(settings: PluginSettings): string {
    const value = settings.anthropicApiKey ?? ''
    return value.trim() === '' ? '' : value
}

/** A secret's value on this device; '' when absent ('' is how a secret is cleared). */
function secretValue(store: SecretStore, name: string): string {
    if (name === '') {
        return ''
    }
    return store.getSecret(name) ?? ''
}

/**
 * The first of `<base>`, `<base>-2`, ... that is free or already holds
 * `value`. A secret holding a DIFFERENT value is never overwritten.
 */
function pickSecretName(store: SecretStore, base: string, value: string): string {
    for (let suffix = 1; ; suffix++) {
        const candidate = suffix === 1 ? base : `${base}-${suffix}`
        const existing = secretValue(store, candidate)
        if (existing === '' || existing === value) {
            return candidate
        }
    }
}

/**
 * Per-device bootstrap, run on every load.
 *
 * SecretStorage is device-local, so the legacy plaintext key stays in
 * data.json for a grace period and each device copies it into its own
 * SecretStorage when the secret is absent there. Returns the (possibly
 * updated) settings; the same object when nothing changed.
 *
 * - First migration (no `legacySecretMigratedAt`): picks a secret name that
 *   never overwrites a different existing secret, and records the date.
 * - Secret absent on this device: copied from the legacy field.
 * - Secret present but different from the legacy value: the key was rotated,
 *   so the stale legacy copy is removed.
 * - Grace period elapsed: the legacy copy is removed.
 *
 * Idempotent: a second run on its own output changes nothing.
 */
export function bootstrapApiKeySecret(
    settings: PluginSettings,
    store: SecretStore,
    now: Date
): PluginSettings {
    const legacy = legacyKey(settings)
    if (legacy === '') {
        if (settings.anthropicApiKey === undefined) {
            return settings
        }
        // A blank legacy field carries nothing; drop it.
        return produce(settings, (draft) => {
            delete draft.anthropicApiKey
        })
    }

    return produce(settings, (draft) => {
        const firstMigration = draft.legacySecretMigratedAt === ''
        if (firstMigration) {
            draft.anthropicApiKeySecretName = pickSecretName(
                store,
                draft.anthropicApiKeySecretName,
                legacy
            )
            draft.legacySecretMigratedAt = now.toISOString()
        }

        const name = draft.anthropicApiKeySecretName
        if (name === '') {
            return
        }
        const current = secretValue(store, name)
        if (current === '') {
            store.setSecret(name, legacy)
        } else if (current !== legacy) {
            // Rotated on this device: the legacy copy is stale.
            delete draft.anthropicApiKey
            return
        }

        const migratedAt = Date.parse(draft.legacySecretMigratedAt)
        if (
            !Number.isNaN(migratedAt) &&
            now.getTime() - migratedAt >= LEGACY_API_KEY_GRACE_PERIOD_MS
        ) {
            delete draft.anthropicApiKey
        }
    })
}

/**
 * The API key at use time: SecretStorage first, then the legacy field (which
 * is copied into SecretStorage at that moment). '' when neither has one.
 */
export function resolveApiKey(settings: PluginSettings, store: SecretStore): string {
    const name = settings.anthropicApiKeySecretName
    const fromSecret = secretValue(store, name)
    if (fromSecret !== '') {
        return fromSecret
    }
    const legacy = legacyKey(settings)
    if (legacy !== '' && name !== '') {
        store.setSecret(name, legacy)
    }
    return legacy
}

/**
 * Whether a secret name is configured but neither this device's SecretStorage
 * nor the legacy field holds a key: the user must set the secret on this device.
 */
export function isApiKeySecretMissing(settings: PluginSettings, store: SecretStore): boolean {
    return settings.anthropicApiKeySecretName !== '' && resolveApiKey(settings, store) === ''
}
