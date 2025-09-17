<script lang="ts">
	import { tick } from 'svelte';

	export let text: string;
	export let hrefOrText: string;
	export let icon: any;

	let Icon = icon;
	let displayText = text;

	function isLink(str: string) {
		return /^mailto:|^https?:\/\//.test(str);
	}

	async function handleCopy() {
		await navigator.clipboard.writeText(hrefOrText);
		displayText = 'Copied';
		await tick();
		setTimeout(() => {
			displayText = text;
		}, 1500);
	}
</script>

{#if isLink(hrefOrText)}
	<a
		href={hrefOrText}
		target="_blank"
		rel="noreferrer noopener"
		class="flex h-8 w-24 cursor-pointer flex-row items-center space-x-2 border-1 border-foreground/10 bg-foreground/5 p-2 transition-colors duration-300 hover:bg-foreground/7"
	>
		<Icon size={16} />
		<span>{text}</span>
	</a>
{:else}
	<button
		type="button"
		on:click={handleCopy}
		class={`${displayText === 'Copied' ? 'border-green-500/30 !bg-green-500/20' : ''} flex h-8 w-24 cursor-pointer flex-row items-center space-x-2 border-1 border-foreground/10 bg-foreground/5 p-2 transition-colors duration-300 hover:bg-foreground/7`}
	>
		<Icon size={16} />
		<span>{displayText}</span>
	</button>
{/if}
