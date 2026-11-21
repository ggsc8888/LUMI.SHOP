export function validShop(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim().toLowerCase();
  if (/^(https:\/\/)?admin\.shopify\.com\/store\/[a-z0-9-]+(?:\/.*)?$/.test(s)) s = s.match(/\/store\/([a-z0-9-]+)/)[1];
  else s = s.replace(/^https:\/\//, '').replace(/\/$/, '');
  if (/^[a-z0-9][a-z0-9-]*$/.test(s)) s += '.myshopify.com';
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s) ? s : null;
}
