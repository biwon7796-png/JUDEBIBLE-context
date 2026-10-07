"use strict";
const cp=require("child_process"),path=require("path");
const {prepare,writePrepared}=require("./full-place-profile-stage");
const ROOT=path.resolve(__dirname,"..",".."),RUN=path.join(__dirname,"run.js"),TEST=path.join(__dirname,"test.js");
function spawn(file,args,env){return cp.spawnSync(process.execPath,[file].concat(args||[]),{cwd:ROOT,env:env||process.env,encoding:"utf8",maxBuffer:16*1024*1024});}
function main(){
  const env=process.env,dry=process.argv.includes("--dry"),verify=process.argv.includes("--verify");
  if(!env.JBC_VAULT)throw new Error("SOURCE_AUTHORITY: JBC_VAULT is required");
  const prepared=prepare({vault:env.JBC_VAULT});
  const coreArgs=dry?["--dry"]:[],core=spawn(RUN,coreArgs,env);
  if(core.status!==0){process.stdout.write(core.stdout||"");process.stderr.write(core.stderr||"");throw new Error("CORE_PIPELINE_FAILED exit="+core.status);}
  let coreSummary={};try{coreSummary=JSON.parse(core.stdout);}catch(e){}
  const detail=dry?prepared.map(x=>({research_id:x.id,stable_id:x.stable_id,out:x.out,source_sha256:x.sha256,metrics:x.metrics,write:false})):writePrepared(prepared).map(x=>Object.assign({write:true},x));
  let regression=null;
  if(verify&&!dry){const t=spawn(TEST,[],env);regression={exit:t.status,stdout:(t.stdout||"").trim(),stderr:(t.stderr||"").trim()};if(t.status!==0){process.stdout.write(t.stdout||"");process.stderr.write(t.stderr||"");throw new Error("REGRESSION_FAILED exit="+t.status);}}
  console.log(JSON.stringify({schema:"JBC_RESEARCH_TO_WEBAPP_SYNC_v0.1",status:"PASS",dry_run:dry,order:["FULL_PROFILE_CHECK","SHARED_INGEST"].concat(dry?[]:["FULL_PROFILE_WRITE"]).concat(regression?["REGRESSION"]:[]),full_profiles:detail,assets:coreSummary.assets||[],records:coreSummary.records||[],preserved_last_known_good:coreSummary.preserved_last_known_good||[],wrote:dry?false:!!coreSummary.wrote,core:coreSummary,regression},null,2));
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exit(1);}}
module.exports={main};
