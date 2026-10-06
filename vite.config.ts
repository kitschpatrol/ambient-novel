import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import 'dotenv/config'

// Only the dev and preview servers need HTTPS. Tools like svelte-check also load
// this config, and mkcert would otherwise (re)generate certificates for them.
const isLocalServer = ['dev', 'preview'].includes(process.env.npm_lifecycle_event ?? '')

type BasePath = '' | `/${string}`

function isBasePath(value: string): value is BasePath {
	return value === '' || value.startsWith('/')
}

const basePath = process.env.BASE_PATH ?? ''
if (!isBasePath(basePath)) {
	throw new Error(`BASE_PATH must be empty or start with "/", but is "${basePath}"`)
}

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
	plugins: [
		sveltekit({
			adapter: adapter({
				fallback: 'index.html',
				precompress: false,
			}),
			// Project components must use runes. Library components keep whatever mode they were written in.
			dynamicCompileOptions({ filename }) {
				return filename.includes('node_modules') ? {} : { runes: true }
			},
			paths: {
				base: basePath,
			},
			preprocess: vitePreprocess(),
		}),
		isLocalServer ? mkcert() : [],
	],
	server: {
		open: true,
		proxy: {},
	},
	ssr: {
		noExternal: [
			// The tsparticles libraries are client only and not made for SSR
			'@tsparticles/slim',
			'@tsparticles/engine',
			// Vite 8 externalizes bare specifiers in the SSR build, which would leave the
			// `@import 'tailwindcss'` in global.css unresolved
			'tailwindcss',
		],
	},
})
