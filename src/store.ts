/* eslint-disable @typescript-eslint/naming-convention */
import { writable } from 'svelte/store'

export const isPlaying = writable(false)
export const activeChapter = writable(0)
export const chapterState = writable<
	Record<
		number,
		{
			line: number
			shuffleSeed: string
		}
	>
>({})
