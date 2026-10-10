// JudeBible 연표 단계 ↔ WORBS 연구 연결층 — 연구 연결 전용 데이터. 표시용이며 연구 권위·Registry·Person/Event ID를 만들지 않는다.
//
// 규칙
//   - 단계(step)와 연구는 1:1이 아니다. 한 단계에 여러 연구, 한 연구가 여러 단계에 연결될 수 있다.
//   - 본문 범위가 겹치는지는 도구(tools/timeline/suggest_research_links.js)가 제안하고, 의미 관계는 사람이 검증한 연결만 여기에 적는다.
//   - 연구 상태(승인/검수 중)는 여기에 적지 않는다. 화면이 연구 레코드의 professionalStatus를 읽어 표시한다(상태가 바뀌어도 이 파일은 그대로).
//   - 승인된 본문 연구만 눌러서 열린다. 인물·시대 연구 연결(kind: person|era)은 승인된 ID가 생기기 전까지 표시용 포인터다.
//   - 같은 사건을 두 시대에서 참조해도 연결은 단계 id 기준으로 한 번만 적는다(사건 복제 금지).
//
// link 스키마
//   { step: "era.patriarchal.abraham.10",       // 연표 단계 id (exploration.topics.js)
//     kind: "passage" | "person" | "era",
//     researchId: "JBC_GENESIS_22_1_19_WORBS_E2E_PILOT_20261006_01",   // kind=passage: 기존 연구 레코드 id
//     range: "gen-22:1-19",                     // kind=passage: 연구가 다루는 본문 범위
//     relation: "EXACT" | "CONTAINS" | "PART",  // 단계 범위와 연구 범위의 의미 관계(사람 검증)
//     label?: "…"                               // kind=person|era 표시명
//   }
window.JBC_TIMELINE_ERA_RESEARCH = {
  meta: { schema: "JBC_TIMELINE_ERA_RESEARCH_v0.1", authority: "PRESENTATION_ONLY", registry_effect: "NONE", person_event_id_issuance: "NONE" },
  links: [
    { step: "era.patriarchal.abraham.10", kind: "passage", researchId: "JBC_GENESIS_22_1_19_WORBS_E2E_PILOT_20261006_01", range: "gen-22:1-19", relation: "EXACT" }
  ]
};
