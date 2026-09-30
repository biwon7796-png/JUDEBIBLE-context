// PROJECTION — 승인 연구자산 1건(Place)의 JudeBible Context 투영 기록.
// 원본: docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md (01_목회연구_WORBS_BICS, v0.2, STAGE_APPROVED_WITH_VERIFY)
// 규칙(BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1): 원본에 없는 값은 만들지 않는다. 좌표·경로·Person/Event ID 를 추가하지 않는다. 원본의 상태를 올리지 않는다.
// 이 파일은 원본 연구를 수정하지 않는 읽기 전용 투영이며, 투영이 없거나 검증에 실패하면 앱은 fixture stub 으로 안전하게 되돌아간다.
window.BVC_PROJECTION = {
  meta: { schema: "JUDEBIBLE_CONTEXT_PROJECTION_v0.1", research_id: "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01", gate: "BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1" },
  places: {
    "JBC-CR-PLACE-BEERSHEBA-001": {
      stable_id: "JBC-CR-PLACE-BEERSHEBA-001",
      legacy_key: "beersheba",
      type: "place",
      // 아래 reader_type / reader.glance / location.lead / hero_caption 은 핸드오프 JUDEBIBLE_BEERSHEBA_DETAIL_INFORMATION_HIERARCHY_PATCH v0.1 이 정한 독자용 표기다(연구 원본은 변경하지 않음).
      reader_type: "성읍·도시",
      hero_caption: "브엘세바의 유력한 고고학 후보지",
      display_label: "브엘세바",
      label_en: "Beersheba",
      ancient_name: { hebrew: "בְּאֵר שֶׁבַע", transliteration: "Be'er Sheva / Be'er Sheba" },
      aliases: ["Beer-sheba", "Beer Sheba", "Be'er Sheva", "Be’er Sheva"],
      place_type: { primary: "BIBLICAL_PLACE", secondary: ["patriarchal_residence", "well_and_oath_place", "covenant_location", "later_southern_geographic_marker"] },
      region: { canonical: "Beersheba Valley / northern Negev", stable_ref: "JBC-CR-REGION-BEERSHEBA_VALLEY-001" },
      certainty: "HIGH_FOR_BIBLICAL_IDENTITY",
      coordinate_certainty: "DISPUTED_FOR_EXACT_BIBLICAL_POINT",
      coordinates: null,
      coordinate_status: "NO_EXACT_POINT_ASSIGNED",
      status: "STAGE_APPROVED_WITH_VERIFY",
      authority: { project: "01_목회연구_WORBS_BICS", module: "WORBS", approval: "STAGE_APPROVED_WITH_VERIFY", registry_effect: "NONE", BAT01_crosswalk: "NOT_PERFORMED" },
      source_refs: [{ id: "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01", version: "v0.2", path: "docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md" }],
      source_locator: "§1 Canonical Research Asset",
      VERIFY_HOLD: { verify: true, hold: true, reason: "정확한 좌표·위치 동일시·경로 geometry 는 원본에서 미확정" },

      reader: {
        headline: "우물과 맹세, 약속의 기억이 겹쳐지는 장소",
        glance: [["이름의 뜻", "맹세의 우물 / 일곱의 우물"], ["지역", "네게브 북부"], ["대표 본문", "창 21 · 22 · 26"], ["핵심 주제", "우물 · 언약 · 예배"]],
        concise_summary: "브엘세바는 아브라함과 이삭의 이야기에서 우물, 언약, 하나님의 임재가 반복해서 만나는 장소입니다. 아브라함은 이곳에서 아비멜렉과 맹세하고 하나님을 예배했으며, 모리아 사건 뒤에도 브엘세바로 돌아왔습니다. 이삭에게도 하나님이 이곳에서 나타나셨고, 다시 우물을 얻고 평화의 맹세를 맺었습니다. 정확한 고대 도시의 위치는 학계에서 완전히 확정된 것은 아니지만, 텔 브엘세바가 중요한 고고학 후보로 연구되고 있습니다.",
        // 원본 quick_facts 표. '중요한 인물' 행은 Person 연구 ID 가 없어 이번 투영에서 숨긴다(Gate).
        quick_facts: [["이름", "브엘세바, Be’er Sheva"], ["이름의 뜻", "“맹세의 우물” 또는 “일곱의 우물”"], ["지역", "네게브 북부, 브엘세바 계곡 일대"], ["중요한 주제", "우물, 맹세, 언약, 예배, 하나님의 임재"], ["대표 본문", "창 21:22–34; 22:19; 26:23–33"], ["오늘의 지리", "현대 브엘세바와 텔 브엘세바를 구별해서 보아야 함"]]
      },

      // 위치 상태(원본: coordinate_certainty DISPUTED) → 독자 표현 '여러 후보지'(HARAM lock PLACE_STATUS_DISPLAY). 문장은 원본 요약·quick_facts 의 표현을 그대로 쓴다.
      location: {
        reader_status: "DISPUTED",
        lead: "정확한 위치는 확정되지 않았습니다.",
        sentences: ["정확한 고대 도시의 위치는 학계에서 완전히 확정된 것은 아니지만, 텔 브엘세바가 중요한 고고학 후보로 연구되고 있습니다.", "현대 브엘세바와 텔 브엘세바를 구별해서 보아야 합니다."]
      },

      // PassageLink (원본 §6). 후대 전승(CONTEXTUAL)은 성경 구절이 아니어서 제외.
      passage_links: [
        { group: "direct", book: "gen", chapter: 21, v1: 14, v2: 14 },
        { group: "direct", book: "gen", chapter: 21, v1: 31, v2: 34 },
        { group: "direct", book: "gen", chapter: 22, v1: 19, v2: 19 },
        { group: "direct", book: "gen", chapter: 26, v1: 23, v2: 33 },
        { group: "direct", book: "gen", chapter: 28, v1: 10, v2: 10 },
        { group: "direct", book: "gen", chapter: 46, v1: 1, v2: 5 },
        { group: "related", book: "gen", chapter: 20, v1: null, v2: null },
        { group: "related", book: "gen", chapter: 26, v1: 1, v2: 22 }
      ],

      claims: [
        { id: "CLM-BS-01", statement: "브엘세바는 창 21에서 아브라함과 아비멜렉의 우물·맹세 장소다", class: "FACT", locator: "Genesis 21:25–32", confidence: "HIGH" },
        { id: "CLM-BS-02", statement: "아브라함은 그곳에서 하나님을 부르고 체류한다", class: "FACT", locator: "Genesis 21:33–34", confidence: "HIGH" },
        { id: "CLM-BS-03", statement: "모리아 사건 뒤 아브라함은 브엘세바로 돌아가 거주한다", class: "FACT", locator: "Genesis 22:19", confidence: "HIGH" },
        { id: "CLM-BS-04", statement: "이삭에게 브엘세바에서 하나님이 나타나고 약속을 재확인한다", class: "FACT", locator: "Genesis 26:23–25", confidence: "HIGH" },
        { id: "CLM-BS-05", statement: "이삭도 브엘세바에서 아비멜렉 측과 맹세하며 우물을 얻는다", class: "FACT", locator: "Genesis 26:26–33", confidence: "HIGH" },
        { id: "CLM-BS-06", statement: "이름은 ‘우물/일곱/맹세’의 언어적 결합을 의도한다", class: "INTERPRETATION", locator: "창 21:28–31; 26:31–33; Hebrew lexical evidence", confidence: "HIGH" },
        { id: "CLM-BS-07", statement: "브엘세바는 족장 내러티브에서 약속·예배·우물·거주의 반복 장소다", class: "INTERPRETATION", locator: "창 21–22; 26 + Genesis Book Profile", confidence: "HIGH" },
        { id: "CLM-BS-08", statement: "Tel Be’er Sheva는 중요한 고고학적 브엘세바 후보이다", class: "FACT/IDENTIFICATION", locator: "UNESCO, Heidelberg DB, excavation report", confidence: "MEDIUM-HIGH" },
        { id: "CLM-BS-09", statement: "Tel Be’er Sheva의 철기시대 증거는 족장 사건 자체를 직접 입증하지 않는다", class: "ARCHAEOLOGICAL_BOUNDARY", locator: "층위 자료", confidence: "HIGH" },
        { id: "CLM-BS-10", statement: "정확한 고대 브엘세바 위치에는 경쟁 견해가 남는다", class: "FACT_OF_SCHOLARLY_DISPUTE", locator: "Fritz alternative identification", confidence: "HIGH" }
      ],
      competing_views: ["Aharoni 계열의 Tel es-Seba‘ 동일시가 널리 사용됨", "Volkmar Fritz 는 현대 브엘세바 구도심 주변의 Bir es-Seba‘/Khirbet Bir es-Seba‘ 를 더 유력하게 보고 Tell es-Seba‘ 동일시에 이의를 제기함"],
      candidates: [
        { id: "JBC-CR-SITE-TEL_BEER_SHEVA-001", label: "Tel Be’er Sheva (텔 브엘세바)", lat: 31.245, lon: 34.840556, status: "VERIFIED_ARCHAEOLOGICAL_SITE", role: "archaeological_candidate", equivalence_locked: false, note: "Heidelberg 성경지리 DB 의 Tell es-Seba‘ 좌표. UNESCO 좌표와도 거의 일치" },
        { id: "JBC-CR-PLACE-BEERSHEBA_MODERN-001", label: "현대 브엘세바", lat: 31.2518136, lon: 34.7912979, status: "MODERN_CITY_REFERENCE", role: "modern_context", equivalence_locked: false, note: "고대 성경 장소 좌표로 사용 금지" }
      ],
      verify: [
        { id: "VERIFY-BS-01", issue: "Exact point location of patriarchal Beersheba", state: "unresolved" },
        { id: "VERIFY-BS-02", issue: "Biblical Beersheba = Tel Be'er Sheva", state: "strong/common archaeological identification but not absolute" },
        { id: "VERIFY-BS-03", issue: "identity relationship between the two Abimelech narratives", state: "not resolved by this place study" },
        { id: "VERIFY-BS-04", issue: "exact route geometry for Beersheba-Moriah and Rehoboth-Beersheba", state: "not generated" }
      ],
      hold: ["exact archaeological attribution of Genesis 21/26 wells", "identification of Tel Be'er Sheva well as Abraham's or Isaac's well", "exact patriarchal archaeological stratum", "BAT01_PLACE or BAT01_P crosswalk"],

      // MediaAsset 메타데이터만(이미지 payload 는 불러오지 않는다: Gate DECISION_05). rights 상태는 앱 계약으로 정규화되지 않아 표기하지 않는다.
      media: [
        { id: "JBC-MEDIA-BS-001", provider: "Wikimedia Commons", file: "File:20211001 100742 Tel Be'er Sheva.jpg", creator: "Sasha1506", license: "CC BY-SA 4.0", role: "representative / archaeological", reader_caption: "텔 브엘세바 고고학 유적 전경. 성경의 브엘세바로 연구되는 주요 고고학 후보입니다.", attribution: "Sasha1506, “20211001 100742 Tel Be'er Sheva.jpg,” Wikimedia Commons, CC BY-SA 4.0." },
        { id: "JBC-MEDIA-BS-002", provider: "Wikimedia Commons", file: "File:Tel Be'er Sheva, Altar 01.jpg", creator: "Daniel Baránek", license: "CC BY-SA 3.0", role: "archaeological", reader_caption: "텔 브엘세바에서 복원된 뿔 제단. 아브라함이나 이삭의 제단을 보여 주는 사진은 아닙니다.", attribution: "Daniel Baránek, “Tel Be'er Sheva, Altar 01.jpg,” Wikimedia Commons, CC BY-SA 3.0.", attribution_composed: true },
        { id: "JBC-MEDIA-BS-003", provider: "Wikimedia Commons", file: "File:Beersheba, Israel 01.jpg", creator: "Yonatan Dodin", license: "CC BY 4.0", role: "modern_landscape", reader_caption: "현대 브엘세바 전경. 고대 성경의 도시를 보여 주는 사진이 아닙니다.", attribution: "Yonatan Dodin, “Beersheba, Israel 01.jpg,” Wikimedia Commons, CC BY 4.0.", attribution_composed: true }
      ]
    }
  }
};
