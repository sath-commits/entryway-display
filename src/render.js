// ---------------------------------------------------------------
// Dashboard logic — ES5, old-Safari safe.
// Design: Apple HomeView-style glass cards over the rotating
// painting (blurred backdrop; sharp painting in its own card).
// Modes are emphasis shifts of the same card grid, by Pacific
// wall-clock time:
//   05:00-09:30 & 14:30-18:30  departure (hero verdict, full day)
//   18:30-21:00                evening (fact big, today+tomorrow)
//   21:00-05:00                night (dim clock card + tomorrow line)
//   other daytime              idle (photo card grows, slim column)
// After 2 minutes untouched, daytime modes drift to the idle
// layout; any touch brings the info layout back. The page reloads
// itself every 15 minutes and once daily at ~04:00.
// DATA (calendar/photos/fetchedAt) is baked in at build time;
// weather verdicts are live via weather.js (WX).
// ---------------------------------------------------------------
var root = document.getElementById("root");
var IDLE_AFTER_MS = 2 * 60 * 1000;
var PHOTO_ROTATE_MS = ((typeof CFG !== "undefined" && CFG.photoRotateMinutes) || 5) * 60 * 1000;
var lastInteract = new Date().getTime();
var photoActive = false;
var photoTimer = null;
var photoState = { a: 0, b: 1, showA: true, nextAt: 0, appliedKey: "" };
var renderedSig = "";
var reloaded4am = false;
var pageLoadPt = null;

var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad2(n) { return (n < 10 ? "0" : "") + n; }
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// America/Los_Angeles wall-clock parts for a UTC instant, computed
// from the US DST rules (2nd Sun of Mar 10:00 UTC to 1st Sun of
// Nov 09:00 UTC) so no Intl/timezone support is needed.
function nthSundayUtc(year, monthIdx, n, hourUtc) {
  var firstDow = new Date(Date.UTC(year, monthIdx, 1)).getUTCDay();
  var day = 1 + ((7 - firstDow) % 7) + (n - 1) * 7;
  return Date.UTC(year, monthIdx, day, hourUtc);
}
function pacificParts(ms) {
  var year = new Date(ms).getUTCFullYear();
  var dstStart = nthSundayUtc(year, 2, 2, 10);
  var dstEnd = nthSundayUtc(year, 10, 1, 9);
  var offset = (ms >= dstStart && ms < dstEnd) ? -7 * 3600000 : -8 * 3600000;
  var p = new Date(ms + offset);
  return {
    year: p.getUTCFullYear(),
    month: p.getUTCMonth() + 1,
    day: p.getUTCDate(),
    hour: p.getUTCHours(),
    minute: p.getUTCMinutes(),
    minutesOfDay: p.getUTCHours() * 60 + p.getUTCMinutes()
  };
}
function weekdayOf(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}
function dateLabel(pt) {
  return WEEKDAYS[weekdayOf(pt.year, pt.month, pt.day)] + ", " + MONTHS[pt.month - 1] + " " + pt.day;
}
function clockLabel(pt) {
  var h = pt.hour % 12;
  if (h === 0) h = 12;
  return h + ":" + pad2(pt.minute) + " " + (pt.hour < 12 ? "AM" : "PM");
}
function dayKey(pt) { return pt.year + "-" + pt.month + "-" + pt.day; }

function parseIsoMs(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:([+-])(\d{2}):?(\d{2})|Z)?/.exec(s);
  if (!m) return null;
  var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  if (m[7]) {
    var off = (+m[8]) * 3600000 + (+m[9]) * 60000;
    t -= (m[7] === "-" ? -off : off);
  }
  return t;
}
function formatTimeOfDay(iso) {
  var m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return "";
  var h = +m[1];
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + m[2] + " " + (h < 12 ? "AM" : "PM");
}
function formatEventTime(ev) {
  return ev.allDay ? "All day" : formatTimeOfDay(ev.start);
}

function baseMode(min) {
  if (min >= 21 * 60 || min < 5 * 60) return "night";
  if ((min >= 5 * 60 && min < 9 * 60 + 30) || (min >= 14 * 60 + 30 && min < 18 * 60 + 30)) return "departure";
  if (min >= 18 * 60 + 30 && min < 21 * 60) return "evening";
  return "idle";
}
function currentVerdict(min) {
  if (min >= 18 * 60 + 30) return { v: WX.tomorrowMorning, when: "Tomorrow morning" };
  if (min < 12 * 60) return { v: WX.morning, when: "This morning" };
  return { v: WX.afternoon, when: "This afternoon" };
}
function verdictColor(v) {
  if (v.kind === "rain") return "var(--rain)";
  if (v.kind === "none") return "var(--text)";
  return "var(--accent)";
}
function kickerPx(bodyPx) { return Math.max(12, Math.round(bodyPx * 0.62)); }
function verdictPxFor(label, basePx) {
  var len = label.length;
  if (len <= 10) return basePx;
  if (len <= 16) return Math.round(basePx * 0.8);
  if (len <= 24) return Math.round(basePx * 0.6);
  return Math.round(basePx * 0.48);
}

