// More city skylines, built with the drawing kit (skylines-kit.tsx). Each is
// a FAR tile (height 110: towers, mountains, the tallest landmarks) and a
// NEAR tile (height 80: lower landmarks among low-rise). All drawn from
// reference, not traced. Coordinates: y grows downward; FAR's ground is 110,
// NEAR's is 80; tiles are 1200 wide.

import {
  circle,
  dome,
  layer,
  onion,
  pagoda,
  palm,
  rect,
  spire,
  star,
  stepped,
  taper,
  type SkylineDef,
} from '@/components/car/skylines-kit';

const F = 110; // far ground
const N = 80; // near ground

// --- Kinshasa, DR Congo ----------------------------------------------------------
const kinshasa: SkylineDef = {
  name: 'Kinshasa',
  far: layer({
    height: F,
    filler: [101, 16, 46, 0.12],
    towers: [
      { x: 520, w: 20, h: 64 },
      { x: 546, w: 16, h: 54 },
      { x: 880, w: 24, h: 70 },
      { x: 910, w: 18, h: 58 },
    ],
    shapes: [
      // Tour de l'Échangeur (Limete Tower): a concrete shaft, flared crown.
      taper(300, F, 5, 3.5, 24),
      'M296.5 24 L293 14 H307 L303.5 24 Z',
      rect(293, 10, 14, 4),
      spire(300, 10, 0),
      // Fleuve Congo Hotel: a tall slab with a curved top.
      'M688 110 V30 Q 700 22 712 30 V110 Z',
      // A stepped office tower.
      stepped(760, F, [
        [12, 52],
        [9, 40],
        [6, 34],
      ]),
    ],
  }),
  near: layer({
    height: N,
    filler: [202, 8, 24, 0.16],
    shapes: [
      // Patrice Lumumba monument: the figure, arm raised, on a tall pedestal.
      rect(170, 70, 20, 10),
      rect(176, 40, 8, 30),
      'M178 40 V28 H182 V40 Z',
      circle(180, 24.5, 2.4),
      'M181.5 29 L186.5 19 L187.8 19.8 L183.2 30 Z',
      // Notre-Dame du Congo: the nave and its spire.
      rect(450, 56, 60, 24),
      rect(474, 34, 12, 22),
      'M474 34 L480 12 L486 34 Z',
    ],
    strokes: [...palm(620, N, 26), ...palm(646, N, 20), ...palm(900, N, 24), ...palm(1110, N, 22)],
  }),
};

// --- Jakarta, Indonesia ---------------------------------------------------------
const jakarta: SkylineDef = {
  name: 'Jakarta',
  far: layer({
    height: F,
    filler: [303, 18, 50, 0.12],
    towers: [
      { x: 120, w: 18, h: 66 },
      { x: 144, w: 20, h: 58 },
      { x: 940, w: 20, h: 72 },
      { x: 966, w: 18, h: 62 },
      { x: 1060, w: 22, h: 68 },
    ],
    shapes: [
      // Autograph Tower: stepped, tapering, with a mast.
      stepped(640, F, [
        [13, 40],
        [11, 28],
        [8, 20],
        [5, 14],
      ]),
      spire(640, 14, 0, 1.4),
      // Wisma 46: the fountain-pen nib top.
      'M710 110 V36 L716 24 Q 720 14 724 24 L730 36 V110 Z',
      // Gama Tower: a slab with a sloping top.
      'M770 110 V34 L790 26 V110 Z',
    ],
  }),
  near: layer({
    height: N,
    filler: [404, 8, 24, 0.16],
    shapes: [
      // Monas: the platform, the cup, the obelisk and its flame.
      rect(236, 74, 48, 6),
      'M244 74 L250 66 H270 L276 74 Z',
      taper(260, 66, 4, 2.5, 16),
      'M257 16 Q 258 9 260 5 Q 262 9 263 16 Z',
      // Istiqlal Mosque: the great dome on its hall, one minaret.
      rect(560, 58, 80, 22),
      dome(600, 58, 24, 16),
      spire(600, 42, 32, 1),
      rect(657, 20, 6, 60),
      'M656 20 L660 11 L664 20 Z',
      // Jakarta Cathedral: twin neo-gothic spires.
      rect(880, 56, 40, 24),
      rect(882, 36, 8, 20),
      'M882 36 L886 16 L890 36 Z',
      rect(910, 36, 8, 20),
      'M910 36 L914 16 L918 36 Z',
    ],
  }),
};

