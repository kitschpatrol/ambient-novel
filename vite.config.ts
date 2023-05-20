import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vitest/config';

process.env.BROWSER = 'google chrome';

export default defineConfig({
	plugins: [sveltekit(), mkcert()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		https: true,
		proxy: {},
		open: true
	}
});
