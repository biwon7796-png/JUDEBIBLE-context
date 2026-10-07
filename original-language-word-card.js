/* JudeBible pastor-friendly original-language word card (learning/confirmation aid; NOT a lexicon, NOT a relation classifier).
 * window.BVCOriginalWordCard = { describe, show, hide, isShown, hebrew, greek, hebrewPos, greekPos, speak, pickVoice, env }
 * Shows only what the runtime corpus supports: surface, learner Korean reading, romanization, lemma (as stored), simple part of speech, device speech.
 * - Korean reading / romanization are DERIVED from the surface by one fixed convention per language (simplified learning aids, not a scholarly reconstruction).
 * - Lemma/POS come from the stored analysis only; absent analysis (MACULA X/U -> null) is never guessed.
 * - Basic meaning (Korean): only VERIFIED ledger glosses are shown; otherwise LEXICAL_GLOSS_SOURCE_PENDING (no Korean is ever invented, MACULA gloss/english stay excluded).
 * - English meaning (optional `d.step`, STEPBible TBESH/TBESG Gloss column): a separately labelled, source-credited English row when the dictionary carries it.
 *   Entries also in the project review queue (reviewCodes) are marked "검토 중". A dictionary without `step` renders exactly as before.
 * - "이 본문에서의 의미" is omitted (no approved reader field). The "본문연구 보기" CTA appears only for a token bound by BVCResearchProjection
 *   (WORBS-verified research projection; see research-projection.js); otherwise nothing is shown, no placeholder.
 * - Speech: browser-native speechSynthesis with the ORIGINAL token as playback text; no backend, no key.
 */
