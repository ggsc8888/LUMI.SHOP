import 'server-only';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from '../crypto';
import { normalizeShop, shopifyCreds, SHOPIFY_SCOPES } from './config';
import { callbackHmacValid, requiredScopesGranted } from './oauth-validation.mjs';
const CONNECTION_COOKIE = 'jewel_shopify_connection';
export function authorizeUrl(shop, redirectUri, state) {
  const normalized = normalizeShop(shop);
  if (!normalized) throw new Error('Invalid Shopify store.');
  const { key } = shopifyCreds(), url = new URL(`https://${normalized}/admin/oauth/authorize`);
  for (const [k, v] of Object.entries({ client_id: key, scope: SHOPIFY_SCOPES, redirect_uri: redirectUri, state, 'grant_options[]': 'per-user' })) url.searchParams.set(k, v);
  return url.toString();
}
export function verifyHmac(params) { return callbackHmacValid(params, shopifyCreds().secret); }
export async function exchangeCode(shop, code) {
  const normalized = normalizeShop(shop);
  if (!normalized) throw new Error('Invalid Shopify store.');
  const { key, secret } = shopifyCreds();
  const response = await fetch(`https://${normalized}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ client_id: key, client_secret: secret, code }), cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Shopify authorization failed.');
  const token = await response.json();
  if (!token.access_token || !token.associated_user?.id || !requiredScopesGranted(token.associated_user_scope || token.scope || '', SHOPIFY_SCOPES)) throw new Error('Your Shopify account does not have the required product permissions.');
  return token;
}
export async function saveConnection(owner, shop, token, scope, expiresIn = 86400, staffId) {
  const maxAge = Math.min(86400, Math.floor(Number(expiresIn)));
  if (!normalizeShop(shop) || !token || !Number.isFinite(maxAge) || maxAge <= 0) throw new Error('Invalid Shopify authorization.');
  const value = encrypt(JSON.stringify({ owner, shop, token, scope, staffId, expiresAt: Date.now() + maxAge * 1000 }));
  if (value.length > 3500) throw new Error('Shopify session could not be saved.');
  (await cookies()).set(CONNECTION_COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge });
}
export async function getConnection(owner) {
  const value = (await cookies()).get(CONNECTION_COOKIE)?.value;
  if (!value) return null;
  try {
    const c = JSON.parse(decrypt(value));
    return c.owner === owner && c.expiresAt > Date.now() && normalizeShop(c.shop) === c.shop && typeof c.token === 'string' ? c : null;
  } catch { return null; }
}
export async function deleteConnection() { (await cookies()).delete(CONNECTION_COOKIE); }
