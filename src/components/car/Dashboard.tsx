// The dashboard: a center stack holding the head unit, and — on wide screens —
// the driver's side (three gauges seen through the steering wheel) and the
// passenger's side (a glovebox whose lid drops open toward you, with a lyrics
// screen inside). On narrow screens only the center stack shows, with a
// glovebox pull handle under it that opens the same compartment as a sheet.

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Player } from '@/hooks/usePlayer';
import type { Equalizer } from '@/hooks/useEqualizer';
import { useStationFeed } from '@/hooks/useStationFeed';
import { HeadUnit } from '@/components/car/HeadUnit';
import { LyricsScreen } from '@/components/car/LyricsScreen';

const SWEEP = 240; // degrees of needle travel
const START = -120;
const FONT = 'ui-monospace, Consolas, monospace';

/** A round analog gauge. `value` is 0–1; `labels` are spread evenly across the
 *  sweep (empty strings leave a major tick unlabelled). */
function Gauge({
  value,
  labels,
  unit,
  sub,
  readout,
  redline = 0.8,
  className,
  wobble,
}: {
  value: number;
  labels: string[];
  unit: string;
  sub?: string;
  readout: string;
  redline?: number;
  className: string;
  /** Idle needle quiver: a tach is never quite still; a speedo barely moves. */
  wobble?: 'strong' | 'light';
}) {
  const ticks = (labels.length - 1) * 4;
  const angle = START + Math.min(1, Math.max(0, value)) * SWEEP;
  return (
    <div className={`gauge relative aspect-square ${className}`}>
      <svg viewBox="0 0 120 120" className="block h-full w-full" aria-hidden>
        <circle cx="60" cy="60" r="57" fill="url(#gauge-face)" stroke="#2d2836" strokeWidth="2" />
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const t = i / ticks;
          const a = ((START + t * SWEEP - 90) * Math.PI) / 180;
          const major = i % 4 === 0;
          const r1 = major ? 41 : 45;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * 50}
              y2={60 + Math.sin(a) * 50}
              stroke={t >= redline ? 'var(--taillight)' : 'var(--lcd-fg)'}
              strokeOpacity={major ? 0.95 : 0.5}
              strokeWidth={major ? 2 : 1}
            />
          );
        })}
        {labels.map((l, i) => {
          if (!l) return null;
          const t = i / (labels.length - 1);
          const a = ((START + t * SWEEP - 90) * Math.PI) / 180;
          return (
            <text
              key={i}
              x={60 + Math.cos(a) * 32}
              y={60 + Math.sin(a) * 32 + 3}
              textAnchor="middle"
              fontSize="8"
              fill="var(--lcd-fg)"
              fillOpacity="0.85"
              fontFamily={FONT}
            >
              {l}
            </text>
          );
        })}
        <text x="60" y="80" textAnchor="middle" fontSize="7" letterSpacing="2" fill="var(--chrome)" fontFamily={FONT}>
          {unit}
        </text>
        {sub && (
          <text x="60" y="87" textAnchor="middle" fontSize="5" letterSpacing="1" fill="var(--chrome)" fillOpacity="0.7" fontFamily={FONT}>
            {sub}
          </text>
        )}
        <rect x="40" y="91" width="40" height="12" rx="2" fill="#020406" stroke="#000" />
        <text x="60" y="100" textAnchor="middle" fontSize="8" fill="var(--lcd-fg)" fontFamily={FONT}>
          {readout}
        </text>
      </svg>
      {/* Needle: a separate element so it can ease with a CSS transition. */}
      <div className="gauge-needle absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
        <div className={`absolute inset-0 ${wobble ? `needle-${wobble}` : ''}`}>
          <span className="absolute left-1/2 top-[13%] h-[39%] w-[2.5px] -translate-x-1/2 rounded-full" />
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 h-[12%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1b1820] shadow-[0_0_0_2px_#000]" />
    </div>
  );
}

const ENERGY: Record<string, number> = { low: 0.2, medium: 0.5, high: 0.8 };
const ENERGY_READOUT: Record<string, string> = { low: 'LO', medium: 'MED', high: 'HI' };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Latency on a log dial: 1 ms → 0, 10 ms → ⅓, 100 ms → ⅔, 1 s → full. Real
 *  round-trips (5–300 ms) then sweep the dial instead of hugging zero. */
const latencyToDial = (ms: number) => clamp01(Math.log10(Math.max(1, ms)) / 3);

/** Engine temperature: the energy tag sets the band (cold / normal / hot) and
 *  the tempo nudges it within the band, so each song reads a little
 *  differently even when the tag is the same. */
