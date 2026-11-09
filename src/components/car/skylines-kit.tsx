// Shared drawing kit for the skylines (skylines.tsx, skylines-cities.tsx):
// tile types, seeded randomness, filler blocks and lit windows, shape helpers
// that return SVG path data, and `layer()` to build a tile from a short spec.
// Plain functions, not components (fast refresh wants modules that export
// data kept apart from components).

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
export type Win = { x: number; y: number };

/** Lit windows on a grid inside a rectangle, about `density` of them. */
export function windowsIn(r: () => number, x0: number, x1: number, y0: number, y1: number, density: number) {
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
export function windowsArt(list: Win[], fill: string, flicker = false) {
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
export function blocks(seed: number, x0: number, x1: number, height: number, minH: number, maxH: number, density: number) {
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

export function blocksArt(
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


// --- Shape helpers (return SVG path data; y grows downward, `base` is the ground)

/** A stepped skyscraper centred on cx: steps bottom→top as [halfWidth, topY]. */
export function stepped(cx: number, base: number, steps: readonly (readonly [number, number])[]) {
  let d = `M${cx - steps[0][0]} ${base}`;
  steps.forEach(([, top], i) => {
    d += ` V${top}`;
    const next = steps[i + 1];
    d += next ? ` H${cx - next[0]}` : ` H${cx + steps[i][0]}`;
  });
  for (let i = steps.length - 1; i >= 0; i--) {
    const below = i > 0 ? steps[i - 1][1] : base;
    d += ` V${below}`;
    if (i > 0) d += ` H${cx + steps[i - 1][0]}`;
  }
  return d + ' Z';
}

/** A tapering tower: half-widths at the base and at the top. */
export function taper(cx: number, base: number, baseHalf: number, topHalf: number, top: number) {
  return `M${cx - baseHalf} ${base} L${cx - topHalf} ${top} H${cx + topHalf} L${cx + baseHalf} ${base} Z`;
}

/** A thin mast from y `from` up to y `to`. */
export function spire(cx: number, from: number, to: number, w = 1.2) {
  return `M${cx - w / 2} ${from} V${to} H${cx + w / 2} V${from} Z`;
}

export function rect(x: number, y: number, w: number, h: number) {
  return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
}

/** A round-topped dome sitting on y, peaking `h` above it. */
export function dome(cx: number, y: number, half: number, h: number) {
  return `M${cx - half} ${y} Q ${cx} ${y - 2 * h} ${cx + half} ${y} Z`;
}

/** An onion dome sitting on y, its point `h` above it. */
export function onion(cx: number, y: number, half: number, h: number) {
  return (
    `M${cx - half} ${y} C ${cx - half * 1.35} ${y - h * 0.5}, ${cx - half * 0.3} ${y - h * 0.72}, ${cx} ${y - h}` +
    ` C ${cx + half * 0.3} ${y - h * 0.72}, ${cx + half * 1.35} ${y - h * 0.5}, ${cx + half} ${y} Z`
  );
}

/** A circle (for evenodd holes, heads, …). */
export function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/** A five-pointed star. */
export function star(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)} `;
  }
  return d + 'Z';
}

/** A pagoda: `tiers` storeys with flared eaves, narrowing upward, a finial. */
export function pagoda(cx: number, base: number, tiers: number, width: number, tierH: number) {
  let d = '';
  for (let i = 0; i < tiers; i++) {
    const w = width * (1 - i * 0.13);
    const y = base - i * tierH;
    const body = w * 0.32;
    d += `${rect(cx - body, y - tierH + 3, body * 2, tierH - 3)} `;
    d += `M${cx - w / 2} ${y - tierH + 4} Q ${cx - w * 0.3} ${y - tierH + 1} ${cx - w * 0.24} ${y - tierH} H${cx + w * 0.24} Q ${cx + w * 0.3} ${y - tierH + 1} ${cx + w / 2} ${y - tierH + 4} Z `;
  }
  return d + spire(cx, base - tiers * tierH, base - tiers * tierH - 9, 1.4);
}

/** A palm tree as strokes: [path, width] pairs. */
export function palm(x: number, base: number, h: number): Stroke[] {
  const tx = x + 2;
  const ty = base - h;
  return [
    [`M${x} ${base} Q ${x + 3} ${base - h / 2} ${tx} ${ty}`, 1.6],
    [`M${tx} ${ty} Q ${tx - 6} ${ty - 3} ${tx - 11} ${ty + 3}`, 1],
    [`M${tx} ${ty} Q ${tx + 6} ${ty - 3} ${tx + 11} ${ty + 3}`, 1],
    [`M${tx} ${ty} Q ${tx - 3} ${ty - 6} ${tx - 7} ${ty - 5}`, 1],
    [`M${tx} ${ty} Q ${tx + 3} ${ty - 6} ${tx + 7} ${ty - 5}`, 1],
  ];
}

// --- Building a layer from a spec ---------------------------------------------

export type Stroke = readonly [d: string, width: number];

export interface LayerSpec {
  height: number;
  /** Low-rise filler across the tile: [seed, minH, maxH, window density]. */
  filler: readonly [number, number, number, number];
  /** Plain rectangular towers, each with lit windows. */
  towers?: readonly { x: number; w: number; h: number }[];
  /** Landmark shapes, as path data, one per shape (evenodd inside a shape,
   *  so a subpath inside it is a hole). */
  shapes: readonly string[];
  /** Line work: cables, palm fronds, ramps. */
  strokes?: readonly Stroke[];
  /** Extra lit windows (on landmarks). */
  lights?: readonly Win[];
  /** Seed for the towers' windows. */
  seed?: number;
}

/** Build a tile from a spec: filler, towers with windows, landmarks, lines. */
export function layer(spec: LayerSpec): SkylineLayer {
  const { height } = spec;
  const [seed, minH, maxH, density] = spec.filler;
  const filler = blocks(seed, 0, TILE_WIDTH, height, minH, maxH, density);
  const r = rng(spec.seed ?? seed + 1);
  const towers = (spec.towers ?? []).map((t) => ({
    ...t,
    windows: windowsIn(r, t.x + 3, t.x + t.w - 2, height - t.h + 6, height - 6, 0.25),
  }));
  return {
    width: TILE_WIDTH,
    height,
    art: (fill, windowFill) => (
      <>
        {blocksArt(filler, height, fill, windowFill, false)}
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={height - t.h} width={t.w} height={t.h} fill={fill} />
            {windowsArt(t.windows, windowFill, i % 2 === 0)}
          </g>
        ))}
        {/* One path per shape: evenodd within a shape makes its holes, but
            across shapes it would punch holes where two overlap. */}
        {spec.shapes.map((d, i) => (
          <path key={i} d={d} fill={fill} fillRule="evenodd" />
        ))}
        {spec.strokes && (
          <g stroke={fill} fill="none" strokeLinecap="round">
            {spec.strokes.map(([d, w], i) => (
              <path key={i} d={d} strokeWidth={w} />
            ))}
          </g>
        )}
        {spec.lights && windowsArt([...spec.lights], windowFill)}
      </>
    ),
  };
}
