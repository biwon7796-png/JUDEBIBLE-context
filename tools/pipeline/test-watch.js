"use strict";
// node tools/pipeline/test-watch.js — save trigger (watch.js) and the write/collision guards of the canonical run. Temp vaults + a fake runner; the real run.js is only called with --dry.
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const { createWatcher, defaultRunner, isIgnored, watcherHealth } = require("./watch"), { stagePair, ingest, loadConfig, loadKrv, ROOT } = require("./run");
const results = [], T = async (id, name, fn) => { try { results.push({ id, name, pass: true, ev: (await fn()) || [] }); } catch (e) { results.push({ id, name, pass: false, err: e.message }); } };
const ok = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "jbc-w-")), sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"), J = JSON.stringify;
const MS = 200;
function fixture() { const v = tmp(), root = path.join(v, "02_연구물"); fs.mkdirSync(path.join(root, "샘플"), { recursive: true }); fs.writeFileSync(path.join(root, "샘플", "A.md"), "# A\n"); return { v, root, st: path.join(v, "status.json"), lock: path.join(v, "w.lock") }; }
function mk(fx, runner, extra) { const calls = []; let active = 0, maxActive = 0; const r = runner || (async () => ({ exit: 0, stdout: J({ wrote: true, assets: [{ document_id: "X", entity_type: "region", status: "ingested" }] }) }));
  const w = createWatcher(Object.assign({ vault: fx.v, debounceMs: MS, statusFile: fx.st, lockFile: fx.lock, runner: async (files) => { active++; maxActive = Math.max(maxActive, active); calls.push(files); try { return await r(files, calls.length); } finally { active--; } } }, extra || {})); return { w, calls, max: () => maxActive }; }
