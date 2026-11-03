import mammoth from 'mammoth';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph } from 'docx';
import path from 'node:path';
import { convertText, Direction } from './alphabet';

export type FileKind = 'txt' | 'docx' | 'pdf';

export async function extractText(buffer: Buffer, kind: FileKind): Promise<string> {
  if (kind === 'txt') return buffer.toString('utf8');
  if (kind === 'docx') return (await mammoth.extractRawText({ buffer })).value;
  if (kind === 'pdf') {
    // pdf-parse v1 extracts text; scanned/image-only PDFs require OCR and are not supported yet.
    // @ts-ignore
    const parse = (await import('pdf-parse')).default;
    return (await parse(buffer)).text;
  }
  throw new Error('Qo‘llab-quvvatlanmaydigan fayl turi');
}

export async function makeOutput(text: string, kind: FileKind): Promise<Buffer> {
  if (kind === 'txt') return Buffer.from(text, 'utf8');
  if (kind === 'docx') {
    const doc = new Document({
      sections: [{ children: text.split(/\r?\n/).map(line => new Paragraph(line)) }]
    });
    return Packer.toBuffer(doc);
  }
  return new Promise((resolve, reject) => {
    // Standart Helvetica Kirill va Ğ/Ş/Ç/Ö harflarini chiqara olmaydi, shuning uchun Unicode shrift ishlatiladi.
    const fontPath = path.join(process.cwd(), 'lib', 'fonts', 'DejaVuSans.ttf');
    const doc = new PDFDocument({ size: 'A4', margin: 48, font: fontPath });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.font(fontPath).fontSize(11).text(text, { width: 500, lineGap: 4 });
    doc.end();
  });
}

export async function convertFile(buffer: Buffer, kind: FileKind, direction: Direction) {
  const source = await extractText(buffer, kind);
  const converted = convertText(source, direction);
  return makeOutput(converted, kind);
}