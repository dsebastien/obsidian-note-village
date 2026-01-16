import { describe, test, expect, beforeEach, mock } from 'bun:test'
import type { App, CachedMetadata, TFile } from 'obsidian'

// Mock the log module before importing NoteScanner
mock.module('../utils/log', () => ({
    log: () => {}
}))

// Import after mocking
const { NoteScanner } = await import('./note-scanner')

// Helper to create mock TFile
function createMockFile(path: string, basename: string, size = 1000): TFile {
    return {
        path,
        basename,
        stat: {
            size,
            ctime: 1000000000000,
            mtime: 1000000000001
        },
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

describe('NoteScanner', () => {
    let mockApp: App
    let mockFiles: TFile[]
    let mockMetadataCache: Map<string, CachedMetadata>

    beforeEach(() => {
        mockFiles = []
        mockMetadataCache = new Map()

        mockApp = {
            vault: {
                getMarkdownFiles: () => mockFiles,
                read: async (_file: TFile) => 'mock content'
            },
            metadataCache: {
                getFileCache: (file: TFile) => mockMetadataCache.get(file.path) ?? null
            }
        } as unknown as App
    })

    describe('getNotesWithTags', () => {
        test('should return empty array when no files exist', () => {
            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['test'])
            expect(result).toEqual([])
        })

        test('should return empty array when no files match tags', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#other'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['test'])
            expect(result).toEqual([])
        })

        test('should find notes with matching inline tags', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#project'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['project'])

            expect(result.length).toBe(1)
            expect(result[0]?.name).toBe('note1')
            expect(result[0]?.primaryTag).toBe('project')
        })

        test('should normalize tags (remove # prefix, lowercase)', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#Project'] }))

            const scanner = new NoteScanner(mockApp)

            // Should match regardless of # prefix and case
            const result1 = scanner.getNotesWithTags(['project'])
            const result2 = scanner.getNotesWithTags(['#project'])
            const result3 = scanner.getNotesWithTags(['#PROJECT'])

            expect(result1.length).toBe(1)
            expect(result2.length).toBe(1)
            expect(result3.length).toBe(1)
        })

        test('should find notes with frontmatter tags (array)', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ frontmatterTags: ['tag1', 'tag2'] })
            )

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['tag1'])

            expect(result.length).toBe(1)
        })

        test('should find notes with frontmatter tags (comma-separated string)', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ frontmatterTags: 'tag1, tag2, tag3' })
            )

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['tag2'])

            expect(result.length).toBe(1)
        })

        test('should find notes with single tag field', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ frontmatterTag: 'single-tag' }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['single-tag'])

            expect(result.length).toBe(1)
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

            const scanner = new NoteScanner(mockApp)

            const result1 = scanner.getNotesWithTags(['inline-tag'])
            const result2 = scanner.getNotesWithTags(['fm-tag'])

            expect(result1.length).toBe(1)
            expect(result2.length).toBe(1)
        })

        test('should return multiple matching notes', () => {
            mockFiles = [
                createMockFile('note1.md', 'note1'),
                createMockFile('note2.md', 'note2'),
                createMockFile('note3.md', 'note3')
            ]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#shared'] }))
            mockMetadataCache.set('note2.md', createMockMetadata({ inlineTags: ['#shared'] }))
            mockMetadataCache.set('note3.md', createMockMetadata({ inlineTags: ['#other'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['shared'])

            expect(result.length).toBe(2)
        })

        test('should set primaryTag as first matching tag', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#b-tag', '#a-tag'] })
            )

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['a-tag', 'b-tag'])

            // Primary tag should be first matching from search order
            expect(result[0]?.primaryTag).toBe('b-tag')
        })

        test('should include file metadata in result', () => {
            const file = createMockFile('folder/note.md', 'note', 2500)
            mockFiles = [file]
            mockMetadataCache.set('folder/note.md', createMockMetadata({ inlineTags: ['#test'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['test'])

            expect(result[0]?.path).toBe('folder/note.md')
            expect(result[0]?.name).toBe('note')
            expect(result[0]?.contentLength).toBe(2500)
            expect(result[0]?.createdTime).toBe(1000000000000)
            expect(result[0]?.modifiedTime).toBe(1000000000001)
        })

        test('should handle files with no metadata', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            // No metadata set for this file

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesWithTags(['test'])

            expect(result).toEqual([])
        })
    })

    describe('getAllNotes', () => {
        test('should return empty array when no files exist', () => {
            const scanner = new NoteScanner(mockApp)
            const result = scanner.getAllNotes()
            expect(result).toEqual([])
        })

        test('should return all markdown files', () => {
            mockFiles = [
                createMockFile('note1.md', 'note1'),
                createMockFile('note2.md', 'note2'),
                createMockFile('folder/note3.md', 'note3')
            ]

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getAllNotes()

            expect(result.length).toBe(3)
        })

        test('should include files without tags', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            // No metadata

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getAllNotes()

            expect(result.length).toBe(1)
            expect(result[0]?.primaryTag).toBe('untagged')
        })

        test('should include tags when present', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set(
                'note1.md',
                createMockMetadata({ inlineTags: ['#tag1', '#tag2'] })
            )

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getAllNotes()

            expect(result[0]?.tags).toContain('tag1')
            expect(result[0]?.tags).toContain('tag2')
            expect(result[0]?.primaryTag).toBe('tag1')
        })
    })

    describe('getNotesGroupedByTag', () => {
        test('should return map with keys for all requested tags', () => {
            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesGroupedByTag(['tag1', 'tag2', 'tag3'])

            expect(result.has('tag1')).toBe(true)
            expect(result.has('tag2')).toBe(true)
            expect(result.has('tag3')).toBe(true)
        })

        test('should group notes by their primary tag', () => {
            mockFiles = [
                createMockFile('note1.md', 'note1'),
                createMockFile('note2.md', 'note2'),
                createMockFile('note3.md', 'note3')
            ]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#tagA'] }))
            mockMetadataCache.set('note2.md', createMockMetadata({ inlineTags: ['#tagA'] }))
            mockMetadataCache.set('note3.md', createMockMetadata({ inlineTags: ['#tagB'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesGroupedByTag(['tagA', 'tagB'])

            expect(result.get('taga')?.length).toBe(2)
            expect(result.get('tagb')?.length).toBe(1)
        })

        test('should return empty arrays for tags with no notes', () => {
            mockFiles = [createMockFile('note1.md', 'note1')]
            mockMetadataCache.set('note1.md', createMockMetadata({ inlineTags: ['#tagA'] }))

            const scanner = new NoteScanner(mockApp)
            const result = scanner.getNotesGroupedByTag(['tagA', 'tagB'])

            expect(result.get('taga')?.length).toBe(1)
            expect(result.get('tagb')?.length).toBe(0)
        })
    })

    describe('readNoteContent', () => {
        test('should read file content', async () => {
            const file = createMockFile('note.md', 'note')
            mockApp.vault.read = async () => 'This is the note content.'

            const scanner = new NoteScanner(mockApp)
            const result = await scanner.readNoteContent(file)

            expect(result).toBe('This is the note content.')
        })
    })
})
