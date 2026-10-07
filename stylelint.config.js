import { stylelintConfig } from '@kitschpatrol/stylelint-config'

export default stylelintConfig({
	rules: {
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: ['reference', 'theme', 'utility'],
			},
		],
		// Tailwind's @apply takes utility class names, not a standard CSS prelude
		'at-rule-prelude-no-invalid': [true, { ignoreAtRules: ['apply', 'media'] }],
		'custom-property-pattern': null,
		'nesting-selector-no-missing-scoping-root': null,
	},
})
