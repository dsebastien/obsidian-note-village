import * as pluginManifest from '../../manifest.json'
import type { LogLevel } from '#types/log-level.intf'

export const LOG_SEPARATOR = '--------------------------------------------------------'
export const LOG_PREFIX = `${pluginManifest.name}:`

/**
 * When disabled (the default), no messages are written to the console.
 * Users can opt in via the "Debug mode" setting when they need verbose logs
 * to report an issue. This keeps the plugin quiet during normal operation.
 */
let debugModeEnabled = false

/**
 * Enable or disable debug logging to the console.
 */
export const setDebugMode = (enabled: boolean): void => {
    debugModeEnabled = enabled
}

/**
 * Log a message (only when debug mode is enabled)
 * @param message
 * @param level
 * @param data
 */
export const log = (message: string, level?: LogLevel, ...data: unknown[]): void => {
    if (!debugModeEnabled) return

    const logMessage = `${LOG_PREFIX} ${message}`
    switch (level) {
        case 'debug':
            console.debug(logMessage, data)
            break
        case 'info':
            console.debug(logMessage, data)
            break
        case 'warn':
            console.warn(logMessage, data)
            break
        case 'error':
            console.error(logMessage, data)
            break
        default:
            // Obsidian requires console.debug for normal logs
            console.debug(logMessage, data)
    }
}
