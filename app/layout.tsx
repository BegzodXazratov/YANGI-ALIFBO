import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Alifbo Bot Admin',description:'Alifbo konvertor bot boshqaruv paneli'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="uz"><body>{children}</body></html>; }
