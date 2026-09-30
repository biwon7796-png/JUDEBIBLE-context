"use strict";
// Minimal YAML subset reader for research notes (maps, lists, scalars, folded scalars).
// Enough for the fenced ```yaml blocks in JBC connected-research notes; not a general YAML implementation.
// Tolerates one non-standard shape used in the notes: a list followed by sibling keys at the same indent
// (returned as { _items: [...], key: value }).

const KEY = /^([A-Za-z0-9_.\-가-힣]+):(?:\s+(.*))?$/;

function scalar(v) {
  v = String(v).trim();
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v[0] === '"' && v.slice(-1) === '"') || (v[0] === "'" && v.slice(-1) === "'")) return v.slice(1, -1);
  return v;
}

function parse(text) {
  const L = String(text).replace(/\r/g, "").split("\n").map((raw) => ({ ind: raw.match(/^ */)[0].length, t: raw.trim() })).filter((l) => l.t && !l.t.startsWith("#"));
  let i = 0;
  const isItem = (l) => l && (l.t === "-" || l.t.startsWith("- "));

  function parseBlock(indent) {
    return isItem(L[i]) ? parseList(indent) : parseMap(indent);
  }
  function parseList(indent) {
    const items = [];
    while (i < L.length && L[i].ind === indent && isItem(L[i])) {
      const rest = L[i].t === "-" ? "" : L[i].t.slice(2);
      if (rest && KEY.test(rest)) { L[i] = { ind: indent + 2, t: rest }; items.push(parseMap(indent + 2)); }
      else { items.push(scalar(rest)); i++; }
    }
    if (i < L.length && L[i].ind === indent && KEY.test(L[i].t)) { const extra = parseMap(indent); return Object.assign({ _items: items }, extra); }
    return items;
  }
  function parseMap(indent) {
    const obj = {};
    while (i < L.length && L[i].ind === indent && !isItem(L[i])) {
      const m = KEY.exec(L[i].t);
      if (!m) { i++; continue; }
      const key = m[1], rest = m[2] === undefined ? "" : m[2]; i++;
      if (rest === ">" || rest === "|") {
        const parts = []; while (i < L.length && L[i].ind > indent) { parts.push(L[i].t); i++; }
        obj[key] = parts.join(" ");
      } else if (rest === "") {
        if (i < L.length && L[i].ind > indent) obj[key] = parseBlock(L[i].ind);
        else if (i < L.length && L[i].ind === indent && isItem(L[i])) obj[key] = parseList(indent);
        else obj[key] = null;
      } else obj[key] = scalar(rest);
    }
    return obj;
  }
  if (!L.length) return null;
  return parseBlock(L[0].ind);
}

module.exports = { parse, scalar };
