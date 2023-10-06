<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import Particles from 'svelte-particles';
	import { loadFull } from 'tsparticles'; // if you are going to use `loadSlim`, install the "tsparticles-slim" package too.
	import type { Container, Engine, ISourceOptions } from 'tsparticles-engine';

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
							value: 8
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
			// lineLinked: {
			// 	blink: false,
			// 	color: 'random',
			// 	consent: false,
			// 	distance: 30,
			// 	enable: true,
			// 	opacity: 0.3,
			// 	width: 0.5
			// },
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

	let onParticlesLoaded = (event: CustomEvent<{ particles?: Container | undefined }>) => {
		console.log('partcles loaded');
		const particlesContainer = event.detail.particles;

		// you can use particlesContainer to call all the Container class
		// (from the core library) methods like play, pause, refresh, start, stop
	};

	let particlesInit = async (engine: Engine) => {
		console.log('partcles init');
		// you can use main to customize the tsParticles instance adding presets or custom shapes
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		//await loadFull(engine);
		// false is key, otherwise other components will react
		await loadFull(engine, false);
	};

	// $: console.log('particlesConfig', particlesConfig);

	// .1 fixes safari rounding bug
</script>

{#if mounted}
	<Particles
		style="position: absolute; left: 0; top: .1px; width: 100%; height: 100%; background: linear-gradient(0deg, #f8f8f8 0%, white 13%, white 100%) white"
		{id}
		options={particlesConfig}
		on:particlesLoaded={onParticlesLoaded}
		{particlesInit}
	/>
{/if}
