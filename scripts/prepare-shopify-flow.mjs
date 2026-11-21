import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/components/Studio.jsx';
let source = readFileSync(file, 'utf8');
const marker = 'async function onShots(list)';
const hook = `useEffect(()=>{let active=true;const refresh=()=>fetch('/api/shopify/status',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(active)setShop(j.connected?j.shop:null)}).catch(()=>{});const message=e=>{if(e.origin===location.origin&&e.data?.type==='jewel:shopify-connected')refresh()};window.addEventListener('focus',refresh);window.addEventListener('message',message);return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('message',message)}},[]);`;
if (!source.includes('jewel:shopify-connected')) {
  if (!source.includes(marker)) throw new Error('Studio source changed; review the Shopify connection patch.');
  source = source.replace(marker, hook + marker);
  source = 'import { openShopifyConnect } from "./ShopifyConnectButton";\n' + source;
  source = source.replace('import { openShopifyConnect } from "./ShopifyConnectButton";\n"use client";', '"use client";import { openShopifyConnect } from "./ShopifyConnectButton";');
  source = source.replace(/<Link href="\/settings"([^>]*)>([\s\S]*?)<\/Link>/g, (whole, attrs, label) => /connect|shopify/i.test(label) ? `<Link href="/connect?popup=1" onClick={openShopifyConnect}${attrs}>${label}</Link>` : whole);
  writeFileSync(file, source);
}
console.log('Shopify sign-in flow prepared.');
