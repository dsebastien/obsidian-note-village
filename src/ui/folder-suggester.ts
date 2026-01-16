import { App, TFolder, AbstractInputSuggest } from 'obsidian'

/**
 * Folder suggester that provides autocomplete for folder paths.
 * Shows all folders in the vault as suggestions.
 */
export class FolderSuggester extends AbstractInputSuggest<TFolder> {
    private folders: TFolder[]
    private textInputEl: HTMLInputElement

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl)
        this.textInputEl = inputEl
        this.folders = this.getAllFolders()
    }

    /**
     * Get all folders in the vault
     */
    private getAllFolders(): TFolder[] {
        const folders: TFolder[] = []
        const rootFolder = this.app.vault.getRoot()

        const collectFolders = (folder: TFolder): void => {
            // Don't include root folder
            if (folder.path !== '/') {
                folders.push(folder)
            }

            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    collectFolders(child)
                }
            }
        }

        collectFolders(rootFolder)

        // Sort alphabetically
        return folders.sort((a, b) => a.path.localeCompare(b.path))
    }

    /**
     * Get suggestions based on input query
     */
    override getSuggestions(query: string): TFolder[] {
        const lowerQuery = query.toLowerCase()
        return this.folders.filter((folder) => folder.path.toLowerCase().includes(lowerQuery))
    }

    /**
     * Render a suggestion item
     */
    override renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.createDiv({ cls: 'suggestion-content' }).createDiv({
            cls: 'suggestion-title',
            text: folder.path
        })
    }

    /**
     * Called when a suggestion is selected
     */
    override selectSuggestion(folder: TFolder): void {
        this.textInputEl.value = folder.path
        this.textInputEl.trigger('input')
        this.close()
    }
}
