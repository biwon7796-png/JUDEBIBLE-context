# Hebrew basic gloss fixture review — 2026-10-06

Status: VERIFIED_FOR_MINIMAL_RUNTIME_GLOSS_BINDING

Scope: eight existing Hebrew fixture entries only. This is not a full lexicon review and does not authorize context-sensitive translation.

Binding authority:
- OSHB lemma -> Open Scriptures HebrewLexicon AugIndex -> LexicalIndex id.
- No number-equality shortcut.
- Unmapped/conflict entries remain fail-closed.

Reviewed fixtures:
| OSHB lemma | Lexical id | Headword | Upstream def | Verified Korean minimal gloss |
|---|---|---|---|---|
| 1642 | cog | גְּרָר | Gerar | 그랄 |
| 3327 | fgh | יִצְחָק | Isaac. Compare | 이삭 |
| 3446 | fky | יִשְׂחָק | Isaac. Compare | 이삭 |
| 85 | adk | אַבְרָהָם | Abraham | 아브라함 |
| 7121 | lln | קָרָא | call | 부르다 |
| 3205 | fbi | יָלַד | bear | 낳다 |
| 1121 a | bss | בֵּן | son | 아들 |
| 430 | arn | אֱלֹהִים | gods | 하나님, 신(들) |

Review notes:
- Proper names use the established Korean biblical name.
- קָרָא uses the minimal head sense "부르다"; broader senses such as proclaim/read are not collapsed into the basic-gloss field.
- יָלַד uses the minimal verbal gloss "낳다"; beget/bear nuances remain outside this minimal field.
- אֱלֹהִים is intentionally represented as "하나님, 신(들)" so the minimal lexical field does not force one context-specific theological reading.
- The upstream fragment "Isaac. Compare" is treated as a cross-reference artifact; only the head sense is carried into the Korean minimal gloss.

Gate result:
- review.status changed to VERIFIED for all 8 fixtures.
- emitRuntime gate now accepts the 8 reviewed entries.
- Unverified, drifted, empty-gloss, unmapped, and conflict cases still fail closed.

Regression:
- tools/original-language/tests/hebrew-lexicon.test.js: 10/10 PASS after updating the gate expectation from the former all-unreviewed fixture state to the current verified-fixture state.
- Corpus binding remains 305,912 / 306,785 analysed Hebrew tokens OK (99.72%); this review does not alter that mapping layer.

Next:
- REPAIR_HEBREW_LEMMA_TO_BASIC_GLOSS_CANONICAL_BINDING
- Emit only VERIFIED entries to the runtime lexicon and bind them to the Hebrew word card's 표제어/기본 뜻 fields.
