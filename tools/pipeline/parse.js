"use strict";
// Stage 1 — Obsidian / Markdown research-note parser (read-only).
// Understands: optional YAML frontmatter, headings, fenced ```yaml blocks, pipe tables, **Key:** value lines,
// blockquotes, and Obsidian syntax ([[wikilink|alias]] / ![[embed]] are reduced to plain text).
// It never edits the note and never interprets meaning: it only returns structure with locators.
const fs = require("fs");
const crypto = require("crypto");
const yaml = require("./yaml-lite");

function clean(s) {
  const raw = String(s == null ? "" : s);
  let t = raw.replace(/!\[\[[^\]]*\]\]/g, "").replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2").replace(/\[\[([^\]]*)\]\]/g, "$1");
  if (t !== raw) t = t.replace(/[ 	]{2,}/g, " ");   // Obsidian 문법을 걷어낸 자리만 공백 정리(그 외 원문은 그대로)
  return t.replace(/\s+$/g, "");
}

function parseNote(file) {
  const buf = fs.readFileSync(file);
  let text = buf.toString("utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const source = { path: file, bytes: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") };

  let frontmatter = null;
  if (text.startsWith("---\n")) {
    const end = text.indexOf("\n---", 4);
    if (end > 0) { frontmatter = yaml.parse(text.slice(4, end)); text = text.slice(text.indexOf("\n", end + 1) + 1); }
  }

  const sections = {}, order = [], stack = [];
  const ensure = (key, level, heading) => sections[key] || (order.push(key), (sections[key] = { key, level, heading, text: [], quotes: [], fields: {}, tables: [], yaml: [] }));
  let cur = ensure("(top)", 0, "(top)");
  let fence = null;
  const lines = text.split("\n");

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (fence) {
      if (/^```\s*$/.test(line)) { if (/^ya?ml$/i.test(fence.lang)) { try { cur.yaml.push({ line: fence.start, data: yaml.parse(fence.buf.join("\n")) }); } catch (e) { cur.yaml.push({ line: fence.start, error: String(e.message || e) }); } } fence = null; }
      else fence.buf.push(line);
      continue;
    }
    const f = /^```(\w*)/.exec(line);
    if (f) { fence = { lang: f[1], start: n + 1, buf: [] }; continue; }

    const h = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (h) {
      const level = h[1].length; while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, heading: clean(h[2]) });
      cur = ensure(stack.map((x) => x.heading).join(" > "), level, clean(h[2]));
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows = [];
      while (n < lines.length && /^\s*\|/.test(lines[n])) { rows.push(lines[n].trim().replace(/^\||\|$/g, "").split("|").map((c) => clean(c.trim()))); n++; }
      n--;
      const data = rows.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
      cur.tables.push({ header: data[0] || [], rows: data.slice(1) });
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { cur.quotes.push(clean(q[1])); continue; }
    const kv = /^\*\*([^*]+?):\*\*\s*(.*?)\s*$/.exec(line);
    if (kv) { cur.fields[kv[1].trim()] = clean(kv[2]); continue; }
    if (line.trim() && !/^---+$/.test(line.trim())) cur.text.push(clean(line.trim()));
  }
  return { source, frontmatter, sections, order };
}

module.exports = { parseNote, clean };
