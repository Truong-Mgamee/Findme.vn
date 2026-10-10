// Fails when any enabled locale lacks keys present in en.json (source of truth).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, p ? `${p}.${k}` : k) : [p ? `${p}.${k}` : k]));
const en = flat(JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8')));
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  if (json._meta?.draft) { console.log(`skip ${f} (draft)`); continue; }
  const keys = new Set(flat(json).filter((k) => !k.startsWith('_meta')));
  const missing = en.filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !en.includes(k));
  if (missing.length || extra.length) { bad++; console.error(`${f}: missing=${missing.join(',') || '-'} extra=${extra.join(',') || '-'}`); }
  else console.log(`${f}: ok (${keys.size} keys)`);
}
process.exit(bad ? 1 : 0);
