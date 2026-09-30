# JBC_GERAR_CONNECTED_WORBS_20260930_01

```yaml
document_id: JBC_GERAR_CONNECTED_WORBS_20260930_01
task: RESEARCH_GERAR_AS_JUDEBIBLE_CONNECTED_RESEARCH_ASSET_v0.1
owner: 01_목회연구_WORBS_BICS
selected_module: WORBS
research_target:
  canonical_name_ko: 그랄
  canonical_name_en: Gerar
parent_asset: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
research_status: RESEARCH_COMPLETE_WITH_VERIFY
approval_status: PENDING_CAPTAIN_REVIEW
quality_gate: PASS_WITH_VERIFY
registry_mutation: NONE
BAT01_crosswalk: NOT_PERFORMED
external_release: NONE
app_code_change: NONE
```

# FINAL_RESEARCH_RESULT

## 0. 연구 판정

그랄은 창세기에서 단순한 배경 지명이 아니라 아브라함과 이삭의 이방 체류, 두려움, 하나님의 보호, 땅의 약속, 생존 자원인 우물, 지역 세력과의 갈등, 그리고 브엘세바에서의 평화 언약으로 이어지는 흐름을 연결하는 장소다. 창세기 10:19에서는 가나안 경계를 설명하는 지리 표지로 등장하고, 창세기 20장에서는 아브라함과 사라의 그랄 체류 및 아비멜렉 사건의 무대가 되며, 창세기 26장에서는 이삭이 기근 가운데 그랄에 머물고 번성한 뒤 우물 분쟁을 겪고 브엘세바로 이동하는 장면의 핵심 공간이 된다. 역대하 14장에서는 아사 시대의 전쟁 서사에서 그랄과 그 주변 도시들이 다시 등장한다.

현재 지리 연구에서는 **Tell Abū Ḥurēre / Tel Haror**가 그랄의 중요한 위치 후보이며, Heidelberg의 성경 지리 데이터베이스는 이를 비교적 신뢰할 만한 후보로 취급한다. 그러나 Tell el-Far'a South, Tell esh-Sharia/Tel Sera, Tell Jemmeh 등 경쟁 동일시가 존재하며, Tell Jemmeh는 초기 발굴사에서 그랄로 불렸으나 후대에는 그 동일시가 약화되었고 2019년 Nadav Na'aman이 다시 제안하는 등 논쟁이 지속된다. 그러므로 **성경의 그랄 자체에는 확정 좌표를 부여하지 않는다.**

창세기 Book Profile은 족장사를 약속의 땅·자손·복이 기근, 갈등, 추방, 두려움 속에서 보존되는 언약 서사로 읽도록 하며, 동시에 후대 지명과 고고학적 위치를 성급히 확정하지 말라고 요구한다. 이 원칙을 그랄 연구의 해석·지리 경계로 유지한다.

---

# 1. Identity

```yaml
Place:
  stable_id: JBC-CR-PLACE-GERAR-001
  stable_id_scope: RESEARCH_LOCAL_CONNECTED_ASSET
  namespace_authority: NOT_CLAIMED
  registry_effect: NONE
  downstream_identity_rule:
    same_identity_for:
      - Scripture
      - Map
      - Detail
      - Guide
    note: >
      이 연구자산 내부와 승인된 downstream projection에서 동일 대상을
      안정적으로 참조하기 위한 연구 로컬 ID이며,
      Registry 또는 BAT01의 전역 ID를 생성·대체하지 않는다.

  identity_lineage:
    type: NEW_EXPLICIT_CONNECTED_RESEARCH_IDENTITY
    parent_asset: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
    parent_relation: Beersheba_to_Gerar
    BAT01_PLACE_reuse: false
    BAT01_P_crosswalk: false
    same_name_auto_merge: prohibited

  canonical_name_ko: 그랄
  canonical_name_en: Gerar

  ancient_name:
    hebrew_consonantal: גרר
    scholarly_transliteration: gĕrār
    greek_form_attested: Γεραρα

  aliases:
    - Gerar
    - Gerara
    - G'rar

  place_type:
    primary: BIBLICAL_PLACE
    secondary:
      - settlement_or_local_center
      - patriarchal_sojourn_place
      - territorial_geographic_reference
      - later_historical_geographic_reference

  region:
    label: Southern Canaan / northwestern Negev–Gaza hinterland
    identity_status: DESCRIPTIVE_ONLY
    stable_region_id_created: false

  certainty:
    biblical_place_identity: HIGH
    exact_modern_location: DISPUTED
    exact_coordinate: NOT_ASSIGNED
```

### Identity boundary

`Gerar`, `Valley of Gerar`, `Tel Haror`, `Tell Jemmeh`, `Tel Sera`, 현대의 `Nahal Gerar`는 자동으로 같은 entity로 병합하지 않는다. 성경의 도시/지역 표지인 그랄을 primary Place로 유지하고, 고고학적 텔은 각각 **candidate archaeological site**로 연결한다.

---

# 2. Reader Layer

## identity

**그랄 — 기근과 낯선 땅에서 약속, 두려움, 갈등, 평화가 교차하는 곳**

## concise_summary

그랄은 아브라함과 이삭이 모두 머물렀던 남부 가나안의 중요한 장소입니다. 아브라함은 이곳에서 사라와 아비멜렉 사건을 겪었고, 이삭은 기근 때문에 그랄에 머물며 하나님의 약속을 다시 들었습니다. 이삭이 크게 번성하자 지역 사람들과 우물 문제로 갈등이 생겼고, 그는 여러 차례 자리를 옮긴 뒤 브엘세바로 올라갑니다. 오늘날 텔 하로르를 그랄의 주요 후보로 보는 견해가 있지만 정확한 위치는 완전히 확정되지 않았습니다.

## quick_facts

| 항목 | 독자용 내용 |
|---|---|
| 이름 | 그랄, Gerar |
| 고대 표기 | 히브리어 `גרר` |
| 대략적 지역 | 가자 남동쪽과 브엘세바 사이의 남부 가나안·북서 네게브 권역 |
| 중요한 인물 | 아브라함, 사라, 이삭, 리브가, 아비멜렉 |
| 중요한 주제 | 기근, 이방 체류, 하나님의 보호, 약속, 번성, 우물, 갈등, 평화 |
| 대표 본문 | 창 20장; 26장 |
| 다른 주요 언급 | 창 10:19; 대하 14:13–15 |
| 오늘의 위치 | 텔 하로르가 주요 후보지만 다른 견해도 있음 |

## related_scripture