const touch = (fx, rel, txt) => { const f = path.join(fx.root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };

(async () => {
  await T("W01", "create / change / rename-into-scope each trigger one canonical run", async () => {
    const fx = fixture(), { w, calls } = mk(fx); await w.start(); touch(fx, "샘플/B.md", "# B"); await w.idle(); ok(calls.length === 1 && calls[0].join() === "샘플/B.md", "create: " + J(calls));
    touch(fx, "샘플/B.md", "# B2"); await w.idle(); ok(calls.length === 2, "change: " + calls.length);
    const outside = path.join(fx.v, "elsewhere.md"); fs.writeFileSync(outside, "# C"); fs.renameSync(outside, path.join(fx.root, "샘플", "C.md")); await w.idle(); ok(calls.length === 3 && calls[2].join() === "샘플/C.md", "rename in: " + J(calls)); await w.stop(); return ["runs=3"];
  });
  await T("W02", "debounce: a burst of saves collapses into one run", async () => {
    const fx = fixture(), { w, calls } = mk(fx); await w.start(); for (let i = 0; i < 6; i++) { touch(fx, "샘플/A.md", "# A v" + i); await sleep(30); } await w.idle(); ok(calls.length === 1, "runs=" + calls.length); await w.stop(); return ["runs=1"];
  });
  await T("W03", "single flight: changes during a run never start a parallel run; exactly one follow-up run happens afterwards", async () => {
    const fx = fixture(); let release; const gate = new Promise((r) => { release = r; }), { w, calls, max } = mk(fx, async (files, n) => { if (n === 1) await gate; return { exit: 0, stdout: "{}" }; }); await w.start();
    touch(fx, "샘플/A.md", "# one"); await sleep(MS + 150); ok(calls.length === 1 && w.state.running, "first run is in flight");
    touch(fx, "샘플/A.md", "# two"); await sleep(60); touch(fx, "샘플/D.md", "# d"); await sleep(MS + 150); ok(calls.length === 1, "no parallel run while running: " + calls.length); ok(w.state.dirty, "dirty flag kept");
    release(); await w.idle(); ok(calls.length === 2 && max() === 1, "one follow-up run, max concurrency " + max() + ", runs " + calls.length); ok(calls[1].includes("샘플/A.md") && calls[1].includes("샘플/D.md"), "follow-up carries everything that arrived: " + J(calls[1])); await w.stop(); return ["runs=2", "max=1"];
  });
  await T("W04", "ignored: temp / swap / backup / hidden / sync-conflict files, non-markdown, tooling and generated-output folders", async () => {
    const fx = fixture(), { w, calls } = mk(fx); await w.start();
    for (const rel of ["샘플/A.md.tmp", "샘플/.A.md.swp", "샘플/~$A.md", "샘플/A.md~", "샘플/A.bak", "샘플/A (conflict 2).md", "샘플/A.sync-conflict-1.md", "샘플/desktop.ini", "샘플/data.json", ".obsidian/workspace.md", "node_modules/x/readme.md", ".git/x.md", "out/run-summary.md", "approvals/x.md", "샘플/#A.md#"]) touch(fx, rel, "x" + Math.random());
    await w.idle(); await sleep(MS * 2); ok(calls.length === 0, "unexpected run: " + J(calls)); ok(isIgnored("a/b.md") === false && isIgnored("a/.hidden/b.md") && isIgnored("a/b.txt"), "predicate"); await w.stop(); return ["no runs"];
  });
  await T("W05", "duplicate event suppression: identical bytes never trigger again; a real change does", async () => {
    const fx = fixture(), { w, calls } = mk(fx); await w.start(); touch(fx, "샘플/A.md", "# A\n"); await w.idle(); await sleep(MS); ok(calls.length === 0, "unchanged re-save of a baseline note must not trigger");
    touch(fx, "샘플/A.md", "# changed"); await w.idle(); ok(calls.length === 1, "change"); touch(fx, "샘플/A.md", "# changed"); touch(fx, "샘플/A.md", "# changed"); await w.idle(); await sleep(MS); ok(calls.length === 1, "same content again: " + calls.length); await w.stop(); return ["runs=1"];
  });
  await T("W06", "failure: recorded in the status file, no retry loop, a later change triggers again; success after failure is recorded too", async () => {
    const fx = fixture(), { w, calls } = mk(fx, async (f, n) => (n === 1 ? { exit: 3, stdout: "", stderr: "STALE_SOURCE_GUARD: boom" } : n === 2 ? (() => { throw new Error("spawn failed"); })() : { exit: 0, stdout: J({ wrote: true, assets: [] }) })); await w.start();
    touch(fx, "샘플/A.md", "# 1"); await w.idle(); await sleep(MS * 4); ok(calls.length === 1, "no retry after a failure: " + calls.length); let st = JSON.parse(fs.readFileSync(fx.st, "utf8")); ok(st.last_run.outcome === "failed" && st.last_run.exit === 3 && /STALE_SOURCE_GUARD/.test(st.last_run.stderr_tail) && st.failures.length === 1, "recorded: " + J(st.last_run));
    touch(fx, "샘플/A.md", "# 2"); await w.idle(); await sleep(MS * 3); st = JSON.parse(fs.readFileSync(fx.st, "utf8")); ok(calls.length === 2 && st.last_run.outcome === "failed" && st.failures.length === 2, "thrown runner is a recorded failure, still no loop");
    touch(fx, "샘플/A.md", "# 3"); await w.idle(); st = JSON.parse(fs.readFileSync(fx.st, "utf8")); ok(st.last_run.outcome === "ok" && st.runs === 3 && !fs.existsSync(fx.st + ".tmp"), "recovery recorded, status written atomically"); await w.stop(); return ["failures=2", "runs=3"];
  });
  await T("W07", "run.js exit 1 with a summary (record fail-closed, last known good kept) is 'completed_with_issues' with the per-asset reasons", async () => {
    const fx = fixture(), { w } = mk(fx, async () => ({ exit: 1, stdout: J({ wrote: true, preserved_last_known_good: ["JBC-CR-PLACE-ACHAIA-001"], assets: [{ document_id: "JBC_X", entity_type: "region", status: "awaiting_approval", reason: "eligibility gate: no approval record" }, { path: "02_연구물/y.md", entity_type: "route", status: "no_adapter", reason: "no adapter" }] }) })); await w.start(); touch(fx, "샘플/A.md", "# z"); await w.idle();
    const st = JSON.parse(fs.readFileSync(fx.st, "utf8")).last_run; ok(st.outcome === "completed_with_issues" && st.assets.some((a) => a.status === "awaiting_approval") && st.assets.some((a) => a.status === "no_adapter") && st.preserved_last_known_good.length === 1, J(st)); await w.stop(); return [st.outcome];
  });
  await T("W08", "source authority: no JBC_VAULT / missing scope → refuses to start; the canonical command is sync.js with the vault and no mirror flags; a second watcher is refused", async () => {
    let e1 = null, e2 = null; try { createWatcher({ vault: null }); } catch (e) { e1 = e.message; } try { createWatcher({ vault: path.join(os.tmpdir(), "jbc-no-vault-" + Date.now()) }); } catch (e) { e2 = e.message; } ok(/SOURCE_AUTHORITY/.test(e1) && /SOURCE_AUTHORITY/.test(e2), "refusals: " + e1 + " | " + e2);
    const src = fs.readFileSync(path.join(__dirname, "watch.js"), "utf8"); ok(/JBC_VAULT: o\.vault/.test(src) && !/allow-mirror|accept-source-change/.test(src.replace(/\/\/.*$/gm, "")), "runner binds the vault and never passes mirror flags");
    const fx = fixture(), a = mk(fx).w, b = mk(fx).w; await a.start(); let locked = false; try { fs.writeFileSync(fx.lock, String(process.ppid)); await b.start(); } catch (e) { locked = /LOCKED/.test(e.message); } await a.stop(); fs.writeFileSync(fx.lock, String(process.pid)); await b.stop(); return ["refused=" + (e1 ? 1 : 0) + (e2 ? 1 : 0), "second watcher locked=" + locked];
  });
  await T("W09", "real canonical run through the default runner (--dry): authoritative vault, summary parsed, live files untouched", async () => {
    const vault = process.env.JBC_VAULT, live = ["data/projection.research.js", "data/scripture.index.js"].map((p) => sha(path.join(ROOT, p))).join(), r = await defaultRunner({ vault, extraArgs: ["--dry"] })([]);
    const s = JSON.parse(r.stdout); ok(r.exit === 0 && s.wrote === false && s.assets.some((a) => /ACHAIA/.test(a.document_id || "") && a.status === "ingested"), "exit " + r.exit + " " + r.stderr.slice(0, 200)); ok(live === ["data/projection.research.js", "data/scripture.index.js"].map((p) => sha(path.join(ROOT, p))).join(), "live changed"); return ["assets=" + s.assets.length];
  });
  await T("W10", "atomic write: the live pair is replaced together or not at all (a failing second replace restores the first; no .tmp/.prev left)", async () => {
    const d = tmp(), a = path.join(d, "projection.js"), b = path.join(d, "index.js"); fs.writeFileSync(a, "old-a"); fs.mkdirSync(b);   // b is a directory → replacing it must fail
    const p = stagePair(); p.stage(a, "new-a"); p.stage(b, "new-b"); let failed = false; try { p.flush(); } catch (e) { failed = true; } ok(failed && fs.readFileSync(a, "utf8") === "old-a", "first file must be restored: " + fs.readFileSync(a, "utf8"));
    ok(!fs.existsSync(a + ".tmp") && !fs.existsSync(a + ".prev") && !fs.existsSync(b + ".tmp"), "no leftovers: " + fs.readdirSync(d).join());
    fs.rmSync(b, { recursive: true }); fs.writeFileSync(b, "old-b"); const q = stagePair(); q.stage(a, "new-a"); q.stage(b, "new-b"); q.flush(); ok(fs.readFileSync(a, "utf8") === "new-a" && fs.readFileSync(b, "utf8") === "new-b" && fs.readdirSync(d).length === 2, "normal flush"); return ["restored", "flushed"];
  });
  await T("W11", "stable_id collision fails closed: two Place notes claiming one viewer id are both rejected; the unrelated records are unaffected", async () => {
    const cfg = loadConfig(), G = "JBC_GERAR_CONNECTED_WORBS_20260930_01", G2 = "JBC_GERAR_CONNECTED_WORBS_20260930_02", v = tmp(), base = path.join(process.env.JBC_VAULT, "02_연구물");
    for (const rel of ["그랄/" + G + ".md", "아가야/JBC_ACHAIA_CONNECTED_WORBS_20260930_01.md", "아말렉/JBC_AMALEK_CONNECTED_WORBS_20261001_01.md"]) { const dst = path.join(v, "02_연구물", rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(base, rel), dst); }
    const g2 = path.join(v, "02_연구물", "그랄", G2 + ".md"); fs.writeFileSync(g2, fs.readFileSync(path.join(base, "그랄", G + ".md"), "utf8").split(G).join(G2)); const cfg2 = JSON.parse(J(cfg)); cfg2.records[G2] = cfg.records[G];
    const d = tmp(), s = ingest({ config: cfg2, krv: loadKrv(), vault: v, dataDir: d, outDir: d, syncFile: path.join(d, "s.json"), writeArtifacts: false, dryRun: true }); const places = s.assets.filter((a) => a.entity_type === "place");
    ok(places.length === 2 && places.every((a) => a.status === "failed_closed" && /STABLE_ID_COLLISION/.test(a.reason)), J(places)); ok(!Object.keys(s.projection.places).length, "neither claimant is projected"); ok(s.assets.filter((a) => a.entity_type === "region" && a.status === "ingested").length === 2, "regions unaffected"); return ["claimants=2 failed_closed"];
  });
  await T("W12", "watcher startup/status is fail-visible: ACTIVE while running, INACTIVE after stop", async () => {
    const fx = fixture(), { w } = mk(fx); await w.start(); const a = watcherHealth(fx.st, fx.lock); ok(a.active && a.health === "ACTIVE" && a.alive, J(a)); await w.stop(); const b = watcherHealth(fx.st, fx.lock); ok(!b.active && b.health === "INACTIVE", J(b)); return ["active→inactive", "status="+path.basename(fx.st)];
  });
  const fail = results.filter((r) => !r.pass); results.forEach((r) => console.log((r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.pass ? "  · " + r.ev.join(" · ") : " — " + r.err))); console.log((fail.length ? "FAIL " : "PASS ") + (results.length - fail.length) + "/" + results.length); process.exit(fail.length ? 1 : 0);
})();
