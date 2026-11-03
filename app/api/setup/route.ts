import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { COMMANDS, DESCRIPTION, SHORT_DESCRIPTION } from '@/lib/texts';

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

    // Bot profili: tavsifi, qisqa tavsifi va buyruqlar menyusi
    const res = (r: { ok: boolean; description?: string }) => (r.ok ? 'ok' : r.description);
    out.profile = {
      description: res(await call('setMyDescription', { description: DESCRIPTION })),
      shortDescription: res(await call('setMyShortDescription', { short_description: SHORT_DESCRIPTION })),
      commands: res(await call('setMyCommands', { commands: COMMANDS })),
    };

    // Profil rasmi: faqat /api/setup?photo=1 bilan (Telegram rasm almashtirishni cheklaydi)
    if (req.nextUrl.searchParams.get('photo') === '1') {
      const img = await fetch(`https://${req.headers.get('host')}/bot-logo.png`);
      if (!img.ok) {
        out.profilePhoto = `bot-logo.png topilmadi (${img.status})`;
      } else {
        const form = new FormData();
        form.append('photo', JSON.stringify({ type: 'static', photo: 'attach://logo' }));
        form.append('logo', new Blob([new Uint8Array(await img.arrayBuffer())], { type: 'image/png' }), 'logo.png');
        const r = await (await fetch(`${api}/setMyProfilePhoto`, { method: 'POST', body: form })).json();
        out.profilePhoto = r.ok ? 'ok' : r.description;
      }
    }
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
