// The scene's effective time of day: the listener's setting, or, on 'auto',
// worked out from their local clock (rechecked every minute).
//   dawn 05:00–08:00 · day 08:00–17:00 · dusk 17:00–20:00 · night 20:00–05:00

import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export function timeOfDayAt(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function useTimeOfDay(): TimeOfDay {
  const { settings } = useSettings();
  const auto = settings.timeOfDay === 'auto';
  const [clockTod, setClockTod] = useState(() => timeOfDayAt(new Date()));
  useEffect(() => {
    if (!auto) return;
    const tick = () => setClockTod(timeOfDayAt(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [auto]);
  return auto ? clockTod : (settings.timeOfDay as TimeOfDay);
}
