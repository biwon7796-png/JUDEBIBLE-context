/* JudeBible minimal original-language verse view (auxiliary reading aid; CLOSED by default).
 * Shows the Hebrew/Greek verse that corresponds to the current KRV verse, using window.BVCOriginalLanguage.getVerse().
 * Display only: no token interaction, no lemma/morphology, no analysis layer. Source tokens are never modified (display strips only apparatus marks).
 * The current verse comes from the app's own state (BVC.state.passage / BVC.state.verse); a "bvc:rendered" event (one line in app.js render()) tells the view to refresh.
 */
(function () {
  "use strict";
  var OL = window.BVCOriginalLanguage, head = document.querySelector(".scripture-head");
  if (!head || document.getElementById("ol-toggle")) return;
  var open = false, seq = 0, shownRef = null, lastResult = null;
  var MSG = { hint: "절을 선택하면 해당 절의 원문을 볼 수 있습니다.", loading: "원문을 불러오는 중입니다…", hold: "이 절의 원문 절 연결은 현재 검토 중입니다.", error: "원문을 불러오지 못했습니다.", boundary: "절 경계 검토 중" };

  var btn = document.createElement("button");
  btn.type = "button"; btn.id = "ol-toggle"; btn.className = "btn ghost ol-toggle"; btn.textContent = "원문";
  btn.title = "현재 절의 히브리어/그리스어 원문"; btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "ol-body");
  var body = document.createElement("div");
  body.id = "ol-body"; body.className = "ol-body"; body.hidden = true; body.setAttribute("role", "region"); body.setAttribute("aria-label", "원어 원문"); body.setAttribute("data-state", "CLOSED");
  var krvBox = el("div", "ol-krv"), srcBox = el("div", "ol-src"); srcBox.setAttribute("aria-live", "polite");   // only the source area is announced; the KRV part is not re-read on every move
  var cardBox = el("div", "ol-card"); cardBox.hidden = true;
  var rpBar = el("div", "ol-research"), rpBox = el("div", "rp-panel"); rpBar.hidden = true; rpBox.hidden = true;   // verse-level access to the same research projection (BVCResearchProjection)
  body.appendChild(krvBox); body.appendChild(srcBox); body.appendChild(rpBar); body.appendChild(rpBox); body.appendChild(cardBox);
  var cur = null, cardTok = null;   // cur = the displayed source result (for token clicks); cardTok = token button whose word card is open
  function WC() { return window.BVCOriginalWordCard; }
  function closeCard(refocus) {
    var t = cardTok; cardTok = null;
    if (t) { t.removeAttribute("aria-expanded"); t.classList.remove("is-sel"); }
    if (WC()) WC().hide(cardBox); else { cardBox.textContent = ""; cardBox.hidden = true; }
    if (refocus && t && document.contains(t)) t.focus();
  }
  var anchor = document.getElementById("panel-open");
  head.insertBefore(btn, anchor || null); head.appendChild(body);   // parked (hidden) here while closed; while open it lives in #verses, inline under the selected verse (place())

  function S() { return window.BVC && window.BVC.state; }
  // 선택된 절이 없으면 현재 장의 첫 절을 기본 활성 절로 쓴다(표시 전용: 앱의 state.verse 는 바꾸지 않는다).
  function activeVerse() {
    var s = S(), f; if (!s) return null; if (s.verse != null) return s.verse;
    f = document.querySelector("#verses .verse[data-verse]"); return f ? +f.getAttribute("data-verse") : null;
  }
  function markDefault() {
    var s = S(), old = document.querySelectorAll("#verses .verse.ol-default-active"), i, n, v;
    for (i = 0; i < old.length; i++) old[i].classList.remove("ol-default-active");
    if (!open || !s || s.verse != null) return;
    n = activeVerse(); v = n != null ? document.querySelector('#verses .verse[data-verse="' + n + '"]') : null; if (v) v.classList.add("ol-default-active");
  }
  function currentRef() { var s = S(), n = activeVerse(); return s && s.passage && n != null ? s.passage + ":" + n : null; }
  function bookOf(id) { var k = window.BVC && window.BVC.krv, i; if (!k) return null; for (i = 0; i < k.books.length; i++) if (k.books[i].id === id) return k.books[i]; return null; }
  function refLabel(ref) {   // "gen-21:14" -> "창세기 21:14" (book name from the app's own KRV table)
    var m = /^([a-z0-9]+)-(\d+):(\d+)$/.exec(ref), b = m && bookOf(m[1]); return b ? b.name + " " + m[2] + ":" + m[3] : ref;
  }
  function drawResearch(ref) {   // verse-level link to the verified research projection; nothing is drawn without a verified link (no placeholder)
    var RP = window.BVCResearchProjection, v = RP && ref ? RP.verse(ref) : null, b;
    rpBar.textContent = ""; rpBox.textContent = ""; rpBox.hidden = true;
    if (!v) { rpBar.hidden = true; return; }
    rpBar.hidden = false; rpBar.appendChild(el("span", "ol-research-rel", "이삭 연구 · " + v.label));
    b = RP.cta(ref, rpBox); if (b) rpBar.appendChild(b); else rpBar.hidden = true;
  }
  function setState(st) { body.setAttribute("data-state", st); body.setAttribute("aria-busy", st === "LOADING" ? "true" : "false"); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // ---- display text (apparatus marks only are dropped from what is drawn; the data artifact is untouched) ----
  function tok(text, vi, i) {   // a source word as a plain, keyboard-reachable control (no colour/marking until selected)
    var b = el("button", "ol-w ol-tok", text); b.type = "button"; b.setAttribute("data-vi", vi); b.setAttribute("data-i", i); return b;
  }
  function hebrewText(verse, vi) {
    var out = el("p", "ol-text"), prevMaqaf = true, first = true, i, t, after;
    out.setAttribute("lang", "he"); out.setAttribute("dir", "rtl");
    for (i = 0; i < verse.t.length; i++) {
      t = verse.t[i]; if (t[2] === "Q" || t[2] === "A") continue;                   // main text only (ketiv shown as written; margin readings are a later feature)
      if (!first && !prevMaqaf) out.appendChild(document.createTextNode(" "));
      after = (t[1] || "").replace(/[נספ]/g, "");                    // paragraph/inverted-nun markers are not text
      out.appendChild(tok(t[0].replace(/\//g, "") + after, vi, i));
      prevMaqaf = after.charAt(after.length - 1) === "־"; first = false;
    }
    return out;
  }
  function greekText(verse, vi) {
    var out = el("p", "ol-text"), i, t, pre, post, parts = [];   // parts[k]: {s: text, i: token index or -1 for the verse label}
    out.setAttribute("lang", "grc"); out.setAttribute("dir", "ltr");
    if (verse.l) parts.push({ s: verse.l, i: -1 });
    for (i = 0; i < verse.t.length; i++) {
      t = verse.t[i]; pre = (t[1] || "").replace(/[⸀-⸅]|[0-9]/g, ""); post = (t[2] || "").replace(/[⸀-⸅]/g, "");
      parts.push({ s: pre + t[0] + post, i: i });
    }
    parts.forEach(function (p, k) { if (k) out.appendChild(document.createTextNode(" ")); out.appendChild(p.i < 0 ? el("span", "ol-w", p.s) : tok(p.s, vi, p.i)); });
    return out;
  }
  function render(r, ref) {
    srcBox.textContent = ""; cur = r.status === "OK" ? r : null;
    if (r.status === "OK") {
      setState("OPEN");
      var hb = r.testament === "OT", unresolved = r.boundary === "UNRESOLVED" && r.sourceRefs.length > 1, i, h;
      for (i = 0; i < r.sourceRefs.length; i++) {
        h = el("div", "ol-head"); h.appendChild(el("span", "ol-lang", (hb ? "히브리어" : "그리스어") + " · " + r.corpus)); h.appendChild(el("span", "ol-ref", refLabel(r.sourceRefs[i])));
        if (r.sourceRefs.length === 1 && r.sourceRefs[0] !== ref) h.appendChild(el("span", "ol-note", "원문 절 번호 기준"));
        srcBox.appendChild(h); srcBox.appendChild(hb ? hebrewText(r.verses[i], i) : greekText(r.verses[i], i));
      }
      if (unresolved) srcBox.appendChild(el("p", "ol-note", MSG.boundary));
    } else if (r.status === "HOLD") {
      setState("HOLD"); srcBox.appendChild(el("p", "ol-msg", MSG.hold));
    } else {
      setState("ERROR"); srcBox.appendChild(el("p", "ol-msg", MSG.error));
      if (r.code === "SCRIPT_LOAD_FAILED" || r.code === "BAD_ASSET" || r.code === "BUILD_MISMATCH") {
        var rb = el("button", "btn ghost ol-retry", "다시 시도"); rb.type = "button";
        rb.addEventListener("click", function () { var s = S(), m = /^([a-z0-9]+)-/.exec(ref); if (OL && m) OL.loadBook(m[1], { retry: true }).then(function () { refresh(true); }); });
        srcBox.appendChild(rb);
      }
    }
  }
  function place() {   // normal-flow placement: directly after the selected verse (top of the list when none); #verses is rebuilt on chapter change, so re-attach on every render
    var box = document.getElementById("verses"), s = S(), v;
    if (!box) return;
    var n = activeVerse();
    v = n != null ? box.querySelector('.verse[data-verse="' + n + '"]') : null;
    if (v) { if (v.nextSibling !== body) box.insertBefore(body, v.nextSibling); }
    else if (box.firstChild !== body) box.insertBefore(body, box.firstChild);
  }
  function refresh(force) {
    var ref = currentRef(), my = ++seq;
    if (!open) { markDefault(); return; }
    place(); markDefault();
    if (!ref) { closeCard(false); cur = null; drawResearch(null); krvBox.textContent = ""; srcBox.textContent = ""; setState("OPEN"); srcBox.appendChild(el("p", "ol-msg", MSG.hint)); shownRef = null; return; }
    if (!force && ref === shownRef && lastResult) return;
    closeCard(false); cur = null;   // a word card never survives a verse change
    drawResearch(ref); srcBox.textContent = ""; setState("LOADING"); srcBox.appendChild(el("p", "ol-msg", MSG.loading));   // stale source is gone at once; the KRV translation is shown only in the scripture text above (not repeated here)
    if (!OL) { render({ status: "ERROR", code: "NO_LOADER" }, ref); return; }
    OL.getVerse(ref).then(function (r) {
      if (my !== seq || !open) return;                          // a newer request/close happened: never overwrite the current verse
      lastResult = r; shownRef = ref; render(r, ref);
    });
  }
  function setOpen(v) {
    open = !!v; btn.setAttribute("aria-expanded", open ? "true" : "false"); body.hidden = !open; seq++;
    if (open) place(); else if (body.parentNode !== head) head.appendChild(body);
    markDefault();
    if (!open) { closeCard(false); cur = null; drawResearch(null); setState("CLOSED"); krvBox.textContent = ""; srcBox.textContent = ""; shownRef = null; lastResult = null; return; }
    refresh(true);
  }
  btn.addEventListener("click", function () { setOpen(!open); });
  srcBox.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ol-tok"), v, wc = WC();
    if (!b || !cur || !wc) return;
    if (cardTok === b) { closeCard(true); return; }
    v = cur.verses[+b.getAttribute("data-vi")]; if (!v) return;
    closeCard(false);
    wc.show(cardBox, { lang: cur.testament === "OT" ? "he" : "gr", tok: v.t[+b.getAttribute("data-i")], a: v.a ? v.a[+b.getAttribute("data-i")] : null, dict: cur.dict, krvRef: shownRef, srcRef: cur.sourceRefs[+b.getAttribute("data-vi")], ti: +b.getAttribute("data-i") }, function () { var t = cardTok; cardTok = null; if (t) { t.removeAttribute("aria-expanded"); t.classList.remove("is-sel"); if (document.contains(t)) t.focus(); } });
    cardTok = b; b.setAttribute("aria-expanded", "true"); b.classList.add("is-sel");
    try { cardBox.scrollIntoView({ block: "nearest" }); } catch (x) {}
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) { if (cardTok) { closeCard(true); return; } setOpen(false); btn.focus(); } });
  document.addEventListener("bvc:rendered", function () { if (open) refresh(false); });
  setOpen(true);   // 본문이 열리면 활성 절의 상세 카드는 기본으로 펼쳐 둔다(원문 버튼/Esc 로 접을 수 있음)
  window.BVCOriginalLanguageView = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, isOpen: function () { return open; }, cardOpen: function () { return !!cardTok; }, closeCard: function () { closeCard(false); }, state: function () { return body.getAttribute("data-state"); } };
})();
