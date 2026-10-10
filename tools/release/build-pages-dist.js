"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DIST = path.join(ROOT, "dist");
const DIST_PREFIX = DIST + path.sep;

const PUBLIC_ROOT_FILES = [
  "styles.css",
  "favicon.ico",
  "favicon-32.png",
  "favicon-512.png",
  "apple-touch-icon.png",
  "judebible-link-preview.png"
];

const PUBLIC_LAZY_FILES = [
  "data/research.isaac.reader.js"
];

const PUBLIC_RUNTIME_DIRS = [
  "data/original-language",
  "data/terrain_baked",
  "data/terrain_tiles"
];

const PUBLIC_VENDOR_FILES = [
  "vendor/maplibre/LICENSE.txt",
  "vendor/maplibre/maplibre-gl.css",
  "vendor/maplibre/maplibre-gl.mjs",
  "vendor/maplibre/maplibre-gl-worker.mjs"
];

const EASTON_SOURCE = "tools/reference/easton_full_candidate/existing_views_candidate/easton.candidate.js";
const EASTON_PUBLIC = "data/easton.reference.js";
const QA_SCRIPT_RE = /^(?:self-qa|qa-[a-z0-9-]+)\.js$/i;
const FIXTURE_SCRIPTS = new Set(["data/fixture.js", "data/guide.fixture.js"]);
const FORBIDDEN_EXTENSIONS = new Set([".md", ".map", ".log"]);

function rel(p) {
  return p.replace(/\\/g, "/");
}

function sourcePath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    throw new Error("source path escaped project root: " + relativePath);
  }
  return resolved;
}

function outputPath(relativePath) {
  const resolved = path.resolve(DIST, relativePath);
  if (resolved !== DIST && !resolved.startsWith(DIST_PREFIX)) {
    throw new Error("output path escaped dist: " + relativePath);
  }
  return resolved;
}

function requireFile(relativePath) {
  const absolute = sourcePath(relativePath);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw new Error("required public runtime file missing: " + relativePath);
  }
  return absolute;
}

function copyFile(relativeSource, relativeDestination = relativeSource) {
  const source = requireFile(relativeSource);
  const destination = outputPath(relativeDestination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(relativeDirectory) {
  const source = sourcePath(relativeDirectory);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    throw new Error("required public runtime directory missing: " + relativeDirectory);
  }
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const child = rel(path.join(relativeDirectory, entry.name));
    if (entry.isSymbolicLink()) throw new Error("symlink not allowed in public artifact: " + child);
    if (entry.isDirectory()) copyDirectory(child);
    else if (entry.isFile()) {
      if (path.extname(entry.name).toLowerCase() === ".map") continue;
      copyFile(child);
    }
  }
}

function emptyFixtureCompatibility() {
  return [
    "window.BVC_FIXTURE={",
    "meta:{status:'PRODUCTION_EMPTY_COMPATIBILITY'},",
    "featured:[],lexicon:{},context:{},people:{},places:{},regions:{},events:{},routes:{},",
    "placeLinks:{},passages:{},photos:{},crossrefs:[],resources:[]",
    "};",
    "window.BVC_GUIDE_FIXTURE=null;"
  ].join("");
}

