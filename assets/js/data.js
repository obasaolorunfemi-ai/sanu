/* ============================================================================
   SANU REPORT — DEFAULT DATA
   ----------------------------------------------------------------------------
   This is the fallback dataset. The live dashboard first tries GET /api/data
   (Netlify function backed by Netlify Blobs); whatever the admin form last
   saved there wins. If nothing is saved — or the API is unreachable — this
   object is used instead.

   To change numbers permanently WITHOUT the form: edit the values below and
   commit. `a` = actual (Jul 2022–Jul 2025). `p` = projected (Jul 2026).
   ========================================================================== */
window.SANU_DEFAULT_DATA = {
  meta: {
    periodActual: "July 2022 – July 2025",
    periodProjected: "Projected — July 2026",
    projectionNote:
      "July 2026 figures are modelled, not reported. Each cumulative total is grown by an assumed 12-month rate for its category: digital adoption +50% (downloads, app transactions, transfers), trading value & weight +55–70% (volume growth plus higher gold/silver prices and ₦ depreciation), and fixed footprint +15–45% (vault clients, pickups, outlets, countries).",
  },

  /* headline KPI strip */
  kpis: [
    { key: "users",      label: "Verified users",     fmt: "plus",  a: 6400,   p: 9100 },
    { key: "downloads",  label: "App downloads",      fmt: "plus",  a: 8195,   p: 12300 },
    { key: "totalValue", label: "Gold + silver sold", fmt: "naira", a: 4.0e9,  p: 6.5e9 },
    { key: "txns",       label: "App transactions",   fmt: "plus",  a: 6312,   p: 9470 },
    { key: "s2s",        label: "SANU2SANU transfers",fmt: "plus",  a: 1207,   p: 1930 },
    { key: "countries",  label: "Countries reached",  fmt: "int",   a: 19,     p: 24 }
  ],

  /* other single figures referenced around the page */
  metrics: {
    usersNg:        { label: "Verified users in Nigeria",        fmt: "plusK", a: 5900,   p: 8400 },
    currencies:     { label: "Currencies supported",             fmt: "int",   a: 12,     p: 16 },
    vault:          { label: "Clients vaulting with Kian Smith", fmt: "int",   a: 15,     p: 22 },
    releases:       { label: "App version releases",             fmt: "int",   a: 25,     p: 40 },
    releasesRecent: { label: "Releases in the last 6 months",    fmt: "int",   a: 8,      p: 14 },
    pickTotal:      { label: "Total product pickups",            fmt: "int",   a: 256,    p: 361 },
    yt:             { label: "‘Legacy of Traditions’ YouTube views", fmt: "int", a: 19000, p: 38000 },
    goldAppValue:   { label: "Gold sold via the app (USD)",      fmt: "usd",   a: 605986, p: 1030000 },
    silverAppValue: { label: "Silver sold via the app (USD)",    fmt: "usd",   a: 141782, p: 241000 },
    goldAppKg:      { label: "Gold sold via the app (kg)",       fmt: "kg",    a: 5.5,    p: 8.5 },
    silverAppKg:    { label: "Silver sold via the app (kg)",     fmt: "kg",    a: 60,     p: 93 },
    goldRetailKg:   { label: "Gold sold via retail desk (kg)",   fmt: "kg",    a: 66,     p: 90 },
    silverRetailKg: { label: "Silver sold via retail desk (kg)", fmt: "kg",    a: 952,    p: 1295 }
  },

  /* top-3 city split — share of the three-city user base (%) */
  cityShare: [
    { name: "Lagos", pct: 45.2 },
    { name: "Kano",  pct: 34.1 },
    { name: "Abuja", pct: 20.7 }
  ],

  /* product pickups by city */
  pickups: [
    { name: "Lagos", a: 206, p: 290 },
    { name: "Abuja", a: 29,  p: 41 },
    { name: "Kano",  a: 21,  p: 30 }
  ],

  /* Nigerian users by state — indicative share (%), read off the report's chart */
  ngStates: [
    { name: "Lagos", pct: 29 },  { name: "Kano", pct: 24 },  { name: "Abuja", pct: 13 },
    { name: "Ogun", pct: 6.0 },  { name: "Kaduna", pct: 3.6 },{ name: "Ibadan", pct: 3.1 },
    { name: "Osun", pct: 2.7 },  { name: "Warri", pct: 2.3 }, { name: "Enugu", pct: 2.0 },
    { name: "Port Harcourt", pct: 1.8 }, { name: "Abia", pct: 1.5 }, { name: "Anambra", pct: 1.3 },
    { name: "Other — 16 states", pct: 9.9 }
  ],

  /* countries with active users (Nigeria first = home market) */
  countries: [
    "Nigeria", "United Kingdom", "South Africa", "New Zealand", "United States",
    "Ireland", "Philippines", "Zimbabwe", "Argentina", "Russia", "Spain",
    "Malaysia", "Senegal", "Germany", "Israel", "Ghana", "Niger", "India",
    "United Arab Emirates"
  ],

  goldProducts: [
    { name: "Britannia coin",   meta: "THE ROYAL MINT · 1 oz" },
    { name: "Valcambi cast bar", meta: "5 g" },
    { name: "Argor-Heraeus bar", meta: "10 g" },
    { name: "Valcambi bar",      meta: "250 g" }
  ],
  silverProducts: [
    { name: "Maple Leaf coin",     meta: "ROYAL CANADIAN MINT · 1 oz" },
    { name: "Valcambi bar",        meta: "10 g" },
    { name: "Vienna Philharmonic", meta: "1 oz" },
    { name: "Krugerrand coin",     meta: "1 oz" },
    { name: "Britannia coin",      meta: "1 oz" },
    { name: "American Eagle",      meta: "1 oz" }
  ],

  outlets: [
    { name: "SANU Store, Victoria Island", meta: "LAGOS · RELAUNCHED" },
    { name: "Gilda Grace, Ado Bayero Mall", meta: "KANO · NEW" }
  ],

  cubeSizes: "1 g · 2 g · 5 g · 10 g",
  marketing: {
    show: "Battle of the Northern Kitchen",
    channel: "Arewa24",
    series: "Legacy of Traditions"
  }
};
