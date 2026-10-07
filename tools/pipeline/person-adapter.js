"use strict";
// Shared Person research adapter for the canonical JudeBible pipeline.
// Authority-safe: consumes only Project01 lifecycle records that explicitly say PROFESSIONAL_RESEARCH_PASS
// + APPROVED_DOWNSTREAM_PROJECTION and whose source bytes match exactly. It never mints/promotes a Registry identity.
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const {parse:yamlParse}=require("./yaml-lite");
const sidx=require("./scripture-index");
const ROOT=path.resolve(__dirname,"..",".."), OUT=path.join(ROOT,"data","projection.person.js"), CURATION_FILE=path.join(ROOT,"data","person.reader.curation.json");
const READER_CURATION=fs.existsSync(CURATION_FILE)?JSON.parse(fs.readFileSync(CURATION_FILE,"utf8")):{persons:{}};
const FACT_LABEL={parents:"부모",spouse:"배우자",children:"자녀",half_brother:"이복형제",major_activity_regions:"주요 활동 지역",major_events:"주요 사건",theological_role:"신학적 역할"};
const KO={창:"gen",출:"exo",레:"lev",민:"num",신:"deu",수:"jos",삿:"jdg",룻:"rut",삼상:"1sa",삼하:"2sa",왕상:"1ki",왕하:"2ki",대상:"1ch",대하:"2ch",스:"ezr",느:"neh",에:"est",욥:"job",시:"psa",잠:"pro",전:"ecc",아:"sng",사:"isa",렘:"jer",애:"lam",겔:"ezk",단:"dan",호:"hos",욜:"jol",암:"amo",옵:"oba",욘:"jon",미:"mic",나:"nah",합:"hab",습:"zep",학:"hag",슥:"zec",말:"mal",마:"mat",막:"mrk",눅:"luk",요:"jhn",행:"act",롬:"rom",고전:"1co",고후:"2co",갈:"gal",엡:"eph",빌:"php",골:"col",살전:"1th",살후:"2th",딤전:"1ti",딤후:"2ti",딛:"tit",몬:"phm",히:"heb",약:"jas",벧전:"1pe",벧후:"2pe",요일:"1jn",요이:"2jn",요삼:"3jn",유:"jud",계:"rev"};
const EN={Genesis:"gen",Exodus:"exo",Leviticus:"lev",Numbers:"num",Deuteronomy:"deu",Joshua:"jos",Judges:"jdg",Ruth:"rut",Psalms:"psa",Isaiah:"isa",Jeremiah:"jer",Ezekiel:"ezk",Daniel:"dan",Hosea:"hos",Amos:"amo",Matthew:"mat",Mark:"mrk",Luke:"luk",John:"jhn",Acts:"act",Romans:"rom",Galatians:"gal",Hebrews:"heb",James:"jas"};

