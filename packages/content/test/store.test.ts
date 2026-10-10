import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AtomSchema, atomsFile, coverageMarkdown, coverageReport, generateKeyManifest, loadAtoms, makeAtom, readAtomsFile, upsertAtoms, writeCoverage, type Atom } from '../src/atoms/index.js';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'findme-atoms-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const body = Array.from({ length: 70 }, (_, i) => `từ${i}`).join(' ');
const mk = (key: string, locale: string, over: Partial<Atom> = {}) =>
  makeAtom({ key, locale, title: `T ${key}`, body_md: body, author: 'human', status: 'reviewed', version: 1, updated_at: '2026-10-10T00:00:00.000Z', ...over });

describe('AtomSchema', () => {
  it('derives id and rejects mismatches', () => {
    const a = mk('numerology.lifepath.1', 'vi');
    expect(a.id).toBe('numerology.lifepath.1@vi@v1');
    expect(a.tradition).toBe('numerology');
    expect(AtomSchema.safeParse({ ...a, id: 'wrong' }).success).toBe(false);
    expect(AtomSchema.safeParse({ ...a, tradition: 'tarot' }).success).toBe(false);
    expect(AtomSchema.safeParse({ ...a, key: 'nope.x' }).success).toBe(false);
  });
  it('llm drafts cannot be reviewed without a reviewer', () => {
    const a = mk('tarot.major-00.upright', 'en', { author: 'llm-draft', status: 'draft' });
    expect(AtomSchema.safeParse({ ...a, status: 'reviewed' }).success).toBe(false);
    expect(AtomSchema.safeParse({ ...a, status: 'reviewed', reviewer: 'thầy A' }).success).toBe(true);
  });
});

describe('JSONL store', () => {
  it('upserts by key+locale, honours versions, writes one sorted line per atom', () => {
    const r1 = upsertAtoms([mk('numerology.lifepath.2', 'vi'), mk('numerology.lifepath.1', 'vi'), mk('numerology.lifepath.1', 'en')], { root });
    expect(r1).toMatchObject({ inserted: 3, updated: 0, skipped: 0 });
    expect(r1.files.sort()).toEqual([atomsFile('numerology', 'en', root), atomsFile('numerology', 'vi', root)].sort());
    const lines = readFileSync(atomsFile('numerology', 'vi', root), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).key).toBe('numerology.lifepath.1');

    const r2 = upsertAtoms([mk('numerology.lifepath.1', 'vi', { version: 2, title: 'v2' }), mk('numerology.lifepath.2', 'vi', { version: 0 + 1, title: 'same version edit' })], { root });
    expect(r2).toMatchObject({ inserted: 0, updated: 2, skipped: 0 });
    const r3 = upsertAtoms([mk('numerology.lifepath.1', 'vi', { version: 1, title: 'stale' })], { root });
    expect(r3).toMatchObject({ skipped: 1 });
    const vi = readAtomsFile(atomsFile('numerology', 'vi', root));
    expect(vi.find((a) => a.key === 'numerology.lifepath.1')).toMatchObject({ version: 2, title: 'v2' });
    expect(vi.find((a) => a.key === 'numerology.lifepath.2')!.title).toBe('same version edit');
  });

  it('loadAtoms filters by tradition / locale / status', () => {
    upsertAtoms([mk('numerology.lifepath.1', 'vi'), mk('numerology.lifepath.1', 'en', { status: 'published' }), mk('tarot.major-00.upright', 'en', { status: 'draft', author: 'llm-draft' })], { root });
    expect(loadAtoms({ root })).toHaveLength(3);
    expect(loadAtoms({ root, tradition: 'tarot' })).toHaveLength(1);
    expect(loadAtoms({ root, locale: 'en' })).toHaveLength(2);
    expect(loadAtoms({ root, status: 'published' }).map((a) => a.id)).toEqual(['numerology.lifepath.1@en@v1']);
    expect(loadAtoms({ root, status: ['draft', 'reviewed'] })).toHaveLength(2);
  });

  it('rejects malformed lines with a file:line pointer', () => {
    mkdirSync(join(root, 'atoms', 'tarot'), { recursive: true });
    writeFileSync(atomsFile('tarot', 'en', root), JSON.stringify({ id: 'x' }) + '\n');
    expect(() => readAtomsFile(atomsFile('tarot', 'en', root))).toThrow(/en\.jsonl:1/);
  });
});

describe('coverageReport', () => {
  it('counts per tradition × locale and lists missing keys and orphans', () => {
    const manifest = generateKeyManifest();
    upsertAtoms([mk('numerology.lifepath.1', 'vi'), mk('numerology.lifepath.2', 'vi', { status: 'published' }), mk('numerology.lifepath.3', 'vi', { status: 'draft', author: 'llm-draft' }), mk('numerology.lifepath.4', 'en')], { root });
    // an orphan key not in the manifest
    upsertAtoms([mk('numerology.lifepath.99', 'vi')], { root });
    const r = coverageReport({ root, manifest, locales: ['vi', 'en'] });
    const vi = r.traditions.numerology.vi!;
    expect(vi).toMatchObject({ total: manifest.traditions.numerology.count, covered: 3, drafted: 1, reviewed: 1, published: 1 });
    expect(vi.missing).toHaveLength(manifest.traditions.numerology.count - 3);
    expect(vi.missing).not.toContain('numerology.lifepath.1');
    expect(vi.orphans).toEqual(['numerology.lifepath.99']);
    expect(r.traditions.numerology.en!.covered).toBe(1);
    expect(r.traditions.tarot.vi!.covered).toBe(0);
    expect(r.totals.vi!.total).toBe(manifest.total);
    expect(r.totals.vi!.covered).toBe(3);
    const md = coverageMarkdown(r);
    expect(md).toContain('| numerology | vi |');
    expect(md).toContain('numerology.lifepath.99');
    const w = writeCoverage({ root, manifest, locales: ['vi', 'en'] });
    expect(JSON.parse(readFileSync(w.jsonPath, 'utf8')).totals.vi.covered).toBe(3);
    expect(readFileSync(w.mdPath, 'utf8')).toContain('# Atom coverage');
  });
});
