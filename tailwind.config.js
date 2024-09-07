import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	plugins: [
		plugin(({ matchUtilities, theme }) => {
			matchUtilities(
				{
					'text-shadow': (value) => ({
						textShadow: value,
					}),
				},
				{ values: theme('textShadow') },
			)
		}),
		'@tailwindcss/container-queries',
	],
	theme: {
		extend: {
			boxShadow: {
				button: '-3px 3px 5px rgb(0 0 0 / .4)',
				DEFAULT: '-3px 3px 5px var(--tw-shadow-color)',
			},
			colors: {
				'vm-blue': '#4447fb',
				'vm-inner-shadow': '#00000010',
				'vm-inner-shadow-dark': '#00000020',
				'vm-inner-shadow-light': '#00000007',
				'vm-magenta': '#f01ef6',
				'vm-magenta-highlight': '#F6CDFB',
				'vm-magenta-mild': '#C63BEE',
				'vm-shadow': '#00000067',
				'vm-text-dark': 'rgb(87, 87, 87)',
				'vm-text-headline': 'rgb(240, 240, 240)',
				'vm-text-light': 'rgb(215, 215, 215)',
			},
			textShadow: {
				DEFAULT: '-.05em .05em .125em var(--tw-shadow-color)',
			},
		},

		fontFamily: {
			display: ['Nasalization Extended', 'sans-serif'],
			serif: ['Times New Roman', 'Times', 'serif'],
		},
	},
}
