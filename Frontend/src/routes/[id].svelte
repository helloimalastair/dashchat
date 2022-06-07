<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { fancyTimeFormat } from '$lib/utils/timeFormatting';

	let stream: any;
	let ws: WebSocket;
	let { id } = $page.params;

	let currentAlert: {
		type: 'info' | 'error';
		event: 'play' | 'pause' | 'seeking' | 'seeked';
		rawHtml: string;
	} | null = null;
	let closeTimeout: NodeJS.Timeout;
	let isJSAction: boolean = false;

	function triggerClose() {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
		}
		closeTimeout = setTimeout(() => {
			currentAlert = null;
		}, 2000);
	}

	const alertPlay = (subject: string) => {
		currentAlert = {
			type: 'info',
			event: 'play',
			rawHtml: `<span><strong>${subject}</strong> resumed the video.</span>`
		};
		triggerClose();
	};

	const alertPause = (subject: string) => {
		currentAlert = {
			type: 'info',
			event: 'play',
			rawHtml: `<span><strong>${subject}</strong> paused the video.</span>`
		};
		triggerClose();
	};

	onMount(() => {
		ws = new WebSocket(`wss://api.dashchat.app/rooms/${id}`);
		ws.onmessage = async (event) => {
			const msg = JSON.parse(event.data) as { type: string; data: any };

			const handler = {
				pauseVideo: async () => {
					isJSAction = true;
					alertPause(msg.data.subject);
					stream.pause();
				},
				playVideo: async () => {
					isJSAction = true;
					alertPlay(msg.data.subject);
					await stream.play();
				}
			}[msg.type];

			if (handler) {
				await handler();
			}
		};

		setInterval(() => {
			ws.send(JSON.stringify({ type: 'ping', data: {} }));
		}, 5000 + Math.random() * 1000);

		const streamScript = document.createElement('script');
		streamScript.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
		streamScript.addEventListener('load', () => {
			stream = Stream(document.getElementById('stream-player'));
			stream.addEventListener('pause', () => {
				alertPause('You');
				if (isJSAction) {
					isJSAction = false;
					return;
				}
				stream.pause();
				ws.send(JSON.stringify({ type: 'pauseVideo', data: {} }));
			});
			stream.addEventListener('play', async () => {
				alertPlay('You');
				if (isJSAction) {
					isJSAction = false;
					return;
				}
				await stream.play();
				ws.send(JSON.stringify({ type: 'playVideo', data: {} }));
			});
		});
		document.head.appendChild(streamScript);
	});
</script>

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
	<span class="mr-[300px] mb-4 text-left font-bold text-xl">Room: {id}</span>
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
				class="flex flex-col justify-end items-center bg-light-100 rounded-lg shadow border w-[300px] h-[450px] mx-4"
			>
				<span class="mb-auto mt-2 font-bold text-lg">Chat</span>
				<input
					type="text"
					class="h-full w-full rounded-b-lg px-2 py-1 border-t h-[40px] outline-none focus:bg-blue-400 focus:bg-opacity-10 transition"
					placeholder="Type a message..."
				/>
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
