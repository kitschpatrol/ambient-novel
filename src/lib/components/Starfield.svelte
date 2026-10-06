<script lang="ts">
	import type { ISourceOptions } from '@tsparticles/engine'
	import { particles } from '#lib/utils/particles.js'
	import { asset } from '$app/paths'

	type Props = {
		color?: string
		id?: string
		maxParticlesDesktop?: number
		maxParticlesMobile?: number
		planetSpeed?: number
		starRotationSpeed?: number
		starSpeed?: number
		strokeEnabled?: boolean
	}

	let {
		color = '#cccccc',
		id = 'tsparticles',
		maxParticlesDesktop = 18,
		maxParticlesMobile = 9,
		planetSpeed = 0.3,
		starRotationSpeed = 3,
		starSpeed = 0.4,
		strokeEnabled = true,
	}: Props = $props()

	// The responsive option is gone in tsParticles 4, so the particle count follows the viewport here instead
	let viewportWidth = $state(0)
	const particleCount = $derived(
		viewportWidth > 0 && viewportWidth <= 768 ? maxParticlesMobile : maxParticlesDesktop,
	)

	const particlesConfig: ISourceOptions = $derived({
		detectRetina: true,
		fullScreen: false,
		name: id,
		particles: {
			collisions: {
				enable: true,
			},
			groups: {
				saturn: {
					collisions: {
						enable: false,
					},
					links: {
						enable: false,
					},
					move: {
						speed: planetSpeed,
					},
					number: {
						value: 2,
					},
					rotate: {
						animation: {
							enable: false,
						},
						direction: 'random',
						random: true,
						value: {
							min: -10,
							max: 10,
						},
					},
					shape: {
						options: {
							images: {
								replaceColor: true,
								src: asset(strokeEnabled ? 'saturn.svg' : 'saturn-no-stroke.svg'),
							},
						},
						type: 'images',
					},
					size: {
						value: {
							min: 15,
							max: 25,
						},
					},
				},
			},
			links: {
				color,
				distance: 80,
				enable: true,
				width: 2,
				zIndex: 1,
			},
			move: {
				enable: true,
				random: true,
				speed: starSpeed,
			},
			number: {
				value: particleCount,
			},
			paint: {
				color: {
					value: color,
				},
			},
			rotate: {
				animation: {
					enable: true,
					speed: starRotationSpeed,
					sync: false,
				},
				direction: 'random',
				random: true,
			},
			shape: {
				options: {
					images: {
						replaceColor: true,
						src: asset(strokeEnabled ? 'star.svg' : 'star-no-stroke.svg'),
					},
				},
				type: 'images',
			},
			size: {
				value: {
					min: 5,
					max: 10,
				},
			},
		},
		pauseOnOutsideViewport: false,
	})
</script>

<svelte:window bind:innerWidth={viewportWidth} />

<div
	{id}
	style:position="var(--position)"
	style:top="var(--top)"
	style:width="100%"
	style:background="var(--background)"
	style:height="var(--height)"
	style:left="0"
	{@attach particles(particlesConfig)}
></div>
