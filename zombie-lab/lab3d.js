/* Z-LAB – Engine 3D dựng zombie từ bộ phận (three.js r128). Toàn bộ mô hình được tạo bằng code. */
(function () {
  const T = window.THREE;
  const SM = {}; window.ZSTRAINS.forEach(s => { SM[s.id] = s; });
  const PI = Math.PI;

  /* ------------------------------------------------------------ tiện ích */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shift(hex, deg) { if (!deg) return hex; const c = new T.Color(hex), o = {}; c.getHSL(o); c.setHSL((o.h + deg / 360 + 1) % 1, o.s, o.l); return '#' + c.getHexString(); }
  function mesh(geo, mat, x, y, z) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = false; return m; }
  function seg(len, r1, r2, segs) { const g = new T.CylinderGeometry(r1, r2, len, segs || 12); g.translate(0, -len / 2, 0); return g; }
  function onSphere(r, rnd, yMin, yMax, front) {
    const y = yMin + rnd() * (yMax - yMin), a = front ? (-0.9 + rnd() * 1.8) : rnd() * PI * 2, rr = Math.sqrt(Math.max(0, 1 - y * y));
    return new T.Vector3(Math.sin(a) * rr * r, y * r, Math.cos(a) * rr * r);
  }

  /* ------------------------------------------------------------ vật liệu */
  const texCache = {}, matCache = {};
  function skinTex(c1, c2, kind, seed) {
    const key = [c1, c2, kind, seed].join('|'); if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), r = rng(seed);
    x.fillStyle = c1; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 18; i++) { const px = r() * 256, py = r() * 256, rad = 10 + r() * 42, g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, c2); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.25 + r() * 0.35; x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
    x.globalAlpha = 1;
    for (let i = 0; i < 2200; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'; x.fillRect(r() * 256, r() * 256, 1.5, 1.5); }
    const veins = kind === 'veins' ? 'rgba(120,10,20,.55)' : kind === 'metal' ? null : 'rgba(20,10,30,.25)';
    if (veins) { x.strokeStyle = veins; x.lineWidth = kind === 'veins' ? 1.6 : 1; for (let i = 0; i < (kind === 'veins' ? 22 : 10); i++) { x.beginPath(); let px = r() * 256, py = r() * 256; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); } }
    if (kind === 'metal') { x.strokeStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 120; i++) { const yy = r() * 256; x.beginPath(); x.moveTo(0, yy); x.lineTo(256, yy + (r() - 0.5) * 4); x.stroke(); } }
    if (kind === 'cloth') { x.strokeStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 256; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); } }
    const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding;
    return (texCache[key] = t);
  }
  function mats(s, hue) {
    const key = s.id + '|' + (hue || 0); if (matCache[key]) return matCache[key];
    const c = shift(s.c, hue), c2 = shift(s.c2, hue), cl = shift(s.cl, hue), g = s.g, seed = hashStr(s.id);
    const std = (o) => new T.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
    const kind = s.f.head.includes('veins') || s.id === 'blood' ? 'veins' : 'skin';
    const M = {
      skin: std({ map: skinTex(c, c2, kind, seed), roughness: s.id === 'drown' || s.id === 'blood' ? 0.45 : 0.85 }),
      dark: std({ color: c2, roughness: 0.9 }),
      cloth: std({ map: skinTex(cl, shift(cl, 0) === cl ? '#000000' : cl, 'cloth', seed + 1), roughness: 1, side: T.DoubleSide }),
      bone: std({ map: skinTex('#ddd2b6', '#9a8c6c', 'skin', seed + 2), roughness: 0.7 }),
      metal: std({ map: skinTex('#7d8a96', '#3a424b', 'metal', 7), metalness: 0.85, roughness: 0.35 }),
      gold: std({ color: '#d9a93f', metalness: 1, roughness: 0.3, emissive: '#3a2600', emissiveIntensity: 0.4 }),
      bandage: std({ map: skinTex('#d8c9a3', '#8b7a55', 'cloth', 9), roughness: 1 }),
      glow: new T.MeshBasicMaterial({ color: g }),
      glowSoft: new T.MeshBasicMaterial({ color: g, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }),
      socket: std({ color: '#050505', roughness: 1 }),
      teeth: std({ color: '#e9e2c8', roughness: 0.5 }),
      blood: std({ color: '#5a0610', roughness: 0.25, metalness: 0.1, emissive: '#200005' }),
      ice: std({ color: '#cfefff', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.75, emissive: '#2a6a8a', emissiveIntensity: 0.4 }),
      crystal: std({ color: g, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, emissive: g, emissiveIntensity: 0.6 }),
      wisp: new T.MeshBasicMaterial({ color: shift('#2a1640', hue), transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide }),
      plant: std({ color: '#2f5a2a', roughness: 0.9 }),
      cap: std({ color: cl, roughness: 0.8 }),
      shell: std({ color: '#9a9a8a', roughness: 0.9 }),
      flesh: std({ color: '#6a1018', roughness: 0.4 })
    };
    if (s.ghost) { M.skin.transparent = true; M.skin.opacity = 0.88; M.skin.emissive = new T.Color('#1a0f26'); }
    if (s.id === 'rad') { M.skin.emissive = new T.Color('#0e2a05'); }
    if (s.id === 'ember') { M.skin.emissive = new T.Color('#2a0800'); }
    return (matCache[key] = M);
  }

  /* ------------------------------------------------------------ đặc điểm dùng chung */
  function addSurface(g, M, F, r, rnd, yMin, yMax, cx, cy, cz, scaleK) {
    const k = scaleK || 1;
    const at = (n, fn) => { for (let i = 0; i < n; i++) { const p = onSphere(r, rnd, yMin, yMax); fn(p.add(new T.Vector3(cx, cy, cz)), p.clone().normalize()); } };
    if (F.includes('pustules')) at(8, (p) => { const m = mesh(new T.SphereGeometry(0.018 * k + rnd() * 0.014, 8, 6), M.glow); m.position.copy(p); g.add(m); });
    if (F.includes('sores')) at(7, (p) => { const m = mesh(new T.SphereGeometry(0.02 * k + rnd() * 0.012, 8, 6), M.glow); m.position.copy(p); g.add(m); });
    if (F.includes('tumor')) at(3, (p) => { const m = mesh(new T.SphereGeometry(0.04 * k + rnd() * 0.03, 10, 8), M.skin); m.position.copy(p); g.add(m); });
    if (F.includes('barnacle')) at(9, (p, n) => { const m = mesh(new T.ConeGeometry(0.018 * k, 0.03 * k, 6), M.shell); m.position.copy(p); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); g.add(m); });
    if (F.includes('plates')) at(5, (p, n) => { const m = mesh(new T.SphereGeometry(0.06 * k + rnd() * 0.03, 10, 6), M.cap); m.scale.set(1, 0.35, 1); m.position.copy(p); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); g.add(m); });
    if (F.includes('crystals')) at(5, (p, n) => { const m = mesh(new T.OctahedronGeometry(0.05 * k + rnd() * 0.04), M.crystal); m.scale.set(0.5, 1.6, 0.5); m.position.copy(p); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n.clone().add(new T.Vector3(0, 0.6, 0)).normalize()); g.add(m); });
    if (F.includes('cracks')) at(9, (p, n) => { const m = new T.Mesh(new T.BoxGeometry(0.008, 0.07 * k, 0.008), M.glow); m.position.copy(p); m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n); m.rotateZ(rnd() * PI); g.add(m); });
    if (F.includes('frost')) at(5, (p) => { const m = mesh(new T.SphereGeometry(0.05 * k, 8, 6), M.ice); m.scale.set(1, 0.5, 1); m.position.copy(p); g.add(m); });
    if (F.includes('drips')) at(5, (p) => { const m = mesh(new T.ConeGeometry(0.012 * k, 0.07 * k, 6), M.blood); m.rotation.x = PI; m.position.copy(p).add(new T.Vector3(0, -0.03, 0)); g.add(m); });
    if (F.includes('mush')) at(3, (p, n) => { const mg = new T.Group(); const st = mesh(new T.CylinderGeometry(0.012 * k, 0.016 * k, 0.07 * k, 6), M.bone); st.position.y = 0.035 * k; const cp = mesh(new T.SphereGeometry(0.05 * k, 12, 8, 0, PI * 2, 0, PI / 2), M.cap); cp.position.y = 0.06 * k; mg.add(st, cp); for (let i = 0; i < 3; i++) { const d = mesh(new T.SphereGeometry(0.008 * k, 6, 4), M.glow); d.position.set((rnd() - 0.5) * 0.06 * k, 0.09 * k, (rnd() - 0.5) * 0.06 * k); mg.add(d); } mg.position.copy(p); mg.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); g.add(mg); });
  }
  function weeds(g, M, rnd, n, len, at) { for (let i = 0; i < n; i++) { const pts = []; const b = at(i); for (let k = 0; k < 5; k++) pts.push(new T.Vector3(b.x + (rnd() - 0.5) * 0.04, b.y - k * len / 4, b.z + (rnd() - 0.5) * 0.04)); const m = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.008, 5, false), M.plant); g.add(m); } }
  function rings(g, mat, r, ys, rnd) { ys.forEach(y => { const m = mesh(new T.TorusGeometry(r, 0.012, 6, 20), mat); m.rotation.x = PI / 2 + (rnd() - 0.5) * 0.3; m.position.y = y; g.add(m); }); }
  function arcLine(color) { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); return new T.Line(geo, new T.LineBasicMaterial({ color, transparent: true, opacity: 0.9, blending: T.AdditiveBlending })); }
  function jitterArc(line, a, b, amp) { const p = line.geometry.attributes.position; for (let i = 0; i < 10; i++) { const k = i / 9; p.setXYZ(i, a.x + (b.x - a.x) * k + (i && i < 9 ? (Math.random() - 0.5) * amp : 0), a.y + (b.y - a.y) * k + (i && i < 9 ? (Math.random() - 0.5) * amp : 0), a.z + (b.z - a.z) * k + (i && i < 9 ? (Math.random() - 0.5) * amp : 0)); } p.needsUpdate = true; }
  function tentacle(g, mat, M, len, r0, n, base, dir, phase, anims) {
    const balls = []; for (let i = 0; i < n; i++) { const k = i / (n - 1), m = mesh(new T.SphereGeometry(r0 * (1 - k * 0.75), 10, 8), mat); g.add(m); balls.push(m); }
    const tip = mesh(new T.SphereGeometry(r0 * 0.3, 8, 6), M.glow); g.add(tip);
    const upd = t => { for (let i = 0; i < n; i++) { const k = i / (n - 1); const w = Math.sin(t * 2.2 + phase + k * 3) * 0.12 * k, w2 = Math.cos(t * 1.7 + phase + k * 2.5) * 0.1 * k; balls[i].position.set(base.x + dir.x * len * k + w, base.y + dir.y * len * k + w2, base.z + dir.z * len * k + w * 0.5); } tip.position.copy(balls[n - 1].position); };
    upd(0); anims.push(upd);
  }

  /* ------------------------------------------------------------ ĐẦU */
  function buildHead(s, hue) {
    const M = mats(s, hue), F = s.f.head, g = new T.Group(), rnd = rng(hashStr(s.id + 'h')), anims = [];
    const R = 0.18, skull = F.includes('skull');
    const hg = new T.SphereGeometry(R, 32, 24), hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) { let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); const ny = y / R;
      if (ny < 0) { x *= 1 - 0.28 * (-ny); z *= 1 - 0.08 * (-ny); if (z > 0) z += 0.03 * (-ny); }
      if (z > R * 0.5 && Math.abs(ny - 0.15) < 0.25 && Math.abs(x) > R * 0.15 && Math.abs(x) < R * 0.6) z -= 0.022 * (1 - Math.abs(ny - 0.15) / 0.25);
      if (z > 0 && ny < 0.05 && ny > -0.5 && Math.abs(x) > R * 0.45) x *= 0.94;
      if (z < 0 && ny > 0) z *= 1.08;
      hp.setXYZ(i, x, y, z); }
    hg.computeVertexNormals();
    const base = mesh(hg, skull ? M.bone : M.skin); base.scale.set(0.92, 1.12, 1); g.add(base);
    const eyeR = skull ? 0.05 : 0.036;
    [-1, 1].forEach(sd => {
      const sock = mesh(new T.SphereGeometry(eyeR, 12, 10), M.socket); sock.scale.set(1.25, skull ? 1 : 0.72, 0.6); sock.position.set(sd * 0.063, 0.03, 0.142); g.add(sock);
      const missing = F.includes('oneEye') && sd === 1;
      if (!missing && !F.includes('visor')) { const e = mesh(new T.SphereGeometry(skull ? 0.016 : 0.014, 10, 8), M.glow); e.position.set(sd * 0.063, 0.03, 0.158); e.userData.eye = true; g.add(e); const halo = mesh(new T.SphereGeometry(0.03, 10, 8), M.glowSoft); halo.position.copy(e.position); halo.userData.eye = true; g.add(halo); }
    });
    if (!skull && !F.includes('goldMask') && !F.includes('hood')) { const brow = mesh(new T.CylinderGeometry(0.022, 0.022, 0.2, 10), M.skin); brow.rotation.z = PI / 2; brow.scale.set(1, 1, 0.8); brow.position.set(0, 0.068, 0.138); g.add(brow); [-1, 1].forEach(sd => { const ck = mesh(new T.SphereGeometry(0.035, 10, 8), M.skin); ck.position.set(sd * 0.09, -0.02, 0.11); g.add(ck); }); const nose = mesh(new T.ConeGeometry(0.018, 0.035, 3), F.includes('jaw') ? M.socket : M.dark); nose.rotation.x = PI; nose.position.set(0, -0.015, 0.162); g.add(nose); }
    if (skull) { const ns = mesh(new T.ConeGeometry(0.022, 0.04, 3), M.socket); ns.position.set(0, -0.025, 0.17); ns.rotation.x = PI; g.add(ns); for (let i = 0; i < 7; i++) { const t = mesh(new T.BoxGeometry(0.016, 0.026, 0.012), M.teeth); t.position.set(-0.048 + i * 0.016, -0.085, 0.158); g.add(t); } }
    else { const mouth = mesh(new T.BoxGeometry(0.09, 0.012, 0.01), M.socket); mouth.position.set(0, -0.07, 0.172); g.add(mouth); }
    if (F.includes('jaw') || F.includes('bigJaw')) {
      const big = F.includes('bigJaw') ? 1.45 : 1, jaw = new T.Group(); jaw.position.set(0, -0.085, 0.02);
      const jm = mesh(new T.BoxGeometry(0.15 * big, 0.045 * big, 0.14), M.skin); jm.position.set(0, -0.02, 0.06); jaw.add(jm);
      for (let i = 0; i < 6; i++) { const t = mesh(new T.ConeGeometry(0.008, 0.022, 4), M.teeth); t.position.set(-0.05 * big + i * 0.02 * big, 0.008, 0.12); jaw.add(t); }
      if (big > 1) for (let i = 0; i < 3; i++) { const d = mesh(new T.ConeGeometry(0.01, 0.08, 6), M.glowSoft); d.rotation.x = PI; d.position.set(-0.04 + i * 0.04, -0.07, 0.12); jaw.add(d); }
      g.add(jaw); anims.push(t => { jaw.rotation.x = 0.28 + Math.sin(t * 2.3) * 0.12 + (g.userData.roar || 0) * 0.5; });
    }
    if (F.includes('hair')) for (let i = 0; i < 9; i++) { const h = mesh(seg(0.12 + rnd() * 0.1, 0.006, 0.003, 4), M.dark); const p = onSphere(R, rnd, 0.3, 0.9); h.position.copy(p); h.rotation.set(-0.6 - rnd() * 0.6, rnd() * PI * 2, (rnd() - 0.5)); g.add(h); }
    if (F.includes('brow')) { const b = mesh(new T.CylinderGeometry(0.04, 0.04, 0.26, 12), M.skin); b.rotation.z = PI / 2; b.scale.set(1, 1, 0.75); b.position.set(0, 0.075, 0.13); g.add(b); }
    if (F.includes('icicles')) for (let i = 0; i < 7; i++) { const c = mesh(new T.ConeGeometry(0.014, 0.06 + rnd() * 0.05, 6), M.ice); c.rotation.x = PI; c.position.set((rnd() - 0.5) * 0.24, -0.13 - rnd() * 0.03, 0.04 + rnd() * 0.1); g.add(c); }
    if (F.includes('horns')) [-1, 1].forEach(sd => { const h = mesh(new T.ConeGeometry(0.03, 0.14, 8), M.dark); h.position.set(sd * 0.11, 0.17, -0.02); h.rotation.z = -sd * 0.6; g.add(h); const tip = mesh(new T.SphereGeometry(0.01, 6, 4), M.glow); tip.position.set(sd * 0.16, 0.22, -0.02); g.add(tip); });
    if (F.includes('weed')) weeds(g, M, rnd, 4, 0.18, i => new T.Vector3(-0.12 + i * 0.08, 0.1, 0.05));
    if (F.includes('metal')) { const p = mesh(new T.SphereGeometry(R * 1.04, 20, 14, PI * 0.95, PI * 0.9, 0.2, PI * 0.7), M.metal); p.scale.copy(base.scale); g.add(p); for (let i = 0; i < 4; i++) { const b = mesh(new T.SphereGeometry(0.008, 6, 4), M.metal); const q = onSphere(R * 1.05, rnd, -0.2, 0.6); q.x = -Math.abs(q.x); b.position.copy(q); g.add(b); } }
    if (F.includes('visor')) { const v = mesh(new T.BoxGeometry(0.2, 0.035, 0.03), M.glow); v.position.set(0, 0.035, 0.17); v.userData.eye = true; g.add(v); const fr = mesh(new T.BoxGeometry(0.24, 0.06, 0.04), M.metal); fr.position.set(0, 0.035, 0.155); g.add(fr); }
    if (F.includes('hood')) { const h = mesh(new T.SphereGeometry(R * 1.32, 20, 14, 0, PI * 2, 0, PI * 0.62), M.wisp); h.position.set(0, 0.02, -0.03); h.rotation.x = -0.35; g.add(h); const tail = mesh(new T.ConeGeometry(0.16, 0.5, 14, 1, true), M.wisp); tail.position.set(0, -0.12, -0.15); tail.rotation.x = 0.5; g.add(tail); anims.push(t => { tail.rotation.z = Math.sin(t * 1.5) * 0.15; }); }
    if (F.includes('rods')) [-1, 1].forEach(sd => { const r = mesh(seg(0.16, 0.008, 0.008, 6), M.metal); r.rotation.x = PI; r.position.set(sd * 0.08, 0.15, -0.02); g.add(r); const b = mesh(new T.SphereGeometry(0.02, 8, 6), M.glow); b.position.set(sd * 0.08, 0.31, -0.02); g.add(b); });
    if (F.includes('arcs')) { const l = arcLine(s.g); g.add(l); anims.push(() => jitterArc(l, new T.Vector3(-0.08, 0.31, -0.02), new T.Vector3(0.08, 0.31, -0.02), 0.08)); }
    if (F.includes('crab')) {
      const c = mesh(new T.SphereGeometry(0.12, 16, 12), M.flesh); c.scale.set(1.1, 0.45, 1.2); c.position.set(0, 0.17, -0.02); g.add(c);
      const e = mesh(new T.SphereGeometry(0.022, 8, 6), M.glow); e.position.set(0, 0.2, 0.1); g.add(e);
      const legs = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; const l = mesh(seg(0.16, 0.012, 0.006, 5), M.flesh); l.position.set(Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1 - 0.02); l.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(l); legs.push(l); }
      anims.push(t => legs.forEach((l, i) => { l.rotation.y = Math.sin(t * 6 + i) * 0.12; }));
    }
    if (F.includes('mouthTent')) for (let i = 0; i < 4; i++) tentacle(g, M.flesh, M, 0.16, 0.014, 6, new T.Vector3(-0.03 + i * 0.02, -0.08, 0.16), new T.Vector3(0, -1, 0.3), i, anims);
    if (F.includes('fangs')) [-1, 1].forEach(sd => { const f = mesh(new T.ConeGeometry(0.008, 0.04, 6), M.teeth); f.rotation.x = PI; f.position.set(sd * 0.025, -0.085, 0.17); g.add(f); });
    if (F.includes('bandage')) { rings(g, M.bandage, R * 1.02, [0.11, 0.075, -0.03, -0.075, 0.14], rnd); }
    if (F.includes('goldMask')) { const m = mesh(new T.SphereGeometry(R * 1.05, 20, 14, PI * 0.25, PI * 0.5, PI * 0.2, PI * 0.62), M.gold); m.scale.copy(base.scale); g.add(m); const nem = mesh(new T.CylinderGeometry(0.2, 0.24, 0.2, 16, 1, true, -PI * 0.9, PI * 1.8), M.gold); nem.position.set(0, 0.02, -0.04); nem.rotation.y = PI; g.add(nem); const beard = mesh(new T.CylinderGeometry(0.018, 0.012, 0.09, 8), M.gold); beard.position.set(0, -0.2, 0.12); g.add(beard); }
    addSurface(g, M, F, R * 1.02, rnd, -0.5, 0.9, 0, 0, 0, 1);
    g.userData.anims = anims; return g;
  }

  /* ------------------------------------------------------------ THÂN */
  function buildTorso(s, hue) {
    const M = mats(s, hue), F = s.f.torso, g = new T.Group(), rnd = rng(hashStr(s.id + 't')), anims = [];
    const w = 0.27, h = 0.62, ribs = F.includes('ribs'), lean = F.includes('lean') ? 0.85 : 1;
    const body = new T.Group(); g.add(body); body.scale.set(lean, 1, lean);
    const prof = [[0.2, -0.31], [0.215, -0.24], [0.205, -0.12], [0.215, -0.02], [0.25, 0.08], [0.275, 0.17], [0.27, 0.25], [0.22, 0.31], [0.12, 0.35], [0.0, 0.36]].map(q => new T.Vector2(q[0] * (ribs ? 0.6 : 1), q[1]));
    const main = mesh(new T.LatheGeometry(prof, 28), ribs ? M.dark : M.skin); main.scale.z = 0.74; body.add(main);
    if (!ribs) { [-1, 1].forEach(sd => { const pec = mesh(new T.SphereGeometry(0.11, 14, 10), M.skin); pec.scale.set(1, 0.7, 0.5); pec.position.set(sd * 0.1, 0.17, 0.15); body.add(pec); }); }
    [-1, 1].forEach(sd => { const sh = mesh(new T.SphereGeometry(0.095, 14, 10), ribs ? M.bone : M.skin); sh.position.set(sd * (w + 0.02), 0.25, 0); body.add(sh); });
    const neck = mesh(new T.CylinderGeometry(0.06, 0.075, 0.16, 12), ribs ? M.bone : M.skin); neck.position.y = 0.37; g.add(neck);
    if (ribs) { const sp = mesh(new T.CylinderGeometry(0.03, 0.03, h + 0.1, 8), M.bone); sp.position.z = -0.08; body.add(sp); for (let i = 0; i < 6; i++) { const arc = PI * 1.25, rg = new T.TorusGeometry(0.2 - i * 0.012, 0.016, 6, 18, arc); rg.rotateZ(PI / 2 - arc / 2); rg.rotateX(PI / 2); const r = mesh(rg, M.bone); r.position.set(0, 0.22 - i * 0.075, 0); body.add(r); } const pel = mesh(new T.TorusGeometry(0.17, 0.03, 6, 16), M.bone); pel.rotation.x = PI / 2; pel.position.y = -0.3; body.add(pel); const heart = mesh(new T.SphereGeometry(0.05, 10, 8), M.glow); heart.position.set(0.03, 0.12, 0); body.add(heart); anims.push(t => { const k = 1 + Math.max(0, Math.sin(t * 5)) * 0.25; heart.scale.setScalar(k); }); }
    if (F.includes('rags')) { const r = mesh(new T.LatheGeometry([[0.215, -0.33], [0.225, -0.2], [0.218, -0.05], [0.26, 0.08], [0.286, 0.16]].map(q => new T.Vector2(q[0], q[1])), 28), M.cloth); r.scale.z = 0.76; body.add(r); for (let i = 0; i < 8; i++) { const fl = mesh(new T.PlaneGeometry(0.05 + rnd() * 0.04, 0.08 + rnd() * 0.08), M.cloth); const a = rnd() * PI * 2; fl.position.set(Math.sin(a) * w * 0.86, -0.36, Math.cos(a) * w * 0.86); fl.rotation.y = a; body.add(fl); } }
    if (F.includes('wound')) { const wd = mesh(new T.SphereGeometry(0.07, 12, 8), M.flesh); wd.scale.set(1, 1.3, 0.3); wd.position.set(-0.09, 0.08, w * 0.85); body.add(wd); for (let i = 0; i < 3; i++) { const rb = mesh(new T.CylinderGeometry(0.008, 0.008, 0.09, 6), M.bone); rb.rotation.z = PI / 2; rb.position.set(-0.09, 0.05 + i * 0.03, w * 0.9); body.add(rb); } }
    if (F.includes('stitches')) for (let i = 0; i < 2; i++) { const ln = mesh(new T.BoxGeometry(0.01, 0.4, 0.01), M.socket); ln.position.set(-0.06 + i * 0.14, 0.02, w * 0.93); ln.rotation.z = 0.25 - i * 0.5; body.add(ln); for (let k = 0; k < 6; k++) { const st = mesh(new T.BoxGeometry(0.05, 0.008, 0.008), M.socket); st.position.set(ln.position.x + (k - 2.5) * 0.06 * Math.sin(ln.rotation.z), -0.15 + k * 0.068, w * 0.95); st.rotation.z = ln.rotation.z; body.add(st); } }
    if (F.includes('pants')) { const belt = mesh(new T.CylinderGeometry(w * 0.84, w * 0.82, 0.07, 20), M.dark); belt.position.y = -0.29; body.add(belt); }
    if (F.includes('bloat')) { const b = mesh(new T.SphereGeometry(0.31, 22, 16), M.skin); b.position.set(0, -0.07, 0.07); body.add(b); anims.push(t => { const k = 1 + Math.sin(t * 1.6) * 0.03; b.scale.set(k, k, k); }); addSurface(body, M, ['pustules'], 0.31, rnd, -0.6, 0.6, 0, -0.07, 0.07, 1.4); }
    if (F.includes('icicles')) for (let i = 0; i < 10; i++) { const c = mesh(new T.ConeGeometry(0.018, 0.08 + rnd() * 0.08, 6), M.ice); c.rotation.x = PI; const a = rnd() * PI * 2; c.position.set(Math.sin(a) * (w + 0.02), 0.18 - rnd() * 0.05, Math.cos(a) * (w * 0.8)); body.add(c); }
    if (F.includes('cracks')) { const core = mesh(new T.SphereGeometry(0.07, 12, 10), M.glow); core.position.set(0, 0.12, w * 0.72); body.add(core); anims.push(t => { core.scale.setScalar(1 + Math.sin(t * 7) * 0.1 + Math.sin(t * 13) * 0.05); }); }
    if (F.includes('weed')) weeds(body, M, rnd, 6, 0.3, i => { const a = -1.2 + i * 0.5; return new T.Vector3(Math.sin(a) * w, 0.22, Math.cos(a) * w * 0.8); });
    if (F.includes('metal')) { const pl = mesh(new T.BoxGeometry(0.34, 0.3, 0.06), M.metal); pl.position.set(0, 0.1, w * 0.78); body.add(pl); [-1, 1].forEach(sd => { const pd = mesh(new T.SphereGeometry(0.11, 14, 10, 0, PI * 2, 0, PI / 2), M.metal); pd.position.set(sd * (w + 0.03), 0.28, 0); body.add(pd); }); }
    if (F.includes('core')) { const ring = mesh(new T.TorusGeometry(0.06, 0.015, 8, 20), M.metal); ring.position.set(0, 0.12, w * 0.82); body.add(ring); const cr = mesh(new T.CylinderGeometry(0.05, 0.05, 0.02, 20), M.glow); cr.rotation.x = PI / 2; cr.position.set(0, 0.12, w * 0.82); body.add(cr); anims.push(t => { cr.scale.setScalar(1 + Math.sin(t * 4) * 0.08); }); }
    if (F.includes('wisps')) { for (let i = 0; i < 5; i++) { const c = mesh(new T.ConeGeometry(0.1, 0.55, 10, 1, true), M.wisp); const a = (i / 5) * PI * 2; c.position.set(Math.sin(a) * 0.15, -0.45, Math.cos(a) * 0.12); c.rotation.x = PI; g.add(c); anims.push(t => { c.rotation.z = Math.sin(t * 1.3 + i) * 0.25; c.scale.y = 1 + Math.sin(t * 2 + i) * 0.15; }); } }
    if (F.includes('coils')) { rings(body, M.glow, w * 0.95, [0.2, 0.05, -0.1], rnd); }
    if (F.includes('arcs')) { const ls = [arcLine(s.g), arcLine(s.g)]; ls.forEach(l => g.add(l)); anims.push(() => { jitterArc(ls[0], new T.Vector3(-w, 0.25, 0.1), new T.Vector3(w * 0.5, -0.2, w * 0.8), 0.12); jitterArc(ls[1], new T.Vector3(w, 0.2, 0), new T.Vector3(-w * 0.4, -0.25, w * 0.8), 0.12); }); }
    if (F.includes('eggs')) for (let i = 0; i < 9; i++) { const e = mesh(new T.SphereGeometry(0.035 + rnd() * 0.025, 10, 8), M.glowSoft); const p = onSphere(w * 0.9, rnd, -0.6, 0.4); e.position.copy(p).add(new T.Vector3(0, -0.05, 0)); body.add(e); }
    if (F.includes('veins')) for (let i = 0; i < 6; i++) { const v = new T.Mesh(new T.BoxGeometry(0.008, 0.18, 0.008), M.glow); const a = -0.8 + i * 0.32; v.position.set(Math.sin(a) * w * 0.98, 0.0 + rnd() * 0.1, Math.cos(a) * w * 0.8); v.rotation.z = (rnd() - 0.5) * 0.8; body.add(v); }
    if (F.includes('bandage')) rings(body, M.bandage, w * 0.98, [-0.25, -0.17, -0.09, -0.01, 0.07, 0.15], rnd);
    if (F.includes('collar')) { const c = mesh(new T.TorusGeometry(0.2, 0.035, 8, 24), M.gold); c.rotation.x = PI / 2; c.position.y = 0.31; g.add(c); const gem = mesh(new T.OctahedronGeometry(0.03), M.glow); gem.position.set(0, 0.28, 0.2); g.add(gem); }
    addSurface(body, M, F.filter(f => f !== 'veins'), w, rnd, -0.5, 0.7, 0, 0.05, 0, 1.3);
    g.userData.anims = anims; g.userData.att = { neck: 0.45, shX: w + 0.07, shY: 0.25, hip: -h / 2 };
    return g;
  }

  /* ------------------------------------------------------------ TAY */
  function buildArm(s, hue, side) {
    const M = mats(s, hue), F = s.f.arm, g = new T.Group(), rnd = rng(hashStr(s.id + 'a' + side)), anims = [];
    const lean = F.includes('lean') ? 0.8 : 1, bone = F.includes('boneLimb'), mech = F.includes('mechLimb'), tent = F.includes('tentacle');
    const mat = bone ? M.bone : mech ? M.metal : M.skin;
    const up = mesh(seg(0.34, (bone ? 0.03 : 0.072) * lean, (bone ? 0.026 : 0.058) * lean), mat); g.add(up);
    const elbow = mesh(new T.SphereGeometry((bone ? 0.04 : 0.056) * lean, 12, 10), mat); elbow.position.y = -0.34; g.add(elbow);
    const fore = new T.Group(); fore.position.y = -0.34; fore.rotation.x = -0.3; g.add(fore);
    if (tent) { tentacle(fore, M.skin, M, 0.55, 0.05, 10, new T.Vector3(0, 0, 0), new T.Vector3(0, -1, 0.2), side, anims); }
    else {
      const fa = mesh(seg(0.32, (bone ? 0.024 : 0.055) * lean, (bone ? 0.02 : 0.045) * lean), mat); fore.add(fa);
      const hand = new T.Group(); hand.position.y = -0.32; fore.add(hand);
      const fist = F.includes('fist') ? 1.6 : 1;
      if (mech) { const wr = mesh(new T.CylinderGeometry(0.05, 0.05, 0.05, 12), M.metal); wr.position.y = -0.02; hand.add(wr); for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2; const pr = mesh(seg(0.12, 0.012, 0.006, 5), M.metal); pr.position.set(Math.cos(a) * 0.03, -0.04, Math.sin(a) * 0.03); pr.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); hand.add(pr); } const led = mesh(new T.SphereGeometry(0.012, 6, 4), M.glow); led.position.set(0, 0.0, 0.05); hand.add(led); }
      else {
        const palm = mesh(new T.BoxGeometry(0.09 * fist, 0.1 * fist, 0.04 * fist), bone ? M.bone : M.skin); palm.position.y = -0.05 * fist; hand.add(palm);
        const claws = F.includes('claws') || F.includes('longClaws');
        for (let i = 0; i < 4; i++) {
          const x = (-0.033 + i * 0.022) * fist;
          if (claws) { const len = F.includes('longClaws') ? 0.2 : 0.11; const c = mesh(new T.ConeGeometry(0.009 * fist, len, 5), F.includes('longClaws') ? M.wisp : M.dark); c.rotation.x = PI; c.position.set(x, -0.1 * fist - len / 2, 0.01); hand.add(c); }
          else { const f = mesh(seg(0.07 * fist, (bone ? 0.007 : 0.011) * fist, 0.008 * fist, 5), bone ? M.bone : M.skin); f.position.set(x, -0.1 * fist, 0); f.rotation.x = -0.25; hand.add(f); }
        }
        const th = mesh(seg(0.05 * fist, 0.011 * fist, 0.008 * fist, 5), bone ? M.bone : M.skin); th.position.set(0.05 * fist * -side, -0.04 * fist, 0.01); th.rotation.z = side * 0.6; hand.add(th);
      }
      if (F.includes('saw')) { const bl = mesh(new T.BoxGeometry(0.012, 0.4, 0.06), M.bone); bl.position.set(0, -0.18, 0.05); fore.add(bl); for (let i = 0; i < 8; i++) { const t = mesh(new T.ConeGeometry(0.012, 0.03, 4), M.bone); t.rotation.x = -PI / 2; t.position.set(0, -0.02 - i * 0.045, 0.09); fore.add(t); } }
      if (F.includes('blade')) { const bl = mesh(new T.OctahedronGeometry(0.1), M.crystal); bl.scale.set(0.25, 2.4, 0.5); bl.position.set(0, -0.36, 0.03); fore.add(bl); }
      if (F.includes('coils')) rings(fore, M.glow, 0.06, [-0.08, -0.15, -0.22], rnd);
      if (F.includes('coils')) { const l = arcLine(s.g); fore.add(l); anims.push(() => jitterArc(l, new T.Vector3(0, -0.08, 0.06), new T.Vector3(0, -0.42, 0.04), 0.07)); }
      if (F.includes('icicles')) for (let i = 0; i < 5; i++) { const c = mesh(new T.ConeGeometry(0.012, 0.06 + rnd() * 0.05, 6), M.ice); c.position.set((rnd() - 0.5) * 0.06, -0.05 - i * 0.05, 0.05); c.rotation.x = 1.2; fore.add(c); }
      if (F.includes('weed')) weeds(fore, M, rnd, 3, 0.2, i => new T.Vector3(-0.03 + i * 0.03, -0.1, 0.04));
      addSurface(fore, M, F.filter(f => f !== 'mush'), 0.05, rnd, -0.9, 0.9, 0, -0.16, 0, 0.8);
    }
    if (mech) { const ps = mesh(new T.CylinderGeometry(0.012, 0.012, 0.3, 6), M.glow); ps.position.set(0, -0.17, 0.07); g.add(ps); const j = mesh(new T.SphereGeometry(0.075, 12, 10), M.metal); g.add(j); }
    if (F.includes('sleeve')) { const sl = mesh(new T.CylinderGeometry(0.085, 0.075, 0.24, 12, 1, true), M.cloth); sl.position.y = -0.11; g.add(sl); }
    if (F.includes('bandage')) rings(g, M.bandage, 0.066, [-0.06, -0.14, -0.22, -0.3], rnd);
    if (F.includes('stitches')) { const st = mesh(new T.BoxGeometry(0.008, 0.2, 0.008), M.socket); st.position.set(0, -0.15, 0.066); g.add(st); }
    if (F.includes('mush')) { const t = new T.Group(); addSurface(t, M, ['mush'], 0.07, rnd, 0.3, 1, 0, 0, 0, 1); g.add(t); }
    addSurface(g, M, F.filter(f => f !== 'mush' && f !== 'crystals'), 0.06, rnd, -0.9, 0.2, 0, -0.17, 0, 0.8);
    const baseX = -1.15 - rnd() * 0.15, ph = rnd() * 6;
    g.rotation.set(baseX, 0, side * 0.12);
    anims.push(t => { g.rotation.x = baseX + Math.sin(t * 1.5 + ph) * 0.08 - (g.userData.roar || 0) * 0.5; g.rotation.z = side * (0.12 + (g.userData.roar || 0) * 0.5); });
    g.userData.anims = anims; return g;
  }

  /* ------------------------------------------------------------ CHÂN */
  function buildLegs(s, hue) {
    const M = mats(s, hue), F = s.f.leg, g = new T.Group(), rnd = rng(hashStr(s.id + 'l')), anims = [];
    const lean = F.includes('lean') ? 0.82 : 1, bone = F.includes('boneLimb'), mech = F.includes('mechLimb'), smoke = F.includes('smoke'), insect = F.includes('insect');
    const mat = bone ? M.bone : mech ? M.metal : M.skin;
    const pel = mesh(new T.SphereGeometry(0.2, 18, 12), F.includes('pants') ? M.cloth : (bone ? M.bone : M.skin)); pel.scale.set(1, 0.55, 0.72); pel.position.y = -0.04; g.add(pel);
    [-1, 1].forEach(sd => {
      const leg = new T.Group(); leg.position.set(sd * 0.11, -0.06, 0); leg.rotation.set(sd < 0 ? -0.32 : 0.12, 0, sd * 0.05); g.add(leg);
      const th = mesh(seg(0.46, (bone ? 0.035 : 0.085) * lean, (bone ? 0.03 : 0.068) * lean), smoke ? M.wisp : mat); leg.add(th);
      const knee = mesh(new T.SphereGeometry((bone ? 0.045 : 0.068) * lean, 12, 10), smoke ? M.wisp : mat); knee.position.y = -0.46; leg.add(knee);
      const sh = new T.Group(); sh.position.y = -0.46; sh.rotation.x = insect ? -0.6 : (sd < 0 ? 0.42 : 0.12); leg.add(sh);
      if (smoke) { const c = mesh(new T.ConeGeometry(0.09, 0.5, 12, 1, true), M.wisp); c.rotation.x = PI; c.position.y = -0.25; sh.add(c); anims.push(t => { c.scale.x = c.scale.z = 1 + Math.sin(t * 3 + sd) * 0.2; c.material.opacity = 0.4 + Math.sin(t * 2 + sd) * 0.15; }); }
      else {
        const shin = mesh(seg(0.44, (bone ? 0.028 : 0.068) * lean, (bone ? 0.022 : 0.05) * lean), mat); sh.add(shin);
        if (insect) { const ex = new T.Group(); ex.position.y = -0.44; ex.rotation.x = 1.0; sh.add(ex); const s2 = mesh(seg(0.22, 0.04, 0.02, 8), M.skin); ex.add(s2); const tip = mesh(new T.ConeGeometry(0.025, 0.08, 6), M.dark); tip.rotation.x = PI; tip.position.y = -0.26; ex.add(tip); }
        else { const foot = mesh(new T.BoxGeometry(0.1, 0.06, 0.22), mech ? M.metal : bone ? M.bone : M.dark); foot.position.set(0, -0.46, 0.05); sh.add(foot); }
        if (mech) { const ps = mesh(new T.CylinderGeometry(0.012, 0.012, 0.36, 6), M.glow); ps.position.set(0, -0.2, 0.08); sh.add(ps); }
        if (F.includes('coils')) rings(sh, M.glow, 0.07, [-0.1, -0.2, -0.3], rnd);
        if (F.includes('bandage')) rings(sh, M.bandage, 0.066, [-0.06, -0.15, -0.24, -0.33], rnd);
        addSurface(sh, M, F, 0.06, rnd, -0.9, 0.9, 0, -0.22, 0, 0.9);
      }
      if (F.includes('pants')) { const p = mesh(new T.CylinderGeometry(0.105 * lean, 0.09 * lean, 0.42, 12, 1, true), M.cloth); p.position.y = -0.2; leg.add(p); }
      if (F.includes('bandage')) rings(leg, M.bandage, 0.086, [-0.08, -0.18, -0.28, -0.38], rnd);
      addSurface(leg, M, F.filter(f => f !== 'pants'), 0.08, rnd, -0.9, 0.9, 0, -0.23, 0, 1);
    });
    g.userData.anims = anims; return g;
  }

  /* ------------------------------------------------------------ lắp ráp */
  function partOf(build, slot) { return SM[build[slot]] || SM.rot; }
  function bulk(s, k) { return (s.b && s.b[k]) || 1; }
  function assemble(build) {
    const hue = build.hue || 0, root = new T.Group();
    const sL = partOf(build, 'legs'), sT = partOf(build, 'torso'), sH = partOf(build, 'head'), sA = partOf(build, 'armL'), sB = partOf(build, 'armR');
    const kL = bulk(sL, 'leg'), kT = bulk(sT, 'torso'), kH = bulk(sH, 'head');
    const legs = buildLegs(sL, hue); legs.scale.setScalar(kL); const hipY = 0.96 * kL; legs.position.y = hipY;
    const torso = buildTorso(sT, hue); torso.scale.setScalar(kT); const att = torso.userData.att; torso.position.y = hipY - att.hip * kT;
    torso.rotation.x = 0.16; legs.position.y = hipY - 0.04;
    const head = buildHead(sH, hue); head.scale.setScalar(kH); head.position.set(0, torso.position.y + att.neck * kT * 0.97 + 0.13 * kH, 0.09 * kT);
    const armL = buildArm(sA, hue, -1), armR = buildArm(sB, hue, 1);
    [[armL, sA, -1], [armR, sB, 1]].forEach(([a, s, sd]) => { a.scale.setScalar(bulk(s, 'arm')); a.position.set(sd * att.shX * kT, torso.position.y + att.shY * kT * 0.98, 0.045 * kT); });
    const parts = { legs, torso, head, armL, armR };
    Object.values(parts).forEach(p => root.add(p));
    root.userData.parts = parts; root.userData.height = head.position.y + 0.2 * kH;
    return root;
  }
  function disposeTree(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }

  /* ------------------------------------------------------------ cảnh chính */
  let R = null, scene, camera, zombie = null, stage, container = null, raf = 0, last = 0, ro = null, flashLight, hemi, arcs = [], rods = [], spores;
  const ctl = { rotY: 0.4, vel: 0, pitch: 0.12, dist: 4.6, drag: false, auto: true, lastX: 0, lastY: 0, pinch: 0 };
  const fx = { drop: null, reanim: 0, flash: 0, onDone: null };
  function circleTex(draw) { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'); draw(x); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; return t; }
  function initMain() {
    if (R) return;
    R = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.outputEncoding = T.sRGBEncoding; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
    R.domElement.className = 'z3d-canvas';
    scene = new T.Scene(); scene.fog = new T.FogExp2(0x050806, 0.11);
    camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
    hemi = new T.HemisphereLight(0xb8bcb4, 0x0c0d0b, 0.5); scene.add(hemi);
    const key = new T.DirectionalLight(0xffe9d2, 1.3); key.position.set(2.4, 4.2, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 3; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0008; scene.add(key);
    const rim1 = new T.PointLight(0x7dff5a, 0.9, 9); rim1.position.set(-2.4, 2.3, -2); scene.add(rim1);
    const rim2 = new T.PointLight(0xb34dff, 1.0, 9); rim2.position.set(2.4, 1.9, -2.2); scene.add(rim2);
    const under = new T.PointLight(0x5aff3c, 0.45, 3.5); under.position.set(0, 0.35, 1.3); scene.add(under);
    flashLight = new T.PointLight(0xdff7ff, 0, 12); flashLight.position.set(0, 3.5, 1.5); scene.add(flashLight);
    stage = new T.Group(); scene.add(stage);
    const ped = mesh(new T.CylinderGeometry(1.0, 1.15, 0.24, 48), new T.MeshStandardMaterial({ color: 0x1a201b, metalness: 0.7, roughness: 0.45 })); ped.position.y = -0.12; ped.castShadow = false; ped.receiveShadow = true; stage.add(ped);
    const ring = new T.Mesh(new T.TorusGeometry(1.02, 0.025, 8, 64), new T.MeshBasicMaterial({ color: 0x7dff5a })); ring.rotation.x = PI / 2; ring.position.y = 0.0; stage.add(ring);
    const rune = new T.Mesh(new T.CircleGeometry(0.97, 64), new T.MeshBasicMaterial({ map: circleTex(x => { x.translate(128, 128); x.strokeStyle = 'rgba(125,255,90,.85)'; x.lineWidth = 2; [118, 100, 60].forEach(r => { x.beginPath(); x.arc(0, 0, r, 0, PI * 2); x.stroke(); }); x.font = '14px serif'; x.fillStyle = 'rgba(125,255,90,.9)'; const gl = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'; for (let i = 0; i < 24; i++) { x.save(); x.rotate(i / 24 * PI * 2); x.fillText(gl[i], -4, -104); x.restore(); } for (let i = 0; i < 6; i++) { x.save(); x.rotate(i / 6 * PI * 2); x.beginPath(); x.moveTo(0, -60); x.lineTo(0, -100); x.stroke(); x.restore(); } x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + PI / 6; x.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); } x.closePath(); x.stroke(); }), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    rune.rotation.x = -PI / 2; rune.position.y = 0.005; stage.add(rune); stage.userData.rune = rune;
    const floor = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshStandardMaterial({ color: 0x070b07, roughness: 1 })); floor.rotation.x = -PI / 2; floor.position.y = -0.24; floor.receiveShadow = true; scene.add(floor);
    [-1, 1].forEach(sd => { const rod = new T.Group(); rod.position.set(sd * 1.7, -0.24, -0.7); const p = mesh(new T.CylinderGeometry(0.05, 0.09, 2.4, 10), new T.MeshStandardMaterial({ color: 0x2a2f2a, metalness: 0.8, roughness: 0.4 })); p.position.y = 1.2; rod.add(p); for (let i = 0; i < 5; i++) { const c = mesh(new T.TorusGeometry(0.12, 0.02, 6, 18), new T.MeshStandardMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.3 })); c.rotation.x = PI / 2; c.position.y = 1.5 + i * 0.12; rod.add(c); } const b = new T.Mesh(new T.SphereGeometry(0.12, 16, 12), new T.MeshBasicMaterial({ color: 0x9dff6a })); b.position.y = 2.5; rod.add(b); scene.add(rod); rods.push(new T.Vector3(sd * 1.7, 2.26, -0.7)); });
    for (let i = 0; i < 4; i++) { const l = arcLine(0xd8ffef); l.visible = false; scene.add(l); arcs.push(l); }
    const N = 220, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, r = 0.6 + Math.random() * 3.2; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 4; pos[i * 3 + 2] = Math.sin(a) * r - 0.5; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3));
    spores = new T.Points(sg, new T.PointsMaterial({ size: 0.045, map: circleTex(x => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(200,255,150,1)'); g.addColorStop(1, 'rgba(120,255,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xb6ff7a }));
    scene.add(spores);
    // điều khiển xoay / thu phóng
    const el = R.domElement, pts = new Map();
    el.addEventListener('pointerdown', e => { pts.set(e.pointerId, e); el.setPointerCapture(e.pointerId); ctl.drag = true; ctl.auto = false; ctl.lastX = e.clientX; ctl.lastY = e.clientY; if (pts.size === 2) { const [a, b] = [...pts.values()]; ctl.pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); } });
    el.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e); if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (ctl.pinch) ctl.dist = Math.min(7, Math.max(2.8, ctl.dist * ctl.pinch / d)); ctl.pinch = d; return; } const dx = e.clientX - ctl.lastX, dy = e.clientY - ctl.lastY; ctl.lastX = e.clientX; ctl.lastY = e.clientY; ctl.rotY += dx * 0.01; ctl.vel = dx * 0.01; ctl.pitch = Math.min(0.5, Math.max(-0.15, ctl.pitch + dy * 0.004)); });
    const up = e => { pts.delete(e.pointerId); if (!pts.size) { ctl.drag = false; ctl.pinch = 0; setTimeout(() => { if (!ctl.drag) ctl.auto = true; }, 4000); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); ctl.dist = Math.min(7, Math.max(2.8, ctl.dist * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });
  }
  function resize() { if (!container || !R) return; const w = container.clientWidth || 300, h = container.clientHeight || 300; R.setSize(w, h, false); R.domElement.style.width = '100%'; R.domElement.style.height = '100%'; camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; const t = now / 1000;
    if (document.hidden) return;
    if (!ctl.drag) { ctl.rotY += ctl.vel; ctl.vel *= 0.92; if (ctl.auto) ctl.rotY += dt * 0.35; }
    const h = zombie ? zombie.userData.height : 2, ty = h * 0.5, dd = ctl.dist * Math.max(1, h / 2.05) * Math.max(1, 0.95 / (camera.aspect || 1));
    camera.position.set(0, ty + 0.15 + ctl.pitch * dd, dd); camera.lookAt(0, ty - 0.05, 0);
    stage.rotation.y = ctl.rotY; if (stage.userData.rune) stage.userData.rune.rotation.z = t * 0.2;
    const p = spores.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * 0.18; if (y > 4) y = 0; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * 0.0008); } p.needsUpdate = true;
    if (zombie) {
      const parts = zombie.userData.parts; let roar = 0;
      if (fx.reanim > 0) { fx.reanim -= dt; const k = fx.reanim; if (k > 1.0) { zombie.position.x = (Math.random() - 0.5) * 0.05; zombie.rotation.z = (Math.random() - 0.5) * 0.06; } else { zombie.position.x = 0; zombie.rotation.z = 0; roar = Math.sin(Math.min(1, (1.0 - k) / 0.9) * PI); } if (fx.reanim <= 0 && fx.onDone) { const f = fx.onDone; fx.onDone = null; f(); } }
      Object.values(parts).forEach(pt => { pt.userData.roar = roar; (pt.userData.anims || []).forEach(a => a(t, dt)); });
      parts.torso.rotation.z = Math.sin(t * 0.9) * 0.025; parts.torso.rotation.x = 0.16 + Math.sin(t * 1.2) * 0.02 - roar * 0.12; parts.head.rotation.z = Math.sin(t * 0.7) * 0.08; parts.head.rotation.x = 0.18 + Math.sin(t * 1.1) * 0.05 - roar * 0.6;
      zombie.traverse(n => { if (n.userData.eye) n.scale.setScalar(1 + roar * 0.8 + (fx.reanim > 1 ? Math.random() : 0)); });
      if (fx.drop) { fx.drop.t += dt; const k = Math.min(1, fx.drop.t / 0.5), e = 1 - Math.pow(1 - k, 3), b = k < 1 ? 0 : 0; fx.drop.obj.position.y = fx.drop.y + (1 - e) * 1.4 + b; if (k >= 1) { fx.drop.obj.position.y = fx.drop.y; fx.drop = null; } }
    }
    const arcOn = fx.reanim > 0.9;
    arcs.forEach((l, i) => { l.visible = arcOn; if (arcOn) jitterArc(l, rods[i % 2], new T.Vector3((Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.8, 0), 0.5); });
    flashLight.intensity = fx.flash > 0 ? (fx.flash -= dt, 6 * Math.random()) : 0; hemi.intensity = 0.5 + (arcOn ? Math.random() * 0.9 : 0);
    R.render(scene, camera);
  }

  /* ------------------------------------------------------------ ảnh thu nhỏ */
  let TR = null, tScene, tCam;
  function initThumb() {
    if (TR) return;
    TR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); TR.setPixelRatio(1); TR.outputEncoding = T.sRGBEncoding; TR.setClearColor(0x000000, 0);
    tScene = new T.Scene(); tScene.add(new T.HemisphereLight(0xc8dcc8, 0x101810, 0.9));
    const k = new T.DirectionalLight(0xffffff, 1.0); k.position.set(1.5, 2, 3); tScene.add(k);
    const r1 = new T.PointLight(0x7dff5a, 1.0, 8); r1.position.set(-2, 1, -1.5); tScene.add(r1);
    const r2 = new T.PointLight(0xb34dff, 0.8, 8); r2.position.set(2, 1, -1.5); tScene.add(r2);
    tCam = new T.PerspectiveCamera(30, 1, 0.01, 50);
  }
  function renderObj(obj, size, yaw) {
    initThumb(); TR.setSize(size, size, false);
    const holder = new T.Group(); holder.add(obj); holder.rotation.y = yaw == null ? 0.45 : yaw; tScene.add(holder);
    (obj.userData.anims || []).forEach(a => a(1.2, 0));
    obj.traverse(n => { if (n.userData && n.userData.anims) n.userData.anims.forEach(a => a(1.2, 0)); });
    const box = new T.Box3().setFromObject(holder), c = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3());
    const m = Math.max(sz.x, sz.y, sz.z), d = m / (2 * Math.tan(15 * PI / 180)) * 1.15;
    tCam.position.set(c.x, c.y + m * 0.08, c.z + d); tCam.lookAt(c); tCam.near = d / 20; tCam.far = d * 5; tCam.updateProjectionMatrix();
    TR.render(tScene, tCam); const url = TR.domElement.toDataURL('image/png');
    tScene.remove(holder); disposeTree(obj); return url;
  }
  const thumbCache = {};

  window.ZLab3D = {
    mount(el) { initMain(); container = el; el.appendChild(R.domElement); resize(); if (ro) ro.disconnect(); ro = new ResizeObserver(resize); ro.observe(el); if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } },
    unmount() { if (raf) cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); ro = null; if (R && R.domElement.parentNode) R.domElement.parentNode.removeChild(R.domElement); container = null; },
    show(build, changed) {
      initMain();
      if (zombie) { stage.remove(zombie); disposeTree(zombie); }
      zombie = assemble(build); stage.add(zombie);
      if (changed) { const o = zombie.userData.parts[changed]; if (o) fx.drop = { obj: o, y: o.position.y, t: 0 }; }
    },
    reanimate() { return new Promise(res => { fx.reanim = 2.2; fx.flash = 1.1; fx.onDone = res; ctl.auto = false; ctl.vel = 0; ctl.rotY = Math.round(ctl.rotY / (PI * 2)) * PI * 2; setTimeout(() => { ctl.auto = true; }, 3500); }); },
    thumb(type, strainId) {
      const key = type + strainId; if (thumbCache[key]) return thumbCache[key];
      const s = SM[strainId]; let o;
      if (type === 'head') o = buildHead(s, 0); else if (type === 'torso') o = buildTorso(s, 0); else if (type === 'arm') { o = buildArm(s, 0, 1); o.rotation.set(-0.35, 0, 0.1); } else o = buildLegs(s, 0);
      return (thumbCache[key] = renderObj(o, 168, type === 'arm' ? 1.2 : 0.4));
    },
    snapshot(build, size) { const o = assemble(build); return renderObj(o, size || 280, 0.35); },
    setAuto(v) { ctl.auto = v; },
    resetView() { ctl.dist = 4.6; ctl.pitch = 0.12; }
  };
})();
