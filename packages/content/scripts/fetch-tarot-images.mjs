#!/usr/bin/env node
/**
 * Download the 78 public-domain 1909 Pamela Colman Smith card scans from Wikimedia Commons and
 * convert them to WebP under packages/content/tarot/images/<id>.webp.
 *
 * NOT executed automatically. Usage (from repo root, network required):
 *   node packages/content/scripts/fetch-tarot-images.mjs [--width 600] [--quality 82] [--dry-run]
 *
 * Conversion uses `sharp` if it is installed (pnpm add -D sharp -w); otherwise it falls back to the
 * `cwebp` CLI (libwebp). The script is idempotent: existing .webp files are skipped.
 *
 * Source / license: see packages/content/tarot/SOURCES.md. Only 1909 scans; never the 1971 recolour.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..');
const OUT_DIR = join(CONTENT_DIR, 'tarot', 'images');
const RAW_DIR = join(CONTENT_DIR, 'tarot', 'images', '_raw');
const DECK_PATH = join(CONTENT_DIR, 'tarot', 'deck-classic-1909.json');

const USER_AGENT = 'FindmeContentBot/0.1 (https://findme.vn; content@findme.vn) node-fetch';
const COMMONS_FILE_PATH = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

/** id → Wikimedia Commons file name (Category:Rider-Waite_tarot_deck). Verify before first run. */
const MAJOR_FILES = {
  'major-00': 'RWS_Tarot_00_Fool.jpg',
  'major-01': 'RWS_Tarot_01_Magician.jpg',
  'major-02': 'RWS_Tarot_02_High_Priestess.jpg',
  'major-03': 'RWS_Tarot_03_Empress.jpg',
  'major-04': 'RWS_Tarot_04_Emperor.jpg',
  'major-05': 'RWS_Tarot_05_Hierophant.jpg',
  'major-06': 'RWS_Tarot_06_Lovers.jpg',
  'major-07': 'RWS_Tarot_07_Chariot.jpg',
  'major-08': 'RWS_Tarot_08_Strength.jpg',
  'major-09': 'RWS_Tarot_09_Hermit.jpg',
  'major-10': 'RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'major-11': 'RWS_Tarot_11_Justice.jpg',
  'major-12': 'RWS_Tarot_12_Hanged_Man.jpg',
  'major-13': 'RWS_Tarot_13_Death.jpg',
  'major-14': 'RWS_Tarot_14_Temperance.jpg',
  'major-15': 'RWS_Tarot_15_Devil.jpg',
  'major-16': 'RWS_Tarot_16_Tower.jpg',
  'major-17': 'RWS_Tarot_17_Star.jpg',
  'major-18': 'RWS_Tarot_18_Moon.jpg',
  'major-19': 'RWS_Tarot_19_Sun.jpg',
  'major-20': 'RWS_Tarot_20_Judgement.jpg',
  'major-21': 'RWS_Tarot_21_World.jpg',
};

/** Minor arcana use "<Suit>NN.jpg" on Commons; pentacles are abbreviated "Pents". */
const SUIT_PREFIX = { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pents' };

export const FILE_MAP = { ...MAJOR_FILES };
for (const [suit, prefix] of Object.entries(SUIT_PREFIX)) {
  for (let n = 1; n <= 14; n++) {
    const nn = String(n).padStart(2, '0');
    FILE_MAP[`${suit}-${nn}`] = `${prefix}${nn}.jpg`;
  }
}

function parseArgs(argv) {
  const opts = { width: 600, quality: 82, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--width') opts.width = Number(argv[++i]);
    else if (a === '--quality') opts.quality = Number(argv[++i]);
    else if (a === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function download(fileName, dest) {
  if (await exists(dest)) return 'cached';
  const url = COMMONS_FILE_PATH + encodeURIComponent(fileName);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return 'downloaded';
}

async function loadSharp() {
  try {
    const require = createRequire(import.meta.url);
    return require('sharp');
  } catch {
    return null;
  }
}

async function toWebp(sharp, src, dest, { width, quality }) {
  if (sharp) {
    await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(dest);
  } else {
    await execFileAsync('cwebp', ['-q', String(quality), '-resize', String(width), '0', src, '-o', dest]);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const deck = JSON.parse(await readFile(DECK_PATH, 'utf8'));
  const ids = deck.cards.map((c) => c.id);
  const missing = ids.filter((id) => !FILE_MAP[id]);
  if (missing.length) throw new Error(`No Commons mapping for: ${missing.join(', ')}`);

  if (opts.dryRun) {
    for (const id of ids) console.log(id, '→', COMMONS_FILE_PATH + encodeURIComponent(FILE_MAP[id]));
    return;
  }

  await mkdir(RAW_DIR, { recursive: true });
  const sharp = await loadSharp();
  if (!sharp) console.warn('sharp not installed; falling back to the cwebp CLI');

  const report = [];
  for (const id of ids) {
    const fileName = FILE_MAP[id];
    const raw = join(RAW_DIR, fileName);
    const out = join(OUT_DIR, `${id}.webp`);
    try {
      const how = await download(fileName, raw);
      if (!(await exists(out))) await toWebp(sharp, raw, out, opts);
      report.push({ id, fileName, status: how });
      console.log(`${id}\t${how}\t${fileName}`);
      // be polite to Commons
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      report.push({ id, fileName, status: 'error', error: String(err) });
      console.error(`${id}\tERROR\t${fileName}\t${err}`);
    }
  }
  await writeFile(join(OUT_DIR, 'fetch-report.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), report }, null, 2));
  const errors = report.filter((r) => r.status === 'error').length;
  if (errors) {
    console.error(`${errors} card(s) failed`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
