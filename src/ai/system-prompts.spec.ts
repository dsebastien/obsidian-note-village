import { describe, test, expect } from 'bun:test'
import { VILLAGER_SYSTEM_PROMPT, generateVillagerPrompt } from './system-prompts'

describe('system-prompts', () => {
    describe('VILLAGER_SYSTEM_PROMPT', () => {
        test('should be defined as a non-empty string', () => {
            expect(VILLAGER_SYSTEM_PROMPT).toBeDefined()
            expect(typeof VILLAGER_SYSTEM_PROMPT).toBe('string')
            expect(VILLAGER_SYSTEM_PROMPT.length).toBeGreaterThan(0)
        })

        test('should contain villagerName placeholder', () => {
            expect(VILLAGER_SYSTEM_PROMPT).toContain('{villagerName}')
        })

        test('should contain noteContent placeholder', () => {
            expect(VILLAGER_SYSTEM_PROMPT).toContain('{noteContent}')
        })

        test('should contain NPC/villager context', () => {
            expect(VILLAGER_SYSTEM_PROMPT.toLowerCase()).toContain('villager')
        })

        test('should contain guidelines for the AI', () => {
            expect(VILLAGER_SYSTEM_PROMPT.toLowerCase()).toContain('guidelines')
        })

        test('should mention staying in character', () => {
            expect(VILLAGER_SYSTEM_PROMPT.toLowerCase()).toContain('character')
        })
    })

    describe('generateVillagerPrompt', () => {
        test('should replace villagerName placeholder', () => {
            const result = generateVillagerPrompt('John', 'Some content')
            expect(result).toContain('John')
            expect(result).not.toContain('{villagerName}')
        })

        test('should replace noteContent placeholder', () => {
            const content = 'This is my background story.'
            const result = generateVillagerPrompt('Jane', content)
            expect(result).toContain(content)
            expect(result).not.toContain('{noteContent}')
        })

        test('should replace both placeholders', () => {
            const result = generateVillagerPrompt('Alice', 'Alice is a baker.')
            expect(result).toContain('Alice')
            expect(result).toContain('Alice is a baker.')
            expect(result).not.toContain('{villagerName}')
            expect(result).not.toContain('{noteContent}')
        })

        test('should handle empty villager name', () => {
            const result = generateVillagerPrompt('', 'Some content')
            expect(result).not.toContain('{villagerName}')
            expect(result).toContain('Some content')
        })

        test('should handle empty note content', () => {
            const result = generateVillagerPrompt('Bob', '')
            expect(result).toContain('Bob')
            expect(result).not.toContain('{noteContent}')
        })

        test('should handle special characters in villager name', () => {
            const result = generateVillagerPrompt("O'Brien", 'Content')
            expect(result).toContain("O'Brien")
        })

        test('should handle special characters in note content', () => {
            const content = 'She said: "Hello!" & waved.'
            const result = generateVillagerPrompt('Jane', content)
            expect(result).toContain(content)
        })

        test('should handle multiline note content', () => {
            const content = 'Line 1\nLine 2\nLine 3'
            const result = generateVillagerPrompt('Test', content)
            expect(result).toContain('Line 1')
            expect(result).toContain('Line 2')
            expect(result).toContain('Line 3')
        })

        test('should handle markdown content', () => {
            const content = '# Heading\n- bullet 1\n- bullet 2\n\n**bold text**'
            const result = generateVillagerPrompt('Test', content)
            expect(result).toContain('# Heading')
            expect(result).toContain('**bold text**')
        })

        test('should preserve the structure from template', () => {
            const result = generateVillagerPrompt('TestName', 'TestContent')

            // Should still have the dashes separator for note content
            expect(result).toContain('---')

            // Should have name label
            expect(result).toContain('Your name is:')

            // Should have content label
            expect(result).toContain('Your note content')
        })

        test('should handle long content', () => {
            const longContent = 'A'.repeat(10000)
            const result = generateVillagerPrompt('Test', longContent)
            expect(result).toContain(longContent)
        })

        test('should handle unicode characters', () => {
            const result = generateVillagerPrompt('日本語名前', '这是中文内容 🎉')
            expect(result).toContain('日本語名前')
            expect(result).toContain('这是中文内容 🎉')
        })
    })
})
