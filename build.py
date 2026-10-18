#!/usr/bin/env python3
"""Build the Entryway Display into dist/.

Reads config.json (copy config.example.json to get started), pulls
today's and tomorrow's events from an optional iCalendar (ICS) feed,
copies the photos from the photos folder, and assembles a single
self-contained dist/index.html (+ dist/assets/) you can host anywhere
static: Vercel, Netlify, GitHub Pages, or just open the file.

Standard library only. If Pillow happens to be installed, photos are
downscaled to a sensible size; without it they are copied as-is.
"""
import json
import os
import re
import shutil
import sys
import urllib.request
from datetime import datetime, timedelta, date, time as dtime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
DIST = os.path.join(HERE, "dist")
ASSETS = os.path.join(DIST, "assets")

DEFAULTS = {
    "placeName": "Our Town",
    "latitude": 47.6062,
    "longitude": -122.3321,
    "timezone": "America/Los_Angeles",
    "tempUnit": "celsius",
    "calendarIcsUrl": "",
    "photoDir": "photos",
    "photoRotateMinutes": 5,
}


def load_config():
    path = os.path.join(HERE, "config.json")
    cfg = dict(DEFAULTS)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            cfg.update(json.load(fh))
    else:
        print("No config.json found — using defaults from config.example.json.")
        print("Copy config.example.json to config.json and make it yours.")
    return cfg


# ---------------------------------------------------------------- ICS
def _unfold(text):
    lines = []
    for raw in text.replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        if raw[:1] in (" ", "\t") and lines:
            lines[-1] += raw[1:]
        else:
            lines.append(raw)
    return lines


def _parse_dt(value, params, tz):
    """Return (aware datetime | date, is_all_day)."""
    from zoneinfo import ZoneInfo
    value = value.strip()
    if params.get("VALUE", "").upper() == "DATE" or re.fullmatch(r"\d{8}", value):
        return date(int(value[0:4]), int(value[4:6]), int(value[6:8])), True
    m = re.fullmatch(r"(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)", value)
    if not m:
        return None, False
    y, mo, d, h, mi, sec, z = m.groups()
    dt = datetime(int(y), int(mo), int(d), int(h), int(mi), int(sec))
    if z == "Z":
        from datetime import timezone as _tz
        dt = dt.replace(tzinfo=_tz.utc)
    elif params.get("TZID"):
        try:
            dt = dt.replace(tzinfo=ZoneInfo(params["TZID"]))
        except Exception:
            dt = dt.replace(tzinfo=tz)
    else:
        dt = dt.replace(tzinfo=tz)
    return dt, False


def _split_prop(line):
    if ":" not in line:
        return None, {}, ""
    head, value = line.split(":", 1)
    parts = head.split(";")
    params = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            params[k.upper()] = v.strip('"')
    return parts[0].upper(), params, value


def _unescape(text):
    return (text.replace("\\n", "\n").replace("\\,", ",")
            .replace("\\;", ";").replace("\\\\", "\\").strip())


_WEEKDAYS = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}


