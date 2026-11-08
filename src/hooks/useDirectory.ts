// The public SUB/WAVE station directory, fetched once — lazily, the first time
// `enabled` is true (the SRC list opening), not on page load.

import { useEffect, useState } from 'react';
import { fetchDirectory } from '@/lib/stationClient';
import type { DirectoryStation } from '@/lib/types';

export function useDirectory(enabled: boolean) {
  const [stations, setStations] = useState<DirectoryStation[] | null>(null);

  useEffect(() => {
    if (!enabled || stations) return;
    const ctrl = new AbortController();
    fetchDirectory(ctrl.signal).then((list) => {
      if (!ctrl.signal.aborted) setStations(list);
    });
    return () => ctrl.abort();
  }, [enabled, stations]);

  return { stations: stations ?? [], loading: enabled && stations === null };
}
