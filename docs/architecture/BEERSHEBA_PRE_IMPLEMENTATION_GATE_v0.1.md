# BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1

```yaml
BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1:

  status:
    APPROVED_FOR_IMPLEMENTATION_PREP

  implementation_approval:
    SEPARATE

  external_release:
    NOT_AUTHORIZED


  DECISION_01_GATE:

    current_state:
      pre_implementation_gate_in_local_folder: MISSING

    decision: >
      별도의 기존 Gate 파일을 찾았다고 가정하지 않는다.
      아래 결정 전체를 이번 브엘세바 구현의
      최소 Approved Change Set으로 사용한다.

    before_code_change:
      required:
        - 이 Gate를 docs/architecture에 물리 저장
        - 이후 구현자는 이 Gate와 기존 Lock 문서를 함께 읽음


  DECISION_02_IDENTITY:

    canonical_research_identity:
      stable_id: JBC-CR-PLACE-BEERSHEBA-001

    legacy_runtime_key:
      id: beersheba

    decision:
      KEEP_AS_EXPLICIT_COMPATIBILITY_ALIAS

    meaning: >
      beersheba를 별도 Place identity로 유지하지 않는다.
      기존 코드 회귀 방지를 위한 local/legacy key로만 보존하고,
      실제 JudeBible 연구 identity는
      JBC-CR-PLACE-BEERSHEBA-001 하나로 통일한다.

    required_mapping:
      beersheba -> JBC-CR-PLACE-BEERSHEBA-001

    prohibited:
      - name_based_merge
      - duplicate_place_creation
      - existing_runtime_id_mass_rename

    rule: >
      Map / Detail / Guide / Scripture는 최종적으로
      모두 동일 stable_id를 resolve해야 한다.


  DECISION_03_MAP:

    biblical_Beersheba:
      exact_marker: false
      map_pin: NONE
      detail_available: true

    Tel_Beer_Sheva:
      research_status:
        archaeological_candidate: true

      current_web_render:
        map_marker: DEFERRED

      reason: >
        현재 지도는 지리 좌표계가 없는 fixture SVG이므로
        lat/lon을 x/y로 임의 변환해서는 안 된다.

    Modern_Beersheba:
      map_marker: DEFERRED

    current_change_set:
      prohibited:
        - new_basemap
        - lat_lon_projection_invention
        - archaeology_layer_creation
        - fake_coordinate_to_svg_conversion

    controlled_degradation: >
      이번 구현에서는 Detail에서 후보 위치를 설명하되,
      지리 투영이 정의되기 전까지 실제 지도점은 그리지 않는다.


  DECISION_04_GUIDE:

    unsupported_fixture:
      text: "브엘세바에서 출발"
      action: REMOVE_OR_REPLACE

    approved_replacement:
      text: "모리아 사건 후 브엘세바로 돌아옴"
      basis: Genesis_22_19

    route_line:
      action: REMOVE

    reason: >
      본문상 귀환은 지원되지만
      실제 이동 geometry는 연구자산에 없다.

    prohibited:
      - inferred_route_line
      - fixture_departure_claim


  DECISION_05_MEDIA:

    current_media_render:
      image_payload: DO_NOT_LOAD_YET

    show:
      - source_title
      - creator
      - license
      - source_page
      - attribution
      - natural_reader_caption

    rights_projection:
      status: NOT_YET_NORMALIZED_TO_APP_CONTRACT

    therefore:
      external_preview: HOLD

    rule: >
      Wikimedia license 정보가 연구에는 존재하지만,
      현재 앱의 media-rights 상태 계약 및 preview_url과
      외부 로딩 정책이 아직 결속되지 않았으므로
      이번 변경에서는 attribution metadata만 렌더링한다.
```

```yaml
APPROVED_MINIMAL_CHANGE_SET:

  allowed:
    - Beersheba fixture record 하나만 실제 연구 projection으로 교체
    - legacy beersheba key를 stable_id에 명시적으로 매핑
    - biblical Beersheba exact pin 제거
    - 기존 Beersheba route line 제거
    - Guide의 unsupported departure 문구 제거
    - Genesis 22:19 기반 귀환 문구 사용
    - 자연어 위치 상태 표시
    - 연구 PassageLink 기반 관련 본문 표시
    - Wikimedia attribution metadata 표시
    - Research detail을 접힌 영역으로 표시
    - research ID 없는 Person/Event 연결은 숨김
    - targeted QA + full regression 실행

  not_allowed:
    - 전체 fixture migration
    - map projection 신규 설계
    - basemap 추가
    - archaeology layer 신규 구현
    - inferred route geometry
    - Person/Event name-based linking
    - UI redesign
    - source research 수정
```