(function (root) {
  "use strict";
  var ONSET = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", VOWEL = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ", CODA = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  var Y_MOD = { "ㅏ": "ㅑ", "ㅔ": "ㅖ", "ㅣ": "ㅣ", "ㅗ": "ㅛ", "ㅜ": "ㅠ", "ㅡ": "ㅖ" }, SH_MOD = { "ㅏ": "ㅑ", "ㅔ": "ㅖ", "ㅣ": "ㅣ", "ㅗ": "ㅛ", "ㅜ": "ㅠ", "ㅡ": "ㅡ" };

  // ---- shared: items -> Hangul syllables / Latin. item = {c:1, lat, on, coda, mod, dup} (consonant) | {v:"ㅏ", lat} (vowel) ----
  function syl(on, v, coda) { return String.fromCharCode(0xAC00 + (ONSET.indexOf(on) * 21 + VOWEL.indexOf(v)) * 28 + (coda ? CODA.indexOf(coda) : 0)); }
  function hangul(items) {
    var out = [], i = 0, it, nx, prev;
    items = items.filter(function (x, k) { return x.v || x.on || x.coda || (items[k + 1] && items[k + 1].v) ? true : false; });   // silent consonants (alef/ayin/rough mark) drop out unless they carry a vowel
    while (i < items.length) {
      it = items[i]; nx = items[i + 1];
      if (it.v) { out.push({ on: "ㅇ", v: it.v, coda: null }); i++; }
      else if (nx && nx.v) { out.push({ on: it.on || "ㅇ", v: it.mod === "y" ? (Y_MOD[nx.v] || nx.v) : it.mod === "sh" ? (SH_MOD[nx.v] || nx.v) : nx.v, coda: null }); i += 2; }
      else {
        i++; if (!it.on || it.dup) continue;
        prev = out[out.length - 1];
        if (it.coda && prev && !prev.coda) prev.coda = it.coda; else out.push({ on: it.on, v: it.mod === "y" ? "ㅣ" : "ㅡ", coda: null });
      }
    }
    return out.map(function (s) { return syl(s.on, s.v, s.coda); }).join("");
  }
  function latin(items, cap) {
    var s = items.map(function (x) { return x.lat || ""; }).join(""), m = /[a-zāēōīûêîôəăĕŏʾʿḥṭṣšśḡ]/i.exec(s);
    if (cap && m) s = s.slice(0, m.index) + m[0].toUpperCase() + s.slice(m.index + 1);
    return s;
  }

  // ---- Hebrew (one convention: niqqud-based, Sephardi-like simplified reading; dagesh doubling ignored; silent sheva) ----
  var HL = { "א": ["ʾ", null], "ב": ["b", "ㅂ"], "ג": ["g", "ㄱ"], "ד": ["d", "ㄷ"], "ה": ["h", "ㅎ"], "ו": ["w", "ㅂ"], "ז": ["z", "ㅈ"], "ח": ["ḥ", "ㅎ"], "ט": ["ṭ", "ㅌ"], "י": ["y", "ㅇ", "y"], "כ": ["k", "ㅋ"], "ך": ["k", "ㅋ"], "ל": ["l", "ㄹ"], "מ": ["m", "ㅁ"], "ם": ["m", "ㅁ"], "נ": ["n", "ㄴ"], "ן": ["n", "ㄴ"], "ס": ["s", "ㅅ"], "ע": ["ʿ", null], "פ": ["p", "ㅍ"], "ף": ["p", "ㅍ"], "צ": ["ṣ", "ㅊ"], "ץ": ["ṣ", "ㅊ"], "ק": ["q", "ㅋ"], "ר": ["r", "ㄹ"], "ש": ["š", "ㅅ", "sh"], "ת": ["t", "ㅌ"] };
  var HCODA = { "ל": "ㄹ", "ם": "ㅁ", "ן": "ㄴ" };
  var HV = { 1456: ["ə", "ㅡ"], 1457: ["ĕ", "ㅔ"], 1458: ["ă", "ㅏ"], 1459: ["ŏ", "ㅗ"], 1460: ["i", "ㅣ"], 1461: ["ē", "ㅔ"], 1462: ["e", "ㅔ"], 1463: ["a", "ㅏ"], 1464: ["ā", "ㅏ"], 1465: ["ō", "ㅗ"], 1466: ["ō", "ㅗ"], 1467: ["u", "ㅜ"], 1479: ["o", "ㅗ"] };
  function heClusters(s) {
    var out = [], c = null, i, cp;
    for (i = 0; i < s.length; i++) {
      cp = s.charCodeAt(i);
      if (cp >= 0x5D0 && cp <= 0x5EA) { c = { l: s.charAt(i), v: 0, dag: false, sin: false }; out.push(c); }
      else if (!c) continue;
      else if (cp === 0x5BC) c.dag = true;
      else if (cp === 0x5C2) c.sin = true;
      else if ((cp >= 0x5B0 && cp <= 0x5BB) || cp === 0x5C7) { if (!c.v) c.v = cp; }
    }
    return out;
  }
  function hebrewItems(surface) {
    var cl = heClusters(surface), items = [], prevLong = false, i, c, p, L, last, lastV, kind, vocal;
    function V(lat, j) { items.push({ v: j, lat: lat }); lastV = items[items.length - 1]; }
    for (i = 0; i < cl.length; i++) {
      c = cl[i]; p = cl[i - 1]; last = i === cl.length - 1; L = HL[c.l];
      if (c.l === "ו" && !c.v && c.dag) { V("û", "ㅜ"); prevLong = true; continue; }                                 // shureq
      if (c.l === "ו" && (c.v === 0x5B9 || c.v === 0x5BA) && p && !p.v) { V("ô", "ㅗ"); prevLong = true; continue; }    // holam male
      if (c.l === "י" && !c.v && p && (p.v === 0x5B4 || p.v === 0x5B5 || p.v === 0x5B6)) { if (lastV) lastV.lat = lastV.lat === "i" ? "î" : lastV.lat === "e" || lastV.lat === "ē" ? "ê" : lastV.lat; prevLong = true; continue; }   // mater yod
      if (c.l === "ה" && !c.v && last && p && p.v) continue;                                                           // final silent he
      if ((c.l === "א" || c.l === "ע") && !c.v) { items.push({ c: 1, lat: L[0], on: null }); continue; }   // silent in the Korean reading
      items.push({ c: 1, lat: c.l === "ש" && c.sin ? "ś" : L[0], on: L[1], mod: c.l === "ש" && c.sin ? null : L[2], coda: !c.v && last ? HCODA[c.l] || null : null });
      if (!c.v) { prevLong = false; continue; }
      if (c.v === 0x5B0) {
        vocal = !last && (i === 0 || (p && p.v === 0x5B0) || prevLong);
        if (vocal) V("ə", "ㅡ");
        prevLong = false;
      } else { kind = HV[c.v]; V(kind[0], kind[1]); prevLong = c.v === 0x5B5 || c.v === 0x5B8 || c.v === 0x5B9; }
    }
    return items;
  }
  function hebrewClean(s) { return s.replace(/\//g, "").replace(/[֑-ֽֿ֯׀׃-׆]/g, ""); }   // drop cantillation/meteg/punctuation; keep letters + niqqud
  function hebrew(surface, proper) { var it = hebrewItems(hebrewClean(surface)); return { ko: hangul(it), la: latin(it, !!proper) }; }

  // ---- Greek (one convention: Erasmian-style simplified reading; accents/breathing dropped; rough breathing = h) ----
  var GC = { "β": ["b", "ㅂ"], "γ": ["g", "ㄱ"], "δ": ["d", "ㄷ"], "ζ": ["z", "ㅈ"], "θ": ["th", "ㅌ"], "κ": ["k", "ㅋ", "ㄱ"], "λ": ["l", "ㄹ", "ㄹ"], "μ": ["m", "ㅁ", "ㅁ"], "ν": ["n", "ㄴ", "ㄴ"], "π": ["p", "ㅍ", "ㅂ"], "ρ": ["r", "ㄹ", "ㄹ"], "σ": ["s", "ㅅ"], "τ": ["t", "ㅌ", "ㄷ"], "φ": ["ph", "ㅍ"], "χ": ["ch", "ㅋ"] };
  var GV = { "α": ["a", "ㅏ"], "ε": ["e", "ㅔ"], "η": ["ē", "ㅔ"], "ι": ["i", "ㅣ"], "ο": ["o", "ㅗ"], "υ": ["y", "ㅟ"], "ω": ["ō", "ㅗ"] };
  var GD = { "αι": [["ai", "ㅏ"], ["", "ㅣ"]], "αυ": [["au", "ㅏ"], ["", "ㅜ"]], "ει": [["ei", "ㅔ"], ["", "ㅣ"]], "ευ": [["eu", "ㅔ"], ["", "ㅜ"]], "ηυ": [["ēu", "ㅔ"], ["", "ㅜ"]], "οι": [["oi", "ㅗ"], ["", "ㅣ"]], "ου": [["ou", "ㅜ"]], "υι": [["ui", "ㅟ"]] };
  function greekChars(s) {
    var d = s.normalize("NFD"), out = [], i, ch, cp, lo;
    for (i = 0; i < d.length; i++) {
      ch = d.charAt(i); cp = d.charCodeAt(i);
      if (cp >= 0x300 && cp <= 0x36F) { if (out.length) { if (cp === 0x314) out[out.length - 1].rough = true; else if (cp === 0x308) out[out.length - 1].dia = true; } continue; }
      lo = ch.toLowerCase(); if (lo === "ς") lo = "σ";
      if (GC[lo] || GV[lo] || lo === "ξ" || lo === "ψ") out.push({ ch: lo, up: ch !== ch.toLowerCase(), rough: false, dia: false });
    }
    return out;
  }
  function greekItems(surface) {
    var cs = greekChars(surface), items = [], i = 0, c, n, pair, k, def, hh = false;
    function cons(lat, on, coda, dup) { items.push({ c: 1, lat: lat, on: on, coda: coda || null, dup: dup }); }
    while (i < cs.length) {
      c = cs[i]; n = cs[i + 1];
      if (GV[c.ch]) {
        pair = n && !n.dia && GD[c.ch + n.ch]; hh = c.rough || (pair && n.rough);
        if (hh) cons("h", "ㅎ");
        if (pair) { for (k = 0; k < pair.length; k++) items.push({ v: pair[k][1], lat: pair[k][0] }); i += 2; }
        else { items.push({ v: GV[c.ch][1], lat: GV[c.ch][0] }); i++; }
        continue;
      }
      if (c.ch === "ξ") { cons("x", "ㅋ", "ㄱ"); cons("", "ㅅ"); }
      else if (c.ch === "ψ") { cons("ps", "ㅍ", "ㅂ"); cons("", "ㅅ"); }
      else if (c.ch === "γ" && n && (n.ch === "γ" || n.ch === "κ" || n.ch === "ξ" || n.ch === "χ")) cons("n", "ㅇ", "ㅇ");
      else { def = GC[c.ch]; cons(def[0], def[1], def[2], i > 0 && cs[i - 1].ch === c.ch); if (c.ch === "ρ" && c.rough) items[items.length - 1].lat += "h"; }
      i++;
    }
    return items;
  }
  function greek(surface) { var it = greekItems(surface), f = surface.normalize("NFD").charAt(0); return { ko: hangul(it), la: latin(it, f !== f.toLowerCase()) }; }

  // ---- part of speech: simplified Korean names only; raw codes are never shown ----
  var HPOS = { N: "명사", V: "동사", A: "형용사", D: "부사", R: "전치사", C: "접속사", P: "대명사", T: "불변화사" }, HT = { d: "관사", o: "목적격 표지", r: "관계사" };
  function hebrewPos(morph) {
    if (!morph) return null;
    var segs = morph.slice(1).split("/").filter(function (x) { return x.charAt(0) !== "S"; }), m = segs[segs.length - 1] || "", c = m.charAt(0);
    if (c === "N") return m.charAt(1) === "p" ? "고유명사" : "명사";
    if (c === "T") return HT[m.charAt(1)] || "불변화사";
    return HPOS[c] || null;
  }
  var GPOS = { noun: "명사", verb: "동사", det: "관사", conj: "접속사", adj: "형용사", pron: "대명사", adv: "부사", prep: "전치사", ptcl: "불변화사", num: "수사", intj: "감탄사" };
  function greekPos(morph, cls) { if (!cls) return null; if (cls === "noun" && morph === "N-PRI") return "고유명사"; return GPOS[cls] || null; }

  // ---- describe: all card data for one token (pure) ----
  function hebrewLemma(l) {
    var parts = (l || "").split("/"), m = /^\d+/.exec(parts[parts.length - 1]);
    return m ? m[0] : null;
  }
  function stepOf(d, a) {
    var s = d && d.step, i = s && s.lemma_to_step && a ? s.lemma_to_step[a[0]] : null, e = i != null && s.entries ? s.entries[i] : null;
    return e ? { id: e[0], en: e[1], review: e[2] || "" } : null;
  }
  function describe(info) {
    var lang = info.lang, t = info.tok, a = info.a, d = info.dict, o = { lang: lang, status: "OK", pos: null, lemma: null, lemmaKind: null, gloss: null, glossStatus: "LEXICAL_GLOSS_SOURCE_PENDING" }, morph, cls, pr, id, lxid, lxe, st = null;
    if (lang === "he") {
      o.surface = hebrewClean(t[0]); o.speakText = o.surface;
      if (a && d) {
        morph = d.morph[a[1]]; o.pos = hebrewPos(morph); st = stepOf(d, a);
        lxid = d.lexical && d.lexical.lemma_to_id && d.lexical.lemma_to_id[a[0]];
        lxe = lxid && d.lexical.entries && d.lexical.entries[lxid];
        if (lxe && lxe.headword && lxe.glossKo) { o.lemma = lxe.headword; o.lemmaKind = "TEXT"; o.gloss = lxe.glossKo; o.glossStatus = "VERIFIED"; }
        else { id = hebrewLemma(d.lemma[a[0]]); if (id) { o.lemma = id; o.lemmaKind = "NUMBER"; } }
      }
      else o.status = "ANALYSIS_UNAVAILABLE";
      pr = hebrew(t[0], o.pos === "고유명사");
    } else {
      o.surface = t[0]; o.speakText = t[0];
      if (a && d) { morph = d.morph[a[1]]; cls = d.feat && d.feat[a[2]] ? d.feat[a[2]][0] : null; o.pos = greekPos(morph, cls); o.lemma = d.lemma[a[0]] || null; if (o.lemma) o.lemmaKind = "TEXT"; st = stepOf(d, a);
        lxid = d.lexical && d.lexical.lemma_to_id && d.lexical.lemma_to_id[a[0]];
        lxe = lxid && d.lexical.entries && d.lexical.entries[lxid];
        if (lxe && lxe.glossKo) { o.gloss = lxe.glossKo; o.glossStatus = "VERIFIED"; }   // only VERIFIED entries are ever emitted into d.lexical
      }
      else o.status = "ANALYSIS_UNAVAILABLE";
      pr = greek(t[0]);
    }
    if (st) { o.stepEn = st.en; o.stepId = st.id; o.stepReview = st.review; if (o.glossStatus !== "VERIFIED") o.glossStatus = "KO_PENDING_EN_SOURCE_BACKED"; }
    o.ko = pr.ko; o.la = pr.la; return o;
  }

  // ---- speech (browser-native; the ORIGINAL token is the playback text) ----
  var ENV = { synth: function () { return root.speechSynthesis || null; }, Utter: function () { return root.SpeechSynthesisUtterance || null; } };
  function pickVoice(lang) {
    var s = ENV.synth(), vs = s && s.getVoices ? s.getVoices() : [], p = lang === "he" ? "he" : "el", i, l;
    for (i = 0; i < vs.length; i++) { l = String(vs[i].lang || "").toLowerCase().replace("_", "-"); if (l === p || l.indexOf(p + "-") === 0) return vs[i]; }
    return null;
  }
  var playToken = 0;
  function speak(lang, text, hooks) {
    var s = ENV.synth(), U = ENV.Utter(), v = s && U ? pickVoice(lang) : null, u, my;
    if (!s || !U) return "NO_SPEECH";
    if (!v) return "NO_VOICE";
    try { s.cancel(); } catch (e) {}
    u = new U(text); u.voice = v; u.lang = v.lang; my = ++playToken;
    u.onstart = function () { if (my === playToken && hooks && hooks.onstart) hooks.onstart(); };
    u.onend = u.onerror = function () { if (my === playToken && hooks && hooks.onend) hooks.onend(); };
    try { s.speak(u); } catch (e) { return "ERROR"; }
    return "PLAYING";
  }
  function stopSpeech() { playToken++; var s = ENV.synth(); try { if (s) s.cancel(); } catch (e) {} }

  // ---- UI ----
  var noteShown = false, shownIn = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function row(dl, k, v, cls) { var r = el("div", "ol-card-row"); r.appendChild(el("dt", null, k)); r.appendChild(el("dd", cls || null, v)); dl.appendChild(r); return r; }
  function hide(box) { stopSpeech(); if (box) { box.textContent = ""; box.hidden = true; box.removeAttribute("data-state"); } if (shownIn === box) shownIn = null; }
  function show(box, info, onClose) {
    var RP = root.BVCResearchProjection, link, rpBox, rb, o = describe(info), dl = el("dl", "ol-card-rows"), top = el("div", "ol-card-top"), x = el("button", "ol-card-x", "×"), s = el("span", "ol-card-surface", o.surface), ab = el("button", "btn ghost ol-card-audio", "🔊 발음 듣기"), note = el("p", "ol-card-note");
    stopSpeech(); box.textContent = ""; box.hidden = false; box.setAttribute("data-state", "SHOWN"); shownIn = box;
    box.setAttribute("role", "region"); box.setAttribute("aria-label", "원어 단어 카드: " + o.surface);
    s.setAttribute("lang", info.lang === "he" ? "he" : "grc"); s.setAttribute("dir", info.lang === "he" ? "rtl" : "ltr");
    x.type = "button"; x.setAttribute("aria-label", "단어 카드 닫기"); x.addEventListener("click", function () { hide(box); if (onClose) onClose(); });
    top.appendChild(s); top.appendChild(x); box.appendChild(top);
    row(dl, "한글 발음", o.ko || "—", "ol-card-ko"); row(dl, "로마자", o.la || "—", "ol-card-la");
    if (o.status === "ANALYSIS_UNAVAILABLE") { row(dl, "표제어", "분석 정보 확인 중", "ol-card-pending"); row(dl, "품사", "분석 정보 확인 중", "ol-card-pending"); }
    else {
      row(dl, "표제어", o.lemmaKind === "TEXT" ? o.lemma : o.lemmaKind === "NUMBER" ? "어휘 번호 " + o.lemma + " (표제어 철자 정보 없음)" : "정보 없음", o.lemmaKind === "TEXT" ? "ol-card-lemma" : null);
      row(dl, "품사", o.pos || "정보 없음");
    }
    if (o.glossStatus === "VERIFIED" && o.gloss) row(dl, "기본 뜻", o.gloss, "ol-card-gloss").setAttribute("data-gloss", "VERIFIED");
    else row(dl, "기본 뜻", o.stepEn ? "한국어 뜻은 검수 후 제공됩니다." : "기본 뜻 정보는 아직 준비 중입니다.", "ol-card-pending").setAttribute("data-gloss", o.glossStatus);
    if (o.stepEn) {
      var er = row(dl, "영어 뜻", o.stepEn + (o.stepReview ? " (검토 중)" : ""), "ol-card-en");
      er.setAttribute("data-source", "STEPBible"); er.setAttribute("data-strong", o.stepId); if (o.stepReview) er.setAttribute("data-review", o.stepReview);
      er.lastChild.appendChild(el("span", "ol-card-src", " · 출처 STEPBible (CC BY 4.0)"));
    }
    box.appendChild(dl);
    link = RP && info.krvRef && info.srcRef ? RP.token(info.krvRef, info.srcRef, info.ti) : null;   // only a WORBS-verified DM_NAME token of the Project01 representative; lemma match alone never gets here
    if (link) { rpBox = el("div", "rp-panel"); rpBox.hidden = true; rb = RP.cta(info.krvRef, rpBox); if (rb) { box.appendChild(rb); box.appendChild(rpBox); } }
    ab.type = "button"; ab.setAttribute("aria-label", "발음 듣기");
    function setIdle() { ab.textContent = "🔊 발음 듣기"; ab.setAttribute("aria-pressed", "false"); }
    var v = ENV.synth() && ENV.Utter() ? pickVoice(info.lang) : null;
    if (!v) { ab.disabled = true; note.textContent = "이 기기에서는 해당 원어 음성을 지원하지 않습니다."; }
    else if (!noteShown) { note.textContent = "기기 음성에 따라 발음이 다를 수 있으며, 학술적으로 복원된 발음이 아닙니다."; noteShown = true; }
    ab.addEventListener("click", function () {
      var r = speak(info.lang, o.speakText, { onstart: function () { ab.textContent = "⏹ 재생 중…"; ab.setAttribute("aria-pressed", "true"); }, onend: setIdle });
      if (r !== "PLAYING") { setIdle(); ab.disabled = r === "NO_SPEECH" || r === "NO_VOICE"; if (ab.disabled) note.textContent = "이 기기에서는 해당 원어 음성을 지원하지 않습니다."; }
    });
    setIdle(); box.appendChild(ab); if (note.textContent) box.appendChild(note);
    return o;
  }
  root.BVCOriginalWordCard = { describe: describe, show: show, hide: hide, isShown: function () { return !!shownIn && !shownIn.hidden; }, hebrew: hebrew, greek: greek, hebrewPos: hebrewPos, greekPos: greekPos, speak: speak, stopSpeech: stopSpeech, pickVoice: pickVoice, env: ENV };
})(typeof window !== "undefined" ? window : globalThis);
