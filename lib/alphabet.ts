/**
 * Mapping transcribed from the user's second alphabet chart.
 * Important: both H and X map to Cyrillic Х in that chart, so the mapping
 * is lossy. Reverse conversion uses Х -> X as the deterministic default.
 */
const pairs: Array<[string, string]> = [
  ['A','А'], ['B','Б'], ['C','Ч'], ['D','Д'], ['E','Э'], ['F','Ф'],
  ['G','Г'], ['Ğ','Ғ'], ['H','Х'], ['I','И'], ['J','Ж'], ['K','К'],
  ['L','Л'], ['M','М'], ['N','Н'], ['O','О'], ['Ö','Ў'], ['P','П'],
  ['Q','Қ'], ['R','Р'], ['S','С'], ['Ş','Ш'], ['T','Т'], ['U','У'],
  ['V','В'], ['X','Х'], ['Y','Й'], ['Z','З'], ['NG','НГ'], ["'",'Ъ']
];

const upperToCyr = new Map(pairs);
const lowerToCyr = new Map(pairs.map(([a,b]) => [a.toLocaleLowerCase('uz'), b.toLocaleLowerCase('uz')]));
const cyrToLatin = new Map<string,string>();
for (const [latin,cyr] of pairs) {
  if (!cyrToLatin.has(cyr)) cyrToLatin.set(cyr, latin);
  if (!cyrToLatin.has(cyr.toLocaleLowerCase('uz'))) cyrToLatin.set(cyr.toLocaleLowerCase('uz'), latin.toLocaleLowerCase('uz'));
}
// The table contains H -> Х and X -> Х. Prefer X on reverse conversion.
cyrToLatin.set('Х','X');
cyrToLatin.set('х','x');

function isUpper(value: string) { return value === value.toLocaleUpperCase('uz') && value !== value.toLocaleLowerCase('uz'); }
function applyCase(value: string, source: string) {
  if (source === source.toLocaleUpperCase('uz')) return value.toLocaleUpperCase('uz');
  if (source[0] && isUpper(source[0])) return value[0].toLocaleUpperCase('uz') + value.slice(1);
  return value;
}

export function latinToCyrillic(input: string): string {
  // Longest tokens first so NG is handled before N and G.
  const tokens = [...pairs].sort((a,b) => b[0].length - a[0].length);
  let out = '';
  for (let i=0; i<input.length;) {
    let matched = false;
    for (const [latin,cyr] of tokens) {
      const part = input.slice(i, i + latin.length);
      if (part.toLocaleUpperCase('uz') === latin) {
        out += applyCase(cyr, part);
        i += latin.length;
        matched = true;
        break;
      }
    }
    if (!matched) { out += input[i]; i++; }
  }
  return out;
}

export function cyrillicToLatin(input: string): string {
  let out = '';
  for (const char of input) out += cyrToLatin.get(char) ?? char;
  return out;
}

export function convertText(input: string, direction: 'latin_to_cyrillic'|'cyrillic_to_latin') {
  return direction === 'latin_to_cyrillic' ? latinToCyrillic(input) : cyrillicToLatin(input);
}
