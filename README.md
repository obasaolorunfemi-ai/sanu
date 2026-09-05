# The SANU Report

An interactive dashboard of SANU (Kian Smith) results — verified users, gold &
silver traded, operations, product and growth — for **July 2022 – July 2025**,
with a toggle to modelled **July 2026** projections.

Built as a static site with one Netlify Function so the numbers can be edited
from a form without a redeploy.

## Structure

```
index.html               cover page — logo, headline, "Enter the report", style picker
report.html              the dashboard
admin.html               the data-entry form  (/admin.html)
assets/css/styles.css    base styling, light + dark themes
assets/css/editorial.css the "Editorial" design skin (poster treatment)
assets/js/skin.js        design-skin switcher (classic ⇄ editorial), shared
assets/js/data.js        DEFAULT dataset  (fallback + schema)
assets/js/util.js        formatting, count-up, data loader
assets/js/worldmap.js    dot-matrix world map + country coordinates
assets/js/dashboard.js   dashboard logic
assets/js/admin.js       the form
assets/img/              product photos (from the July 2025 report), the SANU logo, favicons
netlify/functions/data.mjs   GET/POST the editable dataset (Netlify Blobs)
netlify.toml             build + routing config
```

## Two design styles

The report ships with two interchangeable looks, chosen on the cover page or from
the header (**Classic** / **Editorial**). The choice is remembered per browser.

- **Classic** — the clean card-based dashboard.
- **Editorial** — a poster-campaign treatment: paper grain, oversized headlines
  with serif accents, hairline-ruled blocks and sculptural gradient forms, in the
  same SANU palette.

## Editing the numbers

**Option A — the form (no redeploy).** Go to `/admin.html`, change any value,
enter the edit password and press **Save to dashboard**. The data is stored in
[Netlify Blobs](https://docs.netlify.com/blobs/overview/); every visitor picks it
up on their next load. Works only on the deployed site (or under `netlify dev`).

**Option B — the code.** Edit `assets/js/data.js` and commit. `a` = actual
(Jul 2022–Jul 2025), `p` = projected (Jul 2026). The form’s **Download data.js**
button exports the current values in this exact format.

Saved data (Option A) always wins over `data.js` when present.

## Deploy to Netlify

1. Push this repo to GitHub (already at `github.com/obasaolorunfemi-ai/sanu`).
2. In Netlify: **Add new site → Import from Git** → pick this repo.
   Build command: *none*. Publish directory: `.` (both come from `netlify.toml`).
3. After the first deploy, set the edit password:
   **Site configuration → Environment variables → Add** `EDIT_PASSWORD` = *your choice*.
   (Until you set it, the fallback password is `sanu-report-2026` — change it.)
4. Netlify Blobs is enabled automatically; nothing else to configure.

## Local development

```bash
npm install
npm run dev        # netlify dev — serves the site + the function + Blobs
```

Opening the files directly (file://) also works — the dashboard just falls back
to the default dataset because `/api/data` isn't available.

## Data caveats

Actual figures are from the SANU Report (July 2022 – July 2025). Nigerian-state
shares and the Lagos/Kano/Abuja split are **indicative**, read from the report's
charts. Projected 2026 figures are estimates prepared for this dashboard.
