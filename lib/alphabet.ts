/**
 * Uch yozuv: Lotin (hozirgi), Kirill va Yangi (takomillashtirilgan) o'zbek alifbosi.
 *
 * Yangi alifbo: Gʻ→Ğ, Oʻ→Ö, Sh→Ş, Ch→Ç, tutuq belgisi ʼ. Qolgan harflar Lotin bilan bir xil.
 * Kirill ↔ Yangi o'tish Lotin orqali amalga oshiriladi.
 */
export type Direction =
  | 'latin_to_cyrillic' | 'cyrillic_to_latin'
  | 'latin_to_new' | 'new_to_latin'
  | 'cyrillic_to_new' | 'new_to_cyrillic';

export const DIRECTION_LABELS: Record<Direction, string> = {
  latin_to_cyrillic: 'Lotin → Kirill',
  cyrillic_to_latin: 'Kirill → Lotin',
  latin_to_new: 'Lotin → Yangi',
  new_to_latin: 'Yangi → Lotin',
  cyrillic_to_new: 'Kirill → Yangi',
  new_to_cyrillic: 'Yangi → Kirill',
};

const OKINA = 'ʻ'; // ʻ  (oʻ, gʻ)
const TUTUQ = 'ʼ'; // ʼ  (tutuq belgisi)

const isApos = (c?: string) => !!c && "'`‘’ʻʼ´′".includes(c);
const isLetter = (c?: string) => !!c && /\p{L}/u.test(c);
const isUpper = (c?: string) => !!c && c !== c.toLowerCase() && c === c.toUpperCase();
const up = (s: string, upper: boolean) => (upper ? s.toUpperCase() : s);
/** Ko'p harfli natija: bosh harf katta; atrofdagi harf ham katta bo'lsa — hammasi katta. */
function multi(s: string, src: string, prev?: string, next?: string) {
  if (!isUpper(src)) return s;
  if (isUpper(prev) || isUpper(next)) return s.toUpperCase();
  return s[0].toUpperCase() + s.slice(1);
}

const L2C: Record<string, string> = {
  a: 'а', b: 'б', c: 'ц', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у',
  v: 'в', x: 'х', y: 'й', z: 'з',
};

export function latinToCyrillic(input: string): string {
  const s = [...input];
  let out = '';
  for (let i = 0; i < s.length; ) {
    const c = s[i], lc = c.toLowerCase(), n = s[i + 1], ln = n?.toLowerCase();
    const upper = isUpper(c);
    const prev = s[i - 1];
    // oʻ, gʻ
    if ((lc === 'o' || lc === 'g') && isApos(n)) {
      out += up(lc === 'o' ? 'ў' : 'ғ', upper); i += 2; continue;
    }
    if (lc === 's' && ln === 'h') { out += up('ш', upper); i += 2; continue; }
    if (lc === 'c' && ln === 'h') { out += up('ч', upper); i += 2; continue; }
    if (lc === 'y' && ln && 'auoe'.includes(ln)) {
      const after = s[i + 2];
      const wordStart = !isLetter(prev) && !isApos(prev);
      if (ln === 'o' && isApos(after)) { out += up('й', upper); i++; continue; } // yoʻl → йўл
      if (ln === 'e' && !wordStart) { out += up('й', upper); i++; continue; }
      const m = { a: 'я', u: 'ю', o: 'ё', e: 'е' }[ln as 'a' | 'u' | 'o' | 'e'];
      out += up(m, upper); i += 2; continue;
    }
    if (lc === 'e') {
      const wordStart = !isLetter(prev) && !isApos(prev);
      out += up(wordStart ? 'э' : 'е', upper); i++; continue;
    }
    if (isApos(c)) {
      out += isLetter(prev) && isLetter(n) ? 'ъ' : c; i++; continue;
    }
    // yangi alifbo harflari Lotin matnida uchrasa ham to'g'ri o'tsin
    const alt: Record<string, string> = { 'ö': 'ў', 'ğ': 'ғ', 'ş': 'ш', 'ç': 'ч' };
    if (alt[lc]) { out += up(alt[lc], upper); i++; continue; }
    out += L2C[lc] !== undefined ? up(L2C[lc], upper) : c;
    i++;
  }
  return out;
}

const C2L: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ы: 'i', э: 'e', ю: 'yu',
  я: 'ya', ў: 'o' + OKINA, қ: 'q', ғ: 'g' + OKINA, ҳ: 'h',
};
const CYR_VOWELS = 'аеёиоуўэюяы';

export function cyrillicToLatin(input: string): string {
  const s = [...input];
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], lc = c.toLowerCase(), prev = s[i - 1], next = s[i + 1];
    if (lc === 'ь') continue;
    if (lc === 'ъ') { out += isLetter(prev) && isLetter(next) ? TUTUQ : c; continue; }
    if (lc === 'е') {
      const p = prev?.toLowerCase();
      const ye = !isLetter(prev) || CYR_VOWELS.includes(p!) || p === 'ъ' || p === 'ь';
      out += multi(ye ? 'ye' : 'e', c, prev, next); continue;
    }
    const m = C2L[lc];
    if (m === undefined) { out += c; continue; }
    out += m.length > 1 ? multi(m, c, prev, next) : up(m, isUpper(c));
  }
  return out;
}

export function latinToNew(input: string): string {
  const s = [...input];
  let out = '';
  for (let i = 0; i < s.length; ) {
    const c = s[i], lc = c.toLowerCase(), n = s[i + 1], ln = n?.toLowerCase(), prev = s[i - 1];
    const upper = isUpper(c);
    if ((lc === 'o' || lc === 'g') && isApos(n)) { out += up(lc === 'o' ? 'ö' : 'ğ', upper); i += 2; continue; }
    if (lc === 's' && ln === 'h') { out += up('ş', upper); i += 2; continue; }
    if (lc === 'c' && ln === 'h') { out += up('ç', upper); i += 2; continue; }
    if (isApos(c)) { out += isLetter(prev) && isLetter(n) ? TUTUQ : c; i++; continue; }
    out += c; i++;
  }
  return out;
}

export function newToLatin(input: string): string {
  const s = [...input];
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], lc = c.toLowerCase(), prev = s[i - 1], next = s[i + 1];
    if (lc === 'ö') out += up('o', isUpper(c)) + OKINA;
    else if (lc === 'ğ') out += up('g', isUpper(c)) + OKINA;
    else if (lc === 'ş') out += multi('sh', c, prev, next);
    else if (lc === 'ç') out += multi('ch', c, prev, next);
    else out += c;
  }
  return out;
}

export function convertText(input: string, direction: Direction): string {
  switch (direction) {
    case 'latin_to_cyrillic': return latinToCyrillic(input);
    case 'cyrillic_to_latin': return cyrillicToLatin(input);
    case 'latin_to_new': return latinToNew(input);
    case 'new_to_latin': return newToLatin(input);
    case 'cyrillic_to_new': return latinToNew(cyrillicToLatin(input));
    case 'new_to_cyrillic': return latinToCyrillic(newToLatin(input));
  }
}