function buildHtmlAndBundle() {
  const sourceHtml = fs.readFileSync(requireFile("index.html"), "utf8");
  const scriptTag = /<script\b[^>]*\bsrc=(['"])([^'"]+)\1[^>]*>\s*<\/script>/gi;
  const bundle = [];
  const bundledSources = [];
  let insertedBundle = false;
  let insertedFixtureShim = false;

  const html = sourceHtml.replace(scriptTag, (tag, quote, rawSrc) => {
    const cleanSrc = rel(rawSrc.split(/[?#]/, 1)[0]).replace(/^\.\//, "");
    if (/^(?:https?:)?\/\//i.test(cleanSrc)) return tag;
    if (QA_SCRIPT_RE.test(path.posix.basename(cleanSrc))) return "";
    if (FIXTURE_SCRIPTS.has(cleanSrc)) {
      if (!insertedFixtureShim) {
        bundle.push("/* production compatibility: non-authoritative QA fixtures intentionally omitted */\n" + emptyFixtureCompatibility());
        insertedFixtureShim = true;
      }
    } else {
      let code = fs.readFileSync(requireFile(cleanSrc), "utf8");
      if (cleanSrc === "app.js") {
        code = code.replaceAll(EASTON_SOURCE, EASTON_PUBLIC);
      }
      bundle.push("\n;/* bundled runtime: " + cleanSrc + " */\n" + code);
      bundledSources.push(cleanSrc);
    }
    if (!insertedBundle) {
      insertedBundle = true;
      return '<script src="assets/app.bundle.js?v=20261010-link1"></script>';
    }
    return "";
  });

  if (!insertedBundle || !bundledSources.includes("app.js")) {
    throw new Error("index.html runtime scripts were not bundled as expected");
  }
  if (/\bsrc=["'](?:self-qa|qa-)/i.test(html)) {
    throw new Error("QA script reference remained in production index.html");
  }

  fs.mkdirSync(outputPath("assets"), { recursive: true });
  fs.writeFileSync(outputPath("assets/app.bundle.js"), bundle.join("\n"), "utf8");
  fs.writeFileSync(outputPath("index.html"), html, "utf8");
  return bundledSources;
}

function walk(directory, prefix = "") {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = rel(path.join(prefix, entry.name));
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolutePath, relativePath));
    else if (entry.isFile()) found.push(relativePath);
  }
  return found;
}

function verifyArtifact() {
  const files = walk(DIST).sort();
  const forbiddenRoots = [".build/", ".github/", "baseline/", "docs/", "poc/", "screenshots/", "tools/", "data/source/", "data/reference/", "data/홀만바이블아틀라스/"];
  const forbidden = files.filter((file) =>
    forbiddenRoots.some((root) => file.startsWith(root)) ||
    FORBIDDEN_EXTENSIONS.has(path.extname(file).toLowerCase()) ||
    /(?:^|\/)qa-[^/]*\.js$/i.test(file) ||
    file === "self-qa.js"
  );
  if (forbidden.length) throw new Error("forbidden files in production artifact:\n" + forbidden.join("\n"));

  const html = fs.readFileSync(outputPath("index.html"), "utf8");
  const bundle = fs.readFileSync(outputPath("assets/app.bundle.js"), "utf8");
  for (const token of ["docs/", "tools/", "baseline/", "screenshots/", "data/source/"]) {
    if (html.includes(token)) throw new Error("production index references excluded path: " + token);
  }
  if (bundle.includes(EASTON_SOURCE)) throw new Error("bundle still references internal Easton tool path");
  if (!bundle.includes(EASTON_PUBLIC)) throw new Error("bundle is missing the public Easton runtime path");

  const required = ["index.html", "styles.css", "assets/app.bundle.js", EASTON_PUBLIC, "data/original-language/reference-map.js", "vendor/maplibre/maplibre-gl.mjs"];
  for (const file of required) {
    if (!fs.existsSync(outputPath(file))) throw new Error("built artifact missing: " + file);
  }

  const bytes = files.reduce((sum, file) => sum + fs.statSync(outputPath(file)).size, 0);
  return { files: files.length, bytes };
}

function main() {
  if (DIST === ROOT || !DIST.startsWith(ROOT + path.sep)) throw new Error("unsafe dist path");
  fs.mkdirSync(DIST, { recursive: true });
  for (const entry of fs.readdirSync(DIST)) {
    fs.rmSync(path.join(DIST, entry), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }

  for (const file of PUBLIC_ROOT_FILES) copyFile(file);
  for (const file of PUBLIC_LAZY_FILES) copyFile(file);
  for (const file of PUBLIC_VENDOR_FILES) copyFile(file);
  for (const directory of PUBLIC_RUNTIME_DIRS) copyDirectory(directory);
  copyFile(EASTON_PUBLIC);
  fs.writeFileSync(outputPath(".nojekyll"), "", "utf8");

  const bundledSources = buildHtmlAndBundle();
  const result = verifyArtifact();
  console.log(JSON.stringify({
    status: "PASS",
    output: rel(path.relative(ROOT, DIST)),
    files: result.files,
    bytes: result.bytes,
    bundledScripts: bundledSources.length,
    excluded: ["QA scripts", "fixtures", "docs", "tools", "source research", "logs", "source maps"]
  }, null, 2));
}

main();
