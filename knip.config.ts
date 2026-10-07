import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: [
		'src/global.css',
		'src/lib/components/**/*.svelte',
		'src/lib/utils/**/*.ts',
		'src/store.ts',
	],
	ignoreBinaries: ['jq'],
	ignoreDependencies: [
		'@types/glob',
		'@types/howler',
		'@types/pdf-parse',
		'node-jq',
		'tailwindcss',
		'workbox-build',
	],
})
