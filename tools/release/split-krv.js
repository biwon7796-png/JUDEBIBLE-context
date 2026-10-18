"use strict";
// Splits the public KRV text (site-prebuilt/assets/data-krv.js) into a small structure file plus one text file per book,
// and verifies that reassembling the pieces gives back exactly the original window.BVC_KRV.
//
//   node tools/release/split-krv.js           generate site-prebuilt/assets/krv/* and verify
//   node tools/release/split-krv.js --verify  verify only (no writes)
//
// Output (all plain <script> files, safe to load in any order after meta.js):
//   assets/krv/meta.js     window.JBC_KRV_META = { meta, books: [{ id, name, counts: [verses per chapter] }] }
//   assets/krv/<id>.js     (window.JBC_KRV_TEXT = window.JBC_KRV_TEXT || {})["<id>"] = [[verse, ...], ...];
//   assets/krv/manifest.json  sha256 per file + per-book content hash, for integrity checks.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "site-prebuilt", "assets", "data-krv.js");
const OUT = path.join(ROOT, "site-prebuilt", "assets", "krv");
const verifyOnly = process.argv.includes("--verify");

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readOriginal = () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(SRC, "utf8"), sandbox, { filename: "data-krv.js" });
  if (!sandbox.window.BVC_KRV || !Array.isArray(sandbox.window.BVC_KRV.books)) throw new Error("BVC_KRV not found in " + SRC);
  return sandbox.window.BVC_KRV;
};

function build(K) {
  const files = {};
  const meta = { meta: K.meta, books: K.books.map((b) => ({ id: b.id, name: b.name, counts: b.chapters.map((c) => c.length) })) };
  files["meta.js"] = "window.JBC_KRV_META=" + JSON.stringify(meta) + ";\n";
  const bookHash = {};
  K.books.forEach((b) => {
    const json = JSON.stringify(b.chapters);
    bookHash[b.id] = sha(json);
    files[b.id + ".js"] = "(window.JBC_KRV_TEXT=window.JBC_KRV_TEXT||{})[" + JSON.stringify(b.id) + "]=" + json + ";\n";
  });
  const manifest = { schema: "jbc-krv-split/1", source: "assets/data-krv.js", sourceSha256: sha(fs.readFileSync(SRC)), books: K.books.length,
    files: Object.fromEntries(Object.entries(files).map(([n, t]) => [n, { sha256: sha(t), bytes: Buffer.byteLength(t) }])), bookTextSha256: bookHash };
  files["manifest.json"] = JSON.stringify(manifest, null, 2) + "\n";
  return files;
}

function verifyDir(dir, K) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const run = (f) => vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), sandbox, { filename: f });
  for (const [name, info] of Object.entries(manifest.files)) {
    const got = sha(fs.readFileSync(path.join(dir, name)));
    if (got !== info.sha256) throw new Error("hash mismatch: " + name);
  }
  run("meta.js");
  const META = sandbox.window.JBC_KRV_META;
  // load the book files in a shuffled order to prove order independence
  const ids = META.books.map((b) => b.id).sort(() => Math.random() - 0.5);
  ids.forEach((id) => run(id + ".js"));
  const TEXT = sandbox.window.JBC_KRV_TEXT;
  const rebuilt = { meta: META.meta, books: META.books.map((b) => ({ id: b.id, name: b.name, chapters: TEXT[b.id] })) };
  const a = JSON.stringify(K), b = JSON.stringify(rebuilt);
  if (a !== b) throw new Error("reassembled KRV differs from the original");
  META.books.forEach((bk) => {
    const chs = TEXT[bk.id];
    if (chs.length !== bk.counts.length || chs.some((c, i) => c.length !== bk.counts[i])) throw new Error("meta counts differ from text: " + bk.id);
  });
  const verses = rebuilt.books.reduce((s, x) => s + x.chapters.reduce((t, c) => t + c.length, 0), 0);
  return { books: rebuilt.books.length, verses, chars: a.length };
}

const K = readOriginal();
if (!verifyOnly) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f));
  const files = build(K);
  Object.entries(files).forEach(([n, t]) => fs.writeFileSync(path.join(OUT, n), t));
}
const r = verifyDir(OUT, K);
console.log(JSON.stringify({ status: "PASS", ...r, dir: path.relative(ROOT, OUT).replace(/\\/g, "/") }));
