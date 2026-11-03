const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
export async function tg(method: string, body: unknown) {
  const response = await fetch(`${API()}/${method}`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body) });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}
export async function getFile(fileId: string) {
  const result = await tg('getFile', { file_id: fileId });
  const response = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${result.file_path}`);
  if (!response.ok) throw new Error('Could not download Telegram file');
  const buffer = Buffer.from(await response.arrayBuffer());
  const max = Number(process.env.MAX_FILE_SIZE || 15 * 1024 * 1024);
  if (buffer.length > max) throw new Error(`Fayl hajmi limitdan katta. Maksimum: ${Math.round(max/1024/1024)} MB`);
  return { buffer, path: result.file_path as string };
}
export async function sendDocument(chatId: number, filename: string, buffer: Buffer, caption?: string) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption);
  form.append('document', new Blob([new Uint8Array(buffer)]), filename);
  const response = await fetch(`${API()}/sendDocument`, { method: 'POST', body: form });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Telegram sendDocument failed');
  return data.result;
}
export async function sendText(chatId: number, text: string, extra: Record<string,unknown> = {}) {
  return tg('sendMessage', { chat_id: chatId, text, ...extra });
}
