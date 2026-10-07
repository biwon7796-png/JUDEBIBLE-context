// Research-to-all-features linkage E2E. Run ?qa=lk
(function(){
"use strict";if(!/[?&]qa=lk/.test(location.search))return;
var sleep=ms=>new Promise(r=>setTimeout(r,ms)),ok=(c,m)=>{if(!c)throw new Error(m||"assertion failed")};
var T=[],t=(id,name,fn)=>T.push({id,name,fn});
t("LK-01","Gerar exact AUTO_BIND graph includes six internal Events but public graph hides them",async ev=>{
 var all=BVC.boundRelations("JBC-CR-PLACE-GERAR-001",true),pub=BVC.boundRelations("JBC-CR-PLACE-GERAR-001",false),events=all.filter(x=>BVC.store.get(x.sid)?.entity_type==="Event");
 ok(events.length===6,"internal events="+events.length);ok(pub.every(x=>BVC.store.get(x.sid)?.entity_type!=="Event"),"unpublished event leaked");ev.push("internal events=6; public events=0");
});
t("LK-02","Gerar Full Profile research exposes exact-bound internal Event objects",async ev=>{
 BVC.go("gen-20",1);BVC.entityExplorer.select("JBC-CR-PLACE-GERAR-001");await sleep(80);
 var d=document.querySelector("#panel details.research");ok(d,"research details");d.open=true;var bs=[...d.querySelectorAll("[data-related-entity]")].filter(b=>/^JBC-CR-EVENT-GERAR-/.test(b.dataset.relatedEntity));ok(bs.length===6,"buttons="+bs.length);ev.push("research event buttons=6");
});
t("LK-03","Direct exact Event stable ID opens Event research detail without Place semantics",async ev=>{
 ok(BVC.entityExplorer.select("JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01"),"select event");await sleep(60);var a=document.querySelector('#panel article[data-detail="evt"]');ok(a,"event detail");ok(/사건 · 내부 연구 객체 · 비공개/.test(a.textContent),"boundary label");ok(/창세기 20(?::|장 )1–18(?:절)?/.test(a.textContent),"passage range");ok(!a.querySelector('[data-map-focus-place]'),"place map action leaked");ev.push("event detail + Gen20:1-18");
});
t("LK-04","Reader-facing quick search does not expose unpublished Event",async ev=>{
 var hits=BVC.quickSearchItems("Abraham_and_Sarah_in_Gerar");ok(!hits.some(x=>/^JBC-CR-EVENT-GERAR-/.test(x.sid)),"event leaked to reader search");ok(BVC.readerVisible("JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01")===false,"visibility gate");ev.push("event readerVisible=false");
});
t("LK-05","Search keeps Event/Route tabs visible with empty states; unpublished Events never leak; a temporarily published test Event enters the shared entity set/search and is restored",async ev=>{
 var sid="JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01",r=BVC.projection.events[sid],oldPub=r.reader.published,oldCan=r.activation.publishable,q=s=>document.querySelector(s);
 var evCards=()=>[...document.querySelectorAll('#search-results [data-search="1"][data-kind="evt"]')];
 BVC.openSearch("");await sleep(60);var eb=q('[data-swmode="event"]'),rb=q('[data-swmode="route"]');ok(eb&&!eb.hidden,"사건 tab hidden");ok(rb&&!rb.hidden,"경로 tab hidden");
 eb.click();await sleep(60);ok(q('[data-sw-empty="event"]'),"Event empty state missing");ok(!evCards().length,"internal Event leaked into Event tab");
 ok(!BVC.entityExplorer.set("",{type:"event"}).some(x=>/^JBC-CR-EVENT-GERAR-/.test(x.stable_id)),"internal Event leaked into entity set");
 rb.click();await sleep(60);ok(q('[data-sw-empty="route"]'),"Route empty state missing");
 try{r.reader.published=true;r.activation.publishable=true;ok(BVC.readerVisible(sid)===true,"temporary publish gate");
  ok(BVC.entityExplorer.set("",{type:"event"}).some(x=>x.stable_id===sid),"Event not accepted by shared entitySet");ok(BVC.quickSearchItems("Abraham_and_Sarah").some(x=>x.sid===sid),"Event not accepted by quick search");
  q('[data-swmode="event"]').click();await sleep(80);var c=evCards().filter(x=>x.dataset.stableId===sid);ok(c.length===1,"published Event card missing from Event tab");ok(c[0].closest(".ee-item"),"Event card not rendered by the shared entity card");ok(!q('[data-sw-empty="event"]'),"empty state shown beside a result");
 }finally{r.reader.published=oldPub;r.activation.publishable=oldCan;var all=q('[data-swmode="all"]');if(all)all.click();await sleep(30);BVC.closeSearch();}
 ok(BVC.readerVisible(sid)===false&&!BVC.entityExplorer.set("",{type:"event"}).some(x=>x.stable_id===sid),"fixture not restored");ev.push("tabs visible · empty states · gate intact · temp Event via shared set · restored");
});
t("LK-06","Genesis 26 timeline consumes asset-local projected Events",async ev=>{
 BVC.go("gen-26");BVC.setView("timeline");await sleep(60);var sec=document.querySelector('#tl-body [data-part="projected-events"]');ok(sec,"projected event timeline");var rows=sec.querySelectorAll("[data-related-entity]");ok(rows.length===4,"gen26 events="+rows.length);ok(/독립 정경 사건으로 승격되지 않았습니다/.test(sec.textContent),"promotion boundary");ev.push("Gen26 internal events="+rows.length);BVC.setView("study");
});
t("LK-07","Joshua 19:15 timeline consumes contextual timeline binding without promotion",async ev=>{
 BVC.go("jos-19",15);BVC.setView("timeline");await sleep(60);var sec=document.querySelector('#tl-body [data-part="contextual-timeline"]');ok(sec,"contextual timeline missing");ok(/이름이 같다고 같은 장소인가/.test(sec.textContent),"context title");ok(/canonical ID 없음/.test(sec.textContent),"candidate boundary");ok(/정경 객체 자동 승격 없음/.test(sec.textContent),"promotion warning");ev.push("RN-PART05-CH26-v1 consumed");BVC.setView("study");
});
t("LK-08","Region research flow remains separate from Place and invents no geometry",async ev=>{
 ok(BVC.entityExplorer.select("JBC-CR-PLACE-ACHAIA-001"),"select region");await sleep(50);var a=document.querySelector('#panel article[data-detail="rgn"]');ok(a,"region detail");ok(/지역 · 연구 검토용/.test(a.textContent),"region label");ok(/지도/.test(a.textContent),"map boundary");ev.push("region detail preserved");
});
t("LK-09","No canonical Route entities are invented; presentation-only route layer remains separate",async ev=>{
 var routes=Object.keys((BVC.projection&&BVC.projection.routes)||{});ok(routes.length===0,"canonical routes="+routes.length);BVC.go("gen-26");BVC.setView("study");await sleep(50);var ps=window.JBC_PRESENTATION_ROUTES&&Object.keys(window.JBC_PRESENTATION_ROUTES.routes||{})||[];ok(ps.length>=1,"presentation routes missing");ev.push("canonical=0; presentation="+ps.length);
});
t("LK-10","Scripture index remains visibility-gated and Place stable identities resolve",async ev=>{
 var g=BVC.store.get("JBC-CR-PLACE-GERAR-001"),b=BVC.store.get("JBC-CR-PLACE-BEERSHEBA-001");ok(g&&b,"places");ok(BVC.resolveKey("JBC-CR-PLACE-GERAR-001")==="gerar","gerar key");ok(BVC.resolveKey("JBC-CR-PLACE-BEERSHEBA-001")==="beersheba","bs key");ev.push("stable identity resolution PASS");
});
// ---- Shared Search-card contract: single click = detail, double click = entity research + synchronized Scripture / navigation / map context ----
var swCard=(mode,pred)=>[...document.querySelectorAll('#search-results [data-search="1"]')].filter(pred)[0];
async function swOpen(mode){BVC.go("gen-22",19);BVC.setView("study");await sleep(40);BVC.openSearch("");await sleep(60);var b=document.querySelector('[data-swmode="'+mode+'"]');ok(b&&!b.hidden,mode+" tab");b.click();await sleep(80)}
async function swClose(){var all=document.querySelector('[data-swmode="all"]');if(all&&BVC.state.view==="explore"){all.click();await sleep(20)}BVC.closeSearch();await sleep(30)}
async function dbl(find){var el=find();ok(el,"card");[1,2].forEach(d=>{el=find()||el;el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,detail:d}))});el=find()||el;el.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,detail:2}));await sleep(180)}
function passageResearch(t,label){var S=BVC.state,w=document.getElementById("search-workspace");ok(S.view==="study","still in Search ("+label+")");ok(!w||w.hidden,"Search workspace not closed ("+label+")");var rt=BVC.ui.refTarget;ok(S.passage===t.pid,label+" passage "+S.passage+" ≠ "+t.pid);ok(t.verse==null||(rt&&rt.passage===t.pid&&rt.verse===t.verse),label+" verse target "+JSON.stringify(rt)+" ≠ "+t.verse);ok(S.panel==="open"&&S.tab==="context","Passage Research not open ("+label+")");ok(S.entity===null,"entity detail opened alongside Passage Research ("+label+")");ok(document.querySelectorAll('#panel article.detail').length===0,"duplicate detail panel ("+label+")")}
function entityResearch(t,kind,key,label){var S=BVC.state,U=BVC.ui,w=document.getElementById("search-workspace");ok(S.view==="study","still in Search ("+label+")");ok(!w||w.hidden,"Search workspace not closed ("+label+")");if(t){var rt=U.refTarget;ok(S.passage===t.pid,label+" passage "+S.passage+" ≠ "+t.pid);ok(t.verse==null||(rt&&rt.passage===t.pid&&rt.verse===t.verse),label+" verse target "+JSON.stringify(rt)+" ≠ "+t.verse)}ok(S.panel==="open",label+" research panel not open");if(kind==="l"){ok(U.rsPlace===key,label+" place context "+U.rsPlace+" ≠ "+key);ok(U.rmode==="PLACE"||(S.entity&&S.entity.kind==="l"),label+" PLACE research not active")}else if(kind==="p"){ok(U.rsPerson===key,label+" person context "+U.rsPerson+" ≠ "+key);ok(U.rmode==="PERSON"||(S.entity&&S.entity.kind==="p"),label+" PERSON research not active")}}
async function singleClickDetail(mode,find,kind,label){await swOpen(mode);var el=find();ok(el,label+" card");var sid=el.dataset.stableId;el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,detail:1}));await sleep(120);var e=BVC.state.entity;ok(e&&e.kind===kind,label+" single click did not open detail: "+JSON.stringify(e));ok(!sid||BVC.stableId(e.kind,e.id)===sid,label+" single click selected another entity");await swClose()}
t("LK-11","Place card (Gerar): single click = detail; double click = PLACE research + resolved Scripture + navigation/map context",async ev=>{
 var f=()=>swCard("place",x=>x.dataset.kind==="l"&&x.dataset.id==="gerar");await singleClickDetail("place",f,"l","Gerar");
 await swOpen("place");var t1=BVC.cardPassage(f()),t2=BVC.cardPassage(f());ok(t1&&JSON.stringify(t1)===JSON.stringify(t2),"non-deterministic passage");await dbl(f);entityResearch(t1,"l","gerar","Gerar");ok(!!BVC.ui.nav.topic,"Gerar navigation context not linked");ev.push("gerar PLACE → "+t1.pid+":"+t1.verse+" · nav="+BVC.ui.nav.topic);await swClose();
});
t("LK-12","Person card: double click opens PERSON research + representative Scripture; navigation/map sync only when shared relations support it",async ev=>{
 var f=()=>swCard("person",x=>x.dataset.kind==="p"&&!!BVC.cardPassage(x));await singleClickDetail("person",f,"p","Person");
 await swOpen("person");var c=f();ok(c,"person card with passage binding");var id=c.dataset.id,t1=BVC.cardPassage(c);await dbl(()=>swCard("person",x=>x.dataset.id===id));entityResearch(t1,"p",id,"Person");ev.push(id+" PERSON → "+t1.pid+":"+t1.verse+(BVC.ui.nav.topic?" · nav="+BVC.ui.nav.topic:""));await swClose();
});
t("LK-13","Event card (test Event temporarily reader-visible): double click → earliest passage_refs passage + Passage Research; Event stays Event; fixture restored",async ev=>{
 var sid="JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01",r=BVC.projection.events[sid],oldPub=r.reader.published,oldCan=r.activation.publishable,f=()=>swCard("event",x=>x.dataset.kind==="evt"&&x.dataset.stableId===sid);
 try{r.reader.published=true;r.activation.publishable=true;
  await singleClickDetail("event",f,"evt","Event");
  await swOpen("event");var c=f();ok(c,"event card");var t1=BVC.cardPassage(c),refs=BVC.store.get(sid).passage_refs;ok(t1&&refs.length,"no passage binding");ok(t1.pid===refs[0].book+"-"+refs[0].chapter||refs.some(x=>x.book+"-"+x.chapter===t1.pid),"passage not from Event passage_refs");
  var cam=JSON.stringify(BVC.ui.gcam);await dbl(f);passageResearch(t1,"Event");ok(JSON.stringify(BVC.ui.gcam)===cam,"Event double click moved the map like a Place");ok(BVC.ui.rsPlace===null,"Event converted to Place context");ev.push("event → "+t1.pid+":"+t1.verse);
 }finally{r.reader.published=oldPub;r.activation.publishable=oldCan;await swClose()}
 ok(BVC.readerVisible(sid)===false,"Event fixture not restored");
});
t("LK-14","Route: no canonical Route identity is invented; with no Route search card carrying a passage binding, double click stays inactive (valid boundary)",async ev=>{
 ok(Object.keys(BVC.projection.routes||{}).length===0,"canonical routes appeared");await swOpen("route");var cards=[...document.querySelectorAll('#search-results [data-search="1"][data-kind="rt"]')];
 if(!cards.length){ok(document.querySelector('[data-sw-empty="route"]'),"route empty state");var fake=document.createElement("button");fake.dataset.kind="rt";fake.dataset.id="UNBOUND_ROUTE";ok(BVC.cardPassage(fake)===null,"unbound route resolved a passage");var pv=BVC.state.passage;var empty=document.querySelector('[data-sw-empty="route"]');empty.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,detail:2}));await sleep(80);ok(BVC.state.view==="explore"&&BVC.state.passage===pv,"double click navigated without a Route binding");ev.push("0 Route cards → no-navigation boundary PASS")}
 else{var c=cards.find(x=>BVC.cardPassage(x));if(c){var t1=BVC.cardPassage(c),id=c.dataset.id;await dbl(()=>[...document.querySelectorAll('#search-results [data-search="1"][data-kind="rt"]')].find(x=>x.dataset.id===id));passageResearch(t1,"Route");ev.push(id+" → "+t1.pid)}else{var pv2=BVC.state.passage;await dbl(()=>cards[0]);ok(BVC.state.passage===pv2||BVC.state.view==="explore","unbound Route navigated");ev.push("Route cards unbound → inactive")}}
 await swClose();ok(Object.keys(BVC.projection.routes||{}).length===0,"canonical routes invented");
});
t("LK-15","Region behavior intact: Region detail stays distinct from Place; Region card (if listed) follows the same contract",async ev=>{
 ok(BVC.entityExplorer.select("JBC-CR-PLACE-ACHAIA-001"),"select region");await sleep(50);ok(document.querySelector('#panel article[data-detail="rgn"]'),"region detail");
 await swOpen("place");var c=swCard("place",x=>x.dataset.kind==="rgn");if(c){var id=c.dataset.id,t1=BVC.cardPassage(c);if(t1){await dbl(()=>swCard("place",x=>x.dataset.id===id));passageResearch(t1,"Region");ok(BVC.ui.rsPlace===null,"Region converted to Place context");ev.push("region card → "+t1.pid)}else ev.push("region card without passage → inactive")}else ev.push("no Region card listed in Search; detail flow preserved");await swClose();
});
t("LK-16","primaryPassage priority, Search-bound passage, safe fallback, and no-passage boundary use the shared resolver",async ev=>{
 var gsid="JBC-CR-PLACE-GERAR-001",bsid="JBC-CR-PLACE-BEERSHEBA-001",isid="JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01",gr=BVC.projection.places[gsid],old=gr.primaryPassage;
 await swOpen("place");var g=()=>swCard("place",x=>x.dataset.stableId===gsid),b=()=>swCard("place",x=>x.dataset.stableId===bsid);
 ok(BVC.store.get(gsid).primaryPassage==="gen-20:1","Gerar primary lost in shared projection");
 ok(BVC.cardPassage(g()).pid==="gen-20"&&BVC.cardPassage(g()).verse===1,"Gerar primary not preferred");
 ok(BVC.cardPassage(b()).pid==="gen-21"&&BVC.cardPassage(b()).verse===31,"Beersheba primary not preferred");
 try{
  gr.primaryPassage=null;BVC.openSearch("");await sleep(60);ok(BVC.cardPassage(g()).pid==="gen-10","no-primary did not use earliest fallback");
  BVC.openSearch("창 26:1");await sleep(80);ok(BVC.cardPassage(g()).pid==="gen-26"&&BVC.cardPassage(g()).verse===1,"explicit Search passage not preferred over fallback");
  gr.primaryPassage="bad-999:1";BVC.openSearch("");await sleep(60);ok(BVC.cardPassage(g()).pid==="gen-10","invalid primary did not fall back");
 }finally{gr.primaryPassage=old}
 BVC.openSearch("고센");await sleep(80);var gos=swCard("place",x=>x.dataset.id==="goshen");ok(gos&&BVC.cardPassage(gos)&&BVC.cardPassage(gos).pid==="gen-46","Goshen no-primary fallback changed");
 ok(BVC.store.get(isid)&&BVC.store.get(isid).primaryPassage==="gen-26:1","Isaac primary lost in shared projection");
 BVC.openSearch("");await sleep(60);var fake=document.createElement("button"),host=document.getElementById("search-results"),pv=BVC.state.passage;fake.dataset.search="1";fake.dataset.kind="l";fake.dataset.id="__NO_PASSAGE__";host.appendChild(fake);ok(BVC.cardPassage(fake)===null,"no-passage fabricated a target");fake.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,detail:2}));await sleep(60);ok(BVC.state.view==="explore"&&BVC.state.passage===pv,"no-passage double click navigated");fake.remove();
 ev.push("primary=Gerar/Beersheba/Isaac · Search context=Gen26 · fallback=Gen10/Goshen Gen46 · no passage inactive");await swClose();
});
t("LK-17","shared representative media survives Search photo filter/sorting and Map hover without changing media bindings",async ev=>{
 var ids=["JBC-CR-PLACE-BEERSHEBA-001","JBC-CR-PLACE-GERAR-001"],before={};
 ids.forEach(function(sid){var r=BVC.projection.places[sid];before[sid]=JSON.stringify({representative_media_id:r.representative_media_id,media:(r.media||[]).map(function(m){return {id:m.id,target_ref:m.target_ref,preview_url:m.preview_url,display_mode:m.display_mode,rights:m.rights};})});var e=BVC.store.get(sid),p=BVC.placeIndex().byKey[e.compatibility_key];ok(e&&e.has_photo&&e.representative_media,"shared entity media missing "+sid);ok(p&&p.media&&p.media.id===e.representative_media.id,"Place Index media diverged "+sid);});
 var photo=BVC.entityExplorer.set("",{type:"place",photo:true});ids.forEach(function(sid){ok(photo.some(function(e){return e.stable_id===sid;}),"photo filter dropped "+sid);});
 var label=BVC.entityExplorer.set("",{type:"place",sort:"label"}),bible=BVC.entityExplorer.set("",{type:"place",sort:"bible"});
 ids.forEach(function(sid){var a=label.filter(function(e){return e.stable_id===sid;})[0],b=bible.filter(function(e){return e.stable_id===sid;})[0],s=BVC.store.get(sid);ok(a&&b&&a.representative_media.id===s.representative_media.id&&b.representative_media.id===s.representative_media.id,"sort changed media projection "+sid);});
 BVC.go("gen-22",19);BVC.selectEntity("l","beersheba");await sleep(140);var anchor=document.querySelector('#map-body [data-nav-place="beersheba"], #map-body g.gm[data-place="beersheba"]');ok(anchor,"Beersheba map anchor missing");anchor.dispatchEvent(new PointerEvent("pointerover",{bubbles:true,pointerType:"mouse"}));await sleep(280);var hover=document.querySelector("#place-hovercard:not([hidden])"),img=hover&&hover.querySelector("img.pc-map-media"),rep=BVC.store.get(ids[0]).representative_media;ok(hover&&img,"map hover shared media missing");ok(img.getAttribute("src")===rep.preview_url,"map hover media is not shared representative media");
 ids.forEach(function(sid){var r=BVC.projection.places[sid],after=JSON.stringify({representative_media_id:r.representative_media_id,media:(r.media||[]).map(function(m){return {id:m.id,target_ref:m.target_ref,preview_url:m.preview_url,display_mode:m.display_mode,rights:m.rights};})});ok(after===before[sid],"media binding mutated during consumer flow "+sid);});
 ev.push("photo filter=2 shared places · sort identity stable · hover="+rep.id+" · bindings unchanged");
});
(async function(){var res=[];for(var c of T){var evidence=[],pass=true,err="";try{await c.fn(evidence)}catch(e){pass=false;err=e.message}res.push({id:c.id,name:c.name,pass,err,evidence})}var p=res.filter(x=>x.pass).length;window.BVC_LK_QA={pass:p,total:res.length,verdict:p===res.length?"PASS":"FAIL",results:res};var pre=document.createElement("pre");pre.id="lk-qa-report";pre.hidden=true;pre.textContent=JSON.stringify(window.BVC_LK_QA,null,2);document.body.appendChild(pre)})();
})();