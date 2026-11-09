// The view out the windshield: sunset sky, a drifting city skyline, and a 3D
// road with lane markings and streetlights streaming toward the driver.
// Pure CSS/SVG — every moving part is a keyframe in src/index.css. This
// component reads no station data; it's scenery.
//
// A few things happen at random, to keep the drive alive without drawing the
// eye: stars shimmer on their own rhythms, a shooting star now and then, and
// once in a while a motorcycle comes up beside us and rides off to the
// horizon. None of it spawns in a background tab or with reduced motion on,
// and the listener can switch the optional bits off (useSettings).

import { useCallback, useEffect, useState, type AnimationEvent, type CSSProperties } from 'react';
import { useSettings } from '@/hooks/useSettings';

// Deterministic pseudo-random so the skyline is the same on every render.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Building {
  x: number;
  w: number;
  h: number;
  windows: { x: number; y: number }[];
}

function buildSkyline(seed: number, width: number, height: number, minH: number, density: number) {
  const r = rng(seed);
  const buildings: Building[] = [];
  let x = 0;
  while (x < width) {
    let w = 18 + Math.floor(r() * 46);
    // The last building ends exactly on the tile edge so tiles butt seamlessly.
    if (width - x - w < 18) w = width - x;
    const h = minH + Math.floor(r() * (height - minH));
    const windows: { x: number; y: number }[] = [];
    for (let wy = height - h + 6; wy < height - 6; wy += 7) {
      for (let wx = x + 4; wx < x + w - 5; wx += 6) {
        if (r() < density) windows.push({ x: wx, y: wy });
      }
    }
    buildings.push({ x, w, h, windows });
    x += w + (x + w >= width ? 0 : Math.floor(r() * 6));
  }
  return buildings;
}

const FAR = { width: 1200, height: 110, data: buildSkyline(7, 1200, 110, 30, 0.12) };
const NEAR = { width: 1200, height: 80, data: buildSkyline(42, 1200, 80, 14, 0.2) };

