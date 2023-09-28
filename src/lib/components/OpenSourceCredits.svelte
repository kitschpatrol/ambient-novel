<script lang="ts">
	import type { LicenseData } from '$lib/schemas/licensesSchema';
	// import sanitizeHtml from 'sanitize-html';
	export let licenseData: LicenseData;

	const licenses = Object.keys(licenseData).map((packageName) => ({
		packageName,
		...licenseData[packageName]
	}));

	function sanitize(input: string): string {
		return input;
		// return sanitizeHtml(input, {
		// 	allowedTags: ['a'],
		// 	allowedAttributes: {
		// 		a: ['href']
		// 	}
		// });
	}

	function stripVersion(input: string): string {
		return input.replace(/@[0-9.]+$/, '');
	}

	function cleanUrl(url: string): string {
		let cleanUrl = url.replace(/^\+git/, '');
		if (!cleanUrl.startsWith('http')) {
			cleanUrl = 'https://' + cleanUrl;
		}
		return cleanUrl;
	}

	function formatLicense(license: (typeof licenses)[0]) {
		const cleanName = stripVersion(license.packageName);
		const url = license.url ?? license.repository;

		const name = url ? `<a href="${cleanUrl(url)}">${cleanName}</a>` : cleanName;
		const publisher = license.publisher ? ` by ${license.publisher}` : '';

		return sanitize(`${name}${publisher}`);
	}
</script>

<ul>
	{#each licenses as license}
		<li>{@html formatLicense(license)}</li>
	{/each}
</ul>

<style>
</style>
