(function(){
"use strict";
var root=document.body;
var nav=document.getElementById("mobile-study-tabs");
var scripture=document.getElementById("mobile-study-scripture");
var place=document.getElementById("mobile-study-place");
var text=document.getElementById("text-pane");
var map=document.getElementById("map-pane");
if(!nav||!scripture||!place||!text||!map)return;
var narrow=window.matchMedia("(max-width: 760px)");
var active="scripture",scrolls={scripture:0,place:0};
function isStudy(){return narrow.matches&&root.dataset.view==="study";}
function switchTo(next,restore){
 if(next!=="scripture"&&next!=="place")return;
 if(isStudy())scrolls[active]=window.scrollY||0;
 active=next;
 root.dataset.mobileStudyTab=next;
 scripture.setAttribute("aria-selected",String(next==="scripture"));
 place.setAttribute("aria-selected",String(next==="place"));
 scripture.tabIndex=next==="scripture"?0:-1;
 place.tabIndex=next==="place"?0:-1;
 if(isStudy()){
  window.requestAnimationFrame(function(){window.scrollTo({top:restore?scrolls[next]:0,behavior:"instant"});});
 }
}
scripture.addEventListener("click",function(){switchTo("scripture",true);});
place.addEventListener("click",function(){switchTo("place",true);});
nav.addEventListener("keydown",function(e){
 if(!isStudy()||!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();
 var next=e.key==="Home"?"scripture":e.key==="End"?"place":active==="scripture"?"place":"scripture";
 switchTo(next,true);(next==="scripture"?scripture:place).focus();
});
root.dataset.mobileStudyTab=active;
var obs=new MutationObserver(function(){
 if(!isStudy())return;
 // When a place is opened from the scripture surface, reveal the existing place panel.
});
obs.observe(root,{attributes:true,attributeFilter:["data-view"]});
})();
