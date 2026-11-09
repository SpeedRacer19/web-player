# Roadmap

Ideas agreed for future versions. Not commitments to dates; the CHANGELOG
records what actually shipped.

## 2.0 — make it yours (shipped in 2.0.0)

### Settings dashboard (done in 2.0)
A screen where listeners choose what they see, opened from the **hazard
button** ("use with caution"): `src/components/car/SettingsPanel.tsx`, over
the store in `src/lib/settings.ts` / `useSettings()`. Each feature respects
its own switch; adding a feature means a key in `Settings` + `DEFAULTS` and a
row in the panel.

- Switches that exist today: **motorcycle** (off by default until its
  artwork is improved), **shooting stars**.
- Every new optional piece of scenery should arrive with a switch, so the
  dashboard grows with it.

### Road layouts (done in 2.0: single lane / two-way / three lanes / motorway)
Let the listener pick the road outside the windshield:

- single lane
- multi-lane (today's three lanes is one option)
- two-way street, with oncoming traffic
- other variations to explore (country road, motorway, …)

The lane markings, the car ahead, the streetlights, the motorcycle's lane and
the rear-view mirror would all follow the chosen layout. It would be a setting
in the dashboard above.

### Time of day (done in 2.0: dawn / day / dusk / night / auto by the listener's clock)
Auto can follow your clock, the station's (`timezone` in its feed) or a
chosen zone.

Swap the scene's colour palette (the CSS variables at the top of
`src/index.css`): dawn, midday, dusk (today) and night. Details follow
along: the sun rising instead of setting, fewer lit windows at dawn,
streetlights off by day, stars only at night. The rear-view mirror shows the
opposite sky. Option: follow the clock (station or listener local time).

### City skylines (in 2.0: Default + 13 cities)
Guangzhou, Delhi, Kinshasa, Jakarta, Dhaka, Mexico City, Seoul, Cairo, Bogotá,
New York, Tokyo, Houston, Bangkok. More can be added with the kit
(`skylines-kit.tsx` → `skylines-cities.tsx`).

Real cities (e.g. New York, Tokyo, Paris), from existing artwork or
generated from photos rather than drawn by hand. Each city needs a near and
a far silhouette layer for the drift, as SVG data. Today's generated skyline
stays as the default.

### The car ahead (done in 2.0: coupe / pickup / classic / van / off)
- Choose its style: a few drawings (coupe, truck, classic, van).
- Turn it off. With no car, the road ahead is clear and the motorcycle can
  use the centre lane.

### Driving speed (done in 2.0: steady / song BPM / song energy)
How fast our car travels (lane markings, streetlights, skyline drift):
fixed, follow the song's BPM, or follow its energy. Ease between speeds at
song changes, cap the extremes, and stay still with reduced motion.

All of these are settings in the dashboard above, alongside road layouts and
the existing motorcycle and shooting-star switches. Time of day and city
could also come as presets.

## Still open (no version yet)

- **Accessibility pass:** volume knob as a keyboard slider, arrow keys in the
  menus, screen-reader announcements on track change.
- **Unused components:** decide what to do with `BoothFeed`, `Queue`,
  `RequestBox` and `Schedule` (move to `src/components/examples/`, or drop).
- **Schedule refetch on station switch:** only needed once something shows the
  schedule.
