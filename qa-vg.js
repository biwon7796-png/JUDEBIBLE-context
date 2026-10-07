// Canonical Consumer Visibility Gate v0.1 — reader.published === true AND activation.publishable === true (fail-closed). Run with index.html?qa=vg (dev mode only).
// Gate applies to reader-facing Search / Explorer / Scripture exposure only; direct (Region review) access and the projection data are untouched.
(function () {
  "use strict";
  if (!/[?&]qa=vg/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, J = JSON.stringify;
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); }, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var AML = "JBC-CR-PLACE-AMALEK-001", ACH = "JBC-CR-PLACE-ACHAIA-001", BSH = "JBC-CR-PLACE-BEERSHEBA-001", GER = "JBC-CR-PLACE-GERAR-001";
  var SHA = { projection: "6259f1847c1e05b4a7f93a9cc0cdcf3901c958146b201060a1a31b9c3eb2ff73", index: "4fedbc6489dff0c8977b5c489a935c419e4aeb3e92b63f1aa1a599ef6fc85998" };
  function boot(html, hash) { var url = URL.createObjectURL(new Blob([html], { type: "text/html" })) + (hash || "#gen-22:19"); return new Promise(function (res) { var f = document.createElement("iframe"); f.style.cssText = "width:1500px;height:900px;border:0"; f.onload = function () { var w = f.contentWindow; setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 250); }; f.src = url; host.appendChild(f); }); }
  // post: JS inserted right after the projection script (can alter the in-memory projection before app.js runs; the file on disk is never touched)
  function load(o, hash) { o = o || {}; return fetch("index.html").then(function (r) { return r.text(); }).then(function (h) { h = h.replace("<head>", '<head><base href="' + location.origin + '/">'); if (o.post) h = h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>' + o.post + "</script>"); return boot(h, hash); }); }
  function clean(x) { x.f.remove(); }
  function qa(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  var sha = function (url) { return fetch(url, { cache: "reload" }).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return crypto.subtle.digest("SHA-256", b); }).then(function (d) { return [].map.call(new Uint8Array(d), function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }); };
  var open = "var R=window.BVC_PROJECTION.regions;Object.keys(R).forEach(function(k){R[k].reader.published=true;R[k].activation.publishable=true;});";
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("VG-01", "predicate: published AND publishable required; missing / false / half-present metadata fails closed; legacy no-metadata is the declared HOLD", async function () {
    var x = await load(), g = x.B.gateRecord;
    ok(g({ reader: { published: true }, activation: { publishable: true } }) === true, "both true → visible");
    ok(g({ reader: { published: true }, activation: { publishable: false } }) === false && g({ reader: { published: false }, activation: { publishable: true } }) === false, "either false → hidden");
    ok(g({ reader: { published: true } }) === false && g({ activation: { publishable: true } }) === false && g({ reader: {}, activation: {} }) === false && g({ reader: { published: "true" }, activation: { publishable: "true" } }) === false, "half / non-boolean metadata → hidden");
    ok(g(null) === false, "no record → hidden"); ok(g({}) === true, "HOLD: no gate metadata at all keeps current visibility (legacy Place records; decision pending, no auto-approval)"); clean(x);
  });
  t("VG-02", "reader STORE gate: unpublished Regions are absent from STORE.list but still resolvable (canonical record preserved)", async function () {
    var x = await load(), S = x.B.store, ids = S.list().map(function (e) { return e.stable_id; }), all = S.listAll().map(function (e) { return e.stable_id; });
    ok(ids.indexOf(AML) < 0 && ids.indexOf(ACH) < 0, "Amalek / Achaia not in reader list"); ok(all.indexOf(AML) >= 0 && all.indexOf(ACH) >= 0, "both present in the internal list"); ok(S.get(AML) && S.get(ACH) && S.visible(AML) === false, "STORE.get still returns the records");
    ok(x.B.data.regions[AML] && x.B.data.regions[ACH], "D.regions intact"); clean(x);
  });
  t("VG-03", "Search: hidden record is not returned (full search and quick search)", async function () {
    var x = await load(); x.B.openSearch("아말렉"); await sleep(120); ok(!qa(x, '#search-results [data-stable-id="' + AML + '"]').length, "full search: no Amalek"); x.B.openSearch("아가야"); await sleep(120); ok(!qa(x, '#search-results [data-stable-id="' + ACH + '"]').length, "full search: no Achaia");
    ok(!x.B.quickSearchItems("아말렉").some(function (r) { return r.sid === AML && !r.ext; }) && !x.B.quickSearchItems("아가야").length, "quick search: none"); clean(x);
  });
  t("VG-04", "Explorer: place mode lists Beersheba / Gerar but no hidden Region", async function () {
    var x = await load(); x.B.openSearch(""); await sleep(150); var ids = qa(x, "#search-results [data-stable-id]").map(function (e) { return e.dataset.stableId; });
    ok(ids.indexOf(BSH) >= 0 && ids.indexOf(GER) >= 0 && ids.indexOf(AML) < 0 && ids.indexOf(ACH) < 0, "explorer ids: " + ids.length); clean(x);
  });
  t("VG-05", "Scripture: no hidden-Region tag in the text; scripture index file unchanged", async function () {
    var x = await load({}, "#exo-17:8"); await sleep(150); ok(!qa(x, "#verses .tag.rgn").length && !qa(x, '#verses .tag[data-stable-id="' + AML + '"]').length, "Exodus 17:8 has no Amalek tag");
    ok(x.B.store.indexAt("exo-17", 8, x.d.querySelector('#verses [data-verse="8"]') ? x.d.querySelector('#verses [data-verse="8"]').textContent : "").length >= 0, "indexAt callable"); ok(await sha("data/scripture.index.js") === SHA.index, "scripture.index.js hash unchanged"); clean(x);
  });
  t("VG-06", "internal access preserved: the Region review surface still opens by direct link", async function () {
    var x = await load({}, "#exo-17&e=rgn." + AML); await sleep(200); var d = qa(x, '#panel .detail[data-stable-id="' + AML + '"]')[0]; ok(d && d.dataset.detail === "rgn" && d.dataset.published === "false", "Amalek review Detail opens, still marked non-public");
    ok(/VERIFY-AML-01|추가 확인/.test(d.textContent) || d.querySelector('[data-verify]'), "VERIFY/HOLD content intact"); clean(x);
  });
  t("VG-07", "Beersheba & Gerar regression: still listed, tagged and openable (explicit published + publishable metadata)", async function () {
    var x = await load({}, "#gen-22:19"); await sleep(150); ok(x.B.store.visible(BSH) && x.B.store.visible(GER), "both visible"); var P = x.B.projection.places; ok(P[BSH].reader.published === true && P[BSH].activation.publishable === true && P[GER].reader.published === true && P[GER].activation.publishable === true, "visible through explicit persisted metadata (not the legacy HOLD)"); ok(qa(x, '#verses .tag[data-stable-id="' + BSH + '"]').length > 0, "Beersheba tag in Genesis 22:19");
    x.B.selectEntity("l", "beersheba"); await sleep(150); ok(qa(x, '#panel .detail[data-stable-id="' + BSH + '"]').length === 1 && x.B.geo.markers().length >= 0, "Beersheba Detail opens"); x.B.selectEntity("l", "gerar"); await sleep(150); ok(qa(x, '#panel .detail[data-stable-id="' + GER + '"]').length === 1, "Gerar Detail opens"); clean(x);
  });
  t("VG-08", "when explicitly published + publishable, Region becomes reader-visible (gate is the only switch; nothing auto-approves)", async function () {
    var x = await load({ post: open }, "#exo-17:8"); await sleep(200); ok(x.B.store.visible(AML) && x.B.store.list().some(function (e) { return e.stable_id === AML; }), "Amalek in reader list when both flags are true"); ok(qa(x, "#verses .tag.rgn").length > 0, "Amalek tag appears in Exodus 17:8"); clean(x);
  });
  t("VG-09", "fail-closed on a missing flag: publishable absent → still hidden", async function () {
    var x = await load({ post: "var R=window.BVC_PROJECTION.regions;Object.keys(R).forEach(function(k){R[k].reader.published=true;delete R[k].activation.publishable;});" }, "#exo-17:8"); await sleep(200); ok(!x.B.store.visible(AML) && !qa(x, "#verses .tag.rgn").length, "hidden without activation.publishable"); clean(x);
  });
  t("VG-10", "projection.research.js is unmodified (hash) and no records were deleted", async function () {
    ok(await sha("data/projection.research.js") === SHA.projection, "projection.research.js hash unchanged"); var x = await load(); ok(Object.keys(x.B.data.regions).length === 2 && Object.keys(x.B.data.places).length >= 2, "all projection records still loaded"); clean(x);
  });

  var hide = function (sid) { return 'window.BVC_PROJECTION.places["' + sid + '"].activation.publishable=false;'; };
  t("VG-11", "Map: a hidden entity never renders a marker (visible control still does)", async function () {
    var a = await load({}, "#gen-22:19"); await sleep(150); ok(a.B.geo.markers().length > 0, "control: visible Beersheba has markers"); clean(a);
    var x = await load({ post: hide(BSH) }, "#gen-22:19"); await sleep(150); ok(!x.B.store.visible(BSH) && x.B.geo.markers().length === 0, "hidden Beersheba: no marker for the passage"); x.B.selectEntity("l", "beersheba"); await sleep(120); ok(x.B.geo.markers().length === 0 && !qa(x, "svg.gmap g.gm").length, "even when selected directly, no marker/label is drawn");
    ok(x.B.data.places.beersheba.research.spatial.sites.length > 0, "canonical spatial data preserved"); clean(x);
  });
  t("VG-12", "Related: a hidden target is never exposed as a related item; canonical relation data is preserved", async function () {
    var a = await load({}, "#gen-22:19"); ok(a.B.boundRelations(BSH).some(function (r) { return r.sid === GER; }), "control: Gerar is a related item of Beersheba"); a.B.selectEntity("l", "beersheba"); await sleep(120); ok(qa(a, '#panel [data-related-entity="' + GER + '"]').length === 1, "control: related pill rendered"); clean(a);
    var x = await load({ post: hide(GER) }, "#gen-22:19"); x.B.selectEntity("l", "beersheba"); await sleep(150);
    ok(!x.B.boundRelations(BSH).some(function (r) { return r.sid === GER; }) && !qa(x, '#panel [data-related-entity="' + GER + '"]').length, "hidden Gerar not offered from Beersheba");
    ok(x.B.relAdjacency()[BSH] && x.B.relAdjacency()[BSH][GER], "canonical relation adjacency still holds the Gerar link"); ok(x.B.data.places.beersheba.research.relations.length > 0 && !qa(x, '#panel [data-part="related-entities"]').some(function (e) { return e.textContent.indexOf("그랄") >= 0; }), "no hidden-target name in the related list"); clean(x);
  });

  (async function () { var res = []; for (var c of T) { var pass = true, err = ""; try { await Promise.race([c.fn(), new Promise(function (_, reject) { setTimeout(function () { reject(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err }); } var p = res.filter(function (r) { return r.pass; }).length; window.BVC_VG_QA = { pass: p, total: res.length, results: res }; var el = document.createElement("div"); el.id = "vg-qa-report"; el.className = "qa"; document.body.appendChild(el); el.textContent = "VISIBILITY_GATE_QA " + p + "/" + res.length + (p === res.length ? " PASS" : " FAIL") + "\n" + res.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : ""); }).join("\n"); })();
})();
