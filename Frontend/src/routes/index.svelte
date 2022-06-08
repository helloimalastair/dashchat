<script lang="ts">
	import { tweened, type Tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import * as tus from 'tus-js-client';

	let uploadProgressPercent: Tweened<number> = tweened(0, {
		duration: 400,
		easing: cubicOut
	});
	let uploadProgressBytes: Tweened<number> = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

	let error: string = '';
	let status: 'idle' | 'uploading' | 'processing' | 'done' | 'error' = 'idle';
	let files: FileList | undefined;
	let dragging: boolean = false;

	const onDragDrop = (event: DragEvent) => {
		dragging = false;
		if (event.dataTransfer?.files) {
			if (event.dataTransfer.files.length != 1) return;
			if (
				event.dataTransfer.files[0].type === 'video/webm' ||
				event.dataTransfer.files[0].type === 'video/mp4'
			) {
				files = event.dataTransfer.files;
			}
		}
	};

	const getVideoLength = async (file: File): Promise<number> => {
		const video = document.createElement('video');
		video.preload = 'metadata';

		video.src = URL.createObjectURL(file);

		return new Promise((resolve, reject) => {
			video.onloadedmetadata = () => {
				window.URL.revokeObjectURL(video.src);
				resolve(video.duration);
			};
		});
	};

	const upload = async () => {
		const file = files?.item(0) as File;

		const length = await getVideoLength(file);
		console.log(file.size);

		// Get a URL.
		const reply = await fetch(`https://api.dashchat.app/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				roomName: 'test123456',
				password: 'test123456',
				videoLength: length,
				videoSize: file.size
			}),
			credentials: 'include'
		});

		if (!reply.ok) return;

		const jsonReply = await reply.json();
		const uploadLink = jsonReply.uploadLink;

		const upload = new tus.Upload(file, {
			uploadUrl: uploadLink,
			chunkSize: 5_242_880,
			uploadSize: file.size,
			metadata: {
				filename: file.name,
				filetype: file.type
			},
			onProgress: (uploaded, total) => {
				$uploadProgressPercent = (uploaded / total) * 100;
				$uploadProgressBytes = uploaded;
			},
			onSuccess: async () => {
				status = 'processing';
				Notification.requestPermission();

				awaitProcessing(jsonReply.streamId, jsonReply.doId);
			},
			onError: (error) => {
				status = 'error';
			}
		});
		upload.start();

		status = 'uploading';
	};

	const awaitProcessing = async (streamId: string, doId: string) => {
		const reply = await fetch(`https://api.dashchat.app/processing/${streamId}`, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (reply.ok) {
			const jsonReply = await reply.json();
			if (jsonReply.success && jsonReply.status === 'ready') {
				if (Notification.permission === 'granted') {
					const notification = new Notification('DashChat', {
						body: 'Processing of your video is complete!'
					});
				}
				status = 'done';
				location.pathname = `/${streamId}`;
			} else {
				setTimeout(() => awaitProcessing(streamId, doId), 5000);
			}
		} else {
			status = 'error';
			error = 'Video not found.';
		}
	};
</script>

<div class="flex flex-col justify-start pt-24 items-center h-screen">
	<span class="text-lg text-center">Welcome to</span>
	<h1 class="font-bold text-4xl text-center">DashChat</h1>

	{#if status === 'done'}
		<p class="w-80 text-center mt-4 mb-8">DONE.</p>
	{:else if status === 'processing'}
		<p class="w-80 text-center mt-4 mb-8 font-bold">Processing...</p>
		<span class="text-sm w-80 text-center">
			This may take a few minutes, depending on the length of your video. To get a notification when
			finished, click "Allow" on the popup.
		</span>
	{:else if status === 'uploading'}
		<!-- Uploading icon and square, progress bar uses tweened value from above -->
		<div class="flex flex-col justify-center items-center">
			<p class="w-80 text-center mt-4 mb-8 font-bold">Uploading...</p>
			<span class="text-sm mb-1"
				>{($uploadProgressBytes / 1_000_000).toFixed(1)} Mb / {(
					(files?.item(0)?.size || 0) / 1_000_000
				).toFixed(1)} Mb</span
			>
			<span class="font-bold mb-2 text-xl">{$uploadProgressPercent.toFixed()}%</span>
			<div class="relative rounded shadow px-4 py-4 bg-white border border-blue-400 w-48">
				<div
					class="absolute left-0 top-0 bottom-0 bg-blue-400"
					style={`right: ${100 - $uploadProgressPercent}%`}
				/>
			</div>
		</div>
	{:else if status === 'idle'}
		<p class="w-80 text-center mt-4 mb-8 font-bold">To start, upload a video file.</p>
		<button
			on:dragenter|preventDefault={() => (dragging = true)}
			on:dragleave|preventDefault={() => (dragging = false)}
			on:dragover|preventDefault={() => (dragging = true)}
			on:drop|preventDefault={onDragDrop}
			class={`relative w-80 h-80 transition border-dotted border-8 rounded-lg flex flex-col justify-center items-center ${
				dragging ? 'bg-blue-300' : ''
			}`}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				role="img"
				width="100"
				height="100"
				preserveAspectRatio="xMidYMid meet"
				viewBox="0 0 24 24"
				class="text-gray-500 m-2"
			>
				<g
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				>
					<rect width="20" height="16" x="2" y="4" rx="4" />
					<path d="m15 12l-5-3v6l5-3Z" />
				</g>
			</svg>
			<span class="text-lg mx-8 my-2 text-center">
				Click to select, or drag-and-drop a video file.
			</span>
			<span class="text-sm text-center w-40">Supported formats: .mp4</span>
			<input
				type="file"
				accept="video/mp4"
				bind:files
				on:change={upload}
				class="opacity-0 absolute top-0 right-0 left-0 bottom-0 cursor-pointer"
			/>
		</button>
	{/if}
</div>
