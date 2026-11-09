// The settings dashboard, opened from the hazard button: "use with caution".
// It's a display-styled panel over the dash, in the same illumination (DISP)
// as the stereo. Every row reads and writes the listener settings store
// (useSettings), so a feature that respects its switch needs nothing else.
// Add a section here when a 2.0 feature lands (time of day, road, the car
// ahead, driving speed, skyline): see docs/ROADMAP.md.

import { useEffect, useRef, type ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { CHOICES, type Settings } from '@/lib/settings';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 first:mt-0">
      <h3 className="mb-1 text-[10px] tracking-[0.3em] opacity-55 sm:text-[11px]">{title}</h3>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  );
}

/** An on/off row. A real switch for assistive tech (role="switch"). */
function Toggle({
  name,
  label,
  note,
}: {
  name: { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];
  label: string;
  note?: string;
}) {
  const { settings, set } = useSettings();
  const on = settings[name];
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(name, !on)}
        className={`lcd-row flex w-full items-center gap-3 px-2 py-1.5 text-left ${on ? 'active' : ''}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold uppercase tracking-wider sm:text-sm">{label}</span>
          {note && <span className="block truncate text-[10px] opacity-60 sm:text-[11px]">{note}</span>}
        </span>
        <span
          className={`w-12 shrink-0 border px-1 text-center text-[10px] font-bold tracking-widest sm:text-[11px] ${on ? '' : 'opacity-50'}`}
          style={{ borderColor: 'color-mix(in srgb, var(--lcd-fg) 45%, transparent)' }}
        >
          {on ? 'ON' : 'OFF'}
        </span>
      </button>
    </li>
  );
}

type ChoiceKey = keyof { [K in keyof Settings as Settings[K] extends boolean ? never : K]: true };

/** A pick-one row: a strip of segment buttons (a radio group for assistive
 *  tech). `labels` names each value; the order comes from CHOICES. */
function Choice<K extends ChoiceKey>({
  name,
  label,
  note,
  labels,
}: {
  name: K;
  label: string;
  note?: string;
  labels: Record<Settings[K], string>;
}) {
  const { settings, set } = useSettings();
  const values = (CHOICES[name] ?? []) as readonly Settings[K][];
  return (
    <li className="px-2 py-1.5">
      <div id={`setting-${name}`} className="truncate text-xs font-bold uppercase tracking-wider sm:text-sm">
        {label}
      </div>
      {note && <div className="truncate text-[10px] opacity-60 sm:text-[11px]">{note}</div>}
      <div role="radiogroup" aria-labelledby={`setting-${name}`} className="mt-1.5 flex gap-1">
        {values.map((v) => {
          const on = settings[name] === v;
          return (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set(name, v)}
              className={`lcd-row min-w-0 flex-1 truncate px-1 py-1 text-center text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${on ? 'active' : 'opacity-70'}`}
              style={on ? { borderColor: 'color-mix(in srgb, var(--lcd-fg) 55%, transparent)' } : undefined}
            >
              {labels[v]}
            </button>
          );
        })}
      </div>
    </li>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { reset } = useSettings();
  const panel = useRef<HTMLDivElement>(null);

  // Focus the panel on open; Escape closes it.
  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className="settings-panel lcd flex max-h-[min(85dvh,640px)] w-full max-w-[520px] flex-col rounded-lg outline-none"
      >
        <header className="flex h-10 shrink-0 items-center gap-3 border-b border-[color-mix(in_srgb,var(--lcd-fg)_25%,transparent)] px-3 text-[10px] tracking-widest sm:text-[11px]">
          <span className="hazard-mark" aria-hidden />
          <h2 id="settings-title" className="font-bold">
            SETUP
          </h2>
          <span className="truncate opacity-55">USE WITH CAUTION</span>
          <button type="button" onClick={onClose} className="ml-auto px-1" aria-label="Close settings">
            ✕ EXIT
          </button>
        </header>

        <div className="lcd-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <Section title="SCENERY">
            <Choice
              name="timeOfDay"
              label="Time of day"
              note="auto follows your clock"
              labels={{ auto: 'Auto', dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }}
            />
            <Choice
              name="skyline"
              label="Skyline"
              note="the city on the horizon"
              labels={{ default: 'Default', guangzhou: 'Guangzhou', delhi: 'Delhi' }}
            />
            <Toggle name="shootingStars" label="Shooting stars" note="now and then, when the stars are out" />
            <Toggle name="motorcycle" label="Motorcycle" note="passes now and then · artwork in progress" />
          </Section>
        </div>

        <footer className="flex h-10 shrink-0 items-center gap-3 border-t border-[color-mix(in_srgb,var(--lcd-fg)_25%,transparent)] px-3 text-[10px] tracking-widest sm:text-[11px]">
          <span className="truncate opacity-55">SAVED ON THIS DEVICE</span>
          <button type="button" onClick={reset} className="lcd-row ml-auto px-2 py-1 font-bold">
            RESET TO DEFAULTS
          </button>
        </footer>
      </div>
    </div>
  );
}
