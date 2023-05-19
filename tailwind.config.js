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
				shadow: '#00000067',
				'inner-shadow': '#00000010'
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
