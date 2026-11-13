/* ==================================================================
   Planet Pearl — settings saved by the locket (your browser only)
   Loaded before everything else so the saved values are in place.
   ================================================================== */
(function () {
  'use strict';
  var KEY = 'pp_dev_v1', C = window.PP_CONFIG;
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  var saved = read();
  if (saved.social) Object.keys(saved.social).forEach(function (k) {
    var v = saved.social[k];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return;
    C.social[k] = v;
  });
  ['email', 'discountCode'].forEach(function (k) { if (saved[k]) C[k] = saved[k]; });

  window.PPStore = {
    saved: saved,
    save: function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; } },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    // the text to paste into config.js so everyone sees it
    exportText: function (o) {
      var s = o.social || {}, out = [];
      out.push('window.PP_CONFIG.social = ' + JSON.stringify({
        instagramHandle: s.instagramHandle || C.social.instagramHandle, instagramPosts: s.instagramPosts || [],
        pinterestBoard: s.pinterestBoard || '', soundcloud: s.soundcloud || '', announcement: s.announcement || ''
      }, null, 2) + ';');
      if (o.email) out.push("window.PP_CONFIG.email = " + JSON.stringify(o.email) + ';');
      if (o.discountCode) out.push("window.PP_CONFIG.discountCode = " + JSON.stringify(o.discountCode) + ';');
      return out.join('\n');
    },
    safe: {
      instagram: function (u) { return /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/i.test(u || '') ? u.split('?')[0].replace('//instagram.com', '//www.instagram.com') : ''; },
      pinterest: function (u) { return /^https:\/\/([a-z]{2,3}\.)?pinterest\.[a-z.]+\/[^/\s]+\/[^/\s]+\/?/i.test(u || '') ? u.split('?')[0] : ''; },
      soundcloud: function (u) { return /^https:\/\/(www\.|on\.)?soundcloud\.com\//i.test(u || '') ? u : ''; }
    }
  };
})();
