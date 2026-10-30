/** Route alias for the paywall (deep link findme://paywall). The sheet itself is hosted globally by PaywallHost. */
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { usePaywall } from '../src/store/paywall';

export default function PaywallRoute() {
  const show = usePaywall((s) => s.show);
  useEffect(() => {
    show({ trigger: 'deeplink' });
  }, [show]);
  return <Redirect href="/(tabs)/you" />;
}
