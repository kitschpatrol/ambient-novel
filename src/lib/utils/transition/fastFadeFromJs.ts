import { linear } from 'svelte/easing';
import type { FadeParams, TransitionConfig } from 'svelte/transition';

// weirdly much faster than either the stock fade or the fastFadeCss
// supports graceful transition interruption or partially opaque elements
export function fastFadeFromJs(
	node: HTMLElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {}
): TransitionConfig {
	const startingOpacityRaw = parseFloat(node.style.opacity);
	const startingOpacity = isNaN(startingOpacityRaw) ? 1 : startingOpacityRaw;

	return {
		delay,
		duration,
		easing,
		tick: (t) => {
			node.style.opacity = `${t * startingOpacity}`;
		}
	};
}