// Full-day event lists: all-day events first (no time shown), then
// timed events in start order. Row states thread one shared NEXT
// highlight across lists via ctx.
function sortedDayEvents(evs) {
  var allDay = [], timed = [], i;
  for (i = 0; i < evs.length; i++) {
    if (evs[i].allDay) allDay.push(evs[i]); else timed.push(evs[i]);
  }
  timed.sort(function (a, b) {
    var am = parseIsoMs(a.start), bm = parseIsoMs(b.start);
    return (am === null ? 0 : am) - (bm === null ? 0 : bm);
  });
  return allDay.concat(timed);
}
function computeStates(evs, nowMs, ctx) {
  var states = [];
  for (var i = 0; i < evs.length; i++) {
    var ev = evs[i];
    if (ev.allDay) states.push("allday");
    else if (parseIsoMs(ev.end) <= nowMs) states.push("done");
    else if (!ctx.nextUsed) { states.push("next"); ctx.nextUsed = true; }
    else states.push("upcoming");
  }
  return states;
}
function listFit(count, basePx) {
  return { px: basePx, compact: count > 5 };
}
function dayEventsSig(evs, nowMs, ctx) {
  var states = computeStates(evs, nowMs, ctx);
  var parts = [];
  for (var i = 0; i < evs.length; i++) parts.push(evs[i].start + "|" + evs[i].title + "|" + states[i]);
  return parts.join("~");
}
function eventRowHtml(ev, eventPx, state, compact) {
  var padY = compact ? 5 : 8;
  var done = state === "done";
  var timeW = Math.round(eventPx * 4.9);
  var timeCell;
  if (ev.allDay) {
    timeCell = '<span style="display:inline-block;width:' + timeW + 'px;margin-right:12px;font-size:' + kickerPx(eventPx) + 'px;font-weight:600;letter-spacing:0.08em;color:var(--dim);vertical-align:top;padding-top:4px">ALL DAY</span>';
  } else {
    timeCell = '<span style="display:inline-block;width:' + timeW + 'px;margin-right:12px;font-size:' + eventPx + 'px;font-weight:700;color:' + (done ? "var(--dim)" : "var(--accent)") + ';white-space:nowrap;vertical-align:top">' + esc(formatTimeOfDay(ev.start)) + "</span>";
  }
  var main = '<span style="display:inline-block;width:calc(100% - ' + (timeW + 14) + 'px);vertical-align:top">' +
    '<span style="font-size:' + eventPx + 'px;font-weight:600' + (done ? ";color:var(--dim)" : "") + '">' + esc(ev.title) + "</span>";
  if (ev.location) {
    main += '<div style="font-size:' + kickerPx(eventPx) + 'px;color:var(--dim);margin-top:2px">' + esc(ev.location.split("\n")[0]) + "</div>";
  }
  main += "</span>";
  var inner = timeCell + main;
  if (state === "next") {
    return '<div style="background:var(--next-fill);border-left:5px solid var(--accent);border-radius:10px;padding:' + padY + 'px 12px;margin:5px 0;overflow:hidden">' +
      '<span style="float:right;font-size:' + kickerPx(eventPx) + 'px;font-weight:600;letter-spacing:0.12em;color:var(--accent);margin-left:12px">NEXT</span>' + inner + "</div>";
  }
  return '<div style="padding:' + padY + 'px 2px;border-bottom:1px solid var(--row-border)">' + inner + "</div>";
}
function eventRowsHtml(evs, nowMs, fit, ctx) {
  var states = computeStates(evs, nowMs, ctx);
  var html = "";
  for (var i = 0; i < evs.length; i++) html += eventRowHtml(evs[i], fit.px, states[i], fit.compact);
  return html;
}