창세기 20장에서 아브라함은 네게브 지역을 옮겨 다니다 그랄에 머물고, 사라를 누이라고 말하여 그랄 왕 아비멜렉과 위기를 겪습니다. 본문의 중심은 아브라함의 판단을 미화하는 데 있지 않고 하나님이 사라와 약속의 계보를 위기에서 보존하시는 데 있습니다.

창세기 26장에서 이삭은 기근 때문에 그랄로 가지만 하나님은 애굽으로 내려가지 말고 지시하시는 땅에 머물라고 말씀하시며 아브라함에게 주신 약속을 다시 확인하십니다. 이삭은 그랄에서 번성하지만 우물과 목초·생활 기반을 둘러싼 갈등으로 이동하게 되고, 결국 브엘세바로 올라갑니다. 아비멜렉 일행은 이후 그랄에서 이삭에게 와서 평화의 언약을 제안합니다.

## related_people

**아브라함과 사라**는 창세기 20장의 그랄 사건 중심 인물입니다. **이삭과 리브가**는 창세기 26장에서 그랄 체류와 우물 갈등을 경험합니다. **아비멜렉**은 두 주기에 모두 등장하지만, 두 사건의 아비멜렉을 아무 검증 없이 동일한 한 사람으로 합치지 않습니다. 이삭 이야기에는 **아훗삿**과 군대 장관 **비골**도 등장합니다.

## related_events

1. 아브라함과 사라의 그랄 체류와 아비멜렉 위기
2. 이삭의 기근 중 그랄 체류와 약속 재확인
3. 이삭의 번성과 지역 갈등
4. 그랄 골짜기의 우물 분쟁
5. 그랄에서 브엘세바로 이어지는 이동
6. 아비멜렉 일행이 그랄에서 브엘세바의 이삭을 찾아가 평화를 제안한 사건
7. 훗날 아사 왕의 전쟁에서 그랄과 주변 도시가 다시 등장한 사건

## related_places

**브엘세바**는 그랄 연구의 가장 중요한 연결 장소입니다. 이삭의 그랄 체류와 우물 갈등은 브엘세바 이동으로 이어지고, 그랄에서 온 아비멜렉 일행이 브엘세바에서 이삭과 평화의 약속을 맺습니다. 그 밖에 **가사**, **가데스와 술 사이의 네게브 지역**, **그랄 골짜기**, **르호봇**이 본문 흐름과 연결됩니다. 오늘의 고고학 후보로는 **텔 하로르**, **텔 세라**, **텔 젬메** 등이 있습니다.

## representative_media

대표 사진은 성경의 그랄 자체를 확정한 사진처럼 제시하지 않고, **“그랄의 주요 위치 후보 가운데 하나인 텔 하로르”**라는 설명과 함께 텔 하로르의 전경 사진을 사용하는 것이 적절합니다.

## location_hypothesis

많은 성경 지리 연구에서는 **Tell Abū Ḥurēre / Tel Haror**를 그랄의 주요 후보로 다룹니다. 이곳은 가자에서 남동쪽으로 떨어진 북서 네게브의 큰 유적지이며 청동기와 철기시대의 중요한 정착 흔적이 확인됩니다. 다만 텔 하로르 외에도 다른 후보들이 제안되어 왔으므로, 성경의 그랄을 텔 하로르의 한 좌표와 완전히 동일하다고 단정하지 않는 편이 안전합니다.

## ministry_points_1_to_2

1. **약속은 안전한 환경에서만 유지되지 않습니다.** 아브라함과 이삭의 그랄 이야기는 인간의 두려움, 기근, 낯선 권력, 갈등 속에서도 하나님이 약속을 보존하시는 흐름을 보여 줍니다.
2. **번성은 갈등이 없다는 뜻이 아닙니다.** 이삭은 복을 받으면서도 우물을 둘러싼 다툼과 이동을 겪습니다. 본문은 하나님의 복을 단순한 자리 점유나 경쟁의 승리와 동일시하지 않도록 합니다.

> 이 두 항목은 WORBS 연구에서 도출한 목회 연결 포인트이며, BICS 또는 Kerygma 실행은 아니다.

---

# 3. Biblical Context

## 3.1 Direct mentions

```yaml
DIRECT_MENTION_MT_OR_STANDARD_OT:
  - Genesis 10:19
  - Genesis 20:1
  - Genesis 20:2
  - Genesis 26:1
  - Genesis 26:6
  - Genesis 26:17
  - Genesis 26:20
  - Genesis 26:26
  - 2 Chronicles 14:13
  - 2 Chronicles 14:14

TEXTUAL_VARIANT_OR_VERSION_SPECIFIC:
  - Genesis 26:8_LXX_Gerar_reference
  - Genesis 26:19_LXX_Gerar_reference
  - 1 Chronicles 4:39_LXX_Gerar_where_MT_has_different_reading
```

역대하 절 번호는 역본·본문 전통에 따라 한 절 정도 차이가 생길 수 있으므로 source locator에는 `2 Chr 14:13–15 (English versification)`과 `2 Chr 14:12–13 (some scholarly/German indexing)`을 함께 기록한다.

## 3.2 Strongly related passages

```yaml
STRONGLY_RELATED:
  - Genesis 10:15-20
  - Genesis 20:1-18
  - Genesis 21:22-34
  - Genesis 26:1-33

CONTEXTUAL:
  - 2 Chronicles 14:9-15
```

창세기 21:22–34의 아브라함–아비멜렉 언약 사건은 **브엘세바에서 발생**하므로 그랄 사건으로 위치를 바꾸지 않는다. 다만 창세기 20장의 그랄–아비멜렉 주기와 직접 이어지는 사건으로 relation을 둔다.

---

# 4. Geography

## 4.1 Geographic frame

그랄은 창세기 10:19에서 가사와 함께 가나안 남서 경계를 설명하는 지리 표지로 등장한다. 창세기 20:1은 아브라함이 가데스와 술 사이 지역에서 그랄에 우거했다고 서술한다. 창세기 26장에서는 그랄 자체와 `그랄 골짜기`가 구별되어 나타나므로 도시/정착 중심과 주변 수계·목축·농업 공간을 하나의 좌표로 단순화해서는 안 된다.

Heidelberg ODB/ODG는 후기 전승까지 종합하여 그랄을 가사와 브엘세바 사이 권역에 놓고, Tell Abū Ḥurēre를 현재 가장 비교적 신뢰할 수 있는 후보로 다룬다.

## 4.2 Coordinate status

