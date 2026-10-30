/**
 * Key-value storage with three tiers:
 *  - `kv`      : fast cache (MMKV, encrypted with a per-device key; AsyncStorage/localStorage fallback in Expo Go & web)
 *  - `secure`  : OS keychain/keystore via expo-secure-store (guest token, MMKV encryption key, cached birth input)
 *  - `cache`   : JSON helpers with TTL on top of `kv`
 * Birth input is never written to the plain tier (docs/02 anti-pattern #6).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
  /** true when backed by MMKV with an encryption key */
  encrypted: boolean;
  ready: Promise<void>;
}

const MMKV_KEY_ID = 'findme.mmkv.key';
const PREFIX = 'findme:';

function webLocal(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Secure tier. Web has no keychain: falls back to localStorage (dev/PWA only, documented in README). */
export const secure = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webLocal()?.getItem(`${PREFIX}secure:${key}`) ?? null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return void webLocal()?.setItem(`${PREFIX}secure:${key}`, value);
    await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') return void webLocal()?.removeItem(`${PREFIX}secure:${key}`);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};

async function encryptionKey(): Promise<string> {
  const existing = await secure.get(MMKV_KEY_ID);
  if (existing) return existing;
  const bytes = Crypto.getRandomBytes(16);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await secure.set(MMKV_KEY_ID, key);
  return key;
}

/** In-memory mirror persisted asynchronously (AsyncStorage / localStorage) — used when MMKV is unavailable. */
function createAsyncBackedStore(): KeyValueStore {
  const mem = new Map<string, string>();
  const local = webLocal();
  const ready = (async () => {
    if (local) {
      for (let i = 0; i < local.length; i++) {
        const k = local.key(i);
        if (k?.startsWith(PREFIX) && !k.startsWith(`${PREFIX}secure:`)) mem.set(k.slice(PREFIX.length), local.getItem(k) ?? '');
      }
      return;
    }
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [k, v] of pairs) if (v !== null) mem.set(k.slice(PREFIX.length), v);
    } catch {
      /* storage unavailable */
    }
  })();
  const persist = (k: string, v: string | null) => {
    if (local) return v === null ? local.removeItem(PREFIX + k) : local.setItem(PREFIX + k, v);
    void (v === null ? AsyncStorage.removeItem(PREFIX + k) : AsyncStorage.setItem(PREFIX + k, v)).catch(() => undefined);
  };
  return {
    encrypted: false,
    ready,
    getString: (k) => mem.get(k),
    set: (k, v) => {
      mem.set(k, v);
      persist(k, v);
    },
    delete: (k) => {
      mem.delete(k);
      persist(k, null);
    },
    getAllKeys: () => [...mem.keys()],
    clearAll: () => {
      for (const k of [...mem.keys()]) persist(k, null);
      mem.clear();
    },
  };
}

function tryMmkv(): KeyValueStore | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-mmkv') as { MMKV: new (cfg: { id: string; encryptionKey?: string }) => { getString(k: string): string | undefined; set(k: string, v: string): void; delete(k: string): void; getAllKeys(): string[]; clearAll(): void; recrypt?(k: string): void } };
    const inst = new mod.MMKV({ id: 'findme' });
    const ready = encryptionKey()
      .then((key) => inst.recrypt?.(key))
      .catch(() => undefined);
    return {
      encrypted: true,
      ready,
      getString: (k) => inst.getString(k),
      set: (k, v) => inst.set(k, v),
      delete: (k) => inst.delete(k),
      getAllKeys: () => inst.getAllKeys(),
      clearAll: () => inst.clearAll(),
    };
  } catch {
    return null; // Expo Go / missing native module
  }
}

export const kv: KeyValueStore = tryMmkv() ?? createAsyncBackedStore();

export const cache = {
  get<T>(key: string): T | null {
    const raw = kv.getString(`cache:${key}`);
    if (!raw) return null;
    try {
      const { v, exp } = JSON.parse(raw) as { v: T; exp: number | null };
      if (exp !== null && Date.now() > exp) {
        kv.delete(`cache:${key}`);
        return null;
      }
      return v;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T, ttlMs: number | null = 86_400_000): void {
    kv.set(`cache:${key}`, JSON.stringify({ v: value, exp: ttlMs === null ? null : Date.now() + ttlMs }));
  },
  delete(key: string) {
    kv.delete(`cache:${key}`);
  },
};

/** Wipe everything local (DELETE /me flow). */
export async function wipeAllLocal(): Promise<void> {
  kv.clearAll();
  for (const k of ['findme.token', 'findme.birth.self', MMKV_KEY_ID]) await secure.delete(k);
}
