// GUIDE FIXTURE (UI 개발용 임시 데이터) — JudeBible Context Lock v1.1 §13 의 GuideTopic / GuideStep 계약을 따른다.
// status: FIXTURE_SAMPLE · authority: NON_AUTHORITATIVE. 승인 연구자산이 아니며 연구 결론·역사지리 근거로 쓰지 않는다.
// 실제 제품에서는 승인 연구자산의 reader-facing projection 이 이 자리를 대체한다(source_research_asset_ids 는 그때 채운다).
//
// GuideTopic { id, title, passage_refs, source_research_asset_ids }
// GuideStep  { id, topic_id, sequence, title, short_explanation, passage_ref, place_ids, person_ids, event_ids, route_id, layer_state, camera_target }
// (+ fixture 표식: status, authority)
// routes: fixture-local 보조 표 — Lock 은 route_id 만 규정하고 경로 자체의 스키마는 침묵하므로 여기서는 최소 필드(label, place_ids, legend)만 둔다.
window.BVC_GUIDE_FIXTURE = {
  meta: { schema: "JUDEBIBLE_CONTEXT_LOCK_v1.1#13", status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE", note: "UI 개발용 샘플. 승인 연구자산 projection 이 아님." },
  topics: [
    { id: "gt.gen22.moriah", title: "모리아 산으로의 여정 (샘플)", passage_refs: ["gen-22"], source_research_asset_ids: [], status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE" }
  ],
  steps: [
    { id: "gs.gen22.1", topic_id: "gt.gen22.moriah", sequence: 2, title: "모리아 사건 후 브엘세바로 돌아옴", short_explanation: "모리아 사건 뒤 아브라함은 브엘세바로 돌아가 거주합니다. (창 22:19)", passage_ref: "gen-22:19", place_ids: ["beersheba"], person_ids: [], event_ids: [], route_id: null, layer_state: { route: false, place: true }, camera_target: null, basis: { research_id: "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01", claim: "CLM-BS-03", locator: "Genesis 22:19" }, status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE" },
    { id: "gs.gen22.2", topic_id: "gt.gen22.moriah", sequence: 1, title: "모리아 땅에 이르러 (샘플)", short_explanation: "샘플: 지시받은 산이 있는 모리아 지역에서 번제를 준비하는 장면.", passage_ref: "gen-22:2", place_ids: ["moriah"], person_ids: ["abraham", "isaac", "god"], event_ids: [], route_id: null, layer_state: { route: false, place: true }, camera_target: { place_id: "moriah", zoom: 1.8 }, status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE" }
  ],
  // 경로(route)는 제거됨: 본문상 귀환(창 22:19)은 지원되지만 이동 geometry 는 연구자산에 없어 선을 그리지 않는다(Gate DECISION_04).
  routes: {}
};
