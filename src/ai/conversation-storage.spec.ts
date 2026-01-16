import { describe, test, expect, beforeEach, mock } from 'bun:test'
import type { App, TFile, TAbstractFile, TFolder } from 'obsidian'
import type { ConversationState } from '#types/conversation-state.intf'

// Mock the log module before importing
mock.module('../utils/log', () => ({
    log: () => {}
}))

// Import after mocking
const { ConversationStorage } = await import('./conversation-storage')

// Helper to create mock conversation state
function createConversation(overrides: Partial<ConversationState> = {}): ConversationState {
    return {
        villagerName: 'TestVillager',
        notePath: 'notes/test.md',
        noteContent: 'This is test content.',
        messages: [
            { role: 'user', content: 'Hello!' },
            { role: 'assistant', content: 'Hi there!' }
        ],
        startedAt: '2024-01-15T10:00:00.000Z',
        lastMessageAt: '2024-01-15T10:05:00.000Z',
        ...overrides
    }
}

describe('ConversationStorage', () => {
    let mockApp: App
    let createdFiles: Array<{ path: string; content: string }>
    let existingFolders: Set<string>
    let existingFiles: TFile[]

    beforeEach(() => {
        createdFiles = []
        existingFolders = new Set()
        existingFiles = []

        mockApp = {
            vault: {
                create: async (path: string, content: string) => {
                    createdFiles.push({ path, content })
                    return { path } as TFile
                },
                createFolder: async (path: string) => {
                    existingFolders.add(path)
                },
                getAbstractFileByPath: (path: string): TAbstractFile | null => {
                    if (existingFolders.has(path)) {
                        return { path } as TAbstractFile
                    }
                    return null
                },
                getMarkdownFiles: () => existingFiles,
                read: async (_file: TFile) => ''
            }
        } as unknown as App
    })

    describe('constructor', () => {
        test('should initialize with folder path', () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            expect(storage).toBeDefined()
        })
    })

    describe('setFolderPath', () => {
        test('should update folder path', async () => {
            const storage = new ConversationStorage(mockApp, 'OldPath')
            storage.setFolderPath('NewPath')

            // Save a conversation to verify new path is used
            await storage.saveConversation(createConversation())

            expect(createdFiles[0]?.path).toContain('NewPath/')
        })
    })

    describe('saveConversation', () => {
        test('should return null when folder path is empty', async () => {
            const storage = new ConversationStorage(mockApp, '')
            const result = await storage.saveConversation(createConversation())

            expect(result).toBeNull()
        })

        test('should return null when conversation has no messages', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({ messages: [] })
            const result = await storage.saveConversation(conversation)

            expect(result).toBeNull()
        })

        test('should create folder if it does not exist', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            await storage.saveConversation(createConversation())

            expect(existingFolders.has('Conversations')).toBe(true)
        })

        test('should not recreate folder if it exists', async () => {
            existingFolders.add('Conversations')
            let folderCreateCount = 0
            mockApp.vault.createFolder = async (path: string) => {
                folderCreateCount++
                return { path } as unknown as TFolder
            }

            const storage = new ConversationStorage(mockApp, 'Conversations')
            await storage.saveConversation(createConversation())

            expect(folderCreateCount).toBe(0)
        })

        test('should create file with correct path format', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({ villagerName: 'Alice' })
            await storage.saveConversation(conversation)

            expect(createdFiles.length).toBe(1)
            expect(createdFiles[0]?.path).toStartWith('Conversations/Alice-')
            expect(createdFiles[0]?.path).toEndWith('.md')
        })

        test('should sanitize villager name in filename', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({ villagerName: 'Bad/Name:With*Chars?' })
            await storage.saveConversation(conversation)

            const path = createdFiles[0]?.path ?? ''
            // Extract just the filename (after the folder path)
            const filename = path.split('/').pop() ?? ''
            expect(filename).not.toContain('/')
            expect(filename).not.toContain(':')
            expect(filename).not.toContain('*')
            expect(filename).not.toContain('?')
            // Check it uses underscore replacement
            expect(filename).toContain('Bad_Name_With_Chars_')
        })

        test('should generate markdown content with frontmatter', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({
                villagerName: 'TestNPC',
                notePath: 'notes/test.md',
                startedAt: '2024-01-15T10:00:00.000Z',
                lastMessageAt: '2024-01-15T10:05:00.000Z'
            })
            await storage.saveConversation(conversation)

            const content = createdFiles[0]?.content ?? ''

            // Check frontmatter
            expect(content).toStartWith('---')
            expect(content).toContain('villager: "[[notes/test.md|TestNPC]]"')
            expect(content).toContain('started: 2024-01-15T10:00:00.000Z')
            expect(content).toContain('ended: 2024-01-15T10:05:00.000Z')
        })

        test('should generate markdown with conversation title', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({ villagerName: 'Bob' })
            await storage.saveConversation(conversation)

            const content = createdFiles[0]?.content ?? ''
            expect(content).toContain('# Conversation with Bob')
        })

        test('should format messages correctly', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation({
                villagerName: 'NPC',
                messages: [
                    { role: 'user', content: 'How are you?' },
                    { role: 'assistant', content: 'I am fine, thank you!' }
                ]
            })
            await storage.saveConversation(conversation)

            const content = createdFiles[0]?.content ?? ''
            expect(content).toContain('**You:**')
            expect(content).toContain('How are you?')
            expect(content).toContain('**NPC:**')
            expect(content).toContain('I am fine, thank you!')
        })

        test('should return created file on success', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.saveConversation(createConversation())

            expect(result).not.toBeNull()
            expect(result?.path).toContain('Conversations/')
        })

        test('should handle errors gracefully and return null', async () => {
            mockApp.vault.create = async () => {
                throw new Error('Failed to create file')
            }

            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.saveConversation(createConversation())

            expect(result).toBeNull()
        })

        test('should not include ended field if lastMessageAt is undefined', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const conversation = createConversation()
            delete conversation.lastMessageAt

            await storage.saveConversation(conversation)

            const content = createdFiles[0]?.content ?? ''
            expect(content).not.toContain('ended:')
        })
    })

    describe('loadConversationsForVillager', () => {
        test('should return empty array when folder does not exist', async () => {
            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.loadConversationsForVillager('TestVillager')

            expect(result).toEqual([])
        })

        test('should return empty array when no matching files', async () => {
            existingFolders.add('Conversations')
            existingFiles = [
                {
                    path: 'Conversations/OtherVillager-2024-01-15.md',
                    basename: 'OtherVillager-2024-01-15'
                } as TFile
            ]

            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.loadConversationsForVillager('TestVillager')

            expect(result).toEqual([])
        })

        test('should load conversations for matching villager', async () => {
            existingFolders.add('Conversations')
            existingFiles = [
                {
                    path: 'Conversations/TestVillager-2024-01-15.md',
                    basename: 'TestVillager-2024-01-15'
                } as TFile
            ]

            mockApp.vault.read = async () => `---
villager: "[[notes/test.md|TestVillager]]"
started: 2024-01-15T10:00:00.000Z
---

# Conversation with TestVillager

**You:**
Hello!

**TestVillager:**
Hi there!
`

            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.loadConversationsForVillager('TestVillager')

            expect(result.length).toBe(1)
            expect(result[0]?.villagerName).toBe('TestVillager')
            expect(result[0]?.messages.length).toBe(2)
        })

        test('should sort conversations by date (newest first)', async () => {
            existingFolders.add('Conversations')
            existingFiles = [
                {
                    path: 'Conversations/Test-old.md',
                    basename: 'Test-old'
                } as TFile,
                {
                    path: 'Conversations/Test-new.md',
                    basename: 'Test-new'
                } as TFile
            ]

            let readCount = 0
            mockApp.vault.read = async () => {
                readCount++
                if (readCount === 1) {
                    return `**You:**
First

**Test:**
Response`
                }
                return `**You:**
Second

**Test:**
Response`
            }

            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.loadConversationsForVillager('Test')

            // Results should be sorted by startedAt
            expect(result.length).toBe(2)
        })

        test('should skip files that cannot be parsed', async () => {
            existingFolders.add('Conversations')
            existingFiles = [
                {
                    path: 'Conversations/Test-valid.md',
                    basename: 'Test-valid'
                } as TFile,
                {
                    path: 'Conversations/Test-invalid.md',
                    basename: 'Test-invalid'
                } as TFile
            ]

            let readCount = 0
            mockApp.vault.read = async () => {
                readCount++
                if (readCount === 1) {
                    return `**You:**
Hello

**Test:**
Hi`
                }
                throw new Error('Cannot read file')
            }

            const storage = new ConversationStorage(mockApp, 'Conversations')
            const result = await storage.loadConversationsForVillager('Test')

            expect(result.length).toBe(1)
        })
    })
})
