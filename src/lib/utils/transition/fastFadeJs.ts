import { linear } from 'svelte/easing';
import type { FadeParams, TransitionConfig } from 'svelte/transition';

// weirdly much faster than either the stock fade or the fastFadeCss
// does NOT support graceful transition interruption or partially opaque elements
export function fastFadeJs(
	node: HTMLElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {}
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		tick: (t) => {
			node.style.setProperty('opacity', `${t}`);
		}
	};
}