// --- Dhaka, Bangladesh ------------------------------------------------------------
const dhaka: SkylineDef = {
  name: 'Dhaka',
  far: layer({
    height: F,
    filler: [505, 16, 44, 0.12],
    towers: [
      { x: 80, w: 20, h: 62 },
      { x: 820, w: 22, h: 74 },
      { x: 848, w: 18, h: 60 },
      { x: 1000, w: 20, h: 66 },
    ],
    shapes: [
      // City Centre Dhaka: stepped top and a mast.
      stepped(760, F, [
        [11, 34],
        [8, 24],
      ]),
      spire(760, 24, 12),
      // National Martyrs' Memorial: nested triangular prisms, tallest centre.
      'M346 110 L360 18 L374 110 Z',
      'M336 110 L352 50 L362 110 Z',
      'M384 110 L368 50 L358 110 Z',
      'M326 110 L344 74 L352 110 Z',
      'M394 110 L376 74 L368 110 Z',
    ],
  }),
  near: layer({
    height: N,
    filler: [606, 8, 22, 0.16],
    shapes: [
      // National Parliament House (Louis Kahn): a massive block with circular
      // and slot openings.
      `M380 80 V40 H394 V32 H446 V40 H460 V80 Z ${circle(392, 58, 6)} ${circle(448, 58, 6)} ${circle(420, 50, 7)} ${rect(412, 68, 16, 12)}`,
      // Shaheed Minar: the tall bowed centre frame and two frames each side.
      rect(706, 76, 108, 4),
      'M748 80 V24 Q 760 18 772 24 V80 Z M752 80 V28 Q 760 23 768 28 V80 Z',
      `${rect(728, 44, 12, 36)} ${rect(731, 47, 6, 33)}`,
      `${rect(714, 54, 10, 26)} ${rect(717, 57, 4, 23)}`,
      `${rect(780, 44, 12, 36)} ${rect(783, 47, 6, 33)}`,
      `${rect(796, 54, 10, 26)} ${rect(799, 57, 4, 23)}`,
      // Baitul Mukarram: the cube-shaped national mosque.
      rect(1036, 50, 28, 30),
    ],
  }),
};

// --- Mexico City, Mexico ---------------------------------------------------------
const mexicoCity: SkylineDef = {
  name: 'Mexico City',
  far: layer({
    height: F,
    filler: [707, 18, 46, 0.12],
    towers: [
      { x: 900, w: 20, h: 66 },
      { x: 960, w: 18, h: 60 },
    ],
    shapes: [
      // Popocatépetl, far behind the city.
      'M20 110 L120 62 Q 135 56 150 62 L260 110 Z',
      // Torre Latinoamericana: setbacks and a mast.
      stepped(420, F, [
        [9, 40],
        [7, 30],
        [5, 24],
      ]),
      spire(420, 24, 6),
      // Torre Reforma: a sheer tower with a sloping crown.
      'M550 110 V22 L556 18 H570 V110 Z',
      // Torre BBVA.
      rect(610, 26, 22, 84),
      // Torre Mayor: a curved face.
      'M670 110 V28 Q 682 22 692 30 V110 Z',
    ],
  }),
  near: layer({
    height: N,
    filler: [808, 8, 22, 0.16],
    shapes: [
      // Angel of Independence: column, capital, the winged angel.
      rect(290, 70, 20, 10),
      rect(297, 24, 6, 46),
      rect(295, 21, 10, 3),
      'M298 21 L300 11 L302 21 Z',
      'M300 15 L291 9 L298 16.5 Z M300 15 L309 9 L302 16.5 Z',
      // Palacio de Bellas Artes: the hall, central dome with lantern, side domes.
      rect(570, 56, 60, 24),
      dome(600, 56, 14, 14),
      spire(600, 43, 36, 1.4),
      dome(578, 56, 6, 6),
      dome(622, 56, 6, 6),
      // Metropolitan Cathedral: twin bell towers and the dome.
      rect(830, 52, 60, 28),
      rect(830, 30, 12, 22),
      'M830 30 Q 836 19 842 30 Z',
      rect(878, 30, 12, 22),
      'M878 30 Q 884 19 890 30 Z',
      dome(860, 52, 10, 10),
    ],
  }),
};

