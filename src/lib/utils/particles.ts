import type { Container, ISourceOptions } from '@tsparticles/engine'
import type { Attachment } from 'svelte/attachments'
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

let engineReady: Promise<void> | undefined

// The slim plugin bundle is loaded once and shared by every container on the page
async function initializeEngine(): Promise<void> {
	engineReady ??= (async () => {
		await loadSlim(tsParticles)
		await tsParticles.init()
	})()

	await engineReady
}

/**
 * Attaches a tsParticles container to an element. The container is recreated
 * whenever the options change, and destroyed when the element is removed.
 */
export function particles(
	options: ISourceOptions,
	onLoaded?: (container: Container) => void,
): Attachment<HTMLElement> {
	return (element) => {
		const detached = new AbortController()

		void (async () => {
			await initializeEngine()
			const container = detached.signal.aborted
				? undefined
				: await tsParticles.load({ element, options })
			if (container === undefined) {
				return
			}

			// The element may have been removed while the container was loading
			if (detached.signal.aborted) {
				container.destroy()
				return
			}

			detached.signal.addEventListener('abort', () => {
				container.destroy()
			})
			onLoaded?.(container)
		})()

		return () => {
			detached.abort()
		}
	}
}
