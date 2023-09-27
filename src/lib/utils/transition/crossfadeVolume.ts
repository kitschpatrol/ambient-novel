import type { CrossfadeParams } from 'svelte/transition';
import { crossfade } from 'svelte/transition';
import { fadeVolume } from './fadeVolume';

// currently unused... regular transition working fine?
// https://stackblitz.com/edit/sveltekit-sphygf?file=src%2Froutes%2Fcrossfade.ts
// https://svelte.dev/docs/svelte-transition#crossfade

export const crossfadeVolume = crossfade({
	duration: 5000,
	fallback: (node: Element, params: CrossfadeParams, intro: boolean) => {
		console.log(params);
		console.log(intro);
		return fadeVolume(node as HTMLAudioElement, {});
	}
});
