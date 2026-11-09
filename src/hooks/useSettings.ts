// The listener's preferences (src/lib/settings.ts) as React state.
//   const { settings, set } = useSettings();
//   settings.motorcycle            // read a switch
//   set('motorcycle', false)       // flip one (saved, and every tab follows)

import { useSyncExternalStore } from 'react';
import { getSettings, resetSettings, setSetting, subscribeSettings } from '@/lib/settings';

export function useSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings);
  return { settings, set: setSetting, reset: resetSettings };
}
