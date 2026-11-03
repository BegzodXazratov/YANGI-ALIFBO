import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
export function authorized(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  const supplied = req.headers.get('x-admin-password') ?? '';
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
export function unauthorized() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
