import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@/auth';
import { normalizeShop } from '@/lib/shopify/config';
import { exchangeCode, saveConnection, verifyHmac } from '@/lib/shopify/oauth';
import { decrypt } from '@/lib/crypto';
export async function GET(req) {
  const params = new URL(req.url).searchParams, jar = await cookies(), user = await currentUser();
  let saved;
  try { saved = JSON.parse(decrypt(jar.get('shopify_oauth_state')?.value || '')); } catch { saved = null; }
  const back = status => {
    const response = NextResponse.redirect(new URL(`/connect?shopify=${status}${saved?.popup ? '&popup=1' : ''}`, req.url));
    response.cookies.delete({ name: 'shopify_oauth_state', path: '/api/shopify' });
    return response;
  };
  const shop = normalizeShop(params.get('shop') || ''), code = params.get('code'), state = params.get('state');
  if (!user || !saved || saved.owner !== user.email || saved.expires <= Date.now() || saved.state !== state || saved.shop !== shop) return back('state-mismatch');
  if (params.get('error')) return back('cancelled');
  if (!shop || !code || !state) return back('error');
  try {
    if (!verifyHmac(params)) return back('bad-signature');
    const timestamp = Number(params.get('timestamp'));
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 600) return back('state-mismatch');
    const result = await exchangeCode(shop, code);
    await saveConnection(user.email, shop, result.access_token, result.associated_user_scope || result.scope, result.expires_in, result.associated_user.id);
    return back('connected');
  } catch { return back('error'); }
}
