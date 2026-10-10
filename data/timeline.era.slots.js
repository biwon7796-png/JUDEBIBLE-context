// JudeBible 연표 시대 슬롯 — 연구 콘텐츠 투입 전용 파일.
// PRESENTATION ONLY: 연구 권위·Registry·stable identity를 만들지 않는다. 승인된 연구만 이 슬롯에 옮겨 담는다.
//
// 원칙(2026-10-09, STANDARDIZE_ALL_TIMELINE_ERAS_ON_PATRIARCHAL_DESIGN)
//   모든 시대는 족장 시대 승인 디자인(시대 카드 → 요약·줄기 선택 → 사건 카드 5개/쪽 → 우측 상세 패널 → 전체 흐름)으로 표시된다.
//   빈 시대도 같은 화면 골격을 '준비 중' 상태로 미리 갖춘다.
//   연구를 추가할 때는 이 파일의 tracks / steps 만 채운다. app.js · styles.css · index.html 은 건드리지 않는다.
//
// 병합 규칙(app.js timelineEraTopics)
//   - data/exploration.topics.js 의 시대 주제(id·제목·요약·지도 overlay)가 기준이다.
//   - 주제에 steps 가 이미 있으면(족장 시대·원역사) 그 steps 를 쓰고, 없으면 이 슬롯의 steps 를 쓴다.
//   - tracks 도 같은 방식(주제 overlay.tracks 우선, 없으면 슬롯 tracks).
//   - 지도 장면(overlay.places)이 없는 시대는 자동으로 연표 전용(timeline_only)이 되어 '지도 보기' 대신 본문으로 이동한다.
//   - 이 파일은 지도·Guide 의 원본 주제 객체를 변경하지 않는다(연표 화면에서만 병합된 사본을 사용).
//
// track 스키마 (족장 시대·원역사와 동일)
//   { id, title, range_label, select_label?, fact_label?, summary }
//     select_label: 줄기 선택 상자의 이름(기본 "인물")   fact_label: 상세 패널 항목명(기본 "주요 인물")
//
// step 스키마 (족장 시대·원역사와 동일)
//   { id: "era.<시대>.<줄기>.<번호>", track, title,
//     passage_refs: ["exo-3:1"], range: "exo-3:1-22", related_refs: [],
//     core: "카드·상세 첫 문장", short_description: "보조 설명 (출 3:1–22)",
//     uncertainty: "본문 서사" | "inferred" | ...,
//     waypoint?, display_places?   // 승인된 장소 key 가 있을 때만. 장소 사진은 장소 프로필 media 에서 자동 연결된다.
//   }
//   순서는 성경 서사 순서. BC 연대 수치는 승인된 연대 데이터가 생기기 전까지 넣지 않는다.
//
// reference_lanes: 해당 시대 화면 하단에 붙는 미승인 참고 레인(현재 "hba04" = Holman ch.4 고대 문명사 참고).
window.JBC_TIMELINE_ERA_SLOTS = {
  meta: {
    schema: "JBC_TIMELINE_ERA_SLOTS_v0.1",
    authority: "PRESENTATION_ONLY",
    registry_effect: "NONE",
    research_effect: "NONE",
    design_reference: "era.patriarchal"
  },
  eras: {
    "era.primitive":        { reference_lanes: ["hba04"] },
    "era.patriarchal":      {},
    "era.exodus":           { tracks: [], steps: [] },
    "era.conquest":         { tracks: [], steps: [] },
    "era.judges":           { tracks: [], steps: [] },
    "era.united-monarchy":  { tracks: [], steps: [] },
    "era.divided-monarchy": { tracks: [], steps: [] },
    "era.assyria":          { tracks: [], steps: [] },
    "era.exile":            { tracks: [], steps: [] },
    "era.return":           { tracks: [], steps: [] },
    "era.intertestamental": { tracks: [], steps: [] },
    "era.jesus":            { tracks: [], steps: [] },
    "era.early-church":     { tracks: [], steps: [] }
  }
};
