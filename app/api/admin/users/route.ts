import { NextRequest, NextResponse } from 'next/server';
import { authorized, unauthorized } from '@/lib/admin';
import { db } from '@/lib/supabase';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ro'yxatdan o'tgan foydalanuvchilar. Yuborilgan matn va fayllar bazada saqlanmaydi, shuning uchun bu yerda ham yo'q.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauthorized();
  const client = db();
  const { data: users, error } = await client
    .from('users')
    .select('telegram_id,username,display_name,telegram_first_name,telegram_last_name,phone_number,registration_step,preferred_direction,is_blocked,created_at,last_seen_at')
    .order('last_seen_at', { ascending: false })
    .limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error: e2 } = await client.from('usage_events').select('telegram_id').range(from, from + 999);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    for (const r of data ?? []) counts[String(r.telegram_id)] = (counts[String(r.telegram_id)] ?? 0) + 1;
    if (!data || data.length < 1000) break;
  }
  return NextResponse.json({
    users: (users ?? []).map(u => ({ ...u, conversions: counts[String(u.telegram_id)] ?? 0 })),
  });
}