// ---- Card grid geometry (percent of viewport), per layout. ----
var VARIANTS = {
  b: {
    info: {
      hero:     { l: 3,  t: 4,  w: 50, h: 42 },
      calendar: { l: 3,  t: 49, w: 50, h: 47 },
      clock:    { l: 55, t: 4,  w: 42, h: 15 },
      tomorrow: { l: 55, t: 21, w: 42, h: 19 },
      photo:    { l: 55, t: 42, w: 42, h: 34 },
      trio:     { l: 55, t: 80, w: 42, h: 16 }
    },
    evening: {
      hero:     { l: 3,  t: 4,  w: 50, h: 42 },
      calendar: { l: 3,  t: 49, w: 50, h: 47 },
      clock:    { l: 55, t: 4,  w: 42, h: 15 },
      tomorrow: { l: 55, t: 21, w: 42, h: 19 },
      photo:    { l: 55, t: 42, w: 42, h: 34 },
      trio:     { l: 55, t: 80, w: 42, h: 16 }
    },
    idle: {
      photo:    { l: 3,  t: 4,  w: 62, h: 92 },
      clock:    { l: 68, t: 4,  w: 29, h: 14 },
      verdict:  { l: 68, t: 20, w: 29, h: 20 },
      trio:     { l: 68, t: 42, w: 29, h: 22 },
      calendar: { l: 68, t: 66, w: 29, h: 30 }
    }
  },
  a: {
    info: {
      photo:    { l: 3,  t: 4,  w: 62, h: 92 },
      clock:    { l: 68, t: 4,  w: 29, h: 14 },
      verdict:  { l: 68, t: 20, w: 29, h: 20 },
      trio:     { l: 68, t: 42, w: 29, h: 22 },
      calendar: { l: 68, t: 66, w: 29, h: 30 }
    },
    evening: {
      photo:    { l: 3,  t: 4,  w: 62, h: 92 },
      clock:    { l: 68, t: 4,  w: 29, h: 14 },
      tomorrow: { l: 68, t: 20, w: 29, h: 20 },
      trio:     { l: 68, t: 42, w: 29, h: 24 },
      calendar: { l: 68, t: 68, w: 29, h: 28 }
    },
    idle: {
      photo:    { l: 3,  t: 4,  w: 62, h: 92 },
      clock:    { l: 68, t: 4,  w: 29, h: 14 },
      verdict:  { l: 68, t: 20, w: 29, h: 20 },
      trio:     { l: 68, t: 42, w: 29, h: 22 },
      calendar: { l: 68, t: 66, w: 29, h: 30 }
    }
  },
  c: {
    all: {
      clock:    { l: 3,  t: 4,  w: 30, h: 15 },
      verdict:  { l: 35, t: 4,  w: 62, h: 15 },
      photo:    { l: 3,  t: 21, w: 44, h: 52 },
      calendar: { l: 49, t: 21, w: 48, h: 52 },
      trio:     { l: 3,  t: 75, w: 62, h: 21 },
      side:     { l: 67, t: 75, w: 30, h: 21 }
    }
  }
};
function layoutVariant() {
  if (typeof FORCE_LAYOUT !== "undefined" && FORCE_LAYOUT) return FORCE_LAYOUT;
  var m = /[?&]v=([abc])/.exec(window.location.search || "");
  return m ? m[1] : "a";
}

function geoStyle(g) {
  return "left:" + g.l + "%;top:" + g.t + "%;width:" + g.w + "%;height:" + g.h + "%";
}
function cardHtml(g, inner, extraClass) {
  return '<div class="card' + (extraClass ? " " + extraClass : "") + '" style="' + geoStyle(g) + '">' +
    '<div class="card-inner">' + inner + "</div></div>";
}

function stampHtml(bodyPx, stale) {
  if (!DATA.fetchedAt) return "";
  var h = '<span style="color:var(--dim);font-size:' + Math.round(bodyPx * 0.66) + 'px">Updated ' + esc(formatTimeOfDay(DATA.fetchedAt));
  if (stale) h += ' <span style="color:var(--accent);font-weight:700">· stale</span>';
  if (DATA.errors.length > 0) h += '<span style="color:var(--accent)"> · some info may be old</span>';
  return h + "</span>";
}

function heroCardHtml(g, pt, s) {
  var cv = currentVerdict(pt.minutesOfDay);
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)">' + esc(cv.when) + " · Jacket call</div>";
  if (!cv.v) {
    inner += '<div style="font-size:' + Math.round(s.verdictPx * 0.42) + 'px;font-weight:600;margin-top:14px">Weather is on its way…</div>' +
      '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:8px">The live forecast hasn\'t loaded yet. This card fills in by itself.</div>';
  } else {
    inner += '<div style="font-size:' + verdictPxFor(cv.v.label, s.verdictPx) + 'px;line-height:1.04;font-weight:600;letter-spacing:-0.01em;text-transform:uppercase;color:' + verdictColor(cv.v) + ';margin-top:12px">' + esc(cv.v.label) + "</div>" +
      '<div style="font-size:' + s.bodyPx + 'px;color:var(--text);margin-top:14px">' + esc(cv.v.detail) + "</div>" +
      (WX.now && WX.now.tempF !== null ? '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:6px">Now ' + WX.now.tempF + UNIT + (WX.now.cond ? " · " + esc(WX.now.cond) : "") + " · Hi " + WX.now.hiF + "° · Lo " + WX.now.loF + "°" + (CFG.placeName ? " in " + esc(CFG.placeName) : "") + "</div>" : (WX.currentTempF !== null ? '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:6px">Now ' + WX.currentTempF + UNIT + (CFG.placeName ? " in " + esc(CFG.placeName) : "") + "</div>" : ""));
  }
  return cardHtml(g, inner, "card-strong");
}

function clockCardHtml(g, pt, s, stale) {
  var inner = '<div class="js-clock" style="font-size:' + s.clockPx + 'px;font-weight:600;line-height:1">' + esc(clockLabel(pt)) + "</div>" +
    '<div style="overflow:hidden;margin-top:8px"><span style="float:left;font-size:' + s.bodyPx + 'px;color:var(--dim)">' + esc(dateLabel(pt)) + "</span>" +
    '<span style="float:right">' + stampHtml(s.bodyPx, stale) + "</span></div>";
  return cardHtml(g, inner);
}

