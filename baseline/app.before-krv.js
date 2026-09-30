(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  var TABS = [["context", "문맥"], ["people", "인물"], ["places", "장소"], ["map", "지도"],
              ["photos", "사진"], ["crossref", "관련 본문"], ["resources", "외부 자료"], ["notes", "내 메모"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체", preview: null, prevTab: null };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // ---------- pure helpers ----------
  var TAG = /\[\[([pl]):(\w+)\|([^\]]+)\]\]/g;
  function entitiesIn(text) {
    var out = { p: [], l: [] }, m; TAG.lastIndex = 0;
    while ((m = TAG.exec(text))) if (out[m[1]].indexOf(m[2]) < 0) out[m[1]].push(m[2]);
    return out;
  }
  function currentVerses() { var v = D.passages[state.passage].verses; return state.verse == null ? v : v.filter(function (x) { return x.n === state.verse; }); }
  function scopedEntities(kind) {
    var ids = [];
    currentVerses().forEach(function (v) { entitiesIn(v.text)[kind].forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    return ids;
  }
  function versesWith(kind, id) {
    return D.passages[state.passage].verses.filter(function (v) { return entitiesIn(v.text)[kind].indexOf(id) >= 0; }).map(function (v) { return v.n; });
  }
  function parseKey(k) { var a = k.split(":"); return { passage: a[0], verse: +a[1] }; }
  function noteKey() { return "bvc.note." + state.passage + ":" + (state.verse == null ? "all" : state.verse); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function hasVerse(pid, n) { return !!(D.passages[pid] && D.passages[pid].verses.some(function (v) { return v.n === n; })); }
  function stripTags(s) { return s.replace(/\[\[[pl]:\w+\|([^\]]+)\]\]/g, "$1"); }
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
    var parts = String(hash || "").replace(/^#/, "").split("&"), m = /^([a-z]+-\d+)(?::(\d+))?$/.exec(parts[0]);
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
  function go(passage, verse) {
    verse = verse == null ? null : verse;
    if (!D.passages[passage] || (verse != null && !hasVerse(passage, verse))) { showRefError("유효하지 않은 참조: " + passage + (verse != null ? ":" + verse : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    state.passage = passage; state.verse = verse; state.entity = null; state.preview = null; state.prevTab = null;
    render();
    return true;
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
    state.passage = r.passage; state.verse = r.verse; state.tab = r.tab; state.entity = r.entity; state.preview = null; state.prevTab = null;
    render();
  }

  // ---------- render ----------
  function renderNav() {
    $("passage-nav").innerHTML = Object.keys(D.passages).map(function (id) {
      return '<button data-passage="' + id + '"' + (id === state.passage ? ' class="on"' : "") + ">" + esc(D.passages[id].ref) + "</button>";
    }).join(" ");
  }
  function renderText() {
    var P = D.passages[state.passage];
    $("passage-title").textContent = P.ref;
    $("verses").innerHTML = P.verses.map(function (v) {
      var cls = "verse" + (state.verse === v.n ? " sel" : "");
      if (state.entity && versesWith(state.entity.kind, state.entity.id).indexOf(v.n) < 0) cls += " dim";
      var html = esc(v.text).replace(/\[\[([pl]):(\w+)\|([^\]]+)\]\]/g, function (_, k, id, label) {
        var act = state.entity && state.entity.kind === k && state.entity.id === id;
        return '<span class="tag ' + k + (act ? " active" : "") + '" tabindex="0" role="button" data-kind="' + k + '" data-id="' + id + '">' + label + "</span>";
      });
      return '<span class="' + cls + '" data-verse="' + v.n + '"><button class="vnum" data-vbtn="' + v.n + '" aria-pressed="' + (state.verse === v.n) + '" aria-label="' + v.n + '절 선택">' + v.n + "</button>" + html + "</span>";
    }).join("");
    $("crumb").textContent = state.verse == null ? "절을 클릭하면 아래 패널이 그 절 기준으로 좁혀집니다." : "선택: " + P.ref + " " + state.verse + "절 · 인물/장소를 클릭하면 관련 절이 강조됩니다.";
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
    if (d.vbtn) return '[data-vbtn="' + d.vbtn + '"]';
    if (d.tab) return '[data-tab="' + d.tab + '"]';
    if (d.passage) return '[data-passage="' + d.passage + '"]';
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
    renderNav(); renderText(); renderTabs(); renderPanel();
    syncHash(booting);
    if (key) { var n = document.querySelector(key); if (n && n !== document.activeElement) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } } }
  }

  // ---------- search (normalized) ----------
  function norm(s) { return String(s == null ? "" : s).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function search(q) {
    q = norm(q); var out = [];
    if (!q) return out;
    [["p", D.people], ["l", D.places]].forEach(function (d) { Object.keys(d[1] || {}).forEach(function (id) { var e = d[1][id]; if (norm(e.name + " " + (e.role || "") + " " + (e.aliases || []).join(" ")).indexOf(q) >= 0) out.push({ kind: d[0], id: id, label: e.name, sub: d[0] === "p" ? "인물" : "장소" }); }); });
    Object.keys(D.passages).forEach(function (pid) { D.passages[pid].verses.forEach(function (v) { if (norm(stripTags(v.text)).indexOf(q) >= 0) out.push({ kind: "v", id: pid + ":" + v.n, label: D.passages[pid].ref + " " + v.n + "절", sub: stripTags(v.text) }); }); });
    return out;
  }
  function renderSearch() {
    var el = $("search-results"), q = $("search").value, r;
    try { r = search(q); } catch (e) { el.innerHTML = '<p class="degraded">검색을 사용할 수 없습니다.</p>'; return; }
    if (!norm(q)) { el.innerHTML = ""; return; }
    el.innerHTML = r.length ? r.slice(0, 30).map(function (x) { return '<button class="sr" data-search="1" data-kind="' + x.kind + '" data-id="' + esc(x.id) + '">' + esc(x.label) + ' <span class="sub">' + esc(x.sub.slice(0, 40)) + "</span></button>"; }).join(" ") : '<p class="empty helper">검색 결과 없음.</p>';
  }
  function openSearchResult(kind, id) {
    if (kind === "v") { var k = parseKey(id); go(k.passage, k.verse); return; }
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
    if ((el = t.closest("[data-passage]"))) return go(el.dataset.passage);
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
  window.addEventListener("hashchange", applyHash);

  // ---------- boot ----------
  $("notice").textContent = D.meta.notice + " · 본문은 자체 요약문(샘플)이며 성경 번역본이 아닙니다.";
  var h = parseHash(location.hash);
  if (h) { state.passage = h.passage; state.verse = h.verse; state.tab = h.tab; state.entity = h.entity; }
  booting = true; render(); booting = false;
  window.BVC = { render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
