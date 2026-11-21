'use client';
import Link from 'next/link';
import { ShopifySignInCard } from './ShopifySignInCard';
export function ShopifyConnect({ status, popup }) {
  function back(event) { if (popup && window.opener) { event.preventDefault(); window.opener.focus(); window.close(); } }
  return <main className="mx-auto max-w-lg px-5 py-12">
    <h1 className="mb-6 font-display text-3xl">Sign in to Shopify</h1>
    <ShopifySignInCard result={status} popup={popup} compact />
    <Link href="/studio" onClick={back} className="mt-6 block text-center text-sm text-ink/60 underline underline-offset-4">Back to your listing</Link>
  </main>;
}
