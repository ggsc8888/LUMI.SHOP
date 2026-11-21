import { Header } from '@/components/Header';
import { ShopifyConnect } from '@/components/ShopifyConnect';
export const metadata = { title: 'Connect Shopify · Jewel Lister' };
export default async function ConnectPage({ searchParams }) {
  const params = await searchParams;
  return <><Header /><ShopifyConnect status={params.shopify || null} popup={params.popup === '1'} /></>;
}
