<script lang="ts">
	import Play from 'svelte-material-icons/Play.svelte';

	let activeChapter = 0;
	const chapters = [
		'Lorem ipsum',
		'dolor sit amet',
		'consectetur adipiscing elit',
		'sed do eiusmod tempor',
		'incididunt ut labore',
		'et dolore magna aliqua',
		'Lorem ipsum',
		'dolor sit amet',
		'consectetur adipiscing elit',
		'sed do eiusmod tempor'
	];

	const lines = [
		'We sit here together on low, sturdy, mahogany deck chairs, taking inventory of the scene. There’s the silent still water of the illuminated swimming pool. The night sky is a dotted blur of normal <span style="color: #000000;">black</span>. The unfamiliar landscaping trails off in the dark like a giant sleepwalking cat. The warm subtle breeze is three notches into the realm of perceptible.',
		'It’s our new rental. We’ll be here for eight weeks and this is the first hour.',
		'We take deep breaths without speaking any words.',
		'After three balmy days of driving we both feel the remains of a recent adrenaline spike, after all, we finally arrived. But, exhaustion will win out shortly and if we don’t fall asleep here in this recline we’ll pull ourselves together and drift away into separate beds.',
		'There will be time for effortless backstrokes in this pool now before us.',
		'And, if we feel like it, maybe we will explore the contours of what seems to be a well-manicured backyard. Or, maybe not. At our current precise moment I feel I may never leave this chair. Ever. Like, literally. I might die here. Or, live forever.',
		'There’s a numbness to this tired mind and body. An awareness rises of holding tension in the shoulders, followed by a deep breath and a release. Shoulders fall. Another breath.',
		'The sound of a commercial plane enters and disrupts the silence. The faint, soft whir is out of sight yet all-enveloping. Soon it passes and we’re left again with the eternal silence, a vessel and a cradle and a vase and a tomb. And, a frame.',
		'Maybe, I don’t know, I say, maybe this, right here, maybe this is the actual end.',
		'We wonder awhile and settle into a rhythm of in–and– exhales. Chests rising and lowering slowly and gently. We talked a lot on the road and this moment feels like a trophy.'
	];

	$: {
		console.log(`activeChapter: ${activeChapter}`);
	}
</script>

<main class="flex h-full flex-col bg-amber-100">
	<ul class="flex flex-row space-x-2">
		{#each chapters as chapter, i}
			<li
				class="group flex-col whitespace-nowrap text-center {i === activeChapter
					? 'shrink-0 max-sm:grow'
					: 'shrink grow truncate'}"
			>
				<a
					on:click={() => {
						activeChapter = i;
					}}
					class="block rounded-t-xl px-4 py-2 {i === activeChapter
						? 'bg-slate-300 max-sm:min-w-full'
						: 'min-w-full bg-slate-400 bg-gradient-to-t from-inner-shadow to-transparent to-35%'}"
					href="?chapter={i}"
					>{i + 1}<span
						class={i === activeChapter ? 'max-sm:hidden' : 'hidden max-sm:group-hover:inline'}
						>. {chapter}</span
					></a
				>
			</li>
		{/each}
	</ul>
	<h2 class="bg-slate-300 p-4 text-xl sm:hidden">{chapters[activeChapter]}</h2>
	<div class="grow-1 h-full bg-blue-300">
		<p class="h-full bg-green-100 p-5 font-serif text-lg">
			{@html lines[activeChapter]}
		</p>
	</div>
	<div class="rounded-b-xl bg-red-300">
		<button class="m-3 rounded-md bg-red-400 p-2"><Play class="inline text-2xl" /> Hi</button>
	</div>
</main>
