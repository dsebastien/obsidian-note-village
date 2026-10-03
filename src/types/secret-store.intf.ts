import type { SecretStorage } from 'obsidian'

/**
 * The slice of Obsidian's SecretStorage (`app.secretStorage`) the plugin uses.
 * Narrowed so the migration and lookup helpers can be tested with a plain
 * in-memory double.
 */
export type SecretStore = Pick<SecretStorage, 'getSecret' | 'setSecret' | 'listSecrets'>
