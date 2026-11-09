// How fast the car is going, as a multiple of the normal pace (1 = the
// original drive). From the `drivingSpeed` setting:
//   steady → 1
//   bpm    → the tempo of the song being heard: 120 BPM = 1, capped 0.5–1.6
//   energy → its energy tag: low 0.6, medium 1, high 1.45
// Songs without the tag drive at 1. It's the target speed; the scene eases
// toward it (Windshield), so a song change never jolts.

import { useSettings } from '@/hooks/useSettings';
import { useStationFeed } from '@/hooks/useStationFeed';

export const SPEED_MIN = 0.5;
export const SPEED_MAX = 1.6;
const ENERGY_SPEED = { low: 0.6, medium: 1, high: 1.45 } as const;

export function useDrivingSpeed(): number {
  const { settings } = useSettings();
  const { heardTrack } = useStationFeed();
  if (settings.drivingSpeed === 'bpm') {
    const bpm = heardTrack?.bpm;
    if (typeof bpm !== 'number' || bpm <= 0) return 1;
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, bpm / 120));
  }
  if (settings.drivingSpeed === 'energy') {
    const e = heardTrack?.energy;
    return e ? ENERGY_SPEED[e] : 1;
  }
  return 1;
}
