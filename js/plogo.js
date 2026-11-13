/* ==================================================================
   Planet Pearl — the living logo
   The bird hops, and flies a lap around the heart chirping little music
   notes. The yarn ball wobbles when you hover and spins when you click.
   Sound only plays after a click or tap (never on its own).
   ================================================================== */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DIR = 'assets/logo/';

  // where the bird sits at rest and the lap it flies, as % of the logo box
  var REST = [11.45, 37.6];
  var PATH = [[11.45, 37.6], [5, 24], [12, 8], [27, 4], [43, 13], [52, 28], [62, 12], [80, 5], [93, 16], [95, 35], [87, 53], [74, 65], [58, 75], [40, 73], [24, 61], [13, 47], [11.45, 37.6]];
  var NOTES = ['♪', '♫', '♬', '♩'];
  var COLORS = ['#fb6f92', '#a8254f', '#ff8fab', '#7a2a4a', '#f2a900'];

  /* ---------- sound: tiny synthesised chirps and needle clicks ---------- */
  var ac = null;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function chirp(n) {
    var a = audio(); if (!a) return;
    var t = a.currentTime;
    for (var i = 0; i < (n || 3); i++) {
      var o = a.createOscillator(), g = a.createGain(), s = t + i * (0.11 + Math.random() * 0.05);
      var f0 = 2300 + Math.random() * 700, f1 = f0 + 700 + Math.random() * 900;
      o.type = 'sine'; o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, s + 0.07);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.9, s + 0.12);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.045, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.13);
      o.connect(g); g.connect(a.destination); o.start(s); o.stop(s + 0.15);
    }
  }
  function tick(n) {
    var a = audio(); if (!a) return;
    for (var i = 0; i < n; i++) {
      var s = a.currentTime + i * 0.09, o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(900 + Math.random() * 200, s); o.frequency.exponentialRampToValueAtTime(300, s + 0.04);
      g.gain.setValueAtTime(0.05, s); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.05);
      o.connect(g); g.connect(a.destination); o.start(s); o.stop(s + 0.06);
    }
  }

  /* ---------- smooth path through the waypoints ---------- */
  function cr(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t, r = [];
    for (var k = 0; k < 2; k++) r[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
    return r;
  }
  function at(u) { // u in 0..1 along the whole lap
    var n = PATH.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), t = f - i;
    var p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(n, i + 2)];
    return cr(p0, p1, p2, p3, t);
  }
  var ease = function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };

  function make(host) {
    host.classList.add('plogo');
    host.setAttribute('tabindex', '0'); host.setAttribute('role', 'button');
    host.setAttribute('aria-label', 'Planet Pearl logo. Press to watch the bird fly and hear it sing.');
    var base = doc.createElement('img'), ball = doc.createElement('img'), bird = doc.createElement('img');
    base.className = 'pl-base'; ball.className = 'pl-ball'; bird.className = 'pl-bird';
    base.src = DIR + 'logo-base.png'; ball.src = DIR + 'logo-ball.png'; bird.src = DIR + 'logo-bird.png';
    [base, ball, bird].forEach(function (i) { i.alt = ''; i.draggable = false; host.appendChild(i); });

    var flying = false, raf = 0, visible = true, timers = [];

    function box() { return { w: host.offsetWidth, h: host.offsetHeight }; }
    function note(x, y, scale, drift) {
      var b = box(), n = doc.createElement('span');
      n.className = 'pl-note'; n.setAttribute('aria-hidden', 'true');
      n.textContent = NOTES[(Math.random() * NOTES.length) | 0];
      n.style.color = COLORS[(Math.random() * COLORS.length) | 0];
      n.style.left = x + 'px'; n.style.top = y + 'px';
      n.style.fontSize = Math.max(14, b.w * 0.085 * (scale || 1)) + 'px';
      host.appendChild(n);
      var dx = (Math.random() - 0.3) * b.w * 0.18 * (drift || 1), dy = -(b.w * (0.16 + Math.random() * 0.14));
      var rot = (Math.random() - 0.5) * 50;
      var kf = reduce ? [{ opacity: 0.9 }, { opacity: 0 }]
        : [{ transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 }, { transform: 'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px) rotate(' + rot * 0.4 + 'deg) scale(1)', opacity: 1, offset: 0.2 },
           { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(.9)', opacity: 0 }];
      var an = n.animate(kf, { duration: reduce ? 900 : 1500 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
      an.onfinish = function () { n.remove(); };
    }
    function beak(flip) { // note spawn point, from the bird's current rect
      var hb = host.getBoundingClientRect(), r = bird.getBoundingClientRect();
      return { x: r.left - hb.left + r.width * (flip < 0 ? 0.05 : 0.95), y: r.top - hb.top + r.height * 0.35 };
    }
    function burst(n, flip) { var p = beak(flip || 1); for (var i = 0; i < n; i++) (function (k) { setTimeout(function () { note(p.x, p.y, 1, flip); }, k * 130); })(i); }

    function hop() {
      if (flying || reduce) return;
      bird.classList.remove('hop'); void bird.offsetWidth; bird.classList.add('hop');
    }
    function wobble() { if (reduce) return; ball.classList.remove('wobble', 'spin'); void ball.offsetWidth; ball.classList.add('wobble'); }
    function spin() { if (reduce) return; ball.classList.remove('wobble', 'spin'); void ball.offsetWidth; ball.classList.add('spin'); }

    function fly(sound) {
      if (flying || reduce) { if (reduce) { burst(4); if (sound) chirp(3); } return; }
      flying = true; bird.classList.remove('hop'); host.classList.add('flying');
      var start = performance.now(), dur = 8200, lastX = REST[0], lastNote = 0, lastChirp = 0, flip = 1, tilt = 0;
      (function step(now) {
        var p = Math.min(1, (now - start) / dur), s = ease(p), pos = at(s), b = box();
        var dx = (pos[0] - REST[0]) / 100 * b.w, dy = (pos[1] - REST[1]) / 100 * b.h;
        var vx = pos[0] - lastX; lastX = pos[0];
        if (Math.abs(vx) > 0.02) flip += ((vx < 0 ? -1 : 1) - flip) * 0.12;
        tilt += ((Math.max(-1, Math.min(1, vx * 6)) * 14) - tilt) * 0.1;
        var flap = 1 + 0.09 * Math.sin(now / 38);
        bird.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scaleX(' + (flip < 0 ? -1 : 1) + ') scaleY(' + flap + ') rotate(' + (flip < 0 ? -tilt : tilt) + 'deg)';
        if (now - lastNote > 300) { lastNote = now; var q = beak(flip); note(q.x, q.y, 0.9, flip < 0 ? -1 : 1); }
        if (sound && now - lastChirp > 1100) { lastChirp = now; chirp(2 + ((Math.random() * 2) | 0)); }
        if (p < 1) raf = requestAnimationFrame(step);
        else { bird.style.transform = ''; host.classList.remove('flying'); flying = false; hop(); if (sound) chirp(2); burst(3); }
      })(start);
    }

    function inBird(e) { var r = bird.getBoundingClientRect(); return e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6; }
    function inBall(e) { var r = ball.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }

    host.addEventListener('click', function (e) {
      if (inBird(e) && !flying) { hop(); chirp(3); burst(3); }
      else if (inBall(e)) { spin(); tick(5); }
      else fly(true);
    });
    host.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fly(true); } });
    host.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; wobble(); hop(); burst(1); });

    // a little life of its own, only while it is on screen
    function idle() {
      var t = setTimeout(function () { if (visible && !doc.hidden) hop(); idle(); }, 6000 + Math.random() * 5000); timers.push(t);
    }
    if (!reduce) {
      idle();
      var first = setTimeout(function () { if (visible && !doc.hidden) fly(false); setInterval(function () { if (visible && !doc.hidden) fly(false); }, 55000); }, 7000); timers.push(first);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(host);
  }

  doc.querySelectorAll('[data-plogo]').forEach(make);
})();
