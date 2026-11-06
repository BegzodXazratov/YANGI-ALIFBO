import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Maxfiylik siyosati — Yangi Alifbo bot', description: 'Yangi Alifbo bot qanday ma\'lumotlarni qayta ishlashi haqida' };
const H = { marginTop: 28, fontSize: 20 } as const;
export default function Privacy() {
  return (
    <main className="wrap" style={{ maxWidth: 760, lineHeight: 1.65 }}>
      <h1>Maxfiylik siyosati</h1>
      <p className="muted">Yangi Alifbo bot (@yangi_alifbo_converter_bot) · oxirgi yangilanish: 2026-yil 4-noyabr</p>
      <p>Bu bot Lotin, Kirill va yangi o‘zbek alifbosi o‘rtasida matn va fayllarni o‘giradi. Quyida u qanday ma’lumotlarni qayta ishlashi yozilgan.</p>

      <h2 style={H}>Siz yuborgan matn va fayllar</h2>
      <p>Konvertatsiya uchun yuborgan matn, TXT, DOCX va PDF fayllaringiz faqat o‘girish vaqtida qayta ishlanadi va natija sizga qaytarilgandan keyin <b>saqlanmaydi</b>. Matn mazmuni, fayl nomi va fayl ichidagi ma’lumotlar bazaga yozilmaydi.</p>

      <h2 style={H}>Biz saqlaydigan ma’lumotlar</h2>
      <p>Botdan foydalanish va hisobni yuritish uchun quyidagilar saqlanadi:</p>
      <ul>
        <li>Telegram ID, foydalanuvchi nomi (username), Telegram profilidagi ism va familiya;</li>
        <li>ro‘yxatdan o‘tishda o‘zingiz kiritgan ism;</li>
        <li>tanlagan o‘girish yo‘nalishingiz (masalan, Lotin → Kirill);</li>
        <li>qo‘llanish statistikasi: o‘girish vaqti, yo‘nalishi va turi (matn/TXT/DOCX/PDF). Bu yozuvlarda matn mazmuni yo‘q.</li>
      </ul>

      <h2 style={H}>Nima uchun ishlatiladi</h2>
      <ul>
        <li>botni ishlatish va sizning sozlamangizni eslab qolish;</li>
        <li>bot ishini yaxshilash uchun umumiy statistikani yuritish;</li>
        <li>bot haqida muhim xabarlar yuborish (e’lon).</li>
      </ul>
      <p>Ma’lumotlaringiz sotilmaydi va reklama maqsadida uchinchi tomonlarga berilmaydi.</p>

      <h2 style={H}>Saqlash va himoya</h2>
      <p>Ma’lumotlar himoyalangan bulut ma’lumotlar bazasida saqlanadi va faqat bot administratori ko‘ra oladi. Bot Telegram platformasi orqali ishlaydi, shuning uchun Telegram’ning o‘z maxfiylik qoidalari ham amal qiladi.</p>

      <h2 style={H}>Ma’lumotlarni o‘chirish</h2>
      <p>Ma’lumotlaringizni ko‘rish yoki o‘chirishni xohlasangiz, administratorga yozing, so‘rovingiz ko‘rib chiqiladi va ma’lumotlaringiz bazadan o‘chiriladi.</p>

      <h2 style={H}>Aloqa</h2>
      <p>Savollar uchun: <a href="https://t.me/Xazratov_Begzod" style={{ color: 'var(--accent)' }}>@Xazratov_Begzod</a></p>
    </main>
  );
}
