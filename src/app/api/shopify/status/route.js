import { NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api';
import { getConnection } from '@/lib/shopify/oauth';
import { recentDrafts } from '@/lib/shopify/draft';
export async function GET() {
  try {
    const user = await requireUser(), c = await getConnection(user.email);
    return NextResponse.json({ connected: !!c, shop: c?.shop ?? null, scope: c?.scope ?? null,
      configured: !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET),
      drafts: c ? await recentDrafts(user.email).catch(() => []) : [],
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return errorResponse(error); }
}
