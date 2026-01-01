<script lang="ts">

	import { SiDiscord, SiGithub, SiLastdotfm, SiProtonmail } from '@icons-pack/svelte-simple-icons';
	import Social from '../components/Social.svelte';
	import StatusAvatar from '../components/StatusAvatar.svelte';
	import { onMount } from 'svelte';

	let status: 'unknown' | 'offline' | 'dnd' | 'idle' | 'online';
	let pfp: string;

	onMount(async () => {
		const userId = '804066391614423061';
		const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);

		if (res.ok) {
			const data = await res.json();
			status = data?.data?.discord_status ?? 'offline';
			pfp = data?.data?.discord_user.avatar
		}
	});
</script>

<img
	src="dithered-kharkiv.png"
	class="absolute -z-40 h-screen w-screen object-cover animate-opacity duration-300"
	alt=""
	style="opacity: {pfp ? 0.2 : 0.6}"
/>

<main style="opacity: {pfp ? 1 : 0}" class="animate-opacity duration-300">
	<div class="flex h-screen w-screen items-center justify-center">
		<div class="space-y-2 border-1 border-foreground/10 bg-background/30 p-3 backdrop-blur-xs">
			<div class="flex flex-col items-center">
				<svelte:component this={StatusAvatar} pfp={pfp} status={status} />
				<div class="text-center">
					<h1 class="text-xl font-bold text-foreground">logix</h1>
					<p class="text-sm text-foreground-muted">@logix.lol</p>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-2.5">
				<svelte:component
					this={Social}
					icon={SiDiscord}
					text={'Discord'}
					hrefOrText={'logix.lol'}
				/>
				<svelte:component
					this={Social}
					icon={SiGithub}
					text={'Github'}
					hrefOrText="https://github.com/logixism"
				/>
				<svelte:component
					this={Social}
					icon={SiProtonmail}
					text={'Email'}
					hrefOrText="mailto:logixism@pm.me"
				/>
				<svelte:component
					this={Social}
					icon={SiLastdotfm}
					text={'Last.fm'}
					hrefOrText="https://www.last.fm/user/logixism"
				/>
			</div>
		</div>
	</div>
</main>