def _expand(ev, window_start, window_end, tz):
    """Yield occurrence start datetimes (or dates) inside the window."""
    start = ev["start"]
    rrule = ev.get("rrule")
    if not rrule:
        yield start
        return
    rule = {}
    for part in rrule.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            rule[k.upper()] = v.upper()
    freq = rule.get("FREQ", "")
    interval = int(rule.get("INTERVAL", "1") or 1)
    count = int(rule["COUNT"]) if rule.get("COUNT", "").isdigit() else None
    until = None
    if rule.get("UNTIL"):
        u, _ = _parse_dt(rule["UNTIL"], {}, tz)
        until = u
    byday = [d for d in re.split(r"[,\s]+", rule.get("BYDAY", "")) if d]
    bymonthday = [int(x) for x in rule.get("BYMONTHDAY", "").split(",") if x.strip().lstrip("-").isdigit()]

    def as_dt(d):
        if isinstance(d, datetime):
            return d
        return datetime.combine(d, dtime.min, tzinfo=tz)

    base = as_dt(start)
    limit_end = as_dt(window_end)
    made = 0
    seen = 0
    if freq == "DAILY":
        cur = base
        while cur < limit_end and seen < 800:
            seen += 1
            if count is not None and made >= count:
                break
            if until is not None and cur > as_dt(until):
                break
            made += 1
            if cur >= as_dt(window_start) - timedelta(days=1):
                yield cur
            cur += timedelta(days=interval)
    elif freq == "WEEKLY":
        days = sorted(_WEEKDAYS[d[-2:]] for d in byday) or [base.weekday()]
        week0_date = base.date() - timedelta(days=base.weekday())
        cur_week = datetime.combine(week0_date, base.time(), tzinfo=base.tzinfo)
        while cur_week < limit_end and seen < 800:
            for wd in days:
                cand = cur_week + timedelta(days=wd)
                if cand < base:
                    continue
                seen += 1
                if count is not None and made >= count:
                    return
                if until is not None and cand > as_dt(until):
                    return
                made += 1
                if cand >= as_dt(window_start) - timedelta(days=1):
                    yield cand
            cur_week += timedelta(weeks=interval)
    elif freq in ("MONTHLY", "YEARLY"):
        months = [int(x) for x in rule.get("BYMONTH", "").split(",") if x.strip().isdigit()]
        cur = base
        while cur < limit_end and seen < 800:
            seen += 1
            if count is not None and made >= count:
                break
            if until is not None and cur > as_dt(until):
                break
            ok = True
            if freq == "YEARLY" and months and cur.month not in months:
                ok = False
            if bymonthday and cur.day not in bymonthday:
                ok = False
            if byday:
                want = [(d[-2:], int(re.match(r"[+-]?\d+", d).group()) if re.match(r"[+-]?\d+", d) else None) for d in byday]
                ok = any(cur.weekday() == _WEEKDAYS[code] and (num is None or (cur.day - 1) // 7 + 1 == num or (num < 0 and (cur.day + 6) // 7 == (cur.replace(day=28) + timedelta(days=4)).day // 7 and False)) for code, num in want)
            if ok:
                made += 1
                if cur >= as_dt(window_start) - timedelta(days=1):
                    yield cur
            # advance one month (monthly) or one year (yearly)
            if freq == "MONTHLY":
                y, m = (cur.year + 1, 1) if cur.month == 12 else (cur.year, cur.month + interval)
            else:
                y, m = cur.year + interval, cur.month
            try:
                cur = cur.replace(year=y, month=m)
            except ValueError:
                # e.g. Jan 31 -> Feb: clamp to month end
                nxt = datetime(y, m, 1, tzinfo=cur.tzinfo) + timedelta(days=32)
                last = nxt.replace(day=1) - timedelta(days=1)
                cur = cur.replace(year=y, month=m, day=min(cur.day, last.day))
    else:
        yield start


def fetch_events(cfg, tz):
    url = cfg.get("calendarIcsUrl") or ""
    if not url:
        return [], [], False
    from zoneinfo import ZoneInfo
    today = datetime.now(tz).date()
    tomorrow = today + timedelta(days=1)
    day_after = tomorrow + timedelta(days=1)
    req = urllib.request.Request(url, headers={"User-Agent": "EntrywayDisplay/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode("utf-8", "replace")
    events = []
    cur = None
    for line in _unfold(text):
        if line == "BEGIN:VEVENT":
            cur = {"exdates": []}
        elif line == "END:VEVENT" and cur is not None:
            events.append(cur)
            cur = None
        elif cur is not None:
            name, params, value = _split_prop(line)
            if name == "SUMMARY":
                cur["title"] = _unescape(value)
            elif name == "LOCATION":
                cur["location"] = _unescape(value) or None
            elif name == "DTSTART":
                dt, allday = _parse_dt(value, params, tz)
                cur["start"], cur["allDay"] = dt, allday
            elif name == "DTEND":
                dt, _ = _parse_dt(value, params, tz)
                cur["end"] = dt
            elif name == "RRULE":
                cur["rrule"] = value
            elif name == "EXDATE":
                for piece in value.split(","):
                    dt, _ = _parse_dt(piece, params, tz)
                    if dt is not None:
                        cur["exdates"].append(dt)
    out_today, out_tomorrow = [], []
    for ev in events:
        if "start" not in ev or ev["start"] is None:
            continue
        start0 = ev["start"]
        duration = None
        if ev.get("end") is not None:
            try:
                duration = ev["end"] - start0
            except TypeError:
                duration = None
        for occ in _expand(ev, today, day_after, tz):
            occ_date = occ.date() if isinstance(occ, datetime) else occ
            if any((occ == ex) or (occ_date == (ex.date() if isinstance(ex, datetime) else ex)) for ex in ev["exdates"]):
                continue
            end = None
            if duration is not None:
                end = occ + duration
            allday = ev.get("allDay", False)
            if allday:
                rec = {"title": ev.get("title", "(untitled)"),
                       "start": occ_date.isoformat(),
                       "end": (end.isoformat() if isinstance(end, date) else occ_date.isoformat()),
                       "allDay": True, "location": ev.get("location")}
            else:
                rec = {"title": ev.get("title", "(untitled)"),
                       "start": occ.astimezone(tz).isoformat(),
                       "end": end.astimezone(tz).isoformat() if isinstance(end, datetime) else None,
                       "allDay": False, "location": ev.get("location")}
            if occ_date == today:
                out_today.append(rec)
            elif occ_date == tomorrow:
                out_tomorrow.append(rec)
    out_today.sort(key=lambda e: (not e["allDay"], e["start"]))
    out_tomorrow.sort(key=lambda e: (not e["allDay"], e["start"]))
    return out_today, out_tomorrow, True


# ---------------------------------------------------------------- build
def caption_for(name):
    base = os.path.splitext(os.path.basename(name))[0]
    base = re.sub(r"^\d+[\s._-]+", "", base)
    base = base.replace("-", " ").replace("_", " ").strip()
    return base[:1].upper() + base[1:] if base else "Photo"


def fetch_photos(cfg):
    photo_dir = os.path.join(HERE, cfg.get("photoDir", "photos"))
    os.makedirs(ASSETS, exist_ok=True)
    for old in os.listdir(ASSETS):
        os.remove(os.path.join(ASSETS, old))
    if not os.path.isdir(photo_dir):
        return [], False
    names = sorted(n for n in os.listdir(photo_dir)
                   if n.lower().endswith((".jpg", ".jpeg", ".png", ".webp")))
    photos = []
    try:
        from PIL import Image
        have_pil = True
    except Exception:
        have_pil = False
    for i, name in enumerate(names, 1):
        src = os.path.join(photo_dir, name)
        fname = "p%02d.jpg" % i
        out = os.path.join(ASSETS, fname)
        if have_pil:
            im = Image.open(src).convert("RGB")
            if im.width > 1600:
                im = im.resize((1600, max(1, round(im.height * 1600 / im.width))), Image.LANCZOS)
            im.save(out, "JPEG", quality=84, optimize=True)
        else:
            shutil.copyfile(src, out)
        photos.append({"url": "assets/" + fname, "name": caption_for(name)})
    return photos, True


def read_src(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as fh:
        return fh.read()


def main():
    from zoneinfo import ZoneInfo
    cfg = load_config()
    tz = ZoneInfo(cfg.get("timezone", "America/Los_Angeles"))
    errors = []
    try:
        events_today, events_tomorrow, cal_found = fetch_events(cfg, tz)
    except Exception as exc:
        events_today, events_tomorrow, cal_found = [], [], False
        errors.append("calendar: %s" % exc)
    photos, photos_found = fetch_photos(cfg)

    app_config = {
        "placeName": cfg.get("placeName", ""),
        "latitude": cfg.get("latitude"),
        "longitude": cfg.get("longitude"),
        "timezone": cfg.get("timezone"),
        "tempUnit": cfg.get("tempUnit", "celsius"),
        "photoRotateMinutes": cfg.get("photoRotateMinutes", 5),
    }
    data = {
        "fetchedAt": datetime.now(tz).isoformat(),
        "eventsToday": events_today,
        "eventsTomorrow": events_tomorrow,
        "photos": photos,
        "photoFolderFound": photos_found,
        "calendarFound": cal_found,
    }
    data_js = "var DATA = %s;\nvar APP_CONFIG = %s;" % (
        json.dumps(data, ensure_ascii=False), json.dumps(app_config, ensure_ascii=False))
    main_js = read_src("weather.js") + "\n" + read_src("render.js")
    html = read_src("template.html")
    html = html.replace("/*__CSS__*/", read_src("dashboard.css"))
    html = html.replace("/*__DATA_JS__*/", data_js)
    html = html.replace("/*__FACTS_JS__*/", read_src("facts.js"))
    html = html.replace("/*__MAIN_JS__*/", main_js)
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(html)
    print(json.dumps({"ok": True, "built": os.path.join(DIST, "index.html"),
                      "eventsToday": len(events_today),
                      "eventsTomorrow": len(events_tomorrow),
                      "photos": len(photos), "errors": errors}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
