import { NextResponse } from 'next/server';
function retired() { return NextResponse.json({ error: 'No app sign-in is required. Connect Shopify at /connect.' }, { status: 410 }); }
export const GET = retired;
export const POST = retired;
