# Changelog

All notable changes to this player are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [2.0.0] — Unreleased

### Added
- **Settings, behind the hazard button** ("use with caution"). Press the
  hazard switch above the stereo to open SETUP, a display-styled panel over
  the dash, in the current DISP illumination; the hazards flash while it's
  open. It starts with the scenery switches (shooting stars, motorcycle) and
  Reset to defaults; each 2.0 feature adds its own section. Choices are saved
  on the device. Escape, ✕ EXIT or a click outside closes it.
- The hazard button now shows on phones too, centred above the stereo.
- **Time of day** (SETUP → Scenery): Dawn, Day, Dusk (the original look, and
  the default) or Night, or Auto to follow your clock (dawn 5–8, day 8–17,
  dusk 17–20, night after 20). Each swaps the scene's palette, and the details
  follow: a pale sun rising at dawn, a small high sun by day, a moon at night;
  stars faint at dawn, gone by day, everywhere at night; city windows dark by
  day and fewer lit at dawn; streetlights off by day. The rear-view mirror
  shows the sky behind you (still night at dawn and dusk, blue by day), and
  the dash picks up the sky's colour. Shooting stars only appear when the
  stars are out.
- **Skyline** (SETUP → Scenery): the city on the horizon. **Default** is the
  original generated city (unchanged, pixel for pixel). **Guangzhou** is a new
  hand-drawn skyline: Canton Tower with its lit lattice, the IFC and CTF
  Finance Centre towers in the far layer; the Guangzhou Circle, the Haixin
  Bridge arch, the Opera House and a pagoda in the near layer. It follows the
  time of day like the default, and the rear-view mirror shows it too.
  **Delhi**: Qutub Minar and Humayun's Tomb with the newer high-rises behind;
  India Gate, the Lotus Temple, Jama Masjid and the Red Fort's Lahori Gate in
  front. Plus **Kinshasa** (Tour de l'Échangeur, Lumumba monument, palms),
  **Jakarta** (Monas, Istiqlal, Autograph Tower), **Dhaka** (Parliament
  House, Shaheed Minar, Martyrs' Memorial), **Mexico City** (Popocatépetl,
  Torre Latinoamericana, the Angel, Bellas Artes), **Seoul** (N Seoul Tower,
  Lotte World Tower, Namdaemun), **Cairo** (the pyramids, Cairo Tower, the
  Citadel, feluccas), **Bogotá** (Monserrate, BD Bacatá, Capitolio),
  **New York** (Empire State, Chrysler, One WTC, Brooklyn Bridge, Liberty),
  **Tokyo** (Mt Fuji, Skytree, Tokyo Tower, pagoda, torii, Rainbow Bridge)
  **Houston** (Bank of America Center, Pennzoil Place, San Jacinto
  Monument, the Astrodome) and **Bangkok** (King Power MahaNakhon, Baiyoke
  Tower II, the State Tower; Wat Arun, the Grand Palace, a golden chedi, the
  Rama VIII Bridge). SETUP lists them in a grid.

## [1.5.0] — 2026-11-09

### Added
- **A livelier night sky.** About 70 stars of different sizes and brightness
  (it was 10), each shimmering on its own slow rhythm instead of the whole sky
  pulsing together.
- **Shooting stars:** every 8–25 seconds, at random, a faint streak crosses the
  upper sky in under a second.
- **A passing motorcycle (off by default for now):** when switched on, every
  30–70 seconds a rider comes up beside you from the left or right, leans into
  the lane and rides off past the car ahead into the haze on the horizon. It's
  drawn three-quarters from behind and kept in proportion with the car. It
  ships switched off while its artwork is still being worked on.
- **Listener settings** (groundwork for a settings dashboard): a small saved
  store with switches for the motorcycle (default off) and for shooting stars
  (default on). Turning one off stops it appearing, in every open tab.
- All of it pauses in a background tab and stays still with reduced motion.
- `docs/ROADMAP.md`: ideas agreed for 2.0 (settings dashboard, road layouts)
  and items still open.

## [1.4.0] — 2026-11-08

### Changed
- **The head unit grows on wide screens, then stops.** It now widens up to
  1140px (from 920px), reached at about 1970px. The display gets up to 826px
  (from 606px).
- **More detail in up next** once the display is wide enough (about 1640px
  screens and up): a small cover for each track, the album, who requested it
  beside the title, and room for full titles.
- **The glovebox stays a glovebox.** It grows with the dash up to 400px wide
  and then stays put next to the stereo (on a 3440px screen it used to be over
  1000px wide). An outboard air vent fills the space beyond it on wide screens.
- On ultra-wide screens the cockpit stays together in the middle: each side
  of the dash stops at 560px and the rest is plain dash.
- The gauges are set into the dash, behind the wheel: on wide screens the top
  edge of the dash now runs unbroken behind the steering wheel and shows
  through its opening, instead of being covered by the gauge hood.
- **Steering wheel:** the whole rim now reads as a circle (lighter lower rim,
  a thin edge highlight) instead of only its top arc. It's never cut off at
  the sides any more: if it's short of room it shifts away from the stereo,
  so the spill goes off the screen edge or onto plain dash. On laptops it's
  about 8% smaller, so all three gauges stay on screen.
- **Rear-view mirror:** larger (up to 300px, from 220px), with a live rear
  view of what you've passed: night sky behind you, the city on the
  horizon, lane markings and streetlights running away, and headlights
  following a long way back. It stops moving if you've asked your system for
  reduced motion.
- **Hazard button** is wider (50px, from 36px).
- **The driver's side adapts smoothly** so the gauges are always readable:
  - The gauges keep a readable size (BPM up to 176px, RPM and TEMP now the
    same size as each other) whether or not the wheel is there.
  - With room, RPM and TEMP sit either side of BPM. As the space narrows they
    slide in and down into a cluster below it.
  - The steering wheel fades out as it's squeezed (fully there from about
    2200px screens, gone below about 2080px), rather than shrinking until
    the gauges are unreadable or vanishing all at once.
  - **Below 1400px** (including 1366px laptops; it was 1280px): the sides fold
    away, the stereo takes the width, and the gauges become a readout line
    (below).
