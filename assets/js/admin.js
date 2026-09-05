/* ============================================================================
   SANU REPORT — data form. Builds itself from the data shape, saves to /api/data.
   ========================================================================== */
(function () {
  const { merge } = window.SANU;
  const $ = (s, r = document) => r.querySelector(s);
  const DEF = window.SANU_DEFAULT_DATA;
  let WORK = structuredClone(DEF);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = v => { const n = parseFloat(String(v).replace(/[, ]/g, "")); return isNaN(n) ? 0 : n; };

  function build() {
    const f = $("#form");
    f.innerHTML = "";

    /* --- meta --- */
    f.appendChild(fieldset("Report framing", "", `
      <div class="field"><label>Period label — actual</label>
        <input data-path="meta.periodActual" value="${esc(WORK.meta.periodActual)}"></div>
      <div class="field"><label>Period label — projected</label>
        <input data-path="meta.periodProjected" value="${esc(WORK.meta.periodProjected)}"></div>
      <div class="field"><label>Projection method note</label>
        <textarea data-path="meta.projectionNote">${esc(WORK.meta.projectionNote)}</textarea></div>
    `));

    /* --- KPIs --- */
    f.appendChild(fieldset("Headline KPIs", "The six tiles at the top of the report.",
      abTable(WORK.kpis, "kpis")));

    /* --- other metrics --- */
    f.appendChild(fieldset("Other figures", "Every other number used across the page.",
      abTableObj(WORK.metrics, "metrics")));

    /* --- city share --- */
    f.appendChild(fieldset("Top-3 city split", "Share of the three-city user base (percent).",
      pctTable(WORK.cityShare, "cityShare")));

    /* --- pickups --- */
    f.appendChild(fieldset("Pickups by city", "Cumulative product collections.",
      abRows(WORK.pickups, "pickups")));

    /* --- nigerian states --- */
    f.appendChild(fieldset("Nigerian users by state", "One per line: name, percent.", `
      <div class="field"><textarea data-list="ngStates" data-fmt="namepct">${
        WORK.ngStates.map(d => `${d.name}, ${d.pct}`).join("\n")}</textarea></div>`));

    /* --- countries --- */
    f.appendChild(fieldset("Countries with active users", "One country per line. First line = home market.", `
      <div class="field"><textarea data-list="countries" data-fmt="lines">${
        WORK.countries.join("\n")}</textarea></div>`));

    /* --- products / outlets --- */
    f.appendChild(fieldset("Most-bought gold products", "One per line:  Name | meta", `
      <div class="field"><textarea data-list="goldProducts" data-fmt="namemeta">${
        WORK.goldProducts.map(p => `${p.name} | ${p.meta}`).join("\n")}</textarea></div>`));
    f.appendChild(fieldset("Most-bought silver products", "One per line:  Name | meta", `
      <div class="field"><textarea data-list="silverProducts" data-fmt="namemeta">${
        WORK.silverProducts.map(p => `${p.name} | ${p.meta}`).join("\n")}</textarea></div>`));
    f.appendChild(fieldset("Physical outlets", "One per line:  Name | meta", `
      <div class="field"><textarea data-list="outlets" data-fmt="namemeta">${
        WORK.outlets.map(p => `${p.name} | ${p.meta}`).join("\n")}</textarea></div>`));

    /* --- misc --- */
    f.appendChild(fieldset("Miscellaneous", "", `
      <div class="field"><label>Gold Cube sizes</label>
        <input data-path="cubeSizes" value="${esc(WORK.cubeSizes)}"></div>
      <div class="grid-2">
        <label>Marketing — show</label><div></div>
      </div>
      <div class="field"><label>Powered show</label><input data-path="marketing.show" value="${esc(WORK.marketing.show)}"></div>
      <div class="field"><label>Channel</label><input data-path="marketing.channel" value="${esc(WORK.marketing.channel)}"></div>
      <div class="field"><label>Series</label><input data-path="marketing.series" value="${esc(WORK.marketing.series)}"></div>
    `));
  }

  function fieldset(title, sub, html) {
    const fs = document.createElement("fieldset");
    fs.innerHTML = `<legend>${title}</legend>${sub ? `<div class="fs-sub">${sub}</div>` : ""}${html}`;
    return fs;
  }
  function abTable(arr, key) {
    return `<div class="grid-3"><div class="hd"></div><div class="hd">Actual ’25</div><div class="hd">Proj ’26</div>` +
      arr.map((d, i) => `<label>${esc(d.label)}</label>
        <input type="number" step="any" data-path="${key}.${i}.a" value="${d.a}">
        <input type="number" step="any" data-path="${key}.${i}.p" value="${d.p}">`).join("") + `</div>`;
  }
  function abTableObj(obj, key) {
    return `<div class="grid-3"><div class="hd"></div><div class="hd">Actual ’25</div><div class="hd">Proj ’26</div>` +
      Object.entries(obj).map(([k, d]) => `<label>${esc(d.label)}</label>
        <input type="number" step="any" data-path="${key}.${k}.a" value="${d.a}">
        <input type="number" step="any" data-path="${key}.${k}.p" value="${d.p}">`).join("") + `</div>`;
  }
  function abRows(arr, key) {
    return `<div class="grid-3"><div class="hd"></div><div class="hd">Actual ’25</div><div class="hd">Proj ’26</div>` +
      arr.map((d, i) => `<label>${esc(d.name)}</label>
        <input type="number" step="any" data-path="${key}.${i}.a" value="${d.a}">
        <input type="number" step="any" data-path="${key}.${i}.p" value="${d.p}">`).join("") + `</div>`;
  }
  function pctTable(arr, key) {
    return `<div class="grid-2"><div class="hd"></div><div class="hd">%</div>` +
      arr.map((d, i) => `<label>${esc(d.name)}</label>
        <input type="number" step="any" data-path="${key}.${i}.pct" value="${d.pct}">`).join("") + `</div>`;
  }

  /* ---------- gather ---------- */
  function setPath(obj, path, value) {
    const parts = path.split(".");
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ??= {};
    o[parts[parts.length - 1]] = value;
  }
  function gather() {
    document.querySelectorAll("[data-path]").forEach(el => {
      const raw = el.value;
      setPath(WORK, el.dataset.path, el.type === "number" ? num(raw) : raw);
    });
    document.querySelectorAll("[data-list]").forEach(ta => {
      const lines = ta.value.split("\n").map(l => l.trim()).filter(Boolean);
      const key = ta.dataset.list;
      if (ta.dataset.fmt === "lines") WORK[key] = lines;
      else if (ta.dataset.fmt === "namepct")
        WORK[key] = lines.map(l => { const m = l.split(","); return { name: m.slice(0, -1).join(",").trim(), pct: num(m[m.length - 1]) }; });
      else if (ta.dataset.fmt === "namemeta")
        WORK[key] = lines.map(l => { const m = l.split("|"); return { name: (m[0] || "").trim(), meta: (m[1] || "").trim() }; });
    });
    return WORK;
  }

  /* ---------- io ---------- */
  async function loadCurrent() {
    const status = $("#status");
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok) {
        const saved = await r.json();
        if (saved && typeof saved === "object") {
          WORK = merge(structuredClone(DEF), saved);
          status.textContent = saved._updatedAt
            ? "store online · last saved " + new Date(saved._updatedAt).toLocaleString()
            : "store online · no custom data yet";
        } else { status.textContent = "store online · showing defaults"; }
      } else { status.textContent = "store not reachable · editing defaults (deploy to Netlify to enable saving)"; }
    } catch (e) {
      status.textContent = "store not reachable · editing defaults (run `netlify dev` or deploy to save)";
    }
    build();
  }

  async function save() {
    const btn = $("#save"), msg = $("#msg");
    const pass = $("#pass").value.trim();
    if (!pass) { msg.className = "err"; msg.textContent = "Enter the edit password."; return; }
    const payload = { ...gather(), _key: pass };
    btn.disabled = true; msg.className = ""; msg.textContent = "Saving…";
    try {
      const r = await fetch("/api/data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const out = await r.json().catch(() => ({}));
      if (r.ok && out.ok) {
        msg.className = "ok";
        msg.textContent = "Saved ✓  The dashboard now shows these figures.";
      } else {
        msg.className = "err";
        msg.textContent = out.error || `Save failed (${r.status}).`;
      }
    } catch (e) {
      msg.className = "err";
      msg.textContent = "Save failed — is the site deployed to Netlify?";
    }
    btn.disabled = false;
  }

  function exportFile() {
    const data = gather();
    const clean = structuredClone(data); delete clean._updatedAt;
    const body = "/* Exported from the SANU data form on " + new Date().toISOString() +
      " */\nwindow.SANU_DEFAULT_DATA = " + JSON.stringify(clean, null, 2) + ";\n";
    const blob = new Blob([body], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.js";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  $("#save").addEventListener("click", save);
  $("#reload").addEventListener("click", loadCurrent);
  $("#export").addEventListener("click", exportFile);

  const savedTheme = (function () { try { return localStorage.getItem("sanu-theme"); } catch (e) { return null; } })();
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  loadCurrent();
})();
