/* Exodus 1:15–22 approved public Reader preview — presentation-only integration.
 * Does not add an approved Project01 research row, receipt, Registry entry or professional status.
 */
(function () {
  "use strict";
  var START = 15, END = 22, panel = null, observer = null;
  function inScope() {
    var state = window.BVC && window.BVC.state;
    return state && state.view === "study" && !state.entity &&
      state.passage === "exo-1" && state.verse != null &&
      +state.verse >= START && +state.verse <= END ? +state.verse : null;
  }
  function show() {
    if (!panel || !panel.isConnected) return;
    var verse = inScope();
    if (!verse) return;
    // Leave verified approved research intact whenever a verified native row exists.
    var p = window.BVCVerseResearchProjection;
    if (p && p.recordFor && p.recordFor("exo-1:" + verse)) return;
    if (panel.querySelector('[data-jbc-exo115-preview="1"]')) return;
    var section = document.createElement("section");
    section.setAttribute("data-jbc-exo115-preview", "1");
    section.setAttribute("aria-label", "출애굽기 1장 15절부터 22절 읽기형 해설");
    section.style.cssText = "margin:12px 0 26px;min-height:620px;";
    var heading = document.createElement("h3");
    heading.textContent = "왕의 명령보다 생명을 지킨 사람들";
    heading.style.cssText = "margin:8px 0 12px;font-size:20px;";
    var iframe = document.createElement("iframe");
    iframe.title = "출애굽기 1:15–22 Reader 해설";
    iframe.src = "./design-preview/exodus-1-15-22-reader-preview.html?verse=" + verse;
    iframe.setAttribute("loading", "eager");
    iframe.style.cssText = "display:block;width:100%;height:min(78vh,950px);min-height:560px;border:1px solid #ded4c1;border-radius:12px;background:#fffefa;";
    section.appendChild(heading);
    section.appendChild(iframe);
    panel.insertBefore(section, panel.firstChild);
  }
  function bind() {
    panel = document.getElementById("panel");
    if (!panel) return false;
    observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (m) { return m.type === "childList"; })) show();
    });
    observer.observe(panel, { childList: true });
    show();
    return true;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, {once:true});
  } else bind();
})();
