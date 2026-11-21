'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShopifySignInCard } from './ShopifySignInCard';
// Shown on /settings before the seller has signed in to Shopify: only the sign-in step.
export function SettingsGate() {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    const check = () => fetch('/api/shopify/status', { cache: 'no-store' }).then(r => r.json()).then(s => { if (alive && s.connected) router.refresh(); }).catch(() => {});
    const message = e => { if (e.origin === window.location.origin && e.data?.type === 'jewel:shopify-connected') check(); };
    window.addEventListener('focus', check); window.addEventListener('message', message);
    return () => { alive = false; window.removeEventListener('focus', check); window.removeEventListener('message', message); };
  }, [router]);
  return <div className="mx-auto max-w-xl space-y-5 px-4 pb-24 pt-6">
    <h1 className="font-display text-3xl">Sign in to Shopify</h1>
    <p className="-mt-3 text-sm text-ink/60">Sign in to Shopify to open your settings — store connection, AI tools and listing defaults.</p>
    <ShopifySignInCard />
  </div>;
}
