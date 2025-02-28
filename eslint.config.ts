import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig(
	{
		svelte: true,

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
	},
	{
		files: ['**/*.svelte'],
		rules: {
			'no-irregular-whitespace': 'off',
			'node/no-unsupported-features/node-builtins': 'off',
			'svelte/no-at-html-tags': 'off',
			'ts/ban-types': 'off',
			'unicorn/no-null': 'off',
		},
	},
	{
		files: ['src/app.html'],
		rules: {
			'html/no-inline-styles': 'off',
			'html/no-non-scalable-viewport': 'off',
			'html/require-title': 'off',
		},
	},
)
