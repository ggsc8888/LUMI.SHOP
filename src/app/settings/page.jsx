import { redirect } from 'next/navigation';
import { currentUser } from '@/auth';
import { Header } from '@/components/Header';
import { SettingsClient } from '@/components/SettingsClient';
import { SettingsGate } from '@/components/SettingsGate';
import { getConnection } from '@/lib/shopify/oauth';
export const metadata = { title: 'Settings · Jewel Lister' };
export const dynamic = 'force-dynamic';
export default async function SettingsPage({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect('/');
  const { shopify } = await searchParams;
  const connection = await getConnection(user.email).catch(() => null);
  return <>
    <Header active="settings" />
    {connection ? <SettingsClient shopifyStatus={shopify ?? null} /> : <SettingsGate />}
  </>;
}
