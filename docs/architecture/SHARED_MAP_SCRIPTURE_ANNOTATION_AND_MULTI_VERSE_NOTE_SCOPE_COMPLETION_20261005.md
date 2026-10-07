# SHARED_MAP_SCRIPTURE_ANNOTATION_AND_MULTI_VERSE_NOTE_SCOPE_COMPLETION_20261005

status: IMPLEMENTED_AND_VALIDATED
date: 2026-10-05
task: IMPLEMENT_SHARED_MAP_SCRIPTURE_ANNOTATION_TOOLBAR_AND_MULTI_VERSE_NOTE_SCOPE
project: JudeBible_WebApp

## Implemented

1. Multi-verse note scope
- contiguous selection example: 창세기 20장 1–3절
- non-contiguous selection example: 창세기 20장 1, 3절
- note storage key follows the exact selected verse set
- scoped entity panels use the same selected verse set
- the visible selection breadcrumb uses the same range label

2. Shared map / Scripture annotation toolbar
- existing top annotation toolbar remains immediately left of quick search
- no second annotation toolbar is created
- map mode keeps: 이동·선택 / 펜 / 형광펜 / 지우개 / 거리 측정
- Scripture mode reuses the same controls as:
  - 본문 선택
  - 밑줄
  - 형광펜
  - 지우기
- distance measurement is hidden in Scripture mode
- returning to the map restores the map toolbar contract

3. Scripture annotations
- user drag selection is represented as passage + verse + character offsets
- Entity markup is not rewritten or destroyed
- CSS Custom Highlight API renders annotations over the existing Scripture DOM
- supported annotation types:
  - highlight
  - underline
  - erase selected annotation
  - undo
  - clear current passage annotations
  - show/hide annotations
- annotation color choice is retained
- annotations persist in localStorage under jbc.scripture.annotations.v1
- chapter remount restores saved annotations

4. Map annotation isolation
- map annotations remain coordinate-based in annotate.js
- Scripture annotations remain text-offset-based in scripture-annotate.js
- switching to Scripture mode disables map drawing hit capture
- switching back to map restores the previous map tool state
- no research asset, Registry, coordinate authority or map route authority is modified

## Files changed

- app.js
- annotate.js
- scripture-annotate.js
- styles.css
- index.html
- qa-sa.js

## QA

Shared annotation / multi-verse note E2E:
- PASS 8/8

Verified:
- contiguous multi-verse memo scope/key
- non-contiguous memo scope/key
- dragged Scripture selection
- shared toolbar Scripture mode
- highlight
- underline
- persistence across remount
- erase + undo
- Entity markup preservation
- map toolbar restoration
- toolbar remains immediately left of quick search
- map pen activation still works after returning from Scripture mode

Global pipeline regression:
- PASS 110/110

JavaScript syntax:
- app.js PASS
- annotate.js PASS
- scripture-annotate.js PASS
- qa-sa.js PASS

## Data boundary

Personal Scripture annotations are user-local UI data.
They are not:
- professional research evidence
- Scripture source text mutation
- Project01 Registry data
- map geometry authority
- route evidence

## Completion

multi_verse_note_scope: COMPLETE
shared_annotation_toolbar: COMPLETE
scripture_highlight: COMPLETE
scripture_underline: COMPLETE
scripture_erase_undo: COMPLETE
map_toolbar_preserved: PASS
global_regression: PASS
external_release: NOT_AUTHORIZED

NEXT_TASK_ONE:
RESUME_COMMON_PLACE_PERSON_PANEL_UI_REFINEMENT_ON_TOP_OF_COMPLETED_RESEARCH_AND_ANNOTATION_PIPELINES
