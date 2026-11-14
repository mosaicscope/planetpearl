/* ==================================================================
   Planet Pearl — the little things that make people stay a while
   - mood chips + "surprise me" that lead into the films
   - "pick up where you left off"
   - a hunt for six hidden pearls (the prize is the Craft Club code)
   - a thread of progress, a gentle nudge when someone goes quiet,
     and a cosy tab title. All quiet, all skippable.
   ================================================================== */
(function () {
  'use strict';
  var doc = document, C = window.PP_CONFIG, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, txt) { var n = doc.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function get(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- a quiet toast ---------- */
  var toast = el('div', 'toast'); toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); toast.hidden = true; doc.body.appendChild(toast);
  var toastTimer = 0;
  function say(text, action, ms) {
    toast.textContent = ''; toast.appendChild(el('span', 't', text));
    if (action) { var b = el('button', 'a', action.label); b.type = 'button'; b.addEventListener('click', function () { toast.hidden = true; action.fn(); }); toast.appendChild(b); }
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.addEventListener('click', function () { toast.hidden = true; }); toast.appendChild(x);
    toast.hidden = false; toast.classList.remove('in'); void toast.offsetWidth; toast.classList.add('in');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.hidden = true; }, ms || 6500);
  }
  doc.addEventListener('pp:say', function (e) { say(e.detail); });
  window.PPSay = say;

  /* ---------- moods: pick a feeling, land on films ---------- */
  var MOODS = [
    ['Cosy chats', ['cozy', 'cosy', 'catch up', 'podcast', 'journal', 'slow living', 'ramble', 'chat']],
    ['Quilting', ['quilt', 'kawandi', 'patchwork', 'irish chain']],
    ['Knitting', ['knit', 'sock', 'sweater', 'cardigan', 'hat', 'lamina', 'mittens', 'wrap']],
    ['Crochet', ['crochet', 'granny', 'hexie', 'snowflake']],
    ['Day trips', ['trip', 'road', 'hike', 'queenstown', 'glacier', 'rotorua', 'akaroa', 'oamaru', 'wanaka', 'hanmer', 'napier', 'dunedin', 'arthur', 'franz', 'hokitika', 'india', 'palmerston', 'gore bay']],
    ['Garden', ['garden', 'spring', 'botanical', 'bulbs', 'flowers']],
    ['Kitchen', ['recipe', 'curry', 'baking', 'bun', 'ginger', 'turmeric', 'masala', 'potato', 'kitchen', 'dumpling', 'smoothies', 'cooking']],
    ['Retreats', ['retreat', 'woolfeast', 'workshop', 'festival', 'fest', 'craft camp', 'knit and gather', 'event']]
  ];
  var host = doc.getElementById('moods');
  if (host && window.PPFilm) {
    host.appendChild(el('p', 'mo-k', 'What are you in the mood for?'));
    var row = el('div', 'mo-row'), chosen = null;
    function pred(words) { return function (t) { for (var i = 0; i < words.length; i++) if (t.indexOf(words[i]) > -1) return true; return false; }; }
    MOODS.forEach(function (m) {
      var b = el('button', 'chip', m[0]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (chosen === b) { chosen = null; b.setAttribute('aria-pressed', 'false'); window.PPFilm.mood(null); return; }
        if (chosen) chosen.setAttribute('aria-pressed', 'false');
        chosen = b; b.setAttribute('aria-pressed', 'true'); window.PPFilm.mood(pred(m[1]), m[0].toLowerCase());
        say('Here are the ' + m[0].toLowerCase() + ' films.', { label: 'Surprise me', fn: function () { window.PPFilm.surprise(pred(m[1])); } }, 7000);
      });
      row.appendChild(b);
    });
    var sur = el('button', 'chip hot', '✿ Surprise me'); sur.type = 'button';
    sur.addEventListener('click', function () { window.PPFilm.surprise(chosen ? pred(MOODS.filter(function (m) { return m[0] === chosen.textContent; })[0][1]) : null); });
    row.appendChild(sur); host.appendChild(row);
    var last = null; try { last = JSON.parse(get('pp_last', 'null')); } catch (e) {}
    if (last && last.id) {
      var cont = el('button', 'cont'); cont.type = 'button';
      cont.appendChild(el('span', 'k', 'Pick up where you left off')); cont.appendChild(el('span', 'w', last.title)); cont.appendChild(el('span', 'arr', '↗'));
      cont.addEventListener('click', function () { window.PPFilm.open(last.id, last.title); });
      host.appendChild(cont);
    }
  }
  // quick "surprise me" right in the hero
  var heroSur = doc.getElementById('hero-surprise');
  if (heroSur) heroSur.addEventListener('click', function (e) { e.preventDefault(); if (window.PPFilm) window.PPFilm.surprise(); });

  /* ---------- the pearl hunt ---------- */
  var SPOTS = [
    ['.hero-copy .lede', 96, -8], ['#about .big', 6, 90], ['.index li:nth-child(4) .t', 100, 30],
    ['.interlude .calli-ta', 6, 20], ['#shop .plate-no', 90, 50], ['.bow .script', 100, 40]
  ];
  var found = []; try { found = JSON.parse(get('pp_pearls', '[]')) || []; } catch (e) {}
  var pill = null;
  function pillUpdate() {
    if (!pill) { pill = el('div', 'pearl-pill'); pill.setAttribute('aria-live', 'polite'); doc.body.appendChild(pill); }
    pill.textContent = '● ' + found.length + ' / ' + SPOTS.length + ' pearls'; pill.classList.add('on');
    clearTimeout(pill._t); pill._t = setTimeout(function () { pill.classList.remove('on'); }, found.length >= SPOTS.length ? 9000 : 3500);
  }
  function celebrate() {
    var code = C.discountCode || '';
    say('You found every pearl! Use ' + code + ' for 10% off a Craft Club kit.', { label: 'Take me there', fn: function () { window.open(C.links.craftclub, '_blank', 'noopener'); } }, 14000);
    for (var i = 0; i < 18 && !reduce; i++) (function (k) {
      setTimeout(function () {
        var p = el('span', 'pearl-bit'); p.style.left = (10 + Math.random() * 80) + 'vw'; p.style.top = '-12px'; doc.body.appendChild(p);
        var an = p.animate([{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(' + (60 + Math.random() * 40) + 'vh) scale(.6)', opacity: 0 }], { duration: 1600 + Math.random() * 900, easing: 'cubic-bezier(.3,.6,.4,1)' });
        an.onfinish = function () { p.remove(); };
      }, k * 70);
    })(i);
  }
  if (found.length < SPOTS.length) {
    SPOTS.forEach(function (sp, i) {
      if (found.indexOf(i) > -1) return;
      var anchor = doc.querySelector(sp[0]); if (!anchor) return;
      var cs = getComputedStyle(anchor); if (cs.position === 'static') anchor.style.position = 'relative';
      var b = el('button', 'pearl'); b.type = 'button'; b.setAttribute('aria-label', 'A hidden pearl. Collect it.');
      b.style.left = sp[1] + '%'; b.style.top = sp[2] + '%'; b.style.animationDelay = (i * 0.7) + 's';
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (found.indexOf(i) < 0) found.push(i); set('pp_pearls', JSON.stringify(found));
        b.classList.add('got'); setTimeout(function () { b.remove(); }, 600);
        pillUpdate(); if (found.length === SPOTS.length) setTimeout(celebrate, 500);
      });
      anchor.appendChild(b);
    });
    if (get('pp_hint', '') !== '1') setTimeout(function () { say('Psst. Six little pearls are hiding on this page. Find them all for a surprise.'); set('pp_hint', '1'); }, 28000);
  }

  /* ---------- a thread of progress along the very top ---------- */
  var bar = el('div', 'thread-bar'); bar.setAttribute('aria-hidden', 'true'); doc.body.appendChild(bar);
  function prog() { var h = doc.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  window.addEventListener('scroll', prog, { passive: true }); prog();

  /* ---------- a cosy tab title ---------- */
  var title = doc.title;
  doc.addEventListener('visibilitychange', function () { doc.title = doc.hidden ? 'Come back, the kettle’s on ☕' : title; });

  /* ---------- a gentle nudge when someone goes quiet ---------- */
  var idleMs = 0, nudges = parseInt(get('pp_nudges', '0'), 10) || 0, lastAct = Date.now(), lbOpen = false;
  ['scroll', 'pointermove', 'keydown', 'touchstart', 'click'].forEach(function (ev) { window.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true }); });
  setInterval(function () {
    lbOpen = doc.documentElement.classList.contains('lb-open') || doc.documentElement.classList.contains('lk-lock');
    if (doc.hidden || lbOpen || nudges >= 2 || !window.PPFilm) return;
    if (Date.now() - lastAct > 32000) {
      nudges++; set('pp_nudges', String(nudges)); lastAct = Date.now();
      say('Kettle on? Here is a film for the cosy hour.', { label: 'Play me something', fn: function () { window.PPFilm.surprise(); } }, 12000);
    }
  }, 4000);
})();
