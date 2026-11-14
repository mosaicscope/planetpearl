/* ==================================================================
   Planet Pearl — the rope.
   The hero film (rendered in Blender) hands the thread to this live 3D
   rope. It is soft, fibrous wool: it fluffs up and ripples as you scroll
   fast, bends away from your cursor, gets a tug when the ball unravels,
   and ends in a loose tangle that moves with it.
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
    var yarnMat;
    try { yarnMat = new THREE.MeshPhysicalMaterial({ map: ply, bumpMap: ply, bumpScale: 3.2, vertexColors: true, roughness: 0.92, metalness: 0, sheen: new THREE.Color(0xffd6e0) }); }
    catch (e) { yarnMat = new THREE.MeshStandardMaterial({ map: ply, bumpMap: ply, bumpScale: 3.2, vertexColors: true, roughness: 0.9, metalness: 0 }); }

    /* ---------- wool fuzz: a soft halo of loose fibres ---------- */
    function fuzzTexture() {
      var W = 256, H = 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var x = cv.getContext('2d'); x.lineCap = 'round';
      for (var i = 0; i < 520; i++) {
        var px = Math.random() * W, py = Math.random() * H, len = 6 + Math.random() * 26, ang = (Math.random() - 0.5) * 1.2 + (Math.random() < 0.1 ? 1.2 : 0);
        x.strokeStyle = 'rgba(255,255,255,' + (0.22 + Math.random() * 0.6) + ')'; x.lineWidth = 0.5 + Math.random() * 1.1;
        x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5, py + Math.sin(ang) * len * 0.5 + (Math.random() - 0.5) * 6, px + Math.cos(ang) * len, py + Math.sin(ang) * len); x.stroke();
        if (px + len > W) { x.beginPath(); x.moveTo(px - W, py); x.lineTo(px - W + Math.cos(ang) * len, py + Math.sin(ang) * len); x.stroke(); }
      }
      var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    }
    var fuzz = fuzzTexture();
    var shellMat = new THREE.MeshBasicMaterial({ map: fuzz, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });

    /* ---------- tube builder (parallel-transport frames) ---------- */
    function buildTube(pts, radius, radial, lens, uvPerUnit, tint) {
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
        colorAt(lens[i], c); if (tint) c.multiplyScalar(tint);
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
      var geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geom.setIndex(new THREE.BufferAttribute(idx, 1));
      geom.computeBoundingSphere();
      return geom;
    }

    var ropeMesh = new THREE.Mesh(new THREE.BufferGeometry(), yarnMat); ropeMesh.frustumCulled = false; scene.add(ropeMesh);
    var shellMesh = new THREE.Mesh(new THREE.BufferGeometry(), shellMat); shellMesh.frustumCulled = false; shellMesh.renderOrder = 2; scene.add(shellMesh);

    /* ---------- planning a route through the open space ----------
       The page is cut into rows. For every row we know which stretches are taken by words
       or pictures, then we pick one x per row so the thread stays in open space, changing
       lane gently (a smooth path) and finishing in the pool. */
    function planLane(obs, W, y0, y1, x0, xEnd, clear) {
      var STEP = 60, CELL = 18, nx = Math.max(8, Math.floor(W / CELL)), rows = Math.max(6, Math.ceil((y1 - y0) / STEP) + 1);
      var lo = Math.floor(8 / CELL), hi = nx - 1 - lo, INF = 1e12;
      var cost = new Array(rows), r, c, k;
      for (r = 0; r < rows; r++) {
        var ya = y0 + r * STEP - STEP / 2, yb = ya + STEP, list = [];
        for (k = 0; k < obs.length; k++) if (obs[k].t < yb && obs[k].b > ya) list.push(obs[k]);
        var row = new Float32Array(nx);
        for (c = 0; c < nx; c++) {
          var xl = c * CELL + CELL / 2 - clear, xr = xl + 2 * clear, o = 0;
          for (k = 0; k < list.length; k++) { var a = Math.max(xl, list[k].l), b = Math.min(xr, list[k].r); if (b > a) o += b - a; }
          row[c] = o * 3 + (c < lo || c > hi ? 400 : 0) + Math.abs(c * CELL - W / 2) * 0.004;
        }
        cost[r] = row;
      }
      var c0 = clamp(Math.round(x0 / CELL), 0, nx - 1), cE = clamp(Math.round(xEnd / CELL), 0, nx - 1), LAM = 5, MAXJ = 5;
      var dp = new Array(rows), from = new Array(rows);
      dp[0] = new Float32Array(nx).fill(INF); dp[0][c0] = 0; from[0] = new Int16Array(nx);
      for (r = 1; r < rows; r++) {
        dp[r] = new Float32Array(nx).fill(INF); from[r] = new Int16Array(nx);
        for (c = 0; c < nx; c++) {
          var best = INF, bj = c;
          for (var j = Math.max(0, c - MAXJ); j <= Math.min(nx - 1, c + MAXJ); j++) { var v = dp[r - 1][j] + LAM * (c - j) * (c - j); if (v < best) { best = v; bj = j; } }
          dp[r][c] = best >= INF ? INF : best + cost[r][c]; from[r][c] = bj;
        }
      }
      var xs = new Array(rows), cur = cE;
      for (r = rows - 1; r >= 0; r--) { xs[r] = cur * CELL + CELL / 2; cur = from[r][cur]; }
      xs[0] = x0; xs[rows - 1] = xEnd;
      // smooth it so the thread flows rather than steps
      for (var pass = 0; pass < 3; pass++) for (r = 1; r < rows - 1; r++) xs[r] = (xs[r - 1] + 2 * xs[r] + xs[r + 1]) / 4;
      var out = []; for (r = 0; r < rows; r++) out.push({ x: xs[r], y: y0 + r * STEP });
      out[rows - 1].y = y1;
      return out;
    }

    /* ---------- layout ---------- */
    var W = 1, H = 1, visH = 4, visW = 6, upp = 0.005, heroTravel = 800, docH = 5000;
    var rest = [], cum = new Float32Array(2), N = 0, NM = 0, radiusW = 0.05, uvPerUnit = 1, SPACING = 0.07;
    var ox = new Float32Array(2), oy = new Float32Array(2), oz = new Float32Array(2), vx = new Float32Array(2), vy = new Float32Array(2), vz = new Float32Array(2), dirty = true;
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
      var poolY = opts.endY ? opts.endY() : docH - footH - H * 0.3;
      var Rpx = Math.min(150, W * 0.22), yEnd = poolY - 0.62 * Rpx;
      var radiusPx = 0.0152 * film.width, clearPx = radiusPx + 22;
      var obs = opts.obstacles ? opts.obstacles() : [];
      var yStart = y0 + H * 0.22, px = [{ x: x0, y: y0 }, { x: x0, y: yStart }];
      var lane = planLane(obs, W, yStart, yEnd, x0, W * 0.5, clearPx);
      for (var li = 1; li < lane.length; li++) px.push(lane[li]);
      var ctrl = px.map(function (p, i) { return new THREE.Vector3((p.x - W / 2) * upp, -upp * p.y, 0.5 * Math.sin(i * 1.1)); });
      ctrl[0].z = 0; ctrl[1].z = 0;
      var curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
      var mainPts = curve.getSpacedPoints(Math.max(10, Math.ceil(curve.getLength() / SPACING)) - 1);
      NM = mainPts.length;

      // the loose tangle the thread ends in
      var C0 = mainPts[NM - 1], R = Rpx * upp, tp = [], TAU = Math.PI * 2;
      // a loose coil of thread: three soft turns spiralling in, with little overlapping loops, wider than it is tall
      for (var t = 0; t <= 140; t++) {
        var u = t / 140, an = Math.PI / 2 + TAU * 3.1 * u, rr = R * (1 - 0.7 * u);
        var sx = rr * 1.6 * Math.cos(an) + 0.06 * R * Math.cos(an * 3 + 1) * (1 - u);
        var sy = rr * 0.62 * Math.sin(an) + 0.05 * R * Math.sin(an * 4) * (1 - u);
        var sz = 0.22 * R * Math.sin(an * 2 + u * 5);
        tp.push(new THREE.Vector3(C0.x + sx, C0.y + sy - 0.62 * R, C0.z + sz));
      }
      var tcurve = new THREE.CatmullRomCurve3(tp, false, 'catmullrom', 0.5);
      var tanglePts = tcurve.getSpacedPoints(Math.max(20, Math.ceil(tcurve.getLength() / SPACING)) - 1);
      rest = mainPts.concat(tanglePts.slice(1));
      N = rest.length;
      cum = new Float32Array(N);
      for (var i = 1; i < N; i++) cum[i] = cum[i - 1] + rest[i].distanceTo(rest[i - 1]);
      ox = new Float32Array(N); oy = new Float32Array(N); oz = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N); vz = new Float32Array(N);
      radiusW = Math.max(0.012, 0.0152 * film.width * upp);
      uvPerUnit = 1 / (6 * radiusW);
      dirty = true;
    }

    /* ---------- pointer, scroll and the unravelling drive the rope ---------- */
    var spx = -9999, spy = -9999, mx = -9999, my = -9999, pmx = -9999, pmy = -9999, speed = 0, lastSy = 0, lastT = performance.now(), builtCam = 1e9, lastW = 0, fluff = 0, svSmooth = 0;
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', function () { mx = my = -9999; });
    var pw = new THREE.Vector3();

    function update(sy) {
      var now = performance.now(), dt = clamp((now - lastT) / 1000, 0.001, 0.05); lastT = now;
      var camY = -upp * (sy + H / 2);
      camera.position.y = camY;

      var sv = (sy - lastSy) / dt; lastSy = sy;
      svSmooth += (clamp(sv, -3000, 3000) - svSmooth) * 0.25;
      var pdx = mx - pmx, pdy = my - pmy; pmx = mx; pmy = my;
      if (pmx < -9000 || Math.abs(pdx) > 3000) { pdx = pdy = 0; }
      speed += (clamp(Math.hypot(pdx, pdy) / (dt * 1000), 0, 3) - speed) * 0.2;
      pw.set((mx - W / 2) * upp, camY - (my - H / 2) * upp, 0);
      var pointerOn = mx > -9000;

      // the visible slice of the rope
      var yLo = camY - visH * 0.85, yHi = camY + visH * 0.85, a = 0, b = NM - 1, lo, hi;
      while (a < b) { var m = (a + b) >> 1; if (rest[m].y > yHi) a = m + 1; else b = m; } lo = Math.max(0, a - 2);
      a = 0; b = NM - 1;
      while (a < b) { var m2 = (a + b) >> 1; if (rest[m2].y > yLo) a = m2 + 1; else b = m2; } hi = Math.min(NM - 1, a + 2);
      // the tangle's y is not monotonic, so include all of it whenever it is near
      if (Math.abs(rest[NM - 1].y - camY) < visH * 1.1) hi = N - 1;

      // when the ball unravels the thread is tugged: kick the top and the tangle
      var w = clamp(sy / heroTravel, 0, 1), dW = w - lastW; lastW = w;
      if (Math.abs(dW) > 1e-4) {
        var tug = clamp(dW * 14, -0.8, 0.8);
        for (var i0 = 1; i0 < Math.min(NM, 60); i0++) vx[i0] += tug * Math.sin(i0 * 0.35) * 1.2;
        for (var i1 = NM; i1 < N; i1++) { var f1 = (i1 - NM) / Math.max(1, N - NM); vy[i1] += tug * (1.2 - f1) * 1.4; vx[i1] += tug * Math.sin(i1 * 0.9) * 1.0; }
      }

      // a calm, heavy string: a soft spring home, a gentle pull from its neighbours, a light nudge from you.
      // the pool at the end stays tidy: it only drifts a little.
      var h = dt > 0.02 ? dt / 2 : dt, steps = dt > 0.02 ? 2 : 1, damp = Math.pow(0.02, h), energy = 0;
      var R = 0.95, sway = svSmooth * 0.0003, tw = now * 0.0018;
      if (pointerOn) { spx += (mx - spx) * 0.1; spy += (my - spy) * 0.1; } else { spx = mx; spy = my; }
      pw.set((spx - W / 2) * upp, camY - (spy - H / 2) * upp, 0);
      for (var st = 0; st < steps; st++) {
        for (var i = 1; i < N - 1; i++) {
          var inPool = i >= NM, kHome = inPool ? 40 : 7, cNb = 40;
          var ax = -kHome * ox[i] + cNb * (ox[i - 1] + ox[i + 1] - 2 * ox[i]);
          var ay = -kHome * oy[i] + cNb * (oy[i - 1] + oy[i + 1] - 2 * oy[i]);
          var az = -kHome * oz[i] + cNb * (oz[i - 1] + oz[i + 1] - 2 * oz[i]);
          if (!inPool && i >= lo && i <= hi) {
            if (pointerOn) {
              var p = rest[i], dx = p.x + ox[i] - pw.x, dy = p.y + oy[i] - pw.y, d = Math.sqrt(dx * dx + dy * dy);
              if (d < R) { var f = 1 - d / R; f = f * f * 9; var inv = 1 / (d + 0.05); ax += dx * inv * f; ay += dy * inv * f * 0.3; az += f * 0.15; }
            }
            ax += sway * Math.sin(i * 0.05 + tw) * 18; az += sway * Math.cos(i * 0.04 + tw * 1.2) * 10;
          }
          vx[i] = (vx[i] + ax * h) * damp; vy[i] = (vy[i] + ay * h) * damp; vz[i] = (vz[i] + az * h) * damp;
        }
        for (var j = 1; j < N - 1; j++) {
          ox[j] = clamp(ox[j] + vx[j] * h, -0.35, 0.35); oy[j] = clamp(oy[j] + vy[j] * h, -0.35, 0.35); oz[j] = clamp(oz[j] + vz[j] * h, -0.35, 0.35);
          if (j >= lo && j <= hi) energy += Math.abs(ox[j]) + Math.abs(oy[j]) + Math.abs(oz[j]);
        }
      }
      if (!dirty && energy < 0.0005 && Math.abs(camY - builtCam) < 1e-5 && !pointerOn) return false;
      dirty = false; builtCam = camY;

      // the main rope slice, then (if near) the tangle as a separate piece so it stays a loop of its own
      var count = hi - lo + 1;
      if (count < 4) { ropeMesh.visible = false; shellMesh.visible = false; return true; }
      var pts = new Array(count), lens = new Float32Array(count);
      for (var q = 0; q < count; q++) { var ii = lo + q; pts[q] = new THREE.Vector3(rest[ii].x + ox[ii], rest[ii].y + oy[ii], rest[ii].z + oz[ii]); lens[q] = cum[ii]; }
      var oldR = ropeMesh.geometry, oldS = shellMesh.geometry;
      ropeMesh.geometry = buildTube(pts, radiusW, 7, lens, uvPerUnit, 1);
      // fibres flare out as you scroll fast, and breathe a little at rest
      fluff += (clamp(Math.abs(svSmooth) * 0.0002, 0, 0.35) - fluff) * 0.06;
      shellMesh.geometry = buildTube(pts, radiusW * (1.4 + fluff), 6, lens, 1 / (9 * radiusW), 1.12);
      shellMat.opacity = clamp(0.62 + fluff * 0.5, 0, 0.95);
      oldR.dispose(); oldS.dispose();
      ropeMesh.visible = true; shellMesh.visible = true;
      return true;
    }

    function render() { renderer.render(scene, camera); }
    layout();
    return { update: update, render: render, layout: layout, destroy: function () { renderer.dispose(); } };
  }

  window.PPYarn = { create: create };
})();
