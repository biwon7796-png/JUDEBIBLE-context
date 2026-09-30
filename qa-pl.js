// Obsidian → JudeBible research 파이프라인(브엘세바 + 그랄, 하나의 파이프라인) 브라우저 검증. 실행: index.html?qa=pl (개발 모드 전용).
// node 쪽 산출물(tools/pipeline/out/*.json)과 앱이 실제로 쓰는 생성 파일(data/projection.research.js, data/scripture.index.js)을 대조한다.
(function () {
  "use strict";
  if (!/[?&]qa=pl/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var SID = "JBC-CR-PLACE-BEERSHEBA-001", GSID = "JBC-CR-PLACE-GERAR-001", SRC = "docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md", GSRC = "docs/architecture/그랄/JBC_GERAR_CONNECTED_WORBS_20260930_01.md", OUT = "tools/pipeline/out/";
  function mk(w, h) { var f = document.createElement("iframe"); f.style.cssText = "width:" + (w || 1400) + "px;height:" + (h || 800) + "px;border:0"; return f; }
  function ready(f, res) { f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 150); }; }
  function load(hash, w, h) { return new Promise(function (res) { var f = mk(w, h); ready(f, res); f.src = "index.html" + (hash || ""); host.appendChild(f); }); }
  function variant(edit, hash) { return fetch("index.html").then(function (r) { return r.text(); }).then(function (t) { var html = edit(t.replace("<head>", '<head><base href="' + location.origin + '/">')); return new Promise(function (res) { var f = mk(1400, 800); ready(f, res); f.srcdoc = html; host.appendChild(f); }); }); }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function q(x, sel) { return x.d.querySelector(sel); }
  function qa(x, sel) { return [].slice.call(x.d.querySelectorAll(sel)); }
  function click(x, sel) { var e = typeof sel === "string" ? q(x, sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function guideCur(x) { var c = q(x, '#guide-pane [aria-current="step"]'); return c ? c.dataset.guideStep : null; }
  async function sha(url) { var b = await (await fetch(url)).arrayBuffer(), h = await crypto.subtle.digest("SHA-256", b); return [].map.call(new Uint8Array(h), function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }
  var jget = async function (n, sid) { return (await fetch(OUT + (/^(test-results|run-summary|00-discovery)/.test(n) ? "" : "records/" + (sid || SID) + "/") + n)).json(); };
  var entriesOf = function (idx, sid) { var o = {}; Object.keys(idx.entries).forEach(function (k) { var e = idx.entries[k].filter(function (z) { return z.stable_id === sid; }); if (e.length) o[k] = e; }); return o; };
  var INDEX_KEYS = "gen-21:14,gen-21:31,gen-21:32,gen-21:33,gen-22:19,gen-26:23,gen-26:33,gen-28:10,gen-46:1,gen-46:5";

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("PL-01", "pipeline_artifacts_exist_validation_passed_and_hashes_trace_to_the_source_note", async function (ev) {
    var parsed = await jget("01-parsed.json"), val = await jget("02-validation.json"), norm = await jget("03-normalized.json"), proj = await jget("04-projection-entry.json"), idx = await jget("05-scripture-index.json");
    var srcHash = parsed.source.sha256; ev.push("canonical source sha256=" + srcHash.slice(0, 16) + "… bytes=" + parsed.source.bytes); ev.push("validation ok=" + val.ok + " checks=" + val.checks.length + " errors=" + val.errors.length + " warnings=" + val.warnings.length);
    ok(parsed.source.sha256 === srcHash && norm.record.source_refs[0].sha256 === srcHash && proj.source_refs[0].sha256 === srcHash && idx.meta.source_sha256 === srcHash, "parsed / normalized / projection / index all carry the live source hash");
    ok(val.ok && val.errors.length === 0 && val.checks.length === 35 && val.checks.every(function (c) { return c.ok; }), "validation passed: all 35 checks (media contract V27-V32 + V35 preview resolution, approval V33, identity V34) pass");
    ok(norm.record.stable_id === SID && norm.record.navigation === null && norm.warnings.some(function (w) { return /navigation metadata/.test(w); }), "no navigation metadata invented (absent in the note)");
    var tr = await jget("test-results.json"); ev.push("node pipeline tests=" + tr.passed + "/" + tr.total); ok(tr.verdict === "PASS", "node pipeline tests (golden, provenance, 41 negatives, fail-closed, media, Obsidian syntax) must pass"); ok(tr.results.filter(function (r) { return /^N[0-9]+$/.test(r.id); }).length === 50, "50 negative/fail-closed cases ran");
    var kh = await sha("data/krv.js"), xk = await load(""); ok(xk.B.scriptureIndex.meta.krv_sha256 === kh && xk.B.scriptureIndex.meta.krv_modified === false, "KRV file unchanged since the index was generated"); clean(xk);
  });

  t("PL-02", "the_app_runs_the_generated_projection_and_index_not_hand_written_data", async function (ev) {
    var x = await load("#gen-22:19"), proj = await jget("04-projection-entry.json"), idx = await jget("05-scripture-index.json");
    ok(J(x.B.projection.places[SID]) === J(proj), "running projection entry == generated projection entry"); ok(J(entriesOf(x.B.scriptureIndex, SID)) === J(idx.entries), "running index entries == generated index entries");
    var P = x.B.data.places.beersheba, pv = x.B.store.provenance(); ev.push("store.provenance=" + J(pv)); ok(P.stable_id === SID && P.research && P.research.source_refs[0].sha256 === idx.meta.source_sha256 && pv.index_ok === true && pv.records.length === 2, "shared store trusts the index only when its source hash matches the projection");
    ok(x.B.projection.meta.generated_by.indexOf("tools/pipeline/run.js") === 0 && x.B.projection.meta.records.length === 2 && x.B.projection.meta.records[0].overlay_fields.indexOf("hero_caption") >= 0, "generated header + declared app-overlay fields"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PL-03", "scripture_entity_index_matches_live_KRV_and_tags_only_direct_mention_verses", async function (ev) {
    var x = await load("#gen-22:19"), idx = x.B.scriptureIndex, keys = Object.keys(entriesOf(idx, SID)); ev.push("indexed verses=" + keys.length + " → " + keys.join(", "));
    ok(keys.join() === INDEX_KEYS, "indexed verse set");
    var bad = 0; keys.forEach(function (k) { var pid = k.split(":")[0], n = +k.split(":")[1], text = x.B.data.passages[pid].verses[n - 1].text; idx.entries[k].filter(function (e) { return e.stable_id === SID; }).forEach(function (e) { e.spans.forEach(function (s) { if (text.slice(s[0], s[1]) !== e.surface) bad++; }); }); }); ok(bad === 0, "every span equals the surface in the live KRV text");
    ok(idx.stats[SID].related_links_not_tagged.join() === "gen-20,gen-26:1-22" && idx.stats[SID].verses_without_surface.indexOf("gen-26:24") >= 0, "strongly-related passages and surface-less verses are not tagged"); clean(x);
  });

  t("PL-04", "each_indexed_verse_shows_a_tag_and_nothing_else_in_those_chapters_is_tagged", async function (ev) {
    var seen = []; for (var pid of ["gen-21", "gen-26", "gen-28", "gen-46", "gen-20"]) {
      var x = await load("#" + pid); var tags = qa(x, "#verses .tag[data-id=beersheba]"), verses = tags.map(function (g) { return pid + ":" + g.closest(".verse").dataset.verse; }); seen = seen.concat(verses);
      ok(tags.every(function (g) { return g.dataset.kind === "l" && g.dataset.id === "beersheba" && g.dataset.stableId === SID && g.textContent === "브엘세바" && g.dataset.source === "scripture-index"; }), pid + ": every tag is the Beersheba place with the shared stable_id");
      ok(!qa(x, "#verses .tag.p").length, pid + ": no person tags (no name-based entity linking)"); ok(qa(x, "#verses .tag.l").every(function (g) { return g.dataset.id === "beersheba" || g.dataset.id === "gerar"; }), pid + ": only research places are tagged"); ok(x.w.__errs.length === 0); clean(x);
    }
    ev.push("tagged verses=" + seen.join(", ")); ok(seen.filter(function (k) { return !/^gen-20/.test(k); }).sort().join() === INDEX_KEYS.split(",").filter(function (k) { return !/^gen-22/.test(k); }).sort().join() && !seen.some(function (k) { return /^gen-20/.test(k); }), "exactly the indexed verses (gen-22 is featured and checked separately)");
  });

  t("PL-05", "clicking_a_newly_linked_verse_resolves_one_stable_id_across_scripture_detail_map_guide", async function (ev) {
    var x = await load("#gen-21:31"), tag = q(x, '#verses [data-verse="31"] .tag'); ok(tag, "tag in Genesis 21:31");
    click(x, tag); await sleep(100); var det = q(x, "#panel .detail"), B = x.B;
    var surfaces = { scripture: tag.dataset.stableId, detail: det.dataset.stableId, state: B.stableId(B.state.entity.kind, B.state.entity.id), guide_step: guideCur(x), map_note: (q(x, ".map-note") || {}).dataset && q(x, ".map-note").dataset.stableId, url: x.w.location.hash };
    ev.push("surfaces=" + J(surfaces)); ok(surfaces.scripture === SID && surfaces.detail === SID && surfaces.state === SID && surfaces.map_note === SID && /e=l\.beersheba/.test(surfaces.url) && B.state.panel === "open", "same identity + Detail opened by the explicit click");
    ok(!q(x, '#map-body .pin[data-id="beersheba"]'), "still no exact marker for the biblical place"); var dims = qa(x, "#verses .verse.dim").length; ev.push("dimmed verses (not linked)=" + dims); ok(dims > 0 && !q(x, '#verses [data-verse="31"].dim'), "selection dims verses without the place and keeps linked verses");
    var pass0 = B.state.passage, y = 0; click(x, '#panel [data-part="scripture"] [data-open-ref="gen-22:19"]'); await sleep(120); ok(B.state.passage === "gen-22" && B.state.entity.id === "beersheba" && q(x, ".tag.l.active"), "related passage → featured chapter, same entity, active tag"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PL-06", "overview_and_map_for_a_newly_linked_chapter_use_the_same_place_without_new_data", async function (ev) {
    var x = await load("#gen-26:23"); x.B.setPanel("open"); await sleep(80); var ov = q(x, '#panel [data-ov="places"]');
    ev.push("gen-26 overview places=" + (ov ? qa(x, '#panel [data-ov="places"] .item').map(function (i) { return i.dataset.id + "/" + i.dataset.stableId; }).join(",") : "(none)")); ok(ov && ov.querySelector('.item[data-id="beersheba"]').dataset.stableId === SID, "등장 장소 lists the research place with the shared stable_id");
    ok(q(x, '#map-body .map-note[data-place="beersheba"]') && !q(x, "#map-body svg.smap .pin") && !q(x, "#map-body svg.smap polyline"), "map: natural-language note only, no pin, no route, no invented geometry"); click(x, '#panel [data-ov="places"] .item[data-id="beersheba"]'); await sleep(60); ok(q(x, "#panel .detail").dataset.stableId === SID, "card → Detail with the same id");
    var y = await load("#gen-26:1"); ok(!qa(y, "#verses .verse").filter(function (v) { return +v.dataset.verse <= 22 && v.querySelector(".tag[data-id=beersheba]"); }).length && qa(y, "#verses .tag[data-id=beersheba]").length === 2, "gen-26:1–22 (strongly related, not a direct mention) stays untagged; only 26:23 and 26:33 carry the link"); var z = await load("#jhn-3:16"); ok(!qa(z, "#verses .tag").length && z.w.__errs.length === 0, "unrelated chapter untouched"); clean(y); clean(z); clean(x);
  });

  t("PL-07", "index_and_projection_failures_fall_back_safely", async function (ev) {
    var cases = [{ n: "index script missing", edit: function (h) { return h.replace('<script src="data/scripture.index.js"></script>', ""); } }, { n: "index source hash mismatch", edit: function (h) { return h.replace('<script src="data/scripture.index.js"></script>', '<script src="data/scripture.index.js"></script><script>window.BVC_SCRIPTURE_INDEX.meta.records.forEach(function(r){r.source_sha256="deadbeef";});</script>'); } }, { n: "projection missing (index must be ignored too)", edit: function (h) { return h.replace('<script src="data/projection.research.js"></script>', ""); } }, { n: "index span no longer matches KRV text", edit: function (h) { return h.replace('<script src="data/scripture.index.js"></script>', '<script src="data/scripture.index.js"></script><script>var e=window.BVC_SCRIPTURE_INDEX.entries["gen-21:31"][0]; e.spans=[[0,4]];</script>'); } }];
    for (var c of cases) { var x = await variant(c.edit); x.w.location.hash = "#gen-21:31"; await sleep(250); var tags = qa(x, "#verses .tag").length; ev.push(c.n + " → tags in gen-21=" + tags + " index_ok=" + x.B.store.indexOk());
      if (c.n.indexOf("span") >= 0) ok(!q(x, '#verses [data-verse="31"] .tag') && tags >= 1, c.n + ": only the mismatching verse loses its tag"); else ok(tags === 0 && x.B.store.indexOk() === false, c.n + ": no tags, index disabled");
      ok(x.w.__errs.length === 0, c.n + ": no console errors"); clean(x); }
  });

  t("PL-07b", "per_record_trust_one_record_with_a_stale_hash_loses_only_its_own_tags", async function (ev) {
    var x = await variant(function (h) { return h.replace('<script src="data/scripture.index.js"></script>', '<script src="data/scripture.index.js"></script><script>window.BVC_SCRIPTURE_INDEX.meta.records.filter(function(r){return r.record==="JBC-CR-PLACE-GERAR-001";})[0].source_sha256="deadbeef";</script>'); }); x.w.location.hash = "#gen-26:26"; await sleep(250);
    ev.push("beersheba tags=" + qa(x, "#verses .tag[data-id=beersheba]").length + " gerar tags=" + qa(x, "#verses .tag[data-id=gerar]").length); ok(qa(x, "#verses .tag[data-id=beersheba]").length >= 1 && qa(x, "#verses .tag[data-id=gerar]").length === 0 && x.B.store.indexOk() === true && x.w.__errs.length === 0, "stale Gerar hash disables only Gerar tags"); clean(x);
  });

  t("PL-09", "media_binding_rights_source_url_sync_report_matches_expected_and_projection_is_payload_free", async function (ev) {
    var mr = await jget("06-media-report.json"), tr = await jget("test-results.json"), x = await load("#gen-22:19"), M = x.B.projection.places[SID].media; ev.push("media report=" + JSON.stringify(mr));
    ok(mr.discovered === 3 && mr.bound === 3 && mr.attribution_only === 0 && mr.resolved === 3 && mr.images_enabled === 3 && mr.preview_urls === 3 && mr.image_payloads === 0 && mr.invented_urls === 0 && mr.invented_preview_urls === 0 && mr.unsafe_payloads === 0 && mr.source_mutations === 0 && mr.quarantined === 0, "expected media result");
    ok(tr.results.filter(function (r) { return /^M[0-9]+$/.test(r.id); }).length === 10 && tr.results.filter(function (r) { return /^M[0-9]+$/.test(r.id); }).every(function (r) { return r.pass; }), "10 media tests pass");
    ok(M.length === 3 && M.every(function (m) { return m.target_ref && m.target_ref.ref && m.declared_rights && m.declared_rights.status === "CLEARED" && m.declared_rights.license === m.license && m.rights && m.rights.validated && m.rights.status === "CLEARED" && m.preview_url === m.resolution.thumb_url && m.source_url_verified === true && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(m.source_url) && m.resolution && m.resolution.verified === true && m.resolution.eligible_for_display === true && m.display_mode === "image" && /^[0-9a-f]{64}$/.test(m.content_hash); }), "projection media: explicitly bound, exact structured rights parsed, resolver-verified and hashed");
    ok(x.B.projection.places[SID].representative_media_id === "JBC-MEDIA-BS-001" && M.filter(function (m) { return m.representative; }).length === 1, "one representative resolved");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(160); ok(q(x, "#panel .detail img.hero-img") && q(x, '#panel [data-part="media"]').dataset.mediaMode === "image" && !qa(x, "#panel .media-ref").length, "Detail: representative image with inline attribution suppressed"); click(x, ".hero-open"); await sleep(40); ok(qa(x, "#media-lightbox a.src-link").length === 1, "verified source appears in the lightbox"); ok(x.w.__errs.length === 0); clean(x);
  });
  t("PL-08", "no_invention_relations_hidden_navigation_absent_registry_untouched", async function (ev) {
    var x = await load("#gen-22:19"), R = x.B.projection.places[SID]; click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); var d = q(x, "#panel .detail");
    ok(R.relations.length === 12 && R.relations.every(function (r) { return r.resolved === false && r.from_id === null; }), "relations preserved as written, all unresolved"); ok(!d.querySelector("[data-rel], [data-obj]") && !q(x, "#guide-pane [data-obj^='p.']") , "unresolved relations are hidden (no name-based links)");
    ok(R.navigation === null && R.authority.registry_effect === "NONE" && R.authority.BAT01_crosswalk === "NOT_PERFORMED" && R.VERIFY_HOLD.verify && R.VERIFY_HOLD.hold, "navigation not invented; registry/BAT01 untouched; VERIFY/HOLD kept");
    ok(Object.keys(x.B.data.places).join() === "moriah,beersheba,haran,gerar", "one replaced fixture record (Beersheba) + one record created from the projection (Gerar); nothing else"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PL-10", "gerar_second_record_scripture_tags_only_literal_direct_mentions_with_one_shared_stable_id", async function (ev) {
    var want = { "gen-10": [19], "gen-20": [1, 2], "gen-26": [1, 6, 17, 20, 26], "2ch-14": [13, 14] }, seen = {};
    for (var pid in want) { var x = await load("#" + pid), tags = qa(x, "#verses .tag[data-id=gerar]"); seen[pid] = tags.map(function (g) { return +g.closest(".verse").dataset.verse; });
      ok(J(seen[pid]) === J(want[pid]) && tags.every(function (g) { return g.dataset.stableId === GSID && g.textContent === "그랄" && g.dataset.source === "scripture-index"; }), pid + ": tags exactly on direct-mention verses: " + J(seen[pid])); ok(x.w.__errs.length === 0); clean(x); }
    ev.push("gerar tags=" + J(seen)); var y = await load("#gen-21"); ok(!qa(y, "#verses .tag[data-id=gerar]").length, "related passage Genesis 21 carries no Gerar tag"); clean(y);
  });

  t("PL-11", "gerar_detail_projects_only_what_the_note_states_candidate_only_media_no_fake_pin", async function (ev) {
    var x = await load("#gen-26:26"); click(x, '#verses .tag.l[data-id="gerar"]'); await sleep(120); var d = q(x, "#panel .detail"), txt = d.textContent, R = x.B.projection.places[GSID];
    ok(d.dataset.stableId === GSID && x.B.state.panel === "open" && /그랄/.test(q(x, ".detail-name").textContent), "Detail opened by the explicit click with the Gerar identity");    ok(!/null|undefined|\[object|\*\*/.test(txt) && !/텔 브엘세바 고고학 유적/.test(txt), "no null/undefined/markdown and no Beersheba-specific text: " + txt.slice(0, 60));
    ok(/여러 후보지/.test(q(x, ".d-kind").textContent), "disputed location wording"); var hero = q(x, '#panel [data-part="media"]'), im = hero.querySelector("img.hero-img"); ok(hero.dataset.mediaMode === "image" && im && im.getAttribute("src") === R.media[0].preview_url && /^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//.test(im.getAttribute("src")) && im.getAttribute("referrerpolicy") === "no-referrer" && im.getAttribute("alt") === R.media[0].reader_caption, "the gate passed: the hero shows the resolver's thumbnail exactly, with the note's candidate-only caption as alt text"); ok(qa(x, "#panel .detail img").length === 1 && !qa(x, "#panel .detail picture, #panel .detail video, #panel .detail canvas").length, "only the representative image, nothing else");
    ok(/candidate|후보/.test(q(x, ".hero-cap").textContent) && !q(x, ".hero-src") && !qa(x, "#panel .media-ref").length, "inline Detail keeps the candidate-only caption and defers attribution"); click(x, ".hero-open"); await sleep(40); var lb = q(x, "#media-lightbox"), link = q(x, "#media-lightbox a.src-link"); ok(!lb.hidden && /사진: Aaadir/.test(lb.textContent) && /CC0 1\.0/.test(lb.textContent) && !/CC0_1/.test(lb.textContent), "lightbox shows creator and license as written"); ok(link && link.getAttribute("href") === R.media[0].source_url && link.rel === "noopener noreferrer" && link.target === "_blank", "lightbox link is the verified source page");
    var cl = qa(x, "#panel details.research .rs-list").map(function (u) { return u.textContent; }).join("|"); ok(/좌표 없음/.test(cl) && /Tel Haror/.test(cl) && /31\.3821, 34\.6065/.test(cl) && /그랄과 동일시하지 않음/.test(cl), "candidates listed with their own coordinates; one without a coordinate; never equated");
    ok(!q(x, '#map-body .pin[data-id="gerar"]') && !q(x, "#map-body svg.smap polyline") && x.B.geo.markers().filter(function (m) { return m.place === "gerar"; }).length === 0, "no exact pin, no route, no geographic marker for Gerar (candidate status is not stated in the note)"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PL-12", "beersheba_and_gerar_coexist_beersheba_geo_view_and_detail_unchanged", async function (ev) {
    var x = await load("#gen-22:19"); click(x, '.tag.l[data-id="beersheba"]'); await sleep(160); ok(q(x, "#panel .detail").dataset.stableId === SID && q(x, '#panel [data-part="media"] img.hero-img') && /브엘세바의 유력한 고고학 후보지/.test(q(x, '.hero-cap').textContent), "Beersheba Detail shows the verified representative image and safe caption");
    ok(x.B.geo.markers().length === 2 && x.B.geo.markers().every(function (m) { return m.place === "beersheba"; }), "Beersheba geographic markers unchanged (Tel + modern), none for Gerar"); var y = await load("#gen-26:26"); ok(y.B.geo.markers().every(function (m) { return m.place !== "gerar"; }), "a passage that mentions Gerar draws no Gerar marker");
    click(y, '#verses .tag.l[data-id="gerar"]'); await sleep(80); click(y, '#verses .tag.l[data-id="gerar"]'); ok(y.w.__errs.length === 0 && x.w.__errs.length === 0, "no console errors"); clean(x); clean(y);
  });

  t("PL-13", "ingest_run_summary_discovery_boundary_hashes_and_navigation_stay_metadata_driven", async function (ev) {
    var rs = await jget("run-summary.json"), pg = await jget("01-parsed.json", GSID), gv = await jget("02-validation.json", GSID), gn = await jget("03-normalized.json", GSID), gm = await jget("06-media-report.json", GSID); ev.push("discovery=" + J(rs.discovery.found));
    ok(rs.discovery.found.length === 2 && rs.discovery.found.every(function (f) { return /^02_연구물\//.test(f); }) && rs.discovery.skipped.some(function (s) { return /JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01 1\.md/.test(s.path) && /header id does not equal/.test(s.reason); }), "only canonical 02_연구물 records are ingested; the duplicate is skipped");
    ok(rs.records.length === 2 && rs.records.every(function (r) { return r.ok; }) && rs.wrote === true && rs.preserved_last_known_good.length === 0, "both records ok, nothing needed last-known-good");
    var gh = await sha(GSRC); ok(pg.source.sha256 === gh && gn.record.source_refs[0].sha256 === gh, "Gerar note hash traced through parse and normalize"); ok(gv.ok && gv.checks.length === 35 && gv.checks.every(function (c) { return c.ok; }), "Gerar: 35/35 checks");
    ok(gm.discovered === 2 && gm.bound === 2 && gm.images_enabled === 2 && gm.preview_urls === 2 && gm.resolved === 2 && gm.image_payloads === 0 && gm.invented_urls === 0 && gm.invented_preview_urls === 0 && gm.unsafe_payloads === 0 && gm.source_mutations === 0, "Gerar media result");
    var x = await load("#gen-26:26"), P = x.B.projection.places; ok(P[GSID].navigation === null && P[SID].navigation === null && !/GERAR/.test(J((function () { try { return x.B.navigationCandidates(); } catch (e) { return []; } })() || [])), "no Navigation metadata in either note → none invented");
    ok(P[GSID].authority.approval === "CAPTAIN_APPROVED" && P[GSID].authority.note_approval_status === "PENDING_CAPTAIN_REVIEW" && P[GSID].authority.registry_effect === "NONE", "approval override and the note's own status are both visible"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PL-14", "image_gate_in_the_app_fallback_on_load_failure_beersheba_and_gerar_render_only_verified_previews", async function (ev) {
    var x = await load("#gen-26:26"); click(x, '#verses .tag.l[data-id="gerar"]'); await sleep(120); var fig = q(x, '#panel [data-part="media"]'), im = fig.querySelector("img.hero-img"); ok(im && fig.dataset.mediaMode === "image", "image mode first");
    im.dispatchEvent(new x.w.Event("error")); await sleep(50); ok(fig.dataset.mediaMode === "attribution_only" && !fig.querySelector("img") && /출처만 표시/.test(fig.textContent) && /Aaadir/.test(fig.textContent) && q(x, "#panel .detail"), "a load failure falls back to attribution-only; the Detail stays intact");
    var G = x.B.mediaGate, good = Object.assign({}, x.B.projection.places[GSID].media[0]), bad = { foreign: Object.assign({}, good, { preview_url: "https://evil.example/a.jpg" }), http: Object.assign({}, good, { preview_url: good.preview_url.replace("https://", "http://") }), wrong_path: Object.assign({}, good, { preview_url: "https://thumb.wikimedia.org/other/a.jpg" }), not_cleared: Object.assign({}, good, { rights: Object.assign({}, good.rights, { status: "VERIFY" }) }), not_validated: Object.assign({}, good, { rights: Object.assign({}, good.rights, { validated: false }) }), js: Object.assign({}, good, { preview_url: "javascript:alert(1)" }) };
    ok(G(good) === "image" && Object.keys(bad).every(function (k) { return G(bad[k]) === "attribution_only"; }), "gate: only the resolver-derived Wikimedia URL passes"); var y = await load("#gen-22:19"); click(y, '.tag.l[data-id="beersheba"]'); await sleep(160); ok(qa(y, "#panel .detail img.hero-img").length === 1 && q(y, '#panel [data-part="media"]').dataset.mediaMode === "image", "Beersheba verified representative image passes the same gate");
    var z = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>(function(){var m=window.BVC_PROJECTION.places["JBC-CR-PLACE-GERAR-001"].media[0]; m.preview_url="https://evil.example/a.jpg";})();</script>'); }); z.w.location.hash = "#gen-26:26"; await sleep(400); click(z, '#verses .tag.l[data-id="gerar"]'); await sleep(120); ok(!qa(z, "#panel .detail img").length && q(z, '#panel [data-part="media"]').dataset.mediaMode === "attribution_only", "a tampered preview URL never renders an image");
    ok(x.w.__errs.length === 0 && y.w.__errs.length === 0 && z.w.__errs.length === 0, "no console errors"); clean(x); clean(y); clean(z);
  });

  // ---- RELATED_PASSAGE_INTERACTION / DETAIL_CONTEXT_MODEL ----
  var RPSEL = '#panel [data-part="scripture"] [data-open-ref="gen-26:23"]';
  async function withEntity(w, h, hash) { var x = await load(hash || "#gen-22:19", w || 1440, h || 900); click(x, '.tag.l[data-id="beersheba"]'); await sleep(150); if (h && w && w < 761) { x.B.setSheet("half"); await sleep(60); } return x; }
  var vis = function (x, el) { var r = el.getBoundingClientRect(), hb = x.d.querySelector("header.top").getBoundingClientRect().bottom, lim = x.w.innerHeight; if (x.B.isMobile()) { var sp = x.d.getElementById("side-pane"); if (sp && x.B.state.sheet !== "peek") lim = Math.min(lim, sp.getBoundingClientRect().top); } return { ok: r.top >= hb - 2 && r.bottom <= lim + 2, top: Math.round(r.top), hb: Math.round(hb), lim: Math.round(lim) }; };

  t("RP-01", "related_passage_click_changes_target_passage", async function (ev) {
    var x = await withEntity(); var B = x.B; click(x, RPSEL); await sleep(120);
    ev.push("passage=" + B.state.passage + " verse=" + B.state.verse + " hash=" + x.w.location.hash + " refTarget=" + J(B.ui.refTarget)); ok(B.state.passage === "gen-26" && J(B.ui.refTarget) === J({ passage: "gen-26", verse: 23 }), "Scripture moved to the target passage and the reading target is the related verse");
    ok(B.state.verse === null && !/gen-26:\d/.test(x.w.location.hash.split("&")[0]) && !q(x, "#verses .verse.sel") && q(x, '#verses [data-verse="23"]').classList.contains("ref-target"), "it is a reading target (highlighted), not a verse selection / Passage Detail scope");
    click(x, '#panel [data-part="scripture"] [data-open-ref="gen-20:"]'); await sleep(120); ok(B.state.passage === "gen-20" && B.ui.refTarget.verse === null && q(x, "#passage-title").classList.contains("ref-target-passage"), "a whole-chapter link targets the passage (title highlighted)"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("RP-02", "Scripture_pane_becomes_active_immediately", async function (ev) {
    var x = await withEntity(); var B = x.B; click(x, RPSEL); var v = q(x, '#verses [data-verse="23"]', 0);   // no waiting: the very first click must already have done everything
    ok(x.d.activeElement === v && q(x, "#text-pane").contains(x.d.activeElement) && !q(x, "#text-pane").inert && q(x, "#text-pane").getAttribute("aria-hidden") === "false" && B.state.view === "study", "focus is inside the Scripture pane on the target verse right after the click");
    x.B.setView("map"); await sleep(120); ok(B.state.view === "map" && q(x, "#panel .detail"), "map perspective with the Entity Detail open"); click(x, '#panel [data-part="scripture"] [data-open-ref="gen-21:31"]'); ok(B.state.view === "study" && B.state.passage === "gen-21" && !q(x, "#text-pane").inert && x.d.activeElement === q(x, '#verses [data-verse="31"]') && B.state.entity.id === "beersheba", "from the map perspective the Scripture is brought to the front in the same click"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("RP-03", "selected_entity_is_preserved", async function (ev) {
    var x = await withEntity(); var B = x.B, cam0 = (B.ui.cam = { x: 37, y: 41, k: 1.5 }, J(B.ui.cam)); click(x, RPSEL); await sleep(100);
    ok(B.state.entity && B.state.entity.kind === "l" && B.state.entity.id === "beersheba" && B.stableId("l", "beersheba") === SID && /e=l\.beersheba/.test(x.w.location.hash), "same entity, same stable_id, still in the URL"); ok(J(B.ui.cam) === cam0 && B.ui.layers.place === true, "map camera and layers untouched"); ok(q(x, "#verses .tag.l.active") && q(x, "#verses .tag.l.active").dataset.stableId === SID, "the entity's tag in the new passage is the active one");
    click(x, '#panel [data-part="scripture"] [data-open-ref="gen-28:10"]'); await sleep(100); ok(B.state.entity.id === "beersheba" && B.state.passage === "gen-28", "still preserved after a second related passage"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("RP-04", "Entity_Detail_remains_open", async function (ev) {
    var x = await withEntity(); var B = x.B; click(x, RPSEL); await sleep(100); var d = q(x, "#panel .detail");
    ok(d && d.dataset.detail === "l" && d.dataset.stableId === SID && B.state.panel === "open" && x.d.body.dataset.detailContext === "entity" && B.detailContext().kind === "ENTITY" && B.detailContext().subject === "Place" && B.detailContext().open === true, "Entity Detail (Place) stays open on desktop"); ok(!q(x, "#panel [data-ov]") && !q(x, "#panel .ov-sec"), "it was not replaced by the passage overview"); ok(J(B.DETAIL_MODEL.ENTITY) === J(["Person", "Place", "Event", "Route"]) && J(B.DETAIL_MODEL.PASSAGE) === J(["Verse", "Passage", "Pericope"]), "the two Detail subject families are separate");
    var m = await withEntity(390, 800); ok(m.B.state.sheet === "half", "mobile sheet open"); click(m, RPSEL); await sleep(150); ok(m.B.state.sheet === "half" && q(m, "#panel .detail") && q(m, "#panel .detail").dataset.stableId === SID && m.B.detailContext().open === true, "mobile: the sheet stays open with the Entity Detail"); m.B.setSheet("full"); await sleep(60); click(m, '#panel [data-part="scripture"] [data-open-ref="gen-28:10"]'); await sleep(150); ok(m.B.state.sheet === "half" && q(m, "#panel .detail").dataset.stableId === SID, "mobile: a full sheet is reduced to half (still open) so the Scripture can be seen"); ok(x.w.__errs.length === 0 && m.w.__errs.length === 0); clean(x); clean(m);
  });

  t("RP-05", "target_passage_is_scrolled_into_view", async function (ev) {
    var x = await withEntity(); var B = x.B; x.w.scrollTo(0, 0); click(x, RPSEL); await sleep(150); var v = q(x, '#verses [data-verse="23"]'), r = vis(x, v); ev.push("desktop " + J(r)); ok(r.ok && r.top <= r.hb + 60, "desktop: the target verse sits at the reading position just below the header");
    click(x, '#panel [data-part="scripture"] [data-open-ref="gen-20:"]'); await sleep(150); var f = vis(x, qa(x, "#verses .verse")[0]); ok(f.ok && f.top <= f.hb + 60, "whole-chapter link: the passage start is at the reading position");
    var m = await withEntity(390, 800); click(m, RPSEL); await sleep(200); var mr = vis(m, q(m, '#verses [data-verse="23"]')); ev.push("mobile " + J(mr)); ok(mr.ok, "mobile: the target verse is visible above the context sheet"); ok(x.w.__errs.length === 0 && m.w.__errs.length === 0); clean(x); clean(m);
  });

  t("RP-06", "no_second_click_required", async function (ev) {
    var x = await withEntity(); var B = x.B, y0 = x.w.scrollY, n = 0; x.d.addEventListener("click", function () { n++; }, true); var pill = q(x, RPSEL); pill.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
    ok(n === 1 && B.state.passage === "gen-26" && x.d.activeElement === q(x, '#verses [data-verse="23"]') && vis(x, q(x, '#verses [data-verse="23"]')).ok && q(x, "#panel .detail").dataset.stableId === SID, "a single click: passage, pane activation, scroll and the preserved Detail are all complete synchronously"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PD-01", "Passage_Detail_opens_only_by_explicit_action", async function (ev) {
    var fresh = await load("#gen-26:23", 1440, 900); ok(fresh.B.state.entity === null && fresh.B.state.panel === "collapsed" && fresh.d.body.dataset.detailContext === "passage", "nothing opens a Detail by itself"); clean(fresh);
    var x = await withEntity(); var B = x.B; click(x, RPSEL); await sleep(100); ok(B.detailContext().kind === "ENTITY", "after the related click the context is still ENTITY");
    click(x, "#panel [data-clear-entity]"); await sleep(120); ok(B.state.entity === null && B.detailContext().kind === "PASSAGE" && x.d.body.dataset.detailContext === "passage" && q(x, "#panel [data-ov]"), "explicit action 1: '본문 개요' opens the Passage Detail (the passage overview)");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(120); ok(B.detailContext().kind === "ENTITY", "entity selected again"); click(x, '#verses [data-verse="26"]'); await sleep(120); ok(B.state.verse === 26 && B.state.entity === null && B.detailContext().kind === "PASSAGE" && B.detailContext().subject === "Verse", "explicit action 2: selecting a verse opens the Passage Detail for that verse"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("PD-02", "Passage_Detail_does_not_open_from_related_passage_click", async function (ev) {
    var x = await withEntity(); var B = x.B; for (var ref of ["gen-26:23", "gen-21:31", "gen-20:"]) { click(x, '#panel [data-part="scripture"] [data-open-ref="' + ref + '"]'); await sleep(100); ok(B.detailContext().kind === "ENTITY" && B.state.verse === null && !q(x, "#verses .verse.sel") && !q(x, "#panel [data-ov]") && q(x, "#panel .detail").dataset.stableId === SID, "after " + ref + ": still the Entity Detail; no verse selected; no passage overview"); }
    var hist = x.w.history.length; x.w.history.back(); await sleep(200); ok(B.state.entity && B.state.entity.id === "beersheba" && x.w.history.length === hist, "browser history intact: back keeps the entity"); ok(x.w.__errs.length === 0); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length, verdict = p === res.length ? "PASS" : "FAIL"; window.BVC_PL_QA = { pass: p, total: res.length, verdict: verdict, results: res };
    var el = document.createElement("div"); el.id = "pl-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "OBSIDIAN_TO_JUDEBIBLE_PIPELINE_E2E " + verdict + " " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " " + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
