<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import Particles from 'svelte-particles';
	import type { Container, Engine, ISourceOptions } from 'tsparticles-engine';
	import { loadSlim } from 'tsparticles-slim'; // if you are going to use `loadSlim`, install the "tsparticles-slim" package too.

	// charge-up logic
	let startTime = 0;
	let chargeDuration = 0;
	let particlesContainer: Container;

	function markTime(charging: boolean) {
		if (charging) {
			startTime = Date.now();
		} else if (startTime !== 0) {
			chargeDuration = Date.now() - startTime;
			launchHearts(chargeDuration / 100);
		}
	}

	function launchHearts(amount: number) {
		if (particlesContainer) {
			for (let i = 0; i < amount; i++) {
				console.log(`Creating ${amount} particles`);
				particlesContainer.particles.addParticle({
					x: Math.random() * 500,
					y: Math.random() * 500
				});
			}
		}
	}

	let isCharging = false;
	$: markTime(isCharging);

	const particlesConfig: ISourceOptions = {
		particles: {
			move: {
				angle: 15,
				enable: true,
				random: true,
				outModes: 'destroy'
			},
			shape: {
				type: 'image',
				images: [
					{
						src: `${base}/heart.svg`,
						fill: true,
						replaceColor: true
					}
				]
			},
			size: {
				value: 32
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
</script>

{#if mounted}
	<Particles
		id="heartburst"
		options={particlesConfig}
		{particlesInit}
		on:particlesLoaded={(e) => {
			e.detail.particles && (particlesContainer = e.detail.particles);
		}}
	/>
{/if}
<br />
{isCharging}
<br />
{chargeDuration}
<br />
<button
	on:pointerdown={(e) => {
		/* @ts-ignore */
		e.target.setPointerCapture(e.pointerId);
		isCharging = true;
	}}
	on:pointercancel={() => {
		isCharging = false;
	}}
	on:pointerup={() => {
		isCharging = false;
	}}
>
	Heart
</button>
