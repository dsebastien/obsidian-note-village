import type { App, CachedMetadata, TFile } from 'obsidian'
import { log } from '../utils/log'
import type { ScannedNote } from '#types/scanned-note.intf'

/**
 * Scans vault for notes matching specified criteria
 */
export class NoteScanner {
    constructor(private app: App) {}

    /**
     * Get all notes that have at least one of the specified tags
     */
    getNotesWithTags(tags: string[]): ScannedNote[] {
        log(`Scanning for notes with tags: ${tags.join(', ')}`, 'debug')

        const normalizedTags = new Set(tags.map((t) => this.normalizeTag(t)))
        const files = this.app.vault.getMarkdownFiles()
        const matchingNotes: ScannedNote[] = []

        for (const file of files) {
            const note = this.scanFile(file, normalizedTags)
            if (note) {
                matchingNotes.push(note)
            }
        }

        log(`Found ${matchingNotes.length} notes with specified tags`, 'debug')
        return matchingNotes
    }

    /**
     * Get all notes in the vault
     */
    getAllNotes(): ScannedNote[] {
        log('Scanning all notes', 'debug')

        const files = this.app.vault.getMarkdownFiles()
        const notes: ScannedNote[] = []

        for (const file of files) {
            const note = this.scanFileBasic(file)
            if (note) {
                notes.push(note)
            }
        }

        log(`Found ${notes.length} total notes`, 'debug')
        return notes
    }

    /**
     * Get notes grouped by their primary tag
     */
    getNotesGroupedByTag(tags: string[]): Map<string, ScannedNote[]> {
        const notes = this.getNotesWithTags(tags)
        const grouped = new Map<string, ScannedNote[]>()

        for (const tag of tags) {
            grouped.set(this.normalizeTag(tag), [])
        }

        for (const note of notes) {
            const group = grouped.get(note.primaryTag)
            if (group) {
                group.push(note)
            }
        }

        return grouped
    }

    /**
     * Scan a file and return note data if it has any of the target tags
     */
    private scanFile(file: TFile, targetTags: Set<string>): ScannedNote | null {
        const metadata = this.app.metadataCache.getFileCache(file)
        if (!metadata) return null

        const fileTags = this.getFileTags(metadata)
        const normalizedFileTags = fileTags.map((t) => this.normalizeTag(t))

        // Find which target tags this file has
        const matchingTags = normalizedFileTags.filter((t) => targetTags.has(t))
        if (matchingTags.length === 0) return null

        // Primary tag is the first matching tag (highest priority)
        const primaryTag = matchingTags[0]
        if (!primaryTag) return null

        return {
            file,
            path: file.path,
            name: file.basename,
            tags: normalizedFileTags,
            primaryTag,
            contentLength: file.stat.size,
            createdTime: file.stat.ctime,
            modifiedTime: file.stat.mtime
        }
    }

    /**
     * Scan a file without tag filtering
     */
    private scanFileBasic(file: TFile): ScannedNote | null {
        const metadata = this.app.metadataCache.getFileCache(file)
        const fileTags = metadata ? this.getFileTags(metadata) : []
        const normalizedFileTags = fileTags.map((t) => this.normalizeTag(t))

        return {
            file,
            path: file.path,
            name: file.basename,
            tags: normalizedFileTags,
            primaryTag: normalizedFileTags[0] ?? 'untagged',
            contentLength: file.stat.size,
            createdTime: file.stat.ctime,
            modifiedTime: file.stat.mtime
        }
    }

    /**
     * Get all tags from a file's metadata
     */
    private getFileTags(metadata: CachedMetadata): string[] {
        const tags: string[] = []

        // Get inline tags
        if (metadata.tags) {
            for (const tagRef of metadata.tags) {
                tags.push(tagRef.tag)
            }
        }

        // Get frontmatter tags
        const frontmatter = metadata.frontmatter
        if (frontmatter) {
            const fmTags = frontmatter['tags']
            const fmTag = frontmatter['tag']

            if (fmTags) {
                if (Array.isArray(fmTags)) {
                    for (const tag of fmTags) {
                        if (typeof tag === 'string') {
                            tags.push(tag.startsWith('#') ? tag : `#${tag}`)
                        }
                    }
                } else if (typeof fmTags === 'string') {
                    const tagList = fmTags.split(',').map((t: string) => t.trim())
                    for (const tag of tagList) {
                        if (tag) {
                            tags.push(tag.startsWith('#') ? tag : `#${tag}`)
                        }
                    }
                }
            }

            if (fmTag && typeof fmTag === 'string') {
                const tag = fmTag.trim()
                if (tag) {
                    tags.push(tag.startsWith('#') ? tag : `#${tag}`)
                }
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
     * Read the content of a note
     */
    async readNoteContent(file: TFile): Promise<string> {
        return await this.app.vault.read(file)
    }
}
