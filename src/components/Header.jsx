import Link from 'next/link';
import { MainNav } from './MainNav';
import { ShopifyConnectButton } from './ShopifyConnectButton';
export function Header({ active }) {
  return <header className="no-print sticky top-0 z-40 border-b border-ink/5 bg-paper/85 pt-[env(safe-area-inset-top)] backdrop-blur">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
      <Link href="/studio" className="font-display text-lg tracking-tight">Jewel<span className="text-gold">·</span>Lister</Link>
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
        <MainNav active={active} />
        <ShopifyConnectButton />
      </nav>
    </div>
  </header>;
}
