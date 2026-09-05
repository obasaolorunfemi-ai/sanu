/* ============================================================================
   SANU REPORT — dashboard
   ========================================================================== */
(function () {
  const { fmt, fmtBare, pct, countUp, reduceMotion, loadData } = window.SANU;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let DATA, MODE = safeGet("sanu-mode") || "actual";
  const val = o => o[MODE === "projected" ? "p" : "a"];

  function safeGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------------- charts ---------------- */
  function barRows(elId, rows, { fmtKind, labelW = 96, max, proj = true }) {
    const el = document.getElementById(elId);
    if (!el) return;
    const M = max ?? Math.max(...rows.map(d => Math.max(d.a ?? d.value, d.p ?? d.value)));
    el.style.setProperty("--lab", labelW + "px");
    el.innerHTML = rows.map(d => {
      const v = d.value != null ? d.value : val(d);
      const w = Math.max(2, (v / M) * 100);
      const cls = d.cls === "gold" ? "gold" : d.cls === "silver" ? "silver" : "";
      return `<div class="row">
        <span class="rl">${d.name || d.label}</span>
        <div class="track${proj ? " proj" : ""}">
          <div class="fill${proj ? " proj" : ""} ${cls}" data-w="${w}" style="width:0"
               data-tip="${d.name || d.label}: ${fmt(v, fmtKind)}"></div>
        </div>
        <span class="rv tnum">${fmt(v, fmtKind)}</span>
      </div>`;
    }).join("");
    return el;
  }

  function animateBars(el) {
    if (!el) return;
    $$(".fill", el).forEach(f => {
      const w = f.dataset.w;
      if (reduceMotion) { f.style.width = w + "%"; }
      else requestAnimationFrame(() => { f.style.width = w + "%"; });
    });
  }

  function renderDonut(elId, parts, colors) {
    const el = document.getElementById(elId);
    if (!el) return;
    const C = 2 * Math.PI * 42;
    let acc = 0;
    const rings = parts.map((p, i) => {
      const frac = p.pct / 100;
      const seg = `<circle r="42" cx="60" cy="60" stroke="${colors[i]}"
        stroke-dasharray="0 ${C}" data-len="${frac * C}"
        stroke-dashoffset="${-acc * C}" transform="rotate(-90 60 60)"/>`;
      acc += frac;
      return seg;
    }).join("");
    el.innerHTML = `<svg class="donut" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="d-track" r="42" cx="60" cy="60"/>${rings}</svg>
      <div class="donut-legend">${parts.map((p, i) =>
        `<span><i style="background:${colors[i]}"></i>${p.name} <b>${p.pct}%</b></span>`).join("")}</div>`;
  }
  function animateDonut(elId) {
    const el = document.getElementById(elId); if (!el) return;
    const C = 2 * Math.PI * 42;
    $$("circle[data-len]", el).forEach(c => {
      const len = +c.dataset.len;
      c.style.strokeDasharray = reduceMotion ? `${len} ${C}` : `0 ${C}`;
      if (!reduceMotion) requestAnimationFrame(() => { c.style.strokeDasharray = `${len} ${C}`; });
    });
  }

  /* cumulative-value trajectory (indexed line: launch → 2025 → 2026) */
  function renderSpark(elId) {
    const el = document.getElementById(elId); if (!el) return;
    const W = 460, H = 170, pad = 22;
    const pts = MODE === "projected"
      ? [["’22", 4], ["’23", 22], ["’24", 55], ["’25", 100], ["’26", 163]]
      : [["’22", 4], ["’23", 22], ["’24", 55], ["’25", 100]];
    const maxY = 170;
    const X = i => pad + (i / 4) * (W - pad * 2);
    const Y = v => H - pad - (v / maxY) * (H - pad * 2);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(" ");
    const area = `${line} L${X(pts.length - 1)} ${H - pad} L${X(0)} ${H - pad} Z`;
    const labs = pts.map((p, i) => `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${p[0]}</text>`).join("");
    const projMark = MODE === "projected"
      ? `<line class="grid-l" x1="${X(3)}" y1="${pad}" x2="${X(3)}" y2="${H - pad}" stroke-dasharray="3 3"/>` : "";
    el.innerHTML = `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <line class="grid-l" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}"/>
      ${projMark}
      <path class="area" d="${area}"/>
      <path class="line" d="${line}"/>
      <circle class="dot-end" cx="${X(pts.length - 1)}" cy="${Y(pts[pts.length - 1][1])}" r="4"/>
      ${labs}
    </svg>`;
  }

  /* ---------------- world map ---------------- */
  let mapAPI;
  function renderMap() {
    const box = $("#mapBox"); if (!box) return;
    const canvas = $("#mapCanvas");
    mapAPI = window.SANUMap.render(canvas, {
      countries: DATA.countries,
      animate: box.classList.contains("in"),
      reduceMotion
    });
    // pins
    $$(".pin", box).forEach(p => p.remove());
    const [w, h] = mapAPI.size;
    DATA.countries.forEach(name => {
      const c = window.SANUMap.COORD[name]; if (!c) return;
      const [x, y] = mapAPI.project(c[0], c[1]);
      const pin = document.createElement("div");
      pin.className = "pin" + (name === "Nigeria" ? " home" : "");
      pin.style.left = (x / w * 100) + "%";
      pin.style.top = (y / h * 100) + "%";
      pin.tabIndex = 0;
      pin.innerHTML = `<span class="lbl">${name}</span>`;
      box.appendChild(pin);
    });
  }

  /* ---------------- KPI strip ---------------- */
  let kpiBuilt = false;
  function renderKpis(fromMode) {
    const band = $("#kpiBand");
    if (!kpiBuilt) {
      band.innerHTML = DATA.kpis.map((k, i) => {
        const cls = k.key === "totalValue" ? "g" : k.key === "s2s" ? "s" : "";
        return `<div class="kpi ${cls}" style="--i:${i}">
          <div class="k-label">${k.label}</div>
          <div class="k-val tnum" data-k="${k.key}">—</div>
          <div class="k-foot">
            <span class="base">cumulative · 3 yrs</span>
            <span class="delta">▲ +${pct(k.a, k.p)}% <span style="font-weight:500">vs ’25</span></span>
          </div>
        </div>`;
      }).join("");
      kpiBuilt = true;
    }
    $$(".kpi .k-val", band).forEach(el => {
      const k = DATA.kpis.find(x => x.key === el.dataset.k);
      const from = fromMode ? k[fromMode === "projected" ? "p" : "a"] : 0;
      countUp(el, val(k), k.fmt, { from, duration: fromMode ? 700 : 1100 });
    });
  }

  /* elements bound by [data-metric] */
  function renderMetrics(fromMode) {
    const map = {};
    DATA.kpis.forEach(k => map[k.key] = k);
    Object.entries(DATA.metrics).forEach(([kk, m]) => map[kk] = { ...m, key: kk });
    $$("[data-metric]").forEach(el => {
      const m = map[el.dataset.metric]; if (!m) return;
      // only animate when the element is in view; otherwise set text (IO re-kicks later)
      const seen = el.closest(".reveal");
      if ((!seen || seen.classList.contains("in"))) {
        const from = fromMode ? m[fromMode === "projected" ? "p" : "a"] : 0;
        countUp(el, val(m), m.fmt, { from, duration: fromMode ? 700 : 1000 });
      } else {
        el.textContent = fmt(val(m), m.fmt);
        el.dataset.pending = "1";
      }
    });
  }

  /* ---------------- lists ---------------- */
  function renderLists() {
    const g = $("#goldProducts"), s = $("#silverProducts"), o = $("#outlets"),
          ng = $("#ngTable"), cc = $("#countryChips");
    if (g) g.innerHTML = DATA.goldProducts.map((p, i) =>
      `<li><span class="rk">${i + 1}</span><span class="nm">${p.name}</span><span class="mt">${p.meta}</span></li>`).join("");
    if (s) s.innerHTML = DATA.silverProducts.map((p, i) =>
      `<li><span class="rk">${i + 1}</span><span class="nm">${p.name}</span><span class="mt">${p.meta}</span></li>`).join("");
    if (o) o.innerHTML = DATA.outlets.map(p =>
      `<li><span class="rk">◆</span><span class="nm">${p.name}</span><span class="mt">${p.meta}</span></li>`).join("");
    if (ng) ng.innerHTML = DATA.ngStates.map(d => `<tr><td>${d.name}</td><td>${d.pct}%</td></tr>`).join("");
    $$("[data-cube]").forEach(el => el.textContent = DATA.cubeSizes);
    if (cc) {
      const extra = val(DATA.kpis.find(k => k.key === "countries")) - DATA.countries.length;
      cc.innerHTML = DATA.countries.map(c =>
        `<span class="chip${c === "Nigeria" ? " hi" : ""}">${c}</span>`).join("")
        + `<span class="chip ghost">+ ${extra} projected market${extra === 1 ? "" : "s"}</span>`;
    }
  }

  /* ---------------- Nigerian-state chart ---------------- */
  function renderNg() {
    const el = $("#ngChart"); if (!el) return;
    const total = val(DATA.metrics.usersNg);
    const M = DATA.ngStates[0].pct;
    el.style.setProperty("--lab", "104px");
    el.innerHTML = DATA.ngStates.map(d => {
      const users = Math.round(total * d.pct / 100 / 50) * 50;
      const w = Math.max(2, d.pct / M * 100);
      return `<div class="row">
        <span class="rl">${d.name}</span>
        <div class="track"><div class="fill" data-w="${w}" style="width:0"
          data-tip="${d.name}: ~${d.pct}% · ~${users.toLocaleString()} users"></div></div>
        <span class="rv tnum">${d.pct}%</span>
      </div>`;
    }).join("");
  }

  function renderCityStack() {
    const el = $("#cityStack"); if (!el) return;
    const cols = ["s0", "s1", "s2"];
    el.innerHTML = DATA.cityShare.map((c, i) =>
      `<div class="${cols[i]}" style="width:0" data-w="${c.pct}">${c.name}</div>`).join("");
    $("#cityKey").innerHTML = DATA.cityShare.map((c, i) =>
      `<span><i style="background:var(--seg-${["a","b","c"][i]})"></i>${c.name}&nbsp;${Math.round(c.pct)}%</span>`).join("");
  }
  function animateStack() {
    const el = $("#cityStack"); if (!el) return;
    $$("div", el).forEach(d => {
      if (reduceMotion) d.style.width = d.dataset.w + "%";
      else requestAnimationFrame(() => { d.style.width = d.dataset.w + "%"; });
    });
  }

  function renderWtTable() {
    const t = $("#wtTable"); if (!t) return;
    const m = DATA.metrics;
    const rows = [
      ["Gold · app", m.goldAppKg], ["Silver · app", m.silverAppKg],
      ["Gold · retail", m.goldRetailKg], ["Silver · retail", m.silverRetailKg]
    ];
    t.innerHTML = rows.map(([l, d]) => `<tr><td>${l}</td><td>${fmt(d.a, "kg")}</td><td>${fmt(d.p, "kg")}</td></tr>`).join("");
  }

  /* ---------------- master render ---------------- */
  function render(fromMode) {
    document.body.dataset.mode = MODE;
    $("#mActual").setAttribute("aria-pressed", MODE === "actual");
    $("#mProj").setAttribute("aria-pressed", MODE === "projected");
    $("#periodLabel").textContent =
      MODE === "projected" ? DATA.meta.periodProjected : DATA.meta.periodActual;
    $("#methodNote").innerHTML = "<b>About the projection.</b> " + DATA.meta.projectionNote +
      " Every value lives in one <code>REPORT</code> object — or edit it from the " +
      "<a href='admin.html'>data form</a>.";

    renderKpis(fromMode);
    renderMetrics(fromMode);
    renderLists();
    renderNg();
    renderCityStack();
    renderWtTable();
    renderSpark("spark");

    const m = DATA.metrics;
    barRows("valChart", [
      { name: "Gold",   cls: "gold",   a: m.goldAppValue.a,   p: m.goldAppValue.p },
      { name: "Silver", cls: "silver", a: m.silverAppValue.a, p: m.silverAppValue.p }
    ], { fmtKind: "usd", labelW: 58 });
    barRows("wtApp", [
      { name: "Gold",   cls: "gold",   a: m.goldAppKg.a,   p: m.goldAppKg.p },
      { name: "Silver", cls: "silver", a: m.silverAppKg.a, p: m.silverAppKg.p }
    ], { fmtKind: "kg", labelW: 58 });
    barRows("wtRetail", [
      { name: "Gold",   cls: "gold",   a: m.goldRetailKg.a,   p: m.goldRetailKg.p },
      { name: "Silver", cls: "silver", a: m.silverRetailKg.a, p: m.silverRetailKg.p }
    ], { fmtKind: "kg", labelW: 58 });
    barRows("pickChart", DATA.pickups, { fmtKind: "int", labelW: 58 });

    renderDonut("valDonut", [
      { name: "Gold", pct: Math.round(val(m.goldAppValue) / (val(m.goldAppValue) + val(m.silverAppValue)) * 100) },
      { name: "Silver", pct: Math.round(val(m.silverAppValue) / (val(m.goldAppValue) + val(m.silverAppValue)) * 100) }
    ], [getCss("--gold"), getCss("--silver")]);

    if ($("#mapBox")) renderMap();

    // re-run anything already on screen (e.g. after a mode/theme toggle)
    $$(".reveal.in").forEach(kickCharts);
  }
  const getCss = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function kickCharts(scope) {
    $$(".chart", scope).forEach(animateBars);
    if (scope.querySelector?.("#cityStack") || scope.id === "cityStack") animateStack();
    if (scope.querySelector?.("#valDonut")) animateDonut("valDonut");
    const sp = scope.querySelector?.("#spark") || (scope.id === "spark" ? scope : null);
    if (sp) sp.classList.add("in");
    if (scope.querySelector?.("#mapBox")) { $("#mapBox").classList.add("in"); renderMap(); }
    // pending count-ups inside this scope
    $$("[data-metric][data-pending]", scope).forEach(el => {
      const key = el.dataset.metric;
      const m = DATA.metrics[key] || DATA.kpis.find(k => k.key === key);
      if (m) { countUp(el, val(m), m.fmt, { from: 0 }); el.removeAttribute("data-pending"); }
    });
  }

  /* ---------------- interactions ---------------- */
  function wireToggles() {
    $("#mActual").addEventListener("click", () => setMode("actual"));
    $("#mProj").addEventListener("click", () => setMode("projected"));
    function setMode(m) {
      if (m === MODE) return;
      const prev = MODE;
      MODE = m; safeSet("sanu-mode", m); render(prev);
    }
    const themeBtn = $("#theme");
    const saved = safeGet("sanu-theme");
    if (saved) document.documentElement.dataset.theme = saved;
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      safeSet("sanu-theme", next);
      render(null);
    });

    const skinBtn = $("#skin"), skinLink = $("#drawerSkin");
    if (skinBtn) skinBtn.addEventListener("click", () => window.SANUSkin.toggle());
    if (skinLink) skinLink.addEventListener("click", e => { e.preventDefault(); window.SANUSkin.toggle(); });
    let st;
    document.addEventListener("skinchange", () => {
      clearTimeout(st);
      st = setTimeout(() => { render(null); renderMap(); }, 60);
    });
  }

  function wireDrawer() {
    const back = $("#drawerBack"), drawer = $("#drawer"), open = $("#hamburger"), close = $("#drawerClose");
    const set = o => {
      back.classList.toggle("open", o); drawer.classList.toggle("open", o);
      open.setAttribute("aria-expanded", o);
      document.body.style.overflow = o ? "hidden" : "";
      if (o) drawer.querySelector("a").focus();
    };
    open.addEventListener("click", () => set(true));
    close.addEventListener("click", () => set(false));
    back.addEventListener("click", () => set(false));
    $$("#drawer a").forEach(a => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  }

  function wireReveal() {
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); kickCharts(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    $$(".reveal").forEach(el => io.observe(el));
  }

  function wireSpy() {
    const links = $$("nav.secs a, #drawer a[href^='#']")
      .filter(l => /^#\w/.test(l.getAttribute("href")));
    const ids = [...new Set(links.map(l => l.getAttribute("href")))];
    const io = new IntersectionObserver(ents => {
      ents.forEach(e => {
        if (e.isIntersecting) {
          const id = "#" + e.target.id;
          links.forEach(l => l.setAttribute("aria-current", String(l.getAttribute("href") === id)));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach(id => { const s = $(id); if (s) io.observe(s); });
  }

  function wireTooltip() {
    const tip = $("#tip");
    document.addEventListener("pointerover", e => {
      const t = e.target.closest("[data-tip]"); if (!t) return;
      tip.textContent = t.dataset.tip; tip.classList.add("on");
    });
    document.addEventListener("pointermove", e => {
      if (!tip.classList.contains("on")) return;
      tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + "px";
      tip.style.top = (e.clientY + 16) + "px";
    });
    document.addEventListener("pointerout", e => {
      if (e.target.closest("[data-tip]")) tip.classList.remove("on");
    });
  }

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => renderMap(), 200); });

  /* ---------------- boot ---------------- */
  /* guard against partially-saved data: keep array shapes complete by key */
  function normalize(d) {
    const D = window.SANU_DEFAULT_DATA;
    if (!Array.isArray(d.kpis) || d.kpis.length !== D.kpis.length) {
      d.kpis = D.kpis.map(def => (d.kpis || []).find(k => k.key === def.key) || def);
    }
    d.metrics = window.SANU.merge(D.metrics, d.metrics || {});
    ["cityShare", "pickups", "ngStates", "countries", "goldProducts", "silverProducts", "outlets"]
      .forEach(k => { if (!Array.isArray(d[k]) || !d[k].length) d[k] = D[k]; });
    d.meta = window.SANU.merge(D.meta, d.meta || {});
    if (!d.cubeSizes) d.cubeSizes = D.cubeSizes;
    return d;
  }

  (async function boot() {
    const { data, source, updatedAt } = await loadData();
    DATA = normalize(data);
    const badge = $("#dataSrc");
    if (badge) {
      badge.innerHTML = source === "api"
        ? `<b>Live data</b>${updatedAt ? " · updated " + new Date(updatedAt).toLocaleDateString() : ""}`
        : "Default figures";
    }
    wireToggles();
    wireDrawer();
    wireTooltip();
    render(null);
    wireReveal();
    wireSpy();
  })();
})();
