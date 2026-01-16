import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { AIModel } from '#types/ai-model.intf'

// Create mock Anthropic class
class MockAnthropicAPIError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
        this.name = 'APIError'
    }
}

const mockMessagesCreate = mock(async () => ({
    content: [{ type: 'text', text: 'Mock AI response' }]
}))

const MockAnthropic = mock(
    () =>
        ({
            messages: {
                create: mockMessagesCreate
            }
        }) as unknown
)

// Add APIError to the mock
;(MockAnthropic as unknown as { APIError: typeof MockAnthropicAPIError }).APIError =
    MockAnthropicAPIError

// Mock modules before importing
mock.module('@anthropic-ai/sdk', () => ({
    default: MockAnthropic,
    Anthropic: MockAnthropic
}))

mock.module('../utils/log', () => ({
    log: () => {}
}))

mock.module('./system-prompts', () => ({
    generateVillagerPrompt: (_name: string, _content: string) => 'Mock system prompt'
}))

// Import after mocking
const { ConversationManager } = await import('./conversation-manager')

describe('ConversationManager', () => {
    beforeEach(() => {
        MockAnthropic.mockClear()
        mockMessagesCreate.mockClear()
        mockMessagesCreate.mockImplementation(async () => ({
            content: [{ type: 'text', text: 'Mock AI response' }]
        }))
    })

    describe('constructor', () => {
        test('should create instance without API key', () => {
            const manager = new ConversationManager('', AIModel.CLAUDE_3_HAIKU)
            expect(manager).toBeDefined()
            expect(manager.isConfigured()).toBe(false)
        })

        test('should create instance with API key', () => {
            const manager = new ConversationManager('test-api-key', AIModel.CLAUDE_3_HAIKU)
            expect(manager).toBeDefined()
            expect(manager.isConfigured()).toBe(true)
        })

        test('should initialize Anthropic client when API key provided', () => {
            new ConversationManager('test-api-key', AIModel.CLAUDE_3_HAIKU)
            expect(MockAnthropic).toHaveBeenCalledWith({
                apiKey: 'test-api-key',
                dangerouslyAllowBrowser: true
            })
        })
    })

    describe('isConfigured', () => {
        test('should return false when no API key', () => {
            const manager = new ConversationManager('', AIModel.CLAUDE_3_HAIKU)
            expect(manager.isConfigured()).toBe(false)
        })

        test('should return true when API key is provided', () => {
            const manager = new ConversationManager('valid-key', AIModel.CLAUDE_3_HAIKU)
            expect(manager.isConfigured()).toBe(true)
        })
    })

    describe('startConversation', () => {
        test('should initialize conversation state', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('TestVillager', 'notes/test.md', 'Note content here')

            const conversation = manager.getCurrentConversation()
            expect(conversation).not.toBeNull()
            expect(conversation?.villagerName).toBe('TestVillager')
            expect(conversation?.notePath).toBe('notes/test.md')
            expect(conversation?.noteContent).toBe('Note content here')
            expect(conversation?.messages).toEqual([])
            expect(conversation?.startedAt).toBeDefined()
        })

        test('should replace existing conversation', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('First', 'path1', 'content1')
            manager.startConversation('Second', 'path2', 'content2')

            const conversation = manager.getCurrentConversation()
            expect(conversation?.villagerName).toBe('Second')
        })
    })

    describe('endConversation', () => {
        test('should return current conversation and clear it', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = manager.endConversation()
            expect(result?.villagerName).toBe('Test')
            expect(manager.getCurrentConversation()).toBeNull()
        })

        test('should return null when no active conversation', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            expect(manager.endConversation()).toBeNull()
        })
    })

    describe('getCurrentConversation', () => {
        test('should return null when no conversation started', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            expect(manager.getCurrentConversation()).toBeNull()
        })

        test('should return current conversation state', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const conversation = manager.getCurrentConversation()
            expect(conversation).not.toBeNull()
            expect(conversation?.villagerName).toBe('Test')
        })
    })

    describe('sendMessage', () => {
        test('should return error message when AI not configured', async () => {
            const manager = new ConversationManager('', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('AI is not configured')
        })

        test('should return error message when no active conversation', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('No active conversation')
        })

        test('should add user message to conversation', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            await manager.sendMessage('Hello there')

            const messages = manager.getMessages()
            expect(messages.some((m) => m.role === 'user' && m.content === 'Hello there')).toBe(
                true
            )
        })

        test('should call Anthropic API with correct parameters', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_5_SONNET)
            manager.startConversation('TestNPC', 'path', 'content')

            await manager.sendMessage('Test message')

            expect(mockMessagesCreate).toHaveBeenCalledWith({
                model: AIModel.CLAUDE_3_5_SONNET,
                max_tokens: 300,
                system: 'Mock system prompt',
                messages: expect.any(Array)
            })
        })

        test('should add assistant response to conversation', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            await manager.sendMessage('Hello')

            const messages = manager.getMessages()
            expect(messages.some((m) => m.role === 'assistant')).toBe(true)
        })

        test('should return AI response', async () => {
            mockMessagesCreate.mockImplementation(async () => ({
                content: [{ type: 'text', text: 'Custom AI response' }]
            }))

            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toBe('Custom AI response')
        })

        test('should update lastMessageAt timestamp', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            await manager.sendMessage('Hello')

            const conversation = manager.getCurrentConversation()
            expect(conversation?.lastMessageAt).toBeDefined()
        })

        test('should handle 401 API error', async () => {
            mockMessagesCreate.mockImplementation(async () => {
                const error = new MockAnthropicAPIError('Unauthorized', 401)
                throw error
            })

            const manager = new ConversationManager('invalid-key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('Invalid API key')
        })

        test('should handle 429 rate limit error', async () => {
            mockMessagesCreate.mockImplementation(async () => {
                const error = new MockAnthropicAPIError('Rate limited', 429)
                throw error
            })

            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('Rate limited')
        })

        test('should handle generic API errors', async () => {
            mockMessagesCreate.mockImplementation(async () => {
                const error = new MockAnthropicAPIError('Server error', 500)
                throw error
            })

            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('API error')
        })

        test('should handle unknown errors', async () => {
            mockMessagesCreate.mockImplementation(async () => {
                throw new Error('Unknown error')
            })

            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')

            const result = await manager.sendMessage('Hello')
            expect(result).toContain('error occurred')
        })
    })

    describe('getMessages', () => {
        test('should return empty array when no conversation', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            expect(manager.getMessages()).toEqual([])
        })

        test('should return conversation messages', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.startConversation('Test', 'path', 'content')
            await manager.sendMessage('Hello')

            const messages = manager.getMessages()
            expect(messages.length).toBe(2) // user + assistant
        })
    })

    describe('setModel', () => {
        test('should update the model', async () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            manager.setModel(AIModel.CLAUDE_3_5_SONNET)
            manager.startConversation('Test', 'path', 'content')

            await manager.sendMessage('Hello')

            expect(mockMessagesCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: AIModel.CLAUDE_3_5_SONNET
                })
            )
        })
    })

    describe('setApiKey', () => {
        test('should enable AI when valid key provided', () => {
            const manager = new ConversationManager('', AIModel.CLAUDE_3_HAIKU)
            expect(manager.isConfigured()).toBe(false)

            manager.setApiKey('new-key')
            expect(manager.isConfigured()).toBe(true)
        })

        test('should disable AI when empty key provided', () => {
            const manager = new ConversationManager('key', AIModel.CLAUDE_3_HAIKU)
            expect(manager.isConfigured()).toBe(true)

            manager.setApiKey('')
            expect(manager.isConfigured()).toBe(false)
        })

        test('should create new client with new key', () => {
            const manager = new ConversationManager('old-key', AIModel.CLAUDE_3_HAIKU)
            MockAnthropic.mockClear()

            manager.setApiKey('new-key')

            expect(MockAnthropic).toHaveBeenCalledWith({
                apiKey: 'new-key',
                dangerouslyAllowBrowser: true
            })
        })
    })
})
