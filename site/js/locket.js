/* ==================================================================
   Planet Pearl — the locket
   A little locked locket. Four numbers open it, and inside are the
   dev controls: plug in Instagram, Pinterest, SoundCloud and more.
   (The code is a gentle gate to keep curious visitors out, not real
   security: anything saved only lives in this browser until pasted
   into config.js with "Copy for the site".)
   ================================================================== */
(function () {
  'use strict';
  var doc = document, C = window.PP_CONFIG, Store = window.PPStore, NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, txt) { var n = doc.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function sv(tag, attrs, parent) { var n = doc.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  var HEART = 'M100,166 C40,120 10,88 10,52 C10,24 34,8 58,8 C78,8 92,20 100,34 C108,20 122,8 142,8 C166,8 190,24 190,52 C190,88 160,120 100,166 Z';
  var HEART_IN = 'M100,152 C48,112 22,84 22,53 C22,31 41,18 60,18 C77,18 90,28 100,42 C110,28 123,18 140,18 C159,18 178,31 178,53 C178,84 152,112 100,152 Z';

  function heartSvg(cls) {
    var svg = sv('svg', { viewBox: '0 0 200 190', 'class': cls || '', 'aria-hidden': 'true', focusable: 'false' });
    var defs = sv('defs', {}, svg), g = sv('linearGradient', { id: 'lkg' + (cls || ''), x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    sv('stop', { offset: 0, 'stop-color': '#fff4f7' }, g); sv('stop', { offset: 1, 'stop-color': '#ffc2d1' }, g);
    sv('path', { d: HEART, fill: 'url(#lkg' + (cls || '') + ')', stroke: '#3d1127', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, svg);
    sv('path', { d: HEART_IN, fill: 'none', stroke: '#a8254f', 'stroke-width': 1.2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }, svg);
    // a flower engraved on the front
    var f = sv('g', { transform: 'translate(100 84)', fill: '#ffb3c6', stroke: '#3d1127', 'stroke-width': 1.7, 'stroke-linejoin': 'round' }, svg);
    for (var i = 0; i < 5; i++) sv('path', { d: 'M0,0 C-9,-9 -8,-27 0,-29 C8,-27 9,-9 0,0Z', transform: 'rotate(' + (i * 72) + ')' }, f);
    sv('circle', { r: 5, fill: '#fff4f7' }, f);
    // tiny keyhole
    sv('path', { d: 'M100,118 a4.5,4.5 0 1,1 .1,0 M98,121 L96.5,132 L103.5,132 L102,121', fill: 'none', stroke: '#3d1127', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, svg);
    return svg;
  }

  /* ---------- the little locket in the corner ---------- */
  var trigger = el('button', 'lk-trigger'); trigger.type = 'button'; trigger.setAttribute('aria-label', 'Open the locket');
  var ts = sv('svg', { viewBox: '0 0 60 84', 'aria-hidden': 'true', focusable: 'false' }, trigger);
  sv('path', { d: 'M8,0 C14,26 24,34 30,38 C36,34 46,26 52,0', fill: 'none', stroke: '#3d1127', 'stroke-width': 1.3, 'stroke-dasharray': '1.5 3', 'stroke-linecap': 'round' }, ts);
  sv('circle', { cx: 30, cy: 40, r: 3.2, fill: 'none', stroke: '#3d1127', 'stroke-width': 1.5 }, ts);
  var tg = sv('g', { transform: 'translate(7 41) scale(.23)' }, ts);
  sv('path', { d: HEART, fill: '#ffc2d1', stroke: '#3d1127', 'stroke-width': 7, 'stroke-linejoin': 'round' }, tg);
  sv('path', { d: 'M100,60 a14,14 0 1,1 .1,0 M92,72 L88,104 L112,104 L108,72', fill: 'none', stroke: '#3d1127', 'stroke-width': 7, 'stroke-linejoin': 'round' }, tg);
  function revealed() {
    try {
      if (/[?&]locket\b/.test(location.search) || location.hash === '#locket') localStorage.setItem('pp_locket', '1');
      return localStorage.getItem('pp_locket') === '1';
    } catch (e) { return /[?&]locket\b/.test(location.search) || location.hash === '#locket'; }
  }
  trigger.hidden = !revealed();
  doc.body.appendChild(trigger);

  /* ---------- the modal ---------- */
  var modal = el('div', 'lk-modal'); modal.hidden = true; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'The locket');
  var scrim = el('div', 'lk-scrim'), stage = el('div', 'lk-stage'), close = el('button', 'lk-x', 'Close'); close.type = 'button';
  var lk = el('div', 'lk'), panel = el('div', 'lk-panel'), hl = el('div', 'lk-half l'), hr = el('div', 'lk-half r');
  hl.appendChild(heartSvg('hl')); hr.appendChild(heartSvg('hr'));
  lk.appendChild(panel); lk.appendChild(hl); lk.appendChild(hr);
  var wheels = el('div', 'lk-wheels'), hint = el('p', 'lk-hint', 'Four little numbers open it.');
  stage.appendChild(close); stage.appendChild(lk); stage.appendChild(wheels); stage.appendChild(hint);
  modal.appendChild(scrim); modal.appendChild(stage); doc.body.appendChild(modal);

  /* digit wheels */
  var digits = [0, 0, 0, 0], shown = [];
  [0, 1, 2, 3].forEach(function (i) {
    var w = el('div', 'lk-wheel'), up = el('button', 'u', '▲'), num = el('span', 'n', '0'), dn = el('button', 'd', '▼');
    up.type = dn.type = 'button'; up.setAttribute('aria-label', 'Digit ' + (i + 1) + ' up'); dn.setAttribute('aria-label', 'Digit ' + (i + 1) + ' down');
    up.addEventListener('click', function () { bump(i, 1); }); dn.addEventListener('click', function () { bump(i, -1); });
    w.addEventListener('wheel', function (e) { e.preventDefault(); bump(i, e.deltaY < 0 ? 1 : -1); }, { passive: false });
    w.appendChild(up); w.appendChild(num); w.appendChild(dn); wheels.appendChild(w); shown.push(num);
  });
  function paintDigits() { digits.forEach(function (d, i) { shown[i].textContent = d; }); }
  var checkTimer = 0;
  function bump(i, dir) { digits[i] = (digits[i] + dir + 10) % 10; paintDigits(); clearTimeout(checkTimer); checkTimer = setTimeout(check, 650); }
  function check() {
    if (digits.join('') === String(C.passcode)) unlock();
    else if (digits.join('') !== '0000') wrong();
  }
  function petals() {
    if (reduce) return;
    var r = lk.getBoundingClientRect();
    for (var i = 0; i < 9; i++) {
      var p = el('span', 'lk-petal'); p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top + r.height * 0.55) + 'px'; doc.body.appendChild(p);
      var dx = (Math.random() - 0.5) * 220, dy = 80 + Math.random() * 120;
      var an = p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 360) + 'deg)', opacity: 0 }], { duration: 1200 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
      an.onfinish = function (n) { return function () { n.remove(); }; }(p);
    }
  }
  function wrong() {
    lk.classList.remove('shake'); void lk.offsetWidth; lk.classList.add('shake'); hint.textContent = 'Not quite. Try again, gently.'; petals();
    digits = [0, 0, 0, 0]; setTimeout(paintDigits, 450);
  }

  /* ---------- the dev panel inside ---------- */
  var fields = {};
  function field(parent, key, label, type, help, ph) {
    var wrap = el('label', 'lk-f'), t = el('span', 'k', label), input = type === 'area' ? el('textarea') : el('input');
    if (type !== 'area') input.type = type || 'text'; else input.rows = 3;
    if (ph) input.placeholder = ph; input.autocomplete = 'off'; input.spellcheck = false;
    wrap.appendChild(t); wrap.appendChild(input); if (help) wrap.appendChild(el('span', 'h', help)); parent.appendChild(wrap); fields[key] = input; return input;
  }
  function buildPanel() {
    panel.textContent = '';
    var saved = Store.saved || {}, social = saved.social || {};
    panel.appendChild(el('p', 'label', 'The locket is open'));
    panel.appendChild(el('h3', null, 'Plug things in'));
    panel.appendChild(el('p', 'lk-note', 'Saved in this browser. Use “Copy for the site” to make it show for everyone.'));

    var g1 = el('fieldset', 'lk-g'); g1.appendChild(el('legend', null, 'Instagram'));
    field(g1, 'handle', 'Your handle', 'text', null, 'planetpearlliving').value = social.instagramHandle || C.social.instagramHandle || '';
    field(g1, 'posts', 'Latest post or reel links', 'area', 'Newest first. The first one shows beside the logo.', 'https://www.instagram.com/p/…').value = (social.instagramPosts || C.social.instagramPosts || []).join('\n');
    panel.appendChild(g1);

    var g2 = el('fieldset', 'lk-g'); g2.appendChild(el('legend', null, 'Pinterest'));
    field(g2, 'pin', 'Board link', 'url', 'Shows a board beside the logo.', 'https://www.pinterest.com/you/your-board/').value = social.pinterestBoard || C.social.pinterestBoard || '';
    panel.appendChild(g2);

    var g3 = el('fieldset', 'lk-g'); g3.appendChild(el('legend', null, 'Music for the gramophone'));
    field(g3, 'sc', 'SoundCloud playlist or track link', 'url', 'Only the little knobs show. Nothing else from SoundCloud appears.', 'https://soundcloud.com/you/sets/your-playlist').value = social.soundcloud || C.social.soundcloud || '';
    panel.appendChild(g3);

    var g4 = el('fieldset', 'lk-g'); g4.appendChild(el('legend', null, 'The site'));
    field(g4, 'ann', 'A line above the title', 'text', 'e.g. New pattern out Friday.').value = social.announcement || C.social.announcement || '';
    field(g4, 'email', 'Contact email', 'email').value = saved.email || C.email || '';
    field(g4, 'code', 'Discount code', 'text').value = saved.discountCode || C.discountCode || '';
    panel.appendChild(g4);

    var row = el('div', 'lk-row'), save = el('button', 'btn', 'Save & refresh'), copy = el('button', 'link', 'Copy for the site'), reset = el('button', 'link', 'Forget my changes'), lock = el('button', 'link', 'Lock again'), hideIt = el('button', 'link', 'Hide the locket');
    [save, copy, reset, lock, hideIt].forEach(function (b) { b.type = 'button'; row.appendChild(b); });
    hideIt.addEventListener('click', function () { try { localStorage.removeItem('pp_locket'); sessionStorage.removeItem('pp_unlocked'); } catch (e) {} msg.textContent = 'Hidden. Add ?locket to the address, or type the word locket, to bring it back.'; setTimeout(function () { location.replace(location.pathname); }, 1200); });
    var msg = el('p', 'lk-msg'); msg.setAttribute('aria-live', 'polite');
    panel.appendChild(row); panel.appendChild(msg);

    function collect() {
      var posts = [], bad = 0;
      fields.posts.value.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (u) { var ok = Store.safe.instagram(u); if (ok) posts.push(ok); else bad++; });
      var pin = fields.pin.value.trim(), sc = fields.sc.value.trim();
      var out = { social: { instagramHandle: fields.handle.value.trim().replace(/^@/, ''), instagramPosts: posts, pinterestBoard: Store.safe.pinterest(pin), soundcloud: Store.safe.soundcloud(sc), announcement: fields.ann.value.trim().slice(0, 120) }, email: fields.email.value.trim(), discountCode: fields.code.value.trim() };
      var warn = [];
      if (bad) warn.push(bad + ' Instagram link' + (bad > 1 ? 's' : '') + ' skipped (use a post or reel link)');
      if (pin && !out.social.pinterestBoard) warn.push('Pinterest link skipped (use a board link)');
      if (sc && !out.social.soundcloud) warn.push('SoundCloud link skipped (use a soundcloud.com link)');
      return { data: out, warn: warn };
    }
    save.addEventListener('click', function () {
      var r = collect(); if (!Store.save(r.data)) { msg.textContent = 'This browser would not let me save.'; return; }
      msg.textContent = (r.warn.length ? r.warn.join('. ') + '. ' : '') + 'Saved. Refreshing…'; setTimeout(function () { try { sessionStorage.setItem('pp_unlocked', '1'); } catch (e) {} location.reload(); }, r.warn.length ? 1600 : 500);
    });
    copy.addEventListener('click', function () {
      var text = Store.exportText(collect().data);
      var done = function () { msg.textContent = 'Copied. Paste it at the bottom of site/js/config.js (or send it to Claude) and publish.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this:', text); });
      else window.prompt('Copy this:', text);
    });
    reset.addEventListener('click', function () { Store.clear(); msg.textContent = 'Forgotten. Refreshing…'; setTimeout(function () { location.reload(); }, 500); });
    lock.addEventListener('click', function () { try { sessionStorage.removeItem('pp_unlocked'); } catch (e) {} lockUp(); });
  }

  /* ---------- open / close ---------- */
  function unlock() {
    buildPanel(); lk.classList.add('open'); wheels.hidden = true; hint.hidden = true; petals();
    try { sessionStorage.setItem('pp_unlocked', '1'); } catch (e) {}
  }
  function lockUp() {
    lk.classList.remove('open'); wheels.hidden = false; hint.hidden = false; hint.textContent = 'Four little numbers open it.'; digits = [0, 0, 0, 0]; paintDigits();
  }
  function open() {
    modal.hidden = false; doc.documentElement.classList.add('lk-lock');
    var was = false; try { was = sessionStorage.getItem('pp_unlocked') === '1'; } catch (e) {}
    if (was) unlock(); else lockUp();
    setTimeout(function () { (lk.classList.contains('open') ? panel.querySelector('input,textarea') : wheels.querySelector('button')).focus(); }, 60);
  }
  function shut() { modal.hidden = true; doc.documentElement.classList.remove('lk-lock'); trigger.focus(); }
  trigger.addEventListener('click', open);
  // typing the word "locket" anywhere (not in a form field) brings it out
  var typed = '';
  doc.addEventListener('keydown', function (e) {
    if (!modal.hidden || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === 'locket') { try { localStorage.setItem('pp_locket', '1'); } catch (er) {} trigger.hidden = false; typed = ''; open(); }
  });
  close.addEventListener('click', shut); scrim.addEventListener('click', shut);
  doc.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') shut();
    else if (!lk.classList.contains('open') && /^\d$/.test(e.key)) { digits.shift(); digits.push(+e.key); paintDigits(); clearTimeout(checkTimer); checkTimer = setTimeout(check, 450); }
  });
})();
