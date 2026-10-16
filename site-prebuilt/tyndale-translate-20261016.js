/* Research panel: a "한국어로 번역" button on each Tyndale Open Study Note (English) and one for the whole list.
   Uses the browser's on-device Translator API when it exists (Chrome); otherwise opens Google Translate in a new tab with the note text.
   Nothing is sent from this page, and no translated text is stored or published. */
(function () {
  var cache = {};
  function hasApi() { return typeof self.Translator === "function" || (self.Translator && self.Translator.create); }
  function race(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]); }
  function viaApi(text) {
    var opt = { sourceLanguage: "en", targetLanguage: "ko" };
    return race(Translator.availability(opt), 2500).then(function (a) {
      if (a === "unavailable") throw new Error("unavailable");
      return race(Translator.create(opt), 90000);
    }).then(function (t) { return race(t.translate(text), 60000); });
  }
  function openGoogle(text) {
    var u = "https://translate.google.com/?sl=en&tl=ko&op=translate&text=" + encodeURIComponent(text.slice(0, 1800));
    window.open(u, "_blank", "noopener,noreferrer");
  }
  function show(entry, ko, note) {
    var box = entry.querySelector(".jbc-tyndale-ko"); if (!box) { box = document.createElement("div"); box.className = "jbc-tyndale-ko"; entry.appendChild(box); }
    box.textContent = ""; var p = document.createElement("p"); p.textContent = ko; box.appendChild(p);
    var s = document.createElement("small"); s.textContent = note; box.appendChild(s);
  }
  function translateEntry(entry, btn, silentFallback) {
    var text = (entry.querySelector("p") || {}).textContent || ""; if (!text.trim()) return Promise.resolve();
    if (cache[text]) { show(entry, cache[text], "기계 번역(브라우저) · 검토 전 · 원문은 위의 영어"); return Promise.resolve(); }
    if (!hasApi()) { if (!silentFallback) openGoogle(text); return Promise.resolve("fallback"); }
    if (btn) { btn.disabled = true; btn.textContent = "번역 중…"; }
    return viaApi(text).then(function (ko) {
      cache[text] = ko; show(entry, ko, "기계 번역(브라우저 내장) · 검토 전 · 원문은 위의 영어");
      if (btn) { btn.disabled = false; btn.textContent = "번역 다시 보기"; }
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = "한국어로 번역"; }
      if (!silentFallback) {   // a popup opened after an await is blocked by browsers, so offer a link instead
        var box = entry.querySelector(".jbc-tyndale-ko"); if (!box) { box = document.createElement("div"); box.className = "jbc-tyndale-ko"; entry.appendChild(box); }
        box.textContent = ""; var s = document.createElement("small"); s.textContent = "이 브라우저는 내장 번역을 쓸 수 없습니다. "; var a = document.createElement("a");
        a.href = "https://translate.google.com/?sl=en&tl=ko&op=translate&text=" + encodeURIComponent(text.slice(0, 1800)); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "구글 번역에서 열기"; s.appendChild(a); box.appendChild(s);
      }
      return "fallback";
    });
  }
  function enhance(box) {
    var entries = box.querySelectorAll(".jbc-tyndale-entry:not([data-tr])");
    entries.forEach(function (en) {
      en.setAttribute("data-tr", "1");
      var b = document.createElement("button"); b.type = "button"; b.className = "jbc-tyndale-tr"; b.textContent = "한국어로 번역";
      b.addEventListener("click", function () { translateEntry(en, b, false); });
      var strong = en.querySelector("strong"); if (strong && strong.nextSibling) en.insertBefore(b, strong.nextSibling); else en.appendChild(b);
    });
    if (entries.length && !box.querySelector(".jbc-tyndale-trall")) {
      var all = document.createElement("button"); all.type = "button"; all.className = "jbc-tyndale-trall"; all.textContent = "이 목록 모두 한국어로 번역";
      all.addEventListener("click", function () {
        var list = [].slice.call(box.querySelectorAll(".jbc-tyndale-entry"));
        if (!hasApi()) { openGoogle(list.map(function (e) { return (e.querySelector("p") || {}).textContent || ""; }).join("\n\n")); return; }
        all.disabled = true; all.textContent = "번역 중…";
        list.reduce(function (pr, en) { return pr.then(function () { return translateEntry(en, en.querySelector(".jbc-tyndale-tr"), true); }); }, Promise.resolve()).then(function () { all.disabled = false; all.textContent = "이 목록 모두 한국어로 번역"; });
      });
      var hint = box.querySelector(".jbc-tyndale-hint"), host = (hint && hint.parentNode) || box; host.insertBefore(all, hint ? hint.nextSibling : host.firstChild);
      var note = document.createElement("p"); note.className = "jbc-tyndale-trnote"; note.textContent = "번역은 사용자의 브라우저에서 이루어지는 기계 번역입니다(지원하지 않는 브라우저는 구글 번역을 새 탭으로 엽니다). 이 사이트가 번역문을 저장하거나 배포하지 않습니다.";
      all.parentNode.insertBefore(note, all.nextSibling);
    }
  }
  var t = 0;
  new MutationObserver(function () {
    clearTimeout(t); t = setTimeout(function () { var box = document.querySelector("#jbc-tyndale-reference .ov-body, #jbc-tyndale-reference"); if (box) enhance(box); }, 80);
  }).observe(document.body, { childList: true, subtree: true });
})();
