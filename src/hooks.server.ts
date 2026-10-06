import type { Handle } from '@sveltejs/kit/hooks'
import { minify } from 'html-minifier'
import { building } from '$app/env'

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

/**
 * Minifies the HTML of prerendered pages during the build.
 */
export async function handle({ event, resolve }: Parameters<Handle>[0]) {
	let page = ''

	return resolve(event, {
		transformPageChunk({ done, html }) {
			page += html
			if (!done) {
				return
			}

			return building ? minify(page, minificationOptions) : page
		},
	})
}