function photoCardHtml(g, s) {
  var inner;
  if (DATA.photos.length > 0) {
    inner = '<div id="photoA" class="photo-layer visible"></div><div id="photoB" class="photo-layer"></div>' +
      '<div class="photo-caption" id="photoCaption" style="font-size:' + Math.max(12, kickerPx(s.bodyPx)) + 'px"></div>';
    return '<div class="card" style="' + geoStyle(g) + ';padding:0">' + inner + "</div>";
  }
  inner = '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);line-height:1.45">' +
    (DATA.photoFolderFound
      ? "Add photos to the photos folder, rebuild, and they'll shuffle here."
      : "Put some favourite photos or paintings in the photos folder, rebuild, and they'll shuffle here.") + "</div>";
  return '<div class="card idle-scene" style="' + geoStyle(g) + '"><div class="card-inner">' + inner + "</div></div>";
}

function calendarCardHtml(g, s, sections, stripOnly) {
  // sections: [{label, evs}] sharing one NEXT ctx, in order.
  var nowMs = new Date().getTime();
  var ctx = { nextUsed: false };
  var total = 0, i;
  for (i = 0; i < sections.length; i++) total += sections[i].evs.length;
  var fit = listFit(stripOnly ? Math.min(total, 6) : total, s.eventPx);
  var html = "";
  for (i = 0; i < sections.length; i++) {
    var evs = sortedDayEvents(sections[i].evs);
    html += '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)' + (i > 0 ? ";margin-top:14px" : "") + '">' + esc(sections[i].label) + "</div>";
    if (stripOnly) {
      // Idle strip: finished events drop off; keep all-day + what's left.
      var states = computeStates(evs, nowMs, ctx);
      var rows = "", shown = 0;
      for (var j = 0; j < evs.length; j++) {
        if (states[j] === "done") continue;
        rows += eventRowHtml(evs[j], fit.px, states[j], fit.compact);
        shown++;
      }
      html += shown ? rows : '<div style="font-size:' + fit.px + 'px;color:var(--dim);padding:10px 0">Nothing left today.</div>';
    } else if (evs.length > 0) {
      html += eventRowsHtml(evs, nowMs, fit, ctx);
    } else {
      html += '<div style="font-size:' + fit.px + 'px;color:var(--dim);padding:10px 0">' +
        (DATA.calendarFound ? "Nothing on the Family calendar." : "Family calendar not found — check the calendar connection.") + "</div>";
    }
  }
  return '<div class="card" style="' + geoStyle(g) + '"><div class="card-inner scroll-inner"><div class="scroll-area">' + html + '</div><div class="scroll-fade"></div></div></div>';
}

function wxTomorrowCardHtml(g, s) {
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)">Weather now · Tomorrow</div>';
  var n = WX.now;
  if (n && n.tempF !== null) {
    inner += '<div style="font-size:' + s.bodyPx + 'px;margin-top:6px"><span style="font-weight:600">' + n.tempF + UNIT + "</span>" +
      (n.cond ? ' <span style="color:var(--text)">' + esc(n.cond) + "</span>" : "") +
      '<span style="color:var(--dim)"> · Hi ' + n.hiF + "° · Lo " + n.loF + "°</span></div>";
  }
  var tv = WX.tomorrowMorning;
  if (tv) {
    inner += '<div style="font-size:' + s.bodyPx + 'px;margin-top:6px">Tomorrow: <span style="font-weight:600;text-transform:uppercase;color:' + verdictColor(tv) + '">' + esc(tv.label) + "</span>" +
      '<span style="color:var(--dim)"> · ' + esc(tv.detail) + "</span></div>";
  }
  var first = DATA.eventsTomorrow[0];
  if (first) {
    inner += '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:4px">' +
      (first.allDay ? "" : '<span style="font-weight:700;color:var(--accent)">' + esc(formatTimeOfDay(first.start)) + "</span> ") +
      esc(first.title) + "</div>";
  }
  return cardHtml(g, inner);
}

