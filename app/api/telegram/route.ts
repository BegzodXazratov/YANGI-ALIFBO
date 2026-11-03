import { NextRequest, NextResponse } from 'next/server';
import { convertText } from '@/lib/alphabet';
import { convertFile, FileKind } from '@/lib/files';
import { db } from '@/lib/supabase';
import { getFile, sendDocument, sendText } from '@/lib/telegram';

export const runtime = 'nodejs';
export const maxDuration = 60;

type TgUser = { id:number; username?:string; first_name?:string; last_name?:string };
type TgMessage = {
  message_id:number; chat:{id:number}; from?:TgUser; text?:string;
  contact?:{phone_number:string;user_id?:number;first_name?:string;last_name?:string};
  document?:{file_id:string;file_name?:string;file_size?:number};
};
type Update = { message?:TgMessage; callback_query?:{id:string;from:TgUser;data?:string;message?:TgMessage} };
type Direction = 'latin_to_cyrillic'|'cyrillic_to_latin';

async function touchUser(user:TgUser, chatId:number) {
  const client=db();
  await client.from('users').upsert({
    telegram_id:user.id, username:user.username??null,
    telegram_first_name:user.first_name??null, telegram_last_name:user.last_name??null,
    chat_id:chatId, last_seen_at:new Date().toISOString(), is_blocked:false
  },{onConflict:'telegram_id'});
  const {data}=await client.from('users').select('display_name,phone_number,registration_step,preferred_direction').eq('telegram_id',user.id).maybeSingle();
  return data;
}
async function logUsage(userId:number, kind:string, direction:string) {
  // Intentionally stores metadata only. Never pass or persist the submitted text or filename.
  await db().from('usage_events').insert({telegram_id:userId,input_type:kind,direction});
}
const directionKeyboard={keyboard:[[{text:'Lotin → Kirill'},{text:'Kirill → Lotin'}]],resize_keyboard:true};
const contactKeyboard={keyboard:[[{text:'📱 Telefon raqamni ulashish',request_contact:true}]],resize_keyboard:true,one_time_keyboard:true};

