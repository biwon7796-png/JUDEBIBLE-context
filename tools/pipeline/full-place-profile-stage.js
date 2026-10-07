"use strict";
const fs=require("fs"),crypto=require("crypto"),path=require("path"),yaml=require("./yaml-lite");
const ROOT=path.resolve(__dirname,"..",".."), CONFIG=path.join(__dirname,"ingest.config.json");
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const rename=(a,b)=>{for(let n=0;;n++){try{return fs.renameSync(a,b);}catch(e){if(!/^(EPERM|EBUSY|EACCES)$/.test(e.code))throw e;if(n>=3){fs.copyFileSync(a,b);fs.unlinkSync(a);return;}sleep(60*(n+1));}}};
const writeAtomic=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});const t=f+".tmp";fs.writeFileSync(t,s);rename(t,f);};

function parseOne(id,rc,vault){
  const dc=rc.detail_contract;if(!dc)throw new Error("DETAIL_CONTRACT_MISSING "+id);
  const src=path.join(vault,dc.source_rel),bytes=fs.readFileSync(src),text=bytes.toString("utf8"),actual=sha(bytes);
  if(actual!==dc.expected_sha256)throw new Error("DETAIL_SOURCE_SHA_MISMATCH "+id+" "+actual);
  const lines=text.replace(/\r/g,"").split("\n");
  function heading(prefix){const i=lines.findIndex(x=>x.startsWith(prefix));if(i<0)return null;let j=i+1;while(j<lines.length&&!/^#{1,2} /.test(lines[j]))j++;return{title:lines[i].replace(/^#+\s*/,"").replace(/^\d+(?:\.\d+)?\.\s*/,"").trim(),lines:lines.slice(i+1,j)};}
  function paras(a){const out=[];let buf=[],fence=false;const flush=()=>{const s=buf.join(" ").replace(/\s+/g," ").trim();if(s)out.push(s);buf=[];};for(const raw of a){const t=raw.trim();if(/^~~~/.test(t)){fence=!fence;flush();continue;}if(fence)continue;if(!t){flush();continue;}if(/^#{1,6}\s/.test(t)||/^본문 연결:?$/.test(t)||/^연구 경계:?$/.test(t)||/→\s*(FACT|HOLD)/.test(t)){flush();continue;}if(/^[-*]\s+/.test(t)){flush();out.push(t.replace(/^[-*]\s+/,""));continue;}if(/^\d+\.\s+/.test(t)){flush();out.push(t.replace(/^\d+\.\s+/,""));continue;}if(/^\|/.test(t))continue;buf.push(t);}flush();return out;}
  function subsections(ch){const out=[];for(let i=0;i<lines.length;i++){const m=/^## (\d+\.\d+)\s+(.+)$/.exec(lines[i]);if(!m||!m[1].startsWith(ch+"."))continue;let j=i+1;while(j<lines.length&&!/^##? /.test(lines[j]))j++;out.push({title:m[2].replace(/\s+—.*$/,"").trim(),subtitle:m[2].trim(),paragraphs:paras(lines.slice(i+1,j))});}return out;}
  function yblocks(){const out=[],re=/~~~yaml\n([\s\S]*?)\n~~~/g;let m;while((m=re.exec(text)))try{out.push(yaml.parse(m[1]));}catch(e){}return out;}
  function bullets(n){const h=heading("# "+n+".");return h?paras(h.lines).filter(x=>x&&!/^[-–—]{3,}$/.test(String(x).trim())):[];}
  const ys=yblocks(),place=(ys.find(x=>x&&x.Place)||{}).Place||{},hdr=(ys.find(x=>x&&x.reader_header)||{}).reader_header||{},req=(ys.find(x=>x&&x.PLACE_DETAIL_PROFILE)||{}).PLACE_DETAIL_PROFILE||{};
  if(place.stable_id!==rc.expected_identity)throw new Error("DETAIL_IDENTITY_MISMATCH "+id+" "+place.stable_id);
  const refs=[],rr=/\]\(#([a-z0-9]+-\d+):(\d+)(?:-(\d+))?\)/g;let m;while((m=rr.exec(text)))refs.push({passage:m[1],start:+m[2],end:+(m[3]||m[2])});
  const unique=[];refs.forEach(r=>{const k=r.passage+":"+r.start+"-"+r.end;if(!unique.some(x=>x.key===k))unique.push(Object.assign({key:k},r));});
  const story=subsections("3"),significance=subsections("4"),ex=dc.expected||{};
  const checks={inline_refs:refs.length,unique_refs:unique.length,story:story.length,significance:significance.length};
  for(const k of Object.keys(checks))if(ex[k]!=null&&checks[k]!==ex[k])throw new Error("DETAIL_CONTRACT_COUNT "+id+" "+k+"="+checks[k]+" expected="+ex[k]);
  const direct=(ys.find(x=>x&&x.direct_mentions_in_local_KRV)||{}).direct_mentions_in_local_KRV||{};
  if(ex.direct_mentions!=null&&+direct.count!==ex.direct_mentions)throw new Error("DETAIL_DIRECT_MENTION_COUNT "+id+" "+direct.count);
  const fb=dc.reader_defaults||{},anc=place.ancient_name||{},shortType=req.header&&req.header.short_type||"성읍·도시",detailed=req.quick_facts&&req.quick_facts.detailed_type||fb.detailed_type||hdr.category||"성경 지명";
  const loc=typeof hdr.location_status==="string"?hdr.location_status:hdr.location_status&&[hdr.location_status.label,hdr.location_status.symbol,hdr.location_status.exact_point].filter(Boolean).join(" · ");
  const profile={schema:"JBC_FULL_PLACE_DETAIL_PROJECTION_v0.2",stable_id:place.stable_id,source:Object.assign({research_id:id,path:src.replace(/\\/g,"/"),sha256:actual,professional_status:"CURRENT_REPRESENTATIVE"},dc.evidence||{}),
    correction_delta:dc.correction_delta||{direct_mentions:+direct.count||0},short_type:shortType,
    identity:{ko:place.canonical_name_ko||hdr.canonical_name_ko,en:place.canonical_name_en||hdr.canonical_name_en,hebrew:anc.hebrew||anc.hebrew_consonantal||hdr.hebrew_name,pronunciation:anc.pronunciation_ko||hdr.pronunciation_ko},
    detailed_type:detailed,headline:fb.headline||"",quick_facts:[["유형",detailed],["지역",hdr.region||fb.region],["이름의 뜻",hdr.name_meaning||fb.name_meaning],["위치",loc||fb.location],["주요 시대",(hdr.major_periods||[]).join(" · ")],["주요 인물",(hdr.major_people||[]).join(" · ")]],
    story,significance,geography:subsections("5"),archaeology:subsections("6"),location:subsections("7"),related_people:bullets("9"),related_events:bullets("10"),inline_refs:refs,related_passages:unique,caution:dc.caution||null,research_meta:{evidence_layers:["A01 지리","A02 역사·연대","A03 고고학"],direct_mentions:+direct.count||0,retained_verify_hold:true,external_release:false}};
  if(!profile.identity.ko||!profile.identity.en||!profile.identity.hebrew)throw new Error("DETAIL_IDENTITY_FIELDS_MISSING "+id);
  const out=path.resolve(ROOT,dc.output||rc.detail_projection);
  const body="// GENERATED by tools/pipeline/full-place-profile-stage.js from exact approved Project01 Full Place Profile. Do not edit by hand.\nwindow.JBC_PLACE_FULL_PROFILES = window.JBC_PLACE_FULL_PROFILES || {};\nwindow.JBC_PLACE_FULL_PROFILES["+JSON.stringify(profile.stable_id)+"] = "+JSON.stringify(profile,null,2)+";\n";
  return{id,stable_id:profile.stable_id,src,out,sha256:actual,body,profile,metrics:Object.assign(checks,{direct_mentions:+direct.count||0})};
}
function prepare(opts){
  opts=opts||{};const vault=opts.vault||process.env.JBC_VAULT;if(!vault)throw new Error("SOURCE_AUTHORITY: JBC_VAULT is required for Full Place Profile projection");
  const cfg=opts.config||JSON.parse(fs.readFileSync(CONFIG,"utf8")),items=[];
  for(const [id,rc] of Object.entries(cfg.records||{}))if(rc.projection_mode==="DETAIL_ONLY")items.push(parseOne(id,rc,vault));
  if(!items.length)throw new Error("NO_DETAIL_ONLY_PROFILES");
  return items;
}
function writePrepared(items){for(const x of items)writeAtomic(x.out,x.body);const combined=path.join(ROOT,"data","place.profiles.js"),map={};for(const x of items)map[x.stable_id]=x.profile;writeAtomic(combined,"// GENERATED by tools/pipeline/full-place-profile-stage.js from all approved Full Place Profiles. Do not edit by hand.\nwindow.JBC_PLACE_FULL_PROFILES = "+JSON.stringify(map,null,2)+";\n");return items.map(x=>({research_id:x.id,stable_id:x.stable_id,out:x.out,source_sha256:x.sha256,metrics:x.metrics})).concat([{combined:true,out:combined,profiles:items.length}]);}
if(require.main===module){try{const items=prepare();const result=process.argv.includes("--check")?items.map(x=>({research_id:x.id,stable_id:x.stable_id,source_sha256:x.sha256,metrics:x.metrics})) : writePrepared(items);console.log(JSON.stringify({schema:"JBC_FULL_PLACE_PROFILE_STAGE_v0.2",mode:process.argv.includes("--check")?"CHECK_ONLY":"WRITE",profiles:result},null,2));}catch(e){console.error(e.message);process.exit(2);}}
module.exports={prepare,writePrepared};
