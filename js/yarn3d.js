/* ==================================================================
   Planet Pearl — the rope.
   The hero film (rendered in Blender) hands the thread to this live 3D
   rope, which trails down the whole page and sways when your cursor
   or your scrolling touches it.
   ================================================================== */
(function () {
  'use strict';
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function create(canvas, opts) {
    var THREE = window.THREE;
    opts = opts || {};

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xffb8c8, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(-3, 5, 6); scene.add(key);
    var rim = new THREE.DirectionalLight(0xff9db9, 0.4); rim.position.set(4, -2, 3); scene.add(rim);

    /* ---------- hand-dyed pink ombré, matched to the Blender film ---------- */
    var PAL = ['#ffa6bd', '#ff86a6', '#f65a85', '#ff86a6', '#ffb3c6'].map(function (h) { return new THREE.Color(h); });
    var PERIOD = 16;
    function colorAt(L, out) {
      var f = ((L / PERIOD) % 1 + 1) % 1 * PAL.length;
      var i = Math.floor(f), k = f - i;
      out.copy(PAL[i % PAL.length]).lerp(PAL[(i + 1) % PAL.length], k * k * (3 - 2 * k));
      return out;
    }

    /* ---------- 3-ply yarn texture (twisted strands + fibre fuzz) ---------- */
    function plyTexture() {
      var S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
      var ctx = cv.getContext('2d'), img = ctx.createImageData(S, S);
      var raw = new Float32Array(S * S), seed = 1234567;
      for (var i = 0; i < raw.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; raw[i] = seed / 4294967296; }
      for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
        var u = x / S, v = y / S, hgt = 0;
        for (var j = 0; j < 3; j++) {
          var vc = (u + j / 3) % 1, d = Math.abs(v - vc); d = Math.min(d, 1 - d);
          var w = 0.2;
          if (d < w) { var h = Math.pow(Math.cos(d / w * Math.PI / 2), 0.65); if (h > hgt) hgt = h; }
        }
        var n = 0;
        for (var s = -3; s <= 3; s++) { n += raw[((y + s + S) % S) * S + ((x + s * 3 + S * 4) % S)]; }
        n = n / 7 - 0.5;
        var g = clamp((0.42 + 0.5 * Math.pow(hgt, 0.9)) + n * 0.34, 0, 1);
        var o = (y * S + x) * 4, c = Math.round(g * 255);
        img.data[o] = img.data[o + 1] = img.data[o + 2] = c; img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      var t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return t;
    }
    var ply = plyTexture();
    var yarnMat = new THREE.MeshStandardMaterial({
      map: ply, bumpMap: ply, bumpScale: 3.2, vertexColors: true, roughness: 0.88, metalness: 0
    });

    /* ---------- tube builder (parallel-transport frames) ---------- */
    function buildTube(pts, radius, radial, lens, uvPerUnit, geom) {
      var n = pts.length, R1 = radial + 1;
      var pos = new Float32Array(n * R1 * 3), nor = new Float32Array(n * R1 * 3),
          uv = new Float32Array(n * R1 * 2), col = new Float32Array(n * R1 * 3),
          idx = new Uint32Array((n - 1) * radial * 6);
      var T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), c = new THREE.Color(), o3 = 0, o2 = 0;
      T.subVectors(pts[1], pts[0]).normalize();
      N.set(Math.abs(T.x) < 0.9 ? 1 : 0, Math.abs(T.x) < 0.9 ? 0 : 1, 0);
      N.addScaledVector(T, -N.dot(T)).normalize();
      for (var i = 0; i < n; i++) {
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        T.subVectors(b, a).normalize();
        N.addScaledVector(T, -N.dot(T)).normalize();
        B.crossVectors(T, N);
        colorAt(lens[i], c);
        for (var j = 0; j <= radial; j++) {
          var ang = j / radial * Math.PI * 2, cs = Math.cos(ang), sn = Math.sin(ang);
          var nx = N.x * cs + B.x * sn, ny = N.y * cs + B.y * sn, nz = N.z * cs + B.z * sn;
          pos[o3] = pts[i].x + nx * radius; pos[o3 + 1] = pts[i].y + ny * radius; pos[o3 + 2] = pts[i].z + nz * radius;
          nor[o3] = nx; nor[o3 + 1] = ny; nor[o3 + 2] = nz;
          col[o3] = c.r; col[o3 + 1] = c.g; col[o3 + 2] = c.b;
          uv[o2] = lens[i] * uvPerUnit; uv[o2 + 1] = j / radial;
          o3 += 3; o2 += 2;
        }
      }
      var k = 0;
      for (var s = 0; s < n - 1; s++) for (var r = 0; r < radial; r++) {
        var A = s * R1 + r, Bq = (s + 1) * R1 + r, C = Bq + 1, D = A + 1;
        idx[k++] = A; idx[k++] = Bq; idx[k++] = D; idx[k++] = Bq; idx[k++] = C; idx[k++] = D;
      }
      geom = geom || new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geom.setIndex(new THREE.BufferAttribute(idx, 1));
      geom.computeBoundingSphere();
      return geom;
    }

    var ropeMesh = new THREE.Mesh(new THREE.BufferGeometry(), yarnMat);
    ropeMesh.frustumCulled = false; scene.add(ropeMesh);
    var bowGeo = new THREE.TorusKnotGeometry(0.34, 0.06, 140, 12, 2, 3);
    var bowCol = new Float32Array(bowGeo.attributes.position.count * 3);
    for (var bi = 0; bi < bowCol.length; bi += 3) { bowCol[bi] = 0.96; bowCol[bi + 1] = 0.36; bowCol[bi + 2] = 0.52; }
    bowGeo.setAttribute('color', new THREE.BufferAttribute(bowCol, 3));
    var bow = new THREE.Mesh(bowGeo, yarnMat);
    scene.add(bow);

    /* ---------- layout ---------- */
    var W = 1, H = 1, visH = 4, visW = 6, upp = 0.005, heroTravel = 800, docH = 5000;
    var rest = [], cum = new Float32Array(2), off = [], vel = [], N = 0, radiusW = 0.05, uvPerUnit = 1, bowPos = new THREE.Vector3(), SPACING = 0.07;
    var dirty = true;
    function layout() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H, false);
      var fov = camera.fov * Math.PI / 180, aspect = W / H;
      camera.aspect = aspect; camera.position.z = 6.4; camera.updateProjectionMatrix();
      visH = 2 * Math.tan(fov / 2) * 6.4; visW = visH * aspect; upp = visH / H;

      heroTravel = opts.heroTravel ? opts.heroTravel() : H * 1.4;
      docH = Math.max(document.documentElement.scrollHeight, H * 3);
      var film = opts.filmRect ? opts.filmRect() : { left: W * 0.5, width: 600, tailXFrac: 0.6 };
      var x0 = film.left + film.width * film.tailXFrac;
      var y0 = heroTravel + H;
      var footH = opts.footerH ? opts.footerH() : 220;
      var yEnd = opts.endY ? opts.endY() : docH - footH - H * 0.3;
      var n = Math.max(5, Math.round((yEnd - y0) / (H * 0.5)));
      var amp = Math.min(W * 0.3, 420), px = [{ x: x0, y: y0 }, { x: x0, y: y0 + H * 0.22 }];
      for (var k = 1; k <= n; k++) {
        var dir = k % 2 ? -1 : 1, y = y0 + H * 0.22 + (yEnd - y0 - H * 0.22) * k / n;
        px.push({ x: k === n ? W * 0.5 : W * 0.5 + dir * amp * (0.55 + 0.45 * Math.sin(k * 1.9 + 0.5)), y: y });
      }
      var ctrl = px.map(function (p, i) { return new THREE.Vector3((p.x - W / 2) * upp, -upp * p.y, 0.5 * Math.sin(i * 1.1)); });
      ctrl[0].z = 0; ctrl[1].z = 0;
      var curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
      var total = curve.getLength();
      N = Math.max(10, Math.ceil(total / SPACING));
      var pts = curve.getSpacedPoints(N - 1);
      rest = pts; cum = new Float32Array(N); off = []; vel = [];
      for (var i = 0; i < N; i++) {
        if (i) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1]);
        off.push(new THREE.Vector3()); vel.push(new THREE.Vector3());
      }
      radiusW = Math.max(0.012, 0.0152 * film.width * upp);
      uvPerUnit = 1 / (6 * radiusW);
      bowPos.copy(pts[N - 1]); bow.position.copy(bowPos); bow.scale.setScalar(clamp(radiusW / 0.05 * 0.62, 0.4, 1.4));
      dirty = true;
    }

    /* ---------- pointer & scroll drive the rope ---------- */
    var builtCam = 1e9, mx = -9999, my = -9999, pmx = -9999, pmy = -9999, speed = 0, lastSy = 0, lastT = performance.now(), idle = 0;
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', function () { mx = my = -9999; });
    var pw = new THREE.Vector3();

    function update(sy) {
      var now = performance.now(), dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
      var camY = -upp * (sy + H / 2);
      camera.position.y = camY;

      var sv = (sy - lastSy) / dt; lastSy = sy;
      var pdx = mx - pmx, pdy = my - pmy; pmx = mx; pmy = my;
      if (pmx < -9000 || Math.abs(pdx) > 3000) { pdx = pdy = 0; }
      speed += (clamp(Math.hypot(pdx, pdy) / (dt * 1000), 0, 3) - speed) * 0.2;
      pw.set((mx - W / 2) * upp, camY - (my - H / 2) * upp, 0);
      var pointerOn = mx > -9000;

      var yLo = camY - visH * 0.85, yHi = camY + visH * 0.85, a = 0, b = N - 1, lo, hi;
      while (a < b) { var m = (a + b) >> 1; if (rest[m].y > yHi) a = m + 1; else b = m; } lo = Math.max(0, a - 2);
      a = 0; b = N - 1;
      while (a < b) { var m2 = (a + b) >> 1; if (rest[m2].y > yLo) a = m2 + 1; else b = m2; } hi = Math.min(N - 1, a + 2);

      var R = 0.75 + speed * 0.5, energy = 0, k = 26, damp = Math.pow(0.0009, dt);
      for (var i = lo; i <= hi; i++) {
        var p = rest[i], o = off[i], v = vel[i];
        var ax = -k * o.x, ay = -k * o.y, az = -k * o.z;
        if (pointerOn) {
          var dx = p.x + o.x - pw.x, dy = p.y + o.y - pw.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < R) {
            var f = (1 - d / R); f = f * f * (36 + speed * 40);
            var inv = 1 / (d + 0.02);
            ax += dx * inv * f; ay += dy * inv * f * 0.35; az += f * 0.28;
          }
        }
        ax += sv * 0.0004 * Math.sin(i * 0.11 + now * 0.002);
        v.x = (v.x + ax * dt) * damp; v.y = (v.y + ay * dt) * damp; v.z = (v.z + az * dt) * damp;
        o.x += v.x * dt; o.y += v.y * dt; o.z += v.z * dt;
        energy += Math.abs(o.x) + Math.abs(o.y) + Math.abs(o.z) + Math.abs(v.x);
      }
      for (var s = 0; s < 2; s++) for (var j = lo + 1; j < hi; j++) {
        off[j].x += (0.5 * (off[j - 1].x + off[j + 1].x) - off[j].x) * 0.22;
        off[j].y += (0.5 * (off[j - 1].y + off[j + 1].y) - off[j].y) * 0.22;
        off[j].z += (0.5 * (off[j - 1].z + off[j + 1].z) - off[j].z) * 0.22;
      }

      if (!dirty && energy < 0.0005 && Math.abs(camY - builtCam) < 1e-5 && !pointerOn) return false;
      dirty = false; builtCam = camY;

      var count = hi - lo + 1;
      if (count < 4) { ropeMesh.visible = false; bow.visible = hi >= N - 4; return true; }
      var pts = new Array(count), lens = new Float32Array(count);
      for (var q = 0; q < count; q++) {
        var ii = lo + q;
        pts[q] = new THREE.Vector3(rest[ii].x + off[ii].x, rest[ii].y + off[ii].y, rest[ii].z + off[ii].z);
        lens[q] = cum[ii];
      }
      var old = ropeMesh.geometry;
      ropeMesh.geometry = buildTube(pts, radiusW, 7, lens, uvPerUnit);
      old.dispose();
      ropeMesh.visible = true;
      bow.visible = Math.abs(bowPos.y - camY) < visH * 0.9;
      bow.rotation.y += 0.004;
      return true;
    }

    function render() { renderer.render(scene, camera); }
    layout();
    window.addEventListener('resize', layout);
    return { update: update, render: render, layout: layout, destroy: function () { renderer.dispose(); } };
  }

  window.PPYarn = { create: create };
})();
