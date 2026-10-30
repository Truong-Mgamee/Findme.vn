import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AtomSchema, TRADITIONS, type Atom, type AtomStatus, type Tradition } from './schema.js';
import { generateKeyManifest, type KeyManifest } from './keys.js';

/** packages/content root (where atoms/, tone/, glossary.csv live). */
export const CONTENT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export interface StoreOptions {
  /** content root; defaults to the package directory. Tests point this at a temp dir. */
  root?: string;
}

export const atomsFile = (tradition: Tradition, locale: string, root = CONTENT_ROOT) => join(root, 'atoms', tradition, `${locale}.jsonl`);

/** Parse one JSONL file; throws with line number on invalid atoms. */
export function readAtomsFile(path: string): Atom[] {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, 'utf8').split('\n');
  const out: Atom[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const r = AtomSchema.safeParse(JSON.parse(t));
    if (!r.success) throw new Error(`${path}:${i + 1}: ${r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`);
    out.push(r.data);
  });
  return out;
}

export function writeAtomsFile(path: string, atoms: Atom[]): void {
  mkdirSync(dirname(path), { recursive: true });
  const sorted = [...atoms].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.version - b.version));
  writeFileSync(path, sorted.map((a) => JSON.stringify(AtomSchema.parse(a))).join('\n') + (sorted.length ? '\n' : ''), 'utf8');
}

export interface LoadFilter extends StoreOptions {
  tradition?: Tradition;
  locale?: string;
  status?: AtomStatus | AtomStatus[];
}

/** Locales present on disk for a tradition. */
export function localesOnDisk(tradition: Tradition, root = CONTENT_ROOT): string[] {
  const dir = join(root, 'atoms', tradition);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => f.replace(/\.jsonl$/, '')).sort();
}

export function loadAtoms(filter: LoadFilter = {}): Atom[] {
  const root = filter.root ?? CONTENT_ROOT;
  const traditions = filter.tradition ? [filter.tradition] : [...TRADITIONS];
  const statuses = filter.status ? (Array.isArray(filter.status) ? filter.status : [filter.status]) : null;
  const out: Atom[] = [];
  for (const t of traditions) {
    const locales = filter.locale ? [filter.locale] : localesOnDisk(t, root);
    for (const l of locales) for (const a of readAtomsFile(atomsFile(t, l, root))) if (!statuses || statuses.includes(a.status)) out.push(a);
  }
  return out;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  files: string[];
}

/**
 * Upsert by key+locale: an incoming atom replaces the stored one when its version is >= the stored
 * version (same version = in-place edit). Lower versions are skipped. Files are rewritten sorted by key.
 */
export function upsertAtoms(atoms: Atom[], opts: StoreOptions = {}): UpsertResult {
  const root = opts.root ?? CONTENT_ROOT;
  const groups = new Map<string, Atom[]>();
  for (const a of atoms) {
    const parsed = AtomSchema.parse(a);
    const k = `${parsed.tradition}/${parsed.locale}`;
    groups.set(k, [...(groups.get(k) ?? []), parsed]);
  }
  const res: UpsertResult = { inserted: 0, updated: 0, skipped: 0, files: [] };
  for (const [gk, list] of groups) {
    const [tradition, locale] = gk.split('/') as [Tradition, string];
    const path = atomsFile(tradition, locale, root);
    const byKey = new Map(readAtomsFile(path).map((a) => [a.key, a]));
    for (const a of list) {
      const prev = byKey.get(a.key);
      if (!prev) {
        byKey.set(a.key, a);
        res.inserted++;
      } else if (a.version >= prev.version) {
        byKey.set(a.key, a);
        res.updated++;
      } else res.skipped++;
    }
    writeAtomsFile(path, [...byKey.values()]);
    res.files.push(path);
  }
  return res;
}

/* ------------------------------- Coverage ------------------------------- */
export interface CoverageCell {
  total: number;
  drafted: number;
  reviewed: number;
  published: number;
  /** keys with any atom (draft or better) */
  covered: number;
  coveragePct: number;
  missing: string[];
  /** atoms on disk whose key is not in the manifest (stale/typo) */
  orphans: string[];
}
export interface CoverageReport {
  generatedAt: string;
  locales: string[];
  traditions: Record<Tradition, Record<string, CoverageCell>>;
  totals: Record<string, { total: number; covered: number; reviewed: number; published: number; coveragePct: number }>;
}

