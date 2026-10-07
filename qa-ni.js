// Navigation derived-index coverage QA. Run: index.html?qa=ni
(function () {
  "use strict";
  if (!/[?&]qa=ni/.test(location.search)) return;
  var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms);});};
  var ok=function(c,m){if(!c)throw new Error(m||"assertion failed");};
  var host=document.createElement("div"); host.style.cssText="position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(){
    return new Promise(function(res){
      var f=document.createElement("iframe"); f.style.cssText="width:1200px;height:760px;border:0";
      f.onload=function(){setTimeout(function(){res({f:f,w:f.contentWindow,d:f.contentDocument,B:f.contentWindow.BVC});},180);};
      f.src="index.html#gen-22"; host.appendChild(f);
    });
  }
  function clean(x){if(x&&x.f)x.f.remove();}
  var T=[], t=function(id,name,fn){T.push({id:id,name:name,fn:fn});};

  t("NI-01","NAV_TOP_5 stays fixed while children are derived",async function(ev){
    var x=await load(); x.B.ui.navExplore=true; x.B.renderGuide(); await sleep(80);
    var cats=[].map.call(x.d.querySelectorAll("#guide-pane [data-nav-category]"),function(e){return e.dataset.navCategory;});
    ev.push(cats.join(" | "));
    ok(cats.join("|")==="기초 지리|자연환경|구약 역사|중간기|신약","NAV_TOP_5 changed");
    clean(x);
  });

  t("NI-02","Place and Region explicit navigation metadata auto-index without menu edits",async function(ev){
    var x=await load(), P=x.B.projection;
    P.places["JBC-CR-PLACE-NI-001"]={stable_id:"JBC-CR-PLACE-NI-001",navigation:[{domain:"구약 역사",period:"검증 시대",story:"장소 자동색인",scene:"장소 장면",passage_refs:[{book:"gen",chapter:22,v1:2,v2:2}]}]};
    P.regions=P.regions||{}; P.regions["JBC-CR-REGION-NI-001"]={stable_id:"JBC-CR-REGION-NI-001",navigation:[{domain:"신약",period:"검증 시대",story:"지역 자동색인",scene:"지역 장면",passage_refs:[{book:"act",chapter:18,v1:12,v2:12}]}]};
    x.B.ui.navExplore=true; x.B.renderGuide(); await sleep(80);
    var p=x.d.querySelector('[data-nav-source="JBC-CR-PLACE-NI-001"]'), r=x.d.querySelector('[data-nav-source="JBC-CR-REGION-NI-001"]');
    ok(p&&p.closest('[data-nav-category="구약 역사"]'),"Place auto-index failed");
    ok(r&&r.closest('[data-nav-category="신약"]'),"Region auto-index failed");
    ev.push("place="+!!p+" region="+!!r); clean(x);
  });
  t("NI-03","same stable_id may appear in multiple approved navigation paths",async function(ev){
    var x=await load(), sid="JBC-CR-PLACE-NI-MULTI-001";
    x.B.projection.places[sid]={stable_id:sid,navigation:[
      {domain:"구약 역사",period:"검증 시대 A",story:"동일 자산 A",scene:"장면 A",passage_refs:[{book:"gen",chapter:22,v1:2,v2:2}]},
      {domain:"기초 지리",period:"검증 시대 B",story:"동일 자산 B",scene:"장면 B",passage_refs:[{book:"gen",chapter:22,v1:2,v2:2}]}
    ]};
    x.B.ui.navExplore=true; x.B.renderGuide(); await sleep(80);
    var rows=x.d.querySelectorAll('[data-nav-source="'+sid+'"]');
    ok(rows.length===2,"same stable_id not reused across two paths: "+rows.length);
    ok(rows[0].closest("[data-nav-category]").dataset.navCategory!==rows[1].closest("[data-nav-category]").dataset.navCategory,"paths collapsed");
    ev.push("rows="+rows.length); clean(x);
  });

  t("NI-04","records without explicit navigation metadata are not inferred into taxonomy",async function(ev){
    var x=await load(), sid="JBC-CR-PLACE-NI-NONAV-001";
    x.B.projection.places[sid]={stable_id:sid,period:"족장 시대",type:"place",story:"임의 추론 금지"};
    x.B.ui.navExplore=true; x.B.renderGuide(); await sleep(80);
    ok(!x.d.querySelector('[data-nav-source="'+sid+'"]'),"record was inferred without navigation metadata");
    ev.push("not indexed"); clean(x);
  });

  (async function(){
    var res=[];
    for(var c of T){var ev=[],pass=true,err="";try{await c.fn(ev);}catch(e){pass=false;err=e.message;}res.push({id:c.id,name:c.name,pass:pass,err:err,evidence:ev});}
    var n=res.filter(function(r){return r.pass;}).length; window.BVC_NI_QA={pass:n,total:res.length,results:res};
    var el=document.createElement("div"); el.id="ni-qa-report"; el.className="qa"; document.body.appendChild(el);
    el.textContent="NAV_DERIVED_INDEX_QA "+n+"/"+res.length+"\n"+res.map(function(r){return (r.pass?"PASS":"FAIL")+" "+r.id+" "+r.name+(r.err?"\n   ✗ "+r.err:"")+"\n   · "+r.evidence.join("\n   · ");}).join("\n");
  })();
})();
