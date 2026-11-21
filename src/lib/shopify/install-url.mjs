export function trustedInstallUrl(input) {
  if (!input) return null;
  try {
    const url = new URL(input);
    const host = url.hostname;
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (host !== 'apps.shopify.com' && host !== 'admin.shopify.com' && !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(host)) return null;
    return url.toString();
  } catch { return null; }
}
