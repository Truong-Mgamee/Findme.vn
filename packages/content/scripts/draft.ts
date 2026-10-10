/**
 * pnpm --filter @findme/content draft -- --tradition tarot --locale en --max-usd 5 [--keys a,b] [--model …] [--dry-run]
 * Needs ANTHROPIC_API_KEY unless --dry-run.
 */
import { TRADITIONS, draftAtoms, formatDraftSummary, type Tradition } from '../src/atoms/index.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const tradition = arg('tradition') as Tradition | undefined;
const locale = arg('locale');
const maxUsd = Number(arg('max-usd') ?? '1');
const dryRun = process.argv.includes('--dry-run');
if (!tradition || !TRADITIONS.includes(tradition) || !locale) {
  console.error(`usage: draft --tradition <${TRADITIONS.join('|')}> --locale <vi|en|…> [--max-usd 1] [--keys k1,k2] [--model id] [--dry-run]`);
  process.exit(2);
}
if (!dryRun && !process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set (use --dry-run to plan without calling the API)');
  process.exit(2);
}
const keys = arg('keys')?.split(',').map((s) => s.trim()).filter(Boolean);
const summary = await draftAtoms({ tradition, locale, maxUsd, dryRun, model: arg('model'), ...(keys?.length ? { keys } : {}), log: (l) => console.error(l) });
console.log(formatDraftSummary(summary));
