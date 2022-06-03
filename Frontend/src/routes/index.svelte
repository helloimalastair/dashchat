<script lang="ts">
	import * as tus from 'tus-js-client';
	import { tweened, type Tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let uploading: boolean = false;
	let uploadProgressPercent: Tweened<number> = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

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

	const getVideoLength = async (file: File) => {
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
		console.log(length);

		// // Get a URL.
		// const reply = await fetch(`example.com/create`, {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	}
		// });

		// // TODO: Add error logic.
		// if (!reply.ok) return;

		// const jsonReply = await reply.json();

		// const upload = new tus.Upload(file, {
		// 	uploadUrl: jsonReply.url,
		// 	retryDelays: [0, 3000, 5000, 10000, 20000],
		// 	chunkSize: 1024 * 50,
		// 	uploadSize: file.size,
		// 	metadata: {
		// 		filename: file.name,
		// 		filetype: file.type
		// 	}
		// });

		// const previousUploads = await upload.findPreviousUploads();
		// if (previousUploads.length > 0) {
		// 	upload.resumeFromPreviousUpload(previousUploads[0]);
		// } else {
		// 	upload.start();
		// }

		uploading = true;
		$uploadProgressPercent = 50;
	};
</script>

<div class="flex flex-col justify-start pt-24 items-center h-screen">
	<span class="text-lg text-center">Welcome to</span>
	<h1 class="font-bold text-4xl text-center">DashChat</h1>

	<p class="w-80 text-center mt-4 mb-8">To start, upload a video file.</p>

	{#if uploading}
		<!-- Uploading icon and square, progress bar uses tweened value from above -->
		<div
			class="relative w-80 h-80 transition border-dotted border-8 rounded-lg flex flex-col justify-center items-center"
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
			<span class="text-lg mx-8 my-2 text-center">Uploading...</span>
			<span class="font-bold text-xl">{$uploadProgressPercent.toFixed()}%</span>

			<div
				class="absolute -bottom-15 -right-2 -left-2 mt-auto rounded shadow px-4 py-4 bg-white border border-blue-400"
			>
				<div
					class="absolute left-0 top-0 bottom-0 bg-blue-400"
					style={`right: ${100 - $uploadProgressPercent}%`}
				/>
			</div>
		</div>
	{:else if files && files.length > 0}
		<!-- Upload button, upload is NOT in progress at this point -->
		<button
			class="relative w-80 h-80 transition border-dotted border-8 rounded-lg flex flex-col justify-center items-center"
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
			<span class="text-lg mx-8 my-2 text-center"
				>File selected. Upload when ready, or <button
					on:click={() => (files = undefined)}
					class="text-blue-400 hover:text-black">try again</button
				>.</span
			>

			<button
				in:fade={{ duration: 200 }}
				on:click={upload}
				class="absolute -bottom-15 -right-2 -left-2 mt-auto bg-blue-400 rounded shadow px-4 py-2 text-white hover:bg-white hover:text-blue-400 border border-blue-400 transition"
			>
				Upload
			</button>
		</button>
	{:else}
		<!-- "Select a file" handler, with drag and drop actions so user can drag-and-drop file -->
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
			<span class="text-sm text-center w-40">Supported formats: .mp4, .webm</span>
			<input
				type="file"
				accept="video/mp4, video/webm"
				bind:files
				class="opacity-0 absolute top-0 right-0 left-0 bottom-0 cursor-pointer"
			/>
		</button>
	{/if}
</div>
