/* eslint-disable unicorn/no-null */
import { stylelintConfig } from '@kitschpatrol/stylelint-config'

export default stylelintConfig({
	rules: {
		'at-rule-no-deprecated': null,
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: [
					'apply',
					'layer',
					'reference',
					'responsive',
					'screen',
					'tailwind',
					'theme',
					'utility',
					'variants',
				],
			},
		],
		'custom-property-pattern': null,
		'function-no-unknown': null,
		'nesting-selector-no-missing-scoping-root': null,
		'no-descending-specificity': null,
	},
})
