# 말씀의 숲 — 땅으로 읽는 성경

## SERIES ARCHITECTURE v0.1

```yaml
DOCUMENT_CONTROL:

  asset_id:
    MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE

  representative:
    MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE_v0.1

  working_series:
    땅으로_읽는_성경

  version:
    v0.1

  status:
    APPROVED

  captain_final_review:
    COMPLETED

  scope:
    SERIES_LEVEL_ARCHITECTURE

  existing_volume_authority_preserved:
    - MALSUM_FOREST_BIBLE_ATLAS_01_BOOK_ARCHITECTURE_v0.1
    - existing_Bible_Atlas_research
    - existing_place_and_region_structures
    - existing_reader_layer_research_notes_evidence_ledger
    - existing_approved_maps_and_visual_assets

  does_not_approve:
    - new_volume
    - new_volume_title
    - new_manuscript
    - new_map
    - new_research_claim
    - publication_release
```

# 1. SERIES_IDENTITY

```yaml
SERIES_IDENTITY:

  public_name:
    땅으로 읽는 성경

  internal_family:
    MALSUM_FOREST_BIBLE_LAND

  identity:
    BIBLE_WORLD_READING_SERIES

  not_merely:
    - BIBLE_ATLAS_SERIES
    - BIBLE_GEOGRAPHY_SERIES
    - BIBLE_HISTORY_SERIES
    - ARCHAEOLOGY_SERIES
    - BIBLE_BACKGROUND_ENCYCLOPEDIA

  core_definition: >
    성경의 말씀과 사건이 일어난 실제 세계를
    땅, 환경, 이동, 생명, 정착, 생활의 조건을 통해 이해하고,
    그 이해를 다시 성경 본문 읽기로 돌려보내는
    시각적·증거 기반 성경 독서 시리즈.

  final_destination:
    READ_SCRIPTURE_AGAIN
```

이 시리즈의 최종 목적은 성경 시대의 세계에 대한 지식을 많이 전달하는 것이 아닙니다.

핵심은 다음 이동입니다.

```text
실제 세계를 본다
→ 그 세계에서 인간이 어떻게 살았는지 이해한다
→ 성경의 장면과 사건을 다시 본다
→ 본문으로 돌아간다
```

따라서 시리즈가 성공했다는 것은 독자가 “성경 지리를 많이 알게 되었다”는 뜻만이 아닙니다.

> 이전에는 평면적으로 읽던 본문을 이제 거리, 지형, 물, 계절, 길, 생명, 정착과 인간의 실제 삶을 함께 보며 다시 읽을 수 있게 되었다는 뜻입니다.


# 2. SERIES_NAME_SCOPE_TEST

```yaml
SERIES_NAME_SCOPE_TEST:

  candidate:
    땅으로 읽는 성경

  result:
    PASS_WITH_DEFINED_EXPANSION

  strength:
    - 짧고 기억하기 쉽다
    - 기존 Bible Atlas 자산과 직접 연결된다
    - 독자의 행동을 "읽는다"로 규정한다
    - 지리 정보집보다 성경 독서 프로젝트라는 인상이 강하다
    - 장소와 실제 세계라는 시리즈 정체성을 명확히 한다

  risk:
    literal_land_only_reading: >
      "땅"을 지형과 토양으로만 이해하면
      물, 기후, 식물, 동물, 도시, 농업, 길과 같은 후속 권이
      시리즈 바깥처럼 보일 수 있다.

  resolution:
    LAND_IS_NOT_TERRAIN_ONLY

  public_scope_sentence: >
    여기서 '땅'은 산과 평야만을 뜻하지 않습니다.
    성경의 사람들이 걷고, 먹고, 일하고, 이동하고,
    마을을 세우며 살아갔던 실제 세계 전체를 뜻합니다.

  rename_required:
    false
```

따라서 **「땅으로 읽는 성경」을 상위 시리즈명으로 유지**합니다.

다만 시리즈의 공식 정의에서 반드시 다음을 잠급니다.

```text
LAND ≠ TERRAIN ONLY

LAND
= PLACE
+ TERRAIN
+ WATER
+ CLIMATE
+ ECOLOGY
+ MOVEMENT
+ SETTLEMENT
+ MATERIAL LIFE
+ HUMAN USE OF SPACE
```

