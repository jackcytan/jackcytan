/* Vẽ chứng chỉ & bằng công nhận lên canvas (thiết kế ở hệ toạ độ 2000×1414 – tỉ lệ A4 ngang). */
(function () {
  const W = 2000, H = 1414, NAVY = '#0e1d45', INK = '#1a3a8f';
  const ISSUER = 'CHUYÊN GIA AI NGUYỄN VĂN TÂN';

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function certId(name, code, date) { return 'TAI-' + code + '-' + hash(name + '|' + code + '|' + date).toString(36).toUpperCase().padStart(7, '0').slice(0, 7); }

  function gold(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#8a5a12'); g.addColorStop(0.2, '#e3b858'); g.addColorStop(0.42, '#fff0b3');
    g.addColorStop(0.6, '#d19e37'); g.addColorStop(0.82, '#f7dc8c'); g.addColorStop(1, '#91611a');
    return g;
  }
  function F(w, s, fam) { return w + ' ' + s + 'px ' + fam; }
  const PF = '"Playfair Display", Georgia, serif', GV = '"Great Vibes", "Brush Script MT", cursive', CZ = 'Cinzel, "Times New Roman", serif', BV = '"Be Vietnam Pro", system-ui, sans-serif';

  function spaced(ctx, text, x, y, sp, align) {
    const ch = Array.from(text); let w = 0;
    const ws = ch.map(c => { const m = ctx.measureText(c).width; w += m; return m; });
    w += sp * (ch.length - 1);
    let cx = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    const pa = ctx.textAlign; ctx.textAlign = 'left';
    ch.forEach((c, i) => { ctx.fillText(c, cx, y); cx += ws[i] + sp; });
    ctx.textAlign = pa; return w;
  }
  function fit(ctx, text, maxW, weight, size, fam, min) {
    let s = size; ctx.font = F(weight, s, fam);
    while (ctx.measureText(text).width > maxW && s > (min || 20)) { s -= 2; ctx.font = F(weight, s, fam); }
    return s;
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    if (lines.length === 2) { // cân bằng 2 dòng
      let best = null;
      for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width); if (m <= maxW && (!best || m < best[0])) best = [m, a, b]; }
      if (best) return [best[1], best[2]];
    }
    return lines;
  }
  function rosette(ctx, cx, cy, A, B, m, n, color, lw, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.strokeStyle = color; ctx.lineWidth = lw;
    for (let k = 0; k < n; k++) {
      ctx.beginPath(); const ph = k * Math.PI * 2 / n / m;
      for (let i = 0; i <= 720; i++) { const t = i / 720 * Math.PI * 2; const x = A * Math.cos(t + ph) + B * Math.cos(m * t); const y = A * Math.sin(t + ph) - B * Math.sin(m * t); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function waves(ctx, y0, y1, color, gap) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    for (let y = y0, k = 0; y < y1; y += gap, k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) { const yy = y + 9 * Math.sin(x / 70 + k * 0.45) + 5 * Math.sin(x / 27 - k * 0.2); x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function diamond(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y); ctx.closePath(); ctx.fill(); }
  function divider(ctx, cx, y, half, fill) {
    ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = fill;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - 22, y); ctx.moveTo(cx + 22, y); ctx.lineTo(cx + half, y); ctx.stroke();
    diamond(ctx, cx, y, 11); diamond(ctx, cx - half - 10, y, 5); diamond(ctx, cx + half + 10, y, 5);
    ctx.restore();
  }
  function corner(ctx, x, y, sx, sy, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx * 0.82, sy * 0.82); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 175); ctx.lineTo(0, 0); ctx.lineTo(175, 0); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, 140); ctx.lineTo(18, 18); ctx.lineTo(140, 18); ctx.stroke();
    ctx.lineWidth = 2.5; [70, 54].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0.06, Math.PI / 2 - 0.06); ctx.stroke(); });
    diamond(ctx, 34, 34, 13);
    // cuộn hoa văn ở hai đầu
    [[175, 0, 0], [0, 175, 1]].forEach(([px, py, v]) => {
      ctx.save(); ctx.translate(px, py); if (v) ctx.rotate(Math.PI / 2);
      ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 3.2, r = 22 * (1 - i / 75); const xx = 6 + r * Math.cos(t - Math.PI / 2), yy = 22 + r * Math.sin(t - Math.PI / 2) - 22; i ? ctx.lineTo(xx, yy + 22) : ctx.moveTo(xx, yy + 22); }
      ctx.stroke(); ctx.restore();
    });
    // lá nhỏ dọc cung tròn
    for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI / 2; ctx.save(); ctx.translate(Math.cos(a) * 92, Math.sin(a) * 92); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function arcText(ctx, text, cx, cy, r, font, color) {
    ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ch = Array.from(text), ws = ch.map(c => ctx.measureText(c).width + 3), tot = ws.reduce((a, b) => a + b, 0);
    let a = -Math.PI / 2 - tot / r / 2;
    ch.forEach((c, i) => { const aa = a + ws[i] / r / 2; ctx.save(); ctx.translate(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r); ctx.rotate(aa + Math.PI / 2); ctx.fillText(c, 0, 0); ctx.restore(); a += ws[i] / r; });
    ctx.restore();
  }
  function emblem(ctx, cx, cy, R, dark) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = gold(ctx, cx - R, cy - R, cx + R, cy + R); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    const g = ctx.createRadialGradient(cx, cy - R * 0.4, 4, cx, cy, R); g.addColorStop(0, '#2a4aa0'); g.addColorStop(1, '#0a1533');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,140,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, 0, Math.PI * 2); ctx.stroke();
    // mũ tốt nghiệp + mạng nơ-ron
    ctx.fillStyle = gold(ctx, cx - R, cy - R, cx + R, cy); ctx.beginPath();
    ctx.moveTo(cx, cy - R * 0.55); ctx.lineTo(cx + R * 0.5, cy - R * 0.33); ctx.lineTo(cx, cy - R * 0.11); ctx.lineTo(cx - R * 0.5, cy - R * 0.33); ctx.closePath(); ctx.fill();
    ctx.font = F(900, R * 0.62, PF); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('AI', cx, cy + R * 0.48);
    ctx.restore();
  }
  function seal(ctx, cx, cy, R, label, sub, ribbon) {
    ctx.save();
    if (ribbon) {
      [[-1, '#13286a'], [1, '#9b1c2c']].forEach(([s, c]) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(s * 0.32);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-30, 20); ctx.lineTo(30, 20); ctx.lineTo(30, R + 70); ctx.lineTo(0, R + 48); ctx.lineTo(-30, R + 70); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,120,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, 30); ctx.lineTo(-22, R + 56); ctx.moveTo(22, 30); ctx.lineTo(22, R + 56); ctx.stroke();
        ctx.restore();
      });
    }
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
    const pts = 56; ctx.beginPath();
    for (let i = 0; i <= pts * 2; i++) { const a = i / (pts * 2) * Math.PI * 2, r = i % 2 ? R * 0.92 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    const rg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, 5, cx, cy, R); rg.addColorStop(0, '#fff4c2'); rg.addColorStop(0.45, '#e2b14c'); rg.addColorStop(1, '#8c5c14');
    ctx.fillStyle = rg; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#7a4e10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R * 0.84, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = gold(ctx, cx - R, cy - R, cx + R, cy + R); ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2); ctx.fill();
    const ng = ctx.createRadialGradient(cx, cy - R * 0.3, 2, cx, cy, R * 0.62); ng.addColorStop(0, '#1f3f95'); ng.addColorStop(1, '#0a1533');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2); ctx.fill();
    rosette(ctx, cx, cy, R * 0.34, R * 0.2, 9, 3, 'rgba(255,215,120,.28)', 1);
    arcText(ctx, label, cx, cy, R * 0.71, F(700, R * 0.13, CZ), '#4a2f05');
    ctx.fillStyle = gold(ctx, cx - R * 0.5, cy - R * 0.5, cx + R * 0.5, cy + R * 0.5);
    ctx.textAlign = 'center'; ctx.font = F(900, R * 0.42, PF); ctx.fillText('AI', cx, cy + R * 0.12);
    ctx.font = F(700, R * 0.11, CZ); spaced(ctx, sub, cx, cy + R * 0.33, 3);
    // ngôi sao
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.04 : R * 0.1; ctx.lineTo(cx + Math.cos(a) * r, cy - R * 0.36 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function laurel(ctx, cx, cy, R, fill) {
    ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    [-1, 1].forEach(s => {
      const a0 = s < 0 ? Math.PI * 0.6 : Math.PI * 0.4, a1 = s < 0 ? Math.PI * 1.38 : -Math.PI * 0.38;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1, s > 0); ctx.stroke();
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * (i + 0.5) / n, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const tx = s < 0 ? -Math.sin(a) : Math.sin(a), ty = s < 0 ? Math.cos(a) : -Math.cos(a);
        const th = Math.atan2(tx, -ty), sz = 1 - i / n * 0.35;
        [-0.62, 0.62].forEach(tilt => { ctx.save(); ctx.translate(x, y); ctx.rotate(th + tilt); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(11 * sz, -18 * sz, 0, -40 * sz); ctx.quadraticCurveTo(-11 * sz, -18 * sz, 0, 0); ctx.fill(); ctx.restore(); });
      }
      ctx.save(); const ex = cx + Math.cos(a1) * R, ey = cy + Math.sin(a1) * R; const ta = s < 0 ? a1 + Math.PI / 2 : a1 - Math.PI / 2;
      ctx.translate(ex, ey); ctx.rotate(Math.atan2(Math.sin(ta), Math.cos(ta)) + Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -16, 0, -36); ctx.quadraticCurveTo(-10, -16, 0, 0); ctx.fill(); ctx.restore();
    });
    ctx.restore();
  }
  function bandLabel(ctx, text, bandFill, color) {
    ctx.save(); ctx.font = F(700, 17, BV); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ch = Array.from(text); let w = ch.reduce((a, c) => a + ctx.measureText(c).width, 0) + 4 * (ch.length - 1);
    ctx.fillStyle = bandFill; ctx.fillRect(W / 2 - w / 2 - 26, 30, w + 52, 32);
    ctx.fillStyle = color; spaced(ctx, text, W / 2, 47, 4); ctx.restore();
  }
  function signature(ctx, x, y, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
    ctx.fillStyle = col; ctx.font = F(400, 92, GV); ctx.textAlign = 'center';
    ctx.fillText('Nguyễn Văn Tân', 0, 0);
    ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(-200, 22); ctx.bezierCurveTo(-60, 40, 90, 6, 230, 14); ctx.bezierCurveTo(260, 16, 250, 34, 214, 34); ctx.stroke();
    ctx.restore();
  }
  function paper(ctx, base, edge, speck) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.75);
    g.addColorStop(0, base); g.addColorStop(1, edge); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rng(7); ctx.fillStyle = speck;
    for (let i = 0; i < 5000; i++) ctx.fillRect(r() * W, r() * H, 1.6, 1.6);
  }
  function frameBand(ctx, inset, thick, bandFill, lineFill, dotFill) {
    ctx.save();
    ctx.fillStyle = bandFill; ctx.beginPath(); ctx.rect(inset, inset, W - inset * 2, H - inset * 2); ctx.rect(inset + thick, inset + thick, W - (inset + thick) * 2, H - (inset + thick) * 2); ctx.fill('evenodd');
    ctx.strokeStyle = lineFill; ctx.lineWidth = 2.5;
    ctx.strokeRect(inset + 5, inset + 5, W - (inset + 5) * 2, H - (inset + 5) * 2);
    ctx.strokeRect(inset + thick - 5, inset + thick - 5, W - (inset + thick - 5) * 2, H - (inset + thick - 5) * 2);
    ctx.fillStyle = dotFill; const m = inset + thick / 2;
    for (let x = m + 30; x < W - m - 20; x += 34) { diamond(ctx, x, m, 6); diamond(ctx, x, H - m, 6); }
    for (let y = m + 30; y < H - m - 20; y += 34) { diamond(ctx, m, y, 6); diamond(ctx, W - m, y, 6); }
    ctx.restore();
  }
  function rankOf(p, fin) { return fin ? (p >= 95 ? 'Xuất sắc' : p >= 88 ? 'Giỏi' : 'Khá') : (p >= 100 ? 'Xuất sắc' : p >= 90 ? 'Giỏi' : 'Khá'); }

  // ---------------------------------------------------------------- module
  function drawModule(ctx, d) {
    paper(ctx, '#fffdf6', '#efe2c2', 'rgba(150,110,40,.035)');
    waves(ctx, 150, H - 150, 'rgba(180,135,50,.07)', 26);
    rosette(ctx, W / 2, 760, 230, 120, 13, 4, 'rgba(180,135,50,.07)', 1.2);
    rosette(ctx, W / 2, 760, 150, 70, 17, 3, 'rgba(14,29,69,.05)', 1);
    frameBand(ctx, 26, 40, NAVY, 'rgba(230,190,100,.9)', 'rgba(230,190,100,.75)');
    const gl = gold(ctx, 0, 0, W, H);
    ctx.strokeStyle = gl; ctx.lineWidth = 5; ctx.strokeRect(84, 84, W - 168, H - 168);
    ctx.lineWidth = 1.5; ctx.strokeRect(98, 98, W - 196, H - 196);
    const cg = gold(ctx, 0, 0, 300, 300);
    corner(ctx, 112, 112, 1, 1, cg); corner(ctx, W - 112, 112, -1, 1, cg); corner(ctx, 112, H - 112, 1, -1, cg); corner(ctx, W - 112, H - 112, -1, -1, cg);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    emblem(ctx, W / 2, 205, 66);
    ctx.fillStyle = NAVY; ctx.font = F(800, 28, CZ); spaced(ctx, 'TÂN AI ACADEMY', W / 2, 318, 11);
    ctx.save(); ctx.shadowColor = 'rgba(80,50,0,.35)'; ctx.shadowOffsetY = 4; ctx.shadowBlur = 6;
    ctx.fillStyle = gold(ctx, 600, 330, 1400, 450); ctx.font = F(900, 132, PF); ctx.fillText('CHỨNG CHỈ', W / 2, 455); ctx.restore();
    ctx.fillStyle = '#26386b'; ctx.font = F(600, 28, CZ); const cw = spaced(ctx, 'CERTIFICATE OF ACHIEVEMENT', W / 2, 510, 10);
    divider(ctx, W / 2 - cw / 2 - 90, 500, 50, gl); divider(ctx, W / 2 + cw / 2 + 90, 500, 50, gl);
    ctx.fillStyle = '#5b4a2a'; ctx.font = F('italic 700', 38, PF); ctx.fillText('Trân trọng chứng nhận', W / 2, 588);
    const ns = fit(ctx, d.name, 1320, 400, 150, GV, 70);
    ctx.save(); ctx.fillStyle = NAVY; ctx.shadowColor = 'rgba(14,29,69,.18)'; ctx.shadowOffsetY = 3; ctx.shadowBlur = 4;
    ctx.font = F(400, ns, GV); ctx.fillText(d.name, W / 2, 722); ctx.restore();
    divider(ctx, W / 2, 768, 480, gl);
    ctx.fillStyle = '#3b3b3b'; ctx.font = F(400, 31, BV); ctx.fillText('đã hoàn thành học phần', W / 2, 828);
    ctx.fillStyle = NAVY; ctx.font = F(700, 54, PF);
    let lines = wrap(ctx, d.title.toUpperCase(), 1450);
    if (lines.length > 2) { ctx.font = F(700, 44, PF); lines = wrap(ctx, d.title.toUpperCase(), 1500); }
    let y = 898; lines.forEach(l => { ctx.fillText(l, W / 2, y); y += 62; });
    ctx.fillStyle = '#6b5a3a'; ctx.font = F(400, 25, BV);
    ctx.fillText('Mã học phần ' + d.code + '  ·  ' + d.program, W / 2, y - 8);
    const pill = 'Điểm thi: ' + d.score + '/100   ·   Xếp loại: ' + rankOf(d.score), py = y + 48;
    ctx.font = F(600, 29, BV); const pw = ctx.measureText(pill).width + 70;
    ctx.save(); ctx.strokeStyle = gl; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(14,29,69,.04)';
    ctx.beginPath(); ctx.roundRect(W / 2 - pw / 2, py - 40, pw, 58, 29); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = NAVY; ctx.fillText(pill, W / 2, py);

    // chân trang
    const by = 1232;
    ctx.fillStyle = NAVY; ctx.font = F(700, 42, PF); ctx.fillText(d.date, 475, by - 18);
    ctx.strokeStyle = '#8b6b2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(305, by); ctx.lineTo(645, by); ctx.stroke();
    ctx.font = F(700, 21, BV); ctx.fillStyle = '#6b5a3a'; spaced(ctx, 'NGÀY CẤP', 475, by + 34, 5);
    ctx.font = F(400, 19, BV); ctx.fillText('Số hiệu: ' + d.id, 475, by + 66);

    seal(ctx, W / 2, 1208, 94, 'TÂN AI ACADEMY  ★  CERTIFIED  ★  ', 'CERTIFIED', true);

    signature(ctx, 1525, by - 30, INK);
    ctx.strokeStyle = '#8b6b2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1345, by); ctx.lineTo(1705, by); ctx.stroke();
    ctx.fillStyle = NAVY; ctx.font = F(800, 23, BV); ctx.fillText(ISSUER, 1525, by + 36);
    ctx.fillStyle = '#6b5a3a'; ctx.font = F('italic 700', 22, PF); ctx.fillText('Người cấp chứng chỉ', 1525, by + 68);

    bandLabel(ctx, 'TÂN AI ACADEMY  ·  PHÁT TRIỂN BỞI TÂN AI', NAVY, '#f1d48a');
  }

  // ---------------------------------------------------------------- final
  function drawFinal(ctx, d) {
    const bg = ctx.createRadialGradient(W / 2, 520, 80, W / 2, 700, W * 0.75);
    bg.addColorStop(0, '#1b2b66'); bg.addColorStop(0.55, '#0b1433'); bg.addColorStop(1, '#04070f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const r = rng(3); ctx.fillStyle = 'rgba(255,220,150,.05)'; for (let i = 0; i < 2500; i++) ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
    waves(ctx, 140, H - 140, 'rgba(230,190,100,.06)', 24);
    rosette(ctx, W / 2, 720, 260, 130, 15, 4, 'rgba(230,190,100,.07)', 1.2);
    // tia sáng
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(W / 2, 420, 0, W / 2, 420, 700); lg.addColorStop(0, 'rgba(255,210,120,.16)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
    const gl = gold(ctx, 0, 0, W, H);
    frameBand(ctx, 26, 40, gold(ctx, 0, 0, W, H), 'rgba(60,35,0,.7)', 'rgba(60,35,0,.55)');
    ctx.strokeStyle = gl; ctx.lineWidth = 3; ctx.strokeRect(86, 86, W - 172, H - 172);
    ctx.lineWidth = 1.2; ctx.strokeRect(100, 100, W - 200, H - 200);
    const cg = gold(ctx, 0, 0, 300, 300);
    corner(ctx, 114, 114, 1, 1, cg); corner(ctx, W - 114, 114, -1, 1, cg); corner(ctx, 114, H - 114, 1, -1, cg); corner(ctx, W - 114, H - 114, -1, -1, cg);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    emblem(ctx, W / 2, 200, 62);
    ctx.fillStyle = '#e9cf8a'; ctx.font = F(800, 27, CZ); spaced(ctx, 'TÂN AI ACADEMY', W / 2, 308, 11);
    ctx.save(); ctx.shadowColor = 'rgba(255,200,90,.55)'; ctx.shadowBlur = 30;
    ctx.fillStyle = gold(ctx, 560, 320, 1440, 440); ctx.font = F(900, 118, PF); ctx.fillText('BẰNG CÔNG NHẬN', W / 2, 438); ctx.restore();
    ctx.fillStyle = '#f3dc9c'; ctx.font = F(700, 40, PF); spaced(ctx, 'HOÀN THÀNH KHÓA HỌC', W / 2, 500, 8);
    ctx.fillStyle = '#b9a676'; ctx.font = F(600, 23, CZ); const cw = spaced(ctx, 'DIPLOMA OF COMPLETION', W / 2, 545, 9);
    divider(ctx, W / 2 - cw / 2 - 80, 537, 46, gl); divider(ctx, W / 2 + cw / 2 + 80, 537, 46, gl);
    ctx.fillStyle = '#e8dcc0'; ctx.font = F('italic 700', 36, PF); ctx.fillText('Trân trọng vinh danh học viên', W / 2, 620);
    const ns = fit(ctx, d.name, 1320, 400, 158, GV, 70);
    ctx.save(); ctx.shadowColor = 'rgba(255,200,90,.6)'; ctx.shadowBlur = 24; ctx.fillStyle = gold(ctx, 500, 620, 1500, 760);
    ctx.font = F(400, ns, GV); ctx.fillText(d.name, W / 2, 762); ctx.restore();
    divider(ctx, W / 2, 805, 500, gl);
    ctx.fillStyle = '#d9d2c2'; ctx.font = F(400, 30, BV);
    ctx.fillText('đã hoàn thành xuất sắc toàn bộ ' + d.count + ' học phần của', W / 2, 862);
    ctx.fillStyle = '#ffffff'; ctx.font = F(700, 46, PF);
    wrap(ctx, d.program.toUpperCase(), 1500).forEach((l, i) => ctx.fillText(l, W / 2, 926 + i * 56));
    const info = 'Điểm trung bình: ' + d.score + '/100   ·   Xếp loại: ' + rankOf(d.score, true) + '   ·   Chứng chỉ: ' + d.count + '/' + d.count;
    ctx.font = F(600, 27, BV); const pw = ctx.measureText(info).width + 70, py = 998;
    ctx.save(); ctx.strokeStyle = gl; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(255,215,120,.07)'; ctx.beginPath(); ctx.roundRect(W / 2 - pw / 2, py - 38, pw, 56, 28); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#f6e3a8'; ctx.fillText(info, W / 2, py);

    const by = 1232;
    ctx.fillStyle = '#f3dc9c'; ctx.font = F(700, 42, PF); ctx.fillText(d.date, 475, by - 18);
    ctx.strokeStyle = 'rgba(230,190,100,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(305, by); ctx.lineTo(645, by); ctx.stroke();
    ctx.font = F(700, 21, BV); ctx.fillStyle = '#b9a676'; spaced(ctx, 'NGÀY CẤP', 475, by + 34, 5);
    ctx.font = F(400, 19, BV); ctx.fillText('Số hiệu: ' + d.id, 475, by + 66);

    laurel(ctx, W / 2, 1202, 128, gold(ctx, W / 2 - 160, 1040, W / 2 + 160, 1340));
    seal(ctx, W / 2, 1202, 100, 'VINH DANH  ★  TÂN AI ACADEMY  ★  ', 'HONORS', false);

    signature(ctx, 1525, by - 30, '#f3dc9c');
    ctx.strokeStyle = 'rgba(230,190,100,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1345, by); ctx.lineTo(1705, by); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = F(800, 23, BV); ctx.fillText(ISSUER, 1525, by + 36);
    ctx.fillStyle = '#b9a676'; ctx.font = F('italic 700', 22, PF); ctx.fillText('Người cấp bằng', 1525, by + 68);
    bandLabel(ctx, 'TÂN AI ACADEMY  ·  PHÁT TRIỂN BỞI TÂN AI', '#c99a3e', '#2a1800');
  }

  let fontsReady = null;
  function ensureFonts(name) {
    const sample = 'ẮẰẲẴẶẤẦẨẪẬĐÊỀẾỂỄỆÔỒỐỔỖỘƠỜỚỞỠỢƯỪỨỬỮỰ ' + (name || '') + ' Nguyễn Văn Tân Chứng chỉ ạ';
    const list = ['900 80px "Playfair Display"', '700 40px "Playfair Display"', 'italic 700 40px "Playfair Display"', '400 80px "Great Vibes"', '800 30px Cinzel', '600 30px Cinzel', '400 30px "Be Vietnam Pro"', '600 30px "Be Vietnam Pro"', '700 30px "Be Vietnam Pro"', '800 30px "Be Vietnam Pro"'];
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const p = Promise.all(list.map(f => document.fonts.load(f, sample).catch(() => null)));
    return Promise.race([p, new Promise(r => setTimeout(r, 4000))]);
  }

  window.Cert = {
    W, H, certId, rankOf,
    async draw(canvas, d, scale) {
      await ensureFonts(d.name);
      const s = scale || 1.2;
      canvas.width = W * s; canvas.height = H * s;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(s, 0, 0, s, 0, 0);
      if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h, r) { this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
      (d.final ? drawFinal : drawModule)(ctx, d);
      return canvas;
    }
  };
})();
