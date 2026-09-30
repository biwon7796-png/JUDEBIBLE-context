# OBSIDIAN_MEDIA_AUTO_BINDING_PIPELINE_v0.1_IMPLEMENTATION_LOCK

status: APPROVED_FOR_IMPLEMENTATION_REFERENCE  
project: JudeBible Context  
control_role: implementation_contract_lock  
implementation_state: STARTED  
implementation_target: `F:\Projects\웹앱`

---

## 1. Purpose

JudeBible Context의 사진·이미지 자산을 UI에 하나씩 수동 연결하지 않고,
Obsidian의 구조화 metadata와 기존 `stable_id`를 이용해
MediaAsset을 자동 수집·검증·결속·투영한다.

핵심 원칙:

> 사진은 화면에 직접 붙이지 않는다.  
> MediaAsset을 기존 entity `stable_id`에 결속하고,
> 앱은 그 결속 결과를 여러 surface에서 재사용한다.

## 2. Authority Boundary

```yaml
authority:
  source_research: AUTHORITY
  obsidian: STRUCTURED_WORKSPACE
  media_projection: READ_MODEL_ONLY
  app: CONSUMER
```

Obsidian은 authoritative database가 아니다.

- 연구 의미·승인·certainty를 변경하지 않는다.
- Obsidian note 삭제를 승인 MediaAsset 삭제로 해석하지 않는다.
- projection은 새 truth를 만들지 않는다.
- Media pipeline은 source research를 수정하지 않는다.

## 3. End-to-End Flow

```yaml
OBSIDIAN_MEDIA_AUTO_BINDING_PIPELINE_v0.1:
  flow:
    external_media_metadata:
      ↓
    obsidian_media_metadata:
      ↓
    media_importer:
      ↓
    rights_validator:
      ↓
    stable_id_target_binding:
      ↓
    media_asset_projection:
      ↓
    consumers:
      - Detail
      - Place
      - Person
      - Event
      - Route
```

## 4. Minimum Obsidian Media Contract

```yaml
MEDIA_ASSET_CONTRACT:
  stable_id: required
  media_type: required

  target_refs:
    required: true
    items:
      stable_id: required
      target_type:
        - Place
        - Person
        - Event
        - Route

  provider: optional
  source_url:
    value: optional
  preview_url:
    value: optional

  creator: optional
  license: optional
  attribution: optional

  rights_status:
    allowed:
      - CLEARED
      - VERIFY
      - HOLD

  display_role:
    allowed:
      - representative
      - archaeology
      - landscape
      - artifact
      - map_reference
      - modern_context

  certainty: optional
```

## 5. Derived Validation Fields

```yaml
DERIVED_VALIDATION_FIELDS:
  source_url_verified:
    author_input: prohibited_as_authority
    generated_by: media_validator
    default: false

  media_rights:
    generated_from:
      - rights_status
      - creator
      - license
      - attribution
      - source_validation
    output:
      status: CLEARED | VERIFY | HOLD
      validated: true | false
```

`rights_status: CLEARED`라고 적혀 있다는 이유만으로 이미지 payload를 노출하지 않는다.

## 6. Pipeline Stages

```yaml
MEDIA_PIPELINE:
  1_DISCOVER:
    - detect_new_media_record
    - detect_changed_media_record
    - calculate_record_hash

  2_PARSE:
    - read_explicit_media_metadata
    - preserve_original_values
    - do_not_parse_free_prose_as_fact

  3_VALIDATE_TARGET:
    - stable_id_exists
    - target_type_matches_existing_entity
    - no_name_only_binding

  4_VALIDATE_SOURCE:
    - validate_provider
    - validate_explicit_source_url
    - never_construct_URL_from_filename

  5_VALIDATE_RIGHTS:
    checks:
      - creator
      - license
      - attribution
      - source
      - declared_rights_status

  6_CLASSIFY_PAYLOAD:
    CLEARED_AND_VALIDATED:
      eligible_for_payload: true
    VERIFY:
      payload: hidden
      metadata: preserved
    HOLD:
      payload: hidden
      metadata: internal_only_or_degraded

  7_BIND:
    key:
      target_refs.stable_id

  8_PROJECT:
    - normalize_MediaAsset
    - attach_to_shared_projection_store

  9_RENDER:
    surfaces:
      - Detail
      - Place
      - Person
      - Event
      - Route

  10_QA:
    - media_target_QA
    - rights_QA
    - projection_QA
    - regression_QA
```

