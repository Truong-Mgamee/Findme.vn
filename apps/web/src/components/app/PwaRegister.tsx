'use client';

import { useEffect } from 'react';

/** Registers /sw.js once in production (skipped in dev to avoid stale-cache confusion). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  }, []);
  return null;
}
