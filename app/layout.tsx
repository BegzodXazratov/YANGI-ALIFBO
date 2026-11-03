import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Alifbo Bot Admin',description:'Alifbo konvertor bot boshqaruv paneli'};
// Sahifa chizilishidan oldin tema o'rnatiladi (yonib ketmasligi uchun): saqlangan tanlov, bo'lmasa qurilma sozlamasi.
const themeScript=`try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`;
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="uz" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>;
}
