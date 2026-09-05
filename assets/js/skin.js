/* Shared design-skin switcher — "classic" (default) vs "editorial". */
window.SANUSkin = (function () {
  function safe(fn, d) { try { return fn(); } catch (e) { return d; } }
  function get() { return safe(() => localStorage.getItem("sanu-skin"), null) || "classic"; }
  function set(s) {
    s = s === "editorial" ? "editorial" : "classic";
    document.documentElement.dataset.skin = s;
    safe(() => localStorage.setItem("sanu-skin", s));
    document.dispatchEvent(new CustomEvent("skinchange", { detail: s }));
  }
  function toggle() { set(get() === "editorial" ? "classic" : "editorial"); }
  set(get());
  return { get, set, toggle };
})();
