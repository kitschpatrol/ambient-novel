<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import Particles from 'svelte-particles';
	import type { Engine, ISourceOptions } from 'tsparticles-engine';
	import { loadSlim } from 'tsparticles-slim'; // if you are going to use `loadSlim`, install the "tsparticles-slim" package too.

	export let id: string = 'tsparticles';
	export let color: string = '#cccccc'; // optimization

	let particlesConfig: ISourceOptions;
	$: particlesConfig = {
		name: id,
		pauseOnOutsideViewport: false,
		detectRetina: true,
		fullScreen: false,

		responsive: [
			{
				maxWidth: 768,
				options: {
					particles: {
						number: {
							value: 9
						}
					}
				}
			}
		],
		particles: {
			shape: {
				type: 'image',
				images: [
					{
						src: `${base}/star.svg`,
						fill: true,
						replaceColor: true
					}
				]
			},
			links: {
				enable: true,
				color,
				width: 2,
				distance: 80,
				zIndex: 1
			},
			rotate: {
				random: true,
				direction: 'random',
				animation: {
					enable: true,
					speed: 3,
					sync: false
				}
			},
			size: {
				value: {
					min: 5,
					max: 10
				}
			},
			color: {
				value: color
			},
			move: {
				enable: true,
				speed: 0.4,
				random: true
			},
			number: {
				value: 18
			},
			collisions: {
				enable: true
				// distance: 100
			},
			groups: {
				saturn: {
					collisions: {
						enable: false
						// distance: 100
					},
					shape: {
						type: 'image',
						images: [
							{
								src: `${base}/saturn.svg`,
								fill: true,
								replaceColor: true
							}
						]
					},
					number: {
						value: 2
					},
					size: {
						value: {
							min: 15,
							max: 25
						}
					},
					move: {
						speed: 0.3
					},
					links: {
						enable: false
					},
					rotate: {
						random: true,
						direction: 'random',
						value: {
							min: -10,
							max: 10
						},
						animation: {
							enable: false
						}
					}
				}
			}
		}
	};

	let mounted = false;
	onMount(() => {
		mounted = true;
	});

	let particlesInit = async (engine: Engine) => {
		// you can use main to customize the tsParticles instance adding presets or custom shapes
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		//await loadFull(engine);
		// false is key, otherwise other components will react
		await loadSlim(engine, false);
	};

	// .1 fixes safari rounding bug
</script>

{#if mounted}
	<Particles
		style="position: absolute; left: 0; top: .1px; width: 100%; height: 100%; background: linear-gradient(0deg, #f8f8f8 0%, white 13%, white 100%) white"
		{id}
		options={particlesConfig}
		{particlesInit}
	/>
{/if}
