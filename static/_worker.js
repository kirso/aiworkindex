const CANONICAL_ORIGIN = 'https://aiworkindex.com';
const REDIRECT_HOSTS = new Set(['www.aiworkindex.com', 'aiworkindex.pages.dev']);

function canonicalRedirect(url) {
	const target = new URL(url.pathname + url.search, CANONICAL_ORIGIN);
	return Response.redirect(target.toString(), 301);
}

export default {
	fetch(request, env) {
		const url = new URL(request.url);
		if (REDIRECT_HOSTS.has(url.hostname)) {
			return canonicalRedirect(url);
		}

		return env.ASSETS.fetch(request);
	}
};