```yaml
biblical_Gerar:
  exact_coordinate: NOT_ASSIGNED
  render_as_exact_point: false
  reason:
    - multiple_candidate_sites
    - no_single_identification_is_demonstrated
    - city_and_valley_context_should_not_be_collapsed

candidate_sites:

  - candidate_name: Tel Haror / Tell Abu Hureira
    candidate_role: LEADING_LOCATION_HYPOTHESIS
    coordinate_for_archaeological_site:
      lat: 31.382100
      lon: 34.606500
      source: OpenBible
      precision: point_on_tel
    crosscheck_coordinate:
      lat: 31.3815916
      lon: 34.6067366
      source: Heidelberg_ODB
    identification_certainty: MEDIUM
    biblical_equivalence_locked: false

  - candidate_name: Tell Jemmeh
    candidate_role: HISTORICAL_AND_REVIVED_COMPETING_IDENTIFICATION
    coordinate_for_archaeological_site:
      lat: 31.387240
      lon: 34.445060
      source: OpenBible
      precision: point_on_tel
    identification_certainty: LOW_DISPUTED
    biblical_equivalence_locked: false

  - candidate_name: Tell esh-Sharia / Tel Sera
    candidate_role: OLDER_COMPETING_IDENTIFICATION
    coordinate_for_archaeological_site:
      lat: 31.391200
      lon: 34.681600
      source: OpenBible
      precision: point_on_tel
    identification_certainty: LOW
    note: >
      Heidelberg ODG는 지리·고고학적 조건이 일부 맞지만
      오늘날 이 유적이 대체로 Ziklag 후보로 식별되는 점을 중요한 반론으로 기록한다.
    biblical_equivalence_locked: false

  - candidate_name: Tell el-Far'a South
    candidate_role: SCHOLARLY_PROPOSAL
    coordinate_for_asset: NOT_LOCKED
    identification_certainty: LOW
    biblical_equivalence_locked: false
```

## 4.3 Ancient vs modern identity

```yaml
ancient_vs_modern_identity:
  biblical_Gerar:
    type: BIBLICAL_PLACE
    exact_modern_continuity: UNPROVEN

  Tel_Haror:
    type: ARCHAEOLOGICAL_SITE
    relation_to_Gerar: CANDIDATE_IDENTIFICATION

  Nahal_Gerar:
    type: MODERN_WADI_NAME
    relation_to_Gerar: REGIONAL_TOPONYMIC_CONTEXT
    same_entity_as_biblical_city: false

  modern_city_named_Gerar:
    canonical_continuation: NONE_LOCKED
```

현대 수계 명칭 `Nahal Gerar`가 존재한다고 해서 성경 도시의 정확한 위치가 자동으로 확정되는 것은 아니다.

## 4.4 Competing location views

### View A — Tell Abū Ḥurēre / Tel Haror

현재 자산의 **leading hypothesis**. Heidelberg ODG는 이 텔이 가사 남동쪽, 북서 네게브의 큰 정착지이며 제2천년기와 제1천년기에 요새화된 도시가 있었고, 중기 청동기 II의 성역과 후대 블레셋 관련 물질문화가 확인된다는 점을 들어 그랄 후보로 비교적 긍정적으로 평가한다.

### View B — Tell esh-Sharia / Tel Sera

Eusebius의 거리 정보와 일부 고고학 조건에 맞는다는 장점 때문에 제안되었으나, 오늘날 이 유적은 대체로 **시글락(Ziklag)** 후보로 더 많이 사용된다. 따라서 그랄 동일시는 낮은 확률의 경쟁 견해로 보존한다.

### View C — Tell Jemmeh

Flinders Petrie는 1920년대 Tell Jemmeh를 그랄로 식별했다. 현대의 한 연구는 Van Beek의 재평가를 따라 이 동일시가 더 이상 일반적으로 지지되지 않는다고 설명한다. 그러나 Nadav Na'aman은 2019년 논문에서 Tell Jemmeh를 그랄로 다시 제안하면서 창세기 26장의 형성 시기를 기원전 7세기 중엽의 역사 상황과 연결한다. **이 문학·연대 결론은 Na'aman의 견해이며 본 연구의 결론으로 승격하지 않는다.**

### View D — Tell el-Far'a South

성경 지리 문헌에서 제안된 다른 후보. 이번 자산에서는 후보 존재만 보존하며 좌표·동일성을 추가 확정하지 않는다.

---

# 5. Archaeology

## 5.1 Tel Haror archaeological evidence

Tel Haror 자체에 대해서는 강한 고고학 증거가 존재한다. 1986–1992년 발굴과 2010년 보완 발굴 자료에 따르면 이곳은 남부 이스라엘의 큰 청동기 유적 가운데 하나이며, **중기 청동기 III(약 1700/1650–1550 BCE)**에 대규모 성벽·해자와 도시가 존재했다. 남서부 성역에서는 시리아형 신전, 저장시설, 제단이 있는 뜰, 제의 퇴적구, 봉헌 공간, 동물 희생 흔적과 의례적으로 매장된 나귀가 확인되었다.

이것은 Tel Haror가 중기 청동기 시대에 중요한 도시·종교 중심지였다는 사실을 강하게 지지한다. 그러나 이 고고학 자료가 **아브라함, 사라, 이삭, 리브가, 아비멜렉의 사건을 직접 확인하지는 않는다.**

## 5.2 Evidence limits

```yaml
archaeology_can_support:
  - Tel_Haror_is_a_major_multi_period_archaeological_site
  - substantial_Middle_Bronze_urban_and_cultic_remains_exist
  - site_location_fits_some_biblical_geographic_constraints
  - Iron_Age_occupation_and_regional_significance_are_relevant_to_later_contexts

archaeology_cannot_currently_support:
  - Abraham_was_at_Tel_Haror
  - Sarah_Abimelech_event_occurred_at_the_excavated_site
  - Isaac_dug_a_specific_excavated_well
  - biblical_Gerar_equals_Tel_Haror_with_certainty
  - a_specific_Middle_Bronze_stratum_is_the_Genesis_event_horizon
```

Middle Bronze 자료와 족장 서사를 곧바로 동일 연대로 묶는 것은 별도의 역사연대 논증을 요구한다. 이번 장소 연구는 그 논쟁을 해결하지 않는다.

## 5.3 Philistine terminology boundary

창세기 26장은 아비멜렉을 “블레셋 왕”으로 부른다. 고고학적으로 남부 해안의 블레셋 물질문화와 족장 서사의 역사적 시간 설정을 어떻게 연결할지는 독립적인 역사·문헌 연구가 필요한 문제다. 이를 지명 연구만으로 해결하지 않는다.

---

# 6. Connected Entities

## 6.1 Place