function SkylineTile({
  layer,
  fill,
  windowFill,
}: {
  layer: typeof FAR;
  fill: string;
  windowFill: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${layer.width} ${layer.height}`}
      aria-hidden
    >
      {layer.data.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={layer.height - b.h} width={b.w} height={b.h} fill={fill} />
          {/* A few rooftop antennas for silhouette interest. */}
          {i % 5 === 0 && (
            <rect x={b.x + b.w / 2} y={layer.height - b.h - 10} width={1.5} height={10} fill={fill} />
          )}
          <g className={i % 3 === 0 ? 'win' : undefined}>
            {b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={2.5} height={3} fill={windowFill} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

function Skyline({ layer, className, fill, windowFill }: {
  layer: typeof FAR;
  className: string;
  fill: string;
  windowFill: string;
}) {
  // Identical tiles side by side; the strip slides one tile width (-1/TILES)
  // and loops. Enough tiles that the screen is always covered, even ultrawide.
  return (
    <div className={`skyline ${className}`}>
      {Array.from({ length: SKYLINE_TILES }, (_, i) => (
        <SkylineTile key={i} layer={layer} fill={fill} windowFill={windowFill} />
      ))}
    </div>
  );
}

/** Rear view of the car ahead: silhouette, rear window catching the sunset,
 *  a lit tail-light bar. It stands on the 3D road plane, so perspective sizes it. */
function LeadCar() {
  return (
    <svg viewBox="0 0 200 92" className="block h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="lc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2640" />
          <stop offset="0.25" stopColor="#1a1120" />
          <stop offset="1" stopColor="#0b070e" />
        </linearGradient>
        <linearGradient id="lc-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a6a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2a1030" stopOpacity="0.9" />
        </linearGradient>
        <filter id="lc-glow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* tyres */}
      <rect x="14" y="74" width="30" height="18" rx="4" fill="#050306" />
      <rect x="156" y="74" width="30" height="18" rx="4" fill="#050306" />
      {/* cabin + rear window */}
      <path d="M36 42 L54 9 Q57 5 63 5 H137 Q143 5 146 9 L164 42 Z" fill="url(#lc-body)" />
      <path d="M48 38 L61 13 H139 L152 38 Z" fill="url(#lc-glass)" />
      <path d="M54 9 Q57 5 63 5 H137 Q143 5 146 9" stroke="#ff8a6a" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
      {/* body */}
      <rect x="4" y="38" width="192" height="42" rx="10" fill="url(#lc-body)" />
      <rect x="8" y="70" width="184" height="12" rx="5" fill="#0a070c" />
      {/* plate */}
      <rect x="84" y="58" width="32" height="10" rx="1.5" fill="#cfc6b8" fillOpacity="0.35" />
      {/* tail lights + light bar */}
      <g filter="url(#lc-glow)">
        <rect x="10" y="46" width="44" height="9" rx="3" fill="var(--taillight)" />
        <rect x="146" y="46" width="44" height="9" rx="3" fill="var(--taillight)" />
        <rect x="54" y="49" width="92" height="2.5" rx="1" fill="var(--taillight)" fillOpacity="0.8" />
      </g>
    </svg>
  );
}

/** The rear-view mirror's picture: what you've just driven past. Behind you
 *  it's already night (the sunset is ahead), the city sits low on the
 *  horizon, the lane markings and streetlights run away from you, and a pair
 *  of headlights follows a long way back. */
function RearView() {
  return (
    <div className="rv">
      <div className="rv-sky">
        <div className="rv-stars" />
        <Skyline layer={NEAR} className="rv-skyline" fill="var(--skyline-near)" windowFill="var(--window-near)" />
      </div>
      <div className="rv-ground">
        <div className="rv-road">
          <div className="rv-mark edge" style={{ left: '9%' }} />
          <div className="rv-mark edge" style={{ right: '9%' }} />
          <div className="rv-mark lane-dash" style={{ left: '36.3%' }} />
          <div className="rv-mark lane-dash" style={{ right: '36.3%' }} />
          {Array.from({ length: POLE_COUNT }, (_, i) => (
            <div
              key={i}
              className="rv-pole-track"
              style={{ '--d': `${(-i * POLE_CYCLE_S) / POLE_COUNT}s` } as React.CSSProperties}
            >
              <div className="rv-pole left" />
              <div className="rv-pole right" />
            </div>
          ))}
        </div>
      </div>
      <div className="rv-follower" />
      <div className="rv-glass" />
    </div>
  );
}

/** The starfield, fixed per build (seeded): mostly faint pinpoints, a few
 *  brighter ones, more of them higher up. Each shimmers on its own period. */
const STARS = (() => {
  const r = rng(99);
  return Array.from({ length: 70 }, () => {
    const roll = r();
    const size = roll < 0.7 ? 1 : roll < 0.92 ? 1.5 : 2;
    const period = 2.5 + r() * 5;
    return {
      left: `${(r() * 100).toFixed(2)}%`,
      top: `${(Math.pow(r(), 1.4) * 100).toFixed(2)}%`,
      size,
      opacity: (size === 2 ? 0.75 : 0.3) + r() * 0.5,
      period,
      delay: -r() * period,
    };
  });
})();

function Stars() {
  return (
    <div className="stars">
      {STARS.map((s, i) => (
        <span
          key={i}
          className={`star ${s.size === 2 ? 'bright' : ''}`}
          style={
            {
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              '--o': s.opacity.toFixed(2),
              animationDuration: `${s.period.toFixed(2)}s`,
              animationDelay: `${s.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Fires an event at a random interval between `minS` and `maxS` seconds,
 *  while `enabled`. Skipped while the tab is hidden or the listener prefers
 *  reduced motion. Returns the current event (a fresh id and a random 0–1 to
 *  place it) and a function to clear it once its animation has finished. */
function useRandomEvent(minS: number, maxS: number, enabled = true) {
  const [event, setEvent] = useState<{ id: number; r: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          if (!document.hidden && !reduce.matches) setEvent({ id: Date.now(), r: Math.random() });
          schedule();
        },
        (minS + Math.random() * (maxS - minS)) * 1000,
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [minS, maxS, enabled]);
  const clear = useCallback(() => setEvent(null), []);
  return [event, clear] as const;
}

/** Only an element's own animation ending counts (not a child's). */
const own = (fn: () => void) => (e: AnimationEvent) => {
  if (e.target === e.currentTarget) fn();
};

/** A faint streak across the upper sky, every 8–25s. */
function ShootingStar() {
  const { settings } = useSettings();
  const [shot, clear] = useRandomEvent(8, 25, settings.shootingStars);
  if (!shot || !settings.shootingStars) return null;
  const r = rng(Math.floor(shot.r * 1e9));
  const leftward = r() < 0.5;
  const angle = 14 + r() * 22; // degrees below horizontal
  return (
    <span
      key={shot.id}
      className="shooting-star"
      onAnimationEnd={own(clear)}
      style={
        {
          left: `${(leftward ? 35 : 8) + r() * 55}%`,
          top: `${4 + r() * 30}%`,
          '--angle': `${leftward ? 180 - angle : angle}deg`,
        } as CSSProperties
      }
    />
  );
}

/** Rear view of a motorcycle and rider, as you'd see it pulling away: tyre,
 *  fender with tail light and plate, exhaust, the rider's back with arms out
 *  to the bars and mirrors, knees out, and the sunset catching the helmet
 *  and shoulders. */
function MotorcycleArt() {
  return (
    <svg viewBox="0 0 60 100" className="block h-full w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="mc-jacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35243c" />
          <stop offset="1" stopColor="#100a14" />
        </linearGradient>
        <linearGradient id="mc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1f30" />
          <stop offset="1" stopColor="#09060b" />
        </linearGradient>
        <filter id="mc-glow" x="-100%" y="-200%" width="300%" height="500%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* mirrors and handlebar ends, beyond the shoulders */}
      <path d="M8 44 L4 38 M52 44 L56 38" stroke="#140d18" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="3.5" cy="36" rx="3" ry="2.2" fill="#1b1220" stroke="#ff8a6a" strokeOpacity="0.35" strokeWidth="0.6" />
      <ellipse cx="56.5" cy="36" rx="3" ry="2.2" fill="#1b1220" stroke="#ff8a6a" strokeOpacity="0.35" strokeWidth="0.6" />
      {/* arms out to the grips */}
      <path d="M20 40 Q13 42 8 46 M40 40 Q47 42 52 46" stroke="#1a1120" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* tyre */}
      <rect x="25" y="70" width="10" height="30" rx="4.5" fill="#050306" />
      <rect x="28.5" y="72" width="3" height="26" rx="1.5" fill="#1a161e" />
      {/* knees and boots out to the pegs */}
      <path d="M21 60 Q14 64 15 72 L13 78 M39 60 Q46 64 45 72 L47 78" stroke="#120c16" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* tank, seat and fender */}
      <path d="M18 58 Q30 52 42 58 L40 68 Q30 72 20 68 Z" fill="url(#mc-body)" />
      <path d="M23 68 Q30 64 37 68 L36 74 H24 Z" fill="#0d0910" />
      {/* exhaust, catching a little light */}
      <path d="M38 70 L44 82" stroke="#3b3444" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M38.6 69.4 L44.2 80.6" stroke="#ff9a6a" strokeOpacity="0.35" strokeWidth="0.8" strokeLinecap="round" />
      {/* rider's back and shoulders */}
      <path d="M18 60 Q16 42 21 36 Q30 31 39 36 Q44 42 42 60 Q30 64 18 60 Z" fill="url(#mc-jacket)" />
      <path d="M21 36 Q30 31 39 36" stroke="#ff8a6a" strokeOpacity="0.4" strokeWidth="1" fill="none" />
      {/* helmet, with the sunset on top */}
      <circle cx="30" cy="25" r="8.5" fill="#1d1323" />
      <path d="M22.5 22 Q30 13.5 37.5 22" stroke="#ff9a6a" strokeOpacity="0.6" strokeWidth="1.4" fill="none" />
      <path d="M26 31 H34" stroke="#0b070e" strokeWidth="2" strokeLinecap="round" />
      {/* tail light and plate */}
      <g filter="url(#mc-glow)">
        <rect x="24.5" y="66" width="11" height="3" rx="1.5" fill="var(--taillight)" />
      </g>
      <rect x="26.5" y="74.5" width="7" height="4" rx="0.6" fill="#cfc6b8" fillOpacity="0.28" />
    </svg>
  );
}