export interface CoverageOptions extends StoreOptions {
  locales?: string[];
  manifest?: KeyManifest;
}

export function coverageReport(opts: CoverageOptions = {}): CoverageReport {
  const root = opts.root ?? CONTENT_ROOT;
  const manifest = opts.manifest ?? generateKeyManifest();
  const locales = opts.locales ?? [...new Set(['vi', 'en', ...TRADITIONS.flatMap((t) => localesOnDisk(t, root))])].sort();
  const traditions = {} as CoverageReport['traditions'];
  const totals: CoverageReport['totals'] = {};
  for (const l of locales) totals[l] = { total: 0, covered: 0, reviewed: 0, published: 0, coveragePct: 0 };
  for (const t of TRADITIONS) {
    const keys = manifest.traditions[t].keys;
    const keySet = new Set(keys);
    traditions[t] = {};
    for (const l of locales) {
      const atoms = readAtomsFile(atomsFile(t, l, root));
      const byKey = new Map(atoms.map((a) => [a.key, a]));
      const cell: CoverageCell = { total: keys.length, drafted: 0, reviewed: 0, published: 0, covered: 0, coveragePct: 0, missing: [], orphans: [] };
      for (const k of keys) {
        const a = byKey.get(k);
        if (!a) cell.missing.push(k);
        else {
          cell.covered++;
          if (a.status === 'draft') cell.drafted++;
          else if (a.status === 'reviewed') cell.reviewed++;
          else cell.published++;
        }
      }
      for (const a of atoms) if (!keySet.has(a.key)) cell.orphans.push(a.key);
      cell.coveragePct = keys.length ? Math.round((cell.covered / keys.length) * 1000) / 10 : 100;
      traditions[t][l] = cell;
      const tot = totals[l]!;
      tot.total += cell.total;
      tot.covered += cell.covered;
      tot.reviewed += cell.reviewed;
      tot.published += cell.published;
    }
  }
  for (const l of locales) {
    const tot = totals[l]!;
    tot.coveragePct = tot.total ? Math.round((tot.covered / tot.total) * 1000) / 10 : 100;
  }
  return { generatedAt: new Date().toISOString(), locales, traditions, totals };
}

export function coverageMarkdown(r: CoverageReport): string {
  const lines: string[] = ['# Atom coverage', '', `Generated ${r.generatedAt}. Counts are keys from \`keys-manifest.json\`; "covered" = any atom (draft or better).`, ''];
  lines.push(`| Tradition | Locale | Keys | Covered | Draft | Reviewed | Published | Coverage |`, `|---|---|---:|---:|---:|---:|---:|---:|`);
  for (const t of TRADITIONS) for (const l of r.locales) {
    const c = r.traditions[t][l]!;
    lines.push(`| ${t} | ${l} | ${c.total} | ${c.covered} | ${c.drafted} | ${c.reviewed} | ${c.published} | ${c.coveragePct}% |`);
  }
  lines.push('', '## Totals', '', '| Locale | Keys | Covered | Reviewed | Published | Coverage |', '|---|---:|---:|---:|---:|---:|');
  for (const l of r.locales) {
    const t = r.totals[l]!;
    lines.push(`| ${l} | ${t.total} | ${t.covered} | ${t.reviewed} | ${t.published} | ${t.coveragePct}% |`);
  }
  const orphans = TRADITIONS.flatMap((t) => r.locales.flatMap((l) => r.traditions[t][l]!.orphans.map((k) => `${l}: ${k}`)));
  if (orphans.length) lines.push('', '## Orphan atoms (key not in manifest)', '', ...orphans.map((o) => `- ${o}`));
  lines.push('', 'Missing keys per cell are listed in `coverage.json`.', '');
  return lines.join('\n');
}

export function writeCoverage(opts: CoverageOptions = {}): { report: CoverageReport; jsonPath: string; mdPath: string } {
  const root = opts.root ?? CONTENT_ROOT;
  const report = coverageReport(opts);
  const jsonPath = join(root, 'coverage.json');
  const mdPath = join(root, 'COVERAGE.md');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  writeFileSync(mdPath, coverageMarkdown(report), 'utf8');
  return { report, jsonPath, mdPath };
}

export function writeKeyManifest(root = CONTENT_ROOT): { manifest: KeyManifest; path: string } {
  const manifest = generateKeyManifest();
  const path = join(root, 'keys-manifest.json');
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  return { manifest, path };
}
