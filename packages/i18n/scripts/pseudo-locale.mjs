// Generates messages/en-XA.json: accented, ~35% longer strings to catch truncation/overflow in UI QA.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages');
const map = { a: 'å', e: 'ë', i: 'ï', o: 'ø', u: 'ü', c: 'ç', n: 'ñ', y: 'ÿ', A: 'Å', E: 'Ë', I: 'Ï', O: 'Ø', U: 'Ü' };
const pseudo = (s) => {
  // keep ICU placeholders/plurals intact
  const parts = s.split(/(\{[^}]*\}|#)/);
  const out = parts.map((p, i) => (i % 2 === 1 ? p : [...p].map((ch) => map[ch] ?? ch).join(''))).join('');
  const pad = Math.ceil(s.replace(/\{[^}]*\}/g, '').length * 0.35);
  return `[${out}${' ·'.repeat(Math.ceil(pad / 2))}]`;
};
const walk = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? pseudo(v) : walk(v)]));
const en = JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8'));
writeFileSync(join(dir, 'en-XA.json'), JSON.stringify({ _meta: { draft: true, pseudo: true, generatedFrom: 'en.json' }, ...walk(en) }, null, 2) + '\n');
console.log('wrote messages/en-XA.json');
