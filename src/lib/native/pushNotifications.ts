import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { isNative, getPlatform } from './platform';

/**
 * Registers the device for push notifications and stores the APNs/FCM token
 * in `device_tokens`. No-op on web. Safe to call multiple times.
 */
export async function registerPushNotifications(userId: string, teamId?: string | null) {
  if (!isNative()) return;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      const platform = getPlatform();
      try {
        await supabase
          .from('device_tokens')
          .upsert(
            {
              user_id: userId,
              team_id: teamId ?? null,
              token: token.value,
              platform,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,token' },
          );
      } catch (err) {
        console.error('Failed to persist push token', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error', err);
    });
  } catch (err) {
    console.error('Push notifications setup failed', err);
  }
}
