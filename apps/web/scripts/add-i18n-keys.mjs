// One-off helper used while building apps/web: splices a `web` namespace into packages/i18n/messages/{en,vi}.json
// without reformatting the existing hand-written blocks. Safe to re-run (replaces the existing `web` block).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'i18n', 'messages');
const [, , file] = process.argv;
const web = JSON.parse(readFileSync(file, 'utf8'));
for (const locale of ['en', 'vi']) {
  const p = join(dir, `${locale}.json`);
  const json = JSON.parse(readFileSync(p, 'utf8'));
  delete json.web;
  let text = JSON.stringify(json, null, 2);
  // keep the original file formatting for untouched blocks
  const original = readFileSync(p, 'utf8');
  const stripped = original.replace(/,\n  "web": \{[\s\S]*\n  \}\n\}\s*$/, '\n}\n');
  text = stripped.trimEnd().replace(/\}\s*$/, '');
  const block = JSON.stringify(web[locale], null, 2)
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n');
  writeFileSync(p, `${text.trimEnd()},\n  "web": ${block.trimStart()}\n}\n`);
  console.log(`${locale}.json: web namespace written`);
}
