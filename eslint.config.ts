import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import obsidianmd from 'eslint-plugin-obsidianmd'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.{js,mjs,cjs,ts}']
    },
    {
        ignores: ['**/dist/**', '**/node_modules/**']
    },
    {
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],
            '@typescript-eslint/ban-ts-comment': 'off',
            'no-prototype-builtins': 'off'
        }
    },
    // Obsidian community-reviewer rules + type-aware rules, scoped to plugin source.
    // These mirror the checks run by the Obsidian plugin catalog reviewer so that
    // `bun run lint` fails locally on anything the catalog would reject.
    {
        files: ['src/**/*.ts'],
        ignores: ['src/**/*.spec.ts', 'src/test/**'],
        plugins: {
            obsidianmd
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            'obsidianmd/no-unsupported-api': 'error',
            'obsidianmd/no-static-styles-assignment': 'error',
            'obsidianmd/commands/no-plugin-id-in-command-id': 'warn',
            'obsidianmd/commands/no-plugin-name-in-command-name': 'warn',
            'obsidianmd/prefer-create-el': 'warn',
            'obsidianmd/prefer-window-timers': 'warn',
            // The declarative settings API (getSettingDefinitions) only exists in
            // Obsidian 1.13.0+. Adopting it would force minAppVersion far above the
            // 1.7.2 this plugin targets, so this forward-looking recommendation is
            // intentionally deferred.
            'obsidianmd/settings-tab/prefer-setting-definitions': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-misused-promises': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
            '@typescript-eslint/no-deprecated': 'warn'
        }
    }
)
