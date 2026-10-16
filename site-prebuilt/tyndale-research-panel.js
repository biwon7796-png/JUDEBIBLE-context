(function(){
"use strict";
// Isolated public reference only: standalone Tyndale English notes, never WORBS authority.
const map={gen:"Gen",exo:"Exod",lev:"Lev",num:"Num",deu:"Deut",jos:"Josh",jdg:"Judg",rut:"Ruth","1sa":"ISam","2sa":"IISam","1ki":"IKgs","2ki":"IIKgs","1ch":"IChr","2ch":"IIChr",ezr:"Ezra",neh:"Neh",est:"Esth",job:"Job",psa:"Ps",pro:"Pr",ecc:"Eccl",sng:"Song",isa:"Isa",jer:"Jer",lam:"Lam",ezk:"Ezek",dan:"Dan",hos:"Hos",jol:"Joel",amo:"Amos",oba:"Obad",jon:"Jon",mic:"Mic",nam:"Nah",hab:"Hab",zep:"Zeph",hag:"Hagg",zec:"Zech",mal:"Mal",mat:"Matt",mrk:"Mark",luk:"Luke",jhn:"John",act:"Acts",rom:"Rom","1co":"ICor","2co":"IICor",gal:"Gal",eph:"Eph",php:"Phil",col:"Col","1th":"IThes","2th":"IIThes","1ti":"ITim","2ti":"IITim",tit:"Titus",phm:"Phlm",heb:"Heb",jas:"Jas","1pe":"IPet","2pe":"IIPet","1jn":"IJn","2jn":"IIJn","3jn":"IIIJn",jud:"Jude",rev:"Rev"};
let current="", serial=0, cache=new Map();
const doc=document;
function passage(){const state=window.BVC&&window.BVC.state;if(!state||state.view!=="study")return null;let p=state.passage,ref=typeof p==="string"?p:p&&p.ref||"";let match=/^([1-3]?[a-z]+)-(\d+)(?:$|-)/i.exec(ref);if(!match){const title=doc.querySelector("#passage-title")?.textContent||"";return null;}return {book:map[match[1].toLowerCase()],chapter:+match[2],verse:state.verse,ref};}
function block(el,tag,txt,cls){const c=doc.createElement(tag);if(cls)c.className=cls;c.textContent=txt;el.append(c);return c;}
function drawItems(box,items,key,verse){box.replaceChildren();if(!items.length){block(box,"p","이 장에 연결된 틴데일 주석 항목이 없습니다.");return;}
const chosen=(verse!=null)?items.filter(x=>{const m=/^[^.]+\.(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?/.exec(x.ref);if(!m)return false;let start=+m[2],end=m[4]?+m[4]:start;return +verse>=start&&+verse<=end}):[];
if(chosen.length){block(box,"p",String(verse)+"절과 직접 연결된 주석 "+chosen.length+"건을 먼저 표시합니다.","jbc-tyndale-hint");}
const show=chosen.length?chosen:items;
for(const entry of show){const a=doc.createElement("article");a.className="jbc-tyndale-entry";block(a,"strong",entry.ref);block(a,"p",entry.text);box.append(a);}
if(chosen.length&&chosen.length<items.length){const all=doc.createElement("details");block(all,"summary","이 장의 나머지 주석 "+(items.length-chosen.length)+"건 보기");for(const entry of items.filter(x=>!chosen.includes(x))){const a=doc.createElement("article");a.className="jbc-tyndale-entry";block(a,"strong",entry.ref);block(a,"p",entry.text);all.append(a);}box.append(all);}
}
async function hydrate(box,key,book,chapter,verse,number){
const path="open-reference/tyndale/"+book+".json";let data=cache.get(path);
try{if(!data){const res=await fetch(path);if(!res.ok)throw Error("HTTP "+res.status);data=await res.json();cache.set(path,data);}
if(number!==serial||!box.isConnected||current!==key)return;
const items=data[String(chapter)]||[];drawItems(box,items,key,verse);const meta=doc.getElementById("jbc-tyndale-count");if(meta)meta.textContent=items.length+"개 주석 · 영어 원문";
}catch(err){if(number===serial&&box.isConnected)block(box,"p","틴데일 주석을 불러오지 못했습니다: "+err.message);}}
function mount(){const ctx=passage();const panel=doc.getElementById("panel");if(!panel)return;const stale=panel.querySelector("#jbc-tyndale-reference");if(!ctx||!ctx.book||doc.body.dataset.detailContext==="entity"||!panel.querySelector('details[data-ov="notes"]')){if(stale)stale.remove();current="";return;}const key=ctx.ref+"|"+(ctx.verse??"")+"|"+ctx.book;
if(current===key&&panel.querySelector("#jbc-tyndale-reference"))return;current=key;let number=++serial;
const details=doc.createElement("details");details.id="jbc-tyndale-reference";details.className="ov jbc-tyndale-reference";details.open=true;
block(details,"summary","틴데일 영어 주석 · Tyndale Open Study Notes");
const body=doc.createElement("div");body.className="jbc-tyndale-body";
block(body,"p",ctx.book+" "+ctx.chapter+"장","jbc-tyndale-location");
block(body,"p","해당 본문에 연결된 공개 영어 주석입니다. WORBS 전문 연구와 별도 자료입니다.","jbc-tyndale-muted");
block(body,"p","불러오는 중…","jbc-tyndale-count").id="jbc-tyndale-count";
const list=doc.createElement("div");list.className="jbc-tyndale-items";body.append(list);
const credits=doc.createElement("p");credits.className="jbc-tyndale-credits";credits.append(doc.createTextNode("© 2022 Tyndale House Publishers · CC BY-SA 4.0 · 원문 XML에서 장별 가공 · "));
for(const [label,url] of [["원저작물","https://tyndaleopenresources.com/"],["이용허락","https://creativecommons.org/licenses/by-sa/4.0/"]]){const a=doc.createElement("a");a.textContent=label;a.href=url;a.target="_blank";a.rel="noopener noreferrer";credits.append(a,doc.createTextNode(" · "));}
body.append(credits);details.append(body);panel.append(details);hydrate(list,key,ctx.book,ctx.chapter,ctx.verse,number);}
doc.addEventListener("bvc:rendered",mount);if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",mount);else queueMicrotask(mount);
})();