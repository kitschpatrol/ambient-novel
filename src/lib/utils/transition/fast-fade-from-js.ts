import type { FadeParams, TransitionConfig } from 'svelte/transition'
import { linear } from 'svelte/easing'

/**
 * Weirdly much faster than either the stock fade or the fastFadeCss
 * supports graceful transition interruption or partially opaque elements
 */
export function fastFadeFromJs(
	node: HTMLElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {},
): TransitionConfig {
	// eslint-disable-next-line ts/no-unsafe-argument, ts/no-unsafe-member-access
	const startingOpacityRaw = Number.parseFloat(node.style.opacity)
	const startingOpacity = Number.isNaN(startingOpacityRaw) ? 1 : startingOpacityRaw

	return {
		delay,
		duration,
		easing,
		tick(t) {
			// eslint-disable-next-line ts/no-unsafe-member-access
			node.style.opacity = `${t * startingOpacity}`
		},
	}
}
