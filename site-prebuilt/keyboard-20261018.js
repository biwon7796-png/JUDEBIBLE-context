/* Keyboard help: a "skip to content" link and a few reading shortcuts. Additive: it never replaces the app's own keys
   (Esc, "/" for search, arrows inside the search results stay as they are).
     [  or  ArrowLeft    previous chapter      (study view, nothing focused)
     ]  or  ArrowRight   next chapter
     ?                   show/hide this list                                                                       */
(function () {
  "use strict";
  var st = document.createElement("style");
  st.textContent =
    ".jbc-skip{position:fixed;left:8px;top:-60px;z-index:300;padding:10px 14px;border-radius:10px;background:var(--accent,#a8662f);color:var(--on-accent,#fff);font-weight:700;font-size:14px;text-decoration:none;transition:top .12s}" +
    ".jbc-skip:focus{top:8px;outline:3px solid #fff;outline-offset:2px}" +
    "#jbc-keys{position:fixed;inset:0;z-index:310;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.42)}" +
    "#jbc-keys[hidden]{display:none}" +
    "#jbc-keys .jbc-keys-box{max-width:min(420px,calc(100vw - 32px));padding:16px 18px;border-radius:14px;background:var(--paper,#fffaf0);color:var(--ink,#2b2218);box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:14px;line-height:1.7}" +
    "#jbc-keys h2{margin:0 0 6px;font-size:16px}#jbc-keys kbd{display:inline-block;min-width:1.6em;padding:0 6px;border:1px solid var(--line,#c9b99f);border-radius:6px;background:var(--card,#fff);font:inherit;font-size:12px;text-align:center}" +
    "#jbc-keys button{margin-top:8px;padding:7px 12px;border-radius:10px;border:1px solid var(--line,#c9b99f);background:transparent;color:inherit;font-size:13px;cursor:pointer}";
  document.head.appendChild(st);

  var skip = document.createElement("a");
  skip.className = "jbc-skip"; skip.href = "#"; skip.textContent = "본문으로 건너뛰기";
  skip.addEventListener("click", function (e) {
    e.preventDefault();   // the app routes on the URL hash, so a normal #anchor would be read as a (bad) reference
    var v = document.body.dataset.view, id = v === "explore" ? "search-results" : v === "timeline" ? "timeline-pane" : "verses";
    var t = document.getElementById(id) || document.getElementById("text-pane");
    if (!t) return;
    if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
    try { t.focus({ preventScroll: false }); } catch (x) { t.focus(); }
  });
  document.body.insertBefore(skip, document.body.firstChild);

  var help = document.createElement("div");
  help.id = "jbc-keys"; help.hidden = true; help.setAttribute("role", "dialog"); help.setAttribute("aria-modal", "true"); help.setAttribute("aria-label", "키보드 단축키");
  help.innerHTML = '<div class="jbc-keys-box"><h2>키보드 단축키</h2>' +
    '<div><kbd>/</kbd> 검색 열기</div><div><kbd>[</kbd> 또는 <kbd>←</kbd> 이전 장</div><div><kbd>]</kbd> 또는 <kbd>→</kbd> 다음 장</div>' +
    '<div><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> 또는 <kbd>Space</kbd> 선택한 카드·단계 이동</div><div><kbd>Esc</kbd> 열린 패널·안내 닫기</div><div><kbd>?</kbd> 이 목록 열기/닫기</div>' +
    '<div style="font-size:12px;opacity:.75;margin-top:4px">← → 는 입력창이나 버튼에 포커스가 없을 때만 동작합니다.</div><button type="button">닫기</button></div>';
  document.body.appendChild(help);
  var closeBtn = help.querySelector("button");
  function setHelp(on) { help.hidden = !on; if (on) closeBtn.focus(); }
  closeBtn.addEventListener("click", function () { setHelp(false); });
  help.addEventListener("click", function (e) { if (e.target === help) setHelp(false); });

  function typing(t) { var tag = t && t.tagName; return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable); }
  function step(n) {
    if (document.body.dataset.view !== "study") return false;
    var b = document.querySelector('#text-pane [data-step="' + n + '"]'); if (!b || b.disabled) return false;
    b.click(); return true;
  }
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!help.hidden) { if (e.key === "Escape" || e.key === "?") { e.preventDefault(); e.stopPropagation(); setHelp(false); } return; }
    var t = e.target; if (typing(t)) return;
    if (e.key === "?") { e.preventDefault(); setHelp(true); return; }
    var lightbox = document.getElementById("media-lightbox"); if (lightbox && !lightbox.hidden) return;
    var bare = !t || t === document || t === document.body || t === document.documentElement;
    if (e.key === "[" || (bare && e.key === "ArrowLeft")) { if (step(-1)) e.preventDefault(); }
    else if (e.key === "]" || (bare && e.key === "ArrowRight")) { if (step(1)) e.preventDefault(); }
  }, true);
})();
