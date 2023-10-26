// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		fontFamily: {
			serif: ['Times New Roman', 'Times', 'serif'],
			display: ['Nasalization Extended', 'sans-serif']
		},

		extend: {
			boxShadow: {
				DEFAULT: '-3px 3px 5px var(--tw-shadow-color)',
				button: '-3px 3px 5px rgb(0 0 0 / .4)'
			},
			textShadow: {
				DEFAULT: '-.05em .05em .125em var(--tw-shadow-color)'
			},
			colors: {
				'vm-text-headline': 'rgb(240, 240, 240)',
				'vm-text-light': 'rgb(215, 215, 215)',
				'vm-text-dark': 'rgb(87, 87, 87)',
				'vm-magenta-mild': '#C63BEE',
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
