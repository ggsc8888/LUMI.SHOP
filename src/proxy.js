import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSession, readSession, sameOriginRequest } from './lib/browser-session.mjs';
export function proxy(request) {
  if (request.nextUrl.pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && !sameOriginRequest(request)) {
    return NextResponse.json({ error: 'Please use this app to make changes.' }, { status: 403 });
  }
  const current = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = readSession(current), value = valid ? current : createSession();
  const headers = new Headers(request.headers);
  if (!valid) {
    const others = (headers.get('cookie') || '').split(';').filter(c => c.trim() && !c.trim().startsWith(`${SESSION_COOKIE}=`));
    headers.set('cookie', [...others, `${SESSION_COOKIE}=${value}`].join('; '));
  }
  const response = NextResponse.next({ request: { headers } });
  if (!valid) response.cookies.set(SESSION_COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
