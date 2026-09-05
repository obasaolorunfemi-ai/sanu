/* Shared helpers: formatting + tiny DOM utilities */
window.SANU = (function () {
  const nf = new Intl.NumberFormat("en-US");

  function fmt(v, kind) {
    if (v == null || isNaN(v)) return "—";
    switch (kind) {
      case "plus":   return nf.format(Math.round(v)) + "+";
      case "plusK":  return nf.format(Math.round(v / 100) * 100) + "+";
      case "int":    return nf.format(Math.round(v));
      case "naira":  return "₦" + (v / 1e9).toFixed(1) + "B";
      case "usd":    return "$" + nf.format(Math.round(v));
      case "kg":     return (v >= 100 ? nf.format(Math.round(v)) : Math.round(v * 10) / 10) + " kg";
      default:       return nf.format(v);
    }
  }
  /* value without the "+" suffix — for count-up targets and axis labels */
  function fmtBare(v, kind) {
    return fmt(v, kind).replace(/\+$/, "");
  }

  const pct = (a, b) => (a ? Math.round(((b - a) / a) * 100) : 0);

  /* deep-merge saved overrides onto defaults (arrays are replaced wholesale) */
  function merge(base, over) {
    if (Array.isArray(base) || Array.isArray(over) || typeof over !== "object" || over === null) {
      return over === undefined ? base : over;
    }
    const out = Object.assign({}, base);
    for (const k of Object.keys(over)) out[k] = merge(base ? base[k] : undefined, over[k]);
    return out;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* animate a number from 0 (or given start) to end, calling render(cur) each frame */
  function countUp(el, end, kind, opts = {}) {
    const dur = opts.duration || 1100;
    const start = opts.from != null ? opts.from : 0;
    if (reduceMotion) { el.textContent = fmt(end, kind); return; }
    const t0 = performance.now();
    function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(start + (end - start) * eased, kind);
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = fmt(end, kind);
    }
    requestAnimationFrame(step);
  }

  async function loadData() {
    const def = window.SANU_DEFAULT_DATA;
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok) {
        const saved = await r.json();
        if (saved && typeof saved === "object") return { data: merge(def, saved), source: "api", updatedAt: saved._updatedAt };
      }
    } catch (e) { /* offline / file:// / not deployed — fall through */ }
    return { data: def, source: "default" };
  }

  return { fmt, fmtBare, pct, merge, countUp, reduceMotion, loadData };
})();
