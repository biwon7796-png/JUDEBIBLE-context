"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const context = { console }; context.globalThis = context; context.window = context; vm.createContext(context);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, { filename: rel }); }
function ok(value, message) { if (!value) throw new Error(message); }
function test(name, fn) { try { const detail = fn() || ""; console.log("PASS", name, detail); return true; } catch (e) { console.error("FAIL", name, e.message); return false; } }

load("data/research.gen22.reader.js");
load("data/research.gen1-5.reader.js");
load("data/research.gen6-11.reader.js");
load("data/research.approved.reader.js");
load("verse-research-projection.js");
const P = context.BVCVerseResearchProjection;
const results = [];

results.push(test("WP01 approved production records keep source-to-Reader parity", () => {
  const rows = P.records(); ok(rows.length === 12, "expected Genesis 1–11 plus approved Genesis 22, got " + rows.length);
  rows.forEach((r) => { const a = P.preservationAudit(r); ok(a.ok, r.researchId + " lost " + a.lost.join(",")); });
  for (let ch=1;ch<=11;ch++) { const d=P.recordFor("gen-"+ch); ok(d && d.professionalStatus!=="STAGE_APPROVED", "Genesis "+ch+" missing local candidate display or falsely approved"); }
  ok(context.BVC_PASSAGE_RESEARCH_CONTENT.length === 11, "Genesis 1–11 source reader records missing");
  return "approved=1 local-display=11 candidates=11 no-promotion";
}));

results.push(test("WP02 Genesis 6 and 10 stay fail-closed without approved source assets", () => {
  for(const chapter of [6,10]) { const d=P.recordFor("gen-"+chapter);ok(d && d.professionalStatus==="CANDIDATE_REVIEW_ONLY", "local display must retain candidate status"); }
  ok(!P.valid(Object.assign({},P.recordFor("gen-6"),{researchId:"UNKNOWN_RESEARCH"})), "unknown candidate bypassed scoped display permission");
  return "gen-6,10=DISPLAY_ONLY professional=HOLD unknown=REJECT";
}));

function fixture(chapter, count, approved) {
  const discoveries = Array.from({ length: count }, (_, i) => ({ id:"g" + chapter + "-" + (i + 1), domain:["original_language","literary","history","geography","canonical"][i % 5], title:"검증 발견 " + (i + 1), paragraphs:["원본 의미 보존 검증문 " + (i + 1)], evidence:["gen-" + chapter + ":1"], certainty:"TEST_ONLY" }));
  return {
    researchId:"TEST_GENESIS_" + chapter + "_READER", sourceSha256:"a".repeat(64), passage:{ book:"gen", chapter, v1:1, v2:1 },
    projectionStatus:"INTERNAL_READER_PROJECTION", professionalStatus:"STAGE_APPROVED_WITH_VERIFY", externalRelease:"NOT_AUTHORIZED",
    generatedByProject:"04_목회프롬프트_하네스제작", professionalAuthorityOwner:"01_목회연구_WORBS_BICS",
    professionalReviewStatus:approved ? "APPROVED_FOR_INTERNAL_PROJECTION" : "CANDIDATE_NOT_ACTIVE",
    readerLayers:{ glance:{ overview:["길잡이"], centralMessage:"중심" }, commentary:{ sections:[{ id:"s", v1:1, v2:1, title:"기본 주석", paragraphs:["충분한 기본 주석"] }] }, deepResearch:{ discoveries, lexicalCards:[], cautions:[], canonicalLinks:[] } }
  };
}

results.push(test("WP03 Project04 output cannot bypass Project01 professional approval", () => {
  ok(P.valid(fixture(6, 9, false)) === false, "candidate Project04 output passed the authority gate");
  // Trust gate (2026-10-10): a record's own approvalRecord/SHA is never proof. Only build-time H06 bindings promote to APPROVED.
  ok(P.valid(fixture(6, 9, true)) === false, "self-declared Project04 approval was accepted without an H06 binding");
  return "candidate=REJECT self-declared-approval=REJECT";
}));

results.push(test("WP04 Genesis 6 reference shape retains all 9 discoveries", () => {
  const f = fixture(6, 9, true), a = P.preservationAudit(f), m = P.readerModel(f);
  ok(a.ok && a.counts.discoveries === 9 && m.deepResearch.discoveries.length === 9, JSON.stringify(a));
  return "9/9 test-only contract retention";
}));

results.push(test("WP05 Genesis 10 reference shape retains all 12 discoveries", () => {
  const f = fixture(10, 12, true), a = P.preservationAudit(f), m = P.readerModel(f);
  ok(a.ok && a.counts.discoveries === 12 && m.deepResearch.discoveries.length === 12, JSON.stringify(a));
  ok(new Set(m.deepResearch.discoveries.map((x) => x.domain)).size === 5, "research domains collapsed");
  return "12/12 test-only contract retention domains=5";
}));

results.push(test("WP06 three Reader tiers remain distinct", () => {
  const m = P.readerModel(P.recordFor("gen-22"));
  ok(m.glance.overview.length && m.commentary.sections.length && (m.deepResearch.lexicalCards.length || m.deepResearch.cautions.length || m.deepResearch.canonicalLinks.length), "a Reader tier is empty or collapsed");
  return "glance/commentary/deep-research";
}));

results.push(test("WP07 exact approved downstream chapter accepts only matching source SHA", () => {
  const source=P.recordFor("gen-6");
  const good=Object.assign({},source,{professionalStatus:"PROFESSIONAL_RESEARCH_PASS",
    professionalAuthorityOwner:"01_목회연구_WORBS_BICS",
    professionalReviewStatus:"APPROVED_DOWNSTREAM_PROJECTION",
    approvalSourceSha256:source.sourceSha256,approvalRecord:"TEST_ONLY.md"});
  ok(!P.valid(good),"self-declared downstream approval accepted without an H06 binding");
  ok(P.approvalClass(good)==="NONE","self-declared downstream approval classified as approved");
  ok(!P.valid(Object.assign({},good,{approvalSourceSha256:"a".repeat(64)})),"wrong approved SHA accepted");
  ok(!P.valid(Object.assign({},good,{professionalReviewStatus:"CANDIDATE_NOT_ACTIVE"})),"candidate slipped through");
  return "self-declared approval=REJECT (H06 bindings empty), mismatches=REJECT";
}));

const passed = results.filter(Boolean).length;
console.log((passed === results.length ? "PASS " : "FAIL ") + passed + "/" + results.length);
if (passed !== results.length) process.exitCode = 1;
