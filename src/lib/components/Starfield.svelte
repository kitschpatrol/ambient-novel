<script lang="ts">
	import type { Engine, ISourceOptions } from '@tsparticles/engine';
	import { loadSlim } from '@tsparticles/slim';
	import Particles, { particlesInit } from '@tsparticles/svelte';
	import { base } from '$app/paths';
	import { onMount } from 'svelte'; // If you are going to use `loadSlim`, install the "tsparticles-slim" package too.

	export let id = 'tsparticles';
	export let color = '#cccccc'; // Optimization

	export let maxParticlesMobile = 9;
	export let maxParticlesDesktop = 18;
	export let strokeEnabled = true;
	export let starSpeed = 0.4;
	export let starRotationSpeed = 3;
	export let planetSpeed = 0.3;

	let particlesConfig: ISourceOptions;
	$: particlesConfig = {
		detectRetina: true,
		fullScreen: false,
		name: id,
		particles: {
			collisions: {
				enable: true
				// Distance: 100
			},
			color: {
				value: color
			},
			groups: {
				saturn: {
					collisions: {
						enable: false
						// Distance: 100
					},
					links: {
						enable: false
					},
					move: {
						speed: planetSpeed
					},
					number: {
						value: 2
					},
					rotate: {
						animation: {
							enable: false
						},
						direction: 'random',
						random: true,
						value: {
							max: 10,
							min: -10
						}
					},
					shape: {
						images: [
							{
								fill: true,
								replaceColor: true,
								src: strokeEnabled ? `${base}/saturn.svg` : `${base}/saturn-no-stroke.svg`
							}
						],
						type: 'image'
					},
					size: {
						value: {
							max: 25,
							min: 15
						}
					}
				}
			},
			links: {
				color,
				distance: 80,
				enable: true,
				width: 2,
				zIndex: 1
			},
			move: {
				enable: true,
				random: true,
				speed: starSpeed
			},
			number: {
				value: maxParticlesDesktop
			},
			rotate: {
				animation: {
					enable: true,
					speed: starRotationSpeed,
					sync: false
				},
				direction: 'random',
				random: true
			},
			shape: {
				images: [
					{
						fill: true,
						replaceColor: true,
						src: strokeEnabled ? `${base}/star.svg` : `${base}/star-no-stroke.svg`
					}
				],
				type: 'image'
			},
			size: {
				value: {
					max: 10,
					min: 5
				}
			}
		},
		pauseOnOutsideViewport: false,
		responsive: [
			{
				maxWidth: 768,
				options: {
					particles: {
						number: {
							value: maxParticlesMobile
						}
					}
				}
			}
		]
	};

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	void particlesInit(async (engine: Engine) => {
		// You can use main to customize the tsParticles instance adding presets or custom shapes
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		// await loadFull(engine);
		// false is key, otherwise other components will react
		await loadSlim(engine, false);
	});

	// .1 fixes safari rounding bug
</script>

{#if mounted}
	<Particles
		{id}
		options={particlesConfig}
		style="position: var(--position); top: var(--top); left: 0; width: 100%; height: var(--height); background: var(--background);"
	/>
{/if}