export async function POST(req:NextRequest) {
  let errorChatId:number|undefined;
  const secret=req.headers.get('x-telegram-bot-api-secret-token');
  if(!process.env.TELEGRAM_WEBHOOK_SECRET||secret!==process.env.TELEGRAM_WEBHOOK_SECRET) return NextResponse.json({error:'forbidden'},{status:403});
  try {
    const update=await req.json() as Update;
    const message=update.message??update.callback_query?.message;
    const user=update.message?.from??update.callback_query?.from;
    if(!message||!user) return NextResponse.json({ok:true});
    const chatId=message.chat.id; errorChatId=chatId;
    const profile=await touchUser(user,chatId);
    const text=update.message?.text?.trim();

    if(text==='/start') {
      if(!profile?.display_name) {
        await db().from('users').update({registration_step:'name'}).eq('telegram_id',user.id);
        await sendText(chatId,'Assalomu alaykum! Botdan foydalanish uchun ro‘yxatdan o‘tamiz.\n\nIsm-familiyangizni kiriting:');
      } else if(!profile?.phone_number) {
        await db().from('users').update({registration_step:'phone'}).eq('telegram_id',user.id);
        await sendText(chatId,'Ro‘yxatdan o‘tishni yakunlash uchun telefon raqamingizni ulashing.',{reply_markup:contactKeyboard});
      } else {
        await sendText(chatId,'Assalomu alaykum! Kerakli konvertatsiya yo‘nalishini tanlang:',{reply_markup:directionKeyboard});
      }
      return NextResponse.json({ok:true});
    }

    if(update.message?.contact) {
      const contact=update.message.contact;
      if(contact.user_id!==user.id) {
        await sendText(chatId,'Iltimos, faqat o‘zingizning telefon raqamingizni ulashing.',{reply_markup:contactKeyboard});
        return NextResponse.json({ok:true});
      }
      await db().from('users').update({phone_number:contact.phone_number,registration_step:null}).eq('telegram_id',user.id);
      await sendText(chatId,'Ro‘yxatdan o‘tish yakunlandi. Endi konvertatsiya yo‘nalishini tanlang:',{reply_markup:directionKeyboard});
      return NextResponse.json({ok:true});
    }

    if(profile?.registration_step==='name' && text && !text.startsWith('/')) {
      if(text.length>100) { await sendText(chatId,'Ism-familiya 100 belgidan oshmasin. Qayta kiriting:'); return NextResponse.json({ok:true}); }
      await db().from('users').update({display_name:text,registration_step:'phone'}).eq('telegram_id',user.id);
      await sendText(chatId,'Rahmat! Endi telefon raqamingizni ulashing.',{reply_markup:contactKeyboard});
      return NextResponse.json({ok:true});
    }

    if(text==='/privacy') {
      await sendText(chatId,'Maxfiylik: yuborgan matnlaringiz va fayllaringiz bazada saqlanmaydi. Faqat ro‘yxatdan o‘tish uchun ism, telefon raqami, Telegram ID hamda foydalanish statistikasi (vaqt, format va konvertatsiya yo‘nalishi) saqlanadi. Admin yuborgan matnlaringizni ko‘ra olmaydi.');
      return NextResponse.json({ok:true});
    }

    if(!profile?.display_name || !profile?.phone_number) {
      if(!profile?.display_name) {
        await db().from('users').update({registration_step:'name'}).eq('telegram_id',user.id);
        await sendText(chatId,'Avval ro‘yxatdan o‘tamiz. Ism-familiyangizni kiriting:');
      } else {
        await db().from('users').update({registration_step:'phone'}).eq('telegram_id',user.id);
        await sendText(chatId,'Telefon raqamingizni ulashing:',{reply_markup:contactKeyboard});
      }
      return NextResponse.json({ok:true});
    }

    if(text==='Lotin → Kirill'||text==='Kirill → Lotin') {
      const direction:Direction=text==='Lotin → Kirill'?'latin_to_cyrillic':'cyrillic_to_latin';
      await db().from('users').update({preferred_direction:direction}).eq('telegram_id',user.id);
      await sendText(chatId,'Tanlandi: '+text+'. Endi matn yuboring yoki TXT, DOCX, PDF fayl yuklang.\n\n/maxfiylik: ma’lumotlar haqida',{reply_markup:directionKeyboard});
      return NextResponse.json({ok:true});
    }

    const {data:current}=await db().from('users').select('preferred_direction').eq('telegram_id',user.id).single();
    const direction=current?.preferred_direction as Direction|undefined;
    if(!direction) { await sendText(chatId,'Avval konvertatsiya yo‘nalishini tanlang.',{reply_markup:directionKeyboard}); return NextResponse.json({ok:true}); }

    if(text) {
      const result=convertText(text,direction);
      if(result.length>4000) { await sendText(chatId,'Matn juda uzun. Iltimos, TXT fayl sifatida yuboring.'); return NextResponse.json({ok:true}); }
      await sendText(chatId,result);
      await logUsage(user.id,'text',direction);
    } else if(update.message?.document) {
      const doc=update.message.document;
      const name=doc.file_name??'document.txt';
      const ext=name.split('.').pop()?.toLowerCase();
      if(!['txt','docx','pdf'].includes(ext??'')) { await sendText(chatId,'Faqat TXT, DOCX va PDF fayllar qabul qilinadi.'); return NextResponse.json({ok:true}); }
      const {buffer}=await getFile(doc.file_id);
      const output=await convertFile(buffer,ext as FileKind,direction);
      const outputName=`converted.${ext}`; // Do not retain or log the user's original filename.
      await sendDocument(chatId,outputName,output,'Tayyor! Konvertatsiya yakunlandi. Asl fayl saqlanmadi.');
      await logUsage(user.id,ext!,direction);
    } else {
      await sendText(chatId,'Matn yuboring yoki TXT, DOCX, PDF fayl yuklang.');
    }
    return NextResponse.json({ok:true});
  } catch(error) {
    console.error('Telegram webhook error:',error);
    if(errorChatId) await sendText(errorChatId,error instanceof Error?error.message:'Xatolik yuz berdi.').catch(()=>{});
    return NextResponse.json({ok:true});
  }
}
