import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

// Only the dev and preview servers need HTTPS. Tools like svelte-check also load
// this config, and mkcert would otherwise (re)generate certificates for them.
const isLocalServer = ['dev', 'preview'].includes(process.env.npm_lifecycle_event ?? '')

export default defineConfig({
	build: {
		// Tailwind CSS v4's minimum supported browsers, which the site already depends on
		// https://tailwindcss.com/docs/compatibility
		target: ['chrome111', 'edge111', 'firefox128', 'safari16.4'],
	},
	// For workbox import
	define: {
		'process.env.NODE_ENV':
			process.env.NODE_ENV === 'production' ? '"production"' : '"development"',
	},
	plugins: [sveltekit(), isLocalServer ? mkcert() : []],
	server: {
		open: true,
		proxy: {},
	},
	ssr: {
		noExternal: ['tsparticles', '@tsparticles/slim', '@tsparticles/engine', '@tsparticles/svelte'], // Add all tsparticles libraries here, they're not made for SSR, they're client only
	},
})
