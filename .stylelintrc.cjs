/* eslint-disable perfectionist/sort-objects */

/** @type {import("stylelint").Config} */
module.exports = {
	extends: ['@kitschpatrol/stylelint-config'],
	rules: {
		'function-no-unknown': null,
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['apply', 'layer', 'responsive', 'screen', 'tailwind', 'variants'],
			},
		],
		'declaration-block-trailing-semicolon': null,
		'no-descending-specificity': null,
	},
}
