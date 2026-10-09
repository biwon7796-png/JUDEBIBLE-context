(function () {
  "use strict";
  var D = window.BVC_FIXTURE;
  // ---------- Authority layer (Fixture Authority Isolation v0.1) ----------
  // 두 권위 풀을 분리한다. CANONICAL = 승인 연구 투영(Obsidian → pipeline → data/projection.research.js)에서 온 기록만. FIXTURE = data/fixture.js · data/guide.fixture.js 샘플(NON_AUTHORITATIVE).
  // 운영 기본값은 canonical-only: 소비 표면(Search/Explorer/Scripture/Related/Person Detail/Map/Guide)은 D.people · D.places · G 를 통해서만 읽으므로, 여기서 풀을 정하면 모든 소비자가 같은 권위를 본다(소비자별 필터가 아님).
  // fixture 풀은 파일 그대로 보존되고 테스트 하네스에서만 켠다: URL ?qa=fixture 또는 하네스가 app.js 앞에 심는 window.BVC_QA_FIXTURE=true (blob 문서는 쿼리를 가질 수 없다). 이름·별칭으로 한 풀이 다른 풀로 승격되지 않는다.
  var QA_FIXTURE = window.BVC_QA_FIXTURE === true || /[?&]qa=fixture(&|$)/.test(location.search);
  var FIXTURE_POOL = { people: D.people || {}, places: D.places || {}, lexicon: D.lexicon || {}, guide: window.BVC_GUIDE_FIXTURE || null };   // 보존된 원본(파일은 수정하지 않는다)
  D.people = QA_FIXTURE ? Object.assign({}, FIXTURE_POOL.people) : {};
  D.places = QA_FIXTURE ? Object.assign({}, FIXTURE_POOL.places) : {};
  // 상세·측면 패널의 샘플 콘텐츠(문맥·관련 본문·자료·사진·featured 본문 목록)도 fixture 권위다: 운영에서는 비우고(빈 상태 문구가 보인다) fixture 로 자동 보충하지 않는다. canonical 사진은 Detail 의 기존 rights gate(mediaGate)를, canonical 관련 본문은 stable_id/승인 PassageLink 를 통해서만 나온다.
  ["context", "photos"].forEach(function (k) { FIXTURE_POOL[k] = D[k] || {}; D[k] = QA_FIXTURE ? FIXTURE_POOL[k] : {}; });
  ["crossrefs", "resources", "featured"].forEach(function (k) { FIXTURE_POOL[k] = D[k] || []; D[k] = QA_FIXTURE ? FIXTURE_POOL[k] : []; });
  D.lexicon = QA_FIXTURE ? FIXTURE_POOL.lexicon : {};   // 표면형(이름) 인식은 fixture 어휘 — 이름 일치로 canonical 기록을 태그하지 않는다. canonical 태그는 Scripture Entity Index(stable_id)만.
  // Guide 는 placeLinks 가 아니라 GuideTopic/GuideStep fixture layer(data/guide.fixture.js, FIXTURE_SAMPLE · NON_AUTHORITATIVE)를 읽는다. 운영에서는 fixture Guide 가 권위가 아니므로 canonical Guide 가 없으면 빈 상태(그레이스풀)다.
  var G = QA_FIXTURE && FIXTURE_POOL.guide ? FIXTURE_POOL.guide : { meta: { status: "CANONICAL_GUIDE_ABSENT" }, topics: [], steps: [], routes: {} };
  // ---- 승인 연구 투영: Person/Place를 같은 방식으로 compatibility fixture에 record-level 적용한다. ----
  // ---- Reference Layer 신뢰 소스 레지스트리(data/reference.sources.js): 소스 단위로 검증된 외부 지도 자료만 켜진다. 연구 권위와 분리된 표시 전용 계층. ----
  var REFSRC = window.JBC_REFERENCE_SOURCES || null;
  function refGate(g) { return !REFSRC || !REFSRC.gates || REFSRC.gates[g] !== false; }   // 레지스트리가 없으면 기존 동작 유지
  // ---- 외부 참고 자동 결속(data/reference.bindings.js): 같은 대상으로 안전하게 식별된 외부 자료를 내부 항목에 CROSS_REFERENCE 로 연결한다(합치지 않음). 연구 권위·좌표·범위·사진으로 승격하지 않는다. ----
  var EASTON_CAND = null, eastonLoadState="IDLE", eastonLoading=null;
  function ensureEastonCandidate() {
    if (EASTON_CAND) return Promise.resolve(true);
    if (eastonLoadState==="FAILED") return Promise.resolve(false);
    if (eastonLoading) return eastonLoading;
    eastonLoadState="LOADING";
    eastonLoading=new Promise(function(resolve) {
      var tag=document.createElement("script");
      tag.src="tools/reference/easton_full_candidate/existing_views_candidate/easton.candidate.js";
      tag.onload=function() {
        EASTON_CAND=window.JBC_EASTON_CANDIDATE||null;
        eastonLoadState=EASTON_CAND?"READY":"FAILED";
        if (EASTON_CAND) { if (state.view==="explore") renderSearch(); if (state.entity) renderPanel(); }
        resolve(!!EASTON_CAND);
      };
      tag.onerror=function(){eastonLoadState="FAILED";resolve(false);};
      document.head.appendChild(tag);
    });
    return eastonLoading;
  }

  function eastonByStable(sid) {
    var id = EASTON_CAND && EASTON_CAND.crosswalk && EASTON_CAND.crosswalk[sid];
    return id && EASTON_CAND.entries && EASTON_CAND.entries[id] || null;
  }
  function eastonDetailHtml(sid) {
    var x = eastonByStable(sid); if (!x) return "";
    return '<section class="d-sec easton-ref" data-part="external-dictionary" data-authority="REFERENCE_ONLY"><h4 class="d-h">외부 성경사전 · Easton (1897)</h4><p class="meta">Public Domain · 참고자료, WORBS 승인 연구 아님 · '+esc(x.key)+'</p><details><summary>사전 원문 펼쳐 읽기</summary><p class="d-body" style="white-space:pre-wrap">'+esc(x.text)+'</p></details></section>';
  }
  function eastonHits(q) {
    var v=String(q||"").trim().toLowerCase(), m=EASTON_CAND && EASTON_CAND.entries; if(!v||!m)return [];
    return Object.keys(m).filter(function(k){var e=m[k];return e.key.toLowerCase().indexOf(v)>=0 || (e.aliases||[]).some(function(a){return a.toLowerCase().indexOf(v)>=0;});}).slice(0,20).map(function(k){return m[k];});
  }
  function eastonSearchHtml(q) {
    return eastonHits(q).map(function(x){return '<details class="d-sec easton-ref" data-external-entry="'+esc(x.id)+'"><summary>'+esc(x.key)+' <span class="meta">Easton · 외부 사전</span></summary><p class="meta">REFERENCE_ONLY · Public Domain · WORBS 비대체</p><p class="d-body" style="white-space:pre-wrap">'+esc(x.text)+'</p></details>';}).join("");
  }
  // Level A bilingual public-domain dictionary. No approval, identity or geometry effects.
  var ATLAS90_REF = window.JBC_ATLAS90_KOREAN_REFERENCE || [];
  var atlas90Selection = null, atlasBcSelection = null, atlasExpansionSelection = null;
  function atlasSourceReferenceLinks(x) {
    var titles = {'Gen':'Genesis','Ex':'Exodus','Exod':'Exodus','Lev':'Leviticus','Num':'Numbers','Deut':'Deuteronomy','Josh':'Joshua','Judg':'Judges','Sam':'Samuel','Kings':'Kings','Chr':'Chronicles','Ezra':'Ezra','Neh':'Nehemiah','Ps':'Psalms','Isa':'Isaiah','Jer':'Jeremiah','Ezek':'Ezekiel','Dan':'Daniel','Hos':'Hosea','Amos':'Amos','Mic':'Micah','Matt':'Matthew','Mark':'Mark','Luke':'Luke','John':'John','Acts':'Acts','Rom':'Romans','Rev':'Revelation'};
    var refs = x.source_evidence && x.source_evidence.scripture_citations_as_printed || [];
    var linked = refs.map(function(ref) {
      var m = /^(?:(1|2)\s*)?([A-Za-z]+)\.?\s*(\d+):(\d+)/.exec(ref);
      if (!m || !titles[m[2]]) return null;
      var book = (m[1] ? m[1]+' ' : '') + titles[m[2]];
      if (['Sam','Kings','Chr'].indexOf(m[2])>=0 && !m[1]) return null;
      var parsed = parseReference(book + ' ' + m[3] + ':' + m[4]);
      return parsed && !parsed.error && parsed.passage && parsed.verse ? '<button type="button" class="pill" data-source-bible-ref="' + esc(parsed.passage + ':' + parsed.verse) + '" title="사전 인용 성경 본문 보기">' + esc(ref) + ' ↗</button>' : null;
    }).filter(Boolean);
    return linked.length ? '<div class="d-sec" data-source-ref-links="1"><h4 class="d-h">사전 인용 성경본문 연결</h4><p class="meta">JudeBible 본문에 장·절이 존재하는 경우만 연결합니다. 인용 구절이 이 지명을 가리키는지는 별도 검증이 필요합니다.</p>' + linked.join(' ') + '</div>' : '';
  }
  function atlasExpansionHtml(name) {
    var x = (window.JBC_ATLAS_BC_EXPANSION || []).filter(function(a){return a.name_en===name;})[0];
    if (!x) return '';
    return '<article class="detail d-flat" data-part="atlas-expansion-standalone" data-expansion-name="' + esc(name) + '"><button type="button" class="pill" data-expansion-close="1">참고자료 닫기</button><h3 class="detail-name">' + esc(name) + '</h3><p class="meta">Level B/C 미분류 · 지명 동일성 미검증 · Easton 1897 외부사전 참고자료</p>' + (x.source_evidence && x.source_evidence.scripture_citations_as_printed.length ? '<p class="meta" data-evidence="easton-citation">사전 수록 성경구절 (본문 대조 전): ' + esc(x.source_evidence.scripture_citations_as_printed.join(', ')) + '</p>' : '') + (x.source_evidence && x.source_evidence.geographic_types.length ? '<p class="meta">사전 지리표현 단서: ' + esc(x.source_evidence.geographic_types.join(', ')) + '</p>' : '') + atlasSourceReferenceLinks(x) + (x.ko ? '<h4 class="d-h">한국어 자동 번역 · 미감수</h4><p class="d-body" style="white-space:pre-wrap">' + esc(x.ko) + '</p>' : '<p class="meta">지명 여부 검토 전으로 번역 보류</p>') + '<details><summary>영문 사전 원문</summary><p class="d-body" style="white-space:pre-wrap">' + esc(x.source_text) + '</p></details></article>';
  }
  function bcTierLabel(x) { return x.display_tier === 'B' ? 'Level B · 중요지역' : x.display_tier_status === 'HOLD_MULTIPLE_SENSES' ? '등급 보류 · 다의성 검토' : 'Level C · 참고지역 후보'; }
  function atlasBcReferenceHtml(id) {
    var x = (window.JBC_ATLAS_BC_CANDIDATES || []).filter(function(a) { return a.candidate_id === id; })[0];
    if (!x) return '';
    return '<article class="detail d-flat" data-part="atlas-bc-standalone" data-bc-candidate-id="' + esc(id) + '"><button type="button" class="pill" data-bc-close="1">외부사전 닫기</button><h3 class="detail-name">' + esc(x.name_en) + '</h3><p class="meta">' + esc(bcTierLabel(x)) + ' · 편집 중요도 분류 · 대상 동일성/좌표 미승인 · Easton 1897 참고자료</p>' + (x.ko ? '<h4 class="d-h">한국어 자동 번역 · 미감수</h4><p class="d-body" style="white-space:pre-wrap">' + esc(x.ko) + '</p>' : '<p class="meta">원문 의미·대상 다의성 확인이 필요하여 번역 보류</p>') + '<details><summary>영문 사전 원문</summary><p class="d-body" style="white-space:pre-wrap">' + esc(x.source_text) + '</p></details></article>';
  }
  // Presentation tiers only. B/C remain unassigned until their place sets are reviewed.
  function atlasTier(a) { return a && /^BAT01-PLACE-/.test(a.place_id || '') && ATLAS90_REF.some(function(x) {return x.place_id === a.place_id;}) ? 'A' : null; }
  function atlasTierBadge(a) { var t = atlasTier(a); return t ? '<span class="atlas-tier atlas-tier-' + t.toLowerCase() + '" data-atlas-tier="' + t + '">Level ' + t + ' · 핵심지역</span>' : ''; }
  // Explicit reader-only dictionary lookups. NOT an entity identity crosswalk.
  var ATLAS90_PLACE_LOOKUP = { shechem: 'BAT01-PLACE-1116', bethel: 'BAT01-PLACE-0241', egypt: 'BAT01-PLACE-0382', hebron: 'BAT01-PLACE-0597', gilead: 'BAT01-PLACE-0509' };
  function atlas90PlaceLookupButton(p) {
    var id = p && ATLAS90_PLACE_LOOKUP[p.key];
    return id && ATLAS90_REF.some(function(x) {return x.place_id === id && !!x.ko;}) ? '<button type="button" class="pill" data-atlas90-open="' + esc(id) + '" data-atlas90-lookup="term-only">외부사전 참고</button>' : '';
  }
  // Level A reader projections share the existing PlaceCard and Place Basic Detail renderers.
  // They are NOT canonical entities, and never invent location, media, or registry bindings.
  function atlas90ReferencePassages(a) {
    var e = (window.JBC_ATLAS90_SCRIPTURE_EVIDENCE || {})[a.place_id];
    if (!e || !e.source_citation_candidates || !e.source_citation_candidates.length) return '';
    var selected = e.source_citation_candidates.filter(function(c){return c.exact_korean_token;}).slice(0, 5);
    if (!selected.length) selected = e.source_citation_candidates.slice(0, 3);
    return '<section class="d-sec" data-part="atlas90-easton-scripture-links"><h4 class="d-h">사전 인용 성경본문</h4><p class="meta" style="font-size:.75rem;opacity:.75">사전 인용 · 연구검토중</p>' +
      selected.map(function(c){return '<button type="button" class="pill" data-atlas90-citation="' + esc(c.ref) + '">' + esc(c.source_citation) + (c.exact_korean_token ? ' · 지명표기 일치' : ' · 본문 확인') + '</button>';}).join('') + '</section>';
  }
  function atlas90EvidenceLabels(a) {
    var rec = (window.JBC_ATLAS90_SCRIPTURE_EVIDENCE || {})[a.place_id];
    return rec && rec.source_citation_candidates ? rec.source_citation_candidates.slice(0, 3).map(function(c){return c.source_citation || c.ref;}) : [];
  }
  var AB_GEO_MEDIA = window.JBC_AB_READER_GEO_MEDIA || {};
  var readerGeoFocus = null; // ephemeral, noncanonical map overlay
  function abReaderGeoSection(id) {
    var r=AB_GEO_MEDIA[id];if(!r)return '';
    var source='<p class="meta" style="font-size:.72rem;opacity:.7">지리 출처: <a href="'+esc(r.source_url||'https://openbible.info/geo/')+'" target="_blank" rel="noopener noreferrer">'+esc(r.source||'OpenBible.info')+'</a> · 전문 동일성 연구검토중</p>';
    if(r.geo){
      var typ=r.geo.geometry==='point'?'참고 위치':'개략 대표 위치';
      return '<section class="d-sec" data-part="ab-reader-geo"><h4 class="d-h">성경 지리 참고지도</h4>'+
        '<button type="button" class="pill" data-ab-reader-geo="'+esc(id)+'">지도에서 '+esc(typ)+' 보기</button>'+
        '<p class="meta">'+esc(r.geo.modern_name||'')+' · 지리 대응 검토자료</p>'+source+'</section>';
    }
    var candidates=(r.candidates||[]).slice(0,4);
    if(candidates.length) return '<section class="d-sec" data-part="ab-reader-geo-candidates">'+
      '<details><summary>지리 후보 위치 비교 · 연구검토중 ('+candidates.length+')</summary><p class="meta">여러 지리 후보가 있어 위치를 확정하지 않았습니다.</p>'+
      candidates.map(function(c,i){var im=c.photo;return '<div class="reader-geo-candidate" data-reader-geo-candidate="'+i+'"><button type="button" class="pill" data-ab-reader-geo="'+esc(id)+'|'+i+'">후보 '+(i+1)+' · '+esc(c.modern_name||c.ancient_name||'위치')+'</button>'+(im?'<figure class="reader-geo-candidate-photo"><img src="'+esc(im.url)+'" alt="'+esc(im.alt)+'" loading="lazy" style="width:100%;max-height:210px;object-fit:cover;border-radius:8px"/><figcaption class="meta">후보 위치 참고사진 · '+esc(im.creator)+' · '+esc(im.license)+' · <a href="'+esc(im.source_url)+'" target="_blank" rel="noopener noreferrer">Commons 출처</a></figcaption></figure>':'')+'</div>';}).join('')+
      source+'</details></section>';
    return '<p class="meta" data-part="ab-reader-geo-pending" style="font-size:.72rem;opacity:.65">지도 위치 연구검토중</p>';
  }
  function atlas90PlaceProjection(a) {
    var binding = (window.JBC_ATLAS90_READER_CROSSWALK || {})[a.place_id];
    var linked = binding && placeIndex().byKey[binding.place_key], geo=AB_GEO_MEDIA[a.place_id]||{};
    return { key: 'atlas90:' + a.place_id, stableId: '', canonical: false,
      hasProfile: false, label: a.name_ko || a.name_en, en: a.name_en,
      type: a.kind === 'region' ? '지역' : '지명', region: '',
      summary: 'Level A · 핵심지역',
      certainty: linked ? linked.certainty : '', primaryPassage: null, passages: linked ? linked.passages.slice() : atlas90EvidenceLabels(a), passageIds: linked ? linked.passageIds.slice() : [],
      people: linked ? linked.people.slice() : [], eras: linked ? linked.eras.slice() : [], journeys: linked ? linked.journeys.slice() : [],
      scenes: linked ? linked.scenes.slice() : [], media: linked&&linked.media ? linked.media : ((window.JBC_ATLAS90_READER_MEDIA || {})[a.place_id] || geo.media || null), lat: linked&&linked.lat!=null ? linked.lat : geo.geo ? geo.geo.lat : null, lon: linked&&linked.lon!=null ? linked.lon : geo.geo ? geo.geo.lon : null };
  }
  var LEVEL_B_87 = window.JBC_LEVEL_B_87 || [];
  var levelBSelection = null;
  function levelBRefs(a) { return (a.citation_candidates || []).filter(function(c){return c.status==='KRV_VERIFIED' && c.ref;}); }
  function levelBExistingPlace(a) {
    var normalize=function(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');};
    var name=normalize(a.name_en), list=placeIndex().list;
    var hits=list.filter(function(p){return normalize(p.key)===name || (!!p.en && normalize(p.en)===name);});
    return hits.length===1 ? hits[0] : null;
  }
  function nativePlaceReferenceHtml(p) {
    if(!p)return '';
    var norm=function(v){return String(v||'').toLocaleLowerCase().replace(/[^a-z0-9가-힣]/g,'');};
    var keys=[p.key,p.en,p.label].map(norm).filter(Boolean);
    var parts=[];
    (window.JBC_ATLAS90_KOREAN_REFERENCE||[]).forEach(function(a){
      var link=(window.JBC_ATLAS90_READER_CROSSWALK||{})[a.place_id];
      if((link&&link.place_key===p.key)||keys.indexOf(norm(a.name_en))>=0||keys.indexOf(norm(a.name_ko))>=0){
        parts.push('<section class="d-sec" data-part="native-level-a-reference"><h4 class="d-h">Level A · 핵심지역 참고</h4>'+
          atlas90ReferencePassages(a)+abReaderGeoSection(a.place_id)+'<p class="d-body" style="white-space:pre-wrap">'+esc(a.ko||'')+'</p>'+
          '<p class="meta" style="font-size:.72rem;opacity:.65">Easton 참고 · 연구검토중</p></section>');
      }
    });
    LEVEL_B_87.forEach(function(a){
      var match=levelBExistingPlace(a);
      if((match&&match.key===p.key)||keys.indexOf(norm(a.name_en))>=0||keys.indexOf(norm(a.name_ko))>=0){
        var refs=levelBRefs(a).slice(0,8);
        parts.push('<section class="d-sec" data-part="native-level-b-reference"><h4 class="d-h">Level B · 중요지역 참고</h4>'+
          '<div class="pill-group">'+refs.map(function(c){return '<button type="button" class="pill" data-levelb-ref="'+esc(c.ref)+'">'+esc(c.source)+'</button>';}).join('')+'</div>'+
          abReaderGeoSection(a.candidate_id)+'<p class="d-body" style="white-space:pre-wrap">'+esc(a.ko||'')+'</p>'+
          '<p class="meta" style="font-size:.72rem;opacity:.65">Easton 참고 · 연구검토중</p></section>');
      }
    });
    return parts.length?'<div data-part="native-place-reference-merge">'+parts.join('')+'</div>':'';
  }
  function levelBProjection(a) {
    var r=levelBRefs(a), labels=r.slice(0,3).map(function(c){return c.source;}), linked=levelBExistingPlace(a), geo=AB_GEO_MEDIA[a.candidate_id]||{};
    return {key:'levelb:'+a.candidate_id,stableId:'',canonical:false,hasProfile:false,label:a.name_ko||a.name_en,en:a.name_en,
      type:'지명',region:'',summary:'Level B · 중요지역',certainty:'',primaryPassage:null,passages:labels,passageIds:[],
      people:linked?linked.people.slice():[],eras:linked?linked.eras.slice():[],journeys:linked?linked.journeys.slice():[],scenes:linked?linked.scenes.slice():[],media:linked&&linked.media||geo.media||null,lat:linked&&linked.lat!=null?linked.lat:geo.geo?geo.geo.lat:null,lon:linked&&linked.lon!=null?linked.lon:geo.geo?geo.geo.lon:null};
  }
  function levelBCard(a,q) {
    return placeCardHtml(levelBProjection(a),'search',{q:q})
      .replace(/data-place-open="/g,'data-levelb-open="').replace(/data-search="1"/g,'data-levelb-search="1"')
      .replace(/data-levelb-open="levelb:[^"]+"/g,'data-levelb-open="'+esc(a.candidate_id)+'"');
  }
  function levelBDetail(a) {
    var refs=levelBRefs(a).slice(0,8), linked=levelBExistingPlace(a);
    var body=abReaderGeoSection(a.candidate_id)+(linked?'<section class="d-sec" data-part="levelb-map-link"><h4 class="d-h">지도 · 장소 탐색</h4><button type="button" class="pill" data-map-focus-place="'+esc(linked.key)+'">기존 장소 지도에서 보기</button><p class="meta" style="font-size:.72rem;opacity:.65">연구검토중 · 독자용 탐색 연결</p></section>':'<p class="meta" data-part="levelb-map-pending" style="font-size:.72rem;opacity:.65">지도 위치 연구검토중</p>')+'<section class="d-sec" data-part="levelb-scripture"><h4 class="d-h">관련 성경본문</h4>'+
      (refs.length?refs.map(function(c){return '<button type="button" class="pill" data-levelb-ref="'+esc(c.ref)+'">'+esc(c.source)+'</button>';}).join(''):'<p class="meta">본문 자료 연구검토중</p>')+'</section>'+
      '<section class="d-sec"><h4 class="d-h">지명 자료</h4><p class="d-body" style="white-space:pre-wrap">'+esc(a.ko||'')+'</p>'+
      '<p class="meta" style="font-size:.72rem;opacity:.65">연구검토중 · Easton 사전 참고자료</p></section>';
    return '<div data-part="levelb-shared-detail" data-levelb-id="'+esc(a.candidate_id)+'"><button type="button" class="pill" data-levelb-close="1">장소 상세 닫기</button>'+
      placeBasicDetailHtml(null,levelBProjection(a)).replace('</article>',body+'</article>')+'</div>';
  }
  function atlas90SharedCard(a, q) {
    var p = atlas90PlaceProjection(a);
    var html = placeCardHtml(p, 'search', {q:q});
    return html.replace(/data-place-open="/g, 'data-atlas90-open="').replace(/data-search="1"/g, 'data-atlas90-search="1"')
      .replace(/data-origin="JOURNEY_DATA"/g, 'data-origin="REFERENCE_ONLY"')
      .replace(/data-atlas90-open="atlas90:[^"]+"/g, 'data-atlas90-open="' + esc(a.place_id) + '"')
      .replace('</button></article>', '<span class="ee-tag">Level A · 핵심지역</span></button></article>');
  }
  function atlas90ReferenceHtml(placeId, englishTerm) {
    var matches = ATLAS90_REF.filter(function(x) {
      return placeId ? x.place_id === placeId : !!englishTerm && x.name_en.toLowerCase() === String(englishTerm).toLowerCase();
    });
    if (matches.length !== 1) return "";
    var a = matches[0], ok = !!a.ko && a.status.indexOf("AUTO_TRANSLATED_") === 0;
    return '<section class="d-sec atlas90-detail" data-part="atlas90-translation" data-authority="REFERENCE_ONLY" data-atlas-place-id="' + esc(a.place_id) + '"><h4 class="d-h">성경아틀라스 · 외부사전 한국어 번역</h4>' + atlasTierBadge(a)
      + '<p class="meta">' + esc(a.name_en) + ' · ' + esc(a.source_key || '미연결') + ' · ' + esc(a.source || '외부 사전') + ' · 자동 번역 참고자료 (WORBS 승인 연구 아님)</p>' + (a.qa_status === 'SOURCE_EXTRACTION_REVIEW_REQUIRED' ? '<p class="meta" data-atlas90-qa="HOLD">원문 추출에 누락 글자 의심 · 해당 한국어 번역은 재검증 전 참고용</p>' : '') + (a.identity_note ? '<p class="meta" data-identity-note="1">표제어·대상 동일성 검토 필요: 사전 설명을 기존 장소 ID의 전문 연구로 확정하지 않았습니다.</p>' : '')
      + (ok ? '<p class="d-body" style="white-space:pre-wrap">' + esc(a.ko) + '</p><details><summary>영문 사전 원문</summary><p class="d-body" style="white-space:pre-wrap">' + esc(a.en) + '</p></details>' : '<p class="meta">일치하는 사전 원문 확인 전입니다.</p>')
      + '</section>';
  }
  document.addEventListener("click", function(ev) {
    var lbref = ev.target && ev.target.closest && ev.target.closest('[data-levelb-ref]');
    if (lbref) { ev.preventDefault(); var m=/^([a-z0-9]+-\d+):(\d+)$/.exec(lbref.dataset.levelbRef||'');if(m&&D.passages[m[1]]&&hasVerse(m[1],+m[2])){levelBSelection=null;return openRelatedPassage(m[1],+m[2]);}return; }
    var lbopen = ev.target && ev.target.closest && ev.target.closest('[data-levelb-open]');
    if (lbopen) { ev.preventDefault(); levelBSelection=lbopen.dataset.levelbOpen;atlas90Selection=null;atlasBcSelection=null;atlasExpansionSelection=null; if(state.view==='explore')ensureContextVisible();renderPanel();return; }
    var lbclose = ev.target && ev.target.closest && ev.target.closest('[data-levelb-close]');
    if (lbclose) { ev.preventDefault(); levelBSelection=null;renderPanel();return; }
    var atlasCitation = ev.target && ev.target.closest && ev.target.closest('[data-atlas90-citation]');
    if (atlasCitation) {
      ev.preventDefault();
      var key = /^([a-z0-9]+-\d+):(\d+)$/.exec(atlasCitation.dataset.atlas90Citation || '');
      if (key && D.passages[key[1]] && hasVerse(key[1], +key[2])) return openRelatedPassage(key[1], +key[2]);
      return;
    }
    var bibleLink = ev.target && ev.target.closest && ev.target.closest('[data-source-bible-ref]');
    if (bibleLink) {
      ev.preventDefault();
      var br = /^([a-z0-9]+-\d+):(\d+)$/.exec(bibleLink.dataset.sourceBibleRef || '');
      if (br && D.passages[br[1]]) { atlasExpansionSelection = null; return openRelatedPassage(br[1], +br[2]); }
      return;
    }
    var exOpen = ev.target && ev.target.closest && ev.target.closest('[data-expansion-open]');
    var exClose = ev.target && ev.target.closest && ev.target.closest('[data-expansion-close]');
    if (exOpen) { ev.preventDefault(); ev.stopImmediatePropagation(); atlasExpansionSelection = exOpen.dataset.expansionOpen; atlasBcSelection = null; atlas90Selection = null; if (state.view === 'explore') closeSearch(true); else renderPanel(); return; }
    if (exClose) { ev.preventDefault(); atlasExpansionSelection = null; renderPanel(); return; }
    var bcOpen = ev.target && ev.target.closest && ev.target.closest("[data-bc-open]");
    var bcClose = ev.target && ev.target.closest && ev.target.closest("[data-bc-close]");
    if (bcOpen) { ev.preventDefault(); atlasBcSelection = bcOpen.dataset.bcOpen; atlas90Selection = null; if (state.view === 'explore') closeSearch(true); else renderPanel(); return; }
    if (bcClose) { ev.preventDefault(); atlasBcSelection = null; renderPanel(); return; }
    var open = ev.target && ev.target.closest && ev.target.closest("[data-atlas90-open]");
    var close = ev.target && ev.target.closest && ev.target.closest("[data-atlas90-close]");
    if (open) {
      ev.preventDefault(); atlas90Selection = open.dataset.atlas90Open; levelBSelection=null;atlasBcSelection=null;atlasExpansionSelection=null;
      // Single click is a side-panel preview: keep Explore and its scroll position.
      if (state.view === "explore") { ensureContextVisible(); renderPanel(); }
      else renderPanel();
    } else if (close) { ev.preventDefault(); atlas90Selection = null; renderPanel(); }
  });
  var REFBIND = window.JBC_REFERENCE_BINDINGS || null;
  function extBindings(sid) { var b = REFBIND && REFBIND.bindings && REFBIND.bindings[sid]; return b && (b.bound.length || b.verify.length || b.conflicts.length) ? b : null; }
  var PJ = window.BVC_PROJECTION || null, GF = window.JBC_GEOGRAPHY_FOUNDATION || { regions: {}, routes: {}, meta: null }, PERSON_PJ = window.BVC_PERSON_PROJECTION || null, FULL_PLACE = window.JBC_PLACE_FULL_PROFILES || {}, CTX = window.JBC_CONTEXTUAL_RESEARCH || { records: [], by_passage: {}, timeline_bindings: [] }, ALIAS_STABLE = {}, STABLE_ALIAS = {}, STABLE_KIND = {};
  // Region(kind "rgn")은 Place 가 아니다: 별도 store(D.regions)에만 들어가며, 검증된(regionRecordOk fail-closed 계약 통과) 승인 Region 은 일반 런타임에서 연결된다. 계약을 어기는 기록은 연결되지 않는다.
  // 연결은 공개를 뜻하지 않는다 — reader.published 는 false 로 유지되고 Detail 도 '비공개 연구 검토용'으로 표시된다. (BVC_NONPUBLIC_REGION_MODE 플래그는 더 이상 필요 없다.)
  var REGION_MODE = true;
  if (REGION_MODE && !D.regions) D.regions = {};
  if (!D.events) D.events = {};
  if (!D.routes) D.routes = {};
  function projectionGroups() {
    return [
      { kind: "p", type: "Person", records: Object.assign({}, PJ && (PJ.persons || PJ.people) || {}, PERSON_PJ && (PERSON_PJ.persons || PERSON_PJ.people) || {}), dict: D.people },
      { kind: "l", type: "Place", records: PJ && PJ.places || {}, dict: D.places },
      { kind: "rgn", type: "Region", records: Object.assign({}, REGION_MODE && PJ && PJ.regions || {}, REGION_MODE && GF && GF.regions || {}), dict: REGION_MODE ? D.regions : null },
      { kind: "evt", type: "Event", records: PJ && PJ.events || {}, dict: D.events },
      { kind: "rt", type: "Route", records: Object.assign({}, PJ && PJ.routes || {}, GF && GF.routes || {}), dict: D.routes }
    ];
  }
  function dictOf(kind) { return kind === "p" ? D.people : kind === "rgn" ? D.regions || {} : kind === "evt" ? D.events || {} : kind === "rt" ? D.routes || {} : D.places; }
  // Region 승인 계약(fail-closed): 하나라도 어긋나면 기록 전체를 연결하지 않는다. 좌표·경계는 승인된 것만, 없으면 마커·폴리곤 없음.
  function regionRecordOk(sid, r) {
    var a = r.authority, ib = r.identity_binding, sp = r.spatial, geo = r.geometry || {}, vh = sp && sp.verify_hold;
    if (r.entity_type !== "Region" || r.stable_id !== sid || !r.display_label || !r.status || !a || typeof a !== "object" || !r.source_refs || !r.source_refs[0] || !r.source_refs[0].sha256) return false;
    if (a.approval !== "CAPTAIN_APPROVED" || !a.approval_record_id || a.registry_effect !== "NONE") return false;
    if (!ib || ib.viewer_stable_id !== sid || ib.automatic_merge !== false || ib.BAT01_P_crosswalk !== false || ib.BAT01_PLACE_reuse !== false) return false;
    if (!r.reader || typeof r.reader.published !== "boolean") return false;   // 연결(식별)은 공개와 별개: published 가 명시된 기록만 연결하고, 공개 여부는 아래 reader visibility gate 가 따로 정한다
    var verifyCount = Array.isArray(r.verify) ? r.verify.length : vh && Array.isArray(vh.verify) ? vh.verify.length : -1, holdCount = Array.isArray(r.hold) ? r.hold.length : vh && typeof vh.hold === "number" ? vh.hold : -1;
    if (!vh || !Array.isArray(vh.verify) || verifyCount < 0 || holdCount < 0 || vh.verify.length !== verifyCount || vh.hold !== holdCount) return false;
    var marker = sp && sp.primary && sp.primary.marker && sp.primary.marker.render === true;
    if ((r.coordinates || r.centroid || sp && sp.primary && sp.primary.coordinates) && !marker) return false;
    if (sp && sp.region && sp.region.boundary && geo.approved !== true) return false;
    if (geo.approved !== true && (geo.type || geo.approximate_area || geo.map_polygon !== "OMIT")) return false;
    return true;
  }
  function attachProjection(g, sid, r) {
    if (g.kind === "rgn" && !(g.dict && r && regionRecordOk(sid, r))) return null;
    if (!g.dict || !r || r.stable_id !== sid || g.kind !== "rgn" && String(r.type || "").toLowerCase() !== g.type.toLowerCase() || !r.display_label || !r.status || !r.authority || !r.source_refs || g.kind === "l" && r.coordinates && !(r.spatial && r.spatial.primary && r.spatial.primary.marker && r.spatial.primary.marker.render === true)) return null;
    var wanted = r.legacy_key || sid, old = g.dict[wanted], key = wanted;
    // 이름이나 legacy key 충돌은 병합 근거가 아니다. 별도 stable_id를 내부 key로 보존한다.
    if (old && (old.stable_id ? old.stable_id !== sid : QA_FIXTURE)) key = sid;   // fixture 항목(stable_id 없음)과 legacy key 가 겹쳐도 덮어쓰지 않는다 — canonical 은 자기 stable_id 키로 따로 둔다(QA fixture 모드)
    if (g.dict[key] && g.dict[key].stable_id && g.dict[key].stable_id !== sid) return null;
    var e = { id: sid, stable_id: sid, legacy_key: r.legacy_key || null, type: g.kind === "rgn" ? r.entity_type : r.type, label: r.display_label, name: r.display_label, aliases: (r.aliases || []).slice(), note: r.reader && (r.reader.headline || r.reader.concise_summary) || "", status: r.status, authority: r.authority, research: r };
    if (g.kind === "p") { e.role = r.role || r.reader && r.reader.role || ""; e.period = r.period || r.chronology && r.chronology.period || ""; }
    else if (g.kind === "evt") { e.period = r.period || r.chronology && r.chronology.period || ""; e.related_places = (r.place_ids || r.related_places || []).slice(); e.related_people = (r.person_ids || r.related_people || []).slice(); }
    else if (g.kind === "rt") { e.period = r.period || r.chronology && r.chronology.period || ""; e.source_place = r.source_place || r.source_place_id || null; e.target_place = r.target_place || r.target_place_id || null; e.related_event = r.related_event || r.related_event_id || null; }
    else if (g.kind === "rgn") { e.position_status = "NO_GEOMETRY"; e.location_state = "unlocated"; e.photos = []; }
    else { var geoPrimary = !!(r.coordinates && r.spatial && r.spatial.primary.marker.render === true); e.position_status = geoPrimary ? "VERIFIED_GEO_COORDINATE" : "NO_EXACT_POINT"; e.location_state = geoPrimary ? "geo_only" : "unlocated"; e.photos = []; }
    g.dict[key] = e; ALIAS_STABLE[key] = sid; STABLE_ALIAS[sid] = key; STABLE_KIND[sid] = g.kind; return key;
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
  function projectionRecord(sid) {   // stable_id 기반 조회: 어느 group 의 기록인지는 attach 된 kind 가 정한다
    var g = STABLE_KIND[sid] && projectionGroups().filter(function (x) { return x.kind === STABLE_KIND[sid]; })[0];
    return g && g.records[sid] || null;
  }
  function seiRecordOk(sid) {
    var m = SEI && SEI.meta && SEI.meta.records && SEI.meta.records.filter(function (x) { return x.record === sid; })[0], r = projectionRecord(sid);
    return !!(m && STABLE_ALIAS[sid] && r && r.source_refs && r.source_refs[0].sha256 === m.source_sha256);
  }
  var SEI_OK = !!(SEI && SEI.meta && SEI.entries && SEI.meta.records && SEI.meta.records.some(function (x) { return seiRecordOk(x.record); }));
  function personIndexAt(pid, n, text) {
    var out = [], src = String(text || ""), persons = PERSON_PJ && (PERSON_PJ.persons || PERSON_PJ.people) || {};
    Object.keys(persons).forEach(function (sid) {
      var r = persons[sid]; if (!r || !STABLE_ALIAS[sid] || !readerVisible(sid) || !r.projection_visibility || r.projection_visibility.scripture_direct_mentions !== true) return;
      var direct = (r.passage_links || []).some(function (p) { return p && p.group === "direct" && p.book === pid.split("-")[0] && +p.chapter === +pid.split("-")[1] && +n >= +(p.v1 || n) && +n <= +(p.v2 || p.v1 || n); });
      if (!direct || !r.display_label) return;
      var spans = [], at = 0, i; while ((i = src.indexOf(r.display_label, at)) >= 0) { spans.push([i, i + r.display_label.length]); at = i + r.display_label.length; }
      if (spans.length) out.push({ kind:"p", id:STABLE_ALIAS[sid], stable_id:sid, spans:spans });
    });
    return out;
  }
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
  // Search facet metadata is presentation-only. It never writes back to the research projection or changes professional authority.
  var SW_PERIOD_ORDER = ["창조·원역사", "족장 시대", "출애굽·광야 시대", "정복·사사 시대", "통일왕국 시대", "분열왕국 시대", "포로 시대", "귀환·회복 시대", "예수 시대", "초대교회·사도 시대", "시대 특정 어려움"];
  var SW_JOURNEY_LABEL = { Moriah_to_Beersheba_return: "모리아에서 브엘세바로 돌아옴", Rehoboth_area_to_Beersheba: "르호봇에서 브엘세바로 이동" };
  function swFacetPeriod(g, r) {
    var v = explicitLabel(r.period || r.chronology && r.chronology.period || r.navigation && r.navigation.period); if (v) return v;
    if (g.kind === "p") { var t = [r.role, r.reader && r.reader.headline, r.reader && r.reader.concise_summary].filter(Boolean).join(" "); if (/족장/.test(t)) return "족장 시대"; }
    return null;
  }
  function swFacetStory(g, sid, r) {
    var v = explicitLabel(r.navigation && (r.navigation.story || r.navigation.scene)); if (v) return v;
    if (g.kind === "p" && r.display_label && recordPassages(r, sid).some(function (p) { return p.book === "gen" && p.chapter >= 12 && p.chapter <= 50; })) return r.display_label + " 이야기";
    return null;
  }
  function swFacetJourneys(r) {
    var out = [], nav = r.navigation || {}, explicit = nav.journeys || nav.journey || nav.route;
    (Array.isArray(explicit) ? explicit : explicit ? [explicit] : []).forEach(function (x) { var v = explicitLabel(x); if (v && out.indexOf(v) < 0) out.push(v); });
    (r.connected && r.connected.routes || []).forEach(function (x) { var raw = explicitLabel(x); var v = SW_JOURNEY_LABEL[raw]; if (v && out.indexOf(v) < 0) out.push(v); });
    return out;
  }
  function normalizedProjection(g, sid, r) {
    var key = STABLE_ALIAS[sid] || attachProjection(g, sid, r), rep = null, media = r.media || [];
    if (r.representative_media_id) rep = media.filter(function (m) { return m.id === r.representative_media_id; })[0] || null;
    return { authority_pool: "CANONICAL", stable_id: sid, compatibility_key: key, entity_type: g.type, kind: g.kind, display_label: r.display_label, aliases: (r.aliases || []).slice(), short_summary: g.kind === "p" && r.reader && r.reader.intro && r.reader.intro.concise_intro || r.reader && (r.reader.headline || r.reader.concise_summary) || null, passage_refs: recordPassages(r, sid), primaryPassage: r.primaryPassage || null, representative_media: rep, role: g.kind === "p" ? explicitLabel(r.role || r.reader && r.reader.role) : null, reader_type: g.kind === "l" ? explicitLabel(r.reader_type || r.place_type && (r.place_type.reader_label || r.place_type.primary)) : null, period: swFacetPeriod(g, r), period_sort_value: r.period_sort_value || r.chronology && r.chronology.sort_value || null, region: explicitLabel(r.region), story: swFacetStory(g, sid, r), journeys: swFacetJourneys(r), reader_location_status: g.kind === "l" ? explicitLabel(r.location && r.location.reader_status || r.spatial && r.spatial.certainty && r.spatial.certainty.reader_location_status) : null, source_place: g.kind === "rt" ? explicitLabel(r.source_place || r.source_place_id) : null, target_place: g.kind === "rt" ? explicitLabel(r.target_place || r.target_place_id) : null, related_people: g.kind === "evt" ? (r.person_ids || r.related_people || []).slice() : [], related_places: g.kind === "evt" ? (r.place_ids || r.related_places || []).slice() : [], has_photo: !!rep, has_archaeology: !!(r.spatial && (r.spatial.sites || []).some(function (x) { return x && x.role === "archaeological_candidate"; })), related_events: (r.connected && r.connected.events || r.events || []).slice(), status: r.status, provenance: { origin: "projection" }, raw: r };
  }
  function normalizedFixture(kind, id, e) {
    return { authority_pool: "FIXTURE", stable_id: e.stable_id || id, compatibility_key: id, entity_type: kind === "p" ? "Person" : "Place", kind: kind, display_label: e.name || e.label, aliases: (e.aliases || []).slice(), short_summary: e.note || null, passage_refs: [], representative_media: null, role: kind === "p" ? e.role || null : null, reader_type: kind === "l" ? e.reader_type || null : null, period: e.period || null, period_sort_value: e.period_sort_value || null, region: e.region || null, story: e.story || null, journeys: (e.journeys || (e.journey ? [e.journey] : [])).slice(), reader_location_status: null, has_photo: false, has_archaeology: false, related_events: (e.related_events || []).slice(), status: e.status || "FIXTURE_SAMPLE", provenance: { origin: "compatibility_fixture" }, raw: e };
  }
  function listEntities(o) {
    o = o || {}; var out = [], seen = {};
    projectionGroups().forEach(function (g) { Object.keys(g.records).forEach(function (sid) { var n = normalizedProjection(g, sid, g.records[sid]); if (n.compatibility_key && !seen[sid]) { seen[sid] = true; out.push(n); } }); });
    [["p", D.people], ["l", D.places]].forEach(function (g) { Object.keys(g[1] || {}).forEach(function (id) { var n = normalizedFixture(g[0], id, g[1][id]); if (!seen[n.stable_id]) { seen[n.stable_id] = true; out.push(n); } }); });
    if (o.type && o.type !== "all") out = out.filter(function (e) { return e.entity_type.toLowerCase() === o.type; });
    return out;
  }
  // ---------- Canonical Consumer Visibility Gate v0.1 (reader-facing exposure only) ----------
  // 리더에게 보이는 조건: reader.published === true AND activation.publishable === true. 둘 중 하나라도 false/누락(한쪽만 있는 경우 포함)이면 숨김(fail-closed).
  // 기록·식별·내부 연구 접근(Region 비공개 검토 화면, 직접 링크)은 그대로 둔다: STORE.get / STORE.listAll 은 게이트가 없고, STORE.list(리더 Search/Explorer)와 STORE.indexAt(본문 태그)만 게이트를 지난다.
  // 보류(HOLD): reader/activation 메타데이터가 아예 없는 레거시 Place 기록(Beersheba·Gerar)의 공개 여부는 아직 결정되지 않았다 → 현재 동작 유지(보임), 자동 승인·메타데이터 생성 없음.
  var LEGACY_NO_GATE_METADATA = "HOLD_KEEP_CURRENT_VISIBILITY";
  function gateRecord(r) {
    var rd = r && r.reader, ac = r && r.activation, hasR = !!rd && typeof rd.published === "boolean", hasA = !!ac && typeof ac.publishable === "boolean";
    if (!r) return false;
    // Project01가 명시적으로 승인한 JudeBible 내부 downstream projection은 앱 내부 Search/본문 연결에만 보인다.
    // external_release=false / published=false / publishable=false 경계는 그대로 보존되며 외부 공개 승인으로 해석하지 않는다.
    if (r.projection_visibility && r.projection_visibility.internal_product === true && rd && rd.internal_product_projection === true && ac && ac.internal_product_projection === true && r.authority && r.authority.downstream === "APPROVED_DOWNSTREAM_PROJECTION" && r.authority.external_release === "NOT_AUTHORIZED") return true;
    if ((!rd || rd.published === undefined) && !ac) return LEGACY_NO_GATE_METADATA === "HOLD_KEEP_CURRENT_VISIBILITY";   // 게이트 메타데이터(reader.published / activation)가 전혀 없는 레거시 기록
    return hasR && hasA && rd.published === true && ac.publishable === true;
  }
  function projectionRecord(sid) { var rec = null; projectionGroups().some(function (g) { if (g.records && g.records[sid]) { rec = g.records[sid]; return true; } return false; }); return rec; }
  function readerVisible(sid) { var rec = projectionRecord(sid); return rec ? gateRecord(rec) : true; }   // 프로젝션 기록이 아닌 fixture 는 이 게이트 대상이 아니다
  function listReaderEntities(o) { return listEntities(o).filter(function (e) { return (QA_FIXTURE || e.authority_pool !== "FIXTURE") && readerVisible(e.stable_id); }); }
  function getEntity(sid) { return listEntities().filter(function (e) { return e.stable_id === sid; })[0] || null; }
  var STORE = {
    resolveKey: resolveKey,
    resolveCompatibilityKey: function (sid) { var e = getEntity(sid); return e && e.compatibility_key || null; },
    stableId: function (kind, id) { return stableOf(kind, id); },
    get: getEntity,
    entity: getEntity,
    list: listReaderEntities,        // 리더 표면(Search/Explorer/빠른 검색): visibility gate 통과분만
    listAll: listEntities,           // 내부 점검용(게이트 없음)
    visible: readerVisible,
    indexOk: function () { return SEI_OK; },
    provenance: function () { return { records: (SEI && SEI.meta && SEI.meta.records || []).map(function (x) { return { record: x.record, source_sha256: x.source_sha256, index_ok: seiRecordOk(x.record) }; }), index_ok: SEI_OK, projection_sources: (PJ && PJ.meta && PJ.meta.records || []).map(function (x) { return { stable_id: x.stable_id, source: x.source }; }), geography_foundation: GF && GF.meta || null }; },
    indexAt: function (pid, n, text) {   // 이 절에 연결된 승인 연구 entity들(검증된 span 만)
      var ents = SEI_OK && SEI.entries[pid + ":" + n] || [], out = [];
      ents.forEach(function (e) {
        var key = STABLE_ALIAS[e.stable_id], kind = STABLE_KIND[e.stable_id], dict = kind && dictOf(kind); if (!key || !dict || !dict[key] || !seiRecordOk(e.stable_id) || !readerVisible(e.stable_id)) return;   // 비공개 기록은 본문 태그로 노출하지 않는다
        var spans = (e.spans || []).filter(function (sp) { return String(text).slice(sp[0], sp[1]) === e.surface; });
        if (spans.length) out.push({ kind: kind, id: key, stable_id: e.stable_id, spans: spans });
      });
      personIndexAt(pid, n, text).forEach(function (p) { if (!out.some(function (x) { return x.stable_id === p.stable_id; })) out.push(p); });
      return out;
    }
  };
  function stableOf(kind, id) { var d = dictOf(kind), r = d && d[id]; return (r && r.stable_id) || id; }
  var TABS = [["context", "문맥"], ["people", "인물"], ["places", "장소"],
              ["photos", "사진"], ["crossref", "관련 본문"], ["resources", "외부 자료"], ["notes", "내 메모"]];
  var state = { passage: "gen-22", verse: null, entity: null, tab: "context", resKind: "전체", preview: null, prevTab: null, panel: "collapsed", sheet: "half", view: "study" };   // Lock v1.1: 왼쪽 Detail 기본 CLOSED, 관점 기본 본문연구
  // ---- 지도 표시 설정(사용자 소유, 영구) ----
  // 시대·인물·장면·장소·경로·카메라가 바뀌어도 이 값은 그대로 둔다. 장면 탐색은 카메라와 활성 콘텐츠만 바꾼다.
  // 바뀌는 곳은 (1) 지도 설정 패널·경로 버튼의 사용자 조작, (2) "기본값으로" 버튼뿐이다. 이 기기 localStorage 에만 저장한다.
  var MAP_PREFS_KEY = "jbc.mapPrefs.v1";
  var MAP_PREF_DEFAULTS = { labels: true, ancientRef: true, modernNames: true, hydrology: true, terrain: true, routes: true, legend: true, modernOpacity: "normal", modernDetail: "normal", routeStyle: "standard" };
  var MAP_PREF_CHOICES = { modernOpacity: ["faint", "normal", "strong"], modernDetail: ["few", "normal", "many"], routeStyle: ["subtle", "standard", "emphasis"] };
  function loadMapPrefs() {
    var p = Object.assign({}, MAP_PREF_DEFAULTS);
    try {
      var raw = JSON.parse(localStorage.getItem(MAP_PREFS_KEY) || "null");
      if (raw && typeof raw === "object") Object.keys(MAP_PREF_DEFAULTS).forEach(function (k) {
        var v = raw[k];
        if (typeof MAP_PREF_DEFAULTS[k] === "boolean") { if (typeof v === "boolean") p[k] = v; }
        else if (MAP_PREF_CHOICES[k] && MAP_PREF_CHOICES[k].indexOf(v) >= 0) p[k] = v;
      });
    } catch (e) {}
    return p;
  }
  function saveMapPrefs() { try { localStorage.setItem(MAP_PREFS_KEY, JSON.stringify(ui.mapDisplay)); } catch (e) {} }
  function setMapPref(k, v) {
    if (!(k in MAP_PREF_DEFAULTS)) return false;
    if (typeof MAP_PREF_DEFAULTS[k] === "boolean") v = !!v; else if (!MAP_PREF_CHOICES[k] || MAP_PREF_CHOICES[k].indexOf(v) < 0) return false;
    ui.mapDisplay[k] = v; saveMapPrefs(); syncMapSettings(); renderMapPane(); return true;
  }
  // 두 겹 상태: mapPrefs(사용자 소유·영구 = ui.mapDisplay 의 다른 이름)와 mapScene(장면 소유·임시, 아래 mapSceneState 가 현재 값에서 계산). 우선순위: 사용자 설정 > 장면 프리셋.
  function resetMapPrefs() { ui.mapDisplay = Object.assign({}, MAP_PREF_DEFAULTS); try { localStorage.removeItem(MAP_PREFS_KEY); } catch (e) {} syncMapSettings(); renderMapPane(); return true; }
  var ui = { refTarget: null, mapMode: "geo", gcam: null, tiles: false, navExplore: false, navSection: null, ovOpen: {}, researchReturnEntity: null, frac: 0.34, mapOpen: false, cam: { x: 50, y: 50, k: 1 }, layers: { route: true, place: true }, mapDisplay: loadMapPrefs(), guideStep: null, journeyOn: false, fracBefore: null, placeBasic: null, rmode: null, rsPlace: null, rsStep: false };   // cam/layers: 지도 카메라·레이어(메모리 전용, URL 미포함)   // 작업공간 표시 설정(URL 에 넣지 않는 개인 레이아웃 값)
  var SPLIT_KEY = "bvc.split.v1", JOURNEY_SPLIT_KEY = "jbc.journeySplit.v1", SPLIT_DEFAULT = 0.34, SPLIT_MAP_MIN_PX = 310, SPLIT_TEXT_MIN_PX = 340, JOURNEY_TEXT_MIN_PX = 300, JOURNEY_TEXT_PX = 320;   // 첫 방문 기본 비율(지도 34% : 본문 66%). 사용자가 드래그하면 그 값이 localStorage 에 저장되어 우선한다.
  Object.defineProperty(ui, "mapPrefs", { get: function () { return ui.mapDisplay; }, enumerable: false });   // 사용자 소유 지도 설정(영구)
  Object.defineProperty(ui, "mapScene", { get: function () { return mapSceneState(); }, enumerable: false });   // 장면 소유 상태(임시·읽기 전용 스냅샷)
  var $ = function (id) { return document.getElementById(id); };
  var wa = function (name) { var c = String(name).charCodeAt(String(name).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 !== 0 ? "과" : "와"; };   // 와/과 (받침에 따라)
  var iga = function (name) { var c = String(name).charCodeAt(String(name).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 !== 0 ? "이" : "가"; };   // 이/가 (받침에 따라)
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  // ---------- Contextual Research projection (ResearchNote / Claim / Evidence; no canonical promotion) ----------
  function contextRecord(id) { return (CTX.records || []).filter(function (r) { return r.record_id === id; })[0] || null; }
  function contextualRecords(pid, verse) {
    return (CTX.by_passage && CTX.by_passage[pid] || []).filter(function (b) { return verse == null || (verse >= b.v1 && verse <= b.v2); })
      .map(function (b) { return contextRecord(b.record_id); }).filter(Boolean);
  }
  function contextPassageLabel(p) {
    var pid = p.book + "-" + p.chapter, P = D.passages && D.passages[pid], base = P ? P.ref.replace(/[장편]$/, "") : pid;
    return base + ":" + p.v1 + (p.v2 && p.v2 !== p.v1 ? "–" + p.v2 : "");
  }
  function contextualResearchHtml(pid, verse) {
    var recs = contextualRecords(pid, verse); if (!recs.length) return "";
    return '<section class="d-sec ctx-research" data-part="contextual-research" data-authority="RESEARCH_CONTEXT_NO_CANONICAL_PROMOTION"><h4 class="d-h">현재 본문과 연결된 연구</h4>' +
      recs.map(function (r) {
        var claims = (r.claims || []).slice(0, 7).map(function (c) { return '<li><strong>' + esc(c.id) + '</strong> ' + esc(c.statement) + ' <span class="meta">' + esc(c.certainty || "") + '</span></li>'; }).join("");
        var refs = (r.passage_refs || []).map(function (p) { return '<button type="button" class="pill" data-context-ref="' + esc(p.book + "-" + p.chapter + ":" + p.v1) + '">' + esc(contextPassageLabel(p)) + '</button>'; }).join("");
        var flags = (r.verify || []).length + " VERIFY · " + (r.hold || []).length + " HOLD";
        return '<article class="ctx-research-item" data-context-record="' + esc(r.record_id) + '" data-public-projection="' + esc(r.public_projection || "") + '">' +
          '<h5 class="ent-name">' + esc(r.title) + '</h5><p class="d-body">' + esc(r.summary || "") + '</p>' +
          (refs ? '<div class="pills">' + refs + '</div>' : "") +
          (claims ? '<details class="research"><summary>주장과 근거</summary><ul class="rs-list">' + claims + '</ul><p class="meta">' + esc(flags) + ' · canonical promotion 없음 · 내부 연구 맥락</p></details>' : "") +
          '</article>';
      }).join("") + '</section>';
  }
  function contextualMapNoticeHtml(pid, verse) {
    var n = 0; contextualRecords(pid, verse).forEach(function (r) { n += (r.entity_candidates || []).filter(function (e) { return e.type === "place" && !e.canonical_entity_id; }).length; });
    return n ? '<p class="helper ctx-map-notice" data-context-map-hold="' + n + '">연결 연구의 장소 후보 ' + n + '건은 canonical 식별·검증 좌표가 없어 지도 점으로 표시하지 않습니다.</p>' : "";
  }
  function foundationPassageRecords(pid, verse) {
    var m=/^([a-z0-9]+)-(\d+)$/.exec(pid||""); if(!m||!GF)return [];
    var book=m[1], ch=+m[2], out=[];
    ["regions","routes"].forEach(function(group){ Object.keys(GF[group]||{}).forEach(function(sid){
      var r=GF[group][sid], hit=(r.passage_links||[]).some(function(p){
        if(p.book!==book || +p.chapter!==ch) return false;
        if(verse==null || p.v1==null) return true;
        return verse>=+p.v1 && verse<=+(p.v2==null?p.v1:p.v2);
      });
      if(hit) out.push({sid:sid,record:r});
    });});
    return out;
  }
  function contextualGuideHtml(pid, verse) {
    var recs = contextualRecords(pid, verse), foundation=foundationPassageRecords(pid,verse);
    if (!recs.length && !foundation.length) return "";
    var html='<section class="g-context-research" data-part="contextual-research"><h3 class="sec-h">연결 연구</h3>';
    html += foundation.map(function(x){
      var r=x.record, sum=r.reader&&r.reader.concise_summary||r.semantic_note||"";
      return '<div class="g-topic foundation-link" data-foundation-record="'+esc(x.sid)+'"><p class="g-theme">'+esc(r.display_label||x.sid)+'</p><p class="meta">'+esc(sum)+'</p><button type="button" class="g-link" data-related-entity="'+esc(x.sid)+'">지리 연구 열기 ›</button></div>';
    }).join("");
    html += recs.map(function (r) {
      return '<div class="g-topic" data-context-record="' + esc(r.record_id) + '"><p class="g-theme">' + esc(r.title) + '</p><p class="meta">' + esc(r.summary || "") + '</p>' +
        '<div class="pills">' + (r.passage_refs || []).map(function (p) { return '<button type="button" class="g-link" data-context-ref="' + esc(p.book + "-" + p.chapter + ":" + p.v1) + '">' + esc(contextPassageLabel(p)) + '</button>'; }).join("") + '</div></div>';
    }).join("");
    return html+'</section>';
  }
  function contextualSearch(q) {
    var nq = norm(q); if (!nq) return [];
    return (CTX.records || []).filter(function (r) {
      var s = [r.title, r.summary].concat((r.claims || []).map(function (c) { return c.statement; })).concat((r.entity_candidates || []).map(function (e) { return e.label; })).join(" ");
      return norm(s).indexOf(nq) >= 0;
    });
  }
  function contextualSearchHtml(q) {
    return contextualSearch(q).map(function (r) {
      var p = (r.passage_refs || [])[0], ref = p ? p.book + "-" + p.chapter + ":" + p.v1 : "";
      return '<article class="ee-item ctx-search-item" data-context-record="' + esc(r.record_id) + '"><button type="button" class="sr-row ee-primary" data-context-ref="' + esc(ref) + '"><span class="sr-ref">연구</span><span class="sr-preview"><strong>' + esc(r.title) + '</strong> · ' + esc(snip(r.summary || "")) + '</span></button></article>';
    }).join("");
  }

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
    var out = annotated(pid) ? entitiesIn(text) : { p: [], l: [] }; out.rgn = [];
    STORE.indexAt(pid, n, text).forEach(function (e) { var a = out[e.kind] || (out[e.kind] = []); if (a.indexOf(e.id) < 0) a.push(e.id); });
    return out;
  }
  function verseEntities(pid, v) { return entitiesAt(pid, v.n, v.text); }
  function currentVerses() { var v = D.passages[state.passage].verses, sel = visualVerses(); return sel.length ? v.filter(function (x) { return sel.indexOf(x.n) >= 0; }) : v; }
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
  function selectedVerseToken() { var a = visualVerses().slice().sort(function(x,y){return x-y;}); if (!a.length) return "all"; var contiguous = a.every(function(n,i){return !i || n === a[i-1] + 1;}); return contiguous && a.length > 1 ? a[0] + "-" + a[a.length-1] : a.join(","); }
  function noteKey() { return "bvc.note." + state.passage + ":" + selectedVerseToken(); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var NOTE_V2_KEY = "bvc.notes.v2";
  function noteScopeVerses() { var a = visualVerses().slice().sort(function(x,y){return x-y;}); if (a.length) return a; var P=D.passages[state.passage]; return P ? P.verses.map(function(v){return v.n;}) : []; }
  function parseNoteToken(pid, token) { var P=D.passages[pid], max=P&&P.verses.length||0, out=[]; if (!token || token==="all") { for(var i=1;i<=max;i++) out.push(i); return out; } token.split(",").forEach(function(part){ var m=/^(\d+)(?:-(\d+))?$/.exec(part.trim()); if(!m)return; var a=+m[1],b=m[2]?+m[2]:a; for(var n=Math.min(a,b);n<=Math.max(a,b);n++) if(n>=1&&n<=max&&out.indexOf(n)<0) out.push(n); }); return out.sort(function(a,b){return a-b;}); }
  function noteRangeLabel(pid, verses) { var P=D.passages[pid], base=P?P.ref:pid, a=(verses||[]).slice().sort(function(x,y){return x-y;}); if(!a.length)return base; if(a.length===(P&&P.verses.length||0))return base+" 전체"; var contiguous=a.every(function(n,i){return !i||n===a[i-1]+1;}); return base+" "+(a.length===1?a[0]+"절":contiguous?a[0]+"–"+a[a.length-1]+"절":a.join(", ")+"절"); }
  function noteV2() { try { var a=JSON.parse(store(NOTE_V2_KEY)||"[]"); return Array.isArray(a)?a:[]; } catch(e){ return []; } }
  function saveNoteV2(a) { store(NOTE_V2_KEY, JSON.stringify(a)); }
  function legacyNotes() { var out=[]; try { JSON.parse(store("bvc.noteIndex")||"[]").forEach(function(k){ var m=/^bvc\.note\.([^:]+):(.+)$/.exec(k),txt=store(k); if(!m||!txt)return; out.push({id:"legacy:"+k,passage:m[1],verses:parseNoteToken(m[1],m[2]),text:txt,legacy:true}); }); } catch(e){} return out; }
  var NOTE_SORT_KEY = "bvc.noteSort";
  function noteSortMode() { var v=store(NOTE_SORT_KEY); return v==="scripture"?"scripture":"record"; }
  function allNotes() { var a=legacyNotes().concat(noteV2()); return a.map(function(r,i){var x=Object.assign({},r);x._order=i;return x;}); }
  function noteSortCompare(a,b) { if(noteSortMode()==="scripture"){ var av=(a.verses||[]),bv=(b.verses||[]),as=av.length?Math.min.apply(null,av):9999,bs=bv.length?Math.min.apply(null,bv):9999,ae=av.length?Math.max.apply(null,av):9999,be=bv.length?Math.max.apply(null,bv):9999; if(as!==bs)return as-bs;if(ae!==be)return ae-be; } return (a._order||0)-(b._order||0); }
  function chapterNotes(pid) { return allNotes().filter(function(r){ return r.passage===pid; }).sort(noteSortCompare); }
  function noteOverlapsActiveSelection(r) { var wanted=visualVerses(); if(!wanted.length)return false; return (r.verses||[]).some(function(n){return wanted.indexOf(n)>=0;}); }
  function noteDisplayTitle(r) { return (r.title && String(r.title).trim()) || "내 메모"; }
  function noteCardRangeLabel(r) { return noteRangeLabel(r.passage,r.verses).replace(/–/g,"-"); }
  function noteSortBarHtml() { var mode=noteSortMode(); return '<div class="note-sort-row"><span class="note-sort-label">메모 정렬</span><select id="note-sort" class="note-sort-select" aria-label="메모 정렬 방식"><option value="record"'+(mode==="record"?" selected":"")+'>기록순</option><option value="scripture"'+(mode==="scripture"?" selected":"")+'>본문순</option></select></div>'; }
  function noteCardsHtml() { var list=chapterNotes(state.passage), bar=noteSortBarHtml(), hasActive=visualVerses().length>0; if(!list.length)return bar; return bar+(hasActive?'<p class="note-chapter-hint">현재 선택 절과 겹치는 메모가 강조됩니다.</p>':"")+'<div class="note-cards">' + list.map(function(r){ var active=noteOverlapsActiveSelection(r); return '<details class="note-card'+(active?" is-active-overlap":"")+'" data-note-id="'+esc(r.id)+'"><summary><span class="note-card-label">'+esc(noteDisplayTitle(r))+" : "+esc(noteCardRangeLabel(r))+'</span>'+(active?'<span class="note-overlap-badge">현재 본문</span>':"")+'</summary><div class="note-card-body"><div class="note-card-view"><div class="note-card-text">'+esc(r.text||"").replace(/\n/g,"<br>")+'</div><div class="note-card-actions"><button type="button" class="btn ghost note-edit" data-note-edit="'+esc(r.id)+'">수정</button><button type="button" class="btn ghost note-delete" data-note-delete="'+esc(r.id)+'">삭제</button></div></div><div class="note-card-editor" hidden><label class="note-edit-label">제목<input type="text" class="note-edit-title" maxlength="80" value="'+esc(r.title||"")+'" placeholder="메모 제목 (선택)"></label><label class="note-edit-label">내용<textarea class="note-edit-text">'+esc(r.text||"")+'</textarea></label><p class="note-edit-scope">본문 범위 · '+esc(noteCardRangeLabel(r))+'</p><div class="note-card-actions"><button type="button" class="btn primary" data-note-edit-save="'+esc(r.id)+'">저장</button><button type="button" class="btn ghost" data-note-edit-cancel>취소</button></div></div></div></details>'; }).join("") + "</div>"; }
  function createNoteRecord(text, title) { var a=noteV2(), now=new Date().toISOString(), verses=noteScopeVerses(); var r={id:"n"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),passage:state.passage,verses:verses,title:String(title||"").trim(),text:text,created:now,updated:now}; a.push(r); saveNoteV2(a); return r; }
  function updateNoteRecord(id,title,text) { title=String(title||"").trim(); text=String(text||"").trim(); if(!id||!text)return null; var now=new Date().toISOString(); if(String(id).indexOf("legacy:")===0){ var legacy=allNotes().filter(function(r){return r.id===id;})[0]; if(!legacy)return null; var a=noteV2(), r={id:"n"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),passage:legacy.passage,verses:(legacy.verses||[]).slice(),title:title,text:text,created:now,updated:now}; a.push(r); saveNoteV2(a); deleteNoteRecord(id); return r.id; } var a2=noteV2(), found=null; a2.forEach(function(r){if(r.id===id){r.title=title;r.text=text;r.updated=now;found=r;}}); if(!found)return null; saveNoteV2(a2); return found.id; }
  function deleteNoteRecord(id) { if(!id)return false; if(String(id).indexOf("legacy:")===0){ var k=String(id).slice(7); try{localStorage.removeItem(k);var idx=JSON.parse(store("bvc.noteIndex")||"[]").filter(function(x){return x!==k;});store("bvc.noteIndex",JSON.stringify(idx));return true;}catch(e){return false;} } var a=noteV2(), n=a.length; a=a.filter(function(r){return r.id!==id;}); if(a.length===n)return false; saveNoteV2(a); return true; }

  function hasVerse(pid, n) { var P = D.passages[pid]; return !!(P && n >= 1 && n <= P.verses.length); }
  function stripTags(s) { return s; }
  function tabLabel(t) { var m = TABS.filter(function (x) { return x[0] === t; })[0]; return m ? m[1] : t; }
  function tabValid(t) { return TABS.some(function (x) { return x[0] === t; }); }
  function entityValid(e) { return !!(e && ((e.kind === "p" && D.people && D.people[e.id]) || (e.kind === "l" && D.places && D.places[e.id]) || (e.kind === "rgn" && D.regions && D.regions[e.id]) || (e.kind === "evt" && D.events && D.events[e.id]) || (e.kind === "rt" && D.routes && D.routes[e.id]))); }
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
      else if (kv[1] === "view") { if (["study", "map", "timeline", "explore"].indexOf(kv[2]) < 0) return null; r.view = kv[2] === "map" ? "study" : kv[2]; }   // 별도 지도 관점은 본문연구 Workspace 로 통합됨(옛 view=map 링크는 본문연구로 연결)
      else if (kv[1] === "sheet") { if (["peek", "half", "full"].indexOf(kv[2]) < 0) return null; r.sheet = kv[2]; }
      else if (kv[1] === "tab") r.tab = kv[2]; else { var em = /^([^.]+)\.(.+)$/.exec(kv[2]); if (!em) return null; r.entity = { kind: em[1], id: resolveKey(em[2]) }; }
    }
    if (r.tab === "map") r.tab = "context";   // 지도 탭은 제거됨(옛 링크 호환)
    if (!D.passages[r.passage] || (r.verse != null && !hasVerse(r.passage, r.verse)) || !tabValid(r.tab) || (r.entity && !entityValid(r.entity))) return null;
    return r;
  }
  // history entry 마다 "떠날 때의 스크롤 앵커"를 남겨 back/forward 가 본문 읽던 자리까지 복원하게 한다.
  var entryCams = {}, entryAnchors = {}, replaceNext = false, currentFrag = "";
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
  function go(passage, verse, keepEntity, keepContext, keepView) {
    verse = verse == null ? null : verse; ui.refTarget = null; ui.rpPerson = null;
    if (!D.passages[passage] || (verse != null && !hasVerse(passage, verse))) { showRefError("유효하지 않은 참조: " + passage + (verse != null ? ":" + verse : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    ui.vsel = []; ui.vanchor = null; ui.vmulti = false;
    if (!keepContext && !ui.navApplying && ui.nav && ui.nav.topic) navEnd(true);   // 주제 밖으로 이동하면(상단 검색·장 이동 등) 주제 탐색 상태와 지도 프리셋을 해제한다
    if (!keepEntity) { atlas90Selection = null; levelBSelection = null; atlasBcSelection = null; atlasExpansionSelection = null; ui.placeBasic = null; ui.rsPlace = null; ui.rsStep = false; if (ui.rmode === "PLACE") ui.rmode = "TEXT"; }   // 다른 본문으로 가면 연구 맥락은 그 본문이 된다(모드는 지명→본문만 정리)
    state.passage = passage; state.verse = verse; state.entity = keepEntity ? state.entity : null; state.preview = null; state.prevTab = null; state.view = keepView && (state.view === "study" || state.view === "timeline") ? state.view : "study";   // 빠른 찾기는 현재 관점(본문연구/연표)을 유지한다
    if (!keepContext) { ui.cam = { x: 50, y: 50, k: 1 }; ui.guideStep = null; ui.navExplore = false; ui.gcam = null; ui.layers = { route: true, place: true }; }   // 관련 본문 이동(keepContext)은 지도 카메라·레이어·네비게이션 상태를 그대로 둔다
    pendingScroll = { mode: verse != null ? "verse" : "top", fresh: verse == null };   // 이전/다음 장·참조 이동은 새 장의 처음부터(옛 읽던 위치 복원 금지)
    render();
    return true;
  }
  // 브랜드 제목은 앱의 "홈"이다. 사용자 레이아웃 선호(분할 비율)는 보존하고, 화면/선택/지도 맥락만 초기 상태로 되돌린다.
  function resetHome() {
    state.passage = "gen-22"; state.verse = null; state.entity = null; state.tab = "context"; state.resKind = "전체"; state.preview = null; state.prevTab = null; state.panel = "collapsed"; state.sheet = "half"; state.view = "study";
    ui.refTarget = null; ui.rpPerson = null; ui.mapOpen = false; ui.tiles = false; ui.navExplore = false; ui.ovOpen = {}; ui.cam = { x: 50, y: 50, k: 1 }; ui.gcam = null; ui.layers = { route: true, place: true }; ui.guideStep = null; navEnd(true); ui.nav.board = false;
    if (typeof swState !== "undefined" && swState) { swState.q = ""; swState.kind = "all"; swState.type = "all"; swState.testament = "all"; swState.period = "all"; swState.region = "all"; swState.sort = "label"; swState.limit = 30; swState.prevFocus = null; closeSearch(true); }
    if ($("sw-query")) $("sw-query").value = "";

    showRefError(""); pendingScroll = { mode: "top" }; replaceNext = true; render(); window.scrollTo(0, 0); return true;
  }
  // 참조 입력창/검색 결과가 쓰는 단일 진입점: 실패하면 현재 본문·절·스크롤을 그대로 둔다.
  function openReference(raw, o) {
    var q = String(raw == null ? "" : raw).trim();
    if (!q) { showRefError("참조를 입력하세요. 예: 창 22:2, 요 3:16, 시편 23편. 현재 본문을 유지합니다."); return false; }
    var r = parseReference(q);
    if (!r) { showRefError("참조 형식을 이해하지 못했습니다: “" + q + "” (예: 창 22:2, 요 3:16, 시편 23편). 현재 본문을 유지합니다."); return false; }
    if (r.error) { showRefError(r.error + " 현재 본문을 유지합니다."); return false; }
    var okGo = go(r.passage, r.verse, false, false, !!(o && o.keepView)); if (okGo) { syncRefInput(true); if (o && o.keepView) recordRecentRef(r); }   // 성공하면 입력창을 정규 표기로 정리(포커스는 유지)
    return okGo;
  }
  // ---- Detail 문맥 모델(잠금): ENTITY_DETAIL(인물·장소·사건·경로) 과 PASSAGE_DETAIL(절·본문·문단) 은 서로 다른 주제다 ----
  var DETAIL_MODEL = { ENTITY: ["Person", "Place", "Event", "Route"], PASSAGE: ["Verse", "Passage", "Pericope"] };
  function detailContext() {
    var en = state.entity;
    if (levelBSelection) return { kind: "ENTITY", subject: "Place", id: levelBSelection, open: state.panel };
    if (atlas90Selection) return { kind: "ENTITY", subject: "Place", id: atlas90Selection, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
    if (ui.placeBasic) return { kind: "ENTITY", subject: "Place", id: ui.placeBasic, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
    if (en) return { kind: "ENTITY", subject: en.kind === "p" ? "Person" : en.kind === "rgn" ? "Region" : "Place", id: en.id, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
    return { kind: "PASSAGE", subject: state.verse != null ? "Verse" : "Passage", passage: state.passage, verse: state.verse, open: state.panel === "open" || isMobile() && state.sheet !== "peek" };
  }
  // 전환 규칙: Entity Detail 의 관련 본문 클릭 → 대상은 Scripture, Detail 문맥 변화 없음(선택 대상·Entity Detail·지도·네비게이션·히스토리 유지, 절 선택 없음).
  // Passage Detail 은 본문 자체의 상세 진입을 사용자가 명시적으로 고른 때만(절 선택, "본문 개요" 복귀) 열린다.
  // 관련 본문(Detail 의 본문 버튼)을 누르면: 본문을 그 위치로 옮기고, 본문 영역을 활성화·전면으로 가져와 읽기 위치로 스크롤하고 강조한다. 두 번째 클릭은 필요 없다.
  function openRelatedPassage(pid, n, n2) {
    n = n || null; n2 = n2 || n;
    if (!D.passages[pid] || (n != null && (!hasVerse(pid, n) || !hasVerse(pid, n2) || n2 < n))) { showRefError("유효하지 않은 참조: " + pid + (n != null ? ":" + n + (n2 > n ? "-" + n2 : "") : "") + " — 현재 본문을 유지합니다."); return false; }
    showRefError("");
    var ctxBefore = state.entity ? state.entity.kind + "." + state.entity.id : null, sheetChanged = false;
    if (isMobile() && state.sheet === "full") { state.sheet = "half"; sheetChanged = true; }   // Detail 은 열어 둔 채 본문이 보이도록 줄인다
    if (pid !== state.passage) { if (!go(pid, null, true, true)) return false; }
    else { var viewChanged = state.view !== "study"; state.view = "study"; if (viewChanged || sheetChanged) render(); }
    // Keep the selected geography's reading viewport when following its scripture links.
    if (state.entity && (state.entity.kind === "rgn" || state.entity.kind === "rt")) {
      if (focusRegionReading(state.entity.kind, state.entity.id)) renderGeoOnly();
    }
    ui.refTarget = { passage: pid, verse: n, verse_end: n2 };   // 범위 전체를 강조·스크롤하되 절 선택 상태나 URL 은 바꾸지 않는다
    updateTextState(); activateScripture(pid, n);
    return true;
  }
  function activateScripture(pid, n) {
    var tp = $("text-pane"); if (tp) { try { tp.inert = false; } catch (e) {} tp.setAttribute("aria-hidden", "false"); }
    var els = document.querySelectorAll("#verses .verse"), el = n != null ? document.querySelector('#verses [data-verse="' + n + '"]') : els[0]; if (!el) return;
    var hb = document.querySelector("header.top"), inset = hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0;
    scrollInReading(el, "start");
    window.scrollBy(0, el.getBoundingClientRect().top - (inset + 16));   // 고정 헤더 바로 아래 읽기 위치(모바일 시트 위쪽 영역)
    el.setAttribute("tabindex", "-1"); try { el.focus({ preventScroll: true }); } catch (e) {}
  }
  // 절 선택: state.verse 는 패널/URL 이 따르는 대표 절(마지막으로 누른 절)이고, ui.vsel 은 다중 선택의 시각 집합이다.
  function visualVerses() { if (ui.vsel && ui.vsel.length && ui.vsel.indexOf(state.verse) >= 0) return ui.vsel; return state.verse != null ? [state.verse] : []; }
  // 절 선택으로 직접 연결된 장소(그 절 본문에 표시된 장소)만 돌려준다: 비관련 위치를 지도에 끌어오지 않는다.
  function verseRelatedPlaces() {
    if (state.entity || state.verse == null || !D.passages[state.passage]) return [];
    var P = D.passages[state.passage], out = [];
    visualVerses().forEach(function (n) { P.verses.forEach(function (v) { if (v.n === n) entitiesAt(state.passage, n, v.text).l.forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); }); });
    return out;
  }
  // 선택 계층: Verse(state.verse) / canonical Entity(state.entity). 마지막 직접 선택이 패널을 정한다.
  function selectVerse(n, mode) {
    ui.refTarget = null; ui.researchReturnEntity = null; ui.rpPerson = null; state.entity = null; state.prevTab = null; state.preview = null;
    ui.rmode = "TEXT"; ui.placeBasic = null; ui.rsPlace = null; ui.rsStep = false;   // BIBLE_VERSE_CLICK: 맥락=본문, 모드=TEXT
    var cur = visualVerses().slice(), next;
    if (mode === "range" && ui.vanchor != null) { var a = Math.min(ui.vanchor, n), b = Math.max(ui.vanchor, n); next = []; for (var i = a; i <= b; i++) next.push(i); state.verse = n; }
    else if (mode === "toggle" || ui.vmulti) {
      var at = cur.indexOf(n); if (at >= 0) cur.splice(at, 1); else cur.push(n);
      next = cur.sort(function (x, y) { return x - y; }); state.verse = at >= 0 ? (next.length ? next[next.length - 1] : null) : n; ui.vanchor = n;
    } else { var off = state.verse === n && cur.length <= 1; next = off ? [] : [n]; state.verse = off ? null : n; ui.vanchor = off ? null : n; }
    ui.vsel = next;
    if (state.verse != null) {   // 절 WORBS 연구를 왼쪽 패널에 보이고, 관련 장소가 있으면 지도를 그 범위로 맞춘다
      ensureContextVisible();
      var rel = verseRelatedPlaces(), mk = rel.length ? geoMarkers().filter(function (m) { return rel.indexOf(m.place) >= 0; }) : [];
      if (mk.length) { ui.gcam = geoFit(mk); if (isMobile()) ui.mapOpen = true; }
    }
    render(); panelScrollTop();
  }
  function updateVerseBar() {
    var bar = $("verse-bar"), cnt = visualVerses().length;
    if (!ui.vmulti) { if (bar) bar.hidden = true; return; }
    if (!bar) { bar = document.createElement("div"); bar.id = "verse-bar"; bar.className = "verse-bar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "다중 선택");
      bar.innerHTML = '<span class="vb-count" aria-live="polite"></span><button type="button" data-vbar="clear">선택 해제</button><button type="button" data-vbar="done">완료</button>'; document.body.appendChild(bar); }
    bar.hidden = false; bar.querySelector(".vb-count").textContent = cnt + "절 선택";
  }
  (function () {   // 모바일: 길게 누르면 다중 선택 모드, 이후에는 탭으로 추가/해제
    var timer = null, fired = false;
    document.addEventListener("pointerdown", function (e) { var v = e.target.closest && e.target.closest("#verses [data-verse]"); if (!v || e.pointerType === "mouse") return; fired = false; clearTimeout(timer);
      timer = setTimeout(function () { fired = true; ui.vmulti = true; selectVerse(+v.dataset.verse, "toggle"); }, 520); }, true);
    ["pointerup", "pointercancel", "pointermove"].forEach(function (t) { document.addEventListener(t, function () { clearTimeout(timer); }, true); });
    document.addEventListener("click", function (e) { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
    document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-vbar]"); if (!b) return; e.stopPropagation();
      if (b.dataset.vbar === "clear") { ui.vsel = []; ui.vanchor = null; state.verse = null; } ui.vmulti = false; render(); }, true);
  })();
  function panelScrollTop() { var p = $("panel"); if (p) { p.scrollTop = 0; try { p.scrollTo({ top: 0, behavior: "auto" }); } catch (e) {} } }
  function selectRpPerson(ref) {   // 이삭 연구 링크/원문 CTA도 현재 canonical Person Card로만 라우팅한다.
    ui.researchReturnEntity = null; ui.rpPerson = null;
    var rp = window.BVCResearchProjection || null, sid = rp && rp.PIN && rp.PIN.researchId;
    if (sid && selectEntityStable(sid)) return true;
    showRefError("현재 인물카드를 연결할 수 없습니다.");
    return false;
  }
  // UI-only broad reading viewpoints; never authoritative region geometry or map markers.
  // Presentation-only broad viewports for known HBA01 foundation identities.
  // These are NOT verified centroids, geographic facts, route shapes or markers.
  var REGION_READING_CAMERAS = {
    "geo.ane": { lon: 35.0, lat: 32.0, width: 38 },
    "geo.fertile_crescent": { lon: 39.0, lat: 34.0, width: 29 },
    "geo.mesopotamia": { lon: 43.0, lat: 34.5, width: 16 },
    "geo.mesopotamia.north": { lon: 41.0, lat: 36.5, width: 11 },
    "geo.mesopotamia.south": { lon: 45.0, lat: 32.5, width: 10 },
    "geo.assyria": { lon: 43.0, lat: 36.0, width: 11 },
    "geo.babylonia": { lon: 44.5, lat: 32.5, width: 10 },
    "hydro.tigris": { lon: 44.0, lat: 35.0, width: 16 },
    "hydro.euphrates": { lon: 41.0, lat: 35.0, width: 20 },
    "geo.egypt": { lon: 30.0, lat: 27.5, width: 18 },
    "geo.egypt.upper": { lon: 32.0, lat: 25.5, width: 11 },
    "geo.egypt.lower": { lon: 31.0, lat: 30.7, width: 8 },
    "hydro.nile": { lon: 31.5, lat: 27.0, width: 22 },
    "landform.nile_delta": { lon: 31.0, lat: 31.0, width: 7 },
    "hydro.nile_cataracts": { lon: 32.5, lat: 23.5, width: 14 },
    "geo.levant": { lon: 35.7, lat: 33.4, width: 13 },
    "geo.syria": { lon: 37.0, lat: 35.0, width: 11 },
    "geo.lebanon": { lon: 35.9, lat: 33.9, width: 7 },
    "geo.canaan_macro": { lon: 35.2, lat: 31.8, width: 9 },
    "relation.levant_land_bridge": { lon: 35.0, lat: 32.7, width: 18 },
    "route.network.ane": { lon: 37.0, lat: 32.8, width: 34 },
    "route.international_coastal": { lon: 34.8, lat: 32.5, width: 15 },
    "route.kings_highway": { lon: 35.7, lat: 31.5, width: 14 }
  };
  function regionReadingCamera(kind, id) {
    if (kind !== "rgn" && kind !== "rt") return null;
    var record = dictOf(kind)[id], sid = record && record.stable_id;
    var raw = record && record.research;
    if (!sid || !raw || !readerVisible(sid)) return null;
    if (kind === "rgn" && !regionRecordOk(sid, raw)) return null;
    if (kind === "rt" && (raw.type !== "Route" || raw.stable_id !== sid)) return null;
    if (raw.geometry && raw.geometry.approved === true) return null;
    var preset = REGION_READING_CAMERAS[sid];
    return preset && isFinite(preset.lon) && isFinite(preset.lat) && isFinite(preset.width) ?
      clampGeoCam({ x: preset.lon, y: GEO.yOf(preset.lat), w: preset.width }) : null;
  }
  function focusRegionReading(kind, id) {
    var target = regionReadingCamera(kind, id);
    if (!target) return false;
    ui.gcam = target; // Camera only; no geometry, route polyline, or spatial identity.
    return true;
  }
  function selectEntity(kind, id) {
    if (kind==="l" && id==="beersheba") ensureEastonCandidate();
    ui.placeBasic = null; ui.rpPerson = null; ui.researchReturnEntity = null; ui.entityOcc = ui.nextOcc || null; ui.nextOcc = null;
    id = resolveKey(id);
    var same = state.entity && state.entity.kind === kind && state.entity.id === id;
    if (same && kind === "l") { ui.rmode = "PLACE"; ui.rsPlace = id; ensureContextVisible(); render(); return; }   // 같은 지명을 다시 눌러도 모드가 바뀌지 않는다(PLACE 유지)
    if (same) { closeEntity(); return; }
    if (kind === "l") { ui.rmode = "PLACE"; ui.rsPlace = id; ui.rsStep = false; } else ui.rmode = null;   // MAP_PLACE_CLICK / PLACE_LINK_CLICK: 맥락=그 지명, 모드=PLACE
    if (!state.entity) state.prevTab = state.tab;
    state.entity = { kind: kind, id: id };
    state.tab = kind === "p" ? "people" : kind === "l" || kind === "rgn" ? "places" : "context";
    if (kind === "l") focusPlace(id);
    if (kind === "rgn" || kind === "rt") focusRegionReading(kind, id);
    if (kind === "l" && isMobile()) ui.mapOpen = true;
    ensureContextVisible();
    render(); panelScrollTop();
  }
  function selectEntityStable(sid) {
    var e = STORE.get(sid), id = e && e.compatibility_key; if (!e || !id) return false;
    var same = state.entity && state.entity.kind === e.kind && state.entity.id === id;
    if (!same) selectEntity(e.kind, id); else {
      if (e.kind === "rgn" || e.kind === "rt") focusRegionReading(e.kind, id);
      ensureContextVisible(); render();
    }
    return true;
  }
  // ---- Research Panel Controller: 선택 맥락(selectedContext)과 연구 모드(researchMode: PLACE | TEXT)를 분리한다 ----
  // 맥락: 여정 장면(ui.rsStep) ↳ 지명(ui.rsPlace) ↳ 본문(state.passage/verse). 모드는 맥락을 바꾸지 않고 패널 본문만 바꾼다. 자료가 없어도 다른 모드로 대신하지 않는다.
  function rsShellOn() { return !localPersonOpen && state.view === "study" && !levelBSelection && !atlas90Selection && !atlasBcSelection && !atlasExpansionSelection && !ui.rpPerson && !(state.entity && state.entity.kind !== "l"); }
  function rsPersonLabel(id) { var d = dictOf("p"), r = d && d[id]; return (r && (r.name || r.label)) || ui.rsPersonLabel || "인물"; }
  function rsPersonInScene(id) {   // 이 장면의 본문 범위(또는 현재 범위)에 그 인물이 직접 나오는가
    var st = rsStepNow(), r = st && st.s.range, pid = r ? r.pid : state.passage, P = D.passages[pid]; if (!P || !id) return false;
    var a = r ? r.v1 : 1, b = r ? r.v2 : P.verses.length;
    for (var n = a; n <= b; n++) { var v = P.verses[n - 1]; if (v && entitiesAt(pid, n, v.text).p.indexOf(id) >= 0) return true; }
    return false;
  }
  function rsMode() { if (ui.rmode === "PERSON" && !state.entity) return "PERSON"; if (state.entity && state.entity.kind === "l") return "PLACE"; if (ui.placeBasic) return "PLACE"; return ui.rmode === "PLACE" ? "PLACE" : "TEXT"; }
  function rsStepNow() { if (!ui.rsStep || !ui.nav || !ui.nav.topic) return null; var tp = navTopicById(ui.nav.topic); return tp && tp.steps[ui.nav.step] ? { tp: tp, s: tp.steps[ui.nav.step] } : null; }
  function rsStepPlaceKey(s) { return s ? (s.waypoint || (s.wp && s.wp.key) || (s.focus && s.focus[0]) || (s.places && s.places[0]) || null) : null; }
  function rsPlaceKey() { if (ui.rsPlace) return ui.rsPlace; var l = D.passages[state.passage] ? scopedEntities("l") : []; return l.length ? l[0] : null; }
  function rsPlaceInfo(key) { return key ? placeIndex().byKey[key] || null : null; }
  function rsPlaceLabel(key) { var p = rsPlaceInfo(key); return (p && p.label) || (D.places[key] && D.places[key].name) || key || ""; }
  function rsPassageLabel() {
    var st = rsStepNow(), P = D.passages[state.passage], book, pid = state.passage, a, b;
    if (st && st.s.range) { var r = st.s.range; P = D.passages[r.pid]; pid = r.pid; a = r.v1; b = r.v2; }
    else { var vs = visualVerses().slice().sort(function (x, y) { return x - y; }); if (vs.length) { a = vs[0]; b = vs[vs.length - 1]; } }
    if (!P) return "";
    book = P.ref.replace(/\s*\d+장.*$/, ""); var ch = pid.split("-")[1];
    return a != null ? book + " " + ch + ":" + a + (b > a ? "–" + b : "") : P.ref;
  }
  function rsTextRelation() {   // 본문연구 전환 가능 여부: 이 맥락에 연결된 본문이 있는가(자료 유무와 별개)
    if (!ui.rsPlace) return true;
    var st = rsStepNow(); if (st) return !!(st.s.refs && st.s.refs.length);
    var p = rsPlaceInfo(ui.rsPlace); return !!(p && p.passageIds && p.passageIds.length) || scopedEntities("l").indexOf(ui.rsPlace) >= 0;
  }
  function rsPlaceRelation() { return !!rsPlaceKey(); }
  function rsShellHtml() {
    var mode = rsMode(), st = rsStepNow(), key = rsPlaceKey(), placeCtx = !!ui.rsPlace || (mode === "PLACE" && !!key), eyebrow, title, sub;
    var n = 0; if (st) { var vis = navTrackIdx(st.tp, st.s.track); n = vis.indexOf(ui.nav.step) + 1; }
    eyebrow = (mode === "PERSON" ? "인물" : placeCtx ? "장소" : "본문") + (n ? " · 여정 " + n : "");
    if (mode === "PERSON") { title = rsPersonLabel(ui.rsPerson); sub = rsPassageLabel(); }
    else if (placeCtx) { title = rsPlaceLabel(key); sub = rsPassageLabel(); }
    else { title = rsPassageLabel(); sub = key ? "관련 지명 · " + rsPlaceLabel(key) : ""; }
    var pOk = rsPlaceRelation(), tOk = rsTextRelation();
    var btn = function (m, label, ok, why) { return '<button type="button" class="rs-seg' + (mode === m ? " is-on" : "") + '" data-rs-mode="' + m + '" aria-pressed="' + (mode === m) + '"' + (ok ? "" : ' disabled aria-disabled="true" title="' + why + '"') + ">" + label + "</button>"; };
    return '<div class="rs-top"><span class="rs-eyebrow" data-part="rs-eyebrow">' + esc(eyebrow) + '</span><button type="button" class="btn ghost rs-memo-open" data-open-memo="1">메모장</button><button type="button" class="btn ghost rs-collapse" data-rs-collapse aria-controls="panel">접기</button></div>' +
      '<h3 class="rs-title" data-part="rs-title">' + esc(title) + "</h3>" + (sub ? '<p class="rs-passage" data-part="rs-passage">' + esc(sub) + "</p>" : "") +
      '<div class="rs-switch" role="group" aria-label="연구 종류" data-part="rs-switch" data-mode="' + mode + '">' + btn("PLACE", "지명연구", pOk, "이 본문에 연결된 지명이 없습니다") + btn("TEXT", "본문연구", tOk, "이 지명에 연결된 본문이 없습니다") + "</div>";
  }
  function rsRenderShell() {
    var sh = $("rs-shell"), sp = $("side-pane"), on = rsShellOn(); if (!sh) return;
    sh.hidden = !on; sh.innerHTML = on ? rsShellHtml() : ""; sh.dataset.mode = on ? rsMode() : ""; if (sp) sp.classList.toggle("has-rs-shell", on);
  }
  function rsStatusHtml(part, title, msg) { return '<section class="ov-sec rs-status" data-part="' + part + '"><h3 class="sec-h ov-h">' + esc(title) + '</h3><p class="empty helper">' + esc(msg) + "</p></section>"; }
  function rsPlaceStatusHtml() { return rsPlaceKey() ? rsStatusHtml("research-status-place", rsPlaceLabel(rsPlaceKey()) + " 지명연구", "지명연구 자료 연결 예정") : rsStatusHtml("research-status-place", "지명연구", "이 맥락에는 연결된 지명이 없습니다."); }
  function rsTextStatusHtml() { return rsStatusHtml("research-status-text", rsPassageLabel() + " 본문연구", "본문연구 자료 연결 예정"); }
  // 연구 모드에 맞게 선택 상태를 정리한다(렌더하지 않음). 지명이 없거나 연구 전이어도 모드는 그대로 두고 상태 화면만 보인다.
  function rsPrepare(mode) {
    ui.rmode = mode; ui.placeBasic = null; ui.rpPerson = null; ui.researchReturnEntity = null; ui.entityOcc = null; state.entity = null;
    if (mode === "PLACE") {
      var key = rsPlaceKey(), p = rsPlaceInfo(key), e = p && p.canonical && p.stableId ? STORE.get(p.stableId) : null;
      if (e && e.compatibility_key) { state.entity = { kind: e.kind, id: e.compatibility_key }; state.tab = "places"; }
      else if (p) ui.placeBasic = key;
    } else if (mode === "PERSON") {   // 인물연구: 같은 인물이 새 맥락에 나오면 그대로, 아니면 다른 모드로 대신하지 않고 "자료 없음" 상태만 보인다
      var pid = ui.rsPerson; ui.rsPersonLabel = pid ? rsPersonLabel(pid) : ui.rsPersonLabel;
      if (pid && rsPersonInScene(pid)) { state.entity = { kind: "p", id: pid }; ui.rmode = null; } else state.entity = null;
    } else state.tab = "context";
  }
  function rsSetMode(mode) {   // RESEARCH_MODE_*_CLICK: 맥락 유지, 모드만 바꾼다
    if (mode !== "PLACE" && mode !== "TEXT") return false;
    if (mode === "PLACE" ? !rsPlaceRelation() : !rsTextRelation()) return false;
    if (mode === "TEXT" && ui.rsPlace && !ui.rsStep) {   // 지명 맥락의 본문은 그 지명이 나오는 본문
      var p = rsPlaceInfo(ui.rsPlace), pid = p && p.passageIds && p.passageIds[0];
      if (pid && D.passages[pid] && p.passageIds.indexOf(state.passage) < 0) { var keepP = ui.rsPlace; go(pid, null, true, true); ui.rsPlace = keepP; }
    }
    rsPrepare(mode); ensureContextVisible(); render(); panelScrollTop(); return true;
  }
  function closeEntity() {
    if (!state.entity) return;
    state.entity = null; ui.placeBasic = null; ui.entityOcc = null; ui.rmode = state.view === "study" ? "TEXT" : null; if (state.prevTab) state.tab = state.prevTab; state.prevTab = null;
    if (state.view === "explore") { state.panel = "collapsed"; if (isMobile()) state.sheet = "half"; }
    render();
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
  // ---- 연구 패널 = 분할 작업공간. 패널이 열리고 닫히는 280ms 동안 지도 폭이 실제로 변한다. 확대(px/단위)·선택·레이어는 유지하고, 끝나면 선택된 지명이 보이는 영역 안에 있게 한다. ----
  var paneAnim = { on: false, lastM: 0, timer: 0 };
  function jbPaneBeginTransition() {
    paneAnim.on = true; paneAnim.lastM = mapPixelSpan();
    clearTimeout(paneAnim.timer); paneAnim.timer = setTimeout(jbPaneEndTransition, 420);   // transitionend 가 오지 않아도(감소된 모션·숨김 탭) 반드시 마무리
  }
  function jbPaneEndTransition() {
    if (!paneAnim.on) return; paneAnim.on = false; clearTimeout(paneAnim.timer);
    try { ui.gcam = clampGeoCam(geoCam()); renderGeoOnly(); jbKeepActiveVisible(); } catch (e) {}
  }
  function jbKeepActiveVisible() {
    var en = state.entity, b = $("map-body"); if (!en || en.kind !== "l" || !b || !b.clientWidth) return;
    var ms = geoMarkers().filter(function (m) { return m.place === en.id; }); if (!ms.length) return;
    var pts = ms.map(function (m) { return GEO.project(m.lat, m.lon); }), fx = 0, fy = 0; pts.forEach(function (p) { fx += p.x / pts.length; fy += p.y / pts.length; });
    var gc = geoCam(), upp = gc.w / mapPixelSpan(), px = b.clientWidth / 2 + (fx - gc.x) / upp, py = b.clientHeight / 2 + (fy - gc.y) / upp, mx = b.clientWidth * .18, my = b.clientHeight * .18;
    if (px < mx || px > b.clientWidth - mx || py < my || py > b.clientHeight - my) { ui.gcam = clampGeoCam({ x: fx, y: fy, w: gc.w }); renderGeoOnly(); }   // 줌은 그대로, 중심만 남은 지도 영역의 중앙으로
  }
  document.addEventListener("transitionend", function (e) { if (e.propertyName === "--jb-current-research-width") jbPaneEndTransition(); });
  function updateContextChrome() {
    var b = document.body, mob = isMobile();
    b.dataset.panel = state.panel; b.dataset.sheet = state.sheet; b.dataset.detailContext = (state.entity || atlas90Selection || atlasBcSelection || atlasExpansionSelection || ui.placeBasic) ? "entity" : "passage";
    var tg = $("panel-toggle"), op = $("panel-open");
    if (tg) {
      var personContext = !!(state.entity && state.entity.kind === "p");
      var lab = personContext ? (mob ? (state.sheet === "full" ? "인물 카드 접기" : "인물 카드 펼치기") : (state.panel === "open" ? "인물 카드 접기" : "인물 카드 펼치기")) : (mob ? { peek: "맥락 시트 열기", half: "맥락 시트 확대", full: "맥락 시트 접기" }[state.sheet] : "맥락 패널 접기");
      tg.textContent = personContext ? (mob ? (state.sheet === "full" ? "접기" : "펼치기") : (state.panel === "open" ? "접기" : "펼치기")) : (mob ? { peek: "열기", half: "확대", full: "접기" }[state.sheet] : "접기"); tg.setAttribute("aria-label", lab); tg.title = lab;
      tg.setAttribute("aria-expanded", String(mob ? state.sheet !== "peek" : state.panel === "open")); tg.dataset.mode = mob ? "sheet" : "panel";
    }
    if (op) op.hidden = !(!mob && state.panel === "collapsed");
    var edge = $("panel-edge-open"); if (edge) edge.hidden = !(!mob && state.panel === "collapsed");
    var rp = !mob && state.panel === "open" ? "expanded" : "collapsed";
    if (b.dataset.researchPane !== rp) { jbPaneBeginTransition(); b.dataset.researchPane = rp; }
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
    var ecam = entryCams[entryKey(location.hash)]; if (ecam !== undefined) ui.gcam = ecam ? Object.assign({}, ecam) : null;
    else if (r.entity && (r.entity.kind === "rgn" || r.entity.kind === "rt")) focusRegionReading(r.entity.kind, r.entity.id);   // 검색 점프로 옮긴 지도는 뒤로 가기에서 이전 카메라로 돌아온다
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
  // WORBS 연구가 이름 직접 언급(DM_NAME)으로 연결한 절에서만, 이미 태그가 아닌 본문 글자의 인물 이름을 눌러 열 수 있게 한다.
  function wrapResearchName(html, ref) {
    var rp = RPJ(), v = rp && rp.ready() ? rp.verse(ref) : null, nm = v && v.cls === "DM_NAME" && rp.subject ? rp.subject() : null;
    if (!nm) return html;
    return html.split(/(<span[\s\S]*?<\/span>)/).map(function (part) { return part.charAt(0) === "<" ? part : part.split(esc(nm)).join('<span class="tag p rp-name" tabindex="0" role="button" data-rp-ref="' + ref + '">' + esc(nm) + "</span>"); }).join("");
  }
  // Word-to-place reader links require an explicitly checked verse and exact KRV token.
  // These are external reference navigation only; they never bind or approve a canonical place ID.
  var ATLAS_VERIFIED_WORD_LINKS = window.JBC_ATLAS_PLACE_WORD_LINKS || {};
  function atlasPlaceWordLinks(text, html, ref) {
    var links = ATLAS_VERIFIED_WORD_LINKS[ref] || [];
    links.forEach(function(x) {
      if (text.split(x.token).length !== 2 || html.split(esc(x.token)).length !== 2 || html.indexOf('>' + esc(x.token) + '</span>') >= 0) return;
      html = html.replace(esc(x.token), '<span class="tag atlas-place-word" role="button" tabindex="0" data-expansion-open="' + esc(x.name) + '" data-authority="REFERENCE_ONLY">' + esc(x.token) + '</span>');
    });
    return html;
  }
  function atlas90WordLinks(text, html, ref) {
    var links = (window.JBC_ATLAS90_WORD_LINKS || {})[ref] || [];
    links.forEach(function(x){
      var token = esc(x.token);
      if (text.split(x.token).length !== 2 || html.split(token).length !== 2 || html.indexOf('>' + token + '</span>') >= 0) return;
      html = html.replace(token, '<span class="tag atlas90-place-word" role="button" tabindex="0" data-atlas90-open="' + esc(x.id) + '">' + token + '</span>');
    });
    return html;
  }
  // Level B: evidence-scoped KRV exact-token navigation, display-only.
  function levelBWordLinks(text, html, ref) {
    var rows=(window.JBC_LEVEL_B_WORD_LINKS||{})[ref]||[];
    rows.forEach(function(x){
      var token=esc(x.token);
      if(text.split(x.token).length!==2 || html.split(token).length!==2 || html.indexOf('>'+token+'</span>')>=0)return;
      html=html.replace(token,'<span class="tag levelb-place-word" role="button" tabindex="0" data-levelb-open="'+esc(x.candidate_id)+'" data-authority="REFERENCE_ONLY">'+token+'</span>');
    });
    return html;
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
        marks.forEach(function (mk) { if (mk.a < l2) return; o2 += esc(text.slice(l2, mk.a)) + '<span class="tag ' + mk.e.kind + '" tabindex="0" role="button" data-kind="' + mk.e.kind + '" data-id="' + mk.e.id + '" data-stable-id="' + esc(mk.e.stable_id) + '" data-source="scripture-index">' + esc(text.slice(mk.a, mk.b)) + "</span>"; l2 = mk.b; });
        html = o2 + esc(text.slice(l2));
      } else html = esc(text);
    }
    html = atlasPlaceWordLinks(text, html, state.passage + ':' + v.n);
    html = atlas90WordLinks(text, html, state.passage + ':' + v.n);
    html = levelBWordLinks(text, html, state.passage + ':' + v.n);
    html = wrapResearchName(html, state.passage + ":" + v.n);
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
    // Person entity는 단어 occurrence 강조만 사용한다. 절 전체 dim/related 강조는 적용하지 않는다.
    try { if (state.entity && state.entity.kind !== "p") withE = versesWith(state.entity.kind, state.entity.id); } catch (e) { withE = null; }
    var rt = ui.refTarget && ui.refTarget.passage === state.passage ? ui.refTarget : null;
    var rtStart = rt && rt.verse != null ? +rt.verse : null, rtEnd = rtStart != null ? +(rt.verse_end || rt.verse) : null;
    var vsel = visualVerses();
    [].forEach.call(box.children, function (el) {
      var n = +el.dataset.verse, inRange = rtStart != null && n >= rtStart && n <= rtEnd;
      var vs = vsel.indexOf(n) >= 0, vprev = vsel.indexOf(n - 1) >= 0, vnext = vsel.indexOf(n + 1) >= 0;
      el.classList.toggle("sel", vs);
      el.classList.toggle("verse-selected", vs);
      el.classList.toggle("verse-selected-single", vs && !vprev && !vnext);
      el.classList.toggle("verse-range-start", vs && !vprev && vnext);
      el.classList.toggle("verse-range-middle", vs && vprev && vnext);
      el.classList.toggle("verse-range-end", vs && vprev && !vnext);
      el.classList.toggle("dim", !!withE && withE.indexOf(n) < 0);
      el.classList.toggle("related", !!withE && withE.indexOf(n) >= 0);
      el.classList.toggle("ref-target", inRange);
      el.classList.toggle("ref-start", inRange && n === rtStart && rtStart !== rtEnd);
      el.classList.toggle("ref-middle", inRange && n > rtStart && n < rtEnd);
      el.classList.toggle("ref-end", inRange && n === rtEnd && rtStart !== rtEnd);
      el.classList.toggle("ref-single", inRange && rtStart === rtEnd);
      var btn = el.firstChild; if (btn && btn.setAttribute) btn.setAttribute("aria-pressed", String(vs));
    });
    updateVerseBar();
    var ttl = $("passage-title"); if (ttl) ttl.classList.toggle("ref-target-passage", !!ui.refTarget && ui.refTarget.passage === state.passage && ui.refTarget.verse == null);
    [].forEach.call(box.querySelectorAll(".rp-name"), function (el) { el.classList.toggle("active", !!ui.rpPerson && !state.entity && ui.rpPerson.ref === el.dataset.rpRef); });
    // 인물·장소 선택은 "누른 그 단어"만 강조한다(절 배경은 건드리지 않음). 같은 대상의 다른 등장은 아주 약한 보조 표시만.
    var occ = ui.entityOcc, seen = {};
    [].forEach.call(box.querySelectorAll(".tag:not(.rp-name)"), function (el) {
      var same = !!state.entity && state.entity.kind === el.dataset.kind && state.entity.id === el.dataset.id, vEl = el.closest("[data-verse]"), vn = vEl ? +vEl.dataset.verse : null, k = vn + ":" + el.dataset.kind + ":" + el.dataset.id, ix = seen[k] = (seen[k] == null ? 0 : seen[k] + 1);
      el.dataset.occ = ix;
      el.classList.toggle("active", same && !!occ && occ.verse === vn && occ.idx === ix && occ.kind === el.dataset.kind && occ.id === el.dataset.id);
      el.classList.toggle("tag-same", same && !el.classList.contains("active"));
    });
  }
  // ---- passage scroll anchor: 화면 맨 위에 걸친 첫 절 ----
  function computeAnchor() {
    var box = $("verses"), internal = box && box.scrollHeight > box.clientHeight + 2 && getComputedStyle(box).overflowY !== "visible";
    var hb = document.querySelector("header.top"), inset = internal ? box.getBoundingClientRect().top : (hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0);
    var vs = document.querySelectorAll("#verses .verse");
    for (var i = 0; i < vs.length; i++) {
      var r = vs[i].getBoundingClientRect();
      if (r.bottom > inset + 6) return r.top - inset <= 6 ? { passage: mounted.passage || state.passage, verse: +vs[i].dataset.verse, offset: Math.round(r.top - inset) } : null;
    }
    return null;
  }
  function restoreAnchor(a) {
    scrollVerse(a.verse, "start");
    if (a.offset == null) return;
    // 저장된 offset 은 computeAnchor 와 같은 기준선(내부 스크롤러면 #verses 상단, 아니면 헤더 하단) 대비 절 상단 위치다.
    // scroll-margin/padding 때문에 "start" 정렬 결과가 0 이 아니므로, 실제 위치를 재서 차이만큼 보정해야 복원을 반복해도 밀리지 않는다.
    var box = $("verses"), internal = box && box.scrollHeight > box.clientHeight + 2 && getComputedStyle(box).overflowY !== "visible";
    var hb = document.querySelector("header.top"), inset = internal ? box.getBoundingClientRect().top : (hb ? Math.max(0, hb.getBoundingClientRect().bottom) : 0);
    var el = document.querySelector('#verses [data-verse="' + a.verse + '"]'); if (!el) return;
    var d = (el.getBoundingClientRect().top - inset) - a.offset;
    if (internal) box.scrollTop += d; else window.scrollBy(0, d);
  }
  // 데스크톱에서 실제 스크롤 책임자는 #verses 하나다. element.scrollIntoView() 는 overflow:hidden 인 조상(#workspace)까지 밀어 헤더 뒤로 레이아웃을 이동시키므로,
  // 내부 스크롤러가 있으면 #verses.scrollTop 만 직접 계산해 움직인다. 모바일(창 스크롤)은 기존 scrollIntoView 계약을 그대로 쓴다.
  function scrollInReading(el, block, smooth) {
    var box = $("verses"), internal = box && box.scrollHeight > box.clientHeight + 2 && getComputedStyle(box).overflowY !== "visible";
    if (!internal || !box.contains(el)) { try { el.scrollIntoView({ block: block, behavior: smooth ? "smooth" : "auto" }); } catch (e) { el.scrollIntoView(); } return; }
    var b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), cs = getComputedStyle(el), top = r.top - b.top + box.scrollTop, bs = getComputedStyle(box), mt = (parseFloat(cs.scrollMarginTop) || 0) + (parseFloat(bs.scrollPaddingTop) || 0), mb = (parseFloat(cs.scrollMarginBottom) || 0) + (parseFloat(bs.scrollPaddingBottom) || 0), t;
    if (block === "center") t = top - (box.clientHeight - r.height) / 2;
    else if (block === "end") t = top + r.height + mb - box.clientHeight;
    else t = top - mt;
    t = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, t));
    if (smooth && box.scrollTo) box.scrollTo({ top: t, behavior: "smooth" }); else box.scrollTop = t;
  }
  function scrollVerse(n, block) {
    var el = document.querySelector('#verses [data-verse="' + n + '"]'); if (!el) return;
    scrollInReading(el, block);
  }
  var scrollTick = false, histTimer = null;
  window.addEventListener("scroll", function () {
    document.body.dataset.stuck = String(window.scrollY > 2);   // 레이아웃을 읽지 않는 값은 즉시 갱신
    if (!scrollTick) {
      scrollTick = true;
      window.requestAnimationFrame(function () {
        scrollTick = false;
        try { var a = computeAnchor(); if (a) anchors[a.passage] = a; else delete anchors[state.passage]; } catch (e) {}
        // 스크롤 중에는 sticky 기준 높이를 다시 측정하지 않는다. --hdr-h는 초기 로드/resize에서만 갱신한다.
      });
    }
    clearTimeout(histTimer);   // 새로고침/복귀용: 현재 entry 의 history.state 에 앵커를 남긴다(새 entry 를 만들지 않음)
    histTimer = setTimeout(function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} }, 250);
  }, { passive: true });
  function applyPendingScroll(remounted) {
    var p = pendingScroll; pendingScroll = null; if (!p) return true;
    if (p.anchor && p.anchor.passage === state.passage) { restoreAnchor(p.anchor); return true; }
    if (p.mode === "verse" && state.verse != null) scrollVerse(state.verse, "center");
    else if (p.mode === "top" && p.fresh) { delete anchors[state.passage]; var vb = $("verses"); if (vb) vb.scrollTop = 0; window.scrollTo(0, 0); }
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
    [].forEach.call(document.querySelectorAll('[data-step="-1"]'), function (b) { b.disabled = !prevId; });
    [].forEach.call(document.querySelectorAll('[data-step="1"]'), function (b) { b.disabled = !nextId; });
    var crumbEl = $("crumb"); if (crumbEl) crumbEl.textContent = state.verse == null ? "절을 클릭하면 아래 패널이 그 절 기준으로 좁혀집니다." : "선택: " + P.ref + " " + scopeLabel() + " · 인물/장소를 클릭하면 관련 절이 강조됩니다.";
    syncRefInput();
    applyPendingScroll(remounted);
  }
  function scopeLabel() { var a = visualVerses().slice().sort(function(x,y){return x-y;}); if (!a.length) return "본문 전체"; if (a.length === 1) return a[0] + "절"; var contiguous = a.every(function(n,i){return !i || n === a[i-1] + 1;}); return contiguous ? a[0] + "–" + a[a.length-1] + "절" : a.join(", ") + "절"; }
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
  // 위치 상태 계약: research certainty는 그대로 보존한다. 좌표가 확정되지 않은 장소도 승인된 후보점이 있으면 presentation-only 추정 점으로 표시하고 지명 옆에 ?를 붙인다.
  var LOC_LABEL = { VERIFIED: "확인된 위치", LIKELY: "유력한 위치", PLAUSIBLE: "가능성 있는 위치", VERIFY: "추정지", DISPUTED: "여러 후보지", UNKNOWN: "위치 미상", HOLD: null };
  var LOC_MARKER = { VERIFIED: "confirmed", LIKELY: "estimated", PLAUSIBLE: "estimated", VERIFY: "estimated", DISPUTED: null, UNKNOWN: null, HOLD: null };
  // Region Reader Language: canonical research values stay untouched; only the visible copy is localized.
  var REGION_READER_NAME = {
    Corinth: "고린도", Cenchreae: "겐그레아", Athens: "아테네", Macedonia: "마게도냐", Paul: "바울", Gallio: "갈리오", Apollos: "아볼로", household_of_Stephanas: "스데바나의 집",
    Negeb: "네겝", "Kadesh-barnea": "가데스 바네아", Hormah: "호르마", Shur: "술", Ziklag: "시글락", Moses: "모세", Joshua: "여호수아", Saul: "사울", Samuel: "사무엘", Agag: "아각", David: "다윗"
  };
  var REGION_READER_RELATION = {
    administrative_center_of_Achaia: "아가야의 행정 중심지", port_and_church_context_within_Corinthian_network: "고린도 교회 네트워크와 연결된 항구", historically_within_Roman_Achaia_and_narrative_precedes_Corinth: "로마 아가야에 속하며 사도행전에서 고린도보다 앞서 등장", paired_neighboring_missionary_region: "바울의 사역에서 아가야와 함께 언급되는 인접 지역",
    ministry_and_correspondence_associated_with_Achaia: "아가야에서의 사역과 서신 활동과 관련", proconsul_of_Achaia: "아가야 총독", sent_to_Achaia_then_located_at_Corinth: "아가야로 파송된 뒤 고린도에서 활동", firstfruits_of_Achaia: "아가야의 첫 열매로 언급됨",
    CORE_REGION: "핵심 활동 지역", STRONG_CONTEXTUAL_ANCHOR: "강하게 연결되는 지리적 기준점", SOUTHERN_CONFLICT_CONTEXT: "남부 지역의 충돌 배경", EGYPTIAN_FRONTIER_CAMPAIGN_REFERENCE: "이집트 접경 지역의 군사 활동과 관련", RAID_TARGET_AND_DAVID_PURSUIT_CONTEXT: "습격과 다윗의 추격 사건과 관련",
    Exodus_memory_and_Deuteronomic_memory: "출애굽기와 신명기의 아말렉 기억과 관련", commander_against_Amalek_at_Rephidim: "르비딤에서 아말렉과 싸운 지휘자", royal_campaign_against_Amalek: "아말렉을 공격한 왕실 군사 작전과 관련", prophetic_command_and_judgment_context: "아말렉에 대한 예언적 명령과 심판과 관련", Amalekite_king_in_1_Samuel_15: "사무엘상 15장에 등장하는 아말렉 왕", raids_and_counterraid_context: "아말렉의 습격과 이에 대한 반격 사건과 관련"
  };
  var REGION_READER_EVENT = {
    Paul_before_Gallio_at_Corinth: "고린도에서 갈리오 앞에 선 바울", Apollos_sent_to_Achaia: "아볼로가 아가야로 파송됨", Macedonia_and_Achaia_collection: "마게도냐와 아가야의 구제 헌금", gospel_reputation_across_Macedonia_and_Achaia: "마게도냐와 아가야에 퍼진 복음의 소문",
    Battle_at_Rephidim: "르비딤에서의 아말렉 전투", Southern_defeat_toward_Hormah: "호르마 방향에서의 남부 패배", Saul_campaign_against_Amalek: "사울의 아말렉 원정", Amalekite_raid_on_Ziklag: "아말렉의 시글락 습격", David_pursuit_after_Ziklag_raid: "시글락 습격 이후 다윗의 추격", Midian_Amalek_Easterners_raiding_coalition: "미디안·아말렉·동방 사람들의 연합 습격"
  };
  var REGION_READER_VERIFY = {
    "exact first-century Achaia provincial boundary geometry": "1세기 아가야 속주의 정확한 경계는 아직 확정되지 않았습니다. 현재 확정 경계선이나 중심 좌표는 적용하지 않았습니다.",
    "precise treatment of Aetolia, Acarnania, Thessaly, Epirus-edge areas by period": "아이톨리아·아카르나니아·테살리아·에피루스 인접 지역의 시대별 범위는 추가 확인이 필요합니다. 현재는 넓은 지리적 범위만 설명합니다.",
    "Gallio exact proconsular dating inside the broad ca. AD 50-52 window": "갈리오의 정확한 아가야 총독 재임 시점은 추가 검증이 필요합니다. 현재는 주후 약 50–52년의 넓은 범위만 사용합니다.",
    "modern Achaea association in source gazetteer": "자료에서 언급되는 현대 아하이아 지역은 참고용입니다. 고대 아가야와 현대 행정구역을 자동으로 동일시하지 않습니다.",
    "exact territorial extent of Amalek by biblical period": "성경 시대별 아말렉의 정확한 활동 범위는 아직 확정되지 않았습니다.",
    "degree of continuity between Exodus, Judges, and early monarchy Amalek traditions": "출애굽기·사사기·초기 왕정 시대의 아말렉 전승이 얼마나 연속되는지는 추가 확인이 필요합니다.",
    "Ain el Qudeirat as Kadesh-Barnea and its role as Amalek spatial anchor": "아인 엘 쿠데이라트와 가데스 바네아의 동일시 및 아말렉 지리 연구에서의 역할은 참고 수준으로 유지합니다.",
    "Tel Masos polity relationship to Amalekites": "텔 마소스와 아말렉의 관계는 여러 견해가 있어 추가 확인이 필요합니다.",
    "Judges 5:14 / Judges 12:15 northern Amalek terminology": "사사기 5장 14절과 12장 15절의 북부 아말렉 표현은 남부 지역과 자동으로 같은 범위로 묶지 않습니다.",
    "Havilah extent in 1 Samuel 15:7": "사무엘상 15장 7절의 하윌라 범위만으로 사울의 원정 경계를 확정할 수 없습니다.",
    "archaeological ethnic attribution": "고고학 자료만으로 특정 유물을 아말렉 민족의 것으로 단정하지 않습니다."
  };
  var REGION_READER_HOLD = {
    fixed_first_century_boundary_polygon: "1세기 아가야의 고정 경계선 확정", region_centroid_coordinate: "지역 중심 좌표 확정", automatic_BAT01_REG_crosswalk: "내부 지역 데이터와의 자동 연결", inferred_route_geometry: "추정 이동 경로의 지도 반영", automatic_person_event_global_ID_creation: "인물·사건 전역 ID 자동 생성", Romans_16_5_direct_Achaia_link_without_textual_variant_resolution: "로마서 16장 5절의 아가야 직접 연결 여부 확정",
    exact_Amalek_polygon: "아말렉의 정확한 경계선 확정", exact_Amalek_centroid: "아말렉 지역 중심 좌표 확정", Ain_el_Qudeirat_as_Amalek_capital: "아인 엘 쿠데이라트를 아말렉의 중심지로 확정", Tel_Masos_as_city_of_Amalek: "텔 마소스를 아말렉 성읍으로 확정", Shasu_equals_Amalek: "샤수와 아말렉을 동일 집단으로 확정", Amalekite_ware_ethnic_label: "고고학 유물에 아말렉 민족 표지를 직접 부여", route_polyline_for_Exodus_17: "출애굽기 17장의 이동·전투 경로선 확정", route_polyline_for_Saul_campaign: "사울의 아말렉 원정 경로선 확정", route_polyline_for_David_pursuit: "다윗의 추격 경로선 확정", BAT01_P_prefix_crosswalk: "내부 식별자와의 자동 교차 연결"
  };
  function regionReaderName(v) { return REGION_READER_NAME[v] || String(v || "").replace(/_/g, " "); }
  function regionReaderRelation(v) { return REGION_READER_RELATION[v] || "관련 연구 관계"; }
  function regionReaderEvent(v) { return REGION_READER_EVENT[v] || "관련 사건"; }
  var REGION_BROAD = { Negev: "네겝", northern_Sinai_context: "북부 시나이 일대" };
  function regionReaderBroad(a) { var n = (a || []).map(function (t) { return REGION_BROAD[t] || String(t).replace(/_/g, " "); }); return n.length === 2 ? n.join("과 ") : n.join(", "); }
  function regionReaderVerify(v) { return REGION_READER_VERIFY[v && v.issue] || "추가 확인이 필요한 연구 항목입니다."; }
  function regionReaderHold(v) { var k = v && (v.label || v.id || v); return REGION_READER_HOLD[k] || "추가 검토 후 반영할 항목"; }
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
  function conciseMapLabel(c) {
    var raw = c && (c.label || c.reader_label) || "", m = raw.match(/\(([^()]*(?:[가-힣])[^()]*)\)\s*$/);
    raw = m ? m[1] : raw.replace(/\(참고\)\s*$/, "");
    return raw.replace(/^현대\s+/, "").replace(/\s+/g, " ").trim();
  }
  function bestUncertainPlaceAnchor(S) {
    var sites = (S && S.sites || []).filter(function (c) { if (!c || !GEO.valid(c.lat, c.lon)) return false; var approvedSite = c.role === "archaeological_candidate" && c.marker && c.marker.render === true && /^VERIFIED_ARCHAEOLOGICAL_SITE$/.test(c.coordinate_status || ""); var leading = c.candidate_role === "LEADING_LOCATION_HYPOTHESIS"; return approvedSite || leading; });
    if (!sites.length) return null;
    sites.sort(function (a, b) {
      function score(x) { return (x.candidate_role === "LEADING_LOCATION_HYPOTHESIS" ? 8 : 0) + (x.marker && x.marker.render === true ? 4 : 0) + (/VERIFIED_ARCHAEOLOGICAL_SITE/.test(x.coordinate_status || "") ? 2 : 0); }
      return score(b) - score(a);
    });
    return sites[0];
  }
  function geoMarkers() {
    // 연구 위치가 있는 모든 canonical 장소는 본문/탐색 장면과 무관하게 점을 유지한다.
    // 지명 라벨의 축척별 위계와 충돌 생략은 visibleGeoMarkers()가 기존대로 담당한다.
    var keys = Object.keys(D.places || {});
    var out = [], fx = ui.navFx;
    keys.forEach(function (k) {
      var p = D.places && D.places[k], R = p && p.research, S = spatialOf(k); if (!S) return;
      if (R && !readerVisible(R.stable_id)) return;   // visibility gate: a hidden entity never renders a map marker
      var sel = !!(state.entity && state.entity.kind === "l" && state.entity.id === k);
      var pc = S.primary && S.primary.coordinates, readerStatus = S.certainty && S.certainty.reader_location_status;
      var fallback = (!pc || !(S.primary.marker && S.primary.marker.render)) && /^(DISPUTED|VERIFY|LIKELY|PLAUSIBLE)$/.test(readerStatus || "") ? bestUncertainPlaceAnchor(S) : null;
      (S.sites || []).forEach(function (c, i) {
        var sp = markerSpec({ lat: c.lat, lon: c.lon, role: c.role, status: c.coordinate_status });
        if (fallback === c) {
          out.push({ id: c.ref || R.stable_id + "#site" + (i + 1), place: k, place_name: p.name, style: "site", lat: c.lat, lon: c.lon, label: p.name, aria_label: p.name + " 추정 위치. 정확한 위치는 미확정.", label_priority: c.map_label_priority || c.label_priority || S.map_label_priority || R.map_label_priority || 2, active: sel, uncertain: true, presentation_only: true, anchor_ref: c.ref || c.label || null });
        } else if (sp.render) out.push({ id: c.ref || R.stable_id + "#site" + (i + 1), place: k, place_name: p.name, style: sp.style, lat: c.lat, lon: c.lon, label: conciseMapLabel(c), aria_label: c.reader_label || c.label, label_priority: c.map_label_priority || c.label_priority || null, active: sp.style === "site" && sel });
      });
      if (pc && S.primary.marker && S.primary.marker.render) {
        var pm = markerSpec({ lat: pc.lat, lon: pc.lon, role: "biblical_place", status: readerStatus });
        if (pm.render) out.push({ id: R.stable_id, place: k, place_name: p.name, style: pm.style, lat: pc.lat, lon: pc.lon, label: p.name, primary: true, label_priority: S.primary.map_label_priority || S.primary.label_priority || null, active: sel });
      }
    });
    if (fx) out.forEach(function (m) { m.nav_state = fx.focus.indexOf(m.place) >= 0 ? "focus" : fx.related.indexOf(m.place) >= 0 ? "related" : null; if (m.nav_state === "focus") m.active = true; });
    var vrel = fx ? [] : verseRelatedPlaces();
    if (vrel.length) { var hit = out.some(function (m) { return vrel.indexOf(m.place) >= 0; }); out.forEach(function (m) { if (vrel.indexOf(m.place) >= 0) m.active = true; else if (hit) m.dim = true; }); }
    return out;
  }
  // Presentation-only inferred routes: research geometry stays null/HOLD. Approved bindings live in data/presentation.routes.js so app code remains record-agnostic.
  var PRESENTATION_ROUTE_SPECS = window.JBC_PRESENTATION_ROUTES && window.JBC_PRESENTATION_ROUTES.routes || {};
  function routeKey(v) { return String(v || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, ""); }
  function routeRows(r) {
    var out = [], seen = {};
    function add(a) { (a || []).forEach(function (x) { if (!x) return; var l = x.label || x.route_label || x.narrative_relation; if (!l || seen[l]) return; seen[l] = 1; out.push({ label: l, row: x }); }); }
    add(r && r.spatial && r.spatial.routes); add(r && r.connected && r.connected.routes); add(r && r.routes);
    return out;
  }
  function presentationRouteSource(label, spec) {
    var fid = spec && spec.entity_id, fr = fid && GF && GF.routes && GF.routes[fid];
    if (fr && fr.foundation_type !== "ROUTE_NETWORK") return { parent_asset_id: fid, parent_type: "Route", record: fr, row: fr, source_kind: "GEOGRAPHY_FOUNDATION" };
    var groups = [{ kind: "Place", records: PJ && PJ.places || {} }, { kind: "Region", records: PJ && PJ.regions || {} }];
    for (var g = 0; g < groups.length; g++) {
      var ids = Object.keys(groups[g].records);
      for (var i = 0; i < ids.length; i++) {
        var r = groups[g].records[ids[i]], rows = routeRows(r);
        for (var j = 0; j < rows.length; j++) if (rows[j].label === label) return { parent_asset_id: ids[i], parent_type: groups[g].kind, record: r, row: rows[j].row };
      }
    }
    return null;
  }
  function researchPresentationAnchor(name) {
    var want = routeKey(name), recs = PJ && PJ.places || {}, ids = Object.keys(recs);
    for (var i = 0; i < ids.length; i++) {
      var r = recs[ids[i]], names = [r.display_label, r.label_en].concat(r.aliases || []);
      if (!names.some(function (n) { return routeKey(n) === want; })) continue;
      var S = r.spatial || {}, pc = S.primary && S.primary.coordinates;
      if (pc && GEO.valid(pc.lat, pc.lon) && S.primary.marker && S.primary.marker.render === true) return { name: name, lat: pc.lat, lon: pc.lon, role: "research_primary", parent_asset_id: ids[i] };
      var sites = (S.sites || []).filter(function (x) { return GEO.valid(x.lat, x.lon); });
      if (sites.length) {
        sites.sort(function (a, b) { return ((b.marker && b.marker.render === true) ? 2 : 0) - ((a.marker && a.marker.render === true) ? 2 : 0); });
        var s = sites[0];
        return { name: name, lat: s.lat, lon: s.lon, role: (s.marker && s.marker.render === true) ? "research_display_marker" : "research_candidate_anchor", anchor_label: s.reader_label || s.label || name, parent_asset_id: ids[i] };
      }
    }
    return null;
  }
  function referencePresentationAnchor(name) {
    var want = routeKey(name), pool = [];
    if (REF_LABELS && REF_LABELS.labels) pool = pool.concat(REF_LABELS.labels);
    if (REF_BULK && REF_BULK.length) pool = pool.concat(REF_BULK);
    for (var i = 0; i < pool.length; i++) {
      var r = pool[i], en = r.name_en || r.name || r.label || "";
      if (routeKey(en) === want && GEO.valid(+r.lat, +r.lon)) return { name: name, lat: +r.lat, lon: +r.lon, role: "reference_anchor", anchor_label: r.name || r.name_en || name, reference_id: r.id || r.feature_id || null };
    }
    return null;
  }
  function referencePresentationAnchorById(refId, label) {
    var pool = [];
    if (REF_LABELS && REF_LABELS.labels) pool = pool.concat(REF_LABELS.labels);
    if (REF_BULK && REF_BULK.length) pool = pool.concat(REF_BULK);
    for (var i = 0; i < pool.length; i++) {
      var r = pool[i];
      if (r.id === refId && GEO.valid(+r.lat, +r.lon)) return { name: label || r.name || r.name_ko || r.name_en || refId, lat: +r.lat, lon: +r.lon, role: "reference_anchor", anchor_label: label || r.name || r.name_ko || r.name_en || refId, reference_id: refId };
    }
    return null;
  }
  function presentationAnchor(spec) {
    if (typeof spec === "string") return researchPresentationAnchor(spec) || referencePresentationAnchor(spec);
    if (!spec || !spec.reference_id) return null;
    var a = referencePresentationAnchorById(spec.reference_id, spec.label);
    if (a) { a.key = spec.key || spec.reference_id; a.source_basis = spec.source_basis || null; }
    return a;
  }
  function presentationRouteStates() {
    return Object.keys(PRESENTATION_ROUTE_SPECS).map(function (label) {
      var spec = PRESENTATION_ROUTE_SPECS[label], src = presentationRouteSource(label, spec);
      if (!src || spec.passages.indexOf(state.passage) < 0) return null;
      if (ui.navRouteIds && ui.navRouteIds.indexOf(label) < 0) return null;   // 주제 Step 이 활성이면 그 Step 의 승인 경로만(없으면 그리지 않는다)
      var anchorSpecs = spec.anchors || [], anchors = anchorSpecs.map(function (n) { return presentationAnchor(n); }), resolved = anchors.filter(Boolean), byKey = {};
      anchorSpecs.forEach(function (a, i) { var key = typeof a === "string" ? a : a.key || a.reference_id; if (anchors[i]) byKey[key] = anchors[i]; });
      var segments = [];
      if (spec.segments) spec.segments.forEach(function (s) {
        var from = byKey[s.from], to = byKey[s.to];
        if (from && to) segments.push({ id: s.id, anchors: [from, to], status: s.status || "ESTIMATED", discontinuous: !!s.discontinuous, source_basis: s.source_basis || null });
      });
      else if (resolved.length >= 2 && resolved.length === anchorSpecs.length) segments.push({ id: label, anchors: resolved, status: "ESTIMATED", discontinuous: false, source_basis: null });
      return { label: label, display_label: src.record && src.record.display_label || label.replace(/_/g, " "), entity_id: spec.entity_id || null, source: src, requested_anchors: anchorSpecs.slice(), anchors: anchors, resolved: resolved, segments: segments, drawable: segments.length > 0, presentation_status: spec.presentation_status || (segments.length ? "PRESENTATION_ONLY_ESTIMATED" : "GEOMETRY_HOLD_INSUFFICIENT_DRAWABLE_ANCHORS"), hold_reason: spec.hold_reason || null, mode: spec.kind === "CORRIDOR_ROUTE" ? "PRESENTATION_ONLY_CORRIDOR_ROUTE" : "PRESENTATION_ONLY_INFERRED_ROUTE", reader_label: spec.reader_label || "추정 이동 경로", research_geometry: null };
    }).filter(Boolean);
  }
  // ---- overlay 개략 경로/지명(PRESENTATION_APPROXIMATE). research route_geometry·canonical 좌표가 아니다. data-place 가 없어 선택·연구 진입 대상이 아니다. ----
  function navCanonPos(k) {   // canonical 장소의 기존 표시 위치(좌표를 새로 만들지 않는다): 비-modern site → 불확실 후보 anchor
    var S = spatialOf(k); if (!S) return null;
    var site = (S.sites || []).filter(function (c) { return GEO.valid(c.lat, c.lon); })[0], pc = S.primary && S.primary.coordinates;
    if (pc && GEO.valid(pc.lat, pc.lon)) return { lat: pc.lat, lon: pc.lon };
    var u = bestUncertainPlaceAnchor(S) || site; return u ? { lat: u.lat, lon: u.lon } : null;
  }
  function navWaypoint(key, mk) {
    var fx = ui.navFx, d = (fx && fx.anchors || []).filter(function (a) { return a.key === key; })[0];
    if (d && d.lat != null) return d;
    var c = fx && fx.catalog && fx.catalog[key]; if (c && c.lat != null) return { lat: c.lat, lon: c.lon };
    var m = mk.filter(function (x) { return x.place === key && x.style !== "modern"; })[0] || mk.filter(function (x) { return x.place === key; })[0];
    return m ? { lat: m.lat, lon: m.lon } : navCanonPos(key);
  }
  // 경로 위계(route-first): 현재 구간(active, 가장 진함) > 전체 여정·관련 경로(context, 같은 계열의 낮은 불투명도) > 지형. 선 굵기만으로 의미를 싣지 않고 색·점선·불투명도·활성 강조를 함께 쓴다.
  // 방향 화살표는 긴 경로에만 2~4개로 드물게 둔다(연속 화살촉 없음). 거리 표시는 눈에 띄는 큰 구간(≥100km)의 현재 구간에만 둔다.
  function navViaPos(k, mk) { return k && typeof k === "object" ? k : navWaypoint(k, mk); }
  function geoKm(a, b) {
    var R = 6371, rad = Math.PI / 180, dLa = (b.lat - a.lat) * rad, dLo = (b.lon - a.lon) * rad, s = Math.pow(Math.sin(dLa / 2), 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.pow(Math.sin(dLo / 2), 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }
  function geoPathKm(pts) { var t = 0; for (var i = 1; i < pts.length; i++) t += geoKm(pts[i - 1], pts[i]); return t; }
  function navRoundKm(km) { return km >= 300 ? Math.round(km / 50) * 50 : Math.round(km / 10) * 10; }
  var NAV_ARROW = "M2 0 L-9 -6.5 L-5.5 0 L-9 6.5 Z";
  function navOverlayRoutesSvg(mk, upx) {
    var fx = ui.navFx; if (!fx || !ui.mapDisplay.routes) return "";
    var draw = function (r, role) {
      var geo = (r.via || []).map(function (k) { return navViaPos(k, mk); }).filter(Boolean);
      if (geo.length < 2) return "";
      var pts = geo.map(function (a) { return GEO.project(a.lat, a.lon); }), seg = [], total = 0, i;
      for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(d); total += d; }
      var lenPx = total / upx, path = pts.map(function (p) { return p.x + "," + p.y; }).join(" "), extra = "", km = geoPathKm(geo);
      var at = function (s) {
        var acc = 0; for (var j = 0; j < seg.length; j++) { if (acc + seg[j] >= s || j === seg.length - 1) { var t = seg[j] ? Math.min(1, Math.max(0, (s - acc) / seg[j])) : 0, a = pts[j], b = pts[j + 1]; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI }; } acc += seg[j]; }
        return { x: pts[0].x, y: pts[0].y, ang: 0 };
      };
      var inner = role === "active" ? Math.min(3, Math.floor(lenPx / 170)) : role === "context" ? Math.min(2, Math.floor(lenPx / 280)) : 0;
      for (i = 1; i <= inner; i++) { var q = at(total * i / (inner + 1)); extra += '<path class="gm-ovroute-arrow" transform="translate(' + q.x + " " + q.y + ") rotate(" + q.ang + ") scale(" + upx * (role === "active" ? 0.85 : 0.7) + ')" d="' + NAV_ARROW + '"/>'; }
      if (role === "active") {
        var e = pts[pts.length - 1], pr = pts[pts.length - 2], ang = Math.atan2(e.y - pr.y, e.x - pr.x) * 180 / Math.PI;
        extra += '<path class="gm-ovroute-head" transform="translate(' + e.x + " " + e.y + ") rotate(" + ang + ") scale(" + upx + ')" d="' + NAV_ARROW + '"/>';
        var sg = r.segment;   // 거리는 구간(segment) 객체의 메타데이터: 그 구간의 번호 경유지 사이 선 위에 붙는다(자유 텍스트 아님)
        if (sg && sg.distanceKm >= 100 && sg.labelAnchor) {
          var ap = GEO.project(sg.labelAnchor.lat, sg.labelAnchor.lon), txt = sg.fromNo + " → " + sg.toNo + " · 약 " + navRoundKm(sg.distanceKm).toLocaleString("en-US") + " km", bw = txt.length * 7 + 18;
          extra += '<g class="gm-seg-label" data-segment-id="' + esc(sg.id) + '" data-route-segment-id="' + esc(sg.routeSegmentId) + '" data-distance-km="' + Math.round(sg.distanceKm) + '" data-from-waypoint="' + esc(sg.fromWaypointId) + '" data-to-waypoint="' + esc(sg.toWaypointId) + '" data-from-no="' + sg.fromNo + '" data-to-no="' + sg.toNo + '" data-route-km="' + Math.round(sg.distanceKm) + '" transform="translate(' + ap.x + " " + ap.y + ") scale(" + upx + ')"><rect x="' + -bw / 2 + '" y="-11" width="' + bw + '" height="22" rx="11"/><text class="gm-dist-label" y="4.6" font-size="13" text-anchor="middle">' + esc(txt) + "</text></g>";
        }
      }
      var cert = r.certainty === "disputed" ? "disputed" : (r.certainty || "low");
      return '<g class="gm-ovroute gm-ovroute-' + role + " gm-cert-" + esc(cert) + '"' + (r.segment ? ' data-route-segment-id="' + esc(r.segment.routeSegmentId) + '" data-from-waypoint="' + esc(r.segment.fromWaypointId) + '" data-to-waypoint="' + esc(r.segment.toWaypointId) + '" data-distance-km="' + Math.round(r.segment.distanceKm) + '"' : "") + ' data-route-role="' + role + '" data-route-mode="PRESENTATION_APPROXIMATE_ROUTE" data-certainty="' + esc(cert) + '" role="img" aria-label="' + esc(r.label) + ' 개략 경로 · 실제 이동로 미확정"><polyline class="gm-ovroute-casing" points="' + path + '" fill="none"/><polyline class="gm-ovroute-line" points="' + path + '" fill="none"/>' + extra + "</g>";
    };
    var inactive = (fx.context || []).map(function (r) { return draw(r, r.certainty === "disputed" ? "alt" : "context"); }).join(""), active = (fx.routes || []).map(function (r) { return draw(r, "active"); }).join("");
    return inactive || active ? '<g class="gm-ovroute-layer" data-role="overlay-approximate-routes">' + inactive + active + "</g>" : "";
  }
  // 경유지(journey waypoint)는 번호 있는 원형 표식, 일반 성경 지명은 작은 점 + 이름. 현재 경유지가 가장 크고 강하다.
  function navWaypointCert(key) { var c = ui.navFx && ui.navFx.catalog && ui.navFx.catalog[key]; return c ? (c.certainty || "low") : "medium"; }
  function navWaypointBadge(w, upx, active) {   // 번호 원(배경·번호). 표식 군(g) 안에서 (0,0) 기준.
    var R = (active ? 13.5 : 11) * upx, fs = (active ? 13.5 : 12) * upx;
    return (active ? '<circle class="gm-wp-halo" r="' + 21 * upx + '"/>' : "") + '<circle class="gm-wp-dot" r="' + R + '"/><text class="gm-wp-num" y="' + fs * 0.36 + '" font-size="' + fs + '" text-anchor="middle">' + w.n + "</text>";
  }
  function navOverlayPlacesSvg(mk, upx, r, L, T, w) {
    var fx = ui.navFx; if (!fx) return "";
    var wps = fx.waypoints || [], isWp = {}, out = "", placed = {}, kept = [], pxPerMap = mapPixelSpan() / w;
    wps.forEach(function (x) { isWp[x.key] = 1; });
    mk.forEach(function (m) { placed[m.place] = 1; });
    (fx.anchors || []).filter(function (a) { return !isWp[a.key]; }).forEach(function (a) {
      var p = GEO.project(a.lat, a.lon), fs = LABEL_LEVELS.L3.px * upx, q = a.certainty === "high" ? "" : '<tspan class="gm-qmark" dx="' + fs * 0.18 + '" dy="' + (-fs * 0.16) + '">?</tspan>';
      var aria = esc(a.label) + " — 개략 위치 · " + esc(NAV_CERT_LABEL[a.certainty] || "") + ", 고대 위치 미확정";
      out += '<g class="gm-navref gm-cert-' + esc(a.certainty) + '" data-nav-place="' + esc(a.key) + '" data-status="' + esc(a.status) + '" data-certainty="' + esc(a.certainty) + '" transform="translate(' + p.x + " " + p.y + ')" role="img" aria-label="' + aria + '"><circle class="gm-navref-dot" r="' + r * 0.8 + '"/><text class="gm-place-label gm-navref-label" x="' + r * 2.4 + '" y="' + fs * 0.34 + '" font-size="' + fs + '" stroke-width="' + fs * 0.25 + '">' + esc(a.label) + q + "</text></g>";
    });
    var order = wps.slice().sort(function (a, b) { return (b.n === fx.active ? 1 : 0) - (a.n === fx.active ? 1 : 0) || a.n - b.n; });
    var pos = {}; wps.forEach(function (x) { pos[x.n] = navWaypoint(x.key, mk); });
    var wpOut = {};
    order.forEach(function (x) {
      var a = pos[x.n]; if (!a || placed[x.key]) return;   // 장면의 canonical 표식이 이미 있으면 그 표식 군이 번호 원을 그린다(geoSvg)
      var active = x.n === fx.active, P = GEO.project(a.lat, a.lon), cat = fx.catalog[x.key] || {}, cert = navWaypointCert(x.key), region = cat.kind === "region" && cat.radius_km;
      var pv = pos[x.n - 1] && GEO.project(pos[x.n - 1].lat, pos[x.n - 1].lon), nx = pos[x.n + 1] && GEO.project(pos[x.n + 1].lat, pos[x.n + 1].lon), side = "r";
      var nb = [pv, nx].filter(Boolean); if (nb.length) { var ax = nb.reduce(function (s, q) { return s + q.x; }, 0) / nb.length; side = ax > P.x ? "l" : "r"; }
      var lv = active ? "L1" : "L2", fs = LABEL_LEVELS[lv].px * upx, R = (active ? 13.5 : 11) * upx, cx = (P.x - L) * pxPerMap, cy = (P.y - T) * pxPerMap;
      var q = cert === "high" || cert === "region" ? "" : '<tspan class="gm-qmark" dx="' + fs * 0.18 + '" dy="' + (-fs * 0.16) + '">?</tspan>', lab = x.label + (q ? "?" : "");
      var off = (active ? 13.5 : 11) + 6, box = labelBox(cx, cy, lab, lv, side, off, 3), disc = { x: cx, y: cy, w: (R / upx) * 2 + 4, h: (R / upx) * 2 + 4 };
      if (!active && boxHit(disc, kept)) {   // 번호 원끼리 겹치면(축소 보기) 겹친 쪽은 번호·이름 없는 작은 점으로 줄인다
        kept.push({ x: cx, y: cy, w: 10, h: 10 });
        wpOut[x.n] = '<g class="gm-navref gm-wp gm-wp-mini" data-nav-place="' + esc(x.key) + '" data-nav-wp="' + x.n + '" data-waypoint-id="' + esc(x.id) + '" data-certainty="' + esc(cert) + '" transform="translate(' + P.x + " " + P.y + ')" role="img" aria-label="' + x.n + ". " + esc(x.label) + ' — 이야기 경유지"><circle class="gm-wp-dot" r="' + 4.5 * upx + '"/></g>';
        return;
      }
      var show = active || !boxHit(box, kept);
      kept.push(disc); if (show) kept.push(box);
      var aria = x.n + ". " + esc(x.label) + " — 이야기 경유지 · 개략 위치, 고대 위치 미확정";
      wpOut[x.n] = '<g class="gm-navref gm-wp ' + (active ? "gm-wp-active" : x.n < fx.active ? "gm-wp-done" : "gm-wp-next") + (x.n === fx.active - 1 ? " gm-wp-from" : "") + " gm-cert-" + esc(cert) + '" data-nav-place="' + esc(x.key) + '" data-nav-wp="' + x.n + '" data-waypoint-id="' + esc(x.id) + '" data-status="' + esc(cat.status || "") + '" data-certainty="' + esc(cert) + '" transform="translate(' + P.x + " " + P.y + ')" role="img" aria-label="' + aria + '">' +
        (region ? '<ellipse class="gm-wp-region" rx="' + cat.radius_km / GEO.km(a.lat) + '" ry="' + cat.radius_km / GEO.km(a.lat) + '"/>' : "") + navWaypointBadge(x, upx, active) +
        '<text class="gm-place-label gm-navref-label gm-wp-label' + (show ? "" : " is-semantic-hidden") + '" x="' + (side === "l" ? -(R + 6 * upx) : R + 6 * upx) + '" y="' + fs * 0.34 + '" font-size="' + fs + '" stroke-width="' + fs * 0.25 + '"' + (side === "l" ? ' text-anchor="end"' : "") + ' data-label-level="' + lv + '">' + esc(x.label) + q + "</text></g>";
    });
    Object.keys(wpOut).map(Number).sort(function (a, b) { return (a === fx.active ? 1 : 0) - (b === fx.active ? 1 : 0) || a - b; }).forEach(function (n) { out += wpOut[n]; });   // 현재 경유지를 맨 위에 그린다
    return out;
  }
  function presentationRouteSvg() {
    if (!ui.mapDisplay.routes) return "";
    var rows = presentationRouteStates().filter(function (r) { return r.drawable; });
    if (!rows.length) return "";
    return '<g class="gm-route-layer" data-role="presentation-only-inferred-routes">' + rows.map(function (r) {
      return r.segments.map(function (s) {
        var pts = s.anchors.map(function (a) { var p = GEO.project(a.lat, a.lon); return p.x + "," + p.y; }).join(" ");
        var ttl = r.reader_label + " · " + r.display_label + " · 실제 이동로 미확정";
        return '<polyline class="gm-route-inferred' + (r.mode === "PRESENTATION_ONLY_CORRIDOR_ROUTE" ? ' gm-route-corridor' : '') + '" points="' + pts + '" fill="none" data-route-label="' + esc(r.label) + '" data-route-entity="' + esc(r.entity_id || "") + '" data-route-segment="' + esc(s.id || "") + '" data-route-mode="' + esc(r.mode) + '" data-segment-status="' + esc(s.status) + '" data-discontinuous="' + s.discontinuous + '" data-parent-asset="' + esc(r.source.parent_asset_id) + '" aria-label="' + esc(ttl) + '"><title>' + esc(ttl) + '</title></polyline>';
      }).join("");
    }).join("") + "</g>";
  }
  function presentationRouteNoticeHtml() {
    if (!ui.mapDisplay.routes) return "";
    var rows = presentationRouteStates();
    if (!rows.length) return "";
    var draw = rows.filter(function (r) { return r.drawable; }).length;
    if (draw) return '<p class="map-note route-note" data-route-note="inferred"><span class="lg-line" aria-hidden="true"></span>' + (rows.some(function (r) { return r.mode === "PRESENTATION_ONLY_CORRIDOR_ROUTE" && r.drawable; }) ? "연구 기반 개략 경로 · 실제 이동로 미확정" : "추정 이동 경로 · 실제 이동 경로 미확정") + '</p>';
    return '<p class="map-note route-note muted" data-route-note="insufficient-anchors">추정 이동 경로 · 연구가 지지하는 연결 기준점이 부족해 선은 표시하지 않습니다.</p>';
  }
  function markerTier(m) {
    if (!m) return 4;
    var explicit = m.label_priority;
    if (explicit === 1 || explicit === "TIER_1_MAJOR") return 1;
    if (explicit === 2 || explicit === "TIER_2_MEDIUM") return 2;
    if (explicit === 3 || explicit === "TIER_3_MINOR") return 3;
    if (explicit === 4 || explicit === "TIER_4_DETAIL") return 4;
    if (m.primary && m.style === "confirmed") return 1;
    if (m.primary) return 2;
    if (m.style === "modern") return 3;
    if (m.style === "site") return 4;
    return 3;
  }
  function semanticTierLimit(w) {
    if (w >= 26) return 1;
    if (w >= 10) return 2;
    if (w >= 5.5) return 3;
    return 4;
  }
  // Semantic zoom: 확대해도 글자가 커지지 않고 더 많은 지명이 드러난다. 크기·굵기·자간은 L0~L5 위계표 한 곳에서만 정한다(연구 지명과 참고 지명 공통).
  //   L0 대지역(크지만 조용함) · L1 주요 지명/선택 대상 · L2 보조 지명 · L3 소지역·유적 · L4 현대 참고 지명 · L5 세부 현대 참고. 수역은 별도 축(WM 주요 수역 / Wm 소수역).
  // 겹침은 글자 축소가 아니라 우선순위로 해결한다(낮은 위계를 생략). px 는 화면 px 이므로 줌·브라우저 배율과 무관하게 같은 크기로 읽힌다.
  var LABEL_LEVELS = {
    L0: { px: 15.5, weight: 400, ls: 0.18, role: "region_major" },
    L1: { px: 15.75, weight: 680, ls: 0, role: "place_major" },
    L2: { px: 14.5, weight: 620, ls: 0, role: "place_secondary" },
    L3: { px: 13.5, weight: 560, ls: 0.03, role: "region_minor_or_site" },
    L4: { px: 11.5, weight: 400, ls: 0, role: "modern_reference" },
    L5: { px: 11, weight: 400, ls: 0, role: "modern_reference_detail" },
    XA: { px: 11.5, weight: 400, ls: 0.04, role: "external_ancient_reference" },
    XM: { px: 11, weight: 400, ls: 0, role: "external_modern_reference" },
    WM: { px: 13.5, weight: 400, ls: 0.12, role: "water_major" },
    Wm: { px: 11.5, weight: 400, ls: 0.05, role: "water_minor" }
  };
  function markerLevel(m) {
    if (m.active) return m.style === "modern" ? "L4" : "L1";   // 선택 대상은 위계 1 이상으로 끌어올린다
    if (m.style === "modern") return "L4";
    var t = markerTier(m);
    if (m.uncertain) return t <= 1 ? "L1" : t === 2 ? "L2" : "L3";   // inferred biblical label uses its own tier even when anchored to a site marker
    if (m.style === "site") return "L3";
    return t <= 1 ? "L1" : t === 2 ? "L2" : "L3";
  }
  function refLevel(l) {
    if (l.kind === "extancient") return "XA";
    if (l.kind === "extmodern") return "XM";
    if (l.kind === "water") return l.tier <= 2 ? "WM" : "Wm";
    if (l.kind === "region") return l.tier <= 2 ? "L0" : "L3";
    return l.tier <= 2 ? "L4" : "L5";
  }
  function labelPx(m) { return LABEL_LEVELS[markerLevel(m)].px; }
  function mapPixelSpan() { var b = document.getElementById("map-body"), w = b ? b.clientWidth : 0, h = b ? b.clientHeight : 0; return Math.max(w, h) || Math.max(window.innerWidth || 900, 600); }
  // ---- 모든 지명 표시(allLabels): Natural Earth 기반 수역·지역·현대 참고 지명. 연구 자료/Place/Site 와 무관한 표시 전용 레이어. ----
  var REF_LABELS = window.JBC_REFERENCE_LABELS || null;
  var REF_FEATURES = refGate("names_modern") && window.JBC_REFERENCE_FEATURES && window.JBC_REFERENCE_FEATURES.layer !== "RESEARCH" ? window.JBC_REFERENCE_FEATURES : null;
  // 일괄 수집된 현대 참고 지명(Natural Earth populated places): 원본 feature id 를 보존하고, 큐레이션 라벨이 이미 그리는 같은 feature 는 건너뛴다. 이름만으로 합치지 않는다.
  var REF_BULK = REF_FEATURES && REF_FEATURES.features ? REF_FEATURES.features.filter(function (f) { return !f.cur; }).map(function (f) { return { id: f.id, kind: "modern", name: f.name_ko || f.name_en, tier: f.tier, lat: f.lat, lon: f.lon, source: f.src, source_feature_id: f.fid, layer: "REFERENCE" }; }) : [];
  // 라벨 기본값: 성경 지명 · 고대 참고(수역·지역) · 외부 참고 지명 · 현대 지명이 모두 기본 ON 이다(표시 기본값일 뿐 외부 자료를 연구 근거로 올리는 뜻이 아니다). 사용자가 개별로 끌 수 있고, 모든 지명(allLabels)은 기존처럼 더 많은 참고 지명을 드러내는 마스터 토글이다.
  // 위계(충돌 우선순위): 선택·본문 연결 연구 지명 > 성경 지명 > 고대 지역·수역 > 결속된 외부 고대 참고 > 외부 현대 참고. 외부 지명은 성경 지명보다 시각적으로 우세하지 않고, 충돌 시 항상 먼저 생략된다. 데이터는 지우거나 바꾸지 않는다.
  // 사용자는 정보 "종류"(성경·고대 참고·현대)만 고른다. 외부 자료의 출처 구분은 내부 provenance 이며 별도 조작 대상이 아니다: 외부 고대/현대 참고는 각각 고대 참고·현대 지명 설정을 따른다.
  function refNameVisibility() { var d = ui.mapDisplay; return { ancient: !!d.ancientRef, modern: !!d.modernNames }; }
  // 결속된 외부 참고 중 신뢰 소스가 검증되었고 좌표가 있는 것만 지도에 참고 지명으로 그린다(좌표는 참고 표시 전용 — 내부 좌표를 대체하지 않는다). 소스가 등록되지 않았거나 좌표가 없으면 그리지 않는다.
  function boundExternalLabels() {
    var out = [], B = REFBIND && REFBIND.bindings; if (!B) return out;
    Object.keys(B).forEach(function (sid) { B[sid].bound.forEach(function (b) {
      var c = b.coordinates; if (!c || c.render !== true || b.bind_status !== "BOUND" || !b.name) return;
      out.push({ id: b.ref_id, kind: /ancient|region/.test(b.role || "") ? "extancient" : "extmodern", name: b.name, tier: 3, lat: c.lat, lon: c.lon, layer: "EXTERNAL_REFERENCE", source: b.provider, source_feature_id: b.ext_id, bound_to: sid });
    }); });
    return out;
  }
  function refLabelList() {
    var base = (REF_LABELS && REF_LABELS.labels || []).filter(function (l) { return l.kind === "modern" ? refGate("names_modern") : refGate("names_physical"); });
    return base.concat(REF_BULK, boundExternalLabels());
  }
  // 라벨 상자(화면 px). align: "c" 가운데 / "r" 점 오른쪽 / "l" 점 왼쪽. 자간을 폭에 포함하고, pad 로 이웃과 최소 간격을 둔다.
  function labelBox(cx, cy, text, lv, align, off, pad) {
    var d = LABEL_LEVELS[lv], w = Math.max(24, (text || "").length * d.px * (0.98 + d.ls)), h = d.px * 1.25, x = align === "r" ? cx + off + w / 2 : align === "l" ? cx - off - w / 2 : cx;
    return { x: x, y: cy, w: w + pad * 2, h: h + pad };
  }
  function boxHit(a, list) { return list.some(function (k) { return Math.abs(a.x - k.x) < (a.w + k.w) / 2 && Math.abs(a.y - k.y) < (a.h + k.h) / 2; }); }
  // 표식 라벨을 점 좌우로 갈라 놓는 규칙(표식끼리 겹쳐 보이지 않도록). 지도 그리기와 충돌 판정이 같은 규칙을 쓴다.
  function labelSides(mk) { var order = mk.slice().sort(function (a, b) { return a.lon - b.lon; }), side = {}; mk.forEach(function (m) { side[m.id] = order.length > 1 && order.indexOf(m) % 2 === 0 ? "l" : "r"; }); return side; }
  var MARKER_R_PX = 3.5, MARKER_LABEL_GAP = 2.8;   // 일반 성경 지명 점: 이전(2.88)보다 조금 크게. 호버 시 1.5배(CSS)
  // 충돌 우선순위(낮을수록 먼저 자리를 얻는다): 선택·본문 연결 연구 지명(항상) > 주요 수역 > 대지역 > 소수역 > 소지역 > 결속된 외부 고대 참고 > 주요 현대 참고 > 결속된 외부 현대 참고 > 세부 현대 참고. 같은 순위 안에서는 tier, 인구 순.
  function refPriority(lv) { return lv === "WM" ? 0 : lv === "L0" ? 1 : lv === "Wm" ? 2 : lv === "L3" ? 3 : lv === "XA" ? 4 : lv === "L4" ? 5 : lv === "XM" ? 6 : 7; }
  // 현대 참고 지명이 한 화면을 뒤덮지 않도록 하는 상한(줌이 깊어질수록 허용량이 늘어난다).
  function refBudget(w) { return w >= 18 ? 6 : w >= 10 ? 10 : w >= 5.5 ? 16 : 22; }
  function referenceLabelsSvg(gc, upx, L, T) {
    if ((!REF_LABELS || !REF_LABELS.labels) && !REF_BULK.length) return "";
    var w = gc.w, limit = semanticTierLimit(w), pxPerMap = mapPixelSpan() / w, kept = [], mk = geoMarkers(), sides = labelSides(mk), vis = {};
    visibleGeoMarkers(gc).forEach(function (m) { vis[m.id] = 1; });
    mk.forEach(function (m) {   // 연구 표식(점)과 보이는 연구 라벨이 항상 먼저 자리를 차지한다
      var p = GEO.project(m.lat, m.lon), cx = (p.x - L) * pxPerMap, cy = (p.y - T) * pxPerMap;
      kept.push({ x: cx, y: cy, w: 16, h: 16 });
      if (vis[m.id]) kept.push(labelBox(cx, cy, m.label, markerLevel(m), sides[m.id], MARKER_R_PX * MARKER_LABEL_GAP, 3));
    });
    (ui.navFx && ui.navFx.anchors || []).forEach(function (a) {   // 성경 지명(overlay)이 먼저 자리를 차지한다
      var p = GEO.project(a.lat, a.lon), cx = (p.x - L) * pxPerMap, cy = (p.y - T) * pxPerMap;
      kept.push({ x: cx, y: cy, w: 16, h: 16 }, labelBox(cx, cy, a.label + "?", "L3", "r", MARKER_R_PX * MARKER_LABEL_GAP, 3));
    });
    (ui.navFx && ui.navFx.waypoints || []).forEach(function (x) {   // 번호 경유지와 그 이름도 먼저 자리를 차지한다(현대 참고 지명이 가리지 않도록)
      var a = navWaypoint(x.key, mk); if (!a) return; var p = GEO.project(a.lat, a.lon), cx = (p.x - L) * pxPerMap, cy = (p.y - T) * pxPerMap;
      kept.push({ x: cx, y: cy, w: 30, h: 30 }, labelBox(cx, cy, x.label + "?", x.n === ui.navFx.active ? "L1" : "L2", "r", 20, 3), labelBox(cx, cy, x.label + "?", x.n === ui.navFx.active ? "L1" : "L2", "l", 20, 3));
    });
    var show = refNameVisibility();
    var cand = refLabelList().filter(function (l) { return l.tier <= limit && ((l.kind === "modern" || l.kind === "extmodern") ? show.modern : show.ancient); }).map(function (l) { var p = GEO.project(l.lat, l.lon); return { l: l, p: p, lv: refLevel(l) }; })
      .filter(function (c) { return c.p.x >= L - w * 0.02 && c.p.x <= L + w * 1.02 && c.p.y >= T - w * 0.02 && c.p.y <= T + w * 1.02; })
      .sort(function (a, b) { return refPriority(a.lv) - refPriority(b.lv) || a.l.tier - b.l.tier || (b.l.pop || 0) - (a.l.pop || 0); });
    var S = pxPerMap * w, bd = document.getElementById("map-body"), cw = bd && bd.clientWidth || S, ch = bd && bd.clientHeight || S, x0 = (S - cw) / 2, y0 = (S - ch) / 2;   // 정사각 viewBox 중앙 슬라이스: 실제로 보이는 화면 영역
    kept.push({ x: x0 + cw / 2, y: y0 + ch - 13, w: cw, h: 26 }, { x: x0 + cw - 90, y: y0 + 28, w: 180, h: 50 }, { x: x0 + 28, y: y0 + ch / 2, w: 56, h: ch });   // 하단 출처 줄·상단 지도 제목 칩·좌측 도구 막대 자리는 비워 둔다
    var out = "", modernLeft = Math.round(refBudget(w) * ({ few: 0.5, normal: 1, many: 1.6 }[ui.mapDisplay.modernDetail] || 1));   // 현대 지명 밀도(사용자 설정)
    cand.forEach(function (c) {
      var l = c.l, d = LABEL_LEVELS[c.lv], cx = (c.p.x - L) * pxPerMap, cy = (c.p.y - T) * pxPerMap, modern = l.kind === "modern" || /^ext/.test(l.kind), fs = d.px * upx * (modern ? 0.86 : 1);
      if (modern && modernLeft <= 0) return;
      var box = labelBox(cx, cy, l.name, c.lv, modern ? "r" : "c", 6, modern ? 5 : 3);
      if (box.x - box.w / 2 < x0 + 4 || box.x + box.w / 2 > x0 + cw - 4 || box.y - box.h / 2 < y0 + 4 || box.y + box.h / 2 > y0 + ch - 4) return;   // 화면 가장자리에서 잘리는 이름은 그리지 않는다
      if (boxHit(box, kept)) return;
      kept.push(box); if (modern) modernLeft--;
      var dot = modern ? '<circle class="gm-ref-dot" r="' + w * 0.0011 + '"/>' : "";
      out += '<g class="gm-ref gm-ref-' + l.kind + (l.layer === "EXTERNAL_REFERENCE" ? " gm-ref-ext" : "") + '" data-ref="' + esc(l.id) + '" data-ref-kind="' + l.kind + '"' + (l.layer === "EXTERNAL_REFERENCE" ? ' data-ref-layer="EXTERNAL_REFERENCE" data-bound-to="' + esc(l.bound_to) + '"' : "") + (l.source ? ' data-ref-source="' + esc(l.source) + '" data-ref-fid="' + esc(l.source_feature_id) + '"' : "") + ' data-semantic-tier="' + l.tier + '" data-label-level="' + c.lv + '" transform="translate(' + c.p.x + " " + c.p.y + ')">' + dot + '<text x="' + (modern ? w * 0.0045 : 0) + '" y="' + fs * 0.34 + '" font-size="' + fs + '" stroke-width="' + (fs * 0.2) + '"' + (modern ? "" : ' text-anchor="middle"') + '>' + esc(l.name) + "</text></g>";
    });
    return '<g class="gm-ref-layer" data-role="reference-names-not-research" data-layer="EXTERNAL_REFERENCE">' + out + "</g>";
  }
  function visibleGeoMarkers(gc) {
    gc = gc || geoCam();
    var limit = semanticTierLimit(gc.w), mk = geoMarkers(), sides = labelSides(mk), all = mk.map(function (m) { var x = Object.assign({}, m); x.tier = markerTier(x); return x; });
    var visible = all.filter(function (m) { return m.active || m.tier <= limit; });   // 점은 항상 남고 라벨만 semantic tier 를 따른다. 선택 대상은 줌과 무관하게 라벨을 유지한다.
    visible.sort(function (a, b) { return (b.active ? 100 : 0) + (5 - b.tier) - ((a.active ? 100 : 0) + (5 - a.tier)); });   // 선택 대상 > 위계 순
    var kept = [], boxes = [], pxPerMap = mapPixelSpan() / gc.w;
    visible.forEach(function (m) {
      var p = GEO.project(m.lat, m.lon), box = labelBox(p.x * pxPerMap, p.y * pxPerMap, m.label, markerLevel(m), sides[m.id], MARKER_R_PX * MARKER_LABEL_GAP, 3);
      if (m.active || !boxHit(box, boxes)) { kept.push(m); boxes.push(box); }
    });
    return kept;
  }
  function markerSelect(place) { var same = state.entity && state.entity.kind === "l" && state.entity.id === place; if (same) { ensureContextVisible(); render(); } else selectEntity("l", place); }
  function unlocatedNote(id) { var R = D.places[id] && D.places[id].research, st = R && R.location && R.location.reader_status; return D.places[id].name + (st === "DISPUTED" || !R ? " — 정확한 위치에 대해서는 여러 견해가 있어 지도에 점으로 표시하지 않습니다." : " — 정확한 위치가 확정되지 않아 지도에 점으로 표시하지 않습니다."); }
  // </spatial-binding>
  function geoAvailable() { try { return geoMarkers().length > 0; } catch (e) { return false; } }
  function mapModeNow() { return "geo"; }
  var GEO_CAMERA = {
    initial: { lon: 34.8, lat: 31.2, w: 10.5 },
    minW: 1.625,   // 최대 확대: 이전 최대(w=3.25)의 정확히 2배 화면 축척(보이는 경도폭 절반)
    fitMinW: 3.25,   // 명시적 맞춤(fit)은 이전과 같은 지역 읽기 하한을 유지한다
    maxW: 40,
    bounds: { west: 8, east: 52, south: 10, north: 50 }
  };
  // 본문연구 Workspace 의 지도는 세로로 긴 창이므로 viewBox(정사각 w)가 아니라 실제로 보이는 반폭/반높이로 범위를 제한한다.
  function mapVisHalf(w) {
    var b = document.getElementById("map-body"), cw = b ? b.clientWidth : 0, ch = b ? b.clientHeight : 0, m = Math.max(cw, ch);
    return m > 0 ? { hw: w * cw / m / 2, hh: w * ch / m / 2 } : { hw: w / 2, hh: w / 2 };
  }
  // 최대 축소: 넓은 창에서는 보이는 가로 40°, 세로로 긴 창(본문연구 Workspace)에서도 같은 40° 가로폭이 보이도록 w 상한을 창 비율만큼 키운다.
  function maxWFor() { var b = document.getElementById("map-body"), cw = b ? b.clientWidth : 0, ch = b ? b.clientHeight : 0, m = Math.max(cw, ch); return cw > 0 ? Math.max(GEO_CAMERA.maxW, GEO_CAMERA.maxW * m / cw) : GEO_CAMERA.maxW; }
  function clampGeoCam(c) {
    var w = Math.max(GEO_CAMERA.minW, Math.min(maxWFor(), +c.w || GEO_CAMERA.initial.w));
    var b = GEO_CAMERA.bounds, top = GEO.yOf(b.north), bottom = GEO.yOf(b.south);
    var vh = mapVisHalf(w), xmin = b.west + vh.hw, xmax = b.east - vh.hw, ymin = top + vh.hh, ymax = bottom - vh.hh;
    if (xmin > xmax) xmin = xmax = (b.west + b.east) / 2; if (ymin > ymax) ymin = ymax = (top + bottom) / 2;
    return {
      x: Math.max(xmin, Math.min(xmax, +c.x || GEO_CAMERA.initial.lon)),
      y: Math.max(ymin, Math.min(ymax, isFinite(+c.y) ? +c.y : GEO.yOf(GEO_CAMERA.initial.lat))),
      w: w
    };
  }
  function geoFit(mk) {
    // Explicit fit may move closer than first entry, but never below the regional-reading zoom floor.
    if (!mk || !mk.length) return clampGeoCam({ x: GEO_CAMERA.initial.lon, y: GEO.yOf(GEO_CAMERA.initial.lat), w: 8 });
    var pts = mk.map(function (m) { return GEO.project(m.lat, m.lon); }), xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return clampGeoCam({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(GEO_CAMERA.fitMinW, Math.max(x1 - x0, y1 - y0) * 3.2) });
  }
  function geoInitialCam() {
    // HARAM-like first entry: Israel / Jordan Rift / eastern Mediterranean, not a world or marker-fit view.
    return clampGeoCam({ x: GEO_CAMERA.initial.lon, y: GEO.yOf(GEO_CAMERA.initial.lat), w: GEO_CAMERA.initial.w });
  }
  function geoCam() { if (ui.gcam && ui.gcam.__ml) return ui.gcam; return clampGeoCam(ui.gcam || geoInitialCam()); }   // MapLibre 에서 온 카메라는 이미 지도 제약을 따른다
  var LOCAL_BASEMAP = refGate("land") && window.JBC_LOCAL_BASEMAP || null, LOCAL_BASEMAP_META = window.JBC_LOCAL_BASEMAP_META || null;
  var LOCAL_BASEMAP_10M = refGate("land") && window.JBC_LOCAL_BASEMAP_10M || null, localLandPathCache = null, terrainLandPathsCache = null;
  function ringPath(ring) {
    var out = "";
    (ring || []).forEach(function (c, i) {
      if (!c || c.length < 2 || !isFinite(c[0]) || !isFinite(c[1])) return;
      var lat = Math.max(-85, Math.min(85, +c[1])), p = GEO.project(lat, +c[0]);
      out += (i ? "L" : "M") + p.x.toFixed(4) + " " + p.y.toFixed(4);
    });
    return out ? out + "Z" : "";
  }
  function landPolygonPathsOf(data) {
    if (!data || !Array.isArray(data.features)) return [];
    var paths = [];
    data.features.forEach(function (f) {
      var g = f && f.geometry, polys = !g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
      polys.forEach(function (poly) {
        var path = "";
        (poly || []).forEach(function (ring) { var p = ringPath(ring); if (p) path += p; });
        if (path) paths.push(path);
      });
    });
    return paths;
  }
  function landPathOf(data) { return landPolygonPathsOf(data).join(""); }
  function localLandPath() { if (localLandPathCache === null) localLandPathCache = landPathOf(LOCAL_BASEMAP); return localLandPathCache; }
  function terrainLandPaths() {
    if (terrainLandPathsCache === null) {
      terrainLandPathsCache = landPolygonPathsOf(LOCAL_BASEMAP_10M);
      if (!terrainLandPathsCache.length) terrainLandPathsCache = localLandPath() ? [localLandPath()] : [];
    }
    return terrainLandPathsCache;
  }
  function terrainLandPath() { return terrainLandPaths().join(""); }
  function localBasemapSvg(L, T, w) {
    var paths = terrainLandPaths(), meta = (window.JBC_LOCAL_BASEMAP_10M_META && window.JBC_LOCAL_BASEMAP_10M_META.dataset) || (LOCAL_BASEMAP_META && LOCAL_BASEMAP_META.dataset) || "";
    var land = paths.map(function (p) { return '<path class="gm-local-land" d="' + p + '" fill-rule="evenodd"/>'; }).join("");
    var seaMask = 'M' + L + ' ' + T + 'H' + (L + w) + 'V' + (T + w) + 'H' + L + 'Z' + paths.join("");
    return '<g class="gm-local-basemap" data-source="' + esc(meta) + '"><rect class="gm-local-sea" x="' + L + '" y="' + T + '" width="' + w + '" height="' + w + '"/>' + land + seaToneSvg(seaMask) + '</g>';
  }
  var TERRAIN_TILES = refGate("terrain") && window.JBC_TERRAIN_TILES || null;
  var HYDROLOGY = refGate("hydrology") && window.JBC_HYDROLOGY || null;
  function terrainTileBounds(gc, z) {
    var n = Math.pow(2, z), vh = mapVisHalf(gc.w), L = gc.x - vh.hw * 1.04, R = gc.x + vh.hw * 1.04, T = gc.y - vh.hh * 1.04, B = gc.y + vh.hh * 1.04;
    return {
      x0: Math.floor((L + 180) / 360 * n),
      x1: Math.floor((R + 180) / 360 * n),
      y0: Math.floor((1 + T / 180) / 2 * n),
      y1: Math.floor((1 + B / 180) / 2 * n)
    };
  }
  function terrainNativeResolutionM(z, lat) {
    return 156543.03392804097 * Math.cos((lat || GEO.latOf(geoCam().y)) * Math.PI / 180) / Math.pow(2, z);
  }
  function terrainWantedZoom(w) {
    // Camera span → native terrain level. Keep the rendered tile at or below its
    // native 256px information density instead of magnifying a lower-resolution level.
    if (w <= 6.5) return 10;
    if (w <= 9.0) return 9;
    if (w <= 13.0) return 8;
    if (w <= 18.0) return 7;
    return 6;
  }
  function terrainZoom(gc) {
    if (!TERRAIN_TILES || !TERRAIN_TILES.ranges) return null;
    var zs = (TERRAIN_TILES.zooms || [5,6,7,8,9,10]).slice().sort(function(a,b){ return b-a; });
    var want = terrainWantedZoom(gc.w);
    for (var i = 0; i < zs.length; i++) {
      var z = zs[i]; if (z > want) continue;
      var r = TERRAIN_TILES.ranges[String(z)], q = terrainTileBounds(gc, z);
      if (r && q.x0 >= r.xmin && q.x1 <= r.xmax && q.y0 >= r.ymin && q.y1 <= r.ymax) return { z: z, q: q, wanted: want };
    }
    // 세로로 긴 창의 최대 축소처럼 보이는 영역이 지원 범위를 일부 벗어나면, 가장 낮은 해상도 레벨의 지원 범위 안쪽 타일만 그린다(나머지는 기본 육지색).
    for (var j = 0; j < zs.length; j++) {
      var zl = zs[j]; if (zl > want) continue; var rl = TERRAIN_TILES.ranges[String(zl)], ql = terrainTileBounds(gc, zl); if (!rl) continue;
      var qc = { x0: Math.max(ql.x0, rl.xmin), x1: Math.min(ql.x1, rl.xmax), y0: Math.max(ql.y0, rl.ymin), y1: Math.min(ql.y1, rl.ymax) };
      if (qc.x0 <= qc.x1 && qc.y0 <= qc.y1) return { z: zl, q: qc, wanted: want, partial: true };
    }
    return null;
  }
  // ---- 지도 테마(WARM_EDITORIAL_ATLAS): hillshade 는 그대로 두고 밝기→테마 팔레트로 재채색(gradient map). 지오메트리/DEM/명암 방향은 바꾸지 않는다. ----
  function themeTok(n) { try { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); } catch (e) { return ""; } }
  function hexRgb(h) { var m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return null; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function reliefFilterSvg() {
    var c = function (n, fb) { return hexRgb(themeTok(n)) || hexRgb(fb); };
    var d = c("--map-relief-deep", "#A69C8C"), sh = c("--map-relief-shadow", "#BAB1A1"), m = c("--map-relief-mid", "#D5CDBE"), b = c("--map-land-base", "#E3DCCD"), h = c("--map-relief-high", "#F2ECE0");
    // 원본 hillshade 밝기 분포: 평지 ≈0.83, 그림자 하위 2% ≈0.74, 최저 ≈0.6, 하이라이트 상위 ≈0.94. 팔레트 순서(밝기)에 따라 정렬:
    // Light = deep < shadow < mid < base < highlight / Dark = deep < shadow < base < mid < highlight (중간톤을 더 밝게 올려 갈색 taupe 중간톤을 만든다)
    var dark = (b[0] + b[1] + b[2]) / 3 < 128, N = 64, ch = [[], [], []];
    var stops = dark ? [[0.55, d], [0.70, sh], [0.78, sh], [0.822, b], [0.836, b], [0.855, m], [0.915, h]] : [[0.55, d], [0.685, sh], [0.76, m], [0.822, b], [0.836, b], [0.885, h]];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1), col;
      if (t <= stops[0][0]) col = stops[0][1]; else if (t >= stops[stops.length - 1][0]) col = stops[stops.length - 1][1];
      else for (var k = 1; k < stops.length; k++) if (t <= stops[k][0]) { var a0 = stops[k - 1], a1 = stops[k], u = (t - a0[0]) / (a1[0] - a0[0]); col = [0, 1, 2].map(function (j) { return a0[1][j] + (a1[1][j] - a0[1][j]) * u; }); break; }
      for (var j = 0; j < 3; j++) ch[j].push((col[j] / 255).toFixed(4));
    }
    return '<defs><filter id="gm-relief-theme" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues="' + ch[0].join(" ") + '"/><feFuncG type="table" tableValues="' + ch[1].join(" ") + '"/><feFuncB type="table" tableValues="' + ch[2].join(" ") + '"/></feComponentTransfer></filter></defs>';
  }
  function syncThemeToggle() {   // 사이드바 하단의 직접 토글: Light 에서는 moon(→다크), Dark 에서는 sun(→라이트)
    var b = document.getElementById("rail-theme"); if (!b) return; var dark = mapThemeNow() === "dark", name = dark ? "sun" : "moon", tip = dark ? "라이트 모드" : "다크 모드";
    var old = b.querySelector(":scope > svg.ico"); if (old) old.remove(); b.dataset.ico = name; injectIcons();
    b.setAttribute("aria-label", tip); b.title = tip; b.setAttribute("aria-pressed", String(dark)); var lab = b.querySelector(".rail-lab"); if (lab) lab.textContent = dark ? "라이트" : "다크";
  }
  function mapThemeNow() { var t = document.documentElement.dataset.mapTheme; if (t === "light" || t === "dark") return t; try { return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; } catch (e) { return "light"; } }
  function setMapTheme(v) {   // 화면 테마(앱 + 지도 함께): 같은 값을 data-theme / data-map-theme 에 두고 저장한다. 지도는 토큰만 바뀌어 같은 상태로 다시 그려진다.
    var de = document.documentElement; if (v === "light" || v === "dark") { de.dataset.mapTheme = v; de.dataset.theme = v; } else { delete de.dataset.mapTheme; delete de.dataset.theme; }
    try { localStorage.setItem("jbc.theme", v || "auto"); } catch (e) {} syncMapSettings(); syncThemeToggle(); renderGeoOnly();
  }   // 토큰만 바꿔 같은 카메라·레이어·선택 상태로 즉시 다시 그린다
  try { var savedTheme = localStorage.getItem("jbc.theme") || localStorage.getItem("jbc.mapTheme"); if (savedTheme === "light" || savedTheme === "dark") { document.documentElement.dataset.mapTheme = savedTheme; document.documentElement.dataset.theme = savedTheme; } } catch (e) {}
  try { var mqTheme = window.matchMedia("(prefers-color-scheme: dark)"), onTheme = function () { if (!document.documentElement.dataset.mapTheme) { syncThemeToggle(); renderGeoOnly(); } }; mqTheme.addEventListener ? mqTheme.addEventListener("change", onTheme) : mqTheme.addListener(onTheme); } catch (e) {}
  // 물은 완전한 단색이 아니라 아주 약한 톤 변화(판화/atlas plate 느낌). 저주파 노이즈를 테마의 물 그림자색으로 낮은 알파로만 얹는다(글로시/그라디언트 UI 금지).
  function seaToneSvg(seaMask) {
    var s = hexRgb(themeTok("--map-water-shade")) || [134, 169, 186], lb = hexRgb(themeTok("--map-land-base")) || [229, 222, 209], dk = (lb[0] + lb[1] + lb[2]) / 3 < 128, ak = dk ? '0.5 -0.19' : '0.78 -0.265';   // Light: 단색에 가깝지 않게 톤 변화를 조금 더 / Dark: 호수가 단단해 보이지 않게 더 부드럽게
    return '<defs><filter id="gm-sea-tone" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 ' + (s[0] / 255).toFixed(3) + ' 0 0 0 0 ' + (s[1] / 255).toFixed(3) + ' 0 0 0 0 ' + (s[2] / 255).toFixed(3) + ' 0 0 0 ' + ak + '" result="t"/><feComposite in="t" in2="SourceGraphic" operator="in"/></filter></defs><path class="gm-sea-tone" d="' + seaMask + '" fill-rule="evenodd" fill="#000" filter="url(#gm-sea-tone)"/>';
  }
  function terrainBasemapSvg(gc) {
    var pick = terrainZoom(gc), landPaths = terrainLandPaths();
    if (!pick) return "";
    var z = pick.z, q = pick.q, n = Math.pow(2, z), tileW = 360 / n, out = "";
    var bleed = tileW * 0.0015;
    for (var ty = q.y0; ty <= q.y1; ty++) for (var tx = q.x0; tx <= q.x1; tx++) {
      out += '<image class="gm-terrain-tile" href="data/terrain_tiles/' + z + '/' + tx + '/' + ty + '.jpg" x="' + (tx / n * 360 - 180 - bleed / 2) + '" y="' + (360 * ty / n - 180 - bleed / 2) + '" width="' + (tileW + bleed) + '" height="' + (tileW + bleed) + '" preserveAspectRatio="none"/>';
    }
    // Terrain tiles cover the full Web-Mercator viewport. A normal SVG even-odd sea mask
    // is painted above them so ocean stays subdued while land relief remains visible.
    // This avoids browser clipPath edge/cancellation artifacts from many disjoint polygons.
    var L = gc.x - gc.w / 2, T = gc.y - gc.w / 2, B = gc.y + gc.w / 2;
    var seaMask = 'M' + L + ' ' + T + 'H' + (L + gc.w) + 'V' + B + 'H' + L + 'Z' + landPaths.join("");
    var nativeRes = terrainNativeResolutionM(z, GEO.latOf(gc.y));
    return reliefFilterSvg() + '<g class="gm-terrain-tiles" filter="url(#gm-relief-theme)" data-z="' + z + '" data-wanted-z="' + pick.wanted + '" data-native-res-m="' + nativeRes.toFixed(1) + '" data-camera-span="' + gc.w.toFixed(3) + '" data-source="Mapzen Terrain Tiles / AWS Open Data" data-labels="none">' + out + '</g><path class="gm-terrain-sea-mask" d="' + seaMask + '" fill-rule="evenodd"/>' + seaToneSvg(seaMask) + '<path class="gm-terrain-coast" d="' + landPaths.join("") + '"/>';
  }
  function hydroLinePath(line) {
    var out = "";
    (line || []).forEach(function (c, i) {
      if (!c || c.length < 2 || !isFinite(c[0]) || !isFinite(c[1])) return;
      var p = GEO.project(Math.max(-85, Math.min(85, +c[1])), +c[0]);
      out += (i ? "L" : "M") + p.x.toFixed(5) + " " + p.y.toFixed(5);
    });
    return out;
  }
  function hydrologySvg() {
    if (!HYDROLOGY) return "";
    var lakes = (HYDROLOGY.lakes || []).map(function (lake) {
      var d = (lake.rings || []).map(function (ring) { return ringPath(ring); }).join("");
      return d ? '<path class="gm-hydro-lake" data-hydro="' + esc(lake.name) + '" d="' + d + '" fill-rule="evenodd"/>' : "";
    }).join("");
    var rivers = (HYDROLOGY.rivers || []).map(function (river) {
      return (river.lines || []).map(function (line) {
        var d = hydroLinePath(line);
        return d ? '<path class="gm-hydro-river" data-hydro="' + esc(river.name) + '" d="' + d + '"/>' : "";
      }).join("");
    }).join("");
    return '<g class="gm-hydrology" data-role="physical-geography-reference">' + lakes + rivers + '</g>';
  }
  function geoTiles(gc) {   // 일반 지리 basemap(래스터 타일). 연구 overlay와 독립된 presentation/reference layer.
    var z = Math.max(2, Math.min(17, Math.round(Math.log(360 / (gc.w * 0.45)) / Math.LN2))), n = Math.pow(2, z), left = gc.x - gc.w / 2, right = gc.x + gc.w / 2, top = gc.y - gc.w / 2, bot = gc.y + gc.w / 2;
    var tx0 = Math.floor((left + 180) / 360 * n), tx1 = Math.floor((right + 180) / 360 * n), ty0 = Math.floor((1 + top / 180) / 2 * n), ty1 = Math.floor((1 + bot / 180) / 2 * n), out = "";
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 36) return "";
    for (var tx = tx0; tx <= tx1; tx++) for (var ty = ty0; ty <= ty1; ty++) if (ty >= 0 && ty < n) out += '<image href="' + GEO.tileUrl({ z: z, x: ((tx % n) + n) % n, y: ty }) + '" x="' + (tx / n * 360 - 180) + '" y="' + (180 * (2 * ty / n - 1)) + '" width="' + (360 / n) + '" height="' + (360 / n) + '" preserveAspectRatio="none" referrerpolicy="strict-origin-when-cross-origin"/>';
    return '<g class="gm-tiles">' + out + "</g>";
  }
  function geoSvg() {
    var gc = geoCam(), mk = geoMarkers(), visibleLabels = {};
    visibleGeoMarkers(gc).forEach(function (m) { visibleLabels[m.id] = 1; });
    var w = gc.w, L = gc.x - w / 2, Rr = gc.x + w / 2, T = gc.y - w / 2, B = gc.y + w / 2, step = GEO.niceStep(w), gridFs = w * 0.0105, scaleFs = w * 0.0115, out = "", nf = function (v) { return Math.abs(v) >= 1 ? +v.toFixed(2) : +v.toFixed(3); };
    var ML_ON = mlActive(), terrain = !ML_ON && ui.mapDisplay.terrain ? terrainBasemapSvg(gc) : "", basemapMode = ML_ON ? "maplibre" : (terrain ? "terrain" : (ui.mapDisplay.terrain ? "fallback" : "flat"));   // MapLibre 모드: 바탕(지형·바다/육지·수계)은 MapLibre 가 그리고 이 SVG 는 오버레이만
    // 지형 음영 OFF: relief(hillshade)만 제거하고 육지색·바다색·해안선은 ON 과 같은 값으로 유지한다(Natural Earth 육지 윤곽 + 동일 색 토큰).
    if (!ML_ON) out += terrain ? ('<rect class="gm-base-sea" x="' + L + '" y="' + T + '" width="' + w + '" height="' + w + '"/>' + terrain) : localBasemapSvg(L, T, w);
    if (!ML_ON && ui.mapDisplay.hydrology) out += hydrologySvg();
    // Provider labels, roads, POI and coordinate-graticule text are intentionally absent.
    // JudeBible research labels are the only labels rendered above the terrain.
    var upx = w / mapPixelSpan(), r = MARKER_R_PX * upx;   // 표식 반지름 = 고정 화면 px(창 크기와 무관)
    out += referenceLabelsSvg(gc, upx, L, T);
    out += navOverlayRoutesSvg(mk, upx);   // 족장 시대 overlay 의 개략 경로(표시 전용·certainty 별 선 스타일)
    out += presentationRouteSvg();   // 표시 전용 추정 경로: research route_geometry와 분리된 transient 점선
    var sides = labelSides(mk), wpMap = {}, wpDone = {};   // 표식이 겹쳐 보이지 않도록 라벨을 좌우로 갈라 놓는다
    (ui.navFx && ui.navFx.waypoints || []).forEach(function (x) { wpMap[x.key] = x; });
    mk.forEach(function (m) {
      var p = GEO.project(m.lat, m.lon), lab = esc(m.label), left = sides[m.id] === "l";
      var labelFs = labelPx(m) * upx;
      var shape = m.uncertain ? '<circle class="gm-shape" r="' + r + '"/>' : (m.style === "site" ? '<circle class="gm-ring" r="' + r * 1.9 + '"/><rect class="gm-shape" x="' + -r + '" y="' + -r + '" width="' + r * 2 + '" height="' + r * 2 + '" transform="rotate(45)"/>' : (m.style === "modern" ? '<circle class="gm-shape" r="' + r + '"/>' : m.style === "confirmed" ? '<circle class="gm-shape" r="' + r + '"/>' : '<circle class="gm-ring" r="' + r * 1.3 + '"/><circle class="gm-shape" r="' + r * 0.5 + '"/>'));
      var wpx = wpMap[m.place] && !wpDone[m.place] ? wpMap[m.place] : null, wpAct = !!wpx && wpx.n === ui.navFx.active, wr = wpx ? (wpAct ? 13.5 : 11) * upx + 6 * upx : r * 2.8;
      if (wpx) { wpDone[m.place] = 1; shape = navWaypointBadge(wpx, upx, wpAct); labelFs = LABEL_LEVELS[wpAct ? "L1" : "L2"].px * upx; }   // 번호 있는 경유지: canonical 표식이 그대로 번호 원이 된다(클릭·연구 진입 유지)
      var qmark = m.uncertain ? '<tspan class="gm-qmark" dx="' + labelFs * 0.18 + '" dy="' + (-labelFs * 0.16) + '">?</tspan>' : "";
      var labelVisible = !!visibleLabels[m.id] || !!m.active;
      var text = ui.mapDisplay.labels ? '<text class="gm-place-label' + (labelVisible ? '' : ' is-semantic-hidden') + '" x="' + (left ? -wr : wr) + '" y="' + labelFs * 0.34 + '" font-size="' + labelFs + '" stroke-width="' + (labelFs * 0.25) + '"' + (left ? ' text-anchor="end"' : "") + ' data-semantic-tier="' + markerTier(m) + '" data-label-level="' + markerLevel(m) + '" aria-hidden="' + (labelVisible ? "false" : "true") + '">' + lab + qmark + "</text>" : "";
      out += '<g class="gm gm-' + m.style + (wpx ? " gm-wp " + (wpAct ? "gm-wp-active" : wpx.n < ui.navFx.active ? "gm-wp-done" : "gm-wp-next") + (wpx.n === ui.navFx.active - 1 ? " gm-wp-from" : "") : "") + (m.uncertain ? " gm-uncertain" : "") + (m.active ? " active" : "") + (m.dim ? " gm-dim" : "") + (m.nav_state ? " gm-" + m.nav_state : "") + '"' + (m.nav_state ? ' data-nav-state="' + m.nav_state + '"' : "") + (wpx ? ' data-nav-wp="' + wpx.n + '" data-waypoint-id="' + esc(wpx.id) + '"' : "") + ' data-marker="' + esc(m.id) + '" data-place="' + esc(m.place) + '" data-stable-id="' + esc(stableOf("l", m.place)) + '" data-lat="' + m.lat + '" data-lon="' + m.lon + '" data-location-certainty="' + (m.uncertain ? "inferred" : "source") + '" transform="translate(' + p.x + " " + p.y + ')" role="button" tabindex="0" aria-label="' + esc(m.aria_label || m.label) + '">' + shape + text + "</g>";
    });
    out += navOverlayPlacesSvg(mk, upx, r, L, T, w);
    if(readerGeoFocus && GEO.valid(readerGeoFocus.lat,readerGeoFocus.lon)){
      // The existing map label contract owns marker color, typography, shape and '?'.
      var rp=GEO.project(readerGeoFocus.lat,readerGeoFocus.lon), rr=MARKER_R_PX*upx,
          fs=LABEL_LEVELS.L2.px*upx, uncertain=!!readerGeoFocus.uncertain;
      var question=uncertain?'<tspan class="gm-qmark" dx="'+fs*.18+'" dy="'+(-fs*.16)+'">?</tspan>':'';
      out+='<g class="gm gm-inferred'+(uncertain?' gm-uncertain':'')+' reader-reference-geopoint" data-ab-reader-map-pin="'+esc(readerGeoFocus.id)+'" data-authority="REFERENCE_ONLY" data-location-certainty="'+(uncertain?'inferred':'source')+'" transform="translate('+rp.x+' '+rp.y+')" role="img" aria-label="'+esc(readerGeoFocus.label)+(uncertain?' 위치 불확정':'')+'">'+
        '<circle class="gm-shape" r="'+rr+'"/>'+
        (ui.mapDisplay.labels?'<text class="gm-place-label" x="'+rr*2.8+'" y="'+fs*.34+'" font-size="'+fs+'" stroke-width="'+fs*.25+'" data-semantic-tier="L2" data-label-level="L2">'+esc(readerGeoFocus.label)+question+'</text>':'')+'</g>';
    }
    var kmu = GEO.km(GEO.latOf(gc.y)), target = kmu * w * 0.22, niceKm = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].reduce(function (a, v) { return v <= target ? v : a; }, 0.1), len = niceKm / kmu, bx = L + w * 0.04, by = B - w * 0.05;
    out += '<g class="gm-scale"><line x1="' + bx + '" y1="' + by + '" x2="' + (bx + len) + '" y2="' + by + '"/><text x="' + bx + '" y="' + (by - scaleFs * 0.45) + '" font-size="' + scaleFs + '">' + (niceKm >= 1 ? niceKm : niceKm * 1000 + " m").toString().replace(/^(\d+)$/, "$1") + (niceKm >= 1 ? " km" : "") + "</text></g>";
    return '<svg class="gmap" viewBox="' + L + " " + T + " " + w + " " + w + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="지리 지도" data-projection="web-mercator" data-modern-zoom="' + (w >= 12 ? "low" : w >= 5 ? "mid" : "high") + '" data-modern-opacity="' + esc(ui.mapDisplay.modernOpacity || "normal") + '" data-route-style="' + esc(ui.mapDisplay.routeStyle || "standard") + '" data-basemap-mode="' + basemapMode + '" data-tiles="' + (ui.tiles ? "on" : "off") + '">' + out + "</svg>";
  }
  var MAP_ATTRIBUTION = REFSRC && REFSRC.attribution_line ? REFSRC.attribution_line + " · 참고 배경" : "지형 Mapzen·USGS · 해안선·수계·현대 지명 Natural Earth (Public Domain) · 참고 배경";   // 활성 소스의 출처 문구(레지스트리)   // 지도 하단은 한 줄 출처만. 범례·자세한 안내는 지도 설정 하단
  // =====================================================================================================================
  // MapLibre 병행 렌더러 (feature flag: JBC_MAP_RENDERER = "legacy"(기본) | "maplibre")
  //  · MapLibre 가 소유: 지형 래스터(구워 둔 WebP, 라이트/다크) · 바다/육지 · 수계 · 카메라 · 타일 수명주기 · 컨테이너 크기 변화
  //  · 그대로 공유: geoSvg() 가 만드는 모든 오버레이(성경 지명·번호 경유지·경로·거리·호버/클릭·범례·축척), 장소 색인/카드, 여정 패널, 본문·연표·연구 동기화, mapPrefs/mapScene
  //  · 카메라는 MapLibre 가 진실 원천: 매 프레임 ui.gcam = {x:경도, y:메르카토르 y, w:화면 스케일}로 반영 → 같은 SVG 오버레이가 그 시점의 viewBox 로 다시 그려져 지도와 정확히 겹친다(표식 크기는 화면 px 고정).
  //  · 레거시 SVG 렌더러는 삭제하지 않았다. 플래그를 끄면(또는 로드·WebGL 실패 시) 즉시 원래 SVG 지도로 돌아온다. 데이터·사용자 지도 설정은 건드리지 않는다.
  var ML = { want: false, failed: false, error: "", lib: null, loading: null, map: null, el: null, ready: false, last: null, dirty: true, theme: null, delay: 0, creating: false };
  (function () { var v = window.JBC_MAP_RENDERER; try { var q = /[?&]mapRenderer=(legacy|maplibre)/.exec(location.search); if (q) v = q[1]; else if (!v) v = localStorage.getItem("jbc.mapRenderer"); } catch (e) {} ML.want = v === "maplibre"; })();
  function mlActive() { return ML.want && !ML.failed; }
  function mlDark() { var b = hexRgb(themeTok("--map-land-base")) || [227, 220, 205]; return (b[0] + b[1] + b[2]) / 3 < 128; }
  function mlSize() { var el = ML.el; return Math.max(el && el.clientWidth || 0, el && el.clientHeight || 0) || 800; }
  function mlZoomFor(w) { return Math.log(360 * mlSize() / (512 * w)) / Math.LN2; }
  function mlCamFromMap() {
    var m = ML.map, c = m.getCenter(), cam = { x: c.lng, y: GEO.yOf(c.lat), w: 360 * mlSize() / (512 * Math.pow(2, m.getZoom())) };
    Object.defineProperty(cam, "__ml", { value: true, enumerable: false }); return cam;   // 지도에서 온 값(이미 지도와 일치): 다시 밀어 넣지도, 다시 clamp 하지도 않는다
  }
  function mlLoad() {
    if (ML.loading) return ML.loading;
    var base = document.baseURI, css = document.createElement("link"); css.rel = "stylesheet"; css.href = new URL("vendor/maplibre/maplibre-gl.css", base).href; document.head.appendChild(css);
    ML.loading = import(new URL("vendor/maplibre/maplibre-gl.mjs", base).href).then(function (m) { ML.lib = m; m.setWorkerUrl(new URL("vendor/maplibre/maplibre-gl-worker.mjs", base).href); return m; })
      .catch(function (e) { ML.failed = true; ML.error = String(e && e.message || e); try { renderMapPane(); } catch (x) {} });
    return ML.loading;
  }
  function mlStyle() {
    var base = document.baseURI, dark = mlDark(), T = function (n, fb) { return themeTok(n) || fb; }, tiles = function (th) { return new URL("data/terrain_baked/" + th + "/", base).href + "{z}/{x}/{y}.webp"; };
    var sources = {}, layers = [{ id: "water", type: "background", paint: { "background-color": T("--map-water", "#9CBBCB") } }];
    if (LOCAL_BASEMAP_10M) { sources.land = { type: "geojson", data: LOCAL_BASEMAP_10M }; layers.push({ id: "land", type: "fill", source: "land", paint: { "fill-color": T("--map-land-base", "#E3DCCD") } }); }
    var bands = [["a", 5, 7, [8, 10, 52, 50], null, 7], ["b", 8, 9, [8, 18, 52, 46], 7, 9], ["c", 10, 10, [10, 20, 50, 44], 9, null]];   // 지도 줌(타일 z = 줌+1) 구간별 타일 범위(굽기 범위와 같다)
    ["light", "dark"].forEach(function (th) {
      bands.forEach(function (b) {
        var id = "rl-" + th + b[0]; sources[id] = { type: "raster", tiles: [tiles(th)], tileSize: 256, minzoom: b[1], maxzoom: b[2], bounds: b[3] };
        var l = { id: id, type: "raster", source: id, layout: { visibility: (th === "dark") === dark ? "visible" : "none" }, paint: th === "dark" ? { "raster-fade-duration": 150, "raster-resampling": "nearest", "raster-contrast": 0.2, "raster-brightness-min": 0.0, "raster-brightness-max": 0.95 } : { "raster-fade-duration": 150, "raster-resampling": "linear" } };
        if (b[4] != null) l.minzoom = b[4]; if (b[5] != null) l.maxzoom = b[5]; layers.push(l);
      });
    });
    if (HYDROLOGY) {
      sources.hydro = { type: "geojson", data: { type: "FeatureCollection", features: [].concat((HYDROLOGY.lakes || []).map(function (x) { return { type: "Feature", properties: { kind: "lake" }, geometry: { type: "MultiPolygon", coordinates: (x.rings || []).map(function (r) { return [r]; }) } }; }),
        (HYDROLOGY.rivers || []).reduce(function (a, x) { return a.concat((x.lines || []).map(function (line) { return { type: "Feature", properties: { kind: "river" }, geometry: { type: "LineString", coordinates: line } }; })); }, [])) } };
      layers.push({ id: "hydro-lakes", type: "fill", source: "hydro", filter: ["==", ["get", "kind"], "lake"], paint: { "fill-color": T("--map-water", "#9CBBCB"), "fill-outline-color": T("--map-water-edge", "#6F98AA") } },
        { id: "hydro-rivers", type: "line", source: "hydro", filter: ["==", ["get", "kind"], "river"], paint: { "line-color": T("--map-river", "#5A8FA6"), "line-width": 2.0, "line-opacity": 0.9 } });
    }
    if (LOCAL_BASEMAP_10M) layers.push({ id: "coast", type: "line", source: "land", paint: { "line-color": T("--map-water-edge", "#6F98AA"), "line-width": 1 } });
    return { version: 8, sources: sources, layers: layers };
  }
  // 테마·사용자 지도 설정을 MapLibre 레이어에 반영(스타일/타일 재생성 없이 paint·visibility 만 바꾼다)
  function mlApplyLook() {
    var m = ML.map; if (!m || !m.getStyle()) return; var dark = mlDark(), d = ui.mapDisplay, T = function (n, fb) { return themeTok(n) || fb; };
    var set = function (id, p, v) { if (m.getLayer(id)) m.setPaintProperty(id, p, v); }, vis = function (id, on) { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", on ? "visible" : "none"); };
    set("water", "background-color", T("--map-water", "#9CBBCB")); set("land", "fill-color", T("--map-land-base", "#E3DCCD")); set("coast", "line-color", T("--map-water-edge", "#6F98AA"));
    set("hydro-lakes", "fill-color", T("--map-water", "#9CBBCB")); set("hydro-lakes", "fill-outline-color", T("--map-water-edge", "#6F98AA")); set("hydro-rivers", "line-color", T("--map-river", "#5A8FA6"));
    ["light", "dark"].forEach(function (th) { ["a", "b", "c"].forEach(function (b) { vis("rl-" + th + b, !!d.terrain && (th === "dark") === dark); }); });
    vis("hydro-lakes", !!d.hydrology); vis("hydro-rivers", !!d.hydrology);
  }
  function mlLimits() {
    var m = ML.map; if (!m) return; var b = GEO_CAMERA.bounds;
    m.setMaxBounds([[b.west, b.south], [b.east, b.north]]); m.setMaxZoom(mlZoomFor(GEO_CAMERA.minW)); m.setMinZoom(Math.max(4.2, mlZoomFor(maxWFor())));
  }
  function mlEnsureMap() {
    if (ML.map && ML.map.getContainer() === ML.el) return; if (ML.creating || !ML.el) return; ML.creating = true;
    if (ML.map) { try { ML.map.remove(); } catch (e) {} ML.map = null; ML.ready = false; }
    mlLoad().then(function (lib) {
      ML.creating = false; if (!lib || ML.failed || !ML.el || !ML.el.isConnected) return;
      var g = ui.gcam && ui.gcam.__ml ? ui.gcam : geoCam();
      try {
        ML.map = new lib.Map({ container: ML.el, style: mlStyle(), center: [g.x, GEO.latOf(g.y)], zoom: mlZoomFor(g.w), attributionControl: false, renderWorldCopies: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, keyboard: false, fadeDuration: 0, canvasContextAttributes: { preserveDrawingBuffer: true } });
        ML.map.touchZoomRotate.disableRotation();
      } catch (e) { ML.failed = true; ML.error = "WebGL/map init: " + String(e && e.message || e); ML.map = null; renderMapPane(); return; }
      ML.map.on("render", mlOnRender); ML.map.on("move", mlOnRender); ML.map.on("resize", function () { mlLimits(); ML.dirty = true; mlOnRender(); });   // 이동·크기 변화 이벤트에서 바로 오버레이를 맞춘다(GL 프레임이 늦어도 오버레이는 현재 변환과 일치)
      ML.map.on("error", function (e) { try { ML.errors = (ML.errors || []).concat(String(e && e.error && e.error.message || e)).slice(-20); } catch (x) {} });
      ML.map.once("load", function () { ML.ready = true; mlLimits(); mlApplyLook(); mlOnRender(); });
    });
  }
  function mlOnRender() {   // 카메라가 움직일 때마다(프레임마다) 같은 SVG 오버레이를 그 시점으로 다시 그린다
    if (!ML.map) return; var cam = mlCamFromMap(), L = ML.last;
    if (L && !ML.dirty && Math.abs(cam.x - L.x) < 1e-9 && Math.abs(cam.y - L.y) < 1e-9 && Math.abs(cam.w - L.w) < 1e-9) return;
    ML.last = cam; ML.dirty = false; ui.gcam = cam; var sv = document.querySelector("#ml-ovl svg.gmap"); if (sv) sv.outerHTML = geoSvg();
  }
  function mlSyncFromGcam() {   // 다른 코드(버튼·장면 즉시 이동 등)가 ui.gcam 을 새로 정했으면 지도에 반영
    var g = ui.gcam; if (!ML.map || !g || g.__ml) return; var c = clampGeoCam(g);
    ML.map.jumpTo({ center: [c.x, GEO.latOf(c.y)], zoom: mlZoomFor(c.w) }); var cam = mlCamFromMap(); ML.last = cam; ui.gcam = cam;
  }
  function mlMount(html) {   // renderMapPane 의 ML 분기: 지도(캔버스)는 한 번만 만들고 오버레이만 갈아 끼운다
    var body = $("map-body"); if (!body.querySelector("#ml-map")) { if (ML.map) { try { ML.map.remove(); } catch (e) {} ML.map = null; ML.ready = false; } body.innerHTML = '<div id="ml-map" class="ml-map"></div><div id="ml-ovl" class="ml-ovl"></div>'; }
    ML.el = $("ml-map"); $("ml-ovl").innerHTML = html; body.dataset.renderer = "maplibre"; mlEnsureMap(); mlSyncFromGcam(); mlApplyLook();
  }
  function mlCancel() { if (ML.delay) { clearTimeout(ML.delay); ML.delay = 0; } if (ML.map) ML.map.stop(); }
  function mlEase(target, settleMs) {   // 절제된 easeTo: 한 방향으로만, 줌 다이브 없음. 새 장면을 고르면 이전 이동을 끊고 지금 시점부터 새 목표로
    mlCancel(); var go = function () {
      var tg = typeof target === "function" ? target() : target; if (!tg || !ML.map) return; var to = clampGeoCam(tg), from = mlCamFromMap(), reduce = false;
      try { reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {}
      var opt = { center: [to.x, GEO.latOf(to.y)], zoom: mlZoomFor(to.w) };
      if (Math.hypot(to.x - from.x, to.y - from.y) < 0.02 * from.w && Math.abs(Math.log(to.w / from.w)) < 0.03) { ML.map.jumpTo(opt); return; }
      ML.map.once("moveend", function () { var a = document.querySelector("#map-body .gm-wp-active"); if (a) { a.classList.add("is-arriving"); setTimeout(function () { a.classList.remove("is-arriving"); }, 450); } });
      ML.map.easeTo(Object.assign(opt, { duration: geoFlyDuration(from, to, reduce), easing: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }, essential: false }));
    };
    if (settleMs > 0) ML.delay = setTimeout(go, settleMs); else go();
  }
  // 내보내기/인쇄: GL 캔버스 + JudeBible 오버레이(레거시 saveMapSvg 와 같은 계산 스타일 인라인·필기 합성)를 한 장의 PNG 로
  function mlCompose(cl) {
    return new Promise(function (resolve, reject) {
      var map = ML.map; if (!map) return reject(new Error("no map")); map.triggerRepaint();
      map.once("render", function () {
        var cv = map.getCanvas(), out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height; var cx = out.getContext("2d"); cx.drawImage(cv, 0, 0);
        var r = ML.el.getBoundingClientRect(); cl.setAttribute("xmlns", "http://www.w3.org/2000/svg"); cl.setAttribute("width", r.width); cl.setAttribute("height", r.height);
        var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl)], { type: "image/svg+xml;charset=utf-8" })), img = new Image();
        img.onload = function () { cx.drawImage(img, 0, 0, out.width, out.height); URL.revokeObjectURL(url); resolve(out); }; img.onerror = function (e) { URL.revokeObjectURL(url); reject(e); }; img.src = url;
      });
    });
  }
  function mlExport(cl, mode) {
    try { if (window.JBC_ANN) window.JBC_ANN.exportInto(cl); } catch (e) {}
    return mlCompose(cl).then(function (cv) {
      ML.lastExport = { w: cv.width, h: cv.height };
      if (mode === "print") { mlPrintSheet(cv.toDataURL("image/png")); try { window.print(); } finally { setTimeout(mlPrintDone, 500); } return; }
      cv.toBlob(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "JudeBible-map-" + state.passage + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }, "image/png");
    });
  }
  function mlPrintSheet(src) { var s = $("ml-print-sheet"); if (!s) { s = document.createElement("div"); s.id = "ml-print-sheet"; document.body.appendChild(s); } s.innerHTML = '<img alt="성경 지도" src="' + src + '">'; document.body.dataset.mlPrint = "1"; }
  function mlPrintDone() { var s = $("ml-print-sheet"); if (s) s.remove(); delete document.body.dataset.mlPrint; }
  try { var mlThemeObs = new MutationObserver(function () { if (mlActive() && ML.map) { mlApplyLook(); ML.dirty = true; mlOnRender(); } }); mlThemeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-map-theme", "class"] }); } catch (e) {}
  function renderGeoOnly() { if (mlActive()) { mlSyncFromGcam(); ML.dirty = true; mlOnRender(); return; } var sv = document.querySelector("#map-body svg.gmap"); if (sv) sv.outerHTML = geoSvg(); }
  // ---- 장면 이동 카메라(차분한 easeTo): 현재 시점에서 목표 시점으로 한 방향으로만 부드럽게 움직인다(줌아웃 호·되돌아 들어가기 없음).
  //  · 이동 중에는 지도를 다시 짓지 않고 viewBox 만 바꾼다. 출발·도착 영역을 모두 덮는 지형 타일을 미리 불러 배경으로 깔아 파란 빈 타일이 비치지 않게 하고,
  //    도착 지형 타일도 먼저 불러 둔 뒤 한 번만 다시 그린다.
  //  · 연구 패널 등으로 지도 폭이 바뀌는 장면은 레이아웃이 안정된 뒤(settle) 카메라를 움직인다. 새 장면을 고르면 이전 이동(대기 포함)을 취소하고 그 시점부터 새 목표로 간다.
  //  · mapPrefs 는 읽기만 한다. ----
  var fly = { raf: 0, timer: 0, delay: 0, last: null, seq: 0, keep: [] };
  function geoFlyCancel() { fly.seq++; if (fly.raf) window.cancelAnimationFrame(fly.raf); clearTimeout(fly.timer); clearTimeout(fly.delay); fly.raf = 0; fly.timer = 0; fly.delay = 0; fly.last = null; var bd = document.querySelector("#map-body .gm-fly-backdrop"); if (bd) bd.remove(); }
  function geoFlyDuration(from, to, reduce) {
    if (reduce) return 140;
    var d = Math.hypot(to.x - from.x, to.y - from.y), r = Math.abs(Math.log(to.w / from.w)), s = d + r * Math.max(from.w, to.w) * 0.6;
    return s < 1.5 ? 550 : s < 6 ? 800 : s < 15 ? 1000 : 1150;
  }
  function geoTileUrls(gc) {
    var p = ui.mapDisplay.terrain ? terrainZoom(gc) : null; if (!p) return [];
    var urls = []; for (var ty = p.q.y0; ty <= p.q.y1; ty++) for (var tx = p.q.x0; tx <= p.q.x1; tx++) urls.push("data/terrain_tiles/" + p.z + "/" + tx + "/" + ty + ".jpg");
    return urls;
  }
  function preloadImages(urls, ms) {
    return new Promise(function (resolve) {
      var left = urls.length, done = false, fin = function () { if (!done) { done = true; resolve(); } }, to = setTimeout(fin, ms);
      if (!left) { clearTimeout(to); return fin(); }
      urls.forEach(function (u) { var im = new Image(); fly.keep.push(im); im.onload = im.onerror = function () { if (--left <= 0) { clearTimeout(to); fin(); } }; im.src = u; });
      if (fly.keep.length > 400) fly.keep.splice(0, fly.keep.length - 400);
    });
  }
  function geoFly(target, settleMs) {
    if (mlActive()) { mlEase(target, settleMs); return; }   // MapLibre 분기: 절제된 easeTo (레거시 viewBox 비행은 그대로 보존)
    geoFlyCancel(); var seq = fly.seq;
    var go = function () {
      var tg = typeof target === "function" ? target() : target; if (!tg) return;
      var from = geoCam(), to = clampGeoCam(tg), reduce = false;
      try { reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {}
      var sv = document.querySelector("#map-body svg.gmap");
      var finish = function () {
        if (seq !== fly.seq) return; geoFlyCancel(); ui.gcam = to; renderGeoOnly();
        var a = document.querySelector("#map-body .gm-wp-active"); if (a) { a.classList.add("is-arriving"); setTimeout(function () { a.classList.remove("is-arriving"); }, 450); }
      };
      var near = Math.hypot(to.x - from.x, to.y - from.y) < 0.02 * from.w && Math.abs(Math.log(to.w / from.w)) < 0.03;
      // 실제 렌더링 캡처(2026-10-07 감사)에서 viewBox 비행은 지형 타일이 비고 표식이 커지는 프레임을 만들었다. 지속형 지도 엔진/타일 풀로 바꾸기 전까지는 기본 꺼 둔다(window.JBC_GEO_FLY=true 로만 켠다).
      if (!sv || near || document.hidden || window.JBC_GEO_FLY !== true) { ui.gcam = to; if (sv) { var p0 = preloadImages(geoTileUrls(to), 250); p0.then(function () { if (seq === fly.seq) renderGeoOnly(); }); } return; }
      // 출발·도착 시점을 모두 덮는 사각 영역(배경 타일용)
      var x0 = Math.min(from.x - from.w / 2, to.x - to.w / 2), x1 = Math.max(from.x + from.w / 2, to.x + to.w / 2), y0 = Math.min(from.y - from.w / 2, to.y - to.w / 2), y1 = Math.max(from.y + from.w / 2, to.y + to.w / 2);
      var U = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(x1 - x0, y1 - y0) }, uUrls = geoTileUrls(U), tUrls = geoTileUrls(to);
      var big = ui.mapDisplay.terrain && !uUrls.length;   // 영역이 너무 커서 배경 타일을 깔 수 없으면 날지 않고 도착 타일을 준비한 뒤 한 번에 옮긴다
      ui.gcam = fly.last = from;
      preloadImages(uUrls.concat(tUrls), 350).then(function () {
        if (seq !== fly.seq) return;
        if (big) { ui.gcam = to; renderGeoOnly(); return; }
        var s1 = document.querySelector("#map-body svg.gmap"); if (!s1) { ui.gcam = to; return; }
        var Lu = U.x - U.w / 2, Tu = U.y - U.w / 2, back = ui.mapDisplay.terrain ? '<rect class="gm-base-sea" x="' + Lu + '" y="' + Tu + '" width="' + U.w + '" height="' + U.w + '"/>' + terrainBasemapSvg(U) : localBasemapSvg(Lu, Tu, U.w);
        s1.insertAdjacentHTML("afterbegin", '<g class="gm-fly-backdrop" aria-hidden="true">' + back + "</g>");
        var dur = geoFlyDuration(from, to, reduce), lf = Math.log(from.w), lt = Math.log(to.w), t0 = 0, ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
        var step = function (now) {
          if (seq !== fly.seq) return; if (!t0) t0 = now; var t = Math.min(1, (now - t0) / dur);
          if (fly.last && ui.gcam !== fly.last) return geoFlyCancel();   // 사용자가 직접 확대·이동하면 멈춘다
          var e = ease(t), w = Math.exp(lf + (lt - lf) * e), c = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: w };
          ui.gcam = fly.last = c;
          var s2 = document.querySelector("#map-body svg.gmap"); if (s2) s2.setAttribute("viewBox", (c.x - w / 2) + " " + (c.y - w / 2) + " " + w + " " + w);
          if (t < 1) fly.raf = window.requestAnimationFrame(step); else finish();
        };
        fly.raf = window.requestAnimationFrame(step); fly.timer = setTimeout(function () { if (seq === fly.seq && fly.raf) finish(); }, dur + 400);
      });
    };
    if (settleMs > 0) fly.delay = setTimeout(go, settleMs); else go();
  }
  function gzoom(f) { var gc = geoCam(); ui.gcam = clampGeoCam({ x: gc.x, y: gc.y, w: gc.w / f }); renderGeoOnly(); }
  function gfit() { ui.gcam = geoFit(geoMarkers()); renderGeoOnly(); }
  function gIsraelHome() { ui.gcam = geoInitialCam(); renderMapPane(); }
  function gWorld() {
    var b = GEO_CAMERA.bounds, top = GEO.yOf(b.north), bottom = GEO.yOf(b.south);
    ui.gcam = clampGeoCam({ x: (b.west + b.east) / 2, y: (top + bottom) / 2, w: maxWFor() });
    renderMapPane();
  }
  function syncMapSettings() {
    [].forEach.call(document.querySelectorAll("[data-map-theme-select]"), function (ts) { ts.value = document.documentElement.dataset.theme || "auto"; });
    [].forEach.call(document.querySelectorAll("[data-map-layer]"), function (el) {
      var k = el.dataset.mapLayer; if (k in ui.mapDisplay) el.checked = !!ui.mapDisplay[k];
    });
    [].forEach.call(document.querySelectorAll("[data-map-pref]"), function (el) {
      var k = el.dataset.mapPref; if (k in ui.mapDisplay) el.value = ui.mapDisplay[k];
    });
  }
  function saveMapSvg(mode) {
    var sv = document.querySelector("#map-body svg.gmap"); if (!sv) return false;
    var cl = sv.cloneNode(true), vb = (cl.getAttribute("viewBox") || "0 0 10 10").split(" ").map(Number), fs0 = vb[2] * 0.0125, ns = "http://www.w3.org/2000/svg";
    // 화면에서는 CSS class로 입혀진 지도 색이 SVG 파일 밖으로 빠져나가면 사라질 수 있다.
    // 원본의 computed style을 복제본에 인라인하여 독립 SVG에서도 같은 색으로 보이게 한다.
    var srcNodes = [sv].concat([].slice.call(sv.querySelectorAll("*"))), dstNodes = [cl].concat([].slice.call(cl.querySelectorAll("*")));
    var exportProps = ["fill","fill-opacity","stroke","stroke-opacity","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","opacity","color","font-family","font-size","font-weight","font-style","text-anchor","dominant-baseline","paint-order","vector-effect","display","visibility"];
    srcNodes.forEach(function (src, i) {
      var dst = dstNodes[i]; if (!dst) return;
      var cs = getComputedStyle(src), st = [];
      exportProps.forEach(function (p) { var v = cs.getPropertyValue(p); if (v && v !== "normal" && v !== "none" || (p === "fill" || p === "stroke")) st.push(p + ":" + v); });
      if (st.length) dst.setAttribute("style", st.join(";"));
    });
    // 투명 배경을 검정으로 처리하는 뷰어를 위해 현재 지도 배경색을 SVG 안에 명시한다.
    if (mlActive()) { mlExport(cl, mode); return true; }   // MapLibre: GL 캔버스 + 이 오버레이를 합친 PNG (레거시 SVG 내보내기는 아래에 그대로)
    var mapBody = document.querySelector("#map-body"), bg = mapBody ? getComputedStyle(mapBody).backgroundColor : "rgb(255, 255, 255)";
    if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") bg = "rgb(255, 255, 255)";
    var back = document.createElementNS(ns, "rect"); back.setAttribute("x", vb[0]); back.setAttribute("y", vb[1]); back.setAttribute("width", vb[2]); back.setAttribute("height", vb[3]); back.setAttribute("fill", bg); back.setAttribute("data-export-background", "1"); cl.insertBefore(back, cl.firstChild);
    try { if (window.JBC_ANN) window.JBC_ANN.exportInto(cl); } catch (e) {}   // 강의 필기(임시 오버레이)를 복제본에만 얹는다. 지도 SVG·데이터는 바뀌지 않는다
    [MAP_ATTRIBUTION, "참고 배경은 성경 장소를 확정하지 않습니다 · 참고 위치와 추정은 확정된 사실이 아닙니다 · 교육용 참고 자료"].forEach(function (t, i) { var tx = document.createElementNS(ns, "text"); tx.setAttribute("x", vb[0] + vb[2] * 0.012); tx.setAttribute("y", vb[1] + vb[3] - fs0 * (1.2 + (1 - i) * 1.45)); tx.setAttribute("font-size", fs0); tx.setAttribute("fill", "#4a463f"); tx.setAttribute("stroke", "#f4f1e9"); tx.setAttribute("stroke-width", fs0 * 0.2); tx.setAttribute("paint-order", "stroke"); tx.setAttribute("font-family", "sans-serif"); tx.setAttribute("data-export-attribution", "1"); tx.textContent = t; cl.appendChild(tx); });
    cl.setAttribute("xmlns", ns);
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(cl), blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "JudeBible-map-" + state.passage + ".svg"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); return true;
  }
  function mapAction(name) {
    if (name === "zoom-in") return gzoom(1.4);
    if (name === "zoom-out") return gzoom(1 / 1.4);
    if (name === "israel-home") return gIsraelHome();
    if (name === "world") return gWorld();
    if (name === "toolbox") { var tp = $("map-settings-pop"), tb = document.querySelector('[data-map-action="settings"]'); if (tp) { tp.hidden = false; if (tb) tb.setAttribute("aria-expanded", "true"); syncMapSettings(); var mi = tp.querySelector(".map-info"); if (mi) { try { mi.scrollIntoView({ block: "nearest" }); } catch (e) {} var sm = mi.querySelector("summary"); if (sm) sm.focus(); } } return; }   // 지도 정보(범례·출처)는 지도 설정 하단에 있다
    if (name === "settings") { var p = $("map-settings-pop"), b = document.querySelector('[data-map-action="settings"]'); p.hidden = !p.hidden; if (b) b.setAttribute("aria-expanded", String(!p.hidden)); syncMapSettings(); return; }
    if (name === "route-range") return setMapPref("routes", !ui.mapDisplay.routes);
    if (name === "reset-prefs") return resetMapPrefs();
    if (name === "save-image") return saveMapSvg();
    if (name === "print") return mlActive() ? saveMapSvg("print") : window.print();
    return false;
  }
  // 장면 소유 상태의 읽기 전용 스냅샷: 시대·줄기(인물)·장면·활성 경유지·활성 경로·관련 장소·카메라. 사용자 지도 설정(mapPrefs)은 여기에 들어오지 않고, 장면이 바뀌어도 쓰이지 않는다.
  function mapSceneState() {
    var nv = ui.nav, tp = nv && nv.topic ? navTopicById(nv.topic) : null, s = tp && tp.steps[Math.min(nv.step, tp.steps.length - 1)], c = ui.gcam;
    return { era: tp && tp.overlay && tp.overlay.era || null, topic: tp ? tp.id : null, person: s ? s.track : null, scene: tp ? nv.step : null, waypoint: s && s.wp ? s.wp.key : null, waypointNo: s && s.wp ? s.wp.n : null,
      route: s && s.ov_routes && s.ov_routes[0] ? s.ov_routes[0].label : null, related: s ? (s.focus || []).concat(s.related || []) : [], camera: c ? { x: c.x, y: c.y, w: c.w } : null };
  }
  function updateMapHead() {
    var ttl = document.querySelector(".mp-title"), tpn = ui.nav && ui.nav.topic ? navTopicById(ui.nav.topic) : null;
    if (ttl) ttl.textContent = tpn && tpn.journey ? "성경 여정 지도 | " + ((tpn.overlay && (tpn.overlay.era_label || tpn.overlay.era_title)) || tpn.badge || "") : "주드성경 지리지도";
    document.body.dataset.journeyMap = tpn && tpn.journey ? "on" : "off";
    var t2 = $("map-tiles");
    if (t2) { t2.hidden = true; t2.setAttribute("aria-pressed", "false"); }
    var rb = document.querySelector('[data-map-action="route-range"]'); if (rb) rb.setAttribute("aria-pressed", String(!!ui.mapDisplay.routes));
    document.body.dataset.mapview = "geo";
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
  function findMedia(id) {
    var external = window.JBC_ATLAS90_READER_MEDIA || {};
    var aid = Object.keys(external).filter(function(k){return external[k] && external[k].id === id;})[0];
    if (aid) { var aa = ATLAS90_REF.filter(function(a){return a.place_id === aid;})[0]; return { asset: external[aid], place: {display_label: aa ? aa.name_ko : '성경 지명 참고사진', hero_caption: external[aid].reader_caption} }; }
    var out = null; placeIndex().list.some(function (p) { if (p.media && p.media.id === id) { out = { asset: p.media, place: { display_label: p.label, hero_caption: p.media.reader_caption } }; return true; } return false; }); if (out) return out; Object.keys((PJ && PJ.places) || {}).some(function (k) { var a = (PJ.places[k].media || []).filter(function (m) { return m.id === id; })[0]; if (a) { out = { asset: a, place: PJ.places[k] }; return true; } return false; }); return out; }
  function openMediaLightbox(id, trigger) {
    var found = findMedia(id), box = $("media-lightbox"), body = $("media-lightbox-body"); if (!found || mediaGate(found.asset) !== "image" || !box || !body) return;
    var m = found.asset, caption = m.reader_caption || found.place.hero_caption || found.place.display_label;
    body.innerHTML = '<img class="media-lightbox-img" src="' + esc(m.preview_url) + '" alt="' + esc(caption) + '" referrerpolicy="no-referrer"><figcaption class="media-lightbox-meta"><strong id="media-lightbox-caption">' + esc(caption) + '</strong><span>사진: ' + esc(m.creator) + ' · ' + esc(m.license_label || m.license) + ' · ' + esc(m.provider) + '</span><br><span>원문: ' + mediaSourceHtml(m) + '</span></figcaption>';
    mediaLightboxReturn = trigger || document.activeElement; box.hidden = false; document.body.dataset.mediaLightbox = "open"; var close = box.querySelector(".media-lightbox-close"); if (close) close.focus();
  }
  function closeMediaLightbox() { var box = $("media-lightbox"); if (!box || box.hidden) return; box.hidden = true; delete document.body.dataset.mediaLightbox; $("media-lightbox-body").innerHTML = ""; if (mediaLightboxReturn && mediaLightboxReturn.focus) mediaLightboxReturn.focus(); mediaLightboxReturn = null; }
  // 연결된 관련 항목: 연구 투영에서 binding.state === "AUTO_BIND" 로 확정된 관계만 쓴다(이름 추론 없음). 양방향: 이 항목이 가리키는 대상 + 이 항목을 가리키는 다른 기록.
  var REL_ADJ = null;   // 투영은 정적이므로 한 번만 만든다: sid → { 상대 sid → { out, inn, rels } }
  function entityTypeLabel(t) { return t === "Person" ? "인물" : t === "Place" ? "장소" : t === "Region" ? "지역" : t === "Event" ? "사건" : t === "Route" ? "경로" : t || "항목"; }
  function relAdjacency() {
    if (REL_ADJ) return REL_ADJ; REL_ADJ = {};
    var put = function (a, b, dir, rel) { var m = REL_ADJ[a] || (REL_ADJ[a] = {}), x = m[b] || (m[b] = { out: false, inn: false, rels: [] }); x[dir] = true; if (rel && x.rels.indexOf(rel) < 0) x.rels.push(rel); };
    projectionGroups().forEach(function (g) {
      Object.keys(g.records).forEach(function (owner) {
        var r = g.records[owner], c = r.connected || {}, rows = (r.relations || []).concat(c.places || [], c.people || [], c.events || [], c.routes || []);
        rows.forEach(function (row) {
          var b = row && row.binding; if (!b || b.state !== "AUTO_BIND" || row.resolved !== true || !b.target_id || b.target_id === owner) return;
          var rel = String(row.relation || "").replace(/_/g, " "); put(owner, b.target_id, "out", rel); put(b.target_id, owner, "inn", rel);
        });
      });
    });
    // Holman Chapter 1 foundation hierarchy is already normalized to exact stable IDs by the
    // approved handoff. Reuse only those declared parent/child IDs for presentation navigation;
    // this does not upgrade `relations[].resolved`, create a Registry binding, or infer by name.
    var foundation = Object.assign({}, GF && GF.regions || {}, GF && GF.routes || {});
    var structural = function (owner, target) {
      if (!foundation[owner] || !foundation[target] || !STORE.get(owner) || !STORE.get(target) || owner === target) return;
      put(owner, target, "out", "승인된 상하위 구조"); put(target, owner, "inn", "승인된 상하위 구조");
    };
    Object.keys(foundation).forEach(function (owner) {
      var r = foundation[owner];
      (r.child_ids || []).forEach(function (target) { structural(owner, target); });
      (r.parent_ids || []).forEach(function (parent) {
        // Prefer the parent's matching child declaration when both sides state the same edge.
        if ((foundation[parent] && foundation[parent].child_ids || []).indexOf(owner) < 0) structural(owner, parent);
      });
    });
    return REL_ADJ;
  }
  function boundRelations(sid, includeNonPublic) {
    var m = relAdjacency()[sid] || {}; return Object.keys(m).filter(function (k) { return !!STORE.get(k) && (includeNonPublic || readerVisible(k)); }).map(function (k) { return { sid: k, out: m[k].out, inn: m[k].inn, rels: m[k].rels }; });
  }
  function relatedEntitiesHtml(sid) {
    var list = boundRelations(sid, false); if (!list.length) return "";
    return '<section class="d-sec" data-part="related-entities"><h4 class="d-h">연결된 항목</h4><ul class="rs-list">' + list.map(function (x) {
      var n = STORE.get(x.sid); return '<li data-related-sid="' + esc(x.sid) + '"><button type="button" class="pill" data-related-entity="' + esc(x.sid) + '">' + esc(n.display_label) + '</button> <span class="meta">' + esc(entityTypeLabel(n.entity_type)) + (x.rels.length ? " · " + esc(x.rels.join(", ")) : "") + (x.out && x.inn ? " · 양방향" : x.inn ? " · 이 항목을 가리킴" : "") + "</span></li>";
    }).join("") + "</ul></section>";
  }
  function internalResearchRelationsHtml(sid) {
    var list = boundRelations(sid, true).filter(function(x){ var n=STORE.get(x.sid); return !readerVisible(x.sid) && n && (n.entity_type==="Event" || n.entity_type==="Route"); }); if(!list.length)return "";
    return '<section class="rs-linked" data-part="internal-research-links"><h5>연결된 연구 객체</h5><ul class="rs-list">' + list.map(function(x){ var n=STORE.get(x.sid); return '<li><button type="button" class="pill" data-related-entity="' + esc(x.sid) + '">' + esc(n.display_label) + '</button> <span class="meta">' + esc(entityTypeLabel(n.entity_type)) + ' · 비공개 연구 연결</span></li>'; }).join("") + "</ul></section>";
  }
  function regionMediaHtml(R) {
    var refs = (R.media && R.media.references) || []; if (!refs.length) return "";
    return '<section class="d-sec" data-part="media-refs"><h4 class="d-h">자료 출처</h4><ul class="rs-list">' + refs.map(function (m) {
      var ok = m.state === "BOUND";
      return '<li data-media-ref="' + esc(m.id) + '" data-media-state="' + esc(m.state) + '" data-media-mode="attribution_only">' + (ok ? esc(m.creator) + " · " + esc(m.license) + " · " + esc(m.provider) + " · " + mediaSourceHtml(m) + '<br><span class="meta">' + esc(m.attribution || "") + " 이미지 파일은 불러오지 않고 출처만 표시합니다.</span>" : esc(m.id) + " · 권리·식별 확인 필요 — 표시하지 않음" + ' <span class="meta">(' + esc((m.reasons || []).join(", ").replace(/_/g, " ")) + ")</span>") + "</li>";
    }).join("") + "</ul></section>";
  }
  // 외부 참고 섹션: 내부 연구와 분리해 출처 경계를 보여 준다. 결속(연결됨)·확인 필요·충돌을 그대로 보이고, 외부 주장·좌표·범위·사진을 연구 내용으로 합치거나 승격하지 않는다.
  var EXT_ROLE = { ancient_identity: "고대 지명 항목", representative_basis: "현대 기준 지점(대표점)", candidate_identification_reference: "현대 후보지 참고", isoband_reference_geometry: "참고 범위(등고 밴드)", external_modern_reference: "현대 지명", external_ancient_reference: "고대 지명" };
  function externalRefSection(sid) {
    var B = extBindings(sid); if (!B) return "";
    var n = STORE.get(sid), showCoords = !(n && n.entity_type === "Region");
    var ll = function (c) { if (!c) return ""; if (!showCoords) return (c.semantics === "REPRESENTATIVE_POINT" ? " · 대표 기준점 — 지역의 중심이 아님" : "") + (c.render ? " · 참고 표시용" : " · 지도에 표시하지 않음"); return " · 좌표 " + c.lat + ", " + c.lon + (c.semantics === "REPRESENTATIVE_POINT" ? " (대표 기준점 — 지역의 중심이 아님)" : "") + (c.render ? " · 참고 표시용" : " · 지도에 표시하지 않음"); };
    var items = B.bound.map(function (b) {
      var st = b.bind_status === "BOUND" ? "연결됨" : "식별자만 연결(자료는 가져오지 않음)";
      return '<li class="ext-item" data-ext-ref="' + esc(b.ref_id) + '" data-bind-status="' + esc(b.bind_status) + '" data-match-rule="' + esc(b.match && b.match.rule) + '"><strong>' + esc(b.name || (EXT_ROLE[b.role] || "참고 항목")) + '</strong> <span class="ext-tag">' + esc(b.provider) + "</span>" +
        '<span class="ext-meta">' + esc(EXT_ROLE[b.role] || "참고 항목") + " · " + esc(st) + ll(b.coordinates) + (b.kind === "geometry" ? " · 범위 자료는 가져오지 않음" : "") + (b.url ? ' · <a href="' + esc(b.url) + '" target="_blank" rel="noopener noreferrer">출처 보기</a>' : "") + ' · <span class="ext-id">' + esc(b.ext_id) + "</span></span></li>";
    }).join("");
    var verify = B.verify.map(function (v) { return '<li class="ext-item ext-verify" data-ext-ref="' + esc(v.ref_id) + '" data-bind-status="VERIFY"><strong>' + esc(v.name) + '</strong> <span class="ext-tag">Natural Earth</span><span class="ext-meta">이름만 같은 현대 지명 · 같은 대상인지 확인이 필요해 연결하지 않았습니다</span></li>'; }).join("");
    var conf = B.conflicts.length ? '<li class="ext-item ext-conflict" data-bind-status="CONFLICT"><span class="ext-meta">서로 맞지 않는 외부 자료가 있어 둘 다 그대로 두었습니다 (' + B.conflicts.length + "건)</span></li>" : "";
    return '<section class="d-sec d-ext" data-part="external-reference" data-layer="EXTERNAL_REFERENCE" data-research-authority="false"><h4 class="d-h">외부 참고</h4><p class="ext-boundary">주드성경 연구와는 별개로 연결된 외부 참고 자료입니다. 연구 내용·좌표·범위로 합쳐지지 않았으며 근거로 쓰이지 않습니다.</p><ul class="ext-list">' + items + verify + conf + "</ul></section>";
  }
  function deepStudyActionHtml(sid) { return state.view === "explore" ? '<button type="button" class="btn d-deep-study" data-deep-study="' + esc(sid) + '">본문연구에서 보기</button>' : ""; }
  function mergeContiguousPassageRanges(items) {
    var groups = {}, order = [];
    (items || []).forEach(function (x, i) {
      if (!x || !x.book || !x.chapter || x.v1 == null) return;
      var v1 = +x.v1, v2 = x.v2 == null ? v1 : +x.v2, key = x.book + "|" + x.chapter;
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push({ book: x.book, chapter: +x.chapter, v1: Math.min(v1, v2), v2: Math.max(v1, v2), first: i });
    });
    var out = [];
    order.forEach(function (key) {
      var a = groups[key].sort(function (u, v) { return u.v1 - v.v1 || u.v2 - v.v2; }), merged = [];
      a.forEach(function (r) {
        var last = merged[merged.length - 1];
        if (last && r.v1 <= last.v2 + 1) { last.v2 = Math.max(last.v2, r.v2); last.first = Math.min(last.first, r.first); }
        else merged.push({ book: r.book, chapter: r.chapter, v1: r.v1, v2: r.v2, first: r.first });
      });
      out = out.concat(merged);
    });
    return out.sort(function (u, v) { return u.first - v.first; });
  }
  function passageRangePill(r) {
    var pid = r.book + "-" + r.chapter, P = D.passages[pid]; if (!P) return "";
    var n = P.verses.length, v1 = Math.max(1, r.v1), v2 = Math.min(r.v2, n); if (v1 > n || v2 < v1) return "";
    var lab = P.ref.replace(/[장편]$/, "") + ":" + v1 + (v2 > v1 ? "–" + v2 : "");
    return '<button type="button" class="pill" data-open-range="' + esc(pid + ":" + v1 + "-" + v2) + '">' + esc(lab) + "</button>";
  }

  function fullInlineHtml(s) {
    s = String(s || "").replace(/\*\*/g, "");
    var re = /\[([^\]]+)\]\(#([a-z0-9]+-\d+):(\d+)(?:-(\d+))?\)/g, out = "", last = 0, m;
    while ((m = re.exec(s))) {
      var wrapped = m.index > last && s.charAt(m.index - 1) === "(" && s.charAt(re.lastIndex) === ")";
      out += esc(s.slice(last, wrapped ? m.index - 1 : m.index));
      var pid = m[2], a = +m[3], b = +(m[4] || m[3]);
      var link = '<button type="button" class="inline-ref" data-open-range="' + esc(pid + ":" + a + "-" + b) + '">' + esc(m[1]) + "</button>";
      out += wrapped ? '<span class="inline-ref-group">(' + link + ")</span>" : link;
      last = re.lastIndex + (wrapped ? 1 : 0);
      if (wrapped) re.lastIndex += 1;
    }
    return out + esc(s.slice(last));
  }
  function fullBlocksHtml(items, cls) {
    return (items || []).map(function (x) {
      var ps = (x.paragraphs || []).map(function (p) { return '<p class="d-body">' + fullInlineHtml(p) + "</p>"; }).join("");
      return '<div class="' + (cls || "d-story-block") + '"><h5 class="d-sub">' + esc(x.subtitle || x.title) + "</h5>" + ps + "</div>";
    }).join("");
  }
  function fullPassageButton(r) {
    var P = D.passages[r.passage]; if (!P) return "";
    var a = Math.max(1, r.start), b = Math.min(r.end, P.verses.length); if (b < a) return "";
    var lab = P.ref.replace(/[장편]$/, "") + ":" + a + (b > a ? "–" + b : "");
    return '<button type="button" class="pill" data-open-range="' + esc(r.passage + ":" + a + "-" + b) + '">' + esc(lab) + "</button>";
  }
  function fullPlaceProfileFlow(en, e, F) {
    var R = e.research, rep = (R.media || []).filter(function (m) { return /representative/.test(m.role); })[0] || (R.media || [])[0], mode = mediaGate(rep);
    var hero = rep ? '<figure class="d-hero full-profile-hero" data-part="media" data-media-id="' + esc(rep.id) + '" data-media-mode="' + mode + '">' +
      (mode === "image" ? '<button type="button" class="hero-open" data-media-lightbox="' + esc(rep.id) + '" aria-label="큰 이미지와 출처 보기"><img class="hero-img" src="' + esc(rep.preview_url) + '" alt="' + esc(R.hero_caption || rep.reader_caption || F.identity.ko) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"></button>' : "") +
      '<figcaption><span class="hero-cap">' + esc(R.hero_caption || rep.reader_caption || "") + "</span></figcaption></figure>" : "";
    var gallery = (R.media || []).filter(function (m) { return !rep || m.id !== rep.id; }).map(function (m) {
      var g = mediaGate(m); if (g !== "image") return "";
      return '<button type="button" class="d-thumb" data-media-lightbox="' + esc(m.id) + '" aria-label="' + esc(m.reader_caption || "사진 크게 보기") + '"><img src="' + esc(m.preview_url) + '" alt="' + esc(m.reader_caption || "") + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>' + esc(m.reader_caption || "") + "</span></button>";
    }).join("");
    var facts = (F.quick_facts || []).filter(function (kv) { return kv[1]; }).map(function (kv) { return '<div class="qf"><dt>' + esc(kv[0]) + "</dt><dd>" + esc(kv[1]) + "</dd></div>"; }).join("");
    var ppl = (F.related_people || []).map(function (x) { return "<li>" + fullInlineHtml(x) + "</li>"; }).join("");
    var evs = (F.related_events || []).map(function (x) { return "<li>" + fullInlineHtml(x) + "</li>"; }).join("");
    var locIntro = (F.location || []).slice(0, 1), locMore = (F.location || []).slice(1);
    var arch = fullBlocksHtml(F.archaeology, "d-article-block"), geo = fullBlocksHtml(F.geography, "d-article-block");
    var allRefs = (F.related_passages || []).map(fullPassageButton).join("");
    var claims = (R.claims || []).map(function (c) { return "<li><strong>" + esc(c.id) + "</strong> " + esc(c.statement) + ' <span class="meta">(' + esc(c["class"]) + " · " + esc(c.locator) + " · " + esc(c.confidence) + ")</span></li>"; }).join("");
    var detailedType = F.detailed_type || (F.stable_id === "JBC-CR-PLACE-BEERSHEBA-001" ? "성읍·우물·족장 거주지" : "성경 지명");
    var caution = F.caution || (F.stable_id === "JBC-CR-PLACE-BEERSHEBA-001" ? "텔 브엘세바의 철기시대 유적은 중요한 연구 근거이지만, 이를 족장 시대 브엘세바의 정확한 좌표나 아브라함·이삭의 특정 우물과 동일시하지 않습니다." : "");
    var evidenceSha = F.source.approval_sha256 || F.source.adoption_sha256 || "";
    var vh = (R.verify || []).map(function (v) { return "<li>" + esc(v.id) + " · " + esc(v.issue) + " — " + esc(v.state) + "</li>"; }).join("") + (R.hold || []).map(function (v) { return "<li>보류 · " + esc(v) + "</li>"; }).join("");
    return '<article class="detail d-flat full-place-profile" data-detail="l" data-id="' + esc(en.id) + '" data-stable-id="' + esc(e.stable_id) + '" data-full-profile="1">' +
      '<div class="entity-sticky-head place-sticky-head"><button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><header class="d-identity" data-part="identity"><div class="entity-title-line place-title-line"><h3 class="detail-name">' + esc(F.identity.ko) + '</h3><span class="d-en">' + esc(F.identity.en) + '</span></div><p class="entity-meta-line place-meta-line"><span class="d-original">' + esc(F.identity.hebrew) + " · " + esc(F.identity.pronunciation) + '</span><span class="entity-meta-sep place-meta-sep"> · </span><span class="d-kind">' + esc(detailedType) + '</span></p>' + deepStudyActionHtml(e.stable_id) + "</header></div>" +
      '<p class="d-hook" data-part="hook">' + esc(F.headline) + "</p>" +
      '<section class="d-sec" data-part="facts" data-reader-tier="glance"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + facts + "</dl></section>" +
      hero + (gallery ? '<div class="d-gallery" data-part="gallery">' + gallery + "</div>" : "") +
      '<section class="d-sec" data-part="story" data-reader-tier="commentary"><h4 class="d-h">풍성한 기본 주석 · 성경 속 ' + esc(F.identity.ko) + "</h4>" + fullBlocksHtml(F.story) + "</section>" +
      '<section class="d-sec" data-part="significance" data-reader-tier="commentary"><h4 class="d-h">왜 ' + esc(F.identity.ko) + esc(iga(F.identity.ko)) + " 중요한가</h4>" + fullBlocksHtml(F.significance, "d-significance-block") + "</section>" +
      '<section class="d-sec" data-part="relations"><h4 class="d-h">관련 인물과 사건</h4>' + (ppl ? '<h5 class="d-sub">관련 인물</h5><ul class="rs-list reader-list">' + ppl + "</ul>" : "") + (evs ? '<h5 class="d-sub">관련 사건</h5><ul class="rs-list reader-list">' + evs + "</ul>" : "") + "</section>" +
      '<section class="d-sec" data-part="location"><h4 class="d-h">위치는 어디인가?</h4>' + fullBlocksHtml(locIntro, "d-location-block") + '<button type="button" class="d-map-action" data-map-focus-place="' + esc(en.id) + '">지도에서 보기</button>' + (locMore.length ? '<details class="reader-more"><summary>위치 가설 자세히</summary>' + fullBlocksHtml(locMore, "d-location-block") + "</details>" : "") + "</section>" +
      '<section class="d-sec" data-part="geography" data-reader-tier="commentary"><h4 class="d-h">지리와 공간</h4>' + geo + "</section>" +
      '<section class="d-sec" data-part="archaeology" data-reader-tier="commentary"><h4 class="d-h">고고학과 역사</h4>' + arch + (caution ? '<p class="d-caution">' + esc(caution) + "</p>" : "") + "</section>" +
      '<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4><p class="d-body">설명 안의 성경구절을 누르면 해당 본문으로 이동하며, 연속 구간은 하나의 선택 범위로 표시됩니다.</p><details class="reader-more"><summary>성경 전체 관련 본문 보기 (' + esc(F.related_passages.length) + '개 구간)</summary><div class="pills full-ref-list">' + allRefs + "</div></details></section>" +
      eastonDetailHtml(e.stable_id) +
      externalRefSection(e.stable_id) +
      relatedEntitiesHtml(e.stable_id) +
      '<footer class="d-secondary"><div class="d-rule"></div><details class="research" data-part="research" data-reader-tier="deep-research"><summary>더 깊은 연구</summary><div class="rs-body"><p class="meta">현재 전문 대표본 · ' + esc(F.source.research_id) + '<br>SHA-256 · ' + esc(F.source.sha256) + '<br>Project01 승인 증거 · ' + esc(evidenceSha) + '<br>성경 직접 언급 · ' + esc(F.correction_delta.direct_mentions) + '회</p><h5>증거 계층</h5><p class="meta">' + esc(F.research_meta.evidence_layers.join(" · ")) + '</p><h5>주장과 근거</h5><ul class="rs-list">' + claims + '</ul><h5>남은 확인 사항</h5><ul class="rs-list">' + vh + '</ul>' + internalResearchRelationsHtml(e.stable_id) + '<p class="meta">이전 승인본은 계보·fallback 근거로만 보존됩니다. 외부 공개는 승인되지 않았습니다.</p></div></details></footer>' +
      '<p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
  }
  // 왼쪽 Detail(연구 투영 Place): 카드 없이 타이포그래피·여백·정렬로 위계를 만든다.
  function projectedFlow(en, e) {
    var full = FULL_PLACE && FULL_PLACE[e.stable_id]; if (full && full.source && full.source.professional_status === "CURRENT_REPRESENTATIVE") return fullPlaceProfileFlow(en, e, full);
    var R = e.research, stat = { VERIFIED: "확인된 위치", LIKELY: "유력한 위치", PLAUSIBLE: "가능성 있는 위치", VERIFY: "추정지", DISPUTED: "여러 후보지", UNKNOWN: "위치 미상" }[R.location.reader_status];   // HOLD 는 표시하지 않는다
    var rep = (R.media || []).filter(function (m) { return /representative/.test(m.role); })[0] || (R.media || [])[0], mode = mediaGate(rep);
    var rowsOf = function (grp) {
      var links = (R.passage_links || []).filter(function (l) { return l.group === grp; });
      var ranged = links.filter(function (l) { return l.v1 != null; }), whole = links.filter(function (l) { return l.v1 == null; });
      return mergeContiguousPassageRanges(ranged).map(passageRangePill).join("") + whole.map(function (l) {
        var pid = l.book + "-" + l.chapter, P = D.passages[pid]; if (!P) return "";
        return '<button type="button" class="pill" data-open-ref="' + pid + ':">' + esc(P.ref.replace(/[장편]$/, "") + "장 전체") + "</button>";
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
      '<header class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3><p class="d-en">' + esc(R.label_en) + '</p><p class="d-kind">' + esc(R.reader_type || "성경 지명") + (stat ? " · " + esc(stat) : "") + "</p>" + deepStudyActionHtml(e.stable_id) + "</header>" +
      '<p class="d-hook" data-part="hook">' + esc(R.reader.headline) + "</p>" +
      '<section class="d-sec" data-part="summary" data-reader-tier="commentary"><h4 class="d-h">풍성한 기본 주석 · 이 장소는 왜 중요한가</h4><p class="d-body">' + esc(sig) + "</p></section>" +
      '<section class="d-sec" data-part="facts" data-reader-tier="glance"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + (R.reader.glance || []).map(function (kv) { return '<div class="qf"><dt>' + esc(kv[0]) + "</dt><dd>" + esc(kv[1]) + "</dd></div>"; }).join("") + "</dl></section>" +
      (direct || related ? '<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4>' + (direct ? '<div class="pills">' + direct + "</div>" : "") + (related ? '<p class="d-sub">함께 읽으면 좋은 본문</p><div class="pills">' + related + "</div>" : "") + "</section>" : "") +
      '<section class="d-sec" data-part="location"><h4 class="d-h">지도와 위치</h4>' + (R.location.lead ? '<p class="d-body"><strong>' + esc(R.location.lead) + "</strong></p>" : "") + R.location.sentences.map(function (t) { return '<p class="d-body">' + esc(t) + "</p>"; }).join("") + "</section>" +
      relatedEntitiesHtml(e.stable_id) +
      externalRefSection(e.stable_id) +
      hero +
      '<footer class="d-secondary"><div class="d-rule"></div><section class="d-credits" data-part="credits"><h4 class="d-h2">사진 출처</h4>' + (credits || '<span class="prov">사진을 누르면 출처와 라이선스를 확인할 수 있습니다.</span>') + "</section>" +
      '<details class="research" data-part="research" data-reader-tier="deep-research"><summary>더 깊은 연구</summary><div class="rs-body"><p class="meta">출처 · ' + esc(R.source_refs[0].id) + " (" + esc(R.source_refs[0].version) + ") · " + esc(R.authority.project) + "<br>판정 · 식별 " + esc(R.certainty) + " / 좌표 " + esc(R.coordinate_certainty) + " / " + esc(R.status) + "</p>" +
      "<h5>이름 정보</h5><p class=\"meta\">" + esc(R.ancient_name.hebrew) + " · " + esc(R.ancient_name.transliteration) + " · " + esc((R.aliases || []).join(", ")) + "</p>" +
      "<h5>주장과 근거</h5><ul class=\"rs-list\">" + claims + "</ul><h5>경쟁 견해</h5><ul class=\"rs-list\">" + (R.competing_views || []).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul><h5>후보 위치</h5><ul class=\"rs-list\">" + cands + "</ul><h5>남은 확인 사항</h5><ul class=\"rs-list\">" + vh + "</ul></div></details></footer>" +
      '<p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
  }
  // 왼쪽 Detail(연구 투영 Region): 지도 geometry 없이도 열린다. 좌표·경계가 없으면 그 사실을 그대로 보여 주고 아무것도 만들어 내지 않는다.
  // 연구 검토용(비공개) 화면이다: reader.published=false 인 기록의 VERIFY/HOLD·승인 근거를 숨기지 않는다.
  // Region Reader ViewModel: 어떤 Region 이든(아말렉·아가야 …) 정규화된 기록을 같은 모양으로 읽는다. 값이 없는 필드는 빈 값으로 두고, 렌더러는 빈 섹션/행을 만들지 않는다(숨김).
  // 공개 여부(reader visibility gate)와 무관한 순수 표시 변환이다: 기록·좌표·경계·승인 상태를 바꾸거나 만들어 내지 않는다.
  var REGION_FACT_LABEL = { identity: "식별", broad_southern_geography: "남부 지리 범위", exact_boundary: "정확한 경계", archaeological_ethnicity: "고고학적 민족 귀속", biblical_name_identity: "이름의 식별", NT_Roman_province_sense: "신약 시대 로마 권역 의미", exact_period_boundary_geometry: "시대별 정확한 경계" };
  var REGION_LEVEL = { HIGH: "높음", MEDIUM: "보통", LOW: "낮음", VERIFY: "확인 필요" };
  var REGION_INTERNAL_HOLD = { automatic_BAT01_REG_crosswalk: 1, automatic_person_event_global_ID_creation: 1, BAT01_P_prefix_crosswalk: 1 }, REGION_BOUNDARY_DUP_HOLD = { fixed_first_century_boundary_polygon: 1, region_centroid_coordinate: 1 };
  function regionReaderViewModel(en, e) {
    var R = e.research, S = R.spatial || {}, geo = R.geometry || {}, cert = R.certainty || {}, au = R.authority || {}, src = (R.source_refs || [])[0] || {};
    var bindingLabel = function (x, kind) {
      var b = x && x.binding || {};
      if (x && x.resolved === true && b.state === "IDENTITY_BOUND" && b.detailed_projection === false) return " · 식별자 결속 완료 · 상세 연구 없음";
      if (x && x.resolved === true) return "";
      if (b.state === "EXPLICIT_UNBOUND") return kind === "event" ? " · 사건 연구 연결 전" : " · 인물 연구 연결 전";
      if (b.state === "VERIFY") return " · 식별 확인 필요";
      if (b.state === "HOLD") return " · 결속 보류";
      return " · 연결 상태 미확인";
    };
    var directLinks = (R.passage_links || []).slice();
    var chapters = directLinks.filter(function (l) { return l.v1 == null; }).map(function (l) { var pid = l.book + "-" + l.chapter, P = D.passages[pid]; return P ? { pid: pid, label: P.ref.replace(/[장편]$/, "") + "장 전체" } : null; }).filter(Boolean);
    var verifyItems = (R.verify || []).length ? R.verify : (S.verify_hold && S.verify_hold.verify || []).map(function (id) { return { id: id, issue: null, effect: null }; });
    var holdItems = (R.hold || []).length ? R.hold : (S.verify_hold && typeof S.verify_hold.hold === "number" && S.verify_hold.hold > 0 ? [{ id: "HOLD_COUNT_" + S.verify_hold.hold, label: null }] : []);
    // 읽는 사람에게 보이는 확인 사항만: 내부 구현 항목(자동 연결·전역 ID 생성)은 숨기고, 확인 사항 문장이 이미 '정확한 경계'를 다루면 경계/중심 좌표 보류 항목은 중복이므로 한 번만 보인다(데이터 자체는 그대로).
    var boundaryCovered = verifyItems.some(function (v) { return /exact\b.*\bboundary\b/i.test(v.issue || ""); });
    holdItems = holdItems.filter(function (v) { var k = v && (v.id || v); return !REGION_INTERNAL_HOLD[k] && !(boundaryCovered && REGION_BOUNDARY_DUP_HOLD[k]); });
    var linked = function (x) { return { text: regionReaderName(x.name) + " · " + regionReaderRelation(x.relation) + bindingLabel(x) }; };
    return {
      id: en.id, stableId: e.stable_id, name: e.name, nameEn: R.label_en || "", kindLabel: au.approval === "CAPTAIN_APPROVED" && au.downstream === "APPROVED_DOWNSTREAM_PROJECTION" ? "지역 · Project01 전문 연구 · 앱 내부 사용 승인" : "지역 · 연구 검토용",
      published: !!(R.reader && R.reader.published === true), geometryStatus: geo.status || "none",
      summary: R.reader && R.reader.concise_summary || R.semantic_note || "",
      facts: (R.reader && R.reader.quick_facts || []).map(function (f) { return { label: Array.isArray(f) ? f[0] : f.label, value: Array.isArray(f) ? f[1] : f.value }; }).concat(Object.keys(REGION_FACT_LABEL).filter(function (k) { return cert[k]; }).map(function (k) { return { label: REGION_FACT_LABEL[k], value: REGION_LEVEL[cert[k]] || String(cert[k]) }; })),
      passage: { ranges: mergeContiguousPassageRanges(directLinks.filter(function (l) { return l.v1 != null; })), chapters: chapters },
      map: { note: geo.approved === true ? "승인된 지리 정보가 있습니다." : "승인된 좌표나 경계가 없어 지도에 표시하지 않습니다. 이 지역의 정체성과 관련 본문은 위치 표시 없이 확인할 수 있습니다.", broad: (S.broad_region_labels || []).length ? regionReaderBroad(S.broad_region_labels) : "" },
      relations: (R.relations || []).map(linked), people: (R.related_people || []).map(linked),
      events: (R.related_events || []).map(function (x) { return { text: regionReaderEvent(x.event) + bindingLabel(x, "event") }; }),
      verify: verifyItems.map(function (v) { return { id: v.id, text: regionReaderVerify(v) }; }), hold: holdItems.map(function (v) { return { id: v.id, text: regionReaderHold(v) }; }),
      research: { source: src.id || "", sha: src.sha256 ? String(src.sha256).slice(0, 12) : "", status: R.status || "", approval: au.approval || "", approvalRecord: au.approval_record_id || "", approvalScope: au.approval_scope || "", sections: R.reader && R.reader.sections || [] }
    };
  }
  function projectedRegionFlow(en, e) {
    var R = e.research, V = regionReaderViewModel(en, e);
    var list = function (a, attr) { return a.length ? '<ul class="rs-list">' + a.map(function (x) { return "<li" + (attr ? " " + attr + '="' + esc(x.id) + '"' : "") + ">" + esc(x.text) + "</li>"; }).join("") + "</ul>" : ""; };
    var sec = function (part, title, body) { var tier = part === "facts" ? "glance" : (part === "summary" || part === "research-content" ? "commentary" : ""); return body ? '<section class="d-sec" data-part="' + part + '"' + (tier ? ' data-reader-tier="' + tier + '"' : "") + '><h4 class="d-h">' + title + "</h4>" + body + "</section>" : ""; };
    var pills = V.passage.ranges.map(passageRangePill).join("") + V.passage.chapters.map(function (c) { return '<button type="button" class="pill" data-open-ref="' + c.pid + ':">' + esc(c.label) + "</button>"; }).join("");
    var facts = V.facts.map(function (f) { return '<div class="qf"><dt>' + esc(f.label) + "</dt><dd>" + esc(f.value) + "</dd></div>"; }).join("");
    var vhVerify = list(V.verify, "data-verify"), vhHold = list(V.hold, "data-hold");
    // VERIFY(추가 확인이 필요한 점)와 HOLD(확정하지 않고 보류한 항목)는 성격이 달라 나누어 보인다.
    var vh = (vhVerify ? '<h5 class="d-sub" data-vh-group="verify">추가 확인이 필요한 점</h5>' + vhVerify : "") + (vhHold ? '<h5 class="d-sub" data-vh-group="hold">확정하지 않고 보류한 항목</h5>' + vhHold : "");
    var rs = V.research, rsLines = [rs.source ? "출처 · " + esc(rs.source) + (rs.sha ? " · " + esc(rs.sha) : "") : "", rs.status ? "상태 · " + esc(rs.status) : "", rs.approval ? "내부 사용 승인 · " + esc(rs.approval) + (rs.approvalRecord ? " (" + esc(rs.approvalRecord) + (rs.approvalScope ? " · " + esc(rs.approvalScope) : "") + ")" : "") : "", "외부 공개 · " + (V.published ? "승인됨" : "미승인")].filter(Boolean).join("<br>"); var researchBody=(rs.sections||[]).map(function(s){return '<div class="rs-block"><h5 class="d-sub">' + esc(s.title||"연구") + '</h5><p class="d-body">' + esc(s.body||"") + "</p></div>";}).join("");
    return '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="rgn" data-id="' + esc(V.id) + '" data-stable-id="' + esc(V.stableId) + '" data-research="1" data-published="' + V.published + '" data-geometry="' + esc(V.geometryStatus) + '">' +
      '<header class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(V.name) + '</h3>' + (V.nameEn ? '<p class="d-en">' + esc(V.nameEn) + "</p>" : "") + '<p class="d-kind">' + esc(V.kindLabel) + "</p>" + deepStudyActionHtml(V.stableId) + "</header>" +
      sec("summary", "풍성한 기본 주석 · 이 지역은 무엇인가", V.summary ? '<p class="d-body">' + esc(V.summary) + "</p>" : "") +
      sec("research-content", "연구 내용", researchBody) +
      sec("facts", "한눈에 보기", facts ? '<dl class="qf-list">' + facts + "</dl>" : "") +
      sec("scripture", "관련 본문", pills ? '<div class="pills">' + pills + "</div>" : "") +
      sec("map", "지도에서는", '<p class="d-body" data-map-note="none">' + esc(V.map.note) + "</p>" + (regionReadingCamera("rgn", en.id) ? '<p class="d-body" data-map-navigation="approximate">연구용 대략적 지도 보기 · 지도는 해당 광역 권역을 살펴보기 위한 시점으로 이동하며, 정확한 중심점·경계·위치 확정을 뜻하지 않습니다.</p>' : "") + (V.map.broad ? '<p class="d-sub">광역 맥락 · ' + esc(V.map.broad) + "</p>" : "")) +
      relatedEntitiesHtml(V.stableId) +
      sec("relations", "관련 장소", list(V.relations)) +
      sec("people", "관련 인물", list(V.people)) +
      sec("events", "관련 사건", list(V.events)) +
      regionMediaHtml(R) +
      externalRefSection(V.stableId) +
      '<section class="d-sec" data-part="verify-hold"><h4 class="d-h">남은 확인 사항</h4>' + vh + "</section>" +
      '<details class="research" data-part="research" data-reader-tier="deep-research"><summary>더 깊은 연구</summary><div class="rs-body"><p class="meta">' + rsLines + "</p></div></details>" +
      '<p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
  }
  function projectedPersonFlow(en, e) {
    var R = e.research, n = STORE.get(e.stable_id), refs = n ? n.passage_refs : [], events = n ? n.related_events : [];
    var rangedRefs = refs.filter(function (r) { return r.verse != null; }).map(function (r) { return { book: r.book, chapter: r.chapter, v1: r.verse, v2: r.verse_end == null ? r.verse : r.verse_end }; });
    var refHtml = mergeContiguousPassageRanges(rangedRefs).map(passageRangePill).join("") + refs.filter(function (r) { return r.verse == null; }).map(function (r) { var pid = r.book + "-" + r.chapter, P = D.passages[pid]; if (!P) return ""; return '<button type="button" class="pill" data-open-ref="' + esc(pid + ":") + '">' + esc(P.ref) + "</button>"; }).join("");
    var facts = [["역할", n && n.role], ["시대", n && n.period]].filter(function (x) { return x[1]; }).map(function (x) { return '<div class="qf"><dt>' + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("");
    var evHtml = events.map(function (x) { return '<li data-event-id="' + esc(x.event_id || x.id || "") + '">' + esc(x.display_label || x.label || x.event_id || x.id) + (x.passage ? " · " + esc(x.passage) : "") + "</li>"; }).join("");
    var src = R.source_refs && R.source_refs[0];
    var out = '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="p" data-id="' + esc(en.id) + '" data-stable-id="' + esc(e.stable_id) + '" data-research="1">';
    var approvedReader = R.research_projection && R.research_projection.asset_type === "PERSON_PROFILE_WORBS", rr = R.reader || {}, ident = rr.identity || {};
    out += '<header class="d-identity person-reader-head" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3>' +
      (ident.name_en ? '<span class="d-en">' + esc(ident.name_en) + '</span>' : "") +
      (ident.original_name ? '<span class="d-original">' + esc(ident.original_name + (ident.pronunciation_ko ? " · " + ident.pronunciation_ko : "")) + '</span>' : "") +
      '<p class="d-kind">' + (approvedReader ? '인물 · ' + esc(rr.classification || '인물') : '인물') + '</p></header>';
    if (approvedReader) {
      var omitQuick = { major_events:1, theological_role:1 }, quickRows = "", placeRel = {};
      (rr.related_places || []).forEach(function (p) { if (p && p.label && p.stable_id) placeRel[p.label] = p.stable_id; });
      var quickOrder = { name_meaning:1, parents:2, spouse:3, children:4, half_brother:5, major_activity_regions:6, core_role:7, representative_passages:8 };
      (rr.quick_facts || []).slice().sort(function (a, b) { return (quickOrder[a.key || a.k] || 99) - (quickOrder[b.key || b.k] || 99); }).forEach(function (f) {
        var key = f.key || f.k || "", label = f.label || key, val = f.value != null ? f.value : f.v, vals = Array.isArray(val) ? val : [val];
        vals = vals.filter(function (x) { return x != null && x !== ""; }); if (!vals.length || omitQuick[key]) return;
        var valueHtml = vals.map(function (x) {
          var sid = placeRel[String(x)];
          return sid && STORE.get(sid) ? '<button type="button" class="person-inline-link" data-related-entity="' + esc(sid) + '">' + esc(x) + "</button>" : esc(x);
        }).join(" · ");
        quickRows += '<div class="person-fact-row"><dt>' + esc(label) + '</dt><dd>' + valueHtml + "</dd></div>";
      });
      var compactRef = function (p) {
        if (!BOOK_ABBR) buildAlias();
        var pid = p[0] + "-" + p[1], P = D.passages[pid]; if (!P) return "";
        var a = +p[2], b = +(p[3] == null ? p[2] : p[3]), ab = BOOK_ABBR && BOOK_ABBR[p[0]] || P.ref.replace(/[ 0-9장편]/g, "");
        var lab = "(" + ab + " " + p[1] + ":" + a + (b > a ? "–" + b : "") + ")";
        return '<button type="button" class="person-story-ref" data-person-inline-range="' + esc(pid + ":" + a + "-" + b) + '" aria-expanded="false">' + esc(lab) + "</button>";
      };
      var storySections = (rr.story_sections && rr.story_sections.length) ? rr.story_sections : (rr.narrative_sections || []).map(function (sec) {
        return { title:sec.title, units:(sec.paragraphs || []).map(function (t, j) { return { text:t, passages:j === 0 ? (sec.passages || []) : [] }; }) };
      });
      var narrativeHtml = storySections.map(function (sec, i) {
        var units = (sec.units || []).map(function (u) {
          var refs = (u.passages || []).map(compactRef).join("");
          return '<div class="person-story-unit"><p>' + esc(u.text || "") + "</p>" + (refs ? '<div class="person-story-refs">' + refs + "</div>" : "") + "</div>";
        }).join("");
        return '<details class="person-narrative-section" data-person-narrative="' + (i + 1) + '"' + (i === 0 ? ' open' : '') + '><summary class="person-narrative-summary"><span class="person-narrative-kicker">' + String(i + 1).padStart(2,"0") + '</span><span class="person-narrative-heading">' + esc(sec.title || "") + '</span><span class="person-accordion-arrow" aria-hidden="true"></span></summary><div class="person-narrative-content">' + units + "</div></details>";
      }).join("");
      var theologyHtml = (rr.theological_summary || []).map(function (p) { return '<p>' + esc(p) + "</p>"; }).join("");
      var relGroups = [["DM_NAME","직접 이름 등장"],["DM_PRONOUN_CONTINUATION","서사가 이어지는 본문"],["STRONGLY_RELATED","깊이 관련된 본문"]];
      var relTotal = 0, relatedHtml = relGroups.map(function (g) {
        var ls = (R.passage_links || []).filter(function (p) { return p.classification === g[0]; });
        ls.forEach(function (p) { relTotal += Math.max(1, (+p.v2 || +p.v1) - (+p.v1 || 0) + 1); });
        return ls.length ? '<details class="person-related-group"' + (g[0] === "DM_NAME" ? ' open' : '') + '><summary>' + esc(g[1]) + '<span class="person-accordion-arrow" aria-hidden="true"></span></summary><div class="pills">' + ls.map(passageRangePill).join("") + "</div></details>" : "";
      }).join("");
      var rb = rr.research_basis || {}, researchLanguage = [ident.original_name, ident.transliteration, ident.greek_name].filter(Boolean).join(" · ");
      var researchRefHtml = function (txt) {
        if (!BOOK_ABBR) buildAlias();
        var names = Object.keys(BOOK_ABBR).map(function(k){ return BOOK_ABBR[k]; }).filter(Boolean).sort(function(a,b){ return b.length-a.length; });
        var escapedNames = names.map(function(x){ return x.replace(/[.*+?^${}()|[\]\\]/g, "\$&"); });
        var re = new RegExp("(" + escapedNames.join("|") + ")\\s*(\\d+):(\\d+)(?:[–—-](\\d+))?", "g");
        var s = String(txt || ""), out = "", last = 0, m;
        while ((m = re.exec(s))) {
          out += esc(s.slice(last, m.index));
          var q = m[1] + " " + m[2] + ":" + m[3] + (m[4] ? "-" + m[4] : "");
          var pr = parseReference(q);
          if (pr && pr.passage && pr.verse != null) {
            var end = pr.verseEnd == null ? pr.verse : pr.verseEnd;
            out += '<button type="button" class="person-story-ref person-research-ref" data-person-inline-range="' + esc(pr.passage + ":" + pr.verse + "-" + end) + '" aria-expanded="false">' + esc(m[0]) + "</button>";
          } else out += esc(m[0]);
          last = re.lastIndex;
        }
        return out + esc(s.slice(last));
      };
      var researchName = String(rb.name_and_language || "").replace(/~~~[\s\S]*?~~~/g,"").split(/\n\s*\n/)[0].replace(/\*\*/g,"").trim();
      var researchHtml = researchName
        ? '<details class="person-research" data-person-research data-reader-tier="deep-research"><summary>더 깊은 연구</summary><div class="person-research-body"><section><h5>이름과 원어</h5><p>' + researchRefHtml(researchName) + "</p></section></div></details>"
        : "";
      var relatedPlacesRow = (rr.related_places || []).map(function (p) { var x = p && p.stable_id && STORE.get(p.stable_id); return x ? '<button type="button" class="person-inline-link" data-related-entity="' + esc(p.stable_id) + '">' + esc(p.label || x.display_label) + "</button>" : ""; }).filter(Boolean).join(" · ");
      if (relatedPlacesRow) quickRows += '<div class="person-fact-row"><dt>관련 장소</dt><dd>' + relatedPlacesRow + "</dd></div>";
      out += '<div class="person-reader-flat" data-person-reader="canonical">' +
        (rr.intro && rr.intro.concise_intro ? '<p class="person-reader-intro">' + esc(rr.intro.concise_intro) + "</p>" : "") +
        (quickRows ? '<section class="person-overview" data-reader-tier="glance"><h4 class="person-section-title">한눈에 보기</h4><dl class="person-facts-compact">' + quickRows + "</dl></section>" : "") +
        (narrativeHtml ? '<section class="person-narrative" data-reader-tier="commentary"><h4 class="person-section-title">풍성한 기본 주석 · 본문을 깊이 읽기</h4>' + narrativeHtml + "</section>" : "") +
        (theologyHtml ? '<section class="person-theology" data-reader-tier="commentary"><h4 class="person-section-title">' + esc(e.name) + '을 어떻게 이해할 것인가</h4>' + theologyHtml + "</section>" : "") +
        (relatedHtml ? '<details class="person-related-scripture"><summary>관련 본문 ' + relTotal + '곳 <span>전체 보기</span></summary>' + relatedHtml + "</details>" : "") +
        researchHtml +
        "</div>";
    } else {
      if (e.note) out += '<section class="d-sec" data-part="summary"><h4 class="d-h">이 인물은 누구인가</h4><p class="d-body">' + esc(e.note) + "</p></section>";
      if (facts) out += '<section class="d-sec" data-part="facts"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + facts + "</dl></section>";
    }
    if (!approvedReader && refHtml) out += '<section class="d-sec person-related-section" data-part="scripture"><h4 class="d-h">관련 본문</h4><div class="pills">' + refHtml + "</div></section>";
    if (!approvedReader && evHtml) out += '<section class="d-sec person-related-section" data-part="events"><h4 class="d-h">연결된 사건</h4><ul class="rs-list">' + evHtml + "</ul></section>";
    if (!approvedReader) out += '<details class="research" data-part="research"><summary>연구 상세</summary><div class="rs-body"><p class="meta">' + (src ? "출처 · " + esc(src.id || src.path || "") + "<br>" : "") + "판정 · " + esc(R.certainty || "") + " / " + esc(R.status || "") + '</p></div></details><p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p>';
    out += eastonDetailHtml(e.stable_id);
    out += "</article>";
    return out;
  }
  function projectedEventFlow(en, e) {
    var R=e.research||{}, refs=recordPassages(R,e.stable_id), src=R.source_refs&&R.source_refs[0], parent=R.parent_asset_id&&STORE.get(R.parent_asset_id);
    var ranged=refs.filter(function(r){return r.verse!=null;}).map(function(r){return {book:r.book,chapter:r.chapter,v1:r.verse,v2:r.verse_end==null?r.verse:r.verse_end};});
    var refHtml=mergeContiguousPassageRanges(ranged).map(passageRangePill).join("")+refs.filter(function(r){return r.verse==null;}).map(function(r){var pid=r.book+"-"+r.chapter,P=D.passages[pid];return P?'<button type="button" class="pill" data-open-ref="'+esc(pid+":")+'">'+esc(P.ref)+"</button>":"";}).join("");
    var facts=[["범위",R.scope],["확실성",R.certainty],["연구 상태",R.status],["사건 장소",R.event_location],["출발",R.origin],["도착",R.destination_event_location]].filter(function(x){return x[1]!=null&&x[1]!=="";}).map(function(x){return '<div class="qf"><dt>'+esc(x[0])+'</dt><dd>'+esc(String(x[1]).replace(/_/g," "))+"</dd></div>";}).join("");
    var geo=(R.exact_geometry||R.route_geometry)?'<section class="d-sec" data-part="geometry"><h4 class="d-h">공간 정보</h4><p class="d-body">정확한 사건·이동 geometry는 승인되지 않았습니다.</p></section>':"";
    var hold=R.VERIFY_HOLD&&R.VERIFY_HOLD.reason?'<p class="meta">'+esc(R.VERIFY_HOLD.reason)+'</p>':"";
    return '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="evt" data-stable-id="'+esc(e.stable_id)+'" data-research="1" data-public="false">'+
      '<header class="d-identity"><h3 class="detail-name">'+esc(String(e.name||R.display_label||e.stable_id).replace(/_/g," "))+'</h3><p class="d-kind">사건 · 내부 연구 객체 · 비공개</p>'+deepStudyActionHtml(e.stable_id)+"</header>"+
      (refHtml?'<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4><div class="pills">'+refHtml+"</div></section>":"")+
      (facts?'<section class="d-sec" data-part="facts" data-reader-tier="glance"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">'+facts+"</dl></section>":"")+
      (parent?'<section class="d-sec" data-part="parent"><h4 class="d-h">부모 연구자산</h4><button type="button" class="pill" data-related-entity="'+esc(parent.stable_id)+'">'+esc(parent.display_label)+'</button></section>':"")+
      geo+
      '<details class="research" data-part="research" data-reader-tier="deep-research" open><summary>더 깊은 연구</summary><div class="rs-body"><p class="meta">stable ID · '+esc(e.stable_id)+"<br>projection role · "+esc(R.projection_role||"")+"<br>공개 · 아니오</p>"+hold+(src?'<p class="meta">출처 · '+esc(src.id||src.path||"")+"<br>SHA-256 · "+esc(src.sha256||"")+"</p>":"")+'</div></details><p class="d-hint">이 사건은 승인된 부모 연구자산 안의 asset-local 연구 객체이며 독립 정경 사건으로 승격되지 않았습니다.</p></article>';
  }
  function projectedRouteFlow(en,e) {
    var R=e.research||{},refs=recordPassages(R,e.stable_id),src=R.source_refs&&R.source_refs[0];
    var refHtml=refs.map(function(r){var pid=r.book+"-"+r.chapter,P=D.passages[pid];if(!P)return"";var spec=pid+":"+(r.verse||"")+(r.verse_end&&r.verse_end!==r.verse?"-"+r.verse_end:"");return '<button type="button" class="pill" data-open-ref="'+esc(spec)+'">'+esc(P.ref+(r.verse?" "+r.verse+(r.verse_end&&r.verse_end!==r.verse?"–"+r.verse_end:"")+"절":""))+"</button>";}).join("");
    var pr=PRESENTATION_ROUTE_SPECS[e.stable_id], prState=pr&&pr.presentation_status, mapText=R.geometry&&R.geometry.approved===true?"승인된 geometry가 있습니다.":"승인된 canonical geometry가 없습니다.";
    if (regionReadingCamera("rt", en.id)) mapText += " 연구용 대략적 지도 보기: 경로가 놓인 광역 지역을 살펴보는 시점으로만 이동하며 실제 도로 선형이나 경유지를 확정하지 않습니다.";
    if(prState==="PRESENTATION_ONLY_ESTIMATED") mapText += " 관련 본문 지도에서는 canonical record와 분리된 표시 전용 레이어에 ‘연구 기반 개략 경로’로 표시하며 실제 이동로는 미확정입니다.";
    else if(prState==="GEOMETRY_HOLD_INSUFFICIENT_DRAWABLE_ANCHORS") mapText += " 표시 전용 corridor도 선을 구성할 연구 기반 지도 기준점이 부족해 만들지 않습니다."+(pr&&pr.hold_reason?" "+pr.hold_reason:"");
    return '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="rt" data-stable-id="'+esc(e.stable_id)+'" data-research="1" data-presentation-route-status="'+esc(prState||"NONE")+'"><header class="d-identity"><h3 class="detail-name">'+esc(e.name)+'</h3><p class="d-kind">경로 · 연구 객체</p></header>'+(refHtml?'<section class="d-sec"><h4 class="d-h">관련 본문</h4><div class="pills">'+refHtml+"</div></section>":"")+'<section class="d-sec"><h4 class="d-h">지도 geometry</h4><p class="d-body">'+esc(mapText)+'</p></section><details class="research"><summary>연구 상세</summary><div class="rs-body"><p class="meta">'+(src?"출처 · "+esc(src.id||src.path||""):"")+'</p></div></details></article>';
  }
  function entityFlow() {
    var en = state.entity, kind = en.kind, dict = dictOf(kind), e = dict && dict[en.id];
    if (!e) return '<p class="empty helper">선택한 항목을 찾을 수 없습니다.</p>';
    if (e.research) return kind === "p" ? projectedPersonFlow(en, e) : kind === "rgn" ? projectedRegionFlow(en, e) : kind === "evt" ? projectedEventFlow(en, e) : kind === "rt" ? projectedRouteFlow(en, e) : projectedFlow(en, e);
    var refs = entityRefs(kind, en.id), rel = relatedOf(kind, en.id);
    var note = String(e.note || "").replace(/^샘플(?: 설명)?:\s*/, "").replace(/\s*\(위치는 프로토타입용 좌표\)\.?\s*$/, "").trim();
    var alias = (e.aliases || []).filter(function (x) { return x && x !== e.name; }).join(", ");
    var facts = kind === "p" && e.role ? '<div class="qf"><dt>역할</dt><dd>' + esc(e.role) + "</dd></div>" : "";
    var ph = kind === "l" ? PANELS.photos([en.id]) : "";
    var photoMeta = kind === "l" ? (e.photos || []).map(function (id) { return D.photos && D.photos[id]; }).filter(Boolean) : [];
    var placeholderPhoto = photoMeta.some(function (p) { return /샘플|자리표시|fixture|placeholder/i.test([p.title, p.credit, p.source].join(" ")); });
    var showPh = !placeholderPhoto && /<figure|degraded|권리 확인/.test(ph);
    var seenN = {}, shown = refs.filter(function (r) { seenN[r.pid] = (seenN[r.pid] || 0) + 1; return seenN[r.pid] <= (r.pid === state.passage ? 5 : 3); });   // 본문별로 나눠 보여 준다(다른 본문 구절도 항상 도달 가능)
    var rows = shown.map(function (r) { return '<button type="button" class="vrow" data-open-ref="' + r.pid + ":" + r.n + '"><span class="vr-ref">' + esc(r.ref) + " " + r.n + '절</span><span class="vr-txt">' + esc(snip(r.text)) + "</span></button>"; }).join("");
    var sid = stableOf(kind, en.id);
    var out = '<button type="button" class="d-back" data-clear-entity>‹ 본문 개요</button><article class="detail d-flat" data-detail="' + kind + '" data-id="' + esc(en.id) + '" data-stable-id="' + esc(sid) + '" data-research="0">';
    out += '<header class="d-identity" data-part="identity"><h3 class="detail-name">' + esc(e.name) + '</h3>' + (alias ? '<p class="d-en">' + esc(alias) + "</p>" : "") + '<p class="d-kind">' + (kind === "p" ? "인물" : "장소") + "</p>" + deepStudyActionHtml(sid) + "</header>";
    if (note) out += '<section class="d-sec" data-part="summary"><h4 class="d-h">' + (kind === "p" ? "이 인물은 누구인가" : "이 장소는 무엇인가") + '</h4><p class="d-body">' + esc(note) + "</p></section>";
    if (facts) out += '<section class="d-sec" data-part="facts"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + facts + "</dl></section>";
    if (refs.length) out += '<section class="d-sec" data-part="scripture"><h4 class="d-h">관련 본문</h4><div class="vrows">' + rows + "</div>" + (refs.length > shown.length ? '<p class="d-sub">외 ' + (refs.length - shown.length) + "개 구절</p>" : "") + "</section>";
    if (kind === "l") out += '<section class="d-sec" data-part="location"><h4 class="d-h">지도와 위치</h4><p class="d-body">정확한 위치 정보는 아직 상세 연구에 연결되지 않았습니다.</p></section>';
    if (rel.l.length) out += '<section class="d-sec" data-part="places"><h4 class="d-h">관련 장소</h4>' + chips("l", rel.l, D.places) + "</section>";
    if (rel.p.length) out += '<section class="d-sec" data-part="people"><h4 class="d-h">관련 인물</h4>' + chips("p", rel.p, D.people) + "</section>";
    if (showPh) out += '<section class="d-sec" data-part="photos"><h4 class="d-h">사진</h4>' + ph + "</section>";
    out += '<details class="research" data-part="research"><summary>연구 상세</summary><div class="rs-body"><p class="meta">연결된 상세 연구자산이 아직 없습니다. 현재 확인할 수 있는 본문과 기본 정보만 표시합니다.</p></div></details>';
    out += '<p class="d-hint">Esc 또는 같은 항목을 다시 눌러 닫기</p></article>';
    return out;
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
      // The memo editor must remain available even before the first note exists.   // 저장된 메모가 없으면 섹션 자체를 숨긴다(메모 탭을 연 경우만 작성 폼 유지)
      var n = t === "resources" ? " (" + (h.match(/class="item res"/g) || []).length + ")" : "", open = ui.ovOpen[t] !== undefined ? ui.ovOpen[t] : t === state.tab;
      return '<details class="ov" data-ov="' + t + '"' + (open ? " open" : "") + "><summary>" + esc(LABEL[t]) + n + '</summary><div class="ov-body">' + h + "</div></details>";
    };
    return '<div class="ov-flow">' +
      ["context", "people", "places", "crossref", "photos"].map(flat).join("") + contextualResearchHtml(state.passage, state.verse) + ["resources", "notes"].map(fold).join("") +
      (QA_FIXTURE ? '<details class="research" data-part="research"><summary>연구 상세</summary><ul class="meta rs-list"><li>근거(evidence) · 연결된 연구자산 없음</li><li>출처(source) · UI 개발용 fixture</li><li>위치(locator) · 없음</li><li>확실성(certainty) · 미검증 (FIXTURE_SAMPLE · NON_AUTHORITATIVE)</li></ul></details>' : "") + '</div>';
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
      var ctx = contextualRecords(state.passage, state.verse), seen = {}, ctxList = "";
      ctx.forEach(function (r) { (r.passage_refs || []).forEach(function (p) {
        var key = p.book + "-" + p.chapter + ":" + p.v1; if (seen[key] || (p.book + "-" + p.chapter === state.passage && state.verse != null && p.v1 <= state.verse && p.v2 >= state.verse)) return; seen[key] = 1;
        ctxList += '<div class="item xref" data-context-record="' + esc(r.record_id) + '"><h3 class="ent-name">' + esc(contextPassageLabel(p)) + '</h3><div class="meta">승인 연구의 명시적 Passage binding · ' + esc(r.title) + '</div><button class="btn ghost" data-context-ref="' + esc(key) + '">본문으로 이동</button></div>';
      }); });
      if (!refs.length && !ctxList) return '<p class="empty helper">' + scopeLabel() + "의 관련 본문 없음.</p>";
      var list = refs.map(function (r) { return '<div class="item xref"><h3 class="ent-name"><a href="#" data-preview="' + r.to + '">' + esc(r.label) + '</a></h3><div class="meta">' + esc(r.type) + " · " + esc(r.from) + " → " + esc(r.to) + '</div><button class="btn ghost" data-goto="' + r.to + '">본문으로 이동</button></div>'; }).join("");
      var pv = "";
      if (state.preview) { var k = parseKey(state.preview), P = D.passages[k.passage], v = P && P.verses.filter(function (x) { return x.n === k.verse; })[0];
        pv = v ? '<div id="xref-preview" class="item preview"><h3 class="sec-h">미리보기 · ' + esc(P.ref) + " " + v.n + '절</h3><div>' + esc(stripTags(v.text)) + '</div><span class="helper">미리보기일 뿐 현재 본문은 바뀌지 않았습니다.</span></div>' : '<div id="xref-preview" class="degraded">미리볼 수 없는 참조입니다.</div>'; }
      return list + ctxList + pv;
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
      return noteCardsHtml() + '<div class="note-new"><p class="scope">새 메모 대상 · ' + esc(D.passages[state.passage].ref) + " " + scopeLabel() + '</p><input id="note-title" class="note-title-input" type="text" maxlength="80" placeholder="메모 제목 (선택)" aria-label="메모 제목"><textarea id="note-text" aria-label="새 메모"></textarea>' +
        '<p class="actions"><button id="note-save" class="btn primary">저장</button> <button id="note-export" class="btn ghost">내보내기</button> <span id="note-status" class="helper" data-state="idle"></span></p><pre id="note-out" class="helper"></pre></div>';
    }
  };
  function explorerDetailMapHtml(n) {
    if (!n) return '<p class="empty helper">선택한 대상을 찾을 수 없습니다.</p>';
    if (n.entity_type === "Place") {
      var S=spatialOf(n.compatibility_key), has=S && ((S.primary&&S.primary.marker&&S.primary.marker.render) || (S.sites||[]).some(function(c){return markerSpec({lat:c.lat,lon:c.lon,role:c.role,status:c.coordinate_status}).render;}));
      return '<section class="sw-detail-map"><h3>'+esc(n.display_label)+'</h3><p class="helper">'+(has?"승인된 위치 정보가 지도에 연결되어 있습니다.":"승인된 좌표가 없어 지도에 점으로 표시하지 않습니다.")+'</p>'+(has?'<button type="button" class="btn primary" data-ee-action="map" data-stable-id="'+esc(n.stable_id)+'">전체 지도에서 보기</button>':'')+'</section>';
    }
    if (n.entity_type === "Person") {
      var pl=boundRelations(n.stable_id).map(function(x){return STORE.get(x.sid);}).filter(function(e){return e&&e.entity_type==="Place";});
      return '<section class="sw-detail-map"><h3>'+esc(n.display_label)+'의 관련 장소</h3>'+(pl.length?'<div class="pills">'+pl.map(function(e){return '<button type="button" class="pill" data-sp-entity="'+esc(e.stable_id)+'">'+esc(e.display_label)+'</button>';}).join("")+'</div>':'<p class="empty helper">현재 연결된 장소가 없습니다.</p>')+'<p class="helper">인물 자체에 좌표를 만들지 않고 기존 relation으로 연결된 장소만 사용합니다.</p></section>';
    }
    return '<p class="empty helper">이 대상에는 지도 보기가 없습니다.</p>';
  }
  function explorerDetailBody(tab) {
    var sid=state.entity&&stableOf(state.entity.kind,state.entity.id), n=sid&&STORE.get(sid); if(!n) return '<p class="empty helper">결과를 선택하면 자세한 내용을 볼 수 있습니다.</p>';
    if(tab==="map") return explorerDetailMapHtml(n);
    var full=entityFlow(); if(tab==="overview") return full;
    var box=document.createElement("div"), selectors=tab==="scripture"?[".d-identity","[data-part=scripture]","[data-part=people]","[data-part=places]","[data-part=events]"]:tab==="history"?[".d-identity","[data-part=location]","[data-part=external-reference]","[data-part=research]"]:[".d-identity","[data-part=media]","[data-part=photos]","[data-part=credits]"], seen=[], out=""; box.innerHTML=full;
    selectors.forEach(function(sel){[].forEach.call(box.querySelectorAll(sel),function(el){if(seen.indexOf(el)<0){seen.push(el);out+=el.outerHTML;}});});
    return out||'<p class="empty helper">이 항목에 표시할 정보가 아직 없습니다.</p>';
  }
  // WORBS 연구(등록된 Project01 연구 투영)를 왼쪽 패널에 보인다. 연결이 없으면 빈 상태만 보이고 다른 인물카드로 대신하지 않는다.
  function RPJ() { return window.BVCResearchProjection || null; }
  function VRJ() { return window.BVCVerseResearchProjection || null; }
  function verseResearchHtml() {
    if (!D.passages[state.passage]) return "";
    var vr = VRJ(), ref = state.verse == null ? state.passage : state.passage + ":" + state.verse;
    var rec = state.verse == null ? (vr && vr.passage ? vr.passage(state.passage) : null) : (vr && vr.verse ? vr.verse(ref) : null);
    var label = state.verse == null ? D.passages[state.passage].ref : D.passages[state.passage].ref + " " + scopeLabel();
    if (!rec) return "";
    return '<section class="ov-sec rp-verse" data-part="verse-worbs" data-verse-ref="' + esc(ref) + '"><h3 class="sec-h ov-h">' + esc(label) + ' 연구</h3>' +
      '<div class="rp-panel verse-worbs-slot" data-verse-worbs-ref="' + esc(ref) + '" hidden></div></section>';
  }
  function rpPersonHtml() {
    var rp = RPJ(), pr = ui.rpPerson, name = rp && rp.subject && rp.subject() || "인물";
    return '<section class="ov-sec rp-person" data-part="person-card" data-person="' + esc(name) + '" data-asset-type="PERSON_PROFILE_WORBS"><h3 class="sec-h ov-h">' + esc(name) + ' 인물카드</h3><div class="rp-panel rp-person-slot" data-rp-person="ISAAC" data-related-ref="' + esc(pr.ref || "") + '" hidden></div></section>';
  }
  function hydrateResearchSlots(root) {
    var rp = RPJ(), vr = VRJ();
    if (rp && rp.renderPerson) [].forEach.call(root.querySelectorAll(".rp-person-slot[data-rp-person]"), function (box) { rp.renderPerson(box, box.dataset.relatedRef || null); });
    if (vr && vr.render) [].forEach.call(root.querySelectorAll(".verse-worbs-slot[data-verse-worbs-ref]"), function (box) { vr.render(box, box.dataset.verseWorbsRef); });
  }
  function renderPanel() {
    if (localPersonOpen && state.entity) localPersonOpen = null;
    if (localPersonOpen && state.view !== "explore" && $("panel") && $("panel").dataset.renderedPassage && state.passage !== $("panel").dataset.renderedPassage) localPersonOpen = null; // Search card Detail is bound to explicit click, not to stale passage-panel render
    var html;
    try {
      if (localPersonOpen && localPersonReader(localPersonOpen)) html = localPersonDetailHtml(localPersonReader(localPersonOpen));
      else if (ui.rmode === "PERSON" && !state.entity && !ui.rpPerson && !ui.placeBasic) {
        html = '<div class="place-basic-wrap">' + rsStatusHtml("research-status-person", rsPersonLabel(ui.rsPerson) + " 인물연구", "이 맥락에는 연결된 인물연구 자료가 없습니다") + "</div>";   // 모드 유지 + 상태 화면(silent fallback 없음)
      } else if (ui.placeBasic && !(state.entity && entityValid(state.entity))) {
        html = '<div class="place-basic-wrap">' + placeBasicDetailHtml(ui.placeBasic) + "</div>";   // Full Place Profile 가 없는 장소: 같은 색인으로 만든 기본 상세
      } else if (state.view === "explore") {
        html = state.entity && entityValid(state.entity) ? '<div class="sw-detail-body sw-detail-single" data-detail-mode="single-scroll">' + entityFlow() + '</div>' : '<p class="empty helper">결과를 선택하면 자세한 내용을 볼 수 있습니다.</p>';
      } else if (state.entity && entityValid(state.entity)) html = entityFlow() + contextualResearchHtml(state.passage, state.verse);
      else if (rsShellOn() && rsMode() === "PLACE") html = rsPlaceStatusHtml();   // PLACE 모드에서 지명이 없거나 연구 전이어도 본문연구로 대신하지 않는다
      else html = (verseResearchHtml() || (rsShellOn() ? rsTextStatusHtml() : "")) + overviewFlow();
    } catch (e) { html = '<div class="degraded" role="status">상세를 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
    // Dictionary reference is independent of the approved WORBS/profile projection.
    if (state.entity && entityValid(state.entity)) {
      var refSid = stableOf(state.entity.kind, state.entity.id);
      var refHtml = atlas90ReferenceHtml(refSid, null);
      if (refHtml) html += refHtml;
    } else if (ui.placeBasic && placeIndex().byKey[ui.placeBasic]) {
      var refPlace = placeIndex().byKey[ui.placeBasic];
      var refKey = refPlace.stableId && /^BAT01-PLACE-/.test(refPlace.stableId) ? refPlace.stableId : null;
      var placeReference = atlas90ReferenceHtml(refKey, refKey ? null : refPlace.en);
      if (placeReference) html += placeReference;
    }
    // Full canonical place profiles retain their approved layout and append reader references only.
    if(state.entity && entityValid(state.entity) && state.entity.kind==='l'){
      var nativeP=placeIndex().list.filter(function(x){return x.stableId===stableOf(state.entity.kind,state.entity.id);})[0];
      if(nativeP)html+=nativePlaceReferenceHtml(nativeP);
    }
    if (atlasExpansionSelection) html = atlasExpansionHtml(atlasExpansionSelection);
    if (atlasBcSelection) html = atlasBcReferenceHtml(atlasBcSelection);
    if (levelBSelection) { var currentB=LEVEL_B_87.filter(function(x){return x.candidate_id===levelBSelection;})[0];if(currentB)html=levelBDetail(currentB); }
    if (atlas90Selection) {
      var atlasCurrent = ATLAS90_REF.filter(function(a){return a.place_id===atlas90Selection;})[0];
      if (atlasCurrent) {
        var atlasSharedP = atlas90PlaceProjection(atlasCurrent);
        html = '<div data-part="atlas90-shared-detail" data-atlas-place-id="' + esc(atlas90Selection) + '"><button type="button" class="pill" data-atlas90-close="1">장소 상세 닫기</button>' +
          placeBasicDetailHtml(null, atlasSharedP).replace('</article>', (function(){var binding=(window.JBC_ATLAS90_READER_CROSSWALK||{})[atlasCurrent.place_id], key=binding&&binding.place_key, place=key&&placeIndex().byKey[key];return place ? '<section class="d-sec" data-part="atlas90-map-link"><h4 class="d-h">지도 · 장소 탐색</h4><button type="button" class="pill" data-map-focus-place="'+esc(key)+'">기존 장소 지도에서 보기</button><p class="meta" style="font-size:.72rem;opacity:.65">연구검토중 · 독자용 탐색 연결</p></section>' : '<p class="meta" data-part="atlas90-map-pending" style="font-size:.72rem;opacity:.65">지도 위치 연구검토중</p>';})() + atlas90ReferencePassages(atlasCurrent) + abReaderGeoSection(atlasCurrent.place_id) + '<section class="d-sec" data-part="reference-translation"><h4 class="d-h">지명 자료</h4><p class="d-body" style="white-space:pre-wrap">' + esc(atlasCurrent.ko || '') + '</p><details><summary>영문 원문과 출처</summary><p class="meta">' + esc(atlasCurrent.source || '') + '</p><p class="d-body" style="white-space:pre-wrap">' + esc(atlasCurrent.en || '') + '</p></details></section></article>') + '</div>';
      }
    }
    // Entity research replaces overviewFlow; keep the chapter memo editor accessible.
    if (state.view === "study" && html.indexOf('data-ov="notes"') < 0) {
      html += '<details class="ov study-memo-section" data-ov="notes"' + (ui.ovOpen.notes ? ' open' : '') +
        '><summary>내 메모</summary><div class="ov-body">' + PANELS.notes() + '</div></details>';
    }
    if (state.entity && state.entity.kind === "p" && entityValid(state.entity)) {
      var selectedPerson = D.people && D.people[state.entity.id];
      var personResearch = selectedPerson && localPersonReader(selectedPerson.name);
      if (personResearch && personResearch.name === "에녹" && !entityRefs("p", state.entity.id).some(function(ref){return /^gen-5$/.test(ref.pid);})) personResearch = null;
      if (personResearch && html.indexOf("</article>") >= 0) html = html.replace("</article>",localPersonResearchHtml(personResearch)+"</article>");
    }
    var panel = $("panel"), fixed = $("place-fixed-head");
    var previousPassage = panel.dataset.renderedPassage || "";
    var nextPassage = (state.passage && state.passage.ref) || (typeof state.passage === "string" ? state.passage : "") || "";
    panel.innerHTML = html; hydrateResearchSlots(panel);
    if (nextPassage && previousPassage && nextPassage !== previousPassage) panel.scrollTop = 0;
    panel.dataset.renderedPassage = nextPassage;
    rsRenderShell();
    // Detail-only redraws must update the shared chrome context as well.
    document.body.dataset.detailContext = detailContext().kind === 'ENTITY' ? 'entity' : 'passage';
    if (fixed) {
      var sidePane = $("side-pane"), paneTitle = sidePane && sidePane.querySelector(".pane-title"), paneBar = sidePane && sidePane.querySelector(".pane-bar"), panelToggle = $("panel-toggle");
      if (sidePane) sidePane.classList.remove("has-entity-fixed-head");
      if (paneBar) [].slice.call(paneBar.querySelectorAll(".entity-top-action-button,.research-return-button,.study-memo-open")).forEach(function (x) { x.remove(); });
      if (paneBar && panelToggle && state.view === "study") {
        var memoButton = document.createElement("button");
        memoButton.type = "button"; memoButton.className = "btn ghost study-memo-open";
        memoButton.textContent = "메모장"; memoButton.setAttribute("data-open-memo", "1");
        paneBar.insertBefore(memoButton, panelToggle);
      }
      if (paneTitle) { paneTitle.hidden = false; paneTitle.textContent = localPersonOpen ? "인물 · 연구" : ((atlas90Selection || levelBSelection) ? "장소" : (state.view === "study" && !state.entity ? (ui.rpPerson ? "인물" : "본문연구") : "상세")); paneTitle.removeAttribute("data-entity-topbar"); }
      fixed.innerHTML = "";
      fixed.hidden = true;
      var ph = panel.querySelector(".entity-sticky-head");
      if (!ph && (localPersonOpen || (state.entity && (state.entity.kind === "p" || state.entity.kind === "l" || state.entity.kind === "rgn" || state.entity.kind === "evt" || state.entity.kind === "rt")))) {
        var article = panel.querySelector("article.detail[data-detail=\"" + (localPersonOpen ? "p" : state.entity.kind) + "\"]");
        var back = panel.querySelector(localPersonOpen ? ".d-back[data-close-local-person-research]" : ".d-back[data-clear-entity]");
        var ident = article && article.querySelector(":scope > .d-identity");
        if (article && back && ident) {
          ph = document.createElement("div");
          ph.className = "entity-sticky-head";
          ph.appendChild(back);
          ph.appendChild(ident);
        }
      }
      if (ph) {
        var ident2 = ph.querySelector(".d-identity");
        var topKindText = "";
        if (ident2 && !ident2.querySelector(".entity-title-line")) {
          var title = ident2.querySelector(".detail-name"), en = ident2.querySelector(".d-en");
          if (title) {
            var titleLine = document.createElement("div"); titleLine.className = "entity-title-line";
            ident2.insertBefore(titleLine, ident2.firstChild); titleLine.appendChild(title); if (en) titleLine.appendChild(en);
          }
        }
        if (ident2 && !ident2.querySelector(".entity-meta-line")) {
          var original = ident2.querySelector(".d-original"), kindLine = ident2.querySelector(".d-kind");
          if (original || kindLine) {
            var metaLine = document.createElement("p"); metaLine.className = "entity-meta-line";
            if (original) metaLine.appendChild(original);
            if (kindLine) metaLine.appendChild(kindLine);
            ident2.appendChild(metaLine);
          }
        }
        var kindInHead = ident2 && ident2.querySelector(".d-kind");
        if (kindInHead) { topKindText = kindInHead.textContent.trim(); kindInHead.remove(); }
        if (ident2) [].slice.call(ident2.querySelectorAll(".entity-meta-sep,.place-meta-sep")).forEach(function (x) { x.remove(); });
        var metaNow = ident2 && ident2.querySelector(".entity-meta-line");
        if (metaNow && !metaNow.textContent.trim()) metaNow.remove();
        var oldBack = ph.querySelector(".d-back[data-clear-entity]"); if (oldBack) oldBack.remove();
        var activeArticle = panel.querySelector("article.detail"), activeSid = activeArticle && activeArticle.dataset.stableId, activeNode = activeSid && STORE.get(activeSid);
        var shortType = state.entity && state.entity.kind === "p" ? "인물" : (activeNode ? discoveryTypeLabel(activeNode) : "장소");
        if (!shortType || shortType === "Place") shortType = "장소";
        if (paneTitle) {
          var personDetail = !!(state.entity && state.entity.kind === "p");
          paneTitle.hidden = false;
          paneTitle.textContent = personDetail ? (topKindText || "인물") : shortType;
          paneTitle.setAttribute("data-entity-topbar", "1");
        }
        if (paneBar && panelToggle) {
          var topAction = document.createElement("button"); topAction.type = "button"; topAction.className = "btn ghost entity-top-action-button";
          if (personDetail) { topAction.textContent = "본문연구"; topAction.setAttribute("data-person-research-toggle", "1"); }
          else if (state.view === "explore") { topAction.textContent = "본문보기"; if (activeSid) topAction.setAttribute("data-deep-study", activeSid); else if (ui.placeBasic) topAction.setAttribute("data-deep-place", ui.placeBasic); }
          else topAction = null;   // 지명연구 ↔ 본문연구 전환은 공통 Research Panel Shell 의 segmented switch 가 맡는다
          if (topAction) paneBar.insertBefore(topAction, paneBar.querySelector(".study-memo-open") || panelToggle);
        }
        fixed.appendChild(ph);
        fixed.hidden = false;
        if (sidePane) sidePane.classList.add("has-entity-fixed-head");
      }
    }
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
    if (el.id && el.id !== "sw-query") return "#" + el.id;
    return null;
  }
  // ---------- 작업공간: 지도 창 · 분할선 · 안내 패널 ----------
  // 작은 범례(큰 설명 패널 아님): 전체 여정 · 현재 구간 · 추정 경로 · 주요 경유지. 사용자 설정(legend)에 따르고, 여정 보기에서만 나타난다.
  function journeyLegendHtml() {
    var fx = ui.navFx; if (!fx || !fx.waypoints || !fx.waypoints.length || !ui.mapDisplay.legend || !ui.mapDisplay.routes) return "";
    return '<div class="jn-legend" data-part="journey-legend" role="group" aria-label="지도 범례"><span class="jl-i"><i class="jl-line jl-all" aria-hidden="true"></i>전체 여정</span><span class="jl-i"><i class="jl-line jl-now" aria-hidden="true"></i>현재 구간</span><span class="jl-i"><i class="jl-line jl-inf" aria-hidden="true"></i>추정 경로</span><span class="jl-i"><i class="jl-dot" aria-hidden="true"></i>주요 정착지</span></div>';
  }
  function renderMapPane() {
    var body = $("map-body"); if (!body) return;
    var html, cap = "";
    try {
      var m = mapModel(), mk = geoMarkers(); cap = mk.length ? mk.length + "곳" : "";
      // 사용자 지도는 단일 Web Mercator 지리 지도만 렌더한다.
      // legacy fixture x/y 기반 sample map은 사용자 화면의 대체/폴백으로 사용하지 않는다.
      html = geoSvg() + journeyLegendHtml() + presentationRouteNoticeHtml() + '<p class="geo-attr geo-attr-min" data-part="map-attribution">' + MAP_ATTRIBUTION + "</p>" +
        (m.bad.length ? '<p class="degraded" data-places="' + esc(m.badIds.join(",")) + '">지도에 표시할 수 없는 장소(승인된 지리 좌표 없음): ' + esc(m.bad.join(", ")) + ". 장소 상세에서 텍스트로 확인할 수 있습니다.</p>" : "") +
        (!m.all.length ? '<p class="empty helper">이 본문에는 지도에 표시할 장소가 없습니다.</p>' : "") +
        contextualMapNoticeHtml(state.passage, state.verse);
    } catch (e) { html = '<div class="degraded" role="status">지도를 표시할 수 없습니다. 본문과 맥락 패널은 계속 사용할 수 있습니다.</div>'; }
    if (mlActive()) mlMount(html); else body.innerHTML = html; var c = $("mp-cap"); if (c) c.textContent = cap;
    try { updateMapHead(); } catch (e) {}
  }
  // ---------- 네비게이션(Navigation Lock): 현재 맥락 → 연결된 이야기 → 성경 전체 탐색 ----------
  var NAV_TOP = ["기초 지리", "자연환경", "구약 역사", "중간기", "신약"];   // 잠금된 상위 분류. 하위(시대 목록 등)는 후속 설계 확정 전이라 여기서 만들지 않는다.
  function refKey(r) { if (typeof r === "string") return r; return r && r.book ? r.book + "-" + r.chapter + ":" + (r.v1 || "") : null; }
  // 명시적 navigation 메타데이터만 후보가 된다. 시대·분류를 추정해 배정하지 않는다.
  // record.navigation은 단일 object와 approved multi-path array를 모두 허용한다. 같은 stable_id는 여러 경로에 재사용된다.
  function navigationPaths(n) { return !n ? [] : (Array.isArray(n) ? n : [n]).filter(function (x) { return x && x.domain; }); }
  function navigationCandidates() {
    var out = [], addRecord = function (sid, r, kind) {
      navigationPaths(r && r.navigation).forEach(function (n, i) {
        out.push({ domain: n.domain, period: n.period || null, story: n.story || null, scene: n.scene || null, refs: (n.passage_refs || []).map(refKey).filter(Boolean), source: sid, source_kind: kind, path_index: i });
      });
    };
    Object.keys((PJ && PJ.places) || {}).forEach(function (sid) { addRecord(sid, PJ.places[sid], "Place"); });
    Object.keys((PJ && PJ.regions) || {}).forEach(function (sid) { addRecord(sid, PJ.regions[sid], "Region"); });
    (G.topics || []).forEach(function (tp) { navigationPaths(tp.navigation).forEach(function (n, i) { out.push({ domain: n.domain, period: n.period || null, story: n.story || tp.title, scene: n.scene || null, refs: (n.passage_refs || tp.passage_refs || []).map(refKey).filter(Boolean), source: tp.id, source_kind: "GuideTopic", path_index: i }); }); });
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
      g.dataset.navState = mode; if (!(G.topics || []).length) g.dataset.guideState = "canonical-empty";
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
    html += contextualGuideHtml(state.passage, state.verse);
    g.innerHTML = html;
  }
  // ---------- 성경 세계 탐색 (Bible World Navigation) ----------
  // 구조: Wide Exploration Board(#topic-board) → Topic → Step. 데이터는 data/exploration.topics.js(표시 전용). Navigation 은 발견·순차 탐색만 맡고,
  // 본문 의미 연구는 Scripture Research, 공간 표현은 Map, 시간 위치는 Timeline, 직접 본문 이동은 상단 성경 검색기가 맡는다. 연구 권위·좌표·경로를 새로 만들지 않는다.
  var JNAV_SPACES = [
    ["ane","고대 근동",36.0,31.0,32],
    ["canaan","가나안",35.0,31.6,8.2],
    ["south-canaan","남부 가나안",34.8,31.2,5.6],
    ["north-canaan","북부 가나안",35.25,32.55,5.8],
    ["transjordan","요단 동편",36.0,31.7,7.0],
    ["egypt","애굽",30.8,29.5,11.0],
    ["mesopotamia","메소포타미아",44.0,33.0,17.0],
    ["asia-minor","소아시아",30.0,38.5,13.0],
    ["roman-world","로마 제국권",24.0,38.0,40.0]
  ];
  var EXPL = window.JBC_EXPLORATION || { categories: [] };
  ui.nav = { board: false, tab: null, topic: null, step: 0, base: null, researchOpen: false }; ui.navRouteIds = null; ui.navFx = null; ui.navApplying = false;
  function jnavCurrentArea() {
    var ids = placeIdsFor(state.passage), labels = [];
    ids.forEach(function(id){ var e=D.places[id], n=STORE.get(stableOf("l",id)), r=n&&n.region; if(r&&labels.indexOf(r)<0)labels.push(r); });
    if(labels.length) return labels.slice(0,2).join(" · ");
    var names=ids.map(function(id){return D.places[id]&&D.places[id].name;}).filter(Boolean);
    return names.length ? names.slice(0,2).join(" · ")+" 일대" : "현재 본문의 지도 범위";
  }
  function navParseRef(r) { var m = /^([a-z0-9]+-\d+):?(\d*)$/.exec(r || ""); return m && D.passages[m[1]] && (!m[2] || hasVerse(m[1], +m[2])) ? { pid: m[1], verse: m[2] ? +m[2] : null, spec: r } : null; }
  // 데이터의 id 는 "요청"일 뿐이다: 존재하고 독자에게 공개된 객체·승인된 표시 경로만 통과한다(비공개 연구 객체는 id 를 적어도 노출되지 않는다).
  function navResolveStep(raw, ov) {
    var canon = function (id) { var p = D.places && D.places[id]; return p && (!p.research || readerVisible(p.research.stable_id)); };
    var focus = (raw.focus || []).filter(canon), related = (raw.related || []).filter(canon);
    var refs = (raw.passage_refs || []).map(navParseRef).filter(Boolean), pid = refs[0] && refs[0].pid;
    return {
      id: raw.id, title: raw.title, description: raw.short_description || "", uncertainty: raw.uncertainty || null, preset: raw.map_preset || {}, refs: refs,
      places: (raw.place_ids || []).filter(canon).concat(focus, related).filter(function (id, i, a) { return a.indexOf(id) === i; }),
      track: raw.track || null, fixture_id: raw.fixture_id || null, focus: focus, related: related,
      waypoint: raw.waypoint || null, bends: (raw.bends || []).filter(function (b) { return b && GEO.valid(+b[0], +b[1]); }), leg_certainty: raw.leg_certainty || null, core: raw.core || "", wp: null, leg: null,
      sub_steps: (raw.sub_steps || []).filter(function (x) { return x && x.title; }), range: navParseRange(raw.range), related_refs: (raw.related_refs || []).map(navParseRange).filter(Boolean),
      display: navDisplayPlaces(raw.display_places, ov, raw.ov_routes), ov_routes: (raw.ov_routes || []).map(function (r) { return { label: r.label, via: (r.via || []).slice(), certainty: r.certainty || "low" }; }),
      regions: (raw.region_ids || []).filter(function (id) { return D.regions && D.regions[id] && readerVisible(id); }),
      routes: (raw.route_ids || []).filter(function (l) { var sp = PRESENTATION_ROUTE_SPECS[l]; return sp && (!pid || sp.passages.indexOf(pid) >= 0) && presentationRouteSource(l, sp); })
    };
  }
  // overlay 의 표시 전용 지명. canonical identity 가 아니다: stable id·클릭 연구 진입 없음. 참고 레이어에 anchor(현대 지명)가 있을 때만 지도에 흐린 표시를 둔다.
  // 개략 위치(PRESENTATION_APPROXIMATE): 서사 이해용 표시. canonical 좌표·identity 가 아니며 certainty 로 시각 강도를 낮춘다(숨기지 않는다).
  function navDisplayPlaces(keys, ov, routes) {
    var all = (keys || []).slice(); (routes || []).forEach(function (r) { (r.via || []).forEach(function (k) { if (all.indexOf(k) < 0 && ov && ov.places && ov.places[k]) all.push(k); }); });
    return all.map(function (k) {
      var d = ov && ov.places && ov.places[k]; if (!d) return null;
      var ok = d.lat != null && d.lon != null && GEO.valid(+d.lat, +d.lon);
      return { key: k, label: d.label, status: d.status, kind: d.kind || "point", certainty: d.certainty || "low", radius_km: d.radius_km || 0, note: d.note || "", lat: ok ? +d.lat : null, lon: ok ? +d.lon : null };
    }).filter(Boolean);
  }
  var NAV_CERT_LABEL = { high: "위치 비교적 확실", medium: "추정 위치", low: "불확실한 추정", region: "지역 단위(점 아님)" };
  var NAV_STATUS_LABEL = { CANONICAL_RESOLVED: "확정 identity", RESEARCH_ANCHORED_HOLD: "연구 보류(HOLD)", CONTENT_REQUIRED_IDENTITY_UNRESOLVED: "identity 미확정", DISPLAY_REFERENCE_ONLY: "표시 전용 · 설계 확정 전" };
  function navParseRange(spec) {   // "gen-20:1-18" · "gen-10:19" → {pid,v1,v2,spec}; 존재하지 않는 본문·절은 통과시키지 않는다
    var m = /^([a-z0-9]+-\d+):(\d+)(?:-(\d+))?$/.exec(spec || ""); if (!m || !D.passages[m[1]]) return null;
    var v1 = +m[2], v2 = m[3] ? +m[3] : v1; return hasVerse(m[1], v1) && hasVerse(m[1], v2) && v2 >= v1 ? { pid: m[1], v1: v1, v2: v2, spec: spec } : null;
  }
  function navRangeLabel(r) { var P = D.passages[r.pid]; return (P ? P.ref : r.pid) + " " + r.v1 + (r.v2 > r.v1 ? "–" + r.v2 : "") + "절"; }
  // 줄기(track)별 경유지 사슬: step.waypoint 순서가 번호(1…N)가 되고, 이전 경유지 → 이 경유지가 그 장면의 현재 구간이다. 거리는 굴곡점을 지나는 개략 경로 길이(직선 아님, 실제 이동 거리 아님).
  function navKeyPos(key, ov) { var d = ov && ov.places && ov.places[key]; if (d && d.lat != null && d.lon != null) return { lat: +d.lat, lon: +d.lon }; return navCanonPos(key); }
  function navKeyLabel(key, ov) { var d = ov && ov.places && ov.places[key]; return d ? d.label : (D.places[key] && D.places[key].name) || key; }
  function geoPointAt(pts, frac) {   // 지리 굴곡선을 따라 frac(0–1) 지점
    var tot = geoPathKm(pts), want = tot * frac, acc = 0;
    for (var i = 1; i < pts.length; i++) { var d = geoKm(pts[i - 1], pts[i]); if (acc + d >= want || i === pts.length - 1) { var u = d ? Math.min(1, Math.max(0, (want - acc) / d)) : 0; return { lat: pts[i - 1].lat + (pts[i].lat - pts[i - 1].lat) * u, lon: pts[i - 1].lon + (pts[i].lon - pts[i - 1].lon) * u }; } acc += d; }
    return pts[0];
  }
  function navBuildChain(ov, steps) {
    var by = {}; steps.forEach(function (s) { if (s.waypoint) (by[s.track] = by[s.track] || []).push(s); });
    Object.keys(by).forEach(function (tr) {
      var list = by[tr];
      list.forEach(function (s, i) {
        s.wp = { id: (s.track || "journey") + ":wp" + (i + 1), key: s.waypoint, n: i + 1, label: navKeyLabel(s.waypoint, ov), count: list.length }; s.leg = null; s.ov_routes = [];
        if (!i) return;
        var prev = list[i - 1], bend = s.bends.map(function (b) { return { lat: +b[0], lon: +b[1] }; }), pts = [navKeyPos(prev.waypoint, ov)].concat(bend, [navKeyPos(s.waypoint, ov)]);
        var okp = pts.every(Boolean), km = okp ? geoPathKm(pts) : 0;
        var segId = (s.track || "journey") + ":seg" + prev.wp.n + "-" + s.wp.n;
        s.leg = { id: segId, routeSegmentId: segId, fromWaypointId: prev.wp.id, toWaypointId: s.wp.id, fromPlaceKey: prev.waypoint, toPlaceKey: s.waypoint, fromNo: prev.wp.n, toNo: s.wp.n, fromLabel: prev.wp.label, toLabel: s.wp.label, distanceKm: km, labelAnchor: okp ? geoPointAt(pts, 0.5) : null, certainty: s.leg_certainty || "low" };
        s.leg.from_label = s.leg.fromLabel; s.leg.to_label = s.leg.toLabel; s.leg.km = km;
        s.ov_routes = [{ label: prev.wp.label + " → " + s.wp.label, via: [prev.waypoint].concat(bend, [s.waypoint]), certainty: s.leg.certainty, segment: s.leg }];
      });
    });
  }
  var NAV_BOOK_ABBR = { gen: "창", exo: "출", lev: "레", num: "민", deu: "신", jos: "수", jdg: "삿", rut: "룻", "1sa": "삼상", "2sa": "삼하", "1ki": "왕상", "2ki": "왕하", "1ch": "대상", "2ch": "대하", ezr: "스", neh: "느", est: "에", job: "욥", psa: "시", pro: "잠", ecc: "전", sng: "아", isa: "사", jer: "렘", lam: "애", ezk: "겔", dan: "단", hos: "호", jol: "욜", amo: "암", oba: "옵", jon: "욘", mic: "미", nam: "나", hab: "합", zep: "습", hag: "학", zec: "슥", mal: "말", mat: "마", mrk: "막", luk: "눅", jhn: "요", act: "행", rom: "롬", "1co": "고전", "2co": "고후", gal: "갈", eph: "엡", php: "빌", col: "골", "1th": "살전", "2th": "살후", "1ti": "딤전", "2ti": "딤후", tit: "딛", phm: "몬", heb: "히", jas: "약", "1pe": "벧전", "2pe": "벧후", "1jn": "요일", "2jn": "요이", "3jn": "요삼", jud: "유", rev: "계" };
  function navShortRange(r) { var p = r.pid.split("-"); return (NAV_BOOK_ABBR[p[0]] || (D.passages[r.pid] && D.passages[r.pid].ref) || r.pid) + " " + p[1] + ":" + r.v1 + (r.v2 > r.v1 ? "–" + r.v2 : ""); }
  function navCategories() {
    return (EXPL.categories || []).map(function (c) {
      var topics = (c.topics || []).map(function (t) {
        var steps = (t.steps || []).map(function (x) { return navResolveStep(x, t.overlay || t.journey || null); }), planned = t.status === "planned" || t.status === "designing";
        var journey = steps.some(function (x) { return !!x.waypoint; });   // 여정 보기는 데이터가 경유지(waypoint)를 가졌는지로만 정한다: 시대·인물·주제에 묶이지 않는 공통 규약
        if (journey) navBuildChain(t.overlay || t.journey || null, steps);
        if (!steps.length && !planned) return null;
        return {
          id: t.id, category: c.id, title: t.title, summary: t.summary || "",
          refs: (t.passage_refs || []).map(navParseRef).filter(Boolean), steps: steps,
          mode: t.mode || "", status: t.status || "ready", badge: t.badge || "", overlay: t.overlay || t.journey || null, journey: journey, summary_text: t.summary || "", range_label: t.range_label || "",
          disabled: !steps.length
        };
      }).filter(Boolean);
      return topics.length ? { id: c.id, title: c.title, description: c.description || "", topics: topics } : null;
    }).filter(Boolean);
  }
  function navTopicById(id) { var cs = navCategories(); for (var i = 0; i < cs.length; i++) for (var j = 0; j < cs[i].topics.length; j++) if (cs[i].topics[j].id === id) return cs[i].topics[j]; return null; }
  function navAnchors(s) { return (s.display || []).filter(function (d) { return d.lat != null && d.lon != null; }); }
  // 경로 구간 전체가 보이도록(출발·도착·굴곡점) 화면 비율에 맞춰 맞춘다. 한 점에 과하게 확대하지 않도록 최소 가시 폭(약 2.6°)을 둔다.
  function navFitPoints(pts) {
    var P = pts.filter(Boolean).map(function (a) { return GEO.project(a.lat, a.lon); }); if (!P.length) return null;
    var xs = P.map(function (p) { return p.x; }), ys = P.map(function (p) { return p.y; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var b = document.getElementById("map-body"), cw = b ? b.clientWidth : 0, ch = b ? b.clientHeight : 0, m = Math.max(cw, ch), ar = cw > 0 && ch > 0 ? ch / cw : 1;
    var vx = Math.max((x1 - x0) * 1.6, 4), vy = Math.max((y1 - y0) * 1.6, 4 * ar), w = m > 0 ? Math.max(vx * m / cw, vy * m / ch) : Math.max(vx, vy);
    return clampGeoCam({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: w });
  }
  function navCamera(s) {
    if (s.wp && ui.navFx) {   // 여정 장면: 현재 구간(이전 경유지 → 이 경유지, 굴곡점 포함)을 통째로. 첫 장면은 다음 경유지까지 함께 보여 진행 방향을 알린다.
      var mkc = geoMarkers(), r = s.ov_routes[0], seq = r ? r.via.map(function (k) { return navViaPos(k, mkc); }) : [navWaypoint(s.wp.key, mkc)], nx = (ui.navFx.waypoints || []).filter(function (x) { return x.n === s.wp.n + 1; })[0];
      if (!r && nx) { var nl = (ui.navFx.context || []).filter(function (c) { return c.via && c.via[0] === s.wp.key; })[0]; seq = nl ? nl.via.map(function (k) { return navViaPos(k, mkc); }) : seq.concat([navWaypoint(nx.key, mkc)]); }
      var fit = navFitPoints(seq); if (fit) return fit;
    }
    var pr = s.preset || {}, pts = [];
    if (pr.fit === "places" || pr.fit === "auto") { geoMarkers().forEach(function (m) { if (s.places.indexOf(m.place) >= 0) pts.push(m); }); navAnchors(s).forEach(function (a) { pts.push(a); }); }
    if (pr.fit === "routes" || pr.fit === "auto") presentationRouteStates().forEach(function (r) { if (r.drawable) r.resolved.forEach(function (a) { pts.push(a); }); });
    // 위치가 확정되지 않은 지명이 함께 있는 장면에서 점 하나에 화면을 맞추면 그 점이 장면의 중심처럼 읽힌다 → 점이 둘 이상이거나 미확정 지명이 없을 때만 점에 맞춘다.
    if (pts.length >= 2 || (pts.length === 1 && !(s.display || []).length)) return geoFit(pts);
    var sp = JNAV_SPACES.filter(function (x) { return x[0] === pr.space; })[0];
    return sp ? clampGeoCam({ x: sp[2], y: GEO.yOf(sp[3]), w: sp[4] }) : null;
  }
  function navApplyStep(i) { 
    var tp = navTopicById(ui.nav.topic), s = tp && tp.steps[i]; if (!s) return false;
    var nv = ui.nav;
    var wasPanel = state.panel, wasJourney = !!ui.journeyOn;   // 레이아웃이 바뀌는지 비교용
    var persEnt = state.entity && state.entity.kind === "p" ? state.entity : null; if (persEnt) { ui.rsPerson = persEnt.id; ui.rsPersonLabel = rsPersonLabel(persEnt.id); }
    var mode0 = persEnt || ui.rmode === "PERSON" ? "PERSON" : (ui.rmode || (state.entity && state.entity.kind === "l" ? "PLACE" : null)), keepRs = !!mode0 && state.panel === "open" && state.view === "study" && !ui.rpPerson;   // JOURNEY_STEP_CLICK / PREV_NEXT: 열려 있는 연구 패널은 모드를 유지한 채 내용만 갱신
    nv.researchOpen = keepRs;   // 연구 패널이 열려 있지 않으면 장면 이동은 지도를 넓게 둔다(아래에서 panel 접힘). 열려 있으면 그대로 두고 내용만 바꾼다.
    nv.step = i; nv.board = false; ui.navRouteIds = s.routes.slice(); nv.track = s.track; journeyLayout(!!tp.journey);
    ui.navFx = (tp.overlay || tp.journey) ? { focus: s.focus, related: s.related, anchors: navAnchors(s), routes: s.ov_routes, catalog: (tp.overlay && tp.overlay.places) || {},
      waypoints: tp.steps.filter(function (x) { return x.track === s.track && x.wp; }).map(function (x) { return x.wp; }), active: s.wp ? s.wp.n : 0,
      context: tp.steps.filter(function (x, j) { return j !== i && x.track === s.track; }).reduce(function (a, x) { return a.concat(x.ov_routes); }, []) } : null;
    var camFrom = document.querySelector("#map-body svg.gmap") ? geoCam() : null;   // go() 가 카메라를 비우기 전의 현재 시점(비행 출발점)
    ui.navApplying = true;
    if (nv.researchOpen) { state.entity = null; state.tab = "context"; ensureContextVisible(); }
    else if (!isMobile()) state.panel = "collapsed";   // 평상시에는 지도 전환을 우선하고, 본문연구가 열린 경우에는 패널 상태를 유지한다
    try {
      if (s.refs[0]) go(s.refs[0].pid, s.refs[0].verse, false, false); else { if (state.entity) closeEntity(); state.view = "study"; ui.layers = { route: true, place: true }; }
      // s.preset.layers 는 더 이상 적용하지 않는다: 장면은 카메라·활성 장소·경로만 바꾸고 사용자 지도 설정(ui.mapDisplay)은 건드리지 않는다.
      if (s.wp) document.body.style.setProperty("--jn-scene-label", '"장면 ' + s.wp.n + '"'); else document.body.style.removeProperty("--jn-scene-label");
      if (s.range && s.range.pid === state.passage) ui.refTarget = { passage: s.range.pid, verse: s.range.v1, verse_end: s.range.v2 };   // 중심 본문 범위 전체를 강조
      // 네비게이션은 연구 대상을 자동 선택하지 않는다. 장소는 지도 범위·표시에만 사용하고,
      // 지명/인물 연구는 본문이나 지도에서 사용자가 명시적으로 선택했을 때만 연다.
      if (nv.researchOpen) { state.entity = null; state.tab = "context"; ensureContextVisible(); }
      ui.rsStep = true; ui.rsPlace = rsStepPlaceKey(s); if (mode0) { rsPrepare(mode0); if (keepRs) ensureContextVisible(); } else ui.rmode = null;   // 장면 = 지명 + 본문의 공통 맥락. 모드는 장면 이동만으로 바뀌지 않는다
      var camTo = navCamera(s) || null;
      ui.gcam = camTo && camFrom ? camFrom : camTo;   // 이동 장면은 현재 시점에서 출발해 부드럽게 간다
      if (isMobile()) ui.mapOpen = true;
      render();
      if (camTo && camFrom) geoFly(function () { return navCamera(s) || camTo; }, (state.panel !== wasPanel || !!ui.journeyOn !== wasJourney) ? 460 : 0);   // 패널·레이아웃이 바뀌면 그것이 안정된 뒤(460ms) 카메라를 움직이고, 최종 프레이밍은 그때의 지도 크기로 계산
    } finally { ui.navApplying = false; }
    syncMapSettings(); return true;
  }
  function navOpenTopic(id) { if (!navTopicById(id)) return false; ui.nav.topic = id; ui.nav.base = null; ui.nav.researchOpen = false; var ok = navApplyStep(0); if (ok && isMobile()) setTimeout(function () { var g = $("guide-pane"); if (g) try { g.scrollIntoView({ block: "start", behavior: "auto" }); } catch (e) { g.scrollIntoView(); } }, 0); return ok; }
  function navEnd(quiet) {
    var nv = ui.nav;   // 지도 설정은 장면과 무관하므로 되돌릴 것이 없다
    nv.topic = null; nv.step = 0; nv.base = null; nv.researchOpen = false; ui.navRouteIds = null; ui.navFx = null; journeyLayout(false);
    if (!quiet) { syncMapSettings(); render(); }
  }
  // 줄기(track)가 있는 주제는 이전/다음이 같은 줄기 안에서만 움직인다.
  function navTrackIdx(tp, track) { var o = []; tp.steps.forEach(function (x, i) { if (!track || x.track === track) o.push(i); }); return o; }
  function navStepBy(d) {
    var tp = navTopicById(ui.nav.topic); if (!tp) return false;
    var cur = tp.steps[ui.nav.step], idx = navTrackIdx(tp, cur && cur.track), at = idx.indexOf(ui.nav.step), n = idx[at + d];
    return n != null ? navApplyStep(n) : false;
  }
  function navSetTrack(id) { var tp = navTopicById(ui.nav.topic), idx = tp ? navTrackIdx(tp, id) : []; return idx.length ? navApplyStep(idx[0]) : false; }
  // Step 의 본문으로 맞춘다(연결 객체·카메라·레이어는 유지: keepContext). 본문이 이미 같으면 이동하지 않는다.
  function navEnsurePassage(ref) {
    var r = ref ? navParseRef(ref) : (function () { var tp = navTopicById(ui.nav.topic), s = tp && tp.steps[ui.nav.step]; return s && s.refs[0]; })(); if (!r) return false;
    ui.navApplying = true;
    try { if (state.passage !== r.pid || state.view !== "study") go(r.pid, r.verse, true, true); else if (r.verse != null) viewVerse(r.verse); } finally { ui.navApplying = false; }
    return true;
  }
  // 본문연구 패널이 열리고 닫혀도 본문 칼럼 폭은 그대로 두고 지도가 폭을 주고받는다(여정 보기: 닫으면 넓은 지도로 정확히 복원).
  function journeyKeepText(tw, rw) {
    var st = $("stage"); if (!st || !(tw > 0)) return; var W = st.getBoundingClientRect().width - 10 - rw;
    if (W > 0) { ui.frac = Math.min(0.85, Math.max(0.2, 1 - tw / W)); applySplit(); }
  }
  function navToggleResearch() {
    var tp0 = $("text-pane"), tw = tp0 ? tp0.getBoundingClientRect().width : 0, was = state.panel === "open" && ui.nav.researchOpen, rwv = ui.journeyOn ? 340 : 390, ok = navToggleResearchRaw();
    if (ui.journeyOn && !isMobile()) journeyKeepText(tw, was ? 0 : rwv);
    return ok;
  }
  function navToggleResearchRaw() {   // 열려 있으면 닫고(지도 복원), 닫혀 있으면 현재 장면의 본문연구를 연다. 장면·카메라·본문 맥락은 유지.
    if (ui.nav.researchOpen && state.panel === "open") { ui.nav.researchOpen = false; if (isMobile()) { state.sheet = "peek"; replaceNext = true; render(); return true; } return setPanel("collapsed"); }
    return navOpenResearch();
  }
  function rsCurNavStep() { var tp = navTopicById(ui.nav.topic); return tp && tp.steps[ui.nav.step] || null; }
  function navOpenResearch() {
    ui.nav.researchOpen = true;
    navEnsurePassage(); state.view = "study"; ui.rsStep = true; ui.rsPlace = rsStepPlaceKey(rsCurNavStep()); rsPrepare("TEXT");   // 장면 카드의 "본문연구" 버튼은 명시적으로 TEXT 로 연다
    ensureContextVisible(); render(); panelScrollTop(); return true;
  }
  function navOpenTimeline() { navEnsurePassage(); return setView("timeline"); }
  function navBoardOpen(on) {
    var nv = ui.nav; nv.board = !!on;
    if (on) { var cur = nv.topic ? navTopicById(nv.topic) : null; nv.tab = cur ? cur.category : (nv.tab || (navCategories()[0] || {}).id); }
    renderBoard(); if (on) { var b = $("topic-board"), f = b && b.querySelector("[aria-selected=true]"); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
  }
  function renderBoard() {
    var b = $("topic-board"); if (!b) return;
    var nv = ui.nav; b.hidden = !nv.board; if (!nv.board) { b.innerHTML = ""; return; }
    var cs = navCategories(), tab = cs.filter(function (c) { return c.id === nv.tab; })[0] || cs[0];
    b.innerHTML = '<div class="tb-shell"><header class="tb-head"><h2 class="tb-title">성경세계 탐색</h2><p class="tb-lead">시대·여정·주제를 고르면 같은 지도 위에서 관련 본문·장면·연표로 이어집니다.</p><button type="button" class="tb-close" data-nav-board-close aria-label="성경세계 탐색 닫기" title="닫기 (Esc)">×</button></header>' +
      '<div class="tb-tabs" role="tablist" aria-label="탐색 분류">' + cs.map(function (c) { return '<button type="button" role="tab" data-nav-tab="' + esc(c.id) + '" aria-selected="' + (!!tab && c.id === tab.id) + '">' + esc(c.title) + "</button>"; }).join("") + "</div>" +
      (tab && tab.description ? '<p class="tb-tab-lead">' + esc(tab.description) + '</p>' : '') +
      '<div class="tb-grid" role="tabpanel" data-nav-category="' + esc(tab ? tab.id : "") + '">' + (tab && tab.topics.length ? tab.topics.map(function (t) {
        var meta = t.disabled ? (t.status === "designing" ? "첫 제작 준비" : "준비 중") : (t.steps.length > 1 ? t.steps.length + "장면" : "바로 보기");
        if (t.refs.length) meta += " · " + t.refs.map(function (r) { return refLabel(r.spec); }).join(", ");
        return '<button type="button" class="tb-card' + (t.disabled ? " is-planned" : "") + '"' +
          (t.disabled ? ' disabled aria-disabled="true"' : ' data-nav-topic="' + esc(t.id) + '"') +
          (nv.topic === t.id ? ' aria-current="true"' : "") + '>' +
          '<span class="tb-card-top">' + (t.badge ? '<span class="tb-badge">' + esc(t.badge) + '</span>' : '') + '</span>' +
          '<strong>' + esc(t.title) + '</strong>' +
          (t.summary ? '<span class="tb-summary">' + esc(t.summary) + '</span>' : '') +
          '<small>' + esc(meta) + '</small></button>';
      }).join("") : '<p class="tb-empty">아직 공개할 수 있는 탐색 프리셋이 없습니다.</p>') + "</div></div>";
  }
  // overlay 주제의 Navigation Panel: 줄기 → 현재 위치 → 본문 → 지도 → 연표. 표시 전용(Registry·연구 권위 변경 없음).
  function navOverlayHtml(tp, s) {
    var ov = tp.overlay; if (!ov || !s || (ov.tracks || []).length < 2) return "";   // 줄기(인물) 탭은 줄기가 둘 이상일 때만
    var tr = (ov.tracks || []).filter(function (t) { return t.id === s.track; })[0] || { title: "", timeline: "" };
    var rng = function (r, cls) { return '<button type="button" class="jnav-ref ' + cls + '" data-nav-range="' + esc(r.spec) + '">' + esc(navRangeLabel(r)) + "</button>"; };
    var ent = function (id, role) { return '<button type="button" class="g-obj jnav-ent" data-obj="l.' + esc(id) + '" data-stable-id="' + esc(stableOf("l", id)) + '" data-nav-role="' + role + '">' + esc(D.places[id].name) + "</button>"; };
    var tabs = '<div class="jnav-tracks" role="tablist" aria-label="이야기 줄기">' + (ov.tracks || []).map(function (t) { var on = t.id === s.track; return '<button type="button" role="tab" class="jnav-track' + (on ? " is-current" : "") + '" data-nav-track="' + esc(t.id) + '" aria-selected="' + on + '">' + esc(t.title) + "</button>"; }).join("") + "</div>";
    return tabs;
  }
  // 장면의 위치 흐름 한 줄: 개략 경로가 있으면 경유 순서(하란 → 세겜 → 벧엘), 없으면 장면의 장소를 ·로 나열한다. identity/certainty 는 노출하지 않는다.
  function navSceneFlow(x) {
    var name = {}; (x.display || []).forEach(function (d) { name[d.key] = d.label; });
    var label = function (k) { return name[k] || (D.places[k] && D.places[k].name) || ""; }, seq = [];
    (x.ov_routes || []).forEach(function (r) { (r.via || []).forEach(function (k) { if (label(k) && seq[seq.length - 1] !== k) seq.push(k); }); });
    if (seq.length > 1) return seq.map(label).join(" → ");
    var all = (x.focus || []).concat(x.related || [], (x.display || []).map(function (d) { return d.key; }));
    return all.filter(function (k, i, a) { return a.indexOf(k) === i && label(k); }).map(label).join(" · ");
  }
  // 여정 내비게이션(오른쪽 패널): 어느 여정인가 → 어느 장면인가 → 어디로 움직이는가. 연구 문장·상태 용어는 두지 않는다(연구는 왼쪽 본문연구 패널).
  function navShortRef(r) { var p = r.pid.split("-"); return (NAV_BOOK_ABBR[p[0]] || (D.passages[r.pid] && D.passages[r.pid].ref) || r.pid) + " " + p[1] + (r.verse ? ":" + r.verse : ""); }
  function navTopicRangeLabel(tp) {   // 데이터에 범위 표기가 없을 때 단계 본문에서 읽어 낸다(없는 정보를 만들지 않는다)
    var pids = []; tp.steps.forEach(function (x) { (x.range ? [x.range.pid] : x.refs.map(function (r) { return r.pid; })).forEach(function (p) { if (pids.indexOf(p) < 0) pids.push(p); }); });
    if (!pids.length) return ""; var f = D.passages[pids[0]], l = D.passages[pids[pids.length - 1]]; if (!f) return "";
    var book = function (r) { return r.replace(/\s*\d+장.*$/, ""); }, chap = function (r) { return r.replace(/^.*?(\d+)장.*$/, "$1"); };
    return pids.length === 1 || !l ? f.ref : (book(f.ref) === book(l.ref) ? book(f.ref) + " " + chap(f.ref) + "–" + chap(l.ref) + "장" : f.ref + " ~ " + l.ref);
  }
  function navJourneyHtml(tp, s, cur, vis) {
    var resOn = !!ui.nav.researchOpen && state.panel === "open", ov = tp.overlay || {}, tr = (ov.tracks || []).filter(function (t) { return t.id === s.track; })[0] || { journey_title: tp.title, range_label: tp.range_label || navTopicRangeLabel(tp), summary: tp.summary }, N = vis.length, pos = vis.indexOf(cur), kmTxt = function (km) { return km >= 50 ? " · 약 " + navRoundKm(km).toLocaleString("en-US") + "km" : ""; };
    var rail = vis.map(function (i, k) {
      var x = tp.steps[i], on = i === cur, ref = x.range ? navShortRange(x.range) : (x.refs[0] ? navShortRef(x.refs[0]) : ""), wid = x.wp ? ' data-waypoint-id="' + esc(x.wp.id) + '"' : "";
      var node = '<span class="jn-node" aria-hidden="true"><span class="jn-n">' + (k + 1) + "</span></span>";
      if (!on) return '<li class="jn-step" data-wp="' + (k + 1) + '"' + wid + '>' + node + '<button type="button" class="jn-step-btn" data-nav-step="' + i + '" aria-expanded="false"><span class="jn-st">' + esc(x.title) + '</span><span class="jn-sr">' + esc(ref) + "</span></button></li>";
      var core = x.core || String(x.description || "").replace(/\s*\([^()]*\d+:\d+[^()]*\)/g, "").trim(), meta = (x.leg ? '<dt>경로</dt><dd data-part="route-line">' + esc(x.leg.from_label) + " → " + esc(x.leg.to_label) + kmTxt(x.leg.km) + "</dd>" : "") + (x.wp || !x.uncertainty ? "" : '<dt>위치</dt><dd data-part="uncertainty">추정 · 확정되지 않음</dd>') + (core ? '<dt>핵심</dt><dd data-part="core">' + esc(core) + "</dd>" : "");
      return '<li class="jn-step is-current" data-wp="' + (k + 1) + '"' + wid + '>' + node + '<div class="jn-card" data-part="current-step"><div class="jn-cardhead"><button type="button" class="jn-step-btn" data-nav-step="' + i + '" aria-current="step" aria-expanded="true"><span class="jn-st">' + esc(x.title) + '</span><span class="jn-sr">' + esc(ref) + "</span></button>" +
        (x.refs.length ? '<button type="button" class="jn-rs' + (resOn ? " is-open" : "") + '" data-nav-act="research" aria-pressed="' + resOn + '" aria-label="본문연구 패널 ' + (resOn ? "닫기" : "열기") + '" title="' + (resOn ? "본문연구 패널 닫기" : "이 장면의 본문연구 열기") + '">본문연구<span class="jn-rs-ch" aria-hidden="true">›</span></button>' : "") + "</div>" +
        (meta ? '<dl class="jn-meta">' + meta + "</dl>" : "") + "</div></li>";
    }).join("");
    return '<div class="g-body jnav-body jn-body" data-part="journey-navigator"><header class="jn-head"><div class="jn-top"><div class="jn-erag"><span class="jn-era jnav-kicker">' + esc(ov.era_label || ov.era_title || tp.badge || "") + '</span>' + (tp.steps.some(function (x) { return x.refs.length; }) ? '<button type="button" class="jn-tl" data-nav-act="timeline" title="연표에서 이 장면의 시간적 위치 보기">연표보기</button>' : "") + '</div><button type="button" class="jnav-end jn-end" data-nav-end aria-label="여정 닫고 처음 상태로" title="여정 닫기">×</button></div>' +
      '<h2 class="g-title jn-title">' + esc(tr.journey_title || tr.title || "") + '</h2><p class="jn-range">' + esc(tr.range_label || "") + '</p><p class="jn-sum">' + esc(tr.summary || "") + "</p></header>" +
      navOverlayHtml(tp, s) + '<ol class="jn-rail" aria-label="여정 장면">' + rail + "</ol>" +
      '<div class="g-nav jnav-pager jn-pager" data-part="navigation"><button type="button" class="btn" id="guide-prev" data-nav-by="-1"' + (pos === 0 ? " disabled" : "") + '>‹ 이전</button><span class="g-ind">' + (pos + 1) + " / " + N + '</span><button type="button" class="btn primary" id="guide-next" data-nav-by="1"' + (pos === N - 1 ? " disabled" : "") + ">다음 ›</button></div>" +
      '<button type="button" class="jnav-open jnav-open-sub jn-other" data-nav-board-open>다른 주제 탐색하기 <span aria-hidden="true">›</span></button></div>';
  }
  function renderGuideSimple() {
    var g = $("guide-pane"); if (!g) return;
    delete g.dataset.guideState; delete g.dataset.routeSource; delete g.dataset.guideSource; delete g.dataset.guideAuthority;
    var nv = ui.nav, tp = nv.topic ? navTopicById(nv.topic) : null, html;
    if (nv.topic && !tp) navEnd(true);
    if (!tp) {
      g.dataset.navState = "idle"; delete g.dataset.activeTopic;
      var P = D.passages[state.passage], current = P ? P.ref : state.passage;
      html = '<div class="g-body jnav-body"><header class="jnav-head"><h2 class="g-title">성경 세계 탐색</h2><p>주제를 골라 지도와 본문을 함께 따라가 보세요.</p></header>' +
        '<section class="jnav-current"><span>현재</span><strong>' + esc(current) + "</strong><small>" + esc(jnavCurrentArea()) + "</small></section>" +
        '<button type="button" class="jnav-open" data-nav-board-open>주제 탐색하기 <span aria-hidden="true">›</span></button>' +
        '<button type="button" class="jnav-timeline" data-jnav-timeline>현재 본문의 시간적 위치 보기 <span>연표 →</span></button></div>';
    } else {
      g.dataset.navState = "topic-active"; g.dataset.activeTopic = tp.id;
      var cur = Math.min(nv.step, tp.steps.length - 1), s = tp.steps[cur], vis = navTrackIdx(tp, s.track), N = vis.length, pos = vis.indexOf(cur), key = tp.refs.length ? tp.refs : s.refs;
      html = navJourneyHtml(tp, s, cur, vis);   // 모든 여정·주제는 하나의 canonical 내비게이션(헤더·세로 타임라인·활성 카드·이전/다음·다른 주제)
    }
    // Keep the approved research-to-Scripture projection when the simplified
    // navigator replaces the legacy guide renderer.
    html += contextualGuideHtml(state.passage, state.verse);
    g.innerHTML = html;
    if (tp) { var cs = g.querySelector(".jn-step.is-current"); if (cs && cs.scrollIntoView) try { cs.scrollIntoView({ block: "nearest" }); } catch (e) {} }   // 선택된 장면이 항상 보이게
    renderBoard();
  }
  renderGuide = renderGuideSimple;
  // ---------- 관점(본문연구 · 지도 · 연표) ----------
  var VIEWS = ["study", "timeline", "explore"];   // 검색은 독립 Explore 관점. 지도는 본문연구 Workspace 안에서 동작한다.
  function setView(v) { if (v === "map") v = "study"; if (VIEWS.indexOf(v) < 0) return false; if (state.view === "explore" && v !== "explore") rememberExploreScroll(); if (ui.nav && ui.nav.board) navBoardOpen(false); state.view = v; replaceNext = true; render(); if (v === "explore") restoreExploreScroll(); return true; }
  // 연결된 구절 열기: 같은 본문이면 이동, 다른 본문이면 본문을 바꾸되 선택 대상은 유지(history 에 되돌릴 수 있는 새 entry).
  function openScripture(pid, n) { n = n || null; if (pid === state.passage) return n ? viewVerse(n) : undefined; return go(pid, n, true); }
  function viewVerse(n) { if (state.view !== "study") { state.view = "study"; replaceNext = true; render(); } scrollVerse(n, "center"); }
  function updateViewChrome() {
    var b = document.body, v = state.view; b.dataset.view = v;
    [].forEach.call(document.querySelectorAll("#rail [data-perspective]"), function (el) { if (el.dataset.perspective === v) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current"); });
    swState.open = v === "explore";
    var sw = $("search-workspace"); if (sw) {
      sw.hidden = !swState.open;
      if (swState.open && !sw.dataset.ready) { $("sw-query").value = swState.q; renderSearch(); sw.dataset.ready = "1"; }
    }
    var tp = $("text-pane"); if (tp) { try { tp.inert = v !== "study"; } catch (e) {} tp.setAttribute("aria-hidden", v !== "study" ? "true" : "false"); }
    var tl = $("timeline-pane"); if (tl) tl.hidden = v !== "timeline";
    var qb = $("quick-search"); if (qb) qb.hidden = v === "explore";
    if (v === "timeline") renderTimeline();
  }
  function timelineBindingMatches(b) {
    return (b.passage_refs || []).some(function(p){ if(p.book+"-"+p.chapter!==state.passage)return false; if(state.verse==null)return true; return state.verse>=p.v1&&state.verse<=(p.v2||p.v1); });
  }
  function timelineEventRows() {
    var rows=[];Object.keys((PJ&&PJ.events)||{}).forEach(function(sid){var r=PJ.events[sid],hit=(r.passage_refs||[]).some(function(p){if(p.book+"-"+p.chapter!==state.passage)return false;if(state.verse==null)return true;return state.verse>=p.v1&&state.verse<=(p.v2||p.v1);});if(hit)rows.push({sid:sid,r:r});});return rows;
  }

  function timelineEraTopics(){var c=(EXPL.categories||[]).filter(function(x){return x.id==="era";})[0];return c&&c.topics||[];}
  function timelineEraById(id){return timelineEraTopics().filter(function(x){return x.id===id;})[0]||null;}
  function timelineStepPlace(tp,s){var k=s&&(s.waypoint||(s.display_places||[])[0]||(s.place_ids||[])[0]);return k?placeIndex().byKey[k]||null:null;}
  function timelineStepMedia(tp,s){var p=timelineStepPlace(tp,s),m=p&&p.media;if(m&&mediaGate(m)==="image")return m;var k=s&&s.waypoint,d=tp&&tp.overlay&&tp.overlay.places&&tp.overlay.places[k];return d&&d.media&&mediaGate(d.media)==="image"?d.media:null;}
  function timelineStepRef(s){var r=navParseRange(s&&s.range),P=r&&D.passages[r.pid];if(r&&P)return P.ref.replace(/\s*\d+장.*$/,"")+" "+r.pid.split("-")[1]+":"+r.v1+(r.v2!==r.v1?"–"+r.v2:"");var x=s&&s.passage_refs&&navParseRef(s.passage_refs[0]);return x&&D.passages[x.pid]?D.passages[x.pid].ref+(x.verse?" "+x.verse+"절":""):"";}
  function timelineAutoEra(eras){var h=null;eras.some(function(tp){return (tp.steps||[]).some(function(s){return (s.passage_refs||[]).some(function(r){var x=navParseRef(r);return x&&x.pid===state.passage;});})?(h=tp,true):false;});return h||(eras.filter(function(x){return x.id==="era.patriarchal";})[0]||eras[0]);}
  function timelineResearchHtml(){
    var bindings=(CTX.timeline_bindings||[]).filter(timelineBindingMatches),events=timelineEventRows(),h="";
    if(events.length)h+='<details class="tl-research"><summary>현재 본문에 연결된 연구 '+events.length+'건</summary><ol class="tl-list">'+events.map(function(x){var r=x.r;return '<li><button type="button" class="pill" data-related-entity="'+esc(x.sid)+'">'+esc(String(r.display_label||x.sid).replace(/_/g," "))+'</button></li>';}).join("")+'</ol></details>';
    if(bindings.length)h+='<details class="tl-research"><summary>문맥 연구 연결 '+bindings.length+'건</summary>'+bindings.map(function(b){var rec=contextRecord(b.record_id);return '<article class="tl-binding" data-context-record="'+esc(b.record_id)+'"><strong>'+esc(rec&&rec.title||b.record_id)+'</strong>'+(rec&&rec.summary?'<p>'+esc(rec.summary)+'</p>':"")+'<button type="button" class="btn ghost" data-tl-context-research="'+esc(b.record_id)+'">연구 열기</button></article>';}).join("")+'</details>';
    return h;
  }
  function renderTimeline(){
    var el=$("tl-body");if(!el)return;
    try{
      var eras=timelineEraTopics();if(!eras.length){el.innerHTML='<p class="empty helper">표시할 시대 연표 데이터가 없습니다.</p>';return;}
      if(!ui.tlEra||!timelineEraById(ui.tlEra))ui.tlEra=timelineAutoEra(eras).id;
      var tp=timelineEraById(ui.tlEra)||eras[0],tracks=tp.overlay&&tp.overlay.tracks||[],hitTrack=null;
      (tp.steps||[]).some(function(s){var hit=(s.passage_refs||[]).some(function(r){var x=navParseRef(r);return x&&x.pid===state.passage;});if(hit&&s.track){hitTrack=s.track;return true;}return false;});
      if(!ui.tlTrack||tracks.length&&!tracks.some(function(x){return x.id===ui.tlTrack;}))ui.tlTrack=hitTrack||(tracks[0]&&tracks[0].id)||null;
      var tr=tracks.filter(function(x){return x.id===ui.tlTrack;})[0]||tracks[0]||null;
      var steps=(tp.steps||[]).filter(function(s){return !ui.tlTrack||!s.track||s.track===ui.tlTrack;});
      if(ui.tlSort==="scripture")steps=steps.slice().sort(function(a,b){var A=navParseRange(a.range),B=navParseRange(b.range);return (A?passageRank({book:A.pid.split("-")[0],chapter:+A.pid.split("-")[1],verse:A.v1}):999999)-(B?passageRank({book:B.pid.split("-")[0],chapter:+B.pid.split("-")[1],verse:B.v1}):999999);});
      var sel=steps.filter(function(s){return s.id===ui.tlStep;})[0]||steps.filter(function(s){return (s.passage_refs||[]).some(function(r){var x=navParseRef(r);return x&&x.pid===state.passage;});})[0]||steps[0]||null;ui.tlStep=sel&&sel.id||null;

      var erasHtml=eras.map(function(x){var active=x.id===tp.id,first=(x.steps||[])[0],m=first&&timelineStepMedia(x,first),planned=!(x.steps||[]).length;return '<button class="tl-era-card'+(active?" is-on":"")+(planned?" is-planned":"")+'" data-tl-era="'+esc(x.id)+'">'+(m?'<img src="'+esc(m.preview_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="tl-era-ph"></span>')+'<strong>'+esc(x.title)+'</strong><span>'+esc(x.summary||"")+'</span><small>'+esc(planned?"준비 중":(x.overlay&&x.overlay.tracks&&x.overlay.tracks[0]&&x.overlay.tracks[0].range_label)||"연결됨")+'</small></button>';}).join("");
      var eraIx=eras.indexOf(tp), prevEra=eraIx>0?eras[eraIx-1]:null, nextEra=eraIx>=0&&eraIx<eras.length-1?eras[eraIx+1]:null;
      function eraRange(x){return x&&x.overlay&&x.overlay.tracks&&x.overlay.tracks[0]&&x.overlay.tracks[0].range_label||"";}
      var chronoHtml='<section class="tl-chrono tl-chrono-all" aria-label="구원 역사 전체 흐름"><div class="tl-chrono-head"><strong>구원 역사 전체 흐름</strong><span>시대 순서 · 연대 수치는 승인된 연대 데이터 연결 후 표시</span></div><ol class="tl-mini">'+eras.map(function(x){var on=x.id===tp.id,pl=!(x.steps||[]).length;return '<li class="tl-mini-seg'+(on?" is-on":"")+(pl?" is-planned":"")+'"><button type="button" data-tl-era="'+esc(x.id)+'"'+(on?' aria-current="true"':"")+'><span class="tl-mini-dot" aria-hidden="true"></span><span class="tl-mini-name">'+esc(x.title)+'</span></button></li>';}).join("")+'</ol></section>';
      var trackHtml=tracks.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===ui.tlTrack?" selected":"")+'>'+esc(x.title)+'</option>';}).join("");
      var TL_PAGE=5,tlPages=Math.max(1,Math.ceil(steps.length/TL_PAGE)),selIx=sel?steps.indexOf(sel):0;
      if(ui.tlPage==null||ui.tlPage<0)ui.tlPage=Math.floor(Math.max(0,selIx)/TL_PAGE);ui.tlPage=Math.min(ui.tlPage,tlPages-1);   // 시대·줄기·정렬이 바뀌면 선택 사건이 있는 쪽으로, 쪽 이동은 선택을 바꾸지 않는다(자동 슬라이드 없음)
      var tlFrom=ui.tlPage*TL_PAGE,tlShown=steps.slice(tlFrom,tlFrom+TL_PAGE);
      var pagerHtml=tlPages>1?'<span class="tl-pager" role="group" aria-label="사건 쪽 이동"><button type="button" data-tl-page="-1" aria-label="이전 사건"'+(ui.tlPage===0?" disabled":"")+'>‹</button><span class="tl-page-ind" aria-live="polite">'+(tlFrom+1)+'–'+(tlFrom+tlShown.length)+' / '+steps.length+'</span><button type="button" data-tl-page="1" aria-label="다음 사건"'+(ui.tlPage>=tlPages-1?" disabled":"")+'>›</button></span>':"";
      var cards=tlShown.map(function(s,i0){var i=tlFrom+i0;var m=timelineStepMedia(tp,s),p=timelineStepPlace(tp,s),on=sel&&sel.id===s.id;return '<button class="tl-event-card'+(on?" is-on":"")+'" data-tl-step="'+esc(s.id)+'"><span class="tl-event-tick">'+esc(timelineStepRef(s))+'</span><span class="tl-event-n">'+(i+1)+'</span>'+(m?'<img src="'+esc(m.preview_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="tl-event-ph"></span>')+'<strong>'+esc(s.title)+'</strong><span class="tl-event-ref">'+esc(timelineStepRef(s))+'</span><span class="tl-event-desc">'+esc(s.core||s.short_description||"")+'</span>'+(p&&p.certainty?'<small>'+esc(p.certainty)+'</small>':"")+'</button>';}).join("");
      var detail="";
      if(sel){var m=timelineStepMedia(tp,sel),p=timelineStepPlace(tp,sel),ix=steps.indexOf(sel),near=steps.filter(function(s,j){return j!==ix&&Math.abs(j-ix)<=2;});detail='<aside class="tl-detail"><span class="tl-detail-badge">'+esc(tp.title)+(tr?" · "+esc(tr.title):"")+'</span><h2>'+esc(sel.title)+'</h2><p class="tl-detail-ref">'+esc(timelineStepRef(sel))+'</p>'+(m?'<img class="tl-detail-img" src="'+esc(m.preview_url)+'" alt="" referrerpolicy="no-referrer">':'<div class="tl-detail-img tl-detail-ph"></div>')+'<p class="tl-detail-lead">'+esc(sel.core||sel.short_description||"")+'</p><dl class="tl-detail-facts">'+(tr?'<div><dt>주요 인물</dt><dd>'+esc(tr.title)+'</dd></div>':"")+(p?'<div><dt>장소</dt><dd>'+esc(p.label)+(p.region?" · "+esc(p.region):"")+'</dd></div>':"")+'<div><dt>상태</dt><dd>'+esc(sel.uncertainty||"연결됨")+'</dd></div></dl><div class="tl-detail-actions"><button class="btn primary" data-tl-study="'+esc(sel.id)+'">본문연구</button><button class="btn ghost" data-tl-map="'+esc(sel.id)+'">지도 보기</button></div>'+(near.length?'<section class="tl-related"><h3>관련 사건</h3>'+near.map(function(s){return '<button data-tl-step="'+esc(s.id)+'"><span>'+esc(s.title)+'</span><small>'+esc(timelineStepRef(s))+'</small></button>';}).join("")+'</section>':"")+'</aside>';}

      el.innerHTML='<div class="tl-page"><div class="tl-left"><header class="tl-page-head"><div class="tl-head-title"><h1>성경 연표</h1><p>구원 역사를 한눈에 보는 흐름</p></div><div class="tl-head-context"><strong>'+esc(tp.title)+'</strong><span>'+esc(tr&&tr.title||"")+'</span><small>'+esc((tr&&tr.range_label)||eraRange(tp)||"")+'</small></div></header><div class="tl-era-strip">'+erasHtml+'</div><main class="tl-main"><section class="tl-era-summary"><div class="tl-sum-text"><h2>'+esc(tp.title)+'</h2><p class="tl-sum">'+esc(tp.summary||"")+'</p><p class="tl-range">'+esc((tr&&tr.range_label)||"")+'</p></div>'+(tracks.length?'<label class="tl-track">인물 <select data-tl-track>'+trackHtml+'</select></label>':"")+'</section>'+(steps.length?'<section class="tl-event-sec"><div class="tl-event-head"><h3>'+esc((tr&&tr.title||tp.title)+" 주요 사건")+' <small>('+steps.length+'개)</small></h3>'+pagerHtml+'<div><button data-tl-sort="story" class="'+(ui.tlSort!=="scripture"?"is-on":"")+'">사건 순</button><button data-tl-sort="scripture" class="'+(ui.tlSort==="scripture"?"is-on":"")+'">본문 순</button></div></div><div class="tl-event-rail">'+cards+'</div></section>':'<div class="tl-empty"><strong>'+esc(tp.title)+'</strong><p>현재 승인된 상세 연표 데이터가 아직 연결되지 않았습니다.</p></div>')+chronoHtml+timelineResearchHtml()+'</main></div>'+detail+'</div>';
    }catch(e){el.innerHTML='<div class="degraded" role="status">연표를 표시할 수 없습니다.</div>';}
  }
  var mapMoved = false;
  function bindMapPan() {
    var body = $("map-body"); if (!body) return; var d = null;
    body.addEventListener("pointerdown", function (ev) { if ((ev.button != null && ev.button !== 0) || !ev.target.closest("svg.smap, svg.gmap")) return; d = { x: ev.clientX, y: ev.clientY, cx: ui.cam.x, cy: ui.cam.y, geo: mapModeNow() === "geo" ? Object.assign({}, geoCam()) : null, moved: false, id: ev.pointerId }; });
    body.addEventListener("pointermove", function (ev) {
      if (!d) return; var dx = ev.clientX - d.x, dy = ev.clientY - d.y; if (!d.moved && Math.hypot(dx, dy) < 4) return;
      if (!d.moved) { d.moved = true; document.body.dataset.dragging = "map"; try { body.setPointerCapture(d.id); } catch (e) {} }
      var sv = body.querySelector("svg.smap, svg.gmap"); if (!sv) return; var rc = sv.getBoundingClientRect();
      if (d.geo) { var gu = d.geo.w / Math.min(rc.width, rc.height); ui.gcam = clampGeoCam({ x: d.geo.x - dx * gu, y: d.geo.y - dy * gu, w: d.geo.w }); renderGeoOnly(); return; }
      var upp = (100 / ui.cam.k) / Math.min(rc.width, rc.height);
      setCam(d.cx - dx * upp, d.cy - dy * upp, ui.cam.k);
    });
    function end() { if (d && d.moved) { mapMoved = true; setTimeout(function () { mapMoved = false; }, 0); } d = null; if (document.body.dataset.dragging === "map") delete document.body.dataset.dragging; }
    body.addEventListener("pointerup", end); body.addEventListener("pointercancel", end);
    if (window.ResizeObserver) { var lastSpan = ""; new ResizeObserver(function () { var s = body.clientWidth + "x" + body.clientHeight; if (s !== lastSpan) { lastSpan = s; try { var g0 = geoCam(); if (paneAnim.on) { var m1 = mapPixelSpan(); if (paneAnim.lastM > 0 && m1 > 0) g0 = { x: g0.x, y: g0.y, w: g0.w * m1 / paneAnim.lastM }; paneAnim.lastM = m1; } ui.gcam = clampGeoCam(g0); renderGeoOnly(); } catch (e) {} } }).observe(body); }   // 창/분할선 크기가 바뀌어도 지명은 같은 px 크기를 유지
    // ---- 더블클릭 확대: 클릭한 지점(지명이면 지명 좌표)을 새 중심으로 잡고 한 단계(2배) 부드럽게 확대한다. 선택·패널·레이어·필기 상태는 건드리지 않는다. ----
    var snap = null, anim = 0;
    var animT = 0;
    function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = 0; } if (animT) { clearTimeout(animT); animT = 0; } }
    function toolActive() { try { var a = window.JBC_ANN && window.JBC_ANN.state; return !!a && a.tool !== "hand" && !a.space && !a.hidden; } catch (e) { return false; } }
    body.addEventListener("click", function (ev) {   // 지명 표식 더블클릭의 두 번째 클릭이 선택을 토글하지 않게 하고, 첫 클릭 직전 상태를 기억한다
      var m = ev.target.closest && ev.target.closest("g.gm[data-place]"); if (!m) { snap = null; return; }
      if (ev.detail >= 2) { ev.stopPropagation(); return; }
      snap = { t: Date.now(), entity: state.entity, tab: state.tab, prevTab: state.prevTab, panel: state.panel, sheet: state.sheet };
    }, true);
    function pointGeo(ev) {
      var sv = body.querySelector("svg.gmap"); if (!sv) return null;
      var f = ev.target.closest && ev.target.closest("g.gm[data-lat], g.gm-ref[data-ref]");
      if (f && f.dataset.lat) { var q = GEO.project(+f.dataset.lat, +f.dataset.lon); return { x: q.x, y: q.y }; }
      if (f && f.dataset.ref) { var l = refLabelList().filter(function (z) { return z.id === f.dataset.ref; })[0]; if (l && isFinite(l.lat) && isFinite(l.lon)) { var q2 = GEO.project(l.lat, l.lon); return { x: q2.x, y: q2.y }; } }
      var vb = (sv.getAttribute("viewBox") || "").split(/\s+/).map(Number), r = sv.getBoundingClientRect(); if (vb.length < 4 || !r.width || !r.height) return null;
      var sc = Math.max(r.width, r.height) / vb[2], ox = (r.width - vb[2] * sc) / 2, oy = (r.height - vb[3] * sc) / 2;
      return { x: vb[0] + (ev.clientX - r.left - ox) / sc, y: vb[1] + (ev.clientY - r.top - oy) / sc };
    }
    body.addEventListener("dblclick", function (ev) {
      if (toolActive() || !ev.target.closest("svg.gmap") || ev.target.closest("button, a, input, select, textarea")) return;
      var pt = pointGeo(ev); if (!pt) return; ev.preventDefault();
      if (snap && Date.now() - snap.t < 1500) {   // 표식 더블클릭: 첫 클릭이 바꾼 선택/패널 상태를 되돌린다(선택 대상 보존)
        var ch = state.entity !== snap.entity || state.tab !== snap.tab || state.panel !== snap.panel || state.sheet !== snap.sheet;
        state.entity = snap.entity; state.tab = snap.tab; state.prevTab = snap.prevTab; state.panel = snap.panel; state.sheet = snap.sheet; snap = null;
        if (ch) { try { render(); } catch (e) {} }
      }
      var from = geoCam(), to = clampGeoCam({ x: pt.x, y: pt.y, w: from.w / 2 }); stopAnim();
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { ui.gcam = to; renderGeoOnly(); return; }
      var t0 = performance.now(), D = 260;
      (function step(now) {
        var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), lw = Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e;
        ui.gcam = clampGeoCam({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: k >= 1 ? to.w : Math.exp(lw) });
        renderGeoOnly(); anim = k < 1 ? requestAnimationFrame(step) : 0; if (k >= 1 && animT) { clearTimeout(animT); animT = 0; }
      })(t0);
      animT = setTimeout(function () { stopAnim(); ui.gcam = to; renderGeoOnly(); }, D + 80);   // 프레임이 멈춘 탭에서도 목표 카메라에 반드시 도달한다
    });
    body.addEventListener("pointerdown", stopAnim); body.addEventListener("wheel", stopAnim, { passive: true });
    body.addEventListener("wheel", function (ev) { if (mlActive()) return; ev.preventDefault(); zoomBy(ev.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });   // 본문연구 지도와 지도 관점이 같은 휠 확대 계약을 쓴다
  }
  // ---- 아이콘 체계: 단일 outline 패밀리(24px 그리드, round cap/join, stroke 은 CSS 1.7px). 이모지/채움 아이콘/외부 라이브러리 없음. ----
  var ICONS = {
    brand: '<path d="M12 6.2C10.3 5 7.7 4.6 4 4.9v10.9c3.7-.3 6.3.1 8 1.3 1.7-1.2 4.3-1.6 8-1.3V4.9c-3.700-.3-6.300.1-8 1.3Z"/><path d="M12 6.2v10.9"/><path d="M4 19.3c3.700-.3 6.300.1 8 1.300 1.700-1.200 4.300-1.600 8-1.300"/>',
    book: '<path d="M12 6.5C10.2 5.2 7.6 4.7 4 5v12.5c3.600-.3 6.200.2 8 1.500 1.800-1.300 4.400-1.800 8-1.500V5c-3.600-.3-6.200.2-8 1.500Z"/><path d="M12 6.500V19"/>',
    map: '<path d="M9 5 3.500 7v12L9 17l6 2 5.500-2V5L15 7 9 5Z"/><path d="M9 5v12M15 7v12"/>',
    timeline: '<path d="M4 7h9M8 12h12M6 17h8"/><circle cx="18" cy="7" r="1.200"/><circle cx="6" cy="12" r="1.200"/><circle cx="18" cy="17" r="1.200"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    moon: '<path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a6.800 6.800 0 0 0 10.500 10.500Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/>',
    minus: '<path d="M5 12h14"/>',
    locate: '<circle cx="12" cy="12" r="6.500"/><circle cx="12" cy="12" r="1.200"/><path d="M12 2.500v4M12 17.500v4M2.500 12h4M17.500 12h4"/>',
    compass: '<circle cx="12" cy="12" r="8.500"/><path d="m15.500 8.500-2 5-5 2 2-5 5-2Z"/>',
    layers: '<path d="m12 4 8.500 4.500L12 13 3.500 8.500 12 4Z"/><path d="m3.500 12.500 8.500 4.500 8.500-4.500"/><path d="m3.500 16.500 8.500 4.500 8.500-4.500"/>',
    label: '<path d="M4 4h8l8 8-8 8-8-8V4Z"/><circle cx="8.500" cy="8.500" r="1.100"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    download: '<path d="M12 4v11M7.500 10.500 12 15l4.500-4.500M5 19.500h14"/>',
    print: '<path d="M7 8V4h10v4"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    search: '<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    hand: '<path d="M6 4l12 7.500-5.300 1.400L10.500 18 6 4Z"/>',
    pen: '<path d="M5 19l1-4L16.500 4.500a1.800 1.800 0 0 1 2.500 0l.5.5a1.800 1.800 0 0 1 0 2.500L9 18l-4 1Z"/><path d="M14.500 6.500l3 3"/>',
    highlighter: '<path d="m13 5 6 6-6.500 6.500-3.500-.5L7 14.500 13 5Z"/><path d="M4 20.500h8"/>',
    eraser: '<path d="M8.500 19.500 4 15a1.500 1.500 0 0 1 0-2.100L13 4a1.500 1.500 0 0 1 2.100 0l4.900 4.900a1.500 1.500 0 0 1 0 2.100l-8 8.500"/><path d="M8.500 19.500H20M7 9l8 8"/>',
    atob: '<circle cx="6" cy="18" r="1.800"/><path d="M7.500 16.500 17 7"/><path d="M11 6.500h6.500V13"/>',
    ruler: '<path d="M3.500 15.500 15.500 3.500l5 5-12 12-5-5Z"/><path d="m7 12 2.500 2.500M10 9l2 2M13 6l2.500 2.500"/>',
    undo: '<path d="M9 7 4 12l5 5"/><path d="M4.500 12H14a4.500 4.500 0 0 1 0 9h-3"/>',
    trash: '<path d="M5 7h14M10 7V4.500h4V7M7 7l1 12.500h8L17 7M10.500 11v5M13.500 11v5"/>',
    eye: '<path d="M2.500 12s3.500-6.500 9.500-6.500S21.500 12 21.500 12s-3.500 6.500-9.500 6.500S2.500 12 2.500 12Z"/><circle cx="12" cy="12" r="2.800"/>',
    present: '<rect x="3.500" y="4" width="17" height="11" rx="1.500"/><path d="M12 15v4M8 19.500h8"/>'
  };
  function injectIcons() {
    [].forEach.call(document.querySelectorAll("[data-ico]"), function (el) {
      if (el.querySelector(":scope > svg.ico")) return; var p = ICONS[el.dataset.ico]; if (!p) return;
      var svg = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + "</svg>";
      if (el.classList.contains("brand-ico")) el.innerHTML = svg; else el.insertAdjacentHTML("afterbegin", svg);
    });
  }
  function loadSplit() { try { var v = parseFloat(localStorage.getItem(SPLIT_KEY)); if (isFinite(v) && v >= 0.2 && v <= 0.85) ui.frac = v; } catch (e) {} }
  function clampFrac(f) {
    var st = $("stage"), W = st ? st.getBoundingClientRect().width - 10 : 0, lo = 0.2, hi = 0.85, tmin = ui.journeyOn ? JOURNEY_TEXT_MIN_PX : SPLIT_TEXT_MIN_PX;
    if (W > 0) { lo = Math.max(lo, SPLIT_MAP_MIN_PX / W, 1 - 720 / W); hi = Math.min(hi, 1 - tmin / W); if (hi < lo) hi = lo; }
    return Math.min(hi, Math.max(lo, f));
  }
  function applySplit() {
    var st = $("stage"), sp = $("split"); if (!st) return;
    var f = clampFrac(ui.frac); st.style.setProperty("--map-frac", String(f));
    if (sp) sp.setAttribute("aria-valuenow", String(Math.round(f * 100)));
    window.requestAnimationFrame(updateHeaderMetrics);
  }
  // 분할선 조작은 본문 줄바꿈을 바꾸므로, 전후로 읽던 절(스크롤 앵커)을 고정한다.
  function setFrac(f, persist) {
    var pre = null; try { pre = computeAnchor(); } catch (e) {}
    ui.frac = Math.min(0.85, Math.max(0.2, f)); applySplit();
    if (pre) restoreAnchor(pre);
    if (persist) { try { localStorage.setItem(ui.journeyOn ? JOURNEY_SPLIT_KEY : SPLIT_KEY, String(ui.frac)); } catch (e) {} }   // 여정 보기 중의 조절은 평소 분할 비율을 덮어쓰지 않는다
  }
  // 여정(journey) 보기: 지도를 넓게, 오른쪽 이동 내비게이션을 고정 폭으로. 평소 분할 비율은 따로 보관했다가 여정을 닫으면 되돌린다(사용자 지도 설정과는 무관).
  function journeyLayout(on) {
    on = !!on && !isMobile(); var was = !!ui.journeyOn; if (!on) document.body.style.removeProperty("--jn-scene-label"); document.body.dataset.journey = on ? "on" : "off";
    if (on === was) return;
    ui.journeyOn = on;
    if (on) {
      ui.fracBefore = ui.frac; var v = NaN; try { v = parseFloat(localStorage.getItem(JOURNEY_SPLIT_KEY)); } catch (e) {}
      var st = $("stage"), W = st ? st.getBoundingClientRect().width - 10 : 0;
      ui.frac = isFinite(v) && v >= 0.2 && v <= 0.85 ? v : (W > 0 ? 1 - JOURNEY_TEXT_PX / W : 0.62);
    } else if (ui.fracBefore != null) { ui.frac = ui.fracBefore; ui.fracBefore = null; }
    applySplit(); window.requestAnimationFrame(updateHeaderMetrics);
  }
  function updateStageChrome() {
    var mob = isMobile(), open = !mob || ui.mapOpen; document.body.dataset.map = open ? "open" : "collapsed";
    var tg = $("map-toggle"); if (tg) { tg.hidden = !mob; tg.textContent = open ? "접기" : "펼치기"; tg.setAttribute("aria-expanded", String(open)); }
  }
  function bindSplit() {
    var sp = $("split"), st = $("stage"); if (!sp || !st) return;
    var drag = false, tick = false, lastX = 0;
    function fracAt(x) { var r = st.getBoundingClientRect(), rw = parseFloat(getComputedStyle(document.body).getPropertyValue("--jb-current-research-width")) || 0; return clampFrac((x - r.left - 5 - rw) / (r.width - 10 - rw)); }
    sp.addEventListener("pointerdown", function (ev) { if (ev.button != null && ev.button !== 0) return; drag = true; lastX = ev.clientX; try { sp.setPointerCapture(ev.pointerId); } catch (e) {} document.body.dataset.dragging = "split"; ev.preventDefault(); });
    sp.addEventListener("pointermove", function (ev) { if (!drag) return; lastX = ev.clientX; if (tick) return; tick = true; window.requestAnimationFrame(function () { tick = false; if (drag) setFrac(fracAt(lastX), false); }); });
    function end(ev) { if (!drag) return; drag = false; delete document.body.dataset.dragging; try { sp.releasePointerCapture(ev.pointerId); } catch (e) {} setFrac(fracAt(ev.clientX != null ? ev.clientX : lastX), true); }
    sp.addEventListener("pointerup", end); sp.addEventListener("pointercancel", function () { drag = false; delete document.body.dataset.dragging; });
    sp.addEventListener("dblclick", function () { setFrac(SPLIT_DEFAULT, true); });
    sp.addEventListener("keydown", function (ev) {
      if (ev.key === "Home") { ev.preventDefault(); return setFrac(clampFrac(0.2), true); }
      if (ev.key === "End") { ev.preventDefault(); return setFrac(clampFrac(0.85), true); }
      if (ev.key === "Enter") { ev.preventDefault(); return setFrac(SPLIT_DEFAULT, true); }
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
    try { markExploreSelection(); } catch (e) {}
    try { renderPanel(); } catch (e) { var pn = $("panel"); if (pn) pn.innerHTML = '<div class="degraded" role="status">맥락 패널을 표시할 수 없습니다. 본문은 계속 사용할 수 있습니다.</div>'; }
    syncHash(booting || replaceNext, pre); replaceNext = false;
    try { document.dispatchEvent(new CustomEvent("bvc:rendered")); } catch (e) {}   // 보조 view(원어 원문)가 현재 절 변경을 알 수 있게 하는 알림 한 줄
    if (key) { var n = document.querySelector(key); if (n && n !== document.activeElement) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } } }
  }

  // ---------- search (normalized) ----------
  function norm(s) { return String(s == null ? "" : s).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  var ALIAS = null, REFTAIL = null, BOOK_ABBR = null;
  function REF_TAIL() { return REFTAIL || (REFTAIL = new RegExp("^(\\d+)(?:(?:" + norm("장") + "|" + norm("편") + "|:|\\.)(?:(\\d+)(?:" + norm("절") + ")?(?:(?:-|~|\\u2013|\\u2014)(\\d+)(?:" + norm("절") + ")?)?)?)?$")); }
  function buildAlias() {
    ALIAS = [];
    var abbr = BOOK_ABBR = { gen: "창", exo: "출", lev: "레", num: "민", deu: "신", jos: "수", jdg: "삿", rut: "룻", "1sa": "삼상", "2sa": "삼하", "1ki": "왕상", "2ki": "왕하", "1ch": "대상", "2ch": "대하", ezr: "스", neh: "느", est: "에", job: "욥", psa: "시", pro: "잠", ecc: "전", sng: "아", isa: "사", jer: "렘", lam: "애", ezk: "겔", dan: "단", hos: "호", jol: "욜", amo: "암", oba: "옵", jon: "욘", mic: "미", nam: "나", hab: "합", zep: "습", hag: "학", zec: "슥", mal: "말", mat: "마", mrk: "막", luk: "눅", jhn: "요", act: "행", rom: "롬", "1co": "고전", "2co": "고후", gal: "갈", eph: "엡", php: "빌", col: "골", "1th": "살전", "2th": "살후", "1ti": "딤전", "2ti": "딤후", tit: "딛", phm: "몬", heb: "히", jas: "약", "1pe": "벧전", "2pe": "벧후", "1jn": "요일", "2jn": "요이", "3jn": "요삼", jud: "유", rev: "계" };
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

  // ---------- 문맥 검색(Contextual Jump) ----------
  // 인물·장소 검색은 페이지를 열지 않는다. 현재 본문·지도·Detail 위에 뜬 작은 패널에서 찾고, 고른 대상으로 그 자리에서 이동한다.
  // 검색 결과를 고르는 일은 좌표·geometry 를 만들 권한이 없다: 이미 승인된 지도 표식이 있는 장소만 지도가 움직인다.
  var swState = { open: false, kind: "all", mode: "all", type: "all", testament: "all", period: "all", region: "all", sort: "label", view: "card", limit: 30, q: "", placeType: "all", role: "all", story: "all", journey: "all", location: "all", photo: false, archaeology: false, detailTab: "overview", prevFocus: null, prevPanel: null, scrollTop: 0, cache: { all: null, verse: null, place: null, person: null, event: null, route: null, research: null } };
  function swSnapshot() { var box = $("search-results"); return { period: swState.period, region: swState.region, view: swState.view, placeType: swState.placeType, role: swState.role, story: swState.story, journey: swState.journey, location: swState.location, photo: swState.photo, archaeology: swState.archaeology, selected: state.entity ? stableOf(state.entity.kind, state.entity.id) : null, scroll: box ? box.scrollTop : 0 }; }
  function swRestore(v) { if (!v) return; ["period","region","view","placeType","role","story","journey","location","photo","archaeology"].forEach(function (k) { if (v[k] !== undefined) swState[k] = v[k]; }); }
  function swModeAccepts(e, mode) { if (mode === "all") return true; if (mode === "verse" || mode === "research") return false; return mode === "person" ? e.entity_type === "Person" : mode === "event" ? e.entity_type === "Event" : mode === "route" ? e.entity_type === "Route" : mode === "region" ? e.entity_type === "Region" : e.entity_type === "Place"; }
  function swOptions() { return { kind: swState.mode === "verse" ? "verse" : swState.mode === "all" ? "all" : "entity", type: swState.mode, testament: swState.testament, period: swState.period, region: swState.region, placeType: swState.placeType, role: swState.role, story: swState.story, journey: swState.journey, location: swState.location, photo: swState.photo, archaeology: swState.archaeology, sort: swState.sort, limit: swState.limit }; }
  function switchExploreMode(mode) {
    if (["all","verse","place","region","person","event","route","research"].indexOf(mode)<0 || mode === swState.mode) return;
    swState.cache[swState.mode] = swSnapshot(); swState.mode = mode; swState.type = mode; swState.detailTab = "overview";
    var c = swState.cache[mode];
    if (c) swRestore(c);
    else { swState.period="all"; swState.region="all"; swState.view="card"; swState.placeType="all"; swState.role="all"; swState.story="all"; swState.journey="all"; swState.location="all"; swState.photo=false; swState.archaeology=false; }
    var keep = state.entity && STORE.get(stableOf(state.entity.kind, state.entity.id)); if (keep && !swModeAccepts(keep, mode)) state.entity = null;
    renderSearch(); renderPanel(); if (c && c.selected && STORE.get(c.selected) && swModeAccepts(STORE.get(c.selected), mode)) jumpToEntity(c.selected);
    requestAnimationFrame(function () { var box = $("search-results"); if (box && c) box.scrollTop = c.scroll || 0; });
  }
  function rememberExploreScroll() { var r = $("search-results"); if (r) swState.scrollTop = r.scrollTop; }
  function restoreExploreScroll() { var r = $("search-results"); if (r) r.scrollTop = swState.scrollTop || 0; }
  function bookIndexOf(pid) { return BOOK_ORDER.indexOf(String(pid).split("-")[0]); }
  function passageRank(r) { var bi = BOOK_ORDER.indexOf(r.book); return bi < 0 ? Infinity : bi * 1000000 + r.chapter * 1000 + (r.verse || 0); }
  function entityHasTestament(e, tst) { if (tst === "all") return true; return e.passage_refs.some(function (r) { var bi = BOOK_ORDER.indexOf(r.book); return bi >= 0 && (tst === "ot" ? bi < 39 : bi >= 39); }); }
  function bibleRank(e) {
    var best = Infinity; e.passage_refs.forEach(function (r) { best = Math.min(best, passageRank(r)); }); return best;
  }
  function entitySet(q, o) {
    o = o || {}; var nq = norm(q), out = STORE.list(), ref = nq ? parseReference(q) : null;
    var mode = ["all","place","region","person","event","route"].indexOf(o.type)>=0 ? o.type : "all"; if (mode !== "all") out = out.filter(function (e) { return swModeAccepts(e, mode); });
    if (nq) {
      if (ref && ref.passage) out = out.filter(function (e) { return e.passage_refs.some(function (r) { return r.book + "-" + r.chapter === ref.passage && (ref.verse == null || r.verse === ref.verse); }); });
      else out = out.filter(function (e) { return norm([e.display_label, (e.aliases || []).join(" "), e.role, e.reader_type, e.region, e.period, e.story, (e.journeys || []).join(" "), e.short_summary].filter(Boolean).join(" ")).indexOf(nq) >= 0; });
    }
    if (o.testament && o.testament !== "all") out = out.filter(function (e) { return entityHasTestament(e, o.testament); });
    if (o.period && o.period !== "all") out = out.filter(function (e) { return e.period === o.period; });
    if (o.region && o.region !== "all") out = out.filter(function (e) { return e.region === o.region; });
    if (o.placeType && o.placeType !== "all") out = out.filter(function (e) { return e.reader_type === o.placeType; });
    if (o.role && o.role !== "all") out = out.filter(function (e) { return e.role === o.role; });
    if (o.story && o.story !== "all") out = out.filter(function (e) { return e.story === o.story; });
    if (o.journey && o.journey !== "all") out = out.filter(function (e) { return (e.journeys || []).indexOf(o.journey) >= 0; });
    if (o.location && o.location !== "all") out = out.filter(function (e) { return e.reader_location_status === o.location; });
    if (o.photo) out = out.filter(function (e) { return e.has_photo; });
    if (o.archaeology) out = out.filter(function (e) { return e.has_archaeology; });
    var sort = o.sort || "label", byLabel = function (a, b) { return a.display_label.localeCompare(b.display_label, "ko") || a.stable_id.localeCompare(b.stable_id); };
    out.sort(function (a, b) { if (sort === "bible") { var ar = bibleRank(a), br = bibleRank(b); if (ar !== br) return ar - br; } else if (sort === "period") { var ap = a.period_sort_value, bp = b.period_sort_value; if (ap != null || bp != null) { if (ap == null) return 1; if (bp == null) return -1; if (ap !== bp) return ap < bp ? -1 : 1; } } return byLabel(a, b); });
    return out;
  }
  // ---------- 공통 검색 서비스: 상단 빠른검색과 검색 탭이 같은 함수를 쓴다(표시 방식만 다름) ----------
  // 본문은 KRV 전체 텍스트에서 독립적으로 찾고, 인물·장소·사건·경로·연구는 등록된 데이터가 있을 때만 덧붙는다.
  var SEARCH_GROUPS = ["person", "place", "region", "event", "route", "research", "verse"];
  function unifiedSearch(q, o) {
    o = o || {};
    var nq = norm(q), mode = o.mode || "all", lim = o.limit || {}, res = { q: q, nq: nq, groups: {}, counts: {} };
    SEARCH_GROUPS.forEach(function (g) { res.groups[g] = []; res.counts[g] = 0; });
    var compact = nq.replace(/\s+/g, "");
    if (!compact) return res;
    function want(g) { return mode === "all" || mode === g; }
    function put(g, items) { res.counts[g] = items.length; res.groups[g] = lim[g] != null ? items.slice(0, lim[g]) : items; }
    if (want("verse") && (compact.length >= (o.minVerse || 1))) {
      var vi = verseIndex(), hits = [], total = 0, cap = lim.verse != null ? lim.verse : Infinity, tst = o.testament || "all";
      for (var i = 0; i < vi.length; i++) {
        if (vi[i].t.indexOf(nq) < 0) continue;
        if (tst !== "all" && (tst === "ot") !== (bookIndexOf(vi[i].pid) < 39)) continue;
        total++; if (hits.length < cap) { var P = D.passages[vi[i].pid]; hits.push({ kind: "v", id: vi[i].pid + ":" + vi[i].n, pid: vi[i].pid, n: vi[i].n, label: P.ref + " " + vi[i].n + "절", sub: "구절", text: P.verses[vi[i].n - 1].text }); }
      }
      res.groups.verse = hits; res.counts.verse = total;
    }
    ["person", "place", "region", "event", "route"].forEach(function (g) { if (want(g)) put(g, entitySet(q, extend(o.entity || {}, { type: g }))); });
    if (want("research")) put("research", contextualSearch(q));
    return res;
  }
  function extend(a, b) { var r = {}; Object.keys(a).forEach(function (k) { r[k] = a[k]; }); Object.keys(b).forEach(function (k) { r[k] = b[k]; }); return r; }
  function search(q, o) {
    o = o || {};
    var nq = norm(q), out = [], kind = o.kind || "all", tst = o.testament || "all", limit = o.limit || 30;
    out.totalVerses = 0; out.totalEntities = 0;
    if (!nq) return out;
    var ref = parseReference(q);
    if (ref && ref.passage && kind === "all") out.push({ kind: "r", id: ref.passage + ":" + (ref.verse == null ? "" : ref.verse), label: ref.label + " 열기", sub: "", ref: ref });
    if (kind === "all" || kind === "entity") {
      entitySet(q, o).forEach(function (e) { out.totalEntities++; out.push({ kind: e.kind, id: e.compatibility_key, stable_id: e.stable_id, label: e.display_label, sub: e.entity_type === "Person" ? "인물" : e.entity_type === "Region" ? "지역" : "장소", ent: e }); });
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
  // 헤더는 항상 화면 위에 붙어 있다(sticky). 높이를 CSS 변수로 노출해 스크롤 앵커·본문 정렬·패널 위치가 같은 기준을 쓴다.
  function updateHeaderMetrics() {
    var h = document.querySelector("header.top"); if (!h) return;
    var hh = h.getBoundingClientRect().height, root = document.documentElement;
    if (hh > 0) root.style.setProperty("--hdr-h", hh + "px");
    var scripture = $("text-pane"), world = $("guide-pane");
    if (scripture) { var sr = scripture.getBoundingClientRect(); if (sr.width > 0) { root.style.setProperty("--hdr-scripture-w", sr.width + "px"); root.style.setProperty("--hdr-scripture-x", sr.left + "px"); } }
    if (world) { var gr = world.getBoundingClientRect(); if (gr.width > 0) { root.style.setProperty("--hdr-guide-w", gr.width + "px"); root.style.setProperty("--hdr-guide-x", gr.left + "px"); } }
    document.body.dataset.stuck = String(window.scrollY > 2);
  }
  function syncSwFilters() {
    [].forEach.call(document.querySelectorAll("[data-swfilter]"), function (b) { var kv = b.dataset.swfilter.split(":"); b.setAttribute("aria-pressed", String(swState[kv[0]] === kv[1])); });
    var modeHas={all:true,verse:true,place:true,person:true,event:true,route:true,research:true};
    [].forEach.call(document.querySelectorAll("[data-swmode]"), function (b) { var mode=b.dataset.swmode,on=mode === swState.mode; b.hidden=!modeHas[mode]; b.setAttribute("aria-selected", String(on)); b.classList.toggle("is-active", on); });
    [].forEach.call(document.querySelectorAll("[data-sw-place]"), function (el) { el.hidden = swState.mode !== "place"; });
    [].forEach.call(document.querySelectorAll("[data-sw-person]"), function (el) { el.hidden = swState.mode !== "person"; });
    if ($("sw-photo")) $("sw-photo").checked = !!swState.photo;
    if ($("sw-archaeology")) $("sw-archaeology").checked = !!swState.archaeology;
  }
  var ENT_LABEL = { Person: "인물", Place: "장소", Region: "지역", Event: "사건", Route: "경로" };
  var DISCOVERY_REGION_KO = {
    "Beersheba Valley / northern Negev": "네게브 북부",
    "Southern Canaan / northwestern Negev–Gaza hinterland": "가나안 남부 · 네게브 북서부"
  };
  function discoveryRegionLabel(e) {
    var raw = e && e.region; if (!raw) return "";
    if (DISCOVERY_REGION_KO[raw]) return DISCOVERY_REGION_KO[raw];
    return /[가-힣]/.test(raw) ? raw : "";
  }
  function discoveryLocationLabel(e) {
    var raw = e && e.reader_location_status; if (!raw) return "";
    if (LOC_LABEL[raw]) return LOC_LABEL[raw];
    return ["확인된 위치", "유력한 위치", "추정지", "여러 후보지", "위치 미상"].indexOf(raw) >= 0 ? raw : "";
  }
  function discoveryTypeLabel(e) {
    var raw = e && e.raw, t = raw && raw.reader_type;
    return t && /[가-힣]/.test(t) ? t : (ENT_LABEL[e.entity_type] || e.entity_type);
  }
  function discoverySummary(e) {
    return String(e && e.short_summary || "").replace(/^샘플(?: 설명)?:\s*/, "").replace(/\s*\(위치는 프로토타입용 좌표\)\.?\s*$/, "").trim();
  }
  function discoveryPassage(e) {
    var refs = (e.passage_refs || []).slice().sort(function (a, b) { return passageRank(a) - passageRank(b); });
    if (!refs.length) return "";
    var first = passageLabel(refs[0]); return refs.length > 1 ? first + " · 외 " + (refs.length - 1) + "곳" : first;
  }
  function discoveryTags(e) {
    var a = [], loc = discoveryLocationLabel(e);
    if (e.period && /[가-힣]/.test(e.period)) a.push(e.period);
    if (loc && a.indexOf(loc) < 0) a.push(loc);
    return a.slice(0, 2);
  }
  function entityMeta(e) {
    var a = []; if (e.entity_type === "Person" && e.role) a.push(e.role);
    var rg = discoveryRegionLabel(e); if (rg) a.push(rg);
    return a.join(" · ");
  }
  // ---------- 공통 장소 색인(PLACE_INDEX) · 공통 PlaceCard ----------
  // 지도·검색·호버 카드·장소연구 패널은 모두 이 색인 한 곳에서 장소를 읽는다(화면별 장소 목록·메타데이터 복제 없음).
  //  · canonical 장소(STORE): stable id + (연구 투영이 있으면) Full Place Profile
  //  · 여정/지도 데이터의 장소(경유지·표시 장소): 데이터가 추가되면 자동으로 색인에 모여 구절·인물·시대·여정/장면이 합쳐진다(연구 권위 아님: 기본 카드)
  //  키: canonical 은 D.places 의 key(= 지도 표식 data-place), 그 밖은 여정 데이터의 place key. 같은 key 가 지도와 검색에서 쓰인다.
  var PLACE_INDEX = null;
  function placeRegionOf(lat, lon) {
    if (lat == null || lon == null) return "";
    if (lon >= 38) return "메소포타미아"; if (lon < 33.2 && lat < 32) return "애굽"; if (lat > 34.2) return "시리아·북쪽"; if (lon >= 35.55 && lat > 31.2) return "요단 동편"; if (lat < 31.2 && lon > 34.1) return "남부 가나안(네겝)"; return "가나안";
  }
  function koOnly(v) { v = String(v || "").trim(); return /[가-힣]/.test(v) ? v : ""; }   // 내부 영문 지역 문자열은 독자 화면에 노출하지 않는다
  function placeIndex() {
    if (PLACE_INDEX) return PLACE_INDEX;
    var byKey = {}, list = [];
    var put = function (key) { return byKey[key] || (byKey[key] = { key: key, stableId: null, canonical: false, hasProfile: false, label: "", en: "", type: "", region: "", summary: "", certainty: "", primaryPassage: null, passages: [], passageIds: [], people: [], eras: [], journeys: [], scenes: [], media: null, lat: null, lon: null }); };
    var add = function (arr, v) { if (v && arr.indexOf(v) < 0) arr.push(v); };
    STORE.list().filter(function (e) { return e.kind === "l"; }).forEach(function (e) {
      var p = put(e.compatibility_key || e.stable_id);
      p.stableId = e.stable_id; p.canonical = true; p.hasProfile = e.authority_pool === "CANONICAL"; p.label = e.display_label;
      p.en = (e.aliases || []).filter(function (a) { return /^[A-Za-z][A-Za-z .'-]+$/.test(a); })[0] || "";
      p.type = discoveryTypeLabel(e); p.region = koOnly(e.region); p.summary = discoverySummary(e); var fp = FULL_PLACE[e.stable_id];   /* 검색 카드의 유형·지역은 독자용 한글 표기(Full Profile 과 같은 값)만 쓴다 */
       if (fp) { if (fp.detailed_type) p.type = String(fp.detailed_type).split("·").map(function (x) { return x.trim(); }).filter(Boolean).join(" · "); var rf = (fp.quick_facts || []).filter(function (kv) { return kv[0] === "지역"; })[0]; if (rf && koOnly(rf[1])) p.region = String(rf[1]).split("·")[0].trim().replace(/^가나안\s(남부|북부|동부|서부|중부)$/, "$1 가나안"); }   // "가나안 남부" → "남부 가나안": 가나안 방위 표기만 방위 앞으로(표시 전용)
      p.certainty = discoveryLocationLabel(e) || ""; p.primaryPassage = e.primaryPassage || null; p.media = e.representative_media || null;
      (e.passage_refs || []).forEach(function (r) { add(p.passages, passageLabel(r)); add(p.passageIds, r.book + "-" + r.chapter); });
      (e.journeys || []).forEach(function (j) { add(p.journeys, j); });
      if (e.period) add(p.eras, e.period);
    });
    navCategories().reduce(function (a, c) { return a.concat(c.topics); }, []).forEach(function (tp) {
      if (!tp.steps || !tp.steps.length) return; var cat = (tp.overlay && tp.overlay.places) || {}, era = (tp.overlay && (tp.overlay.era_label || tp.overlay.era_title)) || tp.badge || "";
      var tracks = (tp.overlay && tp.overlay.tracks) || [];
      tp.steps.forEach(function (s, i) {
        var prim = [s.waypoint].concat((s.display || []).map(function (d) { return d.key; })).filter(Boolean), rel = (s.focus || []).concat(s.related || [], s.places || []), seen = {};
        prim.concat(rel).forEach(function (k) {
          if (!k || seen[k]) return; seen[k] = 1;
          var c = cat[k], canon = byKey[k] || (D.places && D.places[k] && STORE.get(stableOf("l", k)) ? put(k) : null);
          if (!canon && !c) return; var p = canon || put(k), isPrim = prim.indexOf(k) >= 0;
          if (!p.canonical && !p.label) {   // 표시 전용 장소: 데이터가 가진 것만으로 기본 카드를 만든다
            p.media = c.media || null; p.label = c.label; p.type = c.kind === "region" ? "지역" : "지명"; p.lat = +c.lat; p.lon = +c.lon; p.region = placeRegionOf(p.lat, p.lon); p.certainty = NAV_CERT_LABEL[c.certainty] || ""; p.summary = c.note || s.core || "";
          }
          if (isPrim && s.range) { add(p.passages, navShortRange(s.range)); add(p.passageIds, s.range.pid); }
          var tr = tracks.filter(function (t) { return t.id === s.track; })[0]; if (tr) add(p.people, tr.title);
          add(p.eras, era); add(p.journeys, tp.title);
          p.scenes.push({ topic: tp.id, topicTitle: tp.title, step: i, n: s.wp && s.wp.key === k ? s.wp.n : null, title: s.title, primary: isPrim, track: tr ? tr.title : "", core: s.core || "" });
          if (!p.summary && s.core && isPrim) p.summary = s.core;
        });
      });
    });
    Object.keys(byKey).forEach(function (k) { var p = byKey[k]; if (!p.label) return; p.searchText = norm([p.label, p.en, p.type, p.region, p.summary, p.certainty, p.passages.join(" "), p.people.join(" "), p.eras.join(" "), p.journeys.join(" "), p.scenes.map(function (s) { return s.title; }).join(" ")].join(" ")); list.push(p); });
    list.sort(function (a, b) { return a.label.localeCompare(b.label, "ko"); });
    return (PLACE_INDEX = { byKey: byKey, list: list });
  }
  // 검색: canonical 은 기존 entitySet(필터·정렬 그대로)의 결과를 색인 항목으로, 지도에만 있는 장소는 같은 색인에서 텍스트·가능한 필터로 찾는다.
  function placeIndexSet(q, o) {
    o = o || {}; var idx = placeIndex(), nq = norm(q), ref = nq ? parseReference(q) : null, out = [], seen = {};
    entitySet(q, extend(o, { type: "place" })).forEach(function (e) { var p = idx.byKey[e.compatibility_key || e.stable_id]; if (p && !seen[p.key]) { seen[p.key] = 1; out.push(p); } });
    var blocked = ["period", "role", "story", "location"].some(function (k) { return o[k] && o[k] !== "all"; }) || o.archaeology;
    if (!blocked) idx.list.forEach(function (p) {
      if (seen[p.key] || p.canonical) return;
      if (o.photo && !(p.media && mediaGate(p.media) === "image")) return;   // 사진 있음: 같은 대표 이미지(p.media)가 있는 장소
      if (o.testament && o.testament !== "all") { var hit = p.passageIds.some(function (pid) { return (bookIndexOf(pid) < 39) === (o.testament === "ot") && bookIndexOf(pid) >= 0; }); if (!hit) return; }   // 구약/신약: 등장 본문의 책으로
      if (ref && ref.passage) { if (p.passageIds.indexOf(ref.passage) < 0) return; } else if (nq && p.searchText.indexOf(nq) < 0) return;
      if (o.region && o.region !== "all" && p.region !== o.region) return; if (o.placeType && o.placeType !== "all" && p.type !== o.placeType) return;
      if (o.journey && o.journey !== "all" && p.journeys.indexOf(o.journey) < 0) return;
      seen[p.key] = 1; out.push(p);
    });
    if (!o.sort || o.sort === "label") out.sort(function (a, b) { return a.label.localeCompare(b.label, "ko"); });
    else if (o.sort === "bible") { var rk = function (p) { var b = Infinity; p.passageIds.forEach(function (pid) { var i = bookIndexOf(pid); if (i >= 0) b = Math.min(b, i * 1000 + (+String(pid).split("-")[1] || 0)); }); return b; }; out.sort(function (a, b) { return rk(a) - rk(b) || a.label.localeCompare(b.label, "ko"); }); }   // 성경순: 첫 등장 본문 기준(지도에만 있는 장소 포함)
    return out;
  }
  function placeJourneyLine(p) {   // 현재 여정과의 관련(없으면 첫 여정)
    var cur = ui.nav && ui.nav.topic, step = ui.nav && ui.nav.step, sc = null;
    p.scenes.forEach(function (s) { var r = (s.topic === cur && s.step === step ? 3 : s.topic === cur ? (s.primary ? 2 : 1) : 0), best = sc ? (sc.topic === cur && sc.step === step ? 3 : sc.topic === cur ? (sc.primary ? 2 : 1) : 0) : -1; if (r > best) sc = s; });
    if (!sc) return ""; return sc.topicTitle + (sc.track ? " · " + sc.track : "") + (sc.n ? " · " + sc.n + "번째 경유지" : "") + " · " + sc.title;
  }
  // 공통 PlaceCard: variant = "search" | "map" | "related". 데이터는 항상 색인 항목 p 하나에서 읽는다.
  function placeCardHtml(p, variant, ctx) {
    ctx = ctx || {}; var key = esc(p.key), sid = esc(p.stableId || "place:" + p.key), meta = [p.type, p.region].filter(Boolean).join(" · ");
    var pas = p.passages.slice(0, variant === "search" ? 3 : 2).join(", ") + (p.passages.length > (variant === "search" ? 3 : 2) ? " 외 " + (p.passages.length - (variant === "search" ? 3 : 2)) + "곳" : "");
    if (variant === "related") return '<button type="button" class="pc pc-related" data-place-open="' + key + '" data-place-key="' + key + '"><span class="pc-name">' + esc(p.label) + '</span>' + (p.type ? '<span class="pc-type">' + esc(p.type) + "</span>" : "") + "</button>";
    if (variant === "map") {
      var jl = placeJourneyLine(p), mapMedia = p.media && mediaGate(p.media) === "image" ? '<img class="pc-map-media" src="' + esc(p.media.preview_url) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : "";
      return '<div class="pc pc-map" data-place-key="' + key + '" data-stable-id="' + esc(p.stableId || "") + '" role="dialog" aria-label="' + esc(p.label) + ' 장소 카드">' + mapMedia + '<div class="pc-head"><strong class="pc-name">' + esc(p.label) + "</strong>" + (p.en ? '<span class="pc-en">' + esc(p.en) + "</span>" : "") + "</div>" +
        (meta ? '<div class="pc-meta">' + esc(meta) + "</div>" : "") + (p.summary ? '<p class="pc-sum">' + esc(p.summary) + "</p>" : "") + (pas ? '<div class="pc-row"><span>본문</span>' + esc(pas) + "</div>" : "") +
        (jl ? '<div class="pc-row"><span>여정</span>' + esc(jl) + "</div>" : "") + (p.certainty ? '<div class="pc-cert">' + esc(p.certainty) + "</div>" : "") +
        (p.hasProfile ? '<button type="button" class="pc-open" data-place-open="' + key + '">장소연구 보기</button>' : "") + atlas90PlaceLookupButton(p) + "</div>";
    }
    var m = p.media, listView = swState.view === "list", image = listView ? searchThumbHtml(m, true) : (ctx.card !== false ? searchThumbHtml(m, true) : "");
    var sel = (state.entity && p.stableId && stableOf(state.entity.kind, state.entity.id) === p.stableId) || (!!ui.placeBasic && ui.placeBasic === p.key), q = ctx.q, label = q ? markedHtml(p.label, markRanges(p.label, q), 0, p.label.length) : esc(p.label);
    var tags = [p.certainty].concat(p.journeys.slice(0, 1)).filter(Boolean);
    if (listView) return '<article class="ee-item ee-list-row pc pc-search' + (sel ? " is-selected" : "") + '" data-entity-id="' + sid + '" data-place-key="' + key + '" data-origin="' + (p.canonical ? "CANONICAL" : "JOURNEY_DATA") + '"><button type="button" class="sr-row ee-primary has-media" data-search="1" data-kind="l" data-id="' + key + '" data-stable-id="' + esc(p.stableId || "") + '" data-place-open="' + key + '">' +
      '<span class="ee-list-name">' + image + '<span class="ee-list-namecopy"><span class="sr-ref">' + label + "</span><span class=\"ee-list-class\">" + esc(p.type || "장소") + (p.region ? "<br>" + esc(p.region) : "") + "</span></span></span>" +
      '<span class="ee-list-desc">' + esc(p.summary || "") + "</span>" +
      '<span class="ee-list-passage">' + esc(pas || "") + "</span>" +
      '<span class="ee-list-tags">' + (tags.length ? tags.map(function (t) { return '<span class="ee-tag">' + esc(t) + "</span>"; }).join("") : "") + "</span>" +
      '<span class="ee-list-chevron" aria-hidden="true">›</span></button></article>';
    return '<article class="ee-item ee-card pc pc-search' + (sel ? " is-selected" : "") + '" data-entity-id="' + sid + '" data-place-key="' + key + '" data-origin="' + (p.canonical ? "CANONICAL" : "JOURNEY_DATA") + '"><button type="button" class="sr-row ee-primary ' + (image ? "has-media" : "no-media") + '" data-search="1" data-kind="l" data-id="' + key + '" data-stable-id="' + esc(p.stableId || "") + '" data-place-open="' + key + '">' + image +
      '<span class="ee-copy"><span class="sr-ref">' + label + '<span class="sr-kind">' + esc(p.type || "장소") + "</span></span>" + (p.en ? '<span class="pc-en">' + esc(p.en) + "</span>" : "") + (p.region ? '<span class="ee-meta">' + esc(p.region) + "</span>" : "") + "</span>" +
      '<span class="ee-card-extra">' + (p.summary ? '<span class="sr-preview">' + esc(p.summary) + "</span>" : "") + (pas ? '<span class="ee-count">' + esc(pas) + (p.passages.length > 1 ? " · " + p.passages.length + "곳" : "") + "</span>" : "") +
      (tags.length ? '<span class="ee-tags">' + tags.map(function (t) { return '<span class="ee-tag">' + esc(t) + "</span>"; }).join("") + "</span>" : "") + "</span></button></article>";
  }
  // Full Place Profile 가 있으면 공통 본문연구 패널(selectEntity)로, 없으면 같은 색인으로 만든 기본 장소 상세.
  function placeHeroHtml(p) {   // 대표 이미지: Search 카드와 같은 p.media 한 곳을 읽는다. 없으면 같은 규격의 placeholder.
    var m = p.media;
    if (m && mediaGate(m) === "image") return '<figure class="d-hero full-profile-hero" data-part="media" data-media-id="' + esc(m.id) + '" data-media-mode="image"><button type="button" class="hero-open" data-media-lightbox="' + esc(m.id) + '" aria-label="큰 이미지와 출처 보기"><img class="hero-img" src="' + esc(m.preview_url) + '" alt="' + esc(m.alt || m.reader_caption || p.label) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"></button><figcaption><span class="hero-cap">' + esc(m.reader_caption || "") + "</span></figcaption></figure>";
    return '<figure class="d-hero full-profile-hero place-hero-empty" data-part="media" data-media-mode="placeholder"><div class="hero-ph" role="img" aria-label="대표 이미지 없음"><span>대표 이미지 자료 연결 예정</span></div><figcaption><span class="hero-cap is-pending">이미지·위치 설명 자료 연결 예정</span></figcaption></figure>';
  }
  function placeBasicDetailHtml(key, externalP) {
    // Full Place Profile(그랄·브엘세바)와 같은 골격·클래스를 쓴다: 고정 헤더(.entity-sticky-head) → 핵심 정의(.d-hook) → 한눈에 보기(.qf-list) → 대표 이미지(.d-hero) → 상세 정보(.qf-list) → 연구 상태(작은 하단 블록).
    // 자료가 없는 칸은 지우지 않고 상태값("연구 전" 등)으로 같은 자리에 둔다. 연구가 연결되면 같은 슬롯에 값만 채워진다. 없는 정보를 만들어 채우지 않는다.
    var p = externalP || placeIndex().byKey[key]; if (!p) return '<p class="empty helper">장소 정보를 찾을 수 없습니다.</p>';
    var pend = function (t) { return '<span class="is-pending">' + esc(t) + "</span>"; }, val = function (v, t) { return v ? esc(v) : pend(t); };
    var scenes = p.scenes.filter(function (s, i, a) { return a.findIndex(function (x) { return x.topic === s.topic && x.step === s.step; }) === i; });
    var events = scenes.map(function (s) { return s.title; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
    var row = function (l, v) { return '<div class="qf"><dt>' + esc(l) + "</dt><dd>" + v + "</dd></div>"; };
    var people = p.people.join(" · "), evShort = events.slice(0, 3).join(" · ") + (events.length > 3 ? " 외 " + (events.length - 3) + "건" : "");
    var facts = row("유형", val(p.type, "확인 중")) + row("지역", val(p.region, "확인 중")) + row("이름의 뜻", pend("연구 전")) + row("위치", val(p.certainty, "위치 확인 중")) + row("주요 시대", val(p.eras.join(" · "), "연구 전")) + row("주요 인물·사건", val([people, evShort].filter(Boolean).join(" — "), "연구 전"));
    var detail = row("본문 범위", val(p.passages.join(", "), "자료 연결 예정")) + row("주요 인물", val(people, "연구 전")) + row("주요 사건", val(events.join(" · "), "연구 전")) +
      row("여정에서 보기", scenes.length ? '<span class="pc-scenes-inline">' + scenes.map(function (s) { return '<button type="button" class="pill pc-scene" data-place-scene="' + esc(s.topic) + "|" + s.step + '">' + esc((s.track || s.topicTitle) + (s.n ? " " + s.n + "번째 경유지" : "") + " · " + s.title) + "</button>"; }).join("") + "</span>" : pend(/^atlas90:|^levelb:/.test(p.key) ? "여정 연결 연구검토중" : "해당 여정 없음"));
    return '<article class="detail d-flat full-place-profile place-standard" data-detail="l" data-part="place-basic" data-place-key="' + esc(p.key) + '" data-profile-status="PENDING">' +
      '<div class="entity-sticky-head place-sticky-head"><header class="d-identity" data-part="identity"><div class="entity-title-line place-title-line"><h3 class="detail-name">' + esc(p.label) + "</h3>" + (p.en ? '<span class="d-en">' + esc(p.en) + "</span>" : '<span class="d-en is-pending">영문명 확인 중</span>') + "</div>" +
      '<p class="entity-meta-line place-meta-line"><span class="d-original is-pending">원어 표기·발음 자료 연결 예정</span></p></header></div>' +
      '<p class="d-hook" data-part="hook">' + (p.summary ? esc(p.summary) : '<span class="is-pending">핵심 정의 자료 연결 예정</span>') + "</p>" +
      '<section class="d-sec" data-part="facts"><h4 class="d-h">한눈에 보기</h4><dl class="qf-list">' + facts + "</dl></section>" +
      placeHeroHtml(p) +
      '<section class="d-sec" data-part="detail-info"><h4 class="d-h">상세 정보</h4><dl class="qf-list">' + detail + "</dl></section>" +
      (!externalP ? nativePlaceReferenceHtml(p) : '') +
      (atlas90PlaceLookupButton(p) ? '<section class="d-sec" data-part="atlas90-place-term-lookup"><p class="meta">외부사전 표제어 참고 · 기존 장소와 전문 동일성 결속 아님</p>' + atlas90PlaceLookupButton(p) + '</section>' : '') +
      '<footer class="d-status research-status" data-part="research-status"><span class="rs-dot" aria-hidden="true"></span><span><strong>연구 상태</strong> 연구 전 · 상세 연구 자료가 연결되면 이 자리에 채워집니다.</span></footer></article>';
  }
  function openPlaceKey(key) {
    var p = placeIndex().byKey[key]; if (!p) return false; localPersonOpen = null; atlas90Selection = null; levelBSelection = null; atlasBcSelection = null; atlasExpansionSelection = null; readerGeoFocus = null; hidePlaceCard();
    if (p.canonical && p.stableId && STORE.get(p.stableId)) { ui.placeBasic = null; return selectEntityStable(p.stableId); }
    ui.placeBasic = key; ui.rmode = "PLACE"; ui.rsPlace = key; ui.rsStep = false; state.entity = null; ensureContextVisible(); replaceNext = true; render(); return true;
  }
  // 호버 카드(데스크톱): 150–250ms 뒤 열고, 포인터가 떠난 뒤 ~280ms 뒤 닫는다. 카드 위에 있으면 유지. 클릭은 전체 연구 패널. 모바일: 첫 탭 카드, 두 번째 탭(또는 장소연구 보기) 전체.
  var hc = { key: null, openT: 0, closeT: 0, el: null, touch: false };
  var PLACE_ANCHOR = "#map-body [data-nav-place], #map-body g.gm[data-place]";
  function placeKeyOf(a) { return a.dataset.navPlace || a.dataset.place; }
  function hidePlaceCard() { clearTimeout(hc.openT); clearTimeout(hc.closeT); if (hc.el) hc.el.hidden = true; hc.key = null; }
  function showPlaceCard(key, anchor) {
    var p = placeIndex().byKey[key]; if (!p || !anchor || !anchor.isConnected) return;
    if (!hc.el) { hc.el = document.createElement("div"); hc.el.id = "place-hovercard"; document.body.appendChild(hc.el); }
    hc.el.innerHTML = placeCardHtml(p, "map"); hc.el.hidden = false; hc.key = key;
    var r = anchor.getBoundingClientRect(), cw = hc.el.offsetWidth, ch = hc.el.offsetHeight, x = Math.min(window.innerWidth - cw - 8, Math.max(8, r.right - 4)), y = Math.min(window.innerHeight - ch - 8, Math.max(8, r.top - 6));
    if (r.right + cw + 8 > window.innerWidth) x = Math.max(8, r.left - cw + 4);   // 오른쪽에 자리가 없으면 왼쪽으로
    hc.el.style.left = x + "px"; hc.el.style.top = y + "px";
  }
  function placeTap(key, anchor, openFn) {   // 터치: 첫 탭은 카드, 같은 장소 두 번째 탭은 전체
    if (hc.touch && !(hc.key === key && hc.el && !hc.el.hidden)) { showPlaceCard(key, anchor); return true; }
    return openFn ? openFn() : openPlaceKey(key);
  }
  document.addEventListener("pointerdown", function (e) { hc.touch = e.pointerType === "touch" || e.pointerType === "pen"; }, true);
  document.addEventListener("pointerover", function (e) {
    if (hc.touch || !e.target.closest) return; var card = e.target.closest("#place-hovercard"); if (card) { clearTimeout(hc.closeT); return; }
    var a = e.target.closest(PLACE_ANCHOR); if (!a) return; var key = placeKeyOf(a); clearTimeout(hc.closeT); if (hc.key === key && hc.el && !hc.el.hidden) return;
    clearTimeout(hc.openT); hc.openT = setTimeout(function () { showPlaceCard(key, a); }, 200);
  });
  document.addEventListener("pointerout", function (e) {
    if (hc.touch || !e.target.closest) return; if (!e.target.closest(PLACE_ANCHOR + ", #place-hovercard")) return; clearTimeout(hc.openT);
    var to = e.relatedTarget; if (to && to.closest && to.closest("#place-hovercard")) return; if (to && to.closest && to.closest(PLACE_ANCHOR) && placeKeyOf(to.closest(PLACE_ANCHOR)) === hc.key) return;
    clearTimeout(hc.closeT); hc.closeT = setTimeout(hidePlaceCard, 280);
  });
  document.addEventListener("pointerdown", function (e) { if (hc.touch && hc.el && !hc.el.hidden && !e.target.closest("#place-hovercard, " + PLACE_ANCHOR)) hidePlaceCard(); }, true);
  function searchThumbHtml(m, isPlace) {   // 상세 패널과 같은 representative media 를 16:10 으로. 장소는 대표 이미지가 없어도 같은 조용한 16:10 자리표시자를 둔다
    if (mediaGate(m) === "image") return '<img class="ee-thumb" src="' + esc(m.preview_url) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">';
    return isPlace ? '<span class="ee-thumb ee-thumb-ph" role="img" aria-label="대표 이미지 없음"></span>' : "";
  }
  function localPersonReader(name) {
    if (!name) return null;
    return (window.JBC_PERSON_RESEARCH_20261009 || []).find(function(r){return r.name === String(name).trim();}) || null;
  }
  function localPersonResearchHtml(r) {
    if (!r) return "";
    return '<section class="d-sec jbc-person-worbs" data-part="person-worbs-reader" data-professional-status="CANDIDATE_HOLD">' +
      '<h4 class="d-h">인물연구</h4><h5 class="rp-subhead">훑어보기</h5><p class="d-body">'+esc(r.overview)+'</p>'+
      '<h5 class="rp-subhead">살펴보기</h5>'+(r.commentary||[]).map(function(s,i){return '<div class="rp-unit"><strong class="rp-section-title">'+(i+1)+'. '+esc(s.heading)+'</strong><p class="d-body">'+esc(s.body)+'</p></div>';}).join("")+
      '<h5 class="rp-subhead">깊게보기</h5>'+(r.deep||[]).map(function(s){return '<p class="d-body">'+esc(s)+'</p>';}).join("")+'</section>';
  }
  var localPersonOpen = null;
  // Draft-only person cards retain their separate content/provenance, but follow
  // the same Search gesture contract: click = right Detail, dblclick = Scripture research.
  // Navigation refs are explicitly cited in their draft text; these are UX entry defaults,
  // NOT approved primaryPassage, identity bindings, or professional promotion.
  var LOCAL_PERSON_NAV_REF = { "노아": "gen-6:8", "에녹": "gen-5:22" };
  function openLocalPersonPassageResearch(name) {
    var research=localPersonReader(name), ref=research&&LOCAL_PERSON_NAV_REF[research.name], m=ref&&/^([a-z0-9]+-\d+):(\d+)$/.exec(ref);
    if (!m || !D.passages[m[1]] || !hasVerse(m[1],+m[2])) return false;
    localPersonOpen=null; ui.rsStep=false; ui.rsPlace=null; ui.rsPerson=null;
    rsPrepare("TEXT"); ensureContextVisible();
    if (state.view==="explore") closeSearch(true);
    var moved=openRelatedPassage(m[1],+m[2]);
    if (moved) { renderPanel(); panelScrollTop(); }
    return moved;
  }
  document.addEventListener("click", function(ev) {
    var open=ev.target.closest("[data-local-person-research]");
    if (open) {
      ev.preventDefault();
      if (ev.detail>1) return; // second click is owned by the common dblclick transition
      var research=localPersonReader(open.dataset.localPersonResearch);
      if (!research) return;
      localPersonOpen=research.name; state.entity=null;
      ensureContextVisible(); renderPanel(); // Search remains open; right Person Detail updates
      return;
    }
    if (localPersonOpen && ev.target.closest("[data-close-local-person-research]")) {
      ev.preventDefault();localPersonOpen=null;renderPanel();
    }
  });
  function localPersonCardsHtml(q) {
    var entries=(window.JBC_PERSON_RESEARCH_20261009||[]).filter(function(x) {
      return !q || norm(x.name+" "+x.overview).indexOf(norm(q))>=0;
    });
    var META={"노아":{passage:"창세기 5:28–9:29",tags:["홍수 시대"]},"에녹":{passage:"창세기 5:18–24",tags:["셋 계보"]}};   // 상세(localPersonDetailHtml)와 같은 대표 본문·구분
    return entries.map(function(x) {
      var m=META[x.name]||{passage:"",tags:[]}, tags=m.tags.concat(["연구 원고"]);
      if (swState.view !== "card") return '<article class="ee-item ee-list-row" data-origin="research-draft" data-research-id="'+esc(x.name)+'"><button type="button" class="sr-row ee-primary no-media" data-local-person-research="'+esc(x.name)+'">' +
        '<span class="ee-list-name ee-list-name-entity"><span class="ee-list-symbol" aria-hidden="true">♙</span><span class="ee-list-namecopy"><span class="sr-ref">'+esc(x.name)+'</span><span class="ee-list-class">인물</span></span></span>' +
        '<span class="ee-list-desc">'+esc(snip(x.overview))+'</span>' +
        '<span class="ee-list-passage">'+esc(m.passage)+'</span>' +
        '<span class="ee-list-tags">'+tags.map(function(t){return '<span class="ee-tag">'+esc(t)+'</span>';}).join("")+'</span>' +
        '<span class="ee-list-chevron" aria-hidden="true">›</span></button></article>';
      return '<article class="ee-item ee-card" data-origin="research-draft" data-research-id="'+esc(x.name)+'">' +
        '<button type="button" class="sr-row ee-primary no-media" data-local-person-research="'+esc(x.name)+'">' +
        '<span class="ee-copy"><span class="sr-ref">'+esc(x.name)+'<span class="sr-kind">인물</span></span>' +
        '<span class="ee-meta">WORBS 인물연구</span></span>' +
        '<span class="ee-card-extra"><span class="sr-preview">'+esc(snip(x.overview))+'</span>'+(m.passage?'<span class="ee-count">'+esc(m.passage)+'</span>':'')+
        '<span class="ee-tags">'+tags.map(function(t){return '<span class="ee-tag">'+esc(t)+'</span>';}).join("")+'</span></span></button></article>';
    }).join("");
  }
  function localPersonDetailHtml(research) {
    var noah=research.name==="노아";
    var facts=noah?[["부모","라멕"],["자녀","셈 · 함 · 야벳"],["대표 본문","창세기 5:28–9:29"],["핵심 역할","은혜 · 동행 · 방주 · 언약"]]:
      [["부모","야렛"],["자녀","므두셀라"],["대표 본문","창세기 5:18–24"],["구분","셋 계보의 에녹 · 창세기 4장 동명이인과 구별"]];
    var quick=facts.map(function(f){return '<div class="person-fact-row"><dt>'+esc(f[0])+'</dt><dd>'+esc(f[1])+'</dd></div>';}).join("");
    var narrative=(research.commentary||[]).map(function(s,i){return '<details class="person-narrative-section" data-person-narrative="'+(i+1)+'"'+(i===0?' open':'')+'><summary class="person-narrative-summary"><span class="person-narrative-kicker">'+String(i+1).padStart(2,"0")+'</span><span class="person-narrative-heading">'+esc(s.heading)+'</span><span class="person-accordion-arrow" aria-hidden="true"></span></summary><div class="person-narrative-content"><div class="person-story-unit"><p>'+esc(s.body)+'</p></div></div></details>';}).join("");
    var deep=(research.deep||[]).map(function(s){return '<p>'+esc(s)+'</p>';}).join("");
    return '<div class="sw-detail-body sw-detail-single" data-detail-mode="single-scroll">'+
      '<button type="button" class="d-back" data-close-local-person-research>‹ 검색으로 돌아가기</button>'+
      '<article class="detail d-flat" data-detail="p" data-person-research-only="1">'+
      '<header class="d-identity person-reader-head" data-part="identity"><h3 class="detail-name">'+esc(research.name)+'</h3><span class="d-en">'+(noah?'Noah':'Enoch')+'</span><span class="d-original">'+(noah?'נֹחַ · 노아':'חֲנוֹךְ · 하노크')+'</span><p class="d-kind">인물 · '+(noah?'홍수 시대':'셋 계보')+'</p></header>'+
      '<div class="person-reader-flat" data-person-reader="local-research">'+
      '<p class="person-reader-intro">'+esc(research.overview)+'</p>'+
      '<section class="person-overview" data-reader-tier="glance"><h4 class="person-section-title">한눈에 보기</h4><dl class="person-facts-compact">'+quick+'</dl></section>'+
      '<section class="person-narrative" data-reader-tier="commentary"><h4 class="person-section-title">풍성한 기본 주석 · 본문을 깊이 읽기</h4>'+narrative+'</section>'+
      '<details class="person-research" data-person-research data-reader-tier="deep-research"><summary>더 깊은 연구</summary><div class="person-research-body"><section>'+deep+'</section></div></details>'+
      '</div></article></div>';
  }
  function entityItemHtml(e, q) {
    var card = swState.view === "card", m = e.representative_media, image = card ? searchThumbHtml(m, e.kind === "l") : "";
    var selected = state.entity && stableOf(state.entity.kind, state.entity.id) === e.stable_id;
    var label = q ? markedHtml(e.display_label, markRanges(e.display_label, q), 0, e.display_label.length) : esc(e.display_label), meta = entityMeta(e), summary = discoverySummary(e), passage = discoveryPassage(e), tags = discoveryTags(e), typ = discoveryTypeLabel(e);
    var localStudy = e.kind === "p" ? localPersonReader(e.display_label) : null;
    if (localStudy && localStudy.name === "에녹" && !/5[:장]|창세기 5|Gen(?:esis)?\\s*5/i.test(passage || "")) localStudy = null;
    var tagHtml = tags.length ? '<span class="ee-tags">' + tags.map(function (t) { return '<span class="ee-tag">' + esc(t) + "</span>"; }).join("") + "</span>" : "";
    if (!card) return '<article class="ee-item ee-list-row' + (selected ? " is-selected" : "") + '" data-entity-id="' + esc(e.stable_id) + '" data-origin="' + esc(e.provenance.origin) + '"><button type="button" class="sr-row ee-primary no-media" data-search="1" data-kind="' + e.kind + '" data-id="' + esc(e.compatibility_key) + '" data-stable-id="' + esc(e.stable_id) + '"' + (selected ? ' aria-current="true"' : "") + '>' +
      '<span class="ee-list-name ee-list-name-entity"><span class="ee-list-symbol" aria-hidden="true">' + (e.kind === "p" ? "♙" : "•") + '</span><span class="ee-list-namecopy"><span class="sr-ref">' + label + '</span><span class="ee-list-class">' + esc(typ) + "</span></span></span>" +
      '<span class="ee-list-desc">' + esc(summary || meta || "") + "</span>" +
      '<span class="ee-list-passage">' + esc(passage || "") + "</span>" +
      '<span class="ee-list-tags">' + (tags.length ? tags.map(function (t) { return '<span class="ee-tag">' + esc(t) + "</span>"; }).join("") : "") + "</span>" +
      '<span class="ee-list-chevron" aria-hidden="true">›</span></button></article>';
    var head = '<span class="ee-copy"><span class="sr-ref">' + label + '<span class="sr-kind">' + esc(typ) + '</span></span>' + (meta ? '<span class="ee-meta">' + esc(meta) + '</span>' : "") + "</span>";
    var extra = (summary || passage || tagHtml) ? '<span class="ee-card-extra">' + (summary ? '<span class="sr-preview">' + esc(summary) + '</span>' : "") + (passage ? '<span class="ee-count">' + esc(passage) + "</span>" : "") + tagHtml + "</span>" : "";
    if (localStudy) extra += '<span class="ee-card-extra"><span class="ee-tag">인물연구</span></span>';
    return '<article class="ee-item ee-card' + (selected ? " is-selected" : "") + '" data-entity-id="' + esc(e.stable_id) + '" data-origin="' + esc(e.provenance.origin) + '"><button type="button" class="sr-row ee-primary ' + (image ? "has-media" : "no-media") + '" data-search="1" data-kind="' + e.kind + '" data-id="' + esc(e.compatibility_key) + '" data-stable-id="' + esc(e.stable_id) + '"' + (selected ? ' aria-current="true"' : "") + '>' + image + head + extra + "</button></article>";
  }
  function exploreMapEntities(entities) {
    if (swState.mode === "place") return entities.filter(function (e) { return e.entity_type === "Place"; });
    var seen = {}, out = [];
    entities.forEach(function (e) { boundRelations(e.stable_id).forEach(function (x) { var n = STORE.get(x.sid); if (n && n.entity_type === "Place" && !seen[n.stable_id]) { seen[n.stable_id] = 1; out.push(n); } }); });
    return out;
  }
  function exploreMapMarkers(entities) {
    var out = [];
    exploreMapEntities(entities).forEach(function (e) {
      var S = spatialOf(e.compatibility_key); if (!S) return;
      var pc = S.primary && S.primary.coordinates, pm = pc && markerSpec({ lat: pc.lat, lon: pc.lon, role: "biblical_place", status: S.certainty && S.certainty.reader_location_status });
      if (pc && pm && pm.render) out.push({ e: e, lat: pc.lat, lon: pc.lon, style: pm.style, label: e.display_label });
      else (S.sites || []).some(function (c) { var sp = markerSpec({ lat: c.lat, lon: c.lon, role: c.role, status: c.coordinate_status }); if (!sp.render || c.role === "modern_context") return false; out.push({ e: e, lat: c.lat, lon: c.lon, style: sp.style, label: e.display_label }); return true; });
    });
    return out;
  }
  function updateEntityFilterOptions() {
    var all = STORE.list().filter(function (e) { return swModeAccepts(e, swState.mode); });
    function fill(id, key, currentKey, opt) {
      opt=opt||{}; var el=$(id); if(!el) return; var vals=[];
      all.forEach(function(e){ var x=e[key]; (Array.isArray(x)?x:[x]).filter(Boolean).forEach(function(v){if(vals.indexOf(v)<0) vals.push(v);}); });
      vals.sort(function(a,b){return String(a).localeCompare(String(b),"ko");});
      if(opt.order){ var extras=vals.filter(function(v){return opt.order.indexOf(v)<0;}); vals=opt.order.concat(extras); }
      var counts={}; all.forEach(function(e){ var x=e[key]; (Array.isArray(x)?x:[x]).filter(Boolean).forEach(function(v){counts[v]=(counts[v]||0)+1;}); });
      var live=vals.filter(function(v){return !!counts[v];}), show=opt.order?vals:live, allLabel=opt.allLabel||"전체";
      el.innerHTML='<option value="all">'+allLabel+'</option>'+show.map(function(v){var n=counts[v]||0, disabled=opt.order&&!n?' disabled':'';return '<option value="'+esc(v)+'"'+disabled+'>'+esc(v)+(opt.count&&n?' ('+n+')':'')+'</option>';}).join("")+(show.length?"":'<option value="" disabled>'+esc(opt.emptyLabel||"등록된 항목 없음")+'</option>');
      var cur=swState[currentKey]; if(live.indexOf(cur)<0) cur=swState[currentKey]="all"; el.value=cur; var wrap=el.closest(".sw-block, .sw-select"); if(wrap && id!=="sw-period" && id!=="sw-region" && id!=="sw-story" && id!=="sw-journey") wrap.hidden = live.length===0 || (wrap.hasAttribute("data-sw-place") && swState.mode!=="place") || (wrap.hasAttribute("data-sw-person") && swState.mode!=="person");
    }
    fill("sw-period","period","period",{allLabel:"전체 시대",order:SW_PERIOD_ORDER,count:true}); fill("sw-region","region","region"); fill("sw-story","story","story",{allLabel:"전체 이야기",count:true,emptyLabel:"등록된 이야기 없음"}); fill("sw-journey","journeys","journey",{allLabel:"전체 여정",count:true,emptyLabel:"등록된 여정 없음"});
    if(swState.mode==="place") fill("sw-place-type","reader_type","placeType"); else if(swState.mode==="person") fill("sw-role","role","role");
    var loc=$("sw-location"); if(loc){ var vals=["VERIFIED","LIKELY","PLAUSIBLE","VERIFY","DISPUTED","UNKNOWN"].filter(function(v){return all.some(function(e){return e.reader_location_status===v;});}), names={VERIFIED:"확인된 위치",LIKELY:"유력한 위치",PLAUSIBLE:"가능성 있는 위치",VERIFY:"추정지",DISPUTED:"여러 후보지",UNKNOWN:"위치 미상"}; loc.innerHTML='<option value="all">전체</option>'+vals.map(function(v){return '<option value="'+v+'">'+names[v]+'</option>';}).join(""); if(vals.indexOf(swState.location)<0) swState.location="all"; loc.value=swState.location; }
    if ($("sw-sort")) $("sw-sort").value = swState.sort;
  }
  function renderSearch() {
    if (swState.q && swState.q.trim() && eastonLoadState==="IDLE") ensureEastonCandidate();
    var el=$("search-results"), sum=$("sw-summary"), more=$("sw-more"), q=swState.q, mode=swState.mode, hasQ=!!norm(q), R, refErr=null, entList=[];
    if(!el) return; updateEntityFilterOptions(); syncSwFilters(); if (swState.view !== "card" && swState.view !== "list") swState.view = "card"; el.dataset.entityView=swState.view;
    try {
      var pr=hasQ?parseReference(q):null; refErr=pr&&pr.error;
      var entOpts=swOptions(); entOpts.kind="entity";
      R=unifiedSearch(q,{mode:mode,testament:swState.testament,entity:entOpts,limit:{verse:swState.limit}});
      // 검색어가 없으면 기존 탐색(인물·장소 목록)을 그대로 보여 준다
      if(!hasQ){ ["person","place","region","event","route"].forEach(function(g){ if(mode==="all"||mode===g){ R.groups[g]=entitySet("",extend(entOpts,{type:g})); R.counts[g]=R.groups[g].length; } }); }
      if(mode==="all"||mode==="place"){ var pl=placeIndexSet(q,entOpts); R.groups.place=pl; R.counts.place=pl.length; }   // 장소는 공통 PLACE_INDEX(지도에 있는 모든 장소 포함)에서
    } catch(e){ el.innerHTML='<p class="degraded">검색을 사용할 수 없습니다.</p>'; return; }
    // Level A joins the SAME Place search result grid, not a separate dictionary section.
    if (mode === 'all' || mode === 'place') {
      var aQuery = String(q || '').trim().toLocaleLowerCase();
      // One visible card per place in search. Keep reference datasets untouched.
      var normalizePlaceName=function(x){return String(x||'').trim().toLocaleLowerCase().replace(/[^a-z0-9가-힣]/g,'');};
      // Existing place aliases must win even when search was typed in English.
      // Only exact reference headword matches qualify; no substring identity inference.
      if(aQuery && /^[a-z][a-z .'-]*$/.test(aQuery)){
        var matchesExisting=placeIndex().list.filter(function(p){
          var name=normalizePlaceName(aQuery), key=normalizePlaceName(p.key), en=normalizePlaceName(p.en);
          if(name===key || (en&&name===en))return true;
          var aLinked=(window.JBC_ATLAS90_KOREAN_REFERENCE||[]).some(function(a){
            var cross=(window.JBC_ATLAS90_READER_CROSSWALK||{})[a.place_id];
            return cross&&cross.place_key===p.key&&normalizePlaceName(a.name_en)===name;
          });
          return aLinked || LEVEL_B_87.some(function(a){return normalizePlaceName(a.name_en)===name && levelBExistingPlace(a)===p;});
        });
        matchesExisting.forEach(function(p){
          if(!R.groups.place.some(function(x){return x.key===p.key;}))R.groups.place.push(p);
        });
      }
      var seenPlaceNames={};
      var addVisiblePlace=function(p){
        [p.key,p.label,p.en].forEach(function(v){var n=normalizePlaceName(v);if(n)seenPlaceNames[n]=true;});
      };
      R.groups.place.forEach(addVisiblePlace);
      var addedAtlas = (window.JBC_ATLAS90_KOREAN_REFERENCE || []).filter(function(a){
        var cross=(window.JBC_ATLAS90_READER_CROSSWALK||{})[a.place_id];
        var linked=cross&&cross.place_key;
        return !(linked&&seenPlaceNames[normalizePlaceName(linked)]) &&
          !seenPlaceNames[normalizePlaceName(a.name_ko)] &&
          !seenPlaceNames[normalizePlaceName(a.name_en)] &&
          (!aQuery || [a.name_ko || '', a.name_en || '', a.source_key || ''].some(function(v){
            return String(v).toLocaleLowerCase().indexOf(aQuery) >= 0;
          }));
      }).map(atlas90PlaceProjection);
      addedAtlas.forEach(addVisiblePlace);
      var addedB=LEVEL_B_87.filter(function(a){
        return !seenPlaceNames[normalizePlaceName(a.name_ko)] &&
          !seenPlaceNames[normalizePlaceName(a.name_en)] &&
          (!aQuery || [a.name_ko||'',a.name_en||''].some(function(v){return String(v).toLocaleLowerCase().indexOf(aQuery)>=0;}));
      }).map(levelBProjection);
      R.groups.place = R.groups.place.concat(addedAtlas,addedB);
      R.counts.place = R.groups.place.length;
    }
    var SEC={person:"인물",place:"장소",region:"지역",event:"사건",route:"경로"}, html=refErr?'<p class="empty helper" data-ref-error="1">'+esc(refErr)+'</p>':"", total=0, parts=[];
    function listHead(g){ if(swState.view!=="list") return ""; var name=g==="place"?"이름 · 분류":"이름"; return '<div class="ee-list-head" data-kind="'+g+'"><span>'+name+'</span><span>설명</span><span>주요 성경 구절</span><span>관련 태그</span><span aria-hidden="true"></span></div>'; }
    ["person","place","region","event","route"].forEach(function(g){
      var list=R.groups[g], draftHtml=g==="person"&&(mode==="all"||mode==="person")?localPersonCardsHtml(q):"";
      var draftCount=(draftHtml.match(/data-local-person-research=/g)||[]).length;
      entList=entList.concat(list); total+=list.length+draftCount; if(mode==="all"&&(list.length+draftCount)) parts.push(SEC[g]+" "+(list.length+draftCount));
      if(list.length || draftCount) html += '<section class="sw-sec" data-sw-sec="'+g+'">' +(mode==="all"?'<h3 class="sec-h">'+SEC[g]+' <span class="sw-sec-n">'+(list.length+draftCount)+'</span></h3>':"")+listHead(g)+'<div class="ee-set" data-view="'+swState.view+'">'+list.map(function(e){return g==="place" && e.key.indexOf("levelb:")===0 ? levelBCard(LEVEL_B_87.filter(function(a){return "levelb:"+a.candidate_id===e.key;})[0],q) : g==="place" && e.key.indexOf("atlas90:")===0 ? atlas90SharedCard((window.JBC_ATLAS90_KOREAN_REFERENCE || []).filter(function(a){return "atlas90:" + a.place_id === e.key;})[0],q) : g==="place"?placeCardHtml(e,"search",{q:q}):entityItemHtml(e,q);}).join("")+draftHtml+'</div></section>';
    });
    if(R.groups.research.length){ total+=R.groups.research.length; parts.push("연구 "+R.groups.research.length); html += '<section class="ctx-search-results sw-sec" data-sw-sec="research" data-part="contextual-research-search"><h3 class="sec-h">연결 연구'+(mode==="all"?' <span class="sw-sec-n">'+R.groups.research.length+'</span>':"")+'</h3><div class="ee-set">'+contextualSearchHtml(q)+'</div></section>'; }
    if(R.groups.verse.length){ total+=R.counts.verse; parts.unshift("본문 "+R.counts.verse); html += '<section class="sw-sec" data-sw-sec="verse">'+(mode==="all"?'<h3 class="sec-h">본문 <span class="sw-sec-n">'+R.counts.verse+'</span></h3>':"")+'<div class="sw-verses">'+R.groups.verse.map(function(x){return rowHtml(x,q);}).join("")+'</div></section>'; }
    if ((mode==="all" || mode==="research") && hasQ) {
      var dh=eastonHits(q);
      if(dh.length){total+=dh.length;parts.push("외부 사전 "+dh.length);html+='<section class="sw-sec" data-sw-sec="external-dictionary"><h3 class="sec-h">외부 성경사전 · Easton <span class="sw-sec-n">'+dh.length+'</span></h3>'+eastonSearchHtml(q)+'</section>';}
    }
    // B/C candidate data is retained as REFERENCE_ONLY. Do not show a second,
    // noncanonical place card design beside the shared PlaceCard results.
    // Only a verified place-index identity may enter the existing place flow.
    // Expanded Easton discovery remains in data; standalone search UI disabled
    // until resolved through the shared place index and card/detail pipeline.
    if(!total && !refErr){
      var NOTE={event:"사건",route:"경로",research:"연구",verse:"본문",person:"인물",place:"장소",region:"지역"};
      html += '<p class="empty helper" data-sw-empty="'+mode+'">'+(!hasQ&&mode==="verse"?'검색어를 입력하면 KRV 전체 본문에서 찾습니다.':(mode==="event"||mode==="route")&&!hasQ?'아직 등록된 '+NOTE[mode]+' 데이터가 없습니다. 데이터가 추가되면 이곳에 표시됩니다.':hasQ?(mode==="all"?'“'+esc(q.trim())+'”에 대한 검색 결과가 없습니다.':'“'+esc(q.trim())+'”에 대한 '+NOTE[mode]+' 결과가 없습니다.'):'검색어를 입력하세요.')+'</p>';
    }
    el.innerHTML=html;
    if(sum) sum.textContent=(hasQ?'“'+q.trim()+'” · ':"")+(mode==="all"?(parts.length?parts.join(" · "):"결과 0건"):(mode==="person"?total:(R.counts[mode]!=null?R.counts[mode]:0))+"건");
    if(more){ more.hidden=!(R.groups.verse.length && R.counts.verse>R.groups.verse.length); }
  }
  function placeSearch() {}
  function openSearch(q) {
    if (typeof q === "string" ? !!q.trim() : !!swState.q.trim()) ensureEastonCandidate();
    if (ui.nav && ui.nav.board) navBoardOpen(false);
    if (typeof q === "string") swState.q = q;
    if (state.view !== "explore") { swState.prevPanel = state.panel; if (!isMobile()) state.panel = "open"; state.view = "explore"; replaceNext = true; render(); }
    swState.open = true;
    var w = $("search-workspace"); if (w) { w.hidden = false; w.dataset.ready = "1"; }
    var sq = $("sw-query"); if (sq) { sq.value = swState.q; }
    var hs = $("search"); if (hs && hs.value !== swState.q) hs.value = swState.q;
    renderSearch(); restoreExploreScroll();
    if (sq && document.activeElement !== sq) { try { sq.focus({ preventScroll: true }); } catch (e) { sq.focus(); } }
  }
  function closeSearch(navigated) {
    if (state.view !== "explore") { swState.open = false; var w0 = $("search-workspace"); if (w0) w0.hidden = true; return; }
    rememberExploreScroll(); swState.open = false; state.view = "study"; if (swState.prevPanel !== null) { state.panel = swState.prevPanel; swState.prevPanel = null; } replaceNext = true; render();
    var w = $("search-workspace"); if (w) w.hidden = true;
    if (!navigated) { var rs = $("rail-search"); if (rs) { try { rs.focus({ preventScroll: true }); } catch (e) { rs.focus(); } } }
  }
  function toggleSearch() { if (state.view === "explore") closeSearch(); else openSearch(null); }
  // 선택 표식만 바꾼다: 결과 목록 DOM·스크롤·검색어는 그대로.
  function markExploreSelection() {
    var box = $("search-results"); if (!box || !swState.open) return; var sid = state.entity ? stableOf(state.entity.kind, state.entity.id) : null, placeKey = ui.placeBasic || null;
    [].forEach.call(box.querySelectorAll(".ee-primary[data-stable-id], .ee-primary[data-place-open]"), function (el) { var on = (!!sid && el.dataset.stableId === sid) || (!!placeKey && el.dataset.placeOpen === placeKey), card = el.closest("[data-entity-id]"); if (card) card.classList.toggle("is-selected", on); el.setAttribute("aria-selected", String(on)); if (on) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current"); });
  }
  function passageLabel(r) { var pid = r.book + "-" + r.chapter, P = D.passages[pid]; return (P ? P.ref : pid) + (r.verse ? " " + r.verse + "절" : ""); }
  // 선택한 대상의 관련 본문(+ 인물이면 묶여 있는 장소). 본문을 누르면 선택 대상·지도·히스토리를 유지한 채 읽기 위치만 옮긴다.
  function renderRelated(sid) {
    var box = $("sp-related"); if (!box) return;
    var e = sid && STORE.get(sid); if (!e) { box.hidden = true; box.innerHTML = ""; return; }
    var refs = e.passage_refs.slice().sort(function (a, b) { return passageRank(a) - passageRank(b); }), html = '<p class="sp-rh"><strong>' + esc(e.display_label) + "</strong> · 관련 본문 " + refs.length + "</p>";
    html += refs.length ? '<ul class="sp-passages">' + refs.slice(0, 24).map(function (r) { var pid = r.book + "-" + r.chapter; return '<li><button type="button" class="pill" data-sp-passage="' + esc(pid + ":" + (r.verse || "")) + '"' + (pid === state.passage ? ' aria-current="true"' : "") + ">" + esc(passageLabel(r)) + "</button></li>"; }).join("") + "</ul>" : '<p class="sp-note">이 대상과 연결된 본문이 아직 없습니다.</p>';
    if (e.entity_type === "Person") {
      var pl = boundRelations(sid).map(function (x) { return STORE.get(x.sid); }).filter(function (n) { return n && n.entity_type === "Place"; });
      if (pl.length) html += '<p class="sp-rh">연결된 장소</p><ul class="sp-passages">' + pl.map(function (n) { return '<li><button type="button" class="pill" data-sp-entity="' + esc(n.stable_id) + '">' + esc(n.display_label) + "</button></li>"; }).join("") + "</ul>";
    } else if (e.entity_type === "Place") {
      var hasPoint = geoMarkers().some(function (m) { return m.place === e.compatibility_key; });
      if (!hasPoint && D.places[e.compatibility_key]) html += '<p class="sp-note" data-no-spatial="1">' + esc(unlocatedNote(e.compatibility_key)) + "</p>";
    } else html += '<p class="sp-note" data-no-spatial="1">' + esc(e.display_label) + " — 승인된 지도 범위가 없어 지도에 표시하지 않습니다.</p>";
    box.innerHTML = html; box.hidden = false;
  }
  // 대상 선택 → Detail 갱신 + (승인된 표식이 있을 때만) 지도 이동. 본문·스크롤·레이어·필기는 건드리지 않는다.
  function jumpToEntity(sid) {
    var e = STORE.get(sid), id = e && e.compatibility_key; if (!e || !id) return false;
    atlas90Selection = null; levelBSelection = null; atlasBcSelection = null; atlasExpansionSelection = null;
    if (e.entity_type === "Region" && e.raw && e.raw.authority && e.raw.authority.approval === "CAPTAIN_APPROVED") showRefError("");
    entryCams[entryKey(location.hash)] = ui.gcam ? Object.assign({}, ui.gcam) : null;   // 뒤로 가기가 이전 지도 위치로 돌려놓는다
    var same = state.entity && state.entity.kind === e.kind && state.entity.id === id;
    if (!same) { swState.detailTab = "overview"; if (!state.entity) state.prevTab = state.tab; state.entity = { kind: e.kind, id: id }; state.tab = e.kind === "p" ? "people" : e.kind === "l" || e.kind === "rgn" ? "places" : "context"; }   // 같은 대상을 다시 골라도 닫지 않는다
    ensureContextVisible();
    if (e.kind === "l") { var mk = geoMarkers().filter(function (m) { return m.place === id; }); if (mk.length) { ui.gcam = geoFit(mk); ui.mapOpen = true; } }
    if (e.kind === "rgn" || e.kind === "rt") focusRegionReading(e.kind, id);   // 좌표가 없으면 지도는 그대로(가짜 위치 없음)
    render(); panelScrollTop(); renderRelated(sid);
    return true;
  }
  function openSearchResult(kind, id, sid) {
    if (kind === "v") { var k = parseKey(id); closeSearch(true); go(k.passage, k.verse); return; }   // 본문으로 가는 명시적 이동
    if (kind === "r") { var rk = id.split(":"); closeSearch(true); go(rk[0], rk[1] ? +rk[1] : null); return; }
    jumpToEntity(sid || stableOf(kind, id));
  }
  function explorerAction(action, sid) {
    var e = STORE.get(sid); if (!e || !jumpToEntity(sid)) return false;
    if (action === "scripture") {
      var target = e.passage_refs.slice().sort(function (a, b) { return passageRank(a) - passageRank(b); })[0];
      closeSearch(true); if (target) openRelatedPassage(target.book + "-" + target.chapter, target.verse);
    } else if (action === "map" && e.entity_type === "Place") { closeSearch(true); ui.mapOpen = true; render(); }
    return true;
  }
  function searchRows() { return [].slice.call(document.querySelectorAll("#search-results [data-search='1']")); }
  // 공통 검색 카드 상호작용 계약: 한 번 클릭 = 대상 상세. 더블클릭은 장소/인물이면 해당 Entity Research를 열고 Scripture·주제탐색·지도를 같은 맥락으로 동기화한다.
  // 본문 결정: 유효한 entity.primaryPassage → 명시적 Search 본문 문맥 → 기존 결정적 passageRank/Place Index fallback. 본문을 만들거나 추정하지 않는다.
  // Event(evt)·Region(rgn)·Route(rt)는 아직 Entity Research 모드가 없으므로 기존 Passage Research 계약을 유지한다. Route 는 정경 엔티티를 만들지 않는다:
  // 엔티티 연결 본문이 없으면 기존 presentation-only 경로 바인딩(JBC_PRESENTATION_ROUTES.passages)만 읽고, 그것도 없으면 더블클릭은 비활성이다.
  var CARD_PASSAGE_KINDS = { l: 1, p: 1, rgn: 1, evt: 1, rt: 1 };
  function pidRank(pid) { var k = String(pid).split("-"); return passageRank({ book: k[0], chapter: +k[1] || 0, verse: 0 }); }
  function passageRefContains(r, pid, verse) {
    if (!r || r.book + "-" + r.chapter !== pid) return false;
    if (verse == null || r.verse == null) return true;
    return verse >= r.verse && verse <= (r.verse_end == null ? r.verse : r.verse_end);
  }
  function validEntityPrimaryPassage(e) {
    var p = e && passageRefOf(e.primaryPassage); if (!p) return null;
    var pid = p.book + "-" + p.chapter, verse = p.verse;
    if (!D.passages[pid] || verse != null && !hasVerse(pid, verse)) return null;
    if (!(e.passage_refs || []).some(function (r) { return passageRefContains(r, pid, verse); })) return null;
    return { pid: pid, verse: verse };
  }
  function searchContextPassage(row, e) {
    var ref = parseReference(swState.q); if (!ref || ref.error || !ref.passage || !D.passages[ref.passage]) return null;
    if (e && (e.passage_refs || []).some(function (r) { return passageRefContains(r, ref.passage, ref.verse); })) return { pid: ref.passage, verse: ref.verse };
    if (row.dataset.kind === "l") { var p = placeIndex().byKey[row.dataset.id]; if (p && p.passageIds && p.passageIds.indexOf(ref.passage) >= 0) return { pid: ref.passage, verse: ref.verse }; }
    return null;
  }
  function cardPassage(row) {
    var kind = row.dataset.kind; if (!CARD_PASSAGE_KINDS[kind]) return null;
    var sid = row.dataset.stableId, e = sid && STORE.get(sid), t = validEntityPrimaryPassage(e) || searchContextPassage(row, e);
    if (!t && e && e.passage_refs && e.passage_refs.length) { var r = e.passage_refs.slice().sort(function (a, b) { return passageRank(a) - passageRank(b); })[0]; t = { pid: r.book + "-" + r.chapter, verse: r.verse || null }; }
    else if (!t && kind === "l") { var p = placeIndex().byKey[row.dataset.id]; if (p && p.passageIds && p.passageIds.length) t = { pid: p.passageIds[0], verse: null }; }
    else if (!t && kind === "rt") { var ps = Object.prototype.hasOwnProperty.call(PRESENTATION_ROUTE_SPECS, row.dataset.id) && PRESENTATION_ROUTE_SPECS[row.dataset.id]; if (ps && ps.passages && ps.passages.length) t = { pid: ps.passages.slice().sort(function (a, b) { return pidRank(a) - pidRank(b); })[0], verse: null }; }
    if (!t || !D.passages[t.pid]) return null;
    if (t.verse != null && !hasVerse(t.pid, t.verse)) t.verse = null;
    return t;
  }
  function stepContainsPassage(s, t) {
    if (!s || !t) return false;
    if (s.range && s.range.pid === t.pid && (t.verse == null || (t.verse >= s.range.v1 && t.verse <= s.range.v2))) return true;
    return (s.refs || []).some(function (r) { return r && r.pid === t.pid && (t.verse == null || r.verse == null || r.verse === t.verse); });
  }
  function stepContainsPerson(s, id) {
    if (!s || !id) return false;
    var spans = s.range ? [{ pid: s.range.pid, v1: s.range.v1, v2: s.range.v2 }] : (s.refs || []).map(function (r) { return { pid: r.pid, v1: r.verse || 1, v2: r.verse || (D.passages[r.pid] ? D.passages[r.pid].verses.length : 0) }; });
    return spans.some(function (r) {
      var P = D.passages[r.pid]; if (!P) return false;
      for (var n = r.v1; n <= r.v2; n++) { var v = P.verses[n - 1]; if (v && entitiesAt(r.pid, n, v.text).p.indexOf(id) >= 0) return true; }
      return false;
    });
  }
  function searchEntityNavTarget(kind, key, t) {
    var best = null, cur = ui.nav && ui.nav.topic;
    function consider(topic, step, score) { if (!best || score > best.score) best = { topic: topic, step: step, score: score }; }
    if (kind === "l") {
      var p = placeIndex().byKey[key], scenes = p && p.scenes || [];
      scenes.forEach(function (sc) {
        var tp = navTopicById(sc.topic), s = tp && tp.steps[sc.step]; if (!s) return;
        var score = (sc.topic === cur ? 4 : 0) + (stepContainsPassage(s, t) ? 8 : 0) + (sc.primary ? 1 : 0);
        consider(sc.topic, sc.step, score);
      });
    } else if (kind === "p") {
      navCategories().forEach(function (cat) { cat.topics.forEach(function (tp) { tp.steps.forEach(function (s, i) {
        if (!stepContainsPerson(s, key)) return;
        var score = (tp.id === cur ? 4 : 0) + (stepContainsPassage(s, t) ? 8 : 0);
        consider(tp.id, i, score);
      }); }); });
    }
    return best;
  }
  function syncPersonMapContext(sid, t) {
    if (!sid || !t) return false;
    var places = boundRelations(sid).map(function (x) { return STORE.get(x.sid); }).filter(function (n) {
      return n && n.entity_type === "Place" && (n.passage_refs || []).some(function (r) { return passageRefContains(r, t.pid, t.verse); });
    });
    var keys = places.map(function (n) { return n.compatibility_key; }), mk = geoMarkers().filter(function (m) { return keys.indexOf(m.place) >= 0; });
    if (!mk.length) return false;
    ui.gcam = geoFit(mk); ui.mapOpen = true; return true;
  }
  function openCardPassageResearch(row) {
    var kind = row.dataset.kind, sid = row.dataset.stableId, e = sid && STORE.get(sid), key = e ? e.compatibility_key : row.dataset.id, t = cardPassage(row);
    var entityResearch = (kind === "l" && !!(e || placeIndex().byKey[key])) || ((kind === "p" || kind === "rgn") && !!e);
    if (!t && !entityResearch) return false;
    if (kind === "rgn" && e) {
      if (state.view === "explore") closeSearch(true);
      if (t && !openRelatedPassage(t.pid, t.verse)) return false;
      ui.rmode = null; ui.rsPlace = null; ui.rsStep = false;
      return jumpToEntity(sid);
    }
    if (state.view === "explore") closeSearch(true);

    ui.rsStep = false;
    if (kind === "l") { ui.rsPlace = key; ui.rmode = "PLACE"; }
    else if (kind === "p") { ui.rsPlace = null; ui.rsPerson = key; ui.rsPersonLabel = e ? e.display_label : ""; ui.rmode = "PERSON"; }
    else { ui.rsPlace = null; ui.rmode = "TEXT"; }
    ensureContextVisible();

    var nt = entityResearch ? searchEntityNavTarget(kind, key, t) : null;
    if (nt) { ui.nav.topic = nt.topic; ui.nav.base = null; ui.nav.researchOpen = true; navApplyStep(nt.step); }
    if (t && !openRelatedPassage(t.pid, t.verse)) return false;

    if (kind === "l") {
      rsPrepare("PLACE");
      var mk = geoMarkers().filter(function (m) { return m.place === key; });
      if (mk.length) { ui.gcam = geoFit(mk); ui.mapOpen = true; }
    } else if (kind === "p") {
      rsPrepare("PERSON");
      syncPersonMapContext(sid, t);
    } else rsPrepare("TEXT");

    ensureContextVisible(); render(); panelScrollTop(); return true;
  }
  function openPlacePassageStudy(key, sid) {
    var p = placeIndex().byKey[key], e = sid && STORE.get(sid), t = validEntityPrimaryPassage(e);
    if (!t && e && e.passage_refs && e.passage_refs.length) { var r = e.passage_refs.slice().sort(function (a, b) { return passageRank(a) - passageRank(b); })[0]; t = { pid: r.book + "-" + r.chapter, verse: r.verse || null }; }
    if (!t && p && p.passageIds && p.passageIds.length) t = { pid: p.passageIds[0], verse: null };
    if (!t || !D.passages[t.pid]) return false;
    if (state.view === "explore") closeSearch(true);
    if (!openRelatedPassage(t.pid, t.verse)) return false;
    ui.rsPlace = key; ui.rsStep = false; rsPrepare("PLACE"); ensureContextVisible();
    var mk = geoMarkers().filter(function (m) { return m.place === key; }); if (mk.length) { ui.gcam = geoFit(mk); ui.mapOpen = true; }
    render(); panelScrollTop(); return true;
  }

  // ---------- events ----------
  function fire(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  document.addEventListener("dblclick", function (e) {
    var localRow=e.target && e.target.closest && e.target.closest('#search-results [data-local-person-research]');
    if (localRow) { e.preventDefault(); e.stopPropagation(); return openLocalPersonPassageResearch(localRow.dataset.localPersonResearch); }
    var lbRow=e.target && e.target.closest && e.target.closest('#search-results [data-levelb-search="1"]');
    if(lbRow){e.preventDefault();e.stopPropagation();var b=LEVEL_B_87.filter(function(x){return x.candidate_id===lbRow.dataset.levelbOpen;})[0];if(!b)return;atlas90Selection=null;atlasBcSelection=null;atlasExpansionSelection=null;
      var ref=levelBRefs(b).filter(function(c){var m=/^([a-z0-9]+-\d+):(\d+)$/.exec(c.ref||'');return m&&D.passages[m[1]]&&hasVerse(m[1],+m[2]);})[0];
      if(ref){var m=/^([a-z0-9]+-\d+):(\d+)$/.exec(ref.ref);levelBSelection=null;if(state.view==='explore')closeSearch(true);openRelatedPassage(m[1],+m[2]);levelBSelection=b.candidate_id;renderPanel();}
      else {if(state.view==='explore')closeSearch(true);levelBSelection=b.candidate_id;renderPanel();}return;
    }
    var atlasRow = e.target && e.target.closest && e.target.closest('#search-results [data-atlas90-search="1"]');
    if (atlasRow) {
      e.preventDefault(); e.stopPropagation();
      var aid = atlasRow.dataset.atlas90Open;
      var a = ATLAS90_REF.filter(function(v){return v.place_id===aid;})[0];
      if (!a) return;
      var bnd = (window.JBC_ATLAS90_READER_CROSSWALK || {})[aid];
      if (bnd && placeIndex().byKey[bnd.place_key]) {
        atlas90Selection = null;
        return openPlacePassageStudy(bnd.place_key, placeIndex().byKey[bnd.place_key].stableId);
      }
      // For an unbound Level A place, navigate to its existing cited verse.
      // Citation is a reader navigation default, not professional identity approval.
      var evidence = (window.JBC_ATLAS90_SCRIPTURE_EVIDENCE || {})[aid];
      var candidates = evidence && evidence.source_citation_candidates || [];
      var firstRef = candidates.filter(function(c){return c.exact_korean_token;}).concat(candidates).map(function(c){return /^([a-z0-9]+-\d+):(\d+)$/.exec(c.ref || '');}).filter(function(m){return m && D.passages[m[1]] && hasVerse(m[1], +m[2]);})[0];
      if (firstRef) {
        atlas90Selection = null;
        if (state.view === 'explore') closeSearch(true);
        openRelatedPassage(firstRef[1], +firstRef[2]);
        atlas90Selection = aid;
        renderPanel();
        return;
      }
      atlas90Selection = aid;
      if (state.view === 'explore') closeSearch(true);
      else render();
      ensureContextVisible(); renderPanel();
      return;
    }
    var el = e.target && e.target.closest && e.target.closest('#search-results [data-search="1"]'); if (!el) return;
    var kind = el.dataset.kind, sid = el.dataset.stableId, ent = sid && STORE.get(sid), key = ent ? ent.compatibility_key : el.dataset.id;
    var hasEntityResearch = (kind === "l" && !!(ent || placeIndex().byKey[key])) || ((kind === "p" || kind === "rgn") && !!ent);
    if (!cardPassage(el) && !hasEntityResearch) return;   // 본문이 없어도 실제 장소/인물 엔티티면 해당 연구 맥락은 열 수 있다
    e.preventDefault(); e.stopPropagation(); openCardPassageResearch(el);
  });
  document.addEventListener("click", function (e) {
    var t = e.target, el;
    if (t.closest("[data-media-lightbox-close]")) return closeMediaLightbox();
    if ((el = t.closest("[data-media-lightbox]"))) return openMediaLightbox(el.dataset.mediaLightbox, el);
    if (t.closest("#brand-home")) return resetHome();
    if (t.closest("[data-search-close]")) return closeSearch();
    if ((el = t.closest("[data-sp-passage]"))) { var sk = parseKey(el.dataset.spPassage); closeSearch(true); return void openRelatedPassage(sk.passage, sk.verse); }
    if ((el = t.closest("[data-context-ref]"))) { var ck = parseKey(el.dataset.contextRef); if (state.view === "explore") closeSearch(true); return void openRelatedPassage(ck.passage, ck.verse); }
    if ((el = t.closest("[data-sp-entity]"))) return void jumpToEntity(el.dataset.spEntity);
    if ((el = t.closest("[data-swmode]"))) return switchExploreMode(el.dataset.swmode);
    if (t.closest("#sw-clear")) { swState.testament="all"; swState.period="all"; swState.region="all"; swState.placeType="all"; swState.role="all"; swState.story="all"; swState.journey="all"; swState.location="all"; swState.photo=false; swState.archaeology=false; swState.q=""; if($("sw-query")) $("sw-query").value=""; if($("search")) $("search").value=""; renderSearch(); return; }
    if ((el = t.closest("[data-swfilter]"))) { var kv = el.dataset.swfilter.split(":"); swState[kv[0]] = kv[1]; swState.limit = 30; syncSwFilters(); renderSearch(); var q0 = $("sw-query"); if (q0) q0.focus(); return; }
    if (t.closest("#sw-more")) { swState.limit += 30; return renderSearch(); }
    if (t.closest("#panel-toggle")) return toggleContext();
    if (t.closest("#panel-open, #panel-edge-open")) return setPanel("open");
    if (mapMoved) { mapMoved = false; if (t.closest("#map-body")) return; }
    if ((el = t.closest("[data-perspective]"))) return setView(el.dataset.perspective);
    if ((el = t.closest('[data-util="search"]'))) return toggleSearch();
    if (t.closest("#reset-split")) return setFrac(SPLIT_DEFAULT, true);
    if ((el = t.closest("[data-map-action]"))) return mapAction(el.dataset.mapAction);
    if ((el = t.closest("[data-theme-toggle]"))) return setMapTheme(mapThemeNow() === "dark" ? "light" : "dark");   // 즉시 앱 전체(지도 포함) 테마 전환, 선택 저장
    if ((el = t.closest("[data-map-src-info]"))) { var info = $(el.getAttribute("aria-controls")), open = !!(info && info.hidden); if (info) info.hidden = !open; el.setAttribute("aria-expanded", String(open)); return; }   // 참고 위치 출처 설명 펼치기/접기
    if ((el = t.closest("[data-map-settings-close]"))) { var mp = $("map-settings-pop"), mb = document.querySelector('[data-map-action="settings"]'); if (mp) mp.hidden = true; if (mb) { mb.setAttribute("aria-expanded", "false"); try { mb.focus(); } catch (e) {} } return; }   // 패널만 닫는다(지명/레이어 상태는 변경하지 않음)
    if ((el = t.closest("[data-map-theme-select]"))) return;
    if ((el = t.closest("[data-map-layer]"))) return setMapPref(el.dataset.mapLayer, !!el.checked);
    if ((el = t.closest("[data-zoom]"))) { var z = +el.dataset.zoom; return z === 0 ? (mapModeNow() === "geo" ? gfit() : setCam(50, 50, 1)) : zoomBy(z > 0 ? 1.4 : 1 / 1.4); }
    if ((el = t.closest("[data-layer]"))) { ui.layers[el.dataset.layer] = !!el.checked; return render(); }
    if ((el = t.closest("[data-view-verse]"))) return viewVerse(+el.dataset.viewVerse);
    if (t.closest("#map-tiles")) { ui.tiles = !ui.tiles; return renderMapPane(); }
    if (t.closest("#map-toggle")) { ui.mapOpen = !ui.mapOpen; return updateStageChrome(); }
    if (t.closest("[data-nav-board-close]")) return navBoardOpen(false);
    if (t.closest("[data-nav-board-open]")) return navBoardOpen(true);
    if ((el = t.closest("[data-nav-tab]"))) { ui.nav.tab = el.dataset.navTab; return renderBoard(); }
    if ((el = t.closest("[data-nav-topic]"))) return navOpenTopic(el.dataset.navTopic);
    if ((el = t.closest("[data-nav-step]"))) return navApplyStep(+el.dataset.navStep);
    if ((el = t.closest("[data-nav-by]"))) return navStepBy(+el.dataset.navBy);
    if (t.closest("[data-nav-end]")) return navEnd();
    if ((el = t.closest("[data-nav-track]"))) return navSetTrack(el.dataset.navTrack);
    if ((el = t.closest("[data-nav-range]"))) { var nr = navParseRange(el.dataset.navRange); return nr ? void openRelatedPassage(nr.pid, nr.v1, nr.v2) : undefined; }
    if ((el = t.closest("[data-nav-ref]"))) return navEnsurePassage(el.dataset.navRef);
    if ((el = t.closest("[data-nav-act]"))) { var na = el.dataset.navAct; return na === "research" ? navToggleResearch() : navOpenTimeline(); }
    if ((el = t.closest("[data-tl-era]"))) { ui.tlEra = el.dataset.tlEra; ui.tlTrack = null; ui.tlStep = null; ui.tlPage = null; return renderTimeline(); }
    if ((el = t.closest("[data-tl-step]"))) { ui.tlStep = el.dataset.tlStep; return renderTimeline(); }
    if ((el = t.closest("[data-tl-page]"))) { ui.tlPage = Math.max(0, (ui.tlPage || 0) + (+el.dataset.tlPage)); return renderTimeline(); }
    if ((el = t.closest("[data-tl-sort]"))) { ui.tlSort = el.dataset.tlSort; ui.tlPage = null; return renderTimeline(); }
    if ((el = t.closest("[data-tl-context-research]"))) { ensureContextVisible(); setView("study"); panelScrollTop(); var cr=document.querySelector('#panel article.ctx-research-item[data-context-record="'+el.dataset.tlContextResearch+'"]'); if(cr&&cr.scrollIntoView)try{cr.scrollIntoView({block:"start"});}catch(e2){} return; }
    if ((el = t.closest("[data-tl-study], [data-tl-map]"))) { var tid = el.dataset.tlStudy || el.dataset.tlMap, ttp = timelineEraById(ui.tlEra), ti = ttp && (ttp.steps || []).findIndex(function(s){return s.id === tid;}); if (ttp && ti >= 0 && navOpenTopic(ttp.id)) { if (ti) navApplyStep(ti); if (el.dataset.tlStudy) { ui.rmode = "TEXT"; ensureContextVisible(); render(); panelScrollTop(); } } return; }
    if (t.closest("[data-jnav-timeline]")) return setView("timeline");
    if ((el = t.closest("[data-nav-mode]"))) { ui.navExplore = el.dataset.navMode === "explore"; return renderGuide(); }
    if ((el = t.closest("[data-obj]"))) { var oo = el.dataset.obj.split("."); return selectEntity(oo[0], oo[1]); }
    if ((el = t.closest("[data-guide]"))) return guideStep(+el.dataset.guide);
    if ((el = t.closest("[data-guide-step]"))) return guideGo(+el.dataset.guideStep);
    if ((el = t.closest("[data-related-entity]"))) { var related=STORE.get(el.dataset.relatedEntity); if(related && entityValid({kind:related.kind,id:related.compatibility_key})) return void selectEntityStable(el.dataset.relatedEntity); var refs=related&&related.passage_refs||[]; for(var ri=0;ri<refs.length;ri++){var ref=refs[ri], pid=ref.book+'-'+ref.chapter, verse=ref.v1||ref.verse||1;if(D.passages[pid]&&hasVerse(pid,+verse))return void openRelatedPassage(pid,+verse);} showRefError('연결 대상의 승인된 상세·성경본문이 아직 없습니다.');return; }
    if ((el = t.closest("[data-person-inline-range]"))) { var spec=el.dataset.personInlineRange, m=/^([a-z0-9]+-\d+):(\d+)-(\d+)$/.exec(spec), unit=el.closest(".person-story-unit, .person-research section"); if(!m||!unit)return; var old=unit.querySelector(".person-inline-scripture"); if(old){ var same=old.dataset.range===spec; old.remove(); [].slice.call(unit.querySelectorAll("[data-person-inline-range]")).forEach(function(b){b.setAttribute("aria-expanded","false");}); if(same)return; } var P=D.passages[m[1]],a=+m[2],b=+m[3]; if(!P)return; var verses=(P.verses||[]).filter(function(v){return v.n>=a&&v.n<=b;}); var box=document.createElement("div"); box.className="person-inline-scripture"; box.dataset.range=spec; box.innerHTML=verses.map(function(v){return '<p><span class="person-inline-verse-num">' + v.n + "</span> " + esc(v.text) + "</p>";}).join("") + '<button type="button" class="person-inline-open" data-open-range="' + esc(spec) + '">본문에서 보기</button>'; unit.appendChild(box); el.setAttribute("aria-expanded","true"); return; }
    if ((el = t.closest("[data-person-research-toggle]"))) { var pr=document.querySelector("#panel details.person-research"); if(pr){ pr.open=!pr.open; if(pr.open) try{pr.scrollIntoView({block:"start",behavior:"smooth"});}catch(e2){pr.scrollIntoView();} el.textContent=pr.open?"본문연구 접기":"본문연구"; } return; }
    if ((el = t.closest("[data-rs-mode]"))) return rsSetMode(el.dataset.rsMode);
    if (t.closest("[data-rs-collapse]")) return toggleContext();
    if ((el = t.closest("[data-deep-study]"))) { var dsid = el.dataset.deepStudy, dn = dsid && STORE.get(dsid); if (dn && dn.entity_type === "Place") return openPlacePassageStudy(dn.compatibility_key, dsid); if (dsid) jumpToEntity(dsid); return setView("study"); }
    if ((el = t.closest("[data-deep-place]"))) return openPlacePassageStudy(el.dataset.deepPlace, null);
    if ((el = t.closest("[data-ee-action]"))) return explorerAction(el.dataset.eeAction, el.dataset.stableId);
    if ((el = t.closest("[data-place-open]"))) return openPlaceKey(el.dataset.placeOpen);   // 카드·검색·호버 어디서든 같은 열기 경로
    if ((el = t.closest("[data-place-scene]"))) { var pscn = el.dataset.placeScene.split("|"); navOpenTopic(pscn[0]); return navApplyStep(+pscn[1]); }
    if ((el = t.closest("#map-body [data-nav-place]")) && !t.closest("g.gm[data-place]")) return placeTap(el.dataset.navPlace, el);
    if ((el = t.closest('[data-search="1"]'))) { if (e.detail > 1 && (cardPassage(el) || el.dataset.kind === "l" || el.dataset.kind === "p")) return; return openSearchResult(el.dataset.kind, el.dataset.id, el.dataset.stableId); }   // 더블클릭 두 번째 click은 장소/인물 연구 진입과 충돌하지 않게 억제한다
    if ((el = t.closest("[data-step]"))) { var np = stepPassage(state.passage, +el.dataset.step); return np ? go(np) : undefined; }
    if ((el = t.closest("g.gm[data-place]"))) { var pel = el; return placeTap(pel.dataset.place, pel, function () { return markerSelect(pel.dataset.place); }); }
    var shiftVerse = e.shiftKey && ui.vanchor != null && t.closest("[data-verse]"), textShift = window.JBC_TEXT_ANN && JBC_TEXT_ANN.state && JBC_TEXT_ANN.state.textAnchor;
    if (shiftVerse && !textShift) { e.preventDefault(); try { var svs = window.getSelection && window.getSelection(); if (svs) svs.removeAllRanges(); } catch (svErr) {} return selectVerse(+shiftVerse.dataset.verse, "range"); }
    if (t.closest("#verses")) { var ts = window.getSelection && window.getSelection(); if (ts && !ts.isCollapsed && String(ts).trim()) return; }
    if ((el = t.closest(".rp-name"))) { e.stopPropagation(); return selectRpPerson(el.dataset.rpRef); }
    if ((el = t.closest(".tag"))) {
      e.stopPropagation(); var vEl2 = el.closest("[data-verse]"), prevOcc = ui.entityOcc;
      ui.nextOcc = { verse: vEl2 ? +vEl2.dataset.verse : null, idx: +el.dataset.occ || 0, kind: el.dataset.kind, id: el.dataset.id };
      if (state.entity && state.entity.kind === el.dataset.kind && state.entity.id === el.dataset.id && prevOcc && (prevOcc.verse !== ui.nextOcc.verse || prevOcc.idx !== ui.nextOcc.idx)) { ui.entityOcc = ui.nextOcc; ui.nextOcc = null; updateTextState(); return; }   // 같은 인물의 다른 등장: 카드는 그대로, 강조만 옮긴다
      return selectEntity(el.dataset.kind, el.dataset.id);
    }
    if ((el = t.closest("[data-verse]"))) return selectVerse(+el.dataset.verse, e.shiftKey ? "range" : (e.ctrlKey || e.metaKey) ? "toggle" : null);
    if ((el = t.closest("[data-rel]"))) { var rr = el.dataset.rel.split("."); return selectEntity(rr[0], rr[1]); }
    if ((el = t.closest("[data-ab-reader-geo]"))) {
      var key=String(el.dataset.abReaderGeo||''), bits=key.split('|'), entry=AB_GEO_MEDIA[bits[0]], candidate=entry&&(bits.length>1?(entry.candidates||[])[+bits[1]]:entry.geo);
      if(!candidate||!GEO.valid(candidate.lat,candidate.lon))return;
      readerGeoFocus={id:bits[0],lat:candidate.lat,lon:candidate.lon,label:(function(){var a=ATLAS90_REF.find(function(x){return x.place_id===bits[0];}),b=LEVEL_B_87.find(function(x){return x.candidate_id===bits[0];});return (a&&a.name_ko)||(b&&b.name_ko)||entry.name_en||'지리 후보';})(),uncertain:true};
      ui.gcam=clampGeoCam({x:candidate.lon,y:GEO.yOf(candidate.lat),w:Math.max(1.4,GEO_CAMERA.fitMinW)});
      renderGeoOnly();
      var pane=$("map-pane");if(pane)try{pane.scrollIntoView({block:"nearest",behavior:"smooth"});}catch(ex){pane.scrollIntoView();}
      return;
    }
    if ((el = t.closest("[data-map-focus-place]"))) { markerSelect(el.dataset.mapFocusPlace); var mp = $("map-pane"); if (mp) try { mp.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e2) { mp.scrollIntoView(); } return; }
    if ((el = t.closest("[data-open-range]"))) { var rm = /^([a-z0-9]+-\d+):(\d+)-(\d+)$/.exec(el.dataset.openRange); if (!rm) return; if (el.closest("#panel")) return openRelatedPassage(rm[1], +rm[2], +rm[3]); return openScripture(rm[1], +rm[2]); }
    if ((el = t.closest("[data-open-ref]"))) { var orr = parseKey(el.dataset.openRef); if (el.closest("#panel")) return openRelatedPassage(orr.passage, orr.verse); return openScripture(orr.passage, orr.verse); }
    if (t.closest("[data-clear-entity]")) return closeEntity();
    if ((el = t.closest("[data-preview]"))) { e.preventDefault(); state.preview = el.dataset.preview; ensureContextVisible(); return render(); }
    if ((el = t.closest("[data-goto]"))) { e.preventDefault(); var k = parseKey(el.dataset.goto); return go(k.passage, k.verse); }
    if ((el = t.closest("[data-reskind]"))) { state.resKind = el.dataset.reskind; return render(); }
    if ((el = t.closest(".pin, .item[data-id]"))) return selectEntity(el.dataset.kind, el.dataset.id);
    if ((el = t.closest("[data-open-memo]"))) {
      var memo = document.querySelector('#panel details[data-ov="notes"]');
      if (memo) {
        memo.open = true; ui.ovOpen.notes = true;
        memo.scrollIntoView({ block: "start", behavior: "auto" });
        var editor = memo.querySelector("#note-title");
        if (editor) editor.focus({ preventScroll: true });
      }
      return;
    }
    if (t.id === "note-save") {
      var v = $("note-text").value.trim(), title=$("note-title")?$("note-title").value.trim():""; if (!v) { $("note-status").textContent = "내용을 입력하세요"; $("note-status").dataset.state = "idle"; return; }
      createNoteRecord(v,title); renderPanel(); var ns=$("note-status"); if(ns){ns.textContent="저장됨";ns.dataset.state="saved";} return;
    }
    if ((el=t.closest("[data-note-edit]"))) {
      var ec=el.closest(".note-card"); if(!ec)return; var view=ec.querySelector(".note-card-view"), editor=ec.querySelector(".note-card-editor"); if(view)view.hidden=true; if(editor)editor.hidden=false; var ti=ec.querySelector(".note-edit-title"); if(ti)ti.focus(); return;
    }
    if ((el=t.closest("[data-note-edit-cancel]"))) {
      var cc=el.closest(".note-card"); if(!cc)return; var cv=cc.querySelector(".note-card-view"), ce=cc.querySelector(".note-card-editor"); if(cv)cv.hidden=false; if(ce)ce.hidden=true; return;
    }
    if ((el=t.closest("[data-note-edit-save]"))) {
      var sc=el.closest(".note-card"), sid=el.dataset.noteEditSave, st=sc&&sc.querySelector(".note-edit-title"), sx=sc&&sc.querySelector(".note-edit-text"), nv=sx?sx.value.trim():""; if(!nv){ if(sx){sx.focus();sx.setAttribute("aria-invalid","true");} return; } if(sx)sx.removeAttribute("aria-invalid"); var newId=updateNoteRecord(sid,st?st.value:"",nv); if(newId){renderPanel();var reopened=document.querySelector('.note-card[data-note-id="'+CSS.escape(newId)+'"]');if(reopened)reopened.open=true;} return;
    }
    if ((el=t.closest("[data-note-delete]"))) {
      var nid=el.dataset.noteDelete, card=el.closest(".note-card"), label=card&&card.querySelector(".note-card-label"), msg=(label?label.textContent:"이 메모")+"를 삭제하시겠습니까?";
      if (!window.confirm(msg)) return;
      if (deleteNoteRecord(nid)) renderPanel(); return;
    }
    if (t.id === "note-export") {
      var all = allNotes().map(function(r){return {passage:r.passage,verses:r.verses,title:r.title||"",label:noteRangeLabel(r.passage,r.verses),text:r.text,legacy:!!r.legacy};});
      $("note-out").textContent = JSON.stringify(all, null, 2);
    }
  });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "note-sort") { store(NOTE_SORT_KEY, e.target.value === "scripture" ? "scripture" : "record"); renderPanel(); return; } var tl = e.target && e.target.closest && e.target.closest("[data-tl-track]"); if (tl) { ui.tlTrack = tl.value; ui.tlStep = null; ui.tlPage = null; renderTimeline(); } });
  document.addEventListener("toggle", function (e) { var d = e.target; if (d && d.classList && d.classList.contains("ov") && d.dataset.ov) ui.ovOpen[d.dataset.ov] = d.open; }, true);
  document.addEventListener("keydown", function (e) {
    var t = e.target, tag = t.tagName;
    if ((e.key === "Enter" || e.key === " ") && t.closest && t.closest("g.gm[data-place]")) { e.preventDefault(); return markerSelect(t.closest("g.gm[data-place]").dataset.place); }
    if (e.key === "Escape" && $("media-lightbox") && !$("media-lightbox").hidden) { e.preventDefault(); closeMediaLightbox(); return; }
    if (e.key === "Escape" && ui.nav.board) { e.preventDefault(); navBoardOpen(false); return; }
    if (t.id === "ref-input" && e.key === "Escape") { e.preventDefault(); t.blur(); syncRefInput(); showRefError(""); return; }
    if (swState.open && t.closest && t.closest("#search-workspace")) {
      var rows = searchRows(), ix = rows.indexOf(t);
      if (e.key === "Escape") { if (state.entity) { e.preventDefault(); closeEntity(); } return; }   // Explore 자체는 Esc로 나가지 않는다. 선택 Detail만 닫는다.
      if (e.key === "Enter" && t.id === "sw-query") { var first = rows[0]; if (first) { e.preventDefault(); first.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); } return; }
      if (e.key === "ArrowDown") { e.preventDefault(); var nx = t.id === "sw-query" ? rows[0] : rows[ix + 1]; if (nx) nx.focus(); return; }
      if (e.key === "ArrowUp" && ix >= 0) { e.preventDefault(); if (ix === 0) $("sw-query").focus(); else rows[ix - 1].focus(); return; }
    }
    if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); e.preventDefault(); openSearch(null); return; }
    if (e.key === "Escape") { if (state.entity) { e.preventDefault(); var en = state.entity; closeEntity(); returnFocusToText(en); } else if (state.preview) { state.preview = null; render(); } return; }
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if ((e.key === "Enter" || e.key === " ") && tag !== "BUTTON" && tag !== "A" && t.getAttribute && t.getAttribute("tabindex") !== null) { e.preventDefault(); fire(t); }
  });
  $("sw-query").addEventListener("input", function (e) { swState.q = e.target.value; swState.limit = 30; if ($("search")) $("search").value = swState.q; renderSearch(); });
  // ---------- 상단 빠른 전체검색(Find): KRV 전체 본문 + 등록된 인물·장소·사건·경로·연구. 현재 장에 한정하지 않는다. ----------
  // 검색 로직은 검색 탭과 같은 unifiedSearch 를 쓰고, 여기서는 유형별 상위 결과만 드롭다운으로 보여 준다.
  var qs = { items: [], active: -1, q: "" };
  var QS_LIMIT = { person: 3, place: 3, event: 2, route: 2, research: 2, verse: 5 };
  var QS_SECTION = { person: "인물", place: "장소", event: "사건", route: "경로", research: "연구", verse: "본문" };
  function qsRank(e, nq) { var l = norm(e.display_label); return l === nq ? 0 : l.indexOf(nq) === 0 ? 1 : l.indexOf(nq) >= 0 ? 2 : 3; }
  function quickSearchModel(q) {
    var nq = norm(q), compact = nq.replace(/\s+/g, ""), rows = [], more = null;
    if (!compact) return { rows: rows, counts: null };
    var big = {}; Object.keys(QS_LIMIT).forEach(function (g) { big[g] = g === "verse" ? QS_LIMIT.verse : 60; });
    var R = unifiedSearch(q, { mode: "all", limit: big, minVerse: 2 });
    var seen = {};
    ["person", "place", "event", "route"].forEach(function (g) {
      var list = R.groups[g].slice().sort(function (a, b) { return qsRank(a, nq) - qsRank(b, nq) || a.display_label.localeCompare(b.display_label, "ko"); }).filter(function (e) { return !seen[e.stable_id] && (seen[e.stable_id] = 1); }).slice(0, QS_LIMIT[g]);
      list.forEach(function (e) { rows.push({ t: "ent", g: g, sid: e.stable_id, label: e.display_label, sub: entityMeta(e) || entityTypeLabel(e.entity_type) }); });
    });
    var B = REFBIND && REFBIND.bindings; if (B) Object.keys(B).forEach(function (sid) {
      var host = STORE.get(sid); if (!host || seen["ext:" + sid]) return;
      B[sid].bound.some(function (b) { if (b.name && norm(b.name).indexOf(nq) >= 0 && rows.filter(function (r) { return r.ext; }).length < 2) { seen["ext:" + sid] = 1; rows.push({ t: "ent", g: "place", sid: sid, label: b.name, sub: "외부 참고 · " + host.display_label + "에 연결", ext: true }); return true; } return false; });
    });
    R.groups.research.slice(0, QS_LIMIT.research).forEach(function (r) { var p = (r.passage_refs || [])[0]; rows.push({ t: "research", g: "research", ref: p ? p.book + "-" + p.chapter + ":" + p.v1 : "", label: r.title, sub: "연구" }); });
    R.groups.verse.slice(0, QS_LIMIT.verse).forEach(function (v) { rows.push({ t: "verse", g: "verse", pid: v.pid, n: v.n, label: v.label, text: v.text }); });
    return { rows: rows, counts: R.counts };
  }
  function qsRender() {
    var inp = $("qs-input"), ul = $("qs-list"); if (!inp || !ul) return;
    var q = inp.value, nq = norm(q), m = quickSearchModel(q), html = "", last = "", total = 0;
    qs.q = q; qs.items = m.rows.slice();
    if (m.counts) SEARCH_GROUPS.forEach(function (g) { total += m.counts[g] || 0; });
    m.rows.forEach(function (r, i) {
      if (r.g !== last) { last = r.g; html += '<li class="qs-sec" role="presentation">' + QS_SECTION[r.g] + (m.counts && m.counts[r.g] > QS_LIMIT[r.g] && r.g !== "person" && r.g !== "place" ? ' <span class="qs-sec-n">' + m.counts[r.g] + '건</span>' : m.counts && m.counts[r.g] ? ' <span class="qs-sec-n">' + m.counts[r.g] + '건</span>' : "") + "</li>"; }
      if (r.t === "verse") html += '<li role="option" id="qs-o' + i + '" class="qs-row qs-verse" data-qs-i="' + i + '" aria-selected="false"><span class="qs-name">' + esc(r.label) + '</span><span class="qs-snip">' + snippetHtml(r.text, q) + "</span></li>";
      else html += '<li role="option" id="qs-o' + i + '" class="qs-row' + (r.ext ? " is-ext" : "") + '" data-qs-i="' + i + '" aria-selected="false"><span class="qs-name">' + markedHtml(r.label, markRanges(r.label, q), 0, r.label.length) + '</span><span class="qs-sub">' + esc(r.sub) + "</span></li>";
    });
    if (nq) {
      var ci = qs.items.length; qs.items.push({ t: "all" });
      if (!m.rows.length) html += '<li class="qs-empty" role="presentation">' + (nq.replace(/\s+/g, "").length < 2 ? "두 글자 이상 입력하면 성경 본문 전체에서 찾습니다" : "일치하는 결과가 없습니다") + "</li>";
      html += '<li role="option" id="qs-o' + ci + '" class="qs-row qs-all" data-qs-i="' + ci + '" aria-selected="false"><span class="qs-name">전체 결과 보기</span><span class="qs-sub">' + (total ? "총 " + total + "건 · " : "") + "검색 탭</span></li>";
    }
    ul.innerHTML = html; qs.active = qs.items.length ? 0 : -1; qsMark();
    ul.hidden = !html; inp.setAttribute("aria-expanded", String(!ul.hidden));
  }
  function qsMark() {
    var ul = $("qs-list"), inp = $("qs-input"); if (!ul) return;
    [].forEach.call(ul.querySelectorAll("[data-qs-i]"), function (li) { var on = +li.dataset.qsI === qs.active; li.classList.toggle("is-active", on); li.setAttribute("aria-selected", String(on)); if (on) { inp.setAttribute("aria-activedescendant", li.id); try { li.scrollIntoView({ block: "nearest" }); } catch (e) {} } });
  }
  // 테스트 훅 호환: 이름으로 찾은 인물·장소·사건·경로(+외부 참고) 항목만 돌려준다
  function quickSearchItems(q) { return quickSearchModel(q).rows.filter(function (r) { return r.t === "ent"; }); }
  function qsClose() { var ul = $("qs-list"), inp = $("qs-input"); if (ul) ul.hidden = true; if (inp) { inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); } }
  // "전체 결과 보기": 현재 검색어를 그대로 검색 탭으로 넘기고 '전체' 필터에서 연다.
  function openSearchFromQuick(q) {
    swState.mode = "all"; swState.type = "all"; swState.testament = "all"; swState.period = "all"; swState.region = "all"; swState.placeType = "all"; swState.role = "all"; swState.story = "all"; swState.location = "all"; swState.photo = false; swState.archaeology = false; swState.limit = 30;
    openSearch(String(q || "").trim());
  }
  // Quick-search entity opening uses the same primary-passage priority as search cards.
  // The passage sets Scripture and the right-hand guide; the entity sets the detail and map.
  function quickEntityPassage(e) {
    if (!e) return null;
    var t = validEntityPrimaryPassage(e);
    if (!t && e.passage_refs && e.passage_refs.length) {
      var r = e.passage_refs.slice().sort(function(a,b){return passageRank(a)-passageRank(b);})[0];
      t = { pid: r.book + "-" + r.chapter, verse: r.verse || null };
    }
    if (!t && e.kind === "l") {
      var p = placeIndex().byKey[e.compatibility_key];
      if (p && p.passageIds && p.passageIds.length) t = { pid:p.passageIds[0], verse:null };
    }
    if (!t && e.kind === "rt") {
      var ps = Object.prototype.hasOwnProperty.call(PRESENTATION_ROUTE_SPECS,e.stable_id) && PRESENTATION_ROUTE_SPECS[e.stable_id];
      if (ps && ps.passages && ps.passages.length) t = { pid:ps.passages.slice().sort(function(a,b){return pidRank(a)-pidRank(b);})[0], verse:null };
    }
    if (!t || !D.passages[t.pid]) return null;
    if (t.verse != null && !hasVerse(t.pid,t.verse)) t.verse = null;
    return t;
  }
  function qsPick(i) {
    if (typeof i === "string") { var sidx = -1; qs.items.forEach(function (x, k) { if (x.sid === i) sidx = k; }); if (sidx < 0) { qs.items = [{ t: "ent", sid: i }]; sidx = 0; } i = sidx; }
    var r = qs.items[i], inp = $("qs-input"), q = inp ? inp.value : ""; if (!r) return; qsClose();
    if (r.t === "all") { openSearchFromQuick(q); return; }
    if (inp) inp.value = "";
    if (r.t === "verse") { if (state.view !== "study") setView("study"); go(r.pid, r.n); }
    else if (r.t === "research") { if (r.ref) { var ck = parseKey(r.ref); if (state.view !== "study") setView("study"); openRelatedPassage(ck.passage, ck.verse); } }
    else {
      var e = STORE.get(r.sid); if (!e) return;
      // Global quick-search chooses a fresh entity context, not an old journey step.
      // End stale topic/route overlays before showing the new entity.
      if (ui.nav && ui.nav.topic) navEnd(true);
      ui.rsStep = false; ui.navExplore = false;
      var target = quickEntityPassage(e);
      if (target) {
        // go() also updates the header, Scripture and the contextual right guide.
        if (!go(target.pid, target.verse, false, false)) return;
      } else if (state.view !== "study") setView("study");
      // go() resets PLACE mode; restore the selected entity mode only after passage navigation.
      ui.rsPlace = null;
      if (e.kind === "l") { ui.rmode = "PLACE"; ui.rsPlace = e.compatibility_key; }
      else if (e.kind === "p") { ui.rmode = "PERSON"; ui.rsPerson = e.compatibility_key; }
      else ui.rmode = "TEXT";
      jumpToEntity(r.sid);
    }
  }
  if ($("qs-input")) {
    $("qs-input").addEventListener("input", qsRender);
    $("qs-input").addEventListener("focus", qsRender);
    $("qs-input").addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if ($("qs-list").hidden) qsRender(); if (!qs.items.length) return; qs.active = (qs.active + (e.key === "ArrowDown" ? 1 : -1) + qs.items.length) % qs.items.length; qsMark(); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (qs.items[qs.active]) qsPick(qs.active); }
      else if (e.key === "Escape") { e.stopPropagation(); if (!$("qs-list").hidden) qsClose(); else this.value = ""; }
    });
    $("qs-list").addEventListener("mousedown", function (e) { var li = e.target.closest("[data-qs-i]"); if (li) { e.preventDefault(); qsPick(+li.dataset.qsI); } });
    document.addEventListener("click", function (e) { if (!e.target.closest("#quick-search")) qsClose(); });
  }
  if ($("search-open")) $("search-open").addEventListener("click", function () { openSearch(swState.q || ""); });
  ["sw-period","sw-region","sw-sort","sw-place-type","sw-role","sw-story","sw-journey","sw-location"].forEach(function(id){var el=$(id);if(el)el.addEventListener("change",function(){var key={ "sw-place-type":"placeType","sw-role":"role","sw-story":"story","sw-journey":"journey","sw-location":"location" }[id]||id.replace("sw-","");swState[key]=this.value;swState.limit=30;renderSearch();});});
  if ($("sw-photo")) $("sw-photo").addEventListener("change",function(){swState.photo=!!this.checked;renderSearch();});
  if ($("sw-archaeology")) $("sw-archaeology").addEventListener("change",function(){swState.archaeology=!!this.checked;renderSearch();});
  window.addEventListener("resize", function () { if (swState.open) placeSearch(); });
  document.addEventListener("change", function (ev) { var el = ev.target && ev.target.closest && ev.target.closest("[data-map-theme-select]"); if (el) setMapTheme(el.value === "auto" ? null : el.value); });
  document.addEventListener("change", function (ev) { var el = ev.target && ev.target.closest && ev.target.closest("[data-map-pref]"); if (el) setMapPref(el.dataset.mapPref, el.value); });
    $("ref-error").addEventListener("click", function () { showRefError(""); });
  $("ref-form").addEventListener("submit", function (e) { e.preventDefault(); var okq = openReference($("ref-input").value, { keepView: true }); if (okq) qnClose(); });

  // ---------- 상단 Bible Quick Navigator: 기존 참조 입력창을 유지한 채 책·장 선택/자동완성/최근 본문을 더한다(상태는 이 기기의 localStorage 와 메모리에만) ----------
  var QN_KEY = "jbc.recentRefs.v1", qn = { open: false, tab: "ot", book: null, active: -1, items: [] };
  function recentRefs() { try { var v = JSON.parse(localStorage.getItem(QN_KEY) || "[]"); return Array.isArray(v) ? v.filter(function (r) { return r && r.pid && BOOK[String(r.pid).split("-")[0]]; }).slice(0, 5) : []; } catch (e) { return []; } }
  function recordRecentRef(r) {
    if (!r || !r.passage) return; var list = recentRefs().filter(function (x) { return !(x.pid === r.passage && (x.verse || null) === (r.verse || null)); });
    list.unshift({ pid: r.passage, verse: r.verse || null, label: r.label }); try { localStorage.setItem(QN_KEY, JSON.stringify(list.slice(0, 5))); } catch (e) {}
  }
  function qnBookAliases(bk) { if (!ALIAS) buildAlias(); var out = []; ALIAS.forEach(function (p) { if (p[1] === bk.id) out.push(p[0]); }); return out; }
  function qnSuggest(q) {
    var t = norm(q).replace(/\s+/g, ""); if (!t) return [];
    var items = [], full = parseReference(q);
    if (full && !full.error) items.push({ kind: "ref", label: full.label, ref: full });
    var m = /^(\D+?)(\d.*)?$/.exec(t), bp = m ? m[1] : "", tail = m && m[2] ? m[2] : "";
    if (bp) KRV.books.forEach(function (bk) {
      if (items.length >= 8) return;
      if (!qnBookAliases(bk).some(function (al) { return al.indexOf(bp) === 0; })) return;
      if (tail) { var r2 = parseReference(bk.name + tail); if (r2 && !r2.error && !items.some(function (i) { return i.ref && i.ref.passage === r2.passage && i.ref.verse === r2.verse; })) items.push({ kind: "ref", label: r2.label, ref: r2 }); }
      else items.push({ kind: "book", label: bk.name + " (" + (BOOK_ABBR[bk.id] || bk.id) + ")", book: bk.id });
    });
    return items.slice(0, 8);
  }
  function qnRender() {
    var pop = $("ref-pop"); if (!pop) return; var q = $("ref-input").value, typed = !!norm(q).replace(/\s+/g, ""), html = "", rec = recentRefs();
    qn.items = typed ? qnSuggest(q) : [];
    if (qn.items.length) html += '<ul id="ref-suggest" class="qn-list" role="listbox" aria-label="자동완성">' + qn.items.map(function (it, i) { return '<li id="qn-opt-' + i + '" role="option" data-qn-i="' + i + '" aria-selected="' + (i === qn.active) + '" class="qn-opt' + (i === qn.active ? " on" : "") + '">' + esc(it.label) + (it.kind === "book" ? ' <span class="qn-hint">장 선택</span>' : "") + "</li>"; }).join("") + "</ul>";
    else if (typed) html += '<p class="qn-empty">일치하는 책이 없습니다. 예: 민2, 요3:16, 롬 8:28</p>';
    if (!typed && rec.length) html += '<div class="qn-sec"><p class="qn-h">최근 본문</p><div class="qn-recent">' + rec.map(function (r, i) { return '<button type="button" class="qn-btn qn-rec" data-qn-recent="' + i + '">' + esc(r.label) + "</button>"; }).join("") + "</div></div>";
    var ot = KRV.books.slice(0, 39), nt = KRV.books.slice(39);
    html += '<div class="qn-tabs" role="tablist" aria-label="구약/신약"><button type="button" role="tab" class="qn-tab" data-qn-tab="ot" aria-selected="' + (qn.tab === "ot") + '">구약</button><button type="button" role="tab" class="qn-tab" data-qn-tab="nt" aria-selected="' + (qn.tab === "nt") + '">신약</button></div>';
    if (qn.book && BOOK[qn.book]) {
      var bk = BOOK[qn.book];
      html += '<div class="qn-sec"><p class="qn-h"><button type="button" class="qn-back" data-qn-back="1" aria-label="책 목록으로">‹</button> ' + esc(bk.name) + " · " + bk.chapters.length + chapterUnit(bk.id) + '</p><div class="qn-grid qn-chapters" role="group" aria-label="' + esc(bk.name) + ' 장 선택">' + bk.chapters.map(function (c, i) { return '<button type="button" class="qn-btn" data-qn-chapter="' + (i + 1) + '">' + (i + 1) + "</button>"; }).join("") + "</div></div>";
    } else html += '<div class="qn-grid qn-books" role="group" aria-label="책 선택">' + (qn.tab === "ot" ? ot : nt).map(function (bk) { return '<button type="button" class="qn-btn qn-book" data-qn-book="' + bk.id + '">' + esc(bk.name) + "</button>"; }).join("") + "</div>";
    pop.innerHTML = html; var inp = $("ref-input"); inp.setAttribute("aria-expanded", "true"); if (qn.active >= 0) inp.setAttribute("aria-activedescendant", "qn-opt-" + qn.active); else inp.removeAttribute("aria-activedescendant");
  }
  function qnOpen() { var pop = $("ref-pop"); if (!pop) return; qn.open = true; pop.hidden = false; qnRender(); }
  function qnClose(refocus) { var pop = $("ref-pop"); if (!pop || !qn.open) return; qn.open = false; qn.active = -1; qn.book = null; pop.hidden = true; var inp = $("ref-input"); inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); if (refocus) inp.focus(); }
  function qnChoose(it) {
    if (!it) return false;
    if (it.kind === "book") { qn.book = it.book; qn.tab = KRV.books.findIndex(function (b) { return b.id === it.book; }) < 39 ? "ot" : "nt"; qn.active = -1; qnRender(); var f = $("ref-pop").querySelector(".qn-chapters .qn-btn"); if (f) f.focus(); return true; }
    var ok = openReference(it.label, { keepView: true }); if (ok) qnClose(); else qnRender(); return ok;
  }
  function bindQuickNavigator() {
    var inp = $("ref-input"), pop = $("ref-pop"), form = $("ref-form"); if (!inp || !pop || !form || !KRV.books.length) return;
    inp.setAttribute("role", "combobox"); inp.setAttribute("aria-haspopup", "dialog"); inp.setAttribute("aria-controls", "ref-pop"); inp.setAttribute("aria-expanded", "false"); inp.setAttribute("aria-autocomplete", "list");
    inp.addEventListener("focus", function () { if (!qn.open) { qn.active = -1; qnOpen(); } });
    inp.addEventListener("click", function () { if (!qn.open) qnOpen(); });
    inp.addEventListener("input", function () { qn.active = -1; qn.book = null; if (!qn.open) qnOpen(); else qnRender(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (!qn.open) qnOpen();
        if (qn.items.length) { var n = qn.items.length; qn.active = e.key === "ArrowDown" ? (qn.active + 1) % n : (qn.active <= 0 ? n - 1 : qn.active - 1); qnRender(); }
        else if (e.key === "ArrowDown") { var f = pop.querySelector(".qn-rec, .qn-tab[aria-selected=true]"); if (f) f.focus(); }
        return;
      }
      if (e.key === "Enter" && qn.open && qn.active >= 0 && qn.items[qn.active]) { e.preventDefault(); qnChoose(qn.items[qn.active]); }
    });
    pop.addEventListener("click", function (e) {
      var el;
      if ((el = e.target.closest("[data-qn-i]"))) { qnChoose(qn.items[+el.dataset.qnI]); return; }
      if ((el = e.target.closest("[data-qn-tab]"))) { qn.tab = el.dataset.qnTab; qn.book = null; qnRender(); var t = pop.querySelector('.qn-tab[data-qn-tab="' + qn.tab + '"]'); if (t) t.focus(); return; }
      if ((el = e.target.closest("[data-qn-book]"))) { qn.book = el.dataset.qnBook; qnRender(); var c = pop.querySelector(".qn-chapters .qn-btn"); if (c) c.focus(); return; }
      if (e.target.closest("[data-qn-back]")) { qn.book = null; qnRender(); var b0 = pop.querySelector(".qn-book"); if (b0) b0.focus(); return; }
      if ((el = e.target.closest("[data-qn-chapter]"))) { var bk = BOOK[qn.book]; if (bk && openReference(bk.name + " " + el.dataset.qnChapter, { keepView: true })) qnClose(); return; }   // 장 클릭은 즉시 이동
      if ((el = e.target.closest("[data-qn-recent]"))) { var r = recentRefs()[+el.dataset.qnRecent]; if (r && openReference(r.label, { keepView: true })) qnClose(); }
    });
    pop.addEventListener("keydown", function (e) {   // 격자 안 방향키 이동(Tab 으로도 모든 버튼에 접근 가능)
      var b = e.target.closest && e.target.closest(".qn-btn"); if (!b || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
      var grid = b.parentNode, btns = [].slice.call(grid.querySelectorAll(".qn-btn")), i = btns.indexOf(b), cols = grid.classList.contains("qn-chapters") ? 6 : grid.classList.contains("qn-books") ? 4 : 1, d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -cols : cols, n = i + d;
      e.preventDefault(); if (n >= 0 && n < btns.length) btns[n].focus(); else if (e.key === "ArrowUp") inp.focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !qn.open) return;
      if (e.target === inp) { qnClose(); return; }   // 입력창에서의 Esc: 팝업을 닫고, 기존 동작(정규 표기 복원·오류 지움·blur)도 그대로 이어진다
      e.preventDefault(); e.stopPropagation(); qnClose(true);   // 팝업 안에서의 Esc: 팝업만 닫고 입력창으로 돌아온다
    }, true);
    document.addEventListener("mousedown", function (e) { if (qn.open && !form.contains(e.target)) qnClose(); });   // 바깥 클릭
    form.addEventListener("focusout", function (e) { if (qn.open && e.relatedTarget && !form.contains(e.relatedTarget)) qnClose(); });
  }
  bindQuickNavigator();
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
  // 데스크톱 고정 작업공간에서는 window 대신 본문 가운데 영역만 스크롤된다.
  // 같은 앵커/히스토리 계약을 내부 스크롤에도 적용한다.
  if ($("verses")) $("verses").addEventListener("scroll", function () {
    if (!scrollTick) {
      scrollTick = true;
      window.requestAnimationFrame(function () {
        scrollTick = false;
        try { var a = computeAnchor(); if (a) anchors[a.passage] = a; else delete anchors[state.passage]; } catch (e) {}
      });
    }
    clearTimeout(histTimer);
    histTimer = setTimeout(function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} }, 250);
  }, { passive: true });
  // 이미지 불러오기 실패 → 출처만 표시하는 상태로 되돌린다(이미지 요소 제거, 본문·Detail 은 그대로).
  document.addEventListener("error", function (ev) {
    var im = ev.target; if (!im || im.tagName !== "IMG") return; if (im.classList.contains("ee-thumb")) { if (im.closest("[data-kind=l]")) { var ph = document.createElement("span"); ph.className = "ee-thumb ee-thumb-ph"; ph.setAttribute("role", "img"); ph.setAttribute("aria-label", "대표 이미지 없음"); im.replaceWith(ph); } else im.remove(); return; } if (!im.classList.contains("hero-img")) return; var fig = im.closest(".d-hero"), wrap = im.closest(".hero-open"); (wrap || im).remove();
    if (fig) { fig.setAttribute("data-media-mode", "attribution_only"); var cap = fig.querySelector("figcaption"), found = findMedia(fig.getAttribute("data-media-id")); if (cap && !cap.querySelector(".hero-fail")) { var meta = document.createElement("span"), sp = document.createElement("span"); meta.className = "hero-src"; meta.innerHTML = found ? "사진: " + esc(found.asset.creator) + " · " + esc(found.asset.license_label || found.asset.license) + " · " + esc(found.asset.provider) + " · " + mediaSourceHtml(found.asset) : "출처 정보 없음"; sp.className = "hero-src hero-fail"; sp.textContent = "사진을 불러오지 못해 출처만 표시합니다."; cap.appendChild(meta); cap.appendChild(sp); } }
  }, true);
  // 지도 번호 경유지 ↔ 오른쪽 패널 항목의 양방향 호버 강조(표시만 바꾼다: 선택·카메라·본문은 건드리지 않음).
  function wpHover(n) {
    [].forEach.call(document.querySelectorAll("#guide-pane .jn-step.is-hover, #map-body .gm-wp.is-hover"), function (e) { e.classList.remove("is-hover"); });
    if (!n) return;
    [].forEach.call(document.querySelectorAll('#guide-pane .jn-step[data-wp="' + n + '"], #map-body [data-nav-wp="' + n + '"]'), function (e) { e.classList.add("is-hover"); });
  }
  document.addEventListener("mouseover", function (ev) { var t = ev.target && ev.target.closest ? ev.target.closest("#map-body [data-nav-wp], #guide-pane .jn-step[data-wp]") : null; wpHover(t ? +(t.dataset.navWp || t.dataset.wp) : 0); });
  document.addEventListener("mouseout", function (ev) { if (!ev.relatedTarget || !ev.relatedTarget.closest || !ev.relatedTarget.closest("#map-body [data-nav-wp], #guide-pane .jn-step[data-wp]")) wpHover(0); });
  window.addEventListener("resize", function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); });   // 뷰포트 전환 시 패널/시트 모드 갱신(media query change 이벤트에만 의존하지 않음)
  window.addEventListener("beforeunload", function () { try { history.replaceState({ bvcAnchor: computeAnchor() }, ""); } catch (e) {} });   // 새로고침 직전의 읽던 자리(스크롤 이벤트에 의존하지 않음)
  if (h) { state.passage = h.passage; state.verse = h.verse; state.tab = h.tab; state.entity = h.entity; if (h.panel) state.panel = h.panel; if (h.sheet) state.sheet = h.sheet; if (h.view) state.view = h.view; if (h.verse != null) pendingScroll = { mode: "verse" }; }
  (function () { var hs = history.state; if (hs && hs.bvcAnchor && hs.bvcAnchor.passage === state.passage) pendingScroll = { mode: state.verse != null ? "verse" : "top", anchor: hs.bvcAnchor }; })();
  try { var mq = window.matchMedia("(max-width: 760px)"), onMq = function () { updateHeaderMetrics(); var a = computeAnchor(); applySplit(); updateContextChrome(); updateStageChrome(); lastChrome = state.panel + "|" + state.sheet + "|" + isMobile(); if (a) restoreAnchor(a); }; if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq); } catch (e) {}
  injectIcons(); syncThemeToggle(); syncMapSettings(); loadSplit(); bindSplit(); bindMapPan(); applySplit();
  if (state.entity && state.entity.kind === "l" && isMobile()) ui.mapOpen = true;
  // URL-restored research detail also restores its presentation-only map viewport.
  if (state.entity && (state.entity.kind === "rgn" || state.entity.kind === "rt")) {
    focusRegionReading(state.entity.kind, state.entity.id);
  }   // 장소가 선택된 채로 열리면 지도도 함께 보여 준다
  booting = true; render(); booting = false;
  window.addEventListener("load", function () { var rp = RPJ(); if (rp && rp.ready()) { mounted.force = true; render(); } });   // 연구 투영 스크립트는 app.js 뒤에 로드되므로, 준비되면 본문을 한 번 다시 그려 인물 이름 단어를 붙인다
  window.BVC = { cardPassage: cardPassage, mapRenderer: { mode: function () { return mlActive() ? "maplibre" : "legacy"; }, ready: function () { return !!ML.ready; }, map: function () { return ML.map; }, failed: function () { return ML.failed ? ML.error || true : false; }, errors: function () { return ML.errors || []; }, compose: function () { var sv = document.querySelector("#ml-ovl svg.gmap"); return sv ? mlCompose(sv.cloneNode(true)) : Promise.reject(new Error("no overlay")); }, printSheet: function () { var sv = document.querySelector("#ml-ovl svg.gmap"); return mlCompose(sv.cloneNode(true)).then(function (cv) { mlPrintSheet(cv.toDataURL("image/png")); return cv.width; }); }, printDone: function () { mlPrintDone(); } }, placeIndex: placeIndex, placeCard: placeCardHtml, openPlace: openPlaceKey, placeIndexSet: placeIndexSet, mapScene: mapSceneState, journey: { build: navBuildChain, fitPoints: navFitPoints, layout: journeyLayout }, selectRpPerson: selectRpPerson, refSources: REFSRC, refFeatures: REF_FEATURES, authority: { qaFixture: QA_FIXTURE, fixturePool: FIXTURE_POOL }, gateRecord: gateRecord, boundRelations: boundRelations, relAdjacency: relAdjacency, readerVisible: readerVisible, refBindings: REFBIND, quickSearchItems: quickSearchItems, unifiedSearch: unifiedSearch, qsPick: qsPick, extBindings: extBindings, boundExternalLabels: boundExternalLabels, labelLevels: LABEL_LEVELS, refPriority: refPriority, refLabelList: refLabelList, detailContext: detailContext, DETAIL_MODEL: DETAIL_MODEL, openRelatedPassage: openRelatedPassage, geo: { GEO: GEO, LOC_LABEL: LOC_LABEL, LOC_MARKER: LOC_MARKER, markerSpec: markerSpec, markers: geoMarkers, visibleMarkers: visibleGeoMarkers, markerTier: markerTier, semanticTierLimit: semanticTierLimit, labelPx: labelPx, labelLevels: LABEL_LEVELS, markerLevel: markerLevel, refLevel: refLevel, splitDefault: SPLIT_DEFAULT, setMapTheme: setMapTheme, mapThemeNow: mapThemeNow, available: geoAvailable, mode: mapModeNow, fit: geoFit, cam: geoCam }, navigationCandidates: navigationCandidates, renderGuide: renderGuide, store: STORE, entityExplorer: { set: entitySet, select: selectEntityStable }, scriptureIndex: SEI, entitiesAt: entitiesAt, mediaSourceHtml: mediaSourceHtml, mediaGate: mediaGate, stableId: stableOf, resolveKey: resolveKey, projection: PJ, personProjection: PERSON_PJ, setView: setView, setCam: setCam, zoomBy: zoomBy, ui: ui, guideStep: guideStep, guideGo: guideGo, guideRoute: guideRoute, guideIndex: guideIndex, guideSteps: guideSteps, guideTopic: guideTopic, guide: G, setFrac: setFrac, anchors: anchors, openSearch: openSearch, closeSearch: closeSearch, searchState: swState, markRanges: markRanges, setPanel: setPanel, setSheet: setSheet, toggleContext: toggleContext, isMobile: isMobile, entryAnchors: entryAnchors, openReference: openReference, scrollAnchor: computeAnchor, remount: function () { mounted.force = true; render(); }, variantFor: variantFor, krv: KRV, stepPassage: stepPassage, parseReference: parseReference, render: render, panels: PANELS, state: state, go: go, selectVerse: selectVerse, selectEntity: selectEntity, setTab: setTab, entitiesIn: entitiesIn, versesWith: versesWith, data: D };
})();
