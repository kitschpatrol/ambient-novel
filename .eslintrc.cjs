/* eslint-disable perfectionist/sort-objects */
/* @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: ['@kitschpatrol/eslint-config'],
	// Overrides
	rules: {
		'@html-eslint/no-inline-styles': 'off',
		'@html-eslint/no-non-scalable-viewport': 'off',
		'@html-eslint/require-title': 'off',
		'@typescript-eslint/ban-types': 'off',
		'no-irregular-whitespace': 'off',
		'unicorn/no-null': 'off',
		'svelte/no-at-html-tags': 'off',
	},
}
