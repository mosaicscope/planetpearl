/* ==================================================================
   Planet Pearl — page behaviour
   ================================================================== */
(function () {
  'use strict';
  var C = window.PP_CONFIG, doc = document, root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* ---------- links & contact from config ---------- */
  doc.querySelectorAll('[data-link]').forEach(function (a) { a.href = C.links[a.dataset.link] || '#'; });
  doc.querySelectorAll('[data-code]').forEach(function (n) { n.textContent = C.discountCode; });
  doc.querySelectorAll('[data-contact]').forEach(function (a) {
    var topic = a.dataset.contact;
    if (C.email) {
      a.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(topic + ' · Planet Pearl');
    } else { a.href = C.instagramDM; a.target = '_blank'; a.rel = 'noopener'; }
  });
  doc.querySelectorAll('[data-mail]').forEach(function (a) {
    if (C.email) { a.href = 'mailto:' + C.email; a.textContent = C.email; }
  });

  /* ---------- which hero? film + live rope, or the drawn fallback ---------- */
  function webgl() {
    try { var c = doc.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  var params = new URLSearchParams(location.search), mode = params.get('mode');
  var lowEnd = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  if (mode !== 'film' && mode !== 'svg') mode = (!reduce && !lowEnd && webgl() && window.THREE) ? 'film' : 'svg';
  if (mode === 'film' && !(webgl() && window.THREE)) mode = 'svg';
  root.dataset.mode = mode;

  var hero = doc.querySelector('.hero'), film = doc.getElementById('film'), F = C.film;
  function heroTravel() { return Math.max(200, hero.offsetHeight - window.innerHeight); }
  function filmRect() {
    var r = film.getBoundingClientRect();
    return { left: r.left, width: r.width, tailXFrac: F.tailXFrac };
  }

  /* ---------- the Blender film: frames scrubbed by scroll ---------- */
  var frames = [], ctx = null, shown = -1;
  function frameUrl(i) { return F.dir + String(i).padStart(F.pad, '0') + '.' + F.ext; }
  function initFilm() {
    film.width = F.w; film.height = F.h; ctx = film.getContext('2d');
    var first = new Image();
    first.onload = function () { frames[0] = first; draw(0, true); loadRest(); };
    first.onerror = function () { switchToDrawn(); };
    first.src = frameUrl(0);
  }
  function loadRest() {
    // load outward from the start so the first scrolls are smooth
    var i = 1;
    (function next() {
      var batch = 0;
      while (i < F.frames && batch < 4) {
        (function (k) { var im = new Image(); im.onload = function () { frames[k] = im; }; im.src = frameUrl(k); })(i);
        i++; batch++;
      }
      if (i < F.frames) setTimeout(next, 30);
    })();
  }
  function draw(idx, force) {
    var k = idx;
    while (k > 0 && !frames[k]) k--;
    if (k === shown && !force) return;
    if (!frames[k]) return;
    shown = k; ctx.clearRect(0, 0, F.w, F.h); ctx.drawImage(frames[k], 0, 0);
  }

  var engine = null, sm = window.scrollY;
  function startDrawn() {
    root.dataset.mode = 'svg'; mode = 'svg';
    engine = window.PPThread.create(doc.getElementById('ball2d'), { heroTravel: heroTravel });
  }
  function switchToDrawn() {
    if (mode === 'svg') return;
    if (engine && engine.destroy) engine.destroy();
    startDrawn();
  }
  try {
    if (mode === 'film') {
      initFilm();
      engine = window.PPYarn.create(doc.getElementById('stage'), {
        heroTravel: heroTravel, filmRect: filmRect,
        footerH: function () { return doc.querySelector('.foot').offsetHeight; },
        endY: function () { var e = doc.querySelector('.bow'); if (!e) return doc.documentElement.scrollHeight - 400; var r = e.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; }
      });
    } else startDrawn();
  } catch (err) {
    console.warn('3D rope failed, using the drawn thread', err);
    startDrawn();
  }

  /* ---------- main loop ---------- */
  var copy = doc.querySelector('.hero-copy'), pull = doc.querySelector('.pull');
  var px = 0, py = 0, tpx = 0, tpy = 0;
  window.addEventListener('pointermove', function (e) {
    tpx = (e.clientX / window.innerWidth - 0.5) * 2; tpy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  function frame(t) {
    var target = window.scrollY;
    var dt = Math.min(0.1, Math.max(0.001, (t - (frame.last || t)) / 1000)); frame.last = t;
    sm += (target - sm) * (reduce ? 1 : 1 - Math.exp(-dt * 14));
    if (Math.abs(target - sm) < 0.05) sm = target;
    var changed = engine.update(sm, t / 1000);
    if (mode === 'film') {
      if (changed !== false) engine.render();
      var w = Math.min(1, Math.max(0, sm / heroTravel()));
      draw(Math.round(w * (F.frames - 1)));
      px += (tpx - px) * 0.05; py += (tpy - py) * 0.05;
      if (sm < heroTravel()) film.style.transform = (window.innerWidth <= 900 ? 'translateX(50%) ' : '') + 'translate3d(' + (px * -9) + 'px,' + (py * -6) + 'px,0)';
    }
    var p = Math.min(1, Math.max(0, sm / (heroTravel() * 0.38)));
    copy.style.opacity = String(1 - p);
    copy.style.transform = 'translateY(' + (p * -28) + 'px)';
    if (pull) pull.style.opacity = String(1 - Math.min(1, sm / 120));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function relayout() { if (engine && engine.layout) engine.layout(); }
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);
  var lastH = 0;
  setInterval(function () { var h = root.scrollHeight; if (h !== lastH) { lastH = h; relayout(); } }, 1200);

  /* ---------- nav ---------- */
  var nav = doc.getElementById('nav'), menuBtn = doc.getElementById('menu-btn'), links = doc.getElementById('nav-links');
  function navState() { nav.classList.toggle('solid', window.scrollY > 40); }
  navState(); window.addEventListener('scroll', navState, { passive: true });
  menuBtn.addEventListener('click', function () {
    var open = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- doodles: hand-drawn SVG, drawn on as they appear ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function path(parent, d, cls, delay) {
    var p = doc.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.setAttribute('class', cls || 'st');
    if (delay) p.style.transitionDelay = delay + 's';
    parent.appendChild(p); return p;
  }
  var DOODLES = {
    flower: function (g) {
      var R = 40, w = 17;
      for (var i = 0; i < 5; i++) {
        var d = 'M0,0 C' + (-w) + ',' + (-R * .35) + ' ' + (-w * .85) + ',' + (-R * .92) + ' 0,' + (-R) + ' C' + (w * .85) + ',' + (-R * .92) + ' ' + w + ',' + (-R * .35) + ' 0,0 Z';
        var gp = doc.createElementNS(SVGNS, 'g'); gp.setAttribute('transform', 'rotate(' + (i * 72) + ')');
        var fill = path(gp, d, 'fl'); fill.removeAttribute('pathLength'); fill.style.stroke = 'none';
        path(gp, d, 'st', i * 0.12);
        path(gp, 'M0,-8 L0,-' + (R * .62), 'st', .5 + i * 0.1);
        g.appendChild(gp);
      }
      path(g, 'M-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0', 'st', .9);
    },
    heart: function (g) {
      path(g, 'M0,28 C-48,-4 -30,-40 0,-16 C30,-40 48,-4 0,28 Z', 'st');
      path(g, 'M-14,-8 C-20,-18 -8,-24 -2,-14', 'st', .6);
    },
    sprig: function (g) {
      path(g, 'M0,44 C4,20 -2,0 6,-40', 'st');
      [[2, 22, -26, 10], [3, 6, 26, -2], [5, -14, -24, -4], [6, -28, 22, -14]].forEach(function (L, i) {
        var x = L[0], y = L[1], dx = L[2], dy = L[3];
        path(g, 'M' + x + ',' + y + ' Q' + (x + dx * .4) + ',' + (y - 16) + ' ' + (x + dx) + ',' + (y + dy) +
                ' Q' + (x + dx * .5) + ',' + (y + 14) + ' ' + x + ',' + y, 'st', .3 + i * .18);
      });
    },
    needles: function (g) {
      path(g, 'M-34,34 L30,-34', 'st'); path(g, 'M34,34 L-30,-34', 'st', .25);
      path(g, 'M30,-34 a4,4 0 1,1 .1,0', 'st', .6); path(g, 'M-30,-34 a4,4 0 1,0 .1,0', 'st', .7);
      path(g, 'M-14,22 C-4,6 10,16 18,2 C24,-8 14,-14 6,-8', 'st', .9);
    },
    // a curling fern frond, in the spirit of the bush at home
    fern: function (g) {
      path(g, 'M-6,46 C-8,20 -4,-10 8,-30 C18,-44 34,-40 34,-26 C34,-14 20,-12 18,-22', 'st');
      for (var i = 0; i < 6; i++) {
        var t = i / 5, yy = 38 - t * 62, xx = -6 + t * 10 + Math.sin(t * 3) * 3, len = 20 - t * 8;
        path(g, 'M' + xx + ',' + yy + ' q-' + len * .5 + ',-4 -' + len + ',-1', 'st', .25 + i * .12);
        path(g, 'M' + xx + ',' + yy + ' q' + len * .5 + ',-5 ' + len + ',-3', 'st', .3 + i * .12);
      }
    }
  };
  doc.querySelectorAll('[data-doodle]').forEach(function (host) {
    var kind = host.dataset.doodle, size = +host.dataset.size || 80;
    var svg = doc.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '-56 -56 112 112'); svg.setAttribute('width', size); svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var g = doc.createElementNS(SVGNS, 'g'); svg.appendChild(g); host.appendChild(svg);
    if (DOODLES[kind]) DOODLES[kind](g);
    host.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var r = host.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (var i = 0; i < 9; i++) {
        var p = doc.createElement('span'); p.className = 'pearl';
        var ang = i / 9 * Math.PI * 2, dist = 40 + Math.random() * 40;
        p.style.left = cx + 'px'; p.style.top = cy + 'px';
        p.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
        doc.body.appendChild(p); setTimeout(function (n) { n.remove(); }, 1200, p);
      }
    });
  });

  /* ---------- reveal on scroll ---------- */
  var targets = doc.querySelectorAll('.reveal, .write, .doodle');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else targets.forEach(function (t) { t.classList.add('in'); });
  setTimeout(function () { var h = doc.querySelector('h1 .write'); if (h) h.classList.add('in'); }, 300);
})();
