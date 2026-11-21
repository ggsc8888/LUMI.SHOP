import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createSession, readSession, SESSION_MAX_AGE, sameOriginRequest } from '../src/lib/browser-session.mjs';
import { validShop, callbackHmacValid, launchHmacValid, requiredScopesGranted } from '../src/lib/shopify/oauth-validation.mjs';
import { trustedInstallUrl } from '../src/lib/shopify/install-url.mjs';
process.env.AUTH_SECRET = 'test-only-secret-not-for-deployment';

test('browser identities are isolated, signed, and expire', () => {
  const now = 1794859200000, a = createSession(now), b = createSession(now);
  assert.notEqual(readSession(a, now).id, readSession(b, now).id);
  assert.equal(readSession(a.slice(0, -1) + (a.endsWith('0') ? '1' : '0'), now), null);
  assert.equal(readSession(a, now + SESSION_MAX_AGE * 1000), null);
  assert.equal(readSession('demo@example.com', now), null);
});
test('state-changing APIs reject cross-site and missing origins', () => {
  const req = origin => new Request('https://jewel-lister-olive.vercel.app/api/shopify/draft', { method: 'POST', headers: origin ? { origin } : {} });
  assert.equal(sameOriginRequest(req('https://jewel-lister-olive.vercel.app')), true);
  assert.equal(sameOriginRequest(req('https://attacker.example')), false);
  assert.equal(sameOriginRequest(req()), false);
});
test('Shopify hosts are normalized without allowing attacker destinations', () => {
  assert.equal(validShop('my-store'), 'my-store.myshopify.com');
  assert.equal(validShop('https://my-store.myshopify.com/'), 'my-store.myshopify.com');
  assert.equal(validShop('https://admin.shopify.com/store/my-store/products'), 'my-store.myshopify.com');
  for (const value of ['', 'shop.myshopify.com.attacker.example', 'shop.myshopify.com@attacker.example', 'https://attacker.example', 'shop.myshopify.com/path', '//attacker.example']) assert.equal(validShop(value), null);
});
test('Shopify callbacks require authentic signatures and unique parameters', () => {
  const secret = 'shopify-test-secret', params = new URLSearchParams({ code: 'abc', shop: 'test.myshopify.com', state: 'nonce', timestamp: '1794859200' });
  const message = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('&');
  params.set('hmac', createHmac('sha256', secret).update(message).digest('hex'));
  assert.equal(callbackHmacValid(params, secret), true);
  params.set('shop', 'other.myshopify.com'); assert.equal(callbackHmacValid(params, secret), false);
  params.set('shop', 'test.myshopify.com'); params.append('code', 'another'); assert.equal(callbackHmacValid(params, secret), false);
});
test('staff must have every required Shopify permission', () => {
  assert.equal(requiredScopesGranted('write_products,write_inventory', 'read_products,write_inventory'), true);
  assert.equal(requiredScopesGranted('read_products', 'write_products'), false);
});
test('Shopify-initiated installs require a fresh, authentic signed launch', () => {
  const now = 1794859200000, secret = 'test-launch-secret';
  const params = new URLSearchParams({ shop: 'test.myshopify.com', timestamp: '1794859200', host: 'shopify-host-value' });
  const text = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('&');
  params.set('hmac', createHmac('sha256', secret).update(text).digest('hex'));
  assert.equal(launchHmacValid(params, secret, now), true);
  assert.equal(launchHmacValid(params, secret, now + 601000), false);
  assert.equal(launchHmacValid(new URLSearchParams({ shop: 'test.myshopify.com' }), secret, now), false);
  params.append('host', 'forged'); assert.equal(launchHmacValid(params, secret, now), false);
});
test('sign-in redirects only to configured Shopify-owned destinations', () => {
  assert.equal(trustedInstallUrl('https://apps.shopify.com/jewel-lister'), 'https://apps.shopify.com/jewel-lister');
  assert.equal(trustedInstallUrl('https://admin.shopify.com/store/example'), 'https://admin.shopify.com/store/example');
  for (const value of ['', 'javascript:alert(1)', 'https://apps.shopify.com.attacker.example/app', 'https://apps.shopify.com@attacker.example', 'http://apps.shopify.com/app', 'https://apps.shopify.com:8443/app']) assert.equal(trustedInstallUrl(value), null);
});
