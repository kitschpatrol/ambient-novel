import { linear } from 'svelte/easing';
import type { FadeParams, TransitionConfig } from 'svelte/transition';

// hypothetically optimize by not reading initial opacity
// not really faster in practice
export function fastFadeCss(
	node: HTMLElement,
	{ delay = 0, duration = 400, easing = linear }: FadeParams = {}
): TransitionConfig {
	// const o = +getComputedStyle(node).opacity;

	return {
		delay,
		duration,
		easing,
		css: (t: number) => `opacity: ${t}`
	};
}
