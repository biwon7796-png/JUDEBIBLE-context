(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  var TABS = [["context", "Context"], ["people", "People"], ["places", "Places"], ["map", "Map"],
              ["photos", "Photos"], ["crossref", "CrossRef"], ["resources", "Resources"], ["notes", "Notes"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체" };
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

  // ---------- actions ----------
  function go(passage, verse) {
    if (!D.passages[passage]) return false;
    state.passage = passage; state.verse = verse == null ? null : verse; state.entity = null;
    render(); try { location.hash = passage + (state.verse != null ? ":" + state.verse : ""); } catch (e) {}
    return true;
  }
  function selectVerse(n) { state.verse = state.verse === n ? null : n; state.entity = null; render(); }
  function selectEntity(kind, id) {
    var same = state.entity && state.entity.kind === kind && state.entity.id === id;
    state.entity = same ? null : { kind: kind, id: id };
    if (state.entity) state.tab = kind === "p" ? "people" : "places";
    render();
  }
  function setTab(t) { state.tab = t; render(); }

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
        return '<span class="tag ' + k + (act ? " active" : "") + '" data-kind="' + k + '" data-id="' + id + '">' + label + "</span>";
      });
      return '<span class="' + cls + '" data-verse="' + v.n + '"><sup>' + v.n + "</sup>" + html + "</span>";
    }).join("");
    $("crumb").textContent = state.verse == null ? "절을 클릭하면 아래 패널이 그 절 기준으로 좁혀집니다." : "선택: " + P.ref + " " + state.verse + "절 · 인물/장소를 클릭하면 관련 절이 강조됩니다.";
  }
  function renderTabs() {
    $("tabs").innerHTML = TABS.map(function (t) {
      return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + t[1] + "</button>";
    }).join("");
  }
  function scopeLabel() { return state.verse == null ? "본문 전체" : state.verse + "절"; }
  function entityCards(kind, ids, dict) {
    if (!ids.length) return '<p class="muted">' + scopeLabel() + "에 해당 항목 없음.</p>";
    return ids.map(function (id) {
      var e = dict[id], act = state.entity && state.entity.kind === kind && state.entity.id === id;
      return '<div class="item' + (act ? " active" : "") + '" data-kind="' + kind + '" data-id="' + id + '"><h3>' + esc(e.name) + "</h3>" +
        (e.role ? "<div>" + esc(e.role) + "</div>" : "") + '<div class="muted">' + esc(e.note) + " · 등장 절: " + versesWith(kind, id).join(", ") + "</div></div>";
    }).join("");
  }
  function inRange(spec, n) { var m = /^(\d+)(?:–(\d+))?/.exec(spec); if (!m) return false; var a = +m[1], b = m[2] ? +m[2] : a; return n >= a && n <= b; }
  function photoSvg(p) {
    return '<svg viewBox="0 0 150 100" role="img" aria-label="' + esc(p.title) + '"><rect width="150" height="100" fill="' + p.color + '"/><text x="75" y="54" text-anchor="middle" fill="#fff" font-size="11">SAMPLE</text></svg>';
  }
  function relevantPlaceIds() {
    var ids = scopedEntities("l");
    if (state.entity && state.entity.kind === "l" && ids.indexOf(state.entity.id) < 0) ids.push(state.entity.id);
    return ids;
  }
  var PANELS = {
    context: function () {
      var c = D.context[state.passage];
      var s = c.structure.map(function (x) { var hit = state.verse != null && inRange(x, state.verse); return "<li" + (hit ? ' style="font-weight:700"' : "") + ">" + esc(x) + (hit ? " ◀" : "") + "</li>"; }).join("");
      return '<div class="item"><h3>장르</h3>' + esc(c.genre) + '</div><div class="item"><h3>앞 문맥</h3>' + esc(c.before) +
        '</div><div class="item"><h3>뒤 문맥</h3>' + esc(c.after) + '</div><div class="item"><h3>구조</h3><ul>' + s + '</ul></div><div class="item"><h3>주제</h3>' + esc(c.theme) + "</div>";
    },
    people: function () { return '<p class="muted">' + scopeLabel() + "의 인물</p>" + entityCards("p", scopedEntities("p"), D.people); },
    places: function () { return '<p class="muted">' + scopeLabel() + "의 장소</p>" + entityCards("l", relevantPlaceIds(), D.places); },
    map: function () {
      var linked = D.placeLinks[state.passage] || [], here = scopedEntities("l");
      var line = linked.length > 1 ? '<polyline points="' + linked.map(function (id) { return D.places[id].x + "," + D.places[id].y; }).join(" ") + '" fill="none" stroke="#a55" stroke-dasharray="2 2" stroke-width="0.8"/>' : "";
      var pins = linked.map(function (id) {
        var p = D.places[id], act = (state.entity && state.entity.kind === "l" && state.entity.id === id) || (!state.entity && state.verse != null && here.indexOf(id) >= 0);
        return '<g class="pin' + (act ? " active" : "") + '" data-kind="l" data-id="' + id + '"><circle cx="' + p.x + '" cy="' + p.y + '" r="6"/><text x="' + (p.x + 8) + '" y="' + (p.y + 1.5) + '">' + esc(p.name) + "</text></g>";
      }).join("");
      return '<svg class="map" viewBox="0 0 100 100" role="img" aria-label="샘플 지도"><rect x="0" y="0" width="100" height="100" fill="#e9efe4"/><path d="M0 90 Q30 70 55 60 T100 40 V100 H0Z" fill="#d6ddc8"/>' + line + pins + "</svg>" +
        '<p class="muted">좌표는 프로토타입용 개략값입니다. ' + (linked.length ? "" : "이 본문에는 지도 장소가 없습니다.") + "</p>";
    },
    photos: function () {
      var ids = relevantPlaceIds(), out = [];
      ids.forEach(function (pid) { D.places[pid].photos.forEach(function (ph) { out.push([pid, ph]); }); });
      if (!out.length) return '<p class="muted">' + scopeLabel() + "에 연결된 사진 없음.</p>";
      return out.map(function (x) { var p = D.photos[x[1]]; return '<figure class="photo" data-photo="' + x[1] + '">' + photoSvg(p) + "<figcaption>" + esc(p.title) + '<br><span class="muted">' + esc(p.credit) + " · " + esc(D.places[x[0]].name) + "</span></figcaption></figure>"; }).join("");
    },
    crossref: function () {
      var refs = D.crossrefs.filter(function (r) { var f = parseKey(r.from); return f.passage === state.passage && (state.verse == null || f.verse === state.verse); });
      if (!refs.length) return '<p class="muted">' + scopeLabel() + "의 교차 참조 없음.</p>";
      return refs.map(function (r) { return '<div class="item"><h3><a href="#" data-goto="' + r.to + '">' + esc(r.label) + '</a></h3><span class="muted">' + esc(r.type) + " · " + esc(r.from) + " → " + esc(r.to) + "</span></div>"; }).join("");
    },
    resources: function () {
      var list = D.resources.filter(function (r) { return r.passages.indexOf(state.passage) >= 0; });
      var kinds = ["전체"].concat(list.map(function (r) { return r.kind; }).filter(function (k, i, a) { return a.indexOf(k) === i; }));
      if (kinds.indexOf(state.resKind) < 0) state.resKind = "전체";
      var f = kinds.map(function (k) { return '<button data-reskind="' + k + '"' + (k === state.resKind ? ' class="on"' : "") + ">" + esc(k) + "</button>"; }).join(" ");
      var items = list.filter(function (r) { return state.resKind === "전체" || r.kind === state.resKind; })
        .map(function (r) { return '<div class="item"><h3><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + '</a></h3><span class="muted">' + esc(r.kind) + " · 샘플 링크</span></div>"; }).join("");
      return "<p>" + f + "</p>" + (items || '<p class="muted">자료 없음.</p>');
    },
    notes: function () {
      return '<p class="muted">메모 대상: ' + esc(D.passages[state.passage].ref) + " " + scopeLabel() + '</p><textarea id="note-text" aria-label="메모">' + esc(store(noteKey()) || "") +
        '</textarea><p><button id="note-save">저장</button> <button id="note-export">전체 내보내기</button> <span id="note-status" class="muted"></span></p><pre id="note-out" class="muted"></pre>';
    }
  };
  function renderPanel() { $("panel").innerHTML = PANELS[state.tab](); }
  function render() { renderNav(); renderText(); renderTabs(); renderPanel(); }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if ((el = t.closest("[data-passage]"))) return go(el.dataset.passage);
    if ((el = t.closest(".tag"))) { e.stopPropagation(); return selectEntity(el.dataset.kind, el.dataset.id); }
    if ((el = t.closest("[data-verse]"))) return selectVerse(+el.dataset.verse);
    if ((el = t.closest("[data-tab]"))) return setTab(el.dataset.tab);
    if ((el = t.closest("[data-goto]"))) { e.preventDefault(); var k = parseKey(el.dataset.goto); return go(k.passage, k.verse); }
    if ((el = t.closest("[data-reskind]"))) { state.resKind = el.dataset.reskind; return renderPanel(); }
    if ((el = t.closest(".pin, .item[data-id]"))) return selectEntity(el.dataset.kind, el.dataset.id);
    if (t.id === "note-save") {
      var v = $("note-text").value; store(noteKey(), v);
      var idx = JSON.parse(store("bvc.noteIndex") || "[]"); if (idx.indexOf(noteKey()) < 0) idx.push(noteKey());
      store("bvc.noteIndex", JSON.stringify(idx)); $("note-status").textContent = "저장됨"; return;
    }
    if (t.id === "note-export") {
      var all = {}; JSON.parse(store("bvc.noteIndex") || "[]").forEach(function (k) { all[k.replace("bvc.note.", "")] = store(k); });
      $("note-out").textContent = JSON.stringify(all, null, 2);
    }
  });
  window.addEventListener("hashchange", function () { var m = /^#(\w+-\d+)(?::(\d+))?$/.exec(location.hash); if (m && D.passages[m[1]] && (m[1] !== state.passage || +m[2] !== state.verse)) go(m[1], m[2] ? +m[2] : null); });

  // ---------- boot ----------
  $("notice").textContent = D.meta.notice + " · 본문은 자체 요약문(fixture)이며 번역본이 아님.";
  var h = /^#(\w+-\d+)(?::(\d+))?$/.exec(location.hash || "");
  if (h && D.passages[h[1]]) { state.passage = h[1]; state.verse = h[2] ? +h[2] : null; }
  render();
  window.BVC = { render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
