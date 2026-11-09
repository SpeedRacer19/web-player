// The city on the horizon. Each skyline is two layers of SVG art, a FAR one
// (taller, hazier) and a NEAR one, each a 1200-unit-wide tile: the windshield
// repeats tiles side by side and drifts them (index.css .skyline), so a tile's
// two edges must meet cleanly. Shapes fill with the scene's skyline colours
// and windows with its window colours, so time of day applies to every city.
//
// Add a city: describe a far and a near tile with `layer()` from
// skylines-kit.tsx (filler low-rise, towers, landmark shapes built with its
// helpers) in skylines-cities.tsx, add it to CITIES there, and its id to
// SKYLINE_CHOICES in src/lib/settings.ts; its name shows in SETUP. Draw from
// reference, don't trace someone else's artwork.

import {
  TILE_WIDTH,
  blocks,
  blocksArt,
  rng,
  windowsArt,
  windowsIn,
  type SkylineDef,
  type Win,
} from '@/components/car/skylines-kit';
import { CITIES } from '@/components/car/skylines-cities';

export type { SkylineLayer } from '@/components/car/skylines-kit';

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

// --- Delhi ------------------------------------------------------------------------
// Drawn from reference, not traced. Delhi is low-rise, so its skyline is its
// monuments. FAR: Qutub Minar (tapering, with its balcony rings and cupola),
// Humayun's Tomb (bulbous dome on a drum, chhatris, arched platform), and the
// newer high-rises on the city's edge. NEAR: India Gate, the Lotus Temple,
// Jama Masjid (three onion domes between two minarets) and the Red Fort's
// Lahori Gate, among low-rise blocks.

const DL_FAR_FILL = blocks(613, 0, TILE_WIDTH, 110, 16, 44, 0.12);
const DL_NEAR_FILL = blocks(744, 0, TILE_WIDTH, 80, 8, 24, 0.16);
const dlr = rng(207);
const DL_TOWERS = [
  { x: 60, w: 18, h: 64 },
  { x: 84, w: 14, h: 56 },
  { x: 930, w: 20, h: 72 },
  { x: 956, w: 16, h: 60 },
  { x: 1000, w: 22, h: 78 },
  { x: 1030, w: 18, h: 66 },
];
const DL_TOWER_WINDOWS = DL_TOWERS.map((t) => windowsIn(dlr, t.x + 3, t.x + t.w - 2, 110 - t.h + 6, 104, 0.25));
// Qutub Minar's balcony rings: [y, half-width of the shaft there].
const QUTUB_RINGS = [86, 66, 48, 32, 20].map((y) => [y, 4.5 + ((y - 12) / 98) * 6.5] as const);

