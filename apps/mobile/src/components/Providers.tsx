import React, { useEffect, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@findme/ui';
import { useSession } from '../store/session';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } } });

export function Providers({ children }: { children: React.ReactNode }) {
  const scheme = useSession((s) => s.scheme);
  const fontScale = useSession((s) => s.fontScale);
  const uiLocale = useSession((s) => s.uiLocale);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);
  const themeLocale = useMemo(() => (uiLocale === 'en-XA' ? 'en' : uiLocale), [uiLocale]);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider scheme={scheme} locale={themeLocale} fontScale={fontScale} reduceMotion={reduceMotion}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { queryClient };