// --- Seoul, South Korea ----------------------------------------------------------
const seoul: SkylineDef = {
  name: 'Seoul',
  far: layer({
    height: F,
    filler: [909, 18, 46, 0.12],
    towers: [
      { x: 520, w: 18, h: 64 },
      { x: 544, w: 20, h: 56 },
      { x: 980, w: 20, h: 62 },
    ],
    shapes: [
      // Namsan with N Seoul Tower on top.
      'M200 110 Q 300 70 400 110 Z',
      'M298 92 V40 H302 V92 Z',
      'M293.5 47 Q 300 38 306.5 47 V51 H293.5 Z',
      spire(300, 40, 10, 1),
      // Lotte World Tower: a smooth taper to a point.
      'M748 110 Q 750 50 758 14 L760 4 L762 14 Q 770 50 772 110 Z',
      // 63 Building: the golden tower with its sloping top.
      'M850 110 V42 Q 858 30 872 26 V110 Z',
    ],
  }),
  near: layer({
    height: N,
    filler: [1010, 8, 22, 0.16],
    shapes: [
      // Namdaemun: stone base with its arch, the pavilion and two curved roofs.
      'M176 80 V62 H224 V80 Z M194 80 V70 Q 200 63 206 70 V80 Z',
      rect(184, 50, 32, 12),
      'M170 54 Q 180 48 186 46 H214 Q 220 48 230 54 Q 220 51 200 51 Q 180 51 170 54 Z',
      rect(189, 41, 22, 5),
      'M178 44 Q 188 38 192 36 H208 Q 212 38 222 44 Q 212 41 200 41 Q 188 41 178 44 Z',
      // Dongdaemun Design Plaza: the long curving form.
      'M500 80 Q 510 56 560 54 Q 610 52 624 80 Z',
      // A Han River bridge deck.
      rect(820, 66, 180, 3),
    ],
    strokes: [
      ['M820 66 Q 850 50 880 66', 1.2],
      ['M880 66 Q 910 50 940 66', 1.2],
      ['M940 66 Q 970 50 1000 66', 1.2],
    ],
  }),
};

// --- Cairo, Egypt ----------------------------------------------------------------
const cairo: SkylineDef = {
  name: 'Cairo',
  far: layer({
    height: F,
    filler: [111, 14, 40, 0.12],
    towers: [
      { x: 900, w: 18, h: 56 },
      { x: 924, w: 16, h: 48 },
    ],
    shapes: [
      // The pyramids of Giza, on the horizon.
      'M100 110 L170 52 L240 110 Z',
      'M200 110 L262 58 L324 110 Z',
      'M300 110 L330 84 L360 110 Z',
      // Cairo Tower: a slim lattice shaft opening to its lotus top.
      'M614 110 Q 616 60 615 30 L612 24 H628 L625 30 Q 624 60 626 110 Z',
      spire(620, 24, 10),
      // The Citadel and the Muhammad Ali Mosque: dome, half-domes, two
      // pencil minarets.
      'M700 110 Q 780 86 860 110 Z',
      rect(760, 80, 40, 14),
      dome(780, 80, 14, 14),
      dome(766, 82, 5, 5),
      dome(794, 82, 5, 5),
      rect(753, 30, 3, 52),
      'M752 30 L754.5 19 L757 30 Z',
      rect(804, 30, 3, 52),
      'M803 30 L805.5 19 L808 30 Z',
    ],
  }),
  near: layer({
    height: N,
    filler: [212, 8, 22, 0.16],
    shapes: [
      // A minaret of Islamic Cairo, and a mosque dome.
      stepped(300, N, [
        [4, 40],
        [3, 30],
        [2, 22],
      ]),
      onion(300, 22, 3, 7),
      rect(318, 60, 24, 20),
      dome(330, 60, 12, 12),
      // Feluccas on the Nile.
      'M584 80 Q 600 83 616 80 Z',
      'M598 78 L600 46 L616 76 Z',
      'M684 80 Q 696 82.5 708 80 Z',
      'M694 78 L696 54 L708 76 Z',
    ],
  }),
};

