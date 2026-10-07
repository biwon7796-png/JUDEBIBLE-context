// 브엘세바 Full Canonical Place Profile E2E 검증. 실행: index.html?qa=bs
(function () {
  "use strict";
  if (!/[?&]qa=bs/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var SID = "JBC-CR-PLACE-BEERSHEBA-001", FULL_SHA = "ca65d402d5685455107b50c1dfc652bd04efd96c1815205ca075ed5a1ec1a07f", ADOPT_SHA = "cb47576b8cd66740c14dc91c8a060bd21a0350e7be0c2a1c8f59c545a0784705";
  function mk(w,h){var f=document.createElement("iframe");f.style.cssText="width:"+(w||1400)+"px;height:"+(h||900)+"px;border:0";return f;}
  function ready(f,res){f.onload=function(){var w=f.contentWindow;w.__errs=[];w.addEventListener("error",function(e){w.__errs.push(e.message)});setTimeout(function(){res({f:f,w:w,d:w.document,B:w.BVC})},180)}}
  function load(hash,w,h){return new Promise(function(res){var f=mk(w,h);ready(f,res);f.src="index.html"+(hash||"");host.appendChild(f)})}
  function q(x,s){return x.d.querySelector(s)} function qa(x,s){return [].slice.call(x.d.querySelectorAll(s))}
  function click(x,s){var e=typeof s==="string"?q(x,s):s;ok(e,"not found: "+s);e.dispatchEvent(new x.w.MouseEvent("click",{bubbles:true,cancelable:true}));return e}
  function clean(x){if(x&&x.f)x.f.remove()}
  var T=[],t=function(id,name,fn){T.push({id:id,name:name,fn:fn})};

  t("BSF-01","exact approved Full Place Profile is the reader representative",async function(ev){
    var x=await load("#gen-22:19"),F=x.w.JBC_PLACE_FULL_PROFILES[SID];
    ok(F&&F.source.sha256===FULL_SHA&&F.source.adoption_sha256===ADOPT_SHA&&F.source.professional_status==="CURRENT_REPRESENTATIVE","full profile authority");
    ok(F.correction_delta.direct_mentions===33&&F.inline_refs.length===107,"33 mentions / 107 inline refs");
    ev.push(F.source.research_id+" "+F.source.sha256);clean(x);
  });

  t("BSF-02","stable identity and compatibility alias remain one Place",async function(ev){
    var x=await load("#gen-22:19"),P=x.B.data.places.beersheba;
    ok(P&&P.stable_id===SID&&x.B.resolveKey(SID)==="beersheba","alias to stable identity");
    click(x,'.tag.l[data-id="beersheba"]');await sleep(120);
    ok(q(x,"#panel .full-place-profile").dataset.stableId===SID,"detail stable id");
    ev.push("beersheba → "+SID);clean(x);
  });

  t("BSF-03","Full reader hierarchy renders in approved order",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(120);
    var parts=qa(x,"#panel .full-place-profile [data-part]").map(function(e){return e.dataset.part});
    ["hook","facts","media","story","significance","relations","location","geography","archaeology","scripture","research"].forEach(function(k){ok(parts.indexOf(k)>=0,"missing "+k)});
    ok(q(x,"#place-fixed-head [data-part=\"identity\"]")&&/브엘세바/.test(q(x,"#place-fixed-head").textContent),"fixed identity");
    ok(parts.indexOf("story")<parts.indexOf("significance")&&parts.indexOf("location")<parts.indexOf("archaeology")&&parts.indexOf("scripture")<parts.indexOf("research"),"order");
    ev.push(parts.join(","));clean(x);
  });

  t("BSF-04","chronological Bible story and significance sections are complete",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(100);
    ok(qa(x,"#panel .d-story-block").length===13,"13 story sections");
    ok(qa(x,"#panel .d-significance-block").length===5,"5 significance sections");
    ok(/하갈과 이스마엘/.test(q(x,'[data-part="story"]').textContent)&&/아모스/.test(q(x,'[data-part="story"]').textContent)&&/포로기 이후/.test(q(x,'[data-part="story"]').textContent),"canonical span");
    clean(x);
  });

  t("BSF-05","inline passage links preserve Place detail and contiguous range selection",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(100);
    var b=q(x,'#panel .inline-ref[data-open-range="gen-21:25-26"]')||q(x,"#panel .inline-ref");ok(b,"inline ref exists");
    var raw=b.dataset.openRange,m=/^([a-z0-9]+-\d+):(\d+)-(\d+)$/.exec(raw);click(x,b);await sleep(120);
    ok(x.B.state.entity&&x.B.state.entity.id==="beersheba","place context preserved");
    ok(x.B.ui.refTarget&&x.B.ui.refTarget.passage===m[1]&&x.B.ui.refTarget.verse===+m[2]&&x.B.ui.refTarget.verse_end===+m[3],"range target preserved");
    ok(qa(x,"#verses .verse.ref-target").length===(+m[3]-+m[2]+1),"contiguous verses highlighted");
    ev.push(raw);clean(x);
  });

  t("BSF-06","all 107 link intentions resolve to existing JudeBible verses",async function(ev){
    var x=await load("#gen-22:19"),F=x.w.JBC_PLACE_FULL_PROFILES[SID],bad=[];
    F.inline_refs.forEach(function(r){var P=x.B.data.passages[r.passage];if(!P||r.start<1||r.end<r.start||r.end>P.verses.length)bad.push(r)});
    ok(F.inline_refs.length===107&&!bad.length,"invalid refs "+JSON.stringify(bad.slice(0,3)));
    ev.push("107/107");clean(x);
  });

  t("BSF-07","location uncertainty is visible as normal dot plus small question mark without changing research coordinate",async function(ev){
    var x=await load("#gen-26:23");await sleep(160);
    var R=x.B.projection.places[SID];ok(R.coordinates===null,"canonical coordinate stays null");
    var m=q(x,'.gm[data-place="beersheba"].gm-uncertain');ok(m,"uncertain map marker");
    ok(/\?/.test(m.textContent)&&m.dataset.locationCertainty==="inferred","question mark and inferred status");
    ev.push(m.textContent.trim());clean(x);
  });

  t("BSF-08","inferred routes remain display-only dotted geometry",async function(ev){
    var x=await load("#gen-26:23");await sleep(160);var R=x.B.projection.places[SID];
    ok((R.spatial.routes||[]).every(function(r){return r.geometry===null}),"research route geometry remains null");
    var lines=qa(x,".gm-route-inferred");ok(lines.every(function(e){return e.dataset.routeMode==="PRESENTATION_ONLY_INFERRED_ROUTE"}),"route mode");
    ev.push("display routes="+lines.length);clean(x);
  });

  t("BSF-09","archaeology wording preserves the approved boundaries",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(100);
    var a=q(x,'#panel [data-part="archaeology"]').textContent;
    ok(/철기시대/.test(a)&&/우물/.test(a)&&/뿔/.test(a),"archaeology content");
    ok(/동일시하지 않습니다/.test(a)&&!/아브라함의 우물이다/.test(a)&&!/이삭의 우물이다/.test(a),"no prohibited equation");
    clean(x);
  });

  t("BSF-10","photos remain rights-gated and source disclosure works",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(120);
    var R=x.B.projection.places[SID],imgs=qa(x,"#panel img.hero-img,#panel .d-thumb img");
    ok(R.media.length===3&&R.media.every(function(m){return x.B.mediaGate(m)==="image"}),"three cleared media");
    ok(imgs.length>=1,"reader images shown");
    click(x,"#panel [data-media-lightbox]");await sleep(50);ok(!q(x,"#media-lightbox").hidden&&q(x,"#media-lightbox a.src-link"),"lightbox source");
    clean(x);
  });

  t("BSF-11","Research layer stays collapsed and records current representative plus retained uncertainty",async function(ev){
    var x=await load("#gen-22:19");click(x,'.tag.l[data-id="beersheba"]');await sleep(100);
    var d=q(x,"#panel details.research");ok(d&&!d.open,"collapsed");
    var t0=d.textContent;ok(t0.indexOf("JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01")>=0&&t0.indexOf("성경 직접 언급 · 33회")>=0,"current representative metadata");
    ok(/남은 확인 사항/.test(t0)&&/외부 공개는 승인되지 않았습니다/.test(t0),"boundaries");
    clean(x);
  });

  t("BSF-12","responsive layout has no horizontal overflow",async function(ev){
    var x=await load("#gen-22:19",375,700);click(x,'.tag.l[data-id="beersheba"]');await sleep(120);
    var p=q(x,"#panel");ok(p.scrollWidth<=p.clientWidth+1&&x.d.documentElement.scrollWidth<=376,"mobile overflow");
    ok(qa(x,"#panel .d-gallery .d-thumb").length<=2,"compact gallery");
    ok(x.w.__errs.length===0,"console errors "+x.w.__errs.join("|"));clean(x);
  });

  (async function(){
    var res=[];
    for(var c of T){var ev=[],pass=true,err="";try{await Promise.race([c.fn(ev),new Promise(function(_,rj){setTimeout(function(){rj(new Error("TIMEOUT 40s"))},40000)})])}catch(e){pass=false;err=e.message}res.push({id:c.id,name:c.name,pass:pass,err:err,evidence:ev})}
    var p=res.filter(function(r){return r.pass}).length,verdict=p===res.length?"PASS":"FAIL";window.BVC_BS_QA={pass:p,total:res.length,verdict:verdict,results:res};
    var el=document.createElement("div");el.id="bs-qa-report";el.className="qa";document.body.appendChild(el);el.textContent="BEERSHEBA_FULL_PROFILE_E2E "+verdict+" "+p+"/"+res.length+"\n"+res.map(function(r){return(r.pass?"PASS":"FAIL")+" "+r.id+" "+r.name+(r.err?"\n   ✗ "+r.err:"")+"\n   · "+r.evidence.join("\n   · ")}).join("\n")
  })();
})();
