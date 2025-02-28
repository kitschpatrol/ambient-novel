import type { FadeParams, TransitionConfig } from 'svelte/transition'
import { linear } from 'svelte/easing'

/**
 * Fade an audio element's volume in or out.
 */
export function fadeVolume(
	node: HTMLAudioElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {},
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		tick(t) {
			// eslint-disable-next-line ts/no-unsafe-assignment, ts/no-unsafe-member-access
			const maxVolume = node.dataset.volumeMax
			// eslint-disable-next-line ts/no-unsafe-argument, ts/no-unsafe-member-access
			node.volume = maxVolume ? Number.parseFloat(maxVolume) * t : t
		},
	}
}
