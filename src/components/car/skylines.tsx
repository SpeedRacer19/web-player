// The city on the horizon. Each skyline is two layers of SVG art, a FAR one
// (taller, hazier) and a NEAR one, each a 1200-unit-wide tile: the windshield
// repeats tiles side by side and drifts them (index.css .skyline), so a tile's
// two edges must meet cleanly. Shapes fill with the scene's skyline colours
// and windows with its window colours, so time of day applies to every city.
//
// Add a city: draw a far and a near tile here (landmarks as paths, with
// `filler()` low-rise around them), add it to SKYLINES, and to the skyline
// choice in src/lib/settings.ts. Draw from reference, don't trace someone
// else's artwork.

import type { ReactNode } from 'react';

/** Deterministic pseudo-random, so a skyline is the same on every render. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const TILE_WIDTH = 1200;

export interface SkylineLayer {
  width: number;
  height: number;
  /** The tile's contents. `fill` is the silhouette colour, `windowFill` the
   *  lit-window colour (both CSS colours, usually var(--…)). */
  art: (fill: string, windowFill: string) => ReactNode;
}

export interface SkylineDef {
  name: string;
  far: SkylineLayer;
  near: SkylineLayer;
}

// --- Shared pieces -----------------------------------------------------------

interface Box {
  x: number;
  w: number;
  h: number;
}
type Win = { x: number; y: number };

/** Lit windows on a grid inside a rectangle, about `density` of them. */
function windowsIn(r: () => number, x0: number, x1: number, y0: number, y1: number, density: number) {
  const out: Win[] = [];
  for (let wy = y0; wy < y1; wy += 7) {
    for (let wx = x0; wx < x1 - 2; wx += 6) {
      if (r() < density) out.push({ x: wx, y: wy });
    }
  }
  return out;
}

/** A group of windows. `.windows` follows the time of day (--windows);
 *  `.win` flickers, so it goes on an inner group. (Plain functions, not
 *  components: this module exports data, which fast refresh wants kept
 *  apart from components.) */
function windowsArt(list: Win[], fill: string, flicker = false) {
  return (
    <g className="windows">
      <g className={flicker ? 'win' : undefined}>
        {list.map((w, j) => (
          <rect key={j} x={w.x} y={w.y} width={2.5} height={3} fill={fill} />
        ))}
      </g>
    </g>
  );
}

/** A run of plain rectangular buildings from x0 to x1, heights between minH
 *  and maxH, with lit windows. The last one ends exactly on x1. */
function blocks(seed: number, x0: number, x1: number, height: number, minH: number, maxH: number, density: number) {
  const r = rng(seed);
  const out: (Box & { windows: Win[] })[] = [];
  let x = x0;
  while (x < x1) {
    let w = 18 + Math.floor(r() * 46);
    if (x1 - x - w < 18) w = x1 - x;
    const h = minH + Math.floor(r() * (maxH - minH));
    out.push({ x, w, h, windows: windowsIn(r, x + 4, x + w - 3, height - h + 6, height - 6, density) });
    x += w + (x + w >= x1 ? 0 : Math.floor(r() * 6));
  }
  return out;
}

function blocksArt(
  list: ReturnType<typeof blocks>,
  height: number,
  fill: string,
  windowFill: string,
  antennas = true,
) {
  return (
    <>
      {list.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={height - b.h} width={b.w} height={b.h} fill={fill} />
          {antennas && i % 5 === 0 && (
            <rect x={b.x + b.w / 2} y={height - b.h - 10} width={1.5} height={10} fill={fill} />
          )}
          {windowsArt(b.windows, windowFill, i % 3 === 0)}
        </g>
      ))}
    </>
  );
}

// --- Default: the generated city ---------------------------------------------

const GEN_FAR = blocks(7, 0, TILE_WIDTH, 110, 30, 110, 0.12);
const GEN_NEAR = blocks(42, 0, TILE_WIDTH, 80, 14, 80, 0.2);

const generated: SkylineDef = {
  name: 'Default',
  far: {
    width: TILE_WIDTH,
    height: 110,
    art: (fill, windowFill) => blocksArt(GEN_FAR, 110, fill, windowFill),
  },
  near: {
    width: TILE_WIDTH,
    height: 80,
    art: (fill, windowFill) => blocksArt(GEN_NEAR, 80, fill, windowFill),
  },
};

// --- Guangzhou ------------------------------------------------------------------
// Drawn from reference, not traced. FAR: Canton Tower (slim-waisted lattice
// tower with its mast), the Guangzhou IFC (West Tower) and the CTF Finance
// Centre (East Tower) among the Zhujiang New Town towers. NEAR: the Guangzhou
// Circle, the Haixin Bridge arch, the Opera House pebbles and a tiered
// pagoda, among low-rise blocks.

