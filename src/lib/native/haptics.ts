// Tiny haptics helper. No-ops on web; uses Capacitor on native.
import { isNative } from "./platform";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export const haptic = {
  light: () => { if (isNative()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); },
  medium: () => { if (isNative()) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); },
  heavy: () => { if (isNative()) Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}); },
  success: () => { if (isNative()) Haptics.notification({ type: NotificationType.Success }).catch(() => {}); },
  warning: () => { if (isNative()) Haptics.notification({ type: NotificationType.Warning }).catch(() => {}); },
  selection: () => { if (isNative()) Haptics.selectionStart().then(() => Haptics.selectionEnd()).catch(() => {}); },
};
