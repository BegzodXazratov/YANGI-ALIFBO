import { NextRequest, NextResponse } from 'next/server';
import { convertText, Direction } from '@/lib/alphabet';
import { convertFile, FileKind } from '@/lib/files';
import { db } from '@/lib/supabase';
import { answerCallback, checkSubscription, CHANNEL_URL, getFile, sendDocument, sendText } from '@/lib/telegram';
import { BACK, HELP, SUB_ERROR, SUB_NOT_YET, SUB_REQUIRED, SUB_THANKS, WELCOME } from '@/lib/texts';

export const runtime = 'nodejs';
export const maxDuration = 60;

type TgUser = { id:number; username?:string; first_name?:string; last_name?:string };
type TgMessage = {
  message_id:number; chat:{id:number}; from?:TgUser; text?:string;
  contact?:{phone_number:string;user_id?:number;first_name?:string;last_name?:string};
  document?:{file_id:string;file_name?:string;file_size?:number};
};
type Update = { message?:TgMessage; callback_query?:{id:string;from:TgUser;data?:string;message?:TgMessage} };
const DIRECTIONS: Record<string, Direction> = {
  'Lotin → Kirill':'latin_to_cyrillic','Kirill → Lotin':'cyrillic_to_latin',
  'Lotin → Yangi':'latin_to_new','Yangi → Lotin':'new_to_latin',
  'Kirill → Yangi':'cyrillic_to_new','Yangi → Kirill':'new_to_cyrillic'
};

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
const directionKeyboard={keyboard:[[{text:'Lotin → Kirill'},{text:'Kirill → Lotin'}],[{text:'Lotin → Yangi'},{text:'Yangi → Lotin'}],[{text:'Kirill → Yangi'},{text:'Yangi → Kirill'}]],resize_keyboard:true};
const contactKeyboard={keyboard:[[{text:'📱 Telefon raqamni ulashish',request_contact:true}]],resize_keyboard:true,one_time_keyboard:true};

export async function POST(req:NextRequest) {
  let errorChatId:number|undefined;
  
  // DIQQAT: Vercel'da secret token o'rnatilmaganligi sababli himoya vaqtincha olib tashlandi.
  // const secret=req.headers.get('x-telegram-bot-api-secret-token');
  // if(!process.env.TELEGRAM_WEBHOOK_SECRET||secret!==process.env.TELEGRAM_WEBHOOK_SECRET) return NextResponse.json({error:'forbidden'},{status:403});
  
  try {
    const update=await req.json() as Update;
    const message=update.message??update.callback_query?.message;
    const user=update.message?.from??update.callback_query?.from;
    if(!message||!user) return NextResponse.json({ok:true});
    const chatId=message.chat.id; errorChatId=chatId;
    const profile=await touchUser(user,chatId);
    const cb=update.callback_query;

    // Majburiy obuna: HAR bir so'rovda tekshiriladi (obuna bo'lib keyin chiqib ketsa ham bot ishlamaydi)
    const sub=await checkSubscription(user.id);
    if(!sub.ok) {
      if(cb) await answerCallback(cb.id, sub.error?SUB_ERROR:SUB_NOT_YET, true);
      else if(sub.error) await sendText(chatId,SUB_ERROR);
      else await sendText(chatId,SUB_REQUIRED,{reply_markup:{inline_keyboard:[[{text:'📢 Kanalga obuna bo‘lish',url:CHANNEL_URL}],[{text:'✅ Obunani tekshirish',callback_data:'check_sub'}]]}});
      return NextResponse.json({ok:true});
    }
    if(cb) await answerCallback(cb.id, cb.data==='check_sub'?SUB_THANKS:undefined);

    // “Obunani tekshirish” bosilgach bot /start kabi ishga tushadi
    const text=update.message?.text?.trim() ?? (cb?.data==='check_sub'?'/start':undefined);

    if(text==='/start') {
      if(!profile?.display_name) {
        await db().from('users').update({registration_step:'name'}).eq('telegram_id',user.id);
        await sendText(chatId,WELCOME);
        await sendText(chatId,'Ism-familiyangizni kiriting:');
      } else if(!profile?.phone_number) {
        await db().from('users').update({registration_step:'phone'}).eq('telegram_id',user.id);
        await sendText(chatId,'Ro‘yxatdan o‘tishni yakunlash uchun telefon raqamingizni ulashing.',{reply_markup:contactKeyboard});
      } else {
        await sendText(chatId,BACK,{reply_markup:directionKeyboard});
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

    if(text==='/yordam'||text==='/help') {
      await sendText(chatId,HELP,{reply_markup:directionKeyboard});
      return NextResponse.json({ok:true});
    }

    if(text==='/privacy'||text==='/maxfiylik') {
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

    if(text&&DIRECTIONS[text]) {
      const direction:Direction=DIRECTIONS[text];
      await db().from('users').update({preferred_direction:direction}).eq('telegram_id',user.id);
      await sendText(chatId,'Tanlandi: '+text+'. Endi matn yuboring yoki TXT, DOCX, PDF fayl yuklang.\n\nLotin, Kirill va Yangi (takomillashtirilgan) alifbo o‘rtasida istalgan yo‘nalishni tanlashingiz mumkin.\n/maxfiylik: ma’lumotlar haqida',{reply_markup:directionKeyboard});
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