function temperature(energy: string | null | undefined, bpm: number | null) {
  if (!energy || !(energy in ENERGY)) return null;
  const nudge = bpm ? Math.max(-1, Math.min(1, (bpm - 120) / 60)) * 0.09 : 0;
  return clamp01(ENERGY[energy] + nudge);
}

/** The cluster, wired to the station. Everything follows the song you're
 *  HEARING (heardTrack — the live feed runs ~20s ahead of the speakers):
 *   tach  (RPM)   → feed latency: log dial, revs on every poll, idles alive
 *   speedo        → the track's BPM
 *   temp          → the track's energy, nudged by tempo (cold → hot)
 *  Needles rest at zero until you tune in, like a sweep at ignition. */
function Cluster({ active }: { active: boolean }) {
  const { nowPlaying, heardTrack: t, latencyMs } = useStationFeed();
  const bpm = typeof t?.bpm === 'number' ? Math.round(t.bpm) : null;
  const temp = temperature(t?.energy, bpm);

  // Each poll that lands is the engine "firing": blip the revs, then settle.
  // (nowPlaying is a fresh object on every successful poll.)
  const [rev, setRev] = useState(false);
  useEffect(() => {
    if (!active || !nowPlaying) return;
    setRev(true);
    const id = window.setTimeout(() => setRev(false), 320);
    return () => window.clearTimeout(id);
  }, [nowPlaying, active]);
  const rpm = active && latencyMs != null ? clamp01(latencyToDial(latencyMs) + (rev ? 0.14 : 0)) : 0;

  return (
    <div className="flex w-full items-center justify-center gap-[2%]">
      <svg width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="gauge-face" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#0d1416" />
            <stop offset="1" stopColor="#030506" />
          </radialGradient>
        </defs>
      </svg>
      <Gauge
        className="w-[29%] self-end"
        value={rpm}
        labels={['1', '10', '100', '1k']}
        unit="RPM"
        sub="LATENCY ms"
        readout={latencyMs != null ? `${latencyMs}ms` : '---'}
        redline={0.8}
        wobble={active ? 'strong' : undefined}
      />
      <Gauge
        className="w-[38%]"
        value={active && bpm ? bpm / 200 : 0}
        labels={['0', '40', '80', '120', '160', '200']}
        unit="BPM"
        readout={bpm ? String(bpm) : '---'}
        redline={0.85}
        wobble={active && bpm ? 'light' : undefined}
      />
      <Gauge
        className="w-[25%] self-end"
        value={active && temp != null ? temp : 0}
        labels={['C', '', '', 'H']}
        unit="TEMP"
        sub="ENERGY"
        readout={t?.energy ? (ENERGY_READOUT[t.energy] ?? '---') : '---'}
        redline={0.75}
      />
    </div>
  );
}

/** A three-spoke wheel, proportioned like a real one: rim ~11% of the radius,
 *  a compact airbag pad, spokes at 9, 3 and 6 o'clock. Its top surface takes
 *  the same sunset tint as the dash lip (--dash-glow), fading round the rim. */
function SteeringWheel() {
  const C = 200; // centre
  const R = 184; // rim centre-line radius
  const RIM = 22; // rim thickness
  return (
    <svg viewBox="0 0 400 400" className="block h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sw-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--dash-glow)" />
          <stop offset="0.16" stopColor="var(--dash-top)" />
          <stop offset="0.5" stopColor="#100d14" />
          <stop offset="1" stopColor="#060408" />
        </linearGradient>
        <linearGradient id="sw-spoke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#221d28" />
          <stop offset="1" stopColor="#0a080d" />
        </linearGradient>
        <linearGradient id="sw-pad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--dash-top)" />
          <stop offset="1" stopColor="#0c0a0f" />
        </linearGradient>
      </defs>
      {/* spokes: 9 and 3 o'clock, slightly below the centre line, and 6 o'clock */}
      <path d="M22 204 Q90 196 146 200 L146 236 Q92 238 26 246 Z" fill="url(#sw-spoke)" />
      <path d="M378 204 Q310 196 254 200 L254 236 Q308 238 374 246 Z" fill="url(#sw-spoke)" />
      <path d="M182 250 H218 L228 380 H172 Z" fill="url(#sw-spoke)" />
      {/* airbag pad */}
      <rect x="142" y="172" width="116" height="84" rx="30" fill="url(#sw-pad)" stroke="#000" strokeWidth="2" />
      <text x={C} y="221" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="3" fill="var(--chrome)" fillOpacity="0.6" fontFamily={FONT}>
        S/W
      </text>
      {/* rim */}
      <circle cx={C} cy={C} r={R} fill="none" stroke="url(#sw-rim)" strokeWidth={RIM} />
      <circle cx={C} cy={C} r={R - RIM / 2} fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="1.5" />
    </svg>
  );
}

