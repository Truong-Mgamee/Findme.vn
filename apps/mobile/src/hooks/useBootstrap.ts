/**
 * App bootstrap: hydrate storage, pick locale, init i18n + analytics, ensure a guest token
 * (POST /v1/auth/guest) and load /v1/me. Re-issues a guest token on 401.
 */
import { useEffect, useState } from 'react';
import { defaultCalendarStandard, defaultTraditionPack } from '@findme/i18n';
import { api, createGuest, loadToken, onUnauthorized, setRequestContext, setToken } from '../lib/api';
import { identify, initAnalytics, setSuperProps, track } from '../lib/analytics';
import { deviceCountry, deviceLocale, deviceTimeZone, initI18n, PSEUDO } from '../lib/i18n';
import { configureNotificationHandler } from '../lib/notifications';
import { kv } from '../lib/storage';
import { useSession } from '../store/session';

export function useBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await kv.ready;
      const s = useSession.getState();
      s.setHydrated(true);
      const uiLocale = s.devPseudoLocale ? PSEUDO : s.user?.locale ?? (s.uiLocale !== 'en' ? s.uiLocale : deviceLocale());
      const tz = s.user?.tz ?? deviceTimeZone();
      setRequestContext({ locale: uiLocale, tz });
      await initI18n(uiLocale);
      if (!s.devPseudoLocale) s.setUiLocale(uiLocale);
      configureNotificationHandler();
      void initAnalytics();

      const token = await loadToken();
      if (token) {
        s.setHasToken(true);
        const me = await api.GET('/v1/me').catch(() => null);
        if (me?.data) {
          s.setUser(me.data);
          identify(me.data.id);
          setSuperProps({ locale: me.data.locale, tradition_pack: me.data.traditionPack, calendar_standard: me.data.calendarStandard, country: me.data.country ?? undefined });
        } else if (me && me.response.status === 401) {
          await setToken(null);
          s.setHasToken(false);
        }
      }
      if (!useSession.getState().hasToken) {
        const locale = uiLocale === PSEUDO ? 'en' : uiLocale;
        const country = deviceCountry();
        try {
          const user = await createGuest({ locale, country, traditionPack: defaultTraditionPack(country, locale), calendarStandard: defaultCalendarStandard(country), tz });
          s.setHasToken(true);
          s.setUser(user);
          identify(user.id);
          setSuperProps({ locale: user.locale, tradition_pack: user.traditionPack, calendar_standard: user.calendarStandard, country: user.country ?? undefined });
        } catch (e) {
          // offline on first launch: the app still opens (onboarding works locally; profile creation retries)
          setError(e instanceof Error ? e.message : 'guest_failed');
        }
      }
      track({ name: 'app_open', source: 'icon' });
      if (!cancelled) setReady(true);
    })().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'bootstrap_failed');
      setReady(true);
    });
    const off = onUnauthorized(() => {
      void (async () => {
        await setToken(null);
        const st = useSession.getState();
        st.setHasToken(false);
        const locale = st.user?.locale ?? 'en';
        try {
          const user = await createGuest({ locale, country: st.user?.country ?? deviceCountry(), traditionPack: st.user?.traditionPack, calendarStandard: st.user?.calendarStandard, tz: st.user?.tz ?? deviceTimeZone() });
          st.setHasToken(true);
          st.setUser(user);
          st.setSelfProfileId(null);
          st.setOnboardingStep('birth');
        } catch {
          /* stay signed out until next launch */
        }
      })();
    });
    return () => {
      cancelled = true;
      off();
    };
  }, []);

  return { ready, error };
}