```yaml
primary:
  - JBC-CR-PLACE-GERAR-001

related_places:
  - name: Beersheba
    known_parent_asset_identity: JBC-CR-PLACE-BEERSHEBA-001
    relation: narrative_and_diplomatic_connection
  - name: Gaza
    relation: geographic_boundary_reference
  - name: Valley_of_Gerar
    relation: surrounding_landscape_or_valley
    separate_identity_required_before_global_use: true
  - name: Kadesh
    relation: Abraham_movement_context
  - name: Shur
    relation: Abraham_movement_context
  - name: Rehoboth
    relation: Isaac_well_movement_sequence
    exact_location: unresolved
  - name: Tel_Haror
    relation: leading_archaeological_candidate
  - name: Tell_Jemmeh
    relation: competing_archaeological_candidate
  - name: Tel_Sera
    relation: competing_archaeological_candidate
```

## 6.2 Person

```yaml
related_people:
  - Abraham
  - Sarah
  - Isaac
  - Rebekah

  - label: Abimelech_Abraham_cycle
    passage: Genesis_20_21
    merge_with_other_Abimelech: NOT_AUTHORIZED

  - label: Abimelech_Isaac_cycle
    passage: Genesis_26
    merge_with_other_Abimelech: NOT_AUTHORIZED

  - Ahuzzath
  - Phicol
  - Asa
```

두 아비멜렉 서사를 동일 개인으로 자동 병합하지 않는다. “아비멜렉”이 개인명인지 왕명/왕조적 명칭인지, 두 본문이 동일 인물을 가리키는지는 별도 인물 연구가 필요하다.

## 6.3 Event

```yaml
events:

  - event_id: JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01
    scope: ASSET_LOCAL
    label: Abraham_and_Sarah_in_Gerar
    passage: Genesis_20_1_18
    event_location: Gerar
    certainty: HIGH

  - event_id: JBC-CR-EVENT-GERAR-ISAAC-SOJOURN-01
    scope: ASSET_LOCAL
    label: Isaac_sojourns_in_Gerar_during_famine
    passage: Genesis_26_1_11
    event_location: Gerar
    certainty: HIGH

  - event_id: JBC-CR-EVENT-GERAR-ISAAC-PROSPERITY-CONFLICT-01
    scope: ASSET_LOCAL
    label: Isaac_prospers_and_is_asked_to_leave
    passage: Genesis_26_12_17
    event_location: Gerar_and_Gerar_valley_transition
    certainty: HIGH

  - event_id: JBC-CR-EVENT-GERAR-WELLS-01
    scope: ASSET_LOCAL
    label: Gerar_valley_well_disputes
    passage: Genesis_26_18_22
    event_location: Valley_of_Gerar_and_subsequent_movement
    exact_geometry: NOT_ASSIGNED
    certainty: HIGH_NARRATIVE

  - event_id: JBC-CR-EVENT-GERAR-BEERSHEBA-DELEGATION-01
    scope: ASSET_LOCAL
    label: Abimelech_delegation_from_Gerar_to_Isaac
    passage: Genesis_26_23_31
    origin: Gerar
    destination_event_location: Beersheba
    route_geometry: NOT_ASSIGNED
    certainty: HIGH_NARRATIVE

  - event_id: JBC-CR-EVENT-GERAR-ASA-01
    scope: ASSET_LOCAL
    label: Asa_pursues_Cushites_to_Gerar
    passage: 2_Chronicles_14_13_15
    event_location: Gerar_region
    certainty: HIGH_TEXTUAL
```

## 6.4 Relation Matrix

| From | Relation | To | Evidence | Certainty |
|---|---|---|---|---|
| Abraham | `person_sojourns_at_place` | Gerar | Gen 20:1–2 | HIGH |
| Sarah | `person_in_event_at_place` | Gerar | Gen 20:2–18 | HIGH |
| Abimelech-Abraham cycle | `ruler_associated_with_place` | Gerar | Gen 20:2 | HIGH |
| Isaac | `person_sojourns_at_place` | Gerar | Gen 26:1, 6 | HIGH |
| Rebekah | `person_in_event_at_place` | Gerar | Gen 26:7–11 | HIGH |
| Abimelech-Isaac cycle | `ruler_associated_with_place` | Gerar | Gen 26:1, 26 | HIGH |
| Gerar | `boundary_relation` | Gaza | Gen 10:19 | HIGH |
| Gerar | `landscape_relation` | Valley of Gerar | Gen 26:17, 20 | HIGH |
| Isaac movement | `narrative_sequence` | Gerar → Valley → Rehoboth → Beersheba | Gen 26:17–23 | HIGH_NARRATIVE / LOW_GEOMETRY |
| Abimelech delegation | `movement_origin_to_destination` | Gerar → Beersheba | Gen 26:26 with 26:23 | HIGH_NARRATIVE / LOW_GEOMETRY |
| Gerar | `connected_place` | Beersheba | Gen 21; 26 | HIGH |
| Biblical Gerar | `candidate_identification` | Tel Haror | ODG, OpenBible | MEDIUM |
| Biblical Gerar | `competing_identification` | Tell Jemmeh | historical + Na'aman 2019 | LOW_DISPUTED |
| Biblical Gerar | `competing_identification` | Tel Sera | scholarly proposal; Ziklag competition | LOW |
| Asa campaign | `event_reaches_place` | Gerar region | 2 Chr 14:13–15 | HIGH_TEXTUAL |

---

# 7. PassageLink Set

```yaml
PassageLink:

  DIRECT_MENTION:
    - passage: Genesis_10_19
      role: geographic_boundary_marker

    - passage: Genesis_20_1_2
      role: Abraham_sojourn_and_Abimelech_king_of_Gerar

    - passage: Genesis_26_1
      role: Isaac_arrives_at_Gerar_during_famine

    - passage: Genesis_26_6
      role: Isaac_resides_in_Gerar

    - passage: Genesis_26_17
      role: Isaac_moves_to_Valley_of_Gerar

    - passage: Genesis_26_20
      role: Gerar_herdsmen_and_well_dispute

    - passage: Genesis_26_26
      role: Abimelech_comes_from_Gerar

    - passage: 2_Chronicles_14_13_14
      role: Asa_campaign_reaches_Gerar_and_surrounding_cities

  STRONGLY_RELATED:
    - Genesis_20_1_18
    - Genesis_21_22_34
    - Genesis_26_1_33

  TEXTUAL_VARIANT:
    - Genesis_26_8_LXX
    - Genesis_26_19_LXX
    - 1_Chronicles_4_39_LXX

  CONTEXTUAL:
    - Genesis_10_15_20
    - 2_Chronicles_14_9_15
```

---

# 8. Claim–Evidence Matrix

