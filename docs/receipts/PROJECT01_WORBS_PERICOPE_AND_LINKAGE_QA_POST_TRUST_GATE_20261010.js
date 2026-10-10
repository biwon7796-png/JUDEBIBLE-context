"use strict";
/* POST-TRUST-GATE VARIANT (2026-10-10). Pericope-logic tests run on an in-memory copy of the engine whose gate is stubbed open; gate tests use the real engine. READ-ONLY QA. Does not write app files, change Registry, or promote any research. */
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const ROOT=path.resolve(__dirname,"../..");
const file=p=>path.join(ROOT,p), sha=p=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
class E {
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.className="";this.textContent="";this.hidden=false;this.dataset={};this.classList={add:()=>{}};this.parentElement=null;this.isConnected=true;}
 appendChild(e){this.children.push(e);e.parentElement=this;return e;}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(){}
 closest(){return null}
 querySelector(){return null}
 getBoundingClientRect(){return {top:0}}
}
global.document={createElement:tag=>new E(tag)};
global.window=global;global.location={search:""};
const projectionFile=file("verse-research-projection.js");
function load(records=[],verseRecord=null,realGate=false){
 global.BVC_PASSAGE_RESEARCH_CONTENT=records;
 global.BVC_VERSE_RESEARCH_CONTENT=verseRecord;
 delete global.BVCVerseResearchProjection;
 if(realGate){delete require.cache[require.resolve(projectionFile)];require(projectionFile);return global.BVCVerseResearchProjection;}
 const gate='function valid(d) { return approvalClass(d) !== "NONE"; }';
 let src=fs.readFileSync(projectionFile,"utf8");
 if(!src.includes(gate))throw Error("GATE_ANCHOR_MISSING");
 (0,eval)(src.replace(gate,"function valid(d){ return !!(d&&d.passage&&d.researchId); }"));
 return global.BVCVerseResearchProjection;
}
function mock(id,chapter,v1,v2,opts={}){
 return {researchId:id,sourceSha256:"REVIEW_FAKE_HASH",passage:{book:"gen",chapter,v1,v2,...(opts.chapterEnd?{chapterEnd:opts.chapterEnd}:{})},projectionStatus:"INTERNAL_READER_PROJECTION",externalRelease:"NOT_AUTHORIZED",professionalStatus:"STAGE_APPROVED",title:id,overview:["overview "+id],sections:[{v1,v2,title:"section "+id,paragraphs:["body "+id]}],theologicalSynthesis:["SYNTH_"+id],canonicalLinks:[{ref:"TEST",note:"CANON_"+id}],lexicalCards:[{verse:v1,form:"WORD_"+id}],alternativeReadings:[{title:"ALT_"+id,paragraphs:["REASON_"+id]}],relatedResearch:[{kind:"passage",label:"REL_"+id}]};
}
function texts(e){return [e.textContent,...e.children.map(texts)].join(" ")}
const tests=[];
function test(name,ok,detail,severity="P1"){tests.push({name,result:ok?"PASS":"FAIL",severity,detail})}
async function main(){
 let A=mock("A",15,1,6),B=mock("B",15,7,21);
 let p=load([B,A]);
 test("pericope two distinct records retained",p.records().length===2,{count:p.records().length});
 test("verse first pericope selection",p.recordFor("gen-15:3")?.researchId==="A",p.recordFor("gen-15:3")?.researchId);
 test("verse second pericope selection",p.recordFor("gen-15:10")?.researchId==="B",p.recordFor("gen-15:10")?.researchId);
 let box=new E("div");await p.render(box,"gen-15");let allText=texts(box);
 test("chapter view contains both commentary texts",allText.includes("body A")&&allText.includes("body B"),{hasA:allText.includes("body A"),hasB:allText.includes("body B")});
 test("chapter view includes BOTH pericope deep synthesis",allText.includes("SYNTH_A")&&allText.includes("SYNTH_B"),{hasA:allText.includes("SYNTH_A"),hasB:allText.includes("SYNTH_B")});
 test("chapter view pericope order biblical",allText.indexOf("overview A")<allText.indexOf("overview B"),{firstA:allText.indexOf("overview A"),firstB:allText.indexOf("overview B")});
 test("chapter view both deep canonical and lexical",allText.includes("CANON_A")&&allText.includes("CANON_B")&&allText.includes("WORD_A")&&allText.includes("WORD_B"),{canonicalA:allText.includes("CANON_A"),canonicalB:allText.includes("CANON_B"),wordA:allText.includes("WORD_A"),wordB:allText.includes("WORD_B")});
 let cross=mock("CROSS",18,16,29,{chapterEnd:19});
 p=load([cross]);
 test("cross chapter verse in previous chapter",p.verse("gen-18:17")?.researchId==="CROSS",p.verse("gen-18:17"));
 test("cross chapter verse in later chapter",p.verse("gen-19:29")?.researchId==="CROSS",p.verse("gen-19:29"));
 test("verse() rejects outside selected range",p.verse("gen-19:30")===null,p.verse("gen-19:30"));
 test("recordFor() rejects outside selected range",p.recordFor("gen-19:30")===null,p.recordFor("gen-19:30")?.researchId??null);
 let outside=new E("div");await p.render(outside,"gen-19:30");
 test("render() rejects outside range",outside.hidden&&outside.attrs["data-state"]==="UNAVAILABLE",{hidden:outside.hidden,state:outside.attrs["data-state"]});
 let one=mock("OLDER_CHAPTER",22,1,19);p=load([one]);
 test("existing one-record chapter render",((await p.render(new E("div"),"gen-22"))===true),p.recordFor("gen-22")?.researchId);
 // Overlapping records: recordFor will choose first without semantic conflict detection.
 let oneOfTwo=mock("FIRST",15,1,10),twoOfTwo=mock("SECOND",15,7,21);
 p=load([oneOfTwo,twoOfTwo]);const realP=load([],null,true);
 test("overlap ambiguous no authoritative conflict check",p.recordFor("gen-15:8")===null,{chosen:p.recordFor("gen-15:8")?.researchId,alternatives:p.records().filter(r=>r.passage.v1<=8&&8<=r.passage.v2).map(r=>r.researchId)},"P1");
 // Metadata declared as stage approved is trusted without independent SHA or approval receipt.
 const hypothetical=mock("NONEXISTENT_SOURCE_WITH_STAGE_FLAG",21,1,4);
 test("stage flag requires independent authority proof",realP.valid(hypothetical)===false&&realP.approvalClass(hypothetical)==="NONE",{accepted:realP.valid(hypothetical),class:realP.approvalClass(hypothetical)},"P1");
 // Real link and study record diagnostics
 delete global.BVC_VERSE_RESEARCH_CONTENT;
 require(file("data/research.gen22.reader.js"));
 require(file("data/timeline.era.research.js"));
 const link=global.JBC_TIMELINE_ERA_RESEARCH.links[0], actual=global.BVC_VERSE_RESEARCH_CONTENT;
 test("timeline links unique and no new identity",global.JBC_TIMELINE_ERA_RESEARCH.links.length===1&&link.step==="era.patriarchal.abraham.10",link,"INFO");
 test("link matches exact reader ID and range",link.researchId===actual.researchId&&link.range==="gen-"+actual.passage.chapter+":"+actual.passage.v1+"-"+actual.passage.v2,{link:link.researchId,reader:actual.researchId},"P1");
 const sourcePath=actual.sourcePath, sourceExists=sourcePath&&fs.existsSync(sourcePath);
 const ssha=sourceExists?sha(sourcePath):null;
 test("reader source file integrity by SHA",sourceExists&&ssha.toLowerCase()===actual.sourceSha256.toLowerCase(),{exists:!!sourceExists,actual:ssha,declared:actual.sourceSha256},"P1");
 let ps=load([],actual,true);
 test("current link record is STAGE_PINNED (Pilot SHA pinned; not downstream-approved)",ps.approvalClass(actual)==="STAGE_PINNED",{class:ps.approvalClass(actual),professionalStatus:actual.professionalStatus},"INFO");
 const currentReport=path.resolve("G:/내 드라이브/Jude_Lee_OS/01_PROJECTS/01_목회연구_WORBS_BICS/PROJECT01_GENESIS_22_WORBS_v1.1_APPROVED_ACTIVATION_AND_REGISTRY_BINDING_20261006.md");
 const report=fs.readFileSync(currentReport,"utf8");
 const approvedMatch=/research_id:\s*([A-Z0-9-]+)\s*\n/.exec(report);
 const currentMatch=/source_candidate_sha256:\s*([A-Fa-f0-9]{64})/.exec(report);
 test("linked Reader equals Project01 current approved representative identity",!!approvedMatch&&actual.researchId===approvedMatch[1]&&ssha&&ssha.toLowerCase()===currentMatch[1].toLowerCase(),{reader:actual.researchId,representative:approvedMatch&&approvedMatch[1],readerSha:ssha,representativeSha:currentMatch&&currentMatch[1]},"P1");
 // Print SHA locks and evidence, no filesystem writes
 const summary={type:"READ_ONLY_20261010",input_sha256:{engine:sha(projectionFile),timelineLink:sha(file("data/timeline.era.research.js")),reader22:sha(file("data/research.gen22.reader.js")),researchApprovalRecord:sha(currentReport)},counts:{pass:tests.filter(x=>x.result==="PASS").length,fail:tests.filter(x=>x.result==="FAIL").length},tests};
 console.log(JSON.stringify(summary,null,2));
}
main().catch(e=>{console.error("QA_HARNESS_ERROR",e.stack);process.exitCode=2});
