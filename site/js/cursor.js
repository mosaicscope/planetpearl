/* ==================================================================
   Planet Pearl — the flower cursor
   A little blossom that follows you, opens over links, closes when you
   press, and drops the odd petal as you wander. Mouse/trackpad only.
   ================================================================== */
(function () {
  'use strict';
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement, cur = document.getElementById('cursor');
  if (!cur) return;

  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-26 -26 52 52');
  var g = document.createElementNS(NS, 'g'); svg.appendChild(g);
  var petals = [];
  for (var i = 0; i < 5; i++) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'petal');
    p.setAttribute('d', 'M0,0 C-9,-7 -9,-21 0,-23 C9,-21 9,-7 0,0Z');
    p.setAttribute('transform', 'rotate(' + (i * 72) + ')');
    g.appendChild(p); petals.push(p);
  }
  var core = document.createElementNS(NS, 'circle'); core.setAttribute('class', 'core'); core.setAttribute('r', '4.2'); g.appendChild(core);
  for (var s = 0; s < 6; s++) {
    var ln = document.createElementNS(NS, 'line'), a = s * 60 * Math.PI / 180;
    ln.setAttribute('x1', Math.cos(a) * 4.5); ln.setAttribute('y1', Math.sin(a) * 4.5);
    ln.setAttribute('x2', Math.cos(a) * 8.5); ln.setAttribute('y2', Math.sin(a) * 8.5);
    ln.setAttribute('stroke', '#a8254f'); ln.setAttribute('stroke-width', '1'); ln.setAttribute('stroke-linecap', 'round');
    g.appendChild(ln);
  }
  cur.appendChild(svg);
  root.classList.add('has-cursor');

  var x = -100, y = -100, tx = -100, ty = -100, rot = 0, lastDrop = { x: 0, y: 0 }, moving = 0;
  var SEL = 'a,button,[role="button"],[role="slider"],.doodle,summary,label,.plogo';

  window.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY; moving = 1;
    var hot = e.target.closest && e.target.closest(SEL);
    cur.classList.toggle('hover', !!hot);
    if (!reduce && Math.hypot(tx - lastDrop.x, ty - lastDrop.y) > 70) { lastDrop.x = tx; lastDrop.y = ty; drop(tx, ty); }
  }, { passive: true });
  window.addEventListener('pointerdown', function () { cur.classList.add('down'); });
  window.addEventListener('pointerup', function (e) {
    cur.classList.remove('down');
    if (!reduce) for (var i = 0; i < 7; i++) drop(e.clientX, e.clientY, true);
  });
  document.addEventListener('pointerleave', function () { cur.style.opacity = 0; });
  document.addEventListener('pointerenter', function () { cur.style.opacity = 1; });

  function drop(px, py, burst) {
    var el = document.createElement('span'); el.className = 'fall';
    document.body.appendChild(el);
    var dx = burst ? (Math.random() - 0.5) * 120 : (Math.random() - 0.5) * 40;
    var dy = burst ? (Math.random() - 0.7) * 90 : 60 + Math.random() * 50;
    var r = Math.random() * 360;
    var an = el.animate([
      { transform: 'translate(' + px + 'px,' + py + 'px) rotate(' + r + 'deg) scale(1)', opacity: 0.95 },
      { transform: 'translate(' + (px + dx) + 'px,' + (py + dy + (burst ? 60 : 0)) + 'px) rotate(' + (r + 200) + 'deg) scale(.5)', opacity: 0 }
    ], { duration: burst ? 900 : 1700, easing: 'cubic-bezier(.2,.7,.3,1)' });
    an.onfinish = function () { el.remove(); };
  }

  function loop() {
    x += (tx - x) * 0.24; y += (ty - y) * 0.24;
    var vx = tx - x;
    rot += 0.35 + Math.abs(vx) * 0.05 + (cur.classList.contains('hover') ? 0.5 : 0);
    cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg)';
    requestAnimationFrame(loop);
  }
  loop();
})();