var trioState = { idx: 0, timer: null };
function trioPanelInner(kind, pt, s, big) {
  var inner = "";
  if (kind === "fact") {
    var f = factForDate(pt.year, pt.month, pt.day);
    inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--accent)">Fact of the day · ' + esc(CATEGORY_LABELS[f.category]) + "</div>";
    if (big) {
      inner += '<div style="font-size:' + s.factPx + 'px;line-height:1.3;font-weight:600;margin-top:14px">' + esc(f.fact.text) + "</div>";
    } else {
      inner += '<div class="fact-clamp" style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;line-height:1.35;margin-top:8px">' + esc(f.fact.text) + "</div>";
    }
  } else if (kind === "quote") {
    var q = quoteForDate(pt.year, pt.month, pt.day);
    inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--accent)">Quote of the day</div>' +
      '<div class="' + (big ? "" : "fact-clamp") + '" style="font-size:' + (big ? s.factPx : Math.round(s.bodyPx * 0.88)) + 'px;line-height:1.35;font-weight:600;margin-top:' + (big ? 14 : 8) + 'px">&ldquo;' + esc(q.text) + '&rdquo;</div>' +
      '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:8px">— ' + esc(q.author) + "</div>";
  } else {
    var w = wordForDate(pt.year, pt.month, pt.day);
    inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--accent)">Word of the day</div>' +
      '<div style="font-size:' + (big ? s.factPx : s.factPx) + 'px;font-weight:600;margin-top:' + (big ? 12 : 6) + 'px">' + esc(w.word) +
      '<span style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);font-weight:400;margin-left:10px">' + esc(w.pron) + "</span></div>" +
      '<div class="' + (big ? "" : "fact-clamp-3") + '" style="font-size:' + (big ? s.bodyPx : Math.round(s.bodyPx * 0.88)) + 'px;line-height:1.35;margin-top:6px">' + esc(w.meaning) + "</div>";
    if (big) inner += '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:10px;font-style:italic">' + esc(w.example) + "</div>";
  }
  return inner;
}
function trioCardHtml(g, pt, s, big) {
  var kinds = ["fact", "quote", "word"];
  var panels = "";
  for (var i = 0; i < 3; i++) {
    panels += '<div id="trioPanel' + i + '" style="display:' + (i === trioState.idx ? "block" : "none") + '">' + trioPanelInner(kinds[i], pt, s, big) + "</div>";
  }
  var dots = '<div style="margin-top:10px">';
  for (var d = 0; d < 3; d++) {
    dots += '<span id="trioDot' + d + '" style="display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:' + (d === trioState.idx ? "var(--accent)" : "rgba(255,255,255,0.25)") + '"></span>';
  }
  dots += "</div>";
  return cardHtml(g, panels + dots, big ? "card-strong" : "");
}

function fitCards() {
  var cards = document.getElementsByClassName("card");
  for (var c = 0; c < cards.length; c++) {
    var inner = null;
    for (var k = 0; k < cards[c].childNodes.length; k++) {
      var n = cards[c].childNodes[k];
      if (n.nodeType === 1 && n.className && ("" + n.className).indexOf("card-inner") >= 0) { inner = n; break; }
    }
    if (!inner) continue;
    if (("" + inner.className).indexOf("scroll-inner") >= 0) continue;
    inner.style.webkitTransform = "";
    inner.style.transform = "";
    inner.style.width = "";
    inner.style.height = "";
    var availH = inner.clientHeight, availW = inner.clientWidth;
    var needH = inner.scrollHeight, needW = inner.scrollWidth;
    if (!availH || !needH) continue;
    var kScale = Math.min(1, availH / needH, availW > 0 && needW > 0 ? availW / needW : 1);
    if (kScale < 0.72) kScale = 0.72;
    if (kScale < 0.999) {
      inner.style.width = (100 / kScale) + "%";
      inner.style.height = (100 / kScale) + "%";
      inner.style.webkitTransformOrigin = "top left";
      inner.style.transformOrigin = "top left";
      inner.style.webkitTransform = "scale(" + kScale + ")";
      inner.style.transform = "scale(" + kScale + ")";
    }
  }
}

function startTrioCycle() {
  if (trioState.timer) return;
  trioState.timer = window.setInterval(function () {
    trioState.idx = (trioState.idx + 1) % 3;
    for (var i = 0; i < 3; i++) {
      var el = document.getElementById("trioPanel" + i);
      if (el) el.style.display = (i === trioState.idx) ? "block" : "none";
      var dot = document.getElementById("trioDot" + i);
      if (dot) dot.style.background = (i === trioState.idx) ? "#f2b134" : "rgba(255,255,255,0.25)";
    }
    fitCards();
  }, 45000);
}

function factCardHtml(g, pt, s, big) {
  var f = factForDate(pt.year, pt.month, pt.day);
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--accent)">Fact of the day · ' + esc(CATEGORY_LABELS[f.category]) + "</div>";
  if (big) {
    inner += '<div style="font-size:' + s.factPx + 'px;line-height:1.3;font-weight:600;margin-top:14px">' + esc(f.fact.text) + "</div>" +
      '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:16px;font-style:italic">Ask at dinner: ' + esc(f.fact.dinner) + "</div>";
  } else {
    inner += '<div class="fact-clamp-3" style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;line-height:1.35;margin-top:8px">' + esc(f.fact.text) + "</div>";
  }
  return cardHtml(g, inner, big ? "card-strong" : "");
}

function verdictTileHtml(g, s, v, whenLabel) {
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)">' + esc(whenLabel) + "</div>";
  if (v) {
    inner += '<div style="font-size:' + verdictPxFor(v.label, Math.round(s.verdictPx * 0.52)) + 'px;line-height:1.08;font-weight:600;text-transform:uppercase;color:' + verdictColor(v) + ';margin-top:8px">' + esc(v.label) + "</div>" +
      '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:6px">' + esc(v.detail) + "</div>";
  } else {
    inner += '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:8px">Forecast loading…</div>';
  }
    if (WX.now && WX.now.tempF !== null && v) {
    inner += '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:8px">' + WX.now.tempF + UNIT + " now" + (WX.now.cond ? " · " + esc(WX.now.cond) : "") + " · Hi " + WX.now.hiF + "° · Lo " + WX.now.loF + "°</div>";
  }
  return cardHtml(g, inner);
}

