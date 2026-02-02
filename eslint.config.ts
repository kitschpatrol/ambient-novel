import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
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
					allowed: ['execa', 'glob', 'dotenv', 'lodash', 'read-package-up'],
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
			'import/no-duplicates': 'off',
			'import/no-unresolved': 'off',
			'no-irregular-whitespace': 'off',
			'no-promise-executor-return': 'off',
			'no-return-assign': 'off',
			'node/no-unsupported-features/node-builtins': 'off',
			'svelte/no-at-html-tags': 'off',
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
					allowed: ['execa', 'glob', 'dotenv', 'lodash'],
				},
			],
			'ts/no-unsafe-type-assertion': 'off',
		},
	},
})
