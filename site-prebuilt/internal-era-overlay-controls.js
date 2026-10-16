/* Internal design preview only: original Holman-inspired schematics are not for public release. */
(function(){
  var map={ "era.conquest":"지파별 개략 분배","era.judges":"사사시대 지역 개략도","era.united-monarchy":"통일왕국 개략도","era.divided-monarchy":"분열왕국 개략도","era.assyria":"앗수르 시대 세력권 개략도","era.exile":"바벨론 포로 시대 개략도","era.return":"바사 귀환 시대 개략도","era.intertestamental":"중간기 세력권 개략도" };
  var box=document.createElement("aside");box.id="jbc-epoch-overlay-status";
  box.setAttribute("role","status");box.setAttribute("aria-live","polite");box.hidden=true;
  document.body.appendChild(box);
  var last="",infoOpen=false;
  function redraw(){
    var id=window.BVC&&BVC.ui&&BVC.ui.nav&&BVC.ui.nav.topic;
    var show=!!map[id] && !!(window.BVC&&BVC.state&&BVC.state.view==="study");
    var next=show?id+"|"+String(window.JBC_REGION_OVERLAY_VISIBLE!==false):"none";
    if(next===last)return;last=next;box.hidden=!show;
    if(!show)return;
    box.textContent="";
    var info=document.createElement("button");info.type="button";info.className="jbc-epoch-info";info.textContent="i";
    info.setAttribute("aria-label","시대 개략도 안내");info.setAttribute("aria-expanded",String(infoOpen));info.title="시대 개략도 안내";
    var tip=document.createElement("span");tip.className="jbc-epoch-tip";tip.hidden=!infoOpen;
    tip.textContent="내부 디자인 검토 · "+map[id]+" · 개략 색면 / 역사적 확정 경계 아님 · 공개 권리 HOLD";
    info.onclick=function(){infoOpen=!infoOpen;tip.hidden=!infoOpen;info.setAttribute("aria-expanded",String(infoOpen));};
    box.appendChild(info);box.appendChild(tip);
    var btn=document.createElement("button");btn.type="button";btn.textContent=window.JBC_REGION_OVERLAY_VISIBLE===false?"색면 켜기":"색면 끄기";
    btn.setAttribute("aria-pressed",String(window.JBC_REGION_OVERLAY_VISIBLE!==false));
    btn.onclick=function(){window.JBC_REGION_OVERLAY_VISIBLE=window.JBC_REGION_OVERLAY_VISIBLE===false;last="";if(window.BVC&&BVC.remount)BVC.remount();setTimeout(redraw,25);};
    box.appendChild(btn);
  }
  document.addEventListener("click",function(){setTimeout(redraw,40)},true);
  document.addEventListener("bvc:rendered",redraw);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",redraw);else redraw();
})();
