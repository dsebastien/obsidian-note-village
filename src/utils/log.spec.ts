import { describe, test, expect, beforeEach, afterEach, spyOn, type Mock } from 'bun:test'
import { log, LOG_PREFIX, LOG_SEPARATOR } from './log'

describe('log', () => {
    let consoleDebugSpy: Mock<typeof console.debug>
    let consoleInfoSpy: Mock<typeof console.info>
    let consoleWarnSpy: Mock<typeof console.warn>
    let consoleErrorSpy: Mock<typeof console.error>

    beforeEach(() => {
        consoleDebugSpy = spyOn(console, 'debug').mockImplementation(() => {})
        consoleInfoSpy = spyOn(console, 'info').mockImplementation(() => {})
        consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})
        consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleDebugSpy.mockRestore()
        consoleInfoSpy.mockRestore()
        consoleWarnSpy.mockRestore()
        consoleErrorSpy.mockRestore()
    })

    describe('LOG_PREFIX', () => {
        test('should be defined and include plugin name', () => {
            expect(LOG_PREFIX).toBeDefined()
            expect(typeof LOG_PREFIX).toBe('string')
            expect(LOG_PREFIX.length).toBeGreaterThan(0)
        })
    })

    describe('LOG_SEPARATOR', () => {
        test('should be a line of dashes', () => {
            expect(LOG_SEPARATOR).toBeDefined()
            expect(LOG_SEPARATOR).toContain('-')
        })
    })

    describe('default logging (no level)', () => {
        test('should use console.debug for default level', () => {
            log('test message')
            expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
        })

        test('should prefix message with plugin name', () => {
            log('test message')
            expect(consoleDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(LOG_PREFIX),
                expect.any(Array)
            )
        })

        test('should include the message text', () => {
            log('my custom message')
            expect(consoleDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining('my custom message'),
                expect.any(Array)
            )
        })
    })

    describe('debug level', () => {
        test('should use console.debug', () => {
            log('debug message', 'debug')
            expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
            expect(consoleInfoSpy).not.toHaveBeenCalled()
        })

        test('should pass additional data', () => {
            log('debug message', 'debug', { key: 'value' }, 123)
            expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'), [
                { key: 'value' },
                123
            ])
        })
    })

    describe('info level', () => {
        test('should use console.info', () => {
            log('info message', 'info')
            expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
            expect(consoleDebugSpy).not.toHaveBeenCalled()
        })

        test('should pass additional data', () => {
            log('info message', 'info', 'extra', 42)
            expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('info message'), [
                'extra',
                42
            ])
        })
    })

    describe('warn level', () => {
        test('should use console.warn', () => {
            log('warning message', 'warn')
            expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
            expect(consoleDebugSpy).not.toHaveBeenCalled()
        })

        test('should pass additional data', () => {
            const warningData = { issue: 'something wrong' }
            log('warning message', 'warn', warningData)
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('warning message'),
                [warningData]
            )
        })
    })

    describe('error level', () => {
        test('should use console.error', () => {
            log('error message', 'error')
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
            expect(consoleDebugSpy).not.toHaveBeenCalled()
        })

        test('should pass error objects', () => {
            const error = new Error('test error')
            log('error occurred', 'error', error)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('error occurred'),
                [error]
            )
        })
    })

    describe('data passing', () => {
        test('should pass empty array when no data provided', () => {
            log('simple message', 'debug')
            expect(consoleDebugSpy).toHaveBeenCalledWith(expect.any(String), [])
        })

        test('should pass multiple data arguments', () => {
            log('message', 'debug', 1, 'two', { three: 3 }, [4])
            expect(consoleDebugSpy).toHaveBeenCalledWith(expect.any(String), [
                1,
                'two',
                { three: 3 },
                [4]
            ])
        })

        test('should handle undefined and null data', () => {
            log('message', 'debug', undefined, null)
            expect(consoleDebugSpy).toHaveBeenCalledWith(expect.any(String), [undefined, null])
        })
    })
})
