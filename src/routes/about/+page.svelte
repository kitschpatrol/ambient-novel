<script lang="ts">
	import { base } from '$app/paths';

	import OpenSourceCredits from '$lib/components/OpenSourceCredits.svelte';
	import licenseDataRaw from '$lib/data/licenses.json';
	import { licenseSchema } from '$lib/schemas/licensesSchema';

	const licenseData = licenseSchema.parse(licenseDataRaw);
</script>

<div class="about">
	<main
		class="mx-auto mb-80 mt-20 max-w-[70ch] bg-white bg-opacity-90 px-12 pb-8 pt-8 font-serif text-xl"
	>
		<h2>The story</h2>
		<p>
			Two friends on vacation become entangled with an eccentric troupe of cosmic artists who call
			themselves The Valentine Mob. A series of interdimensional mishaps and a missing artifact lead
			them to The Artist, who lets them in on a secret and leaves the pair — and the
			reader — questioning their role in the process and product of story and art.
		</p>
		<h2>What is an ambient novel?</h2>
		<p>
			For years, while writing or working I have listened to ambient music — from barely perceptible
			natural soundscapes to monastic chants to cacophonies of experimental noise. One day, I
			wondered: What would an <em>ambient novel</em>
			be like? How might a written text function similarly to an ambient track? What if a reader were
			explicitly invited to experience that text in the ways we often listen to ambient music — as mood-setting,
			interactive without interrupting, part of some larger whole?
		</p>
		<p>
			On a whim, I fed the words “The Ambient Novel” into an anagram generator. From among the
			results, the phrase “The Valentine Mob” leaped out at me. I pictured a group of artists who
			collectively went by that moniker. And there it was: The Valentine Mob would author the
			ambient novel, not me. They would guide the reader to it, and the trip would transform the
			text itself into a contemplative tool.
		</p>
		<p>
			As the story took form, I began to envision the ambient novel as an audiobook with its own
			ambient music backing track — coming full circle from sonic to textual back to sonic, and with
			some interactive aspect. Talented collaborators jumped in to create the backing track, record
			the text, and build a website.
		</p>
		<p>
			You can experience the tracks or chapters of The Valentine Mob in any order you choose, scrub
			them forward or backward, even play multiple tracks at once. You control the experience. But
			if you want our suggestion, it’s this: Try listening to the story once all the way through,
			then go back and play with it, building your own rhythms and layers. As you do, you’ll extend
			the story beyond the single linear thread of the given narrative and create your own
			compositions
		</p>
		<p>
			And then <em>you</em>
			will be part of The Valentine Mob.
		</p>
		<p>Welcome.</p>

		<h2>Credits</h2>

		<h3>Open-Source Projects</h3>
		<OpenSourceCredits {licenseData} />
	</main>
</div>

<style>
	main {
		box-shadow: 0px 3px 9px #0000005f;
		line-height: 1.75em;
	}

	div.about {
		overflow-y: auto;
		height: 100%;
	}

	p {
		margin-bottom: 1em;
	}

	h2 {
		@apply pb-4 pt-8 text-3xl font-medium italic;
	}
</style>
