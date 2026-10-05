import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: [
		'src/global.css',
		'src/lib/components/**/*.svelte',
		'src/lib/utils/**/*.ts',
		'src/service-worker.ts',
		'src/store.ts',
	],
	ignoreBinaries: ['jq', 'open'],
	ignoreDependencies: [
		'@types/glob',
		'@types/howler',
		'@types/pdf-parse',
		'node-jq',
		'svelte-fa',
		'tailwindcss',
		'workbox-build',
	],
	ignoreUnresolved: [/^\$/],
})
