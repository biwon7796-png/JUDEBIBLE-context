/* Resume reading: remember the last passage and reopen it when the site is opened without a #passage link. */
(function () {
  "use strict";
  var KEY = "jbc.lastPassage.v1", RE = /^#([1-3]?[a-z]+-\d+(?::\d+)?)(?:&|$)/;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function save() { var m = RE.exec(location.hash); if (m) write(m[1]); }
  var saved = read(), restored = false;
  if ((!location.hash || location.hash === "#") && saved && /^[1-3]?[a-z]+-\d+(?::\d+)?$/.test(saved) && saved !== "gen-1:1" && saved !== "gen-1") {
    location.hash = "#" + saved; restored = true;
  }
  window.addEventListener("hashchange", save);
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") save(); });
  setInterval(save, 4000);
  if (!restored) return;
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.setAttribute("role", "status");
    bar.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;max-width:calc(100vw - 24px);display:flex;gap:10px;align-items:center;padding:8px 12px;border:1px solid var(--line,#d8cbb6);border-radius:12px;background:var(--paper,#fffaf0);color:var(--ink,#2b2218);box-shadow:0 6px 24px rgba(0,0,0,.18);font-size:13px";
    var msg = document.createElement("span"); msg.textContent = "지난번에 읽던 곳에서 이어 읽습니다.";
    var btn = document.createElement("button"); btn.type = "button"; btn.textContent = "처음부터";
    btn.style.cssText = "border:0;background:transparent;color:var(--accent-ink,#7a3f14);font-weight:700;text-decoration:underline;cursor:pointer;font-size:13px;padding:4px";
    btn.addEventListener("click", function () { write("gen-1:1"); location.hash = "#gen-1:1"; bar.remove(); });
    bar.appendChild(msg); bar.appendChild(btn); document.body.appendChild(bar);
    setTimeout(function () { if (bar.isConnected) bar.remove(); }, 8000);
  });
})();
