/**
 * Load packages/content atoms (JSONL) and glossary.csv into the database.
 * `pnpm --filter @findme/api content:seed [--publish-reviewed]`
 */
import 'dotenv/config';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';
import { contentAtoms, glossary } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = join(here, '..', '..', '..', 'packages', 'content');
const atomsDir = join(contentRoot, 'atoms');
const publishReviewed = process.argv.includes('--publish-reviewed');

const app = await buildApp({ logger: false });
let inserted = 0;
let updated = 0;
if (existsSync(atomsDir)) {
  for (const tradition of readdirSync(atomsDir)) {
    const dir = join(atomsDir, tradition);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.jsonl'))) {
      for (const line of readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean)) {
        const a = JSON.parse(line) as { id?: string; tradition: string; key: string; locale: string; title: string; body_md: string; tone?: string; source_ref?: string; author?: string; reviewer?: string; status: string; version?: number };
        const version = a.version ?? 1;
        const id = a.id ?? `${a.key}@${a.locale}@v${version}`;
        const status = publishReviewed && a.status === 'reviewed' ? 'published' : a.status;
        const values = { tradition: a.tradition, key: a.key, locale: a.locale, title: a.title, bodyMd: a.body_md, tone: a.tone ?? null, sourceRef: a.source_ref ?? null, author: a.author ?? null, reviewer: a.reviewer ?? null, version, status, updatedAt: new Date() };
        const [existing] = await app.db.select({ id: contentAtoms.id }).from(contentAtoms).where(eq(contentAtoms.id, id)).limit(1);
        if (existing) {
          await app.db.update(contentAtoms).set(values).where(eq(contentAtoms.id, id));
          updated++;
        } else {
          await app.db.insert(contentAtoms).values({ id, ...values });
          inserted++;
        }
      }
    }
  }
}
let glossaryRows = 0;
const csv = join(contentRoot, 'glossary.csv');
if (existsSync(csv)) {
  const [header, ...lines] = readFileSync(csv, 'utf8').split('\n').filter(Boolean);
  const cols = (header ?? '').split(',').map((c) => c.trim());
  for (const line of lines) {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row = Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']));
    const termKey = row.term_key;
    if (!termKey) continue;
    for (const locale of ['vi', 'en', 'zh-TW', 'ja', 'ko']) {
      const term = row[locale];
      if (!term) continue;
      await app.db.insert(glossary).values({ termKey, locale, term, note: row.han ?? null }).onConflictDoUpdate({ target: [glossary.termKey, glossary.locale], set: { term, note: row.han ?? null } });
      glossaryRows++;
    }
  }
}
console.log(JSON.stringify({ inserted, updated, glossaryRows, publishReviewed }));
await app.close();