| Claim ID | Claim | Class | Evidence / locator | Certainty |
|---|---|---|---|---|
| `CLM-GR-01` | 그랄은 창 10:19에서 가사와 함께 가나안 경계의 지리 표지로 등장한다. | FACT | Gen 10:19; ODG `Belege AT` | HIGH |
| `CLM-GR-02` | 아브라함은 창 20장에서 그랄에 우거하고 그랄 왕 아비멜렉과 사라 사건을 겪는다. | FACT | Gen 20:1–18; Drive `창세기 20장.txt` | HIGH |
| `CLM-GR-03` | 창 20장의 핵심 흐름에서 하나님은 사라를 아비멜렉에게서 돌려보내게 하여 약속의 계보를 보존하신다. | INTERPRETATION | Gen 20 전체 + Genesis Book Profile covenant lens | HIGH |
| `CLM-GR-04` | 이삭은 기근 때 그랄로 가고, 하나님은 그에게 땅·자손·복의 약속을 재확인한다. | FACT/THEOLOGICAL_OBSERVATION | Gen 26:1–6; Drive `창세기 26장.txt` | HIGH |
| `CLM-GR-05` | 이삭의 그랄 번성은 지역 갈등과 우물 분쟁을 제거하지 않는다. | TEXTUAL_OBSERVATION | Gen 26:12–22 | HIGH |
| `CLM-GR-06` | 창 26의 공간 흐름은 그랄/그랄 골짜기에서 르호봇을 거쳐 브엘세바로 이어진다. | NARRATIVE_GEOGRAPHY | Gen 26:17–23 | HIGH_NARRATIVE |
| `CLM-GR-07` | 아비멜렉 일행은 그랄에서 이삭에게 와서, 브엘세바 맥락에서 평화의 약속을 제안한다. | FACT | Gen 26:23, 26–31 | HIGH |
| `CLM-GR-08` | 그랄은 대하 14장에서 아사 전쟁 서사의 지리 표지와 주변 도시권으로 다시 등장한다. | FACT | 2 Chr 14:13–15 | HIGH |
| `CLM-GR-09` | 성경의 그랄의 정확한 현대 좌표는 확정되지 않는다. | RESEARCH_BOUNDARY | ODG multiple proposals; OpenBible multiple identifications | HIGH |
| `CLM-GR-10` | Tell Abū Ḥurēre/Tel Haror는 현재 중요한 선두 후보이다. | IDENTIFICATION_HYPOTHESIS | ODG Gerar; OpenBible Tel Haror | MEDIUM |
| `CLM-GR-11` | Tel Haror에는 대규모 중기 청동기 도시와 성역 증거가 있다. | ARCHAEOLOGICAL_FACT | PLoS/PMC archaeological context | HIGH |
| `CLM-GR-12` | Tel Haror의 고고학은 아브라함·이삭 사건 자체를 직접 입증하지 않는다. | EVIDENCE_BOUNDARY | archaeology/person-event gap | HIGH |
| `CLM-GR-13` | Tell esh-Sharia/Tel Sera, Tell Jemmeh, Tell el-Far'a South 등 경쟁 위치가 제안되었다. | FACT_OF_SCHOLARLY_DISPUTE | ODG `Lokalisierungsvorschläge` | HIGH |
| `CLM-GR-14` | Tell Jemmeh는 Petrie가 그랄로 식별했으나 후대에는 약화되었고, Na'aman 2019가 다시 그 동일시를 주장한다. | SCHOLARLY_HISTORY | Open Research Europe §3.1; Na'aman 2019 abstract | HIGH |
| `CLM-GR-15` | Na'aman의 창 26 기원전 7세기 형성론은 하나의 학술 견해이며 이 자산의 결론이 아니다. | INTERPRETIVE_BOUNDARY | Na'aman 2019 | HIGH |
| `CLM-GR-16` | 창 20–21과 창 26의 두 아비멜렉을 동일 개인으로 자동 병합해서는 안 된다. | IDENTITY_BOUNDARY | separated narrative cycles; unresolved identity | HIGH |
| `CLM-GR-17` | 창세기의 “블레셋” 명칭과 족장 연대·고고학을 연결하는 문제는 별도 연구가 필요하다. | HISTORICAL_BOUNDARY | Gen 26:1 + archaeological chronology issue | HIGH |

---

# 9. Evidence Ledger

```yaml
Evidence:

  - evidence_id: EV-GR-BT-01
    type: BIBLICAL_TEXT_PROJECT_SOURCE
    source_ref: DRIVE-GEN20
    locator: entire_file_Genesis_20
    supports:
      - CLM-GR-02
      - CLM-GR-03
    note: >
      프로젝트 연결 Drive 텍스트로 확인했으나,
      파일 자체가 특정 공인 성경 번역의 정식 원문이라는 메타데이터는 잠그지 않았으므로
      정확한 인용문 재현의 기준본으로 사용하지 않고 사건·절 구조 확인용으로 사용한다.

  - evidence_id: EV-GR-BT-02
    type: BIBLICAL_TEXT_PROJECT_SOURCE
    source_ref: DRIVE-GEN26
    locator: entire_file_Genesis_26
    supports:
      - CLM-GR-04
      - CLM-GR-05
      - CLM-GR-06
      - CLM-GR-07

  - evidence_id: EV-GR-BP-01
    type: BOOK_PROFILE
    source_ref: BP-OT01-GEN
    locator: lines_343_371
    supports:
      - CLM-GR-03
      - covenant_narrative_frame

  - evidence_id: EV-GR-BP-02
    type: BOOK_PROFILE
    source_ref: BP-OT01-GEN
    locator: lines_510_534_section_7_6
    supports:
      - geography_interpretation_boundary
      - no_hasty_archaeological_location_lock

  - evidence_id: EV-GR-GEO-01
    type: SCHOLARLY_BIBLICAL_GEOGRAPHY_DATABASE
    source_ref: ODG-GERAR
    locator:
      - Lokalisierungsvorschlaege
      - Belege_AT
      - localization_discussion
    supports:
      - CLM-GR-01
      - CLM-GR-09
      - CLM-GR-10
      - CLM-GR-13

  - evidence_id: EV-GR-GEO-02
    type: GEODATA_AGGREGATION
    source_ref: OPENBIBLE-TEL-HAROR
    locator:
      - About
      - Coordinates_Sources
      - Biblical_places_associated
    supports:
      - Tel_Haror_coordinate
      - CLM-GR-10

  - evidence_id: EV-GR-GEO-03
    type: GEODATA_AGGREGATION
    source_ref: OPENBIBLE-TELL-JEMMEH
    locator: About
    supports:
      - Tell_Jemmeh_coordinate

  - evidence_id: EV-GR-GEO-04
    type: GEODATA_AGGREGATION
    source_ref: OPENBIBLE-TEL-SERA
    locator: About
    supports:
      - Tel_Sera_coordinate
      - low_Gerar_identification_confidence

  - evidence_id: EV-GR-ARCH-01
    type: PEER_REVIEWED_ARCHAEOLOGY
    source_ref: PMC-TEL-HAROR-DONKEY
    locator:
      - Abstract
      - Results_Archaeological_Context_of_the_Donkey_Interment
      - Methods
    supports:
      - CLM-GR-11
      - CLM-GR-12

  - evidence_id: EV-GR-ALT-01
    type: PEER_REVIEWED_RESEARCH_HISTORY
    source_ref: ORE-TELL-JEMMEH
    locator: section_3_1_Tell_Jemmeh
    supports:
      - CLM-GR-14

  - evidence_id: EV-GR-ALT-02
    type: SCHOLARLY_ARTICLE_ABSTRACT
    source_ref: NAAMAN-2019
    locator: abstract
    supports:
      - CLM-GR-14
      - CLM-GR-15

  - evidence_id: EV-GR-BT-03
    type: BIBLICAL_TEXT_PUBLIC_REFERENCE
    source_ref: BIBLEGATEWAY-2CHR14
    locator: 2_Chronicles_14_13_15
    supports:
      - CLM-GR-08

  - evidence_id: EV-GR-PARENT-01
    type: PARENT_CONNECTED_RESEARCH_ASSET
    source_ref: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
    locator:
      - Reader_Layer_related_places
      - Entity_and_Relation_Matrix
      - Map_Ready_Fields
    supports:
      - Beersheba_to_Gerar_connection
      - no_invented_route_geometry
```

