# Entryway Display

A calm family dashboard for a spare tablet by the front door — built
because smart-home hubs and photo frames never quite showed the right
things at a glance.

It answers the four questions every morning at the shoes:

- **What do we wear?** A big jacket verdict — *RAIN JACKET + RAIN
  SHOES*, *HOODED JACKET*, *WARM JACKET*, *NORMAL JACKET*, *HOODIE*, or
  *NO JACKET NEEDED* — computed from the actual departure windows
  (7–9am, 3–6pm), with the weather inside the same card: now, condition,
  hi/lo.
- **What's on today?** The family calendar — the whole day, finished
  events dimmed, the next one highlighted.
- **What's worth knowing?** One rotating card, the **Daily Three**:
  fact of the day → quote of the day → word of the day (English
  curiosities and Tamil words with transliteration in this edition —
  the banks are plain text in `src/facts.js`, edit them to yours).
- **What does home look like?** Your photos (or favourite paintings)
  rotating slowly — every 5 minutes by default — sharp in their own
  card, with a blurred version as the backdrop behind the frosted-glass
  card grid.

Plus a clock card, a small *Tomorrow* card (tomorrow's jacket call +
first event), an evening layout, and a near-black night screen with a
dim clock so it can live in a hallway without glowing all night.

Modes switch themselves by time of day: departure (05:00–09:30 and
14:30–18:30), idle (photo grows), evening (18:30–21:00), night
(21:00–05:00). Weather is fetched live every 15 minutes; the page
reloads itself every 15 minutes to pick up rebuilt data.

## Quick start

You need Python 3.9+ (standard library only). Pillow is optional — if
present, photos are downscaled for the web; if not, they're copied
as-is.

```bash
git clone https://github.com/sath-commits/entryway-display.git
cd entryway-display
cp config.example.json config.json   # then edit it (below)
# drop some images into photos/
python3 build.py
```

That produces `dist/index.html` + `dist/assets/`. Open the file to
preview, then host the `dist/` folder anywhere static:

- **Vercel / Netlify:** drag the `dist` folder onto their deploy page,
  or point a project at it.
- **GitHub Pages:** publish the `dist` folder.
- **A home server / Raspberry Pi:** serve `dist/` with any static
  server.

### Put it on a tablet

1. Open your hosted URL in the tablet's browser.
2. **Share → Add to Home Screen.** There is deliberately *no* web-app
   manifest in this project, so the icon opens the page itself,
   fullscreen, with no browser chrome and no login.
3. Settings that make it appliance-like:
   - Auto-Lock: **Never** (and the same inside Guided Access).
   - Guided Access: **on**, then triple-click to lock the tablet into
     the display.
   - Night Shift / automatic dark mode: off (the page has its own
     night mode).

An old tablet is perfect — this ran on a years-old iPad. Anything that
can open a web page works.

## Configuration (`config.json`)

| Key | What it is |
|---|---|
| `placeName` | Shown in the weather card ("Now 9°C … in Maplewood"). |
| `latitude` / `longitude` | Your home's coordinates for the forecast. |
| `timezone` | IANA name, e.g. `America/Los_Angeles`. Used for the calendar build and the weather request. (The on-screen clock follows the tablet's own clock.) |
| `tempUnit` | `"celsius"` or `"fahrenheit"` — display and jacket bands follow it. |
| `calendarIcsUrl` | An iCalendar feed URL for today/tomorrow (see below). Empty = no calendar events. |
| `photoDir` | Folder with your images (default `photos`). |
| `photoRotateMinutes` | How long each photo stays up (default `5`). |

### Getting a calendar feed URL (Google Calendar)

Settings → *Settings for this calendar* → **Secret address in iCal
format**. Paste it as `calendarIcsUrl`. Treat it like a password — it
shows your events to anyone who has it, which is why `config.json` is
gitignored. Rebuilds read it; the URL itself is never copied into the
built page — only today's and tomorrow's event titles and times are.

Recurring events are expanded (daily / weekly / monthly / yearly, with
`EXDATE` honoured) by the small parser in `build.py`.

### Keeping it fresh

Calendar and photo data are baked in at build time, so re-run
`python3 build.py` and re-deploy on whatever cadence you like — hourly
is plenty. Ideas: a `cron` line on a home machine, a scheduled GitHub
Action in your fork, or any CI. Weather needs no rebuild: the page
fetches it live from [Open-Meteo](https://open-meteo.com) (free, no
API key) every 15 minutes.

## Make it yours

- **Jacket rules:** thresholds live at the top of `src/weather.js`
  (rain ≥50% in a departure window → rain jacket + rain shoes; 30–49%
  → hooded jacket; then temperature bands). Windows are 07:00–09:00
  and 15:00–18:00.
- **Fact / quote / word banks:** plain arrays in `src/facts.js`. Facts
  rotate by weekday category; quotes and words by date. Add your own
  family trivia, proverbs, or vocabulary.
- **Layout & modes:** geometries and mode times are in `src/render.js`;
  the glass-card styling is `src/dashboard.css`. Cards auto-shrink
  their text to fit their box, so edits are forgiving.

## How it works

`build.py` inlines everything into one HTML file: CSS, the content
banks, and the app JS from `src/`, plus a small JSON payload (events +
photo list + your config). No framework, no build tooling, no accounts,
no tracking. The only network call the page itself makes is the
Open-Meteo forecast.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, make your hallway
smarter.

*Weather data by Open-Meteo.com (CC BY 4.0). If you stock the photo
folder with paintings, Wikimedia Commons has wonderful public-domain
art — this one started with Norman Rockwell Saturday Evening Post
covers and Albert Bierstadt landscapes.*
