// The scene's effective time of day: the listener's setting, or, on 'auto',
// worked out from a clock (rechecked every minute):
//   dawn 05:00–08:00 · day 08:00–17:00 · dusk 17:00–20:00 · night 20:00–05:00
// Which clock is the `clock` setting: the listener's device ('local'), the
// station's time zone ('station', from its feed; the device's if it doesn't
// say), or a chosen IANA zone.

import { useEffect, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useStationFeed } from '@/hooks/useStationFeed';
import { isTimeZone } from '@/lib/settings';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export function timeOfDayForHour(h: number): TimeOfDay {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

/** The hour and minute now in a time zone (undefined: the device's own). */
function clockIn(zone: string | undefined, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: zone,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? now.getHours());
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return { hour, time: `${String(hour).padStart(2, '0')}:${minute}` };
}

export interface AutoClock {
  /** Which clock is in use. 'local' also covers a station that sent no zone. */
  source: 'local' | 'station' | 'zone';
  /** The IANA zone in use, or undefined for the device's own. */
  zone: string | undefined;
  /** The time there, HH:MM. */
  time: string;
  /** What Auto resolves to at that time. */
  timeOfDay: TimeOfDay;
}

/** The clock Auto time of day follows, ticking each minute. */
export function useAutoClock(): AutoClock {
  const { settings } = useSettings();
  const { nowPlaying, state } = useStationFeed();
  const stationZone = [state?.timezone, nowPlaying?.timezone].find(isTimeZone);
  const choice = settings.clock;
  const source: AutoClock['source'] =
    choice === 'station' ? (stationZone ? 'station' : 'local') : choice === 'local' ? 'local' : 'zone';
  const zone = source === 'station' ? stationZone : source === 'zone' ? choice : undefined;

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { hour, time } = clockIn(zone);
  return { source, zone, time, timeOfDay: timeOfDayForHour(hour) };
}

export function useTimeOfDay(): TimeOfDay {
  const { settings } = useSettings();
  const clock = useAutoClock();
  return settings.timeOfDay === 'auto' ? clock.timeOfDay : (settings.timeOfDay as TimeOfDay);
}
