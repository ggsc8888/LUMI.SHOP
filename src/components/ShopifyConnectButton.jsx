'use client';
import { useEffect, useState } from 'react';
export function openShopifyConnect(event) {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  const popup = window.open('/api/shopify/login?popup=1', 'jewel-shopify-connect', 'popup,width=560,height=740');
  if (popup) { event?.preventDefault(); popup.focus(); }
}
export function ShopifyConnectButton() {
  const [shop, setShop] = useState(null);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch('/api/shopify/status', { cache: 'no-store' }).then(r => r.json()).then(s => { if (active) setShop(s.connected ? s.shop : null); }).catch(() => {});
    const message = event => { if (event.origin === window.location.origin && event.data?.type === 'jewel:shopify-connected') refresh(); };
    refresh(); window.addEventListener('focus', refresh); window.addEventListener('message', message);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('message', message); };
  }, []);
  return <a href={shop ? '/settings' : '/api/shopify/login?popup=1'} onClick={shop ? undefined : openShopifyConnect} title={shop || 'Sign in to Shopify to connect your store'}
    className="ml-1 rounded-full bg-[#176343] px-3 py-2 text-sm font-medium text-white hover:bg-[#104d33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176343]">
    {shop ? 'Shopify connected' : 'Sign in to Shopify'}
  </a>;
}