function weatherCardHtml(g, s, layout) {
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)">' + esc((typeof CFG !== "undefined" && CFG.placeName) || "Local") + ' weather</div>';
  var n = WX.now;
  if (!n || n.tempF === null) {
    inner += '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:8px">Loading…</div>';
    return cardHtml(g, inner);
  }
  if (layout === "strip") {
    inner = '<div style="font-size:' + s.bodyPx + 'px;margin-top:2px"><span style="font-weight:600">' + n.tempF + UNIT + "</span>" +
      (n.cond ? ' <span style="color:var(--text)">' + esc(n.cond) + "</span>" : "") +
      '<span style="color:var(--dim)"> · Hi ' + n.hiF + "° · Lo " + n.loF + "°</span></div>";
    return cardHtml(g, inner);
  }
  inner += '<div style="margin-top:6px"><span style="font-size:' + s.factPx + 'px;font-weight:600;line-height:1">' + n.tempF + "°</span>" +
    (n.cond ? '<span style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--text);margin-left:10px">' + esc(n.cond) + "</span>" : "") + "</div>" +
    '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:7px">Hi ' + n.hiF + "° · Lo " + n.loF + "°" +
    (n.rainMax !== null && n.rainMax >= 2 ? " · Rain up to " + n.rainMax + "%" : "") + "</div>";
  return cardHtml(g, inner);
}

function tomorrowCardHtml(g, s) {
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--dim)">Tomorrow</div>';
  var tv = WX.tomorrowMorning;
  if (tv) {
    inner += '<div style="font-size:' + s.bodyPx + 'px;font-weight:600;text-transform:uppercase;color:' + verdictColor(tv) + ';margin-top:6px;line-height:1.15">' + esc(tv.label) + "</div>" +
      '<div style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;color:var(--dim);margin-top:4px">' + esc(tv.detail) + "</div>";
  } else {
    inner += '<div style="font-size:' + s.bodyPx + 'px;color:var(--dim);margin-top:8px">Loading…</div>';
  }
  var first = DATA.eventsTomorrow[0];
  if (first) {
    inner += '<div class="fact-clamp-3" style="font-size:' + Math.round(s.bodyPx * 0.88) + 'px;margin-top:8px;line-height:1.3">' +
      (first.allDay ? "" : '<span style="font-weight:700;color:var(--accent)">' + esc(formatTimeOfDay(first.start)) + "</span> ") +
      esc(first.title) + "</div>";
  }
  return cardHtml(g, inner);
}

function dinnerCardHtml(g, pt, s) {
  var f = factForDate(pt.year, pt.month, pt.day);
  var inner = '<div class="kicker" style="font-size:' + kickerPx(s.bodyPx) + 'px;color:var(--accent)">Ask at dinner</div>' +
    '<div class="fact-clamp-3" style="font-size:' + s.bodyPx + 'px;line-height:1.35;margin-top:8px;font-style:italic">' + esc(f.fact.dinner) + "</div>";
  return cardHtml(g, inner);
}

function backdropHtml() {
  if (DATA.photos.length > 0) {
    return '<div id="bgA" class="bg-layer visible"></div><div id="bgB" class="bg-layer"></div><div class="bg-scrim"></div>';
  }
  return '<div class="bg-layer idle-scene visible" style="-webkit-filter:none;filter:none;-webkit-transform:none;transform:none"></div><div class="bg-scrim"></div>';
}

function gridHtml(view, pt, s, stale) {
  var G = VARIANTS.b;
  var html = backdropHtml();
  if (view === "departure") {
    html += heroCardHtml(G.info.hero, pt, s);
    html += clockCardHtml(G.info.clock, pt, s, stale);
    html += tomorrowCardHtml(G.info.tomorrow, s);
    html += photoCardHtml(G.info.photo, s);
    html += calendarCardHtml(G.info.calendar, s, [{ label: "Today for the family", evs: DATA.eventsToday }], false);
    html += trioCardHtml(G.info.trio, pt, s, false);
  } else if (view === "evening") {
    html += trioCardHtml(G.evening.hero, pt, s, true);
    html += clockCardHtml(G.evening.clock, pt, s, stale);
    html += wxTomorrowCardHtml(G.evening.tomorrow, s);
    html += photoCardHtml(G.evening.photo, s);
    html += calendarCardHtml(G.evening.calendar, s, [
      { label: "Today", evs: DATA.eventsToday },
      { label: "Tomorrow", evs: DATA.eventsTomorrow }
    ], false);
    html += dinnerCardHtml(G.evening.trio, pt, s);
  } else { // idle layout
    html += photoCardHtml(G.idle.photo, s);
    html += clockCardHtml(G.idle.clock, pt, s, stale);
    var cv = currentVerdict(pt.minutesOfDay);
    html += verdictTileHtml(G.idle.verdict, s, cv.v, cv.when);
    html += calendarCardHtml(G.idle.calendar, s, [{ label: "Today", evs: DATA.eventsToday }], true);
    html += trioCardHtml(G.idle.trio, pt, s, false);
  }
  return html;
}

