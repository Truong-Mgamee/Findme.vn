/**
 * Push permission + daily local schedule placeholder. The real daily push comes from the API job
 * (docs/06 P9) via Expo Push; the local schedule is a fallback so the habit loop works offline.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const DAILY_ID = 'findme-daily-oracle';

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const res = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
    return res.granted;
  } catch {
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const t = await Notifications.getExpoPushTokenAsync();
    return t.data;
  } catch {
    return null; // Expo Go without projectId / simulator
  }
}

/** One local notification per day at `hour` local time, deep-linking to findme://today. */
export async function scheduleDailyPlaceholder(hour: number, title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', { name: 'Daily Oracle', importance: Notifications.AndroidImportance.DEFAULT });
    }
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: { title, body, data: { url: 'findme://today', campaign: 'daily' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: 'daily' },
    });
  } catch {
    /* notifications unavailable */
  }
}

export async function cancelDailyPlaceholder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
}

export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}
