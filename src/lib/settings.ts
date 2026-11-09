// Listener preferences: switches for the optional parts of the player, kept
// in localStorage per browser. This is the store a settings dashboard writes
// to; components read it through useSettings(). Add a switch by adding a key
// to Settings and DEFAULTS; anything missing from storage gets its default,
// so new switches arrive switched to their default for existing listeners.

export interface Settings {
  /** The motorcycle that now and then passes and rides off to the horizon.
   *  Off by default while its artwork is still being worked on. */
  motorcycle: boolean;
  /** The occasional shooting star. */
  shootingStars: boolean;
}

export const DEFAULTS: Settings = {
  motorcycle: false,
  shootingStars: true,
};

const KEY = 'subwave.settings.v1';

function read(): Settings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const stored = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const out = { ...DEFAULTS };
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      if (typeof stored[k] === typeof DEFAULTS[k]) out[k] = stored[k] as Settings[typeof k];
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
