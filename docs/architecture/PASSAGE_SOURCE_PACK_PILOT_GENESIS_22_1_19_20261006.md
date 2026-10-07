# PASSAGE SOURCE PACK PILOT — Genesis 22:1–19

status: PILOT_VALIDATED_WITH_VERIFY
date: 2026-10-06
owner: 01_목회연구_WORBS_BICS
assembler: JudeBible WebApp
scope: Genesis 22:1-19 only
contract: [TARGET, TEXT, EXISTING_RESEARCH, ENTITIES, EVIDENCE, UNCERTAINTY, PROVENANCE]
creates_new_registry_runtime_gate: false
changes_research_approval_projection_pipeline: false
professional_interpretation_in_pack: prohibited

## TARGET
book: Genesis
passage: 22:1-19
module_destination: WORBS
purpose: research-start input assembly only
book_profile:
  family: BOOK_PROFILE_BUNDLE_OT01_PENTATEUCH_v1.0.1_APPROVED
  source_id: BP-OT01-GEN
  use: on-demand Project01 research input

## TEXT
translation:
  runtime: F:/Projects/웹앱/data/krv.js
  translation: KRV 1961
  sha256: b09a58f1527bb32ccc554d5208736a3c797ba9b7ab1a87d50e9c577372518896
  quality: UNVERIFIED_TRANSCRIPTION
  rights: INTERNAL_PROTOTYPE_ONLY / RIGHTS_VERIFY
  passage_validation:
    chapter_22_verse_count: 24
    requested_range_present: VERIFIED_22_1_THROUGH_22_19
    boundary_check_22_1: PASS
    boundary_check_22_19: PASS
original_language:
  corpus: OSHB v.2.2
  commit: 6a5db284c715c18b239422e57bb89684e6a19f00
  source_file: Gen.xml
  source_sha256: e5ab737c323d3879733e03882ecf17b7d917115133f87f9cd97895ac98f2b1a4
  bound_runtime: F:/Projects/웹앱/data/original-language/hebrew/gen.js
  bound_runtime_sha256: 326d5dab778bc7029647ec76d27e1902c58d0485d7e94e37bfdd26309bdf9bd0
  passage_presence: VERIFIED_22_1_THROUGH_22_19
  machine_validation:
    verses: 19
    tokens: 307
    analysis_records: 307
    missing_verses: 0
    token_analysis_mismatch: 0
    lemma_refs_resolved: 307
    morph_refs_resolved: 307
morphology:
  source: OSHB
  binding: token text + analysis indexes in existing Hebrew runtime
  new_loader: false
lexical_layer:
  runtime_dict: F:/Projects/웹앱/data/original-language/hebrew/dict.js
  runtime_dict_sha256: 5ae664c688f7fef0870e6ee614e9a66edf01023246f8fdc725870a3feb5e21e7
  selected_source: Open Scriptures Hebrew Lexicon
  source_commit: 21c9add13bc727d3a951361778e97e3ff7afd1ce
  primary: LexicalIndex.xml
  mapping: AugIndex.xml
  fallback: HebrewStrong.xml
  semantics: SHORT_LEXICAL_GLOSS_ONLY
  contextual_exegesis: prohibited
  verified_runtime_entries: 8
  passage_mapped_tokens: 41
  passage_verified_entries:
    - {headword: "אַבְרָהָם", gloss_ko: "아브라함", token_count: 18}
    - {headword: "יִצְחָק", gloss_ko: "이삭", token_count: 5}
    - {headword: "בֵּן", gloss_ko: "아들", token_count: 10}
    - {headword: "אֱלֹהִים", gloss_ko: "하나님, 신(들)", token_count: 5}
    - {headword: "קָרָא", gloss_ko: "부르다", token_count: 3}
  note: only source-backed verified minimal gloss entries are attached; unmapped tokens remain without invented gloss
runtime_manifest:
  current_build_id: 69e01ba0ef15b476
  runtime_candidate: true
  production_adopted: false
  note: exact current runtime is newer than the earlier a8f15190 verification record; corpus identity is unchanged but build-level promotion must not be inferred

## EXISTING_RESEARCH
- type: person
  subject: Isaac
  research_id: JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01
  version: v1.0
  sha256: e75c9378dab8794728edf4021aecb986cf285ec63818afa067330a059bc2bf66
  status: CURRENT_PROJECT01_PROFESSIONAL_REPRESENTATIVE
  quality: PASS_WITH_VERIFY
  passage_relation: Genesis 22:1-19 DM_PRONOUN_CONTINUATION; DM_NAME at 22:2,3,6,7,9
  stable_identity: NONE_ISSUED
  stable_identity_proposal: JBC-CR-PERSON-ISAAC-001
  binding_rule: do not invent or issue identity