---

# 10. Source Register

## 10.1 Project / Drive sources

```yaml
source_refs:

  BP-OT01-GEN:
    title: BOOK_PROFILE_BUNDLE_OT01_PENTATEUCH_v1.0.1_APPROVED.md
    embedded_source: GEN_Genesis_BOOK_PROFILE_v0.2.md
    role: BOOK_PROFILE_INPUT_SOURCE
    locators:
      - lines 343-371
      - lines 510-534, section 7.6
    authority_note: >
      family bundle is current execution authority;
      embedded Genesis source preserves its standalone candidate status.

  DRIVE-GEN20:
    title: 창세기 20장.txt
    drive_file_id: 18REGqfgk0G6U7PNHFSaqSi6TGEnEP4T5
    role: project_connected_biblical_text_support
    exact_live_folder_lineage: NOT_LOCKED_IN_THIS_RUN

  DRIVE-GEN26:
    title: 창세기 26장.txt
    drive_file_id: 1IdneLuJ2P0-HlovxH6MHXfyZOee3NG5d
    role: project_connected_biblical_text_support
    exact_live_folder_lineage: NOT_LOCKED_IN_THIS_RUN

  DRIVE-HAMILTON:
    title: Commentary_Genesis_Chapters_VictorPHamilton.txt
    drive_file_id: 1WqP-0qOUYDVujduoIyzclzil7baiW2Rs
    locator:
      - section_heading_Abraham_and_Sarah_in_Gerar_20_1_18
      - section_heading_Isaac_and_Abimelech_26_1_35
    role: commentary_context
    quotation_use: NONE

  PARENT-BEERSHEBA:
    title: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md
    local_path: /mnt/data/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md
    role: parent_connected_asset
```

`DRIVE-GEN20`과 `DRIVE-GEN26`은 Google Drive 검색을 통해 실제 파일을 읽어 내용 연결을 확인했다. 다만 여러 `live` 폴더가 검색되는 현재 Drive 구조에서 이 두 파일의 parent lineage가 사용자가 지정한 특정 `Hezekiah_Lite/workspace/live` 폴더라는 사실까지는 이번 실행에서 잠그지 않았다. 그러므로 **“정확한 live 폴더 provenance”는 VERIFY로 남기고**, 본문 절 구조 자체는 성경 지리 데이터베이스 및 공개 성경 참조와 교차 검증했다.

## 10.2 External research sources

```yaml
ODG-GERAR:
  title: Ortsangaben im Buch Genesis — Gerar
  author: Detlef Jericke
  institution: Bibelwissenschaft / Heidelberg-linked biblical geography database
  url: https://odb.bibelwissenschaft.de/ortsnamen/ortsname.php?n=40
  locators:
    - Lokalisierungsvorschläge
    - Namensformen_AT
    - Belege_AT
    - main_localization_discussion

OPENBIBLE-TEL-HAROR:
  title: Tel Haror — modern identifications of places in the Bible
  url: https://www.openbible.info/geo/modern/maaf3b2/tel-haror
  locator: About

OPENBIBLE-TELL-JEMMEH:
  title: Tell Jemmeh — modern identifications of places in the Bible
  url: https://www.openbible.info/geo/modern/m3f6c55/tell-jemmeh
  locator: About

OPENBIBLE-TEL-SERA:
  title: Tell esh Sharia — modern identifications of places in the Bible
  url: https://www.openbible.info/geo/modern/m489f67/tell-esh-sharia
  locator: About

PMC-TEL-HAROR-DONKEY:
  title: Symbolic Metal Bit and Saddlebag Fastenings in a Middle Bronze Age Donkey Burial
  publication: PLoS ONE
  url: https://pmc.ncbi.nlm.nih.gov/articles/PMC3590166/
  locators:
    - Abstract
    - Archaeological_Context_of_the_Donkey_Interment
    - Methods

ORE-TELL-JEMMEH:
  title: Bodies of evidence — The human remains from Flinders Petrie's excavations in British Mandate Palestine
  publication: Open Research Europe
  url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11871434/
  locator: section_3_1_Tell_Jemmeh

NAAMAN-2019:
  title: The Isaac Story (Genesis 26) and the Land of Gerar
  author: Nadav Na'aman
  publication: Semitica 61 (2019), 59-88
  doi: 10.2143/SE.61.0.3286683
  source_page: https://poj.peeters-leuven.be/content.php?id=3286683&url=article
  locator: Abstract

BIBLEGATEWAY-2CHR14:
  title: 2 Chronicles 14:13-15
  url: https://www.biblegateway.com/passage/?search=2+Chronicles+14%3A13-15
  locator: verses_13_15
```

---

# 11. Wikimedia MediaAsset

## JBC-MEDIA-GR-001 — representative archaeological candidate

