import { linear } from 'svelte/easing';
import type { FadeParams, TransitionConfig } from 'svelte/transition';

export function fadeVolume(
	node: HTMLAudioElement,
	{ delay = 0, duration = 400, easing = linear }: FadeParams = {}
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		tick: (t) => {
			const maxVolume = node.getAttribute('data-volume-max');
			node.volume = maxVolume ? parseFloat(maxVolume) * t : t;
		}
	};
}
