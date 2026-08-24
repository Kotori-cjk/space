import { hasValidSession, loginPage } from './_lib/auth.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/politics-recite')) {
    return Response.redirect(context.env.RECITE_URL || 'https://kotori-cjk-recite.pages.dev/', 302);
  }
  if (url.pathname.startsWith('/auth/')) return context.next();

  if (!await hasValidSession(context.request, context.env.SESSION_SECRET)) {
    const next = `${url.pathname}${url.search}`;
    return new Response(loginPage(next), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' }
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'private, no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