```yaml
MediaAsset:
  media_id: JBC-MEDIA-GR-001
  scope: ASSET_LOCAL
  source: Wikimedia_Commons
  file_title: "File:תל הרור1.jpg"
  creator: Aaadir
  date: 2021-04-29
  license: CC0_1.0
  rights_status: PUBLIC_DOMAIN_DEDICATION_CC0
  source_page: "https://commons.wikimedia.org/wiki/File:תל_הרור1.jpg"
  depicts: Tel_Haror_north_of_Gerar_stream
  source_caption_summary: >
    Tel Haror is described by the uploader as one of the proposed
    identifications of the biblical city of Gerar.
  display_role:
    - representative
    - archaeological_candidate
  identity_certainty:
    Tel_Haror: HIGH
    biblical_Gerar: MEDIUM_CANDIDATE_ONLY
  recommended_reader_caption_ko: >
    그랄의 주요 위치 후보 가운데 하나인 텔 하로르.
    성경의 그랄과 정확히 동일한 장소인지는 확정되지 않았다.
  attribution: >
    Aaadir, "תל הרור1.jpg", Wikimedia Commons, CC0 1.0.
```

## JBC-MEDIA-GR-002 — landscape context

```yaml
MediaAsset:
  media_id: JBC-MEDIA-GR-002
  scope: ASSET_LOCAL
  source: Wikimedia_Commons
  file_title: "File:תל הרור נוף.jpg"
  creator: Aaadir
  date: 2021-04-29
  license: CC0_1.0
  rights_status: PUBLIC_DOMAIN_DEDICATION_CC0
  source_page: "https://commons.wikimedia.org/wiki/File:תל_הרור_נוף.jpg"
  depicts: view_from_top_of_Tel_Haror_north_of_Gerar_stream
  display_role:
    - terrain
    - landscape
    - archaeological_candidate
  identity_certainty:
    Tel_Haror: HIGH
    biblical_Gerar: MEDIUM_CANDIDATE_ONLY
  attribution: >
    Aaadir, "תל הרור נוף.jpg", Wikimedia Commons, CC0 1.0.
```

미디어는 Commons source page 참조 방식으로 보존하며 원본 파일을 이번 자산에 대량 복제하지 않는다. 사진에 보이는 장소는 **Tel Haror**이며 “성경의 그랄을 촬영한 사진”으로 캡션을 승격하지 않는다.

---

# 12. Map Ready

```yaml
map_ready:

  primary_place:
    ref: JBC-CR-PLACE-GERAR-001
    label: Gerar
    exact_marker: false
    coordinate: null
    render_mode: DISPUTED_BIBLICAL_PLACE
    safe_behavior: >
      primary biblical identity remains selectable,
      but map must not fabricate an exact Gerar pin.

  candidate_sites:

    - label: Tel Haror / Tell Abu Hureira
      lat: 31.382100
      lon: 34.606500
      coordinate_applies_to: archaeological_site_only
      relation_to_primary: leading_candidate
      equivalence: NOT_LOCKED
      layer: Archaeology

    - label: Tell Jemmeh
      lat: 31.387240
      lon: 34.445060
      coordinate_applies_to: archaeological_site_only
      relation_to_primary: competing_candidate
      equivalence: NOT_LOCKED
      layer: Archaeology

    - label: Tell esh-Sharia / Tel Sera
      lat: 31.391200
      lon: 34.681600
      coordinate_applies_to: archaeological_site_only
      relation_to_primary: competing_candidate
      equivalence: NOT_LOCKED
      layer: Archaeology

    - label: Tell el-Far'a South
      coordinate: null
      relation_to_primary: competing_candidate
      equivalence: NOT_LOCKED
      layer: Archaeology

  region:
    label: Southern_Canaan_northwestern_Negev_Gaza_hinterland
    geometry: NOT_ASSIGNED
    stable_region_id: NOT_CREATED

  routes:

    - route_label: Abraham_Negev_context_to_Gerar
      basis: Genesis_20_1
      ordered_relation: supported
      geometry: NOT_ASSIGNED

    - route_label: Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba
      basis: Genesis_26_17_23
      ordered_relation: supported
      geometry: NOT_ASSIGNED

    - route_label: Abimelech_delegation_Gerar_to_Beersheba
      basis: Genesis_26_23_26
      ordered_relation: supported
      geometry: NOT_ASSIGNED

  events:
    - Abraham_and_Sarah_in_Gerar
    - Isaac_sojourn_in_Gerar
    - Isaac_prosperity_and_departure
    - Gerar_valley_well_disputes
    - Gerar_to_Beersheba_delegation
    - Asa_campaign_to_Gerar

  geometry_policy:
    invented_geometry: prohibited
    inferred_route_polylines: prohibited
    candidate_site_point_as_primary_Gerar: prohibited
```

Map의 핵심 degradation 규칙은 **“그랄의 biblical identity를 선택할 수는 있지만, 확정되지 않은 좌표를 primary point로 만들지 않는다”**이다. 후보 텔의 실제 좌표는 Archaeology layer에서 별도 표시할 수 있다.

---

# 13. Reader / Research Separation QA

```yaml
reader_layer_QA:
  natural_korean: PASS
  concise_identity: PASS
  internal_status_codes_hidden: PASS
  stable_id_hidden: PASS
  source_locator_hidden: PASS
  registry_language_hidden: PASS
  uncertainty_expressed_naturally: PASS
  archaeological_candidate_not_promoted_to_fact: PASS

research_layer_QA:
  claims_present: PASS
  evidence_present: PASS
  source_refs_present: PASS
  source_locators_present: PASS
  certainty_present: PASS
  competing_views_present: PASS
  VERIFY_HOLD_preserved: PASS
  passage_links_present: PASS
  media_rights_present: PASS
  map_fields_present: PASS
  no_invented_primary_coordinate: PASS
  same_name_auto_merge_prevented: PASS
```

---

# 14. Retained VERIFY / HOLD

