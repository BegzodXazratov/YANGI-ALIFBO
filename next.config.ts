import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfkit'],
  // PDF uchun Unicode shrift Vercel funksiyasiga qo'shilsin
  outputFileTracingIncludes: { '/api/telegram': ['./lib/fonts/**'] },
};
export default nextConfig;
