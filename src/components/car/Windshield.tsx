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

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type RefObject,
} from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useDrivingSpeed } from '@/hooks/useDrivingSpeed';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { SKYLINES, type SkylineLayer } from '@/components/car/skylines';
import { rng } from '@/components/car/skylines-kit';

/** The city chosen in SETUP (skylines.tsx). */
function useCity() {
  const { settings } = useSettings();
  return SKYLINES[settings.skyline] ?? SKYLINES.default;
}

function SkylineTile({ layer, fill, windowFill }: { layer: SkylineLayer; fill: string; windowFill: string }) {
  return (
    <svg viewBox={`0 0 ${layer.width} ${layer.height}`} aria-hidden>
      {layer.art(fill, windowFill)}
    </svg>
  );
}

function Skyline({ layer, className, fill, windowFill }: {
  layer: SkylineLayer;
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
  const city = useCity();
  return (
    <div className="rv">
      <div className="rv-sky">
        <div className="rv-stars" />
        <Skyline layer={city.near} className="rv-skyline" fill="var(--skyline-near)" windowFill="var(--window-near)" />
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

/** A faint streak across the upper sky, every 8–25s, while there are stars
 *  to see (dusk and night). */
function ShootingStar() {
  const { settings } = useSettings();
  const tod = useTimeOfDay();
  const on = settings.shootingStars && (tod === 'dusk' || tod === 'night');
  const [shot, clear] = useRandomEvent(8, 25, on);
  if (!shot || !on) return null;
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

/** A sport bike and rider seen from behind and a little to the left (as a
 *  bike in the right lane looks from our seat). Square on: the wide rear tyre,
 *  the pointed tail with its LED strip, indicators and plate. On the near
 *  side: the painted fairing, exhaust, front wheel, and the rider's leg and
 *  arm. Lit from ahead by the sunset (warm rim light along the top edges);
 *  the tail light glows red on the road. Mirrored for the left lane, where
 *  we see the bike's right side. */
function MotorcycleArt() {
  return (
    <svg viewBox="0 0 120 160" className="block h-full w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="mc-tyre" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#07060a" />
          <stop offset="0.45" stopColor="#24202a" />
          <stop offset="0.55" stopColor="#24202a" />
          <stop offset="1" stopColor="#07060a" />
        </linearGradient>
        <linearGradient id="mc-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a2a3a" />
          <stop offset="0.35" stopColor="#3a1420" />
          <stop offset="1" stopColor="#12070b" />
        </linearGradient>
        <linearGradient id="mc-jacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2c45" />
          <stop offset="0.5" stopColor="#1f1626" />
          <stop offset="1" stopColor="#0f0a13" />
        </linearGradient>
        <linearGradient id="mc-jeans" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#252c40" />
          <stop offset="1" stopColor="#10131d" />
        </linearGradient>
        <radialGradient id="mc-helmet" cx="0.45" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#4a3550" />
          <stop offset="0.6" stopColor="#1c1322" />
          <stop offset="1" stopColor="#0b070e" />
        </radialGradient>
        <linearGradient id="mc-pipe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98a70" />
          <stop offset="0.3" stopColor="#4a4250" />
          <stop offset="1" stopColor="#141118" />
        </linearGradient>
        <radialGradient id="mc-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mc-redspill">
          <stop offset="0" stopColor="var(--taillight)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--taillight)" stopOpacity="0" />
        </radialGradient>
        <filter id="mc-glow" x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* contact shadow and the tail light's glow on the road */}
      <ellipse cx="58" cy="159" rx="40" ry="4" fill="url(#mc-shadow)" />
      <ellipse cx="64" cy="158" rx="22" ry="5" fill="url(#mc-redspill)" />

      {/* front wheel: further away than the rear, so smaller and higher, and
          mostly behind the fairing */}
      <ellipse cx="33" cy="134" rx="4.5" ry="12.5" fill="#08070b" />
      <ellipse cx="33" cy="134" rx="1.8" ry="7" fill="#1c1820" />
      {/* fork leg up to the bars */}
      <path d="M33 124 L25 98" stroke="#2a2530" strokeWidth="2.6" strokeLinecap="round" />

      {/* far-side mirror, past the rider's shoulder */}
      <path d="M95 82 L100 70" stroke="#17121b" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="101.5" cy="68" rx="5" ry="3.3" fill="#0f0b12" />
      <path d="M97.5 66.5 Q101.5 64.4 105.5 66.5" stroke="#ff9a6a" strokeOpacity="0.4" strokeWidth="0.8" fill="none" />

      {/* side fairing and tank (near side), painted */}
      <path
        d="M20 108 Q26 96 42 94 L80 96 Q84 104 80 114 L70 122 Q44 128 26 124 Q18 118 20 108 Z"
        fill="url(#mc-paint)"
      />
      <path d="M22 106 Q28 96 42 94 L80 96" stroke="#ff9a6a" strokeOpacity="0.45" strokeWidth="1" fill="none" />
      <path d="M30 112 Q46 108 66 112" stroke="#8a3a4c" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
      {/* engine block under the fairing */}
      <path d="M30 124 L58 126 L56 136 L34 134 Z" fill="#141118" />
      <path d="M34 128 H54 M35 131 H53" stroke="#3a3440" strokeWidth="0.8" />

      {/* exhaust on this side, catching the sunset on top */}
      <path d="M36 134 Q48 140 58 136 L62 134" stroke="url(#mc-pipe)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="62.5" cy="133.8" rx="2.2" ry="3" fill="#0a090c" />

      {/* rear tyre, square on, with its tread */}
      <rect x="54" y="118" width="20" height="42" rx="9" fill="url(#mc-tyre)" />
      <path d="M64 122 V156" stroke="#3a3540" strokeWidth="1" strokeDasharray="2 2.5" />
      {/* swingarm and hugger */}
      <path d="M52 120 Q64 113 76 120 L74 124 Q64 119 54 124 Z" fill="#17131b" />

      {/* rider's near leg: thigh along the tank, knee in, boot on the peg */}
      <path d="M58 98 Q42 100 34 108" stroke="url(#mc-jeans)" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M34 108 Q36 118 42 126" stroke="url(#mc-jeans)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M38 124 L50 127 Q52 131 48 132 L38 131 Q35 128 38 124 Z" fill="#0c0a0e" />
      <path d="M44 128 H58" stroke="#3a3440" strokeWidth="1.6" strokeLinecap="round" />
      {/* far boot, just showing past the tyre */}
      <path d="M78 126 L86 128 Q87 131 84 132 L77 131 Z" fill="#0c0a0e" />

      {/* tail section over the tyre: pointed, with the LED strip */}
      <path d="M48 100 Q64 94 82 100 L78 110 Q64 116 52 110 Z" fill="url(#mc-paint)" />
      <path d="M49 100 Q64 94 81 100" stroke="#ff9a6a" strokeOpacity="0.5" strokeWidth="0.9" fill="none" />
      <g filter="url(#mc-glow)">
        <path d="M54 104 Q64 107.5 74 104" stroke="var(--taillight)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <rect x="46.5" y="107" width="4" height="2.4" rx="1" fill="#ffad3a" fillOpacity="0.85" />
        <rect x="77.5" y="107" width="4" height="2.4" rx="1" fill="#ffad3a" fillOpacity="0.85" />
      </g>
      <path d="M50.5 108.2 L54 109 M77.5 108.2 L74 109" stroke="#0d0a10" strokeWidth="1.2" />
      {/* plate on its bracket, with a little plate light */}
      <path d="M64 111 V115" stroke="#0d0a10" strokeWidth="2" />
      <rect x="56" y="114.5" width="16" height="9" rx="1" fill="#cfc6b8" fillOpacity="0.32" stroke="#0d0a10" strokeWidth="1" />
      <rect x="59" y="117.5" width="10" height="1.4" fill="#0d0a10" fillOpacity="0.5" />

      {/* rider's back, leaning forward over the tank */}
      <path
        d="M44 98 Q38 80 42 68 Q52 58 66 58 Q82 58 90 68 Q94 80 86 98 Q66 104 44 98 Z"
        fill="url(#mc-jacket)"
      />
      {/* shoulder armour, spine seam, sunset across the shoulders */}
      <ellipse cx="47" cy="70" rx="7" ry="6" fill="#2d2236" />
      <ellipse cx="85" cy="70" rx="7" ry="6" fill="#2a1f33" />
      <path d="M66 62 V98" stroke="#0e0912" strokeWidth="1.2" />
      <path d="M42 68 Q52 58 66 58 Q82 58 90 68" stroke="#ff9a6a" strokeOpacity="0.5" strokeWidth="1.3" fill="none" />

      {/* near arm, bent, out to the grip; glove on the bar */}
      <path d="M44 70 Q32 76 30 86 Q28 92 22 94" stroke="url(#mc-jacket)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M44 70 Q34 74 31 82" stroke="#ff9a6a" strokeOpacity="0.3" strokeWidth="1" fill="none" />
      <ellipse cx="20" cy="95" rx="4.5" ry="3.6" fill="#0d0a10" />
      {/* near mirror on its stalk */}
      <path d="M19 92 L13 78" stroke="#17121b" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="11.5" cy="75.5" rx="6" ry="4" fill="#0f0b12" />
      <path d="M6.5 74 Q11.5 71.3 16.5 74" stroke="#ff9a6a" strokeOpacity="0.45" strokeWidth="0.9" fill="none" />
      {/* far hand just showing at the other grip */}
      <ellipse cx="94" cy="88" rx="3.6" ry="3" fill="#0d0a10" />

      {/* neck and helmet, tucked low between the shoulders */}
      <path d="M58 60 Q66 56 74 60 L72 64 H60 Z" fill="#120c16" />
      <ellipse cx="66" cy="46" rx="14.5" ry="15" fill="url(#mc-helmet)" />
      <path d="M53 41 Q60 30 72 31 Q79 33 80 40" stroke="#ffb08a" strokeOpacity="0.65" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M54 52 Q66 58 78 52" stroke="#0b070e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M62 35 Q66 34 70 35" stroke="#5a4560" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Every 30–70s (if the listener hasn't switched it off) a motorcycle comes
 *  up beside us from the left or right, eases into that lane and rides off
 *  toward the horizon. It rides on the 3D road plane like the car ahead, so
 *  its size at any distance matches the car's; it's stood up to face us
 *  squarely (see .bike), so perspective scales it without shearing it. */
function Motorcycle() {
  const { settings } = useSettings();
  const [ride, clear] = useRandomEvent(30, 70, settings.motorcycle);
  if (!ride || !settings.motorcycle) return null;
  const side = ride.r < 0.5 ? 'left' : 'right';
  return (
    <div key={ride.id} className={`bike-track ${side}`} onAnimationEnd={own(clear)}>
      <div className="bike">
        <div className="bike-lean">
          <MotorcycleArt />
        </div>
      </div>
    </div>
  );
}

const SKYLINE_TILES = 4;
const POLE_COUNT = 4;
const POLE_CYCLE_S = 4.8;

/** The keyframes that make up "driving": lane markings, streetlights and the
 *  skyline, in the windshield and the mirror (index.css). */
const DRIVE_ANIMATIONS = new Set(['road-scroll', 'pole-travel', 'pole-fade', 'skyline-drift', 'rv-road-scroll']);
/** Seconds to cover most of the way to a new speed. */
const SPEED_EASE_S = 1.5;

/** Run the drive at `useDrivingSpeed()`'s pace by setting each animation's
 *  playbackRate (changing a CSS duration would make everything jump; a rate
 *  keeps every element where it is). Eases to a new speed, and re-applies
 *  now and then so elements that remount (a skyline switch) keep the pace. */
function useDrivePace(root: RefObject<HTMLDivElement | null>) {
  const target = useDrivingSpeed();
  const current = useRef(1);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = (rate: number) => {
      for (const a of el.getAnimations({ subtree: true })) {
        if (a instanceof CSSAnimation && DRIVE_ANIMATIONS.has(a.animationName)) a.playbackRate = rate;
      }
    };
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const c = current.current;
      const next = c + (target - c) * Math.min(1, dt / SPEED_EASE_S);
      current.current = Math.abs(next - target) < 0.005 ? target : next;
      apply(current.current);
      if (current.current !== target) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const keep = window.setInterval(() => apply(current.current), 2000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(keep);
    };
  }, [target, root]);
}

export function Windshield() {
  const city = useCity();
  const root = useRef<HTMLDivElement>(null);
  useDrivePace(root);
  return (
    <div ref={root} className="relative min-h-[34vh] flex-1 overflow-hidden bg-[var(--cabin)]" aria-hidden>
      {/* Sky */}
      <div className="sky">
        <Stars />
        <ShootingStar />
        <div className="sun-glow" />
        <div className="sun" />
        <Skyline
          layer={city.far}
          className="skyline-far"
          fill="var(--skyline-far)"
          windowFill="var(--window-far)"
        />
        <Skyline
          layer={city.near}
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
          <Motorcycle />
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