// --- Bogotá, Colombia ------------------------------------------------------------
const bogota: SkylineDef = {
  name: 'Bogotá',
  far: layer({
    height: F,
    filler: [313, 18, 46, 0.12],
    towers: [
      { x: 880, w: 20, h: 62 },
      { x: 906, w: 18, h: 56 },
      { x: 1020, w: 22, h: 64 },
    ],
    shapes: [
      // Monserrate, with its church on the summit.
      'M60 110 Q 150 40 230 31 Q 300 36 420 110 Z',
      rect(224, 25, 12, 8),
      rect(232, 17, 4, 9),
      spire(234, 17, 11, 0.8),
      // BD Bacatá: the two towers.
      rect(690, 24, 16, 86),
      spire(698, 24, 12, 1),
      rect(710, 40, 12, 70),
      // Colpatria Tower.
      stepped(800, F, [
        [10, 30],
        [8, 24],
      ]),
    ],
  }),
  near: layer({
    height: N,
    filler: [414, 8, 22, 0.16],
    shapes: [
      // Capitolio Nacional: the long colonnade.
      `${rect(250, 62, 100, 18)} ${Array.from({ length: 10 }, (_, i) => rect(255 + i * 10, 66, 4, 14)).join(' ')}`,
      rect(246, 58, 108, 4),
      // Catedral Primada: the facade and its two domed towers.
      rect(476, 50, 48, 30),
      'M486 50 L500 40 L514 50 Z',
      rect(476, 34, 10, 16),
      dome(481, 34, 5, 6),
      rect(514, 34, 10, 16),
      dome(519, 34, 5, 6),
      // Torres del Parque: three curved brick towers.
      'M836 80 V44 Q 846 40 856 44 V80 Z',
      'M860 80 V36 Q 872 30 884 36 V80 Z',
      'M888 80 V50 Q 896 46 904 50 V80 Z',
    ],
  }),
};

// --- New York City, United States --------------------------------------------------
const newYork: SkylineDef = {
  name: 'New York',
  far: layer({
    height: F,
    filler: [515, 20, 54, 0.12],
    towers: [
      { x: 150, w: 20, h: 70 },
      { x: 176, w: 16, h: 60 },
      { x: 560, w: 18, h: 66 },
      { x: 1000, w: 20, h: 72 },
      { x: 1026, w: 18, h: 60 },
    ],
    shapes: [
      // Empire State Building: the setbacks and the mast.
      stepped(300, F, [
        [12, 46],
        [10, 32],
        [7, 26],
        [4, 18],
        [2, 12],
      ]),
      spire(300, 12, 2, 1),
      // Chrysler Building: the terraced arches of its crown, and the spire.
      stepped(420, F, [
        [9, 40],
        [7, 32],
      ]),
      'M414 32 Q 420 24 426 32 Z',
      'M415.5 28 Q 420 20 424.5 28 Z',
      'M417 24 Q 420 16 423 24 Z',
      spire(420, 18, 4, 0.9),
      // 432 Park Avenue: the pencil tower.
      rect(615, 16, 10, 94),
      // One World Trade Center: the tapering facets and the spire.
      'M749 110 V66 L754 20 H766 L771 66 V110 Z',
      spire(760, 20, 2, 1),
    ],
  }),
  near: layer({
    height: N,
    filler: [616, 10, 26, 0.16],
    shapes: [
      // Brooklyn Bridge: two gothic towers (twin arches), the deck.
      'M332 80 V30 H348 V80 Z M335 52 V39 Q 337 34 339 39 V52 Z M341 52 V39 Q 343 34 345 39 V52 Z',
      'M472 80 V30 H488 V80 Z M475 52 V39 Q 477 34 479 39 V52 Z M481 52 V39 Q 483 34 485 39 V52 Z',
      rect(260, 64, 300, 3),
      // Statue of Liberty: the star fort, pedestal, robe, torch held high.
      'M746 80 L748 74 H772 L774 80 Z',
      rect(750, 62, 20, 12),
      'M756 62 L758 41 Q 760 37 762 41 L764 62 Z',
      circle(760, 37, 2.4),
      'M761 40 L765.5 26 L767 26.5 L763 41 Z',
      'M765.2 26.2 L766.5 21 L768 26 Z',
    ],
    strokes: [
      ['M260 64 Q 300 56 340 30', 0.9],
      ['M340 30 Q 410 62 480 30', 0.9],
      ['M480 30 Q 520 56 560 64', 0.9],
    ],
  }),
};