/** Every 30–70s (if the listener hasn't switched it off) a motorcycle comes
 *  up beside us from the left or right, eases into that lane and rides off
 *  over the horizon. It's a flat sprite moved along the lane's path (see
 *  .bike in index.css), so it stays upright instead of being sheared by the
 *  3D road's perspective. */
function Motorcycle() {
  const { settings } = useSettings();
  const [ride, clear] = useRandomEvent(30, 70, settings.motorcycle);
  if (!ride || !settings.motorcycle) return null;
  return (
    <div className="bike-lane">
      <div
        key={ride.id}
        className="bike"
        style={{ '--bike-dir': ride.r < 0.5 ? -1 : 1 } as CSSProperties}
        onAnimationEnd={(e) => {
          if (e.animationName === 'bike-away') clear();
        }}
      >
        <MotorcycleArt />
      </div>
    </div>
  );
}

const SKYLINE_TILES = 4;
const POLE_COUNT = 4;
const POLE_CYCLE_S = 4.8;

export function Windshield() {
  return (
    <div className="relative min-h-[34vh] flex-1 overflow-hidden bg-[var(--cabin)]" aria-hidden>
      {/* Sky */}
      <div className="sky">
        <Stars />
        <ShootingStar />
        <div className="sun-glow" />
        <div className="sun" />
        <Skyline
          layer={FAR}
          className="skyline-far"
          fill="var(--skyline-far)"
          windowFill="var(--window-far)"
        />
        <Skyline
          layer={NEAR}
          className="skyline-near"
          fill="var(--skyline-near)"
          windowFill="var(--window-near)"
        />
      </div>

      {/* Road */}
      <div className="ground">
        <div className="road-plane">
          <div className="road-mark edge" style={{ left: '9%' }} />
          <div className="road-mark edge" style={{ right: '9%' }} />
          <div className="road-mark cats-eye" style={{ left: '10.5%' }} />
          <div className="road-mark cats-eye" style={{ right: '10.5%' }} />
          <div className="road-mark lane-dash" style={{ left: '36.3%' }} />
          <div className="road-mark lane-dash" style={{ right: '36.3%' }} />
          <div className="lead-car-glow" />
          <div className="lead-car">
            <LeadCar />
          </div>
          {Array.from({ length: POLE_COUNT }, (_, i) => (
            <div
              key={i}
              className="pole-track"
              style={{ '--d': `${(-i * POLE_CYCLE_S) / POLE_COUNT}s` } as React.CSSProperties}
            >
              <div className="pole left" />
              <div className="pole right" />
            </div>
          ))}
        </div>
      </div>

      <Motorcycle />
      <div className="horizon-haze" />

      {/* Cabin framing: glare on the glass, A-pillars + headliner, mirror, wheel. */}
      <div className="glass-glare" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pillar" x1="0" x2="1">
            <stop offset="0" stopColor="#030205" />
            <stop offset="1" stopColor="#0d0a12" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          fill="url(#pillar)"
          d="M0 0H100V100H0Z M5 100 L12 12 Q13 5 21 4.4 Q50 2.4 79 4.4 Q87 5 88 12 L95 100 Z"
        />
      </svg>
      <div className="mirror">
        <RearView />
      </div>
    </div>
  );
}
