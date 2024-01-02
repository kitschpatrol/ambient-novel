import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import 'dotenv/config';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			precompress: false,
			fallback: 'index.html'
		}),
		// serviceWorker: {
		// 	register: false // TODO necessary?
		// },
		paths: { base: process.env.BASE_PATH }
		// hmm https://stackoverflow.com/questions/74931516/in-svete-what-to-use-instead-of-html-to-avoid-xss-attacks
		// csp: {
		// 	directives: {
		// 		'script-src': ['self']
		// 	},
		// 	reportOnly: {
		// 		'script-src': ['self']
		// 	}
		// }
	}
	// vitePlugin: {
	// 	experimental: {
	// 		inspector: {
	// 			showToggleButton: 'always'
	// 		}
	// 	}
	// }
};

export default config;
