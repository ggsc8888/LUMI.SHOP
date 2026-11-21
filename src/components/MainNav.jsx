'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
// Settings only appears once the seller has signed in to Shopify.
export function MainNav({ active }) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = () => fetch('/api/shopify/status', { cache: 'no-store' }).then(r => r.json()).then(s => { if (alive) setConnected(!!s.connected); }).catch(() => {});
    const message = e => { if (e.origin === window.location.origin && e.data?.type === 'jewel:shopify-connected') refresh(); };
    refresh(); window.addEventListener('focus', refresh); window.addEventListener('message', message);
    return () => { alive = false; window.removeEventListener('focus', refresh); window.removeEventListener('message', message); };
  }, []);
  const links = [['/studio', 'Studio', 'studio'], ...(connected ? [['/settings', 'Settings', 'settings']] : [])];
  return <>{links.map(([href, label, key]) =>
    <Link key={key} href={href} aria-current={active === key ? 'page' : undefined} className={`rounded-full px-3 py-2 text-sm ${active === key ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}>{label}</Link>)}</>;
}
