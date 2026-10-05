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
						allowed: ['execa', 'glob', 'dotenv', 'lodash'],
					},
				],
			},
		},
		svelte: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['execa', 'glob', 'dotenv', 'lodash'],
					},
				],
				// Messes with types...
				'e18e/prefer-array-fill': 'off',
				'import/no-duplicates': 'off',
				'import/no-unresolved': 'off',
				'no-irregular-whitespace': 'off',
				'no-promise-executor-return': 'off',
				'no-return-assign': 'off',
				'node/no-unsupported-features/node-builtins': 'off',
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
				// Tailwind utility classes are defined globally, not in each component's <style>
				'svelte/no-unused-class-name': 'off',
				'ts/naming-convention': 'off',
				'ts/no-deprecated': 'off',
				'ts/no-floating-promises': 'off',
				'ts/no-loop-func': 'off',
				'ts/no-unnecessary-condition': 'off',
				'ts/no-unsafe-argument': 'off',
				'ts/no-unsafe-assignment': 'off',
				'ts/no-unsafe-call': 'off',
				'ts/no-unsafe-member-access': 'off',
				'ts/no-unsafe-return': 'off',
				'ts/no-unsafe-type-assertion': 'off',
				'ts/no-unused-vars': 'off',
				'ts/restrict-plus-operands': 'off',
				'unicorn/prefer-add-event-listener': 'off',
				'unicorn/prefer-top-level-await': 'off',
			},
		},
		ts: {
			overrides: {
				'depend/ban-dependencies': [
					'error',
					{
						allowed: ['execa', 'glob', 'dotenv', 'lodash', 'read-package-up'],
					},
				],
				'ts/no-unsafe-type-assertion': 'off',
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
