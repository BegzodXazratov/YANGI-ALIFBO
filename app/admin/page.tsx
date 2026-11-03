'use client';
import {useEffect,useMemo,useState} from 'react';

type Stats={totalUsers:number;active24:number;active7:number;active30:number;blocked:number;conversions30:number;byDirection:Record<string,number>;byType:Record<string,number>;latest:Array<{id:number;input_type:string;direction:string;created_at:string}>};
type User={telegram_id:number;username:string|null;display_name:string|null;telegram_first_name:string|null;telegram_last_name:string|null;phone_number:string|null;registration_step:string|null;preferred_direction:string|null;is_blocked:boolean;created_at:string;last_seen_at:string;conversions:number};
type Tab='overview'|'users'|'broadcast';

const DIR_LABEL:Record<string,string>={latin_to_cyrillic:'Lotin → Kirill',cyrillic_to_latin:'Kirill → Lotin',latin_to_new:'Lotin → Yangi',new_to_latin:'Yangi → Lotin',cyrillic_to_new:'Kirill → Yangi',new_to_cyrillic:'Yangi → Kirill'};
const fmt=new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Tashkent',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const date=(s:string)=>fmt.format(new Date(s));
function ago(s:string){const m=Math.floor((Date.now()-new Date(s).getTime())/60000);if(m<1)return 'hozirgina';if(m<60)return m+' daq. oldin';const h=Math.floor(m/60);if(h<24)return h+' soat oldin';return Math.floor(h/24)+' kun oldin'}
const nameOf=(u:User)=>u.display_name||[u.telegram_first_name,u.telegram_last_name].filter(Boolean).join(' ')||'—';

