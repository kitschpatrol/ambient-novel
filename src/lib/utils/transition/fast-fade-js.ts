import type { FadeParams, TransitionConfig } from 'svelte/transition'
import { linear } from 'svelte/easing'

/**
 * Weirdly much faster than either the stock fade or the fastFadeCss
 * does NOT support graceful transition interruption or partially opaque elements
 */
export function fastFadeJs(
	node: HTMLElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {},
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		tick(t) {
			// eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access
			node.style.setProperty('opacity', `${t}`)
		},
	}
}
