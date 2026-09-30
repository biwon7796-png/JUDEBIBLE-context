(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  var TABS = [["context", "문맥"], ["people", "인물"], ["places", "장소"], ["map", "지도"],
              ["photos", "사진"], ["crossref", "관련 본문"], ["resources", "외부 자료"], ["notes", "내 메모"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체", preview: null, prevTab: null };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // ---------- scripture data (개역한글, data/krv.js) ----------
  function deepFreeze(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.getOwnPropertyNames(o).forEach(function (k) { deepFreeze(o[k]); }); }
    return o;
  }
  // KRV 는 "현재 결속된 작업본"(canonical_final: false, 미검증)이며 Viewer 는 읽기 전용으로만 쓴다.
  var KRV = deepFreeze(window.BVC_KRV || { meta: { translation: {} }, books: [] });
  var BOOK = {}, BOOK_ORDER = [];
  KRV.books.forEach(function (bk) { BOOK[bk.id] = bk; BOOK_ORDER.push(bk.id); });
  var pcache = {};
  function chapterUnit(bookId) { return bookId === "psa" ? "편" : "장"; }
  function buildPassage(pid) {
    var m = /^([a-z0-9]+)-(\d+)$/.exec(pid), bk = m && BOOK[m[1]], c = m && +m[2];
    if (!bk || c < 1 || c > bk.chapters.length) return undefined;
    return pcache[pid] || (pcache[pid] = { ref: bk.name + " " + c + chapterUnit(bk.id), book: bk.id, chapter: c, verses: bk.chapters[c - 1].map(function (t, i) { return { n: i + 1, text: typeof t === "string" ? t : "" }; }) });
  }
  // 본문은 표시 시점에 읽는다(수정 없음). Object.keys 는 featured(관계 데이터가 있는) 본문만 나열한다.
  D.passages = new Proxy({}, {
    get: function (t, k) { return typeof k === "string" ? buildPassage(k) : undefined; },
    has: function (t, k) { return typeof k === "string" && !!buildPassage(k); },
    ownKeys: function () { return (D.featured || []).slice(); },
    getOwnPropertyDescriptor: function (t, k) { return (D.featured || []).indexOf(k) >= 0 ? { enumerable: true, configurable: true, writable: false, value: buildPassage(k) } : undefined; }
  });
  function stepPassage(pid, d) {
    var m = /^([a-z0-9]+)-(\d+)$/.exec(pid); if (!m || !BOOK[m[1]]) return null;
    var bi = BOOK_ORDER.indexOf(m[1]), c = +m[2] + d;
    if (c < 1) { bi--; if (bi < 0) return null; c = BOOK[BOOK_ORDER[bi]].chapters.length; }
    else if (c > BOOK[m[1]].chapters.length) { bi++; if (bi >= BOOK_ORDER.length) return null; c = 1; }
    return BOOK_ORDER[bi] + "-" + c;
  }

  // ---------- entity recognition (표면형 매칭; 본문은 수정하지 않는다) ----------
  var LEX = {}, LEX_RE = null;
  (function () {
    var list = [];
    Object.keys(D.lexicon || {}).forEach(function (id) { D.lexicon[id].surfaces.forEach(function (sf) { LEX[sf] = { id: id, kind: D.lexicon[id].kind }; list.push(sf); }); });
    list.sort(function (x, y) { return y.length - x.length; });
    if (list.length) LEX_RE = new RegExp(list.map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|"), "g");
  })();
  function annotated(pid) { return (D.featured || []).indexOf(pid) >= 0; }
  function entitiesIn(text) {
    var out = { p: [], l: [] }, m; if (!LEX_RE) return out; LEX_RE.lastIndex = 0;
    while ((m = LEX_RE.exec(text))) { var e = LEX[m[0]]; if (out[e.kind].indexOf(e.id) < 0) out[e.kind].push(e.id); }
    return out;
  }
  function verseEntities(pid, v) { return annotated(pid) ? entitiesIn(v.text) : { p: [], l: [] }; }
  function currentVerses() { var v = D.passages[state.passage].verses; return state.verse == null ? v : v.filter(function (x) { return x.n === state.verse; }); }
  function scopedEntities(kind) {
    var ids = [];
    currentVerses().forEach(function (v) { verseEntities(state.passage, v)[kind].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    return ids;
  }
  function versesWith(kind, id) {
    if (!annotated(state.passage)) return [];
    return D.passages[state.passage].verses.filter(function (v) { return entitiesIn(v.text)[kind].indexOf(id) >= 0; }).map(function (v) { return v.n; });
  }
  function parseKey(k) { var a = k.split(":"); return { passage: a[0], verse: +a[1] }; }
  function noteKey() { return "bvc.note." + state.passage + ":" + (state.verse == null ? "all" : state.verse); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function hasVerse(pid, n) { var P = D.passages[pid]; return !!(P && n >= 1 && n <= P.verses.length); }
  function stripTags(s) { return s; }
  function tabLabel(t) { var m = TABS.filter(function (x) { return x[0] === t; })[0]; return m ? m[1] : t; }
  function tabValid(t) { return TABS.some(function (x) { return x[0] === t; }); }
  function entityValid(e) { return !!(e && ((e.kind === "p" && D.people && D.people[e.id]) || (e.kind === "l" && D.places && D.places[e.id]))); }
  function showRefError(msg) { var el = $("ref-error"); if (el) el.textContent = msg || ""; }

  // ---------- workspace <-> URL ----------
  function serialize() {
    var h = state.passage + (state.verse != null ? ":" + state.verse : "");
    if (state.tab !== "context") h += "&tab=" + state.tab;
    if (state.entity) h += "&e=" + state.entity.kind + "." + state.entity.id;
    return h;
  }
  function parseHash(hash) {
    var parts = String(hash || "").replace(/^#/, "").split("&"), m = /^([a-z0-9]+-\d+)(?::(\d+))?$/.exec(parts[0]);
    if (!m) return null;
    var r = { passage: m[1], verse: m[2] ? +m[2] : null, tab: "context", entity: null };
    for (var i = 1; i < parts.length; i++) {
      var kv = /^(tab|e)=([\w.]+)$/.exec(parts[i]); if (!kv) return null;
      if (kv[1] === "tab") r.tab = kv[2]; else { var e = kv[2].split("."); if (e.length !== 2) return null; r.entity = { kind: e[0], id: e[1] }; }
    }
    if (!D.passages[r.passage] || (r.verse != null && !hasVerse(r.passage, r.verse)) || !tabValid(r.tab) || (r.entity && !entityValid(r.entity))) return null;
    return r;
  }
  function syncHash(replace) {
    var h = "#" + serialize();
    try { if (location.hash !== h) { if (replace) history.replaceState(null, "", h); else location.hash = h; } } catch (e) {}
  }

  // ---------- actions ----------
  var pendingScroll = null;
  function go(passage, verse) {
    verse = verse == null ? null : verse;
    if (!D.passages[passage] || (verse != null && !hasVerse(passage, verse))) { showRefError("유효하지 않은 참조: " + passage + (verse != null ? ":" + verse : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    state.passage = passage; state.verse = verse; state.entity = null; state.preview = null; state.prevTab = null;
    pendingScroll = verse != null ? "verse" : "top";
    render();
    return true;
  }
  // 참조 입력창/검색 결과가 쓰는 단일 진입점: 실패하면 현재 본문·절·스크롤을 그대로 둔다.
  function openReference(raw) {
    var q = String(raw == null ? "" : raw).trim();
    if (!q) { showRefError("참조를 입력하세요. 예: 창 22:2, 요 3:16, 시편 23편. 현재 본문을 유지합니다."); return false; }
    var r = parseReference(q);
    if (!r) { showRefError("참조 형식을 이해하지 못했습니다: “" + q + "” (예: 창 22:2, 요 3:16, 시편 23편). 현재 본문을 유지합니다."); return false; }
    if (r.error) { showRefError(r.error + " 현재 본문을 유지합니다."); return false; }
    return go(r.passage, r.verse);
  }
  function selectVerse(n) { state.verse = state.verse === n ? null : n; state.entity = null; state.prevTab = null; state.preview = null; render(); }
  function selectEntity(kind, id) {
    var same = state.entity && state.entity.kind === kind && state.entity.id === id;
    if (same) { closeEntity(); return; }
    if (!state.entity) state.prevTab = state.tab;
    state.entity = { kind: kind, id: id };
    state.tab = kind === "p" ? "people" : "places";
    render();
  }
  function closeEntity() {
    if (!state.entity) return;
    state.entity = null; if (state.prevTab) state.tab = state.prevTab; state.prevTab = null; render();
  }
  function returnFocusToText(en) {
    var sel = '.tag[data-kind="' + en.kind + '"][data-id="' + en.id + '"]';
    var n = (state.verse != null && document.querySelector('[data-verse="' + state.verse + '"] ' + sel)) || document.querySelector(sel) || (state.verse != null && document.querySelector('[data-vbtn="' + state.verse + '"]')) || document.querySelector("[data-vbtn]");
    if (n) n.focus();
  }
  function setTab(t) { if (!tabValid(t)) return; state.tab = t; state.preview = null; render(); }
  function applyHash() {
    var r = parseHash(location.hash);
    if (!r) { showRefError("유효하지 않은 참조: " + location.hash + " — 현재 본문을 유지합니다."); syncHash(true); return; }
    showRefError("");
    if (serialize() === location.hash.slice(1)) return;
    if (r.passage !== state.passage || r.verse !== state.verse) pendingScroll = r.verse != null ? "verse" : "top";
    state.passage = r.passage; state.verse = r.verse; state.tab = r.tab; state.entity = r.entity; state.preview = null; state.prevTab = null;
    render();
  }

  // ---------- render ----------
  var mounted = { passage: null, force: false }, anchors = {};
  function variantFor(pid, n) {
    try {
      var V = window.BVC_KRV_VARIANTS, e = V && V[pid + ":" + n];
      if (!e) return null;
      return typeof e === "object" ? (typeof e.status === "string" && e.status ? e.status : "UNRESOLVED") + (typeof e.priority === "string" && e.priority ? "_" + e.priority : "") : "UNRESOLVED";
    } catch (err) { return null; }
  }
  function verseMarkup(P, v, ann) {
    var text = typeof v.text === "string" ? v.text : "", html;
    if (ann && LEX_RE) {
      var out = "", last = 0, m; LEX_RE.lastIndex = 0;
      while ((m = LEX_RE.exec(text))) {
        var e = LEX[m[0]];
        out += esc(text.slice(last, m.index)) + '<span class="tag ' + e.kind + '" tabindex="0" role="button" data-kind="' + e.kind + '" data-id="' + e.id + '">' + esc(m[0]) + "</span>";
        last = m.index + m[0].length;
      }
      html = out + esc(text.slice(last));
    } else html = esc(text);
    var vr = variantFor(state.passage, v.n);   // 미해결 저우선 이형은 표시 차단 없이 속성으로만 남긴다
    return '<span class="verse" data-verse="' + v.n + '"' + (vr ? ' data-krv-variant="' + esc(vr) + '"' : "") + '><button class="vnum" data-vbtn="' + v.n + '" aria-pressed="false" aria-label="' + v.n + '절 선택">' + v.n + "</button>" + html + "</span>";
  }
  function mountPassage() {
    var box = $("verses"), P = D.passages[state.passage];
    if (!mounted.force && mounted.passage === state.passage && box.firstChild) return false;
    var ann = annotated(state.passage);
    box.innerHTML = P.verses.map(function (v) { return verseMarkup(P, v, ann); }).join("");
    var first = mounted.passage === null;
    mounted.passage = state.passage; mounted.force = false; mounted.first = first;
    return true;
  }
  function updateTextState() {
    var box = $("verses"), withE = null;
    try { if (state.entity) withE = versesWith(state.entity.kind, state.entity.id); } catch (e) { withE = null; }
    [].forEach.call(box.children, function (el) {
      var n = +el.dataset.verse;
      el.classList.toggle("sel", state.verse === n);
      el.classList.toggle("dim", !!withE && withE.indexOf(n) < 0);
      var btn = el.firstChild; if (btn && btn.setAttribute) btn.setAttribute("aria-pressed", String(state.verse === n));
    });
    [].forEach.call(box.querySelectorAll(".tag"), function (el) {
      el.classList.toggle("active", !!state.entity && state.entity.kind === el.dataset.kind && state.entity.id === el.dataset.id);
    });
  }
  // ---- passage scroll anchor: 화면 맨 위에 걸친 첫 절 ----
  function computeAnchor() {
    var vs = document.querySelectorAll("#verses .verse");
    for (var i = 0; i < vs.length; i++) {
      var r = vs[i].getBoundingClientRect();
      if (r.bottom > 6) return r.top <= 6 ? { passage: state.passage, verse: +vs[i].dataset.verse, offset: Math.round(r.top) } : null;
    }
    return null;
  }
  function scrollVerse(n, block) {
    var el = document.querySelector('#verses [data-verse="' + n + '"]'); if (!el) return;
    try { el.scrollIntoView({ block: block }); } catch (e) { el.scrollIntoView(); }
  }
  var scrollTick = false;
  window.addEventListener("scroll", function () {
    if (scrollTick) return; scrollTick = true;
    window.requestAnimationFrame(function () {
      scrollTick = false;
      try { var a = computeAnchor(); if (a) anchors[a.passage] = a.verse; else delete anchors[state.passage]; } catch (e) {}
    });
  }, { passive: true });
  function applyPendingScroll(remounted) {
    var mode = pendingScroll; pendingScroll = null;
    if (mode === "verse" && state.verse != null) scrollVerse(state.verse, "center");
    else if (mode === "top") { var a = anchors[state.passage]; if (a) scrollVerse(a, "start"); else if (remounted && !mounted.first) window.scrollTo(0, 0); }
  }
  function syncRefInput() {
    var el = $("ref-input"); if (!el || document.activeElement === el) return;
    el.value = D.passages[state.passage].ref + (state.verse != null ? " " + state.verse + "절" : "");
  }
  function renderText() {
    var P = D.passages[state.passage], remounted = mountPassage();
    updateTextState();
    $("passage-title").textContent = P.ref;
    var prevId = stepPassage(state.passage, -1), nextId = stepPassage(state.passage, 1);
    var pb = document.querySelector('[data-step="-1"]'), nb = document.querySelector('[data-step="1"]');
    if (pb) pb.disabled = !prevId; if (nb) nb.disabled = !nextId;
    $("crumb").textContent = state.verse == null ? "절을 클릭하면 아래 패널이 그 절 기준으로 좁혀집니다." : "선택: " + P.ref + " " + state.verse + "절 · 인물/장소를 클릭하면 관련 절이 강조됩니다.";
    syncRefInput();
    applyPendingScroll(remounted);
  }
  function renderTabs() {
    $("tabs").innerHTML = TABS.map(function (t) {
      return '<button role="tab" tabindex="' + (state.tab === t[0] ? 0 : -1) + '" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + t[1] + "</button>";
    }).join("");
  }
  function scopeLabel() { return state.verse == null ? "본문 전체" : state.verse + "절"; }
  function entityCards(kind, ids, dict) {
    if (!ids.length) return '<p class="empty helper">' + scopeLabel() + "에 해당 항목 없음.</p>";
    return ids.map(function (id) {
      var e = dict[id]; if (!e) return ""; var act = state.entity && state.entity.kind === kind && state.entity.id === id;
      return '<div class="item' + (act ? " active" : "") + '" tabindex="0" data-kind="' + kind + '" data-id="' + id + '"><h3 class="ent-name">' + esc(e.name) + "</h3>" +
        (e.role ? '<div class="ent-role">' + esc(e.role) + "</div>" : "") + '<div class="meta">' + esc(e.note) + '</div><div class="meta vs">등장 절 ' + versesWith(kind, id).join(", ") + "</div></div>";
    }).join("");
  }
  function inRange(spec, n) { var m = /^(\d+)(?:–(\d+))?/.exec(spec); if (!m) return false; var a = +m[1], b = m[2] ? +m[2] : a; return n >= a && n <= b; }
  function photoSvg(p) {
    return '<svg viewBox="0 0 150 100" role="img" aria-label="' + esc(p.title) + '"><rect width="150" height="100" fill="' + p.color + '"/><text x="75" y="54" text-anchor="middle" fill="#fff" font-size="11">샘플</text></svg>';
  }
  function relevantPlaceIds() {
    var ids = scopedEntities("l");
    if (state.entity && state.entity.kind === "l" && ids.indexOf(state.entity.id) < 0) ids.push(state.entity.id);
    return ids;
  }
  var PANELS = {
    context: function () {
      var c = D.context[state.passage];
      if (!c) return '<p class="empty helper">이 본문의 문맥 정보는 아직 없습니다.</p>';
      var s = c.structure.map(function (x) {
        var hit = state.verse != null && inRange(x, state.verse), m = /^(\S+)\s+(.*)$/.exec(x) || [0, "", x];
        return "<li" + (hit ? ' aria-current="true"' : "") + '><span class="rng">' + esc(m[1]) + "</span> " + esc(m[2]) + "</li>";
      }).join("");
      return '<div class="ctx-block ctx-theme" data-section="theme"><h3 class="sec-h">주제</h3><p class="lead">' + esc(c.theme) + "</p></div>" +
        '<div class="ctx-block" data-section="structure"><h3 class="sec-h">구조</h3><ol class="ctx-structure">' + s + "</ol></div>" +
        '<div class="ctx-grid"><div class="ctx-block" data-section="before"><h3 class="sec-h">앞 문맥</h3><p>' + esc(c.before) + '</p></div><div class="ctx-block" data-section="after"><h3 class="sec-h">뒤 문맥</h3><p>' + esc(c.after) + "</p></div></div>" +
        '<div class="ctx-block ctx-genre" data-section="genre"><h3 class="sec-h">장르</h3><p class="meta">' + esc(c.genre) + "</p></div>";
    },
    people: function () { return '<p class="scope">' + scopeLabel() + "의 인물</p>" + entityCards("p", scopedEntities("p"), D.people); },
    places: function () { return '<p class="scope">' + scopeLabel() + "의 장소</p>" + entityCards("l", relevantPlaceIds(), D.places); },
    map: function () {
      var all = D.placeLinks[state.passage] || [], here = scopedEntities("l"), bad = [];
      var badIds = [], linked = all.filter(function (id) { var p = D.places[id]; if (p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null) return true; bad.push(p ? p.name : id); badIds.push(id); return false; });
      var line = linked.length > 1 ? '<polyline points="' + linked.map(function (id) { return D.places[id].x + "," + D.places[id].y; }).join(" ") + '" class="map-route" fill="none"/>' : "";
      var pins = linked.map(function (id) {
        var p = D.places[id], act = (state.entity && state.entity.kind === "l" && state.entity.id === id) || (!state.entity && state.verse != null && here.indexOf(id) >= 0);
        return '<g class="pin' + (act ? " active" : "") + '" tabindex="0" role="button" data-kind="l" data-id="' + id + '"><circle class="halo" cx="' + p.x + '" cy="' + p.y + '" r="5.5"/><circle class="dot" cx="' + p.x + '" cy="' + p.y + '" r="2.6"/><text x="' + (p.x + 5) + '" y="' + (p.y + 1.3) + '">' + esc(p.name) + "</text></g>";
      }).join("");
      var note = bad.length ? '<p class="degraded" data-places="' + esc(badIds.join(",")) + '">지도에 표시할 수 없는 장소(좌표 오류): ' + esc(bad.join(", ")) + ". 장소 탭에서 텍스트로 확인할 수 있습니다.</p>" : "";
      return '<div class="map-wrap"><svg class="map" viewBox="0 0 100 100" role="img" aria-label="샘플 지도"><rect class="map-bg" x="0" y="0" width="100" height="100"/><path class="map-land" d="M0 90 Q30 70 55 60 T100 40 V100 H0Z"/>' + line + pins + "</svg></div>" + note +
        '<p class="helper">좌표는 프로토타입용 개략값입니다. ' + (all.length ? "" : "이 본문에는 지도 장소가 없습니다.") + "</p>";
    },
    photos: function () {
      var ids = relevantPlaceIds(), out = [], held = 0, missing = 0;
      ids.forEach(function (pid) { ((D.places[pid] && D.places[pid].photos) || []).forEach(function (ph) {
        var p = D.photos && D.photos[ph];
        if (!p) { missing++; return; }
        if (p.rights !== "CLEARED" || !p.source || !p.license || !p.credit) { held++; return; }
        out.push([pid, ph]);
      }); });
      var notes = (missing ? '<p class="degraded">이미지 ' + missing + "건을 불러올 수 없습니다.</p>" : "") + (held ? '<p class="helper">권리 확인 중인 이미지 ' + held + "건은 표시하지 않습니다.</p>" : "");
      if (!out.length) return notes + '<p class="empty helper">' + scopeLabel() + "에 표시할 사진 없음.</p>";
      return notes + out.map(function (x) { var p = D.photos[x[1]]; return '<figure class="photo" data-photo="' + x[1] + '" data-source="' + esc(p.source) + '" data-rights="' + esc(p.rights) + '">' + photoSvg(p) + '<figcaption><strong class="cap">' + esc(p.title) + '</strong><span class="meta prov">' + esc(p.credit) + " · " + esc(p.license) + " · 출처: " + esc(p.source) + " · " + esc(D.places[x[0]].name) + "</span></figcaption></figure>"; }).join("");
    },
    crossref: function () {
      var refs = D.crossrefs.filter(function (r) { var f = parseKey(r.from); return f.passage === state.passage && (state.verse == null || f.verse === state.verse); });
      if (!refs.length) return '<p class="empty helper">' + scopeLabel() + "의 관련 본문 없음.</p>";
      var list = refs.map(function (r) { return '<div class="item xref"><h3 class="ent-name"><a href="#" data-preview="' + r.to + '">' + esc(r.label) + '</a></h3><div class="meta">' + esc(r.type) + " · " + esc(r.from) + " → " + esc(r.to) + '</div><button class="btn ghost" data-goto="' + r.to + '">본문으로 이동</button></div>'; }).join("");
      var pv = "";
      if (state.preview) { var k = parseKey(state.preview), P = D.passages[k.passage], v = P && P.verses.filter(function (x) { return x.n === k.verse; })[0];
        pv = v ? '<div id="xref-preview" class="item preview"><h3 class="sec-h">미리보기 · ' + esc(P.ref) + " " + v.n + '절</h3><div>' + esc(stripTags(v.text)) + '</div><span class="helper">미리보기일 뿐 현재 본문은 바뀌지 않았습니다.</span></div>' : '<div id="xref-preview" class="degraded">미리볼 수 없는 참조입니다.</div>'; }
      return list + pv;
    },
    resources: function () {
      var list = D.resources.filter(function (r) { return r.passages.indexOf(state.passage) >= 0; });
      var kinds = ["전체"].concat(list.map(function (r) { return r.kind; }).filter(function (k, i, a) { return a.indexOf(k) === i; }));
      if (kinds.indexOf(state.resKind) < 0) state.resKind = "전체";
      var f = kinds.map(function (k) { return '<button data-reskind="' + k + '"' + (k === state.resKind ? ' class="on"' : "") + ">" + esc(k) + "</button>"; }).join(" ");
      var items = list.filter(function (r) { return state.resKind === "전체" || r.kind === state.resKind; })
        .map(function (r) { return '<div class="item res"><h3 class="ent-name"><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + '</a></h3><div class="meta">' + esc(r.kind) + " · 샘플 링크</div></div>"; }).join("");
      return '<p class="filters">' + f + "</p>" + (items || '<p class="empty helper">자료 없음.</p>');
    },
    notes: function () {
      return '<p class="scope">메모 대상 · ' + esc(D.passages[state.passage].ref) + " " + scopeLabel() + '</p><textarea id="note-text" aria-label="내 메모">' + esc(store(noteKey()) || "") +
        '</textarea><p class="actions"><button id="note-save" class="btn primary">저장</button> <button id="note-export" class="btn ghost">내보내기</button> <span id="note-status" class="helper" data-state="idle"></span></p><pre id="note-out" class="helper"></pre>';
    }
  };
  function renderPanel() {
    var html;
    try { html = PANELS[state.tab](); } catch (e) { html = '<div class="degraded" role="status">이 항목(' + esc(tabLabel(state.tab)) + ")을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>"; }
    $("panel").innerHTML = html;
  }
  function focusKey(el) {
    if (!el || !el.getAttribute) return null;
    var d = el.dataset || {};
    if (d.step) return '[data-step="' + d.step + '"]';
    if (d.vbtn) return '[data-vbtn="' + d.vbtn + '"]';
    if (d.tab) return '[data-tab="' + d.tab + '"]';
    if (el.classList.contains("tag")) return '.tag[data-kind="' + d.kind + '"][data-id="' + d.id + '"]';
    if (d.goto) return '[data-goto="' + d.goto + '"]';
    if (d.preview) return '[data-preview="' + d.preview + '"]';
    if (d.reskind) return '[data-reskind="' + d.reskind + '"]';
    if (d.id && el.closest("#panel")) return '#panel [data-kind="' + d.kind + '"][data-id="' + d.id + '"]';
    if (el.id && el.id !== "search") return "#" + el.id;
    return null;
  }
  var booting = false;
  function render() {
    var key = focusKey(document.activeElement);
    renderText();
    try { renderTabs(); renderPanel(); } catch (e) { var pn = $("panel"); if (pn) pn.innerHTML = '<div class="degraded" role="status">맥락 패널을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
    syncHash(booting);
    if (key) { var n = document.querySelector(key); if (n && n !== document.activeElement) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } } }
  }

  // ---------- search (normalized) ----------
  function norm(s) { return String(s == null ? "" : s).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  var ALIAS = null, REFTAIL = null;
  function REF_TAIL() { return REFTAIL || (REFTAIL = new RegExp("^(\\d+)(?:(?:" + norm("장") + "|" + norm("편") + "|:|\\.)(?:(\\d+)(?:" + norm("절") + ")?(?:(?:-|~|\\u2013|\\u2014)(\\d+)(?:" + norm("절") + ")?)?)?)?$")); }
  function buildAlias() {
    ALIAS = [];
    var abbr = { gen: "창", exo: "출", lev: "레", num: "민", deu: "신", jos: "수", jdg: "삿", rut: "룻", "1sa": "삼상", "2sa": "삼하", "1ki": "왕상", "2ki": "왕하", "1ch": "대상", "2ch": "대하", ezr: "스", neh: "느", est: "에", job: "욥", psa: "시", pro: "잠", ecc: "전", sng: "아", isa: "사", jer: "렘", lam: "애", ezk: "겔", dan: "단", hos: "호", jol: "욜", amo: "암", oba: "옵", jon: "욘", mic: "미", nam: "나", hab: "합", zep: "습", hag: "학", zec: "슥", mal: "말", mat: "마", mrk: "막", luk: "눅", jhn: "요", act: "행", rom: "롬", "1co": "고전", "2co": "고후", gal: "갈", eph: "엡", php: "빌", col: "골", "1th": "살전", "2th": "살후", "1ti": "딤전", "2ti": "딤후", tit: "딛", phm: "몬", heb: "히", jas: "약", "1pe": "벧전", "2pe": "벧후", "1jn": "요일", "2jn": "요이", "3jn": "요삼", jud: "유", rev: "계" };
    var extra = { jhn: ["요한"], "1jn": ["요한1서"], "2jn": ["요한2서"], "3jn": ["요한3서"] };
    var eng = { gen: "Genesis", exo: "Exodus", lev: "Leviticus", num: "Numbers", deu: "Deuteronomy", jos: "Joshua", jdg: "Judges", rut: "Ruth", "1sa": "1 Samuel", "2sa": "2 Samuel", "1ki": "1 Kings", "2ki": "2 Kings", "1ch": "1 Chronicles", "2ch": "2 Chronicles", ezr: "Ezra", neh: "Nehemiah", est: "Esther", job: "Job", psa: "Psalms", pro: "Proverbs", ecc: "Ecclesiastes", sng: "Song of Solomon", isa: "Isaiah", jer: "Jeremiah", lam: "Lamentations", ezk: "Ezekiel", dan: "Daniel", hos: "Hosea", jol: "Joel", amo: "Amos", oba: "Obadiah", jon: "Jonah", mic: "Micah", nam: "Nahum", hab: "Habakkuk", zep: "Zephaniah", hag: "Haggai", zec: "Zechariah", mal: "Malachi", mat: "Matthew", mrk: "Mark", luk: "Luke", jhn: "John", act: "Acts", rom: "Romans", "1co": "1 Corinthians", "2co": "2 Corinthians", gal: "Galatians", eph: "Ephesians", php: "Philippians", col: "Colossians", "1th": "1 Thessalonians", "2th": "2 Thessalonians", "1ti": "1 Timothy", "2ti": "2 Timothy", tit: "Titus", phm: "Philemon", heb: "Hebrews", jas: "James", "1pe": "1 Peter", "2pe": "2 Peter", "1jn": "1 John", "2jn": "2 John", "3jn": "3 John", jud: "Jude", rev: "Revelation" };
    KRV.books.forEach(function (bk) {
      [bk.name, bk.id, abbr[bk.id], eng[bk.id]].concat(extra[bk.id] || []).forEach(function (a) { if (a) ALIAS.push([norm(a).replace(/\s+/g, ""), bk.id]); });
    });
    ALIAS.sort(function (x, y) { return y[0].length - x[0].length; });
  }
  // "창세기 22:2", "창 22장 2절", "gen 22:2", "시편 23편" → {passage, verse} | {error} | null(참조 형식 아님)
  function parseReference(q) {
    if (!KRV.books.length) return null;
    if (!ALIAS) buildAlias();
    var t = norm(q).replace(/\s+/g, "");
    for (var i = 0; i < ALIAS.length; i++) {
      if (t.indexOf(ALIAS[i][0]) !== 0) continue;
      var m = REF_TAIL().exec(t.slice(ALIAS[i][0].length));
      if (!m) continue;
      var bk = BOOK[ALIAS[i][1]], c = +m[1], v = m[2] ? +m[2] : null, ve = m[3] ? +m[3] : null;
      if (c < 1 || c > bk.chapters.length) return { error: bk.name + "에는 " + c + chapterUnit(bk.id) + "이(가) 없습니다 (1–" + bk.chapters.length + chapterUnit(bk.id) + ")." };
      if (v != null && (v < 1 || v > bk.chapters[c - 1].length)) return { error: bk.name + " " + c + chapterUnit(bk.id) + "에는 " + v + "절이 없습니다 (1–" + bk.chapters[c - 1].length + "절)." };
      if (ve != null && (ve < v || ve > bk.chapters[c - 1].length)) return { error: bk.name + " " + c + chapterUnit(bk.id) + " " + v + "–" + ve + "절 범위가 올바르지 않습니다 (1–" + bk.chapters[c - 1].length + "절)." };
      return { passage: bk.id + "-" + c, verse: v, verseEnd: ve, label: bk.name + " " + c + chapterUnit(bk.id) + (v != null ? " " + v + "절" : "") };
    }
    return null;
  }
  var VINDEX = null;
  function verseIndex() {
    if (VINDEX) return VINDEX;
    VINDEX = [];
    KRV.books.forEach(function (bk) { bk.chapters.forEach(function (ch, ci) { ch.forEach(function (tx, vi) { VINDEX.push({ pid: bk.id + "-" + (ci + 1), n: vi + 1, t: norm(tx) }); }); }); });
    return VINDEX;
  }
  function search(q) {
    var nq = norm(q), out = [];
    if (!nq) return out;
    var ref = parseReference(q);
    if (ref && ref.passage) out.push({ kind: "r", id: ref.passage + ":" + (ref.verse == null ? "" : ref.verse), label: ref.label + " 열기", sub: "" });
    [["p", D.people], ["l", D.places]].forEach(function (d) { Object.keys(d[1] || {}).forEach(function (id) { var e = d[1][id]; if (norm(e.name + " " + (e.role || "") + " " + (e.aliases || []).join(" ")).indexOf(nq) >= 0) out.push({ kind: d[0], id: id, label: e.name, sub: d[0] === "p" ? "인물" : "장소" }); }); });
    var hits = [];
    var vi = verseIndex(); for (var i = 0; i < vi.length && hits.length < 30; i++) if (vi[i].t.indexOf(nq) >= 0) hits.push(vi[i]);
    hits.forEach(function (h) { var P = D.passages[h.pid]; out.push({ kind: "v", id: h.pid + ":" + h.n, label: P.ref + " " + h.n + "절", sub: P.verses[h.n - 1].text }); });
    return out;
  }
  function renderSearch() {
    var el = $("search-results"), q = $("search").value, r;
    var refErr = null;
    try { var pr = parseReference(q); refErr = pr && pr.error; r = search(q); } catch (e) { el.innerHTML = '<p class="degraded">검색을 사용할 수 없습니다.</p>'; return; }
    if (!norm(q)) { el.innerHTML = ""; return; }
    if (refErr) { el.innerHTML = '<p class="empty helper" data-ref-error="1">' + esc(refErr) + "</p>"; return; }
    el.innerHTML = r.length ? r.slice(0, 30).map(function (x) { return '<button class="sr" data-search="1" data-kind="' + x.kind + '" data-id="' + esc(x.id) + '">' + esc(x.label) + ' <span class="sub">' + esc(x.sub.slice(0, 40)) + "</span></button>"; }).join(" ") : '<p class="empty helper">검색 결과 없음.</p>';
  }
  function openSearchResult(kind, id) {
    if (kind === "v") { var k = parseKey(id); go(k.passage, k.verse); return; }
    if (kind === "r") { var rk = id.split(":"); go(rk[0], rk[1] ? +rk[1] : null); return; }
    var pid = state.passage;
    if (!versesWith(kind, id).length) { pid = Object.keys(D.passages).filter(function (p) { return D.passages[p].verses.some(function (v) { return entitiesIn(v.text)[kind].indexOf(id) >= 0; }); })[0] || pid; }
    if (pid !== state.passage) go(pid);
    if (!(state.entity && state.entity.kind === kind && state.entity.id === id)) selectEntity(kind, id);
  }

  // ---------- events ----------
  function fire(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-search]"))) return openSearchResult(el.dataset.kind, el.dataset.id);
    if ((el = t.closest("[data-step]"))) { var np = stepPassage(state.passage, +el.dataset.step); return np ? go(np) : undefined; }
    if ((el = t.closest(".tag"))) { e.stopPropagation(); return selectEntity(el.dataset.kind, el.dataset.id); }
    if ((el = t.closest("[data-verse]"))) return selectVerse(+el.dataset.verse);
    if ((el = t.closest("[data-tab]"))) return setTab(el.dataset.tab);
    if ((el = t.closest("[data-preview]"))) { e.preventDefault(); state.preview = el.dataset.preview; return render(); }
    if ((el = t.closest("[data-goto]"))) { e.preventDefault(); var k = parseKey(el.dataset.goto); return go(k.passage, k.verse); }
    if ((el = t.closest("[data-reskind]"))) { state.resKind = el.dataset.reskind; return render(); }
    if ((el = t.closest(".pin, .item[data-id]"))) return selectEntity(el.dataset.kind, el.dataset.id);
    if (t.id === "note-save") {
      var v = $("note-text").value; store(noteKey(), v);
      var idx = JSON.parse(store("bvc.noteIndex") || "[]"); if (idx.indexOf(noteKey()) < 0) idx.push(noteKey());
      store("bvc.noteIndex", JSON.stringify(idx)); $("note-status").textContent = "저장됨"; $("note-status").dataset.state = "saved"; return;
    }
    if (t.id === "note-export") {
      var all = {}; JSON.parse(store("bvc.noteIndex") || "[]").forEach(function (k) { all[k.replace("bvc.note.", "")] = store(k); });
      $("note-out").textContent = JSON.stringify(all, null, 2);
    }
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target, tag = t.tagName;
    if (e.key === "Escape") { if (state.entity) { e.preventDefault(); var en = state.entity; closeEntity(); returnFocusToText(en); } else if (state.preview) { state.preview = null; render(); } return; }
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (t.closest && t.closest("#tabs") && /^(ArrowRight|ArrowLeft|Home|End)$/.test(e.key)) {
      e.preventDefault();
      var i = TABS.map(function (x) { return x[0]; }).indexOf(state.tab), n = TABS.length;
      i = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowRight" ? 1 : n - 1)) % n;
      var next = TABS[i][0]; setTab(next); var b = document.querySelector('[data-tab="' + next + '"]'); if (b) b.focus(); return;
    }
    if ((e.key === "Enter" || e.key === " ") && tag !== "BUTTON" && tag !== "A" && t.getAttribute && t.getAttribute("tabindex") !== null) { e.preventDefault(); fire(t); }
  });
  $("search").addEventListener("input", renderSearch);
  $("ref-error").addEventListener("click", function () { showRefError(""); });
  $("ref-form").addEventListener("submit", function (e) { e.preventDefault(); openReference($("ref-input").value); });
  window.addEventListener("hashchange", applyHash);

  // ---------- boot ----------
  (function () {
    var tr = KRV.meta.translation || {}, n = $("notice");
    n.textContent = "본문: " + (tr.name || "(본문 데이터 없음)") + (tr.publisher ? " · " + tr.publisher + " " + tr.edition_year : "") + " · 위키문헌 전사본 기반, 원문 대조·권리 확인 전(내부 프로토타입) · " + D.meta.notice;
    n.dataset.translation = tr.abbr || ""; n.dataset.source = "ko.wikisource.org"; n.dataset.status = (KRV.meta.quality || {}).status || "";
  })();
  var h = parseHash(location.hash);
  if (h) { state.passage = h.passage; state.verse = h.verse; state.tab = h.tab; state.entity = h.entity; if (h.verse != null) pendingScroll = "verse"; }
  booting = true; render(); booting = false;
  window.BVC = { openReference: openReference, scrollAnchor: computeAnchor, remount: function () { mounted.force = true; render(); }, variantFor: variantFor, krv: KRV, stepPassage: stepPassage, parseReference: parseReference, render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
