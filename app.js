(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  // Guide 는 placeLinks 가 아니라 GuideTopic/GuideStep fixture layer(data/guide.fixture.js, FIXTURE_SAMPLE · NON_AUTHORITATIVE)를 읽는다.
  var G = window.BVC_GUIDE_FIXTURE || { meta: {}, topics: [], steps: [], routes: {} };
  // ---- 승인 연구 투영: Person/Place를 같은 방식으로 compatibility fixture에 record-level 적용한다. ----
  var PJ = window.BVC_PROJECTION || null, ALIAS_STABLE = {}, STABLE_ALIAS = {};
  function projectionGroups() {
    return [
      { kind: "p", type: "Person", records: PJ && (PJ.persons || PJ.people) || {}, dict: D.people },
      { kind: "l", type: "Place", records: PJ && PJ.places || {}, dict: D.places }
    ];
  }
  function attachProjection(g, sid, r) {
    if (!g.dict || !r || r.stable_id !== sid || String(r.type || "").toLowerCase() !== g.type.toLowerCase() || !r.display_label || !r.status || !r.authority || !r.source_refs || g.kind === "l" && r.coordinates && !(r.spatial && r.spatial.primary && r.spatial.primary.marker && r.spatial.primary.marker.render === true)) return null;
    var wanted = r.legacy_key || sid, old = g.dict[wanted], key = wanted;
    // 이름이나 legacy key 충돌은 병합 근거가 아니다. 별도 stable_id를 내부 key로 보존한다.
    if (old && old.stable_id && old.stable_id !== sid) key = sid;
    if (g.dict[key] && g.dict[key].stable_id && g.dict[key].stable_id !== sid) return null;
    var e = { id: sid, stable_id: sid, legacy_key: r.legacy_key || null, type: r.type, label: r.display_label, name: r.display_label, aliases: (r.aliases || []).slice(), note: r.reader && (r.reader.headline || r.reader.concise_summary) || "", status: r.status, authority: r.authority, research: r };
    if (g.kind === "p") { e.role = r.role || r.reader && r.reader.role || ""; e.period = r.period || r.chronology && r.chronology.period || ""; }
    else { var geoPrimary = !!(r.coordinates && r.spatial && r.spatial.primary.marker.render === true); e.position_status = geoPrimary ? "VERIFIED_GEO_COORDINATE" : "NO_EXACT_POINT"; e.location_state = geoPrimary ? "geo_only" : "unlocated"; e.photos = []; }
    g.dict[key] = e; ALIAS_STABLE[key] = sid; STABLE_ALIAS[sid] = key; return key;
  }
  (function applyProjection() {
    try {
      projectionGroups().forEach(function (g) { Object.keys(g.records).forEach(function (sid) { attachProjection(g, sid, g.records[sid]); }); });
    } catch (e) {}
  })();
  function resolveKey(id) { return STABLE_ALIAS[id] || id; }
  // ---- Scripture Entity Index(파이프라인 산출물) + 공유 store ----
  // 인덱스는 투영과 같은 원본 해시를 가질 때만 쓴다. 절 텍스트에서 표면형 위치가 다르면(KRV 변경 등) 해당 항목을 무시한다.
  var SEI = window.BVC_SCRIPTURE_INDEX || null;
  // 인덱스 항목은 그 기록의 원본 해시가 투영과 같을 때만 쓴다(기록별로 판단: 한 기록이 어긋나도 다른 기록은 영향받지 않는다).
  function seiRecordOk(sid) {
    var m = SEI && SEI.meta && SEI.meta.records && SEI.meta.records.filter(function (x) { return x.record === sid; })[0], r = PJ && PJ.places && PJ.places[sid];
    return !!(m && STABLE_ALIAS[sid] && r && r.source_refs && r.source_refs[0].sha256 === m.source_sha256);
  }
  var SEI_OK = !!(SEI && SEI.meta && SEI.entries && SEI.meta.records && SEI.meta.records.some(function (x) { return seiRecordOk(x.record); }));
  function passageRefOf(x) {
    if (!x) return null;
    if (typeof x === "string") { var sm = /^([a-z0-9]+)-(\d+)(?::(\d+))?/.exec(x); return sm ? { book: sm[1], chapter: +sm[2], verse: sm[3] ? +sm[3] : null, key: sm[1] + "-" + sm[2] + ":" + (sm[3] || "") } : null; }
    if (!x.book || !x.chapter) return null;
    return { book: x.book, chapter: +x.chapter, verse: x.v1 == null ? null : +x.v1, verse_end: x.v2 == null ? null : +x.v2, key: x.book + "-" + x.chapter + ":" + (x.v1 || "") + (x.v2 && x.v2 !== x.v1 ? "-" + x.v2 : "") };
  }
  function recordPassages(r, sid) {
    var out = [], seen = {}; function add(x) { var p = passageRefOf(x); if (p && !seen[p.key]) { seen[p.key] = true; out.push(p); } }
    (r && r.passage_links || []).forEach(add); (r && r.passage_refs || []).forEach(add); (r && r.navigation && r.navigation.passage_refs || []).forEach(add);
    if (!out.length && SEI && SEI.entries && seiRecordOk(sid)) Object.keys(SEI.entries).forEach(function (k) { if ((SEI.entries[k] || []).some(function (e) { return e.stable_id === sid; })) add(k); });
    return out;
  }
  function explicitLabel(v) { return typeof v === "string" || typeof v === "number" ? String(v) : v && (v.display_label || v.label || v.canonical || v.name) || null; }
  function normalizedProjection(g, sid, r) {
    var key = STABLE_ALIAS[sid] || attachProjection(g, sid, r), rep = null, media = r.media || [];
    if (r.representative_media_id) rep = media.filter(function (m) { return m.id === r.representative_media_id; })[0] || null;
    return { stable_id: sid, compatibility_key: key, entity_type: g.type, kind: g.kind, display_label: r.display_label, aliases: (r.aliases || []).slice(), short_summary: r.reader && (r.reader.headline || r.reader.concise_summary) || null, passage_refs: recordPassages(r, sid), representative_media: rep, role: g.kind === "p" ? explicitLabel(r.role || r.reader && r.reader.role) : null, period: explicitLabel(r.period || r.chronology && r.chronology.period || r.navigation && r.navigation.period), period_sort_value: r.period_sort_value || r.chronology && r.chronology.sort_value || null, region: explicitLabel(r.region), reader_location_status: g.kind === "l" && r.location ? r.location.reader_status || null : null, related_events: (r.connected && r.connected.events || r.events || []).slice(), status: r.status, provenance: { origin: "projection" }, raw: r };
  }
  function normalizedFixture(kind, id, e) {
    return { stable_id: e.stable_id || id, compatibility_key: id, entity_type: kind === "p" ? "Person" : "Place", kind: kind, display_label: e.name || e.label, aliases: (e.aliases || []).slice(), short_summary: e.note || null, passage_refs: [], representative_media: null, role: kind === "p" ? e.role || null : null, period: e.period || null, period_sort_value: e.period_sort_value || null, region: e.region || null, reader_location_status: null, related_events: (e.related_events || []).slice(), status: e.status || "FIXTURE_SAMPLE", provenance: { origin: "compatibility_fixture" }, raw: e };
  }
  function listEntities(o) {
    o = o || {}; var out = [], seen = {};
    projectionGroups().forEach(function (g) { Object.keys(g.records).forEach(function (sid) { var n = normalizedProjection(g, sid, g.records[sid]); if (n.compatibility_key && !seen[sid]) { seen[sid] = true; out.push(n); } }); });
    [["p", D.people], ["l", D.places]].forEach(function (g) { Object.keys(g[1] || {}).forEach(function (id) { var n = normalizedFixture(g[0], id, g[1][id]); if (!seen[n.stable_id]) { seen[n.stable_id] = true; out.push(n); } }); });
    if (o.type && o.type !== "all") out = out.filter(function (e) { return e.entity_type.toLowerCase() === o.type; });
    return out;
  }
  function getEntity(sid) { return listEntities().filter(function (e) { return e.stable_id === sid; })[0] || null; }
  var STORE = {
    resolveKey: resolveKey,
    resolveCompatibilityKey: function (sid) { var e = getEntity(sid); return e && e.compatibility_key || null; },
    stableId: function (kind, id) { return stableOf(kind, id); },
    get: getEntity,
    entity: getEntity,
    list: listEntities,
    indexOk: function () { return SEI_OK; },
    provenance: function () { return { records: (SEI && SEI.meta && SEI.meta.records || []).map(function (x) { return { record: x.record, source_sha256: x.source_sha256, index_ok: seiRecordOk(x.record) }; }), index_ok: SEI_OK, projection_sources: (PJ && PJ.meta && PJ.meta.records || []).map(function (x) { return { stable_id: x.stable_id, source: x.source }; }) }; },
    indexAt: function (pid, n, text) {   // 이 절에 연결된 연구 Place 들(검증된 span 만)
      var ents = SEI_OK && SEI.entries[pid + ":" + n], out = []; if (!ents) return out;
      ents.forEach(function (e) {
        var key = STABLE_ALIAS[e.stable_id]; if (!key || !D.places || !D.places[key] || !seiRecordOk(e.stable_id)) return;
        var spans = (e.spans || []).filter(function (sp) { return String(text).slice(sp[0], sp[1]) === e.surface; });
        if (spans.length) out.push({ kind: "l", id: key, stable_id: e.stable_id, spans: spans });
      });
      return out;
    }
  };
  function stableOf(kind, id) { var d = kind === "l" ? D.places : D.people, r = d && d[id]; return (r && r.stable_id) || id; }
  var TABS = [["context", "문맥"], ["people", "인물"], ["places", "장소"],
              ["photos", "사진"], ["crossref", "관련 본문"], ["resources", "외부 자료"], ["notes", "내 메모"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체", preview: null, prevTab: null, panel: "collapsed", sheet: "half", view: "study" };   // Lock v1.1: 왼쪽 Detail 기본 CLOSED, 관점 기본 본문연구
  var ui = { refTarget: null, mapMode: null, gcam: null, tiles: false, navExplore: false, ovOpen: {}, frac: 0.4, mapOpen: false, cam: { x: 50, y: 50, k: 1 }, layers: { route: true, place: true }, guideStep: null };   // cam/layers: 지도 카메라·레이어(메모리 전용, URL 미포함)   // 작업공간 표시 설정(URL 에 넣지 않는 개인 레이아웃 값)
  var SPLIT_KEY = "bvc.split.v1";
  var $ = function (id) { return document.getElementById(id); };
  var wa = function (name) { var c = String(name).charCodeAt(String(name).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 !== 0 ? "과" : "와"; };   // 와/과 (받침에 따라)
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
  // 한 절의 Entity: 어휘 인식(featured 본문) + Scripture Entity Index(승인 연구 PassageLink 의 직접 언급 절)
  function entitiesAt(pid, n, text) {
    var out = annotated(pid) ? entitiesIn(text) : { p: [], l: [] };
    STORE.indexAt(pid, n, text).forEach(function (e) { if (out.l.indexOf(e.id) < 0) out.l.push(e.id); });
    return out;
  }
  function verseEntities(pid, v) { return entitiesAt(pid, v.n, v.text); }
  function currentVerses() { var v = D.passages[state.passage].verses; return state.verse == null ? v : v.filter(function (x) { return x.n === state.verse; }); }
  function scopedEntities(kind) {
    var ids = [];
    currentVerses().forEach(function (v) { verseEntities(state.passage, v)[kind].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    return ids;
  }
  function versesWith(kind, id) {
    var pid = state.passage;
    return D.passages[pid].verses.filter(function (v) { return entitiesAt(pid, v.n, v.text)[kind].indexOf(id) >= 0; }).map(function (v) { return v.n; });
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
    if (state.panel !== "collapsed") h += "&panel=" + state.panel;   // 왼쪽 Detail 상태(기본 collapsed 는 생략)
    if (state.view !== "study") h += "&view=" + state.view;         // 관점(기본 본문연구는 생략)
    if (state.sheet !== "half") h += "&sheet=" + state.sheet;     // 모바일 맥락 시트 상태(기본 half 는 생략)
    return h;
  }
  function parseHash(hash) {
    var parts = String(hash || "").replace(/^#/, "").split("&"), m = /^([a-z0-9]+-\d+)(?::(\d+))?$/.exec(parts[0]);
    if (!m) return null;
    var r = { passage: m[1], verse: m[2] ? +m[2] : null, tab: "context", entity: null };
    for (var i = 1; i < parts.length; i++) {
      var kv = /^(tab|e|panel|sheet|view)=([\w.\-]+)$/.exec(parts[i]); if (!kv) return null;
      if (kv[1] === "panel") { if (kv[2] !== "open" && kv[2] !== "collapsed") return null; r.panel = kv[2]; }
      else if (kv[1] === "view") { if (["study", "map", "timeline"].indexOf(kv[2]) < 0) return null; r.view = kv[2]; }
      else if (kv[1] === "sheet") { if (["peek", "half", "full"].indexOf(kv[2]) < 0) return null; r.sheet = kv[2]; }
      else if (kv[1] === "tab") r.tab = kv[2]; else { var e = kv[2].split("."); if (e.length !== 2) return null; r.entity = { kind: e[0], id: resolveKey(e[1]) }; }
    }
    if (r.tab === "map") r.tab = "context";   // 지도 탭은 제거됨(옛 링크 호환)
    if (!D.passages[r.passage] || (r.verse != null && !hasVerse(r.passage, r.verse)) || !tabValid(r.tab) || (r.entity && !entityValid(r.entity))) return null;
    return r;
  }
  // history entry 마다 "떠날 때의 스크롤 앵커"를 남겨 back/forward 가 본문 읽던 자리까지 복원하게 한다.
  var entryAnchors = {}, replaceNext = false, currentFrag = "";
  function entryKey(frag) { return String(frag || "").replace(/^#/, "").replace(/&(panel|sheet|view)=[^&]*/g, ""); }
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
  function go(passage, verse, keepEntity, keepContext) {
    verse = verse == null ? null : verse; ui.refTarget = null;
    if (!D.passages[passage] || (verse != null && !hasVerse(passage, verse))) { showRefError("유효하지 않은 참조: " + passage + (verse != null ? ":" + verse : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    state.passage = passage; state.verse = verse; state.entity = keepEntity ? state.entity : null; state.preview = null; state.prevTab = null; state.view = "study";
    if (!keepContext) { ui.cam = { x: 50, y: 50, k: 1 }; ui.guideStep = null; ui.navExplore = false; ui.gcam = null; ui.layers = { route: true, place: true }; }   // 관련 본문 이동(keepContext)은 지도 카메라·레이어·네비게이션 상태를 그대로 둔다
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
  // ---- Detail 문맥 모델(잠금): ENTITY_DETAIL(인물·장소·사건·경로) 과 PASSAGE_DETAIL(절·본문·문단) 은 서로 다른 주제다 ----
  var DETAIL_MODEL = { ENTITY: ["Person", "Place", "Event", "Route"], PASSAGE: ["Verse", "Passage", "Pericope"] };
  function detailContext() {
    var en = state.entity;
    if (en) return { kind: "ENTITY", subject: en.kind === "p" ? "Person" : "Place", id: en.id, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
    return { kind: "PASSAGE", subject: state.verse != null ? "Verse" : "Passage", passage: state.passage, verse: state.verse, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
  }
  // 전환 규칙: Entity Detail 의 관련 본문 클릭 → 대상은 Scripture, Detail 문맥 변화 없음(선택 대상·Entity Detail·지도·네비게이션·히스토리 유지, 절 선택 없음).
  // Passage Detail 은 본문 자체의 상세 진입을 사용자가 명시적으로 고른 때만(절 선택, "본문 개요" 복귀) 열린다.
  // 관련 본문(Detail 의 본문 버튼)을 누르면: 본문을 그 위치로 옮기고, 본문 영역을 활성화·전면으로 가져와 읽기 위치로 스크롤하고 강조한다. 두 번째 클릭은 필요 없다.
  function openRelatedPassage(pid, n) {
    n = n || null;
    if (!D.passages[pid] || (n != null && !hasVerse(pid, n))) { showRefError("유효하지 않은 참조: " + pid + (n != null ? ":" + n : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    var ctxBefore = state.entity ? state.entity.kind + "." + state.entity.id : null, sheetChanged = false;
    if (isMobile() && state.sheet === "full") { state.sheet = "half"; sheetChanged = true; }   // Detail 은 열어 둔 채 본문이 보이도록 줄인다
    if (pid !== state.passage) { if (!go(pid, null, true, true)) return false; }
    else { var viewChanged = state.view !== "study"; state.view = "study"; if (viewChanged || sheetChanged) render(); }
    ui.refTarget = { passage: pid, verse: n };   // 강조·스크롤용 일시 표식(절 선택이 아니며 URL 에 들어가지 않는다)
    updateTextState(); activateScripture(pid, n);
    return true;
  }
  function activateScripture(pid, n) {
    var tp = $("text-pane"); if (tp) { try { tp.inert = false; } catch (e) {} tp.setAttribute("aria-hidden", "false"); }
    var els = document.querySelectorAll("#verses .verse"), el = n != null ? document.querySelector('#verses [data-verse="' + n + '"]') : els[0]; if (!el) return;
    var hb = document.querySelector("header.top"), inset = hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0;
    try { el.scrollIntoView({ block: "start" }); } catch (e) { el.scrollIntoView(); }
    window.scrollBy(0, el.getBoundingClientRect().top - (inset + 16));   // 고정 헤더 바로 아래 읽기 위치(모바일 시트 위쪽 영역)
    el.setAttribute("tabindex", "-1"); try { el.focus({ preventScroll: true }); } catch (e) {}
  }
  function selectVerse(n) { ui.refTarget = null; state.verse = state.verse === n ? null : n; state.entity = null; state.prevTab = null; state.preview = null; render(); }
  function selectEntity(kind, id) {
    id = resolveKey(id);
    var same = state.entity && state.entity.kind === kind && state.entity.id === id;
    if (same) { closeEntity(); return; }
    if (!state.entity) state.prevTab = state.tab;
    state.entity = { kind: kind, id: id };
    state.tab = kind === "p" ? "people" : "places";
    if (kind === "l") focusPlace(id);
    if (kind === "l" && isMobile()) ui.mapOpen = true;
    ensureContextVisible();
    render();
  }
  function selectEntityStable(sid) {
    var e = STORE.get(sid), id = e && e.compatibility_key; if (!e || !id) return false;
    var same = state.entity && state.entity.kind === e.kind && state.entity.id === id;
    if (!same) selectEntity(e.kind, id); else { ensureContextVisible(); render(); }
    return true;
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
  function setTab(t) { if (!tabValid(t)) return; state.tab = t; ui.ovOpen[t] = true; state.preview = null; ensureContextVisible(); render(); }
  // ---- 맥락 패널(데스크톱) / 맥락 시트(모바일) 상태 ----
  function isMobile() { try { return window.matchMedia("(max-width: 760px)").matches; } catch (e) { return false; } }
  function ensureContextVisible() { if (state.panel === "collapsed") state.panel = "open"; if (state.sheet === "peek") state.sheet = "half"; }
  function setPanel(v) { if (v !== "open" && v !== "collapsed") return false; state.panel = v; replaceNext = true; render(); return true; }
  function setSheet(v) { if (["peek", "half", "full"].indexOf(v) < 0) return false; state.sheet = v; replaceNext = true; render(); return true; }
  function cycleSheet() { return setSheet({ half: "full", full: "peek", peek: "half" }[state.sheet]); }
  function toggleContext() { return isMobile() ? cycleSheet() : setPanel(state.panel === "open" ? "collapsed" : "open"); }
  function updateContextChrome() {
    var b = document.body, mob = isMobile();
    b.dataset.panel = state.panel; b.dataset.sheet = state.sheet; b.dataset.detailContext = state.entity ? "entity" : "passage";
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
    var chromeOnly = entryKey(location.hash) === entryKey("#" + serialize());   // 작업 상태(본문·절·도구·대상)가 같고 화면 상태만 다른가
    try { entryAnchors[entryKey(currentFrag)] = computeAnchor(); } catch (e) {}     // back/forward 로 "떠나는" entry 의 앵커도 남긴다
    var ea = entryAnchors[entryKey(location.hash)] || (history.state && history.state.bvcAnchor) || null;
    if (r.passage !== state.passage || r.verse !== state.verse || ea) pendingScroll = { mode: r.verse != null ? "verse" : "top", anchor: ea && ea.passage === r.passage ? ea : null };
    state.passage = r.passage; state.verse = r.verse; state.tab = r.tab; state.entity = r.entity; state.preview = null; state.prevTab = null;
    // 패널·시트·관점은 사용자의 화면 상태다: 다른 작업 상태로 history 이동할 때는 덮어쓰지 않고(사용자가 닫아 둔 Detail 을 되살리지 않는다), URL 이 화면 상태만 바꾼 경우에만 반영한다.
    if (chromeOnly) { if (r.panel) state.panel = r.panel; if (r.sheet) state.sheet = r.sheet; if (r.view) state.view = r.view; }
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
        out += esc(text.slice(last, m.index)) + '<span class="tag ' + e.kind + '" tabindex="0" role="button" data-kind="' + e.kind + '" data-id="' + e.id + '" data-stable-id="' + esc(stableOf(e.kind, e.id)) + '">' + esc(m[0]) + "</span>";
        last = m.index + m[0].length;
      }
      html = out + esc(text.slice(last));
    } else {
      var ix = STORE.indexAt(state.passage, v.n, text), marks = [];
      ix.forEach(function (e) { e.spans.forEach(function (sp) { marks.push({ a: sp[0], b: sp[1], e: e }); }); });
      if (marks.length) {
        marks.sort(function (x, y) { return x.a - y.a; }); var o2 = "", l2 = 0;
        marks.forEach(function (mk) { if (mk.a < l2) return; o2 += esc(text.slice(l2, mk.a)) + '<span class="tag l" tabindex="0" role="button" data-kind="l" data-id="' + mk.e.id + '" data-stable-id="' + esc(mk.e.stable_id) + '" data-source="scripture-index">' + esc(text.slice(mk.a, mk.b)) + "</span>"; l2 = mk.b; });
        html = o2 + esc(text.slice(l2));
      } else html = esc(text);
    }
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
      var rt = ui.refTarget && ui.refTarget.passage === state.passage ? ui.refTarget : null; el.classList.toggle("ref-target", !!rt && rt.verse === n);
      var btn = el.firstChild; if (btn && btn.setAttribute) btn.setAttribute("aria-pressed", String(state.verse === n));
    });
    var ttl = $("passage-title"); if (ttl) ttl.classList.toggle("ref-target-passage", !!ui.refTarget && ui.refTarget.passage === state.passage && ui.refTarget.verse == null);
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
  function scopeLabel() { return state.verse == null ? "본문 전체" : state.verse + "절"; }
  function entityCards(kind, ids, dict) {
    if (!ids.length) return '<p class="empty helper">' + scopeLabel() + "에 해당 항목 없음.</p>";
    return ids.map(function (id) {
      var e = dict[id]; if (!e) return ""; var act = state.entity && state.entity.kind === kind && state.entity.id === id;
      return '<div class="item' + (act ? " active" : "") + '" tabindex="0" data-kind="' + kind + '" data-id="' + id + '" data-stable-id="' + esc(stableOf(kind, id)) + '"><h3 class="ent-name">' + esc(e.name) + "</h3>" +
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
    var all = placeIdsFor(state.passage), here = scopedEntities("l"), bad = [], badIds = [], unlocated = [];
    var linked = all.filter(function (id) { var p = D.places[id]; if (p && p.location_state === "geo_only") return false; if (p && p.location_state === "unlocated") { unlocated.push(id); return false; } if (p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null) return true; bad.push(p ? p.name : id); badIds.push(id); return false; });
    return { all: all, here: here, bad: bad, badIds: badIds, linked: linked, unlocated: unlocated };
  }
  // ---- 지도 카메라(pan/zoom): 메모리 전용 상태, viewBox 로만 표현 ----
  function camBox() { var k = ui.cam.k, half = 50 / k, cx = Math.min(100 - half, Math.max(half, ui.cam.x)), cy = Math.min(100 - half, Math.max(half, ui.cam.y)); return { x: cx - half, y: cy - half, w: 100 / k }; }
  function applyCam() { var sv = document.querySelector("#map-body svg.smap"); if (!sv) return; var b = camBox(); sv.setAttribute("viewBox", b.x + " " + b.y + " " + b.w + " " + b.w); }
  function setCam(x, y, k) { ui.cam.x = x; ui.cam.y = y; ui.cam.k = Math.min(6, Math.max(1, k)); applyCam(); }
  function zoomBy(f) { if (mapModeNow() === "geo") return gzoom(f); setCam(ui.cam.x, ui.cam.y, ui.cam.k * f); }
  function focusPlace(id) { var p = D.places[id]; if (p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null) setCam(p.x, p.y, Math.max(ui.cam.k, 1.8)); }
  function mapSvg(m, cls, numbered) {
    var st = cls === "smap", lay = ui.layers;
    var ar = st ? activeRoute() : null, rp = st ? (ar ? ar.place_ids : []).filter(function (id) { var p = D.places[id]; return p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null; }) : m.linked;
    var line = (!st || lay.route) && rp.length > 1 ? '<polyline points="' + rp.map(function (id) { return D.places[id].x + "," + D.places[id].y; }).join(" ") + '" class="map-route' + (st && activeStep() ? " on" : "") + '" fill="none"/>' : "";
    var pins = (!st || lay.place) ? m.linked.map(function (id, i) {
      var p = D.places[id], act = (state.entity && state.entity.kind === "l" && state.entity.id === id) || (!state.entity && state.verse != null && m.here.indexOf(id) >= 0);
      return '<g class="pin' + (p.position_status === "FIXTURE_POSITION" ? " fx" : "") + (act ? " active" : "") + '" tabindex="0" role="button" data-kind="l" data-id="' + id + '" data-stable-id="' + esc(stableOf("l", id)) + '" aria-label="' + esc(p.name) + '"><circle class="halo" cx="' + p.x + '" cy="' + p.y + '" r="5.5"/><circle class="dot" cx="' + p.x + '" cy="' + p.y + '" r="2.6"/><text x="' + (p.x + 5) + '" y="' + (p.y + 1.3) + '">' + (numbered && stepNumber(id) ? stepNumber(id) + ". " : "") + esc(p.name) + "</text></g>";
    }).join("") : "";
    var vb = "0 0 100 100", par = "";
    if (st) { var b = camBox(); vb = b.x + " " + b.y + " " + b.w + " " + b.w; par = ' preserveAspectRatio="' + "xMidYMid meet" + '"'; }
    return '<svg class="' + cls + '" viewBox="' + vb + '"' + par + ' role="img" aria-label="샘플 지도"><rect class="map-bg" x="-300" y="-300" width="700" height="700"/><path class="map-land" d="M-300 90 L0 90 Q30 70 55 60 T100 40 L400 40 V400 H-300Z"/>' + line + pins + "</svg>";
  }
  // ================= 지리 지도 기반(Geographic Map Foundation) =================
  // 실제 위도/경도를 Web Mercator(도 단위)로 투영해 그린다. 샘플(추상 SVG) 지도의 x/y 는 좌표가 아니므로 절대 변환하지 않는다:
  // 지리 지도에는 "승인 연구가 좌표를 명시한 표식"(candidate 등)만 올라가고, fixture 장소(모리아·하란)는 올라가지 않는다.
  var GEO = (function () {
    var R2D = 180 / Math.PI;
    function yOf(lat) { var p = lat / R2D; return -R2D * Math.log(Math.tan(Math.PI / 4 + p / 2)); }
    function latOf(y) { return (2 * Math.atan(Math.exp(-y / R2D)) - Math.PI / 2) * R2D; }
    return {
      valid: function (lat, lon) { return typeof lat === "number" && typeof lon === "number" && isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 85 && Math.abs(lon) <= 180; },
      project: function (lat, lon) { return { x: lon, y: yOf(lat) }; },
      unproject: function (x, y) { return { lat: latOf(y), lon: x }; },
      yOf: yOf, latOf: latOf,
      tile: function (lat, lon, z) { var n = Math.pow(2, z); return { z: z, x: Math.floor((lon + 180) / 360 * n), y: Math.floor((1 + yOf(lat) / 180) / 2 * n) }; },
      tileUrl: function (t) { return "https://tile.openstreetmap.org/" + t.z + "/" + t.x + "/" + t.y + ".png"; },
      niceStep: function (span) { var raw = span / 6, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / mag; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag; },
      km: function (lat) { return 111.32 * Math.cos(lat / R2D); }   // 경도 1도 = km (해당 위도)
    };
  })();
  // 위치 상태 계약: 내부 상태 → 독자 표현(Reader Language lock) → 표식 종류. HOLD·UNKNOWN·DISPUTED 는 점을 찍지 않는다.
  var LOC_LABEL = { VERIFIED: "확인된 위치", LIKELY: "유력한 위치", PLAUSIBLE: "가능성 있는 위치", VERIFY: "추정지", DISPUTED: "여러 후보지", UNKNOWN: "위치 미상", HOLD: null };
  var LOC_MARKER = { VERIFIED: "confirmed", LIKELY: "estimated", PLAUSIBLE: "estimated", VERIFY: "estimated", DISPUTED: null, UNKNOWN: null, HOLD: null };
  // c: { lat, lon, role: biblical_place|archaeological_candidate|modern_context, status }  → { render, style, reason }
  function markerSpec(c) {
    if (!c || !GEO.valid(c.lat, c.lon)) return { render: false, style: null, reason: "no_usable_coordinates" };
    if (c.role === "modern_context") return /^MODERN_CITY_REFERENCE$/.test(c.status || "") ? { render: true, style: "modern" } : { render: false, style: null, reason: "unrecognized_status" };
    if (c.role === "archaeological_candidate") return /^VERIFIED_ARCHAEOLOGICAL_SITE$/.test(c.status || "") ? { render: true, style: "site" } : { render: false, style: null, reason: "unrecognized_status" };   // 후보지는 성경 장소와 동일시하지 않는 별도 표식
    if (c.role === "biblical_place") { var st = LOC_MARKER[c.status]; return st ? { render: true, style: st } : { render: false, style: null, reason: "status_has_no_marker" }; }
    return { render: false, style: null, reason: "unknown_role" };
  }
  // <spatial-binding> Map ← research projection: every place that has a spatial read model is handled by the same code (no record-specific branch).
  // The app re-checks each marker with markerSpec (real coordinates + recognized status); a place without drawable coordinates simply has no marker.
  function spatialOf(k) { var p = D.places && D.places[k], R = p && p.research; return R && R.spatial ? R.spatial : null; }
  function geoMarkers() {
    var keys = placeIdsFor(state.passage).slice(); if (state.entity && state.entity.kind === "l" && keys.indexOf(state.entity.id) < 0) keys.push(state.entity.id);
    var out = [];
    keys.forEach(function (k) {
      var p = D.places && D.places[k], R = p && p.research, S = spatialOf(k); if (!S) return;
      var sel = !!(state.entity && state.entity.kind === "l" && state.entity.id === k);
      (S.sites || []).forEach(function (c, i) { var sp = markerSpec({ lat: c.lat, lon: c.lon, role: c.role, status: c.coordinate_status }); if (sp.render) out.push({ id: c.ref || R.stable_id + "#site" + (i + 1), place: k, place_name: p.name, style: sp.style, lat: c.lat, lon: c.lon, label: c.reader_label || c.label, active: sp.style === "site" && sel }); });
      var pc = S.primary && S.primary.coordinates; if (pc && S.primary.marker && S.primary.marker.render) { var pm = markerSpec({ lat: pc.lat, lon: pc.lon, role: "biblical_place", status: S.certainty && S.certainty.reader_location_status }); if (pm.render) out.push({ id: R.stable_id, place: k, place_name: p.name, style: pm.style, lat: pc.lat, lon: pc.lon, label: p.name, primary: true, active: sel }); }
    });
    return out;
  }
  function markerSelect(place) { var same = state.entity && state.entity.kind === "l" && state.entity.id === place; if (same) { ensureContextVisible(); render(); } else selectEntity("l", place); }
  function unlocatedNote(id) { var R = D.places[id] && D.places[id].research, st = R && R.location && R.location.reader_status; return D.places[id].name + (st === "DISPUTED" || !R ? " — 정확한 위치에 대해서는 여러 견해가 있어 지도에 점으로 표시하지 않습니다." : " — 정확한 위치가 확정되지 않아 지도에 점으로 표시하지 않습니다."); }
  // </spatial-binding>
  function geoAvailable() { try { return geoMarkers().length > 0; } catch (e) { return false; } }
  function mapModeNow() { return ui.mapMode === "geo" && geoAvailable() ? "geo" : "sample"; }
  function geoFit(mk) {
    var pts = mk.map(function (m) { return GEO.project(m.lat, m.lon); }), xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(0.16, Math.max(x1 - x0, y1 - y0) * 2.6) };
  }
  function geoCam() { return ui.gcam || geoFit(geoMarkers()); }
  function geoTiles(gc) {   // opt-in 현대 지도(래스터 타일). 기본은 꺼짐: 외부 로딩 없음.
    var z = Math.max(2, Math.min(17, Math.round(Math.log(360 / (gc.w * 0.45)) / Math.LN2))), n = Math.pow(2, z), left = gc.x - gc.w / 2, right = gc.x + gc.w / 2, top = gc.y - gc.w / 2, bot = gc.y + gc.w / 2;
    var tx0 = Math.floor((left + 180) / 360 * n), tx1 = Math.floor((right + 180) / 360 * n), ty0 = Math.floor((1 + top / 180) / 2 * n), ty1 = Math.floor((1 + bot / 180) / 2 * n), out = "";
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 36) return "";
    for (var tx = tx0; tx <= tx1; tx++) for (var ty = ty0; ty <= ty1; ty++) if (ty >= 0 && ty < n) out += '<image href="' + GEO.tileUrl({ z: z, x: ((tx % n) + n) % n, y: ty }) + '" x="' + (tx / n * 360 - 180) + '" y="' + (180 * (2 * ty / n - 1)) + '" width="' + (360 / n) + '" height="' + (360 / n) + '" preserveAspectRatio="none" referrerpolicy="strict-origin-when-cross-origin"/>';
    return '<g class="gm-tiles">' + out + "</g>";
  }
  function geoSvg() {
    var mk = geoMarkers(), gc = geoCam(), w = gc.w, L = gc.x - w / 2, Rr = gc.x + w / 2, T = gc.y - w / 2, B = gc.y + w / 2, step = GEO.niceStep(w), fs = w * 0.04, out = "", nf = function (v) { return Math.abs(v) >= 1 ? +v.toFixed(2) : +v.toFixed(3); };
    if (ui.tiles) out += geoTiles(gc);
    out += '<g class="gm-grid">';
    for (var lo = Math.ceil(L / step) * step; lo <= Rr; lo += step) out += '<line x1="' + lo + '" y1="' + T + '" x2="' + lo + '" y2="' + B + '"/><text x="' + (lo + fs * 0.25) + '" y="' + (T + fs * 1.2) + '" font-size="' + fs + '">' + nf(lo) + "°E</text>";
    var la0 = GEO.latOf(B), la1 = GEO.latOf(T);
    for (var la = Math.ceil(la0 / step) * step; la <= la1; la += step) { var yy = GEO.yOf(la); out += '<line x1="' + L + '" y1="' + yy + '" x2="' + Rr + '" y2="' + yy + '"/><text x="' + (L + fs * 0.3) + '" y="' + (yy - fs * 0.3) + '" font-size="' + fs + '">' + nf(la) + "°N</text>"; }
    out += "</g>";
    var r = w * 0.026;
    var order = mk.slice().sort(function (a, b) { return a.lon - b.lon; });   // 표식이 겹쳐 보이지 않도록 라벨을 좌우로 갈라 놓는다
    mk.forEach(function (m) {
      var p = GEO.project(m.lat, m.lon), lab = esc(m.label), left = order.length > 1 && order.indexOf(m) % 2 === 0;
      var shape = m.style === "site" ? '<circle class="gm-ring" r="' + r * 1.9 + '"/><rect class="gm-shape" x="' + -r + '" y="' + -r + '" width="' + r * 2 + '" height="' + r * 2 + '" transform="rotate(45)"/>' : m.style === "modern" ? '<circle class="gm-shape" r="' + r * 0.8 + '"/>' : m.style === "confirmed" ? '<circle class="gm-shape" r="' + r + '"/>' : '<circle class="gm-ring" r="' + r * 1.3 + '"/><circle class="gm-shape" r="' + r * 0.5 + '"/>';
      out += '<g class="gm gm-' + m.style + (m.active ? " active" : "") + '" data-marker="' + esc(m.id) + '" data-place="' + esc(m.place) + '" data-stable-id="' + esc(stableOf("l", m.place)) + '" data-lat="' + m.lat + '" data-lon="' + m.lon + '" transform="translate(' + p.x + " " + p.y + ')" role="button" tabindex="0" aria-label="' + lab + '">' + shape + '<text x="' + (left ? -r * 2.4 : r * 2.4) + '" y="' + fs * 0.35 + '" font-size="' + fs + '"' + (left ? ' text-anchor="end"' : "") + ">" + lab + "</text></g>";
    });
    var kmu = GEO.km(GEO.latOf(gc.y)), target = kmu * w * 0.22, niceKm = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].reduce(function (a, v) { return v <= target ? v : a; }, 0.1), len = niceKm / kmu, bx = L + w * 0.04, by = B - w * 0.05;
    out += '<g class="gm-scale"><line x1="' + bx + '" y1="' + by + '" x2="' + (bx + len) + '" y2="' + by + '"/><text x="' + bx + '" y="' + (by - fs * 0.4) + '" font-size="' + fs + '">' + (niceKm >= 1 ? niceKm : niceKm * 1000 + " m").toString().replace(/^(\d+)$/, "$1") + (niceKm >= 1 ? " km" : "") + "</text></g>";
    return '<svg class="gmap" viewBox="' + L + " " + T + " " + w + " " + w + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="지리 지도" data-projection="web-mercator" data-tiles="' + (ui.tiles ? "on" : "off") + '">' + out + "</svg>";
  }
  function geoLegend() {
    var mk = geoMarkers(), styles = {}; mk.forEach(function (m) { styles[m.style] = 1; });
    var names = mk.map(function (m) { return m.place_name; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", ");
    var items = (styles.site ? '<span class="lg lg-site"><i class="lg-mark lg-mk-site"></i>고고학 후보지</span>' : "") + (styles.modern ? '<span class="lg lg-modern"><i class="lg-mark lg-mk-modern"></i>현대 도시(참고)</span>' : "") + (styles.confirmed ? '<span class="lg"><i class="lg-mark lg-mk-confirmed"></i>확인된 위치</span>' : "") + (styles.estimated ? '<span class="lg"><i class="lg-mark lg-mk-estimated"></i>추정지</span>' : "");
    return '<div class="geo-legend" data-part="geo-legend">' + items + '<p>표시된 점은 ' + (styles.site || styles.modern ? "고고학 후보지와 현대 도시" : "위치 후보") + "이며, 성경의 " + esc(names) + "이(가) 정확히 그곳이라는 뜻은 아닙니다.</p>" + (ui.tiles ? '<p class="geo-attr">지도 © OpenStreetMap contributors</p>' : "") + "</div>";
  }
  function renderGeoOnly() { var sv = document.querySelector("#map-body svg.gmap"); if (sv) sv.outerHTML = geoSvg(); }
  function gzoom(f) { var gc = geoCam(); ui.gcam = { x: gc.x, y: gc.y, w: Math.max(0.002, Math.min(90, gc.w / f)) }; renderGeoOnly(); }
  function gfit() { ui.gcam = null; renderGeoOnly(); }
  function updateMapHead() {
    var b = $("map-mode"), t2 = $("map-tiles"), av = geoAvailable(), geo = mapModeNow() === "geo";
    if (b) { b.hidden = !av; b.textContent = geo ? "‹ 샘플 지도" : "지리 지도 ›"; b.setAttribute("aria-pressed", String(geo)); }
    if (t2) { t2.hidden = !geo; t2.setAttribute("aria-pressed", String(!!ui.tiles)); }
    document.body.dataset.mapview = geo ? "geo" : "sample";
  }
  // ---- Guide 모델: GuideTopic / GuideStep fixture 를 읽는다(placeLinks 미사용) ----
  function has(a, id) { return (a || []).indexOf(id) >= 0; }
  function guideTopicFor(pid) { return (G.topics || []).filter(function (t) { return has(t.passage_refs, pid); })[0] || null; }
  function guideStepsFor(pid) { var t = guideTopicFor(pid); return t ? (G.steps || []).filter(function (x) { return x.topic_id === t.id; }).sort(function (a, b) { return a.sequence - b.sequence; }) : []; }
  function guideTopic() { return guideTopicFor(state.passage); }
  function guideSteps() { return guideStepsFor(state.passage); }
  // 본문 하나에 대해 지도에 올릴 장소 = 단일 Entity 출처(D.places)의 id 만 사용: GuideStep.place_ids(단계 순) + 본문에 실제 출현하는 장소(어휘 인식).
  // 지도 핀·Guide·Detail·본문 태그가 같은 id 를 공유한다. 별도의 "지도용 장소 목록" 진실 출처는 없다.
  function placeIdsFor(pid) {
    var out = [], add = function (id) { if (D.places && D.places[id] && out.indexOf(id) < 0) out.push(id); };
    guideStepsFor(pid).forEach(function (st) { (st.place_ids || []).forEach(add); });
    if (D.passages[pid]) D.passages[pid].verses.forEach(function (v) { entitiesAt(pid, v.n, v.text).l.forEach(add); });
    return out;
  }
  // 호환 뷰(읽기 전용): 예전 D.placeLinks[passage] 형태를 요구하는 코드를 위해서만 존재. 앱 내부 기능은 읽지 않는다.
  D.placeLinks = new Proxy({}, {
    get: function (t, k) { return typeof k === "string" && D.passages[k] ? placeIdsFor(k) : undefined; },
    has: function (t, k) { return typeof k === "string" && !!D.passages[k]; },
    ownKeys: function () { return (D.featured || []).slice(); },
    getOwnPropertyDescriptor: function (t, k) { return (D.featured || []).indexOf(k) >= 0 ? { enumerable: true, configurable: true, writable: false, value: placeIdsFor(k) } : undefined; }
  });
  function stepEntity(st) {   // 단계에서 선택할 대상: 첫 장소, 없으면 첫 인물
    var pl = (st.place_ids || []).filter(function (id) { return D.places && D.places[id]; })[0];
    if (pl) return { kind: "l", id: pl };
    var pe = (st.person_ids || []).filter(function (id) { return D.people && D.people[id]; })[0];
    return pe ? { kind: "p", id: pe } : null;
  }
  function guideRoute() { var seen = [], out = []; guideSteps().forEach(function (st) { (st.place_ids || []).forEach(function (id) { if (D.places[id] && seen.indexOf(id) < 0) { seen.push(id); out.push(id); } }); }); return out; }
  function guideIndex() {
    var st = guideSteps(); if (!st.length || !state.entity) return -1;
    var en = state.entity, match = function (s) { var t = stepEntity(s); return t && t.kind === en.kind && t.id === en.id; };
    var i = st.findIndex(function (s) { return s.id === ui.guideStep && match(s); });
    return i >= 0 ? i : st.findIndex(match);
  }
  function activeStep() { var st = guideSteps(), i = guideIndex(); return i >= 0 ? st[i] : null; }
  function activeRoute() { var st = guideSteps(); if (!st.length) return null; var s = activeStep() || st[0]; return (s.route_id && G.routes && G.routes[s.route_id]) || null; }
  function stepNumber(placeId) { var st = guideSteps(), i = st.findIndex(function (s) { return has(s.place_ids, placeId); }); return i >= 0 ? i + 1 : 0; }
  function applyStepCamera(st) {
    var ct = st.camera_target || {};
    if (ct.place_id) { var p = D.places[ct.place_id]; if (p && isFinite(p.x) && isFinite(p.y) && p.x !== null && p.y !== null) setCam(p.x, p.y, ct.zoom || 1.8); }
    else if (isFinite(ct.x) && isFinite(ct.y)) setCam(ct.x, ct.y, ct.zoom || 1);
  }
  function guideGo(i) {
    var st = guideSteps(), s = st[i]; if (!s) return false;
    var t = stepEntity(s); if (!t) return false;
    var same = state.entity && state.entity.kind === t.kind && state.entity.id === t.id;
    if (same && ui.guideStep === s.id) return true;
    if (!state.entity) state.prevTab = state.tab;
    ui.guideStep = s.id; state.entity = t; state.tab = t.kind === "l" ? "places" : "people"; state.preview = null;
    applyStepCamera(s); ui.layers = { route: true, place: true }; var ls = s.layer_state || {}; Object.keys(ls).forEach(function (k) { ui.layers[k] = !!ls[k]; });   // 카메라·레이어를 단계 정의에서 읽는다
    if (isMobile()) ui.mapOpen = true;
    render(); return true;    // 네비게이션 이동은 닫혀 있는 상세 패널/시트를 강제로 열지 않는다(지도·본문·네비게이션만 동기화)
  }
  function guideStep(d) {
    var st = guideSteps(), cur = guideIndex(); if (!st.length) return false;
    var t = cur < 0 ? (d > 0 ? 0 : st.length - 1) : cur + d;
    return t >= 0 && t < st.length ? guideGo(t) : false;
  }
  // ---------- 왼쪽 Detail: 탭 없는 CONNECTED_INFORMATION_FLOW ----------
  // 선택한 Entity 를 위에서 아래로 읽고, 연결된 대상(구절·인물·장소)으로 같은 패널 안에서 이동한다.
  // fixture 에 없는 데이터(사건·시대·지역 등)는 만들지 않고 해당 섹션을 숨긴다.
  function snip(t) { t = String(t || ""); return t.length > 34 ? t.slice(0, 34) + "…" : t; }
  function entityRefs(kind, id) {
    var out = [];
    (D.featured || []).forEach(function (pid) { var P = D.passages[pid]; if (!P) return; P.verses.forEach(function (v) { if (entitiesIn(v.text)[kind].indexOf(id) >= 0) out.push({ pid: pid, n: v.n, ref: P.ref, text: v.text }); }); });
    return out.sort(function (a, b) { return (b.pid === state.passage) - (a.pid === state.passage); });
  }
  function relatedOf(kind, id) {   // 연결 = GuideStep fixture 가 같은 단계에 묶은 대상(추론하지 않음)
    var pe = [], pl = [];
    (G.steps || []).forEach(function (st) {
      if (!has(kind === "l" ? st.place_ids : st.person_ids, id)) return;
      (st.person_ids || []).forEach(function (x) { if (!(kind === "p" && x === id) && D.people && D.people[x] && pe.indexOf(x) < 0) pe.push(x); });
      (st.place_ids || []).forEach(function (x) { if (!(kind === "l" && x === id) && D.places && D.places[x] && pl.indexOf(x) < 0) pl.push(x); });
    });
    return { p: pe, l: pl };
  }
  function chips(kind, ids, dict) { return '<div class="chips">' + ids.map(function (x) { return '<button type="button" class="rel-chip" data-rel="' + kind + "." + x + '" data-stable-id="' + esc(stableOf(kind, x)) + '">' + esc(dict[x].name) + "</button>"; }).join("") + "</div>"; }
  // 대표 사진 표시 관문: 이미지 payload/URL + creator/license/source page + 앱 측 rights 검증이 모두 충족될 때만 이미지를 보여 준다. 아니면 출처 정보만.
  // 출처 링크 규칙: 검증된 source URL 이 있을 때만 클릭 가능한 링크, 파일 제목뿐이면 일반 텍스트. 파일명에서 URL 을 만들지 않는다.
  function mediaSourceHtml(m) {
    var u = m && m.source_url_verified === true && typeof m.source_url === "string" && /^https:\/\/commons\.wikimedia\.org\/wiki\/[^\s"'<>]+$/.test(m.source_url) ? m.source_url : null;
    return u ? '<a class="src-link" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(m.file) + "</a>" : esc(m && m.file);
  }
  function mediaGate(m) {
    var ok = !!(m && typeof m.preview_url === "string" && /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/[^\s"'<>]+$/.test(m.preview_url) && m.creator && m.license && m.file && m.rights && m.rights.validated === true && m.rights.status === "CLEARED");
    return ok ? "image" : "attribution_only";
  }
  var mediaLightboxReturn = null;
  function findMedia(id) { var out = null; Object.keys((PJ && PJ.places) || {}).some(function (k) { var a = (PJ.places[k].media || []).filter(function (m) { return m.id === id; })[0]; if (a) { out = { asset: a, place: PJ.places[k] }; return true; } return false; }); return out; }
  function openMediaLightbox(id, trigger) {
    var found = findMedia(id), box = $("media-lightbox"), body = $("media-lightbox-body"); if (!found || mediaGate(found.asset) !== "image" || !box || !body) return;
    var m = found.asset, caption = m.reader_caption || found.place.hero_caption || found.place.display_label;
    body.innerHTML = '<img class="media-lightbox-img" src="' + esc(m.preview_url) + '" alt="' + esc(caption) + '" referrerpolicy="no-referrer"><figcaption class="media-lightbox-meta"><strong id="media-lightbox-caption">' + esc(caption) + '</strong><span>사진: ' + esc(m.creator) + ' · ' + esc(m.license_label || m.license) + ' · ' + esc(m.provider) + '</span><br><span>원문: ' + mediaSourceHtml(m) + '</span></figcaption>';
    mediaLightboxReturn = trigger || document.activeElement; box.hidden = false; document.body.dataset.mediaLightbox = "open"; var close = box.querySelector(".media-lightbox-close"); if (close) close.focus();
  }
  function closeMediaLightbox() { var box = $("media-lightbox"); if (!box || box.hidden) return; box.hidden = true; delete document.body.dataset.mediaLightbox; $("media-lightbox-body").innerHTML = ""; if (mediaLightboxReturn && mediaLightboxReturn.focus) mediaLightboxReturn.focus(); mediaLightboxReturn = null; }
  // 왼쪽 Detail(연구 투영 Place): 카드 없이 타이포그래피·여백·정렬로 위계를 만든다.
  function projectedFlow(en, e) {
    var R = e.research, stat = { VERIFIED: "확인된 위치", LIKELY: "유력한 위치", PLAUSIBLE: "가능성 있는 위치", VERIFY: "추정지", DISPUTED: "여러 후보지", UNKNOWN: "위치 미상" }[R.location.reader_status];   // HOLD 는 표시하지 않는다
    var rep = (R.media || []).filter(function (m) { return /representative/.test(m.role); })[0] || (R.media || [])[0], mode = mediaGate(rep);
    var rowsOf = function (grp) {
      return (R.passage_links || []).filter(function (l) { return l.group === grp; }).map(function (l) {
        var pid = l.book + "-" + l.chapter, P = D.passages[pid]; if (!P) return ""; var n = P.verses.length; if (l.v1 && l.v1 > n) return "";
        var lab = P.ref.replace(/장$/, "") + (l.v1 ? ":" + l.v1 + (l.v2 > l.v1 ? "–" + Math.min(l.v2, n) : "") : "장 전체");
        return '<button type="button" class="pill" data-open-ref="' + pid + ":" + (l.v1 || "") + '">' + esc(lab) + "</button>";
      }).join("");
    };
    var direct = rowsOf("direct"), related = rowsOf("related");
    // 독자 요약에서 위치 설명 문장은 "위치는 어디인가" 섹션의 것과 같은 문장이므로 요약에서 뺀다(원본 문장은 수정하지 않고 재배치만).
    var sig = R.reader.concise_summary; (R.location.sentences || []).forEach(function (t) { sig = sig.split(t).join(""); }); sig = sig.replace(/\s{2,}/g, " ").trim();
    var hero = rep ? '<figure class="d-hero" data-part="media" data-media-id="' + esc(rep.id) + '" data-media-mode="' + mode + '">' + (mode === "image" ? '<button type="button" class="hero-open" data-media-lightbox="' + esc(rep.id) + '" aria-label="큰 이미지와 출처 보기"><img class="hero-img" src="' + esc(rep.preview_url) + '" alt="' + esc(R.hero_caption || rep.reader_caption || R.display_label) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"></button>' : "") +
      '<figcaption><span class="hero-cap">' + esc(R.hero_caption || rep.reader_caption) + '</span>' + (mode === "attribution_only" ? '<span class="hero-src">' + (R.hero_subject ? esc(R.hero_subject) + " · " : "") + "사진: " + esc(rep.creator) + " · " + esc(rep.license_label || rep.license) + " · " + esc(rep.provider) + '</span><span class="hero-src">사진 파일은 아직 불러오지 않고 출처만 표시합니다.</span>' : "") + "</figcaption></figure>" : "";
    var credits = (R.media || []).filter(function (m) { return mediaGate(m) !== "image"; }).map(function (m) { return '<figure class="media-ref" data-media="' + esc(m.id) + '"><span class="cap">' + esc(m.reader_caption || "") + '</span><span class="prov">사진: ' + esc(m.creator) + " · " + esc(m.license_label || m.license) + " · " + esc(m.provider) + " · " + mediaSourceHtml(m) + '</span><span class="prov">' + esc(m.attribution) + "</span></figure>"; }).join("");
    var claims = (R.claims || []).map(function (c) { return "<li><strong>" + esc(c.id) + "</strong> " + esc(c.statement) + ' <span class="meta">(' + esc(c["class"]) + " · " + esc(c.locator) + " · " + esc(c.confidence) + ")</span></li>"; }).join("");
    var cands = (R.candidates || []).map(function (c) { return "<li>" + esc(c.label) + " — " + esc(c.status || c.candidate_role || "") + (typeof c.lat === "number" ? " · " + c.lat + ", " + c.lon : " · 좌표 없음") + (c.note ? " · " + esc(c.note) : "") + " (성경의 " + esc(R.display_label) + wa(R.display_label) + " 동일시하지 않음)</li>"; }).join("");
    var vh = (R.verify || []).map(function (v) { return "<li>" + esc(v.id) + " · " + esc(v.issue) + " — " + esc(v.state) + "</li>"; }).join("") + (R.hold || []).map(function (v) { return "<li>보류 · " + esc(v) + "</li>"; }).join("");
    return '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="l" data-id="' + esc(en.id) + '" data-stable-id="' + esc(e.stable_id) + '" data-research="1">' +
      '<header class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3><p class="d-en">' + esc(R.label_en) + '</p><p class="d-kind">' + esc(R.reader_type || "성경 지명") + (stat ? " · " + esc(stat) : "") + "</p></header>" +
      hero +
      '<p class="d-hook" data-part="hook">' + esc(R.reader.headline) + "</p>" +
      '<section class="d-sec" data-part="facts"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + (R.reader.glance || []).map(function (kv) { return '<div class="qf"><dt>' + esc(kv[0]) + "</dt><dd>" + esc(kv[1]) + "</dd></div>"; }).join("") + "</dl></section>" +
      '<section class="d-sec" data-part="summary"><h4 class="d-h">이 장소는 왜 중요한가</h4><p class="d-body">' + esc(sig) + "</p></section>" +
      (direct || related ? '<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4>' + (direct ? '<div class="pills">' + direct + "</div>" : "") + (related ? '<p class="d-sub">함께 읽으면 좋은 본문</p><div class="pills">' + related + "</div>" : "") + "</section>" : "") +
      '<section class="d-sec" data-part="location"><h4 class="d-h">위치는 어디인가</h4>' + (R.location.lead ? '<p class="d-body"><strong>' + esc(R.location.lead) + "</strong></p>" : "") + R.location.sentences.map(function (t) { return '<p class="d-body">' + esc(t) + "</p>"; }).join("") + "</section>" +
      '<footer class="d-secondary"><div class="d-rule"></div><section class="d-credits" data-part="credits"><h4 class="d-h2">사진 출처</h4>' + (credits || '<span class="prov">사진을 누르면 출처와 라이선스를 확인할 수 있습니다.</span>') + "</section>" +
      '<details class="research" data-part="research"><summary>연구 상세</summary><div class="rs-body"><p class="meta">출처 · ' + esc(R.source_refs[0].id) + " (" + esc(R.source_refs[0].version) + ") · " + esc(R.authority.project) + "<br>판정 · 식별 " + esc(R.certainty) + " / 좌표 " + esc(R.coordinate_certainty) + " / " + esc(R.status) + "</p>" +
      "<h5>이름 정보</h5><p class=\"meta\">" + esc(R.ancient_name.hebrew) + " · " + esc(R.ancient_name.transliteration) + " · " + esc((R.aliases || []).join(", ")) + "</p>" +
      "<h5>주장과 근거</h5><ul class=\"rs-list\">" + claims + "</ul><h5>경쟁 견해</h5><ul class=\"rs-list\">" + (R.competing_views || []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul><h5>후보 위치</h5><ul class=\"rs-list\">" + cands + "</ul><h5>남은 확인 사항</h5><ul class=\"rs-list\">" + vh + "</ul></div></details></footer>" +
      '<p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
  }
  function projectedPersonFlow(en, e) {
    var R = e.research, n = STORE.get(e.stable_id), refs = n ? n.passage_refs : [], events = n ? n.related_events : [];
    var refHtml = refs.map(function (r) { var pid = r.book + "-" + r.chapter, P = D.passages[pid]; if (!P) return ""; return '<button type="button" class="pill" data-open-ref="' + esc(pid + ":" + (r.verse || "")) + '">' + esc(P.ref + (r.verse ? " " + r.verse + "절" : "")) + "</button>"; }).join("");
    var facts = [["역할", n && n.role], ["시대", n && n.period]].filter(function (x) { return x[1]; }).map(function (x) { return '<div class="qf"><dt>' + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("");
    var evHtml = events.map(function (x) { return '<li data-event-id="' + esc(x.event_id || x.id || "") + '">' + esc(x.display_label || x.label || x.event_id || x.id) + (x.passage ? " · " + esc(x.passage) : "") + "</li>"; }).join("");
    var src = R.source_refs && R.source_refs[0];
    var out = '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="p" data-id="' + esc(en.id) + '" data-stable-id="' + esc(e.stable_id) + '" data-research="1">';
    out += '<header class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3><p class="d-kind">인물' + (e.role ? " · " + esc(e.role) : "") + "</p></header>";
    if (facts) out += '<section class="d-sec" data-part="facts"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + facts + "</dl></section>";
    if (e.note) out += '<section class="d-sec" data-part="summary"><h4 class="d-h">이 인물은 누구인가</h4><p class="d-body">' + esc(e.note) + "</p></section>";
    if (refHtml) out += '<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4><div class="pills">' + refHtml + "</div></section>";
    if (evHtml) out += '<section class="d-sec" data-part="events"><h4 class="d-h">관련 사건</h4><ul class="rs-list">' + evHtml + "</ul></section>";
    out += '<details class="research" data-part="research"><summary>연구 상세</summary><div class="rs-body"><p class="meta">' + (src ? "출처 · " + esc(src.id || src.path || "") + "<br>" : "") + "판정 · " + esc(R.certainty || "") + " / " + esc(R.status || "") + '</p></div></details><p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
    return out;
  }
  function entityFlow() {
    var en = state.entity, kind = en.kind, dict = kind === "p" ? D.people : D.places, e = dict && dict[en.id];
    if (!e) return '<p class="empty helper">선택한 항목을 찾을 수 없습니다.</p>';
    if (e.research) return kind === "p" ? projectedPersonFlow(en, e) : projectedFlow(en, e);
    var refs = entityRefs(kind, en.id), rel = relatedOf(kind, en.id), gs = guideSteps(), gi = gs.findIndex(function (x) { return has(kind === "l" ? x.place_ids : x.person_ids, en.id); });
    var facts = (kind === "l" ? ["좌표 상태 · 프로토타입용 fixture 위치(검증 전)"] : [e.role ? "역할 · " + esc(e.role) : ""]).concat(["식별 확실성 · 미검증(샘플)", gi >= 0 ? "네비게이션 단계 " + (gi + 1) + "/" + gs.length : ""]).filter(Boolean).join(" · ");
    var ph = kind === "l" ? PANELS.photos([en.id]) : "", showPh = /<figure|degraded|권리 확인/.test(ph);
    var seenN = {}, shown = refs.filter(function (r) { seenN[r.pid] = (seenN[r.pid] || 0) + 1; return seenN[r.pid] <= (r.pid === state.passage ? 5 : 3); });   // 본문별로 나눠 보여 준다(다른 본문 구절도 항상 도달 가능)
    var rows = shown.map(function (r) { return '<button type="button" class="vrow" data-open-ref="' + r.pid + ":" + r.n + '"><span class="vr-ref">' + esc(r.ref) + " " + r.n + '절</span><span class="vr-txt">' + esc(snip(r.text)) + "</span></button>"; }).join("");
    return '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><div class="detail" data-detail="' + kind + '" data-id="' + en.id + '">' +
      '<div class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3><div class="meta">' + (kind === "p" ? "인물" : "장소") + ((e.aliases || []).length ? " · " + esc(e.aliases.join(", ")) : "") + "</div></div>" +
      '<div class="meta d-facts" data-part="facts">' + facts + "</div>" +
      (e.note ? '<p class="detail-note" data-part="summary">' + esc(e.note) + "</p>" : "") +
      (refs.length ? '<div class="d-sec" data-part="scripture"><h4 class="sec-h">관련 구절</h4><div class="vrows">' + rows + "</div>" + (refs.length > shown.length ? '<p class="meta">외 ' + (refs.length - shown.length) + "개 구절</p>" : "") + "</div>" : "") +
      (rel.p.length ? '<div class="d-sec" data-part="people"><h4 class="sec-h">관련 인물</h4>' + chips("p", rel.p, D.people) + "</div>" : "") +
      (rel.l.length ? '<div class="d-sec" data-part="places"><h4 class="sec-h">관련 장소</h4>' + chips("l", rel.l, D.places) + "</div>" : "") +
      (showPh ? '<div class="d-sec" data-part="photos"><h4 class="sec-h">사진</h4>' + ph + "</div>" : "") +
      '<details class="research" data-part="research"><summary>연구 상세</summary><ul class="meta rs-list"><li>근거(evidence) · 연결된 연구자산 없음</li><li>출처(source) · UI 개발용 fixture</li><li>위치(locator) · 없음</li><li>확실성(certainty) · 미검증 (FIXTURE_SAMPLE · NON_AUTHORITATIVE)</li><li>외부 자료 · 없음</li></ul></details>' +
      '<div class="meta detail-hint">Esc 또는 같은 항목을 다시 눌러 닫기</div></div>';
  }
  // 본문 개요: 탭/아코디언 선택기가 아니라 하나의 연결된 정보 흐름.
  // 데이터가 있는 핵심 섹션(문맥·인물·장소·관련 본문·사진)은 기본 펼침, 데이터가 없는 섹션은 숨긴다.
  // 접힘이 허용되는 것: 외부 자료 세부 목록 · 내 메모 · 연구 상세. (사건/장면은 fixture 데이터가 없어 만들지 않는다.)
  function overviewFlow() {
    var LABEL = { context: "본문 문맥", people: "등장 인물", places: "등장 장소", crossref: "관련 본문", photos: "대표 사진 · 시각자료", resources: "외부 자료", notes: "내 메모" };
    var isEmpty = function (t, h) {
      if (t === "context") return h.indexOf('data-section="theme"') < 0;
      if (t === "photos") return !/<figure|class="degraded"|권리 확인/.test(h);
      return h.indexOf('class="item') < 0;
    };
    var degraded = function (t) { return '<div class="degraded" role="status">이 항목(' + esc(LABEL[t] || t) + ")을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>"; };
    var flat = function (t) {   // 기본 펼침 섹션
      var h; try { h = PANELS[t](); } catch (e) { return '<section class="ov-sec" data-ov="' + t + '"><h3 class="sec-h ov-h">' + esc(LABEL[t]) + "</h3>" + degraded(t) + "</section>"; }
      return isEmpty(t, h) ? "" : '<section class="ov-sec" data-ov="' + t + '"><h3 class="sec-h ov-h">' + esc(LABEL[t]) + "</h3>" + h + "</section>";
    };
    var fold = function (t) {   // 접힘 허용 섹션
      var h; try { h = PANELS[t](); } catch (e) { return '<section class="ov-sec" data-ov="' + t + '"><h3 class="sec-h ov-h">' + esc(LABEL[t]) + "</h3>" + degraded(t) + "</section>"; }
      if (t === "resources" && isEmpty(t, h)) return "";
      var n = t === "resources" ? " (" + (h.match(/class="item res"/g) || []).length + ")" : "", open = ui.ovOpen[t] !== undefined ? ui.ovOpen[t] : t === state.tab;
      return '<details class="ov" data-ov="' + t + '"' + (open ? " open" : "") + "><summary>" + esc(LABEL[t]) + n + '</summary><div class="ov-body">' + h + "</div></details>";
    };
    return '<p class="helper ov-lead">본문의 인물·장소를 누르면 그 대상의 상세가 이 패널에서 열리고 지도가 함께 움직입니다.</p><div class="ov-flow">' +
      ["context", "people", "places", "crossref", "photos"].map(flat).join("") + ["resources", "notes"].map(fold).join("") +
      '<details class="research" data-part="research"><summary>연구 상세</summary><ul class="meta rs-list"><li>근거(evidence) · 연결된 연구자산 없음</li><li>출처(source) · UI 개발용 fixture</li><li>위치(locator) · 없음</li><li>확실성(certainty) · 미검증 (FIXTURE_SAMPLE · NON_AUTHORITATIVE)</li></ul></details></div>';
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
    photos: function (only) {
      var ids = only || relevantPlaceIds(), out = [], held = 0, missing = 0;
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
    try { html = state.entity && entityValid(state.entity) ? entityFlow() : overviewFlow(); } catch (e) { html = '<div class="degraded" role="status">상세를 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
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
      var m = mapModel(), geoNow = mapModeNow() === "geo"; cap = geoNow ? geoMarkers().length + "곳(지리)" : (m.linked.length ? m.linked.length + "곳" : "");
      html = (geoNow ? geoSvg() + geoLegend() : mapSvg(m, "smap", true)) +
        m.unlocated.map(function (id) { return '<p class="map-note" data-place="' + esc(id) + '" data-stable-id="' + esc(stableOf("l", id)) + '">' + esc(unlocatedNote(id)) + "</p>"; }).join("") +
        (m.bad.length ? '<p class="degraded" data-places="' + esc(m.badIds.join(",")) + '">지도에 표시할 수 없는 장소(좌표 오류): ' + esc(m.bad.join(", ")) + ". 장소 탭에서 텍스트로 확인할 수 있습니다.</p>" : "") +
        (m.all.length ? '<p class="helper">좌표와 경로는 샘플입니다. 핀을 누르면 왼쪽 상세와 오른쪽 네비게이션이 함께 바뀝니다.</p>' : '<p class="empty helper">이 본문에는 지도에 표시할 장소가 없습니다.</p>');
    } catch (e) { html = '<div class="degraded" role="status">지도를 표시할 수 없습니다. 본문과 맥락 패널은 계속 사용할 수 있습니다.</div>'; }
    body.innerHTML = html; var c = $("mp-cap"); if (c) c.textContent = cap;
    try { updateMapHead(); } catch (e) {}
  }
  // ---------- 네비게이션(Navigation Lock): 현재 맥락 → 연결된 이야기 → 성경 전체 탐색 ----------
  var NAV_TOP = ["기초 지리", "자연환경", "구약 역사", "중간기", "신약"];   // 잠금된 상위 분류. 하위(시대 목록 등)는 후속 설계 확정 전이라 여기서 만들지 않는다.
  function refKey(r) { if (typeof r === "string") return r; return r && r.book ? r.book + "-" + r.chapter + ":" + (r.v1 || "") : null; }
  // 명시적 navigation 메타데이터(연구 투영 record.navigation / GuideTopic.navigation)만 후보가 된다. 시대·분류를 추정해 배정하지 않는다.
  function navigationCandidates() {
    var out = [];
    Object.keys((PJ && PJ.places) || {}).forEach(function (sid) { var n = PJ.places[sid].navigation; if (n && n.domain) out.push({ domain: n.domain, period: n.period || null, story: n.story || null, scene: n.scene || null, refs: (n.passage_refs || []).map(refKey).filter(Boolean), source: sid }); });
    (G.topics || []).forEach(function (tp) { var n = tp.navigation; if (n && n.domain) out.push({ domain: n.domain, period: n.period || null, story: n.story || tp.title, scene: n.scene || null, refs: (n.passage_refs || tp.passage_refs || []).map(refKey).filter(Boolean), source: tp.id }); });
    return out;
  }
  function relatedTopics() {   // 우선순위 2: 선택한 장소·인물이 (fixture/연구의) 단계에 실제로 들어 있는 이야기
    var en = state.entity; if (!en) return [];
    return (G.topics || []).filter(function (tp) { return (G.steps || []).some(function (x) { return x.topic_id === tp.id && has(en.kind === "l" ? x.place_ids : x.person_ids, en.id); }); });
  }
  function refBtn(ref, label) { return '<button type="button" class="g-link" data-open-ref="' + esc(ref) + '">' + esc(label) + "</button>"; }
  function refLabel(ref) { var m = /^([a-z0-9]+-\d+):?(\d*)$/.exec(ref); return m && D.passages[m[1]] ? D.passages[m[1]].ref + (m[2] ? " " + m[2] + "절" : "") : ref; }
  function exploreHtml(canBack) {
    var cands = navigationCandidates();
    var tree = NAV_TOP.map(function (cat) {
      var items = cands.filter(function (c) { return c.domain === cat; });
      var byPeriod = {}; items.forEach(function (c) { var p = c.period || ""; (byPeriod[p] = byPeriod[p] || []).push(c); });
      var kids = Object.keys(byPeriod).map(function (p) {
        return '<li class="g-nav-period" data-nav-period="' + esc(p) + '">' + (p ? '<span class="g-nav-label">' + esc(p) + "</span>" : "") + "<ul>" + byPeriod[p].map(function (c) {
          return '<li class="g-nav-item" data-nav-source="' + esc(c.source) + '">' + (c.story ? '<span class="g-nav-story">' + esc(c.story) + "</span>" : "") + (c.scene ? '<span class="g-nav-scene">' + esc(c.scene) + "</span>" : "") + c.refs.map(function (r) { return refBtn(r, refLabel(r)); }).join("") + "</li>";
        }).join("") + "</ul></li>";
      }).join("");
      return '<li class="g-nav-cat" data-nav-category="' + esc(cat) + '"><span class="g-nav-cat-name">' + esc(cat) + "</span>" + (kids ? "<ul>" + kids + "</ul>" : "") + "</li>";
    }).join("");
    return (canBack ? '<button type="button" class="g-link g-back g-full" data-nav-mode="context">‹ 현재 이야기로</button>' : "") + '<div class="g-explore" data-part="explore"><h3 class="sec-h">성경 지도 탐색</h3><ul class="g-nav-tree">' + tree + "</ul></div>";
  }
  function relatedHtml(tps) {
    return '<div class="g-related" data-part="related"><h3 class="sec-h">이 대상과 연결된 이야기</h3>' + tps.map(function (tp) {
      var st = (G.steps || []).filter(function (x) { return x.topic_id === tp.id; }).sort(function (a, b) { return a.sequence - b.sequence; });
      return '<div class="g-topic"><p class="g-theme">' + esc(tp.title) + '</p><div class="meta g-ref">관련 핵심 본문 · ' + esc((tp.passage_refs || []).map(function (r) { return D.passages[r] ? D.passages[r].ref : r; }).join(", ")) + '</div><ol class="g-steps">' + st.map(function (x, i) { return '<li>' + (x.passage_ref ? '<button type="button" class="g-step" data-open-ref="' + esc(x.passage_ref) + '"><span class="g-n">' + (i + 1) + "</span>" + esc(x.title) + "</button>" : '<span class="g-step"><span class="g-n">' + (i + 1) + "</span>" + esc(x.title) + "</span>") + "</li>"; }).join("") + "</ol></div>";
    }).join("") + "</div>";
  }
  function renderGuide() {
    var g = $("guide-pane"); if (!g) return;
    var html;
    try {
      var topic = guideTopic(), st = guideSteps(), N = st.length, cur = guideIndex(), s = cur >= 0 ? st[cur] : null, lay = ui.layers;
      var rel = topic && N ? [] : relatedTopics(), hasContext = !!(topic && N) || rel.length > 0;
      var mode = ui.navExplore || !hasContext ? "explore" : (topic && N ? "context" : "related");   // 1 직접 이야기 → 2 연결된 이야기 → (3 지역: 연결 데이터 없음) → 4 성경 전체 탐색
      g.dataset.navState = mode;
      var fx = (G.meta || {}).status === "FIXTURE_SAMPLE" || (topic && topic.status === "FIXTURE_SAMPLE");
      g.dataset.routeSource = fx ? "fixture-sample" : "data"; g.dataset.guideSource = fx ? "fixture-sample" : "data"; g.dataset.guideAuthority = topic ? (topic.authority || (G.meta || {}).authority || "") : "";
      var head = '<h2 class="g-title">네비게이션</h2>';
      if (mode === "explore") { html = '<div class="g-body">' + head + exploreHtml(hasContext) + "</div>"; }
      else if (mode === "related") { html = '<div class="g-body">' + head + relatedHtml(rel) + '<button type="button" class="g-link g-full" data-nav-mode="explore">성경 전체 탐색 ›</button></div>'; }
      else {
      var refs = (topic.passage_refs || []).map(function (r) { return D.passages[r] ? D.passages[r].ref : r; }).join(", ");
      var steps = st.map(function (x, i) { return '<li><button type="button" class="g-step" data-guide-step="' + i + '"' + (i === cur ? ' aria-current="step"' : "") + '><span class="g-n">' + (i + 1) + "</span>" + esc(x.title) + "</button></li>"; }).join("");
      var objBtn = function (kind, ids, dict) { return (ids || []).filter(function (id) { return dict && dict[id]; }).map(function (id) { return '<button type="button" class="g-obj" data-obj="' + kind + "." + id + '" data-stable-id="' + esc(stableOf(kind, id)) + '">' + esc(dict[id].name) + "</button>"; }).join(""); };
      var route = s && s.route_id && G.routes ? G.routes[s.route_id] : activeRoute();
      var stepRef = ""; if (s && s.passage_ref) { var pm = /^([a-z0-9]+-\d+):?(\d*)$/.exec(s.passage_ref); stepRef = pm && D.passages[pm[1]] ? D.passages[pm[1]].ref + (pm[2] ? " " + pm[2] + "절" : "") : s.passage_ref; }
      html = '<div class="g-body">' + head +
        (fx ? '<p class="g-sample" data-sample="guide" data-status="FIXTURE_SAMPLE">샘플 데이터 · 승인된 연구자산이 아닌 예시입니다</p>' : "") +
        '<div class="g-topic" data-part="topic"><div class="meta">이야기 · 주제</div><p class="g-theme">' + esc(topic.title) + '</p><div class="meta g-ref">관련 핵심 본문 · ' + esc(refs) + "</div></div>" +
        '<div class="g-progress" data-part="progress"><div class="g-status" aria-live="polite">' + (cur >= 0 ? "단계 " + (cur + 1) + " / " + N + " · " + esc(s.title) : "총 " + N + "단계 · 시작 전") + '</div><ol class="g-steps g-full">' + steps + "</ol></div>" +
        (s ? '<div class="g-card g-full" data-part="current"><h3 class="sec-h">현재 단계</h3><div class="ent-name">' + esc(s.title) + '</div><p class="meta">' + esc(s.short_explanation || "") + '</p><p class="meta">지도에서 볼 대상 · ' + (function () { var pl = (s.place_ids || []).filter(function (id) { return D.places[id]; }), on = pl.filter(function (id) { return D.places[id].location_state !== "unlocated"; }), off = pl.filter(function (id) { return D.places[id].location_state === "unlocated"; }); return (on.length ? on.map(function (id) { return esc(D.places[id].name); }).join(", ") : "") + (off.length ? (on.length ? " · " : "") + off.map(function (id) { return esc(D.places[id].name); }).join(", ") + " (여러 후보지 — 지도에 점 없음)" : ""); })() + (stepRef ? " · 본문 " + esc(stepRef) : "") + "</p></div>" : "") +
        '<fieldset class="g-layers g-full" data-part="layers"><legend class="sec-h">지도 레이어</legend>' + (st.some(function (x) { return x.route_id && G.routes && G.routes[x.route_id]; }) ? '<label><input type="checkbox" id="layer-route" data-layer="route"' + (lay.route ? " checked" : "") + '> 경로</label>' : "") + '<label><input type="checkbox" id="layer-place" data-layer="place"' + (lay.place ? " checked" : "") + "> 장소</label></fieldset>" +
        (route ? '<div class="g-legend g-full" data-part="legend"><h3 class="sec-h">범례</h3><p class="meta">현재 경로 · ' + esc(route.label || "") + '</p><p class="meta"><span class="lg-line"></span>' + esc(route.legend || "") + "</p></div>" : "") +
        (s ? '<div class="g-objs g-full" data-part="objects"><h3 class="sec-h">이 단계의 대상</h3>' + (objBtn("l", s.place_ids, D.places) ? '<div class="g-objrow"><span class="meta">중요 장소</span>' + objBtn("l", s.place_ids, D.places) + "</div>" : "") + (objBtn("p", s.person_ids, D.people) ? '<div class="g-objrow"><span class="meta">중요 인물</span>' + objBtn("p", s.person_ids, D.people) + "</div>" : "") + "</div>" : "") +
        '<button type="button" class="g-link g-full" data-nav-mode="explore">성경 전체 탐색 ›</button>' +
        '</div><div class="g-nav" data-part="navigation"><button type="button" class="btn" id="guide-prev" data-guide="-1"' + (cur === 0 ? " disabled" : "") + '>‹ 이전</button><span class="g-ind">' + (cur >= 0 ? cur + 1 : "–") + " / " + N + '</span><button type="button" class="btn primary" id="guide-next" data-guide="1"' + (cur === N - 1 ? " disabled" : "") + ">다음 ›</button></div>";
      }
    } catch (e) { html = '<div class="degraded" role="status">네비게이션을 표시할 수 없습니다.</div>'; }
    g.innerHTML = html;
  }
  // ---------- 관점(본문연구 · 지도 · 연표) ----------
  var VIEWS = ["study", "map", "timeline"];
  function setView(v) { if (VIEWS.indexOf(v) < 0) return false; state.view = v; replaceNext = true; render(); return true; }
  // 연결된 구절 열기: 같은 본문이면 이동, 다른 본문이면 본문을 바꾸되 선택 대상은 유지(history 에 되돌릴 수 있는 새 entry).
  function openScripture(pid, n) { n = n || null; if (pid === state.passage) return n ? viewVerse(n) : undefined; return go(pid, n, true); }
  function viewVerse(n) { if (state.view !== "study") { state.view = "study"; replaceNext = true; render(); } scrollVerse(n, "center"); }
  function updateViewChrome() {
    var b = document.body, v = state.view; b.dataset.view = v;
    [].forEach.call(document.querySelectorAll("#rail [data-perspective]"), function (el) { if (el.dataset.perspective === v) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current"); });
    var tp = $("text-pane"); if (tp) { try { tp.inert = v !== "study"; } catch (e) {} tp.setAttribute("aria-hidden", v !== "study" ? "true" : "false"); }
    var tl = $("timeline-pane"); if (tl) tl.hidden = v !== "timeline";
    if (v === "timeline") renderTimeline();
  }
  function renderTimeline() {
    var el = $("tl-body"); if (!el) return;
    try {
      var P = D.passages[state.passage], en = state.entity, ent = en && (en.kind === "p" ? D.people : D.places)[en.id];
      el.innerHTML = '<h2 class="tl-title">연표</h2><ul class="tl-ctx" aria-label="이어받은 문맥"><li>본문 · ' + esc(P.ref) + (state.verse != null ? " " + state.verse + "절" : "") + "</li>" + (ent ? "<li>선택 대상 · " + esc(ent.name) + (en.kind === "l" ? " (장소)" : " (인물)") + "</li>" : "") + "</ul>" +
        '<p class="empty helper">표시할 연표 데이터가 아직 연결되지 않았습니다. 인물·사건·시대·왕조·관련 본문은 승인 연구자산에서 projection 됩니다(현재는 UI 샘플만 존재).</p><button type="button" class="btn" data-perspective="study">본문연구로 돌아가기</button>';
    } catch (e) { el.innerHTML = '<div class="degraded" role="status">연표를 표시할 수 없습니다.</div>'; }
  }
  var mapMoved = false;
  function bindMapPan() {
    var body = $("map-body"); if (!body) return; var d = null;
    body.addEventListener("pointerdown", function (ev) { if ((ev.button != null && ev.button !== 0) || !ev.target.closest("svg.smap, svg.gmap")) return; d = { x: ev.clientX, y: ev.clientY, cx: ui.cam.x, cy: ui.cam.y, geo: mapModeNow() === "geo" ? Object.assign({}, geoCam()) : null, moved: false, id: ev.pointerId }; });
    body.addEventListener("pointermove", function (ev) {
      if (!d) return; var dx = ev.clientX - d.x, dy = ev.clientY - d.y; if (!d.moved && Math.hypot(dx, dy) < 4) return;
      if (!d.moved) { d.moved = true; document.body.dataset.dragging = "map"; try { body.setPointerCapture(d.id); } catch (e) {} }
      var sv = body.querySelector("svg.smap, svg.gmap"); if (!sv) return; var rc = sv.getBoundingClientRect();
      if (d.geo) { var gu = d.geo.w / Math.min(rc.width, rc.height); ui.gcam = { x: d.geo.x - dx * gu, y: d.geo.y - dy * gu, w: d.geo.w }; renderGeoOnly(); return; }
      var upp = (100 / ui.cam.k) / Math.min(rc.width, rc.height);
      setCam(d.cx - dx * upp, d.cy - dy * upp, ui.cam.k);
    });
    function end() { if (d && d.moved) { mapMoved = true; setTimeout(function () { mapMoved = false; }, 0); } d = null; if (document.body.dataset.dragging === "map") delete document.body.dataset.dragging; }
    body.addEventListener("pointerup", end); body.addEventListener("pointercancel", end);
    body.addEventListener("wheel", function (ev) { if (state.view !== "map") return; ev.preventDefault(); zoomBy(ev.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });   // 전체 캔버스에서만 휠 확대(분할 화면에서는 페이지 스크롤 유지)
  }
  function loadSplit() { try { var v = parseFloat(localStorage.getItem(SPLIT_KEY)); if (isFinite(v) && v >= 0.2 && v <= 0.85) ui.frac = v; } catch (e) {} }
  function clampFrac(f) {
    var st = $("stage"), W = st ? st.getBoundingClientRect().width - 10 : 0, lo = 0.2, hi = 0.85;
    if (W > 0) { lo = Math.max(lo, 180 / W, 1 - 720 / W); hi = Math.min(hi, 1 - 340 / W); if (hi < lo) hi = lo; }
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
    ui.frac = Math.min(0.85, Math.max(0.2, f)); applySplit();
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
      if (ev.key === "End") { ev.preventDefault(); return setFrac(clampFrac(0.85), true); }
      if (ev.key === "Enter") { ev.preventDefault(); return setFrac(0.4, true); }
      var d = ev.key === "ArrowLeft" ? -0.02 : ev.key === "ArrowRight" ? 0.02 : 0;
      if (d) { ev.preventDefault(); setFrac(clampFrac(ui.frac + d), true); }
    });
  }
  var booting = false;
  var lastChrome = null, lastPanel = null;
  // Lock §3.3/3.4: Detail 이 열리고 닫힐 때 본문 폭(읽기 폭)은 그대로 두고 지도가 공간을 주고받는다.
  function keepTextWidth(tw) {
    var st = $("stage"); if (!st) return; var W = st.getBoundingClientRect().width - 10; if (!(W > 0)) return;
    ui.frac = Math.min(0.85, Math.max(0.2, 1 - tw / W)); applySplit();
  }
  function render() {
    var key = focusKey(document.activeElement);
    var chromeKey = state.panel + "|" + state.sheet + "|" + isMobile(), reflow = lastChrome !== null && lastChrome !== chromeKey, hadPending = !!pendingScroll;
    var pre = null; try { pre = computeAnchor(); } catch (e) {}     // 화면이 바뀌기 전 앵커: (1) 패널/시트 reflow 후 복원, (2) history entry 를 떠날 때 저장
    if (mounted.passage) { if (pre) anchors[pre.passage] = pre; else delete anchors[mounted.passage]; }   // 본문을 떠나는 순간 동기적으로 기록(프레임/스크롤 이벤트에 의존하지 않음)
    var tw0 = null; try { if (lastPanel !== null && lastPanel !== state.panel && !isMobile() && state.view === "study") { var tpn = $("text-pane"); tw0 = tpn ? tpn.getBoundingClientRect().width : null; } } catch (e) {}
    lastPanel = state.panel;
    try { updateContextChrome(); } catch (e) {}
    /* Detail 은 지도 위 overlay: 레이아웃 폭을 바꾸지 않는다(본문 폭·분할·카메라 불변) */
    lastChrome = chromeKey;
    renderText();
    if (reflow && pre && !hadPending) restoreAnchor(pre);
    try { updateViewChrome(); updateStageChrome(); renderMapPane(); renderGuide(); } catch (e) {}
    try { renderPanel(); } catch (e) { var pn = $("panel"); if (pn) pn.innerHTML = '<div class="degraded" role="status">맥락 패널을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
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
  var swState = { open: false, kind: "all", type: "all", testament: "all", period: "all", region: "all", sort: "label", view: "card", limit: 30, q: "", prevFocus: null, y: 0 };
  function bookIndexOf(pid) { return BOOK_ORDER.indexOf(String(pid).split("-")[0]); }
  function passageRank(r) { var bi = BOOK_ORDER.indexOf(r.book); return bi < 0 ? Infinity : bi * 1000000 + r.chapter * 1000 + (r.verse || 0); }
  function entityHasTestament(e, tst) { if (tst === "all") return true; return e.passage_refs.some(function (r) { var bi = BOOK_ORDER.indexOf(r.book); return bi >= 0 && (tst === "ot" ? bi < 39 : bi >= 39); }); }
  function bibleRank(e) {
    var best = Infinity; e.passage_refs.forEach(function (r) { best = Math.min(best, passageRank(r)); }); return best;
  }
  function entitySet(q, o) {
    o = o || {}; var nq = norm(q), out = STORE.list({ type: o.type || "all" });
    if (nq) out = out.filter(function (e) { return norm([e.display_label, (e.aliases || []).join(" "), e.role, e.region, e.period, e.short_summary].filter(Boolean).join(" ")).indexOf(nq) >= 0; });
    if (o.testament && o.testament !== "all") out = out.filter(function (e) { return entityHasTestament(e, o.testament); });
    if (o.period && o.period !== "all") out = out.filter(function (e) { return e.period === o.period; });
    if (o.region && o.region !== "all") out = out.filter(function (e) { return e.region === o.region; });
    var sort = o.sort || "label", byLabel = function (a, b) { return a.display_label.localeCompare(b.display_label, "ko") || a.stable_id.localeCompare(b.stable_id); };
    out.sort(function (a, b) { if (sort === "bible") { var ar = bibleRank(a), br = bibleRank(b); if (ar !== br) return ar - br; } else if (sort === "period") { var ap = a.period_sort_value, bp = b.period_sort_value; if (ap != null || bp != null) { if (ap == null) return 1; if (bp == null) return -1; if (ap !== bp) return ap < bp ? -1 : 1; } } return byLabel(a, b); });
    return out;
  }
  function search(q, o) {
    o = o || {};
    var nq = norm(q), out = [], kind = o.kind || "all", tst = o.testament || "all", limit = o.limit || 30;
    out.totalVerses = 0; out.totalEntities = 0;
    if (!nq) return out;
    var ref = parseReference(q);
    if (ref && ref.passage && kind === "all") out.push({ kind: "r", id: ref.passage + ":" + (ref.verse == null ? "" : ref.verse), label: ref.label + " 열기", sub: "", ref: ref });
    if (kind === "all" || kind === "entity") {
      entitySet(q, o).forEach(function (e) { out.totalEntities++; out.push({ kind: e.kind, id: e.compatibility_key, stable_id: e.stable_id, label: e.display_label, sub: e.entity_type === "Person" ? "인물" : "장소", ent: e }); });
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
    else { ref = markedHtml(x.label, markRanges(x.label, q), 0, x.label.length); var e = x.ent || {}; prev = esc([e.role, e.short_summary || e.note].filter(Boolean).join(" · ")); }
    return '<button type="button" class="sr-row" data-search="1" data-kind="' + x.kind + '" data-id="' + esc(x.id) + '"' + (x.stable_id ? ' data-stable-id="' + esc(x.stable_id) + '"' : "") + '><span class="sr-ref">' + ref + '<span class="sr-kind">' + esc(kind) + '</span></span><span class="sr-preview">' + prev + "</span></button>";
  }
  function entityMeta(e) { return [e.entity_type === "Person" ? e.role : e.region, e.period, e.entity_type === "Place" ? e.reader_location_status : null].filter(Boolean).join(" · "); }
  function entityActions(e) {
    var a = '<button type="button" class="ee-action" data-ee-action="scripture" data-stable-id="' + esc(e.stable_id) + '">본문 보기</button>';
    if (e.entity_type === "Place") a += '<button type="button" class="ee-action" data-ee-action="map" data-stable-id="' + esc(e.stable_id) + '">지도에서 보기</button>';
    if (e.entity_type === "Person" && e.related_events.length) a += '<button type="button" class="ee-action" data-ee-action="events" data-stable-id="' + esc(e.stable_id) + '">관련 사건 보기</button>';
    return a;
  }
  function entityItemHtml(e, q) {
    var card = swState.view === "card", m = e.representative_media, image = card && mediaGate(m) === "image" ? '<img class="ee-thumb" src="' + esc(m.preview_url) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : "";
    var label = q ? markedHtml(e.display_label, markRanges(e.display_label, q), 0, e.display_label.length) : esc(e.display_label), meta = entityMeta(e), count = e.passage_refs.length;
    return '<article class="ee-item ' + (card ? "ee-card" : "ee-list-row") + '" data-entity-id="' + esc(e.stable_id) + '" data-origin="' + esc(e.provenance.origin) + '"><button type="button" class="sr-row ee-primary" data-search="1" data-kind="' + e.kind + '" data-id="' + esc(e.compatibility_key) + '" data-stable-id="' + esc(e.stable_id) + '">' + image + '<span class="ee-copy"><span class="sr-ref">' + label + '<span class="sr-kind">' + (e.entity_type === "Person" ? "인물" : "장소") + '</span></span>' + (meta ? '<span class="ee-meta">' + esc(meta) + "</span>" : "") + (e.short_summary ? '<span class="sr-preview">' + esc(e.short_summary) + "</span>" : "") + '<span class="ee-count">관련 본문 ' + count + '</span></span></button><div class="ee-actions">' + entityActions(e) + "</div></article>";
  }
  function updateEntityFilterOptions() {
    var all = STORE.list(), specs = [["sw-period", "period"], ["sw-region", "region"]];
    specs.forEach(function (s) { var el = $(s[0]); if (!el) return; var vals = all.map(function (e) { return e[s[1]]; }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b, "ko"); }), current = swState[s[1]]; el.innerHTML = '<option value="all">전체</option>' + vals.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join(""); if (vals.indexOf(current) < 0) current = swState[s[1]] = "all"; el.value = current; });
    if ($("sw-sort")) $("sw-sort").value = swState.sort;
  }
  function renderSearch() {
    var el = $("search-results"), sum = $("sw-summary"), more = $("sw-more"), q = swState.q, r, refErr = null;
    if (!el) return;
    updateEntityFilterOptions(); el.dataset.entityView = swState.view;
    if (!norm(q)) { var all = swState.kind === "verse" ? [] : entitySet("", swState); el.innerHTML = all.length ? '<div class="ee-set" data-view="' + swState.view + '">' + all.map(function (e) { return entityItemHtml(e, ""); }).join("") + "</div>" : '<p class="empty helper">현재 필터에 해당하는 인물·장소가 없습니다.</p>'; if (sum) sum.textContent = "현재 인물 " + all.filter(function (e) { return e.kind === "p"; }).length + "건 · 장소 " + all.filter(function (e) { return e.kind === "l"; }).length + "건"; if (more) more.hidden = true; return; }
    try { var pr = parseReference(q); refErr = pr && pr.error; r = search(q, { kind: swState.kind, type: swState.type, testament: swState.testament, period: swState.period, region: swState.region, sort: swState.sort, limit: swState.limit }); }
    catch (e) { el.innerHTML = '<p class="degraded">검색을 사용할 수 없습니다.</p>'; return; }
    var html = refErr ? '<p class="empty helper" data-ref-error="1">' + esc(refErr) + "</p>" : "";
    var refs = r.filter(function (x) { return x.kind === "r"; }), ents = r.filter(function (x) { return x.kind === "p" || x.kind === "l"; }).map(function (x) { return x.ent; }), verses = r.filter(function (x) { return x.kind === "v"; });
    html += refs.map(function (x) { return rowHtml(x, q); }).join("") + (ents.length ? '<div class="ee-set" data-view="' + swState.view + '">' + ents.map(function (e) { return entityItemHtml(e, q); }).join("") + "</div>" : "") + verses.map(function (x) { return rowHtml(x, q); }).join("");
    if (!refs.length && !ents.length && !verses.length && !refErr) html += '<p class="empty helper">검색 결과 없음. 다른 표현이나 필터를 바꿔 보세요.</p>';
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
  function openSearchResult(kind, id, sid) {
    if (kind === "v") { var k = parseKey(id); go(k.passage, k.verse); closeSearch(true); return; }
    if (kind === "r") { var rk = id.split(":"); go(rk[0], rk[1] ? +rk[1] : null); closeSearch(true); return; }
    if (sid) selectEntityStable(sid); else if (!(state.entity && state.entity.kind === kind && state.entity.id === id)) selectEntity(kind, id);
    closeSearch(true);
  }
  function explorerAction(action, sid) {
    var e = STORE.get(sid); if (!e || !selectEntityStable(sid)) return;
    if (action === "map" && e.entity_type === "Place") setView("map");
    else if (action === "scripture") {
      var current = e.passage_refs.filter(function (r) { return r.book + "-" + r.chapter === state.passage; })[0], target = current || e.passage_refs.slice().sort(function (a, b) { return passageRank(a) - passageRank(b); })[0];
      if (!current && target) openRelatedPassage(target.book + "-" + target.chapter, target.verse);
    }
    // events는 명시적 relation이 있는 Person에만 렌더된다. 선택된 기존 Detail의 관련 사건 섹션을 사용한다.
    closeSearch(true);
  }

  // ---------- events ----------
  function fire(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (t.closest("[data-media-lightbox-close]")) return closeMediaLightbox();
    if ((el = t.closest("[data-media-lightbox]"))) return openMediaLightbox(el.dataset.mediaLightbox, el);
    if (t.closest("#sw-close") || t.closest("[data-sw-close]")) return closeSearch(false);
    if (t.closest("#search-open")) return openSearch($("search").value || "");
    if ((el = t.closest("[data-swfilter]"))) { var kv = el.dataset.swfilter.split(":"); swState[kv[0]] = kv[1]; swState.limit = 30; syncSwFilters(); return renderSearch(); }
    if (t.closest("#sw-more")) { swState.limit += 30; return renderSearch(); }
    if (t.closest("#panel-toggle")) return toggleContext();
    if (t.closest("#panel-open")) return setPanel("open");
    if (mapMoved) { mapMoved = false; if (t.closest("#map-body")) return; }
    if ((el = t.closest("[data-perspective]"))) return setView(el.dataset.perspective);
    if ((el = t.closest("[data-util]"))) {
      if (el.dataset.util === "search") return openSearch($("search").value || "");
      var pop = $("settings-pop"); pop.hidden = !pop.hidden; el.setAttribute("aria-expanded", String(!pop.hidden)); return;
    }
    if (t.closest("#reset-split")) return setFrac(0.4, true);
    if ((el = t.closest("[data-zoom]"))) { var z = +el.dataset.zoom; return z === 0 ? (mapModeNow() === "geo" ? gfit() : setCam(50, 50, 1)) : zoomBy(z > 0 ? 1.4 : 1 / 1.4); }
    if ((el = t.closest("[data-layer]"))) { ui.layers[el.dataset.layer] = !!el.checked; return render(); }
    if ((el = t.closest("[data-view-verse]"))) return viewVerse(+el.dataset.viewVerse);
    if (t.closest("#map-mode")) { ui.mapMode = mapModeNow() === "geo" ? "sample" : "geo"; ui.gcam = null; return renderMapPane(); }
    if (t.closest("#map-tiles")) { ui.tiles = !ui.tiles; return renderMapPane(); }
    if (t.closest("#map-toggle")) { ui.mapOpen = !ui.mapOpen; return updateStageChrome(); }
    if ((el = t.closest("[data-nav-mode]"))) { ui.navExplore = el.dataset.navMode === "explore"; return renderGuide(); }
    if ((el = t.closest("[data-obj]"))) { var oo = el.dataset.obj.split("."); return selectEntity(oo[0], oo[1]); }
    if ((el = t.closest("[data-guide]"))) return guideStep(+el.dataset.guide);
    if ((el = t.closest("[data-guide-step]"))) return guideGo(+el.dataset.guideStep);
    if ((el = t.closest("[data-ee-action]"))) return explorerAction(el.dataset.eeAction, el.dataset.stableId);
    if ((el = t.closest('[data-search="1"]'))) return openSearchResult(el.dataset.kind, el.dataset.id, el.dataset.stableId);   // 결과 행만: 열린 검색 화면이 body[data-search="open"] 을 달기 때문에 속성 존재만으로는 body 가 걸린다
    if ((el = t.closest("[data-step]"))) { var np = stepPassage(state.passage, +el.dataset.step); return np ? go(np) : undefined; }
    if ((el = t.closest("g.gm[data-place]"))) return markerSelect(el.dataset.place);
    if ((el = t.closest(".tag"))) { e.stopPropagation(); return selectEntity(el.dataset.kind, el.dataset.id); }
    if ((el = t.closest("[data-verse]"))) return selectVerse(+el.dataset.verse);
    if ((el = t.closest("[data-rel]"))) { var rr = el.dataset.rel.split("."); return selectEntity(rr[0], rr[1]); }
    if ((el = t.closest("[data-open-ref]"))) { var orr = parseKey(el.dataset.openRef); if (el.closest("#panel")) return openRelatedPassage(orr.passage, orr.verse); return openScripture(orr.passage, orr.verse); }
    if (t.closest("[data-clear-entity]")) return closeEntity();
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
  document.addEventListener("toggle", function (e) { var d = e.target; if (d && d.classList && d.classList.contains("ov") && d.dataset.ov) ui.ovOpen[d.dataset.ov] = d.open; }, true);
  document.addEventListener("keydown", function (e) {
    var t = e.target, tag = t.tagName;
    if ((e.key === "Enter" || e.key === " ") && t.closest && t.closest("g.gm[data-place]")) { e.preventDefault(); return markerSelect(t.closest("g.gm[data-place]").dataset.place); }
    if (e.key === "Escape" && $("media-lightbox") && !$("media-lightbox").hidden) { e.preventDefault(); closeMediaLightbox(); return; }
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
    if (e.key === "Escape") { var sp0 = $("settings-pop"); if (sp0 && !sp0.hidden) { sp0.hidden = true; $("rail-settings").setAttribute("aria-expanded", "false"); e.preventDefault(); return; } if (state.entity) { e.preventDefault(); var en = state.entity; closeEntity(); returnFocusToText(en); } else if (state.preview) { state.preview = null; render(); } return; }
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if ((e.key === "Enter" || e.key === " ") && tag !== "BUTTON" && tag !== "A" && t.getAttribute && t.getAttribute("tabindex") !== null) { e.preventDefault(); fire(t); }
  });
  $("search").addEventListener("input", function (e) { var v = e.target.value; if (norm(v)) openSearch(v); else { swState.q = ""; if (swState.open) closeSearch(false); } });
  $("search").addEventListener("focus", function () { if (norm(this.value) && !swState.open) openSearch(this.value); });
  $("search").addEventListener("click", function () { if (!swState.open) openSearch(this.value || ""); });
  $("sw-query").addEventListener("input", function (e) { var v = e.target.value; $("search").value = v; swState.q = v; swState.limit = 30; renderSearch(); });
  ["sw-period", "sw-region", "sw-sort"].forEach(function (id) { var el = $(id); if (el) el.addEventListener("change", function () { var key = id.replace("sw-", ""); swState[key] = this.value; swState.limit = 30; renderSearch(); }); });
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
  // 이미지 불러오기 실패 → 출처만 표시하는 상태로 되돌린다(이미지 요소 제거, 본문·Detail 은 그대로).
  document.addEventListener("error", function (ev) {
    var im = ev.target; if (!im || im.tagName !== "IMG") return; if (im.classList.contains("ee-thumb")) { im.remove(); return; } if (!im.classList.contains("hero-img")) return; var fig = im.closest(".d-hero"), wrap = im.closest(".hero-open"); (wrap || im).remove();
    if (fig) { fig.setAttribute("data-media-mode", "attribution_only"); var cap = fig.querySelector("figcaption"), found = findMedia(fig.getAttribute("data-media-id")); if (cap && !cap.querySelector(".hero-fail")) { var meta = document.createElement("span"), sp = document.createElement("span"); meta.className = "hero-src"; meta.innerHTML = found ? "사진: " + esc(found.asset.creator) + " · " + esc(found.asset.license_label || found.asset.license) + " · " + esc(found.asset.provider) + " · " + mediaSourceHtml(found.asset) : "출처 정보 없음"; sp.className = "hero-src hero-fail"; sp.textContent = "사진을 불러오지 못해 출처만 표시합니다."; cap.appendChild(meta); cap.appendChild(sp); } }
  }, true);
  window.addEventListener("resize", function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); });   // 뷰포트 전환 시 패널/시트 모드 갱신(media query change 이벤트에만 의존하지 않음)
  window.addEventListener("beforeunload", function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} });   // 새로고침 직전의 읽던 자리(스크롤 이벤트에 의존하지 않음)
  if (h) { state.passage = h.passage; state.verse = h.verse; state.tab = h.tab; state.entity = h.entity; if (h.panel) state.panel = h.panel; if (h.sheet) state.sheet = h.sheet; if (h.view) state.view = h.view; if (h.verse != null) pendingScroll = { mode: "verse" }; }
  (function () { var hs = history.state; if (hs && hs.bvcAnchor && hs.bvcAnchor.passage === state.passage) pendingScroll = { mode: state.verse != null ? "verse" : "top", anchor: hs.bvcAnchor }; })();
  try { var mq = window.matchMedia("(max-width: 760px)"), onMq = function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); }; if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq); } catch (e) {}
  loadSplit(); bindSplit(); bindMapPan(); applySplit();
  if (state.entity && state.entity.kind === "l" && isMobile()) ui.mapOpen = true;   // 장소가 선택된 채로 열리면 지도도 함께 보여 준다
  booting = true; render(); booting = false;
  window.BVC = { detailContext: detailContext, DETAIL_MODEL: DETAIL_MODEL, openRelatedPassage: openRelatedPassage, geo: { GEO: GEO, LOC_LABEL: LOC_LABEL, LOC_MARKER: LOC_MARKER, markerSpec: markerSpec, markers: geoMarkers, available: geoAvailable, mode: mapModeNow, fit: geoFit, cam: geoCam }, navigationCandidates: navigationCandidates, renderGuide: renderGuide, store: STORE, entityExplorer: { set: entitySet, select: selectEntityStable }, scriptureIndex: SEI, entitiesAt: entitiesAt, mediaSourceHtml: mediaSourceHtml, mediaGate: mediaGate, stableId: stableOf, resolveKey: resolveKey, projection: PJ, setView: setView, setCam: setCam, zoomBy: zoomBy, ui: ui, guideStep: guideStep, guideGo: guideGo, guideRoute: guideRoute, guideIndex: guideIndex, guideSteps: guideSteps, guideTopic: guideTopic, guide: G, setFrac: setFrac, anchors: anchors, openSearch: openSearch, closeSearch: closeSearch, searchState: swState, markRanges: markRanges, setPanel: setPanel, setSheet: setSheet, toggleContext: toggleContext, isMobile: isMobile, entryAnchors: entryAnchors, openReference: openReference, scrollAnchor: computeAnchor, remount: function () { mounted.force = true; render(); }, variantFor: variantFor, krv: KRV, stepPassage: stepPassage, parseReference: parseReference, render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
