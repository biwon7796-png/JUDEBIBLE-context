// 연표 단계별 '본문에 이름이 나오는 인물' 표시 후보 데이터 생성기 (PRESENTATION ONLY).
// 입력: docs/receipts/JUDEBIBLE_13_ERAS_PERSON_DISPLAY_MINIMUM_TEXT_MATCH_QUEUE_20261010.csv (277행, DIRECT_APPEARANCE · TEXT_ONLY_QUEUE_NOT_APPROVED)
// 출력: data/timeline.era.persons.js — Person ID·Registry·권위를 만들지 않는다. 화면에서는 '미승인 후보'로만 표시한다.
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..", "..");
const csv = fs.readFileSync(path.join(root, "docs/receipts/JUDEBIBLE_13_ERAS_PERSON_DISPLAY_MINIMUM_TEXT_MATCH_QUEUE_20261010.csv"), "utf8").replace(/^\ufeff/, "");
function parse(s) { const r = []; let row = [], f = "", q = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f.replace(/\r$/, "")); r.push(row); row = []; f = ""; } else f += c; } if (f || row.length) { row.push(f); r.push(row); } return r; }
const R = parse(csv), H = R[0], rows = R.slice(1).filter(r => r.length > 5).map(r => Object.fromEntries(H.map((h, i) => [h, r[i]])));
const sandbox = { window: {} }; sandbox.window = sandbox; vm.createContext(sandbox); vm.runInContext(fs.readFileSync(path.join(root, "data/exploration.topics.js"), "utf8"), sandbox);
const E = Object.values(sandbox).find(v => v && v.categories && v.categories.some && v.categories.some(c => c.id === "era"));
const steps = {}; E.categories.find(c => c.id === "era").topics.forEach(t => (t.steps || []).forEach(s => steps[s.id] = s));
const KR = {}; vm.runInContext(fs.readFileSync(path.join(root, "data/krv.js"), "utf8"), sandbox); (sandbox.BVC_KRV.books || []).forEach(b => KR[b.id] = b);
function verseText(ev) { const m = /^([a-z0-9]+)-(\d+):(\d+)(?:-(\d+))?$/.exec(ev), ch = m && KR[m[1]] && KR[m[1]].chapters[+m[2] - 1]; if (!ch) return ""; let s = ""; for (let v = +m[3]; v <= (m[4] ? +m[4] : +m[3]); v++) s += ch[v - 1] || ""; return s; }
const out = {}, issues = []; let n = 0;
for (const r of rows) {
  if (r.evidence_class !== "DIRECT_APPEARANCE" || r.display_candidate_status !== "TEXT_ONLY_QUEUE_NOT_APPROVED") { issues.push(["class", r.candidate_row_key]); continue; }
  const s = steps[r.step_id]; if (!s) { issues.push(["nostep", r.step_id]); continue; }
  let name = (r.lookup_name || "").trim(); const ev = (r.exact_biblical_evidence || "").trim();
  // lookup_name(검색용 별칭)이 근거 절의 실제 표기와 다르면 같은 행의 original_person_candidate(본문 표기)로 맞춘다. 인물 동일성·CSV 원본은 바꾸지 않는다(예: 창 20–22장 아브라함).
  const orig = (r.original_person_candidate || "").trim(); if (ev && !verseText(ev).includes(name) && orig && verseText(ev).includes(orig)) name = orig;
  if (!name || !/^[a-z0-9]+-\d+:\d+(-\d+)?$/.test(ev)) { issues.push(["badrow", r.candidate_row_key, name, ev]); continue; }
  if (!verseText(ev).includes(name)) { issues.push(["name-not-in-evidence-verse", r.step_id, name, ev]); continue; }   // 이름 표면이 근거 절에 실제로 없으면 표시하지 않는다
  const L = out[r.step_id] = out[r.step_id] || [];
  if (L.some(x => x.n === name)) continue;
  L.push({ n: name, v: ev }); n++;
}
const body = "// 자동 생성: node tools/timeline/gen_person_candidates.js — 직접 수정하지 않는다.\n" +
  "// PRESENTATION ONLY · DISPLAY_CANDIDATE_NOT_APPROVED. 본문(KRV)에 이름이 나온다는 사실만 뜻하며 사건 참여자·역할·전역 Person ID를 승인하지 않는다.\n" +
  "window.JBC_TIMELINE_ERA_PERSONS = " + JSON.stringify({ meta: { schema: "JBC_TIMELINE_ERA_PERSONS_v0.1", authority: "DISPLAY_CANDIDATE_NOT_APPROVED", source: "PERSON_DISPLAY_MINIMUM_TEXT_MATCH_QUEUE_20261010", person_id_issuance: "NONE", registry_effect: "NONE", rows: n, steps: Object.keys(out).length }, steps: out }, null, 1) + ";\n";
fs.writeFileSync(path.join(root, "data/timeline.era.persons.js"), body);
console.log("rows", rows.length, "kept", n, "steps", Object.keys(out).length, "issues", issues.length, issues.slice(0, 8));
