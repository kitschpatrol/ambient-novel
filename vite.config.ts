import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

process.env.BROWSER = 'chromium'

export default defineConfig({
	// For workbox import
	define: {
		'process.env.NODE_ENV':
			process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
	},
	plugins: [sveltekit(), mkcert()],
	server: {
		open: true,
		proxy: {},
	},
	ssr: {
		noExternal: ['tsparticles', '@tsparticles/slim', '@tsparticles/engine', '@tsparticles/svelte'], // Add all tsparticles libraries here, they're not made for SSR, they're client only
	},
})