즉 이 시리즈에서 “땅”은 물리적 지표면을 뜻하는 좁은 지리 용어가 아니라 **성경 인물이 몸을 가지고 살아간 실제 세계**를 가리키는 독자용 상위 개념입니다.


# 3. CENTRAL_QUESTION

```yaml
CENTRAL_QUESTION: >
  성경의 말씀과 사건은
  어떤 실제 땅과 환경과 인간의 삶 속에서 일어났으며,
  그 세계를 이해할 때
  우리는 성경 본문을 어떻게 더 구체적으로 다시 읽을 수 있는가?
```

보조 질문은 세 종류로 제한합니다.

```text
WHERE
이 장면은 어떤 공간에서 일어났는가?

HOW
그 공간에서 사람들은 어떻게 이동하고 살아갔는가?

SO_WHAT_FOR_READING
이 사실을 알고 본문으로 돌아가면 무엇이 더 잘 보이는가?
```

마지막 질문은 새로운 신학적 결론을 만드는 장치가 아닙니다.

항상 승인된 본문 연구의 범위 안에서만 작동합니다.


# 4. READER_PROMISE

```yaml
READER_PROMISE:

  primary: >
    지도를 외우게 하지 않고,
    성경의 장면을 실제 세계 안에서 볼 수 있게 돕는다.

  secondary:
    - 장소 이름을 실제 공간 관계 속에서 이해하게 한다
    - 거리와 이동을 체감하게 한다
    - 물과 계절과 환경이 인간 생활에 준 조건을 이해하게 한다
    - 도시와 길과 농업과 생태를 서로 연결해 보게 한다
    - 확실히 아는 것과 추정하는 것을 구별하게 한다
    - 시각자료를 보면서 근거와 한계까지 함께 읽게 한다
    - 마지막에는 다시 성경 본문을 읽게 한다

  prohibited_promise:
    - 성경의 모든 지명을 확정해 준다
    - 고고학이 성경을 증명한다
    - 지리만 알면 본문의 의미가 결정된다
    - 모든 성경 사건의 경로를 재현할 수 있다
    - 현대의 지형이 성경 시대와 완전히 동일하다
```


# 5. LAND_WORLD_DEFINITION

시리즈가 다루는 실제 세계는 다섯 층으로 정의합니다.

```yaml
LAND_WORLD_MODEL:

  L1_PHYSICAL_WORLD:
    includes:
      - terrain
      - elevation
      - valleys
      - plains
      - deserts
      - geology
      - water
      - coast
      - climate
      - season

    question:
      이 공간은 물리적으로 어떤 곳이었는가?

  L2_LIVING_WORLD:
    includes:
      - plants
      - animals
      - cultivated_ecology
      - pasture
      - seasonal_life

    question:
      그 환경에서 어떤 생명 세계가 함께 존재했는가?

  L3_HUMAN_WORLD:
    includes:
      - settlement
      - agriculture
      - pastoralism
      - food
      - houses
      - wells
      - fields
      - labor
      - material_life

    question:
      사람들은 그곳에서 어떻게 살아갔는가?

  L4_MOVEMENT_AND_NETWORK:
    includes:
      - roads
      - passes
      - routes
      - ports
      - trade
      - travel
      - military_movement
      - regional_connectivity

    question:
      사람과 물자와 군대와 소식은 어떻게 움직였는가?

  L5_BIBLICAL_SCENE:
    includes:
      - biblical_place
      - event
      - movement
      - spatial_relationship
      - approved_historical_context

    question:
      이 실제 세계 안에서 성경 장면을 다시 보면 무엇이 보이는가?
```

중요한 경계는 다음과 같습니다.

```text
L1–L4가
L5의 신학적 의미를 자동 생성하지 않는다.

WORLD CONTEXT
≠
BIBLICAL MEANING

WORLD CONTEXT
→
HELPS_READER_SEE_TEXT
```


# 6. EDITORIAL_LENS

모든 권은 여섯 개 렌즈 중 필요한 것만 선택합니다.

