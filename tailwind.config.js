// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.svelte'],
	theme: {
		fontFamily: {
			serif: ['Times New Roman', 'Times', 'serif'],
			display: ['Nasalization Extended', 'sans-serif']
		},

		extend: {
			boxShadow: {
				DEFAULT: '-3px 3px 5px var(--tw-shadow-color)'
			},
			textShadow: {
				DEFAULT: '-3px 3px 5px var(--tw-shadow-color)'
			},
			colors: {
				'vm-magenta': '#f01ef6',
				'vm-magenta-highlight': '#F6CDFB',
				'vm-blue': '#4447fb',
				'vm-shadow': '#00000067',
				'vm-inner-shadow': '#00000010',
				'vm-inner-shadow-light': '#00000007',
				'vm-inner-shadow-dark': '#00000020'
			}
		}
	},
	plugins: [
		plugin(function ({ matchUtilities, theme }) {
			matchUtilities(
				{
					'text-shadow': (value) => ({
						textShadow: value
					})
				},
				{ values: theme('textShadow') }
			);
		}),
		require('@tailwindcss/container-queries')
	]
};
