// Reference Layer (trusted external map sources) — app-side checks. Run with index.html?qa=rf (dev mode only).
// Data/regeneration/trust checks live in tools/reference/test_reference.py; this file verifies how the app consumes the registry.
(function () {
  "use strict";
  if (!/[?&]qa=rf/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, J = JSON.stringify;
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); }, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function boot(html, hash) { var url = URL.createObjectURL(new Blob([html], { type: "text/html" })) + (hash || "#gen-22:19"); return new Promise(function (res) { var f = document.createElement("iframe"); f.style.cssText = "width:1500px;height:900px;border:0"; f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 250); }; f.src = url; host.appendChild(f); }); }
  // post: JS inserted right after the generated registry script (can override the data before app.js runs); drop: remove a data script entirely
  function load(o, hash) { o = o || {}; return fetch("index.html").then(function (r) { return r.text(); }).then(function (h) { h = h.replace("<head>", '<head><base href="' + location.origin + '/">'); if (o.post) h = h.replace('<script src="data/reference.features.js"></script>', '<script src="data/reference.features.js"></script><script>' + o.post + "</script>"); if (o.post2) h = h.replace('<script src="data/reference.bindings.js"></script>', '<script src="data/reference.bindings.js"></script><script>' + o.post2 + "</script>"); (o.drop || []).forEach(function (s) { h = h.replace('<script src="data/' + s + '"></script>', ""); }); return boot(h, hash); }); }
  function clean(x) { x.f.remove(); }
  function qa(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function cam(x, lon, lat, w) { x.B.ui.gcam = { x: lon, y: x.B.geo.GEO.yOf(lat), w: w }; x.B.zoomBy(1); }
  function geo(x) { return qa(x, "svg.gmap").length; }
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("RF-B01", "registry is loaded: every source active, gates open, attribution comes from the active sources", async function () {
    var x = await load(); var S = x.B.refSources; ok(S && S.sources.length === 6 && S.sources.every(function (s) { return s.active && s.status === "PASS"; }), "6 active validated sources"); ok(Object.keys(S.gates).every(function (g) { return S.gates[g] === true; }), "all gates open");
    ok(S.research_authority === false && S.policy.per_record_human_review === false && S.policy.name_only_merge === false, "policy: source-level trust, no research authority");
    ok(x.d.querySelector('[data-part="map-attribution"]') && x.d.querySelector('[data-part="map-attribution"]').textContent.indexOf("Natural Earth") >= 0 && /Mapzen/.test(x.d.querySelector('[data-part="map-attribution"]').textContent), "attribution line visible"); ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
  });
  t("RF-B02", "bulk reference features render as a reference layer with their original Natural Earth identity", async function () {
    var x = await load(); var F = x.B.refFeatures; ok(F && F.count === 867 && F.research_authority === false, "867 ingested features"); x.B.ui.mapDisplay.modernNames = true; cam(x, 35.2, 31.8, 3.4); await sleep(150);
    var bulk = qa(x, '.gm-ref[data-ref-source="NE-POPULATED-PLACES"]'); ok(bulk.length > 0, "bulk features drawn at regional zoom"); ok(bulk.every(function (e) { return /^NE-PP-\d+$/.test(e.dataset.ref) && e.dataset.refFid === e.dataset.ref.replace("NE-PP-", "") && e.dataset.refKind === "modern"; }), "original feature id preserved on the element");
    ok(qa(x, ".gm-ref-layer").every(function (e) { return e.dataset.role === "reference-names-not-research"; }), "drawn inside the reference-not-research layer"); ok(!qa(x, '.gm-ref[data-ref-source] [data-stable-id], .gm-ref[data-ref-source][data-stable-id]').length, "no research stable_id on reference features");
    var cur = F.features.filter(function (f) { return f.cur; })[0]; ok(!x.B.refLabelList().some(function (l) { return l.source_feature_id === cur.fid; }), "a feature the curated layer already draws is not drawn twice"); clean(x);
  });
  t("RF-B03", "research layer is untouched: same markers, entities and Detail with and without the reference registry", async function () {
    var a = await load(), b = await load({ drop: ["reference.sources.js", "reference.features.js"] }); cam(a, 34.84, 31.245, 3.25); cam(b, 34.84, 31.245, 3.25); await sleep(150);
    var m = function (x) { return x.B.geo.markers().map(function (k) { return k.id + "@" + k.lat + "," + k.lon; }).join("|"); }; ok(m(a) === m(b) && m(a).length > 0, "research markers identical"); ok(J(a.B.store.list().map(function (e) { return e.stable_id; })) === J(b.B.store.list().map(function (e) { return e.stable_id; })), "entity store identical");
    var core = function (x) { return qa(x, "g.gm").map(function (g) { return g.dataset.stableId + ":" + (g.textContent || ""); }).join("|"); }; ok(core(a) === core(b), "research labels identical"); ok(b.B.refSources === null && qa(b, ".gm-ref").length >= 0, "without the registry the app behaves as before"); a.f.remove(); clean(b);
  });
  t("RF-B04", "a disabled source drops out of the map (modern places, terrain, hydrology) without touching the rest", async function () {
    var x = await load({ post: "window.JBC_REFERENCE_SOURCES.gates.names_modern=false;window.JBC_REFERENCE_SOURCES.gates.hydrology=false;window.JBC_REFERENCE_SOURCES.gates.terrain=false;" }); cam(x, 35.2, 31.8, 3.4); await sleep(200);
    ok(!qa(x, '.gm-ref[data-ref-source]').length && !qa(x, ".gm-ref-modern").length, "no modern reference names"); ok(!qa(x, ".gm-terrain-tiles").length, "no terrain tiles"); ok(qa(x, ".gm-ref-water,.gm-ref-region").length >= 0 && x.B.geo.markers().length > 0, "research markers and physical names remain"); ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
    var y = await load(); cam(y, 35.2, 31.8, 3.4); await sleep(200); ok(qa(y, ".gm-terrain-tiles").length > 0 || y.B.refSources.gates.terrain, "enabled again: terrain present"); clean(y);
  });
  t("RF-B05", "label defaults: biblical, ancient, external and modern labels are ON; each can be turned off; the master toggle keeps its behaviour", async function () {
    var x = await load(), D = x.B.ui.mapDisplay; ok(D.labels === true && D.ancientRef === true && D.modernNames === true && !("externalRef" in D) && !("allLabels" in D), "defaults: biblical, ancient, modern ON; no source-based or all-names option");
    ok(qa(x, '[data-map-layer="modernNames"]')[0].checked && !qa(x, '[data-map-layer="externalRef"]').length, "settings panel shows modern checked; no external-source toggle");
    cam(x, 35.2, 31.8, 3.4); await sleep(150); ok(qa(x, ".gm-ref-modern").length > 0 && qa(x, '.gm-ref[data-ref-source]').length > 0, "default: modern reference names drawn"); ok(qa(x, "g.gm text").length > 0, "biblical names drawn");
    ok(x.B.refFeatures.count === 867 && x.B.refSources.research_authority === false, "all 867 features and the registry are preserved");
    D.modernNames = false; x.B.render(); await sleep(120); ok(!qa(x, ".gm-ref-modern").length, "modern OFF: no modern reference names (user can disable)");
    D.modernNames = true; x.B.render(); await sleep(120); ok(qa(x, ".gm-ref-modern").length > 0, "modern ON again: modern reference names drawn");
    D.ancientRef = false; D.modernNames = false; x.B.render(); await sleep(120); ok(!qa(x, ".gm-ref").length, "ancient/modern/external OFF: no reference names"); ok(qa(x, "g.gm").length > 0, "biblical research markers remain"); clean(x);
  });
  t("RF-B06", "reference features are not selectable entities and never enter search or the research store", async function () {
    var x = await load(); x.B.openSearch("Jerusalem"); await sleep(100); ok(!qa(x, '#search-results [data-entity-id^="NE-PP-"]').length, "not in the explorer"); ok(!x.B.store.list().some(function (e) { return /^NE-PP-/.test(e.stable_id); }), "not in the shared store"); clean(x);
  });

  // ---- external reference auto-bind (CROSS_REFERENCE_NOT_MERGE) ----
  var AML = "JBC-CR-PLACE-AMALEK-001", ACH = "JBC-CR-PLACE-ACHAIA-001", GER = "JBC-CR-PLACE-GERAR-001", BSH = "JBC-CR-PLACE-BEERSHEBA-001";
  t("RF-B07", "bindings are cross-references only: external layer, REFERENCE_ONLY, allowed match rules, name-only stays VERIFY", async function () {
    var x = await load(), R = x.B.refBindings; ok(R && R.role === "CROSS_REFERENCE_NOT_MERGE" && R.research_authority === false, "bindings projection loaded, no research authority");
    ok(R.policy.external_coordinate_replaces_internal === false && R.policy.external_geometry_becomes_internal === false && R.policy.external_media_internal_promotion === false && R.policy.name_only_match === "VERIFY", "spatial/media safety policy flags");
    var all = []; Object.keys(R.bindings).forEach(function (k) { R.bindings[k].bound.forEach(function (b) { all.push(b); }); });
    ok(all.length >= 7 && all.every(function (b) { return b.layer === "EXTERNAL_REFERENCE" && b.authority === "REFERENCE_ONLY" && b.research_authority === false && b.match.cross_reference_not_merge === true && /^(explicit_external_id_crosswalk|exact_stable_binding|approved_alias_crosswalk|explicit_source_identity)$/.test(b.match.rule); }), "every bound entry: external layer, reference-only, listed match rule");
    var bs = R.bindings[BSH]; ok(bs && bs.bound.length === 0 && bs.verify.length === 1 && bs.verify[0].match.rule === "name_only" && bs.verify[0].state === "VERIFY", "Beersheba and Natural Earth 'Beer Sheva' is a name-only match: VERIFY, not bound");
    ok(R.bindings[AML].bound.some(function (b) { return b.ext_id === "ab95484" && b.kind === "ancient"; }) && R.bindings[ACH].bound.some(function (b) { return b.ext_id === "aef4242"; }) && R.bindings[GER].bound.length === 3, "Amalek / Achaia / Gerar explicit declared ids bound"); clean(x);
  });
  t("RF-B08", "unregistered source = identifiers only: no external coordinate/geometry is rendered or promoted", async function () {
    var x = await load(), R = x.B.refBindings, A = R.bindings[AML].bound; ok(A.every(function (b) { return b.bind_status === "BOUND_ID_ONLY" && b.source_trust === "UNREGISTERED_SOURCE"; }), "OpenBible is not a registered trusted source: id-only");
    var pt = A.filter(function (b) { return b.ext_id === "m6da23a"; })[0]; ok(pt.coordinates && pt.coordinates.render === false && pt.coordinates.semantics === "REPRESENTATIVE_POINT" && pt.coordinates.render_role === "REFERENCE_ONLY_NEVER_INTERNAL_COORDINATE", "representative point carried as reference only, not rendered");
    var g = A.filter(function (b) { return b.kind === "geometry"; })[0]; ok(g && g.geometry.embedded === false && g.geometry.render === false && g.geometry.may_become_internal_geometry === false, "isoband geometry not embedded / not rendered / never internal");
    ok(x.B.boundExternalLabels().length === 0 && !qa(x, ".gm-ref-ext").length, "no bound-external label is drawn without a trusted data source");
    var rec = x.B.data.regions[AML], rr = rec && rec.research; ok(rr && rr.coordinates === null && rr.spatial.primary.marker.render === false && rr.spatial.reference_only.external_geometry.rendered === false, "internal Amalek research record unchanged: no coordinate, no marker"); clean(x);
  });
  t("RF-B09", "Detail keeps the source boundary: internal research and external reference are separate sections", async function () {
    var x = await load({}, "#exo-17&e=rgn." + AML); await sleep(150); var d = x.d.querySelector('#panel .detail[data-stable-id="' + AML + '"]'); ok(d, "Amalek Detail open");
    var ext = d.querySelector('[data-part="external-reference"]'); ok(ext && ext.dataset.layer === "EXTERNAL_REFERENCE" && ext.dataset.researchAuthority === "false" && /별개/.test(ext.textContent), "external section is labelled as separate / not research");
    ok(!d.querySelector('[data-part="verify-hold"]').contains(ext) && !d.querySelector('[data-part="research"]').contains(ext), "external section is outside the internal research sections");
    ok(ext.querySelectorAll("[data-ext-ref]").length === 3 && /Ain el Qudeirat/.test(ext.textContent) && /대표 기준점/.test(ext.textContent) && /지도에 표시하지 않음/.test(ext.textContent), "external items listed with representative-point caveat and not-on-map note");
    var vh = d.querySelector('[data-part="verify-hold"]'); ok(vh.querySelector('[data-verify="VERIFY-AML-01"]') && vh.querySelector('[data-hold="exact_Amalek_polygon"]'), "internal VERIFY/HOLD identity preserved in non-visible metadata");
    ok(!/VERIFY-AML-01|exact_Amalek_polygon/.test(vh.textContent), "Reader UI does not expose raw VERIFY/HOLD codes"); clean(x);
    var y = await load("#gen-22:19"); y.B.selectEntity("l", "beersheba"); await sleep(120); var bd = y.d.querySelector('#panel .detail[data-research="1"]'); ok(bd, "Beersheba Detail"); var v = bd.querySelector('[data-part="external-reference"] [data-bind-status="VERIFY"]'); ok(v && /확인이 필요/.test(v.textContent) && !/연결됨/.test(v.textContent), "name-only match shown as needing confirmation, not as connected");
    ok(!/Beer Sheva/.test(bd.querySelector('[data-part="location"]').textContent), "internal location text not altered by the external name"); clean(y);
  });
  t("RF-B10", "a registered, validated external record becomes a secondary reference-label candidate and never replaces the internal coordinate", async function () {
    var fx = '(function(){var F=window.JBC_REFERENCE_FEATURES.features.filter(function(f){return String(f.fid)==="1159130717";})[0];window.__feat=F;var B=window.JBC_REFERENCE_BINDINGS;B.bindings["JBC-CR-PLACE-BEERSHEBA-001"].bound.push({ref_id:"XTEST-NE-PP-"+F.fid,layer:"EXTERNAL_REFERENCE",authority:"REFERENCE_ONLY",research_authority:false,provider:"Natural Earth",kind:"populated_place",ext_id:String(F.fid),name:"브엘세바(참고)",url:null,role:"external_modern_reference",source_id:"NE-POPULATED-PLACES",source_trust:"REGISTERED_ACTIVE",bind_status:"BOUND",match:{rule:"explicit_external_id_crosswalk",cross_reference_not_merge:true},coordinates:{lat:F.lat,lon:F.lon,semantics:"MODERN_POPULATED_PLACE",render:true,render_role:"REFERENCE_ONLY_NEVER_INTERNAL_COORDINATE"},geometry:null,media:null,provenance:{}});})();';
    var x = await load({ post2: fx }); x.B.ui.mapDisplay.modernNames = false; cam(x, 34.8, 31.25, 3.4); await sleep(150); var L = x.B.boundExternalLabels(); ok(L.length === 1 && L[0].layer === "EXTERNAL_REFERENCE" && L[0].bound_to === BSH, "bound external label produced");
    var g = qa(x, '.gm-ref[data-ref-layer="EXTERNAL_REFERENCE"]'); ok(g.length === 0 || (g.length === 1 && g[0].dataset.boundTo === BSH && !g[0].dataset.stableId), "if visible, it is drawn only in the external layer and never as a research marker; collision suppression is allowed"); if (g.length) ok(+g[0].querySelector("text").getAttribute("font-size") > 0, "visible external label has a size");
    var R = x.B.data.places.beersheba; ok(R.coordinates === null || R.coordinates === undefined, "internal Beersheba coordinate untouched (still none)"); ok(x.B.geo.markers().every(function (m) { return Math.abs(m.lat - x.w.__feat.lat) > 1e-9 || Math.abs(m.lon - x.w.__feat.lon) > 1e-9; }), "no research marker was created at the external point");
    x.B.ui.mapDisplay.ancientRef = false; x.B.ui.mapDisplay.modernNames = false; x.B.render(); await sleep(100); ok(!qa(x, '.gm-ref[data-ref-layer="EXTERNAL_REFERENCE"]').length, "external labels follow ancient/modern settings"); clean(x);
  });
  t("RF-B11", "label hierarchy: external labels rank below biblical, ancient region/water labels and have a lighter level", async function () {
    var x = await load(); var L = x.B.labelLevels, P = x.B.refPriority; ok(L && L.XA.px <= L.L3.px && L.XM.px <= L.L4.px && L.XA.weight <= 450 && L.XM.weight <= 450, "external levels are not larger/heavier than biblical/ancient levels");
    ok(P("WM") < P("L0") && P("L0") < P("Wm") && P("Wm") < P("L3") && P("L3") < P("XA") && P("XA") < P("L4") && P("L4") < P("XM") && P("XM") < P("L5"), "collision priority: water/region > ancient ref > bound external ancient > modern > bound external modern > detail"); clean(x);
  });

  (async function () { var res = []; for (var c of T) { var pass = true, err = ""; try { await Promise.race([c.fn(), new Promise(function (_, reject) { setTimeout(function () { reject(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err }); } var p = res.filter(function (r) { return r.pass; }).length; window.BVC_RF_QA = { pass: p, total: res.length, results: res }; var el = document.createElement("div"); el.id = "rf-qa-report"; el.className = "qa"; document.body.appendChild(el); el.textContent = "REFERENCE_LAYER_SOURCE_TRUST_QA " + p + "/" + res.length + (p === res.length ? " PASS" : " FAIL") + "\n" + res.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : ""); }).join("\n"); })();
})();