```yaml
EDITORIAL_LENS:

  PLACE:
    asks:
      어디인가

  FORM:
    asks:
      어떤 지형과 환경인가

  LIFE:
    asks:
      그곳에서 사람과 생명은 어떻게 살아가는가

  MOVEMENT:
    asks:
      어떻게 연결되고 이동하는가

  EVIDENCE:
    asks:
      우리는 이것을 어떻게 아는가

  TEXT:
    asks:
      이 세계를 알고 본문으로 돌아가면 무엇이 더 잘 보이는가
```

모든 권이 여섯 렌즈를 같은 비율로 가져야 하는 것은 아닙니다.

예를 들어 WATER 권은 `FORM + LIFE + TEXT`가 중심일 수 있고, ROADS 권은 `MOVEMENT + PLACE + TEXT`, CITIES 권은 `PLACE + LIFE + EVIDENCE + TEXT`가 중심이 될 수 있습니다.


# 7. READER_JOURNEY

기존 가설을 다음과 같이 확정합니다.

```text
LAND
↓
WORLD
↓
HUMAN LIFE
↓
BIBLICAL TEXT / EVENT
↓
READ AGAIN
```

독자 경험 언어로는 다음과 같습니다.

```yaml
READER_JOURNEY:

  1_DISCOVER:
    "이런 땅이었구나."

  2_SEE_RELATION:
    "이곳과 저곳이 이렇게 연결되어 있었구나."

  3_INHABIT:
    "사람이 여기서 산다는 것은 이런 조건 속에 사는 일이었구나."

  4_REENTER_SCENE:
    "그렇다면 이 성경 장면이 전보다 다르게 보인다."

  5_RETURN:
    "이제 본문을 다시 읽어 보자."
```

Volume 01의 기존 독서 리듬인

```text
발견 → 보기 → 이해 → 증거 → 한계 → 성경으로 돌아가기
```

도 폐기하지 않습니다.

이는 각 장의 미시적 독자 흐름으로 보존하고, 위의 다섯 단계는 시리즈 전체의 거시적 흐름으로 사용합니다.


# 8. RESEARCH_AND_EVIDENCE_MODEL

연구 권위는 시리즈 편집 구조보다 위에 둡니다.

```yaml
RESEARCH_AUTHORITY:

  BIBLICAL_TEXT_RESEARCH:
    authority:
      말씀의숲_본문_연구

    owns:
      - textual_observation
      - exegesis
      - biblical_context
      - theological_claim

  GEOGRAPHY_HISTORY_ARCHAEOLOGY:
    authority:
      approved_specialist_research

    owns:
      - place_identification
      - geography
      - chronology
      - historical_context
      - archaeology
      - material_culture

  ENVIRONMENT_ECOLOGY:
    authority:
      approved_specialist_research

    owns:
      - climate
      - hydrology
      - plant_identification
      - animal_identification
      - ecology
      - ancient_environment_reconstruction

  EDITORIAL_PROJECT:
    owns:
      - reader_flow
      - narrative_structure
      - volume_architecture
      - reader_language
      - cross_domain_connection_within_approved_claims

    does_not_own:
      - new_exegesis
      - new_site_identification
      - new_archaeological_conclusion
      - new_environmental_reconstruction
      - certainty_upgrade
```

권위 관계의 핵심은 다음입니다.

```text
성경 본문
≠ 지리가 판정

지리
≠ 고고학이 판정

고고학
≠ 본문 신학을 증명

역사
≠ 본문의 의미를 대체

환경
≠ 인간 행동을 결정

편집
≠ 연구 결론을 생산
```

여러 연구 분야는 서로를 “이기는” 것이 아니라 서로 다른 질문에 답합니다.


# 9. BIBLE_TEXT_RELATIONSHIP

```yaml
BIBLE_TEXT_RELATIONSHIP:

  principle:
    CONTEXT_SERVES_READING

  movement:
    BIBLE_TEXT
    -> WORLD_QUESTION
    -> APPROVED_WORLD_EVIDENCE
    -> RECONSTRUCTED_READER_SCENE
    -> BIBLE_TEXT_AGAIN

  prohibited:
    - geography_determines_theology
    - archaeology_proves_theology
    - visual_reconstruction_becomes_biblical_fact
    - environmental_determinism
    - modern_landscape_equals_ancient_landscape
```

