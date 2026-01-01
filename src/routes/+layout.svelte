<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/eb-garamond';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={"/favicon.png"} />
</svelte:head>

{@render children?.()}
