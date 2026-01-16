import type { App, TFile, CachedMetadata } from 'obsidian'
import { AbstractInputSuggest } from 'obsidian'

/**
 * Tag suggester that provides autocomplete for tag names.
 * Shows all tags in the vault as suggestions.
 */
export class TagSuggester extends AbstractInputSuggest<string> {
    private tags: string[]
    private textInputEl: HTMLInputElement

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl)
        this.textInputEl = inputEl
        this.tags = this.getAllTags()
    }

    /**
     * Get all unique tags in the vault
     */
    private getAllTags(): string[] {
        const tagSet = new Set<string>()
        const files = this.app.vault.getMarkdownFiles()

        for (const file of files) {
            const tags = this.getFileTags(file)
            for (const tag of tags) {
                tagSet.add(this.normalizeTag(tag))
            }
        }

        // Sort alphabetically
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
    }

    /**
     * Get all tags from a file's metadata
     */
    private getFileTags(file: TFile): string[] {
        const metadata = this.app.metadataCache.getFileCache(file)
        if (!metadata) return []

        const tags: string[] = []

        // Get inline tags
        if (metadata.tags) {
            for (const tagRef of metadata.tags) {
                tags.push(tagRef.tag)
            }
        }

        // Get frontmatter tags
        const frontmatterTags = this.getFrontmatterTags(metadata)
        tags.push(...frontmatterTags)

        return tags
    }

    /**
     * Extract tags from frontmatter
     */
    private getFrontmatterTags(metadata: CachedMetadata): string[] {
        const frontmatter = metadata.frontmatter
        if (!frontmatter) return []

        const tags: string[] = []
        const fmTags = frontmatter['tags']
        const fmTag = frontmatter['tag']

        // Handle 'tags' field (can be array or string)
        if (fmTags) {
            if (Array.isArray(fmTags)) {
                for (const tag of fmTags) {
                    if (typeof tag === 'string') {
                        tags.push(tag.startsWith('#') ? tag : `#${tag}`)
                    }
                }
            } else if (typeof fmTags === 'string') {
                // Tags as comma-separated string
                const tagList = fmTags.split(',').map((t: string) => t.trim())
                for (const tag of tagList) {
                    if (tag) {
                        tags.push(tag.startsWith('#') ? tag : `#${tag}`)
                    }
                }
            }
        }

        // Handle 'tag' field (single tag)
        if (fmTag && typeof fmTag === 'string') {
            const tag = fmTag.trim()
            if (tag) {
                tags.push(tag.startsWith('#') ? tag : `#${tag}`)
            }
        }

        return tags
    }

    /**
     * Normalize tag (remove # prefix, lowercase)
     */
    private normalizeTag(tag: string): string {
        return tag.replace(/^#/, '').toLowerCase()
    }

    /**
     * Get suggestions based on input query
     */
    override getSuggestions(query: string): string[] {
        const lowerQuery = query.toLowerCase()
        return this.tags.filter((tag) => tag.toLowerCase().includes(lowerQuery))
    }

    /**
     * Render a suggestion item
     */
    override renderSuggestion(tag: string, el: HTMLElement): void {
        el.createDiv({ cls: 'suggestion-content' }).createDiv({
            cls: 'suggestion-title',
            text: tag
        })
    }

    /**
     * Called when a suggestion is selected
     */
    override selectSuggestion(tag: string): void {
        this.textInputEl.value = tag
        this.textInputEl.trigger('input')
        this.close()
    }
}