이 시리즈에서 지리·환경 정보의 역할은 본문의 숨겨진 비밀을 해독하는 것이 아닙니다.

역할은 더 절제되어 있습니다.

> 본문에 이미 있는 거리, 장소, 이동, 환경, 도시, 물, 농업, 생명과 같은 요소를 독자가 실제적인 것으로 다시 볼 수 있도록 돕는 것입니다.


# 10. MAP_AND_VISUAL_ROLE

지도와 시각자료는 장식이 아닙니다.

```yaml
VISUAL_ROLE:

  map:
    role:
      SPATIAL_ARGUMENT_AND_READING_TOOL

  terrain_visual:
    role:
      PHYSICAL_RELATIONSHIP_TOOL

  diagram:
    role:
      PROCESS_OR_RELATION_TOOL

  reconstruction:
    role:
      CONDITIONAL_WORLD_MODEL

  photograph:
    role:
      PRESENT_DAY_OBSERVATION_REFERENCE

  illustration:
    role:
      READER_ORIENTATION
```

지도는 최소한 한 가지 독자 질문에 답해야 합니다.

```text
어디에 있는가?
무엇과 가까운가?
무엇이 가로막는가?
어디로 이동할 수 있는가?
물은 어디에서 오는가?
어떤 지역이 서로 연결되는가?
왜 이곳이 통로 또는 경계가 되는가?
```

질문에 답하지 못하는 지도는 넣지 않습니다.

기존 Volume 01의 원칙인

```text
MAP OF PLACES
+
MAP OF EVIDENCE
```

를 시리즈 전체에 확장합니다.

따라서 지도상의 다음 요소도 각각 주장입니다.

```text
POINT
LINE
AREA
BOUNDARY
ROUTE
WATERCOURSE
ENVIRONMENTAL_ZONE
RECONSTRUCTED_FEATURE
```

시각자료가 사실보다 더 강하게 말해서는 안 됩니다.


# 11. BOOK_FAMILY_ARCHITECTURE

후속 권은 “시대순 2권, 3권, 4권”만으로 확장하지 않습니다.

시리즈에는 서로 다른 세 종류의 권이 공존할 수 있습니다.

```yaml
BOOK_FAMILY_ARCHITECTURE:

  FAMILY_A_FOUNDATION:
    purpose:
      성경 세계를 읽기 위한 기본 좌표계 형성

    examples:
      - LAND_AND_TERRAIN
      - WATER_AND_CLIMATE
      - ROADS_AND_MOVEMENT

    relation_to_vol01:
      Volume_01_is_current_foundation_instance

  FAMILY_B_WORLD:
    purpose:
      실제 환경과 인간 생활의 한 축을 깊이 읽음

    candidate_domains:
      - PLANTS
      - ANIMALS
      - AGRICULTURE_AND_DAILY_LIFE
      - CITIES_AND_SETTLEMENTS

  FAMILY_C_SCENE_AND_NETWORK:
    purpose:
      여러 환경 요소가 한 성경 세계에서 상호작용하는 것을 읽음

    candidate_domains:
      - WAR_AND_STRATEGIC_GEOGRAPHY
      - regional_worlds
      - movement_worlds
      - selected_biblical_landscapes
```

중요한 변화는 다음입니다.

```text
SERIES
≠
VOL01의 장들을 각각 한 권으로 단순 확대

SERIES
=
하나의 성경 세계를
서로 다른 질문과 스케일로 읽는 책들의 가족
```


# 12. CANDIDATE_BOOK_DOMAIN_EVALUATION

현재 후보 도메인은 승인하지 않고 Architecture 적합성만 평가합니다.

