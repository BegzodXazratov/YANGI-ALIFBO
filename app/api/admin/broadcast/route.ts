import { NextRequest, NextResponse } from 'next/server';
import { authorized, unauthorized } from '@/lib/admin';
import { db } from '@/lib/supabase';
import { sendText } from '@/lib/telegram';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(req:NextRequest) {
  if (!authorized(req)) return unauthorized();
  const body = await req.json().catch(()=>({}));
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) return NextResponse.json({error:'Xabar 1–4000 belgi bo‘lishi kerak.'},{status:400});
  const {data:users,error} = await db().from('users').select('telegram_id').eq('is_blocked',false);
  if(error) return NextResponse.json({error:error.message},{status:500});
  let sent=0, failed=0;
  for (const user of users??[]) {
    try { await sendText(user.telegram_id,message); sent++; }
    catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : '';
      if (/blocked|deactivated|chat not found/i.test(msg)) await db().from('users').update({is_blocked:true}).eq('telegram_id',user.telegram_id);
    }
  }
  return NextResponse.json({sent,failed,total:users?.length??0});
}
