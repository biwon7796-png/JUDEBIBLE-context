"use strict";
// Declared external references (identifiers only) → data/reference/declared.external-refs.json
// Reads the approved research notes that are already in the projection (path + recorded sha256) and extracts the external identifiers
// the note itself declares (OpenBible / Wikidata / GeoNames / Pleiades). It reads notes only; it never changes the projection, never
// fetches anything and never decides a binding — tools/reference/build.py resolves these declarations against the Reference Layer.
//   node tools/pipeline/external-refs.js [--check]
// Fail-safe: a note that cannot be read, or whose sha256 differs from the one recorded in the projection, keeps its last known good
// declarations (reported as `preserved`), so a missing vault never erases bindings.
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..", ".."), OUT = path.join(ROOT, "data", "reference", "declared.external-refs.json");
const PROJ = path.join(ROOT, "data", "projection.research.js");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const loadProjection = () => { const w = { window: {} }; vm.runInNewContext(fs.readFileSync(PROJ, "utf8"), w); return w.window.BVC_PROJECTION; };

// nearest preceding markdown heading = the source locator of a declaration
function locatorAt(lines, i) { for (let k = i; k >= 0; k--) { const m = /^(#{1,4})\s+(.*\S)/.exec(lines[k]); if (m) return m[2].replace(/\s+/g, " ").slice(0, 80); } return null; }
const slugName = (s) => String(s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function extract(text) {
  const lines = text.split(/\r?\n/), found = new Map();
  const add = (e, i) => { const key = e.provider + ":" + e.kind + ":" + e.ext_id; const prev = found.get(key) || { provider: e.provider, kind: e.kind, ext_id: e.ext_id, name: null, url: null, coords: null, role: null, locator: null, lines: [] };
    ["name", "url", "role"].forEach((k) => { if (e[k] && !prev[k]) prev[k] = e[k]; }); if (e.coords && !prev.coords) prev.coords = e.coords; if (!prev.locator) prev.locator = locatorAt(lines, i); prev.lines.push(i + 1); found.set(key, prev); };
  const OB = "OpenBible.info";
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    let m;
    // OpenBible URLs: /geo/modern/<id>/<slug>, /geo/ancient/<id>/<slug>, /geo/data/<id>.geojson
    const reUrl = /https?:\/\/(?:www\.|a\.)?openbible\.info\/geo\/(modern|ancient|data)\/([am][0-9a-f]{5,7})(?:\/([\w-]+))?(\.geojson)?/g;
    while ((m = reUrl.exec(L))) { const kind = m[1] === "data" ? (m[2][0] === "a" ? "ancient" : "modern") : m[1]; add({ provider: OB, kind, ext_id: m[2], name: m[3] ? slugName(m[3]) : null, url: m[0], role: m[1] === "data" ? "geometry_data_locator" : null }, i); }
    // declared ids
    if ((m = /\b(?:source_ancient_id|ancient_id):\s*(a[0-9a-f]{5,7})\b/.exec(L))) add({ provider: OB, kind: "ancient", ext_id: m[1], role: "ancient_identity" }, i);
    if ((m = /\bmodern_basis_id:\s*(m[0-9a-f]{5,7})\b/.exec(L))) add({ provider: OB, kind: "modern", ext_id: m[1], role: "representative_basis" }, i);
    if (/^\s*modern_association_ids:\s*$/.test(L)) for (let k = i + 1; k < lines.length && /^\s*-\s+\S/.test(lines[k]); k++) { const mm = /^\s*-\s+(m[0-9a-f]{5,7})\b/.exec(lines[k]); if (mm) add({ provider: OB, kind: "modern", ext_id: mm[1], role: "representative_basis" }, k); }
    if ((m = /^\s*geometry_record:\s*$/.test(L) && /^\s*id:\s*(g[0-9a-f]{5,7})\b/.exec(lines[i + 1] || ""))) add({ provider: OB, kind: "geometry", ext_id: m[1], role: "isoband_reference_geometry" }, i + 1);
    // Wikidata / GeoNames / Pleiades (only explicit id forms)
    const reWd = /\bwikidata(?:_id)?\s*[:=]\s*(Q\d{2,})\b|wikidata\.org\/(?:wiki|entity)\/(Q\d{2,})/gi; while ((m = reWd.exec(L))) add({ provider: "Wikidata", kind: "entity", ext_id: m[1] || m[2] }, i);
    const reGn = /\bgeonames(?:_id)?\s*[:=]\s*(\d{4,})\b|geonames\.org\/(\d{4,})/gi; while ((m = reGn.exec(L))) add({ provider: "GeoNames", kind: "feature", ext_id: m[1] || m[2] }, i);
    const rePl = /pleiades\.stoa\.org\/places\/(\d{3,})/gi; while ((m = rePl.exec(L))) add({ provider: "Pleiades", kind: "place", ext_id: m[1] }, i);
  }
  // names / coordinates are attached from the same OpenBible association block (modern_name, displayed_lonlat) when the block names exactly one modern id
  const mods = [...found.values()].filter((e) => e.provider === "OpenBible.info" && e.kind === "modern" && e.role === "representative_basis");
  if (mods.length === 1) {
    const t = text, nm = /\bmodern_name:\s*([^\n#]+?)\s*$/m.exec(t) || /modern_association_names:\s*\n\s*-\s*([^\n]+)/.exec(t), lo = /displayed_lonlat:\s*\n\s*longitude:\s*(-?\d+(?:\.\d+)?)\s*\n\s*latitude:\s*(-?\d+(?:\.\d+)?)/.exec(t);
    if (nm && !mods[0].name) mods[0].name = nm[1].trim();
    if (lo) mods[0].coords = { lat: +lo[2], lon: +lo[1], semantics: /point_semantics:\s*\n\s*type:\s*(\w+)/.exec(t) ? /point_semantics:\s*\n\s*type:\s*(\w+)/.exec(t)[1] : "UNSPECIFIED" };
  }
  const ge = [...found.values()].find((e) => e.provider === "OpenBible.info" && e.kind === "geometry"), ob = /OpenBible_geometry:\s*\n\s*source_url:\s*(\S+)/.exec(text), obh = /inspected_sha256:\s*([0-9a-f]{64})/.exec(text);
  if (ge) { if (ob && !ge.url) ge.url = ob[1]; if (obh) ge.inspected_sha256 = obh[1]; const gn = /geometry_record:\s*\n\s*id:\s*g[0-9a-f]+\s*\n\s*name:\s*([^\n]+)/.exec(text); if (gn && !ge.name) ge.name = gn[1].trim(); }
  const rank = (e) => ["ancient", "geometry", "modern", "entity", "feature", "place"].indexOf(e.kind);
  return [...found.values()].sort((a, b) => rank(a) - rank(b) || (a.ext_id < b.ext_id ? -1 : 1));
}

function build(opts) {
  opts = opts || {};
  const proj = opts.projection || loadProjection(), prev = (() => { try { return JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { return null; } })();
  const out = { schema: "JBC_DECLARED_EXTERNAL_REFS_v0.1", role: "DECLARATIONS_ONLY_NOT_BINDINGS", note: "Identifiers declared inside approved research notes. Resolution (bind / VERIFY / conflict) is done by tools/reference/build.py; nothing here is research authority or a merge.", entities: {}, preserved: [], unreadable: [] };
  for (const m of ((proj.meta && proj.meta.records) || []).concat((proj.meta && proj.meta.regions) || [])) {
    const id = m.stable_id, p = m.source && m.source.path;
    let buf = null; try { buf = fs.readFileSync(p); } catch (e) {}
    if (buf && sha(buf) === m.source.sha256) out.entities[id] = { source: { path: p, sha256: m.source.sha256 }, declared: extract(buf.toString("utf8")) };
    else { const old = prev && prev.entities && prev.entities[id]; if (old) { out.entities[id] = old; out.preserved.push({ stable_id: id, reason: buf ? "source sha256 differs from the projection record" : "source note unreadable" }); } else out.unreadable.push({ stable_id: id, reason: buf ? "source sha256 differs from the projection record" : "source note unreadable" }); }
  }
  return out;
}

if (require.main === module) {
  const r = build(), txt = JSON.stringify(r, null, 2) + "\n";
  if (process.argv.includes("--check")) { let cur = ""; try { cur = fs.readFileSync(OUT, "utf8"); } catch (e) {} console.log(cur === txt ? "PASS declared external refs unchanged" : "DIFF declared external refs would change"); process.exit(cur === txt ? 0 : 1); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, txt);
  console.log(JSON.stringify({ entities: Object.fromEntries(Object.entries(r.entities).map(([k, v]) => [k, v.declared.length])), preserved: r.preserved, unreadable: r.unreadable }));
}
module.exports = { extract, build, OUT };