```yaml
DOMAIN_EVALUATION:

  LAND_AND_TERRAIN:
    series_fit:
      VERY_HIGH
    role:
      FOUNDATION
    overlap_risk:
      VOL01_HIGH
    condition:
      기존 Volume 01 물리 지리와 역할 재설계 필요
    approval:
      NOT_GRANTED

  WATER_AND_CLIMATE:
    series_fit:
      VERY_HIGH
    role:
      FOUNDATION_OR_WORLD
    strength:
      환경과 인간 생활과 본문 장면을 연결하기 좋음
    overlap_risk:
      VOL01_PART02_MEDIUM
    approval:
      NOT_GRANTED

  PLANTS:
    series_fit:
      HIGH
    role:
      LIVING_WORLD
    requirement:
      자연사 시리즈와 관할 차별화 필요
    approval:
      NOT_GRANTED

  ANIMALS:
    series_fit:
      HIGH
    role:
      LIVING_WORLD
    requirement:
      살아 있는 세계 시리즈와 중복 경계 필수
    approval:
      NOT_GRANTED

  ROADS_AND_MOVEMENT:
    series_fit:
      VERY_HIGH
    role:
      FOUNDATION_NETWORK
    overlap_risk:
      VOL01_PART03_HIGH
    condition:
      이동 자체를 주 질문으로 재정의할 때 독립 가능
    approval:
      NOT_GRANTED

  CITIES_AND_SETTLEMENTS:
    series_fit:
      VERY_HIGH
    role:
      HUMAN_WORLD
    strength:
      지형·물·방어·경제·생활을 한 권에서 통합 가능
    approval:
      NOT_GRANTED

  AGRICULTURE_AND_DAILY_LIFE:
    series_fit:
      VERY_HIGH
    role:
      HUMAN_WORLD
    boundary:
      일반 성경문화사로 확장되지 않도록 공간·환경 연결 필수
    approval:
      NOT_GRANTED

  WAR_AND_STRATEGIC_GEOGRAPHY:
    series_fit:
      HIGH
    role:
      SCENE_AND_NETWORK
    risk:
      전투사 또는 군사사 중심으로 변질 가능
    condition:
      terrain_route_water_city_relationship 중심일 것
    approval:
      NOT_GRANTED
```


# 13. VOLUME_SELECTION_LOGIC

새 권은 “자료가 많다”는 이유로 만들지 않습니다.

```yaml
VOLUME_SELECTION_GATE:

  G1_SERIES_QUESTION:
    >
    실제 세계를 이해함으로써
    성경 독서에 반복적으로 도움을 주는 질문인가?

  G2_DISTINCT_LENS:
    >
    기존 권과 다른 중심 질문과 독자 경험을 가지는가?

  G3_WORLD_COHERENCE:
    >
    단순 정보 목록이 아니라
    여러 요소가 하나의 세계로 연결되는가?

  G4_SCRIPTURE_RETURN:
    >
    마지막에 실제 성경 본문으로 돌아갈 수 있는가?

  G5_VISUAL_NECESSITY:
    >
    지도·도식·환경 시각자료가
    이해를 실질적으로 향상시키는가?

  G6_RESEARCH_FEASIBILITY:
    >
    충분히 검증할 수 있는 연구 기반이 존재하는가?

  G7_PORTFOLIO_BOUNDARY:
    >
    다른 말씀의 숲 시리즈가 더 적절한 주제가 아닌가?

  G8_NON_DUPLICATION:
    >
    기존 Volume 01 또는 다른 권을
    단순 확장·반복하는 것이 아닌가?

  required_result:
    ALL_MATERIAL_GATES_PASS

  approval_authority:
    CAPTAIN
```


# 14. SERIES_CONTINUITY

모든 책이 같은 목차를 가져서는 안 되지만, 같은 시리즈라는 것을 독자가 느껴야 합니다.

연속성은 목차가 아니라 다음 다섯 가지에서 발생합니다.

```yaml
SERIES_CONTINUITY:

  C1_CORE_QUESTION:
    실제 세계를 통해 성경을 다시 읽는다

  C2_EVIDENCE_ETHIC:
    아는 것과 모르는 것을 구별한다

  C3_VISUAL_GRAMMAR:
    지도와 시각자료가 사고 도구로 기능한다

  C4_READER_MOVEMENT:
    WORLD_TO_TEXT_TO_READ_AGAIN

  C5_RESEARCH_LAYERS:
    - READER_LAYER
    - RESEARCH_NOTE_OR_EQUIVALENT
    - EVIDENCE_TRACE
```

