// Bot matnlari (hammasi bir joyda). Oddiy matn: Markdown/HTML belgilari ishlatilmaydi.

export const ABOUT = `Men Alifbo Converter — o‘zbek yozuvlari o‘rtasida matn va fayllarni o‘giraman:

🔤 Lotin  (O‘zbekiston, Toshkent)
🔠 Kirill  (Ўзбекистон, Тошкент)
✨ Yangi alifbo  (Özbekiston, Toşkent: Ğ, Ö, Ş, Ç)

Istalgan yo‘nalish ishlaydi: Lotin ↔ Kirill ↔ Yangi.`;

export const HOW = `Qanday foydalaniladi:
1️⃣ Pastdagi tugmalardan yo‘nalishni tanlang (masalan: Lotin → Kirill).
2️⃣ Matn yuboring yoki TXT, DOCX, PDF fayl yuklang (15 MB gacha).
3️⃣ Natijani shu zahoti olasiz. Fayl o‘sha formatda qaytadi.

Yo‘nalishni o‘zgartirish uchun tugmani qayta bosing.
Buyruqlar: /yordam — yordam, /maxfiylik — ma’lumotlar haqida.`;

export const WELCOME = `Assalomu alaykum! 👋\n\n${ABOUT}\n\nAvval qisqa ro‘yxatdan o‘tamiz.`;
export const HELP = `${ABOUT}\n\n${HOW}`;
export const BACK = `Assalomu alaykum! 👋\n\n${HOW}`;

// BotFather bo'limlari: setMyDescription (<=512), setMyShortDescription (<=120)
export const DESCRIPTION = `Lotin, Kirill va yangi o‘zbek alifbosi (Ğ, Ö, Ş, Ç) o‘rtasida matn va fayllarni o‘giradi.

• Matn yuboring yoki TXT, DOCX, PDF yuklang
• 6 ta yo‘nalish: Lotin ↔ Kirill ↔ Yangi
• Fayl o‘sha formatda qaytadi
• Yuborganlaringiz saqlanmaydi

Boshlash uchun START ni bosing.`;
export const SHORT_DESCRIPTION = 'Lotin, Kirill va yangi o‘zbek alifbosi o‘rtasida matn va fayllarni o‘giruvchi bot.';

export const COMMANDS = [
  { command: 'start', description: 'Botni boshlash' },
  { command: 'yordam', description: 'Bot nima qiladi va qanday ishlatiladi' },
  { command: 'maxfiylik', description: 'Ma’lumotlar qanday saqlanishi' },
];

export const SUB_REQUIRED = `Botdan foydalanish uchun rasmiy kanalimizga obuna bo‘ling 👇\n\nObuna bo‘lgach, “Obunani tekshirish” tugmasini bosing.`;
export const SUB_ERROR = `Hozir obunani tekshirib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.`;
export const SUB_THANKS = 'Rahmat! Obuna tasdiqlandi ✅';
export const SUB_NOT_YET = 'Siz hali kanalga obuna bo‘lmadingiz.';