- **Gauge readout line:** wherever the gauges aren't on screen (below 1400px,
  phones included), their readings show as a line under the DJ strip, like a
  trip computer: `RPM 38ms  BPM 91  TEMP MED  KEY Am`.
- Laptop sizes (1280–1440px) are unchanged. At 1920px the steering wheel is a
  little smaller, because the stereo takes more of the width.

## [1.3.0] — 2026-11-08

### Added
- **Share links.** SRC → "Copy link" copies a link that opens the player tuned
  to the current station (`?station=radio.example.com`). Opening one switches
  station, remembers it, and tidies the address bar.
- **Recent stations.** Stations you type in or open from a link stay in the SRC
  list (the last 5, under their own names), with ✕ to forget one. Before, a
  typed station vanished from the list as soon as you switched away.
- **Up next on mid-size screens** (1280px laptops, tablets): where there isn't
  room for the NEXT column, a one-line "NEXT ▸ title — artist" takes the album
  line's place. Phones are unchanged.

### Changed
- The player no longer polls `/session` (the Booth chat), which nothing in the
  car skin shows: one request fewer every 5 seconds per listener. A skin that
  wants it turns it on with `<StationFeedProvider withSession>`.
- SRC's "Enter URL" and "Copy link" share one compact row, so the station list
  stays in view.

### Fixed
- `useStationFeed.tsx` showed as a binary file on GitHub (a literal NUL
  character in the source, and Windows line endings). It's plain text now; the
  code behaves the same.

## [1.2.0] — 2026-11-08

### Added
- **Up next** on the stereo's display: the next track or two (with who
  requested it), in a column beside the current song. It accounts for the
  stream delay, so it shows what *you* will hear next. Shown when the display is
  wide enough (most laptops and desktops, and tablets in landscape); phones
  keep the full-width view.
- **Type any station URL** in SRC ("＋ Enter a station URL"): self-hosted, LAN
  or localhost. The player checks a SUB/WAVE station answers there before
  switching ("Tune anyway" if it's just offline), adds the scheme for you, and
  accepts pasted `/listen` links. It explains when the browser blocks an
  `http://` station on an `https://` page.
- The version number, silkscreened bottom-left on the head unit. It comes from
  `package.json`.

### Changed
- Bigger, centred display. The head unit is wider, and the knob and play
  columns are equal widths, so the display sits in the middle of the unit
  (on the 1440px layout it's 510px wide, up from 394px). On wide screens the
  stereo is now centred on screen too: the steering-wheel and glovebox sides
  are equal widths.

## [1.1.0] — 2026-11-08

### Changed
- GitHub Pages deploy now builds against `https://www.getsubwave.com` by default,
  matching `src/config.ts` and `.env.example`. Override it with the `STATION_URL`
  repository variable.
- GitHub Pages deploy now runs only on pushes to `main`. The `car-skin-v1`
  branch trigger is gone.

### Added
- **REQ** button on the car stereo: ask the DJ for a song, artist or vibe
  right from the head unit. The display shows the search and the result. A
  request keeps going if you close the menu, and the button stays lit until
  it's done. Your name is remembered on this device.
- This changelog.

### Fixed
- DISP dim modes now dim everything that lights up: the screen, the DJ
  readout, knob lights, gauges and needles, button labels (including lit
  ones), the play icon and the hazard switch. Before, a broken CSS rule left
  most of these at full brightness and dimmed the gauge needles all the time.
- On phones, the faceplate buttons no longer push the page sideways (an
  existing problem at 320px that a seventh button would have made worse).
- Lint is warning-free.

## [1.0.0] — 2026-11-08

### Added
- "Night Drive" car-interior skin: a windshield scene, plus a dashboard with a
  head unit (SRC station picker, EQ, stream format, lyrics glovebox) and a
  volume knob.
- GitHub Actions workflow that deploys the player to GitHub Pages.

## [0.1.0] — 2026-07-15

### Added
- Initial SUB/WAVE web player starter: React 19 + Vite 6 + TypeScript +
  Tailwind v4, with the data layer (`config.ts`, `lib/`, `hooks/`) kept
  separate from presentation (`components/`).
- One-click deploy buttons, Docker, agent skills (`redesign-player`,
  `connect-station`), and the GitHub Pages guide site.
