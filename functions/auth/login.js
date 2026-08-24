import { createSessionCookie, loginPage, safeNext } from '../_lib/auth.js';

export function onRequestGet() {
  return new Response(loginPage('/'), { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
}

export async function onRequestPost(context) {
  const form = await context.request.formData();
  const next = safeNext(form.get('next'));
  if (!context.env.SPACE_PASSWORD || !context.env.SESSION_SECRET) {
    return new Response('Space authentication secrets are not configured.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (String(form.get('password') || '') !== context.env.SPACE_PASSWORD) {
    return new Response(loginPage(next, 'invalid'), { status: 401, headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
  }
  return new Response(null, { status: 303, headers: { Location: next, 'Set-Cookie': await createSessionCookie(context.env.SESSION_SECRET), 'Cache-Control': 'no-store' } });
}
