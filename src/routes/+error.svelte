<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
</script>

<h1>{$page.status}: {$page.error?.message}</h1>
<a href={`${base}/`}>Go Home</a>