/** DISP cycles the illumination, like a real stereo's display setting.
 *  Applied to the whole dash so the gauges, knob lights, play glow, readout
 *  and screen change together. Remembered across reloads. */
const DISP_MODES = [
  { label: 'CYAN', amber: false, dim: false },
  { label: 'CYAN DIM', amber: false, dim: true },
  { label: 'AMBER', amber: true, dim: false },
  { label: 'AMBER DIM', amber: true, dim: true },
] as const;
const DISP_KEY = 'subwave.car.disp.v1';

function loadDispMode() {
  try {
    const n = Number(localStorage.getItem(DISP_KEY));
    return Number.isInteger(n) && n >= 0 && n < DISP_MODES.length ? n : 0;
  } catch {
    return 0;
  }
}

// The wide (xl) layout has a real glovebox; below it, a pull handle + sheet.
// Only one of the two lyrics screens is ever mounted, so lyrics fetch once.
const WIDE = '(min-width: 1280px)';
function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(WIDE).matches,
  );
}

export function Dashboard({ player, eq }: { player: Player; eq: Equalizer }) {
  const [dispMode, setDispMode] = useState(loadDispMode);
  const [gloveOpen, setGloveOpen] = useState(false);
  const wide = useWide();

  useEffect(() => {
    try {
      localStorage.setItem(DISP_KEY, String(dispMode));
    } catch {
      /* private mode — the setting just won't stick */
    }
  }, [dispMode]);

  useEffect(() => {
    if (!gloveOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGloveOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gloveOpen]);

  const mode = DISP_MODES[dispMode];
  const cycleDisp = () => {
    const next = (dispMode + 1) % DISP_MODES.length;
    setDispMode(next);
    return DISP_MODES[next].label;
  };
  const closeGlove = () => setGloveOpen(false);

  return (
    <div
      className={`dash relative z-10 ${mode.amber ? 'illum-amber' : ''} ${mode.dim ? 'illum-dim' : ''} px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 xl:px-0`}
    >
      <div className="relative mx-auto flex items-stretch justify-center">
        {/* Driver side: binnacle + gauges, steering wheel in front. The same
            width as the passenger side, so the stereo sits centre screen. */}
        <div className="driver-side relative hidden min-w-0 flex-1 xl:block" aria-hidden>
          <div className="wheel-clip">
            <div className="wheel-rig">
              <div className="binnacle">
                <Cluster active={player.playing} />
              </div>
              <div className="absolute inset-0">
                <SteeringWheel />
              </div>
            </div>
          </div>
        </div>

        {/* Center stack: vents over the head unit. */}
        <div className="center-stack relative z-10 w-full min-w-0 xl:w-[clamp(760px,60vw,960px)] xl:flex-none xl:px-5">
          <div className="mx-auto mb-4 hidden max-w-[920px] gap-4 sm:flex" aria-hidden>
            <div className="vent h-9 flex-1" />
            <div className="hazard" />
            <div className="vent h-9 flex-1" />
          </div>
          <HeadUnit player={player} eq={eq} onDisp={cycleDisp} />

          {/* Small screens: the glovebox is a pull handle under the stereo. */}
          <button
            type="button"
            onClick={() => setGloveOpen((o) => !o)}
            aria-expanded={gloveOpen}
            className="glovebox-pull mx-auto mt-3 flex h-9 w-full max-w-[900px] items-center justify-center gap-3 xl:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-[#2c2733]" aria-hidden />
            GLOVEBOX · LYRICS
            <span className="h-1.5 w-10 rounded-full bg-[#2c2733]" aria-hidden />
          </button>
        </div>

        {/* Passenger side: the glovebox. The lid is hinged at the bottom and
            drops toward you; the lyrics screen is fitted inside. */}
        <div className="passenger-side relative hidden min-w-0 flex-1 overflow-hidden xl:block">
          <div className="glovebox" data-open={gloveOpen || undefined}>
            <div className="glovebox-well">
              {gloveOpen && wide && <LyricsScreen onClose={closeGlove} className="h-full w-full" />}
            </div>
            <button
              type="button"
              className="glovebox-lid"
              onClick={() => setGloveOpen((o) => !o)}
              aria-expanded={gloveOpen}
              aria-label={gloveOpen ? 'Close the glovebox' : 'Open the glovebox (lyrics)'}
            >
              <span className="glovebox-latch" />
              <span className="glovebox-badge">SUB/WAVE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Small screens: the same compartment slides up as a sheet. */}
      {gloveOpen && !wide && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 xl:hidden">
          <div className="glovebox-well glovebox-sheet h-[min(60dvh,460px)] w-full max-w-[680px]">
            <LyricsScreen onClose={closeGlove} className="h-full w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
