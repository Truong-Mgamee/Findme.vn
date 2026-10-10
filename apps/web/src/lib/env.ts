/** Server-side environment access. All values are optional so `next build` works with nothing configured. */

/** Base URL of @findme/api, without trailing slash, or null when the web app runs engine-only. */
export function apiUrl(): string | null {
  const raw = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function adminToken(): string | null {
  const t = process.env.ADMIN_TOKEN;
  return t && t.length >= 12 ? t : null;
}

export const IOS_APP_ID = process.env.NEXT_PUBLIC_IOS_APP_ID ?? '';
export const ANDROID_PACKAGE = process.env.NEXT_PUBLIC_ANDROID_PACKAGE ?? 'vn.findme.app';
