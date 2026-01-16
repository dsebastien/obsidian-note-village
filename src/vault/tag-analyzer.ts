import type { App, CachedMetadata, TFile } from 'obsidian'
import { log } from '../utils/log'
import type { TagCount } from '#types/tag-count.intf'
import type { TagAnalysisResult } from '#types/tag-analysis-result.intf'

/**
 * Analyzes tags in the vault to determine zone distribution
 */
export class TagAnalyzer {
    constructor(private app: App) {}

    /**
     * Analyze all tags in the vault and return counts sorted by frequency
     */
    analyzeAllTags(): TagAnalysisResult {
        log('Analyzing vault tags', 'debug')

        const tagCounts = new Map<string, number>()
        const files = this.app.vault.getMarkdownFiles()
        let totalTags = 0

        for (const file of files) {
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

        log(`Found ${sortedTags.length} unique tags in ${files.length} files`, 'debug')

        return {
            tags: sortedTags,
            totalNotes: files.length,
            totalTags
        }
    }

    /**
     * Get top N tags by frequency
     */
    getTopTags(count: number): TagCount[] {
        const result = this.analyzeAllTags()
        return result.tags.slice(0, count)
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
