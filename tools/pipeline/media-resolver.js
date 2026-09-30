"use strict";
// Pipeline stage — Wikimedia source resolver (part of tools/pipeline, called from run.js; not a separate pipeline).
// Input: MediaAssets that already carry an explicit source_url the validator verified (note/overlay supplied, Commons file page, title matches).
// It asks the official Commons API (action=query, prop=imageinfo) about that file title, cross-checks the answer against the research record,
// and only when everything agrees derives preview_url / attribution / rights clearance from the API response.
// Never: guess a URL from a file name, download image bytes, accept a host other than Wikimedia's, or upgrade a rights status the note does not clear.
// Two steps: refreshCache (online, only with --resolve-media) writes the raw API answers to tools/pipeline/cache/wikimedia; resolveFromCache (every run, offline) applies them.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { mediaHash } = require("./normalize");

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "JudeBibleContextPipeline/0.1 (research asset resolver; local development)";
const CACHE_DIR = path.join(__dirname, "cache", "wikimedia");
const HOST_OK = /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/[^\s"'<>]+$/;
const MIME_OK = /^image\/(jpeg|png|gif|webp)$/;
// Note-declared rights statuses that clear an image for display once the API agrees. Anything else (free text, VERIFY, HOLD, missing) never clears.
const CLEARABLE = { PUBLIC_DOMAIN_DEDICATION_CC0: true, CLEARED: true };

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const norm = (s) => String(s == null ? "" : s).replace(/_/g, " ").trim();
const strip = (html) => String(html == null ? "" : html).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
const decode = (u) => { try { return decodeURIComponent(u); } catch (e) { return null; } };
function apiLicenseCode(short) {
  const v = String(short || "").trim(), m = /^CC BY-SA (\d\.\d)$/i.exec(v) || null;
  if (/^CC0/i.test(v)) return "CC0-1.0"; if (m) return "CC-BY-SA-" + m[1];
  const b = /^CC BY (\d\.\d)$/i.exec(v); return b ? "CC-BY-" + b[1] : null;
}
const requestUrl = (title) => API + "?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url%7Cmime%7Csize%7Csha1%7Cextmetadata&iiurlwidth=800&titles=" + encodeURIComponent(title);
const cacheFile = (dir, title) => path.join(dir, sha(norm(title)).slice(0, 32) + ".json");

async function defaultFetcher(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Evaluate one API response against one asset. Pure: no I/O.
function evaluate(asset, response) {
  const reasons = [], page = response && response.query && response.query.pages && response.query.pages[0], info = page && page.imageinfo && page.imageinfo[0], ext = (info && info.extmetadata) || {};
  const val = (k) => (ext[k] && ext[k].value != null ? ext[k].value : null);
  if (!page || page.missing || !info) return { verified: false, reasons: ["file not found in the Commons API response"] };
  const titleMatch = norm(page.title) === norm(asset.file); if (!titleMatch) reasons.push("API title does not equal the research file title");
  const d = decode(String(info.descriptionurl || "")), s = decode(String(asset.source_url || "")), pageMatch = !!d && !!s && d === s; if (!pageMatch) reasons.push("API description page does not equal the research source_url");
  const thumb = String(info.thumburl || ""), hostOk = HOST_OK.test(thumb); if (!hostOk) reasons.push("thumbnail URL is not a Wikimedia Commons thumbnail host/path");
  const mimeOk = MIME_OK.test(String(info.mime || "")); if (!mimeOk) reasons.push("mime type not an allowed raster image: " + info.mime);
  const apiLic = apiLicenseCode(val("LicenseShortName")), licOk = !!apiLic && !!asset.rights && apiLic === asset.rights.license_code; if (!licOk) reasons.push("API license (" + val("LicenseShortName") + ") does not match the research license (" + asset.license + ")");
  const artist = strip(val("Artist")), a1 = norm(artist).toLowerCase(), a2 = norm(asset.creator).toLowerCase(), creatorOk = !!a1 && !!a2 && (a1 === a2 || a1.indexOf(a2) >= 0 || a2.indexOf(a1) >= 0); if (!creatorOk) reasons.push("API creator (" + artist + ") does not match the research creator (" + asset.creator + ")");
  const restr = strip(val("Restrictions")); if (restr) reasons.push("API lists restrictions: " + restr);
  const verified = reasons.length === 0;
  return { verified, reasons, canonical_title: page.title, description_url: info.descriptionurl, mime: info.mime, width: info.width, height: info.height, sha1: info.sha1 || null,
    thumb_url: verified ? thumb : null, thumb_width: info.thumbwidth || null, thumb_height: info.thumbheight || null, api_license_short: val("LicenseShortName"), api_license_code: apiLic, api_creator: artist, api_usage_terms: strip(val("UsageTerms")) || null, api_attribution_required: val("AttributionRequired"),
    license_match: licOk, creator_match: creatorOk, source_page_match: pageMatch, title_match: titleMatch, host_ok: hostOk, mime_ok: mimeOk, restrictions: restr || null };
}

// Online step (only with --resolve-media): query the API for every asset that carries a verified explicit source_url and refresh the cache.
// Cache files hold the raw API response; a failed request never overwrites an existing cache entry.
async function refreshCache(rec, opts) {
  opts = opts || {}; const dir = opts.cacheDir || CACHE_DIR, fetcher = opts.fetcher || defaultFetcher, out = [];
  for (const a of rec.media || []) {
    if (!a.source_url || a.source_url_verified !== true) { out.push({ id: a.id, status: "skipped: no verified explicit source_url" }); continue; }   // nothing to query; never guessed
    try { const r = await fetcher(requestUrl(a.file)); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(cacheFile(dir, a.file), JSON.stringify({ title: norm(a.file), request_url: requestUrl(a.file), retrieved_at: new Date().toISOString(), response: r }, null, 2) + "\n"); out.push({ id: a.id, status: "fetched" }); }
    catch (e) { out.push({ id: a.id, status: "failed: " + e.message }); }
  }
  return out;
}

// Offline step (every run): apply the cached API answer to each eligible asset in place. No network.
function resolveFromCache(rec, opts) {
  opts = opts || {}; const dir = opts.cacheDir || CACHE_DIR, report = [];
  if ((opts.mode || "cache") === "off") return report;
  for (const a of rec.media || []) {
    const entry = { id: a.id, status: null };
    if (!a.source_url || a.source_url_verified !== true) { entry.status = "skipped: no verified explicit source_url"; report.push(entry); continue; }
    let cached = null; try { cached = JSON.parse(fs.readFileSync(cacheFile(dir, a.file), "utf8")); } catch (e) {}
    if (!cached) { a.resolution = { resolver: "wikimedia_commons_api", verified: false, eligible_for_display: false, reasons: ["no cached API response (run with --resolve-media)"], source: "none" }; entry.status = "unresolved: no cache"; a.content_hash = mediaHash(a); report.push(entry); continue; }
    const ev = evaluate(a, cached.response), res = Object.assign({ resolver: "wikimedia_commons_api", api_host: "commons.wikimedia.org", retrieved_at: cached.retrieved_at, source: "cache" }, ev);
    const eligible = !!CLEARABLE[a.rights_note || ""] && a.rights && a.rights.validated === true; res.eligible_for_display = ev.verified && eligible; if (ev.verified && !eligible) res.reasons.push("declared rights status is not one that clears display (" + (a.rights_note || "none") + ")");
    a.resolution = res;
    if (res.eligible_for_display) {
      a.preview_url = res.thumb_url; a.display_mode = "image"; a.attribution_derived = res.api_creator + ", “" + norm(a.file).replace(/^File:/, "") + ",” Wikimedia Commons, " + res.api_license_short + ".";
      a.rights = Object.assign({}, a.rights, { status: "CLEARED", display_clearance: true, clearance_basis: { resolver: "wikimedia_commons_api", declared_rights_status: a.rights_note, license_code_match: true, creator_match: true, source_page_match: true, source_url_verified: true } });
      entry.status = "image enabled";
    } else entry.status = "attribution-only: " + res.reasons.join("; ");
    a.content_hash = mediaHash(a); report.push(entry);
  }
  return report;
}

module.exports = { refreshCache, resolveFromCache, evaluate, requestUrl, cacheFile, apiLicenseCode, strip, CLEARABLE, HOST_OK, MIME_OK, CACHE_DIR, UA };
