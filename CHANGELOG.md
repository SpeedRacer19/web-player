# Changelog

All notable changes to this player are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

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
