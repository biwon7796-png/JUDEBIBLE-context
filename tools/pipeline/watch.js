"use strict";
// Obsidian save trigger → canonical research-to-webapp sync.js.
//   JBC_VAULT=<vault> node tools/pipeline/watch.js [--initial-run]
// Watches <JBC_VAULT>/02_연구물/ (create · change · rename into scope), debounces, and runs `node tools/pipeline/sync.js` — never in parallel.
// The watcher decides nothing about research: sync.js checks approved Full Profiles, while eligibility (approval record, identity, entity type, VERIFY/HOLD, id collisions) remains inside run.js.
// A note that is unapproved / has no adapter is reported through sync.js (assets[] in out/watch-status.json) and generates nothing; last known good stays.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), cp = require("child_process");
const { deriveProject01Root } = require("./person-adapter");
const ROOT = path.resolve(__dirname, "..", ".."), RUN = path.join(__dirname, "sync.js"), OUT = path.join(__dirname, "out");
const WATCH_ROOT = "02_연구물", DEBOUNCE_MS = 1500;

// ---- what is never a trigger: editor temp / swap / backup files, sync-conflict copies, generated outputs, approval files, tooling folders, anything that is not a markdown note
const IGNORED_DIRS = new Set(["node_modules", ".git", ".obsidian", ".trash", "out", "approvals"]);
const IGNORED_NAME = [/^[.~]/, /~$/, /^#.*#$/, /\.(tmp|temp|swp|swx|swo|bak|backup|orig|rej|part|crdownload)$/i, /\.(tmp|bak|swp)\./i, /^desktop\.ini$/i, /sync-conflict|\(conflict|충돌된 사본/i];
function isIgnored(rel) {
  const parts = String(rel).replace(/\\/g, "/").split("/").filter(Boolean), name = parts[parts.length - 1] || "";
  if (!name || !/\.md$/i.test(name)) return true;
  if (parts.slice(0, -1).some((p) => IGNORED_DIRS.has(p) || p.startsWith("."))) return true;
  return IGNORED_NAME.some((r) => r.test(name));
}
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wr = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + ".tmp", s); fs.renameSync(f + ".tmp", f); };

// ---- the canonical run: the existing run.js with the authoritative vault; never --allow-mirror / --accept-source-change
function defaultRunner(o) {
  return (files) => new Promise((resolve) => {
    const env = Object.assign({}, process.env, { JBC_VAULT: o.vault }), args = [RUN].concat(o.extraArgs || []); let out = "", err = "";
    const c = cp.spawn(process.execPath, args, { env, cwd: ROOT, windowsHide: true });
    c.stdout.on("data", (d) => { if (out.length < 8e6) out += d; }); c.stderr.on("data", (d) => { if (err.length < 1e6) err += d; });
    c.on("error", (e) => resolve({ exit: -1, stdout: out, stderr: String(e.message) }));
    c.on("close", (code) => resolve({ exit: code, stdout: out, stderr: err }));
  });
}
const parseSummary = (stdout) => { try { return JSON.parse(stdout); } catch (e) { return null; } };

