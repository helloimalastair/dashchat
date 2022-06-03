<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { fancyTimeFormat } from '$lib/utils/timeFormatting';

	let { id } = $page.params;
	let talking: boolean = false;

	let currentAlert: {
		type: 'info' | 'error';
		event: 'play' | 'pause' | 'seeking' | 'seeked';
		rawHtml: string;
	} | null = null;
	let closeTimeout: NodeJS.Timeout;

	function toggleMic() {
		talking = !talking;
	}
	function triggerClose() {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
		}
		closeTimeout = setTimeout(() => {
			currentAlert = null;
		}, 2000);
	}

	onMount(() => {
		const streamScript = document.createElement('script');
		streamScript.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
		streamScript.addEventListener('load', () => {
			const stream = Stream(document.getElementById('stream-player'));
			stream.addEventListener('pause', () => {
				currentAlert = {
					type: 'info',
					event: 'pause',
					rawHtml: '<span><strong>You</strong> paused the video.</span>'
				};
				triggerClose();
			});
			stream.addEventListener('play', () => {
				// If there is not currently a seek event going on, then we can set the message.
				// Otherwise the play event overwrites the seek event, which we don't want.
				if (currentAlert?.event != 'seeking') {
					currentAlert = {
						type: 'info',
						event: 'play',
						rawHtml: '<span><strong>You</strong> resumed the video.</span>'
					};
					triggerClose();
				}
			});
			stream.addEventListener('seeked', () => {
				currentAlert = {
					type: 'info',
					event: 'seeked',
					rawHtml: `<span>Video seeked to ${fancyTimeFormat(stream.currentTime)}. Resuming.</span>`
				};
				triggerClose();
			});
			stream.addEventListener('seeking', () => {
				currentAlert = {
					type: 'info',
					event: 'seeking',
					rawHtml: `<span><strong>You</strong> seeked the video. Waiting for synchronization...</span>`
				};
				if (closeTimeout) {
					clearTimeout(closeTimeout);
				}
			});
		});
		document.head.appendChild(streamScript);
	});
</script>

<svelte:head>
	<script
		id="stream-script"
		src="https://embed.videodelivery.net/embed/sdk.latest.js"
		async
		defer></script>
</svelte:head>

<div class="h-[60px] w-full flex justify-center items-center border-b-2 px-8">
	<a href="/" class="mr-auto group">
		<svg
			class="text-4xl transform group-hover:-translate-x-1 transition"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			role="img"
			width="1em"
			height="1em"
			preserveAspectRatio="xMidYMid meet"
			viewBox="0 0 24 24"
		>
			<path
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="m11 5l-7 7l7 7m-7-7h16"
			/>
		</svg>
	</a>
	<h1 class="text-xl mr-auto"><strong>Room:</strong> 123</h1>
</div>
<div class="flex flex-col justify-start items-center mt-12 h-full">
	<span class="w-[800px] mr-[300px] text-left font-bold text-xl"
		>Our data is GONE... Again - Petabyte Project Recovery Part 1</span
	>
	<span class="w-[800px] mr-[300px] text-left mb-4 font-medium text-lg text-gray-400"
		>Linus Media Group</span
	>
	<div class="flex justify-center items-center">
		<iframe
			title="Video"
			src={`https://iframe.videodelivery.net/${id}`}
			style="border: none;"
			allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
			allowfullscreen={false}
			class="w-[800px] h-[450px] rounded-lg shadow"
			id="stream-player"
		/>
		<div class="h-[450px] flex flex-col justify-start items-center">
			<div
				class="flex flex-col justify-end items-center bg-light-100 rounded-lg shadow border w-[300px] h-[370px] mx-4"
			>
				<span class="mb-auto mt-2 font-bold text-lg">Chat</span>
				<input
					type="text"
					class="h-full w-full rounded-b-lg px-2 py-1 border-t h-[40px] outline-none focus:bg-blue-400 focus:bg-opacity-10 transition"
					placeholder="Type a message..."
				/>
			</div>
			<div
				class="flex px-6 h-[80px] justify-start items-center rounded-lg shadow bg-light-100 border mx-4 mt-2 w-[300px]"
			>
				<button
					on:click={toggleMic}
					class={`relative transition flex justify-center items-center text-white text-2xl rounded-full h-14 w-14 shadow-lg mr-4 border ${
						talking
							? 'bg-red-400 text-white border-red-400 hover:bg-red-400'
							: 'bg-white text-black border-black hover:bg-light-400 hover:bg-opacity-100'
					}`}
				>
					{#if talking}
						<div class="absolute inline-flex w-9 h-9 rounded-full bg-red-400 animate-ping" />
					{/if}
					{#if talking}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							role="img"
							width="1em"
							height="1em"
							preserveAspectRatio="xMidYMid meet"
							viewBox="0 0 24 24"
							class="z-10"
							><path
								fill="currentColor"
								d="M12 16c2.206 0 4-1.794 4-4V6c0-2.217-1.785-4.021-3.979-4.021a.933.933 0 0 0-.209.025A4.006 4.006 0 0 0 8 6v6c0 2.206 1.794 4 4 4z"
							/><path
								fill="currentColor"
								d="M11 19.931V22h2v-2.069c3.939-.495 7-3.858 7-7.931h-2c0 3.309-2.691 6-6 6s-6-2.691-6-6H4c0 4.072 3.061 7.436 7 7.931z"
							/></svg
						>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							role="img"
							width="1em"
							height="1em"
							preserveAspectRatio="xMidYMid meet"
							viewBox="0 0 24 24"
							class="z-10"
							><path
								fill="currentColor"
								d="m21.707 20.293l-3.4-3.4A7.93 7.93 0 0 0 20 12h-2a5.945 5.945 0 0 1-1.119 3.467l-1.449-1.45A3.926 3.926 0 0 0 16 12V6c0-2.217-1.785-4.021-3.979-4.021c-.07 0-.14.009-.209.025A4.006 4.006 0 0 0 8 6v.586L3.707 2.293L2.293 3.707l18 18l1.414-1.414zM6 12H4c0 4.072 3.06 7.436 7 7.931V22h2v-2.069a7.935 7.935 0 0 0 2.241-.63l-1.549-1.548A5.983 5.983 0 0 1 12 18c-3.309 0-6-2.691-6-6z"
							/><path
								fill="currentColor"
								d="M8.007 12.067a3.996 3.996 0 0 0 3.926 3.926l-3.926-3.926z"
							/></svg
						>
					{/if}
				</button>
				<span class="font-medium">
					{#if talking}
						Your microphone is on.
					{:else}
						Press to talk.
					{/if}
				</span>
			</div>
		</div>
	</div>

	{#if currentAlert != null}
		<div
			class="w-[1120px] flex items-center mr-4 rounded-full mt-4 p-4 bg-blue-100"
			out:fly={{ y: 20 }}
			in:fly={{ y: -20 }}
		>
			{#if currentAlert.type === 'info'}
				<svg
					class="mr-2 text-xl"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
					role="img"
					width="1em"
					height="1em"
					preserveAspectRatio="xMidYMid meet"
					viewBox="0 0 24 24"
				>
					<g fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M12 7h.01" /><path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10 11h2v5m-2 0h4"
						/>
					</g>
				</svg>
			{/if}
			{@html currentAlert.rawHtml}
		</div>
	{:else}
		<div class="w-[1120px] mr-4 rounded-full mt-4 p-4" />
	{/if}
</div>
