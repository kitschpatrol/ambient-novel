<script lang="ts">
	import Play from 'svelte-material-icons/Play.svelte';

	let activeChapter = 0;
	let chapters = [
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

	$: {
		console.log(`activeChapter: ${activeChapter}`);
	}
</script>

<div class="5 flex h-screen flex-col justify-between bg-slate-200">
	<header class="bg-indigo-500">
		<h1 class="p-5 text-center font-display text-4xl">The Valentine Mob</h1>
	</header>
	<main class="grow-1 max-w-screen-md shrink-0 basis-3/5 md:mx-auto">
		<ul class="flex space-x-2">
			{#each chapters as chapter, i}
				<li
					class="group flex whitespace-nowrap text-center {i === activeChapter
						? 'shrink-0 max-sm:grow'
						: 'shrink grow truncate'}"
				>
					<a
						on:click={() => {
							activeChapter = i;
						}}
						class="block px-3 py-3 {i === activeChapter
							? 'bg-slate-300 max-sm:min-w-full'
							: 'min-w-full bg-slate-400'}"
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
		<div>
			<p class="bg-slate-300 p-10 font-serif text-lg">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
				voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
				cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
			</p>
		</div>
		<div class="bg-red-300">
			<button class="m-3 rounded-md bg-red-400 p-2"><Play class="inline text-2xl" /> Hi</button>
		</div>
	</main>
	<nav class="bg-pink-500">buttons</nav>
</div>