export default function AdminPage(){
 const [password,setPassword]=useState('');const [saved,setSaved]=useState(false);
 const [stats,setStats]=useState<Stats|null>(null);const [users,setUsers]=useState<User[]|null>(null);
 const [tab,setTab]=useState<Tab>('overview');const [message,setMessage]=useState('');
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [theme,setTheme]=useState<'light'|'dark'>('light');
 const [q,setQ]=useState('');const [filter,setFilter]=useState<'all'|'active24'|'registered'|'unfinished'|'blocked'>('all');

 useEffect(()=>{
  const t=document.documentElement.dataset.theme==='dark'?'dark':'light';setTheme(t);
  const p=sessionStorage.getItem('admin_password');if(p){setPassword(p);setSaved(true);load(p)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 function toggleTheme(){const t=theme==='dark'?'light':'dark';setTheme(t);document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch{}}

 async function load(p=password){
  setBusy(true);setNotice('');
  try{
   const headers={'x-admin-password':p};
   const [s,u]=await Promise.all([fetch('/api/admin/stats',{headers}),fetch('/api/admin/users',{headers})]);
   if(!s.ok)throw new Error('Parol noto‘g‘ri yoki server sozlanmagan');
   setStats(await s.json());
   if(u.ok)setUsers((await u.json()).users);
   sessionStorage.setItem('admin_password',p);setSaved(true);
  }catch(e){setNotice(e instanceof Error?e.message:'Xatolik');setSaved(false)}finally{setBusy(false)}
 }
 async function broadcast(){
  setBusy(true);setNotice('Xabar yuborilmoqda. Ko‘p foydalanuvchida bu jarayon vaqt limitiga yetishi mumkin.');
  try{
   const r=await fetch('/api/admin/broadcast',{method:'POST',headers:{'content-type':'application/json','x-admin-password':password},body:JSON.stringify({message})});
   const d=await r.json();if(!r.ok)throw new Error(d.error);
   setNotice(`Yakunlandi: ${d.sent} ta yuborildi, ${d.failed} ta xato, jami ${d.total} ta.`);setMessage('');
  }catch(e){setNotice(e instanceof Error?e.message:'Xatolik')}finally{setBusy(false)}
 }

 const shown=useMemo(()=>{
  if(!users)return [];
  const needle=q.trim().toLowerCase().replace(/^@/,'');
  const day=Date.now()-86400000;
  return users.filter(u=>{
   if(filter==='active24'&&new Date(u.last_seen_at).getTime()<day)return false;
   if(filter==='registered'&&!(u.display_name&&u.phone_number))return false;
   if(filter==='unfinished'&&(u.display_name&&u.phone_number))return false;
   if(filter==='blocked'&&!u.is_blocked)return false;
   if(!needle)return true;
   return [nameOf(u),u.username,u.phone_number,String(u.telegram_id)].some(v=>v&&v.toLowerCase().includes(needle));
  });
 },[users,q,filter]);

 function exportCsv(){
  const esc=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;
  const rows=[['Ism','Telefon','Username','Telegram ID','Ro‘yxatdan o‘tgan','Oxirgi faollik','Yo‘nalish','Konvertatsiya','Holat'],
   ...shown.map(u=>[nameOf(u),u.phone_number,u.username?'@'+u.username:'',u.telegram_id,date(u.created_at),date(u.last_seen_at),u.preferred_direction?DIR_LABEL[u.preferred_direction]??u.preferred_direction:'',u.conversions,u.is_blocked?'Bloklagan':'Faol'])];
  const blob=new Blob(['﻿'+rows.map(r=>r.map(esc).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='foydalanuvchilar.csv';a.click();URL.revokeObjectURL(a.href);
 }

 const metric=(label:string,value:number)=> <div className="card"><div className="muted">{label}</div><div className="metric">{value.toLocaleString('uz-UZ')}</div></div>;

 return <main className="wrap">
  <header className="top"><div><h1 style={{margin:'0 0 6px'}}>Alifbo Bot</h1><div className="muted">Boshqaruv paneli</div></div>
   <div className="actions">
    <button className="secondary" onClick={toggleTheme} title="Kun / tun rejimi" aria-label="Kun / tun rejimi">{theme==='dark'?'☀️ Kun':'🌙 Tun'}</button>
    {saved&&<button className="secondary" onClick={()=>{sessionStorage.removeItem('admin_password');setSaved(false);setPassword('');setStats(null);setUsers(null)}}>Chiqish</button>}
   </div></header>

  {!saved&&<section className="card" style={{maxWidth:420}}><h2>Admin kirish</h2>
   <form onSubmit={e=>{e.preventDefault();load()}}>
    <input className="field" type="password" placeholder="Admin paroli" value={password} onChange={e=>setPassword(e.target.value)}/>
    <button className="primary" style={{marginTop:12}} disabled={busy||!password}>Kirish</button>
   </form></section>}

  {notice&&<p className={notice.includes('Yakunlandi')?'success':'error'}>{notice}</p>}

  {saved&&<><nav className="tabs">
   <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Statistika</button>
   <button className={tab==='users'?'active':''} onClick={()=>setTab('users')}>Foydalanuvchilar{users?` (${users.length})`:''}</button>
   <button className={tab==='broadcast'?'active':''} onClick={()=>setTab('broadcast')}>Xabar yuborish</button>
   <button className="secondary" onClick={()=>load()} disabled={busy}>Yangilash</button></nav>

   {tab==='overview'&&stats&&<><div className="grid">{metric('Jami foydalanuvchilar',stats.totalUsers)}{metric('24 soat faol',stats.active24)}{metric('7 kun faol',stats.active7)}{metric('30 kun faol',stats.active30)}{metric('Botni bloklaganlar',stats.blocked)}{metric('30 kunlik konvertatsiya',stats.conversions30)}</div>
    <div className="grid panel"><div className="card"><h3>Yo‘nalishlar</h3>{Object.keys(stats.byDirection).length?Object.entries(stats.byDirection).map(([k,v])=><p key={k}>{DIR_LABEL[k]??k}: <b>{v}</b></p>):<p className="muted">Hali yo‘q</p>}</div>
     <div className="card"><h3>Fayl turlari</h3>{Object.keys(stats.byType).length?Object.entries(stats.byType).map(([k,v])=><p key={k}>{k}: <b>{v}</b></p>):<p className="muted">Hali yo‘q</p>}</div></div></>}

   {tab==='users'&&<section className="card">
    <div className="toolbar">
     <input className="field" placeholder="Qidirish: ism, telefon, @username, ID" value={q} onChange={e=>setQ(e.target.value)}/>
     <select className="field" style={{maxWidth:220}} value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
      <option value="all">Hammasi</option><option value="active24">24 soatda faol</option><option value="registered">Ro‘yxatdan o‘tgan</option><option value="unfinished">Ro‘yxatni tugatmagan</option><option value="blocked">Botni bloklagan</option>
     </select>
     <button className="secondary" onClick={exportCsv} disabled={!shown.length}>CSV yuklab olish</button>
     <span className="muted">{shown.length} ta</span>
    </div>
    {!users?<p className="muted">Yuklanmoqda…</p>:!shown.length?<p className="muted">Foydalanuvchi topilmadi.</p>:
    <div className="tablewrap"><table className="table"><thead><tr><th>#</th><th>Ism</th><th>Telefon</th><th>Username</th><th>Ro‘yxatdan</th><th>Oxirgi faollik</th><th>Yo‘nalish</th><th>Konv.</th><th>Holat</th></tr></thead><tbody>
     {shown.map((u,i)=><tr key={u.telegram_id}>
      <td className="muted">{i+1}</td><td><b>{nameOf(u)}</b><div className="muted" style={{fontSize:12}}>ID {u.telegram_id}</div></td>
      <td>{u.phone_number??<span className="muted">—</span>}</td>
      <td>{u.username?<a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a>:<span className="muted">—</span>}</td>
      <td>{date(u.created_at)}</td><td>{date(u.last_seen_at)}<div className="muted" style={{fontSize:12}}>{ago(u.last_seen_at)}</div></td>
      <td>{u.preferred_direction?<span className="chip">{DIR_LABEL[u.preferred_direction]??u.preferred_direction}</span>:<span className="muted">—</span>}</td>
      <td><b>{u.conversions}</b></td>
      <td>{u.is_blocked?<span className="chip bad">Bloklagan</span>:u.display_name&&u.phone_number?<span className="chip good">Faol</span>:<span className="chip">Ro‘yxatda emas</span>}</td>
     </tr>)}
    </tbody></table></div>}
    <p className="muted" style={{marginTop:14,fontSize:13}}>Yuborilgan matn va fayllar saqlanmaydi, bu yerda faqat ro‘yxatdan o‘tish ma’lumotlari va statistika ko‘rinadi.</p>
   </section>}

   {tab==='broadcast'&&<section className="card panel"><h2>Ommaviy xabar</h2><p className="muted">Xabar bloklamagan barcha foydalanuvchilarga yuboriladi.</p><textarea className="field" rows={6} maxLength={4000} placeholder="Xabar matni..." value={message} onChange={e=>setMessage(e.target.value)}/><p className="muted">{message.length}/4000</p><button className="primary" disabled={busy||!message.trim()} onClick={()=>{if(confirm('Xabar barcha foydalanuvchilarga yuborilsinmi?'))broadcast()}}>Yuborish</button></section>}
  </>}
 </main>
}