- type: person_reference_benchmark
  subject: Abraham
  reference_identity: ABRAHAM_FULL_CANONICAL_PERSON_PROFILE
  status: CAPTAIN_APPROVED_AS_REFERENCE_BENCHMARK
  quality: PROFESSIONAL_RESEARCH_PASS_WITH_VERIFY
  exact_research_id: NOT_LOCATED_IN_RETRIEVED_ASSETS
  exact_sha256: NOT_LOCATED_IN_RETRIEVED_ASSETS
  stable_identity: NOT_ESTABLISHED_IN_RETRIEVED_ASSETS
  passage_relation: Genesis 22:1-19 primary actor
  use: REFERENCE_BENCHMARK_ONLY_WITHIN_VERIFIED_SCOPE
  binding_rule: do not infer research identity or issue canonical Person identity
- type: place
  subject: Beersheba
  stable_identity: JBC-CR-PLACE-BEERSHEBA-001
  research_id: JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01
  sha256: ca65d402d5685455107b50c1dfc652bd04efd96c1815205ca075ed5a1ec1a07f
  source_note_status: CANDIDATE_FOR_CAPTAIN_REVIEW
  professional_projection_status: CURRENT_REPRESENTATIVE
  adoption_sha256: cb47576b8cd66740c14dc91c8a060bd21a0350e7be0c2a1c8f59c545a0784705
  passage_relation: Genesis 22:19
- type: passage_research
  title: WORBS | 창세기 22:1–19 | 아브라함의 시험
  drive_document_id: 14D4rkMe9rTekdjd0FCREBXbubvnRLLxVYolIJTFDWt8
  status: LEGACY_RESEARCH_FOUND_AUTHORITY_NOT_ESTABLISHED
  use: EVIDENCE_OR_PRIOR_WORK_ONLY_UNTIL_PROJECT01_REVALIDATES
  warning: contains unsupported/overstated claims; do not treat as current representative

## ENTITIES
confirmed_bindings:
  - {type: PLACE, label: 브엘세바, stable_identity: JBC-CR-PLACE-BEERSHEBA-001, verse: "22:19"}
research_without_stable_identity:
  - {type: PERSON, label: 이삭, research_id: JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01, stable_identity: null}
candidates_only_no_auto_identity:
  - {type: PERSON, label: 아브라함, relation: primary_actor, stable_identity: null, action: FIND_OR_RESEARCH_NOT_CREATE}
  - {type: PLACE, label: 모리아 땅, relation: destination, stable_identity: null, action: CANDIDATE_ONLY}
  - {type: EVENT, label: 모리아 시험/이삭 결박, range: "Genesis 22:1-19", stable_identity: null, action: CANDIDATE_ONLY}
  - {type: PERSON, label: 두 사환, stable_identity: null, action: CANDIDATE_ONLY}
  - {type: ENTITY, label: 여호와의 사자, stable_identity: null, action: CANDIDATE_ONLY}

## EVIDENCE
rules:
  interpretation_by_pack: prohibited
  evidence_may_be_attached_without_conclusion: true
attached:
  - id: EV-TEXT-OSHB-GEN22
    kind: primary_text_morphology
    source: OSHB v.2.2 Gen.xml + bound gen.js
    status: CONFIRMED
  - id: EV-LEX-OSHL
    kind: lexical
    source: Open Scriptures Hebrew Lexicon immutable commit 21c9add13bc727d3a951361778e97e3ff7afd1ce
    status: CONFIRMED_SOURCE_BINDING
  - id: EV-BOOKPROFILE-GEN
    kind: approved_book_profile
    source: BP-OT01-GEN within OT01 Pentateuch approved bundle
    status: CONFIRMED
  - id: EV-ISAAC
    kind: approved_reusable_research
    source: JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01
    status: CONFIRMED_WITH_RETAINED_VERIFY
  - id: EV-ABRAHAM-REFERENCE
    kind: approved_reference_benchmark
    source: PROJECT01_WORBS_THREE_REFERENCE_RESEARCH_SET_v1.0_CAPTAIN_APPROVED / ABRAHAM_FULL_CANONICAL_PERSON_PROFILE
    status: CONFIRMED_REFERENCE_SCOPE_ONLY_EXACT_ASSET_IDENTITY_VERIFY
  - id: EV-BEERSHEBA
    kind: approved_reusable_research
    source: JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01
    status: CONFIRMED_WITH_RETAINED_VERIFY_HOLD
  - id: EV-LEGACY-WORBS-GEN22
    kind: prior_research
    source: Google Doc 14D4rkMe9rTekdjd0FCREBXbubvnRLLxVYolIJTFDWt8
    status: VERIFY_AUTHORITY_AND_CLAIMS_BEFORE_REUSE
external_evidence:
  status: NOT_REQUIRED_FOR_PACK_COMPLETENESS
  note: geography/history/archaeology/scholarship may be attached later as evidence records only, with source locator and certainty; no interpretation is generated here

## UNCERTAINTY
- id: U-MORIAH-LOCATION
  status: HOLD
  statement: Genesis 22 does not provide a modern coordinate for the land/mountain of Moriah; do not auto-identify a precise modern point
- id: U-MORIAH-2CH3
  status: DISPUTED_OR_REQUIRES_EXEGESIS
  statement: relationship between Genesis 22 Moriah and 2 Chronicles 3:1 must be researched by Project01; Source Pack does not assert identity