function gridHtmlA(view, pt, s, stale) {
  var G = VARIANTS.a;
  var html = backdropHtml();
  var cv = currentVerdict(pt.minutesOfDay);
  if (view === "departure") {
    html += photoCardHtml(G.info.photo, s);
    html += clockCardHtml(G.info.clock, pt, s, stale);
    html += verdictTileHtml(G.info.verdict, s, cv.v, cv.when);
    html += trioCardHtml(G.info.trio, pt, s, false);
    html += calendarCardHtml(G.info.calendar, s, [{ label: "Today", evs: DATA.eventsToday }], false);
  } else if (view === "evening") {
    html += photoCardHtml(G.evening.photo, s);
    html += clockCardHtml(G.evening.clock, pt, s, stale);
    html += wxTomorrowCardHtml(G.evening.tomorrow, s);
    html += trioCardHtml(G.evening.trio, pt, s, false);
    html += calendarCardHtml(G.evening.calendar, s, [
      { label: "Today", evs: DATA.eventsToday },
      { label: "Tomorrow", evs: DATA.eventsTomorrow }
    ], false);
  } else {
    html += photoCardHtml(G.idle.photo, s);
    html += clockCardHtml(G.idle.clock, pt, s, stale);
    html += verdictTileHtml(G.idle.verdict, s, cv.v, cv.when);
    html += calendarCardHtml(G.idle.calendar, s, [{ label: "Today", evs: DATA.eventsToday }], true);
    html += trioCardHtml(G.idle.trio, pt, s, false);
  }
  return html;
}

function gridHtmlC(view, pt, s, stale) {
  var G = VARIANTS.c.all;
  var html = backdropHtml();
  var cv = currentVerdict(pt.minutesOfDay);
  html += clockCardHtml(G.clock, pt, s, stale);
  html += verdictTileHtml(G.verdict, s, cv.v, cv.when);
  html += photoCardHtml(G.photo, s);
  if (view === "evening") {
    html += calendarCardHtml(G.calendar, s, [
      { label: "Today", evs: DATA.eventsToday },
      { label: "Tomorrow", evs: DATA.eventsTomorrow }
    ], false);
    html += wxTomorrowCardHtml(G.side, s);
  } else if (view === "departure") {
    html += calendarCardHtml(G.calendar, s, [{ label: "Today for the family", evs: DATA.eventsToday }], false);
    html += tomorrowCardHtml(G.side, s);
  } else {
    html += calendarCardHtml(G.calendar, s, [{ label: "Today", evs: DATA.eventsToday }], true);
    html += weatherCardHtml(G.side, s, "full");
  }
  html += trioCardHtml(G.trio, pt, s, false);
  return html;
}

function gridHtmlFor(variant, view, pt, s, stale) {
  if (variant === "a") return gridHtmlA(view, pt, s, stale);
  if (variant === "c") return gridHtmlC(view, pt, s, stale);
  return gridHtml(view, pt, s, stale);
}

function nightHtml(pt, s) {
  var tv = WX.tomorrowMorning;
  var first = DATA.eventsTomorrow[0];
  var parts = [];
  if (tv) parts.push(tv.label);
  if (first) parts.push(first.allDay ? first.title : first.title + " " + formatEventTime(first));
  var html = '<div class="card" style="left:29%;top:34%;width:42%;height:32%;background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.05);box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none">' +
    '<div class="card-inner" style="text-align:center;padding-top:4.5vh">' +
    '<div class="js-clock" style="font-size:' + s.nightClockPx + 'px;font-weight:700;color:var(--night-text);line-height:1">' + esc(clockLabel(pt)) + "</div>" +
    '<div style="font-size:' + s.bodyPx + 'px;color:var(--night-text);margin-top:10px">' + esc(dateLabel(pt)) + "</div>";
  if (parts.length > 0) {
    html += '<div style="font-size:' + Math.max(13, Math.round(s.bodyPx * 0.88)) + 'px;color:var(--night-text);margin-top:16px;line-height:1.35">Tomorrow: ' + esc(parts.join(" · ")) + "</div>";
  }
  html += "</div></div>";
  return html;
}

