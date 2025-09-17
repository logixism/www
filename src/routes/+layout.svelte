<script lang="ts">
	import '../app.css';
	import favicon from '/favicon.png';
	import '@fontsource-variable/eb-garamond';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
