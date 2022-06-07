import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		ssr: event.url.pathname !== '/'
	});

	return response;
};