// --- Tokyo, Japan ----------------------------------------------------------------
const tokyo: SkylineDef = {
  name: 'Tokyo',
  far: layer({
    height: F,
    filler: [717, 18, 48, 0.12],
    towers: [
      { x: 520, w: 18, h: 60 },
      { x: 544, w: 20, h: 52 },
      { x: 900, w: 20, h: 64 },
      { x: 926, w: 16, h: 54 },
    ],
    shapes: [
      // Mount Fuji, far off.
      'M60 110 L170 58 Q 185 52 200 58 L330 110 Z',
      // Tokyo Tower: splayed legs with an arch, two decks, the mast.
      'M406 110 Q 414 80 417 60 L418 40 H422 L423 60 Q 426 80 434 110 Z M413 110 Q 420 96 427 110 Z',
      rect(414, 62, 12, 4),
      rect(416.5, 40, 7, 3),
      spire(420, 40, 24, 1),
      // Tokyo Skytree: the tallest, two observation decks, the antenna.
      'M691 110 L697 30 H703 L709 110 Z',
      rect(694, 40, 12, 4),
      rect(696, 26, 8, 4),
      spire(700, 26, 0, 1.4),
    ],
  }),
  near: layer({
    height: N,
    filler: [818, 8, 24, 0.16],
    shapes: [
      // Sensō-ji's five-storey pagoda.
      pagoda(260, N, 5, 30, 9),
      // A torii gate.
      rect(488, 48, 3, 32),
      rect(509, 48, 3, 32),
      rect(486, 52, 28, 2.5),
      'M478 40 Q 500 43 522 40 L520 45 Q 500 47 480 45 Z',
      // Rainbow Bridge: two towers and the deck.
      rect(890, 40, 6, 40),
      rect(1000, 40, 6, 40),
      rect(800, 66, 300, 3),
    ],
    strokes: [
      ['M800 66 Q 850 60 893 40', 0.9],
      ['M893 40 Q 948 70 1003 40', 0.9],
      ['M1003 40 Q 1050 60 1100 66', 0.9],
    ],
  }),
};

// --- Houston, Texas ----------------------------------------------------------------
const houston: SkylineDef = {
  name: 'Houston',
  far: layer({
    height: F,
    filler: [919, 20, 50, 0.12],
    towers: [
      { x: 150, w: 18, h: 58 },
      { x: 900, w: 20, h: 62 },
    ],
    shapes: [
      // JPMorgan Chase Tower: tall, with its angled top.
      'M510 110 V22 L520 18 L530 22 V110 Z',
      // Wells Fargo Plaza: rounded corners.
      'M570 110 V30 Q 570 24 576 24 H584 Q 590 24 590 30 V110 Z',
      // Bank of America Center: stepped Dutch gables to a point.
      'M628 110 V40 L632 36 V32 L636 28 V24 L640 18 L644 24 V28 L648 32 V36 L652 40 V110 Z',
      // Pennzoil Place: the two trapezoids with sloped roofs.
      'M690 110 V40 L700 32 V110 Z',
      'M702 110 V32 L712 40 V110 Z',
      // Williams Tower, out in Uptown, with its beacon.
      stepped(1000, F, [
        [8, 30],
        [6, 24],
      ]),
      spire(1000, 24, 16),
    ],
  }),
  near: layer({
    height: N,
    filler: [1020, 8, 22, 0.16],
    shapes: [
      // San Jacinto Monument: the tapering shaft topped by its star.
      rect(290, 70, 20, 10),
      taper(300, 70, 6, 3.5, 20),
      star(300, 14, 5),
      // The Astrodome.
      'M560 80 Q 600 50 640 80 Z',
      // A freeway interchange: piers under the ramps.
      rect(830, 66, 3, 14),
      rect(890, 60, 3, 20),
      rect(950, 64, 3, 16),
    ],
    strokes: [
      ['M780 74 Q 860 52 940 70', 2.2],
      ['M800 78 Q 900 56 1010 76', 2.2],
    ],
  }),
};

