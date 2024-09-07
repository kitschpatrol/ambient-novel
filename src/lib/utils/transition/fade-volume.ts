import type { FadeParams, TransitionConfig } from 'svelte/transition'
import { linear } from 'svelte/easing'

export function fadeVolume(
	node: HTMLAudioElement,
	{ delay = 0, duration = 1000, easing = linear }: FadeParams = {},
): TransitionConfig {
	return {
		delay,
		duration,
		easing,
		tick(t) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const maxVolume = node.dataset.volumeMax
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			node.volume = maxVolume ? Number.parseFloat(maxVolume) * t : t
		},
	}
}
