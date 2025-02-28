import { knipConfig } from '@kitschpatrol/knip-config'

export default knipConfig({
	entry: [
		'src/lib/components/**/*.svelte',
		'src/lib/utils/**/*.ts',
		'src/service-worker.ts',
		'src/store.ts',
	],
	ignoreBinaries: ['dust', 'jq', 'kpi-prettier'],
	ignoreDependencies: [
		'node-jq',
		'@types/glob',
		'@types/howler',
		'@types/pdf-parse',
		'@types/sanitize-html',
		'sanitize-html',
		'workbox-build',
	],
	ignoreUnresolved: [/^\$/],
})
