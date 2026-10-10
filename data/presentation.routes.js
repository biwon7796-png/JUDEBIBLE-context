// Captain-approved presentation-only inferred route bindings.
// Display contract only: never canonical route_geometry, never Registry authority.
// Holman Chapter 1 corridors reuse only existing drawable reference anchors that
// the Project01 route research explicitly names. Missing topology fails closed.
window.JBC_PRESENTATION_ROUTES = {
  meta: {
    schema: "JBC_PRESENTATION_ONLY_INFERRED_ROUTES_v0.2",
    status: "CAPTAIN_APPROVED_ACTIVE",
    approved_on: "2026-10-04",
    updated_on: "2026-10-08",
    authority_scope: "PRESENTATION_ONLY_ROUTE_INFERENCE",
    research_geometry_effect: "NONE_RETAIN_HOLD",
    registry_effect: "NONE",
    canonical_mutation: "NONE",
    modern_road_snapping: false,
    source_map_tracing: false
  },
  routes: {
    Moriah_to_Beersheba_return: { passages: ["gen-22"], anchors: ["Moriah", "Beersheba"] },
    Rehoboth_area_to_Beersheba: { passages: ["gen-26"], anchors: ["Rehoboth", "Beersheba"] },
    Abraham_Negev_context_to_Gerar: { passages: ["gen-20"], anchors: ["Negev", "Gerar"] },
    Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba: { passages: ["gen-26"], anchors: ["Gerar", "Rehoboth", "Beersheba"] },
    Abimelech_delegation_Gerar_to_Beersheba: { passages: ["gen-26"], anchors: ["Gerar", "Beersheba"] },
    Macedonia_to_Achaia: { passages: ["act-19"], anchors: ["Macedonia", "Achaia"] },
    Athens_to_Corinth: { passages: ["act-18"], anchors: ["Athens", "Corinth"] },

    // HBA01-05 names Gaza, Aphek, Wadi Ara and Megiddo as core nodes. Only Gaza
    // currently resolves to an existing drawable reference anchor, so no segment
    // is created. Do not bridge the missing anchors with inferred waypoints.
    "route.international_coastal": {
      entity_id: "route.international_coastal",
      kind: "CORRIDOR_ROUTE",
      passages: ["isa-8", "jdg-5", "1ki-9", "2ki-23"],
      reader_label: "연구 기반 개략 경로",
      presentation_status: "GEOMETRY_HOLD_INSUFFICIENT_DRAWABLE_ANCHORS",
      anchors: [
        {
          key: "gaza",
          label: "가자",
          reference_id: "NE-PP-1159150445",
          source_basis: "JBC_HBA01_05_INTERNATIONAL_COASTAL_HIGHWAY_WORBS_20261007_01 · 핵심 노드: 가자"
        }
      ],
      segments: [],
      hold_reason: "아벡·와디 아라·므깃도의 승인된 drawable anchor가 현재 runtime에 없어 corridor segment를 만들지 않습니다."
    },

    // HBA01-06 explicitly supports the Aqaba/Ezion-geber vicinity and a northward
    // Damascus direction, but those two references do not establish the ancient
    // alignment between them. Keep the supported endpoints as provenance only and
    // fail closed until research-supported intermediate anchors can form segments.
    "route.kings_highway": {
      entity_id: "route.kings_highway",
      kind: "CORRIDOR_ROUTE",
      passages: ["num-20", "num-21", "deu-2", "1ki-9", "1ki-22"],
      reader_label: "연구 기반 개략 경로",
      presentation_status: "GEOMETRY_HOLD_INSUFFICIENT_DRAWABLE_ANCHORS",
      anchors: [
        {
          key: "gulf-of-aqaba",
          label: "아카바만·에시온게벨 부근",
          reference_id: "water-gulf-of-aqaba",
          source_basis: "JBC_HBA01_06_KINGS_HIGHWAY_WORBS_20261007_01 · 아카바만·에시온게벨 부근"
        },
        {
          key: "damascus-direction",
          label: "다메섹 방향",
          reference_id: "modern-damascus",
          source_basis: "JBC_HBA01_06_KINGS_HIGHWAY_WORBS_20261007_01 · 북쪽 다메섹 방향"
        }
      ],
      segments: [],
      hold_reason: "아카바만·에시온게벨 부근과 다메섹 방향은 corridor 범위만 지지하며, 그 사이의 정확한 고대 선형을 구성할 연구 기반 중간 anchor가 없어 선을 표시하지 않습니다."
    }
  }
};
