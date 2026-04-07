import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: [
		'src/global.css',
		'src/lib/components/**/*.svelte',
		'src/lib/utils/**/*.ts',
		'src/service-worker.ts',
		'src/store.ts',
	],
	ignoreBinaries: ['dust', 'jq', 'open'],
	ignoreDependencies: [
		'@types/glob',
		'@types/howler',
		'@types/pdf-parse',
		'@types/sanitize-html',
		'node-addon-api',
		'node-gyp',
		'node-jq',
		'sanitize-html',
		'svelte-fa',
		'tailwindcss',
		'workbox-build',
	],
	ignoreUnresolved: [/^\$/],
})