```yaml
retained_VERIFY:

  - id: VERIFY-GR-01
    issue: exact_modern_location_of_biblical_Gerar
    state: unresolved
    current_leading_hypothesis: Tel_Haror_Tell_Abu_Hureira
    consequence: no_exact_coordinate_for_primary_place

  - id: VERIFY-GR-02
    issue: biblical_Gerar_equals_Tel_Haror
    state: plausible_and_often_preferred_but_not_demonstrated
    consequence: candidate_relation_only

  - id: VERIFY-GR-03
    issue: relationship_between_Gerar_city_and_Valley_of_Gerar
    state: same_geographic_complex_likely_but_entity_boundaries_not_formalized
    consequence: no_auto_merge

  - id: VERIFY-GR-04
    issue: identity_of_Abimelech_in_Genesis_20_21_vs_Genesis_26
    state: unresolved
    consequence: separate_cycle_refs

  - id: VERIFY-GR-05
    issue: exact_route_geometry_Gerar_to_Rehoboth_to_Beersheba
    state: unresolved
    consequence: narrative_order_only

  - id: VERIFY-GR-06
    issue: exact_Hezekiah_Lite_workspace_live_lineage_of_Drive_Genesis_files
    state: not_locked
    consequence: Drive_files_used_as_connected_support_not_exclusive_source_authority

retained_HOLD:

  - id: HOLD-GR-01
    issue: assign_primary_Gerar_coordinate
    state: HOLD

  - id: HOLD-GR-02
    issue: identify_excavated_Tel_Haror_feature_as_Abraham_or_Isaac_feature
    state: HOLD

  - id: HOLD-GR-03
    issue: assign_specific_archaeological_stratum_to_Genesis_20_or_26_event
    state: HOLD

  - id: HOLD-GR-04
    issue: resolve_Philistine_terminology_and_patriarchal_chronology
    state: HOLD_FOR_SEPARATE_HISTORICAL_TEXTUAL_RESEARCH

  - id: HOLD-GR-05
    issue: BAT01_crosswalk
    state: HOLD_NO_INFERENCE

  - id: HOLD-GR-06
    issue: global_Region_identity_for_Gerar_zone
    state: HOLD_NO_NEW_REGISTRY_ID
```

---

# 15. Interpretive Boundary

1. **그랄의 의미를 아브라함·이삭의 성공담으로 축소하지 않는다.** 두 주기 모두 족장들의 두려움과 취약성이 노출되며, 약속의 지속은 인간의 완전성보다 하나님의 보존에 무게가 있다.
2. **이삭의 백 배 결실을 갈등 없는 물질 번영 공식으로 일반화하지 않는다.** 바로 이어지는 본문은 시기, 추방, 우물 분쟁, 반복 이동을 기록한다.
3. **우물 갈등을 자기계발식 “양보하면 더 큰 우물을 얻는다” 공식으로 환원하지 않는다.** 본문의 공간 이동은 하나님의 약속, 현실 갈등, 생존 자원, 관계 조정, 브엘세바의 현현과 언약을 함께 보아야 한다.
4. **Tel Haror의 고고학적 중요성과 성경 인물의 역사적 현존 증거를 구분한다.**
5. **Na'aman의 Tell Jemmeh 및 기원전 7세기 문학 형성론은 경쟁 학설로 기록할 뿐 프로젝트 결론으로 채택하지 않는다.**
6. **창세기 20–21과 26의 아비멜렉 동일성은 별도 검증 없이 확정하지 않는다.**
7. **후대 지명·현대 수계 이름을 고대 성경 도시의 자동 증거로 사용하지 않는다.**

---

# 16. Internal Review

```yaml
internal_review:

  source_authority:
    Book_Profile_read: PASS
    project_connected_Drive_sources_read: PASS_WITH_LINEAGE_VERIFY
    biblical_geography_source: PASS
    peer_reviewed_archaeology: PASS
    competing_view_source: PASS
    Wikimedia_rights_source: PASS

  claim_evidence_binding:
    unsupported_claim_removed: PASS
    archaeology_to_biblical_event_overreach_removed: PASS
    exact_coordinate_promotion_removed: PASS
    competing_identification_preserved: PASS

  identity:
    research_local_stable_identity: PASS
    no_registry_claim: PASS
    no_BAT01_inference: PASS
    no_same_name_auto_merge: PASS

  map:
    primary_exact_point: NONE
    candidate_site_coordinates: EVIDENCE_BOUND
    invented_geometry: NONE

  module_boundary:
    WORBS_only: PASS
    BICS_execution: NOT_EXECUTED
    Kerygma_execution: NOT_EXECUTED
    app_change: NOT_EXECUTED

  final_quality:
    status: PASS_WITH_VERIFY
    captain_review_required: true
```

---

# MINIMUM_HANDOFF

```yaml
MINIMUM_HANDOFF:

  from_project: 01_목회연구_WORBS_BICS
  to_project: UNASSIGNED_UNTIL_CAPTAIN_ROUTING

  asset_id: JBC_GERAR_CONNECTED_WORBS_20260930_01
  approved_representative: NONE_PENDING_CAPTAIN_REVIEW
  stage_representative_candidate: JBC_GERAR_CONNECTED_WORBS_20260930_01

  version: v0.1
  status: RESEARCH_COMPLETE_WITH_VERIFY

  preserve:
    - research_local_identity_JBC-CR-PLACE-GERAR-001
    - parent_connection_JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
    - Genesis_20_and_26_core
    - Genesis_10_19_boundary_reference
    - 2_Chronicles_14_later_reference
    - no_exact_coordinate_for_biblical_Gerar
    - Tel_Haror_as_candidate_not_fact
    - Tell_Jemmeh_and_Tel_Sera_competing_views
    - separate_Abimelech_cycle_refs
    - Claim_Evidence_matrix
    - PassageLink_set
    - Wikimedia_metadata_and_rights
    - Reader_Research_layer_separation
    - no_invented_route_geometry
    - retained_VERIFY_HOLD
    - BAT01_no_inference

  next_task_one: >
    캡틴 승인 후에만 다음 소비 프로젝트가
    이 연구자산을 변경하지 않고 JudeBible Context 또는 Bible Atlas용
    public-safe projection으로 재사용한다.
```

---

# REMAINING_RISK

가장 큰 잔여 위험은 **“Tel Haror가 유력하다”를 “Gerar의 확정 위치다”로 바꾸어 버리는 것**이다. Tel Haror는 성경 지리 조건에 잘 맞고 중기 청동기와 철기시대의 중요한 도시 증거를 제공하지만, 그 자체가 창세기 20장과 26장의 사건 장소임을 직접 입증하지 않는다.

두 번째 위험은 **그랄의 두 아비멜렉 주기를 하나의 인물로 자동 통합하는 것**이다. 장소 연결 연구는 두 서사의 유사성을 기록할 수 있지만 개인 동일성을 결정할 권한이나 충분한 근거를 아직 갖지 않는다.

세 번째 위험은 **Drive에서 읽은 창세기 20장·26장 텍스트의 정확한 `Hezekiah_Lite/workspace/live` parent lineage가 이번 실행에서 잠기지 않았다는 점**이다. 실제 내용은 읽고 교차 확인했지만, 여러 `live` 폴더가 존재하기 때문에 특정 live 폴더의 provenance까지 추정하지 않았다. 이 상태는 연구 결론을 무효화하지 않지만 source lineage를 후속 자산 관리에서 정밀화할 수 있다.

이번 실행은 WORBS 연구와 Markdown 연구자산 생성까지만 수행했다. BICS, Kerygma, 앱 코드 변경, Registry 변경, BAT01 crosswalk, 외부 공개는 수행하지 않았다.
