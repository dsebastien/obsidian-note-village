import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import obsidianmd from 'eslint-plugin-obsidianmd'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    // eslint-plugin-obsidianmd 0.4.x ships complete config types. The full
    // recommended preset replaces the previous hand-picked rule subset so
    // `bun run lint` fails locally on anything the catalog reviewer would
    // reject, instead of only on the six rules that happened to be listed.
    ...obsidianmd.configs['recommended'],
    eslintConfigPrettier,
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            'scripts/**',
            '.cz-config.cjs',
            'prettier.config.cjs',
            'package.json'
        ]
    },
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                // Tests and build tooling run under the Bun runtime
                Bun: 'readonly',
                // Obsidian global functions
                createDiv: 'readonly',
                createEl: 'readonly',
                createSpan: 'readonly',
                createFragment: 'readonly',
                // Obsidian popout-window-aware globals
                activeWindow: 'readonly',
                activeDocument: 'readonly'
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-deprecated': 'off',
            'no-prototype-builtins': 'off',
            // Sentence case is a community-review requirement, so the rule is an
            // ERROR here rather than off. The catalog reviewer runs its OWN
            // ruleset against the source archive, so switching it off locally
            // suppresses nothing on their side — it only hides the finding until
            // submission. It compares every UI string against a word list, so the
            // vocabulary this plugin's copy uses has to be declared or correct
            // text gets reported:
            //
            // - `brands` REPLACES the plugin's default list (`?? DEFAULT_BRANDS`),
            //   so this array must carry every brand this codebase names. A new
            //   brand in a UI string is reported until it is added here — loud,
            //   which is the point.
            // - `ignoreRegex` matches whole strings — anchor each entry to the
            //   exact literal it exempts, never a broad pattern.
            'obsidianmd/ui/sentence-case': [
                'error',
                {
                    enforceCamelCaseLower: true,
                    brands: [
                        // Defaults this codebase relies on
                        'Obsidian',
                        'Obsidian Sync',
                        'Obsidian Publish',
                        'iOS',
                        'macOS',
                        'Windows',
                        'Linux',
                        'Android',
                        'GitHub',
                        'GitHub Sponsors',
                        'Git',
                        'YouTube',
                        'Markdown',
                        'JavaScript',
                        'TypeScript',
                        'Node.js',
                        // The follow CTA links to x.com
                        'X',
                        // This plugin's own name, spelled exactly as the
                        // manifest does — ribbon, view title, settings.
                        'Note Village',
                        // The AI-conversation settings name these
                        'Anthropic',
                        'Claude',
                        'Claude 3 Haiku',
                        'Claude 3.5 Sonnet',
                        'Claude Sonnet 4',
                        // Community this plugin's support CTAs link to
                        'Knowii'
                    ],
                    ignoreRegex: [
                        // API-key input placeholder — a literal key prefix
                        '^sk-ant-\\.\\.\\.$',
                        // Folder-name placeholder — lowercase is the value
                        '^village-conversations$',
                        // Fleet-wide template copy, kept byte-identical
                        '^Obsidian, Personal Knowledge Management and note-taking, straight to your inbox and feed\\.$'
                    ]
                }
            ]
        }
    },
    {
        // Specs and the test bootstrap import the bun:test runner, cast plain
        // mocks to TFile/TFolder, and style throwaway DOM directly; the
        // mobile-compatibility and catalog rules read those as violations.
        // Tests are never bundled into the plugin and are not scanned by the
        // community scorecard.
        files: ['**/*.spec.ts', 'src/test/**'],
        rules: {
            // expect.any()/mock plumbing are typed `any` by design
            '@typescript-eslint/no-unsafe-assignment': 'off',
            'obsidianmd/no-nodejs-modules': 'off',
            'obsidianmd/no-global-this': 'off',
            'obsidianmd/prefer-window-timers': 'off',
            'obsidianmd/no-tfile-tfolder-cast': 'off',
            'obsidianmd/no-static-styles-assignment': 'off'
        }
    }
)