const sha256=f=>crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const normText=s=>String(s||"").replace(/\r\n/g,"\n");
function firstYaml(txt){const m=/```yaml\n([\s\S]*?)```|~~~yaml\n([\s\S]*?)~~~/i.exec(txt);return m?yamlParse(m[1]||m[2]):null;}
function section(txt,start,end){const a=txt.search(start);if(a<0)return "";const rest=txt.slice(a+1),b=rest.search(end);return rest.slice(0,b<0?undefined:b);}
function listFiles(dir,pred,out){out=out||[];if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())listFiles(f,pred,out);else if(pred(f))out.push(f);}return out;}
function deriveProject01Root(vault,explicit){if(explicit)return explicit;const driveRoot=path.resolve(vault,"..","..","..");return path.join(driveRoot,"Jude_Lee_OS","01_PROJECTS","01_목회연구_WORBS_BICS");}
function lifecycleRecords(project01Root){
  const files=listFiles(project01Root,f=>/\.md$/i.test(f)&&/REVALIDATION|LIFECYCLE/i.test(path.basename(f)));
  const out=[];
  for(const file of files){let txt;try{txt=normText(fs.readFileSync(file,"utf8"));}catch(e){continue;}const y=firstYaml(txt);if(!y||!y.research_id||!/PERSON_PROFILE_WORBS/.test(String(y.research_id)))continue;
    if(y.professional_result!=="PROFESSIONAL_RESEARCH_PASS"||y.downstream_projection!=="APPROVED_DOWNSTREAM_PROJECTION"||y.external_release!=="NOT_AUTHORIZED"||y.source_asset_mutated!==false)continue;
    if(y.registry_physical_write!=="HOLD"||y.stable_id_issued!==false)continue;
    out.push({file,data:y});
  }
  return out;
}
function findAsset(vault,researchId){
  const root=path.join(vault,"02_연구물"),hits=listFiles(root,f=>path.basename(f,".md")===researchId&&/\.md$/i.test(f));
  if(hits.length!==1)return {ok:false,reason:hits.length?"duplicate source assets for "+researchId:"source asset missing for "+researchId,hits};
  return {ok:true,file:hits[0]};
}
function parsePersonIdentity(txt){
  const sec=section(txt,/\n# 1\. PERSON IDENTITY/,/\n---|\n# 2\./), m=/~~~yaml\n([\s\S]*?)~~~|```yaml\n([\s\S]*?)```/i.exec(sec);
  if(!m)return null;const raw=m[1]||m[2], y=yamlParse(raw), p=y&&y.Person;if(!p)return null;
  const get=(re)=>{const x=re.exec(raw);return x&&x[1]&&x[1].trim()||null;};
  const aliasesRaw=get(/^\s*aliases:\s*\[([^\]]*)\]/m);
  return {
    canonical_name_ko:p.canonical_name_ko||get(/^\s*canonical_name_ko:\s*(.+)$/m),
    canonical_name_en:p.canonical_name_en||get(/^\s*canonical_name_en:\s*(.+)$/m),
    hebrew:{pointed:get(/^\s*pointed:\s*(.+)$/m),transliteration:get(/^\s*transliteration:\s*(.+)$/m),pronunciation_ko:get(/^\s*pronunciation_ko:\s*(.+)$/m)},
    greek:{lxx_nt:get(/^\s*lxx_nt:\s*(.+)$/m)},
    aliases:aliasesRaw?aliasesRaw.split(",").map(x=>x.trim()).filter(Boolean):[],
    patriarchal_summary:(p.patriarchal_identity&&p.patriarchal_identity.summary)||get(/^\s*summary:\s*(.+)$/m)
  };
}
function readerLayer(txt){
  const summary=section(txt,/\n## 2\.1 /,/\n## 2\.2 /).split("\n").slice(2).join("\n").trim();
  const qf=section(txt,/\n## 2\.2 /,/\n---|\n# 3\./), ym=/~~~yaml\n([\s\S]*?)~~~|\`\`\`yaml\n([\s\S]*?)\`\`\`/i.exec(qf), facts=[];
  const raw=ym&&(ym[1]||ym[2])||"", lines=raw.split("\n"); let cur=null;
  lines.forEach(function(l){
    let m;
    if((m=/^  (parents|spouse|children|half_brother): \{(.*)\}$/.exec(l))){
      const body=m[2]; let value=null;
      if(m[1]==="parents"){const f=/father:\s*([^,}]+)/.exec(body), mo=/mother:\s*([^,}]+)/.exec(body);value=[f&&f[1].trim(),mo&&mo[1].trim()].filter(Boolean).join(", ");}
      else if(m[1]==="children"){const n=/names:\s*\[([^\]]+)\]/.exec(body);value=n&&n[1].trim();}
      else {const n=/name:\s*([^,}]+)/.exec(body);value=n&&n[1].trim();}
      if(value)facts.push({k:m[1],v:value}); cur=null;
    } else if((m=/^  (major_activity_regions|major_events|theological_role):\s*$/.exec(l))){cur={k:m[1],v:[]};facts.push(cur);}
    else if(cur&&(m=/^    -\s*(.*)$/.exec(l)))cur.v.push(m[1].trim());
    else if(cur&&!/^    /.test(l))cur=null;
  });
  const cleanFacts=facts.filter(f=>Array.isArray(f.v)?f.v.length:f.v!=null&&f.v!=="");
  const after=ym?qf.slice(qf.indexOf(ym[0])+ym[0].length).trim():"";
  const parseRange=function(s){s=String(s||"").replace(/[–—]/g,"-").trim();const m=/^([가-힣]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(s);return m&&KO[m[1]]?{book:KO[m[1]],chapter:+m[2],v1:+m[3],v2:+(m[4]||m[3]),label:s}:null;};
  const units=[];
  section(txt,/\n## 3\.3 /,/\n## 3\.4 /).split("\n").forEach(function(l){const m=/^\d+\.\s*\*\*([가-힣]+\s+[\d:–—-]+)\*\*\s*—\s*(.+)$/.exec(l.trim());if(!m)return;const r=parseRange(m[1]);if(r)units.push({range:r,description:m[2].trim()});});
  const narrative=[];
  section(txt,/\n# 7\. RELATED EVENTS/,/\n---|\n# 8\./).split("\n").forEach(function(l){
    if(!/^\|/.test(l)||/^\|\s*(사건|---)/.test(l))return;
    const c=l.split("|").slice(1,-1).map(x=>x.trim()); if(c.length<3)return; const r=parseRange(c[1]); if(!r)return;
    const u=units.find(x=>x.range.book===r.book&&x.range.chapter===r.chapter&&x.range.v1<=r.v2&&x.range.v2>=r.v1);
    const ps=[c[2],u&&u.description].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
    narrative.push({title:c[0],passages:[[r.book,r.chapter,r.v1,r.v2]],paragraphs:ps});
  });
  const nameSec=section(txt,/\n## 1\.1 /,/\n---|\n# 2\./), nm=/\*\*LIKELY:\*\*[^“"]*[“"]([^”"]+)[”"]/.exec(nameSec);
  const extra=[]; if(nm)extra.push({key:"name_meaning",label:"이름의 뜻",value:nm[1]});
  const role=cleanFacts.find(f=>f.k==="theological_role"); if(role)extra.push({key:"core_role",label:"핵심 역할",value:Array.isArray(role.v)?role.v.slice(0,3):role.v});
  const rev=[],revSeen={}; narrative.forEach(n=>n.passages.forEach(p=>{const ko=Object.keys(KO).find(k=>KO[k]===p[0]);const lab=ko+" "+p[1];if(ko&&!revSeen[lab]){revSeen[lab]=1;rev.push(lab);}})); if(rev.length)extra.push({key:"representative_passages",label:"대표 본문",value:rev});
  const places=[];
  section(txt,/\n# 6\. RELATED PLACES/,/\n---|\n# 7\./).split("\n").forEach(function(l){if(!/^\|/.test(l)||/^\|\s*(장소|---)/.test(l))return;const c=l.split("|").slice(1,-1).map(x=>x.trim()),m=/\b(JBC-CR-PLACE-[A-Z0-9-]+)\b/.exec(c[3]||"");if(c[0]&&m)places.push({label:c[0],stable_id:m[1]});});
  const tsec=section(txt,/\n# 10\. CANONICAL \/ THEOLOGICAL SYNTHESIS/,/\n---|\n# 11\./), cm=/^\s*claim:\s*(.+)$/m.exec(tsec), theology=[]; if(cm)theology.push(cm[1].trim());
  const afterYaml=tsec.replace(/~~~yaml[\s\S]*?~~~/,"").trim().split(/\n\s*\n/).filter(x=>x&& !/^#/.test(x.trim())); if(afterYaml[0])theology.push(afterYaml[0].replace(/\n/g," ").trim());
  const cautions=[]; section(txt,/\n# 11\. INTERPRETIVE BOUNDARIES/,/\n---|\n# 12\./).split("\n").forEach(function(l){const m=/^\d+\.\s*(.+)$/.exec(l.trim());if(m)cautions.push(m[1].trim());});
  const nameResearch=section(txt,/\n## 1\.1 이름과 원어/,/\n---|\n# 2\./).replace(/^.*?\n/,"").trim();
  return {summary,facts:cleanFacts,note:after||null,quick_facts_extra:extra,narrative_sections:narrative,theological_summary:theology,related_places:places,research_basis:{name_and_language:nameResearch,interpretive_boundaries:cautions}};
}
function verseList(book,spec,out){
  spec=String(spec).replace(/\([^)]*\)/g,"").replace(/[–—]/g,"-");let chap=null;
  spec.split(";").forEach(part=>{part=part.trim();if(!part)return;const m=/^(\d+):(.*)$/.exec(part);let list;if(m){chap=+m[1];list=m[2];}else list=part;if(chap==null)return;
    list.split(",").forEach(v=>{v=v.trim();const r=/^(\d+)(?:-(\d+))?$/.exec(v);if(!r)return;for(let n=+r[1];n<=+(r[2]||r[1]);n++)out.add(book+"-"+chap+":"+n);});});
}
function koBullets(sec,out){sec.split("\n").forEach(l=>{const m=/^-\s*([가-힣]+)\s+(\d.*)$/.exec(l.trim());if(m&&KO[m[1]])verseList(KO[m[1]],m[2],out);});}
function personVerseClasses(txt){
  const direct=new Set(),cont=new Set(),related=new Set();
  koBullets(section(txt,/\n## 3\.2 /,/\n## 3\.3 /),direct);koBullets(section(txt,/\n## 3\.4 /,/\n## 3\.5 /),direct);koBullets(section(txt,/\n## 3\.5 /,/\n## 3\.6 /),direct);
  section(txt,/\n## 3\.3 /,/\n## 3\.4 /).split("\n").forEach(l=>{const m=/^\d+\.\s*\*\*([가-힣]+)\s+([\d:–—\-,; ]+)\*\*/.exec(l.trim());if(m&&KO[m[1]])verseList(KO[m[1]],m[2],cont);});
  const s4=section(txt,/\n# 4\./,/\n# 5\./);for(const m of s4.matchAll(/range:\s*"([A-Za-z0-9 ]+)\s+([^"]+)"/g)){const b=EN[m[1]]||KO[m[1]];if(b)verseList(b,m[2],related);}
  const verses={};direct.forEach(r=>verses[r]={c:"DM_NAME"});cont.forEach(r=>{if(!verses[r])verses[r]={c:"DM_PRONOUN_CONTINUATION"};});related.forEach(r=>{if(!verses[r])verses[r]={c:"STRONGLY_RELATED"};});
  return verses;
}
function groupPassages(verses){
  const rows=Object.keys(verses||{}).map(k=>{const m=/^([a-z0-9]+)-(\d+):(\d+)$/.exec(k);return m?{book:m[1],chapter:+m[2],verse:+m[3],cls:verses[k].c}:null;}).filter(Boolean).sort((a,b)=>a.book===b.book?(a.chapter-b.chapter)||(a.verse-b.verse):a.book.localeCompare(b.book));
  const out=[];rows.forEach(r=>{const group=r.cls==="DM_NAME"?"direct":"related",last=out[out.length-1];if(last&&last.book===r.book&&last.chapter===r.chapter&&last.group===group&&last.classification===r.cls&&last.v2+1===r.verse)last.v2=r.verse;else out.push({group,classification:r.cls,book:r.book,chapter:r.chapter,v1:r.verse,v2:r.verse,source:"PERSON_PROFILE_WORBS"});});return out.sort((a,b)=>(a.group==="direct"?0:1)-(b.group==="direct"?0:1));
}
function buildRecord(asset,lifecycle){
  const txt=normText(fs.readFileSync(asset.file,"utf8")), status=firstYaml(txt)||{}, identity=parsePersonIdentity(txt), reader=readerLayer(txt), verses=personVerseClasses(txt), rid=lifecycle.data.research_id, srcSha=sha256(asset.file);
  if(status.research_id!==rid||status.object_type!=="person"||status.owner!=="01_목회연구_WORBS_BICS"||status.selected_module!=="WORBS")throw new Error("PERSON_CONTRACT: source status mismatch for "+rid);
  if(srcSha!==String(lifecycle.data.source_sha256||"").toLowerCase())throw new Error("PERSON_CONTRACT: source sha256 mismatch for "+rid);
  if(!identity||!identity.canonical_name_ko||!reader.summary)throw new Error("PERSON_CONTRACT: identity/Reader Layer missing for "+rid);
  const fact=Object.fromEntries(reader.facts.map(f=>[f.k,f.v])),qf=reader.facts.map(f=>({key:f.k,label:FACT_LABEL[f.k]||f.k,value:f.v})),curated=(READER_CURATION.persons||{})[rid]||{};
  return {record:{
    stable_id:rid,type:"Person",entity_type:"Person",display_label:identity.canonical_name_ko,label_en:identity.canonical_name_en||null,aliases:identity.aliases||[],status:lifecycle.data.professional_result,certainty:status.quality_status||"PASS_WITH_VERIFY",
    role:Array.isArray(fact.theological_role)?fact.theological_role[0]||"":fact.theological_role||"",
    primaryPassage:curated.primaryPassage||null,
    source_refs:[{id:rid,version:lifecycle.data.version||status.version||null,path:asset.file.replace(/\\/g,"/"),sha256:srcSha}],source_locator:"Project01 approved Person research asset",
    authority:{professional_status:lifecycle.data.professional_result,representative:"CURRENT_PROJECT01_PROFESSIONAL_REPRESENTATIVE",downstream:lifecycle.data.downstream_projection,lifecycle_authority:lifecycle.data.lifecycle_authority||null,revalidation_record:path.basename(lifecycle.file),registry_effect:"NONE",identity_issuance:"NONE",external_release:lifecycle.data.external_release},
    identity_binding:{projection_key:rid,scope:"RESEARCH_IDENTITY_ONLY",global_identity_issued:false,registry_effect:"NONE",automatic_merge:false},
    reader:{published:false,internal_product_projection:true,classification:curated.classification||"인물",headline:reader.summary,concise_summary:reader.summary,quick_facts:qf.concat(reader.quick_facts_extra||[]),note:reader.note,identity:{name_ko:identity.canonical_name_ko,name_en:identity.canonical_name_en,original_name:identity.hebrew&&identity.hebrew.pointed||null,transliteration:identity.hebrew&&identity.hebrew.transliteration||null,pronunciation_ko:identity.hebrew&&identity.hebrew.pronunciation_ko||null,greek_name:identity.greek&&identity.greek.lxx_nt||null},intro:{concise_intro:curated.intro||identity.patriarchal_summary||reader.summary},story_sections:curated.sections||[],narrative_sections:reader.narrative_sections||[],theological_summary:curated.closing||reader.theological_summary||[],related_places:reader.related_places||[],research_basis:reader.research_basis||{}},
    activation:{publishable:false,internal_product_projection:true},projection_visibility:{internal_product:true,search:true,scripture_direct_mentions:true,external_release:false},passage_links:groupPassages(verses),projection_role:"INTERNAL_CANONICAL_PERSON_FROM_APPROVED_RESEARCH_REPRESENTATIVE",
    research_projection:{asset_type:"PERSON_PROFILE_WORBS",primary:"PERSON_CARD",entity_id:identity.canonical_name_en?String(identity.canonical_name_en).toUpperCase().replace(/[^A-Z0-9]+/g,"_"):rid,version:lifecycle.data.version||status.version||null,revalidation:{record:path.basename(lifecycle.file),sha256:sha256(lifecycle.file)}},
    VERIFY_HOLD:{verify:true,hold:false,reason:"Registry/global Person identity is not issued; projection-local research identity only."}
  },verses};
}
function makeProjection(records){const data={schema:"JUDEBIBLE_PERSON_PROJECTION_v0.3",generated_by:"tools/pipeline/person-adapter.js",authority_effect:"NONE",registry_effect:"NONE",identity_issuance:"NONE",external_release:"NONE",meta:{records:[]},persons:{}};(records||[]).forEach(record=>{const sid=record&&record.stable_id;if(!sid)throw new Error("PERSON_CONTRACT: projection record without key");if(data.persons[sid])throw new Error("PERSON_CONTRACT: duplicate projection key "+sid);data.persons[sid]=record;data.meta.records.push({stable_id:sid,research_id:sid,source:{sha256:record.source_refs&&record.source_refs[0]&&record.source_refs[0].sha256||null},identity_scope:"RESEARCH_IDENTITY_ONLY"});});return data;}
function writeProjection(records,outFile){const data=makeProjection(records),file=outFile||OUT;fs.writeFileSync(file,"// GENERATED by tools/pipeline/person-adapter.js — internal canonical Person projection; no Registry/global identity issuance.\nwindow.BVC_PERSON_PROJECTION="+JSON.stringify(data,null,2)+";\n");return {data,output:file};}
function runPersonAdapter(opts){
  opts=opts||{};const vault=opts.vault||process.env.JBC_VAULT;if(!vault)return {ok:false,status:"HOLD",reason:"JBC_VAULT not bound; Person adapter cannot verify Project01 source bytes",records:{},parts:[],assets:[]};
  const project01Root=deriveProject01Root(vault,opts.project01Root||process.env.JBC_PROJECT01_ROOT);if(!fs.existsSync(project01Root))return {ok:false,status:"HOLD",reason:"Project01 authority root unavailable: "+project01Root,records:{},parts:[],assets:[]};
  const life=lifecycleRecords(project01Root),built=[],assets=[],parts=[];for(const lc of life){const a=findAsset(vault,lc.data.research_id);if(!a.ok){assets.push({document_id:lc.data.research_id,entity_type:"person",status:"HOLD",reason:a.reason});continue;}let b;try{b=buildRecord(a,lc);}catch(e){assets.push({document_id:lc.data.research_id,entity_type:"person",path:path.relative(vault,a.file).replace(/\\/g,"/"),status:"HOLD",reason:e.message});continue;}built.push(b.record);assets.push({document_id:lc.data.research_id,entity_type:"person",path:path.relative(vault,a.file).replace(/\\/g,"/"),status:"ingested",projection_key:b.record.stable_id});if(opts.krv){const idx=sidx.build(b.record,opts.krv);parts.push({record:b.record.stable_id,research_id:b.record.source_refs[0].id,source_sha256:b.record.source_refs[0].sha256,entries:idx.entries,stats:idx.stats});}}
  const holds=assets.filter(a=>a.status==="HOLD");if(holds.length)return {ok:false,status:"HOLD",reason:"one or more approved Person assets failed closed",records:Object.fromEntries(built.map(r=>[r.stable_id,r])),parts,assets,project01_root:project01Root};
  if(opts.write!==false)writeProjection(built,opts.outFile);return {ok:true,status:"SHARED_CANONICAL_PERSON_PIPELINE_PASS",adapter:"SHARED_PERSON_RESEARCH_ADAPTER_v1",count:built.length,records:Object.fromEntries(built.map(r=>[r.stable_id,r])),parts,assets,canonical_projection:path.relative(ROOT,opts.outFile||OUT).replace(/\\/g,"/"),authority_effect:"NONE",registry_effect:"NONE",identity_issuance:"NONE",public_release:"NONE",project01_root:project01Root};
}
module.exports={runPersonAdapter,buildRecord,makeProjection,writeProjection,groupPassages,lifecycleRecords,deriveProject01Root,personVerseClasses};