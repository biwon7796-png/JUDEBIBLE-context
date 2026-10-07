/* JudeBible original-language lazy loader (read-only consumer of data/original-language/).
 * One namespace: window.BVCOriginalLanguage = { loadBook, getVerse, getState }.
 * - Input is the existing KRV key ("gen-21:14"); output is the production artifact verse, unchanged (no normalization, no X/U repair).
 * - Loads only the needed book (+ its corpus dictionary once, + reference-map once) with a single <script> per asset; concurrent requests share one Promise.
 * - Never throws into the app: every failure resolves to { status: "ERROR", code, ... }; mapping HOLD resolves to { status: "HOLD", ... } without a source guess.
 * - No UI, no eager load: nothing is requested until loadBook/getVerse is called.
 */
(function (root) {
  "use strict";
  var BASE = "data/original-language/";
  var CORPUS = { OT: { key: "oshb", name: "OSHB", dir: "hebrew" }, NT: { key: "sbl", name: "SBLGNT", dir: "greek" } };
  var NT_FIRST = "mat"; // KRV canonical order: every book before the first NT book is OT (reuses window.BVC_KRV; no second book table)

  function create(env) {
    var books = {}, assets = {}, scriptLoads = 0, loadLog = [];
    function krv() { return env.krv && env.krv(); }
    function bookInfo(id) {                       // trusted routing: id must be a KRV book id; the script path is built from the table, never from raw input
      var k = krv(), list = k && k.books;
      if (typeof id !== "string" || !list) return null;
      for (var i = 0, nt = false; i < list.length; i++) { if (list[i].id === NT_FIRST) nt = true; if (list[i].id === id) { var t = nt ? "NT" : "OT"; return { id: id, testament: t, corpus: CORPUS[t], book: list[i] }; } }
      return null;
    }
    function err(code, msg, extra) { var o = { status: "ERROR", code: code, message: msg }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
    // one script per asset; the promise is cached while LOADING and after LOADED; ERROR is sticky until retry
    function loadAsset(key, path, check, opts) {
      var a = assets[key];
      if (a && a.state === "LOADED") return a.promise;
      if (a && a.state === "LOADING") return a.promise;
      if (a && a.state === "ERROR" && !(opts && opts.retry)) return a.promise;
      a = assets[key] = { state: "LOADING", error: null, promise: null };
      scriptLoads++; loadLog.push(key);
      a.promise = new Promise(function (resolve) {
        env.loadScript(BASE + path, function (e) {
          if (e) { a.state = "ERROR"; a.error = err("SCRIPT_LOAD_FAILED", "could not load " + path); return resolve(a.error); }
          var bad = null; try { bad = check(); } catch (x) { bad = "check threw: " + x.message; }
          if (bad) { a.state = "ERROR"; a.error = err("BAD_ASSET", path + ": " + bad); return resolve(a.error); }
          a.state = "LOADED"; resolve({ status: "OK" });
        });
      });
      return a.promise;
    }
    function w() { return env.window; }
    function loadRefmap(opts) {
      return loadAsset("refmap", "reference-map.js", function () { var r = w().BVC_OL_REFMAP; return r && r.books && r.build_id ? null : "global BVC_OL_REFMAP missing or malformed"; }, opts);
    }
    function loadDict(info, opts) {
      var c = info.corpus;
      return loadAsset("dict:" + c.key, c.dir + "/dict.js", function () { var d = w().BVC_OL_DICT && w().BVC_OL_DICT[c.key]; return d && d.build_id && d.lemma && d.morph ? null : "global BVC_OL_DICT." + c.key + " missing or malformed"; }, opts);
    }
    function loadBook(bookId, opts) {
      try {
        var info = bookInfo(bookId); if (!info) return Promise.resolve(err("UNKNOWN_BOOK", "unknown book id", { bookId: bookId }));
        var key = info.corpus.key + ":" + info.id;
        return Promise.all([loadAsset(key, info.corpus.dir + "/" + info.id + ".js", function () {
          var b = w().BVC_OL_BOOK && w().BVC_OL_BOOK[key];
          if (!b) return "global BVC_OL_BOOK[\"" + key + "\"] missing";
          if (b.corpus !== info.corpus.key || b.book !== info.id || !b.v || typeof b.v !== "object" || !b.build_id) return "malformed book data";
          return null;
        }, opts), loadDict(info, opts), loadRefmap(opts)]).then(function (rs) {
          var bad = rs.filter(function (r) { return r.status !== "OK"; })[0]; if (bad) return bad;
          var b = w().BVC_OL_BOOK[key];
          if (b.build_id !== w().BVC_OL_REFMAP.build_id || b.build_id !== w().BVC_OL_DICT[info.corpus.key].build_id) { assets[key].state = "ERROR"; assets[key].error = err("BUILD_MISMATCH", "book/dictionary/reference-map build_id differ"); return assets[key].error; }
          return { status: "OK", state: "LOADED", bookId: info.id, testament: info.testament, corpus: info.corpus.name };
        });
      } catch (e) { return Promise.resolve(err("INTERNAL", e.message)); }
    }
    // resolve a KRV ref with the verified reference-map semantics (same rules as tools/original-language/lib/refmap.js resolveRef; never invents a mapping)
    function resolveMap(mapBook, ref, p) {
      var rec, i, m, s, r;
      for (i = 0; i < mapBook.records.length; i++) {
        r = mapBook.records[i];
        if (typeof r.krv === "string") {
          m = /^(\w+)-(\d+):(\d+)(?:\.\.(\d+))?$/.exec(r.krv); s = /^(\w+)-(\d+):(\d+)(?:\.\.(\d+))?$/.exec(r.src);
          if (m && +m[2] === p.c && p.v >= +m[3] && p.v <= (m[4] ? +m[4] : +m[3])) return { rec: r, src: [s[1] + "-" + s[2] + ":" + (+s[3] + (p.v - +m[3]))] };
        } else if (r.krv.indexOf(ref) >= 0) return { rec: r, src: r.src };
      }
      return mapBook.default === "IDENTITY_VERIFIED" ? { rec: null, src: [ref] } : { rec: null, hold: "NO_PROOF" };
    }
    function getVerse(krvRef) {
      try {
        var m = typeof krvRef === "string" && /^([a-z0-9]+)-(\d+):(\d+)$/.exec(krvRef);
        if (!m) return Promise.resolve(err("BAD_REF", "expected a KRV key like gen-21:14", { krvRef: krvRef }));
        var info = bookInfo(m[1]); if (!info) return Promise.resolve(err("UNKNOWN_BOOK", "unknown book id", { krvRef: krvRef }));
        var ch = info.book.chapters[+m[2] - 1], p = { b: m[1], c: +m[2], v: +m[3] };
        if (!ch || p.v < 1 || p.v > ch.length) return Promise.resolve(err("UNKNOWN_KRV_REF", "no such KRV verse", { krvRef: krvRef }));
        return loadBook(info.id).then(function (lb) {
          if (lb.status !== "OK") return Object.assign({ krvRef: krvRef }, lb);
          var REF = w().BVC_OL_REFMAP, mb = REF.books[info.id] && REF.books[info.id][info.corpus.key];
          if (!mb) return err("NO_REFERENCE_MAP", "no reference map for this book", { krvRef: krvRef });
          var res = resolveMap(mb, krvRef, p), rec = res.rec;
          var base = { krvRef: krvRef, testament: info.testament, corpus: info.corpus.name, scheme: w().BVC_OL_BOOK[info.corpus.key + ":" + info.id].scheme, buildId: REF.build_id };
          if (res.hold || (rec && rec.status === "HOLD")) return Object.assign(base, { status: "HOLD", reason: res.hold || rec.reason || "HOLD", mappingType: rec ? rec.type : null, boundary: rec ? rec.boundary : null });
          if (!res.src || !res.src.length) return err("UNSUPPORTED_MAPPING", "verified mapping without a source verse", { krvRef: krvRef });
          var bookData = w().BVC_OL_BOOK[info.corpus.key + ":" + info.id], refs = [], verses = [], i, sm, v;
          for (i = 0; i < res.src.length; i++) {
            sm = /^(\w+)-(\d+):(\d+)$/.exec(res.src[i]);
            if (!sm || sm[1] !== info.id) return err("UNSUPPORTED_MAPPING", "source verse outside the loaded book: " + res.src[i], { krvRef: krvRef });
            v = bookData.v[sm[2] + ":" + sm[3]];
            if (!v) return err("SOURCE_VERSE_NOT_FOUND", "source verse " + res.src[i] + " is not in the loaded book", { krvRef: krvRef });
            refs.push(res.src[i]); verses.push(v);
          }
          var out = Object.assign(base, { status: "OK", mappingType: rec ? rec.type : "DIRECT_MAP", boundary: rec ? rec.boundary : "N/A", sourceRefs: refs, verses: verses, dict: w().BVC_OL_DICT[info.corpus.key] });
          if (refs.length === 1) { out.sourceRef = refs[0]; out.verse = verses[0]; }
          return out;
        });
      } catch (e) { return Promise.resolve(err("INTERNAL", e.message)); }
    }
    function getState() {
      var s = { scriptLoads: scriptLoads, loadLog: loadLog.slice(), assets: {} };
      for (var k in assets) s.assets[k] = assets[k].state;
      return s;
    }
    return { loadBook: loadBook, getVerse: getVerse, getState: getState };
  }

  // browser environment: one <script> per asset, same relative-path static script pattern as the rest of the app
  function browserEnv(win) {
    return {
      window: win, krv: function () { return win.BVC_KRV; },
      loadScript: function (src, done) {
        var s = win.document.createElement("script"); s.async = true; s.src = src;
        s.onload = function () { s.onload = s.onerror = null; done(null); };
        s.onerror = function () { s.onload = s.onerror = null; if (s.parentNode) s.parentNode.removeChild(s); done(new Error("load failed")); };
        win.document.head.appendChild(s);
      }
    };
  }
  if (root && root.document) root.BVCOriginalLanguage = create(browserEnv(root));
  if (typeof module !== "undefined" && module.exports) module.exports = { create: create, BASE: BASE };
})(typeof window !== "undefined" ? window : null);