// --- Bangkok, Thailand ------------------------------------------------------------
const smallPrang = (x: number, base: number, h: number) =>
  `M${x - 5} ${base} Q ${x - 3} ${base - h * 0.6} ${x} ${base - h} Q ${x + 3} ${base - h * 0.6} ${x + 5} ${base} Z`;

const bangkok: SkylineDef = {
  name: 'Bangkok',
  far: layer({
    height: F,
    filler: [929, 18, 48, 0.12],
    towers: [
      { x: 120, w: 20, h: 64 },
      { x: 146, w: 16, h: 56 },
      { x: 520, w: 18, h: 60 },
      { x: 960, w: 22, h: 68 },
      { x: 990, w: 18, h: 58 },
    ],
    shapes: [
      // Baiyoke Tower II: setbacks and a mast.
      stepped(300, F, [
        [11, 36],
        [9, 26],
        [6, 20],
      ]),
      spire(300, 20, 4),
      // King Power MahaNakhon: a tall slab whose edges are cut away in
      // "pixels" spiralling up the tower.
      'M630 110 V42 H634 V36 H630 V20 H650 V32 H646 V40 H650 V52 H644 V58 H650 V70 H646 V76 H650 V110 Z',
      // State Tower: setbacks crowned by its golden dome.
      stepped(820, F, [
        [13, 40],
        [10, 30],
      ]),
      dome(820, 30, 7, 8),
      spire(820, 23, 14),
    ],
  }),
  near: layer({
    height: N,
    filler: [1030, 8, 22, 0.16],
    shapes: [
      // Wat Arun: the terraces, the central prang and four smaller ones.
      rect(232, 72, 56, 8),
      rect(240, 66, 40, 6),
      'M248 80 L251 60 Q 254 36 258 22 L260 11 L262 22 Q 266 36 269 60 L272 80 Z',
      smallPrang(236, 72, 26),
      smallPrang(284, 72, 26),
      smallPrang(224, 80, 18),
      smallPrang(296, 80, 18),
      // The Grand Palace: a hall under stacked, steep roofs and a spire.
      rect(530, 60, 60, 20),
      'M524 62 L540 50 H580 L596 62 Z',
      'M532 52 L546 42 H574 L588 52 Z',
      'M542 43 L552 34 H568 L578 43 Z',
      taper(560, 34, 4, 0.8, 12),
      // A golden chedi: the bell on its base, and its spire.
      rect(628, 74, 24, 6),
      'M630 74 Q 630 60 640 56 Q 650 60 650 74 Z',
      taper(640, 57, 2.5, 0.6, 30),
      // Rama VIII Bridge: the inverted-Y pylon and the deck.
      'M894 80 L901 46 V24 H907 V46 L914 80 H910 L904 52 L898 80 Z',
      rect(800, 64, 220, 3),
    ],
    strokes: [
      ['M904 27 L840 64', 0.7],
      ['M904 29 L860 64', 0.7],
      ['M904 31 L880 64', 0.7],
      ['M904 27 L968 64', 0.7],
      ['M904 29 L948 64', 0.7],
      ['M904 31 L928 64', 0.7],
    ],
  }),
};

export const CITIES = {
  kinshasa,
  jakarta,
  dhaka,
  mexicoCity,
  seoul,
  cairo,
  bogota,
  newYork,
  tokyo,
  houston,
  bangkok,
};
