(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  var TABS = [["context", "문맥"], ["people", "인물"], ["places", "장소"], ["map", "지도"],
              ["photos", "사진"], ["crossref", "관련 본문"], ["resources", "외부 자료"], ["notes", "내 메모"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체", preview: null, prevTab: null, panel: "open", sheet: "half" };
  var ui = { frac: 0.4, mapOpen: false };   // 작업공간 표시 설정(URL 에 넣지 않는 개인 레이아웃 값)
  var SPLIT_KEY = "bvc.split.v1";
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
    if (state.panel !== "open") h += "&panel=" + state.panel;     // 데스크톱 맥락 패널 상태(기본 open 은 생략)
    if (state.sheet !== "half") h += "&sheet=" + state.sheet;     // 모바일 맥락 시트 상태(기본 half 는 생략)
    return h;
  }
  function parseHash(hash) {
    var parts = String(hash || "").replace(/^#/, "").split("&"), m = /^([a-z0-9]+-\d+)(?::(\d+))?$/.exec(parts[0]);
    if (!m) return null;
    var r = { passage: m[1], verse: m[2] ? +m[2] : null, tab: "context", entity: null };
    for (var i = 1; i < parts.length; i++) {
      var kv = /^(tab|e|panel|sheet)=([\w.]+)$/.exec(parts[i]); if (!kv) return null;
      if (kv[1] === "panel") { if (kv[2] !== "open" && kv[2] !== "collapsed") return null; r.panel = kv[2]; }
      else if (kv[1] === "sheet") { if (["peek", "half", "full"].indexOf(kv[2]) < 0) return null; r.sheet = kv[2]; }
      else if (kv[1] === "tab") r.tab = kv[2]; else { var e = kv[2].split("."); if (e.length !== 2) return null; r.entity = { kind: e[0], id: e[1] }; }
    }
    if (!D.passages[r.passage] || (r.verse != null && !hasVerse(r.passage, r.verse)) || !tabValid(r.tab) || (r.entity && !entityValid(r.entity))) return null;
    return r;
  }
  // history entry 마다 "떠날 때의 스크롤 앵커"를 남겨 back/forward 가 본문 읽던 자리까지 복원하게 한다.
  var entryAnchors = {}, replaceNext = false, currentFrag = "";
  function entryKey(frag) { return String(frag || "").replace(/^#/, "").replace(/&(panel|sheet)=[^&]*/g, ""); }
  function saveEntryAnchor(a) {   // a = 화면이 바뀌기 "전"에 계산한 앵커(render 시작 시점)
    try { entryAnchors[entryKey(location.hash)] = a || null; history.replaceState({ bvcAnchor: a || null }, ""); } catch (e) {}
  }
  function syncHash(replace, leaving) {
    var h = "#" + serialize();
    try { if (location.hash !== h) { if (replace) history.replaceState(history.state, "", h); else { saveEntryAnchor(leaving); location.hash = h; } } } catch (e) {}
    currentFrag = location.hash;
  }

  // ---------- actions ----------
  var pendingScroll = null;
  function go(passage, verse) {
    verse = verse == null ? null : verse;
    if (!D.passages[passage] || (verse != null && !hasVerse(passage, verse))) { showRefError("유효하지 않은 참조: " + passage + (verse != null ? ":" + verse : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    state.passage = passage; state.verse = verse; state.entity = null; state.preview = null; state.prevTab = null;
    pendingScroll = { mode: verse != null ? "verse" : "top" };
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
    var okGo = go(r.passage, r.verse); if (okGo) syncRefInput(true);   // 성공하면 입력창을 정규 표기로 정리(포커스는 유지)
    return okGo;
  }
  function selectVerse(n) { state.verse = state.verse === n ? null : n; state.entity = null; state.prevTab = null; state.preview = null; render(); }
  function selectEntity(kind, id) {
    var same = state.entity && state.entity.kind === kind && state.entity.id === id;
    if (same) { closeEntity(); return; }
    if (!state.entity) state.prevTab = state.tab;
    state.entity = { kind: kind, id: id };
    state.tab = kind === "p" ? "people" : "places";
    if (kind === "l" && isMobile()) ui.mapOpen = true;
    ensureContextVisible();
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
  function setTab(t) { if (!tabValid(t)) return; state.tab = t; state.preview = null; ensureContextVisible(); render(); }
  // ---- 맥락 패널(데스크톱) / 맥락 시트(모바일) 상태 ----
  function isMobile() { try { return window.matchMedia("(max-width: 760px)").matches; } catch (e) { return false; } }
  function ensureContextVisible() { if (state.panel === "collapsed") state.panel = "open"; if (state.sheet === "peek") state.sheet = "half"; }
  function setPanel(v) { if (v !== "open" && v !== "collapsed") return false; state.panel = v; replaceNext = true; render(); return true; }
  function setSheet(v) { if (["peek", "half", "full"].indexOf(v) < 0) return false; state.sheet = v; replaceNext = true; render(); return true; }
  function cycleSheet() { return setSheet({ half: "full", full: "peek", peek: "half" }[state.sheet]); }
  function toggleContext() { return isMobile() ? cycleSheet() : setPanel(state.panel === "open" ? "collapsed" : "open"); }
  function updateContextChrome() {
    var b = document.body, mob = isMobile();
    b.dataset.panel = state.panel; b.dataset.sheet = state.sheet;
    var tg = $("panel-toggle"), op = $("panel-open");
    if (tg) {
      var lab = mob ? { peek: "맥락 시트 열기", half: "맥락 시트 확대", full: "맥락 시트 접기" }[state.sheet] : "맥락 패널 접기";
      tg.textContent = mob ? { peek: "열기", half: "확대", full: "접기" }[state.sheet] : "접기"; tg.setAttribute("aria-label", lab); tg.title = lab;
      tg.setAttribute("aria-expanded", String(mob ? state.sheet !== "peek" : state.panel === "open")); tg.dataset.mode = mob ? "sheet" : "panel";
    }
    if (op) op.hidden = !(!mob && state.panel === "collapsed");
  }
  function applyHash() {
    var r = parseHash(location.hash);
    if (!r) { showRefError("유효하지 않은 참조: " + location.hash + " — 현재 본문을 유지합니다."); syncHash(true); return; }
    showRefError("");
    if (serialize() === location.hash.slice(1)) return;
    try { entryAnchors[entryKey(currentFrag)] = computeAnchor(); } catch (e) {}     // back/forward 로 "떠나는" entry 의 앵커도 남긴다
    var ea = entryAnchors[entryKey(location.hash)] || (history.state && history.state.bvcAnchor) || null;
    if (r.passage !== state.passage || r.verse !== state.verse || ea) pendingScroll = { mode: r.verse != null ? "verse" : "top", anchor: ea && ea.passage === r.passage ? ea : null };
    state.passage = r.passage; state.verse = r.verse; state.tab = r.tab; state.entity = r.entity; state.preview = null; state.prevTab = null;
    if (r.panel) state.panel = r.panel; if (r.sheet) state.sheet = r.sheet;
    replaceNext = true;     // history 에서 온 상태 복원은 새 entry 를 만들지 않는다
    render(); syncRefInput(true);
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
    var hb = document.querySelector("header.top"), inset = hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0;   // 고정 헤더 아래가 실제 읽기 영역의 위쪽
    var vs = document.querySelectorAll("#verses .verse");
    for (var i = 0; i < vs.length; i++) {
      var r = vs[i].getBoundingClientRect();
      if (r.bottom > inset + 6) return r.top - inset <= 6 ? { passage: mounted.passage || state.passage, verse: +vs[i].dataset.verse, offset: Math.round(r.top - inset) } : null;
    }
    return null;
  }
  function restoreAnchor(a) { scrollVerse(a.verse, "start"); if (a.offset) window.scrollBy(0, -a.offset); }
  function scrollVerse(n, block) {
    var el = document.querySelector('#verses [data-verse="' + n + '"]'); if (!el) return;
    try { el.scrollIntoView({ block: block }); } catch (e) { el.scrollIntoView(); }
  }
  var scrollTick = false, histTimer = null;
  window.addEventListener("scroll", function () {
    document.body.dataset.stuck = String(window.scrollY > 2);   // 레이아웃을 읽지 않는 값은 즉시 갱신
    if (!scrollTick) {
      scrollTick = true;
      window.requestAnimationFrame(function () {
        scrollTick = false;
        try { var a = computeAnchor(); if (a) anchors[a.passage] = a; else delete anchors[state.passage]; } catch (e) {}
        updateHeaderMetrics();
      });
    }
    clearTimeout(histTimer);   // 새로고침/복귀용: 현재 entry 의 history.state 에 앵커를 남긴다(새 entry 를 만들지 않음)
    histTimer = setTimeout(function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} }, 250);
  }, { passive: true });
  function applyPendingScroll(remounted) {
    var p = pendingScroll; pendingScroll = null; if (!p) return true;
    if (p.anchor && p.anchor.passage === state.passage) { restoreAnchor(p.anchor); return true; }
    if (p.mode === "verse" && state.verse != null) scrollVerse(state.verse, "center");
    else if (p.mode === "top") { var a = anchors[state.passage]; if (a) restoreAnchor(a); else if (remounted && !mounted.first) window.scrollTo(0, 0); }
    return true;
  }
  function syncRefInput(force) {
    var el = $("ref-input"); if (!el || (!force && document.activeElement === el)) return;
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
  // ---------- map model (맥락 패널의 지도 탭과 상시 지도 창이 같은 모델을 쓴다) ----------
  function mapModel() {
    var all = D.placeLinks[state.passage] || [], here = scopedEntities("l"), bad = [], badIds = [];
    var linked = all.filter(function (id) { var p = D.places[id]; if (p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null) return true; bad.push(p ? p.name : id); badIds.push(id); return false; });
    return { all: all, here: here, bad: bad, badIds: badIds, linked: linked };
  }
  function mapSvg(m, cls, numbered) {
    var line = m.linked.length > 1 ? '<polyline points="' + m.linked.map(function (id) { return D.places[id].x + "," + D.places[id].y; }).join(" ") + '" class="map-route" fill="none"/>' : "";
    var pins = m.linked.map(function (id, i) {
      var p = D.places[id], act = (state.entity && state.entity.kind === "l" && state.entity.id === id) || (!state.entity && state.verse != null && m.here.indexOf(id) >= 0);
      return '<g class="pin' + (act ? " active" : "") + '" tabindex="0" role="button" data-kind="l" data-id="' + id + '" aria-label="' + esc(p.name) + '"><circle class="halo" cx="' + p.x + '" cy="' + p.y + '" r="5.5"/><circle class="dot" cx="' + p.x + '" cy="' + p.y + '" r="2.6"/><text x="' + (p.x + 5) + '" y="' + (p.y + 1.3) + '">' + (numbered ? (i + 1) + ". " : "") + esc(p.name) + "</text></g>";
    }).join("");
    return '<svg class="' + cls + '" viewBox="0 0 100 100" role="img" aria-label="샘플 지도"><rect class="map-bg" x="0" y="0" width="100" height="100"/><path class="map-land" d="M0 90 Q30 70 55 60 T100 40 V100 H0Z"/>' + line + pins + "</svg>";
  }
  // 안내 경로: 본문(placeLinks)에 연결된 장소 순서. 이전/다음은 이 경로 위의 place selection 이다.
  function guideRoute() { return (D.placeLinks[state.passage] || []).filter(function (id) { return D.places[id]; }); }
  function guideIndex() { return state.entity && state.entity.kind === "l" ? guideRoute().indexOf(state.entity.id) : -1; }
  function guideGo(i) {
    var r = guideRoute(), id = r[i]; if (!id) return false;
    if (state.entity && state.entity.kind === "l" && state.entity.id === id) return true;
    if (!state.entity) state.prevTab = state.tab;
    state.entity = { kind: "l", id: id }; state.tab = "places"; state.preview = null;
    if (isMobile()) ui.mapOpen = true;
    ensureContextVisible(); render(); return true;
  }
  function guideStep(d) {
    var r = guideRoute(), cur = guideIndex(); if (!r.length) return false;
    var t = cur < 0 ? (d > 0 ? 0 : r.length - 1) : cur + d;
    return t >= 0 && t < r.length ? guideGo(t) : false;
  }
  function detailBlock(kind) {
    var en = state.entity; if (!en || en.kind !== kind) return "";
    var dict = kind === "p" ? D.people : D.places, e = dict && dict[en.id]; if (!e) return "";
    var vs = versesWith(kind, en.id), r = guideRoute(), gi = kind === "l" ? r.indexOf(en.id) : -1;
    return '<div class="detail" data-detail="' + kind + '" data-id="' + en.id + '"><h3 class="detail-name">' + esc(e.name) + "</h3>" + (e.role ? '<div class="ent-role">' + esc(e.role) + "</div>" : "") +
      '<p class="detail-note">' + esc(e.note || "") + "</p>" +
      ((e.aliases || []).length ? '<div class="meta">다른 표기 · ' + esc(e.aliases.join(", ")) + "</div>" : "") +
      '<div class="meta">' + (vs.length ? "이 본문의 등장 절 " + vs.join(", ") : "이 본문에는 등장하지 않음") + (gi >= 0 ? " · 안내 경로 " + (gi + 1) + "/" + r.length : "") + "</div>" +
      '<div class="meta detail-hint">Esc 또는 같은 항목을 다시 눌러 닫기</div></div>';
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
    people: function () { return detailBlock("p") + '<p class="scope">' + scopeLabel() + "의 인물</p>" + entityCards("p", scopedEntities("p"), D.people); },
    places: function () { return detailBlock("l") + '<p class="scope">' + scopeLabel() + "의 장소</p>" + entityCards("l", relevantPlaceIds(), D.places); },
    map: function () {
      var m = mapModel();
      var note = m.bad.length ? '<p class="degraded" data-places="' + esc(m.badIds.join(",")) + '">지도에 표시할 수 없는 장소(좌표 오류): ' + esc(m.bad.join(", ")) + ". 장소 탭에서 텍스트로 확인할 수 있습니다.</p>" : "";
      return '<div class="map-wrap">' + mapSvg(m, "map", false) + "</div>" + note +
        '<p class="helper">좌표는 프로토타입용 개략값입니다. ' + (m.all.length ? "" : "이 본문에는 지도 장소가 없습니다.") + "</p>";
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
    if (d.guideStep) return '[data-guide-step="' + d.guideStep + '"]';
    if (d.id && el.closest("#map-body")) return '#map-body [data-kind="' + d.kind + '"][data-id="' + d.id + '"]';
    if (d.id && el.closest("#panel")) return '#panel [data-kind="' + d.kind + '"][data-id="' + d.id + '"]';
    if (el.id && el.id !== "search" && el.id !== "sw-query") return "#" + el.id;
    return null;
  }
  // ---------- 작업공간: 지도 창 · 분할선 · 안내 패널 ----------
  function renderMapPane() {
    var body = $("map-body"); if (!body) return;
    var html, cap = "";
    try {
      var m = mapModel(); cap = m.linked.length ? m.linked.length + "곳" : "";
      html = mapSvg(m, "smap", true) +
        (m.bad.length ? '<p class="degraded" data-places="' + esc(m.badIds.join(",")) + '">지도에 표시할 수 없는 장소(좌표 오류): ' + esc(m.bad.join(", ")) + ". 장소 탭에서 텍스트로 확인할 수 있습니다.</p>" : "") +
        (m.all.length ? '<p class="helper">좌표는 프로토타입용 개략값입니다. 핀을 누르면 왼쪽 상세와 오른쪽 안내가 함께 바뀝니다.</p>' : '<p class="empty helper">이 본문에는 지도에 표시할 장소가 없습니다.</p>');
    } catch (e) { html = '<div class="degraded" role="status">지도를 표시할 수 없습니다. 본문과 맥락 패널은 계속 사용할 수 있습니다.</div>'; }
    body.innerHTML = html; var c = $("mp-cap"); if (c) c.textContent = cap;
  }
  function renderGuide() {
    var g = $("guide-pane"); if (!g) return;
    var html;
    try {
      var P = D.passages[state.passage], c = D.context && D.context[state.passage], r = guideRoute(), cur = guideIndex();
      var steps = r.map(function (id, i) { return '<li><button type="button" class="g-step" data-guide-step="' + i + '"' + (i === cur ? ' aria-current="step"' : "") + '><span class="g-n">' + (i + 1) + "</span>" + esc(D.places[id].name) + "</button></li>"; }).join("");
      var pl = cur >= 0 ? D.places[r[cur]] : null, vs = cur >= 0 ? versesWith("l", r[cur]) : [];
      html = '<h2 class="g-title">안내</h2><p class="g-ref">' + esc(P.ref) + "</p>" +
        (c ? '<p class="g-theme g-full">' + esc(c.theme) + "</p>" : "") +
        (r.length ? '<div class="g-status" aria-live="polite">' + (cur >= 0 ? "장소 " + (cur + 1) + " / " + r.length + " · " + esc(pl.name) : "장소 경로 " + r.length + "곳 · 시작 전") + "</div>" : '<p class="empty helper g-status">이 본문에는 안내할 장소 경로가 없습니다.</p>') +
        '<div class="g-nav"><button type="button" class="btn" id="guide-prev" data-guide="-1"' + (!r.length || cur === 0 ? " disabled" : "") + '>‹ 이전</button><button type="button" class="btn primary" id="guide-next" data-guide="1"' + (!r.length || cur === r.length - 1 ? " disabled" : "") + ">다음 ›</button></div>" +
        (r.length ? '<ol class="g-steps g-full">' + steps + "</ol>" : "") +
        (pl ? '<div class="g-card g-full"><div class="ent-name">' + esc(pl.name) + '</div><p class="meta">' + esc(pl.note || "") + '</p><p class="meta">' + (vs.length ? "이 본문의 등장 절 " + vs.join(", ") : "") + "</p></div>" : "");
    } catch (e) { html = '<div class="degraded" role="status">안내를 표시할 수 없습니다.</div>'; }
    g.innerHTML = html;
  }
  function loadSplit() { try { var v = parseFloat(localStorage.getItem(SPLIT_KEY)); if (isFinite(v) && v >= 0.2 && v <= 0.6) ui.frac = v; } catch (e) {} }
  function clampFrac(f) {
    var st = $("stage"), W = st ? st.getBoundingClientRect().width - 10 : 0, lo = 0.2, hi = 0.6;
    if (W > 0) { lo = Math.max(lo, 180 / W); hi = Math.min(hi, 1 - 340 / W); if (hi < lo) hi = lo; }
    return Math.min(hi, Math.max(lo, f));
  }
  function applySplit() {
    var st = $("stage"), sp = $("split"); if (!st) return;
    var f = clampFrac(ui.frac); st.style.setProperty("--map-frac", String(f));
    if (sp) sp.setAttribute("aria-valuenow", String(Math.round(f * 100)));
  }
  // 분할선 조작은 본문 줄바꿈을 바꾸므로, 전후로 읽던 절(스크롤 앵커)을 고정한다.
  function setFrac(f, persist) {
    var pre = null; try { pre = computeAnchor(); } catch (e) {}
    ui.frac = Math.min(0.6, Math.max(0.2, f)); applySplit();
    if (pre) restoreAnchor(pre);
    if (persist) { try { localStorage.setItem(SPLIT_KEY, String(ui.frac)); } catch (e) {} }
  }
  function updateStageChrome() {
    var mob = isMobile(), open = !mob || ui.mapOpen; document.body.dataset.map = open ? "open" : "collapsed";
    var tg = $("map-toggle"); if (tg) { tg.hidden = !mob; tg.textContent = open ? "접기" : "펼치기"; tg.setAttribute("aria-expanded", String(open)); }
  }
  function bindSplit() {
    var sp = $("split"), st = $("stage"); if (!sp || !st) return;
    var drag = false, tick = false, lastX = 0;
    function fracAt(x) { var r = st.getBoundingClientRect(); return clampFrac((x - r.left - 5) / (r.width - 10)); }
    sp.addEventListener("pointerdown", function (ev) { if (ev.button != null && ev.button !== 0) return; drag = true; lastX = ev.clientX; try { sp.setPointerCapture(ev.pointerId); } catch (e) {} document.body.dataset.dragging = "split"; ev.preventDefault(); });
    sp.addEventListener("pointermove", function (ev) { if (!drag) return; lastX = ev.clientX; if (tick) return; tick = true; window.requestAnimationFrame(function () { tick = false; if (drag) setFrac(fracAt(lastX), false); }); });
    function end(ev) { if (!drag) return; drag = false; delete document.body.dataset.dragging; try { sp.releasePointerCapture(ev.pointerId); } catch (e) {} setFrac(fracAt(ev.clientX != null ? ev.clientX : lastX), true); }
    sp.addEventListener("pointerup", end); sp.addEventListener("pointercancel", function () { drag = false; delete document.body.dataset.dragging; });
    sp.addEventListener("dblclick", function () { setFrac(0.4, true); });
    sp.addEventListener("keydown", function (ev) {
      if (ev.key === "Home") { ev.preventDefault(); return setFrac(clampFrac(0.2), true); }
      if (ev.key === "End") { ev.preventDefault(); return setFrac(clampFrac(0.6), true); }
      if (ev.key === "Enter") { ev.preventDefault(); return setFrac(0.4, true); }
      var d = ev.key === "ArrowLeft" ? -0.02 : ev.key === "ArrowRight" ? 0.02 : 0;
      if (d) { ev.preventDefault(); setFrac(clampFrac(ui.frac + d), true); }
    });
  }
  var booting = false;
  var lastChrome = null;
  function render() {
    var key = focusKey(document.activeElement);
    var chromeKey = state.panel + "|" + state.sheet + "|" + isMobile(), reflow = lastChrome !== null && lastChrome !== chromeKey, hadPending = !!pendingScroll;
    var pre = null; try { pre = computeAnchor(); } catch (e) {}     // 화면이 바뀌기 전 앵커: (1) 패널/시트 reflow 후 복원, (2) history entry 를 떠날 때 저장
    if (mounted.passage) { if (pre) anchors[pre.passage] = pre; else delete anchors[mounted.passage]; }   // 본문을 떠나는 순간 동기적으로 기록(프레임/스크롤 이벤트에 의존하지 않음)
    try { updateContextChrome(); } catch (e) {}
    lastChrome = chromeKey;
    renderText();
    if (reflow && pre && !hadPending) restoreAnchor(pre);
    try { updateStageChrome(); renderMapPane(); renderGuide(); } catch (e) {}
    try { renderTabs(); renderPanel(); } catch (e) { var pn = $("panel"); if (pn) pn.innerHTML = '<div class="degraded" role="status">맥락 패널을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
    syncHash(booting || replaceNext, pre); replaceNext = false;
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
  // ---------- 검색 작업공간(전용 화면): 인라인 칩/드롭다운 대신 큰 결과 화면 ----------
  var swState = { open: false, kind: "all", testament: "all", limit: 30, q: "", prevFocus: null, y: 0 };
  function bookIndexOf(pid) { return BOOK_ORDER.indexOf(String(pid).split("-")[0]); }
  function search(q, o) {
    o = o || {};
    var nq = norm(q), out = [], kind = o.kind || "all", tst = o.testament || "all", limit = o.limit || 30;
    out.totalVerses = 0; out.totalEntities = 0;
    if (!nq) return out;
    var ref = parseReference(q);
    if (ref && ref.passage && kind === "all") out.push({ kind: "r", id: ref.passage + ":" + (ref.verse == null ? "" : ref.verse), label: ref.label + " 열기", sub: "", ref: ref });
    if (kind === "all" || kind === "entity") {
      [["p", D.people], ["l", D.places]].forEach(function (d) {
        Object.keys(d[1] || {}).forEach(function (id) {
          var e = d[1][id];
          if (norm(e.name + " " + (e.role || "") + " " + (e.aliases || []).join(" ")).indexOf(nq) >= 0) { out.totalEntities++; out.push({ kind: d[0], id: id, label: e.name, sub: d[0] === "p" ? "인물" : "장소", ent: e }); }
        });
      });
    }
    if (kind === "all" || kind === "verse") {
      var vi = verseIndex(), hits = [], total = 0;
      for (var i = 0; i < vi.length; i++) {
        if (vi[i].t.indexOf(nq) < 0) continue;
        if (tst !== "all") { var bi = bookIndexOf(vi[i].pid); if ((tst === "ot") !== (bi < 39)) continue; }
        total++; if (hits.length < limit) hits.push(vi[i]);
      }
      out.totalVerses = total;
      hits.forEach(function (h) { var P = D.passages[h.pid]; out.push({ kind: "v", id: h.pid + ":" + h.n, label: P.ref + " " + h.n + "절", sub: "구절", text: P.verses[h.n - 1].text }); });
    }
    return out;
  }
  // 검색어(정규화 기준) 위치를 원문 좌표로 되돌려 강조 범위를 만든다(NFD/대소문자/전각 차이 허용)
  function markRanges(text, q) {
    var toks = norm(q).split(" ").filter(Boolean); if (!toks.length) return [];
    var nstr = "", map = [];
    for (var i = 0; i < text.length; i++) {
      var nc = text[i].normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); if (/^\s+$/.test(nc)) nc = " ";
      for (var k = 0; k < nc.length; k++) { nstr += nc[k]; map.push(i); }
    }
    var rs = [];
    toks.forEach(function (t) { var pos = 0, ix; while ((ix = nstr.indexOf(t, pos)) >= 0) { rs.push([map[ix], map[ix + t.length - 1] + 1]); pos = ix + Math.max(1, t.length); } });
    rs.sort(function (x, y) { return x[0] - y[0]; });
    var merged = []; rs.forEach(function (r) { var l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([r[0], r[1]]); });
    return merged;
  }
  function markedHtml(text, ranges, from, to) {
    var out = "", pos = from;
    ranges.forEach(function (r) { var a = Math.max(r[0], from), b = Math.min(r[1], to); if (b <= a) return; out += esc(text.slice(pos, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; pos = b; });
    return out + esc(text.slice(pos, to));
  }
  function snippetHtml(text, q) {
    var rs = markRanges(text, q), from = 0, to = text.length;
    if (text.length > 170) { from = Math.max(0, (rs.length ? rs[0][0] : 0) - 55); to = Math.min(text.length, from + 170); if (from > 0) { var sp = text.indexOf(" ", from); if (sp >= 0 && sp < from + 12) from = sp + 1; } }
    return (from > 0 ? "…" : "") + markedHtml(text, rs, from, to) + (to < text.length ? "…" : "");
  }
  function rowHtml(x, q) {
    var ref, kind = x.sub, prev = "";
    if (x.kind === "v") { ref = markedHtml(x.label, markRanges(x.label, q), 0, x.label.length); prev = snippetHtml(x.text, q); }
    else if (x.kind === "r") { ref = esc(x.label); kind = "바로 이동"; var P = D.passages[x.ref.passage], v = P && P.verses[(x.ref.verse || 1) - 1]; prev = v ? esc(v.text.length > 170 ? v.text.slice(0, 170) + "…" : v.text) : ""; }
    else { ref = markedHtml(x.label, markRanges(x.label, q), 0, x.label.length); var e = x.ent || {}; prev = esc([e.role, e.note].filter(Boolean).join(" · ")); }
    return '<button type="button" class="sr-row" data-search="1" data-kind="' + x.kind + '" data-id="' + esc(x.id) + '"><span class="sr-ref">' + ref + '<span class="sr-kind">' + esc(kind) + '</span></span><span class="sr-preview">' + prev + "</span></button>";
  }
  function renderSearch() {
    var el = $("search-results"), sum = $("sw-summary"), more = $("sw-more"), q = swState.q, r, refErr = null;
    if (!el) return;
    if (!norm(q)) { el.innerHTML = '<p class="empty helper">인물·장소·본문을 검색하거나 성경 참조(예: 창 22:2, 요 3:16)를 입력하세요.</p>'; if (sum) sum.textContent = ""; if (more) more.hidden = true; return; }
    try { var pr = parseReference(q); refErr = pr && pr.error; r = search(q, { kind: swState.kind, testament: swState.testament, limit: swState.limit }); }
    catch (e) { el.innerHTML = '<p class="degraded">검색을 사용할 수 없습니다.</p>'; return; }
    var html = refErr ? '<p class="empty helper" data-ref-error="1">' + esc(refErr) + "</p>" : "";
    html += r.length ? r.map(function (x) { return rowHtml(x, q); }).join("") : (refErr ? "" : '<p class="empty helper">검색 결과 없음. 다른 표현이나 필터를 바꿔 보세요.</p>');
    el.innerHTML = html;
    if (sum) sum.textContent = "“" + q.trim() + "” — 인물·장소 " + r.totalEntities + "건 · 구절 " + r.totalVerses + "건" + (r.totalVerses > swState.limit ? " (" + swState.limit + "건 표시)" : "");
    if (more) more.hidden = !(r.totalVerses > swState.limit);
  }
  // 헤더는 항상 화면 위에 붙어 있다(sticky). 높이를 CSS 변수로 노출해 스크롤 앵커·본문 정렬·패널 위치가 같은 기준을 쓴다.
  function updateHeaderMetrics() {
    var h = document.querySelector("header.top"); if (!h) return;
    var hh = h.getBoundingClientRect().height;
    if (hh > 0) document.documentElement.style.setProperty("--hdr-h", hh + "px");
    document.body.dataset.stuck = String(window.scrollY > 2);
  }
  function syncSwFilters() {
    [].forEach.call(document.querySelectorAll("[data-swfilter]"), function (b) { var kv = b.dataset.swfilter.split(":"); b.setAttribute("aria-pressed", String(swState[kv[0]] === kv[1])); });
  }
  function openSearch(q) {
    var w = $("search-workspace"); if (!w) return;
    if (!swState.open) { swState.open = true; swState.y = window.scrollY; swState.prevFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : $("search"); swState.limit = 30; w.hidden = false; document.body.dataset.search = "open"; }
    swState.q = q; var sq = $("sw-query"); if (sq.value !== q) sq.value = q; syncSwFilters(); renderSearch();
    if (document.activeElement !== sq) { sq.focus(); try { sq.setSelectionRange(sq.value.length, sq.value.length); } catch (e) {} }
  }
  // navigated=true: 결과를 열어 이동한 경우(스크롤·포커스를 되돌리지 않음). false: 닫기만 → 이전 본문 상태 그대로 복귀
  function closeSearch(navigated) {
    if (!swState.open) return;
    swState.open = false; $("search-workspace").hidden = true; delete document.body.dataset.search;
    swState.q = ""; $("sw-query").value = ""; $("search").value = "";   // 검색어는 일회성: 남겨 두면 헤더 입력의 focus 이벤트가 검색 화면을 다시 열어 버린다
    if (!navigated) {
      if (Math.abs(window.scrollY - swState.y) > 1) window.scrollTo(0, swState.y);
      var pf = swState.prevFocus; if (pf && pf.focus && pf.isConnected) { try { pf.focus({ preventScroll: true }); } catch (e) { pf.focus(); } }
    }
    swState.prevFocus = null;
  }
  function openSearchResult(kind, id) {
    if (kind === "v") { var k = parseKey(id); go(k.passage, k.verse); closeSearch(true); return; }
    if (kind === "r") { var rk = id.split(":"); go(rk[0], rk[1] ? +rk[1] : null); closeSearch(true); return; }
    var pid = state.passage;
    if (!versesWith(kind, id).length) { pid = Object.keys(D.passages).filter(function (p) { return D.passages[p].verses.some(function (v) { return entitiesIn(v.text)[kind].indexOf(id) >= 0; }); })[0] || pid; }
    if (pid !== state.passage) go(pid);
    if (!(state.entity && state.entity.kind === kind && state.entity.id === id)) selectEntity(kind, id);
    closeSearch(true);
  }

  // ---------- events ----------
  function fire(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (t.closest("#sw-close") || t.closest("[data-sw-close]")) return closeSearch(false);
    if (t.closest("#search-open")) return openSearch($("search").value || "");
    if ((el = t.closest("[data-swfilter]"))) { var kv = el.dataset.swfilter.split(":"); swState[kv[0]] = kv[1]; swState.limit = 30; syncSwFilters(); return renderSearch(); }
    if (t.closest("#sw-more")) { swState.limit += 30; return renderSearch(); }
    if (t.closest("#panel-toggle")) return toggleContext();
    if (t.closest("#panel-open")) return setPanel("open");
    if (t.closest("#map-toggle")) { ui.mapOpen = !ui.mapOpen; return updateStageChrome(); }
    if ((el = t.closest("[data-guide]"))) return guideStep(+el.dataset.guide);
    if ((el = t.closest("[data-guide-step]"))) return guideGo(+el.dataset.guideStep);
    if ((el = t.closest("[data-search]"))) return openSearchResult(el.dataset.kind, el.dataset.id);
    if ((el = t.closest("[data-step]"))) { var np = stepPassage(state.passage, +el.dataset.step); return np ? go(np) : undefined; }
    if ((el = t.closest(".tag"))) { e.stopPropagation(); return selectEntity(el.dataset.kind, el.dataset.id); }
    if ((el = t.closest("[data-verse]"))) return selectVerse(+el.dataset.verse);
    if ((el = t.closest("[data-tab]"))) return setTab(el.dataset.tab);
    if ((el = t.closest("[data-preview]"))) { e.preventDefault(); state.preview = el.dataset.preview; ensureContextVisible(); return render(); }
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
    if (t.id === "ref-input" && e.key === "Escape") { e.preventDefault(); t.blur(); syncRefInput(); showRefError(""); return; }
    if (swState.open) {
      if (e.key === "Escape") { e.preventDefault(); closeSearch(false); return; }
      if (e.key === "Enter" && t.id === "sw-query") { var first = $("search-results").querySelector("[data-search]"); if (first) { e.preventDefault(); first.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); } return; }
      if (e.key === "Tab") {
        var fs = [].filter.call($("search-workspace").querySelectorAll("button, input, [href], [tabindex]"), function (n) { return !n.disabled && !n.hidden && n.tabIndex >= 0 && n.offsetParent !== null; });
        if (fs.length) { var first0 = fs[0], last0 = fs[fs.length - 1]; if (e.shiftKey && document.activeElement === first0) { e.preventDefault(); last0.focus(); } else if (!e.shiftKey && document.activeElement === last0) { e.preventDefault(); first0.focus(); } }
        return;
      }
    }
    if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openSearch($("search").value || ""); return; }
    if (e.key === "Escape") { if (state.entity) { e.preventDefault(); var en = state.entity; closeEntity(); returnFocusToText(en); } else if (state.preview) { state.preview = null; render(); } return; }
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (t.closest && t.closest("#tabs") && /^(ArrowRight|ArrowLeft|ArrowDown|ArrowUp|Home|End)$/.test(e.key)) {
      e.preventDefault();
      var i = TABS.map(function (x) { return x[0]; }).indexOf(state.tab), n = TABS.length;
      i = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : n - 1)) % n;
      var next = TABS[i][0]; setTab(next); var b = document.querySelector('[data-tab="' + next + '"]'); if (b) b.focus(); return;
    }
    if ((e.key === "Enter" || e.key === " ") && tag !== "BUTTON" && tag !== "A" && t.getAttribute && t.getAttribute("tabindex") !== null) { e.preventDefault(); fire(t); }
  });
  $("search").addEventListener("input", function (e) { var v = e.target.value; if (norm(v)) openSearch(v); else { swState.q = ""; if (swState.open) closeSearch(false); } });
  $("search").addEventListener("focus", function () { if (norm(this.value) && !swState.open) openSearch(this.value); });
  $("search").addEventListener("click", function () { if (norm(this.value) && !swState.open) openSearch(this.value); });
  $("sw-query").addEventListener("input", function (e) { var v = e.target.value; $("search").value = v; swState.q = v; swState.limit = 30; renderSearch(); });
  $("search-workspace").querySelector(".sw-backdrop").addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
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
  try { history.scrollRestoration = "manual"; } catch (e) {}
  updateHeaderMetrics();
  window.addEventListener("resize", function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); });   // 뷰포트 전환 시 패널/시트 모드 갱신(media query change 이벤트에만 의존하지 않음)
  window.addEventListener("beforeunload", function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} });   // 새로고침 직전의 읽던 자리(스크롤 이벤트에 의존하지 않음)
  if (h) { state.passage = h.passage; state.verse = h.verse; state.tab = h.tab; state.entity = h.entity; if (h.panel) state.panel = h.panel; if (h.sheet) state.sheet = h.sheet; if (h.verse != null) pendingScroll = { mode: "verse" }; }
  (function () { var hs = history.state; if (hs && hs.bvcAnchor && hs.bvcAnchor.passage === state.passage) pendingScroll = { mode: state.verse != null ? "verse" : "top", anchor: hs.bvcAnchor }; })();
  try { var mq = window.matchMedia("(max-width: 760px)"), onMq = function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); }; if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq); } catch (e) {}
  loadSplit(); bindSplit(); applySplit();
  if (state.entity && state.entity.kind === "l" && isMobile()) ui.mapOpen = true;   // 장소가 선택된 채로 열리면 지도도 함께 보여 준다
  booting = true; render(); booting = false;
  window.BVC = { ui: ui, guideStep: guideStep, guideGo: guideGo, guideRoute: guideRoute, guideIndex: guideIndex, setFrac: setFrac, anchors: anchors, openSearch: openSearch, closeSearch: closeSearch, searchState: swState, markRanges: markRanges, setPanel: setPanel, setSheet: setSheet, toggleContext: toggleContext, isMobile: isMobile, entryAnchors: entryAnchors, openReference: openReference, scrollAnchor: computeAnchor, remount: function () { mounted.force = true; render(); }, variantFor: variantFor, krv: KRV, stepPassage: stepPassage, parseReference: parseReference, render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
