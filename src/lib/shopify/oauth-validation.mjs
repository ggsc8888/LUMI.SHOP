import { createHmac, timingSafeEqual } from 'node:crypto';
export { validShop } from './shop-domain.mjs';
export function callbackHmacValid(params, secret, required = ['shop', 'code', 'state', 'timestamp', 'hmac']) {
  const hmac = params.get('hmac');
  if (!hmac || !/^[a-f0-9]{64}$/.test(hmac)) return false;
  if (required.some(k => params.getAll(k).length !== 1)) return false;
  if ([...new Set(params.keys())].some(k => params.getAll(k).length !== 1)) return false;
  const message = [...params.entries()].filter(([k]) => k !== 'hmac' && k !== 'signature').sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${v}`).join('&');
  return timingSafeEqual(createHmac('sha256', secret).update(message).digest(), Buffer.from(hmac, 'hex'));
}
export function launchHmacValid(params, secret, now = Date.now()) {
  const timestamp = Number(params.get('timestamp'));
  return Number.isFinite(timestamp) && Math.abs(now / 1000 - timestamp) <= 600 && callbackHmacValid(params, secret, ['shop', 'timestamp', 'hmac']);
}
export function requiredScopesGranted(granted, required) {
  const scopes = new Set(granted.split(',').map(s => s.trim()));
  return required.split(',').map(s => s.trim()).filter(Boolean).every(scope => scopes.has(scope) || (scope.startsWith('read_') && scopes.has(`write_${scope.slice(5)}`)));
}
