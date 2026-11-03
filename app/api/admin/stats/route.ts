import { NextRequest, NextResponse } from 'next/server';
import { authorized, unauthorized } from '@/lib/admin';
import { db } from '@/lib/supabase';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauthorized();
  const client = db();
  const since24 = new Date(Date.now()-86400000).toISOString();
  const since7 = new Date(Date.now()-7*86400000).toISOString();
  const since30 = new Date(Date.now()-30*86400000).toISOString();
  const [users,active24,active7,active30,logs,blocked] = await Promise.all([
    client.from('users').select('*',{count:'exact',head:true}),
    client.from('users').select('*',{count:'exact',head:true}).gte('last_seen_at',since24),
    client.from('users').select('*',{count:'exact',head:true}).gte('last_seen_at',since7),
    client.from('users').select('*',{count:'exact',head:true}).gte('last_seen_at',since30),
    client.from('usage_events').select('id,input_type,direction,created_at',{count:'exact'}).gte('created_at',since30).order('created_at',{ascending:false}).limit(500),
    client.from('users').select('*',{count:'exact',head:true}).eq('is_blocked',true)
  ]);
  if (users.error || logs.error) return NextResponse.json({error:users.error?.message ?? logs.error?.message},{status:500});
  const rows = logs.data ?? [];
  const byDirection = rows.reduce((a,r)=>{a[r.direction]=(a[r.direction]??0)+1;return a;},{} as Record<string,number>);
  const byType = rows.reduce((a,r)=>{a[r.input_type]=(a[r.input_type]??0)+1;return a;},{} as Record<string,number>);
  return NextResponse.json({totalUsers:users.count??0,active24:active24.count??0,active7:active7.count??0,active30:active30.count??0,blocked:blocked.count??0,conversions30:logs.count??0,byDirection,byType,latest:rows.slice(0,12)});
}
