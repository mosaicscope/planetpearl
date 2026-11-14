/* ==================================================================
   Planet Pearl — the film reel: a featured film, a draggable filmstrip
   of the channel, and a lightbox player (YouTube loads only on click).
   ================================================================== */
(function () {
  'use strict';
  var V = window.PP_VIDEOS, doc = document;
  var feature = doc.getElementById('feature'), strip = doc.getElementById('strip');
  if (!V || !feature || !strip) return;

  function thumb(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.textContent = html; return n; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmt(d) { var p = (d || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0] : ''; }
  function secs(t) { var p = (t || '0').split(':').map(Number), s = 0; for (var i = 0; i < p.length; i++) s = s * 60 + p[i]; return s; }
  function hm(s) { var h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? h + 'h ' + m + 'm' : m + 'm'; }

  /* ---------- hover to preview: a muted, looping clip plays right inside the thumbnail ---------- */
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var active = null;
  function stopPreview() {
    if (!active) return;
    var a = active; active = null; clearTimeout(a.t);
    a.card.classList.remove('previewing');
    if (a.frame) { var f = a.frame; f.classList.remove('on'); setTimeout(function () { f.remove(); }, 500); }
  }
  function startPreview(card, box, id) {
    stopPreview();
    var f = doc.createElement('iframe'); f.className = 'pv'; f.title = ''; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    f.allow = 'autoplay; encrypted-media'; f.loading = 'lazy';
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=' + id + '&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&start=6';
    box.appendChild(f); active = { card: card, frame: f, t: 0 };
    f.addEventListener('load', function () { f.classList.add('on'); card.classList.add('previewing'); });
  }
  function attachPreview(card, box, id) {
    if (!canHover) return;
    var timer = 0;
    card.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      clearTimeout(timer);
      timer = setTimeout(function () { startPreview(card, box, id); }, 420);
    });
    card.addEventListener('pointerleave', function () { clearTimeout(timer); if (active && active.card === card) stopPreview(); });
    card.addEventListener('focusout', function () { clearTimeout(timer); if (active && active.card === card) stopPreview(); });
  }

  /* ---------- featured: the newest film ---------- */
  var f = V.list[0];
  var fb = el('button', 'feat-btn'); fb.type = 'button'; fb.setAttribute('aria-label', 'Play: ' + f[1]);
  var fi = el('span', 'feat-img'); var im = el('img'); im.src = thumb(f[0]); im.alt = ''; im.loading = 'eager'; fi.appendChild(im);
  fi.appendChild(el('span', 'play')); fi.appendChild(el('span', 'dur', f[2]));
  var ft = el('span', 'feat-txt');
  ft.appendChild(el('span', 'k', 'Latest film · ' + fmt(f[3])));
  ft.appendChild(el('span', 'w', f[1]));
  ft.appendChild(el('span', 'go', 'Watch now ↗'));
  fb.appendChild(fi); fb.appendChild(ft);
  fb.addEventListener('click', function () { stopPreview(); open(f[0], f[1]); });
  attachPreview(fb, fi, f[0]);
  feature.appendChild(fb);
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var fTimer = 0;
    new IntersectionObserver(function (en) {
      clearTimeout(fTimer);
      if (en[0].isIntersecting && en[0].intersectionRatio > 0.6) fTimer = setTimeout(function () { if (!active) startPreview(fb, fi, f[0]); }, 1100);
      else if (active && active.card === fb) stopPreview();
    }, { threshold: [0, 0.6, 1] }).observe(fb);
  }

  /* ---------- filmstrip ---------- */
  var STRIP_N = 30;
  function cellFor(v, i, extra) {
    var c = el('button', 'cell' + (extra || '')); c.type = 'button'; c.setAttribute('aria-label', 'Play: ' + v[1]);
    var th = el('span', 'th'); var img = el('img'); img.src = thumb(v[0]); img.alt = ''; img.loading = 'lazy'; img.draggable = false; th.appendChild(img);
    th.appendChild(el('span', 'play')); th.appendChild(el('span', 'dur', v[2]));
    c.appendChild(th);
    c.appendChild(el('span', 'no', fmt(v[3])));
    c.appendChild(el('span', 'ti', v[1]));
    c.addEventListener('click', function () { if (!dragged) { stopPreview(); open(v[0], v[1]); } });
    attachPreview(c, th, v[0]);
    return c;
  }
  V.list.slice(0, STRIP_N).forEach(function (v, i) { strip.appendChild(cellFor(v, i, ' reveal')); });

  var step = function () { return Math.max(260, strip.clientWidth * 0.8); };
  doc.getElementById('prev').addEventListener('click', function () { strip.scrollBy({ left: -step(), behavior: 'smooth' }); });
  doc.getElementById('next').addEventListener('click', function () { strip.scrollBy({ left: step(), behavior: 'smooth' }); });

  // drag to scroll with a mouse
  var down = false, sx = 0, sl = 0, dragged = false;
  strip.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; dragged = false; sx = e.clientX; sl = strip.scrollLeft; });
  window.addEventListener('pointermove', function (e) {
    if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) { dragged = true; strip.classList.add('drag'); }
    strip.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', function () { down = false; strip.classList.remove('drag'); setTimeout(function () { dragged = false; }, 0); });

  /* ---------- lightbox ---------- */
  var lb = el('div', 'lb'); lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Video player');
  var box = el('div', 'lb-box'), frame = el('div', 'lb-frame'), cap = el('p', 'lb-cap'), yt = el('a', 'link', 'Open on YouTube ↗');
  yt.target = '_blank'; yt.rel = 'noopener';
  var x = el('button', 'lb-x', 'Close'); x.type = 'button';
  box.appendChild(x); box.appendChild(frame); box.appendChild(cap); box.appendChild(yt); lb.appendChild(box); doc.body.appendChild(lb);
  var last = null;
  function show(src, title, href) {
    last = doc.activeElement;
    frame.textContent = '';
    var ifr = doc.createElement('iframe');
    ifr.src = src; ifr.title = title; ifr.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen'; ifr.allowFullscreen = true;
    frame.appendChild(ifr); cap.textContent = title; yt.href = href;
    lb.hidden = false; doc.documentElement.classList.add('lb-open'); x.focus();
  }
  function open(id, title) {
    try { localStorage.setItem('pp_last', JSON.stringify({ id: id, title: title })); } catch (e) {}
    doc.dispatchEvent(new CustomEvent('pp:played', { detail: { id: id, title: title } }));
    show('https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1', title, 'https://www.youtube.com/watch?v=' + id);
  }
  function close() {
    lb.hidden = true; frame.textContent = ''; doc.documentElement.classList.remove('lb-open');
    if (last && last.focus) last.focus();
  }
  x.addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });

  window.PPFilm = {
    open: function (id, title) { stopPreview(); open(id, title); },
    surprise: function (pred) {
      var pool = V.list.filter(function (v) { return !pred || pred(v[1].toLowerCase()); });
      var v = pool[(Math.random() * pool.length) | 0];
      if (v) { stopPreview(); open(v[0], v[1]); } return v;
    },
    mood: function () {}
  };
  /* ---------- the whole archive: chapters, newest first, with search ---------- */
  var CHAPTERS = [
    { from: '2026-01-01', yr: '2026', t: 'Pockets of peace', b: 'A year of little moments: knitting, quilting and community, Woolfeast and a Dunedin yarn retreat, a Peggy Square blanket, a trip home to India for Pongal, and an emotional support chicken.' },
    { from: '2025-01-01', yr: '2025', t: 'Home sweet home', b: 'The year the fifteen-year quilt was finally finished, with Kiwi yarn adventures, road trips to Queenstown, the glaciers and Rotorua, and a slow Advent to close.' },
    { from: '2024-01-01', yr: '2024', t: 'Crafting with intention', b: 'The Slow Maker\u2019s Journal, a garden in bloom, Oamaru and the dolphins of Akaroa, and a Vlogmas made of tiny daily films.' },
    { from: '2023-01-01', yr: '2023', t: 'Postcards & yarn stores', b: 'Postcards from summer and spring, fabric and yarn store tours, a Wanaka trip, Woolfeast, and Christmas at home and in India.' },
    { from: '2022-01-01', yr: '2022', t: 'A quieter year', b: 'Fewer films, more living: a Kawandi workshop, a community garden, Newton Falls and a winter wardrobe.' },
    { from: '2021-01-01', yr: '2021', t: 'Retreats & 200 friends', b: 'Maker\u2019s Journal podcasts nine to fourteen, stitching retreats in Christchurch and Auckland, and a giveaway to celebrate 200 subscribers.' },
    { from: '2020-01-01', yr: '2020', t: 'The garden begins', b: 'The first Planet Pearl intro, a backyard garden, a desk tour, yarn store visits and a silent Vlogmas.' },
    { from: '2019-01-01', yr: '2019', t: 'A maker\u2019s life', b: 'The podcast years: Maker\u2019s Life episodes one to five, learning to knit socks, craft camps, fibre festivals and twelve days of Vlogmas.' },
    { from: '0000-01-01', yr: '2016 \u2013 2018', t: 'The first little films', b: 'Where it began: a spring in the garden city, a botanical garden tour, a South Island trip, simple home recipes and Vlogmas 2018.' }
  ];
  var grid = doc.getElementById('vgrid'), q = doc.getElementById('q'), more = doc.getElementById('more'), count = doc.getElementById('count');
  if (grid && q) {
    if (more) more.parentNode.hidden = true;
    grid.className = 'timeline';
    var items = V.list.map(function (v, i) { return { v: v, i: i }; });
    var groups = CHAPTERS.map(function (c) { return { c: c, rows: [] }; });
    items.forEach(function (r) { for (var k = 0; k < CHAPTERS.length; k++) { if (r.v[3] >= CHAPTERS[k].from) { groups[k].rows.push(r); break; } } });
    var span = function (rows) { var a = rows[rows.length - 1].v[3], b = rows[0].v[3]; var pa = a.split('-'), pb = b.split('-'); var ma = MON[+pa[1] - 1], mb = MON[+pb[1] - 1];
      return ma === mb && pa[0] === pb[0] ? ma + ' ' + pa[0] : (pa[0] === pb[0] ? ma + ' \u2013 ' + mb + ' ' + pb[0] : ma + ' ' + pa[0] + ' \u2013 ' + mb + ' ' + pb[0]); };
    var renderChapters = function () {
      grid.textContent = '';
      groups.forEach(function (g, gi) {
        if (!g.rows.length) return;
        var sec = el('section', 'chapter reveal');
        var head = el('header', 'ch-head');
        head.appendChild(el('span', 'ch-yr', g.c.yr));
        var meta = el('div', 'ch-meta');
        meta.appendChild(el('h3', null, g.c.t));
        meta.appendChild(el('p', 'ch-b', g.c.b));
        var total = g.rows.reduce(function (s, r) { return s + secs(r.v[2]); }, 0);
        meta.appendChild(el('p', 'ch-n', g.rows.length + (g.rows.length === 1 ? ' film' : ' films') + ' \u00b7 ' + span(g.rows) + ' \u00b7 ' + hm(total) + ' of watching'));
        head.appendChild(meta); sec.appendChild(head);
        var gr = el('div', 'vgrid-in'); sec.appendChild(gr);
        var first = gi === 0 ? 12 : 6, shownN = 0;
        var add = function (n) { g.rows.slice(shownN, shownN + n).forEach(function (r) { gr.appendChild(cellFor(r.v, r.i, '')); }); shownN = Math.min(g.rows.length, shownN + n); btn.hidden = shownN >= g.rows.length; };
        var btn = el('button', 'link ch-more', 'Show all ' + g.rows.length + ' films \u2193'); btn.type = 'button';
        btn.addEventListener('click', function () { add(g.rows.length); });
        sec.appendChild(btn); add(first);
        grid.appendChild(sec);
      });
      count.textContent = V.list.length + ' films, ' + hm(V.list.reduce(function (s, v) { return s + secs(v[2]); }, 0)) + ' of watching';
    };
    var renderSearch = function (t) {
      grid.textContent = '';
      var res = items.filter(function (r) { return r.v[1].toLowerCase().indexOf(t) > -1; });
      count.textContent = res.length + ' of ' + V.list.length + ' films';
      if (!res.length) { grid.appendChild(el('p', 'empty', 'Nothing with that word yet. Try yarn, quilt, retreat or garden.')); return; }
      var gr = el('div', 'vgrid-in'); res.forEach(function (r) { gr.appendChild(cellFor(r.v, r.i, '')); }); grid.appendChild(gr);
    };
    var renderFiltered = function (pred, label) {
      grid.textContent = '';
      var res = items.filter(function (r) { return pred(r.v[1].toLowerCase()); });
      count.textContent = res.length + (res.length === 1 ? ' film' : ' films') + ' · ' + label;
      if (!res.length) { grid.appendChild(el('p', 'empty', 'Nothing here yet.')); return; }
      var gr = el('div', 'vgrid-in'); res.forEach(function (r) { gr.appendChild(cellFor(r.v, r.i, '')); }); grid.appendChild(gr);
    };
    window.PPFilm.mood = function (pred, label) {
      if (!pred) { q.value = ''; renderChapters(); return; }
      q.value = ''; renderFiltered(pred, label);
      var target = doc.getElementById('q'); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    q.addEventListener('input', function () { var t = q.value.trim().toLowerCase(); if (t) renderSearch(t); else renderChapters(); });
    renderChapters();
  }

  window.PPFilm = window.PPFilm || {};
  var all = doc.getElementById('playall');
  if (all) all.addEventListener('click', function () {
    show('https://www.youtube-nocookie.com/embed/videoseries?list=' + V.uploadsPlaylist + '&autoplay=1&rel=0', 'Every Planet Pearl film, newest first', 'https://www.youtube.com/@planetpearl/videos');
  });
})();
