import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export const runtime = 'nodejs';

// Diagnostika + webhookni o'rnatish: brauzerda /api/setup ni oching.
// Faqat shu saytning o'z manziliga webhook o'rnatadi, tokenni hech qachon ko'rsatmaydi.
export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const out: Record<string, unknown> = {
    env: {
      TELEGRAM_BOT_TOKEN: !!token,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    },
  };
  if (!token) return NextResponse.json({ ...out, error: 'TELEGRAM_BOT_TOKEN yo‘q' }, { status: 500 });

  const api = `https://api.telegram.org/bot${token}`;
  const call = async (method: string, body?: unknown) =>
    (await fetch(`${api}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })).json();

  try {
    const me = await call('getMe');
    out.bot = me.ok ? { username: me.result.username } : { error: me.description };
    if (!me.ok) return NextResponse.json({ ...out, error: 'Token noto‘g‘ri (getMe ishlamadi)' }, { status: 500 });

    out.webhookBefore = (await call('getWebhookInfo')).result;

    const url = `https://${req.headers.get('host')}/api/telegram`;
    const set = await call('setWebhook', { url, allowed_updates: ['message', 'callback_query'], drop_pending_updates: false });
    out.setWebhook = set.ok ? { ok: true, url } : { ok: false, error: set.description };
    out.webhookAfter = (await call('getWebhookInfo')).result;
  } catch (e) {
    out.telegramError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { error, count } = await db().from('users').select('telegram_id', { count: 'exact', head: true });
    out.database = error ? { ok: false, error: error.message } : { ok: true, users: count };
  } catch (e) {
    out.database = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return NextResponse.json(out);
}
