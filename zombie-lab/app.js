/* Drabuff Z-LAB – phòng thí nghiệm lắp ráp zombie 3D. Phát triển bởi Tân AI. */
(function () {
  'use strict';
  const STR = window.ZSTRAINS, SM = {}, STATS = window.ZSTATS, SLOTS = window.ZSLOTS, RECIPES = window.ZRECIPES, CODEX = window.ZCODEX, SOURCES = window.ZSOURCES;
  STR.forEach(s => { SM[s.id] = s; });
  const Snd = window.ZSound, L3 = window.ZLab3D;
  const root = document.getElementById('root');
  const $ = (s, e) => (e || document).querySelector(s);
  const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = Math.random, pick = a => a[Math.floor(rand() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const UA = navigator.userAgent || '';
  const IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const GL = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))) && !!window.THREE; } catch (e) { return false; } })();

  /* ------------------------------------------------------------ trạng thái */
  const KEY = 'drabuff.zlab.v1';
  const DEF_BUILD = () => ({ head: 'rot', torso: 'rot', armL: 'rot', armR: 'rot', legs: 'rot', hue: 0, mut: null });
  const fresh = () => ({ v: 1, cur: DEF_BUILD(), crypt: [], found: {}, made: 0, wins: 0, fights: 0, settings: { music: true, sfx: true } });
  let S = load();
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 1) { const f = fresh(); return Object.assign(f, d, { settings: Object.assign(f.settings, d.settings || {}), cur: Object.assign(DEF_BUILD(), d.cur || {}) }); } } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  Snd.set('music', S.settings.music); Snd.set('sfx', S.settings.sfx);
  const uid = () => Date.now().toString(36) + Math.floor(rand() * 1e6).toString(36);

  /* ------------------------------------------------------------ cơ chế chỉ số */
  const W = {
    head: { int: .45, sen: .45, inf: .35, str: .05, spd: .05, hp: .1 },
    torso: { hp: .5, inf: .35, str: .2, int: .05, sen: .05, spd: .05 },
    armL: { str: .35, inf: .1, spd: .05, hp: .1 },
    armR: { str: .35, inf: .1, spd: .05, hp: .1 },
    legs: { spd: .7, hp: .15, str: .15, sen: .05 }
  };
  const CLASSES = {
    str: ['Kẻ Nghiền Nát', 'Sức mạnh áp đảo, xé toạc mọi chướng ngại'],
    spd: ['Thợ Săn Tốc Độ', 'Lao tới con mồi trước khi nó kịp chớp mắt'],
    hp: ['Pháo Đài Thịt', 'Gần như không thể bị hạ gục'],
    int: ['Chỉ Huy Bầy Đàn', 'Biết giăng bẫy và điều khiển đồng loại'],
    inf: ['Mầm Dịch Bệnh', 'Mỗi vết cào là một ổ dịch mới'],
    sen: ['Kẻ Rình Rập', 'Đánh hơi con mồi từ hàng cây số']
  };
  const RANKS = [[0, 'D'], [55, 'C'], [59, 'B'], [64, 'A'], [69, 'S'], [75, 'SS']];
  function recipeOf(b) { return RECIPES.find(r => Object.keys(r.need).every(k => b[k] === r.need[k])) || null; }
  function compute(b) {
    const st = {}; STATS.forEach(([k]) => { let s = 0, w = 0; SLOTS.forEach(([slot]) => { const wt = W[slot][k] || 0; if (wt) { s += wt * SM[b[slot]].st[k]; w += wt; } }); st[k] = s / w * 10; });
    const count = {}; SLOTS.forEach(([slot]) => { count[b[slot]] = (count[b[slot]] || 0) + 1; });
    const domId = Object.keys(count).sort((x, y) => count[y] - count[x])[0], pure = count[domId] >= 4 ? domId : null;
    const rec = recipeOf(b);
    STATS.forEach(([k]) => { let v = st[k]; if (rec) v *= 1.15; if (pure) v *= 1.08; if (b.mut && b.mut[k]) v += b.mut[k]; st[k] = Math.round(clamp(v, 1, 100)); });
    const top = STATS.map(s => s[0]).sort((x, y) => st[y] - st[x]);
    const vals = STATS.map(([k]) => st[k]), avg = vals.reduce((a, v) => a + v, 0) / vals.length, peak = Math.max.apply(null, vals);
    const score = Math.round(avg * 0.7 + peak * 0.3 + (rec ? 6 : 0) + (pure ? 3 : 0));
    let rank = 'D'; RANKS.forEach(([t, r]) => { if (score >= t) rank = r; });
    const skulls = { D: 1, C: 2, B: 3, A: 4, S: 5, SS: 5 }[rank];
    const H = SM[b.head], T = SM[b.torso], Lg = SM[b.legs];
    let name;
    if (rec) name = rec.n;
    else if (pure) name = SM[pure].noun + ' Thuần Chủng';
    else name = T.noun + ' ' + (H.id !== T.id ? H.adj : Lg.adj);
    if (b.mut && !rec) name += ' Đột Biến';
    const weak = []; [H, T].forEach(s => { if (!weak.some(w => w.w === s.weak)) weak.push({ w: s.weak, tip: s.tip, s: s.n }); });
    const abil = SLOTS.map(([slot, label, type]) => ({ slot: label, part: SM[b[slot]].p[type][0], ab: SM[b[slot]].p[type][1], s: SM[b[slot]] }));
    return { st, top, cls: CLASSES[top[0]], score, rank, skulls, name, rec, pure, weak, abil, power: Math.round(vals.reduce((a, v) => a + v, 0) * 10 + (rec ? 400 : 0)) };
  }
  const lookBuild = lk => ({ head: lk.h || lk.s, torso: lk.t || lk.s, armL: lk.a || lk.s, armR: lk.armR || lk.a || lk.s, legs: lk.l || lk.s, hue: lk.hue || 0, mut: null });
  const randomBuild = () => { const b = {}; SLOTS.forEach(([slot]) => { b[slot] = pick(STR).id; }); b.hue = 0; b.mut = null; return b; };
  const cx = c => ({ id: c[0], name: c[1], vn: c[2], src: c[3], work: c[4], threat: c[5], st: c[6], desc: c[7], ab: c[8], weak: c[9], kill: c[10], look: c[11] });

  /* ------------------------------------------------------------ icon */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    skull: '<path d="M12 2.5a8 8 0 0 0-8 8c0 2.6 1.2 4.4 3 5.6V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.9c1.8-1.2 3-3 3-5.6a8 8 0 0 0-8-8z"/><path d="M10 20v1.5M14 20v1.5"/><circle cx="9" cy="11.5" r="1.8" fill="currentColor"/><circle cx="15" cy="11.5" r="1.8" fill="currentColor"/><path d="m12 14.2-.9 1.8h1.8z" fill="currentColor"/>',
    flask: '<path d="M9 3h6M10 3v6.2L4.6 18.4A2 2 0 0 0 6.3 21.4h11.4a2 2 0 0 0 1.7-3L14 9.2V3"/><path d="M7.2 15h9.6"/><circle cx="10.5" cy="18" r=".8" fill="currentColor"/><circle cx="13.5" cy="17" r=".6" fill="currentColor"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0 0 4h14"/><path d="M9 7.5c0-1.2 1.3-2 3-2s3 .8 3 2-1 1.7-1 2.5h-4c0-.8-1-1.3-1-2.5z"/><path d="M10.5 12h3"/>',
    tomb: '<path d="M6 21V9.5a6 6 0 0 1 12 0V21"/><path d="M3.5 21h17M12 9v6M9.5 11.3h5"/>',
    swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
    bio: '<circle cx="12" cy="12" r="2"/><path d="M12 10V3.6a4.6 4.6 0 0 1 3.3 7.8"/><path d="M10.3 13 4.7 16.2a4.6 4.6 0 0 1 4.7-7.3"/><path d="m13.7 13 5.6 3.2a4.6 4.6 0 0 1-8.7-.7"/><path d="M6.5 6.5A8 8 0 0 0 4 12M17.5 6.5A8 8 0 0 1 20 12M8 19.4a8 8 0 0 0 8 0"/>',
    dna: '<path d="M7 2.5c0 6.5 10 6.5 10 13 0 2.5-1.3 4.5-3 6"/><path d="M17 2.5c0 6.5-10 6.5-10 13 0 2.5 1.3 4.5 3 6"/><path d="M8.6 5.5h6.8M9.6 9h4.8M9.6 15h4.8M8.6 18.5h6.8"/>',
    bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="16" cy="8" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="8" cy="16" r="1.4" fill="currentColor"/><circle cx="16" cy="16" r="1.4" fill="currentColor"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    crown: '<path d="m3 8 4 4 5-7 5 7 4-4-2 11H5z"/><path d="M5 19h14"/>',
    drop: '<path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    plusSq: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    dotsV: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 2 4 4 4-4"/>',
    game: '<path d="M6 8h12a4 4 0 0 1 3.9 4.8l-.9 4.4a2.5 2.5 0 0 1-4.3 1.1L14.5 16h-5l-2.2 2.3A2.5 2.5 0 0 1 3 17.2l-.9-4.4A4 4 0 0 1 6 8z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>',
    feather: '<path d="M20.2 3.8a6 6 0 0 0-8.5 0L5 10.5V19h8.5l6.7-6.7a6 6 0 0 0 0-8.5z"/><path d="M16 8 2 22M17.5 15H9"/>',
    comic: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 1 1 21 11.5z"/><path d="m10 8 1 3h3l-2.4 1.8.9 3L10 14l-2.5 1.8.9-3L6 11h3z"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    microscope: '<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>'
  };
  const SRC_IC = { film: 'film', tv: 'tv', game: 'game', book: 'feather', comic: 'comic', folk: 'moon', real: 'microscope' };
  const ic = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';
  const STAT_IC = { str: 'swords', spd: 'bolt', hp: 'heart', int: 'crown', inf: 'bio', sen: 'eye' };
  const skulls = (n, max) => '<span class="skulls" title="Mức nguy hiểm ' + n + '/' + (max || 5) + '">' + Array.from({ length: max || 5 }, (_, i) => ic('skull', i < n ? 'on' : '')).join('') + '</span>';

  /* ------------------------------------------------------------ UI helpers */
  const btn = (label, cls, attrs, icon) => '<button class="b3d ' + (cls || '') + '" ' + (attrs || '') + '>' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + '<span>' + label + '</span></button>';
  const link = (label, cls, href, icon) => '<a class="b3d ' + (cls || '') + '" href="' + href + '">' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + '<span>' + label + '</span></a>';
  const brand = () => '<a class="brand" href="#home" aria-label="Drabuff Z-LAB"><img src="icons/icon-192.png" alt=""><span><b>Z-LAB</b><small>DRABUFF · PHÁT TRIỂN BỞI TÂN AI</small></span></a>';
  const credit = () => '<div class="foot-note">Drabuff Z-LAB · Phòng thí nghiệm Zombie · Phát triển bởi <b>Tân AI</b><br>Tác phẩm được nhắc tới trong Bách khoa thuộc về chủ sở hữu tương ứng; mô tả & chỉ số do Z-LAB biên soạn cho mục đích giải trí.</div>';
  function toast(msg, kind, icon) {
    const box = $('#toast'), el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.innerHTML = ic(icon || 'info') + '<span>' + msg + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
  }
  function modal(title, body, buttons) {
    return new Promise(res => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = '<div class="modal panel hud" role="dialog" aria-modal="true"><h3 class="zt" style="font-size:26px">' + title + '</h3>' + body + '<div class="btn-row">' + buttons.map((b, i) => btn(b.label, b.cls || 'steel', 'data-mi="' + i + '"', b.icon)).join('') + '</div></div>';
      document.body.appendChild(bg);
      const done = v => { const f = bg.querySelector('input'); modal.input = f ? f.value : ''; bg.remove(); res(v); };
      bg.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (b) { Snd.SFX.click(); done(buttons[+b.dataset.mi].value); } else if (e.target === bg) done(null); });
      bg.addEventListener('keydown', e => { if (e.key === 'Enter' && bg.querySelector('input')) { const ok = buttons.findIndex(b => b.value === true); if (ok >= 0) done(true); } });
      const f = bg.querySelector('input'); if (f) setTimeout(() => { f.focus(); f.select(); }, 50);
    });
  }
  const confirmBox = (title, text, ok, okCls) => modal(title, '<p>' + text + '</p>', [{ label: 'Hủy', cls: 'steel', value: false }, { label: ok, cls: okCls || 'blood', value: true }]);
  function flash() { const f = $('#flash'); if (!f) return; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  const barsAnim = () => requestAnimationFrame(() => requestAnimationFrame(() => $$('.bar3d > i[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; })));

  /* ảnh chụp zombie: xếp hàng xử lý từng cái để không đơ giao diện */
  const snapCache = new Map(), snapQ = [];
  let snapBusy = false;
  function snapKey(b, size) { return [b.head, b.torso, b.armL, b.armR, b.legs, b.hue || 0, size].join('|'); }
  function queueSnap(img, b, size) {
    if (!GL) return;
    const k = snapKey(b, size);
    if (snapCache.has(k)) { img.src = snapCache.get(k); return; }
    snapQ.push({ img, b, size, k }); pumpSnap();
  }
  function pumpSnap() {
    if (snapBusy || !snapQ.length) return; snapBusy = true;
    setTimeout(() => {
      const j = snapQ.shift();
      try { if (j.img.isConnected) { const u = snapCache.get(j.k) || L3.snapshot(j.b, j.size); snapCache.set(j.k, u); j.img.src = u; } } catch (e) {}
      snapBusy = false; pumpSnap();
    }, 16);
  }
  const thumbQ = [];
  let thumbBusy = false;
  function queueThumb(img, type, sid) { thumbQ.push({ img, type, sid }); pumpThumb(); }
  function pumpThumb() {
    if (thumbBusy || !thumbQ.length) return; thumbBusy = true;
    setTimeout(() => { const j = thumbQ.shift(); try { if (j.img.isConnected) j.img.src = L3.thumb(j.type, j.sid); } catch (e) {} thumbBusy = false; pumpThumb(); }, 10);
  }
  function fillImages(scope) {
    if (!GL) return;
    $$('img[data-thumb]', scope).forEach(im => { const [t, s] = im.dataset.thumb.split(':'); im.removeAttribute('data-thumb'); queueThumb(im, t, s); });
    $$('img[data-snap]', scope).forEach(im => { const b = JSON.parse(im.dataset.snap); const sz = +im.dataset.size || 200; im.removeAttribute('data-snap'); queueSnap(im, b, sz); });
  }
  const snapImg = (b, size, cls) => '<img class="' + (cls || '') + '" alt="" data-size="' + (size || 200) + '" data-snap="' + esc(JSON.stringify({ head: b.head, torso: b.torso, armL: b.armL, armR: b.armR, legs: b.legs, hue: b.hue || 0 })) + '" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">';

  /* sân khấu 3D */
  let stageOn = false;
  function stageHTML(id, tag, hint) {
    if (!GL) return '<div class="stage-box" id="' + id + '" style="display:grid;place-items:center;text-align:center;padding:24px"><div><div style="font-size:54px">🧟</div><b>Thiết bị không hỗ trợ WebGL 3D</b><p class="muted">Hãy mở bằng Chrome/Safari mới nhất để xem mô hình 3D. Mọi chức năng khác vẫn dùng được.</p></div>' + (tag || '') + '</div>';
    return '<div class="stage-box" id="' + id + '">' + (tag || '') + '<div class="stage-hint">' + (hint || 'Kéo để xoay · chụm/cuộn để phóng to') + '</div></div>';
  }
  function mountStage(id, build) {
    const el = document.getElementById(id); if (!el || !GL) return;
    try { L3.mount(el); L3.show(build); stageOn = true; } catch (e) { console.error(e); }
  }

  /* ------------------------------------------------------------ khung */
  const TABS = [['home', 'Trang chủ', 'home'], ['lab', 'Lắp ráp', 'flask'], ['codex', 'Bách khoa', 'book'], ['crypt', 'Hầm mộ', 'tomb'], ['arena', 'Đấu trường', 'swords']];
  function shell(tab, body) {
    return '<header class="topbar"><div class="topbar-in">' + brand() + '<span class="sp"></span>' +
      '<button class="icon-btn" data-act="toggle" data-k="music" aria-label="Nhạc nền" title="Nhạc nền">' + ic(S.settings.music ? 'music' : 'mute') + '</button>' +
      '<button class="icon-btn" data-act="toggle" data-k="sfx" aria-label="Âm thanh" title="Hiệu ứng âm thanh">' + ic(S.settings.sfx ? 'volume' : 'mute') + '</button>' +
      (standalone() ? '' : '<button class="icon-btn" data-act="install" aria-label="Cài app" title="Cài app lên máy">' + ic('download') + '</button>') +
      '</div></header><main class="app"><div class="screen">' + body + '</div></main>' +
      '<nav class="nav"><div class="nav-in">' + TABS.map(t => '<a href="#' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '">' + ic(t[2]) + '<span>' + t[1] + '</span></a>').join('') + '</div></nav>';
  }

  /* ------------------------------------------------------------ TRANG CHỦ */
  let heroBuild = null;
  function viewHome() {
    if (!heroBuild) { const r = pick(RECIPES); heroBuild = Object.assign({ head: 'rot', torso: 'rot', armL: 'rot', armR: 'rot', legs: 'rot', hue: 0 }, r.need); SLOTS.forEach(([s]) => { if (!r.need[s]) heroBuild[s] = pick(STR).id; }); if (!recipeOf(heroBuild)) Object.assign(heroBuild, r.need); }
    const c = compute(heroBuild), total = Math.pow(STR.length, 5);
    const tag = '<div class="stage-tag"><div><div class="zname">' + esc(c.name) + '</div><div class="zsub">' + c.cls[0] + ' · ' + c.power.toLocaleString('vi') + ' sức mạnh</div></div><div class="rank ' + c.rank + '">' + c.rank + '</div></div>';
    const tiles = [
      ['#lab', 'flask', 'Phòng Lắp Ráp', 'Ghép đầu · thân · tay · chân 3D', 'rgba(157,255,58,.25)', 'var(--acid)'],
      ['#codex', 'book', 'Bách Khoa Zombie', CODEX.length + ' loại từ phim, game, sách', 'rgba(232,220,192,.18)', 'var(--bone)'],
      ['#crypt', 'tomb', 'Hầm Mộ', 'Bộ sưu tập zombie của bạn', 'rgba(162,89,255,.25)', 'var(--violet)'],
      ['#arena', 'swords', 'Đấu Trường', 'Thả quái vật vào trận tử chiến', 'rgba(255,42,61,.25)', 'var(--blood2)']
    ];
    return shell('home',
      '<section class="hero-z"><div>' +
        '<span class="chip blood">' + ic('bio') + ' CẢNH BÁO SINH HỌC CẤP 5</span>' +
        '<h1>Phòng Thí Nghiệm<span class="acid-text flicker drip">Zombie</span></h1>' +
        '<p class="lead">Kho tàng đồ sộ về xác sống từ phim ảnh, trò chơi, sách báo và truyền thuyết. Lắp ghép các bộ phận 3D để tạo ra chủng zombie <b class="acid-text">chưa từng tồn tại</b> – mỗi tổ hợp một bộ chỉ số sức mạnh và điểm yếu riêng.</p>' +
        '<div class="btn-row">' + link('Bắt đầu lắp ráp', 'lg shine', '#lab', 'flask') + link('Bách khoa', 'lg bone', '#codex', 'book') + '</div>' +
        '<div class="kpis" style="margin-top:18px">' +
          '<div class="kpi"><b>' + CODEX.length + '</b><span>Zombie trong bách khoa</span></div>' +
          '<div class="kpi"><b>' + STR.length * 5 + '</b><span>Bộ phận 3D (' + STR.length + ' chủng)</span></div>' +
          '<div class="kpi"><b>' + (total / 1e6).toFixed(1).replace('.', ',') + ' tr</b><span>Tổ hợp có thể tạo</span></div>' +
          '<div class="kpi"><b>' + RECIPES.length + '</b><span>Công thức huyền thoại ẩn</span></div>' +
        '</div></div>' +
        stageHTML('stage', tag, 'Mẫu vật huyền thoại · kéo để xoay') +
      '</section>' +
      '<div class="sec-title">Khu vực</div><div class="menu-tiles">' + tiles.map(t => '<a class="mtile" href="' + t[0] + '" style="--tc:' + t[4] + ';--ti:' + t[5] + '">' + ic(t[1]) + '<b>' + t[2] + '</b><small>' + t[3] + '</small></a>').join('') + '</div>' +
      '<div class="sec-title">Hồ sơ của bạn</div><div class="panel hud"><div class="kpis">' +
        '<div class="kpi"><b>' + S.made + '</b><span>Lần hồi sinh</span></div>' +
        '<div class="kpi"><b>' + S.crypt.length + '</b><span>Zombie trong hầm mộ</span></div>' +
        '<div class="kpi"><b>' + Object.keys(S.found).length + '/' + RECIPES.length + '</b><span>Công thức đã giải mã</span></div>' +
        '<div class="kpi"><b>' + S.wins + '</b><span>Trận thắng</span></div>' +
      '</div></div>' +
      '<div class="sec-title">Cách chơi</div><div class="panel"><div class="recipes">' +
        [['flask', '1. Chọn bộ phận', 'Mỗi chủng có đầu, thân, 2 tay và chân với kỹ năng riêng.'], ['dna', '2. Lai tạo', 'Chỉ số mới được tính từ trọng số từng bộ phận. Thử Đột biến để có biến thể hiếm.'], ['bolt', '3. Hồi sinh', 'Phóng sét vào xác để zombie thức tỉnh và cất vào Hầm mộ.'], ['crown', '4. Giải mã công thức', 'Ghép đúng tổ hợp bí mật để tạo zombie Huyền thoại (+15% chỉ số).']].map(s => '<div class="recipe"><b>' + ic(s[0]) + ' ' + s[1] + '</b><span class="muted">' + s[2] + '</span></div>').join('') +
      '</div></div>' + credit());
  }

  /* ------------------------------------------------------------ PHÒNG LẮP RÁP */
  let curSlot = 'head', prevSt = null;
  function radarSVG(st, size) {
    const s = size || 240, c = s / 2, r = s / 2 - 34, n = STATS.length;
    const pt = (i, v) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v]; };
    let g = '';
    [0.25, 0.5, 0.75, 1].forEach(k => { g += '<polygon points="' + STATS.map((_, i) => pt(i, k).join(',')).join(' ') + '" fill="none" stroke="rgba(157,255,58,' + (k === 1 ? .35 : .12) + ')" stroke-width="1"/>'; });
    STATS.forEach((_, i) => { const p = pt(i, 1); g += '<line x1="' + c + '" y1="' + c + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="rgba(157,255,58,.12)"/>'; });
    const poly = STATS.map(([k], i) => pt(i, st[k] / 100).join(',')).join(' ');
    g += '<polygon points="' + poly + '" fill="rgba(157,255,58,.22)" stroke="#9dff3a" stroke-width="2" style="filter:drop-shadow(0 0 6px rgba(157,255,58,.6))"/>';
    STATS.forEach(([k, lb], i) => { const p = pt(i, 1.22); g += '<text x="' + p[0] + '" y="' + (p[1] + 4) + '" text-anchor="middle" fill="#c8dcc0" font-family="Chakra Petch,sans-serif" font-size="11" font-weight="700">' + lb.toUpperCase() + '</text>'; });
    return '<svg class="radar" viewBox="0 0 ' + s + ' ' + s + '">' + g + '</svg>';
  }
  function statBars(st, prev) {
    return STATS.map(([k, lb]) => {
      const d = prev ? st[k] - prev[k] : 0;
      return '<div class="statrow"><span>' + ic(STAT_IC[k]) + ' ' + lb + '</span><div class="bar3d"><i data-w="' + st[k] + '" style="width:' + (prev ? prev[k] : 0) + '%"></i></div><span class="v">' + st[k] + (d ? '<span class="delta ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</span>' : '') + '</span></div>';
    }).join('');
  }
  function traitsHTML(c) {
    let h = '';
    if (c.rec) h += '<div class="trait legend">' + ic('crown') + '<div><b>Huyền thoại: ' + esc(c.rec.n) + '</b><small>' + esc(c.rec.ab) + ' · +15% toàn bộ chỉ số</small></div></div>';
    if (c.pure) h += '<div class="trait legend">' + ic('dna') + '<div><b>Thuần chủng ' + SM[c.pure].n + '</b><small>4+ bộ phận cùng chủng · +8% toàn bộ chỉ số</small></div></div>';
    h += c.abil.map(a => '<div class="trait ab">' + ic('sparkle') + '<div><b>' + esc(a.ab) + '</b><small>' + a.slot + ': ' + esc(a.part) + '</small></div></div>').join('');
    return h;
  }
  function weakHTML(c) { return c.weak.map(w => '<div class="trait weak">' + ic('target') + '<div><b>' + esc(w.w) + '</b><small>' + esc(w.tip) + '</small></div></div>').join(''); }
  function slotTabs() {
    return SLOTS.map(([slot, label]) => { const s = SM[S.cur[slot]]; return '<button class="slot-btn ' + (curSlot === slot ? 'on' : '') + '" data-act="slot" data-s="' + slot + '"><span class="sw" style="--sc:' + s.c + ';--sd:' + s.c2 + ';--sg:' + s.g + '55"></span>' + label + '</button>'; }).join('');
  }
  function partsList() {
    const type = SLOTS.find(s => s[0] === curSlot)[2];
    return STR.map(s => '<button class="part ' + (S.cur[curSlot] === s.id ? 'on' : '') + '" data-act="part" data-id="' + s.id + '" style="--pg:' + s.g + '33" title="' + esc(s.p[type][1]) + '">' + (GL ? '<img alt="" data-thumb="' + type + ':' + s.id + '" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">' : '<div class="ph" style="background:radial-gradient(circle,' + s.c + ',transparent 70%)"></div>') + '<b>' + esc(s.p[type][0]) + '</b><small>' + s.n + '</small></button>').join('');
  }
  function labTag(c) { return '<div class="stage-tag"><div><div class="zname" id="zname">' + esc(c.name) + '</div><div class="zsub" id="zsub">' + c.cls[0] + '</div></div><div class="rank ' + c.rank + '" id="zrank">' + c.rank + '</div></div>'; }
  function viewLab() {
    const c = compute(S.cur); prevSt = c.st;
    return shell('lab',
      '<div class="lab"><div>' + stageHTML('stage', labTag(c)) + '</div>' +
      '<div>' +
        '<div class="slots" id="slots">' + slotTabs() + '</div>' +
        '<div class="parts" id="parts">' + partsList() + '</div>' +
        '<div class="lab-actions">' + btn('Ngẫu nhiên', 'steel', 'data-act="random"', 'dice') + btn('Đột biến', 'violet', 'data-act="mutate"', 'dna') + btn('Hồi sinh', 'blood xl shine', 'data-act="reanimate" id="btn-re"', 'bolt') + '</div>' +
        '<div class="panel hud" style="margin-top:14px" id="statpanel">' + statPanel(c, null) + '</div>' +
        '<div class="sec-title">Kỹ năng</div><div class="stats-box" id="traits">' + traitsHTML(c) + '</div>' +
        '<div class="sec-title">Điểm yếu chí mạng</div><div class="stats-box" id="weak">' + weakHTML(c) + '</div>' +
      '</div></div>' + credit());
  }
  function statPanel(c, prev) {
    return '<div class="power"><div class="pw"><b>' + c.power.toLocaleString('vi') + '</b><span>Chỉ số sức mạnh</span></div><span class="sp" style="flex:1"></span><div style="text-align:right"><div class="hud" style="font-size:11px;letter-spacing:.14em;color:var(--mute)">MỨC ĐE DỌA</div>' + skulls(c.skulls) + '</div></div>' +
      '<p class="muted" style="margin:8px 0 14px;font-size:13px"><b class="acid-text">' + c.cls[0] + '</b> – ' + c.cls[1] + '.</p>' +
      '<div class="stats-box">' + statBars(c.st, prev) + '</div>' + radarSVG(c.st);
  }
  function labRefresh(changed) {
    const c = compute(S.cur);
    if (stageOn) L3.show(S.cur, changed);
    const n = $('#zname'); if (n) { n.textContent = c.name; $('#zsub').textContent = c.cls[0]; const r = $('#zrank'); r.className = 'rank ' + c.rank; r.textContent = c.rank; }
    $('#slots').innerHTML = slotTabs();
    $$('#parts .part').forEach(b => b.classList.toggle('on', b.dataset.id === S.cur[curSlot]));
    $('#statpanel').innerHTML = statPanel(c, prevSt); barsAnim();
    $('#traits').innerHTML = traitsHTML(c); $('#weak').innerHTML = weakHTML(c);
    prevSt = c.st; save();
    if (c.rec && !S.found[c.rec.id]) toast('Phát hiện tổ hợp huyền thoại! Bấm <b>Hồi sinh</b> để giải mã.', '', 'crown');
  }
  let busy = false;
  async function reanimate() {
    if (busy) return; busy = true;
    const b = $('#btn-re'); if (b) b.disabled = true;
    const c = compute(S.cur);
    Snd.SFX.zap(); setTimeout(() => Snd.SFX.thunder(), 250); flash();
    if (stageOn) { setTimeout(flash, 900); await L3.reanimate(); } else await new Promise(r => setTimeout(r, 1200));
    Snd.SFX.growl();
    const z = { id: uid(), name: c.name, build: Object.assign({}, S.cur, { mut: S.cur.mut ? Object.assign({}, S.cur.mut) : null }), t: Date.now(), wins: 0 };
    S.crypt.unshift(z); if (S.crypt.length > 80) S.crypt.length = 80; S.made++;
    const newRec = c.rec && !S.found[c.rec.id]; if (c.rec) S.found[c.rec.id] = Date.now();
    save(); busy = false; if (b) b.disabled = false;
    setTimeout(async () => {
      if (newRec) Snd.SFX.discover(); else Snd.SFX.success();
      const body = (newRec ? '<div class="trait legend" style="margin-bottom:12px">' + ic('crown') + '<div><b>Công thức huyền thoại mới!</b><small>' + esc(c.rec.ab) + '</small></div></div>' : '') +
        '<p>Zombie <b class="acid-text">' + esc(c.name) + '</b> (hạng ' + c.rank + ', ' + c.power.toLocaleString('vi') + ' sức mạnh) đã thức tỉnh và được giam trong Hầm mộ. Đặt tên riêng cho nó:</p>' +
        '<input class="input3d" maxlength="40" value="' + esc(c.name) + '" aria-label="Tên zombie">';
      const v = await modal(newRec ? 'Huyền thoại thức tỉnh!' : 'Nó đã sống lại!', body, [{ label: 'Lắp tiếp', cls: 'steel', value: 'more' }, { label: 'Xem hồ sơ', cls: '', value: true, icon: 'tomb' }]);
      const nm = (modal.input || '').trim(); if (nm) { z.name = nm.slice(0, 40); save(); }
      if (v === true) location.hash = '#z/' + z.id;
    }, 350);
  }

  /* ------------------------------------------------------------ BÁCH KHOA */
  const CF = { src: 'all', q: '', sort: 'threat' };
  function codexList() {
    const q = norm(CF.q.trim());
    let list = CODEX.map(cx).filter(z => (CF.src === 'all' || z.src === CF.src) && (!q || norm(z.name + ' ' + z.vn + ' ' + z.work + ' ' + z.desc).includes(q)));
    if (CF.sort === 'threat') list.sort((a, b) => b.threat - a.threat || a.name.localeCompare(b.name, 'vi'));
    else if (CF.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    else list.sort((a, b) => b.st.reduce((x, y) => x + y, 0) - a.st.reduce((x, y) => x + y, 0));
    if (!list.length) return '<div class="panel" style="text-align:center"><div style="font-size:42px">🕯️</div><b>Không tìm thấy mẫu vật nào</b><p class="muted">Thử từ khóa khác hoặc bỏ bộ lọc.</p></div>';
    return list.map(z => '<a class="ccard-z" href="#c/' + z.id + '">' + snapImg(lookBuild(z.look), 128, 'av') + '<div style="min-width:0;flex:1"><h4>' + esc(z.name) + '</h4><div class="wk">' + ic(SRC_IC[z.src]) + ' ' + esc(z.work) + '</div><div class="mini">' + skulls(z.threat) + '<span class="chip dim">' + esc(z.vn) + '</span></div></div></a>').join('');
  }
  function viewCodex() {
    const srcs = [['all', 'Tất cả']].concat(Object.keys(SOURCES).map(k => [k, SOURCES[k]]));
    return shell('codex',
      '<h2 class="zt" style="font-size:40px;margin:6px 0 4px;color:var(--bone)">Bách Khoa <span class="acid-text">Zombie</span></h2>' +
      '<p class="muted" style="margin:0 0 14px">' + CODEX.length + ' loại xác sống từ điện ảnh, truyền hình, trò chơi, văn học, truyện tranh, dân gian và tư liệu thực tế – kèm chỉ số sức mạnh và cách tiêu diệt.</p>' +
      '<label class="search-z">' + ic('search') + '<input id="cq" type="search" placeholder="Tìm tên zombie, tác phẩm…" value="' + esc(CF.q) + '" autocomplete="off"></label>' +
      '<div class="chips scroll" style="margin:12px 0 6px" id="csrc">' + srcs.map(s => '<button data-act="csrc" data-v="' + s[0] + '" class="' + (CF.src === s[0] ? 'on' : '') + '">' + (s[0] !== 'all' ? ic(SRC_IC[s[0]]) + ' ' : '') + s[1] + '</button>').join('') + '</div>' +
      '<div class="chips" style="margin-bottom:14px" id="csort">' + [['threat', 'Nguy hiểm nhất'], ['power', 'Mạnh nhất'], ['name', 'Tên A–Z']].map(s => '<button data-act="csort" data-v="' + s[0] + '" class="' + (CF.sort === s[0] ? 'on' : '') + '">' + s[1] + '</button>').join('') + '</div>' +
      '<div class="codex-grid" id="clist">' + codexList() + '</div>' + credit());
  }
  function refreshCodex() { const l = $('#clist'); if (!l) return; l.innerHTML = codexList(); fillImages(l); }
  function viewCodexDetail(id) {
    const raw = CODEX.find(c => c[0] === id); if (!raw) return viewCodex();
    const z = cx(raw), st = {}; STATS.forEach(([k], i) => { st[k] = z.st[i] * 10; });
    const tag = '<div class="stage-tag"><div><div class="zname">' + esc(z.name) + '</div><div class="zsub">' + esc(z.vn) + '</div></div><div class="rank ' + (z.threat >= 5 ? 'S' : z.threat >= 4 ? 'A' : 'B') + '" title="Mức đe dọa">' + z.threat + '</div></div>';
    return shell('codex',
      '<div class="back-row"><a class="icon-btn" href="#codex" aria-label="Quay lại">' + ic('left') + '</a><h2>Hồ sơ mẫu vật</h2></div>' +
      '<div class="detail-grid"><div>' + stageHTML('stage', tag, 'Mô phỏng 3D theo phong cách Z-LAB') +
        '<div class="btn-row" style="margin-top:12px">' + btn('Mang vào phòng lắp ráp', '', 'data-act="tolab" data-id="' + z.id + '"', 'flask') + btn('Đấu thử', 'blood', 'data-act="fightcodex" data-id="' + z.id + '"', 'swords') + '</div></div>' +
      '<div><div class="panel hud">' +
        '<div class="chips" style="margin-bottom:10px"><span class="chip">' + ic(SRC_IC[z.src]) + ' ' + SOURCES[z.src] + '</span><span class="chip bone">' + esc(z.work) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="hud" style="font-size:12px;letter-spacing:.14em;color:var(--mute)">MỨC ĐE DỌA</span>' + skulls(z.threat) + '</div>' +
        '<p style="margin:0 0 14px">' + esc(z.desc) + '</p>' +
        '<div class="stats-box">' + statBars(st, null) + '</div>' + radarSVG(st) +
      '</div>' +
      '<div class="sec-title">Năng lực</div><div class="stats-box">' + z.ab.map(a => '<div class="trait ab">' + ic('sparkle') + '<div><b>' + esc(a) + '</b></div></div>').join('') + '</div>' +
      '<div class="sec-title">Điểm yếu</div><div class="stats-box">' + z.weak.map(a => '<div class="trait weak">' + ic('target') + '<div><b>' + esc(a) + '</b></div></div>').join('') + '</div>' +
      '<div class="kill-box" style="margin-top:14px"><b>' + ic('skull') + ' Cách tiêu diệt</b>' + esc(z.kill) + '</div>' +
      '<p class="disclaimer">Thông tin tóm lược bởi Z-LAB; chỉ số là đánh giá mang tính giải trí. ' + esc(z.work) + ' thuộc về chủ sở hữu bản quyền.</p>' +
      '</div></div>' + credit());
  }

  /* ------------------------------------------------------------ HẦM MỘ */
  function viewCrypt() {
    const found = RECIPES.filter(r => S.found[r.id]).length;
    let h = '<h2 class="zt" style="font-size:40px;margin:6px 0 4px;color:var(--bone)">Hầm <span class="acid-text">Mộ</span></h2><p class="muted" style="margin:0 0 14px">Nơi giam giữ những sinh vật bạn đã hồi sinh (' + S.crypt.length + ').</p>';
    if (!S.crypt.length) h += '<div class="panel hud" style="text-align:center;padding:30px 18px"><div style="font-size:56px">⚰️</div><b class="zt" style="font-size:26px">Hầm mộ còn trống</b><p class="muted">Vào phòng lắp ráp, ghép bộ phận và bấm Hồi sinh để zombie đầu tiên thức tỉnh.</p>' + link('Tới phòng lắp ráp', 'lg shine', '#lab', 'flask') + '</div>';
    else h += '<div class="crypt">' + S.crypt.map(z => { const c = compute(z.build); return '<a class="tomb" href="#z/' + z.id + '"><span class="rk">' + c.rank + '</span>' + snapImg(z.build, 220) + '<b>' + esc(z.name) + '</b><small>' + c.cls[0] + ' · ' + c.power.toLocaleString('vi') + '</small></a>'; }).join('') + '</div>';
    h += '<div class="sec-title">Công thức huyền thoại · ' + found + '/' + RECIPES.length + '</div><div class="recipes">' +
      RECIPES.map(r => S.found[r.id] ? '<div class="recipe found"><b>' + ic('crown') + ' ' + esc(r.n) + '</b><div class="muted" style="margin:4px 0">' + Object.keys(r.need).map(k => SLOTS.find(s => s[0] === k)[1] + ': ' + SM[r.need[k]].n).join(' · ') + '</div><small>' + esc(r.ab) + '</small></div>' : '<div class="recipe locked"><b>' + ic('lock') + ' ??????</b><div class="muted" style="margin-top:4px">Gợi ý: “' + esc(r.hint) + '”</div></div>').join('') + '</div>';
    return shell('crypt', h + credit());
  }
  function viewZombie(id) {
    const z = S.crypt.find(x => x.id === id); if (!z) return viewCrypt();
    const c = compute(z.build);
    const tag = '<div class="stage-tag"><div><div class="zname">' + esc(z.name) + '</div><div class="zsub">' + c.cls[0] + '</div></div><div class="rank ' + c.rank + '">' + c.rank + '</div></div>';
    return shell('crypt',
      '<div class="back-row"><a class="icon-btn" href="#crypt" aria-label="Quay lại">' + ic('left') + '</a><h2>Hồ sơ zombie</h2></div>' +
      '<div class="detail-grid"><div>' + stageHTML('stage', tag) +
        '<div class="btn-row" style="margin-top:12px">' + btn('Đổi tên', 'steel', 'data-act="rename" data-id="' + z.id + '"', 'edit') + btn('Chỉnh sửa', 'bone', 'data-act="edit" data-id="' + z.id + '"', 'flask') + btn('Ra đấu trường', 'blood', 'data-act="fightz" data-id="' + z.id + '"', 'swords') + btn('Xóa', 'ghost', 'data-act="del" data-id="' + z.id + '"', 'trash') + '</div></div>' +
      '<div><div class="panel hud">' + statPanel(c, null) + '</div>' +
        '<div class="sec-title">Cấu tạo</div><div class="panel">' + SLOTS.map(([slot, label, type]) => { const s = SM[z.build[slot]]; return '<div class="row"><div class="ri" style="background:linear-gradient(145deg,' + s.c + ',' + s.c2 + ');color:#fff"></div><div class="rt"><b>' + esc(s.p[type][0]) + '</b><small>' + label + ' · chủng ' + s.n + '</small></div></div>'; }).join('') + '</div>' +
        '<div class="sec-title">Kỹ năng</div><div class="stats-box">' + traitsHTML(c) + '</div>' +
        '<div class="sec-title">Điểm yếu chí mạng</div><div class="stats-box">' + weakHTML(c) + '</div>' +
        '<p class="disclaimer">Hồi sinh lúc ' + new Date(z.t).toLocaleString('vi') + ' · ' + (z.wins || 0) + ' trận thắng</p>' +
      '</div></div>' + credit());
  }

  /* ------------------------------------------------------------ ĐẤU TRƯỜNG */
  const AR = { me: null, foe: null, log: [], running: false };
  function fighterFromBuild(name, b) { const c = compute(b); return { name, build: b, st: c.st, rank: c.rank }; }
  function fighterFromCodex(raw) { const z = cx(raw), st = {}; STATS.forEach(([k], i) => { st[k] = z.st[i] * 10; }); return { name: z.name, build: lookBuild(z.look), st, rank: z.threat >= 5 ? 'S' : z.threat >= 4 ? 'A' : 'B', codex: true }; }
  function ensureFighters() {
    if (!AR.me) { const z = S.crypt[0]; AR.me = z ? Object.assign(fighterFromBuild(z.name, z.build), { zid: z.id }) : fighterFromBuild(compute(S.cur).name, Object.assign({}, S.cur)); }
    if (!AR.foe) AR.foe = fighterFromCodex(pick(CODEX));
  }
  const maxHP = f => Math.round(120 + f.st.hp * 2.6);
  function fighterCard(f, side) { return '<div class="fighter" id="f-' + side + '">' + snapImg(f.build, 240) + '<b>' + esc(f.name) + '</b><div class="chips" style="justify-content:center;margin-top:6px"><span class="chip ' + (side === 'me' ? '' : 'blood') + '">Hạng ' + f.rank + '</span></div><div class="hp"><i id="hp-' + side + '"></i></div><small class="hud muted" id="hpt-' + side + '">' + maxHP(f) + ' HP</small></div>'; }
  function viewArena() {
    ensureFighters();
    const opts = S.crypt.slice(0, 30);
    return shell('arena',
      '<h2 class="zt" style="font-size:40px;margin:6px 0 4px;color:var(--bone)">Đấu <span class="blood-text">Trường</span></h2><p class="muted" style="margin:0 0 14px">Thả zombie của bạn vào trận tử chiến tự động với các huyền thoại trong Bách khoa.</p>' +
      '<div class="panel hud blood"><div class="arena">' + fighterCard(AR.me, 'me') + '<div class="vs">VS</div>' + fighterCard(AR.foe, 'foe') + '</div>' +
      '<div class="btn-row" style="margin-top:14px">' + btn('Đổi đối thủ', 'steel', 'data-act="newfoe"', 'refresh') + btn('Chiến!', 'blood lg shine', 'data-act="fight" id="btn-fight"', 'swords') + '</div></div>' +
      (opts.length ? '<div class="sec-title">Chọn chiến binh của bạn</div><div class="chips scroll">' + opts.map(z => '<button data-act="pickme" data-id="' + z.id + '" class="' + (AR.me.zid === z.id ? 'on' : '') + '">' + esc(z.name) + '</button>').join('') + '</div>' : '<p class="muted" style="margin-top:12px">Bạn chưa có zombie trong hầm mộ – đang dùng mẫu từ phòng lắp ráp. ' + '<a href="#lab">Tạo zombie</a></p>') +
      '<div class="sec-title">Diễn biến</div><div class="blog" id="blog"><div class="muted">Bấm “Chiến!” để bắt đầu. Sức mạnh = sát thương, Tốc độ = ra đòn trước & né, Độ bền = máu, Trí khôn = chí mạng, Lây nhiễm = độc, Giác quan = phản đòn.</div></div>' +
      '<p class="muted" style="margin-top:10px;font-size:13px">Thành tích: ' + S.wins + ' thắng / ' + S.fights + ' trận</p>' + credit());
  }
  async function fight() {
    if (AR.running) return; AR.running = true;
    const fb = $('#btn-fight'); if (fb) fb.disabled = true;
    Snd.Music.play('arena');
    const A = { f: AR.me, side: 'me', hp: maxHP(AR.me), max: maxHP(AR.me), poison: 0 }, B = { f: AR.foe, side: 'foe', hp: maxHP(AR.foe), max: maxHP(AR.foe), poison: 0 };
    const log = $('#blog'); log.innerHTML = '';
    const say = (t, cls) => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = t; log.appendChild(d); log.scrollTop = log.scrollHeight; };
    const upd = u => { const i = $('#hp-' + u.side); if (i) i.style.width = Math.max(0, u.hp / u.max * 100) + '%'; const t = $('#hpt-' + u.side); if (t) t.textContent = Math.max(0, Math.round(u.hp)) + ' / ' + u.max + ' HP'; };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    upd(A); upd(B);
    let att = A.f.st.spd + rand() * 20 >= B.f.st.spd + rand() * 20 ? A : B, round = 0;
    say('⚔️ <b>' + esc(A.f.name) + '</b> đối đầu <b>' + esc(B.f.name) + '</b>!');
    while (A.hp > 0 && B.hp > 0 && round < 40) {
      round++; const def = att === A ? B : A, s = att.f.st, d = def.f.st;
      await wait(620);
      if (!$('#blog')) { AR.running = false; return; }
      if (att.poison > 0) { const pd = Math.round(3 + att.poison * 0.08); att.hp -= pd; att.poisonT--; if (att.poisonT <= 0) att.poison = 0; say('☣️ ' + esc(att.f.name) + ' trúng độc mất ' + pd + ' HP'); upd(att); if (att.hp <= 0) break; }
      const dodge = clamp((d.spd - s.spd) * 0.25 + d.sen * 0.08, 2, 28);
      if (rand() * 100 < dodge) { say('💨 ' + esc(def.f.name) + ' né được đòn của ' + esc(att.f.name)); Snd.SFX.tap(); }
      else {
        const crit = rand() * 100 < 5 + s.int * 0.22;
        let dmg = (10 + s.str * 0.32) * (0.8 + rand() * 0.4) * (crit ? 1.8 : 1) * (1 - d.hp * 0.0025);
        dmg = Math.round(dmg); def.hp -= dmg; upd(def);
        const el = $('#f-' + def.side); if (el) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
        Snd.SFX.hit(); if (crit) Snd.SFX.squish();
        say((crit ? '💥 CHÍ MẠNG! ' : '🩸 ') + esc(att.f.name) + ' gây ' + dmg + ' sát thương', crit ? 'crit' : '');
        if (def.hp > 0 && rand() * 100 < s.inf * 0.35 && !def.poison) { def.poison = s.inf; def.poisonT = 3; say('🦠 ' + esc(def.f.name) + ' bị lây nhiễm!'); }
        if (def.hp > 0 && rand() * 100 < d.sen * 0.15) { const cd = Math.round(4 + d.str * 0.12); att.hp -= cd; upd(att); say('🔁 ' + esc(def.f.name) + ' phản đòn ' + cd + ' sát thương'); }
      }
      if (!(s.spd > d.spd + 25 && rand() < 0.3)) att = def; else say('⚡ ' + esc(att.f.name) + ' nhanh tới mức ra đòn thêm lượt!');
    }
    await wait(500);
    const win = A.hp > B.hp ? A : B, meWin = win === A;
    S.fights++; if (meWin) { S.wins++; const z = S.crypt.find(x => x.id === AR.me.zid); if (z) z.wins = (z.wins || 0) + 1; }
    save();
    say((meWin ? '🏆 ' : '☠️ ') + esc(win.f.name) + ' chiến thắng!', 'win');
    if (meWin) { Snd.SFX.success(); toast('Chiến thắng! ' + esc(AR.me.name) + ' hạ gục ' + esc(AR.foe.name), '', 'crown'); } else { Snd.SFX.wrong(); Snd.SFX.growl(); }
    AR.running = false; if (fb) fb.disabled = false;
  }

  /* ------------------------------------------------------------ cài đặt app */
  let deferredPrompt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
  addEventListener('appinstalled', () => { deferredPrompt = null; toast('Đã cài Z-LAB lên màn hình chính!', '', 'check'); });
  async function doInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; return; }
    const ios = '<ol style="padding-left:20px;margin:0 0 16px;line-height:1.7"><li>Mở trang này bằng <b>Safari</b>.</li><li>Bấm nút <b>Chia sẻ</b> ' + ic('share') + ' ở thanh dưới.</li><li>Chọn <b>Thêm vào MH chính</b> ' + ic('plusSq') + '.</li><li>Bấm <b>Thêm</b> – biểu tượng Z-LAB sẽ xuất hiện.</li></ol>';
    const and = '<ol style="padding-left:20px;margin:0 0 16px;line-height:1.7"><li>Mở trang này bằng <b>Chrome</b>.</li><li>Bấm menu <b>⋮</b> góc trên phải.</li><li>Chọn <b>Cài đặt ứng dụng</b> / <b>Thêm vào màn hình chính</b>.</li><li>Bấm <b>Cài đặt</b>.</li></ol>';
    const pc = '<p class="muted">Trên máy tính: dùng Chrome hoặc Edge, bấm biểu tượng cài đặt ở cuối thanh địa chỉ.</p>';
    modal('Cài Z-LAB lên máy', (IOS ? ios : and) + pc, [{ label: 'Đã hiểu', cls: '', value: true }]);
  }

  /* ------------------------------------------------------------ router */
  let route = '';
  function render() {
    const h = location.hash.replace(/^#/, '') || 'home';
    const [r, arg] = h.split('/');
    if (stageOn) { L3.unmount(); stageOn = false; }
    route = r;
    let html;
    if (r === 'lab') html = viewLab();
    else if (r === 'codex') html = viewCodex();
    else if (r === 'c') html = viewCodexDetail(arg);
    else if (r === 'crypt') html = viewCrypt();
    else if (r === 'z') html = viewZombie(arg);
    else if (r === 'arena') html = viewArena();
    else html = viewHome();
    root.innerHTML = html;
    window.scrollTo(0, 0);
    // dựng sân khấu 3D
    if ($('#stage')) {
      let b = null;
      if (r === 'lab') b = S.cur;
      else if (r === 'c') { const raw = CODEX.find(c => c[0] === arg); if (raw) b = lookBuild(cx(raw).look); }
      else if (r === 'z') { const z = S.crypt.find(x => x.id === arg); if (z) b = z.build; }
      else b = heroBuild;
      if (b) mountStage('stage', b);
    }
    fillImages(root); barsAnim();
    if (r === 'arena') { if (AR.me) { const a = $('#hp-me'); if (a) a.style.width = '100%'; } } else Snd.Music.play('lab');
    if (r === 'arena' && !AR.running) Snd.Music.play('arena');
    if (r === 'codex') { const q = $('#cq'); if (q) q.addEventListener('input', () => { CF.q = q.value; clearTimeout(q._t); q._t = setTimeout(refreshCodex, 150); }); }
  }
  addEventListener('hashchange', () => { Snd.SFX.page(); render(); });

  /* ------------------------------------------------------------ hành động */
  const ACT = {
    toggle(el) { const k = el.dataset.k; S.settings[k] = !S.settings[k]; Snd.set(k, S.settings[k]); save(); if (k === 'music' && S.settings.music) Snd.Music.play(route === 'arena' ? 'arena' : 'lab'); el.innerHTML = ic(S.settings[k] ? (k === 'music' ? 'music' : 'volume') : 'mute'); toast((k === 'music' ? 'Nhạc nền ' : 'Âm thanh ') + (S.settings[k] ? 'bật' : 'tắt'), '', k === 'music' ? 'music' : 'volume'); },
    install: () => doInstall(),
    slot(el) { curSlot = el.dataset.s; Snd.SFX.tap(); $('#slots').innerHTML = slotTabs(); const p = $('#parts'); p.innerHTML = partsList(); fillImages(p); const on = $('.part.on', p); if (on) p.scrollLeft = on.offsetLeft - 20; },
    part(el) { if (S.cur[curSlot] === el.dataset.id) return; S.cur[curSlot] = el.dataset.id; Snd.SFX.squish(); labRefresh(curSlot); },
    random() { const b = randomBuild(); Object.assign(S.cur, b); Snd.SFX.bubble(); const p = $('#parts'); labRefresh(null); if (p) { p.innerHTML = partsList(); fillImages(p); } },
    mutate() {
      const m = {}; const ks = STATS.map(s => s[0]).sort(() => rand() - 0.5).slice(0, 3); ks.forEach((k, i) => { m[k] = (i === 2 ? -1 : 1) * (4 + Math.floor(rand() * 9)); });
      S.cur.mut = m; S.cur.hue = Math.round((rand() - 0.5) * 140); Snd.SFX.bubble(); Snd.SFX.zap();
      labRefresh(null); toast('Đột biến gen! ' + ks.map(k => STATS.find(s => s[0] === k)[1] + ' ' + (m[k] > 0 ? '+' : '') + m[k]).join(', '), '', 'dna');
    },
    reanimate: () => reanimate(),
    csrc(el) { CF.src = el.dataset.v; Snd.SFX.tap(); $$('#csrc button').forEach(b => b.classList.toggle('on', b === el)); refreshCodex(); },
    csort(el) { CF.sort = el.dataset.v; Snd.SFX.tap(); $$('#csort button').forEach(b => b.classList.toggle('on', b === el)); refreshCodex(); },
    tolab(el) { const raw = CODEX.find(c => c[0] === el.dataset.id); if (!raw) return; S.cur = lookBuild(cx(raw).look); save(); toast('Đã nạp mẫu vật vào phòng lắp ráp', '', 'flask'); location.hash = '#lab'; },
    fightcodex(el) { const raw = CODEX.find(c => c[0] === el.dataset.id); if (!raw) return; AR.foe = fighterFromCodex(raw); location.hash = '#arena'; },
    async rename(el) { const z = S.crypt.find(x => x.id === el.dataset.id); if (!z) return; const v = await modal('Đổi tên zombie', '<input class="input3d" maxlength="40" value="' + esc(z.name) + '">', [{ label: 'Hủy', cls: 'steel', value: false }, { label: 'Lưu', value: true }]); const nm = (modal.input || '').trim(); if (v === true && nm) { z.name = nm; save(); render(); } },
    edit(el) { const z = S.crypt.find(x => x.id === el.dataset.id); if (!z) return; S.cur = Object.assign(DEF_BUILD(), z.build); save(); location.hash = '#lab'; },
    async del(el) { const z = S.crypt.find(x => x.id === el.dataset.id); if (!z) return; if (await confirmBox('Tiêu hủy zombie?', 'Thiêu rụi <b>' + esc(z.name) + '</b> vĩnh viễn khỏi hầm mộ?', 'Tiêu hủy')) { S.crypt = S.crypt.filter(x => x !== z); if (AR.me && AR.me.zid === z.id) AR.me = null; save(); Snd.SFX.squish(); location.hash = '#crypt'; } },
    fightz(el) { const z = S.crypt.find(x => x.id === el.dataset.id); if (!z) return; AR.me = Object.assign(fighterFromBuild(z.name, z.build), { zid: z.id }); location.hash = '#arena'; },
    pickme(el) { if (AR.running) return; const z = S.crypt.find(x => x.id === el.dataset.id); if (!z) return; AR.me = Object.assign(fighterFromBuild(z.name, z.build), { zid: z.id }); Snd.SFX.tap(); render(); },
    newfoe() { if (AR.running) return; AR.foe = fighterFromCodex(pick(CODEX)); Snd.SFX.growl(); render(); },
    fight: () => fight()
  };
  document.addEventListener('click', e => {
    Snd.init();
    const el = e.target.closest('[data-act]');
    if (!el) { if (e.target.closest('a,button')) Snd.SFX.click(); return; }
    if (!/^(part|slot|reanimate|random|mutate|csrc|csort)$/.test(el.dataset.act)) Snd.SFX.click();
    const f = ACT[el.dataset.act]; if (f) f(el);
  });
  // âm thanh cần cử chỉ người dùng đầu tiên
  const unlock = () => { Snd.init(); Snd.Music.play(route === 'arena' ? 'arena' : 'lab'); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

  render();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (!w) return; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Đã có phiên bản mới – mở lại app để cập nhật', '', 'refresh'); }); });
    }).catch(() => {}));
  }
})();
