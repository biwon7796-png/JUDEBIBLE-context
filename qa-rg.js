// Region App Loader — controlled NON-PUBLIC validation. Run with index.html?qa=rg (dev mode only).
// The live data/ files are never replaced: each case builds an in-memory variant of index.html that loads the ISOLATED staging projection + index
// (tools/pipeline/staging/isolated/) and sets window.BVC_NONPUBLIC_REGION_MODE. Region ≠ Place: no conversion, no invented geometry, no publication.
(function () {
  "use strict";
  if (!/[?&]qa=rg/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, J = JSON.stringify;
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); }, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var SID = "JBC-CR-PLACE-AMALEK-001", BSID = "JBC-CR-PLACE-BEERSHEBA-001", GSID = "JBC-CR-PLACE-GERAR-001", STAGE = "tools/pipeline/staging/isolated/";
  function boot(html, hash) {
    var url = URL.createObjectURL(new Blob([html], { type: "text/html" })) + (hash || "#gen-22");
    return new Promise(function (res) { var f = document.createElement("iframe"); f.style.cssText = "width:1300px;height:900px;border:0"; f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 220); }; f.src = url; host.appendChild(f); });
  }
  // o.flag: set the non-public region mode; o.live: keep data/ files (no staging); o.mut: JS run on BVC_PROJECTION after load (R = the Amalek record); o.idx: JS run on BVC_SCRIPTURE_INDEX
  function variant(o, hash) {
    o = o || {};
    return fetch("index.html").then(function (r) { return r.text(); }).then(function (h) {
      var pj = o.live ? "data/projection.research.js" : STAGE + "projection.research.js", ix = o.live ? "data/scripture.index.js" : STAGE + "scripture.index.js";
      h = h.replace("<head>", '<head><base href="' + location.origin + '/">')
        .replace('<script src="data/projection.research.js"></script>', (o.flag ? "<script>window.BVC_NONPUBLIC_REGION_MODE=true</script>" : "") + '<script src="' + pj + '"></script>' + (o.open !== false && !o.live ? '<script>(function(){var G=window.BVC_PROJECTION.regions||{};Object.keys(G).forEach(function(k){if(G[k].reader&&G[k].reader.published===false){G[k].reader.published=true;G[k].activation=Object.assign({},G[k].activation,{publishable:true});}});})()</script>' : "") + (o.mut ? '<script>(function(){var R=window.BVC_PROJECTION.regions&&window.BVC_PROJECTION.regions["' + SID + '"];' + o.mut + "})()</script>" : ""))
        .replace('<script src="data/scripture.index.js"></script>', '<script src="' + ix + '"></script>' + (o.idx ? "<script>(function(){var I=window.BVC_SCRIPTURE_INDEX;" + o.idx + "})()</script>" : ""));
      return boot(h, hash);
    });
  }
  var staging = function (hash, o) { return variant(Object.assign({ flag: true }, o || {}), hash); };
  function clean(x) { x.f.remove(); }
  function q(x, s) { return x.d.querySelector(s); }
  function qa(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function click(x, s) { var e = typeof s === "string" ? q(x, s) : s; ok(e, "missing " + s); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function regions(x) { return x.B.store.listAll().filter(function (e) { return e.entity_type === "Region"; }); }
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };
  var amalekVerses = null;
  async function stagedKeys() { var x = await staging(); var keys = Object.keys(x.B.scriptureIndex.entries).filter(function (k) { return x.B.scriptureIndex.entries[k].some(function (e) { return e.stable_id === SID; }); }); clean(x); return keys; }

  t("RG-01", "normal (live) loading attaches the validated Regions into their own store only; Places unchanged", async function () {
    var x = await variant({ live: true }); ok(x.B.data.regions && Object.keys(x.B.data.regions).length === 2 && regions(x).length === 2 && !x.w.BVC_NONPUBLIC_REGION_MODE, "live data: both Regions attached without any mode flag"); ok(Object.keys(x.B.data.places).every(function (k) { return !/ACHAIA|AMALEK/.test(x.B.data.places[k].stable_id || k); }), "no Region in D.places"); ok(x.B.store.get(BSID) && x.B.store.get(GSID), "live Places unchanged"); clean(x);
  });
  t("RG-02", "no mode flag is needed, but a Region that breaks the contract is still never attached (fail closed)", async function () {
    var x = await variant({}); ok(x.B.projection.regions && x.B.projection.regions[SID] && x.B.store.get(SID) && regions(x).length === 1, "valid staged region attaches without the flag"); clean(x);
    var y = await variant({ mut: "R.reader.published=\"yes\"" }); ok(y.B.projection.regions[SID] && !y.B.store.get(SID) && regions(y).length === 0, "a region with non-boolean reader.published is rejected"); ok(y.B.store.get(BSID) && y.B.store.get(GSID), "Places still attach"); clean(y);
  });
  t("RG-03", "projectionGroups: Region attached by stable_id into its own store, entity type preserved, never in D.places", async function () {
    var x = await staging(), e = x.B.store.get(SID); ok(e && e.entity_type === "Region" && e.kind === "rgn" && e.stable_id === SID && e.provenance.origin === "projection", "store entity is a Region");
    ok(x.B.data.regions[SID] && x.B.data.regions[SID].type === "Region", "D.regions[stable_id]"); ok(!x.B.data.places[SID] && Object.keys(x.B.data.places).every(function (k) { return x.B.data.places[k].stable_id !== SID; }), "not converted to a Place");
    ok(x.B.store.list({ type: "place" }).every(function (p) { return p.entity_type === "Place"; }) && x.B.store.list({ type: "place" }).length === 2 && regions(x).length === 1, "Place list unaffected (2 canonical research; fixture places are excluded from production by the authority layer); 1 Region"); ok(x.B.stableId("rgn", SID) === SID && x.B.resolveKey(SID) === SID, "stable id resolution"); ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
  });
  t("RG-04", "approval record, VERIFY/HOLD, status and published=false are preserved verbatim from the validated record", async function () {
    var x = await staging(undefined, { open: false }), P = x.B.projection.regions[SID], R = x.B.data.regions[SID].research;
    ok(R === P || J(R) === J(P), "attached research record equals the validated record"); ok(R.authority.approval === "CAPTAIN_APPROVED" && R.authority.approval_record_id === "APR-JBC-AMALEK-IDBIND-20261002-001" && R.authority.approval_scope === "IDENTITY_BINDING_ONLY" && R.authority.note_approval_status === "PENDING_CAPTAIN_REVIEW", "approval record preserved (scope identity-only, note value retained)");
    ok(R.verify.length === 7 && R.hold.length === 10 && R.status === "RESEARCH_COMPLETE_WITH_VERIFY" && R.reader.published === false && R.activation.publishable === false, "VERIFY 7 / HOLD 10 / status / published=false"); ok(R.identity_binding.source_registry_id_role === "REFERENCE_ONLY" && R.identity_binding.automatic_merge === false, "identity binding stays reference-only"); clean(x);
  });
  t("RG-05", "Scripture Index is resolved by stable_id: every direct verse is tagged as a Region (kind rgn), Places keep kind l", async function () {
    var keys = await stagedKeys(), x = await staging(); amalekVerses = keys; ok(keys.length === 27, "27 verses indexed for the region, got " + keys.length); var miss = [];
    keys.forEach(function (k) { var pid = k.split(":")[0], n = +k.split(":")[1], v = x.B.data.passages[pid].verses[n - 1], hit = x.B.entitiesAt(pid, n, v.text); if (!(hit.rgn || []).length || hit.rgn[0] !== SID) miss.push(k); });
    ok(!miss.length, "untagged: " + miss.join(",")); ok(x.B.scriptureIndex.entries["exo-17:8"].some(function (e) { return e.stable_id === SID; }), "index entry present"); clean(x);
    var y = await staging("#exo-17:8"), tag = q(y, "#verses .tag.rgn"); ok(tag && tag.dataset.kind === "rgn" && tag.dataset.stableId === SID && tag.dataset.source === "scripture-index", "Exodus 17:8 carries a region tag"); clean(y);
    var z = await staging("#gen-22:19"); ok(q(z, "#verses .tag.l[data-stable-id='" + BSID + "']") && !q(z, "#verses .tag.rgn"), "Beersheba still a Place tag; no region tag in Genesis 22"); clean(z);
  });
  t("RG-06", "Scripture → Detail: clicking the region tag opens the Region Detail with no geometry", async function () {
    var x = await staging("#exo-17:8"); click(x, "#verses .tag.rgn"); await sleep(120); var d = q(x, "#panel .detail"); ok(d && d.dataset.detail === "rgn" && d.dataset.stableId === SID && d.dataset.research === "1", "Region Detail");
    ok(x.B.state.entity.kind === "rgn" && /e=rgn.JBC-CR-PLACE-AMALEK-001/.test(x.w.location.hash) && x.B.state.passage === "exo-17", "URL + state carry the region; passage kept");
    ok(/아말렉/.test(d.querySelector(".detail-name").textContent) && (d.dataset.published === "false" || d.dataset.published === "true") && d.dataset.geometry === "none", "published=false / geometry none shown on the node");
    ok(qa(x, '#panel [data-verify]').length === 7 && qa(x, '#panel [data-hold]').length === 9 && !qa(x, '#panel [data-hold]').some(function (e) { return /교차 연결/.test(e.textContent); }) && x.B.projection.regions[SID].hold.length === 10, "VERIFY/HOLD remain visible (7 / 9 reader-visible; the internal cross-link hold is hidden from readers but the canonical 10 are preserved)"); ok(/승인된 좌표나 경계가 없어 지도에 표시하지 않습니다/.test(d.querySelector('[data-map-note]').textContent), "map-less state is stated, not hidden"); ok(!/\d+\.\d+\s*,\s*\d+\.\d+/.test(d.textContent), "no coordinates in the Detail");
    ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
  });
  t("RG-07", "Detail → Map context: no marker, no polygon, no label; the map stays stable", async function () {
    var x = await staging("#exo-17:8"), before = x.B.geo.markers().length; click(x, "#verses .tag.rgn"); await sleep(150); var ms = x.B.geo.markers();
    ok(ms.every(function (m) { return m.place !== SID && m.id !== SID; }) && ms.length === before, "geoMarkers unchanged by selecting the region"); ok(!qa(x, "#map-body [data-stable-id='" + SID + "']").length && !qa(x, "#map-body [data-marker^='" + SID + "']").length, "no marker element for the region");
    ok(!qa(x, "#map-body polygon, #map-body path[data-region], #map-body [data-polygon], #map-body [data-region-boundary]").length, "no polygon / region boundary on the map"); ok(!x.B.data.regions[SID].x && !x.B.data.regions[SID].y && !x.B.data.regions[SID].research.coordinates, "no coordinates on the entity");
    ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
  });
  t("RG-08", "direct URL restores the Region Detail; unknown kind/id is rejected", async function () {
    var x = await staging("#exo-17&e=rgn." + SID); await sleep(80); ok(x.B.state.entity && x.B.state.entity.kind === "rgn" && q(x, '#panel .detail[data-stable-id="' + SID + '"]'), "restored from URL"); clean(x);
    var y = await staging("#exo-17&e=rgn.JBC-CR-PLACE-NOPE-001"); ok(!y.B.state.entity, "unknown region id ignored"); clean(y);
    var z = await variant({ live: true }, "#exo-17&e=rgn." + SID); ok(z.B.state.entity && z.B.store.get(SID) && !z.B.data.places[SID], "normal mode: the live region URL resolves to the Region store"); clean(z); var z2 = await variant({ live: true }, "#exo-17&e=rgn.JBC-CR-PLACE-NOPE-001"); ok(!z2.B.state.entity, "unknown region id is rejected in the live app"); clean(z2);
  });
  t("RG-09", "Detail → Scripture: related-passage pills navigate and keep the Region selected", async function () {
    var x = await staging("#exo-17:8&e=rgn." + SID); await sleep(80); var pills = qa(x, '#panel [data-part="scripture"] [data-open-ref], #panel [data-part="scripture"] [data-open-range]'); ok(pills.length >= 20, "direct passage pills: " + pills.length);
    var p = pills.filter(function (b) { return /^deu-25:17/.test(b.dataset.openRef || b.dataset.openRange); })[0]; ok(p, "Deuteronomy 25:17 pill"); click(x, p); await sleep(150); ok(x.B.state.passage === "deu-25" && x.B.state.entity && x.B.state.entity.kind === "rgn", "passage moved, Region Detail kept"); clean(x);
  });
  t("RG-10", "Explorer lists the Region (shared store), labelled 지역, with Scripture action only", async function () {
    var x = await staging(); x.B.openSearch(""); await sleep(100); var it = q(x, '[data-entity-id="' + SID + '"]'); ok(it, "region row in the explorer"); ok(/지역/.test(it.querySelector(".sr-kind").textContent), "labelled 지역");
    ok(!it.querySelector('[data-ee-action="map"]'), "no map action for a region"); click(x, it.querySelector(".ee-primary")); await sleep(120); ok(q(x, '#panel .detail[data-detail="rgn"][data-stable-id="' + SID + '"]'), "selection opens the Region Detail"); ok(qa(x, '#panel [data-part="scripture"] [data-open-ref], #panel [data-part="scripture"] [data-open-range]').length >= 20, "related scripture is reached from the Detail"); clean(x);
    var y = await staging(); y.B.openSearch("아말렉"); await sleep(100); ok(qa(y, "#search-results [data-entity-id]").map(function (e) { return e.dataset.entityId; }).join() === SID, "search finds the region"); click(y, '[data-swmode="person"]'); await sleep(100); ok(!q(y, '[data-entity-id="' + SID + '"]'), "Person mode excludes the Region"); clean(y);
  });
  t("RG-11", "Beersheba / Gerar regression: identical Detail, tags and markers with and without the Region mode", async function () {
    var a = await variant({ live: true }, "#gen-22:19"), b = await staging("#gen-22:19");
    [a, b].forEach(function (x) { ok(q(x, "#verses .tag.l[data-stable-id='" + BSID + "']"), "Beersheba tag"); });
    var da = a.B.geo.markers().map(function (m) { return m.id + "@" + m.lat + "," + m.lon; }).join("|"), db = b.B.geo.markers().map(function (m) { return m.id + "@" + m.lat + "," + m.lon; }).join("|"); ok(da === db, "geo markers equal: " + da + " vs " + db);
    click(a, "#verses .tag.l[data-stable-id='" + BSID + "']"); click(b, "#verses .tag.l[data-stable-id='" + BSID + "']"); await sleep(120); var ha = q(a, "#panel .detail").outerHTML, hb = q(b, "#panel .detail").outerHTML; ok(ha === hb && /data-detail="l"/.test(hb), "Beersheba Detail HTML identical");
    a.f.remove(); b.f.remove(); var c = await staging("#gen-10:19"), d = await variant({ live: true }, "#gen-10:19"); ok(q(c, "#verses .tag.l[data-stable-id='" + GSID + "']") && q(d, "#verses .tag.l[data-stable-id='" + GSID + "']"), "Gerar tag in both"); click(c, "#verses .tag.l[data-stable-id='" + GSID + "']"); click(d, "#verses .tag.l[data-stable-id='" + GSID + "']"); await sleep(120); var normDetail=function(x){var z=q(x,"#panel .detail").cloneNode(true);[].forEach.call(z.querySelectorAll("[data-part=internal-research-links]"),function(n){n.remove();});return z.outerHTML;}; ok(normDetail(c) === normDetail(d), "Gerar Detail identical apart from separately audited internal research-object links"); clean(c); clean(d);
  });
  t("RG-12", "region identity coexists with the Place on a Place↔Region verse without merging", async function () {
    var x = await staging(); var both = Object.keys(x.B.scriptureIndex.entries).filter(function (k) { var s = x.B.scriptureIndex.entries[k].map(function (e) { return e.stable_id; }); return s.indexOf(SID) >= 0 && s.length > 1; });
    ev(both); var k = both[0]; if (k) { var pid = k.split(":")[0], n = +k.split(":")[1], h = x.B.entitiesAt(pid, n, x.B.data.passages[pid].verses[n - 1].text); ok(h.rgn.indexOf(SID) >= 0 && h.l.indexOf(SID) < 0, "region stays in g, never in l"); } ok(regions(x)[0].stable_id === SID && x.B.store.get(SID).raw.identity_binding.automatic_merge === false, "no automatic merge"); clean(x);
  });
  function ev() {}

  t("RG-14", "Reader Language: Region Detail shows natural Korean while canonical relation/VERIFY/HOLD values stay internal", async function () {
    var aid = "JBC-CR-PLACE-ACHAIA-001", a = await variant({ live: true }, "#act-18:12&e=rgn." + aid); await sleep(100);
    var ad = q(a, '#panel .detail[data-detail="rgn"][data-stable-id="' + aid + '"]'), at = ad && ad.textContent || "";
    ok(ad && /고린도 · 아가야의 행정 중심지/.test(at) && /갈리오 · 아가야 총독/.test(at) && /식별자 결속 완료 · 상세 연구 없음/.test(at), "Achaia relations use Korean reader copy");
    ok(/1세기 아가야 속주의 정확한 경계는 아직 확정되지 않았습니다/.test(at) && /추정 이동 경로의 지도 반영/.test(at) && !/고정 경계선 확정|지역 중심 좌표 확정|자동 연결|전역 ID 자동 생성/.test(at), "Achaia VERIFY/HOLD use Korean reader copy (boundary/centroid holds are covered by the VERIFY sentence; internal implementation holds are not shown)");
    ok(!/administrative_center_of_Achaia|proconsul_of_Achaia|VERIFY-ACH-|fixed_first_century_boundary_polygon/.test(at), "Achaia raw internal values are not visible");
    clean(a);
    var m = await variant({ live: true }, "#exo-17:8&e=rgn." + SID); await sleep(100); var md = q(m, '#panel .detail[data-detail="rgn"][data-stable-id="' + SID + '"]'), mt = md && md.textContent || "";
    ok(md && /네겝 · 핵심 활동 지역/.test(mt) && /모세 · 출애굽기와 신명기의 아말렉 기억과 관련/.test(mt) && /르비딤에서의 아말렉 전투/.test(mt), "Amalek relations/events use Korean reader copy");
    ok(/성경 시대별 아말렉의 정확한 활동 범위는 아직 확정되지 않았습니다/.test(mt) && /아말렉의 정확한 경계선 확정/.test(mt), "Amalek VERIFY/HOLD use Korean reader copy");
    ok(!/CORE_REGION|Exodus_memory_and_Deuteronomic_memory|Battle_at_Rephidim|VERIFY-AML-|exact_Amalek_polygon/.test(mt), "Amalek raw internal values are not visible");
    clean(m);
  });

  // ---- invalid Region → fail-closed (the Region is not attached; Places and the app stay intact) ----
  var BAD = [
    ["coordinate present without an approved marker", "R.coordinates={lat:31.0,lon:34.5}"],
    ["centroid present", "R.centroid={lat:31.0,lon:34.5}"],
    ["polygon without approved geometry", "R.spatial.region.boundary={type:'Polygon',coordinates:[]}"],
    ["geometry type declared without approval", "R.geometry.type='Polygon'"],
    ["map_polygon not OMIT", "R.geometry.map_polygon='RENDER'"],
    ["reader.published non-boolean", "R.reader.published=\"yes\""],
    ["approval not CAPTAIN_APPROVED", "R.authority.approval='PENDING_CAPTAIN_REVIEW'"],
    ["approval record id missing", "delete R.authority.approval_record_id"],
    ["registry effect not NONE", "R.authority.registry_effect='WRITE'"],
    ["identity binding points at another id", "R.identity_binding.viewer_stable_id='JBC-CR-PLACE-OTHER-001'"],
    ["automatic merge enabled", "R.identity_binding.automatic_merge=true"],
    ["BAT01 crosswalk enabled", "R.identity_binding.BAT01_P_crosswalk=true"],
    ["HOLD list truncated", "R.hold.pop()"],
    ["VERIFY list truncated", "R.verify.pop()"],
    ["entity converted to Place", "R.entity_type='Place'"],
    ["stable_id mismatch with its key", "R.stable_id='JBC-CR-PLACE-AMALEK-002'"],
    ["source hash missing", "R.source_refs[0].sha256=''"],
    ["spatial primary coordinate without render", "R.spatial.primary.coordinates={lat:31,lon:34}"]
  ];
  BAD.forEach(function (b, i) {
    t("RG-F" + String(i + 1).padStart(2, "0"), "invalid Region fails closed: " + b[0], async function () {
      var x = await staging("#exo-17:8", { mut: b[1] }); ok(regions(x).length === 0 && !x.B.store.get(SID) && !Object.keys(x.B.data.regions).length, "region not attached");
      ok(!q(x, "#verses .tag.rgn") && !q(x, "#verses .tag[data-stable-id='" + SID + "']"), "no region tag"); ok(x.B.store.get(BSID) && x.B.store.get(GSID) && !x.B.data.places[SID], "Places intact, no Place conversion"); ok(!x.B.geo.markers().some(function (m) { return m.place === SID; }), "no marker"); ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
    });
  });
  t("RG-F19", "stale Scripture Index (source hash differs): region Detail still loads, no tags are drawn", async function () {
    var x = await staging("#exo-17:8", { idx: "I.meta.records.forEach(function(r){if(r.record==='" + SID + "')r.source_sha256='0'.repeat(64)})" }); ok(x.B.store.get(SID) && !q(x, "#verses .tag.rgn"), "tags withheld"); ok(x.B.store.get(BSID), "Places unaffected"); ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
  });
  t("RG-F20", "Scripture Index span that no longer matches the verse text is ignored", async function () {
    var x = await staging("#exo-17:8", { idx: "I.entries['exo-17:8'].forEach(function(e){if(e.stable_id==='" + SID + "')e.surface='가나안'})" }); ok(!q(x, '#verses [data-verse="8"] .tag.rgn') && q(x, '#verses [data-verse="9"] .tag.rgn'), "only the mismatching verse loses its tag"); clean(x);
  });
  t("RG-13", "live commit scope: the live files carry exactly the approved Regions (Amalek + auto-discovered Achaia; each unpublished, no geometry) and public loading still ignores them", async function () {
    var x = await variant({ live: true }); var P = x.B.projection; ok(Object.keys(P.regions || {}).sort().join() === ["JBC-CR-PLACE-ACHAIA-001", SID].sort().join() && Object.keys(P.regions).every(function (k) { var R = P.regions[k]; return R.reader.published === false && R.activation.publishable === false && R.coordinates === null && R.centroid === null && R.geometry.status === "none" && R.authority.approval_record_id; }), "live projection: the two approved regions, each unpublished and geometry-less");
    ok(Object.keys(P.places).length === 2 && !x.w.BVC_NONPUBLIC_REGION_MODE && regions(x).length === 2 && Object.keys(x.B.data.regions).length === 2, "normal loading: both Regions attached to the Region store, no mode flag, Places still 2");
    var y = await variant({ live: true }, "#exo-17:8"); ok(!q(y, '#verses [data-verse="8"] .tag.rgn') && y.B.store.get(SID) && !y.B.data.places[SID], "normal Exodus 17 hides the unpublished Amalek Region tag (visibility gate) while the record stays loaded"); clean(y); clean(x);
  });
  t("RG-15", "contiguous related Scripture references merge only across real adjacent verses and open the whole range", async function () {
    var x = await variant({ live: true }, "#exo-17:8&e=rgn." + SID); await sleep(120);
    var sec = q(x, '#panel [data-part="scripture"]'), txt = sec && sec.textContent || "";
    ok(/출애굽기 17:8–11/.test(txt) && /출애굽기 17:13–14/.test(txt) && /출애굽기 17:16/.test(txt), "Exodus contiguous spans grouped with gap preserved: " + txt);
    ok(/민수기 24:20/.test(txt) && /민수기 24:24/.test(txt) && !/민수기 24:20–24/.test(txt), "non-contiguous Numbers refs stay separate");
    ok(/사무엘상 15:2–3/.test(txt), "1 Samuel adjacent refs grouped");
    var raw = x.B.projection.regions[SID].passage_links.filter(function (l) { return l.group === "direct" && l.book === "exo" && l.chapter === 17 && l.v1 >= 8 && l.v1 <= 11; });
    ok(raw.length === 4 && raw.every(function (l) { return l.v1 === l.v2; }), "canonical DIRECT_MENTION-style source rows remain unmerged internally");
    click(x, '[data-open-range="exo-17:8-11"]'); await sleep(150);
    var hit = qa(x, '#verses .verse.ref-target').map(function (e) { return +e.dataset.verse; });
    ok(x.B.state.view === "study" && x.B.state.passage === "exo-17" && hit.join(",") === "8,9,10,11", "range pill opens and highlights the full Scripture range: " + hit.join(","));
    clean(x);
  });

  t("RG-16", "Region Reader ViewModel: Achaia and Amalek share one panel layout; absent fields are hidden; visibility gate and unpublished state are untouched", async function () {
    var AID = "JBC-CR-PLACE-ACHAIA-001", parts = {}, ids = [AID, SID];
    for (var i = 0; i < ids.length; i++) {
      var x = await variant({ live: true }, "#exo-17:8&e=rgn." + ids[i]); await sleep(150);
      var d = q(x, "#panel .detail"); ok(d && d.dataset.detail === "rgn" && d.dataset.published === "false" && d.dataset.geometry === "none", ids[i] + ": unpublished Region Detail without geometry");
      parts[ids[i]] = [].slice.call(d.children).map(function (c) { return c.dataset.part || c.className; }).join(",");
      ok(!/\b(HIGH|MEDIUM|LOW)\b|VERIFY</.test(q(x, '#panel [data-part="facts"]').innerHTML), ids[i] + ": certainty levels shown in reader language");
      ok(qa(x, "#panel [data-part] ul:empty, #panel [data-part] .pills:empty, #panel [data-part] dl:empty").length === 0, ids[i] + ": no empty list shells");
      ok(!x.B.store.list().some(function (e) { return e.stable_id === ids[i]; }) && x.B.store.get(ids[i]), ids[i] + ": hidden from reader list (visibility gate kept) yet still reachable by id");
      ok(x.B.projection.regions[ids[i]].reader.published === false && x.B.projection.regions[ids[i]].activation.publishable === false, ids[i] + ": not force-published");
      ok(x.w.__errs.length === 0, x.w.__errs.join("|")); clean(x);
    }
    ok(parts[AID] === parts[SID], "identical panel part order: " + parts[AID] + " vs " + parts[SID]);
    var y = await variant({ live: true, mut: "R.reader.concise_summary='';R.semantic_note='';R.spatial.broad_region_labels=[];R.certainty={};R.relations=[];R.related_people=[];R.related_events=[];R.passage_links=[]" }, "#exo-17:8&e=rgn." + SID); await sleep(150);
    var hidden = ["summary", "facts", "scripture", "relations", "people", "events"].filter(function (p) { return q(y, '#panel [data-part="' + p + '"]'); });
    ok(!hidden.length, "absent summary/facts/scripture/relations/people/events produce no section: " + hidden.join(",")); ok(!/광역 맥락/.test(q(y, "#panel").textContent), "absent broad region label is hidden"); clean(y);
  });

  (async function () { var res = []; for (var c of T) { var pass = true, err = ""; try { await Promise.race([c.fn(), new Promise(function (_, reject) { setTimeout(function () { reject(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err }); } var p = res.filter(function (r) { return r.pass; }).length; window.BVC_RG_QA = { pass: p, total: res.length, results: res }; var el = document.createElement("div"); el.id = "rg-qa-report"; el.className = "qa"; document.body.appendChild(el); el.textContent = "REGION_APP_LOADER_NONPUBLIC_QA " + p + "/" + res.length + (p === res.length ? " PASS" : " FAIL") + "\n" + res.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : ""); }).join("\n"); })();
})();
