// 본문 필기: 지도 필기 도구상자를 공유하되 데이터는 장/절+문자 offset으로 별도 저장한다.
(function () {
  "use strict";
  var tools=document.getElementById("ann-tools"), opts=document.getElementById("ann-opts"), verses=document.getElementById("verses");
  if(!tools||!opts||!verses||!window.BVC) return;
  var KEY="jbc.scripture.annotations.v1", PREF="jbc.scripture.annotation.prefs.v1";
  var COLORS=[["#f5c518","노랑"],["#f08c00","주황"],["#2f9e44","초록"],["#1c7ed6","파랑"],["#7048e8","보라"],["#d93025","빨강"]];
  var S={tool:"hand",color:"#f5c518",items:[],hist:[],pending:[],hidden:false,surface:"map",seq:0,lastApplied:[],textAnchor:null};
  var LABELS={
    map:{hand:["이동·선택","이동·선택 (V)"],pen:["펜","펜 (P)"],hl:["형광펜","형광펜 (M)"],eraser:["지우개","지우개 (E)"],dist:["거리 측정","거리 측정 (D)"]},
    scripture:{hand:["본문 선택","본문 선택"],pen:["밑줄","밑줄"],hl:["형광펜","형광펜"],eraser:["지우기","선택한 본문 필기 지우기"],dist:["거리 측정","본문에서는 사용하지 않음"]}
  };
  function load(){
    try{var a=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(a))S.items=a;var p=JSON.parse(localStorage.getItem(PREF)||"null");if(p&&p.color)S.color=p.color;}catch(e){}
    S.items.forEach(function(x){var n=+(String(x.id||"").replace(/^ta/,""));if(n>S.seq)S.seq=n;});
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(S.items));localStorage.setItem(PREF,JSON.stringify({color:S.color}));}catch(e){}}
  function snapshot(){S.hist.push(JSON.stringify(S.items));if(S.hist.length>60)S.hist.shift();}
  function currentPassage(){return window.BVC&&window.BVC.state&&window.BVC.state.passage;}
  function textNodes(verse){
    var out=[],w=document.createTreeWalker(verse,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentElement;if(!p||p.closest(".vnum"))return NodeFilter.FILTER_REJECT;
      return n.nodeValue&&n.nodeValue.length?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});while(w.nextNode())out.push(w.currentNode);return out;
  }
  function selectionSegments(){
    var sel=window.getSelection&&window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return[];
    var r=sel.getRangeAt(0),root=r.commonAncestorContainer.nodeType===1?r.commonAncestorContainer:r.commonAncestorContainer.parentElement;
    if(!root||!root.closest("#verses"))return[];
    var out=[];
    [].forEach.call(verses.querySelectorAll(".verse[data-verse]"),function(v){
      if(!r.intersectsNode(v))return;var nodes=textNodes(v),base=0,a=null,b=null;
      nodes.forEach(function(n){
        var len=n.nodeValue.length,s=0,e=len,hit=false;
        try{hit=r.intersectsNode(n);}catch(err){hit=false;}
        if(hit){
          if(n===r.startContainer)s=Math.max(0,Math.min(len,r.startOffset));
          if(n===r.endContainer)e=Math.max(0,Math.min(len,r.endOffset));
          if(e>s){a=a==null?base+s:Math.min(a,base+s);b=b==null?base+e:Math.max(b,base+e);}
        }
        base+=len;
      });
      if(a!=null&&b>a)out.push({verse:+v.dataset.verse,start:a,end:b});
    });
    return out;
  }
  function caretAtPoint(x,y){
    var n=null,o=0,p;
    if(document.caretPositionFromPoint){p=document.caretPositionFromPoint(x,y);if(p){n=p.offsetNode;o=p.offset;}}
    else if(document.caretRangeFromPoint){p=document.caretRangeFromPoint(x,y);if(p){n=p.startContainer;o=p.startOffset;}}
    if(!n)return null;var e=n.nodeType===1?n:n.parentElement;if(!e||!e.closest("#verses")||e.closest(".vnum"))return null;
    return {node:n,offset:o};
  }
  function extendTextSelectionAt(x,y){
    var sel=window.getSelection&&window.getSelection();if(!sel||!sel.rangeCount)return false;
    var a=S.textAnchor;
    if(!a&& !sel.isCollapsed)a={node:sel.anchorNode,offset:sel.anchorOffset};
    if(!a||!a.node||!document.contains(a.node))return false;
    var ap=a.node.nodeType===1?a.node:a.node.parentElement;if(!ap||!ap.closest("#verses"))return false;
    var c=caretAtPoint(x,y);if(!c)return false;
    try{
      if(sel.setBaseAndExtent)sel.setBaseAndExtent(a.node,a.offset,c.node,c.offset);
      else {var r=document.createRange();r.setStart(a.node,a.offset);r.setEnd(c.node,c.offset);sel.removeAllRanges();sel.addRange(r);}
      S.textAnchor=a;var segs=selectionSegments();if(segs.length)S.pending=segs;activateScripture();return true;
    }catch(err){return false;}
  }
  function rangeFor(seg){
    var v=verses.querySelector('.verse[data-verse="'+seg.verse+'"]');if(!v)return null;
    var nodes=textNodes(v),base=0,r=document.createRange(),sn=null,en=null,so=0,eo=0;
    for(var i=0;i<nodes.length;i++){var n=nodes[i],next=base+n.nodeValue.length;if(sn==null&&seg.start>=base&&seg.start<=next){sn=n;so=Math.min(n.nodeValue.length,seg.start-base);}if(seg.end>=base&&seg.end<=next){en=n;eo=Math.min(n.nodeValue.length,seg.end-base);break;}base=next;}
    if(!sn||!en)return null;try{r.setStart(sn,so);r.setEnd(en,eo);return r;}catch(e){return null;}
  }
  function rgba(hex,a){var h=hex.replace("#","");if(h.length===3)h=h.split("").map(function(x){return x+x;}).join("");var n=parseInt(h,16);return"rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
  function hname(type,color){return"jbc_"+type+"_"+color.replace("#","").toLowerCase();}
  function render(){
    if(!window.CSS||!CSS.highlights||typeof Highlight==="undefined")return;
    Array.from(CSS.highlights.keys()).filter(function(k){return /^jbc_(hl|ul)_/.test(String(k));}).forEach(function(k){CSS.highlights.delete(k);});
    var style=document.getElementById("jbc-text-ann-style");if(!style){style=document.createElement("style");style.id="jbc-text-ann-style";document.head.appendChild(style);}
    if(S.hidden){style.textContent="";return;}
    var groups={},pid=currentPassage();
    S.items.filter(function(x){return x.passage===pid;}).forEach(function(x){var r=rangeFor(x);if(!r)return;var k=hname(x.type,x.color);(groups[k]||(groups[k]={type:x.type,color:x.color,ranges:[]})).ranges.push(r);});
    var css=[];
    Object.keys(groups).forEach(function(k){var g=groups[k];CSS.highlights.set(k,new Highlight(...g.ranges));if(g.type==="hl")css.push("::highlight("+k+"){background:"+rgba(g.color,.36)+";}");else css.push("::highlight("+k+"){text-decoration-line:underline;text-decoration-color:"+g.color+";text-decoration-thickness:2px;text-underline-offset:.16em;text-decoration-skip-ink:auto;}");});
    style.textContent=css.join("\n");
  }
  function clearSelection(){try{window.getSelection().removeAllRanges();}catch(e){}S.pending=[];S.textAnchor=null;}
  function mutate(fn){snapshot();fn();save();render();chrome();}
  function apply(type){
    var segs=S.pending.length?S.pending:selectionSegments();if(!segs.length)return false;var pid=currentPassage(),ids=[];
    mutate(function(){segs.forEach(function(s){var x={id:"ta"+(++S.seq),passage:pid,verse:s.verse,start:s.start,end:s.end,type:type,color:S.color};S.items.push(x);ids.push(x.id);});});S.lastApplied=ids;clearSelection();return true;
  }
  function recolorLast(color){ if(!S.lastApplied.length)return false; var set={};S.lastApplied.forEach(function(id){set[id]=1;}); var hit=false; mutate(function(){S.items.forEach(function(x){if(set[x.id]){x.color=color;hit=true;}});}); return hit; }
  function eraseSelection(){
    var segs=S.pending.length?S.pending:selectionSegments();if(!segs.length)return false;var pid=currentPassage();
    mutate(function(){S.items=S.items.filter(function(x){if(x.passage!==pid)return true;return !segs.some(function(s){return x.verse===s.verse&&x.start<s.end&&x.end>s.start;});});});clearSelection();return true;
  }
  function undo(){if(!S.hist.length)return;try{S.items=JSON.parse(S.hist.pop());save();render();chrome();}catch(e){}}
  function clearPassage(){var pid=currentPassage();if(!S.items.some(function(x){return x.passage===pid;}))return;mutate(function(){S.items=S.items.filter(function(x){return x.passage!==pid;});});}
  function setTool(t){if(!/^(hand|pen|hl|eraser)$/.test(t))return;S.tool=t;if(t==="hand")S.lastApplied=[];chrome();}
  function renderOpts(){
    if(S.surface!=="scripture"||S.tool==="hand"||S.tool==="eraser"){opts.innerHTML="";return;}
    opts.innerHTML='<span class="map-tool-sep"></span><div class="ann-swatches" role="group" aria-label="본문 필기 색상">'+COLORS.map(function(c){return'<button type="button" class="ann-sw" data-text-ann-color="'+c[0]+'" style="--c:'+c[0]+'" aria-label="'+c[1]+'" title="'+c[1]+'" aria-pressed="'+(S.color===c[0])+'"></button>';}).join("")+"</div>";
  }
  function relabel(surface){
    ["hand","pen","hl","eraser","dist"].forEach(function(k){var b=tools.querySelector('[data-ann-tool="'+k+'"]');if(!b)return;var l=LABELS[surface][k];b.setAttribute("aria-label",l[0]);b.title=l[1];b.hidden=surface==="scripture"&&k==="dist";});
  }
  function chrome(){
    if(S.surface!=="scripture")return;
    document.body.dataset.annSurface="scripture";relabel("scripture");
    [].forEach.call(tools.querySelectorAll("[data-ann-tool]"),function(b){b.setAttribute("aria-pressed",String(b.dataset.annTool===S.tool));});
    var u=tools.querySelector('[data-ann-act="undo"]'),c=tools.querySelector('[data-ann-act="clear"]'),v=tools.querySelector('[data-ann-act="visible"]');
    if(u)u.disabled=!S.hist.length;if(c)c.disabled=!S.items.some(function(x){return x.passage===currentPassage();});if(v)v.setAttribute("aria-pressed",String(!S.hidden));
    renderOpts();
  }
  function activateScripture(){
    if(document.body.dataset.view!=="study")return;S.surface="scripture";document.body.dataset.annSurface="scripture";var l=document.getElementById("ann-layer");if(l)l.dataset.active="0";chrome();
  }
  function activateMap(){
    if(S.surface==="map")return;S.surface="map";delete document.body.dataset.annSurface;relabel("map");
    var d=tools.querySelector('[data-ann-tool="dist"]');if(d)d.hidden=false;
    if(window.JBC_ANN&&JBC_ANN.setTool)JBC_ANN.setTool(JBC_ANN.state.tool||"hand");
  }
  document.addEventListener("selectionchange",function(){
    var sel=window.getSelection&&window.getSelection(),segs=selectionSegments();
    if(segs.length){S.pending=segs;if(sel&&!sel.isCollapsed)S.textAnchor={node:sel.anchorNode,offset:sel.anchorOffset};activateScripture();}
    else if(!sel||sel.isCollapsed)S.textAnchor=null;
  });
  document.addEventListener("pointerdown",function(e){
    if(e.target.closest&&e.target.closest("#map-pane"))activateMap();
    else if(e.target.closest&&e.target.closest("#verses")){
      activateScripture();S.lastApplied=[];
      if(e.shiftKey&&S.textAnchor&&extendTextSelectionAt(e.clientX,e.clientY)){e.preventDefault();}
    }
  },true);
  document.addEventListener("pointerup",function(e){
    if(S.surface!=="scripture"||!(e.target.closest&&e.target.closest("#verses")))return;
    setTimeout(function(){var segs=selectionSegments();if(!segs.length)return;S.pending=segs;if(S.tool==="hl")apply("hl");else if(S.tool==="pen")apply("ul");else if(S.tool==="eraser")eraseSelection();},0);
  },true);
  tools.addEventListener("click",function(e){
    if(S.surface!=="scripture")return;var b=e.target.closest&&e.target.closest("button");if(!b||b.disabled)return;
    if(b.dataset.annTool){
      e.preventDefault();e.stopImmediatePropagation();var t=b.dataset.annTool;if(t==="dist")return;
      setTool(t);if(t==="hl")apply("hl");else if(t==="pen")apply("ul");else if(t==="eraser")eraseSelection();if(e.detail>0)b.blur();return;
    }
    if(b.dataset.annAct==="undo"||b.dataset.annAct==="clear"||b.dataset.annAct==="visible"){
      e.preventDefault();e.stopImmediatePropagation();
      if(b.dataset.annAct==="undo")undo();else if(b.dataset.annAct==="clear")clearPassage();else{S.hidden=!S.hidden;render();chrome();}
      if(e.detail>0)b.blur();
    }
  },true);
  opts.addEventListener("click",function(e){
    if(S.surface!=="scripture")return;var b=e.target.closest&&e.target.closest("[data-text-ann-color]");if(!b)return;e.preventDefault();e.stopImmediatePropagation();S.color=b.dataset.textAnnColor;save();var segs=selectionSegments();if(segs.length&&(S.tool==="hl"||S.tool==="pen")){S.pending=segs;apply(S.tool==="hl"?"hl":"ul");}else recolorLast(S.color);renderOpts();
  },true);
  new MutationObserver(function(){setTimeout(render,0);}).observe(verses,{childList:true,subtree:false});
  window.addEventListener("hashchange",function(){setTimeout(render,0);});
  load();render();
  window.JBC_TEXT_ANN={state:S,selectionSegments:selectionSegments,apply:apply,eraseSelection:eraseSelection,undo:undo,clearPassage:clearPassage,render:render,activateScripture:activateScripture,activateMap:activateMap,hasSelection:function(){return selectionSegments().length>0;}};
})();