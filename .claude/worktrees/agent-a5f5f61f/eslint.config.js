import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const RUNES_GLOBALS = {
	$state: 'readonly',
	$derived: 'readonly',
	$effect: 'readonly',
	$props: 'readonly',
	$bindable: 'readonly',
	$inspect: 'readonly',
	App: 'readonly'
};

const BASE_IGNORES = [
	'.svelte-kit/**',
	'.claude/**',
	'build/**',
	'dist/**',
	'node_modules/**',
	'.cache/**',
	'.bun/**',
	'data/**',
	'**/*.min.js',
	'**/*.map',
	'*.config.js',
	'*.config.ts',
	'vite.config.ts'
];

export default [
	{ ignores: BASE_IGNORES },
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'warn'
		}
	},
	// JavaScript files
	{
		...js.configs.recommended,
		name: 'sg-ai-jobs/javascript',
		files: ['**/*.js', '**/*.mjs'],
		languageOptions: {
			...js.configs.recommended.languageOptions,
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.browser
			}
		},
		rules: {
			...js.configs.recommended.rules,
			'no-console': ['warn', { allow: ['warn', 'error'] }]
		}
	},
	// TypeScript files
	{
		name: 'sg-ai-jobs/typescript',
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			globals: {
				...globals.node,
				...globals.browser,
				...RUNES_GLOBALS
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'interface', format: ['PascalCase'] },
				{ selector: 'typeAlias', format: ['PascalCase'] },
				{ selector: 'enum', format: ['PascalCase'] }
			],
			'@typescript-eslint/no-explicit-any': 'error'
		}
	},
	// Svelte files
	{
		name: 'sg-ai-jobs/svelte',
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser,
				extraFileExtensions: ['.svelte']
			},
			globals: {
				...globals.browser,
				...globals.node,
				...RUNES_GLOBALS
			}
		},
		plugins: {
			svelte,
			'@typescript-eslint': tsPlugin
		},
		rules: {
			...svelte.configs.recommended.rules,
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^(Props|_)',
					destructuredArrayIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'svelte/no-at-html-tags': 'warn',
			'svelte/valid-compile': 'error',
			'svelte/no-unused-svelte-ignore': 'error'
		}
	},
	// Occupation/role pages use @html for JSON-LD schema — allow it
	{
		name: 'sg-ai-jobs/schema-html-exceptions',
		files: [
			'src/lib/components/ui/Seo.svelte',
			'src/routes/occupation/*/+page.svelte',
			'src/routes/role/*/+page.svelte',
			'src/routes/roles/+page.svelte',
			'src/routes/+page.svelte',
			'src/routes/+layout.svelte',
			'src/routes/rankings/*/+page.svelte',
			'src/routes/about/+page.svelte',
			'src/routes/data/+page.svelte',
			'src/routes/reports/*/+page.svelte'
		],
		plugins: { svelte },
		rules: {
			'svelte/no-at-html-tags': 'off'
		}
	},
	// Scripts — relaxed rules
	{
		name: 'sg-ai-jobs/scripts',
		files: ['scripts/**/*.ts'],
		rules: {
			'no-console': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/naming-convention': 'off'
		}
	},
	// Prettier compat — must be last
	prettier
];