function createWatcher(o) {
  o = o || {};
  const vault = o.vault !== undefined ? o.vault : process.env.JBC_VAULT, debounceMs = o.debounceMs || DEBOUNCE_MS, log = o.log || (() => {}), statusFile = o.statusFile || path.join(OUT, "watch-status.json"), lockFile = o.lockFile || path.join(OUT, "watch.lock");
  if (!vault) throw new Error("SOURCE_AUTHORITY: JBC_VAULT is not bound — the watcher only runs against the authoritative vault (no mirror fallback). Nothing is watched.");
  const rootDir = path.join(vault, o.root || WATCH_ROOT);
  if (!fs.existsSync(rootDir)) throw new Error("SOURCE_AUTHORITY: watch scope unavailable: " + rootDir);
  const project01Root = o.project01Root || process.env.JBC_PROJECT01_ROOT || deriveProject01Root(vault);
  const authorityWatchEnabled = fs.existsSync(project01Root);
  const runner = o.runner || defaultRunner({ vault, extraArgs: o.extraArgs });
  const known = new Map(), knownAuthority = new Map(), pending = new Set(), state = { running: false, dirty: false, timer: null, runs: 0, failures: [], watcher: null, authorityWatcher: null, stopped: false, lock: false, active: Promise.resolve(), started_at: null };
  function writeStatus(extra) {
    let prev = {}; try { prev = JSON.parse(fs.readFileSync(statusFile, "utf8")); } catch (e) {}
    const body = Object.assign({}, prev, { schema: "JBC_WATCH_STATUS_v0.3", vault, root: o.root || WATCH_ROOT, project01_root: project01Root, authority_watch_enabled: authorityWatchEnabled, authority_watch_active: !!state.authorityWatcher && !state.stopped, pid: process.pid, active: !!state.lock && !state.stopped, started_at: state.started_at, runs: state.runs, failures: state.failures }, extra || {});
    wr(statusFile, JSON.stringify(body, null, 2) + "\n");
  }
  const walk = (dir, rel, f) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const r = rel ? rel + "/" + e.name : e.name; if (e.isDirectory()) { if (!IGNORED_DIRS.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), r, f); } else if (!isIgnored(r)) f(r); } };

  function acquireLock() {
    fs.mkdirSync(path.dirname(lockFile), { recursive: true });
    try { const pid = +fs.readFileSync(lockFile, "utf8"); if (pid && pid !== process.pid) { try { process.kill(pid, 0); throw new Error("LOCKED: another watcher (pid " + pid + ") is running"); } catch (e) { if (/^LOCKED/.test(e.message)) throw e; } } } catch (e) { if (/^LOCKED/.test(e.message)) throw e; }
    fs.writeFileSync(lockFile, String(process.pid)); state.lock = true;
  }
  const releaseLock = () => { if (state.lock) { try { fs.unlinkSync(lockFile); } catch (e) {} state.lock = false; } };

  async function readHash(abs) { for (let n = 0; n < 4; n++) { try { return sha(fs.readFileSync(abs)); } catch (e) { if (e.code === "ENOENT") return null; await sleep(80 * (n + 1)); } } return undefined; }

  async function onEvent(eventType, filename) {
    if (state.stopped || !filename) return;
    const rel = String(filename).replace(/\\/g, "/"); if (isIgnored(rel)) return;
    const abs = path.join(rootDir, rel); if (path.resolve(abs).startsWith(ROOT + path.sep)) return;   // never react to the repo's own (generated) files
    if (!fs.existsSync(abs)) { known.delete(rel); return; }   // delete / rename away: outside the trigger events
    const h = await readHash(abs); if (h === null) { known.delete(rel); return; } if (h === undefined) { log("unreadable, skipped: " + rel); return; }
    if (known.get(rel) === h) return;   // duplicate event (same bytes already seen): suppressed
    known.set(rel, h); pending.add(rel); schedule();
  }
  async function onAuthorityEvent(eventType, filename) {
    if (state.stopped || !authorityWatchEnabled || !filename) return;
    const rel = String(filename).replace(/\\/g, "/"), name = path.basename(rel);
    if (!/\.md$/i.test(name) || !/REVALIDATION|LIFECYCLE/i.test(name) || isIgnored(rel)) return;
    const abs = path.join(project01Root, rel);
    if (!fs.existsSync(abs)) { knownAuthority.delete(rel); return; }
    const h = await readHash(abs); if (h === null) { knownAuthority.delete(rel); return; } if (h === undefined) { log("authority unreadable, skipped: " + rel); return; }
    if (knownAuthority.get(rel) === h) return;
    knownAuthority.set(rel, h); pending.add("@project01/" + rel); schedule();
  }
  function schedule() {
    if (state.running) { state.dirty = true; return; }   // single flight: remember, run once after the current run
    clearTimeout(state.timer); state.timer = setTimeout(() => { state.timer = null; state.active = runNow(); }, debounceMs);
  }
  async function runNow() {
    if (state.running || state.stopped) { if (state.running) state.dirty = true; return; }
    state.running = true; state.dirty = false; const files = [...pending].sort(); pending.clear();
    const started = new Date(); let res;
    try { res = await runner(files); } catch (e) { res = { exit: -1, stdout: "", stderr: String(e && e.message || e) }; }
    const sum = parseSummary(res.stdout || ""), outcome = res.exit === 0 ? "ok" : res.exit === 1 && sum ? "completed_with_issues" : "failed";
    const rec = { started: started.toISOString(), ended: new Date().toISOString(), duration_ms: Date.now() - started.getTime(), exit: res.exit, outcome, trigger_files: files, wrote: sum ? !!sum.wrote : false,
      assets: sum && sum.assets ? sum.assets.map((a) => ({ document_id: a.document_id || a.path, entity_type: a.entity_type, status: a.status, reason: a.reason })) : [], preserved_last_known_good: sum ? sum.preserved_last_known_good : undefined, stderr_tail: outcome === "ok" ? undefined : String(res.stderr || "").slice(-800) };
    state.runs++; if (outcome !== "ok") { state.failures.push({ at: rec.ended, outcome, exit: res.exit, stderr_tail: rec.stderr_tail, trigger_files: files }); state.failures = state.failures.slice(-20); }   // recorded; never retried
    try { writeStatus({ last_run: rec }); } catch (e) { log("status write failed: " + e.message); }
    log("run #" + state.runs + " " + outcome + " exit=" + res.exit + " files=" + files.join(","));
    state.running = false; if (o.onRun) o.onRun(rec);
    if (state.dirty && !state.stopped) { state.dirty = false; state.active = runNow(); await state.active; }   // exactly one follow-up run for everything that arrived meanwhile
  }

  return {
    state, known, pending, isIgnored,
    async start(opts) {
      acquireLock(); state.started_at = new Date().toISOString(); walk(rootDir, "", (r) => { try { known.set(r, sha(fs.readFileSync(path.join(rootDir, r)))); } catch (e) {} });   // baseline: unchanged re-saves never trigger
      state.watcher = fs.watch(rootDir, { recursive: true }, (ev, f) => { onEvent(ev, f).catch((e) => log("event error: " + e.message)); }); state.watcher.on("error", (e) => log("watch error: " + e.message));
      if (authorityWatchEnabled) {
        walk(project01Root, "", (r) => { if (!/REVALIDATION|LIFECYCLE/i.test(path.basename(r))) return; try { knownAuthority.set(r, sha(fs.readFileSync(path.join(project01Root, r)))); } catch (e) {} });
        state.authorityWatcher = fs.watch(project01Root, { recursive: true }, (ev, f) => { onAuthorityEvent(ev, f).catch((e) => log("authority event error: " + e.message)); }); state.authorityWatcher.on("error", (e) => log("authority watch error: " + e.message));
      }
      try { writeStatus({ expected: true, health: "ACTIVE" }); } catch (e) { log("status write failed: " + e.message); }
      log("watching " + rootDir + " (" + known.size + " notes, debounce " + debounceMs + "ms)" + (authorityWatchEnabled ? " + Project01 lifecycle " + project01Root : ""));
      if (opts && opts.initialRun) { pending.add("(initial)"); state.active = runNow(); await state.active; }
    },
    async idle(ms) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 5000)) { if (!state.timer && !state.running && !state.dirty) { await sleep(60); if (!state.timer && !state.running && !state.dirty) return true; } await sleep(30); } return false; },
    async stop() { state.stopped = true; clearTimeout(state.timer); if (state.watcher) state.watcher.close(); if (state.authorityWatcher) state.authorityWatcher.close(); try { await state.active; } catch (e) {} releaseLock(); try { writeStatus({ expected: true, health: "INACTIVE", stopped_at: new Date().toISOString() }); } catch (e) {} }
  };
}

