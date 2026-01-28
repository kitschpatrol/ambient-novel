import type { FadeParams, TransitionConfig } from 'svelte/transition'
import { linear } from 'svelte/easing'

/**
 * Hypothetically optimize by not reading initial opacity
 * not really faster in practice
 */
export function fastFadeCss(
	_node: HTMLElement,
	{ delay = 0, duration = 400, easing = linear }: FadeParams = {},
): TransitionConfig {
	// Const o = +getComputedStyle(_node).opacity;

	return {
		css: (t: number) => `opacity: ${t}`,
		delay,
		duration,
		easing,
	}
}
