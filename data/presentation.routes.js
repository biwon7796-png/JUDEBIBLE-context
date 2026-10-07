// Captain-approved presentation-only inferred route bindings.
// Display contract only: never canonical route_geometry, never Registry authority.
window.JBC_PRESENTATION_ROUTES = {
  meta: {
    schema: "JBC_PRESENTATION_ONLY_INFERRED_ROUTES_v0.1",
    status: "CAPTAIN_APPROVED_ACTIVE",
    approved_on: "2026-10-04",
    authority_scope: "PRESENTATION_ONLY_ROUTE_INFERENCE",
    research_geometry_effect: "NONE_RETAIN_HOLD",
    registry_effect: "NONE"
  },
  routes: {
    Moriah_to_Beersheba_return: { passages: ["gen-22"], anchors: ["Moriah", "Beersheba"] },
    Rehoboth_area_to_Beersheba: { passages: ["gen-26"], anchors: ["Rehoboth", "Beersheba"] },
    Abraham_Negev_context_to_Gerar: { passages: ["gen-20"], anchors: ["Negev", "Gerar"] },
    Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba: { passages: ["gen-26"], anchors: ["Gerar", "Rehoboth", "Beersheba"] },
    Abimelech_delegation_Gerar_to_Beersheba: { passages: ["gen-26"], anchors: ["Gerar", "Beersheba"] },
    Macedonia_to_Achaia: { passages: ["act-19"], anchors: ["Macedonia", "Achaia"] },
    Athens_to_Corinth: { passages: ["act-18"], anchors: ["Athens", "Corinth"] }
  }
};
