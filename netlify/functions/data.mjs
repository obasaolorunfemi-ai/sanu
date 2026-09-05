/* ============================================================================
   GET  /api/data  → the saved report object (or null if nothing saved yet)
   POST /api/data  → save a new report object   { ...data, _key: "<password>" }
   Storage: Netlify Blobs (no external DB, auto-provisioned on deploy).
   Auth for writes: env var EDIT_PASSWORD (set in Netlify → Site config → Env vars).
   ========================================================================== */
import { getStore } from "@netlify/blobs";

const STORE = "sanu-report";
const KEY = "current";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });

export default async (req) => {
  const store = getStore(STORE);

  if (req.method === "GET") {
    const saved = await store.get(KEY, { type: "json" });
    return json(saved ?? null);
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); }
    catch { return json({ error: "Invalid JSON" }, 400); }

    const expected = process.env.EDIT_PASSWORD || "sanu-report-2026";
    const supplied = req.headers.get("x-edit-key") || body._key;
    if (supplied !== expected) return json({ error: "Wrong password" }, 401);

    delete body._key;
    body._updatedAt = new Date().toISOString();
    await store.setJSON(KEY, body);
    return json({ ok: true, updatedAt: body._updatedAt });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/data" };
