import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig({
	svelte: {
		overrides: {
			'no-irregular-whitespace': 'off',
			'node/no-unsupported-features/node-builtins': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/require-each-key': 'off',
			'ts/ban-types': 'off',
			'unicorn/no-null': 'off',
		},
	},
	ts: {
		overrides: {
			'depend/ban-dependencies': [
				'error',
				{
					allowed: ['execa', 'glob'],
				},
			],
		},
	},
})
