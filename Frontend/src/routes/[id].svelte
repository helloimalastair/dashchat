<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { fancyTimeFormat } from '$lib/utils/timeFormatting';
	import Sockette from 'sockette';

	const { id } = $page.params;

	let stream: any;
	let ws: Sockette;
	let messages: { sender: string; timestamp: number; message: string }[] = [];

	let currentMessage: string = '';
	let currentAlert: {
		type: 'info' | 'error';
		rawHtml: string;
	} | null = null;
	let closeTimeout: NodeJS.Timeout;
	let timeLastSent: number = 0;
	let lastJsEvent: number = 0;

	let isOwner: boolean = false;
	let isJSAction: boolean = false;

	const triggerClose = () => {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
		}
		closeTimeout = setTimeout(() => {
			currentAlert = null;
		}, 2000);
	};
	const alertPlay = (subject: string) => {
		currentAlert = {
			type: 'info',
			rawHtml: `<span><strong>${subject}</strong> resumed the video.</span>`
		};
		triggerClose();
	};
	const alertPause = (subject: string) => {
		currentAlert = {
			type: 'info',
			rawHtml: `<span><strong>${subject}</strong> paused the video.</span>`
		};
		triggerClose();
	};

	const sendMessage = () => {
		if (!currentMessage.length) {
			return;
		}

		ws.send(JSON.stringify({ type: 'sendMessage', data: { message: currentMessage } }));
		timeLastSent = Date.now();
		currentMessage = '';
	};

	const syncTime = () => {
		ws.send(JSON.stringify({ type: 'syncTimecodes', data: { time: stream.currentTime } }));
		timeLastSent = Date.now();
	};

	onMount(() => {
		ws = new Sockette(`wss://api.dashchat.app/rooms/${id}`, {
			timeout: 5e3,
			maxAttempts: 10,
			onclose: (e) => {
				console.log('Websocket closed:', e);
			},
			onmessage: async (event) => {
				const msg = JSON.parse(event.data) as { type: string; data: any };

				const handler = {
					welcome: async () => {
						if (msg.data.isOwner) {
							isOwner = true;
							console.log('You are the OWNER!');
						}
					},
					pauseVideo: async () => {
						lastJsEvent = Date.now();
						alertPause(msg.data.subject);
						stream.pause();
					},
					playVideo: async () => {
						lastJsEvent = Date.now();
						alertPlay(msg.data.subject);
						stream.play();
					},
					receiveMessage: async () => {
						messages.push(msg.data);
						messages = messages;
					},
					syncTimecodes: async () => {
						stream.currentTime = msg.data.time;
					}
				}[msg.type];

				if (handler) {
					await handler();
				}
			}
		});

		setInterval(() => {
			if (Date.now() - timeLastSent > 10000) {
				ws.send(JSON.stringify({ type: 'ping' }));
				timeLastSent = Date.now();
			}
		}, 2000);

		const streamScript = document.createElement('script');
		streamScript.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
		streamScript.addEventListener('load', () => {
			stream = Stream(document.getElementById('stream-player'));
			stream.addEventListener('pause', () => {
				if (Date.now() - lastJsEvent < 100) {
					return;
				}
				alertPause('You');
				ws.send(JSON.stringify({ type: 'pauseVideo', data: {} }));
				timeLastSent = Date.now();
				stream.pause();
			});
			stream.addEventListener('play', async () => {
				if (Date.now() - lastJsEvent < 100) {
					return;
				}
				alertPlay('You');
				ws.send(JSON.stringify({ type: 'playVideo', data: {} }));
				timeLastSent = Date.now();
				await stream.play();
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
	<h1 class="text-xl mr-auto"><strong>Room:</strong> {id}</h1>
</div>
<div class="flex flex-col justify-start items-center mt-12 h-full">
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
			<form
				on:submit|preventDefault={sendMessage}
				class="flex flex-col justify-end items-start bg-light-100 rounded-lg shadow border w-[300px] h-[450px] mx-4"
			>
				<span class="mb-auto mx-auto mt-2 font-bold text-lg">Chat</span>
				<div class="flex flex-col justify-end items-start overflow-y-scroll">
					{#each messages as message}
						<span class="text-gray-500 font-bold text-xs mb-1 mt-2 ml-2"
							>{message.sender} - {new Date(message.timestamp).toLocaleTimeString()}</span
						>
						<div class="rounded shadow bg-gray-200 px-4 py-2 mx-2 mb-2">{message.message}</div>
					{/each}
				</div>
				<input
					type="text"
					bind:value={currentMessage}
					class="h-full w-full rounded-b-lg px-2 py-1 border-t h-[40px] outline-none focus:bg-blue-400 focus:bg-opacity-10 transition"
					placeholder="Type a message..."
				/>
			</form>
		</div>
	</div>

	<div class="w-[1120px] flex justify-center items-center">
		{#if currentAlert != null}
			<div
				class="w-[920px] flex items-center mr-4 rounded-full mt-4 p-4 bg-blue-100"
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
			<div class="w-[920px] mr-4 rounded-full mt-4 p-4" />
		{/if}
		<button
			on:click|preventDefault={() => {
				if (stream.paused) {
					syncTime();
				} else {
					currentAlert = {
						type: 'error',
						rawHtml: '<span>Video must be paused to sync.</span>'
					};
				}
			}}
			class="text-start rounded-xl shadow border border-blue-400 hover:bg-white hover:text-black transition px-4 py-2 text-white w-[200px] mx-2 mt-4 bg-blue-400 flex justify-start items-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				class="mr-3"
				role="img"
				width="50px"
				height="50px"
				preserveAspectRatio="xMidYMid meet"
				viewBox="0 0 1024 1024"
				><path
					fill="currentColor"
					d="M168 504.2c1-43.7 10-86.1 26.9-126c17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 0 1 755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 0 0 3 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92C282.7 92 96.3 275.6 92 503.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8zm756 7.8h-60c-4.4 0-7.9 3.5-8 7.8c-1 43.7-10 86.1-26.9 126c-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 0 1 512.1 856a342.24 342.24 0 0 1-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 0 0-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 0 0-8-8.2z"
				/></svg
			>
			<div class="flex flex-col justify-start text-left">
				<span class="text-xl font-bold">Sync</span>
			</div>
		</button>
	</div>
</div>
