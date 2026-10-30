import IntlMessageFormat from 'intl-messageformat';
import type { Locale } from '@findme/engine-core';
import en from '../messages/en.json' with { type: 'json' };
import vi from '../messages/vi.json' with { type: 'json' };
import { LOCALE_CONFIGS } from './localeConfig.js';

type Messages = Record<string, unknown>;
const CATALOGS: Partial<Record<Locale, Messages>> = { en, vi };

export function registerCatalog(locale: Locale, messages: Messages): void {
  CATALOGS[locale] = messages;
}

function lookup(obj: Messages | undefined, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

export type TFunction = (key: string, values?: Record<string, string | number | Date>) => string;

/** Creates a translator with fallback chain locale → en → key. */
export function createT(locale: Locale): TFunction {
  const cache = new Map<string, IntlMessageFormat>();
  const tag = LOCALE_CONFIGS[locale].intlTag;
  return (key, values) => {
    const msg = lookup(CATALOGS[locale], key) ?? lookup(CATALOGS.en, key);
    if (msg === undefined) return key;
    if (!values) return msg;
    let fmt = cache.get(key);
    if (!fmt) {
      fmt = new IntlMessageFormat(msg, tag);
      cache.set(key, fmt);
    }
    return String(fmt.format(values));
  };
}

/** Flatten nested catalog into dotted keys (for lint & export). */
export function flattenKeys(obj: Messages, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flattenKeys(v as Messages, p));
    else out.push(p);
  }
  return out;
}

export function getCatalog(locale: Locale): Messages | undefined {
  return CATALOGS[locale];
}
