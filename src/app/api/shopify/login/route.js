import { NextResponse } from 'next/server';
import { trustedInstallUrl } from '@/lib/shopify/install-url.mjs';
export async function GET(req) {
  const popup = new URL(req.url).searchParams.get('popup') === '1';
  const target = trustedInstallUrl(process.env.SHOPIFY_INSTALL_URL);
  if (!target || !process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    return NextResponse.redirect(new URL(`/connect?shopify=setup-required${popup ? '&popup=1' : ''}`, req.url));
  }
  const response = NextResponse.redirect(target);
  response.cookies.set('jewel_shopify_popup', popup ? '1' : '0', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/shopify', maxAge: 600 });
  return response;
}