## 7. Automation Boundary

```yaml
AUTO_ALLOWED:
  - read_explicit_media_metadata
  - validate_target_refs
  - validate_rights_fields
  - validate_explicit_source_url
  - bind_media_to_existing_stable_id
  - choose_representative_by_declared_display_role
  - generate_media_projection
  - update_changed_media_only
  - run_media_QA
```

```yaml
AUTO_PROHIBITED:
  - guess_depicted_entity
  - infer_target_from_filename
  - infer_rights_from_filename
  - invent_source_url
  - derive_Wikimedia_URL_from_file_title
  - auto_merge_same_name_entities
  - expose_VERIFY_media_payload
  - expose_HOLD_media_payload
  - create_new_stable_entity
  - create_new_research_claim
  - upgrade_certainty
  - upgrade_rights_status
  - mutate_source_research
```

## 8. Representative Selection

```yaml
REPRESENTATIVE_SELECTION:
  candidate_requirement:
    display_role: representative

  eligibility:
    - target_ref_valid
    - rights_status == CLEARED
    - rights_validation_passed

  priority:
    1: explicitly_declared_primary
    2: source_order

  conflict:
    multiple_primary:
      action: HOLD_REPRESENTATIVE_SELECTION
      payloads_may_remain_secondary: true

  fallback:
    no_eligible_representative:
      render:
        - attribution_metadata
        - existing_degraded_media_state
      invent_replacement: prohibited
```

## 9. Beersheba Pilot

```yaml
pilot_entity:
  stable_id: JBC-CR-PLACE-BEERSHEBA-001

pilot_media:
  - stable_id: JBC-MEDIA-BS-001
    creator: Sasha1506
    license: CC BY-SA 4.0
    display_role: representative
    subject:
      Tel_Beer_Sheva_archaeological_candidate

  - stable_id: JBC-MEDIA-BS-002
    creator: Daniel_Baranek
    license: CC BY-SA 3.0
    display_role: archaeology

  - stable_id: JBC-MEDIA-BS-003
    creator: Yonatan_Dodin
    license: CC BY 4.0
    display_role: modern_context
```

현재 연구자산에 없는 `source_url` 또는 `preview_url`을 파일명으로 추측해 생성하지 않는다.

```yaml
BEERSHEBA_PILOT_EXPECTED:
  existing_three_records:
    import: true
    identity_preserve: true

  current_source_url_missing:
    result:
      source_url_verified: false

  current_preview_url_missing:
    image_payload: false

  rendering:
    expected:
      attribution_only

  future:
    verified_source_url_added:
      rerun_only_changed_media: true
    validated_preview_url_added:
      image_payload_gate_re_evaluated: true
```

첫 pilot의 성공 기준:

- 3 MediaAsset 자동 결속
- 3 attribution-only 허용
- 0 invented URLs
- 0 unsafe payloads
- source research mutation 0

## 10. Failure Isolation

```yaml
MEDIA_FAILURE_STATES:
  MEDIA_TARGET_NOT_FOUND:
    action:
      - HOLD_MEDIA_RECORD
      - do_not_block_entity_projection

  TARGET_TYPE_MISMATCH:
    action:
      - HOLD_BINDING

  SOURCE_URL_MISSING:
    action:
      - preserve_metadata
      - source_url_verified_false

  SOURCE_URL_INVALID:
    action:
      - reject_URL
      - never_reconstruct

  RIGHTS_FIELDS_INCOMPLETE:
    action:
      - downgrade_payload_to_hidden
      - preserve_metadata

  RIGHTS_VERIFY:
    action:
      - no_payload

  RIGHTS_HOLD:
    action:
      - no_payload

  REPRESENTATIVE_CONFLICT:
    action:
      - no_automatic_winner
      - HOLD_primary_selection

  DUPLICATE_MEDIA_STABLE_ID:
    same_content_hash:
      action: reuse_existing
    conflicting_metadata:
      action: HOLD_RECORD

  SINGLE_MEDIA_FAILURE:
    scope: affected_media_only
    entity_projection: continue

  BUILD_FAILURE:
    action:
      - keep_last_known_good_media_projection
      - do_not_replace_current_projection
```

