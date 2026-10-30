// LLM draft of a UI locale from en.json with glossary context: node scripts/draft-locale.mjs ja [--max-usd 2]
// Writes messages/<locale>.json with `_meta.draft: true` (CI blocks enabling a locale that is still draft).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const locale = process.argv[2];
if (!locale) {
  console.error('usage: node scripts/draft-locale.mjs <locale> [--max-usd 2]');
  process.exit(1);
}
const maxUsd = Number(process.argv[process.argv.indexOf('--max-usd') + 1] || 2);
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'messages');
const en = JSON.parse(readFileSync(join(dir, 'en.json'), 'utf8'));
const glossaryPath = join(here, '..', '..', 'content', 'glossary.csv');
const glossary = existsSync(glossaryPath) ? readFileSync(glossaryPath, 'utf8').split('\n').slice(0, 400).join('\n') : '';
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, p ? `${p}.${k}` : k) : [[p ? `${p}.${k}` : k, v]]));
const entries = flat(en);
const client = new Anthropic();
const out = {};
let cost = 0;
for (let i = 0; i < entries.length; i += 40) {
  const batch = entries.slice(i, i + 40);
  const res = await client.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    system: `You translate app UI strings from English to locale "${locale}". Keep ICU syntax ({count, plural, ...}, {price}) intact, keep placeholders, keep lengths short (mobile buttons). Use the GLOSSARY terms for metaphysics vocabulary. Output ONLY a JSON object mapping each key to the translated string.\nGLOSSARY (csv):\n${glossary}`,
    messages: [{ role: 'user', content: JSON.stringify(Object.fromEntries(batch)) }],
    output_config: { effort: 'low' },
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  Object.assign(out, JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)));
  cost += (res.usage.input_tokens * 4 + res.usage.output_tokens * 20) / 1e6;
  if (cost > maxUsd) {
    console.error(`budget ${maxUsd} USD exceeded; stopping`);
    break;
  }
}
const nested = {};
for (const [k, v] of Object.entries(out)) {
  const parts = k.split('.');
  let cur = nested;
  for (const p of parts.slice(0, -1)) cur = cur[p] ??= {};
  cur[parts[parts.length - 1]] = v;
}
writeFileSync(join(dir, `${locale}.json`), JSON.stringify({ _meta: { draft: true, source: 'en.json', model: 'claude-opus-5-5', costUsd: Number(cost.toFixed(4)) }, ...nested }, null, 2) + '\n');
console.log(`wrote messages/${locale}.json (${Object.keys(out).length} keys, ~$${cost.toFixed(3)})`);