function watcherHealth(statusFile, lockFile) {
  statusFile = statusFile || path.join(OUT, "watch-status.json"); lockFile = lockFile || path.join(OUT, "watch.lock");
  let status = null, pid = null, alive = false; try { status = JSON.parse(fs.readFileSync(statusFile, "utf8")); } catch (e) {}
  try { pid = +fs.readFileSync(lockFile, "utf8"); if (pid) { try { process.kill(pid, 0); alive = true; } catch (e) {} } } catch (e) {}
  return { expected: !!(status && status.expected), active: !!(status && status.active && alive), pid: pid || (status && status.pid) || null, alive, status_file: statusFile, lock_file: lockFile, last_run: status && status.last_run || null, started_at: status && status.started_at || null, health: status && status.active && alive ? "ACTIVE" : "INACTIVE" };
}
if (require.main === module) {
  if (process.argv.includes("--status")) { const h = watcherHealth(); console.log(JSON.stringify(h, null, 2)); process.exit(h.active ? 0 : 5); }
  let w; try { w = createWatcher({ log: (m) => console.log(new Date().toISOString() + " " + m) }); } catch (e) { console.error(e.message); process.exit(2); }
  w.start({ initialRun: process.argv.includes("--initial-run") }).catch((e) => { console.error(e.message); process.exit(e.message.indexOf("LOCKED") === 0 ? 4 : 1); });
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => w.stop().then(() => process.exit(0)));
}
module.exports = { createWatcher, defaultRunner, isIgnored, watcherHealth, WATCH_ROOT, DEBOUNCE_MS };
