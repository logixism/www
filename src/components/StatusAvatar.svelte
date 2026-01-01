<script lang="ts">
	const statusColors = {
		offline: 'bg-gray-500',
		dnd: 'bg-red-500',
		idle: 'bg-yellow-500',
		online: 'bg-green-500'
	};

	export let status: 'unknown' | 'offline' | 'dnd' | 'idle' | 'online';
	export let pfp: string;
</script>

<div class="relative">
	<img
		alt="avatar"
		loading="lazy"
		width="96"
		height="96"
		decoding="async"
		data-nimg="1"
		class="h-24 w-24 object-cover ring-2 "
		style="color:transparent"
		src={`https://cdn.discordapp.com/avatars/804066391614423061/${pfp}.webp`}
	/>
	<span
		class={`absolute -right-1 -bottom-1 h-4 w-4 border-2 border-background ${status in statusColors ? `${statusColors[status as keyof typeof statusColors]}` : 'bg-transparent'}`}
	></span>
</div>
