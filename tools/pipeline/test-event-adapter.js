"use strict";
const fs=require("fs"),vm=require("vm"),path=require("path");
const ROOT=path.resolve(__dirname,"..",".."),box={};box.window=box;
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"data","projection.research.js"),"utf8"),box);
const P=box.BVC_PROJECTION||{},E=P.events||{},ids=Object.keys(E),G=P.places&&P.places["JBC-CR-PLACE-GERAR-001"];
let pass=0,fail=0;function t(n,v){console.log((v?"PASS ":"FAIL ")+n);v?pass++:fail++}
t("EA01 six approved Gerar events projected",ids.length===6);
t("EA02 all are Event objects",ids.every(id=>E[id].type==="Event"));
t("EA03 ASSET_LOCAL scope preserved",ids.every(id=>E[id].scope==="ASSET_LOCAL"));
t("EA04 parent identity preserved",ids.every(id=>E[id].parent_asset_id==="JBC-CR-PLACE-GERAR-001"));
t("EA05 Captain approval inherited from approved parent content",ids.every(id=>E[id].authority&&E[id].authority.approval==="CAPTAIN_APPROVED"&&E[id].authority.approval_scope==="PARENT_ASSET_CONTENT"));
t("EA06 no registry/global promotion",ids.every(id=>E[id].authority&&E[id].authority.registry_effect==="NONE"&&E[id].authority.event_scope==="ASSET_LOCAL"));
t("EA07 reader/public exposure blocked",ids.every(id=>E[id].reader&&E[id].reader.published===false&&E[id].activation&&E[id].activation.publishable===false));
t("EA08 explicit passage parsed",ids.every(id=>Array.isArray(E[id].passage_refs)&&E[id].passage_refs.length===1));
t("EA09 exact source hash preserved",ids.every(id=>E[id].source_refs&&E[id].source_refs[0]&&E[id].source_refs[0].sha256==="6f9933d413bc0d675767df52c94bdc72fadce835407054227007a059a6f75937"));
t("EA10 parent Event references bind by explicit event_id",G&&G.connected&&G.connected.events.filter(x=>x.event_id).length===6&&G.connected.events.filter(x=>x.event_id).every(x=>x.resolved===true&&x.binding&&x.binding.state==="AUTO_BIND"&&x.binding.rule==="exact_stable_id_match"));
console.log("RESULT "+pass+"/"+(pass+fail));process.exit(fail?1:0);
