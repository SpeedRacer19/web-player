// The recent-stations list (typed URLs and share links), as React state.
// Lives in config.ts next to the current station; this just subscribes.

import { useSyncExternalStore } from 'react';
import { forgetStation, getRecentStations, rememberStation, subscribeRecent } from '@/config';

export function useRecentStations() {
  const recent = useSyncExternalStore(subscribeRecent, getRecentStations);
  return { recent, remember: rememberStation, forget: forgetStation };
}
