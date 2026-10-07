// 그랄 Full Canonical Place Profile E2E 검증. 실행: index.html?qa=gr
(function () {
  "use strict";
  if (!/[?&]qa=gr/.test(location.search)) return;
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});},ok=function(c,m){if(!c)throw new Error(m||"assertion failed");};
  var host=document.createElement("div");host.style.cssText="position:absolute;left:-10000px;top:0";document.body.appendChild(host);
  var SID="JBC-CR-PLACE-GERAR-001",FULL_SHA="d07b08ab20a46fd7ea0022d1a23234cd80ed86fcfd651326e6471c2e1dddb24e",APPROVAL_SHA="3ae0553d511a1f0abce19fc1bf02c85b4a22097d2481703462cb2f2e29e86436";
  function mk(w,h){var f=document.createElement("iframe");f.style.cssText="width:"+(w||1400)+"px;height:"+(h||900)+"px;border:0";return f;}
  function ready(f,res){f.onload=function(){var w=f.contentWindow;w.__errs=[];w.addEventListener("error",function(e){w.__errs.push(e.message)});setTimeout(function(){res({f:f,w:w,d:w.document,B:w.BVC})},180)}}
  function load(hash,w,h){return new Promise(function(res){var f=mk(w,h);ready(f,res);f.src="index.html"+(hash||"");host.appendChild(f)})}
  function q(x,s){return x.d.querySelector(s)} function qa(x,s){return [].slice.call(x.d.querySelectorAll(s))}
  function click(x,s){var e=typeof s==="string"?q(x,s):s;ok(e,"not found: "+s);e.dispatchEvent(new x.w.MouseEvent("click",{bubbles:true,cancelable:true}));return e}
  function clean(x){if(x&&x.f)x.f.remove()}
  var T=[],t=function(id,name,fn){T.push({id:id,name:name,fn:fn})};

  t("GRF-01","exact approved Gerar Full Profile is current reader representative",async function(ev){
    var x=await load("#gen-20:1"),F=x.w.JBC_PLACE_FULL_PROFILES[SID];
    ok(F&&F.source.sha256===FULL_SHA&&F.source.approval_sha256===APPROVAL_SHA&&F.source.professional_status==="CURRENT_REPRESENTATIVE","authority");
    ok(F.correction_delta.direct_mentions===10&&F.inline_refs.length===61&&F.related_passages.length===41,"counts");
    ev.push(F.source.research_id);clean(x);
  });

  t("GRF-02","stable identity and gerar compatibility key remain one Place",async function(ev){
    var x=await load("#gen-20:1"),P=x.B.data.places.gerar;ok(P&&P.stable_id===SID&&x.B.resolveKey(SID)==="gerar","identity");
    click(x,'.tag.l[data-id="gerar"]');await sleep(120);ok(q(x,"#panel .full-place-profile").dataset.stableId===SID,"full detail");
    ev.push("gerar → "+SID);clean(x);
  });

  t("GRF-03","reader hierarchy and Gerar-specific headings render",async function(){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(120);
    var parts=qa(x,"#panel .full-place-profile [data-part]").map(function(e){return e.dataset.part});
    ["hook","facts","media","story","significance","relations","location","geography","archaeology","scripture","research"].forEach(function(k){ok(parts.indexOf(k)>=0,"missing "+k)});
    ok(q(x,"#place-fixed-head [data-part=\"identity\"]")&&/그랄/.test(q(x,"#place-fixed-head").textContent),"fixed identity");
    var txt=q(x,"#panel").textContent;ok(/성경 속 그랄/.test(txt)&&/왜 그랄이 중요한가/.test(txt)&&!/성경 속 브엘세바/.test(txt),"generic headings");
    clean(x);
  });

  t("GRF-04","9 story sections and 5 significance sections render",async function(){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(100);
    ok(qa(x,"#panel .d-story-block").length===9,"story=9");ok(qa(x,"#panel .d-significance-block").length===5,"significance=5");
    var s=q(x,'[data-part="story"]').textContent;ok(/아브라함과 사라/.test(s)&&/그랄 골짜기/.test(s)&&/아사 시대/.test(s),"canonical span");clean(x);
  });

  t("GRF-05","inline passage links preserve Gerar detail and contiguous range",async function(ev){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(100);
    var b=q(x,'#panel .inline-ref[data-open-range="gen-26:17-22"]')||q(x,"#panel .inline-ref");ok(b,"inline ref");
    var raw=b.dataset.openRange,m=/^([a-z0-9]+-\d+):(\d+)-(\d+)$/.exec(raw);click(x,b);await sleep(120);
    ok(x.B.state.entity&&x.B.state.entity.id==="gerar","context preserved");ok(x.B.ui.refTarget&&x.B.ui.refTarget.passage===m[1]&&x.B.ui.refTarget.verse===+m[2]&&x.B.ui.refTarget.verse_end===+m[3],"range target");
    ok(qa(x,"#verses .verse.ref-target").length===+m[3]-+m[2]+1,"contiguous selection");ev.push(raw);clean(x);
  });

  t("GRF-06","all 61 link intentions resolve to local JudeBible verses",async function(ev){
    var x=await load("#gen-20:1"),F=x.w.JBC_PLACE_FULL_PROFILES[SID],bad=[];
    F.inline_refs.forEach(function(r){var P=x.B.data.passages[r.passage];if(!P||r.start<1||r.end<r.start||r.end>P.verses.length)bad.push(r)});
    ok(F.inline_refs.length===61&&!bad.length,"invalid refs");ev.push("61/61; unique 41");clean(x);
  });

  t("GRF-07","short type is 성읍·도시 and detailed type stays in quick facts",async function(){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(120);
    ok(q(x,"#side-pane .pane-title").textContent.trim()==="성읍·도시","short type");
    var facts=q(x,'#panel [data-part="facts"]').textContent;ok(/성읍·정착지·족장 체류지/.test(facts),"detailed type");clean(x);
  });

  t("GRF-08","canonical coordinate remains null and candidate wording stays uncertain",async function(){
    var x=await load("#gen-20:1"),R=x.B.projection.places[SID];ok(R.coordinates===null,"canonical coordinate null");
    click(x,'.tag.l[data-id="gerar"]');await sleep(100);var txt=q(x,'#panel [data-part="location"]').textContent;
    ok(/Tel Haror|Tell Abu|텔 하로르|후레레/.test(txt)&&/후보|가설|확정/.test(txt),"candidate language");clean(x);
  });

  t("GRF-09","archaeology does not equate Tel Haror with patriarchal events",async function(){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(100);var a=q(x,'#panel [data-part="archaeology"]').textContent;
    ok(/Tel Haror/.test(a)&&/동일시/.test(a)&&!/아브라함의 유적이다/.test(a)&&!/이삭의 우물이다/.test(a),"boundary");clean(x);
  });

  t("GRF-10","Research layer records current representative, 10 mentions and retained uncertainty",async function(){
    var x=await load("#gen-20:1");click(x,'.tag.l[data-id="gerar"]');await sleep(100);var d=q(x,"#panel details.research");ok(d&&!d.open,"collapsed");
    var s=d.textContent;ok(/JBC_GERAR_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261005_01/.test(s)&&/성경 직접 언급 · 10회/.test(s)&&/외부 공개는 승인되지 않았습니다/.test(s),"research metadata");clean(x);
  });

  t("GRF-11","switching entities resets panel scroll and mobile has no horizontal overflow",async function(){
    var x=await load("#gen-20:1",390,760);click(x,'.tag.l[data-id="gerar"]');await sleep(100);var p=q(x,"#panel");p.scrollTop=Math.min(400,p.scrollHeight-p.clientHeight);
    var other=q(x,'.tag.l[data-id="beersheba"]');if(other){click(x,other);await sleep(100);ok(p.scrollTop===0,"scroll reset");}
    ok(p.scrollWidth<=p.clientWidth+1&&x.d.documentElement.scrollWidth<=391,"mobile overflow");ok(x.w.__errs.length===0,"console errors");clean(x);
  });

  (async function(){var res=[];for(var c of T){var ev=[],pass=true,err="";try{await Promise.race([c.fn(ev),new Promise(function(_,rj){setTimeout(function(){rj(new Error("TIMEOUT 40s"))},40000)})])}catch(e){pass=false;err=e.message}res.push({id:c.id,name:c.name,pass:pass,err:err,evidence:ev})}
    var p=res.filter(function(r){return r.pass}).length,verdict=p===res.length?"PASS":"FAIL";window.BVC_GR_QA={pass:p,total:res.length,verdict:verdict,results:res};
    var el=document.createElement("div");el.id="gr-qa-report";el.className="qa";document.body.appendChild(el);el.textContent="GERAR_FULL_PROFILE_E2E "+verdict+" "+p+"/"+res.length+"\n"+res.map(function(r){return(r.pass?"PASS":"FAIL")+" "+r.id+" "+r.name+(r.err?"\n   ✗ "+r.err:"")+"\n   · "+r.evidence.join("\n   · ")}).join("\n");
  })();
})();
