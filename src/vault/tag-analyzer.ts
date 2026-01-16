import type { App, CachedMetadata, TFile } from 'obsidian'
import { log } from '../utils/log'
import type { TagCount } from '#types/tag-count.intf'
import type { TagAnalysisResult } from '#types/tag-analysis-result.intf'

/**
 * Analyzes tags in the vault to determine zone distribution
 */
export class TagAnalyzer {
    private excludedFolders: string[] = []
    private excludedTags: string[] = []

    constructor(private app: App) {}

    /**
     * Set folders to exclude from analysis
     */
    setExcludedFolders(folders: string[]): void {
        this.excludedFolders = folders
        log(`TagAnalyzer: Excluding folders: ${folders.join(', ')}`, 'debug')
    }

    /**
     * Set tags to exclude from zone selection
     */
    setExcludedTags(tags: string[]): void {
        this.excludedTags = tags.map((t) => t.toLowerCase())
        log(`TagAnalyzer: Excluding tags: ${this.excludedTags.join(', ')}`, 'debug')
    }

    /**
     * Check if a tag is excluded
     */
    private isTagExcluded(tag: string): boolean {
        return this.excludedTags.includes(tag.toLowerCase())
    }

    /**
     * Check if a file is in an excluded folder
     */
    private isExcluded(file: TFile): boolean {
        if (this.excludedFolders.length === 0) return false

        for (const folder of this.excludedFolders) {
            // Check if file path starts with the excluded folder path
            if (file.path.startsWith(folder + '/') || file.path === folder) {
                return true
            }
        }
        return false
    }

    /**
     * Analyze all tags in the vault and return counts sorted by frequency
     */
    analyzeAllTags(): TagAnalysisResult {
        log('Analyzing vault tags', 'debug')

        const tagCounts = new Map<string, number>()
        const files = this.app.vault.getMarkdownFiles()
        let totalTags = 0
        let analyzedFiles = 0

        for (const file of files) {
            // Skip excluded folders
            if (this.isExcluded(file)) continue

            analyzedFiles++
            const tags = this.getFileTags(file)
            for (const tag of tags) {
                const normalizedTag = this.normalizeTag(tag)
                const currentCount = tagCounts.get(normalizedTag) ?? 0
                tagCounts.set(normalizedTag, currentCount + 1)
                totalTags++
            }
        }

        // Convert to sorted array
        const sortedTags: TagCount[] = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)

        log(`Found ${sortedTags.length} unique tags in ${analyzedFiles} files`, 'debug')

        return {
            tags: sortedTags,
            totalNotes: analyzedFiles,
            totalTags
        }
    }

    /**
     * Get top N tags by frequency, excluding any tags in the excluded list
     */
    getTopTags(count: number): TagCount[] {
        const result = this.analyzeAllTags()
        // Filter out excluded tags before slicing
        const filteredTags = result.tags.filter((tagCount) => !this.isTagExcluded(tagCount.tag))
        return filteredTags.slice(0, count)
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
}
