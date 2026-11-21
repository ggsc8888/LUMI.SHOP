import 'server-only';
export { validShop as normalizeShop } from './oauth-validation.mjs';
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10';
export const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'write_products,write_inventory,read_locations,write_files';
export function shopifyCreds() {
  const key = process.env.SHOPIFY_API_KEY, secret = process.env.SHOPIFY_API_SECRET;
  if (!key || !secret) throw new Error('Shopify connection is not configured yet.');
  return { key, secret };
}
export function appUrl(req) { return process.env.APP_URL?.replace(/\/$/, '') || (req ? new URL(req.url).origin : 'http://localhost:3000'); }
