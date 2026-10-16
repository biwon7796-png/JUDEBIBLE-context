/* Place detail panels of the 41 reference places: replaces the OpenBible-source-only blurb with a one-line summary,
   fills "이름의 뜻", adds a "성경 속 …" commentary section and a rights-checked photo (Wikimedia Commons) when one exists.
   Data: JBC_PLACE_COMMENTARY (written for JudeBible from the scripture passages), JBC_PLACE_PHOTOS. */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function run(a) {
    var key = a.getAttribute("data-place-key"); var C = window.JBC_PLACE_COMMENTARY && window.JBC_PLACE_COMMENTARY[key]; if (!C) return;
    if (a.getAttribute("data-pc-done") === key) return;
    var name = (a.querySelector(".detail-name") || {}).textContent || ""; var sticky = document.querySelector("#side-pane .detail-name, .place-sticky-head .detail-name");
    var title = name || (sticky && sticky.textContent) || "이 장소";
    var hook = a.querySelector(".d-hook"); if (hook) hook.textContent = C.hook;
    a.querySelectorAll(".qf").forEach(function (row) {
      var dt = row.querySelector("dt"), dd = row.querySelector("dd"); if (!dt || !dd) return;
      var k = dt.textContent.trim(), cur = dd.textContent.trim();
      if (k === "이름의 뜻" && C.meaning && /^(연구 전|확인 중)/.test(cur)) { dd.textContent = C.meaning; row.setAttribute("data-auto", "1"); }
    });
    var P = window.JBC_PLACE_PHOTOS && window.JBC_PLACE_PHOTOS[key], hero = a.querySelector(".d-hero.place-hero-empty, .place-hero-empty");
    if (P && hero) {
      var fig = document.createElement("figure"); fig.className = "d-hero full-profile-hero pc-hero";
      fig.innerHTML = '<img class="hero-img" src="' + esc(P.src) + '" alt="' + esc(P.caption || title) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
        '<figcaption><span class="hero-cap">' + esc(P.caption || title) + '</span><span class="pc-photo-credit">사진: ' + esc(P.creator) + " · " + esc(P.license) + ' · <a href="' + esc(P.source) + '" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></span></figcaption>';
      hero.replaceWith(fig);
    }
    var html = C.paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    html += '<h5>위치</h5><p>' + esc(C.place) + "</p>";
    if (C.read && C.read.length) html += '<h5>함께 읽기</h5><ul class="pc-read">' + C.read.map(function (r) { return "<li>" + (r.hash ? '<a href="#' + esc(r.hash) + '">' + esc(r.ref) + "</a>" : "<b>" + esc(r.ref) + "</b>") + " <span>" + esc(r.why) + "</span></li>"; }).join("") + "</ul>";
    var sec = document.createElement("section"); sec.className = "d-sec pc-section"; sec.setAttribute("data-part", "commentary");
    sec.innerHTML = '<h4 class="d-h">성경 속 ' + esc(title) + ' <small>주드성경 해설 · 검토 전</small></h4>' + html +
      '<p class="pc-credit">해설은 위에 적은 성경 본문을 근거로 주드성경이 새로 썼습니다. 위치: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> (CC BY 4.0).</p>';
    var anchor = a.querySelector('[data-part="facts"]'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor.nextSibling); else a.appendChild(sec);
    a.setAttribute("data-pc-done", key);
  }
  function fixCards() {   // search result cards: replace the OpenBible-source-only description with the summary line
    document.querySelectorAll(".ee-card[data-place-key]").forEach(function (c) {
      var k = c.getAttribute("data-place-key"), C = window.JBC_PLACE_COMMENTARY && window.JBC_PLACE_COMMENTARY[k]; if (!C || c.getAttribute("data-pc-card")) return;
      var el = [].slice.call(c.querySelectorAll("p,span,div")).filter(function (e) { return e.children.length === 0 && /OpenBible\.info Bible Geocoding/.test(e.textContent); })[0];
      if (el) { el.textContent = C.hook; }
      var P = window.JBC_PLACE_PHOTOS && window.JBC_PLACE_PHOTOS[k], ph = c.querySelector(".ee-thumb-ph");
      if (P && ph) {
        var im = document.createElement("img"); im.className = "ee-thumb"; im.src = P.src; im.alt = P.caption || ""; im.loading = "lazy"; im.setAttribute("referrerpolicy", "no-referrer"); ph.replaceWith(im);
        var pr = c.querySelector(".ee-primary"); if (pr) pr.classList.add("has-media");
        var ex = c.querySelector(".ee-card-extra"); if (ex) { var cr = document.createElement("span"); cr.className = "pc-card-credit"; cr.textContent = "사진: " + P.creator + " · " + P.license + " · Wikimedia Commons"; ex.appendChild(cr); }
      }
      c.setAttribute("data-pc-card", "1");
    });
  }
  var t = 0;
  new MutationObserver(function () {
    clearTimeout(t); t = setTimeout(function () { try { fixCards(); } catch (e) {} document.querySelectorAll('article.detail[data-detail="l"]').forEach(function (a) { try { if (!a.querySelector(".pc-section")) { a.removeAttribute("data-pc-done"); run(a); } } catch (e) {} }); }, 80);
  }).observe(document.body, { childList: true, subtree: true });
})();
