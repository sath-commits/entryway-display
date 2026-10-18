// ---------------------------------------------------------------
// Entryway Display — live weather + jacket verdicts.
// Weather is fetched client-side from Open-Meteo (free, no API key)
// at load and re-fetched every 15 minutes. The jacket verdict for a
// departure window uses these rules (see README to tune them):
//   rain >= 50% in window -> RAIN JACKET + RAIN SHOES
//   rain 30-49%           -> HOODED JACKET
//   coldest temp in window, by band -> WARM JACKET / NORMAL JACKET /
//                                      HOODIE / NO JACKET NEEDED
// Config comes from window.APP_CONFIG (written by build.py from
// config.json): latitude, longitude, timezone, tempUnit, placeName.

var CFG = (typeof APP_CONFIG !== "undefined" && APP_CONFIG) || {};
var UNIT = CFG.tempUnit === "fahrenheit" ? "°F" : "°C";
var TH = CFG.tempUnit === "fahrenheit" ? { warm: 45, normal: 55, hoodie: 65 } : { warm: 7.2, normal: 12.8, hoodie: 18.3 };
var WX = { currentTempF: null, morning: null, afternoon: null, tomorrowMorning: null, now: null };

function codeLabel(c) {
  if (c === 0) return "Clear";
  if (c === 1 || c === 2) return "Partly cloudy";
  if (c === 3) return "Overcast";
  if (c === 45 || c === 48) return "Foggy";
  if (c >= 51 && c <= 57) return "Drizzle";
  if (c >= 61 && c <= 67) return "Rain";
  if (c >= 71 && c <= 77) return "Snow";
  if (c >= 80 && c <= 82) return "Rain showers";
  if (c >= 85 && c <= 86) return "Snow showers";
  if (c >= 95) return "Thunderstorm";
  return "";
}

function hourWord(h) {
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (h < 12 ? "am" : "pm");
}

function verdictForWindow(hours, startH, endH) {
  var tempF = null, maxRain = 0, maxRainHour = null, found = false, i, e;
  for (i = 0; i < hours.length; i++) {
    e = hours[i];
    if (e.hour < startH || e.hour >= endH) continue;
    found = true;
    if (tempF === null) tempF = e.temp;
    if (e.rain > maxRain) { maxRain = e.rain; maxRainHour = e.hour; }
  }
  if (!found || tempF === null) return null;
  tempF = Math.round(tempF);
  var label, kind;
  if (maxRain >= 50) { label = "RAIN JACKET + RAIN SHOES"; kind = "rain"; }
  else if (maxRain >= 30) { label = "HOODED JACKET"; kind = "hooded"; }
  else if (tempF < TH.warm) { label = "WARM JACKET"; kind = "warm"; }
  else if (tempF <= TH.normal) { label = "NORMAL JACKET"; kind = "normal"; }
  else if (tempF <= TH.hoodie) { label = "HOODIE"; kind = "hoodie"; }
  else { label = "NO JACKET NEEDED"; kind = "none"; }
  var detail;
  if (maxRain >= 2 && maxRainHour !== null) {
    detail = "Rain " + maxRain + "% at " + hourWord(maxRainHour) + " · " + tempF + UNIT;
  } else {
    detail = "No rain expected · " + tempF + UNIT;
  }
  return { label: label, detail: detail, kind: kind, maxRainPct: maxRain, tempF: tempF };
}

function applyWeather(json) {
  try {
    if (json.current && typeof json.current.temperature_2m === "number") {
      WX.currentTempF = Math.round(json.current.temperature_2m);
    }
    var times = json.hourly.time, temps = json.hourly.temperature_2m,
        rains = json.hourly.precipitation_probability;
    var byDate = {}, i, dk;
    for (i = 0; i < times.length; i++) {
      dk = times[i].substring(0, 10);
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push({
        hour: parseInt(times[i].substring(11, 13), 10),
        temp: temps[i],
        rain: (rains && rains[i] !== null && rains[i] !== undefined) ? rains[i] : 0
      });
    }
    var pt = pacificParts(new Date().getTime());
    var todayKey = pt.year + "-" + pad2(pt.month) + "-" + pad2(pt.day);
    var tm = new Date(Date.UTC(pt.year, pt.month - 1, pt.day) + 86400000);
    var tomKey = tm.getUTCFullYear() + "-" + pad2(tm.getUTCMonth() + 1) + "-" + pad2(tm.getUTCDate());
    if (json.daily && json.daily.time) {
      for (i = 0; i < json.daily.time.length; i++) {
        if (json.daily.time[i] === todayKey) {
          WX.now = {
            tempF: WX.currentTempF,
            cond: json.current ? codeLabel(json.current.weather_code) : "",
            hiF: Math.round(json.daily.temperature_2m_max[i]),
            loF: Math.round(json.daily.temperature_2m_min[i]),
            rainMax: json.daily.precipitation_probability_max ? json.daily.precipitation_probability_max[i] : null
          };
        }
      }
    }
    if (byDate[todayKey]) {
      WX.morning = verdictForWindow(byDate[todayKey], 7, 9);
      WX.afternoon = verdictForWindow(byDate[todayKey], 15, 18);
    }
    if (byDate[tomKey]) WX.tomorrowMorning = verdictForWindow(byDate[tomKey], 7, 9);
  } catch (e) { /* keep previous values on any parse hiccup */ }
  renderedSig = "";
  render(false);
}

function fetchWeather() {
  try {
    var xhr = new XMLHttpRequest();
    var lat = CFG.latitude != null ? CFG.latitude : 47.6062;
    var lon = CFG.longitude != null ? CFG.longitude : -122.3321;
    var tz = CFG.timezone || "auto";
    xhr.open("GET", "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&temperature_unit=" + (CFG.tempUnit === "fahrenheit" ? "fahrenheit" : "celsius") +
      "&timezone=" + encodeURIComponent(tz) + "&forecast_days=3", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try { applyWeather(JSON.parse(xhr.responseText)); } catch (e) {}
      }
    };
    xhr.send(null);
  } catch (e) { /* offline etc. — page keeps last verdicts */ }
}