공통 독자 경험은 다음처럼 유지합니다.

```text
보인다
→ 연결된다
→ 이해된다
→ 한계를 안다
→ 본문으로 돌아간다
```


# 15. PER_VOLUME_INDIVIDUALITY

```yaml
PER_VOLUME_INDIVIDUALITY:

  each_volume_must_define:
    - ONE_PRIMARY_WORLD_QUESTION
    - ONE_DOMINANT_VISUAL_MODE
    - ONE_DISTINCT_READER_EXPERIENCE
    - ONE_SCALE
    - ONE_NON_DUPLICATION_BOUNDARY

  possible_scale:
    - CONTINENTAL
    - REGIONAL
    - LANDSCAPE
    - CITY
    - ROUTE
    - ECOLOGICAL
    - DAILY_LIFE

  fixed_chapter_formula:
    PROHIBITED
```

예를 들어 후속 권들은 서로 이렇게 달라질 수 있습니다.

```text
지형 권
→ 공간을 위에서 내려다본다.

물 권
→ 물의 흐름을 따라 세계를 읽는다.

길 권
→ 사람의 움직임을 따라간다.

도시 권
→ 한 장소에 모인 인간 생활을 읽는다.

농업 권
→ 계절과 노동과 땅의 관계를 읽는다.
```

“시리즈다움”은 동일한 콘텐츠 틀에서 나오지 않고 동일한 **독서 철학과 증거 윤리**에서 나옵니다.


# 16. CERTAINTY_AND_RECONSTRUCTION_BOUNDARY

기존 Volume 01의 확실성 체계를 시리즈 공통 원칙으로 승격합니다.

```yaml
READER_CERTAINTY_SCALE:

  CERTAIN:
    reader_language:
      확실하게 알 수 있음

  LIKELY:
    reader_language:
      현재로서는 유력함

  PLAUSIBLE:
    reader_language:
      가능성 있음

  MULTIPLE_VIEWS:
    reader_language:
      여러 견해가 있음

  UNKNOWN:
    reader_language:
      현재로서는 알 수 없음
```

내부 연구 상태는 더 세분할 수 있지만 독자 지면에서는 내부 상태 코드를 그대로 노출하지 않습니다.

재구성에는 별도 규칙을 적용합니다.

```yaml
RECONSTRUCTION_RULE:

  OBSERVED:
    direct_or_well_established_evidence

  INFERRED:
    evidence_based_inference

  RECONSTRUCTED:
    model_combining_multiple_evidence_types

  HYPOTHETICAL:
    one_possible_explanatory_model

  UNKNOWN:
    evidence_insufficient
```

핵심 선언:

```text
재구성 그림이 구체적으로 보인다는 사실
≠
역사적 확실성이 높다는 뜻
```

따라서 시각적으로 빈틈없는 복원을 만들기 위해 연구의 빈틈을 상상으로 채우지 않습니다.


# 17. OTHER_MALSUM_FOREST_SERIES_BOUNDARY

```yaml
SERIES_BOUNDARIES:

  VS_THEME_ISSUES:
    THEME_ISSUES:
      center:
        theological_or_pastoral_question
    BIBLE_LAND:
      center:
        actual_world_and_spatial_reading

  VS_LIVING_WORLD:
    LIVING_WORLD:
      center:
        organism_observation_and_natural_history
      reader_question:
        이 생명체는 어떻게 살아가는가?

    BIBLE_LAND:
      center:
        biblical_world_context
      reader_question:
        이 생명과 환경은 성경 세계 안에서 어떤 실제 조건을 형성했는가?

  VS_BIBLE_STORIES:
    BIBLE_STORIES:
      center:
        narrative_retelling_and_sequence

    BIBLE_LAND:
      center:
        spatial_environmental_context

  overlap_rule:
    SAME_SUBJECT_MAY_APPEAR
    IF_EDITORIAL_QUESTION_IS_DISTINCT
```

예를 들어 포도나무는 두 시리즈에서 모두 등장할 수 있습니다.

