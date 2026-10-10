// 연표 단계 범위와 겹치는 기존 본문 연구를 '제안'한다(읽기 전용). 제안은 연결이 아니다: 의미 관계를 사람이 검증한 뒤 data/timeline.era.research.js 에 적는다.
// usage: node tools/timeline/suggest_research_links.js [eraId]
const fs = require("fs"), path = require("path"), vm = require("vm"), root = path.join(__dirname, "..", "..");
const sb = {}; sb.window = sb; vm.createContext(sb);
["data/exploration.topics.js", "data/research.approved.reader.js", "data/research.gen1-5.reader.js", "data/research.gen6-11.reader.js", "data/research.gen22.reader.js", "data/timeline.era.research.js"].forEach(f => { try { vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sb); } catch (e) { console.error("skip", f, e.message); } });
const E = Object.values(sb).find(v => v && v.categories && v.categories.some && v.categories.some(c => c.id === "era"));
const recs = [sb.BVC_VERSE_RESEARCH_CONTENT].concat(sb.BVC_PASSAGE_RESEARCH_CONTENT || []).filter(Boolean);
const have = new Set(((sb.JBC_TIMELINE_ERA_RESEARCH || {}).links || []).map(l => l.step + "|" + l.researchId));
const only = process.argv[2], rx = /^([a-z0-9]+)-(\d+):(\d+)(?:-(\d+))?$/; let n = 0;
E.categories.find(c => c.id === "era").topics.filter(t => !only || t.id === only).forEach(t => (t.steps || []).forEach(s => {
  const m = rx.exec(s.range || ""); if (!m) return; const a = +m[3], b = m[4] ? +m[4] : a;
  recs.filter(d => d.passage.book === m[1] && +d.passage.chapter === +m[2] && !(a > +d.passage.v2 || b < +d.passage.v1)).forEach(d => {
    const rel = a >= +d.passage.v1 && b <= +d.passage.v2 ? (a === +d.passage.v1 && b === +d.passage.v2 ? "EXACT" : "CONTAINS") : "PART";
    console.log((have.has(s.id + "|" + d.researchId) ? "linked   " : "SUGGEST  ") + s.id.padEnd(34) + s.range.padEnd(14) + rel.padEnd(9) + d.researchId + " [" + d.professionalStatus + "]"); n++;
  });
}));
console.log(n + " range-overlap pair(s)");
