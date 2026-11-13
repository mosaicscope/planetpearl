/* ==================================================================
   Planet Pearl — the beside-the-logo slots: latest Instagram post,
   Pinterest board, and the announcement line. All of it is plugged in
   from the locket; nothing third-party loads until it is.
   ================================================================== */
(function () {
  'use strict';
  var doc = document, C = window.PP_CONFIG, S = C.social, safe = window.PPStore.safe;
  function el(tag, cls, txt) { var n = doc.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function loadScript(src, cb) {
    if (doc.querySelector('script[src="' + src + '"]')) { cb && cb(); return; }
    var s = doc.createElement('script'); s.src = src; s.async = true; s.onload = cb || null; doc.body.appendChild(s);
  }
  var handle = (S.instagramHandle || 'planetpearlliving').replace(/[^\w.]/g, '');

  /* ---------- announcement ---------- */
  if (S.announcement) {
    var host = doc.querySelector('.hero-copy');
    if (host) { var a = el('p', 'announce', '✿ ' + S.announcement); host.insertBefore(a, host.firstChild); }
  }

  /* ---------- Instagram: the most recent post ---------- */
  var ig = doc.getElementById('slot-ig');
  if (ig) {
    ig.appendChild(el('p', 'label', 'Latest on Instagram'));
    var post = safe.instagram((S.instagramPosts || []).filter(Boolean)[0]);
    if (post) {
      var wrap = el('div', 'ig-embed'), bq = doc.createElement('blockquote');
      bq.className = 'instagram-media'; bq.setAttribute('data-instgrm-permalink', post + '?utm_source=ig_embed&utm_campaign=loading');
      bq.setAttribute('data-instgrm-version', '14'); bq.setAttribute('data-instgrm-captioned', '');
      var fallback = el('a', 'link', 'View this post on Instagram'); fallback.href = post; fallback.target = '_blank'; fallback.rel = 'noopener';
      bq.appendChild(fallback); wrap.appendChild(bq); ig.appendChild(wrap);
      loadScript('https://www.instagram.com/embed.js', function () { if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process(); });
    } else {
      // a friendly card for visitors until a post is plugged in
      var card = el('a', 'slot-card'); card.href = 'https://www.instagram.com/' + handle + '/'; card.target = '_blank'; card.rel = 'noopener';
      card.appendChild(el('span', 'doodle', null)); card.firstChild.setAttribute('data-doodle', 'flower'); card.firstChild.setAttribute('data-size', '88');
      card.appendChild(el('span', 'w', 'Little moments, daily'));
      card.appendChild(el('span', 'd', 'Works in progress, pretty yarn and the odd chicken. Come and say hello.'));
      card.appendChild(el('span', 'go', '@' + handle + ' ↗'));
      ig.appendChild(card);
    }
  }

  /* ---------- Pinterest ---------- */
  var pin = doc.getElementById('slot-pin');
  if (pin) {
    var board = safe.pinterest(S.pinterestBoard);
    if (board) {
      pin.appendChild(el('p', 'label', 'Pinned lately'));
      var pa = el('a'); pa.href = board; pa.setAttribute('data-pin-do', 'embedBoard'); pa.setAttribute('data-pin-board-width', '340');
      pa.setAttribute('data-pin-scale-height', '400'); pa.setAttribute('data-pin-scale-width', '80'); pa.textContent = 'Planet Pearl on Pinterest';
      var pw = el('div', 'pin-embed'); pw.appendChild(pa); pin.appendChild(pw);
      loadScript('https://assets.pinterest.com/js/pinit.js');
    } else {
      pin.appendChild(el('p', 'label', 'With love'));
      var q = el('div', 'slot-card quote');
      q.appendChild(el('span', 'doodle', null)); q.firstChild.setAttribute('data-doodle', 'sprig'); q.firstChild.setAttribute('data-size', '88');
      q.appendChild(el('span', 'w', 'Let’s be kindred spirits.'));
      q.appendChild(el('span', 'd', 'Thank you for slowing down with me. Make yourself a cuppa and stay a while.'));
      pin.appendChild(q);
    }
  }
})();
