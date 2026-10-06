<script lang="ts">
	import type { Container, ISourceOptions } from '@tsparticles/engine'
	import { particles } from '#lib/utils/particles.js'
	import { asset } from '$app/paths'

	// Charge-up logic
	let startTime = 0
	let chargeDuration = $state(0)
	let isCharging = $state(false)
	let particlesContainer: Container | undefined

	function startCharging() {
		isCharging = true
		startTime = Date.now()
	}

	function stopCharging() {
		if (!isCharging) {
			return
		}

		isCharging = false
		chargeDuration = Date.now() - startTime
		launchHearts(chargeDuration / 100)
	}

	function launchHearts(amount: number) {
		if (particlesContainer) {
			for (let i = 0; i < amount; i++) {
				console.log(`Creating ${amount} particles`)
				particlesContainer.particles.addParticle({
					x: Math.random() * 500,
					y: Math.random() * 500,
				})
			}
		}
	}

	const particlesConfig: ISourceOptions = {
		particles: {
			move: {
				angle: 15,
				enable: true,
				outModes: 'destroy',
				random: true,
			},
			shape: {
				options: {
					images: {
						replaceColor: true,
						src: asset('heart.svg'),
					},
				},
				type: 'images',
			},
			size: {
				value: 32,
			},
		},
	}
</script>

<div
	id="heartburst"
	{@attach particles(particlesConfig, (container) => {
		particlesContainer = container
	})}
></div>
<br />
{isCharging}
<br />
{chargeDuration}
<br />
<button
	onpointercancel={stopCharging}
	onpointerdown={(event) => {
		event.currentTarget.setPointerCapture(event.pointerId)
		startCharging()
	}}
	onpointerup={stopCharging}
	type="button"
>
	Heart
</button>
