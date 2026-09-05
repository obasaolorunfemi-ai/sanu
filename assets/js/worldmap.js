/* ============================================================================
   Dot-matrix world map, drawn on <canvas>. Self-contained: landmasses are
   approximated by a set of lon/lat ellipses, rasterised to a dot grid.
   Active-country pins are HTML elements positioned over the canvas.
   ========================================================================== */
window.SANUMap = (function () {
  // landmass blobs: [centreLon, centreLat, radiusLon, radiusLat]
  const LAND = [
    // North America
    [-100, 45, 33, 19], [-95, 60, 33, 13], [-118, 52, 15, 13], [-150, 64, 13, 8],
    [-83, 17, 11, 6], [-80, 10, 7, 5], [-42, 73, 14, 12],
    // South America
    [-62, -8, 18, 16], [-65, -30, 10, 14], [-70, -44, 6, 9], [-49, -8, 8, 10],
    // Africa
    [12, 20, 22, 16], [24, -2, 17, 15], [26, -28, 11, 9], [45, 8, 6, 8],
    // Europe
    [12, 48, 20, 10], [22, 60, 13, 8], [-3, 53, 5, 6], [26, 42, 12, 7], [-8, 40, 6, 5],
    // Asia
    [80, 60, 85, 15], [60, 46, 32, 13], [45, 32, 13, 10], [78, 23, 12, 12],
    [103, 34, 20, 13], [104, 15, 12, 11], [92, 24, 8, 7],
    // Oceania / islands
    [119, -1, 22, 8], [124, 11, 7, 6], [134, -25, 21, 13], [146, -20, 6, 8],
    [140, 38, 5, 9], [47, -20, 3, 8], [173, -41, 5, 8], [10, 64, 7, 7], [-19, 65, 4, 3]
  ];
  const LON0 = -168, LON1 = 192, LAT0 = 78, LAT1 = -55;

  // approximate [lon, lat] for each active market
  const COORD = {
    "Nigeria": [8, 9], "United Kingdom": [-2, 54], "South Africa": [25, -29],
    "New Zealand": [174, -41], "United States": [-98, 39], "Ireland": [-8, 53],
    "Philippines": [122, 12], "Zimbabwe": [29, -19], "Argentina": [-64, -36],
    "Russia": [55, 58], "Spain": [-4, 40], "Malaysia": [102, 4], "Senegal": [-14, 14],
    "Germany": [10, 51], "Israel": [35, 31], "Ghana": [-1, 8], "Niger": [9, 17],
    "India": [79, 22], "United Arab Emirates": [54, 24]
  };

  const inLand = (lon, lat) =>
    LAND.some(([cx, cy, rx, ry]) => {
      const dx = (lon - cx) / rx, dy = (lat - cy) / ry;
      return dx * dx + dy * dy <= 1;
    });

  const project = (lon, lat, w, h) => [
    ((lon - LON0) / (LON1 - LON0)) * w,
    ((LAT0 - lat) / (LAT0 - LAT1)) * h
  ];

  function render(canvas, opts) {
    const css = getComputedStyle(document.documentElement);
    const dot = (css.getPropertyValue("--map-dot") || "#b9a99a").trim();
    const dotHi = (css.getPropertyValue("--map-dot-hi") || "#a11a1a").trim();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height || rect.width * 0.5;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const stepX = 2.5, stepY = 2.7;
    const hotspots = (opts.countries || []).map(c => COORD[c]).filter(Boolean);
    const near = (x, y) => hotspots.some(([lo, la]) => {
      const [px, py] = project(lo, la, w, h);
      return Math.hypot(px - x, py - y) < 26;
    });

    const dots = [];
    for (let lon = LON0; lon <= LON1; lon += stepX)
      for (let lat = LAT0; lat >= LAT1; lat -= stepY)
        if (inLand(lon, lat)) {
          const [x, y] = project(lon, lat, w, h);
          dots.push([x, y, near(x, y)]);
        }

    const r = Math.max(1.3, Math.min(2.4, w / 360));
    let i = 0;
    const anim = opts.animate && !opts.reduceMotion;
    const t0 = performance.now();

    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      const prog = anim ? Math.min(1, (now - t0) / 900) : 1;
      const shown = Math.floor(dots.length * prog);
      for (let k = 0; k < (anim ? shown : dots.length); k++) {
        const [x, y, hot] = dots[k];
        ctx.beginPath();
        ctx.arc(x, y, hot ? r * 1.15 : r, 0, 6.2832);
        ctx.fillStyle = hot ? dotHi : dot;
        ctx.globalAlpha = hot ? 0.95 : 0.55;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (anim && prog < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { project: (lo, la) => project(lo, la, w, h), size: [w, h] };
  }

  return { render, COORD, project };
})();
