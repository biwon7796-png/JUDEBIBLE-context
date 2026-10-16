(function(){
"use strict";
var root=document.body,bar=document.getElementById("mobile-search-tabs");
var cards=document.getElementById("mobile-search-cards"),detail=document.getElementById("mobile-search-detail");
var results=document.getElementById("search-results"),search=document.getElementById("search-workspace");
var panel=document.getElementById("panel");
if(!bar||!cards||!detail||!results||!search||!panel)return;
var media=window.matchMedia("(max-width:760px)");
var active="cards",savedScroll=0;
function applicable(){return media.matches&&root.dataset.view==="explore";}
function view(next,restore){
 if(next!=="cards"&&next!=="detail")return;
 if(!applicable())return;
 if(active==="cards"&&next==="detail")savedScroll=search.scrollTop;
 active=next;root.dataset.mobileSearchTab=next;
 cards.setAttribute("aria-selected",String(next==="cards"));detail.setAttribute("aria-selected",String(next==="detail"));
 cards.tabIndex=next==="cards"?0:-1;detail.tabIndex=next==="detail"?0:-1;
 requestAnimationFrame(function(){if(next==="cards"&&restore)search.scrollTop=savedScroll;
  if(next==="detail"){var side=document.getElementById("side-pane");if(side)side.scrollTop=0;}});
}
cards.addEventListener("click",function(){view("cards",true);});
detail.addEventListener("click",function(){view("detail",true);});
bar.addEventListener("keydown",function(e){
 if(!applicable()||!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 e.preventDefault();var next=e.key==="Home"?"cards":e.key==="End"?"detail":active==="cards"?"detail":"cards";
 view(next,true);(next==="cards"?cards:detail).focus();
});
document.addEventListener("click",function(e){
 if(!applicable())return;
 var target=e.target;
 if(!target||!target.closest)return;
 var row=target.closest('#search-results [data-search="1"]');
 if(!row)return;
 if(row.dataset.kind!=="p"&&row.dataset.kind!=="l")return;
 if(e.detail>1)return;
 requestAnimationFrame(function(){
  if(!applicable())return;
  var hasDetail=!!panel.querySelector('article.detail,.full-place-profile,.person-research,[data-detail]');
  if(hasDetail)view("detail",false);
 });
},true);
document.addEventListener("keydown",function(e){
 if(e.key==="Escape"&&applicable()&&active==="detail"){view("cards",true);}
},true);
root.dataset.mobileSearchTab=active;
new MutationObserver(function(){
 if(!applicable())return;
 if(active==="detail"&&!panel.querySelector('article.detail,.full-place-profile,.person-research,[data-detail]'))view("cards",true);
}).observe(panel,{childList:true,subtree:false});
})();

