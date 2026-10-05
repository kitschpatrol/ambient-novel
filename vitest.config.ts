import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so the Node-only script tests don't load the SvelteKit plugins
export default defineConfig({
	test: {
		include: ['scripts/**/*.test.ts'],
	},
})
