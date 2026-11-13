/* ==================================================================
   Planet Pearl — the header scene: a rocking chair with a steaming
   coffee, and a gramophone that plays your SoundCloud playlist.
   Only little wire-drawn knobs show; SoundCloud itself stays hidden.
   Until a playlist is plugged in, it plays a soft music-box tune.
   ================================================================== */
(function () {
  'use strict';
  var doc = document, host = doc.getElementById('scene');
  if (!host) return;
  var NS = 'http://www.w3.org/2000/svg', C = window.PP_CONFIG;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function s(tag, attrs, parent) { var n = doc.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  /* ---------- the drawing ---------- */
  var svg = s('svg', { viewBox: '0 0 250 96', role: 'group', 'aria-label': 'A rocking chair with a coffee, and a gramophone' }, host);
  var L = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  function path(d, parent, extra) { var a = {}, k; for (k in L) a[k] = L[k]; a.d = d; if (extra) for (k in extra) a[k] = extra[k]; return s('path', a, parent); }

  // rocking chair
  var chair = s('g', { 'class': 'sc-chair' }, svg);
  path('M6,70 Q40,80 74,70', chair);                                  // rocker
  path('M20,46 L17,69 M62,46 L65,69', chair);                          // legs
  path('M18,46 L66,46', chair); path('M20,46 Q40,51 64,46', chair);   // seat
  path('M22,46 L14,10 M30,46 L24,10', chair);                          // back posts
  path('M11,10 Q20,6 29,9', chair);                                    // top rail
  path('M16,22 L26,21 M18,33 L28,32', chair);                          // slats
  path('M64,46 L64,34 Q64,31 60,31 L46,31', chair);                    // arm
  path('M40,30 Q37,26 41,22 Q45,26 42,30', chair, { 'stroke-width': 1.2 }); // a tiny cushion

  // the coffee
  var table = s('g', { 'class': 'sc-table' }, svg);
  path('M88,64 L112,64 M92,64 L90,78 M108,64 L110,78', table);
  path('M94,64 L96,52 L106,52 L108,64 Z', table);
  path('M108,55 Q115,55 108,61', table);
  var steam = s('g', { 'class': 'sc-steam' }, svg);
  path('M98,49 q-4,-5 0,-9 t0,-9', steam, { 'class': 'st1' });
  path('M102,49 q4,-5 0,-9 t0,-9', steam, { 'class': 'st2' });
  path('M106,49 q-3,-4 0,-8 t0,-8', steam, { 'class': 'st3' });

  // the gramophone
  var gram = s('g', { 'class': 'sc-gram' }, svg);
  path('M132,74 L132,58 L186,58 L186,74 Z', gram);
  path('M135,78 L135,74 M183,78 L183,74', gram);
  path('M138,58 Q159,52 180,58', gram);
  s('ellipse', { cx: 160, cy: 56, rx: 19, ry: 5, 'class': 'sc-rec', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-dasharray': '4 5' }, gram);
  s('ellipse', { cx: 160, cy: 56, rx: 10, ry: 2.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.1 }, gram);
  path('M146,54 L164,51', gram, { 'stroke-width': 1.3 });                // tone arm
  path('M178,56 C192,54 198,40 203,26', gram);                          // horn neck
  path('M203,26 C204,6 224,4 232,12', gram);                            // horn top
  path('M203,26 C214,36 232,30 232,12', gram);                          // horn bottom
  s('ellipse', { cx: 227, cy: 14, rx: 6, ry: 12, transform: 'rotate(-22 227 14)', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 }, gram);
  path('M210,30 L210,20 M218,32 L219,22', gram, { 'stroke-width': 1 });

  // the little wire controls: play / volume / next
  var ctl = s('g', { 'class': 'sc-ctl' }, svg);
  var btn = s('g', { 'class': 'sc-btn', 'data-act': 'play', role: 'button', tabindex: 0, 'aria-label': 'Play the gramophone' }, ctl);
  s('circle', { cx: 150, cy: 88, r: 8, fill: 'transparent' }, btn);
  s('circle', { cx: 150, cy: 88, r: 5.2, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, btn);
  var iconPlay = path('M148.5,85.6 L153,88 L148.5,90.4 Z', btn, { 'stroke-width': 1.1 });
  var iconPause = path('M148.4,85.6 L148.4,90.4 M151.6,85.6 L151.6,90.4', btn, { 'stroke-width': 1.3, opacity: 0 });
  var knob = s('g', { 'class': 'sc-btn', 'data-act': 'vol', role: 'slider', tabindex: 0, 'aria-label': 'Volume', 'aria-valuemin': 0, 'aria-valuemax': 100 }, ctl);
  s('circle', { cx: 172, cy: 88, r: 8, fill: 'transparent' }, knob);
  s('circle', { cx: 172, cy: 88, r: 5.2, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }, knob);
  var pointer = path('M172,88 L172,84', knob, { 'stroke-width': 1.5 });
  var nxt = s('g', { 'class': 'sc-btn', 'data-act': 'next', role: 'button', tabindex: 0, 'aria-label': 'Next song' }, ctl);
  s('circle', { cx: 194, cy: 88, r: 8, fill: 'transparent' }, nxt);
  path('M191,85.4 L195,88 L191,90.6 M197,85.4 L197,90.6', nxt, { 'stroke-width': 1.2 });
  var tip = s('title', {}, svg); tip.textContent = 'Press play for a little music';

  /* ---------- state ---------- */
  var vol = 0.6; try { var sv = parseFloat(localStorage.getItem('pp_vol')); if (!isNaN(sv)) vol = Math.min(1, Math.max(0, sv)); } catch (e) {}
  var playing = false, mode = null, widget = null, frameEl = null, notesTimer = 0;
  var scUrl = window.PPStore.safe.soundcloud(C.social.soundcloud);

  function paintVol() { pointer.setAttribute('transform', 'rotate(' + (-135 + vol * 270) + ' 172 88)'); knob.setAttribute('aria-valuenow', Math.round(vol * 100)); }
  function paintPlay() {
    iconPlay.setAttribute('opacity', playing ? 0 : 1); iconPause.setAttribute('opacity', playing ? 1 : 0);
    btn.setAttribute('aria-label', playing ? 'Pause the gramophone' : 'Play the gramophone');
    host.classList.toggle('playing', playing);
    tip.textContent = playing ? 'Playing' : (scUrl ? 'Press play for the playlist' : 'Press play for a little music');
  }
  paintVol(); paintPlay();

  /* ---------- floating notes from the horn ---------- */
  function note() {
    if (reduce) return;
    var t = s('text', { x: 224, y: 10, 'class': 'sc-note', 'font-size': 11 }, svg);
    t.textContent = ['♪', '♫', '♩'][(Math.random() * 3) | 0];
    var dx = 10 + Math.random() * 18, dy = -(14 + Math.random() * 10);
    var an = t.animate([{ transform: 'translate(0,0) scale(.7)', opacity: 0 }, { transform: 'translate(' + dx * 0.3 + 'px,' + dy * 0.4 + 'px) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.9)', opacity: 0 }], { duration: 2200, easing: 'ease-out' });
    an.onfinish = function () { t.remove(); };
  }

  /* ---------- fallback: a tiny music-box waltz ---------- */
  var ac = null, boxTimer = 0, step = 0;
  var FREQ = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, C6: 1046.5 };
  var TUNE = ['E5', 'G5', 'E5', 'C5', 'D5', 'E5', 'D5', 'B4', 'C5', 'D5', 'E5', 'G5', 'A4', 'C5', 'E5', 'C5', 'G4', 'B4', 'D5', 'B4', 'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'D5', 'C5', 'D5', 'G4', 'C5', 'C5'];
  function pluck(f) {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (ac.state === 'suspended') ac.resume();
    var t = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.99;
    var peak = 0.16 * vol * vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o.connect(g); o2.connect(g); g.connect(ac.destination); o.start(t); o2.start(t); o.stop(t + 1.4); o2.stop(t + 1.4);
  }
  function boxStart() { mode = 'box'; boxTimer = setInterval(function () { pluck(FREQ[TUNE[step++ % TUNE.length]]); }, 430); pluck(FREQ[TUNE[step++ % TUNE.length]]); }
  function boxStop() { clearInterval(boxTimer); }

  /* ---------- SoundCloud, hidden ---------- */
  function ensureSC(cb) {
    if (window.SC && window.SC.Widget) return cb(false);
    var sc = doc.createElement('script'); sc.src = 'https://w.soundcloud.com/player/api.js'; sc.onload = function () { cb(false); }; sc.onerror = function () { cb(true); }; doc.head.appendChild(sc);
  }
  function scStart() {
    mode = 'sc';
    frameEl = doc.createElement('iframe'); frameEl.className = 'sc-hidden'; frameEl.title = 'Music'; frameEl.setAttribute('allow', 'autoplay'); frameEl.setAttribute('aria-hidden', 'true'); frameEl.tabIndex = -1;
    frameEl.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(scUrl) + '&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false';
    doc.body.appendChild(frameEl);
    ensureSC(function (err) {
      if (err || !window.SC) { frameEl.remove(); frameEl = null; scUrl = ''; boxStart(); return; }
      widget = window.SC.Widget(frameEl);
      var E = window.SC.Widget.Events;
      widget.bind(E.READY, function () { widget.setVolume(vol * 100); widget.play(); });
      widget.bind(E.PLAY, function () { playing = true; paintPlay(); });
      widget.bind(E.PAUSE, function () { playing = false; paintPlay(); });
    });
  }

  /* ---------- controls ---------- */
  function play() {
    playing = true; paintPlay();
    if (mode === 'sc' && widget) { widget.play(); return; }
    if (mode === 'box') { boxStart(); return; }
    if (scUrl) scStart(); else boxStart();
  }
  function pause() {
    playing = false; paintPlay();
    if (mode === 'sc' && widget) widget.pause(); else boxStop();
  }
  function setVol(v) {
    vol = Math.min(1, Math.max(0, v)); paintVol();
    try { localStorage.setItem('pp_vol', String(vol)); } catch (e) {}
    if (widget) widget.setVolume(vol * 100);
  }
  function next() { if (mode === 'sc' && widget) widget.next(); else step += 5; }

  function act(name, e) {
    if (name === 'play') (playing ? pause : play)();
    else if (name === 'next') { if (!playing) play(); else next(); }
    else if (name === 'vol') { if (e && e.type === 'click') setVol(vol >= 0.99 ? 0.2 : vol + 0.2); }
  }
  host.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (b) { e.preventDefault(); act(b.getAttribute('data-act'), e); } });
  host.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
    if (b.getAttribute('data-act') === 'vol') { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setVol(vol + 0.1); } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setVol(vol - 0.1); } }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(b.getAttribute('data-act'), e); }
  });
  host.addEventListener('wheel', function (e) { if (e.target.closest('[data-act="vol"]')) { e.preventDefault(); setVol(vol + (e.deltaY < 0 ? 0.08 : -0.08)); } }, { passive: false });
  // drag the knob up/down
  var dragY = null, dragV = 0;
  host.addEventListener('pointerdown', function (e) { if (e.target.closest('[data-act="vol"]')) { dragY = e.clientY; dragV = vol; } });
  window.addEventListener('pointermove', function (e) { if (dragY !== null) setVol(dragV + (dragY - e.clientY) / 90); });
  window.addEventListener('pointerup', function () { dragY = null; });

  notesTimer = setInterval(function () { if (playing && !doc.hidden) note(); }, 800);
})();
