import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig(
	{
		html: {
			overrides: {
				'html/use-baseline': [
					'error',
					{
						available: 2024,
					},
				],
			},
		},
		js: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['dotenv'],
					},
				],
			},
		},
		svelte: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['lodash'],
					},
				],
				// Messes with types...
				'e18e/prefer-array-fill': 'off',
				'import/no-unresolved': 'off',
				'no-irregular-whitespace': 'off',
				// Tailwind @apply in component styles needs PostCSS processing
				'svelte/block-lang': [
					'error',
					{
						enforceScriptPresent: false,
						enforceStylePresent: false,
						script: 'ts',
						// eslint-disable-next-line unicorn/no-null -- block-lang uses null to mean no lang attribute
						style: [null, 'postcss'],
					},
				],
				'svelte/no-at-html-tags': 'off',
				'ts/naming-convention': 'off',
				'ts/no-deprecated': 'off',
				'ts/no-floating-promises': 'off',
				'ts/no-unnecessary-condition': 'off',
				'ts/no-unsafe-argument': 'off',
				'ts/no-unsafe-assignment': 'off',
				'ts/no-unsafe-call': 'off',
				'ts/no-unsafe-member-access': 'off',
				'ts/no-unsafe-return': 'off',
				'ts/no-unused-vars': 'off',
				'unicorn/prefer-add-event-listener': 'off',
				// Svelte 4 component scripts can't use top-level await
				'unicorn/prefer-top-level-await': 'off',
			},
		},
		ts: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['execa', 'glob', 'read-package-up'],
					},
				],
			},
		},
	},
	{
		rules: {
			// The v flag is unsupported in the deployed site's older target browsers (Safari < 17),
			// and adding u or v to the content scripts' regexes changes how they match surrogate pairs
			'require-unicode-regexp': 'off',
			// Code point escapes are only valid in regexes with the u or v flag
			'unicorn/prefer-unicode-code-point-escapes': 'off',
		},
	},
	{
		files: ['src/**/*'],
		rules: {
			// Element.getHTML() is missing before Safari 18 / Chrome 125, which the build target still supports
			'unicorn/prefer-dom-node-html-methods': 'off',
		},
	},
)
