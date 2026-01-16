import { describe, test, expect, beforeEach, mock } from 'bun:test'
import type { App, CachedMetadata, TFile } from 'obsidian'

// Mock the log module before importing TagAnalyzer
mock.module('../utils/log', () => ({
    log: () => {}
}))

// Import after mocking
const { TagAnalyzer } = await import('./tag-analyzer')

// Helper to create mock TFile
function createMockFile(path: string, basename: string): TFile {
    return {
        path,
        basename,
        stat: { size: 1000, ctime: 1000000, mtime: 1000001 },
        vault: {} as TFile['vault'],
        name: `${basename}.md`,
        parent: null,
        extension: 'md'
    } as TFile
}

// Helper to create mock metadata
function createMockMetadata(options: {
    inlineTags?: string[]
    frontmatterTags?: string[] | string
    frontmatterTag?: string
}): CachedMetadata {
    const metadata: CachedMetadata = {}

    if (options.inlineTags) {
        metadata.tags = options.inlineTags.map((tag) => ({
            tag: tag.startsWith('#') ? tag : `#${tag}`,
            position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } }
        }))
    }

    if (options.frontmatterTags !== undefined || options.frontmatterTag !== undefined) {
        metadata.frontmatter = {
            tags: options.frontmatterTags,
            tag: options.frontmatterTag,
            position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 0, offset: 0 } }
        }
    }

    return metadata
}

describe('TagAnalyzer', () => {
    let mockApp: App
    let mockFiles: TFile[]
    let mockMetadataCache: Map<string, CachedMetadata>

    beforeEach(() => {
        mockFiles = []
        mockMetadataCache = new Map()

        mockApp = {
            vault: {
                getMarkdownFiles: () => mockFiles
            },
            metadataCache: {
                getFileCache: (file: TFile) => mockMetadataCache.get(file.path) ?? null
            }
        } as unknown as App
    })

    describe('analyzeAllTags', () => {
        test('should return empty result when no files exist', () => {
            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags).toEqual([])
            expect(result.totalNotes).toBe(0)
            expect(result.totalTags).toBe(0)
        })

        test('should count tags across all files', () => {
            mockFiles = [createMockFile('note1.md', 'note1'), createMockFile('note2.md', 'note2')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#tag1', '#tag2'] })
            )
            mockMetadataCache.set('note2.md', createMockMetadata({ inlineTags: ['#tag1'] }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.totalNotes).toBe(2)
            expect(result.totalTags).toBe(3) // tag1 appears twice, tag2 once = 3 total

            // Find tag1 and tag2 in results
            const tag1 = result.tags.find((t) => t.tag === 'tag1')
            const tag2 = result.tags.find((t) => t.tag === 'tag2')

            expect(tag1?.count).toBe(2)
            expect(tag2?.count).toBe(1)
        })

        test('should sort tags by frequency (descending)', () => {
            mockFiles = [
                createMockFile('note1.md', 'note1'),
                createMockFile('note2.md', 'note2'),
                createMockFile('note3.md', 'note3')
            ]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#common', '#rare'] })
            )
            mockMetadataCache.set('note2.md', createMockMetadata({ inlineTags: ['#common'] }))
            mockMetadataCache.set('note3.md', createMockMetadata({ inlineTags: ['#common'] }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            // First tag should be most frequent
            expect(result.tags[0]?.tag).toBe('common')
            expect(result.tags[0]?.count).toBe(3)

            // Second should be less frequent
            expect(result.tags[1]?.tag).toBe('rare')
            expect(result.tags[1]?.count).toBe(1)
        })

        test('should normalize tags (lowercase, no # prefix)', () => {
            mockFiles = [createMockFile('note1.md', 'note1'), createMockFile('note2.md', 'note2')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#MyTag'] }))
            mockMetadataCache.set('note2.md', createMockMetadata({ inlineTags: ['#mytag'] }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            // Should be counted as same tag
            expect(result.tags.length).toBe(1)
            expect(result.tags[0]?.tag).toBe('mytag')
            expect(result.tags[0]?.count).toBe(2)
        })

        test('should include frontmatter tags (array format)', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ frontmatterTags: ['fm-tag1', 'fm-tag2'] })
            )

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags.length).toBe(2)
            expect(result.tags.find((t) => t.tag === 'fm-tag1')).toBeDefined()
            expect(result.tags.find((t) => t.tag === 'fm-tag2')).toBeDefined()
        })

        test('should include frontmatter tags (comma-separated string)', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ frontmatterTags: 'tagA, tagB, tagC' })
            )

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags.length).toBe(3)
        })

        test('should include single tag field from frontmatter', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ frontmatterTag: 'single-tag' }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags.length).toBe(1)
            expect(result.tags[0]?.tag).toBe('single-tag')
        })

        test('should combine inline and frontmatter tags', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({
                    inlineTags: ['#inline-tag'],
                    frontmatterTags: ['fm-tag']
                })
            )

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags.length).toBe(2)
            expect(result.totalTags).toBe(2)
        })

        test('should handle files with no metadata', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            // No metadata set

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            expect(result.tags).toEqual([])
            expect(result.totalNotes).toBe(1)
            expect(result.totalTags).toBe(0)
        })

        test('should handle tags with # prefix in frontmatter', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ frontmatterTags: ['#with-hash', 'without-hash'] })
            )

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.analyzeAllTags()

            // Both should be normalized (# removed)
            expect(result.tags.length).toBe(2)
            expect(result.tags.every((t) => !t.tag.startsWith('#'))).toBe(true)
        })
    })

    describe('getTopTags', () => {
        test('should return empty array when no tags exist', () => {
            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.getTopTags(5)

            expect(result).toEqual([])
        })

        test('should return top N tags by frequency', () => {
            mockFiles = [
                createMockFile('note1.md', 'note1'),
                createMockFile('note2.md', 'note2'),
                createMockFile('note3.md', 'note3'),
                createMockFile('note4.md', 'note4')
            ]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#tag1', '#tag2', '#tag3'] })
            )
            mockMetadataCache.set(
                'note2.md',
                createMockMetadata({ inlineTags: ['#tag1', '#tag2'] })
            )
            mockMetadataCache.set('note3.md', createMockMetadata({ inlineTags: ['#tag1'] }))
            mockMetadataCache.set('note4.md', createMockMetadata({ inlineTags: ['#tag4'] }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.getTopTags(2)

            expect(result.length).toBe(2)
            expect(result[0]?.tag).toBe('tag1') // 3 occurrences
            expect(result[1]?.tag).toBe('tag2') // 2 occurrences
        })

        test('should return all tags if count exceeds available tags', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#tag1', '#tag2'] })
            )

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.getTopTags(10)

            expect(result.length).toBe(2)
        })

        test('should return 0 tags when count is 0', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#tag1'] }))

            const analyzer = new TagAnalyzer(mockApp)
            const result = analyzer.getTopTags(0)

            expect(result).toEqual([])
        })
    })
})
