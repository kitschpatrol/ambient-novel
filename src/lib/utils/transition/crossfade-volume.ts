import { crossfade } from 'svelte/transition'
import { fadeVolume } from './fade-volume'

// Currently unused... regular transition working fine?
// https://stackblitz.com/edit/sveltekit-sphygf?file=src%2Froutes%2Fcrossfade.ts
// https://svelte.dev/docs/svelte-transition#crossfade

// Usage:
// const [send, receive] = crossfadeVolume;
// in:send={{key: "a"}}
// out:receive={{key: "a"}}

export const crossfadeVolume = crossfade({
	duration: 5000,
	fallback(node: Element) {
		return fadeVolume(node as HTMLAudioElement, {})
	},
})
