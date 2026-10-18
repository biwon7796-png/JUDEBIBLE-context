/* Lazy KRV layer (only loaded with ?krv=lazy). Builds window.BVC_KRV from the structure file so every length/count/name
   lookup works at once, while verse text is filled in per book. Reading a verse of a book that is not loaded yet returns ""
   and starts that book's download; "jbc-krv-loaded" fires when text arrives. Chapter arrays are Proxies that only react to
   index reads, so counting verses (chapter.length) never triggers a download. */
(function () {
  "use strict";
  var META = window.JBC_KRV_META, TEXT = (window.JBC_KRV_TEXT = window.JBC_KRV_TEXT || {});
  if (!META || !META.books) return;
  var V = "1", loaded = {}, loading = {}, used = {}, targets = {}, failed = {}, inflight = 0, waiters = [];
  function fillBook(id) {
    var src = TEXT[id], tg = targets[id]; if (!src || !tg) return false;
    for (var c = 0; c < tg.length && c < src.length; c++) for (var v = 0; v < tg[c].length && v < src[c].length; v++) tg[c][v] = src[c][v];
    loaded[id] = true; return true;
  }
  function touch(id) { if (!loaded[id]) { used[id] = true; if (window.JBC_KRV_DEBUG && !window.JBC_KRV_DEBUG[id]) window.JBC_KRV_DEBUG[id] = String(new Error().stack).split("\n").slice(3, 14).join("|"); ensure([id]); } }
  var books = META.books.map(function (b) {
    targets[b.id] = b.counts.map(function (n) { return new Array(n).fill(""); });
    var chapters = targets[b.id].map(function (arr) {
      return new Proxy(arr, { get: function (t, k, r) { if (typeof k === "string" && !loaded[b.id] && k.charCodeAt(0) >= 48 && k.charCodeAt(0) <= 57) touch(b.id); return Reflect.get(t, k, r); } });
    });
    return { id: b.id, name: b.name, chapters: chapters };
  });
  window.BVC_KRV = { meta: META.meta, books: books };
  function settle() { if (!inflight) { var w = waiters.splice(0); w.forEach(function (f) { f(); }); } }
  function loadOne(id, attempt) {
    return new Promise(function (resolve) {
      var s = document.createElement("script"); s.src = "assets/krv/" + id + ".js?v=" + V;
      s.onload = function () { if (fillBook(id)) { resolve(true); } else resolve(false); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    }).then(function (ok) { if (ok || attempt >= 1) return ok; return loadOne(id, attempt + 1); });
  }
  function ensure(ids) {
    var ps = (ids || []).filter(function (id) { return targets[id]; }).map(function (id) {
      if (loaded[id]) return Promise.resolve(true);
      if (loading[id]) return loading[id];
      inflight++;
      return (loading[id] = loadOne(id, 0).then(function (ok) {
        inflight--; delete loading[id];
        if (ok) { try { window.dispatchEvent(new CustomEvent("jbc-krv-loaded", { detail: { book: id, wasUsed: !!used[id] } })); } catch (e) {} }
        else {
          failed[id] = true; try { console.warn("KRV book failed to load:", id); } catch (e) {}
          // last resort: reload once in the proven eager mode (whole text in one file)
          try { if (!sessionStorage.getItem("jbc.krv.fallback")) { sessionStorage.setItem("jbc.krv.fallback", "1"); var u = new URL(location.href); u.searchParams.set("krv", "eager"); location.replace(u.href); } } catch (e) {}
        }
        settle(); return ok;
      }));
    });
    return Promise.all(ps).then(function (r) { return r.every(Boolean); });
  }
  function ensureAll() { return ensure(META.books.map(function (b) { return b.id; })); }
  function idle() { return new Promise(function (res) { var go = function () { setTimeout(function () { inflight ? waiters.push(go) : res(); }, 60); }; go(); }); }
  var pre = Object.keys(TEXT); pre.forEach(function (id) { if (targets[id]) fillBook(id); });
  window.JBC_KRV_LAZY = { ensure: ensure, ensureAll: ensureAll, loaded: function (id) { return !!loaded[id]; }, allLoaded: function () { return META.books.every(function (b) { return loaded[b.id]; }); },
    wasUsed: function (id) { return !!used[id]; }, clearUsed: function (id) { delete used[id]; }, failed: function () { return Object.keys(failed); }, idle: idle, loadedBooks: function () { return Object.keys(loaded); } };
})();

/* Same production compatibility shim that data-krv.js carries (non-authoritative QA fixtures intentionally omitted). */
window.BVC_FIXTURE={meta:{status:'PRODUCTION_EMPTY_COMPATIBILITY'},featured:[],lexicon:{},context:{},people:{},places:{},regions:{},events:{},routes:{},placeLinks:{},passages:{},photos:{},crossrefs:[],resources:[]};window.BVC_GUIDE_FIXTURE=null;
