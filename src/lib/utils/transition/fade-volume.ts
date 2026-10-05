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
			const maxVolume = node.dataset.volumeMax
			node.volume = maxVolume === undefined || maxVolume === '' ? t : Number(maxVolume) * t
		},
	}
}
