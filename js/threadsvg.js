/* ==================================================================
   Planet Pearl — the drawn-thread version (light, fast, works on any
   phone). Same story: a ball of yarn unwinds, one pink thread follows
   you down the page, a little pearl bead leads the way.
   ================================================================== */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ease(t) { return t * t * (3 - 2 * t); }
  var PAL = ['#ffd9e2', '#ffb3c6', '#ff8fab', '#fb6f92', '#ff8fab', '#ffb3c6', '#ffd9e2'];

  function create(heroHost, opts) {
    var W, H, heroTravel, docH;

    /* ---------- hero ball (fixed on screen while it unwinds) ---------- */
    var svg = el('svg', { viewBox: '0 0 1000 1000', width: '100%', height: '100%', preserveAspectRatio: 'xMidYMid slice' }, heroHost);
    svg.style.position = 'absolute'; svg.style.inset = '0';
    var defs = el('defs', {}, svg);
    var rg = el('radialGradient', { id: 'pp-ball', cx: '38%', cy: '32%', r: '75%' }, defs);
    [['0', '#fff1f5'], ['.55', '#ffb3c6'], ['1', '#fb6f92']].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': s[1] }, rg); });
    var clip = el('clipPath', { id: 'pp-clip' }, defs); el('circle', { cx: 0, cy: 0, r: 250 }, clip);

    var ballG = el('g', {}, svg);
    var disc = el('circle', { cx: 0, cy: 0, r: 250, fill: 'url(#pp-ball)' }, ballG);
    var loops = el('g', { 'clip-path': 'url(#pp-clip)', fill: 'none', 'stroke-linecap': 'round' }, ballG);
    var ells = [], NL = 78;
    for (var i = 0; i < NL; i++) {
      var ry = 30 + ((i * 53) % 225);
      var e = el('ellipse', {
        cx: 0, cy: 0, rx: 262, ry: ry, transform: 'rotate(' + ((i * 37) % 180) + ')',
        stroke: PAL[i % PAL.length], 'stroke-width': 2.4 + (i % 3) * 0.9, opacity: .95
      }, loops);
      ells.push(e);
    }
    // stitched meridians + a few hand-drawn continents to make it a "world"
    var mer = el('g', { 'clip-path': 'url(#pp-clip)', fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-dasharray': '7 7', opacity: .55 }, ballG);
    [60, 130, 200].forEach(function (rx) { el('ellipse', { cx: 0, cy: 0, rx: rx, ry: 250 }, mer); });
    el('ellipse', { cx: 0, cy: 0, rx: 250, ry: 70 }, mer);
    var land = el('g', { 'clip-path': 'url(#pp-clip)', fill: '#fff1f5', 'fill-opacity': .7 }, ballG);
    el('path', { d: 'M-150,-70 C-120,-120 -60,-110 -40,-70 C-20,-30 -60,0 -80,40 C-100,80 -140,40 -150,-10 Z' }, land);
    el('path', { d: 'M20,-90 C70,-110 130,-70 120,-20 C110,30 60,20 40,70 C20,110 -10,60 0,10 C10,-30 -10,-60 20,-90 Z' }, land);
    el('path', { d: 'M110,90 C150,80 190,110 170,150 C150,180 100,160 110,90 Z' }, land);
    el('ellipse', { cx: -80, cy: -110, rx: 70, ry: 38, fill: '#fff', opacity: .28, transform: 'rotate(-28 -80 -110)' }, ballG);
    // the heroes' tail (hangs off the bottom of the screen)
    var tail = el('path', { d: '', fill: 'none', stroke: '#fb6f92', 'stroke-width': 9, 'stroke-linecap': 'round' }, svg);
    var tailPly = el('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '1 9', opacity: .6 }, svg);
    var heroBead = el('circle', { r: 11, fill: '#fff4f7', stroke: '#ff8fab', 'stroke-width': 2 }, svg);

    /* ---------- page-long thread overlay ---------- */
    var over = el('svg', { id: 'thread-svg', 'aria-hidden': 'true' }, document.body);
    var od = el('defs', {}, over);
    var lg = el('linearGradient', { id: 'pp-grad', gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 }, od);
    ['#ff8fab', '#fb6f92', '#ffb3c6', '#ff8fab', '#fb6f92', '#ffa0b8', '#ff8fab'].forEach(function (c, i, a) { el('stop', { offset: i / (a.length - 1), 'stop-color': c }, lg); });
    var cp = el('clipPath', { id: 'pp-reveal' }, od); var rect = el('rect', { x: 0, y: 0, width: 5000, height: 0 }, cp);
    var g = el('g', { 'clip-path': 'url(#pp-reveal)' }, over);
    var main = el('path', { d: '', fill: 'none', stroke: 'url(#pp-grad)', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
    var ply = el('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '1 9', opacity: .6 }, g);
    var bead = el('circle', { r: 11, fill: '#fff4f7', stroke: '#ff8fab', 'stroke-width': 2 }, over);
    var bow = el('g', { fill: 'none', stroke: '#fb6f92', 'stroke-width': 9, 'stroke-linecap': 'round' }, over);
    var samples = [];

    function layout() {
      W = window.innerWidth; H = window.innerHeight;
      heroTravel = opts.heroTravel ? opts.heroTravel() : H * 1.4;
      docH = Math.max(document.documentElement.scrollHeight, H * 3);
      over.setAttribute('width', W); over.setAttribute('height', docH);
      over.style.height = docH + 'px';
      over.setAttribute('viewBox', '0 0 ' + W + ' ' + docH);
      rect.setAttribute('width', W);

      // hero ball placement in the 1000x1000 "slice" space
      var big = W > 1000;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      var R = Math.min(H * 0.33, W * (big ? 0.26 : 0.36));
      var cx = W * (big ? 0.68 : 0.5), cy = H * (big ? 0.47 : 0.29);
      var sc = R / 250;
      ballG.setAttribute('data-cx', cx); ballG.setAttribute('data-cy', cy); ballG.setAttribute('data-sc', sc);
      ballG.setAttribute('data-ex', W * (big ? 0.64 : 0.5));

      // thread: starts at the bottom edge of the screen when the hero ends
      var x0 = W * (big ? 0.64 : 0.5), y0 = heroTravel + H;
      var yEnd = docH - H * 0.55, n = Math.max(5, Math.round((yEnd - y0) / (H * 0.55)));
      var amp = Math.min(W * 0.3, 420), pts = [[x0, y0]];
      for (var k = 1; k <= n; k++) {
        var dir = k % 2 ? -1 : 1, y = y0 + (yEnd - y0) * k / n;
        pts.push([k === n ? W * 0.5 : W * 0.5 + dir * amp * (0.55 + 0.45 * Math.sin(k * 1.9 + 0.5)), y]);
      }
      var d = 'M' + pts[0][0] + ',' + pts[0][1];
      for (var q = 1; q < pts.length; q++) {
        var a = pts[q - 1], b = pts[q], dy = (b[1] - a[1]) / 2;
        d += ' C' + a[0] + ',' + (a[1] + dy) + ' ' + b[0] + ',' + (b[1] - dy) + ' ' + b[0] + ',' + b[1];
      }
      main.setAttribute('d', d); ply.setAttribute('d', d);
      lg.setAttribute('y1', y0); lg.setAttribute('y2', yEnd);
      // sample for the bead position
      var tot = main.getTotalLength(); samples = [];
      for (var s = 0; s <= 400; s++) { var p = main.getPointAtLength(tot * s / 400); samples.push([p.x, p.y]); }
      // a bow at the end of the thread
      var bx = pts[pts.length - 1][0], by = pts[pts.length - 1][1];
      while (bow.firstChild) bow.removeChild(bow.firstChild);
      el('path', { d: 'M' + bx + ',' + by + ' c-70,-60 -110,-10 -60,30 c30,25 60,-5 60,-30 c0,25 30,55 60,30 c50,-40 10,-90 -60,-30 M' + bx + ',' + by + ' c-14,40 -30,70 -50,90 M' + bx + ',' + by + ' c14,40 34,70 56,86' }, bow);
      bow.setAttribute('class', 'bow-g');
      bow.style.opacity = 0;
      samples.endY = by;
    }

    function tipX(y) {
      var lo = 0, hi = samples.length - 1;
      while (lo < hi) { var m = (lo + hi) >> 1; if (samples[m][1] < y) lo = m + 1; else hi = m; }
      return samples[lo][0];
    }

    var lastKey = '';
    function update(sy, now) {
      var w = clamp(sy / heroTravel, 0, 1), we = ease(w);
      var key = sy.toFixed(1) + (sy < heroTravel + H ? now.toFixed(1) : '');
      if (key === lastKey) return;
      lastKey = key;

      // --- hero ball: shrink, spin, lose loops, grow the tail
      var cx = +ballG.getAttribute('data-cx'), cy = +ballG.getAttribute('data-cy'), sc = +ballG.getAttribute('data-sc');
      var s = sc * (1 - 0.3 * we), yOff = Math.max(0, sy - heroTravel);
      var rot = now * 4 + we * 520;
      var cyNow = cy - yOff;
      ballG.setAttribute('transform', 'translate(' + cx + ',' + cyNow + ') scale(' + s + ')');
      loops.setAttribute('transform', 'rotate(' + rot + ')');
      var keep = Math.round(NL * (1 - 0.78 * we));
      ells.forEach(function (e, i) { e.style.opacity = i < keep ? 0.95 : 0; });

      // tail from the ball's lower edge, swinging down to where the page thread begins
      var ex = +ballG.getAttribute('data-ex'), ey = H + 30;
      var bx = cx - 40 * s, by = cyNow + 236 * s;
      var len = 0.1 + 0.9 * we;
      var ty = by + (ey - by) * len, tx = bx + (ex - bx) * len;
      var d = 'M' + bx + ',' + by + ' C' + (bx - 70) + ',' + (by + (ty - by) * 0.4) + ' ' + (tx + (ex - bx) * 0.2 - 40) + ',' + (by + (ty - by) * 0.7) + ' ' + tx + ',' + ty;
      tail.setAttribute('d', d); tailPly.setAttribute('d', d);
      heroBead.setAttribute('cx', tx); heroBead.setAttribute('cy', ty);
      heroBead.style.opacity = we < 1 ? 1 : 0;

      // --- page thread: reveal down to 62% of the viewport
      var y0 = heroTravel + H;
      var tipY = Math.max(y0, sy + H * 0.62);
      tipY = Math.min(tipY, docH - H * 0.55);
      rect.setAttribute('height', tipY);
      bead.setAttribute('cx', tipX(tipY)); bead.setAttribute('cy', tipY);
      bead.style.opacity = sy + H * 0.62 > y0 && tipY < docH - H * 0.56 ? 1 : 0;
      bow.style.opacity = tipY >= docH - H * 0.56 ? 1 : 0;
    }

    layout();
    window.addEventListener('resize', function () { layout(); lastKey = ''; });
    return { update: update, layout: layout, destroy: function () { svg.remove(); over.remove(); } };
  }

  window.PPThread = { create: create };
})();
