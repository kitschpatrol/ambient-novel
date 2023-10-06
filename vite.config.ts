import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

process.env.BROWSER = 'google chrome';

export default defineConfig({
	plugins: [sveltekit(), mkcert()],
	ssr: {
		noExternal: ['tsparticles', 'tsparticles-slim', 'tsparticles-engine', 'svelte-particles'] // add all tsparticles libraries here, they're not made for SSR, they're client only
	},
	server: {
		https: true,
		proxy: {},
		open: true
	},
	// for workbox import
	define: {
		'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '"development"'
	}
});
