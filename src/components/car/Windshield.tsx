// The view out the windshield: sunset sky, a drifting city skyline, and a 3D
// road with lane markings and streetlights streaming toward the driver.
// Pure CSS/SVG — every moving part is a keyframe in src/index.css. This
// component reads no station data; it's scenery.

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

const SKYLINE_TILES = 4;
const POLE_COUNT = 4;
const POLE_CYCLE_S = 4.8;

export function Windshield() {
  return (
    <div className="relative min-h-[34vh] flex-1 overflow-hidden bg-[var(--cabin)]" aria-hidden>
      {/* Sky */}
      <div className="sky">
        <div className="stars" />
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
      <div className="mirror" />
    </div>
  );
}
