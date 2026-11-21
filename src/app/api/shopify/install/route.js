import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { appUrl, normalizeShop } from '@/lib/shopify/config';
import { authorizeUrl } from '@/lib/shopify/oauth';
import { currentUser } from '@/auth';
import { encrypt } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { launchHmacValid } from '@/lib/shopify/oauth-validation.mjs';
export async function GET(req) {
  const user = await currentUser(), params = new URL(req.url).searchParams;
  const popup = (await cookies()).get('jewel_shopify_popup')?.value === '1', shop = normalizeShop(params.get('shop') || '');
  const back = status => NextResponse.redirect(new URL(`/connect?shopify=${status}${popup ? '&popup=1' : ''}`, req.url));
  if (!user) return back('session');
  if (!shop) return back('invalid-shop');
  if (!process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_API_KEY) return back('not-configured');
  if (!launchHmacValid(params, process.env.SHOPIFY_API_SECRET)) return back('invalid-launch');
  const state = randomBytes(32).toString('hex');
  let target;
  try { target = authorizeUrl(shop, `${appUrl(req)}/api/shopify/callback`, state); } catch { return back('not-configured'); }
  const response = NextResponse.redirect(target);
  response.cookies.set('shopify_oauth_state', encrypt(JSON.stringify({ state, shop, owner: user.email, popup, expires: Date.now() + 600000 })), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/api/shopify',
  });
  return response;
}
