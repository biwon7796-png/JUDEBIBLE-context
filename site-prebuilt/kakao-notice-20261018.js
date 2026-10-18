/* KakaoTalk in-app browser notice.
   Inside KakaoTalk's built-in browser some screens (long lists, search) scroll poorly. A normal phone browser does not have this
   problem, so offer to open the same page there. Shown only in KakaoTalk (or with ?kakao=1 for testing), dismissible for 7 days. */
(function () {
  "use strict";
  var KEY = "jbc.kakaoNotice.dismissedAt", DAYS = 7;
  try {
    var q = /[?&]kakao=(1|0)(?:&|$)/.exec(location.search);
    var inKakao = /KAKAOTALK/i.test(navigator.userAgent) || (q && q[1] === "1");
    if (inKakao && !(q && q[1] === "0")) document.documentElement.setAttribute("data-inapp", "kakao");   // styles for this browser only (inapp-fixes css)
    if (!inKakao || (q && q[1] === "0")) return;
    if (!q) { var at = Number(localStorage.getItem(KEY) || 0); if (at && Date.now() - at < DAYS * 86400000) return; }
  } catch (e) { return; }

  function build() {
    if (document.getElementById("jbc-kakao-notice")) return;
    // the same page without test/diagnostic switches
    var url = location.href;
    try { var u = new URL(location.href); ["kakao", "dbg", "kk", "perf"].forEach(function (k) { u.searchParams.delete(k); }); url = u.href; } catch (e) {}
    var bar = document.createElement("div");
    bar.id = "jbc-kakao-notice"; bar.setAttribute("role", "status");
    bar.style.cssText = "position:fixed;left:8px;right:8px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:90;padding:10px 12px;border:1px solid var(--line,#d8cbb6);border-radius:14px;background:var(--paper,#fffaf0);color:var(--ink,#2b2218);box-shadow:0 6px 24px rgba(0,0,0,.22);font-size:13px;line-height:1.5";
    var msg = document.createElement("div");
    msg.textContent = "카카오톡 안에서는 화면이 느리거나 스크롤이 멈출 수 있어요. 크롬·삼성 인터넷 같은 외부 브라우저로 열면 더 잘 동작합니다.";
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap";

    var open = document.createElement("a");
    open.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    open.textContent = "외부 브라우저로 열기";
    open.style.cssText = "padding:7px 12px;border-radius:10px;background:var(--accent,#a8662f);color:var(--on-accent,#fff);font-weight:700;text-decoration:none";

    var copy = document.createElement("button");
    copy.type = "button"; copy.textContent = "주소 복사";
    copy.style.cssText = "padding:7px 10px;border-radius:10px;border:1px solid var(--line,#d8cbb6);background:transparent;color:inherit;font-size:13px;cursor:pointer";
    copy.addEventListener("click", function () {
      var done = function () { copy.textContent = "복사됨"; setTimeout(function () { copy.textContent = "주소 복사"; }, 1800); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(done, fallback); return; }
      } catch (e) {}
      fallback();
      function fallback() {
        var t = document.createElement("textarea"); t.value = url; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0;left:-1000px";
        document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove();
      }
    });

    var close = document.createElement("button");
    close.type = "button"; close.textContent = "닫기"; close.setAttribute("aria-label", "안내 닫기");
    close.style.cssText = "margin-left:auto;padding:7px 10px;border:0;background:transparent;color:inherit;font-size:13px;text-decoration:underline;cursor:pointer";
    close.addEventListener("click", function () {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
      bar.remove();
    });

    row.appendChild(open); row.appendChild(copy); row.appendChild(close);
    bar.appendChild(msg); bar.appendChild(row);
    document.body.appendChild(bar);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
