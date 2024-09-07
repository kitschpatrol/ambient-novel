import type { CrossfadeParams } from 'svelte/transition'
import { crossfade } from 'svelte/transition'
import { fadeVolume } from './fade-volume'

// Currently unused... regular transition working fine?
// https://stackblitz.com/edit/sveltekit-sphygf?file=src%2Froutes%2Fcrossfade.ts
// https://svelte.dev/docs/svelte-transition#crossfade

// Usage:
// const [send, receive] = crossfadeVolume;
// in:send={{key: "a"}}
// out:receive={{key: "a"}}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const crossfadeVolume = crossfade({
	duration: 5000,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	fallback(node: Element, params: CrossfadeParams, intro: boolean) {
		return fadeVolume(node as HTMLAudioElement, {})
	},
})
