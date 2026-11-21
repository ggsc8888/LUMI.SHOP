import { redirect } from 'next/navigation';
export default async function Home({ searchParams }) {
  const params = await searchParams;
  if (params.shop) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
    redirect('/api/shopify/install?' + query.toString());
  }
  redirect('/studio');
}
