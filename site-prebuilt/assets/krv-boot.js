/* KRV loader switch. Default: the whole KRV text as before (assets/data-krv.js).
   ?krv=lazy: structure file + only the book of the opening passage; other books load on demand (assets/krv-lazy.js).
   Both paths use parser-blocking script tags so the app code that follows still sees window.BVC_KRV synchronously. */
(function () {
  "use strict";
  var q = location.search, lazy = /[?&]krv=lazy(?:&|$)/.test(q) && !/[?&]krv=eager(?:&|$)/.test(q);
  var tag = function (src) { return '<script src="' + src + '"><\/script>'; };
  if (!lazy) { document.write(tag("assets/data-krv.js?v=dbf901c7")); return; }
  var m = /^#([1-3]?[a-z]+)-\d+/.exec(location.hash), id = m ? m[1] : "gen";
  if (!/^[1-3]?[a-z]{2,3}$/.test(id)) id = "gen";
  if (/[?&]krvdebug=1/.test(q)) window.JBC_KRV_DEBUG = {};
  document.write(tag("assets/krv/meta.js") + tag("assets/krv/" + id + ".js") + tag("assets/krv-lazy.js?v=4"));
})();
