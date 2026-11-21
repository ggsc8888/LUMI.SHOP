'use client';
import { useEffect, useState } from 'react';
import { openShopifyConnect } from './ShopifyConnectButton';

export function ShopifySignInCard({ popup = false, result = null, compact = false }) {
  const [connection, setConnection] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch('/api/shopify/status', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(s => {
      if (!active) return;
      setConnection(s);
      if (popup && s.connected) window.opener?.postMessage({ type: 'jewel:shopify-connected' }, window.location.origin);
    }).catch(() => { if (active) setError('Could not check Shopify. Please reload this page.'); });
    const message = e => { if (e.origin === window.location.origin && e.data?.type === 'jewel:shopify-connected') refresh(); };
    refresh(); window.addEventListener('focus', refresh); window.addEventListener('message', message);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('message', message); };
  }, [popup]);
  async function disconnect() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/shopify/disconnect', { method: 'POST' });
      if (!r.ok) throw new Error();
      setConnection(s => ({ ...s, connected: false, shop: null, drafts: [] }));
      window.dispatchEvent(new Event('focus'));
    } catch { setError('Could not disconnect Shopify. Please try again.'); }
    finally { setBusy(false); }
  }
  const notices = {
    'not-configured': 'Shopify sign-in is not available yet. You can continue preparing your listing.',
    'setup-required': 'Shopify sign-in is not available yet. You can continue preparing your listing.',
    'invalid-shop': 'Please start sign-in from Shopify and choose your store there.',
    'invalid-launch': 'Please start a new Shopify sign-in to connect your store.',
    'state-mismatch': 'This sign-in request expired. Please try again.',
    'bad-signature': 'We could not verify the Shopify response. Please try again.',
    cancelled: 'Shopify sign-in was cancelled.',
    error: 'We could not connect your store. Please try again.',
  };
  const connected = connection?.connected;
  return <section aria-labelledby="shopify-signin-title" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink/5 sm:p-7">
    <div className="flex items-center justify-between gap-3">
      <h2 id="shopify-signin-title" className="font-display text-2xl">Shopify</h2>
      <span className={`rounded-full px-3 py-1 text-xs ${connected ? 'bg-emerald-50 text-emerald-800' : 'bg-ink/5 text-ink/60'}`}>{connected ? 'Connected' : 'Not signed in'}</span>
    </div>
    <p className="mb-5 mt-3 text-sm leading-relaxed text-ink/65">{connected ? `Connected to ${connection.shop}. Your listings go to this store.` : 'Sign in to Shopify to choose your store and send your jewelry listings to it.'}</p>
    {(error || notices[result]) && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error || notices[result]}</p>}
    {connected ? <div className="flex flex-wrap items-center gap-3">
      <a href="/studio" onClick={e => { if (popup && window.opener) { e.preventDefault(); window.opener.focus(); window.close(); } }} className="rounded-full bg-[#176343] px-5 py-3 text-sm font-medium text-white">Back to your listing</a>
      <button type="button" disabled={busy} onClick={disconnect} className="rounded-full px-5 py-3 text-sm ring-1 ring-ink/15 disabled:opacity-50">{busy ? 'Disconnecting…' : 'Disconnect Shopify'}</button>
    </div> : <>
      <a href={`/api/shopify/login${popup ? '?popup=1' : ''}`} onClick={popup ? undefined : openShopifyConnect}
        className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#176343] px-6 py-3 text-sm font-medium text-white hover:bg-[#104d33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176343]">
        <svg aria-hidden="true" width="19" height="20" viewBox="0 0 20 22" fill="none"><path d="M3 6h14l1 14H2L3 6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M6.5 7V5a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        Sign in to Shopify
      </a>
      <p className="mt-3 text-xs leading-relaxed text-ink/50">You’ll choose your store and approve access on Shopify.</p>
    </>}
    {connected && !compact && connection.drafts?.length > 0 && <div className="mt-5 border-t border-ink/10 pt-4">
      <h3 className="mb-2 text-sm font-medium">Recent Shopify drafts</h3>
      <ul className="space-y-2 text-sm">{connection.drafts.map(d => <li key={d.adminUrl}><a href={d.adminUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">{d.title}</a></li>)}</ul>
    </div>}
  </section>;
}
