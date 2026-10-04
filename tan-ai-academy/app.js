/* Drabuff AI Academy – ứng dụng học AI & Marketing. Phát triển bởi Tân AI. */
(function () {
  'use strict';
  const C = window.COURSE, MODS = C.modules, Snd = window.Sound;
  const root = document.getElementById('root');
  const $ = (s, e) => (e || document).querySelector(s);
  const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = Math.random;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ------------------------------------------------------------ môi trường */
  const UA = navigator.userAgent || '';
  const ENV = {
    ios: /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    android: /Android/i.test(UA),
    inApp: /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Zalo|Line\/|musical_ly|Bytedance|TikTok|Messenger|MicroMessenger/i.test(UA),
    iosOther: /CriOS|FxiOS|EdgiOS|OPiOS/i.test(UA)
  };
  ENV.inAppName = /Zalo/i.test(UA) ? 'Zalo' : /Instagram/i.test(UA) ? 'Instagram' : /Messenger/i.test(UA) ? 'Messenger' : /FBAN|FBAV|FB_IAB|FBIOS/i.test(UA) ? 'Facebook' : /musical_ly|Bytedance|TikTok/i.test(UA) ? 'TikTok' : 'ứng dụng này';
  ENV.desktop = !ENV.ios && !ENV.android;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;

  /* ------------------------------------------------------------ trạng thái */
  const KEY = 'tanai.academy.v1';
  const fresh = () => ({ v: 1, name: '', created: Date.now(), lessons: {}, cards: {}, exams: {}, flags: {}, xp: 0, final: null, settings: { music: true, sfx: true } });
  let S = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(fresh(), s); } catch (e) {}
    return fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  Snd.set('music', S.settings.music); Snd.set('sfx', S.settings.sfx);

  const modById = id => MODS.find(m => m.id === id);
  const lessonsDone = m => (S.lessons[m.id] || []).length;
  const cardsKnown = m => (S.cards[m.id] || []).length;
  const passed = m => !!(S.exams[m.id] && S.exams[m.id].passed);
  const modPct = m => Math.round(lessonsDone(m) / m.lessons.length * 30 + Math.min(1, cardsKnown(m) / m.cards.length) * 20 + (passed(m) ? 50 : 0));
  const passedCount = () => MODS.filter(passed).length;
  const allDone = () => passedCount() === MODS.length;
  const totalPct = () => Math.round(MODS.reduce((a, m) => a + modPct(m), 0) / MODS.length);
  const avgScore = () => { const p = MODS.filter(passed); return p.length ? Math.round(p.reduce((a, m) => a + S.exams[m.id].best, 0) / p.length) : 0; };
  const nextMod = () => MODS.find(m => !passed(m)) || null;
  const LEVELS = [[0, 'Tân binh AI'], [150, 'Người học chăm chỉ'], [400, 'Chiến binh Prompt'], [800, 'Chuyên viên AI'], [1300, 'Chuyên gia AI'], [1900, 'Bậc thầy AI']];
  function level() {
    let i = 0; LEVELS.forEach((l, k) => { if (S.xp >= l[0]) i = k; });
    const cur = LEVELS[i], nx = LEVELS[i + 1];
    return { n: i + 1, title: cur[1], pct: nx ? (S.xp - cur[0]) / (nx[0] - cur[0]) : 1, next: nx ? nx[0] : null };
  }
  function addXP(n) {
    const before = level().n; S.xp += n; save();
    const xc = $('.xp-chip b'); if (xc) xc.textContent = S.xp;
    const after = level();
    if (after.n > before) setTimeout(() => { toast('Lên cấp ' + after.n + ': ' + after.title + '!', 'gold', 'star'); Snd.SFX.sparkle(); }, 600);
  }
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };
  const firstName = () => { const p = S.name.trim().split(/\s+/); return p[p.length - 1] || ''; };
  const initial = () => (firstName().charAt(0) || 'A').toLocaleUpperCase('vi');
  const titleCase = s => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi').split(' ').map(w => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1)).join(' ');
  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ------------------------------------------------------------ icon */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0 0 4h14"/><path d="M8 7h8M8 11h6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8 7 22l5-3 5 3-1.5-8.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    brain: '<path d="M9.5 3A3 3 0 0 0 6.6 6.8 3.2 3.2 0 0 0 4.5 12a3.2 3.2 0 0 0 1.7 4.8A3 3 0 0 0 9.5 21c1.4 0 2.5-1 2.5-2.3V5.2C12 4 11 3 9.5 3z"/><path d="M14.5 3a3 3 0 0 1 2.9 3.8 3.2 3.2 0 0 1 2.1 5.2 3.2 3.2 0 0 1-1.7 4.8 3 3 0 0 1-3.3 4.2c-1.4 0-2.5-1-2.5-2.3"/><path d="M9 9.5c1 0 1.8.5 2.2 1.3M15 9.5c-1 0-1.8.5-2.2 1.3M8.5 15c1 .2 2 .1 3-.6M15.5 15c-1 .2-2 .1-3-.6"/>',
    wand: '<path d="m3 21 12-12"/><path d="m13 7 4 4"/><path d="M18 2v3M16.5 3.5h3M20.5 8v2M19.5 9h2M10 2v2M9 3h2"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17.5 9a4 4 0 0 1 0 6"/><path d="M20 6.5a8 8 0 0 1 0 11"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    robot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><circle cx="9" cy="14" r="1.3"/><circle cx="15" cy="14" r="1.3"/><path d="M2 13v3M22 13v3"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    rocket: '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    cards: '<rect x="2" y="6" width="14" height="16" rx="2"/><path d="M6 2h14a2 2 0 0 1 2 2v14"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    laptop: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
    plusSq: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    dotsV: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 19.5h.01"/>'
  };
  const ic = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>';
  const TROPHY = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".35" stop-color="#ffcf4a"/><stop offset=".7" stop-color="#e08e12"/><stop offset="1" stop-color="#ffe08a"/></linearGradient><linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4f9a"/><stop offset="1" stop-color="#121c46"/></linearGradient></defs><path d="M31 28H17c0 14 8 22 18 24" fill="none" stroke="url(#tg)" stroke-width="7" stroke-linecap="round"/><path d="M89 28h14c0 14-8 22-18 24" fill="none" stroke="url(#tg)" stroke-width="7" stroke-linecap="round"/><path d="M30 20h60v20c0 18-12 32-30 34-18-2-30-16-30-34z" fill="url(#tg)" stroke="#8a5208" stroke-width="2"/><path d="M52 74h16l-2 14H54z" fill="url(#tg)" stroke="#8a5208" stroke-width="1.5"/><rect x="38" y="87" width="44" height="10" rx="3" fill="url(#tg)" stroke="#8a5208" stroke-width="1.5"/><rect x="32" y="97" width="56" height="14" rx="4" fill="url(#tb)" stroke="#ffcf4a" stroke-width="2"/><path d="m60 30 4.4 9 9.9 1.4-7.2 7 1.7 9.8L60 52.6l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z" fill="#fff8d8"/><path d="M37 25c0 16 4 26 12 32" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  const STAR = on => '<svg viewBox="0 0 24 24" class="' + (on ? 'on' : '') + '"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="' + (on ? 'url(#sg)' : '#1d2a5a') + '" stroke="' + (on ? '#8a5208' : '#2a3c7c') + '" stroke-width="1.2"/><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".5" stop-color="#ffcf4a"/><stop offset="1" stop-color="#e08e12"/></linearGradient></defs></svg>';

  /* ------------------------------------------------------------ UI helpers */
  const btn = (label, cls, attrs, icon) => '<button class="b3d ' + (cls || '') + '" ' + (attrs || '') + '>' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + '<span>' + label + '</span></button>';
  const link = (label, cls, href, icon) => '<a class="b3d ' + (cls || '') + '" href="' + href + '">' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + '<span>' + label + '</span></a>';
  const tile = (m, lg) => '<div class="tile3d ' + (lg ? 'lg' : '') + '" style="--c1:' + m.c1 + ';--c2:' + m.c2 + '">' + ic(m.icon) + '</div>';
  const brand = () => '<a class="brand" href="#home" aria-label="Drabuff AI Academy"><img src="icons/icon-192.png" alt=""><span><b>Drabuff AI<span class="bw"> Academy</span></b><small>PHÁT TRIỂN BỞI TÂN AI</small></span></a>';
  const credit = () => '<div class="foot-note">Drabuff AI Academy · Phát triển bởi <b>Tân AI</b><br>Chứng chỉ cấp bởi Chuyên gia AI Nguyễn Văn Tân (Tân AI)</div>';

  function toast(msg, kind, icon) {
    const box = $('#toast'), el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.innerHTML = ic(icon || 'info') + '<span>' + msg + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
  }
  function modal(title, body, buttons) {
    return new Promise(res => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = '<div class="modal panel hud" role="dialog" aria-modal="true"><h3>' + title + '</h3>' + body + '<div class="btn-row">' + buttons.map((b, i) => btn(b.label, b.cls || 'steel', 'data-mi="' + i + '"', b.icon)).join('') + '</div></div>';
      document.body.appendChild(bg);
      const done = v => { const f = bg.querySelector('input'); modal.input = f ? f.value : ''; bg.remove(); res(v); };
      bg.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (b) done(buttons[+b.dataset.mi].value); else if (e.target === bg) done(null); });
      const f = bg.querySelector('input'); if (f) setTimeout(() => f.focus(), 50);
    });
  }
  const confirmBox = (title, text, ok, okCls) => modal(title, '<p>' + text + '</p>', [{ label: 'Hủy', cls: 'steel', value: false }, { label: ok, cls: okCls || '', value: true }]);
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, () => fallback());
    return Promise.resolve(fallback());
    function fallback() { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok; }
  }
  function ringSvg(pct, r, w, grad) {
    const c = 2 * Math.PI * r, s = r * 2 + w * 2;
    return '<svg viewBox="0 0 ' + s + ' ' + s + '"><defs><linearGradient id="' + grad + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ff6ff"/><stop offset="1" stop-color="#3b82f6"/></linearGradient><linearGradient id="' + grad + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset=".5" stop-color="#ffcf4a"/><stop offset="1" stop-color="#e08e12"/></linearGradient></defs>' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="#0a1230" stroke-width="' + w + '"/>' +
      '<circle class="rg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="url(#' + grad + ')" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-off="' + (c * (1 - pct / 100)) + '" style="transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"/></svg>';
  }
  function animateRings() { requestAnimationFrame(() => requestAnimationFrame(() => $$('.rg').forEach(c => { c.style.strokeDashoffset = c.dataset.off; }))); $$('.bar3d > i[data-w]').forEach(b => requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = b.dataset.w + '%'; }))); }
  const bar = (pct, gold) => '<div class="bar3d ' + (gold ? 'gold' : '') + '"><i data-w="' + pct + '"></i></div>';

  /* ------------------------------------------------------------ FX: pháo hoa & confetti */
  const FX = (() => {
    const c = $('#fx'), x = c.getContext('2d'); let W = 0, H = 0, raf = null, fw = null; const parts = [];
    const COLS = ['#ffd25e', '#fff3c0', '#3ce3ff', '#a78bfa', '#4ade80', '#ff7eb3', '#ffffff', '#ff9f43'];
    const pick = () => COLS[Math.floor(rand() * COLS.length)];
    function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
    size(); addEventListener('resize', size);
    function burst(x0, y0) {
      const col = pick(), col2 = pick(), n = 64 + Math.floor(rand() * 30);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, sp = 1.6 + rand() * 4.4; parts.push({ k: 's', x: x0, y: y0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.05, drag: 0.975, life: 55 + rand() * 35, fade: 30, s: 2.2, col: rand() < 0.3 ? col2 : col }); }
      parts.push({ k: 'f', x: x0, y: y0, life: 12, fade: 12, s: 60, col });
    }
    function loop() {
      x.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life--;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const a = Math.min(1, p.life / p.fade);
        if (p.k === 'f') { const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); g.addColorStop(0, 'rgba(255,255,255,' + 0.5 * a + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); continue; }
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy;
        if (p.k === 'c') { p.rot += p.vr; x.save(); x.globalAlpha = a; x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(p.rot * 1.7)); x.fillStyle = p.col; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }
        else if (p.k === 's') { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; x.strokeStyle = p.col; x.lineWidth = p.s; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); x.stroke(); x.globalCompositeOperation = 'source-over'; }
        else if (p.k === 'r') {
          x.globalCompositeOperation = 'lighter'; x.fillStyle = '#fff6d0'; x.beginPath(); x.arc(p.x, p.y, 2.6, 0, 7); x.fill();
          if (rand() < 0.8) parts.push({ k: 's', x: p.x, y: p.y, vx: (rand() - 0.5) * 0.6, vy: 1 + rand(), g: 0.02, drag: 0.95, life: 18, fade: 18, s: 1.6, col: '#ffcf6a' });
          x.globalCompositeOperation = 'source-over';
          if (p.vy > -1.2) { burst(p.x, p.y); parts.splice(parts.indexOf(p), 1); }
        }
      }
      x.globalAlpha = 1;
      if (parts.length || fw) raf = requestAnimationFrame(loop); else { raf = null; x.clearRect(0, 0, W, H); }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    return {
      confetti(n) {
        n = n || 160;
        for (let i = 0; i < n; i++) { const side = i % 3; const sx = side === 0 ? W / 2 : side === 1 ? 0 : W; const dir = side === 0 ? (rand() - 0.5) * 2 : side === 1 ? 1 : -1;
          parts.push({ k: 'c', x: sx + (side === 0 ? (rand() - 0.5) * 80 : 0), y: side === 0 ? H * 0.32 : H * 0.85, vx: dir * (side === 0 ? 7 : 6 + rand() * 7) * (side === 0 ? rand() : 1), vy: -(side === 0 ? 4 + rand() * 10 : 12 + rand() * 8), g: 0.3, drag: 0.985, life: 150 + rand() * 90, fade: 40, s: 7 + rand() * 7, rot: rand() * 6, vr: (rand() - 0.5) * 0.4, col: pick() }); }
        kick();
      },
      rocket() { parts.push({ k: 'r', x: W * (0.15 + rand() * 0.7), y: H + 10, vx: (rand() - 0.5) * 2.2, vy: -(Math.sqrt(H) * 0.62 + rand() * 3), g: 0.12, drag: 0.995, life: 200, fade: 1 }); kick(); },
      start() { if (fw) return; this.rocket(); fw = setInterval(() => { if (document.hidden) return; this.rocket(); if (rand() < 0.45) setTimeout(() => this.rocket(), 220); }, 720); kick(); },
      stop() { if (fw) clearInterval(fw); fw = null; }
    };
  })();

  /* ------------------------------------------------------------ nền mạng nơ-ron */
  (function neural() {
    const c = $('#bg'), x = c.getContext('2d'); let W, H; const nodes = [];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
    size(); addEventListener('resize', size);
    const N = innerWidth < 700 ? 34 : 64;
    for (let i = 0; i < N; i++) nodes.push({ x: rand() * W, y: rand() * H, vx: (rand() - 0.5) * 0.28, vy: (rand() - 0.5) * 0.28, r: 1 + rand() * 1.8, g: rand() < 0.18 });
    function frame() {
      if (!document.hidden) {
        x.clearRect(0, 0, W, H);
        for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20; if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20; }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 17000) { x.strokeStyle = 'rgba(90,170,255,' + (1 - d / 17000) * 0.28 + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
        }
        for (const n of nodes) { x.fillStyle = n.g ? 'rgba(255,210,94,.9)' : 'rgba(120,230,255,.85)'; x.shadowColor = x.fillStyle; x.shadowBlur = 8; x.beginPath(); x.arc(n.x, n.y, n.r, 0, 7); x.fill(); }
        x.shadowBlur = 0;
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ------------------------------------------------------------ cài đặt PWA */
  let deferredPrompt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; refreshInstall(); });
  addEventListener('appinstalled', () => { deferredPrompt = null; toast('Đã cài đặt! Mở app <b>Drabuff AI</b> trên màn hình chính nhé.', 'gold', 'check'); refreshInstall(); });
  function refreshInstall() { const b = $('#inst-body'); if (b) b.innerHTML = installBody(INST_TAB); }
  async function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { const r = await deferredPrompt.userChoice; if (r.outcome === 'accepted') toast('Đang cài đặt ứng dụng…', 'gold', 'download'); } catch (e) {}
      deferredPrompt = null; refreshInstall(); return;
    }
    if (location.hash && location.hash !== '#') { location.hash = ''; setTimeout(() => scrollInstall(), 350); return; }
    scrollInstall();
    toast(ENV.ios ? 'Làm theo 3 bước bên dưới để thêm app vào màn hình chính' : 'Làm theo các bước bên dưới để cài app', '', 'info');
  }
  function scrollInstall() { const el = $('#cai-dat'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  const androidIntent = () => 'intent://' + location.host + location.pathname + '#Intent;scheme=https;package=com.android.chrome;end';
  let INST_TAB = ENV.ios ? 'ios' : ENV.android ? 'android' : 'desktop';

  function installBody(t) {
    if (standalone()) return '<div class="installed-note">' + ic('check') + ' Bạn đang dùng ứng dụng đã cài đặt. Tuyệt vời!</div>';
    const appIcon = '<img src="icons/icon-192.png" alt="">';
    if (t === 'android') {
      let h = '';
      if (ENV.inApp && ENV.android) h += '<div class="warn-box">' + ic('info') + '<div><b>Bạn đang mở trang trong ' + ENV.inAppName + '.</b><br>Trình duyệt này không cài được app. Bấm “Mở bằng Chrome” hoặc bấm ' + ic('dotsV') + ' rồi chọn <b>Mở bằng trình duyệt</b>.<div class="btn-row" style="margin-top:12px"><a class="b3d sm cyan" href="' + androidIntent() + '">' + ic('compass') + '<span>Mở bằng Chrome</span></a>' + btn('Sao chép liên kết', 'sm steel', 'data-act="copyLink"', 'link') + '</div></div></div>';
      h += '<div class="install-cta">' + btn(deferredPrompt ? 'Cài ứng dụng ngay' : 'Cài ứng dụng', 'xl shine', 'data-act="install"', 'download') + '<small class="muted">' + (deferredPrompt ? 'Bấm nút trên rồi chọn <b>Cài đặt</b> là xong.' : 'Nếu nút không hiện hộp thoại cài đặt, làm theo 4 bước dưới đây.') + '</small></div>';
      h += '<div class="steps">' +
        step(1, 'Mở bằng Chrome', 'Mở trang này bằng trình duyệt <b>Chrome</b> trên điện thoại Android.', '<div class="chrome">' + ic('dotsV') + '</div>' + ic('compass', 'hl') ) +
        step(2, 'Bấm nút menu', 'Bấm <span class="kbd">' + ic('dotsV') + '</span> ở góc trên bên phải trình duyệt.', '<div class="chrome"><span class="hl">' + ic('dotsV') + '</span></div>') +
        step(3, 'Chọn “Cài đặt ứng dụng”', 'Chọn <b>Cài đặt ứng dụng</b> (hoặc <b>Thêm vào màn hình chính</b>) rồi bấm <b>Cài đặt</b>.', '<div class="menu3"><div>Thẻ mới</div><div>Dấu trang</div><div class="hl2">Cài đặt ứng dụng</div><div>Chia sẻ…</div></div>') +
        step(4, 'Mở app Drabuff AI', 'Biểu tượng <b>Drabuff AI</b> xuất hiện trên màn hình chính. Bấm vào để học!', '<div class="home"><i></i><i></i>' + appIcon + '<i></i><i></i><i></i><i></i><i></i></div>') +
        '</div><p class="muted center" style="font-size:13px;margin:16px 0 0">Dùng Samsung Internet: bấm ' + ic('dots') + ' / ≡ → <b>Thêm trang vào</b> → <b>Màn hình chính</b>.</p>';
      return h;
    }
    if (t === 'ios') {
      let h = '';
      if (ENV.inApp && ENV.ios) h += '<div class="warn-box">' + ic('info') + '<div><b>Bạn đang mở trang trong ' + ENV.inAppName + '.</b><br>Hãy bấm ' + ic('dots') + ' hoặc biểu tượng la bàn ' + ic('compass') + ' rồi chọn <b>Mở bằng Safari</b>. Hoặc sao chép liên kết và dán vào Safari.<div class="btn-row" style="margin-top:12px">' + btn('Sao chép liên kết', 'sm steel', 'data-act="copyLink"', 'link') + '</div></div></div>';
      else if (ENV.iosOther) h += '<div class="warn-box">' + ic('info') + '<div>Bạn đang dùng trình duyệt khác Safari. Từ iOS 16.4 có thể cài qua nút Chia sẻ; nếu không thấy mục <b>Thêm vào MH chính</b>, hãy mở trang bằng <b>Safari</b>.</div></div>';
      h += '<div class="steps">' +
        step(1, 'Bấm nút Chia sẻ', 'Trong <b>Safari</b>, bấm <span class="kbd">' + ic('share') + '</span> ở thanh dưới. (iOS mới: bấm <span class="kbd">' + ic('dots') + '</span> rồi chọn <b>Chia sẻ</b>.)', '<div class="sbar">' + ic('left') + ic('right') + '<span class="hl">' + ic('share') + '</span>' + ic('book') + ic('cards') + '</div>') +
        step(2, 'Thêm vào MH chính', 'Kéo xuống và chọn <b>Thêm vào MH chính</b> <span class="kbd">' + ic('plusSq') + '</span>.', '<div class="sheet"><div>Sao chép ' + ic('copy') + '</div><div class="hl2">Thêm vào MH chính ' + ic('plusSq') + '</div><div>Đánh dấu ' + ic('book') + '</div></div>') +
        step(3, 'Bấm “Thêm”', 'Giữ tên <b>Drabuff AI</b> và bấm <b>Thêm</b> ở góc trên bên phải.', '<div class="dlg"><div class="dt"><span>Hủy</span><span class="add">Thêm</span></div><div class="da">' + appIcon + 'Drabuff AI</div></div>') +
        step(4, 'Mở app Drabuff AI', 'Biểu tượng <b>Drabuff AI</b> có trên màn hình chính. Mở ra là học được ngay, cả khi không có mạng.', '<div class="home"><i></i><i></i>' + appIcon + '<i></i><i></i><i></i><i></i><i></i></div>') +
        '</div><p class="muted center" style="font-size:13px;margin:16px 0 0">' + ic('info') + ' Trên iPhone, tiến độ học trong Safari và trong app được lưu riêng, vì vậy hãy <b>cài app trước khi bắt đầu học</b>.</p>';
      return h;
    }
    const url = location.origin + location.pathname;
    return '<div class="qr-box"><div class="qr" id="qr"></div><div style="max-width:380px;text-align:left"><b style="font-size:18px">Quét mã bằng điện thoại</b><p class="muted">Mở Camera trên điện thoại, quét mã QR để mở trang này, sau đó làm theo hướng dẫn cho <b>Android</b> hoặc <b>iPhone</b>.</p><p class="muted" style="font-size:13px;word-break:break-all">' + esc(url) + '</p>' +
      (deferredPrompt ? btn('Cài lên máy tính', 'cyan', 'data-act="install"', 'laptop') : '<p class="muted" style="font-size:13px">Cài lên máy tính: dùng Chrome hoặc Edge, bấm biểu tượng cài đặt ở cuối thanh địa chỉ.</p>') + '</div></div>';
  }
  const step = (n, t, p, ill) => '<div class="step"><span class="sn">' + n + '</span><div class="ill">' + ill + '</div><b>' + t + '</b><p>' + p + '</p></div>';
  function drawQR() {
    const el = $('#qr'); if (!el || !window.qrcode) return;
    try { const q = window.qrcode(0, 'M'); q.addData(location.origin + location.pathname); q.make(); el.innerHTML = '<img alt="Mã QR mở Drabuff AI Academy" src="' + q.createDataURL(8, 0) + '">'; } catch (e) {}
  }

  /* ------------------------------------------------------------ landing */
  function phoneMock() {
    const rows = MODS.slice(0, 5).map((m, i) => '<div class="pm">' + tile(m) + '<div style="flex:1;min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m.title) + '</div><div class="bar3d ' + (i < 2 ? 'gold' : '') + '"><i style="width:' + [100, 100, 60, 25, 0][i] + '%"></i></div></div></div>').join('');
    return '<div class="phone"><div class="notch"></div><div class="scr"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div class="avatar" style="width:38px;height:38px;font-size:16px">T</div><div><div style="font:800 13px/1.2 var(--ui)">Xin chào, bạn!</div><div style="font-size:10.5px;color:var(--gold)">Chiến binh Prompt · 420 XP</div></div></div>' + rows + '<div class="b3d block sm shine" style="margin-top:6px"><span class="sh"></span>' + ic('play') + '<span>Tiếp tục học</span></div></div></div>';
  }
  function landing() {
    const cont = S.name ? 'Tiếp tục học' : 'Học ngay trên web';
    const feats = [
      ['book', '#5b8cff', '#8b5cf6', 'Bài giảng ngắn gọn, thực chiến', '40 bài học cô đọng kèm prompt mẫu sao chép dùng ngay và mẹo riêng từ Tân AI.'],
      ['cards', '#22d3ee', '#3b82f6', 'Flashcard lật 3D', '80 thẻ ghi nhớ – chạm để lật, vuốt phải “đã thuộc”, vuốt trái “ôn lại”.'],
      ['clock', '#f472b6', '#e11d48', 'Bài thi 7 dạng câu hỏi', 'Trắc nghiệm, chọn nhiều, đúng/sai, điền khuyết, sắp xếp, ghép cặp, tình huống – có hẹn giờ và nhạc tập trung.'],
      ['award', '#fbbf24', '#f97316', 'Chứng chỉ mang tên bạn', 'Đạt từ 80% nhận ngay chứng chỉ từng học phần do Chuyên gia AI Nguyễn Văn Tân cấp, tải về độ nét cao.'],
      ['trophy', '#facc15', '#ca8a04', 'Bằng công nhận & Vinh danh', 'Hoàn thành cả 10 học phần để nhận Bằng công nhận cuối khóa cùng lễ vinh danh có nhạc và pháo hoa.'],
      ['phone', '#34d399', '#059669', 'Cài như app, học offline', 'Không cần App Store hay CH Play. Mở toàn màn hình, học được cả khi mất mạng.']
    ];
    return '<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="land">' +
      '<nav class="lnav"><div class="in">' + brand() + '<span class="sp"></span>' + link(cont, 'sm ghost hide-sm', '#home', 'play') + btn('Cài app', 'sm', 'data-act="install"', 'download') + '</div></nav>' +
      '<section class="wrap hero"><div>' +
        '<span class="chip gold">' + ic('sparkle') + ' Phát triển bởi Tân AI</span>' +
        '<h1>Làm chủ <span class="cy-text">AI</span> &amp; Marketing.<br><span class="gold-text">Nhận chứng chỉ mang tên bạn.</span></h1>' +
        '<p class="lead">10 học phần thực chiến, 100 câu hỏi thi với 7 dạng khác nhau, flashcard 3D và chứng chỉ do <b>Chuyên gia AI Nguyễn Văn Tân</b> trực tiếp cấp.</p>' +
        '<div class="cta">' + btn('Cài ứng dụng ngay', 'lg shine', 'data-act="install"', 'download') + link(cont, 'lg steel', '#home', 'play') + '</div>' +
        '<div class="hstat"><div><b class="gold-text">10</b><span>học phần</span></div><div><b class="gold-text">100</b><span>câu hỏi thi</span></div><div><b class="gold-text">80</b><span>flashcard</span></div><div><b class="gold-text">11</b><span>chứng chỉ &amp; bằng</span></div></div>' +
      '</div><div style="position:relative;perspective:1200px;padding:10px 0">' + phoneMock() +
        '<div class="float-badge" style="top:300px;left:-6px">' + ic('award') + 'Chứng chỉ cá nhân hóa</div><div class="float-badge" style="bottom:80px;right:0;animation-delay:-2.5s">' + ic('music') + 'Nhạc &amp; hiệu ứng 3D</div></div></section>' +
      '<section class="lsec" id="cai-dat"><div class="wrap"><div class="center"><span class="chip">' + ic('phone') + ' Không cần App Store / CH Play</span></div>' +
        '<h2>Cài đặt chỉ trong <span class="gold-text">30 giây</span></h2><p class="sub">Ứng dụng cài thẳng từ trang web này lên màn hình chính, mở toàn màn hình như app thật và học được cả khi không có mạng.</p>' +
        '<div class="install-box panel hud"><div class="tabs">' + [['android', 'Android', 'phone'], ['ios', 'iPhone / iPad', 'phone'], ['desktop', 'Máy tính', 'laptop']].map(t => btn(t[1], (INST_TAB === t[0] ? 'cyan' : 'steel') + ' sm', 'data-act="itab" data-t="' + t[0] + '"', t[2])).join('') + '</div><div id="inst-body">' + installBody(INST_TAB) + '</div></div></div></section>' +
      '<section class="lsec"><div class="wrap"><div class="center"><span class="chip gold">' + ic('sparkle') + ' Trải nghiệm học tập cao cấp</span></div><h2>Mọi thứ bạn cần để <span class="cy-text">giỏi AI</span></h2><p class="sub">Thiết kế theo phương pháp học chủ động: học ngắn – ôn bằng thẻ – thi để khắc sâu – nhận chứng chỉ để tạo động lực.</p>' +
        '<div class="feat">' + feats.map(f => '<div class="panel hud"><div class="tile3d" style="--c1:' + f[1] + ';--c2:' + f[2] + '">' + ic(f[0]) + '</div><b>' + f[3] + '</b><p>' + f[4] + '</p></div>').join('') + '</div></div></section>' +
      '<section class="lsec"><div class="wrap"><h2>Lộ trình <span class="gold-text">10 học phần</span></h2><p class="sub">' + esc(C.title) + ' – từ nền tảng đến chiến lược doanh nghiệp.</p><div class="curr">' +
        MODS.map(m => '<div class="mcard">' + tile(m) + '<div class="mi"><span class="chip dim">' + m.code + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.desc) + '</p></div></div>').join('') + '</div></div></section>' +
      '<section class="lsec"><div class="wrap"><h2>Chứng chỉ <span class="gold-text">đẳng cấp</span>, mang tên bạn</h2><p class="sub">Mỗi học phần một chứng chỉ, hoàn thành toàn khóa nhận Bằng công nhận – tất cả do <b>Chuyên gia AI Nguyễn Văn Tân</b> cấp.</p>' +
        '<div class="cert-show"><div class="cert-frame"><div class="loading" id="pv1">Đang tạo mẫu…</div><div class="glare"></div></div><div class="cert-frame"><div class="loading" id="pv2">Đang tạo mẫu…</div><div class="glare"></div></div></div></div></section>' +
      '<section class="lsec"><div class="wrap"><h2>Câu hỏi thường gặp</h2><div class="faq" style="margin-top:22px">' + [
        ['Vì sao không có trên App Store hay CH Play?', 'Drabuff AI Academy là ứng dụng web cài đặt được (PWA). Bạn cài trực tiếp từ trang này, không cần qua cửa hàng ứng dụng và luôn dùng phiên bản mới nhất.'],
        ['App có chạy khi không có mạng không?', 'Có. Sau lần mở đầu tiên, toàn bộ bài học, flashcard, bài thi và chứng chỉ đều hoạt động offline.'],
        ['Tiến độ học và chứng chỉ được lưu ở đâu?', 'Lưu ngay trên thiết bị của bạn, không gửi lên máy chủ. Hãy học trên cùng một thiết bị và tải chứng chỉ về máy sau khi nhận. Nếu xóa app hoặc xóa dữ liệu trình duyệt, tiến độ sẽ mất.'],
        ['Làm sao để nhận chứng chỉ?', 'Học bài giảng, ôn flashcard rồi làm bài thi của mỗi học phần. Đạt từ 80% trở lên là nhận ngay chứng chỉ mang tên bạn. Hoàn thành cả 10 học phần sẽ nhận Bằng công nhận và được vinh danh.'],
        ['Dùng iPhone cần lưu ý gì?', 'Hãy cài bằng Safari và cài app trước khi bắt đầu học, vì trên iPhone tiến độ trong Safari và trong app được lưu riêng.']
      ].map(q => '<details class="panel"><summary>' + q[0] + ic('right') + '</summary><p>' + q[1] + '</p></details>').join('') + '</div></div></section>' +
      '<footer class="lfoot"><img src="icons/drabuff-logo-white.png" alt="Drabuff Agency & Academy" style="width:170px;margin:0 auto 14px;opacity:.9"><div>© ' + new Date().getFullYear() + ' Drabuff AI Academy · Phát triển bởi <b>Tân AI</b></div><div style="margin-top:4px">Chứng chỉ và bằng công nhận được cấp bởi Chuyên gia AI Nguyễn Văn Tân (Tân AI)</div></footer></div>';
  }
  function landingAfter() {
    drawQR();
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); preview(e.target); } }), { rootMargin: '200px' }) : null;
    ['#pv1', '#pv2'].forEach(s => { const el = $(s); if (el) io ? io.observe(el) : preview(el); });
    async function preview(el) {
      const cv = document.createElement('canvas'), fin = el.id === 'pv2';
      await Cert.draw(cv, fin ? { final: true, name: 'Tên Của Bạn', program: C.title, count: MODS.length, score: 96, date: today(), id: 'TAI-FINAL-MAU0001' } : { name: 'Tên Của Bạn', title: MODS[1].title, code: MODS[1].code, program: C.title, score: 100, date: today(), id: 'TAI-AI102-MAU0001' }, 0.5);
      const img = new Image(); img.alt = fin ? 'Mẫu Bằng công nhận' : 'Mẫu chứng chỉ học phần'; img.src = cv.toDataURL('image/jpeg', 0.88);
      el.replaceWith(img);
    }
  }

  /* ------------------------------------------------------------ khung app */
  function shell(inner, tab, opts) {
    opts = opts || {};
    const sound = S.settings.music || S.settings.sfx;
    return '<div class="orb o1"></div><div class="orb o2"></div>' +
      '<header class="topbar"><div class="topbar-in">' + brand() + '<span class="sp"></span><span class="xp-chip">' + ic('sparkle') + '<b>' + S.xp + '</b> XP</span><button class="icon-btn" data-act="mute" aria-label="Bật/tắt âm thanh">' + ic(sound ? 'volume' : 'mute') + '</button></div></header>' +
      '<main class="app' + (tab === false ? ' nonav' : '') + '"><div class="screen">' + inner + '</div></main>' +
      (tab === false ? '' : '<nav class="nav" aria-label="Điều hướng"><div class="nav-in">' + [['home', 'Trang chủ', 'home'], ['learn', 'Lộ trình', 'map'], ['certs', 'Chứng chỉ', 'award'], ['profile', 'Hồ sơ', 'user']].map(n => '<a href="#' + n[0] + '" class="' + (tab === n[0] ? 'on' : '') + '">' + ic(n[2]) + '<span>' + n[1] + '</span></a>').join('') + '</div></nav>');
  }
  const backRow = (href, title, extra) => '<div class="back-row"><a class="icon-btn" href="' + href + '" aria-label="Quay lại">' + ic('left') + '</a><h2>' + title + '</h2>' + (extra || '') + '</div>';

  /* ------------------------------------------------------------ chào mừng */
  function welcome() {
    return '<div class="orb o1"></div><div class="orb o2"></div><main class="app noshell"><div class="screen welcome">' +
      '<img class="logo3d" src="icons/icon-512.png" alt="Drabuff AI Academy">' +
      '<h1>Chào mừng đến<br><span class="gold-text">Drabuff AI Academy</span></h1>' +
      '<div class="by">Học AI &amp; Marketing thực chiến · Phát triển bởi <b>Tân AI</b></div>' +
      '<div class="panel hud"><div class="field"><label for="nm">Họ và tên của bạn</label><input id="nm" class="input3d" maxlength="40" autocomplete="name" autocapitalize="words" placeholder="Ví dụ: Nguyễn Thị Lan" value="' + esc(S.name) + '"></div>' +
      '<div class="mini-cert"><small>CHỨNG CHỈ · DRABUFF AI ACADEMY</small><div class="mc-t">Trân trọng chứng nhận</div><div class="mc-n" id="mcn">' + esc(S.name || 'Tên của bạn') + '</div><div class="mc-s">Họ tên này sẽ được in trên chứng chỉ và bằng công nhận<br>do Chuyên gia AI Nguyễn Văn Tân cấp</div></div>' +
      '<label class="check"><input type="checkbox" id="cf"><span class="box">' + ic('check') + '</span><span>Tôi xác nhận họ tên trên là chính xác để in lên chứng chỉ.</span></label>' +
      btn('Bắt đầu hành trình', 'xl block shine', 'data-act="welcomeGo"', 'rocket') + '</div>' + credit() + '</div></main>';
  }
  function welcomeAfter() {
    const nm = $('#nm'), mc = $('#mcn');
    nm.addEventListener('input', () => { mc.textContent = nm.value.trim() ? titleCase(nm.value) : 'Tên của bạn'; });
  }

  /* ------------------------------------------------------------ trang chủ */
  function home() {
    const lv = level(), nx = nextMod(), pc = passedCount();
    let h = '<div class="panel hud"><div class="hello"><div class="avatar">' + esc(initial()) + '</div><div style="flex:1;min-width:0"><div class="muted" style="font-size:13px">Xin chào,</div><h1>' + esc(S.name) + '</h1><div class="lvl"><span class="chip gold">' + ic('star') + ' Cấp ' + lv.n + ' · ' + lv.title + '</span></div></div></div>' +
      '<div style="margin-top:14px">' + bar(Math.round(lv.pct * 100), true) + '<div class="muted" style="font-size:12px;margin-top:6px;display:flex;justify-content:space-between"><span>' + S.xp + ' XP</span><span>' + (lv.next ? 'Cấp tiếp theo: ' + lv.next + ' XP' : 'Cấp tối đa') + '</span></div></div></div>';
    h += '<div class="panel" style="margin-top:14px"><div class="ring-wrap"><div class="ring">' + ringSvg(totalPct(), 46, 10, 'rgH') + '<div class="rv"><div><b>' + totalPct() + '%</b><small>hoàn thành</small></div></div></div><div style="flex:1"><b style="font-size:16px">Tiến độ khóa học</b><p class="muted" style="margin:4px 0 12px;font-size:13px">' + pc + '/' + MODS.length + ' chứng chỉ · Điểm TB ' + (avgScore() || '–') + '</p>' +
      (nx ? link(lessonsDone(nx) ? 'Tiếp tục học' : 'Bắt đầu học', 'block shine', '#m/' + nx.id, 'play') : link('Lễ vinh danh', 'block shine', '#honor', 'trophy')) + '</div></div></div>';
    h += '<div class="stats"><div class="stat"><b class="gold-text">' + pc + '</b><span>Chứng chỉ</span></div><div class="stat"><b class="cy-text">' + MODS.reduce((a, m) => a + lessonsDone(m), 0) + '</b><span>Bài đã học</span></div><div class="stat"><b class="cy-text">' + MODS.reduce((a, m) => a + cardsKnown(m), 0) + '</b><span>Thẻ đã thuộc</span></div></div>';
    h += '<div class="final-card" style="margin-top:16px"><div class="trophy">' + TROPHY + '</div><span class="chip gold">' + ic('award') + ' Bằng công nhận cuối khóa</span><h3 style="margin-top:10px">' + (allDone() ? 'Chúc mừng! Bạn đã hoàn thành toàn bộ khóa học' : 'Hoàn thành 10 học phần để được vinh danh') + '</h3><p>' + (allDone() ? 'Nhận Bằng công nhận do Chuyên gia AI Nguyễn Văn Tân cấp.' : 'Đã có ' + pc + '/' + MODS.length + ' chứng chỉ. Cố lên, bạn đang làm rất tốt!') + '</p>' +
      (allDone() ? link('Đến lễ Vinh danh', 'shine', '#honor', 'trophy') : bar(pc / MODS.length * 100, true)) + '</div>';
    h += '<div class="sec-title">Các học phần</div><div class="mgrid">' + MODS.map(modCard).join('') + '</div>' + credit();
    return h;
  }
  function modCard(m) {
    const pct = modPct(m), ex = S.exams[m.id];
    return '<a class="mcard" href="#m/' + m.id + '">' + tile(m) + '<div class="mi"><span class="chip dim">' + m.code + '</span><h3>' + esc(m.title) + '</h3>' + bar(pct, passed(m)) + '<div class="meta"><span>' + ic('book') + ' ' + lessonsDone(m) + '/' + m.lessons.length + ' · ' + ic('cards') + ' ' + cardsKnown(m) + '/' + m.cards.length + '</span><span>' + (ex && ex.best != null ? 'Điểm ' + ex.best : pct + '%') + '</span></div></div>' + (passed(m) ? '<span class="done-badge">' + ic('check') + '</span>' : '') + '</a>';
  }

  /* ------------------------------------------------------------ lộ trình */
  function learn() {
    const xs = [50, 72, 80, 70, 50, 30, 20, 30, 50, 72, 50], gap = 132, top = 20;
    const nx = nextMod(), H = top + MODS.length * gap + 170;
    const pts = xs.map((x, i) => [x, top + i * gap + 39]);
    const pathD = arr => arr.map((p, i) => i ? 'C' + arr[i - 1][0] + ' ' + (arr[i - 1][1] + 66) + ',' + p[0] + ' ' + (p[1] - 66) + ',' + p[0] + ' ' + p[1] : 'M' + p[0] + ' ' + p[1]).join(' ');
    const doneN = passedCount() === MODS.length ? MODS.length + 1 : MODS.indexOf(nx) + 1;
    let h = '<div class="panel hud"><span class="chip">' + ic('map') + ' Lộ trình học</span><h1 class="h-display" style="font-size:24px;margin:10px 0 6px">' + esc(C.title) + '</h1><p class="muted" style="margin:0">Hoàn thành từng chặng để mở khóa chứng chỉ. Về đích nhận <b class="gold-text">Bằng công nhận &amp; Vinh danh</b>.</p></div>';
    h += '<div class="path" style="height:' + H + 'px"><svg class="link" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3bf"/><stop offset="1" stop-color="#e08e12"/></linearGradient></defs>' +
      '<path d="' + pathD(pts) + '" stroke="#1a2554" stroke-width="12" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round"/>' +
      '<path d="' + pathD(pts) + '" stroke="#26387a" stroke-width="4" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="1 14"/>' +
      (doneN > 1 ? '<path d="' + pathD(pts.slice(0, doneN)) + '" stroke="url(#pg)" stroke-width="8" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" style="filter:drop-shadow(0 0 6px rgba(255,200,80,.6))"/>' : '') + '</svg>';
    MODS.forEach((m, i) => {
      const cls = passed(m) ? 'done' : m === nx ? 'cur' : '';
      h += '<a class="node ' + cls + '" href="#m/' + m.id + '" style="left:' + xs[i] + '%;top:' + (top + i * gap) + 'px"><div class="nb">' + ic(passed(m) ? 'check' : m.icon) + (passed(m) ? '<span class="star-badge">' + S.exams[m.id].best + '</span>' : '') + '</div><div class="nl"><small>' + m.code + '</small>' + esc(m.title.split(' – ')[0]) + '</div></a>';
    });
    const fi = MODS.length;
    h += '<a class="node trophy-node ' + (allDone() ? 'done' : '') + '" href="' + (allDone() ? '#honor' : '#certs') + '" style="left:' + xs[fi] + '%;top:' + (top + fi * gap - 9) + 'px"><div class="nb" style="' + (allDone() ? '' : 'filter:grayscale(.6) brightness(.8)') + '"><div style="width:62px">' + TROPHY + '</div></div><div class="nl"><small>VỀ ĐÍCH</small>Bằng công nhận &amp; Vinh danh</div></a></div>' + credit();
    return h;
  }

  /* ------------------------------------------------------------ học phần */
  function moduleScreen(m) {
    const ex = S.exams[m.id], ld = lessonsDone(m);
    let h = backRow('#home', m.code);
    h += '<div class="mhero" style="--c1:' + m.c1 + ';--c2:' + m.c2 + '"><div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1">' + tile(m, true) + '<span class="chip">' + modPct(m) + '% hoàn thành</span></div><h1>' + esc(m.title) + '</h1><p>' + esc(m.desc) + '</p></div>';
    h += '<div class="acts">' +
      act('#m/' + m.id + '/lesson/' + Math.min(ld, m.lessons.length - 1), 'book', '#5b8cff', '#8b5cf6', 'Bài giảng', ld + '/' + m.lessons.length + ' bài đã học', ld === m.lessons.length) +
      act('#m/' + m.id + '/cards', 'cards', '#22d3ee', '#3b82f6', 'Flashcard', cardsKnown(m) + '/' + m.cards.length + ' thẻ đã thuộc', cardsKnown(m) === m.cards.length) +
      act('#m/' + m.id + '/exam', 'clock', '#f472b6', '#e11d48', 'Bài thi', ex && ex.best != null ? 'Điểm cao nhất: ' + ex.best + '/100' : m.quiz.length + ' câu · ' + C.examMinutes + ' phút', passed(m)) +
      (passed(m) ? act('#cert/' + m.id, 'award', '#fbbf24', '#f97316', 'Chứng chỉ', 'Xem & tải về', true) : '<div class="act locked">' + '<div class="ai" style="background:linear-gradient(145deg,#475569,#1e293b)">' + ic('lock') + '</div><b>Chứng chỉ</b><small>Đạt ≥ ' + C.passPct + '% để mở khóa</small></div>') +
      '</div>';
    h += '<div class="sec-title">Danh sách bài giảng</div><div class="lesson-list">' + m.lessons.map((l, i) => '<a class="li ' + ((S.lessons[m.id] || []).includes(i) ? 'done' : '') + '" href="#m/' + m.id + '/lesson/' + i + '"><span class="n">' + ((S.lessons[m.id] || []).includes(i) ? ic('check') : i + 1) + '</span><span>' + esc(l.t) + '</span>' + ic('right') + '</a>').join('') + '</div>' + credit();
    return h;
  }
  const act = (href, icon, c1, c2, t, s, done) => '<a class="act" href="' + href + '"><div class="ai" style="background:linear-gradient(145deg,' + c1 + ',' + c2 + ')">' + ic(icon) + '</div><b>' + t + '</b><small>' + s + '</small>' + (done ? '<span class="tag chip green">' + ic('check') + '</span>' : '') + '</a>';

  /* ------------------------------------------------------------ bài giảng */
  function bodyHtml(b) {
    return b.map(x => {
      if (typeof x === 'string') return '<p>' + x + '</p>';
      if (x.h) return '<h4>' + esc(x.h) + '</h4>';
      if (x.ul) return '<ul>' + x.ul.map(li => '<li>' + li + '</li>').join('') + '</ul>';
      if (x.tip) return '<div class="tip"><div class="ti">' + ic('bulb') + '</div><div><b class="tl">Mẹo từ Tân AI</b>' + x.tip + '</div></div>';
      if (x.prompt) return '<div class="prompt"><div class="pl"><span>' + ic('wand') + ' Prompt mẫu</span><button class="copy-btn" data-act="copy" data-sfx="tap">' + ic('copy') + ' Sao chép</button></div><pre>' + esc(x.prompt) + '</pre></div>';
      return '';
    }).join('');
  }
  function lessonScreen(m, i) {
    const l = m.lessons[i]; if (!l) return moduleScreen(m);
    const read = S.lessons[m.id] || [], last = i === m.lessons.length - 1;
    let h = backRow('#m/' + m.id, m.code + ' · Bài ' + (i + 1) + '/' + m.lessons.length);
    h += '<div class="dots">' + m.lessons.map((_, k) => '<i class="' + (k === i ? 'on' : read.includes(k) ? 'ok' : '') + '"></i>').join('') + '</div>';
    h += '<article class="lesson panel"><span class="chip">' + ic('book') + ' Bài giảng</span><h1>' + esc(l.t) + '</h1><div class="body">' + bodyHtml(l.b) + '</div></article>';
    h += '<div class="btn-row" style="margin-top:18px">' + (i > 0 ? link('Bài trước', 'steel', '#m/' + m.id + '/lesson/' + (i - 1), 'left') : '') + btn(last ? 'Hoàn thành học phần' : 'Hoàn thành & tiếp tục', 'shine', 'data-act="lessonDone" data-m="' + m.id + '" data-i="' + i + '"', 'check') + '</div>' + credit();
    return h;
  }

  /* ------------------------------------------------------------ flashcard */
  let FC = null;
  function cardsScreen(m) {
    if (!FC || FC.id !== m.id) FC = { id: m.id, order: m.cards.map((_, i) => i), i: 0, flip: false };
    let h = backRow('#m/' + m.id, 'Flashcard · ' + m.code, btn('', 'sq sm steel', 'data-act="fcShuffle" aria-label="Xáo trộn thẻ"', 'shuffle'));
    h += '<div id="fcw">' + fcInner(m) + '</div>' + credit();
    return h;
  }
  function fcInner(m) {
    const known = S.cards[m.id] || [];
    if (FC.i >= FC.order.length) {
      const k = known.length, all = k === m.cards.length;
      return '<div class="panel hud gold center" style="text-align:center;padding:26px 18px"><div style="width:110px;margin:0 auto">' + TROPHY + '</div><h2 style="font:900 22px/1.2 var(--ui);margin:10px 0 6px">' + (all ? 'Xuất sắc! Bạn đã thuộc hết' : 'Hoàn thành lượt ôn') + '</h2><p class="muted">Đã thuộc <b class="gold-text">' + k + '/' + m.cards.length + '</b> thẻ.</p><div class="btn-row" style="margin-top:16px">' +
        (all ? '' : btn('Ôn thẻ chưa thuộc', 'cyan', 'data-act="fcAgain"', 'refresh')) + btn('Ôn lại tất cả', 'steel', 'data-act="fcAll"', 'cards') + link('Làm bài thi', 'shine', '#m/' + m.id + '/exam', 'clock') + '</div></div>';
    }
    const idx = FC.order[FC.i], c = m.cards[idx], isK = known.includes(idx);
    return '<div class="dots">' + FC.order.map((o, k) => '<i class="' + (k === FC.i ? 'on' : known.includes(o) ? 'ok' : '') + '"></i>').join('') + '</div>' +
      '<div class="fc-stage" style="--c1:' + m.c1 + ';--c2:' + m.c2 + '"><div class="fc' + (FC.flip ? ' flip' : '') + '" id="fc"><div class="face front"><span class="idx">THẺ ' + (FC.i + 1) + '/' + FC.order.length + (isK ? ' · ĐÃ THUỘC' : '') + '</span><div class="term">' + esc(c[0]) + '</div><span class="hint">Chạm để lật · Vuốt để chấm</span></div><div class="face back"><span class="idx" style="color:var(--gold)">' + esc(c[0]) + '</span><div class="def">' + esc(c[1]) + '</div><span class="hint">← Chưa thuộc · Đã thuộc →</span></div></div></div>' +
      '<div class="btn-row">' + btn('Chưa thuộc', 'red', 'data-act="fcNo"', 'x') + btn('Đã thuộc', 'green', 'data-act="fcYes"', 'check') + '</div>' +
      '<div class="btn-row" style="margin-top:4px">' + btn('Thẻ trước', 'sm ghost', 'data-act="fcPrev"' + (FC.i ? '' : ' disabled'), 'left') + btn('Lật thẻ', 'sm ghost', 'data-act="fcFlip"', 'refresh') + '</div>';
  }
  function fcPaint() { const m = modById(FC.id), w = $('#fcw'); if (w) { w.innerHTML = fcInner(m); fcBind(); } }
  function fcBind() {
    const el = $('#fc'); if (!el) return;
    let sx = 0, sy = 0, dx = 0, down = false;
    el.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY; dx = 0; el.style.transition = 'none'; el.setPointerCapture && el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!down) return; dx = e.clientX - sx; if (Math.abs(dx) > 4) el.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 18 + 'deg)' + (FC.flip ? ' rotateY(180deg)' : ''); });
    const up = e => {
      if (!down) return; down = false; el.style.transition = ''; el.style.transform = '';
      const dy = Math.abs((e.clientY || sy) - sy);
      if (dx > 90) fcMark(true); else if (dx < -90) fcMark(false); else if (Math.abs(dx) < 8 && dy < 8) { FC.flip = !FC.flip; el.classList.toggle('flip', FC.flip); Snd.SFX.flip(); }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => { down = false; el.style.transition = ''; el.style.transform = ''; });
  }
  function fcMark(yes) {
    const m = modById(FC.id), idx = FC.order[FC.i];
    const k = new Set(S.cards[m.id] || []); if (yes) k.add(idx); else k.delete(idx);
    S.cards[m.id] = Array.from(k); save();
    yes ? Snd.SFX.correct() : Snd.SFX.whoosh();
    const el = $('#fc'); if (el) { el.style.transform = 'translateX(' + (yes ? 140 : -140) + '%) rotate(' + (yes ? 24 : -24) + 'deg)'; el.style.opacity = '0'; }
    if (k.size === m.cards.length && !S.flags['cards_' + m.id]) { S.flags['cards_' + m.id] = 1; addXP(20); toast('Thuộc hết thẻ ' + m.code + '! +20 XP', 'gold', 'sparkle'); }
    setTimeout(() => { FC.i++; FC.flip = false; fcPaint(); }, 260);
  }

  /* ------------------------------------------------------------ bài thi */
  let EX = null;
  const QT = { single: 'Trắc nghiệm', multi: 'Chọn nhiều đáp án', tf: 'Đúng hay Sai', fill: 'Điền vào chỗ trống', order: 'Sắp xếp thứ tự', match: 'Ghép cặp', case: 'Tình huống' };
  const PAIRC = [['#7dd3fc', '#0ea5e9', '#0369a1'], ['#f9a8d4', '#ec4899', '#9d174d'], ['#fde68a', '#f59e0b', '#92400e'], ['#a7f3d0', '#10b981', '#065f46'], ['#c4b5fd', '#8b5cf6', '#5b21b6']];
  function prepQ(q) {
    const o = Object.assign({}, q, { done: false, ok: null });
    if (['single', 'fill', 'case', 'multi'].includes(q.t)) o.ord = shuffle(q.o.map((_, i) => i));
    if (q.t === 'multi') o.sel = [];
    if (q.t === 'order') { let p; do { p = shuffle(q.o.map((_, i) => i)); } while (p.every((v, i) => v === i)); o.pool = p; o.picked = []; }
    if (q.t === 'match') { o.right = shuffle(q.p.map((_, i) => i)); o.pairs = {}; o.pick = null; }
    return o;
  }
  function examScreen(m) {
    if (EX && EX.id === m.id && EX.active) return examQ();
    if (EX && EX.id === m.id && EX.sum) return examResult(m);
    const ex = S.exams[m.id], types = Array.from(new Set(m.quiz.map(q => q.t)));
    let h = backRow('#m/' + m.id, 'Bài thi · ' + m.code);
    h += '<div class="panel hud exam-intro"><div style="display:flex;gap:14px;align-items:center">' + tile(m, true) + '<div><span class="chip">' + ic('clock') + ' Bài thi chứng chỉ</span><h1 style="font:900 21px/1.25 var(--ui);margin-top:8px">' + esc(m.title) + '</h1></div></div>' +
      '<div class="rules"><div class="rule">' + ic('book') + '<div><b>' + m.quiz.length + ' câu</b>câu hỏi</div></div><div class="rule">' + ic('clock') + '<div><b>' + C.examMinutes + ' phút</b>thời gian</div></div><div class="rule">' + ic('award') + '<div><b>≥ ' + C.passPct + '%</b>để đạt chứng chỉ</div></div><div class="rule">' + ic('star') + '<div><b>' + (ex && ex.best != null ? ex.best : '–') + '</b>điểm cao nhất</div></div></div>' +
      '<div class="qtypes">' + types.map(t => '<span class="chip dim">' + QT[t] + '</span>').join('') + '</div>' +
      '<div class="row" style="border:0;padding:4px 0 14px"><div class="ri">' + ic('music') + '</div><div class="rt"><b>Nhạc nền tập trung</b><small>Phát nhạc nhẹ nhàng trong lúc thi</small></div><button class="switch ' + (S.settings.music ? 'on' : '') + '" data-act="tgl" data-k="music" aria-label="Bật/tắt nhạc"></button></div>' +
      btn('Bắt đầu thi', 'xl block shine', 'data-act="examStart" data-m="' + m.id + '"', 'play') + '</div>';
    if (!lessonsDone(m)) h += '<p class="muted center" style="text-align:center;font-size:13px;margin-top:14px">' + ic('bulb') + ' Gợi ý: học bài giảng và ôn flashcard trước để dễ đạt điểm cao.</p>';
    return h + credit();
  }
  function examStart(m) {
    EX = { id: m.id, active: true, qs: shuffle(m.quiz).map(prepQ), i: 0, end: Date.now() + C.examMinutes * 60000, timer: null, sum: null };
    Snd.Music.play('exam');
    EX.timer = setInterval(examTick, 1000);
    paint({ html: shell(examQ(), false) });
  }
  const fmtT = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  function examTick() {
    if (!EX || !EX.active) return;
    const left = EX.end - Date.now(), t = $('#timer');
    if (t) { t.querySelector('span').textContent = fmtT(left); t.classList.toggle('warn', left < 60000); }
    if (left <= 10500 && left > 0) Snd.SFX.tick();
    if (left <= 0) { toast('Hết giờ làm bài!', '', 'clock'); examFinish(); }
  }
  function examQ() {
    const q = EX.qs[EX.i], m = modById(EX.id);
    let h = '<div class="exam-head">' + btn('', 'sq sm steel', 'data-act="examQuit" aria-label="Thoát bài thi"', 'x') + '<div class="segs">' + EX.qs.map((x, k) => '<i class="' + (x.done ? (x.ok ? 'ok' : 'no') : k === EX.i ? 'cur' : '') + '"></i>').join('') + '</div><div class="timer" id="timer">' + ic('clock') + '<span>' + fmtT(EX.end - Date.now()) + '</span></div></div>';
    h += '<div id="exq">' + qCard(q, m) + '</div>';
    return h;
  }
  function qCard(q, m) {
    const n = EX.qs.length;
    let h = '<div class="panel hud qcard' + (q.done ? '' : ' screen') + '"><div class="qtype"><span class="chip">' + QT[q.t] + '</span><span class="muted" style="font-weight:800;font-size:13px">Câu ' + (EX.i + 1) + '/' + n + '</span></div>';
    if (q.s) h += '<div class="scenario">' + ic('info') + '<div>' + esc(q.s) + '</div></div>';
    if (q.t === 'fill') {
      const chosen = q.done ? q.o[q.choice] : '';
      h += '<p class="qtext">' + esc(q.q).replace('___', '<span class="blank ' + (q.done ? (q.ok ? 'ok' : 'no') : '') + '">' + (chosen ? esc(chosen) : '&nbsp;') + '</span>') + '</p>';
    } else h += '<p class="qtext">' + esc(q.q) + '</p>';
    h += '<div id="qbody">' + qBody(q) + '</div><div id="fb">' + (q.done ? feedback(q) : '') + '</div></div>';
    return h;
  }
  function qBody(q) {
    const L = 'ABCDEFG';
    if (q.t === 'single' || q.t === 'fill' || q.t === 'case') {
      return '<div class="opts">' + q.ord.map((oi, k) => {
        let cls = '';
        if (q.done) cls = oi === q.a ? 'ok' : oi === q.choice ? 'no' : 'fade';
        return '<button class="opt ' + cls + '" data-act="ans" data-oi="' + oi + '"' + (q.done ? ' disabled' : '') + '><span class="k">' + L[k] + '</span><span>' + esc(q.o[oi]) + '</span></button>';
      }).join('') + '</div>';
    }
    if (q.t === 'tf') {
      const c = v => q.done ? (q.a === v ? ' picked-ok' : q.choice === v ? '' : '') : '';
      const dis = q.done ? ' disabled' : '';
      const cls = v => q.done ? (q.a === v ? 'green' : q.choice === v ? 'red' : 'steel') : (v ? 'green' : 'red');
      return '<div class="tf">' + btn('ĐÚNG', cls(true) + c(true), 'data-act="tf" data-v="1"' + dis, 'check') + btn('SAI', cls(false) + c(false), 'data-act="tf" data-v="0"' + dis, 'x') + '</div>';
    }
    if (q.t === 'multi') {
      return '<div class="opts">' + q.ord.map((oi, k) => {
        const sel = q.sel.includes(oi), right = q.a.includes(oi);
        let cls = sel ? 'sel' : '';
        if (q.done) cls = right ? 'ok' : sel ? 'no' : 'fade';
        return '<button class="opt ' + cls + '" data-act="msel" data-oi="' + oi + '"' + (q.done ? ' disabled' : '') + ' data-sfx="tap"><span class="k">' + L[k] + '</span><span>' + esc(q.o[oi]) + '</span><span class="chk">' + (sel || (q.done && right) ? ic('check') : '') + '</span></button>';
      }).join('') + '</div>' + (q.done ? '' : '<div style="margin-top:14px">' + btn('Xác nhận (' + q.sel.length + ' đã chọn)', 'block cyan', 'data-act="mok"' + (q.sel.length ? '' : ' disabled'), 'check') + '</div>');
    }
    if (q.t === 'order') {
      const slots = q.o.map((_, k) => {
        const it = q.picked[k];
        let cls = it != null ? 'filled' : '';
        if (q.done) cls += it === k ? ' ok' : ' no';
        return '<div class="slot ' + cls + '" ' + (it != null && !q.done ? 'data-act="ounpick" data-k="' + k + '" data-sfx="tap"' : '') + '><span class="sn">' + (k + 1) + '</span><span>' + (it != null ? esc(q.o[it]) : 'Chạm vào mục bên dưới để xếp vị trí ' + (k + 1)) + '</span></div>';
      }).join('');
      const pool = q.pool.map(oi => '<button class="opt ' + (q.picked.includes(oi) ? 'used' : '') + '" data-act="opick" data-oi="' + oi + '" data-sfx="tap"' + (q.done ? ' disabled' : '') + '><span class="k">' + ic('plusSq') + '</span><span>' + esc(q.o[oi]) + '</span></button>').join('');
      return '<div class="ord-slots">' + slots + '</div>' + (q.done ? '' : '<div class="pool">' + pool + '</div><div class="btn-row" style="margin-top:14px">' + btn('Làm lại', 'steel sm', 'data-act="oreset"' + (q.picked.length ? '' : ' disabled'), 'refresh') + btn('Xác nhận', 'cyan', 'data-act="ook"' + (q.picked.length === q.o.length ? '' : ' disabled'), 'check') + '</div>');
    }
    if (q.t === 'match') {
      const leftPairIdx = li => Object.keys(q.pairs).map(Number).indexOf(li);
      const pc = i => { const c = PAIRC[i % PAIRC.length]; return 'style="--pc1:' + c[0] + ';--pc2:' + c[1] + ';--pc3:' + c[2] + '"'; };
      const lefts = q.p.map((p, li) => {
        const pi = leftPairIdx(li), paired = pi >= 0;
        let cls = paired ? 'paired' : ''; if (q.pick === li) cls += ' pick';
        if (q.done) cls = q.pairs[li] === li ? 'ok' : 'no';
        return '<button class="opt ' + cls + '" ' + (paired && !q.done ? pc(pi) : '') + ' data-act="mleft" data-i="' + li + '" data-sfx="tap"' + (q.done ? ' disabled' : '') + '><span class="pk">' + (paired ? pi + 1 : '') + '</span><span>' + esc(p[0]) + '</span></button>';
      }).join('');
      const rights = q.right.map(ri => {
        const owner = Object.keys(q.pairs).map(Number).find(l => q.pairs[l] === ri);
        const paired = owner != null, pi = paired ? leftPairIdx(owner) : -1;
        let cls = paired ? 'paired' : '';
        if (q.done) cls = paired && owner === ri ? 'ok' : 'no';
        return '<button class="opt ' + cls + '" ' + (paired && !q.done ? pc(pi) : '') + ' data-act="mright" data-i="' + ri + '" data-sfx="tap"' + (q.done ? ' disabled' : '') + '><span class="pk">' + (paired ? pi + 1 : '') + '</span><span>' + esc(q.p[ri][1]) + '</span></button>';
      }).join('');
      const full = Object.keys(q.pairs).length === q.p.length;
      return '<p class="muted" style="margin:-8px 0 12px;font-size:13px">Chạm một mục bên trái, rồi chạm mục tương ứng bên phải.</p><div class="match"><div class="col">' + lefts + '</div><div class="col">' + rights + '</div></div>' + (q.done ? '' : '<div class="btn-row" style="margin-top:14px">' + btn('Làm lại', 'steel sm', 'data-act="mreset"' + (Object.keys(q.pairs).length ? '' : ' disabled'), 'refresh') + btn('Xác nhận', 'cyan', 'data-act="matchok"' + (full ? '' : ' disabled'), 'check') + '</div>');
    }
    return '';
  }
  function correctText(q) {
    if (q.t === 'tf') return q.a ? 'Đúng' : 'Sai';
    if (q.t === 'multi') return q.a.map(i => q.o[i]).join('; ');
    if (q.t === 'order') return q.o.map((s, i) => (i + 1) + '. ' + s).join(' → ');
    if (q.t === 'match') return q.p.map(p => p[0] + ' ↔ ' + p[1]).join('; ');
    return q.o[q.a];
  }
  function feedback(q) {
    const last = EX.i === EX.qs.length - 1;
    return '<div class="feedback ' + (q.ok ? 'ok' : 'no') + '"><div class="fi">' + ic(q.ok ? 'check' : 'x') + '</div><div><b>' + (q.ok ? 'Chính xác!' : 'Chưa đúng rồi') + '</b><p>' + (q.ok ? '' : 'Đáp án đúng: <b>' + esc(correctText(q)) + '</b><br>') + esc(q.e || '') + '</p></div></div>' +
      '<div style="margin-top:16px">' + btn(last ? 'Xem kết quả' : 'Câu tiếp theo', 'block lg shine', 'data-act="next"', last ? 'award' : 'right') + '</div>';
  }
  function grade(q, ok) {
    q.done = true; q.ok = ok;
    ok ? Snd.SFX.correct() : (Snd.SFX.wrong(), navigator.vibrate && navigator.vibrate(90));
    qRepaint(true);
    setTimeout(() => { const f = $('#fb'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
  }
  function qRepaint(full) {
    const q = EX.qs[EX.i], m = modById(EX.id);
    if (full) {
      const w = $('#exq'); if (w) w.innerHTML = qCard(q, m);
      const segs = $('.segs'); if (segs) segs.innerHTML = EX.qs.map((x, k) => '<i class="' + (x.done ? (x.ok ? 'ok' : 'no') : k === EX.i ? 'cur' : '') + '"></i>').join('');
    } else { const b = $('#qbody'); if (b) b.innerHTML = qBody(q); }
  }
  function examFinish() {
    if (!EX || !EX.active) return;
    clearInterval(EX.timer); EX.active = false; Snd.Music.stop(1.2);
    const m = modById(EX.id), n = EX.qs.length, correct = EX.qs.filter(q => q.ok).length, score = Math.round(correct / n * 100), pass = score >= C.passPct;
    const prev = S.exams[m.id]; let newCert = false;
    if (pass && !(prev && prev.passed)) {
      const d = today();
      S.exams[m.id] = { passed: true, best: score, date: d, id: Cert.certId(S.name, m.code, d), attempts: (prev && prev.attempts || 0) + 1, seen: false };
      newCert = true; addXP(100 + (score - C.passPct));
    } else {
      S.exams[m.id] = Object.assign({ passed: false }, prev || {}, { best: Math.max(prev && prev.best || 0, score), attempts: (prev && prev.attempts || 0) + 1 });
    }
    save();
    EX.sum = { score, correct, n, pass, newCert };
    paint({ html: shell(examResult(m), false), after: resultAfter });
  }
  function examResult(m) {
    const s = EX.sum, stars = s.pass ? (s.score === 100 ? 3 : s.score >= 90 ? 2 : 1) : 0;
    let h = backRow('#m/' + m.id, 'Kết quả · ' + m.code);
    h += '<div class="panel hud ' + (s.pass ? 'gold' : '') + ' result"><span class="chip ' + (s.pass ? 'gold' : 'dim') + '">' + (s.pass ? ic('award') + ' ĐẠT CHỨNG CHỈ' : ic('refresh') + ' CHƯA ĐẠT') + '</span>' +
      '<div class="score-ring">' + ringSvg(s.score, 80, 14, s.pass ? 'rgRg' : 'rgR').replace('url(#' + (s.pass ? 'rgRg' : 'rgR') + ')', 'url(#' + (s.pass ? 'rgRgg' : 'rgR') + ')') + '<div class="sv"><div><b id="scv">0</b><small>/100 điểm</small></div></div></div>' +
      '<div class="stars">' + [1, 2, 3].map(k => STAR(k <= stars).replace('class="on"', 'class="on" style="animation-delay:' + (0.5 + k * 0.25) + 's"')).join('') + '</div>' +
      '<h2 style="font:900 22px/1.25 var(--ui);margin:6px 0">' + (s.pass ? (s.score === 100 ? 'Hoàn hảo! Điểm tuyệt đối!' : 'Chúc mừng ' + esc(firstName()) + '!') : 'Gần lắm rồi, thử lại nhé!') + '</h2>' +
      '<p class="muted" style="margin:0 0 18px">Đúng ' + s.correct + '/' + s.n + ' câu. ' + (s.pass ? (s.newCert ? 'Chứng chỉ học phần đã được cấp cho bạn.' : 'Bạn đã có chứng chỉ học phần này.') : 'Cần đạt từ ' + C.passPct + '% để nhận chứng chỉ.') + '</p>';
    h += s.pass ? '<div class="btn-row">' + link(s.newCert ? 'Nhận chứng chỉ' : 'Xem chứng chỉ', 'xl shine', '#cert/' + m.id, 'award') + '</div><div class="btn-row">' + btn('Thi lại', 'steel', 'data-act="retake" data-m="' + m.id + '"', 'refresh') + link('Về học phần', 'ghost', '#m/' + m.id, 'left') + '</div>'
      : '<div class="btn-row">' + btn('Thi lại ngay', 'xl shine', 'data-act="retake" data-m="' + m.id + '"', 'refresh') + '</div><div class="btn-row">' + link('Ôn bài giảng', 'steel', '#m/' + m.id + '/lesson/0', 'book') + link('Ôn flashcard', 'cyan', '#m/' + m.id + '/cards', 'cards') + '</div>';
    h += '</div><details class="panel" style="margin-top:16px"><summary>Xem lại đáp án ' + ic('right') + '</summary><div class="review">' + EX.qs.map((q, i) => '<div class="rv ' + (q.ok ? 'ok' : 'no') + '">' + ic(q.ok ? 'check' : 'x') + '<div><b>Câu ' + (i + 1) + '.</b> ' + esc(q.q.replace('___', '…')) + '<small>Đáp án: ' + esc(correctText(q)) + '</small></div></div>').join('') + '</div></details>' + credit();
    return h;
  }
  function resultAfter() {
    const s = EX.sum, el = $('#scv'); let v = 0;
    const step = () => { v = Math.min(s.score, v + Math.max(1, Math.round(s.score / 40))); if (el) el.textContent = v; if (v < s.score) requestAnimationFrame(step); };
    setTimeout(step, 250);
    if (s.pass) { setTimeout(() => { Snd.SFX.success(); FX.confetti(170); }, 300); } else setTimeout(() => Snd.SFX.wrong(), 300);
  }

  /* ------------------------------------------------------------ chứng chỉ */
  const certCache = {};
  function ensureFinal() {
    if (!S.final) { const d = today(); S.final = { date: d, id: Cert.certId(S.name, 'FINAL', d), seen: false }; save(); }
  }
  function certData(id) {
    if (id === 'final') { ensureFinal(); return { final: true, name: S.name, program: C.title, count: MODS.length, score: avgScore(), date: S.final.date, id: S.final.id }; }
    const m = modById(id), ex = S.exams[id];
    return { name: S.name, title: m.title, code: m.code, program: C.title, score: ex.best, date: ex.date, id: ex.id };
  }
  function certScreen(id) {
    const fin = id === 'final', m = fin ? null : modById(id);
    if (fin ? !allDone() : !(m && passed(m))) return backRow('#certs', 'Chứng chỉ') + '<div class="panel center" style="text-align:center;padding:30px">' + ic('lock') + '<p>Bạn chưa mở khóa chứng chỉ này.</p>' + link('Về trang chủ', 'steel', '#home', 'home') + '</div>';
    let h = backRow(fin ? '#honor' : '#m/' + id, fin ? 'Bằng công nhận' : 'Chứng chỉ · ' + m.code);
    h += '<div class="cert-title"><span class="chip gold">' + ic('award') + (fin ? ' Hoàn thành toàn khóa' : ' Đạt ' + S.exams[id].best + '/100') + '</span><h1 class="gold-text" style="margin-top:10px">' + (fin ? 'Bằng Công Nhận' : 'Chúc mừng bạn!') + '</h1><p>' + (fin ? esc(C.title) : esc(m.title)) + '</p></div>';
    h += '<div class="cert-frame" id="cf"><div class="loading">Đang in chứng chỉ…</div><div class="glare"></div></div>';
    h += '<div class="btn-row" style="margin-top:22px">' + btn('Tải về máy', 'shine', 'data-act="certDl" data-id="' + id + '"', 'download') + btn('Chia sẻ', 'cyan', 'data-act="certShare" data-id="' + id + '"', 'share') + '</div>';
    h += '<div class="btn-row">' + btn('Phóng to', 'steel', 'data-act="certView"', 'expand') + (fin ? link('Lễ vinh danh', 'violet', '#honor', 'trophy') : allDone() ? link('Lễ vinh danh', 'violet shine', '#honor', 'trophy') : (nextMod() ? link('Học phần tiếp', 'violet', '#m/' + nextMod().id, 'right') : '')) + '</div>';
    h += '<p class="save-tip">' + (ENV.ios ? 'Trên iPhone: bấm “Tải về máy” rồi chọn <b>Lưu hình ảnh</b>, hoặc nhấn giữ ảnh chứng chỉ để lưu.' : 'Chứng chỉ được tải về dạng ảnh JPG độ nét cao (2400×1697).') + '</p>';
    if (!fin && allDone()) h += '<div class="final-card" style="margin-top:18px"><div class="trophy">' + TROPHY + '</div><h3>Bạn đã hoàn thành toàn bộ 10 học phần!</h3><p>Lễ vinh danh và Bằng công nhận đang chờ bạn.</p>' + link('Đến lễ Vinh danh', 'shine', '#honor', 'trophy') + '</div>';
    return h + credit();
  }
  async function getCert(id) {
    const d = certData(id), key = JSON.stringify(d);
    if (certCache[id] && certCache[id].key === key) return certCache[id];
    const cv = document.createElement('canvas');
    await Cert.draw(cv, d, 1.2);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
    const url = URL.createObjectURL(blob);
    if (certCache[id]) URL.revokeObjectURL(certCache[id].url);
    return (certCache[id] = { key, blob, url, d });
  }
  async function certAfter(id) {
    const fin = id === 'final';
    if (fin ? !allDone() : !passed(modById(id))) return;
    const c = await getCert(id), frame = $('#cf'); if (!frame) return;
    const img = new Image(); img.alt = fin ? 'Bằng công nhận' : 'Chứng chỉ'; img.src = c.url;
    img.onload = () => { const l = frame.querySelector('.loading'); if (l) l.replaceWith(img); };
    const rec = fin ? S.final : S.exams[id];
    if (!rec.seen) { rec.seen = true; save(); setTimeout(() => { Snd.SFX.fanfare(); FX.confetti(200); setTimeout(() => Snd.SFX.sparkle(), 900); }, 250); }
    frame.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = frame.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; frame.style.transform = 'perspective(900px) rotateY(' + x * 10 + 'deg) rotateX(' + -y * 10 + 'deg)'; });
    frame.addEventListener('pointerleave', () => { frame.style.transform = ''; });
  }
  function certFile(c, id) {
    const name = id === 'final' ? 'BangCongNhan-DrabuffAI-' + slug(S.name) + '.jpg' : 'ChungChi-' + c.d.code + '-' + slug(S.name) + '.jpg';
    try { return new File([c.blob], name, { type: 'image/jpeg' }); } catch (e) { return null; }
  }
  async function certDownload(id) {
    const c = await getCert(id), f = certFile(c, id);
    if (ENV.ios && f && navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], title: f.name }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (ENV.ios) { viewer(c.url); return; }
    const a = document.createElement('a'); a.href = c.url; a.download = f ? f.name : 'ChungChi-DrabuffAI.jpg'; document.body.appendChild(a); a.click(); a.remove();
    toast('Đã tải chứng chỉ về máy', 'gold', 'download');
  }
  async function certShare(id) {
    const c = await getCert(id), f = certFile(c, id), fin = id === 'final';
    const text = fin ? 'Tôi vừa hoàn thành toàn bộ ' + C.title + ' và nhận Bằng công nhận tại Drabuff AI Academy – phát triển bởi Tân AI!' : 'Tôi vừa nhận chứng chỉ “' + c.d.title + '” tại Drabuff AI Academy – phát triển bởi Tân AI!';
    const url = location.origin + location.pathname;
    try {
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Drabuff AI Academy', text: text + ' ' + url }); return; }
      if (navigator.share) { await navigator.share({ title: 'Drabuff AI Academy', text, url }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const ok = await copyText(text + ' ' + url); toast(ok ? 'Đã sao chép lời chia sẻ – dán vào Facebook/Zalo nhé!' : 'Không thể chia sẻ trên thiết bị này', '', ok ? 'copy' : 'info');
  }
  function viewer(src) {
    const v = document.createElement('div'); v.className = 'viewer';
    v.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#fff;font-weight:700"><span>Nhấn giữ ảnh để lưu</span>' + btn('', 'sq sm steel', 'data-close aria-label="Đóng"', 'x') + '</div><div class="vi"><img src="' + src + '" alt="Chứng chỉ"></div>';
    v.addEventListener('click', e => { if (e.target.closest('[data-close]')) { v.remove(); } });
    document.body.appendChild(v);
  }

  /* ------------------------------------------------------------ kho chứng chỉ */
  const thumbs = {};
  function certsScreen() {
    let h = '<div class="panel hud gold"><span class="chip gold">' + ic('award') + ' Bộ sưu tập</span><h1 class="h-display" style="font-size:24px;margin:10px 0 4px">Chứng chỉ của ' + esc(firstName()) + '</h1><p class="muted" style="margin:0">' + passedCount() + '/' + MODS.length + ' chứng chỉ học phần' + (allDone() ? ' · Đã nhận Bằng công nhận' : '') + '</p></div>';
    h += '<div class="cgrid" style="margin-top:16px">';
    h += '<a class="ccard final ' + (allDone() ? 'earned' : '') + '" href="' + (allDone() ? '#cert/final' : '#learn') + '"><div class="th" data-th="final">' + (allDone() ? '' : '<div class="lk">' + ic('trophy') + '<span>Bằng công nhận cuối khóa<br>Hoàn thành 10 học phần để mở khóa</span></div>') + '</div><b>Bằng công nhận hoàn thành khóa học</b><small>' + (allDone() ? 'Cấp ngày ' + S.final.date : passedCount() + '/' + MODS.length + ' học phần') + '</small></a>';
    MODS.forEach(m => {
      const e = passed(m);
      h += '<a class="ccard ' + (e ? 'earned' : '') + '" href="' + (e ? '#cert/' + m.id : '#m/' + m.id) + '"><div class="th" data-th="' + (e ? m.id : '') + '">' + (e ? '' : '<div class="lk">' + ic('lock') + '<span>Đạt ≥ ' + C.passPct + '% để mở</span></div>') + '</div><b>' + esc(m.title) + '</b><small>' + m.code + (e ? ' · ' + S.exams[m.id].best + ' điểm' : '') + '</small></a>';
    });
    return h + '</div>' + credit();
  }
  async function certsAfter() {
    if (allDone()) ensureFinal();
    for (const el of $$('[data-th]')) {
      const id = el.dataset.th; if (!id) continue;
      const d = certData(id), key = JSON.stringify(d);
      if (!thumbs[id] || thumbs[id].key !== key) {
        const cv = document.createElement('canvas'); await Cert.draw(cv, d, 0.32);
        thumbs[id] = { key, url: cv.toDataURL('image/jpeg', 0.85) };
      }
      if (!document.body.contains(el)) return;
      el.innerHTML = '<img alt="" src="' + thumbs[id].url + '">';
    }
  }

  /* ------------------------------------------------------------ hồ sơ */
  function profile() {
    const lv = level();
    let h = '<div class="panel hud" style="text-align:center"><div class="avatar lg" style="margin:4px auto 12px">' + esc(initial()) + '</div><h1 style="font:900 22px/1.2 var(--ui)">' + esc(S.name) + '</h1><div style="margin:8px 0 4px"><span class="chip gold">' + ic('star') + ' Cấp ' + lv.n + ' · ' + lv.title + '</span></div>' +
      '<div class="stats"><div class="stat"><b class="gold-text">' + S.xp + '</b><span>XP</span></div><div class="stat"><b class="gold-text">' + passedCount() + '</b><span>Chứng chỉ</span></div><div class="stat"><b class="gold-text">' + (avgScore() || '–') + '</b><span>Điểm TB</span></div></div>' +
      '<div style="margin-top:14px">' + btn('Sửa họ tên', 'sm steel', 'data-act="editName"', 'edit') + '</div></div>';
    h += '<div class="sec-title">Âm thanh</div><div class="panel">' +
      '<div class="row"><div class="ri">' + ic('music') + '</div><div class="rt"><b>Nhạc nền</b><small>Nhạc khi thi và lễ vinh danh</small></div><button class="switch ' + (S.settings.music ? 'on' : '') + '" data-act="tgl" data-k="music" aria-label="Nhạc nền"></button></div>' +
      '<div class="row"><div class="ri">' + ic('volume') + '</div><div class="rt"><b>Hiệu ứng âm thanh</b><small>Tiếng bấm nút, đúng/sai, fanfare</small></div><button class="switch ' + (S.settings.sfx ? 'on' : '') + '" data-act="tgl" data-k="sfx" aria-label="Hiệu ứng âm thanh"></button></div></div>';
    if (!standalone()) h += '<div class="sec-title">Ứng dụng</div><div class="panel"><div class="row"><div class="ri">' + ic('download') + '</div><div class="rt"><b>Cài app lên điện thoại</b><small>Mở toàn màn hình, học offline</small></div>' + btn('Cài đặt', 'sm', 'data-act="install"') + '</div></div>';
    h += '<div class="sec-title">Giới thiệu</div><div class="panel"><div class="row"><div class="ri">' + ic('info') + '</div><div class="rt"><b>Drabuff AI Academy</b><small>Phiên bản 1.0 · Phát triển bởi <b style="color:var(--gold)">Tân AI</b></small></div></div>' +
      '<div class="row"><div class="ri">' + ic('award') + '</div><div class="rt"><b>Đơn vị cấp chứng chỉ</b><small>Chuyên gia AI Nguyễn Văn Tân</small></div></div>' +
      '<div class="row"><div class="ri">' + ic('wifi') + '</div><div class="rt"><b>Dữ liệu &amp; quyền riêng tư</b><small>Tiến độ và họ tên chỉ lưu trên thiết bị này</small></div></div></div>';
    h += '<div style="margin-top:22px">' + btn('Xóa toàn bộ tiến độ', 'red block', 'data-act="reset"', 'trash') + '</div>' + credit();
    return h;
  }

  /* ------------------------------------------------------------ vinh danh */
  function honor() {
    ensureFinal();
    return '<div class="honor"><div class="rays"></div><div class="in"><div class="trophy-big">' + TROPHY + '</div><div class="kicker">★ VINH DANH ★</div><h1 class="gold-text">Xin chúc mừng!</h1><div class="hname">' + esc(S.name) + '</div>' +
      '<p class="sub">Bạn đã hoàn thành xuất sắc toàn bộ <b>' + MODS.length + ' học phần</b> của ' + esc(C.title) + ' tại Drabuff AI Academy.</p>' +
      '<div class="hstats"><div><b>' + MODS.length + '/' + MODS.length + '</b><span>Chứng chỉ</span></div><div><b>' + avgScore() + '</b><span>Điểm trung bình</span></div><div><b>' + S.xp + '</b><span>Tổng XP</span></div></div>' +
      '<div class="btns">' + link('Nhận Bằng công nhận', 'xl block shine', '#cert/final', 'award') + btn('Chia sẻ thành tích', 'cyan block', 'data-act="certShare" data-id="final"', 'share') + link('Về trang chủ', 'steel block', '#home', 'home') + '</div>' +
      '<div class="credit">Bằng công nhận cấp bởi Chuyên gia AI Nguyễn Văn Tân (Tân AI)</div></div></div>';
  }
  function honorAfter() {
    Snd.Music.play('honor'); FX.start();
    setTimeout(() => { Snd.SFX.fanfare(); FX.confetti(220); }, 500);
  }

  /* ------------------------------------------------------------ router */
  function paint(v) {
    root.innerHTML = v.html;
    animateRings();
    if (v.after) v.after();
  }
  const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  function route() {
    const p = parse(), h = p.join('/');
    if (EX && EX.active && h !== 'm/' + EX.id + '/exam') {
      history.pushState(null, '', '#m/' + EX.id + '/exam');
      confirmBox('Thoát bài thi?', 'Bài làm hiện tại sẽ không được lưu. Bạn có chắc muốn thoát?', 'Thoát', 'red').then(ok => { if (ok) { examAbort(); location.hash = h; } });
      return;
    }
    if (EX && !EX.active && h !== 'm/' + EX.id + '/exam') EX = null;
    const keepHonor = p[0] === 'honor' || (p[0] === 'cert' && p[1] === 'final');
    if (p[0] !== 'honor') FX.stop();
    if (!keepHonor && !(EX && EX.active)) Snd.Music.stop();
    $$('.modal-bg,.viewer').forEach(e => e.remove());
    window.scrollTo(0, 0);

    if (!p.length) {
      if (!standalone()) { document.title = 'Drabuff AI Academy – Học AI & Marketing, nhận chứng chỉ'; return paint({ html: landing(), after: landingAfter }); }
      p.push('home');
    }
    if (!S.name || p[0] === 'welcome') return paint({ html: welcome(), after: welcomeAfter });
    document.title = 'Drabuff AI Academy';
    const m = p[0] === 'm' ? modById(p[1]) : null;
    switch (p[0]) {
      case 'home': return paint({ html: shell(home(), 'home') });
      case 'learn': return paint({ html: shell(learn(), 'learn') });
      case 'certs': return paint({ html: shell(certsScreen(), 'certs'), after: certsAfter });
      case 'profile': return paint({ html: shell(profile(), 'profile') });
      case 'honor':
        if (!allDone()) { toast('Hoàn thành 10 học phần để mở lễ vinh danh', '', 'lock'); return go('#learn'); }
        return paint({ html: honor(), after: honorAfter });
      case 'cert': return paint({ html: shell(certScreen(p[1]), p[1] === 'final' ? false : 'certs'), after: () => certAfter(p[1]) });
      case 'm':
        if (!m) return go('#home');
        if (p[2] === 'lesson') return paint({ html: shell(lessonScreen(m, Math.max(0, Math.min(m.lessons.length - 1, +p[3] || 0))), 'learn') });
        if (p[2] === 'cards') return paint({ html: shell(cardsScreen(m), 'learn'), after: fcBind });
        if (p[2] === 'exam') return paint({ html: shell(examScreen(m), false), after: () => { if (EX && EX.sum && !EX.active && EX.id === m.id) resultAfter(); } });
        return paint({ html: shell(moduleScreen(m), 'learn') });
      default: return go('#home');
    }
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function examAbort() { if (EX) { clearInterval(EX.timer); EX = null; } Snd.Music.stop(0.5); }
  addEventListener('hashchange', route);

  /* ------------------------------------------------------------ hành động */
  const ACT = {
    install: () => doInstall(),
    itab(el) { INST_TAB = el.dataset.t; $$('[data-act="itab"]').forEach(b => { b.classList.toggle('cyan', b === el); b.classList.toggle('steel', b !== el); }); refreshInstall(); drawQR(); },
    async copyLink() { const ok = await copyText(location.origin + location.pathname); toast(ok ? 'Đã sao chép liên kết – dán vào Safari/Chrome để mở' : 'Không sao chép được, hãy sao chép thủ công', '', ok ? 'copy' : 'info'); },
    async copy(el) { const t = el.closest('.prompt').querySelector('pre').textContent; const ok = await copyText(t); toast(ok ? 'Đã sao chép prompt' : 'Không sao chép được', '', ok ? 'copy' : 'info'); },
    mute(el) {
      const on = !(S.settings.music || S.settings.sfx);
      S.settings.music = S.settings.sfx = on; save(); Snd.set('sfx', on); Snd.set('music', on);
      el.innerHTML = ic(on ? 'volume' : 'mute'); toast(on ? 'Đã bật âm thanh' : 'Đã tắt âm thanh', '', on ? 'volume' : 'mute');
      $$('.switch[data-k]').forEach(s => s.classList.toggle('on', on));
    },
    tgl(el) { const k = el.dataset.k; S.settings[k] = !S.settings[k]; save(); Snd.set(k, S.settings[k]); el.classList.toggle('on', S.settings[k]); const mb = $('[data-act="mute"]'); if (mb) mb.innerHTML = ic(S.settings.music || S.settings.sfx ? 'volume' : 'mute'); },
    welcomeGo() {
      const v = titleCase($('#nm').value);
      if (v.length < 2) { toast('Vui lòng nhập họ và tên của bạn', '', 'info'); $('#nm').focus(); return; }
      if (!$('#cf').checked) { toast('Hãy xác nhận họ tên chính xác để in lên chứng chỉ', '', 'info'); return; }
      S.name = v; save(); Snd.SFX.success();
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
      const p = parse(); go(p.length && p[0] !== 'welcome' ? '#' + p.join('/') : '#home');
      setTimeout(() => toast('Chào mừng ' + esc(firstName()) + ' đến Drabuff AI Academy!', 'gold', 'sparkle'), 400);
    },
    lessonDone(el) {
      const m = modById(el.dataset.m), i = +el.dataset.i, arr = S.lessons[m.id] || (S.lessons[m.id] = []);
      if (!arr.includes(i)) { arr.push(i); addXP(10); toast('+10 XP · Đã học xong bài ' + (i + 1), 'gold', 'sparkle'); }
      save(); Snd.SFX.correct();
      if (i < m.lessons.length - 1) go('#m/' + m.id + '/lesson/' + (i + 1));
      else { toast('Hoàn thành bài giảng! Ôn flashcard rồi thi nhé', 'gold', 'check'); go('#m/' + m.id + '/cards'); }
    },
    fcFlip() { const el = $('#fc'); if (!el) return; FC.flip = !FC.flip; el.classList.toggle('flip', FC.flip); Snd.SFX.flip(); },
    fcYes: () => fcMark(true), fcNo: () => fcMark(false),
    fcPrev() { if (FC.i > 0) { FC.i--; FC.flip = false; fcPaint(); } },
    fcShuffle() { FC.order = shuffle(FC.order); FC.i = 0; FC.flip = false; fcPaint(); Snd.SFX.whoosh(); toast('Đã xáo trộn thẻ', '', 'shuffle'); },
    fcAgain() { const m = modById(FC.id), k = S.cards[m.id] || []; FC.order = m.cards.map((_, i) => i).filter(i => !k.includes(i)); FC.i = 0; FC.flip = false; fcPaint(); },
    fcAll() { const m = modById(FC.id); FC.order = m.cards.map((_, i) => i); FC.i = 0; FC.flip = false; fcPaint(); },
    examStart(el) { examStart(modById(el.dataset.m)); },
    async examQuit() { if (await confirmBox('Thoát bài thi?', 'Bài làm hiện tại sẽ không được lưu.', 'Thoát', 'red')) { const id = EX.id; examAbort(); go('#m/' + id); } },
    retake(el) { EX = null; examStart(modById(el.dataset.m)); },
    ans(el) { const q = EX.qs[EX.i]; if (q.done) return; q.choice = +el.dataset.oi; grade(q, q.choice === q.a); },
    tf(el) { const q = EX.qs[EX.i]; if (q.done) return; q.choice = el.dataset.v === '1'; grade(q, q.choice === q.a); },
    msel(el) { const q = EX.qs[EX.i]; if (q.done) return; const oi = +el.dataset.oi; q.sel = q.sel.includes(oi) ? q.sel.filter(x => x !== oi) : q.sel.concat(oi); qRepaint(); },
    mok() { const q = EX.qs[EX.i]; const a = q.a.slice().sort().join(), s = q.sel.slice().sort().join(); grade(q, a === s); },
    opick(el) { const q = EX.qs[EX.i]; const oi = +el.dataset.oi; if (!q.picked.includes(oi)) q.picked.push(oi); qRepaint(); },
    ounpick(el) { const q = EX.qs[EX.i]; q.picked.splice(+el.dataset.k, 1); qRepaint(); },
    oreset() { EX.qs[EX.i].picked = []; qRepaint(); },
    ook() { const q = EX.qs[EX.i]; grade(q, q.picked.every((v, i) => v === i)); },
    mleft(el) { const q = EX.qs[EX.i], li = +el.dataset.i; if (q.pairs[li] != null) { delete q.pairs[li]; q.pick = null; } else q.pick = q.pick === li ? null : li; qRepaint(); },
    mright(el) {
      const q = EX.qs[EX.i], ri = +el.dataset.i;
      const owner = Object.keys(q.pairs).find(l => q.pairs[l] === ri);
      if (q.pick == null) { if (owner != null) { delete q.pairs[owner]; qRepaint(); } else toast('Chọn một mục bên trái trước', '', 'info'); return; }
      if (owner != null) delete q.pairs[owner];
      q.pairs[q.pick] = ri; q.pick = null; qRepaint();
    },
    mreset() { const q = EX.qs[EX.i]; q.pairs = {}; q.pick = null; qRepaint(); },
    matchok() { const q = EX.qs[EX.i]; grade(q, q.p.every((_, i) => q.pairs[i] === i)); },
    next() { if (EX.i < EX.qs.length - 1) { EX.i++; Snd.SFX.whoosh(); qRepaint(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } else examFinish(); },
    certDl(el) { certDownload(el.dataset.id); },
    certShare(el) { certShare(el.dataset.id); },
    certView() { const img = $('#cf img'); if (img) viewer(img.src); },
    async editName() {
      const v = await modal('Sửa họ tên', '<p>Họ tên mới sẽ được in trên tất cả chứng chỉ và bằng công nhận.</p><input id="en" class="input3d" maxlength="40" value="' + esc(S.name) + '" style="margin-bottom:18px">', [{ label: 'Hủy', cls: 'steel', value: null }, { label: 'Lưu', cls: '', value: 'ok' }]);
      if (v !== 'ok') return;
      const n = titleCase(modal.input || '');
      if (n.length < 2) return toast('Họ tên chưa hợp lệ', '', 'info');
      S.name = n; save(); toast('Đã cập nhật họ tên', 'gold', 'check'); route();
    },
    async reset() {
      if (!(await confirmBox('Xóa toàn bộ tiến độ?', 'Tất cả bài học, điểm thi và chứng chỉ trên thiết bị này sẽ bị xóa vĩnh viễn. Hãy tải chứng chỉ về máy trước khi xóa.', 'Xóa hết', 'red'))) return;
      const st = S.settings; S = fresh(); S.settings = st; save(); FC = null; EX = null; go('#welcome');
    }
  };
  document.addEventListener('click', e => {
    Snd.init();
    const s = e.target.closest('.b3d,.opt,.act,.mcard,.node,.nav a,.icon-btn,.li,.ccard,.switch,.copy-btn,summary,[data-sfx]');
    if (s && !s.disabled && s.dataset.sfx !== 'none') (s.dataset.sfx === 'tap' ? Snd.SFX.tap : Snd.SFX.click)();
    const a = e.target.closest('[data-act]');
    if (a && !a.disabled) { const fn = ACT[a.dataset.act]; if (fn) { e.preventDefault(); fn(a, e); } }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'nm') ACT.welcomeGo(); });

  /* ------------------------------------------------------------ service worker */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const w = reg.installing; if (!w) return;
          w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Đã có phiên bản mới – mở lại app để cập nhật', 'gold', 'refresh'); });
        });
      }).catch(() => {});
    });
  }

  window.TanAI = { state: () => S, exam: () => EX, FX, route };
  route();
})();
