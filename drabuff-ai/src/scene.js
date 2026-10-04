/* Drabuff AI — interactive voxel field + assembling AI core (Three.js r128) */
(function () {
  var api = { setProgress: function () {}, setMode: function () {} };
  window.Scene3D = api;
  var cv = document.getElementById('bg3d');
  if (!window.THREE || !cv) { document.documentElement.classList.add('no3d'); return; }
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('no3d'); cv.style.display = 'none'; return; }

  var css = getComputedStyle(document.documentElement);
  var ACC = new THREE.Color((css.getPropertyValue('--acc') || '#45E3FF').trim());
  var ACC2 = new THREE.Color((css.getPropertyValue('--acc2') || '#9B8CFF').trim());
  var BG = new THREE.Color('#05070D');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = Math.min(innerWidth, innerHeight) < 700;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(BG, 1);
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 20, 56);
  var cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  scene.add(new THREE.AmbientLight(0x5a6aa0, 0.6));
  var key = new THREE.DirectionalLight(0xffffff, 0.65); key.position.set(-12, 22, 14); scene.add(key);
  var glow = new THREE.PointLight(ACC, 2.4, 22, 2); scene.add(glow);
  var rim = new THREE.PointLight(ACC2, 2.2, 46, 2); rim.position.set(12, 10, -12); scene.add(rim);

  /* ---- voxel floor ---- */
  var COLS = small ? 20 : 38, ROWS = small ? 22 : 24, SP = 1.1;
  var geo = new THREE.BoxGeometry(0.94, 1, 0.94); geo.translate(0, 0.5, 0);
  var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.38 });
  var N = COLS * ROWS;
  var floor = new THREE.InstancedMesh(geo, mat, N);
  floor.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var base = new THREE.Color('#0D1426'), hot = new THREE.Color(), tmp = new THREE.Color();
  var dummy = new THREE.Object3D();
  var X = new Float32Array(N), Z = new Float32Array(N), R = new Float32Array(N);
  for (var r = 0, i = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++, i++) {
    X[i] = (c - (COLS - 1) / 2) * SP; Z[i] = (r - (ROWS - 1) / 2) * SP - 4; R[i] = Math.random();
    floor.setColorAt(i, base);
  }
  scene.add(floor);

  /* ---- AI core: 3x3x3 blocks ---- */
  var core = new THREE.Group(); scene.add(core);
  var cubes = [];
  var cgeo = new THREE.BoxGeometry(0.86, 0.86, 0.86);
  var egeo = new THREE.EdgesGeometry(cgeo);
  for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) for (var d = -1; d <= 1; d++) {
    var m = new THREE.MeshStandardMaterial({ color: 0x121a30, metalness: 0.55, roughness: 0.3, emissive: 0x000000 });
    var mesh = new THREE.Mesh(cgeo, m);
    var edge = new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: 0.35 }));
    mesh.add(edge);
    mesh.userData = { home: new THREE.Vector3(a, b, d), seed: Math.random(), lit: 0, edge: edge };
    core.add(mesh); cubes.push(mesh);
  }
  cubes.sort(function (p, q) { return p.userData.seed - q.userData.seed; });

  var state = { mode: 'idle', progress: 0.15, explode: 0.35, spin: 0.25 };
  api.setProgress = function (p) { state.progress = Math.max(0, Math.min(1, p)); };
  api.setMode = function (m) { state.mode = m; if (m === 'done') state.progress = 1; };

  /* ---- pointer ---- */
  var ndc = new THREE.Vector2(0, 0), hasPtr = false;
  var ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  var hit = new THREE.Vector3(), target = new THREE.Vector3(0, 0, 0), ptr = new THREE.Vector3(0, 0, 0);
  window.addEventListener('pointermove', function (e) {
    ndc.x = (e.clientX / innerWidth) * 2 - 1; ndc.y = -(e.clientY / innerHeight) * 2 + 1; hasPtr = true;
  }, { passive: true });
  var burst = 0;
  api.burst = function () { burst = 1; };
  window.addEventListener('pointerdown', function () { burst = 1; }, { passive: true });

  function resize() {
    var w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = w < 700 ? 58 : 42; cam.updateProjectionMatrix();
    core.position.set(w < 980 ? 0 : 6.5, 5.2, -6);
  }
  resize(); window.addEventListener('resize', resize);

  var clock = 0, last = performance.now(), running = true;
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    clock += dt * (reduce ? 0.2 : 1);
    var t = clock, thinking = state.mode === 'thinking', done = state.mode === 'done';

    // camera with scroll + pointer parallax
    var sy = Math.min(1, (window.scrollY || 0) / 900);
    cam.position.x += ((ndc.x * 1.6) - cam.position.x) * 0.04;
    cam.position.y += ((13 - sy * 3.5 + ndc.y * 0.8) - cam.position.y) * 0.05;
    cam.position.z = 22;
    cam.lookAt(0, 1.5 - sy * 2, -6);

    // pointer target on floor
    if (hasPtr) {
      ray.setFromCamera(ndc, cam);
      if (ray.ray.intersectPlane(plane, hit)) target.copy(hit);
    } else {
      target.set(Math.sin(t * 0.35) * 10, 0, Math.cos(t * 0.27) * 5 - 4);
    }
    ptr.lerp(target, 0.12);
    glow.position.set(ptr.x, 3.2, ptr.z);
    burst *= 0.94;

    var speed = thinking ? 3.2 : 1;
    for (var i = 0; i < N; i++) {
      var dx = X[i] - ptr.x, dz = Z[i] - ptr.z, d2 = dx * dx + dz * dz;
      var bump = Math.exp(-d2 / 9);
      var ring = burst > 0.02 ? Math.exp(-Math.pow(Math.sqrt(d2) - (1 - burst) * 16, 2) / 3) * burst : 0;
      var wave = 0.35 + 0.28 * Math.sin(X[i] * 0.33 + t * 1.1 * speed) + 0.22 * Math.cos(Z[i] * 0.41 + t * 0.8 * speed);
      var h = Math.max(0.12, wave + bump * 3.4 + ring * 2.2 + (thinking ? 0.9 * Math.max(0, Math.sin(t * 7 + R[i] * 12)) * R[i] : 0));
      dummy.position.set(X[i], -1.4, Z[i]); dummy.scale.set(1, h, 1); dummy.updateMatrix();
      floor.setMatrixAt(i, dummy.matrix);
      var heat = Math.min(1, bump * 0.95 + ring * 0.8 + (thinking ? R[i] * 0.25 * Math.max(0, Math.sin(t * 5 + R[i] * 9)) : 0));
      hot.copy(ACC).lerp(ACC2, Math.max(0, Math.min(1, (X[i] + 20) / 40)));
      tmp.copy(base).lerp(hot, heat);
      floor.setColorAt(i, tmp);
    }
    floor.instanceMatrix.needsUpdate = true;
    if (floor.instanceColor) floor.instanceColor.needsUpdate = true;

    // core
    var exT = thinking ? 0.55 + 0.45 * Math.sin(t * 4) : done ? 0.06 : 0.3 + 0.08 * Math.sin(t * 1.2);
    state.explode += (exT - state.explode) * 0.08;
    var spT = thinking ? 2.4 : done ? 0.45 : 0.22;
    state.spin += (spT - state.spin) * 0.05;
    core.rotation.y += dt * state.spin * (reduce ? 0.2 : 1);
    core.rotation.x = 0.45 + Math.sin(t * 0.4) * 0.12 + ndc.y * 0.15;
    core.rotation.z = 0.2 + ndc.x * 0.12;
    core.position.y = 5.2 + Math.sin(t * 0.9) * 0.35;
    var litN = Math.round(state.progress * cubes.length);
    for (var k = 0; k < cubes.length; k++) {
      var cu = cubes[k], u = cu.userData, s = 1 + state.explode;
      cu.position.set(u.home.x * s, u.home.y * s, u.home.z * s);
      var want = k < litN ? 1 : (thinking && Math.sin(t * 9 + u.seed * 30) > 0.6 ? 0.6 : 0);
      u.lit += (want - u.lit) * 0.1;
      cu.material.emissive.copy(ACC).multiplyScalar(u.lit * 0.85);
      u.edge.material.opacity = 0.25 + u.lit * 0.6;
      cu.rotation.set(0, 0, 0);
      if (thinking) cu.rotation.y = Math.sin(t * 3 + u.seed * 6) * 0.5;
    }

    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
