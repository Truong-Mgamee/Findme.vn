import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY_LOCALES, GlossaryRowSchema, type GlossaryLocale, type GlossaryRow } from './schema.js';
import { CONTENT_ROOT } from './store.js';

/** Minimal RFC-4180 parser (quoted fields, doubled quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((f) => f !== '')) rows.push(row);
  }
  return rows;
}

export function parseGlossaryCsv(text: string): GlossaryRow[] {
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header) return [];
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`glossary.csv: missing column ${name}`);
    return i;
  };
  const cols = { term_key: idx('term_key'), han: idx('han'), vi: idx('vi'), en: idx('en'), 'zh-TW': idx('zh-TW'), ja: idx('ja'), ko: idx('ko') };
  const seen = new Set<string>();
  return rows.slice(1).map((r, n) => {
    const obj = Object.fromEntries(Object.entries(cols).map(([k, i]) => [k, (r[i] ?? '').trim()]));
    const parsed = GlossaryRowSchema.safeParse(obj);
    if (!parsed.success) throw new Error(`glossary.csv row ${n + 2}: ${parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`);
    if (seen.has(parsed.data.term_key)) throw new Error(`glossary.csv row ${n + 2}: duplicate term_key ${parsed.data.term_key}`);
    seen.add(parsed.data.term_key);
    return parsed.data;
  });
}

export type Glossary = Record<GlossaryLocale, Record<string, string>>;

let cache: { path: string; rows: GlossaryRow[] } | null = null;

export function loadGlossaryRows(root = CONTENT_ROOT): GlossaryRow[] {
  const path = join(root, 'glossary.csv');
  if (cache && cache.path === path) return cache.rows;
  if (!existsSync(path)) return [];
  const rows = parseGlossaryCsv(readFileSync(path, 'utf8'));
  cache = { path, rows };
  return rows;
}

/** `{ vi: { 'star.ziweiMaj': 'Tử Vi', … }, en: {…}, … }` */
export function loadGlossary(root = CONTENT_ROOT): Glossary {
  const g = Object.fromEntries(GLOSSARY_LOCALES.map((l) => [l, {} as Record<string, string>])) as Glossary;
  for (const r of loadGlossaryRows(root)) for (const l of GLOSSARY_LOCALES) g[l][r.term_key] = r[l];
  return g;
}

/** Terms for one locale; unknown locales fall back to English. */
export function glossaryFor(locale: string, root = CONTENT_ROOT): Record<string, string> {
  const g = loadGlossary(root);
  const l = (GLOSSARY_LOCALES as readonly string[]).includes(locale) ? (locale as GlossaryLocale) : 'en';
  return g[l];
}

/** Han + localized label for a term key, e.g. "紫微 (Tử Vi)". */
export function termLabel(termKey: string, locale: string, root = CONTENT_ROOT): string | undefined {
  const row = loadGlossaryRows(root).find((r) => r.term_key === termKey);
  if (!row) return undefined;
  const l = (GLOSSARY_LOCALES as readonly string[]).includes(locale) ? (locale as GlossaryLocale) : 'en';
  return row.han && row.han !== row[l] ? `${row[l]} (${row.han})` : row[l];
}
