# NOTE_OVERLAP_SCRIPTURE_ANNOTATION_AND_INLINE_TEXT_SEARCH_COMPLETION_20261005

status: IMPLEMENTED_AND_VALIDATED
date: 2026-10-05
project: JudeBible_WebApp

## Implemented

### 1. Overlapping multi-note model
- new note storage: bvc.notes.v2
- each save creates an independent note record
- note record binds:
  - passage
  - exact verse set
  - text
  - created/updated timestamp
- legacy bvc.noteIndex notes remain readable
- current selection shows every stored note whose verse set intersects the current selected verse set
- selecting one verse therefore shows all notes that include that verse
- multiple notes can coexist on one verse
- notes are collapsed by default as individual details

Collapsed summary form:
- 내 메모 : 창세기 20장 2–4절
- non-contiguous ranges remain explicit, e.g. 창세기 20장 1, 3절

A separate new-note editor remains below overlapping saved notes.

### 2. Annotation interaction contract
Supported bidirectional workflows:
- drag Scripture text → click 형광펜/밑줄 → applies
- select 형광펜/밑줄 → drag Scripture text → applies immediately
- after applying, clicking a color immediately recolors the most recently applied annotation
- when a pending selected range exists, choosing a color with an active annotation tool applies that color to the selected range

Search and annotation Highlight namespaces are isolated:
- annotation: jbc_hl_* / jbc_ul_*
- text search: jbc_search_all / jbc_search_active

### 3. Unified header search
Header label/placeholder:
- 인물장소본문검색

Existing entity search remains:
- Person
- Place
- Region
- bound external reference label

Added current-chapter Scripture text search:
- literal keyword search in the rendered current chapter
- all matches highlighted
- active match emphasized separately
- total/current count displayed
- small ▲ / ▼ buttons cycle through matches
- cycling scrolls the matched verse into view
- entity markup is not rewritten
- Scripture annotation markup/data remains independent

Example browser validation:
- query: 아브라함
- current chapter: Genesis 20
- count observed: 8
- navigation observed: 1/8 → 2/8

### 4. Files changed
- app.js
- scripture-annotate.js
- index.html
- styles.css
- qa-sa.js

## Validation

Browser validation:
- note saved for Genesis 20:2–4 appeared when verse 3 alone was selected
- multiple note cards appeared on one selected verse
- drag → highlighter: PASS
- color change immediate recolor: PASS
- highlighter selected → drag auto-apply: PASS
- underline selected → drag auto-apply: PASS
- chapter text search count/navigation: PASS
- search Highlight and annotation Highlight coexist: PASS

Shared annotation QA:
- PASS 8/8

Global pipeline regression:
- PASS 110/110

JavaScript syntax:
- app.js PASS
- scripture-annotate.js PASS
- qa-sa.js PASS

## Boundaries

Personal notes and Scripture annotations remain user-local UI data.
They do not mutate:
- Scripture source text
- professional research assets
- Project01 Registry
- map coordinate authority
- Route geometry authority

Current chapter text search is a reader convenience feature and does not create research evidence.

external_release: NOT_AUTHORIZED
