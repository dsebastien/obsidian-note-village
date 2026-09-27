import { mock } from 'bun:test'

/**
 * Test setup file for Bun tests
 * This file is loaded before all tests via bunfig.toml preload
 */

/**
 * The `obsidian` package ships type declarations only (no runtime code), so
 * every module a spec loads that imports a value from it needs a stand-in.
 * They are all declared here, once: a module mock registered by the preload
 * cannot gain exports from a later mock.module in a spec, whose static
 * imports are linked first.
 *
 * Specs build vault files as real instances of the file classes
 * (`Object.assign(new TFile(), {...})`), so no double is cast to TFile or
 * TFolder and `instanceof` checks behave as they do in Obsidian.
 */
class TAbstractFile {}
class TFile extends TAbstractFile {}
class TFolder extends TAbstractFile {}

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
    TAbstractFile,
    TFile,
    TFolder,
    AbstractInputSuggest: class AbstractInputSuggest {},
    SearchComponent: class SearchComponent {},
    MarkdownRenderer: { render: (): Promise<void> => Promise.resolve() },
    setIcon: (): void => {},
    setTooltip: (): void => {}
}))

/**
 * Plugin code calls `window.setTimeout` and friends for popout-window
 * compatibility, and Bun's test runner has no `window`. Point it at the global
 * object, reached through `self` (Bun defines it, like browsers and workers
 * do): obsidianmd/no-global-this bans the `global` and `globalThis` names.
 */
const root = self as unknown as { window?: unknown }
root.window ??= root
