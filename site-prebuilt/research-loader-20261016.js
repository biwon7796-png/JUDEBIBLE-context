/* Loads the research of one book at a time (data/research-books/<book>.js). Loaded before the app bundle.
   - the book in the address (deep link) is loaded synchronously, so the first screen already has its research
   - when the reader moves to another book, that book's bundle is fetched once and the screen is re-rendered
   - other modules call JBCResearch.ensure(book, callback) when they need a book (timeline card, place panel) */
(function (w) {
  var M = w.JBC_RESEARCH_BOOKS || {}, state = {}, waiting = {};
  w.BVC_PASSAGE_RESEARCH_CONTENT = w.BVC_PASSAGE_RESEARCH_CONTENT || [];
  function url(b) { return "data/research-books/" + b + ".js?v=" + M[b].v; }
  function has(b) { return !!M[b]; }
  function done(b) { state[b] = "done"; (waiting[b] || []).splice(0).forEach(function (cb) { try { cb(b); } catch (e) {} }); }
  function ensure(b, cb) {
    if (!has(b)) { if (cb) cb(b); return; }
    if (state[b] === "done") { if (cb) cb(b); return; }
    if (cb) (waiting[b] = waiting[b] || []).push(cb);
    if (state[b]) return; state[b] = "loading";
    var s = document.createElement("script"); s.src = url(b); s.async = true; s.onerror = function () { state[b] = "error"; };
    document.head.appendChild(s);
  }
  w.JBCResearch = { ensure: ensure, has: has, books: M, loaded: function (b) { return state[b] === "done"; }, _done: done };
  // deep link: load the book of the address now (parser-blocking), so nothing flickers
  var m = /^#([1-3]?[a-z]+)-\d/i.exec(location.hash || ""), b0 = m && m[1].toLowerCase();
  if (b0 && has(b0)) { state[b0] = "loading"; document.write('<script src="' + url(b0) + '"><\/script>'); state[b0] = "done"; }
  // follow the reader: when the passage moves into a book that is not loaded, load it and repaint once
  var last = "";
  setInterval(function () {
    var st = w.BVC && w.BVC.state; var p = st && st.passage; var ref = typeof p === "string" ? p : (p && p.ref) || "";
    var mm = /^([1-3]?[a-z]+)-/i.exec(ref || ""); var b = mm && mm[1].toLowerCase(); if (!b || b === last) return; last = b;
    if (has(b) && state[b] !== "done") ensure(b, function () { try { if (w.BVC && w.BVC.render) w.BVC.render(); } catch (e) {} });
  }, 300);
})(window);
