import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from './lib/browser-session.mjs';
export async function currentUser() {
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return session ? { id: session.id, email: `browser:${session.id}`, name: 'Your workspace', image: null } : null;
}