const GZ_FAR_FILL = blocks(311, 0, TILE_WIDTH, 110, 22, 62, 0.12);
const GZ_NEAR_FILL = blocks(522, 0, TILE_WIDTH, 80, 10, 34, 0.18);
const gzr = rng(88);
// Windows on the two finance towers and the taller Zhujiang towers.
const GZ_IFC_WINDOWS = windowsIn(gzr, 633, 650, 30, 104, 0.35);
const GZ_CTF_WINDOWS = windowsIn(gzr, 704, 723, 26, 104, 0.35);
const GZ_TOWERS = [
  { x: 560, w: 20, h: 72 },
  { x: 586, w: 16, h: 64 },
  { x: 760, w: 22, h: 76 },
  { x: 788, w: 18, h: 66 },
  { x: 900, w: 24, h: 70 },
  { x: 110, w: 20, h: 68 },
];
const GZ_TOWER_WINDOWS = GZ_TOWERS.map((t) => windowsIn(gzr, t.x + 3, t.x + t.w - 2, 110 - t.h + 6, 104, 0.25));
// Canton Tower's lights: rings up its lattice.
const CANTON_LIGHTS: Win[] = [];
for (let y = 30; y < 106; y += 8) {
  // Narrowest at the waist (y≈46), widening toward the base and the deck.
  const half = y < 46 ? 5.5 + ((46 - y) / 22) * 2 : 5.5 + ((y - 46) / 64) * 15;
  for (let x = 300 - half + 1.5; x < 300 + half - 3; x += 4) CANTON_LIGHTS.push({ x, y });
}

const guangzhou: SkylineDef = {
  name: 'Guangzhou',
  far: {
    width: TILE_WIDTH,
    height: 110,
    art: (fill, windowFill) => (
      <>
        {blocksArt(GZ_FAR_FILL, 110, fill, windowFill, false)}
        {GZ_TOWERS.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={110 - t.h} width={t.w} height={t.h} fill={fill} />
            {windowsArt(GZ_TOWER_WINDOWS[i], windowFill, i % 2 === 0)}
          </g>
        ))}
        {/* Canton Tower: wide at the base, pinched waist high up, a slight
            flare to the top deck, then the mast. */}
        <path
          d="M278 110 C 288 80, 293 58, 294.5 46 C 295.5 36, 292 29, 291.5 24 L 293 20 H 307 L 308.5 24 C 308 29, 304.5 36, 305.5 46 C 307 58, 312 80, 322 110 Z"
          fill={fill}
        />
        <rect x={298.8} y={0} width={2.4} height={20} fill={fill} />
        {windowsArt(CANTON_LIGHTS, windowFill)}
        {/* Guangzhou IFC (West Tower): tall, slightly swelling sides, flat top. */}
        <path d="M629 110 L 630 30 Q 640 21 652 30 L 653 110 Z" fill={fill} />
        {windowsArt(GZ_IFC_WINDOWS, windowFill)}
        {/* CTF Finance Centre (East Tower): stepped setbacks to a crown. */}
        <path
          d="M700 110 V 44 H 702 V 32 H 705 V 22 H 709 V 14 H 711 V 8 H 715 V 14 H 717 V 22 H 721 V 32 H 724 V 44 H 726 V 110 Z"
          fill={fill}
        />
        {windowsArt(GZ_CTF_WINDOWS, windowFill)}
      </>
    ),
  },
  near: {
    width: TILE_WIDTH,
    height: 80,
    art: (fill, windowFill) => (
      <>
        {blocksArt(GZ_NEAR_FILL, 80, fill, windowFill, false)}
        {/* Guangzhou Circle: a disc with a big hole, on a short base. */}
        <path
          fillRule="evenodd"
          d="M176 80 V 74 H 224 V 80 Z M200 18 A 27 27 0 1 1 199.99 18 Z M200 31 A 11 11 0 1 0 200.01 31 Z"
          fill={fill}
        />
        {/* Haixin Bridge: a tall pointed arch over the deck, with cables. */}
        <path
          fillRule="evenodd"
          d="M466 80 Q 469 30 480 8 Q 491 30 494 80 Z M471 80 Q 473 40 480 22 Q 487 40 489 80 Z"
          fill={fill}
        />
        <rect x={380} y={64} width={200} height={3} fill={fill} />
        <g stroke={fill} strokeWidth={0.7}>
          {[396, 414, 432, 450].map((x) => (
            <line key={x} x1={473} y1={30} x2={x} y2={64} />
          ))}
          {[510, 528, 546, 564].map((x) => (
            <line key={x} x1={487} y1={30} x2={x} y2={64} />
          ))}
        </g>
        {/* Guangzhou Opera House: two low "pebbles". */}
        <path d="M776 80 Q 786 50 818 54 Q 846 57 854 80 Z" fill={fill} />
        <path d="M852 80 Q 862 62 880 66 Q 890 70 892 80 Z" fill={fill} />
        {/* A tiered pagoda: stacked storeys with flared eaves, and a finial. */}
        <path
          d="M1040 80 V 70 H 1036 L 1042 66 H 1058 L 1064 70 H 1060 V 80 Z
             M1043 66 V 58 H 1039 L 1044 54 H 1056 L 1061 58 H 1057 V 66 Z
             M1045 54 V 47 H 1042 L 1046 43 H 1054 L 1058 47 H 1055 V 54 Z
             M1046 43 V 37 H 1044 L 1047 33 H 1053 L 1056 37 H 1054 V 43 Z
             M1047 33 V 28 H 1045.5 L 1048 25 H 1052 L 1054.5 28 H 1053 V 33 Z
             M1049.2 25 V 16 H 1050.8 V 25 Z"
          fill={fill}
        />
      </>
    ),
  },
};

export type SkylineId = 'default' | 'guangzhou';

export const SKYLINES: Record<SkylineId, SkylineDef> = {
  default: generated,
  guangzhou,
};
