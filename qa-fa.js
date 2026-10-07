// Fixture Authority Isolation v0.1 — canonical pool vs fixture pool. Run with index.html?qa=fa (dev mode only).
// Production = canonical-only. Fixtures (data/fixture.js, data/guide.fixture.js) stay on disk and are enabled only by the QA switch (?qa=fixture, or window.BVC_QA_FIXTURE=true injected by a harness).
(function () {
  "use strict";
  if (!/[?&]qa=fa(&|$)/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); }, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var BSH = "JBC-CR-PLACE-BEERSHEBA-001", GER = "JBC-CR-PLACE-GERAR-001", ACH = "JBC-CR-PLACE-ACHAIA-001", AML = "JBC-CR-PLACE-AMALEK-001";
  var FIXTURE_IDS = ["abraham", "isaac", "god", "moriah", "haran"];
  var SHA = { fixture: "c97e0cc215bf593968bce0d7b39354f7e320b27153f9e80fa9356ddaa9c30a50", guide: "dec02e13d9e9087c8c583a18f4d30a1b0a29fd307c589f832218db3873225e9a" };
  function boot(html, hash) { var url = URL.createObjectURL(new Blob([html], { type: "text/html" })) + (hash || "#gen-22:19"); return new Promise(function (res) { var f = document.createElement("iframe"); f.style.cssText = "width:1500px;height:900px;border:0"; f.onload = function () { var w = f.contentWindow; setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 250); }; f.src = url; host.appendChild(f); }); }
  function load(o, hash) { o = o || {}; return fetch("index.html").then(function (r) { return r.text(); }).then(function (h) { h = h.replace("<head>", '<head><base href="' + location.origin + '/">' + (o.fixture ? "<script>window.BVC_QA_FIXTURE=true</script>" : "")); return boot(h, hash); }); }
  function clean(x) { x.f.remove(); }
  function qa(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  var sha = function (url) { return fetch(url, { cache: "reload" }).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return crypto.subtle.digest("SHA-256", b); }).then(function (d) { return [].map.call(new Uint8Array(d), function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }); };
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("FA-01", "production pool definition: canonical-only (projection-origin) entities; no fixture id in any pool", async function () {
    var x = await load(), B = x.B; ok(B.authority.qaFixture === false, "QA fixture switch is off by default");
    var ids = B.store.listAll().map(function (e) { return e.stable_id; }); ok(ids.every(function (i) { return /^JBC-CR-/.test(i); }) && B.store.listAll().every(function (e) { return e.authority_pool === "CANONICAL"; }), "every entity is CANONICAL with a JBC stable id");
    ok(Object.keys(B.data.people).length === 0, "no Person in production until canonical persons exist"); ok(Object.keys(B.data.places).every(function (k) { return FIXTURE_IDS.indexOf(k) < 0; }), "no fixture place key"); ok(Object.keys(B.data.lexicon || {}).length === 0, "no fixture lexicon (no name-based recognition)");
    ok(Object.keys(B.authority.fixturePool.people).length === 3 && Object.keys(B.authority.fixturePool.places).length === 3, "fixture pool preserved separately in memory"); clean(x);
  });
  t("FA-02", "Search & Explorer: fixture persons/places are not returned in production", async function () {
    var x = await load(); x.B.openSearch("아브라함"); await sleep(120); ok(!qa(x, "#search-results [data-entity-id]").length, "full search: no fixture Abraham");
    ok(!x.B.quickSearchItems("아브라함").length && !x.B.quickSearchItems("모리아").length && !x.B.quickSearchItems("하란").length, "quick search: none");
    x.B.openSearch(""); await sleep(150); var ids = qa(x, "#search-results [data-entity-id]").map(function (e) { return e.dataset.entityId; }); ok(ids.length > 0 && ids.every(function (i) { return /^JBC-CR-/.test(i); }), "explorer place list is canonical only: " + ids.length); clean(x);
  });
  t("FA-03", "Scripture: tags come only from the Scripture Entity Index; no name/lexicon promotion", async function () {
    var x = await load({}, "#gen-22"); await sleep(200); var tags = qa(x, "#verses .tag"); ok(tags.every(function (g) { return g.dataset.source === "scripture-index" && /^JBC-CR-/.test(g.dataset.stableId); }), "all tags: scripture-index + stable id (" + tags.length + ")");
    ok(!qa(x, '#verses .tag.p').length, "no Person tag from the fixture lexicon (아브라함/이삭 are plain text)"); clean(x);
  });
  t("FA-04", "Related & Person Detail: no fixture endpoint; unknown fixture person does not open", async function () {
    var x = await load({}, "#gen-22:19&e=p.abraham"); await sleep(200); ok(!x.B.state.entity && !qa(x, '#panel .detail[data-detail="p"]').length, "fixture Person Detail cannot open in production");
    x.B.selectEntity("l", "beersheba"); await sleep(150); ok(!qa(x, '#panel [data-part="people"] [data-id="abraham"], #panel [data-id="abraham"], #panel [data-id="isaac"], #panel [data-id="god"]').length, "Beersheba Detail lists no fixture person");
    var A = x.B.relAdjacency(); ok(Object.keys(A).every(function (k) { return /^JBC-CR-/.test(k) && Object.keys(A[k]).every(function (j) { return /^JBC-CR-/.test(j); }); }), "relation adjacency has canonical endpoints only"); clean(x);
  });
  t("FA-05", "Guide: fixture Guide is not production authority; graceful empty state", async function () {
    var x = await load({}, "#gen-22:2"); await sleep(250); var g = qa(x, "#guide-pane [data-nav-state]")[0] || x.d.getElementById("guide-pane"); ok(g && g.dataset.guideState === "canonical-empty", "guide state = canonical-empty");
    ok(!/모리아 산으로의 여정/.test(x.d.getElementById("guide-pane").textContent) && g.dataset.routeSource !== "fixture-sample" && g.dataset.guideSource !== "fixture-sample", "no fixture topic / fixture-sample source"); ok(x.d.getElementById("guide-pane").textContent.length > 20, "Bible exploration still usable (not a blank pane)"); clean(x);
  });
  t("FA-06", "compatibility ID: legacy key 'beersheba' resolves to the canonical stable id", async function () {
    var x = await load(); ok(x.B.store.stableId("l", "beersheba") === BSH && x.B.store.resolveKey(BSH) === "beersheba", "legacy key ↔ stable id"); clean(x);
    var y = await load({}, "#gen-22:19&e=l.beersheba"); await sleep(250); ok(qa(y, '#panel .detail[data-stable-id="' + BSH + '"]').length === 1, "e=l.beersheba restores the canonical Detail"); clean(y);
  });
  t("FA-07", "EXPLICIT_UNBOUND: a fixture record never satisfies it (fixture QA mode on)", async function () {
    var x = await load({ fixture: true }, "#gen-22"); await sleep(200); ok(x.B.authority.qaFixture === true && x.B.data.people.abraham, "fixture pool active in QA mode");
    var rel = x.B.projection.places[BSH].relations.filter(function (r) { return r.from === "Abraham"; })[0]; ok(rel && rel.resolved === false && rel.from_id === null, "projection relation to Abraham stays unresolved");
    var A = x.B.relAdjacency(); ok(Object.keys(A).every(function (k) { return /^JBC-CR-/.test(k) && Object.keys(A[k]).every(function (j) { return /^JBC-CR-/.test(j); }); }), "adjacency still canonical-only although fixture Abraham exists");
    ok(!x.B.boundRelations(BSH).some(function (r) { return !/^JBC-CR-/.test(r.sid); }), "no fixture entity in related items"); clean(x);
    var y = await load({ fixture: true }, "#act-18:12&e=rgn." + ACH); await sleep(250); var d = qa(y, '#panel .detail[data-stable-id="' + ACH + '"]')[0]; ok(d && /인물 연구 연결 전/.test(d.textContent), "Achaia people stay '인물 연구 연결 전'"); clean(y);
  });
  t("FA-08", "fixture QA mode: fixture pool available but separate from canonical (no implicit merge)", async function () {
    var x = await load({ fixture: true }, "#gen-22"); await sleep(200); var B = x.B, all = B.store.listAll(), fx = all.filter(function (e) { return e.authority_pool === "FIXTURE"; }), cn = all.filter(function (e) { return e.authority_pool === "CANONICAL"; });
    ok(fx.length >= 5 && cn.length >= 2, "both pools present: fixture " + fx.length + " / canonical " + cn.length); ok(fx.every(function (e) { return !/^JBC-/.test(e.stable_id); }), "fixture entities never carry a JBC research identity");
    ok(B.data.places.beersheba && !B.data.places.beersheba.stable_id && B.data.places[BSH] && B.data.places[BSH].stable_id === BSH, "fixture 'beersheba' and canonical Beersheba coexist as separate entries (no overwrite)");
    ok(/모리아 산으로의 여정/.test(x.d.getElementById("guide-pane").textContent) && (x.d.querySelector("#guide-pane [data-guide-source]") || x.d.getElementById("guide-pane")).dataset.guideSource === "fixture-sample", "fixture Guide is available in QA mode and labelled fixture-sample");
    clean(x);
  });
  t("FA-09", "fixture files physically preserved; projection / scripture index untouched", async function () {
    ok(await sha("data/fixture.js") === SHA.fixture && await sha("data/guide.fixture.js") === SHA.guide, "fixture.js / guide.fixture.js byte-identical"); ok((await fetch("data/scripture.index.js", { cache: "reload" })).ok, "scripture index present");
  });

  var TABS = ["context", "people", "places", "photos", "crossref", "resources"], LEAK = /샘플|fixture|example\.com|히 11:17|모리아 지역|시험, 순종, 하나님의 준비|족장 서사/;
  t("FA-10", "side panel (production): sample context / cross-references / resources / photos do not leak; empty states are shown instead", async function () {
    for (var i = 0; i < TABS.length; i++) {
      var x = await load({}, "#gen-22:2&tab=" + TABS[i] + "&panel=open"); await sleep(250); var p = x.d.getElementById("panel"); ok(p && p.textContent.length > 0, TABS[i] + ": panel rendered");
      ok(!LEAK.test(p.textContent), TABS[i] + ": no fixture sample text (" + (LEAK.exec(p.textContent) || [""])[0] + ")"); ok(!qa(x, "#panel .photo, #panel .xref, #panel .item.res, #panel .ctx-block").length, TABS[i] + ": no fixture blocks"); clean(x);
    }
    var y = await load({}, "#gen-22:2&panel=open"); await sleep(200); ok(!qa(y, "#panel .xref, #panel .item.res, #panel .photo, #panel .ctx-block").length && !/연구 상세[\s\S]*UI 개발용/.test(y.d.getElementById("panel").textContent), "overview has no fixture blocks and no fixture-source research footer"); clean(y);
  });
  t("FA-11", "Detail (production): canonical Beersheba Detail carries no fixture-derived content; canonical media still goes through the rights gate", async function () {
    var x = await load({}, "#gen-22:19"); x.B.selectEntity("l", "beersheba"); await sleep(250); var d = qa(x, "#panel .detail")[0]; ok(d && d.dataset.research === "1" && !LEAK.test(d.textContent), "canonical Detail, no fixture text");
    ok(!qa(x, '#panel [data-photo], #panel img[src*="fixture"]').length, "no fixture photo"); var rights = qa(x, "#panel [data-media-mode]").map(function (e) { return e.dataset.mediaMode; }); ok(rights.length > 0 && rights.every(function (m) { return /^(image|attribution_only)$/.test(m); }), "canonical media still rendered via the rights gate: " + rights.join()); clean(x);
  });
  t("FA-12", "fixture QA mode: the side content is available (fixtures preserved for development/regression)", async function () {
    var x = await load({ fixture: true }, "#gen-22:2&tab=crossref&panel=open"); await sleep(250); ok(/히 11:17/.test(x.d.getElementById("panel").textContent), "fixture cross-references in QA mode"); clean(x);
    var y = await load({ fixture: true }, "#gen-22:2&tab=context&panel=open"); await sleep(250); ok(/시험, 순종/.test(y.d.getElementById("panel").textContent), "fixture context in QA mode"); clean(y);
    var z = await load({ fixture: true }, "#gen-22:2&tab=resources&panel=open"); await sleep(250); ok(/샘플/.test(z.d.getElementById("panel").textContent), "fixture resources in QA mode"); clean(z);
  });
  (async function () { var res = []; for (var c of T) { var pass = true, err = ""; try { await Promise.race([c.fn(), new Promise(function (_, reject) { setTimeout(function () { reject(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err }); } var p = res.filter(function (r) { return r.pass; }).length; window.BVC_FA_QA = { pass: p, total: res.length, results: res }; var el = document.createElement("div"); el.id = "fa-qa-report"; el.className = "qa"; document.body.appendChild(el); el.textContent = "FIXTURE_AUTHORITY_ISOLATION_QA " + p + "/" + res.length + (p === res.length ? " PASS" : " FAIL") + "\n" + res.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : ""); }).join("\n"); })();
})();