const delhi: SkylineDef = {
  name: 'Delhi',
  far: {
    width: TILE_WIDTH,
    height: 110,
    art: (fill, windowFill) => (
      <>
        {blocksArt(DL_FAR_FILL, 110, fill, windowFill, false)}
        {DL_TOWERS.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={110 - t.h} width={t.w} height={t.h} fill={fill} />
            {windowsArt(DL_TOWER_WINDOWS[i], windowFill, i % 2 === 0)}
          </g>
        ))}
        {/* Qutub Minar: a tapering shaft, balcony rings, a small cupola. */}
        <path d="M319 110 L 325.5 12 H 334.5 L 341 110 Z" fill={fill} />
        {QUTUB_RINGS.map(([y, half]) => (
          <rect key={y} x={330 - half - 2} y={y} width={2 * half + 4} height={2.6} rx={0.8} fill={fill} />
        ))}
        <path d="M326.5 12 Q 330 4 333.5 12 Z" fill={fill} />
        <rect x={329.5} y={1} width={1} height={5} fill={fill} />
        {/* Humayun's Tomb: arched platform, the hall with its great arch,
            a drum and the bulbous dome with its finial, chhatris either side. */}
        <path
          fillRule="evenodd"
          d="M536 110 V 92 H 664 V 110 Z
             M544 110 V 101 Q 548 96 552 101 V 110 Z M560 110 V 101 Q 564 96 568 101 V 110 Z
             M576 110 V 101 Q 580 96 584 101 V 110 Z M616 110 V 101 Q 620 96 624 101 V 110 Z
             M632 110 V 101 Q 636 96 640 101 V 110 Z M648 110 V 101 Q 652 96 656 101 V 110 Z"
          fill={fill}
        />
        <path
          fillRule="evenodd"
          d="M566 92 V 64 H 634 V 92 Z M592 92 V 76 Q 600 66 608 76 V 92 Z"
          fill={fill}
        />
        <rect x={583} y={54} width={34} height={11} fill={fill} />
        <path d="M581 55 C 578 38, 590 28, 600 26 C 610 28, 622 38, 619 55 Z" fill={fill} />
        <rect x={599.4} y={14} width={1.2} height={13} fill={fill} />
        <circle cx={600} cy={17} r={1.6} fill={fill} />
        {[572, 628].map((x) => (
          <g key={x}>
            <rect x={x - 5} y={56} width={10} height={8} fill={fill} />
            <path d={`M${x - 6} 57 Q ${x} 47 ${x + 6} 57 Z`} fill={fill} />
          </g>
        ))}
      </>
    ),
  },
  near: {
    width: TILE_WIDTH,
    height: 80,
    art: (fill, windowFill) => (
      <>
        {blocksArt(DL_NEAR_FILL, 80, fill, windowFill, false)}
        {/* India Gate: the arch, cornice, stepped attic and the shallow bowl. */}
        <path
          fillRule="evenodd"
          d="M156 80 V 30 H 204 V 80 Z M168 80 V 48 A 12 12 0 0 1 192 48 V 80 Z"
          fill={fill}
        />
        <rect x={151} y={26} width={58} height={4} fill={fill} />
        <rect x={161} y={18} width={38} height={8} fill={fill} />
        <path d="M171 18 Q 180 10 189 18 Z" fill={fill} />
        {/* Lotus Temple: tiers of pointed petals on a low base. */}
        <rect x={418} y={74} width={104} height={6} fill={fill} />
        <path
          d="M462 74 Q 465 42 470 28 Q 475 42 478 74 Z
             M444 74 Q 450 52 467 38 Q 459 56 462 74 Z
             M496 74 Q 490 52 473 38 Q 481 56 478 74 Z
             M426 74 Q 434 58 452 52 Q 445 64 446 74 Z
             M514 74 Q 506 58 488 52 Q 495 64 494 74 Z"
          fill={fill}
        />
        {/* Jama Masjid: three onion domes on the prayer hall, two minarets. */}
        <rect x={714} y={60} width={92} height={20} fill={fill} />
        <path d="M746 61 C 742 49, 752 42, 760 32 C 768 42, 778 49, 774 61 Z" fill={fill} />
        <path d="M724 61 C 721 53, 728 48, 734 42 C 740 48, 747 53, 744 61 Z" fill={fill} />
        <path d="M776 61 C 773 53, 780 48, 786 42 C 792 48, 799 53, 796 61 Z" fill={fill} />
        {[760, 734, 786].map((x, i) => (
          <rect key={x} x={x - 0.5} y={i === 0 ? 25 : 37} width={1} height={i === 0 ? 8 : 6} fill={fill} />
        ))}
        {[705, 815].map((x) => (
          <g key={x}>
            <rect x={x - 2.5} y={22} width={5} height={58} fill={fill} />
            <rect x={x - 4} y={44} width={8} height={2} fill={fill} />
            <rect x={x - 4} y={30} width={8} height={2} fill={fill} />
            <path d={`M${x - 4} 22 Q ${x} 14 ${x + 4} 22 Z`} fill={fill} />
          </g>
        ))}
        {/* Red Fort, Lahori Gate: crenellated wall, the gate with its arch,
            octagonal towers and a row of small chhatris on top. */}
        <path
          d="M936 80 V 56 H 939 V 53 H 943 V 56 H 948 V 53 H 952 V 56 H 957 V 53 H 961 V 56 H 966 V 53 H 970 V 56 H 976 V 80 Z
             M1024 80 V 56 H 1030 V 53 H 1034 V 56 H 1039 V 53 H 1043 V 56 H 1048 V 53 H 1052 V 56 H 1057 V 53 H 1061 V 56 H 1064 V 80 Z"
          fill={fill}
        />
        <path
          fillRule="evenodd"
          d="M984 80 V 40 H 1016 V 80 Z M993 80 V 62 Q 1000 52 1007 62 V 80 Z"
          fill={fill}
        />
        {[980, 1020].map((x) => (
          <g key={x}>
            <rect x={x - 4} y={44} width={8} height={36} fill={fill} />
            <path d={`M${x - 5} 45 Q ${x} 36 ${x + 5} 45 Z`} fill={fill} />
          </g>
        ))}
        {[991, 1000, 1009].map((x) => (
          <path key={x} d={`M${x - 3.5} 41 V 37 Q ${x} 31 ${x + 3.5} 37 V 41 Z`} fill={fill} />
        ))}
      </>
    ),
  },
};

export const SKYLINES = {
  default: generated,
  guangzhou,
  delhi,
  ...CITIES,
} satisfies Record<string, SkylineDef>;

export type SkylineId = keyof typeof SKYLINES;