```text
살아 있는 세계
→ 포도나무라는 식물을 관찰한다.

땅으로 읽는 성경
→ 포도 재배가 가능한 기후·토양·계절·농업 생활과
   그 세계가 성경 장면에 제공하는 실제 배경을 읽는다.
```

동물이 등장한다고 자동으로 자연사 시리즈가 되는 것도 아니며, 성경 구절이 등장한다고 자동으로 “땅으로 읽는 성경”이 되는 것도 아닙니다.

판정 기준은 **대상이 아니라 중심 질문**입니다.


# 18. ANTI_FORMULA_RULES

시리즈가 장기화될수록 가장 위험한 것은 좋은 첫 권의 구조가 공식이 되는 것입니다.

```yaml
ANTI_FORMULA_RULES:

  prohibited:
    - 모든 권 6_PART_STRUCTURE
    - 모든 장 동일한 소제목 수
    - 모든 장 동일한 지도 수
    - 모든 주제를 지리로 환원
    - 모든 성경 사건을 환경으로 설명
    - every_chapter_requires_archaeology
    - every_chapter_requires_theological_application
    - every_visual_requires_full_reconstruction
    - Volume01_structure_copying
    - encyclopedia_accumulation
    - trivia_accumulation
    - forced_scripture_connection

  required:
    - question_first
    - evidence_first
    - volume_specific_architecture
    - reader_need_first
    - visual_function_defined_before_asset_creation
    - uncertainty_preserved
    - return_to_scripture
```

특히 다음 공식은 금지합니다.

```text
지형 정보
→ 성경 사건
→ 영적 교훈

X
```

또한 다음 식의 결정론도 금지합니다.

```text
광야였기 때문에 반드시 ...
산지였기 때문에 사람들이 ...
물이 부족했기 때문에 이 사건은 ...
```

환경은 행동의 조건을 형성할 수 있지만 인간 행동이나 본문의 의미를 자동 결정하지 않습니다.


# 19. LONG_TERM_SERIES_DIRECTION

시리즈는 백과사전처럼 끝없이 항목을 늘리는 방향보다, 하나의 세계를 점점 더 입체적으로 구축하는 방향으로 성장합니다.

```yaml
LONG_TERM_SERIES_DIRECTION:

  PHASE_1_FOUNDATION:
    goal:
      독자에게 성경 세계의 공간 감각을 제공
    current_anchor:
      성경의 땅을 읽는 법

  PHASE_2_WORLD_SYSTEMS:
    goal:
      실제 세계를 구성하는 핵심 시스템을 읽음
    possible_domains:
      - water
      - climate
      - movement
      - settlement
      - agriculture
      - ecology

  PHASE_3_INTEGRATED_LANDSCAPES:
    goal:
      여러 시스템이 하나의 지역·도시·이동 세계에서
      어떻게 함께 작동하는지 읽음

  PHASE_4_SCRIPTURE_REENTRY:
    goal:
      충분히 승인된 연구 자산이 축적된 경우
      특정 성경 세계를 공간적으로 다시 읽는 통합 권 검토

  automatic_volume_creation:
    false

  fixed_volume_count:
    NONE
```

장기적으로 독자 머릿속에는 개별 책 목록보다 하나의 연결된 “성경 세계”가 형성되어야 합니다.

```text
지형
↕
물과 계절
↕
식생과 동물
↕
농업과 목축
↕
도시와 정착
↕
길과 이동
↕
정치·전쟁·교역
↕
성경의 장소와 사건
```

그러나 이 연결망을 하나의 거대한 결정론적 설명으로 합치지 않습니다.

각 요소는 하나의 실제 세계 안에서 연결되지만 서로 다른 연구 권위를 유지합니다.


# 20. SERIES_ARCHITECTURE_SUMMARY

