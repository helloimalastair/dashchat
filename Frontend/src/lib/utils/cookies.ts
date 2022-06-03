const parseCookies = (str: string) =>
	str
		.split(';')
		.map((v) => v.split('='))
		.reduce((acc: any, v: any) => {
			acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
			return acc;
		}, {});

export const getCookieByName = (name: string, header: string) => {
	const cookies = parseCookies(header);
	return cookies[name] || null;
};