function layerUrl(i) {
  var photos = DATA.photos;
  if (!photos.length) return "";
  return photos[i % photos.length].url;
}
function applyPhotoLayers() {
  var key = photoState.a + "/" + photoState.b + "/" + (photoState.showA ? "A" : "B") + "/" + DATA.photos.length;
  var bgAEl = document.getElementById("bgA");
  if (bgAEl && bgAEl.getAttribute("data-k") === key) return;
  var urlA = 'url("' + layerUrl(photoState.a) + '")';
  var urlB = 'url("' + layerUrl(photoState.b) + '")';
  var ids = ["bgA", "bgB", "photoA", "photoB"], urls = [urlA, urlB, urlA, urlB], i, el;
  for (i = 0; i < ids.length; i++) {
    el = document.getElementById(ids[i]);
    if (!el) continue;
    el.style.backgroundImage = urls[i];
    el.setAttribute("data-k", key);
    var isA = (i % 2 === 0);
    el.className = (ids[i].indexOf("bg") === 0 ? "bg-layer" : "photo-layer") + ((isA === photoState.showA) ? " visible" : "");
  }
  var cap = document.getElementById("photoCaption");
  if (cap) {
    var idx = photoState.showA ? photoState.a : photoState.b;
    cap.innerHTML = DATA.photos.length ? esc(DATA.photos[idx % DATA.photos.length].name) : "";
  }
}
function startPhotoRotation() {
  applyPhotoLayers();
  if (DATA.photos.length < 2) return;
  if (!photoState.nextAt) photoState.nextAt = new Date().getTime() + PHOTO_ROTATE_MS;
  photoTimer = window.setInterval(function () {
    if (new Date().getTime() < photoState.nextAt) return;
    photoState.nextAt = new Date().getTime() + PHOTO_ROTATE_MS;
    var visibleIdx = photoState.showA ? photoState.a : photoState.b;
    var next = (visibleIdx + 1) % DATA.photos.length;
    if (photoState.showA) photoState.b = next; else photoState.a = next;
    photoState.showA = !photoState.showA;
    applyPhotoLayers();
  }, 5000);
}
function stopPhotoRotation() {
  if (photoTimer) { window.clearInterval(photoTimer); photoTimer = null; }
}

function updateClocks(pt) {
  var els = document.getElementsByClassName("js-clock");
  var label = clockLabel(pt);
  for (var i = 0; i < els.length; i++) els[i].innerHTML = label;
}

function weatherSig() {
  function L(v) { return v ? v.label : "-"; }
  return L(WX.morning) + "/" + L(WX.afternoon) + "/" + L(WX.tomorrowMorning) + "/" +
    (WX.currentTempF === null ? "-" : WX.currentTempF) + "/" + (WX.now ? WX.now.cond : "-");
}

function render(force) {
  var nowMs = new Date().getTime();
  var pt = pacificParts(nowMs);
  var mode = baseMode(pt.minutesOfDay);
  var view = mode === "night" ? "night" : ((photoActive || mode === "idle") ? "idle" : mode);
  var stale = DATA.fetchedAt ? (nowMs - parseIsoMs(DATA.fetchedAt) > 60 * 60 * 1000) : false;
  var sig = view + "|" + (stale ? "stale" : "fresh") + "|" + weatherSig();
  if (view === "departure" || view === "idle") sig += "|" + dayEventsSig(sortedDayEvents(DATA.eventsToday), nowMs, { nextUsed: false });
  if (view === "evening") {
    var sigCtx = { nextUsed: false };
    sig += "|" + dayEventsSig(sortedDayEvents(DATA.eventsToday), nowMs, sigCtx) + "/" + dayEventsSig(sortedDayEvents(DATA.eventsTomorrow), nowMs, sigCtx);
  }
  if (!force && sig === renderedSig) { updateClocks(pt); return; }
  renderedSig = sig;
  stopPhotoRotation();
  var w = window.innerWidth || 1024;
  var vw = Math.min(w, 1150);
  var s = {
    verdictPx: Math.round(vw * 0.058),
    clockPx: Math.round(vw * 0.042),
    nightClockPx: Math.round(vw * 0.09),
    factPx: Math.round(vw * 0.023),
    eventPx: Math.round(vw * 0.017),
    bodyPx: Math.round(vw * 0.017)
  };
  root.style.background = mode === "night" ? "var(--night-bg)" : "var(--bg)";
  if (view === "night") { root.innerHTML = nightHtml(pt, s);
  fitCards(); return; }
  root.innerHTML = gridHtmlFor(layoutVariant(), view, pt, s, stale);
  startPhotoRotation();
  startTrioCycle();
  fitCards();
}

function interact() {
  lastInteract = new Date().getTime();
  if (photoActive) { photoActive = false; render(true); }
}
root.addEventListener("click", interact, false);
root.addEventListener("touchstart", interact, false);
window.addEventListener("resize", function () { render(true); }, false);

// Preload the rotation so crossfades never flash an empty layer.
for (var pi = 0; pi < DATA.photos.length; pi++) {
  var img = new Image();
  img.src = DATA.photos[pi].url;
}

pageLoadPt = pacificParts(new Date().getTime());
render(true);
fetchWeather();
window.setInterval(fetchWeather, 15 * 60 * 1000);

window.setInterval(function () {
  var nowMs = new Date().getTime();
  var pt = pacificParts(nowMs);
  if (nowMs - lastInteract > IDLE_AFTER_MS && baseMode(pt.minutesOfDay) !== "night") {
    photoActive = true;
  }
  // Daily self-reload at ~04:00 Pacific (only if this page instance
  // was loaded before 04:00, so it can't loop within the minute).
  if (pt.hour === 4 && pt.minute === 0 && !reloaded4am && pageLoadPt &&
      (dayKey(pageLoadPt) !== dayKey(pt) || pageLoadPt.minutesOfDay < 240)) {
    reloaded4am = true;
    window.location.reload();
    return;
  }
  render(false);
}, 1000);

// Pick up rebuilds: reload every 15 minutes.
window.setInterval(function () { window.location.reload(); }, 15 * 60 * 1000);
