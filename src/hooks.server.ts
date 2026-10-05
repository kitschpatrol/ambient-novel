import type { Handle } from '@sveltejs/kit'
import { minify } from 'html-minifier'
// eslint-disable-next-line import/no-unresolved
import { building } from '$app/environment'

const minificationOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	decodeEntities: true,
	html5: true,
	ignoreCustomComments: [/^#/],
	minifyCSS: true,
	minifyJS: false,
	removeAttributeQuotes: true,
	removeComments: false, // Some hydration code needs comments, so leave them in
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true,
}

// eslint-disable-next-line jsdoc/require-jsdoc
export async function handle({ event, resolve }: Parameters<Handle>[0]) {
	let page = ''

	return resolve(event, {
		transformPageChunk({ done, html }) {
			page += html
			if (done) {
				return building ? minify(page, minificationOptions) : page
			}
		},
	})
}
