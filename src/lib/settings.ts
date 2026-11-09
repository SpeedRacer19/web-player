// Listener preferences: switches for the optional parts of the player, kept
// in localStorage per browser. This is the store a settings dashboard writes
// to; components read it through useSettings(). Add a switch by adding a key
// to Settings and DEFAULTS; anything missing from storage gets its default,
// so new switches arrive switched to their default for existing listeners.

/** The scene's time of day. 'auto' follows the listener's clock. */
export type TimeOfDaySetting = 'auto' | 'dawn' | 'day' | 'dusk' | 'night';
export const TIME_OF_DAY: readonly TimeOfDaySetting[] = ['auto', 'dawn', 'day', 'dusk', 'night'];

/** The city on the horizon (src/components/car/skylines.tsx). */
export type SkylineSetting = 'default' | 'guangzhou';
export const SKYLINE_CHOICES: readonly SkylineSetting[] = ['default', 'guangzhou'];

export interface Settings {
  /** The motorcycle that now and then passes and rides off to the horizon.
   *  Off by default while its artwork is still being worked on. */
  motorcycle: boolean;
  /** The occasional shooting star (only when stars are out: dusk, night). */
  shootingStars: boolean;
  /** The scene's palette: dawn, day, dusk (the original look) or night. */
  timeOfDay: TimeOfDaySetting;
  /** The city skyline: the generated default, or a real city. */
  skyline: SkylineSetting;
}

export const DEFAULTS: Settings = {
  motorcycle: false,
  shootingStars: true,
  timeOfDay: 'dusk',
  skyline: 'default',
};

/** Allowed values for settings that are a choice, not on/off. A stored value
 *  outside its list falls back to the default. */
export const CHOICES: { [K in keyof Settings]?: readonly Settings[K][] } = {
  timeOfDay: TIME_OF_DAY,
  skyline: SKYLINE_CHOICES,
};

const KEY = 'subwave.settings.v1';

function read(): Settings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const out = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      const v = stored[k];
      const allowed = CHOICES[k] as readonly unknown[] | undefined;
      if (typeof v !== typeof DEFAULTS[k] || (allowed && !allowed.includes(v))) continue;
      (out as Record<string, unknown>)[k] = v;
    }
    return out;
  } catch {
    return { ...DEFAULTS };
  }
}

let current: Settings = read();
const subscribers = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  if (current[key] === value) return;
  current = { ...current, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode: applies for this session only */
  }
  subscribers.forEach((fn) => fn());
}

export function resetSettings() {
  current = { ...DEFAULTS };
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
  subscribers.forEach((fn) => fn());
}

export function subscribeSettings(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

// Another tab changed them: follow along.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    current = read();
    subscribers.forEach((fn) => fn());
  });
}