- id: U-ROUTE
  status: HOLD
  statement: exact Beersheba-to-Moriah route geometry is not supplied by the text and is not generated
- id: U-ABRAHAM-PERSON
  status: VERIFY
  statement: a Captain-approved Abraham deep canonical Person reference benchmark was located, but its exact research_id/SHA and any issued stable identity were not established in the retrieved assets; reuse only as a reference benchmark and do not bind a canonical Person identity
- id: U-ISAAC-STABLE-ID
  status: HOLD_IDENTITY
  statement: Isaac has approved professional research but no issued stable identity; proposal must not be projected as canonical identity
- id: U-LEGACY-WORBS
  status: VERIFY
  statement: legacy Genesis 22 WORBS document exists but no Project01 approval/representative lineage was established; several claims require fresh verification
- id: U-RUNTIME-BUILD
  status: VERIFY
  statement: current OL build 69e01ba0ef15b476 is candidate/not production-adopted; prior bind revalidation records a8f15190ff7e32a6, so current build-level equivalence is not inferred
- id: U-KRV
  status: VERIFY
  statement: KRV runtime metadata marks the transcription UNVERIFIED_TRANSCRIPTION and RIGHTS_VERIFY

## PROVENANCE
professional_authority:
  owner: 01_목회연구_WORBS_BICS
  source_pack_role: INPUT_ASSEMBLY_ONLY
  app_role: COLLECT_EXISTING_DATA_AND_APPROVED_ASSETS
  no_new_registry_runtime_gate: true
  no_pipeline_change: true
resident_core:
  runtime_base: PROJECT01_RESEARCH_RUNTIME_BUNDLE_v1.0.2_APPROVED
  execution_overlay: PROJECT01_WORBS_BICS_END_TO_END_RUNTIME_v1.0_APPROVED
  handoff_schema: PROJECT01_MINIMUM_RESEARCH_HANDOFF_SCHEMA_v1.0_APPROVED
book_profile:
  family: BOOK_PROFILE_BUNDLE_OT01_PENTATEUCH_v1.0.1_APPROVED
  family_sha256: f2be0bfba6451db864bf139a1ad66ebea207f7b805117f8e95be3f1832dc87bf
  source_id: BP-OT01-GEN
  source_file: GEN_Genesis_BOOK_PROFILE_v0.2.md
  source_sha256: 736f824248cfa6b50090fe532ea801a74b2e46f662e1ba633d6c3f8f662ca72a
  execution_authority: BOOK_PROFILE_INPUT_SOURCE_WITHIN_APPROVED_FAMILY_BUNDLE
reference_benchmarks:
  abraham_set: PROJECT01_WORBS_THREE_REFERENCE_RESEARCH_SET_v1.0_CAPTAIN_APPROVED
beersheba_adoption:
  research_id: JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01
  stable_identity: JBC-CR-PLACE-BEERSHEBA-001
  source_note_status: CANDIDATE_FOR_CAPTAIN_REVIEW
  current_projection_status: CURRENT_REPRESENTATIVE
  adoption_sha256: cb47576b8cd66740c14dc91c8a060bd21a0350e7be0c2a1c8f59c545a0784705
jude_bible:
  ol_manifest: F:/Projects/웹앱/data/original-language/manifest.js
  ol_corpus_lock: F:/Projects/웹앱/tools/original-language/corpus.lock.json
  lexical_binding_record: G:/내 드라이브/Jude_Lee_OS/03_SHARED_APPROVED_ASSETS/JUDEBIBLE_MINIMAL_HEBREW_LEXICAL_GLOSS_SOURCE_BINDING_20261005.md
  isaac_projection: F:/Projects/웹앱/data/research.isaac.reader.js
  beersheba_projection: F:/Projects/웹앱/data/place.profile.beersheba.js
legacy_prior_work:
  genesis22_worbs_drive_id: 14D4rkMe9rTekdjd0FCREBXbubvnRLLxVYolIJTFDWt8

## VALIDATION
seven_field_contract:
  TARGET: PASS
  TEXT: PASS_WITH_VERIFY
  EXISTING_RESEARCH: PASS_WITH_VERIFY
  ENTITIES: PASS_WITH_VERIFY
  EVIDENCE: PASS
  UNCERTAINTY: PASS
  PROVENANCE: PASS
negative_checks:
  central_message_written: false
  theological_conclusion_written: false
  contextual_meaning_written: false
  new_canonical_identity_created: false
  registry_changed: false
  runtime_created: false
  gate_created: false
  research_approval_projection_pipeline_changed: false
completion_question: "Can Project01 start Genesis 22:1-19 WORBS immediately without re-hunting source material?"
verdict: YES_WITH_VERIFY
blocking_missing_input: NONE
retained_verify:
  - Abraham approved reference benchmark located, but exact research_id/SHA and issued stable identity remain unresolved
  - Isaac stable identity not issued
  - legacy Genesis 22 WORBS authority and individual claims not approved
  - current OL runtime build remains candidate/not production-adopted
  - KRV transcription/rights metadata remains VERIFY
next_action: HAND_THIS_PACK_TO_PROJECT01_WORBS_AS_INPUT_ONLY
