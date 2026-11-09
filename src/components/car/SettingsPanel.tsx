// The settings dashboard, opened from the hazard button: "use with caution".
// It's a display-styled panel over the dash, in the same illumination (DISP)
// as the stereo. Every row reads and writes the listener settings store
// (useSettings), so a feature that respects its switch needs nothing else.
// Add a section here when a 2.0 feature lands (time of day, road, the car
// ahead, driving speed, skyline): see docs/ROADMAP.md.

import { useEffect, useRef, type ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';
import type { Settings } from '@/lib/settings';

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
            <Toggle name="shootingStars" label="Shooting stars" note="a faint streak across the sky now and then" />
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
