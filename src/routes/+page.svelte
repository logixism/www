<script>
	// @ts-nocheck

	import { SiDiscord, SiGithub, SiLastdotfm, SiProtonmail } from '@icons-pack/svelte-simple-icons';
	import Social from '../components/Social.svelte';
	import StatusAvatar from '../components/StatusAvatar.svelte';
	import { resolve } from '$app/paths';
</script>

<img
	src={resolve('/dithered-kharkiv.png')}
	class="absolute -z-40 h-screen w-screen object-cover opacity-20 dark:opacity-10"
	alt=""
/>

<main>
	<div class="flex h-screen w-screen items-center justify-center">
		<div class="space-y-2 border-1 border-foreground/10 bg-background/30 p-3 backdrop-blur-xs">
			<div class="flex flex-col items-center">
				<StatusAvatar />
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
