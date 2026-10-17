/* Site-wide "연구 출처 및 저작권 안내": one notice for the whole app, next to the existing original-language attribution.
   Sources and licences below are taken from the build's own attribution record (original-language attribution.js) and the research files.
   Each research text shows only the sources it actually used at the end of its own panel (research-source-notice-20261016.js). */
(function () {
  function a(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + (t || u) + "</a>"; }
  var CC = { by: a("https://creativecommons.org/licenses/by/4.0/"), bysa: a("https://creativecommons.org/licenses/by-sa/4.0/") };
  var html = '<details id="jbc-research-notice"><summary>연구 출처 및 저작권 안내</summary>' +
    "<h5>연구 참고자료</h5><ul>" +
    "<li><b>성경전서 개역한글판</b> · 대한성서공회 · 1961 — 성경 본문과 직접 인용의 출처입니다. 이용 조건은 대한성서공회의 안내를 따릅니다. " + a("https://www.bskorea.or.kr") + "</li>" +
    "<li><b>Open Scriptures Hebrew Bible (OSHB)</b> · v2.2 · CC BY 4.0 — 히브리어 형태소 분석·표제어 데이터. 기반 본문 Westminster Leningrad Codex는 퍼블릭 도메인입니다. " + a("https://github.com/openscriptures/morphhb") + " · 라이선스 " + CC.by + "</li>" +
    "<li><b>Open Scriptures Hebrew Lexicon</b> · CC BY 4.0 — 히브리어 단어의 기본 뜻 확인용 어휘 자료. 원자료의 짧은 뜻풀이를 바탕으로 한국어 표현을 작성했습니다. " + a("https://github.com/openscriptures/HebrewLexicon") + "</li>" +
    "<li><b>SBL Greek New Testament (SBLGNT)</b> · v1.2 · © 2010 Society of Biblical Literature and Logos Bible Software · CC BY 4.0 — 신약 헬라어 본문. " + a("https://github.com/Faithlife/SBLGNT") + "</li>" +
    "<li><b>MACULA Greek Linguistic Datasets</b> · © Biblica, Inc. · CC BY 4.0 — 헬라어 형태·문법 분석. " + a("https://github.com/Clear-Bible/macula-greek") + "</li>" +
    "<li><b>Dodson Greek-English Lexicon</b> · CC0 1.0 · <b>STEPBible Data (TBESH/TBESG)</b> · CC BY 4.0 — 어휘 기본 뜻(영어 Gloss) 연결 자료. 한국어 뜻풀이는 이를 바탕으로 JudeBible에서 작성·검토 중입니다.</li>" +
    "<li><b>Tyndale Open Study Notes</b> · © 2022 Tyndale House Publishers · CC BY-SA 4.0 — 해당 본문의 공개 주석. 원자료: " + a("https://www.tyndaleopenresources.com") + " · 라이선스 " + CC.bysa + "</li>" +
    "<li><b>unfoldingWord Translation Notes</b> · unfoldingWord · English v91 · CC BY-SA 4.0 — 해당 본문의 번역 주석. 출처: " + a("https://www.unfoldingword.org") + "</li>" +
    "</ul><h5>지도·지명·사진 자료</h5><ul>" +
    "<li><b>OpenBible.info Bible Geocoding Data</b> · CC BY 4.0(일부 OpenStreetMap 기반 ODbL 1.0) — 지명 위치·지역 범위. " + a("https://www.openbible.info/geo/") + "</li>" +
    "<li><b>OpenFreeMap · OpenMapTiles · OpenStreetMap contributors</b> — 배경지도.</li>" +
    "<li><b>Easton's Bible Dictionary (1897)</b> — 퍼블릭 도메인 사전 자료.</li>" +
    "<li><b>Wikimedia Commons 사진</b> — 사진마다 촬영자와 라이선스(퍼블릭 도메인, CC0, CC BY, CC BY-SA)를 사진 아래에 표시합니다.</li></ul>" +
    "<h5>연구 및 재서술 안내</h5>" +
    "<p>이 연구는 성경 본문에 대한 WORBS의 원어·문법·문학·역사·정경·신학 연구를 바탕으로 작성한 한국어 심층 주석입니다. 연구 과정에서는 히브리어·헬라어 원문과 검증된 어휘 자료, 공개 라이선스 주석 및 기타 확인된 연구 자료를 활용합니다.</p>" +
    "<p>한국어 해설은 원문과 연구 근거를 분석하여 작성하며, 실제로 번역·수정·재구성한 외부 자료가 있는 경우 해당 자료의 출처와 변경 관계를 구분하여 기록합니다. 이 연구는 참고자료 제공 기관의 공식 번역이나 승인 주석을 의미하지 않습니다.</p>" +
    "<h5>라이선스</h5>" +
    "<p>성경 번역문, 히브리어·헬라어 본문, 형태소 분석 자료, 어휘 데이터 및 공개 주석에는 각각의 저작권과 라이선스가 적용됩니다. 공개 라이선스 자료는 해당 라이선스의 저작자 표시, 출처 제공, 변경 고지 및 동일조건변경허락 등 적용되는 의무를 준수합니다.</p>" +
    "<ul><li>Creative Commons Attribution 4.0 (CC BY 4.0) — " + CC.by + "</li><li>Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0) — " + CC.bysa + "</li></ul>" +
    "<p>JudeBible의 자체 연구·해설은 외부 원천 자료와 구분하여 관리합니다. 개별 연구물의 최종 이용 조건은 실제 사용한 자료의 권리 및 파생 관계를 확인하여 결정합니다. 각 연구 본문의 맨 아래에는 그 연구에서 실제 사용한 자료만 따로 표시합니다.</p></details>";
  function mount() {
    var host = document.getElementById("public-ol-attribution"); if (!host || document.getElementById("jbc-research-notice")) return;
    host.insertAdjacentHTML("beforeend", html);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  setTimeout(mount, 1500);
})();
