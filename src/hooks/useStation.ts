// The current station origin as React state. Switching re-points the whole
// data layer (stationClient reads config at call time); App keys the feed
// provider on the URL so the snapshot starts fresh for the new station.

import { useSyncExternalStore } from 'react';
import { config, setStationUrl, subscribeStation } from '@/config';

export function useStation() {
  const stationUrl = useSyncExternalStore(subscribeStation, () => config.stationUrl);
  return { stationUrl, setStation: setStationUrl, defaultStationUrl: config.defaultStationUrl };
}
