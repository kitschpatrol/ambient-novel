<script lang="ts">
	import { title } from '$lib/data/book.json';
</script>

<header>
	<h1>{title.replaceAll('a', 'A')}</h1>
</header>

<style>
	h1 {
		font-weight: 300;
		font-family: 'Nasalization Extended', sans-serif;
		font-size: 6vw;
		color: white;
		text-shadow: -3px 3px 5px #00000067;
		letter-spacing: 0.2rem;
		text-align: center;
		width: 100%;
		position: absolute;
		top: 35px;
	}
</style>
