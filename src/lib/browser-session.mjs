import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const SESSION_COOKIE = 'jewel_browser_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
function secret() {
  if (!process.env.AUTH_SECRET) throw new Error('Browser sessions are not configured.');
  return process.env.AUTH_SECRET;
}
export function createSession(now = Date.now()) {
  const payload = `${randomBytes(32).toString('hex')}.${Math.floor(now / 1000) + SESSION_MAX_AGE}`;
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('hex')}`;
}
export function readSession(value, now = Date.now()) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}\.\d{10}\.[a-f0-9]{64}$/.test(value)) return null;
  const [id, expires, signature] = value.split('.');
  const expected = createHmac('sha256', secret()).update(`${id}.${expires}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
  if (Number(expires) <= Math.floor(now / 1000)) return null;
  return { id, expiresAt: Number(expires) * 1000 };
}
export function sameOriginRequest(request) {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}