## 11. Incremental Sync

```yaml
MEDIA_INCREMENTAL_SYNC:
  identity_key:
    stable_id

  change_detection:
    - metadata_hash
    - target_refs_hash
    - rights_fields_hash

  changed_media:
    rebuild:
      - media_record
      - bound_target_media_list
      - representative_resolution_if_affected

  unchanged_media:
    rebuild: false

  changed_target_ref:
    revalidate:
      - old_target
      - new_target

  changed_rights:
    revalidate_payload_gate: true

  deleted_obsidian_media_note:
    automatic_delete_from_authoritative_projection: false

  resume_stages:
    - PARSED
    - TARGET_VALIDATED
    - RIGHTS_VALIDATED
    - PROJECTED
    - QA_PASSED
    - COMMITTED
```

## 12. QA Contract

```yaml
MEDIA_QA:
  identity:
    - all_media_stable_ids_unique
    - target_refs_resolve_existing_stable_ids
    - no_name_based_binding

  rights:
    - CLEARED_not_sufficient_without_validation
    - VERIFY_payload_hidden
    - HOLD_payload_hidden
    - missing_rights_payload_hidden

  source:
    - source_url_never_invented
    - filename_never_converted_to_URL
    - only_verified_source_url_clickable

  representative:
    - declared_role_only
    - deterministic_selection
    - ambiguous_primary_not_auto_resolved

  projection:
    - media_failure_does_not_break_entity
    - unchanged_media_not_rebuilt
    - stable_identity_shared_with_Detail

  Beersheba:
    - JBC_MEDIA_BS_001_bound
    - JBC_MEDIA_BS_002_bound
    - JBC_MEDIA_BS_003_bound
    - all_three_bound_to_correct_existing_identity
    - Tel_media_not_represented_as_exact_Genesis_location
    - modern_media_not_represented_as_ancient_city
    - current_missing_payload_remains_attribution_only

  regression:
    - existing_Beersheba_suite_PASS
    - existing_media_gate_PASS
    - all_existing_JudeBible_QA_PASS
    - zero_new_console_errors
```

## 13. Implementation Handoff

```yaml
MINIMUM_HANDOFF:
  from_project:
    09_앱기획_도이치리베_내부도구

  to_project:
    IMPLEMENTATION_PROJECT

  asset_id:
    OBSIDIAN_MEDIA_AUTO_BINDING_PIPELINE

  version:
    v0.1_CANDIDATE

  status:
    READY_FOR_IMPLEMENTATION

  pilot:
    entity:
      JBC-CR-PLACE-BEERSHEBA-001
    media:
      - JBC-MEDIA-BS-001
      - JBC-MEDIA-BS-002
      - JBC-MEDIA-BS-003

  implementation_units:
    - media_metadata_parser
    - target_ref_validator
    - rights_validator
    - source_url_validator
    - media_projection_generator
    - representative_resolver
    - incremental_media_manifest
    - media_QA

  preserve:
    - existing_projection_contract
    - existing_Beersheba_identity
    - existing_reader_hierarchy
    - existing_media_gate
    - controlled_degradation
    - KRV
    - source_research
    - all_existing_regressions

  prohibited:
    - new_registry
    - source_research_mutation
    - inferred_media_identity
    - invented_URL
    - invented_rights
    - automatic_truth_promotion
    - UI_redesign
    - external_release
```

## 14. Current Control State

```yaml
CURRENT_STATE:
  implementation:
    started: true

  canonical_direction:
    pipeline_first: true
    manual_UI_binding: prohibited_as_default
    obsidian_active_use: true
    stable_id_binding: required
    incremental_sync: required
    rights_gate: required

  next_evidence_expected:
    - implementation_result
    - changed_files
    - generated_media_projection
    - Beersheba_three_record_binding_result
    - rights_validation_result
    - regression_QA
```

## 15. Core Principle

> JudeBible의 미디어 자동화는 “사진을 자동으로 보여주는 기능”이 아니다.  
> MediaAsset을 기존 entity에 자동으로 안전하게 결속하고,  
> 출처·권리·identity 검증을 통과한 경우에만 실제 payload 노출을 허용하는 파이프라인이다.
