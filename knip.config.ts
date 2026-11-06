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
		'@kitschpatrol/chagent', // Typically invoked through bumpp's --execute argument, which Knip doesn't parse
		'@types/howler',
		'@types/pdf-parse',
		'node-jq',
		'workbox-build',
	],
})
