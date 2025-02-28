/* eslint-disable unicorn/no-null */
import { stylelintConfig } from '@kitschpatrol/stylelint-config'

export default stylelintConfig({
	rules: {
		'at-rule-no-deprecated': null,
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['apply', 'layer', 'responsive', 'screen', 'tailwind', 'variants'],
			},
		],
		'function-no-unknown': null,
		// 'declaration-block-trailing-semicolon': null,
		'no-descending-specificity': null,
	},
})
