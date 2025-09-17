<script lang="ts">
	import { onMount } from 'svelte';

	const statusColors = {
		offline: 'bg-gray-500',
		dnd: 'bg-red-500',
		idle: 'bg-yellow-500',
		online: 'bg-green-500'
	};

	let status: 'unknown' | 'offline' | 'dnd' | 'idle' | 'online' = 'unknown';

	onMount(async () => {
		const userId = '804066391614423061';
		const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);

		if (res.ok) {
			const data = await res.json();
			status = data?.data?.discord_status ?? 'offline';
		}
	});
</script>

<div class="relative">
	<img
		alt="avatar"
		loading="lazy"
		width="96"
		height="96"
		decoding="async"
		data-nimg="1"
		class="h-24 w-24 object-cover ring-2"
		style="color:transparent"
		src="https://cdn.discordapp.com/avatars/804066391614423061/71671d4c657810ba6fecfa67e957bdb7.webp"
	/>
	<span
		class={`absolute -right-1 -bottom-1 h-4 w-4 border-2 border-background ${status in statusColors ? `${statusColors[status as keyof typeof statusColors]}` : 'bg-transparent'} transition-colors duration-500`}
	></span>
</div>
