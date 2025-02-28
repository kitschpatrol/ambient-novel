// eslint-disable-next-line import/no-unresolved
import { building } from '$app/environment'
import { minify } from 'html-minifier'

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

// eslint-disable-next-line ts/require-await, jsdoc/require-jsdoc
export async function handle({ event, resolve }) {
	let page = ''

	// eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-call
	return resolve(event, {
		transformPageChunk({ done, html }) {
			// eslint-disable-next-line ts/restrict-plus-operands
			page += html
			if (done) {
				return building ? minify(page, minificationOptions) : page
			}
		},
	})
}
