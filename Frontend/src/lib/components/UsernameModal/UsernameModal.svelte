<script lang="ts">
	import { getCookieByName } from '$lib/utils/cookies';
	import { onMount } from 'svelte';

	const nameRegex = /^[a-zA-Z0-9\-\_]{5,50}$/;

	let visible: boolean = false;
	let username: string = '';
	let usernameError: string | null = 'Username cannot be empty';

	onMount(() => {
		const cookie = getCookieByName('uname', document.cookie);
		console.log(cookie);
		if (!cookie) {
			visible = true;
		} else {
			visible = false;
		}
	});

	const checkUsername = () => {
		if (username.length === 0) {
			usernameError = 'Username cannot be empty.';
			return;
		}

		if (username.length < 5) {
			usernameError = 'Username must be at least 5 characters long.';
			return;
		}
		if (username.length > 50) {
			usernameError = 'Username must be less than 50 characters long.';
			return;
		}

		if (!nameRegex.test(username)) {
			usernameError = 'Username must only contain letters, numbers, underscores, and/or hyphens.';
			return;
		}

		usernameError = null;
	};

	const submitUsername = async () => {
		const reply = await fetch('https://api.dashchat.app/identify', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				uname: username
			})
		});
		console.log(await reply.text());
		if (reply.ok) {
			visible = false;
		}
	};
</script>

<div
	class={`w-screen h-screen flex justify-center items-center ${
		visible ? '' : 'hidden pointer-events-none'
	}`}
	aria-hidden={visible}
>
	<div
		class="flex flex-col justify-center items-center bg-white text-black rounded-lg w-[400px] h-[400px]"
	>
		<span class="text-lg text-center">Welcome to</span>
		<h1 class="font-bold text-4xl text-center">DashChat</h1>
		<span class="text-lg text-center my-4 mb-8">Please enter a username:</span>
		<form
			class="flex flex-col justify-center items-center"
			on:submit|preventDefault={submitUsername}
		>
			<div class="flex flex-col justify-center items-center shadow border rounded-lg">
				<input
					type="text"
					class="rounded-t-lg px-4 py-2 w-[250px]"
					placeholder="Username"
					bind:value={username}
					on:input={checkUsername}
				/>
				<div
					class={`text-sm rounded-b-lg w-[250px] py-2 px-4 ${
						usernameError ? 'text-red-600' : 'text-green-600'
					}`}
				>
					{#if usernameError}
						{usernameError}
					{:else}
						Looks good!
					{/if}
				</div>
			</div>

			<button
				disabled={usernameError != null}
				class="mt-4 bg-blue-400 rounded shadow px-4 py-2 text-white w-[250px] hover:bg-white hover:text-blue-400 border border-blue-400 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:text-black disabled:hover:text-black transition"
			>
				Submit
			</button>
		</form>
	</div>
</div>