```yaml
SERIES_ARCHITECTURE_SUMMARY:

  series_name:
    땅으로 읽는 성경

  name_decision:
    RETAIN

  series_identity:
    BIBLE_WORLD_READING_SERIES

  definition_of_land:
    ACTUAL_INHABITED_BIBLICAL_WORLD

  central_movement:
    LAND
    -> WORLD
    -> HUMAN_LIFE
    -> BIBLICAL_TEXT_AND_EVENT
    -> READ_AGAIN

  governing_principle:
    CONTEXT_SERVES_SCRIPTURE_READING

  visual_principle:
    VISUAL_IS_READING_TOOL_NOT_DECORATION

  evidence_principle:
    SHOW_WHAT_WE_KNOW_AND_HOW_WELL_WE_KNOW_IT

  research_principle:
    MULTIPLE_DISCIPLINES_KEEP_DISTINCT_AUTHORITY

  continuity:
    SHARED_READING_PHILOSOPHY_NOT_SHARED_FIXED_FORMULA

  volume_logic:
    QUESTION_DRIVEN_NOT_TOPIC_ACCUMULATION

  existing_volume_01:
    role:
      FOUNDATION_AND_REFERENCE_ANCHOR
    architecture:
      PRESERVED

  candidate_new_domains:
    status:
      EVALUATED_NOT_APPROVED

  new_volume_approval:
    NONE

  new_research:
    NONE

  new_maps:
    NONE

  registry_change:
    NONE

  publication_release:
    NOT_AUTHORIZED
```


# 21. SERIES QUALITY TEST

새 권 후보는 다음 문장을 통과해야 합니다.

```text
이 책이 없어도 동일한 내용을
일반 성경지리책·문화배경책·자연사책에서
거의 그대로 얻을 수 있는가?

YES
→ 시리즈 고유성이 약함.

이 책은 실제 세계의 한 요소를
성경 독자의 공간 감각과 연결하고,
근거와 불확실성을 보여 주며,
마지막에 다시 본문으로 돌아가게 하는가?

YES
→ 시리즈 적합성이 높음.
```


# 22. STAGE_DECISION

```yaml
STAGE_DECISION:

  task:
    BUILD_MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE_v0.1

  result:
    PASS

  output:
    MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE_v0.1

  stage_status:
    APPROVED

  preserved:
    - existing_Bible_Atlas_research
    - existing_Bible_Land_book_architecture
    - place_and_region_structures
    - reader_research_evidence_layer_separation
    - approved_maps_and_visual_assets
    - SOURCE_NOT_EQUAL_LOCATION
    - MAP_OF_PLACES_PLUS_MAP_OF_EVIDENCE
    - competing_hypothesis_parallelism
    - certainty_non_inflation

  prohibited_actions_executed:
    NONE

  captain_final_control:
    PRESERVED
```


# 23. MINIMUM_HANDOFF

```yaml
MINIMUM_HANDOFF:

  from_project:
    말씀의숲_주제호_기획_원고작성

  to_project:
    00_운영관제실_Jude_Lee_OS

  asset_id:
    MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE

  approved_representative:
    MALSUM_FOREST_BIBLE_LAND_SERIES_ARCHITECTURE_v0.1

  version:
    v0.1

  status:
    APPROVED_AND_PERSISTED

  key_decisions:
    - "땅으로 읽는 성경" 상위 시리즈명 유지
    - LAND를 TERRAIN이 아니라 ACTUAL_INHABITED_BIBLICAL_WORLD로 정의
    - 성경지리·역사책이 아니라 BIBLE_WORLD_READING_SERIES로 정의
    - 지도와 시각자료를 READING_TOOL + EVIDENCE_EXPRESSION으로 규정
    - 본문·지리·고고학·역사·환경의 권위 분리
    - 독자 확실성 언어와 재구성 단계 구분
    - 후속 권을 고정 순번이 아니라 BOOK FAMILY + VOLUME SELECTION GATE로 관리
    - Volume 01 구조의 기계적 복제를 금지

  candidate_domains:
    approval:
      NONE

  registry_change:
    NONE

  runtime_change:
    NONE

  external_release:
    NOT_AUTHORIZED

  next_task_one_after_captain_approval:
    task:
      EVALUATE_AND_SELECT_BIBLE_LAND_NEXT_VOLUME_DOMAIN_v0.1

    note: >
      Architecture 승인 후에만
      후보 도메인들을 Volume Selection Gate에 통과시켜
      후속 권 하나를 선택한다.
```
