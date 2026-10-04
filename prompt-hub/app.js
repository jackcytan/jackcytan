/* Drabuff Prompt Hub – Kho prompt & Từ điển AI A–Z. Phát triển bởi Tân AI. */
(function () {
  'use strict';
  const Snd = window.Sound;
  const root = document.getElementById('root');
  const $ = (s, e) => (e || document).querySelector(s);
  const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normChar = ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const rand = Math.random;

  /* ------------------------------------------------------------ môi trường */
  const UA = navigator.userAgent || '';
  const ENV = {
    ios: /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    android: /Android/i.test(UA),
    inApp: /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Zalo|Line\/|musical_ly|Bytedance|TikTok|Messenger/i.test(UA),
    iosOther: /CriOS|FxiOS|EdgiOS|OPiOS/i.test(UA)
  };
  ENV.inAppName = /Zalo/i.test(UA) ? 'Zalo' : /Instagram/i.test(UA) ? 'Instagram' : /Messenger/i.test(UA) ? 'Messenger' : /FBAN|FBAV|FB_IAB|FBIOS/i.test(UA) ? 'Facebook' : /musical_ly|Bytedance|TikTok/i.test(UA) ? 'TikTok' : 'ứng dụng này';
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  /* ------------------------------------------------------------ trạng thái */
  const KEY = 'drabuff.prompthub.v1';
  const fresh = () => ({ v: 1, user: null, pending: false, favs: [], recent: [], vars: {}, settings: { sfx: true } });
  let S = load();
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(fresh(), s); } catch (e) {} return fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  Snd.set('music', false); Snd.set('sfx', S.settings.sfx);

  /* ------------------------------------------------------------ dữ liệu */
  const PALETTE = [['#5b8cff', '#8b5cf6'], ['#22d3ee', '#3b82f6'], ['#f472b6', '#e11d48'], ['#fbbf24', '#f97316'], ['#34d399', '#059669'], ['#60a5fa', '#6366f1'], ['#a78bfa', '#7c3aed'], ['#2dd4bf', '#0891b2'], ['#f87171', '#b91c1c'], ['#facc15', '#ca8a04'], ['#fb923c', '#c2410c'], ['#4ade80', '#15803d']];
  const GROUPS = window.PH_GROUPS, CATS = [], CMAP = {}, PROMPTS = [], PMAP = {};
  const KIND = { ind: 'Ngành nghề', dept: 'Phòng ban', need: 'Nhu cầu công việc' };
  function addCat(c) { c.col = PALETTE[CATS.length % PALETTE.length]; c.prompts = []; CATS.push(c); CMAP[c.id] = c; return c; }
  function addPrompt(c, id, t, text, f) { const p = { id, t, text, f: f || '', cat: c }; p.idx = norm(t + ' ' + c.name + ' ' + (f || '') + ' ' + text); c.prompts.push(p); PROMPTS.push(p); PMAP[id] = p; }
  window.PH_IND.forEach(ind => {
    const c = addCat({ id: 'i-' + ind.id, name: ind.n, kind: 'ind', ic: ind.ic, group: ind.g, ind });
    window.PH_TASKS.forEach(t => addPrompt(c, c.id + '.' + t.id, t.t, t.p.replace(/\{(\w)\}/g, (m, k) => ind[k] || m), t.f));
  });
  window.PH_LIB.forEach(l => {
    const c = addCat({ id: (l.g === 'dept' ? 'd-' : 'n-') + l.id, name: l.n, kind: l.g, ic: l.ic });
    l.items.forEach((it, i) => addPrompt(c, c.id + '.' + i, it[0], it[1]));
  });
  const GLOSS = window.PH_GLOSSARY.map((g, i) => ({ id: i, term: g[0], full: g[1], def: g[2], cat: g[3], ex: g[4] || '', letter: normChar(g[0][0]).toUpperCase(), idx: norm(g.join(' ')) }))
    .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
  const STATS = { prompts: PROMPTS.length, ind: CATS.filter(c => c.kind === 'ind').length, dept: CATS.filter(c => c.kind === 'dept').length, need: CATS.filter(c => c.kind === 'need').length, terms: GLOSS.length };

  /* ------------------------------------------------------------ icon */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    dict: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    dotsV: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    plusSq: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6"/><path d="M17 21V3c-2 0-3 2-3 6v4h3"/>',
    coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>',
    cup: '<path d="M6 7h12l-1.5 13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1z"/><path d="M5 7h14M12 7l2-5"/>',
    cake: '<path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 15c2 1.5 4 1.5 5.3 0 1.4 1.5 4 1.5 5.4 0 1.3 1.5 3.3 1.5 5.3 0"/><path d="M12 11V7"/>',
    leaf: '<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16z"/><path d="M5 21 13 12"/>',
    bike: '<circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l4-8h5l3 8M10 9 8 5H6"/>',
    shirt: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
    baby: '<circle cx="12" cy="11" r="7"/><path d="M9.5 10h.01M14.5 10h.01M10 14c1.2 1 2.8 1 4 0M12 4c0 1.5 1 2 2 2"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    laptop: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
    sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0 0 4h14"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6.5"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 18 3-18"/>',
    paw: '<circle cx="5.5" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 12c-3 0-6 4-6 6.5 0 1.5 1.2 2.5 2.7 2.5 1.3 0 2.1-.7 3.3-.7s2 .7 3.3.7c1.5 0 2.7-1 2.7-2.5C18 16 15 12 12 12z"/>',
    flower: '<circle cx="12" cy="9" r="2.5"/><path d="M12 6.5C12 4 13.5 2.5 15 3s1 3-1 4.5M14.5 9c2.5 0 4 1.5 3.5 3s-3 1-4.5-1M12 11.5c0 2.5-1.5 4-3 3.5s-1-3 1-4.5M9.5 9C7 9 5.5 7.5 6 6s3-1 4.5 1"/><path d="M12 14v8"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6"/>',
    tooth: '<path d="M12 5.5C10.5 4 8.5 3 6.5 3.5 4 4 3 6.5 3.5 9c.4 2 1.3 3.2 1.8 5 .5 2 .7 4.5 1.7 6.5.7 1.4 2.2 1.2 2.5-.4l.8-4c.2-1 .9-1.6 1.7-1.6s1.5.6 1.7 1.6l.8 4c.3 1.6 1.8 1.8 2.5.4 1-2 1.2-4.5 1.7-6.5.5-1.8 1.4-3 1.8-5 .5-2.5-.5-5-3-5.5-2-.5-4 .5-5.5 2z"/>',
    medical: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    pill: '<path d="M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7z"/><path d="m8.5 8.5 7 7"/>',
    apple: '<path d="M12 7c-2-1.5-6-1.5-7 2.5-1 3.5 1 9 4 10.5 1.2.6 2 0 3 0s1.8.6 3 0c3-1.5 5-7 4-10.5C18 5.5 14 5.5 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    heart: '<path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    school: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/>',
    grad: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6"/>',
    pencil: '<path d="M16 3l5 5L8 21H3v-5z"/><path d="m13 6 5 5"/>',
    plane: '<path d="M10 14 3 11l1-2 8 1 4-5c1-1.2 3-1.5 3.5-1s.2 2.5-1 3.5l-5 4 1 8-2 1-3-7z"/>',
    building: '<rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h5a1 1 0 0 1 1 1v11H14M7 7h4M7 11h4M7 15h4M2 21h20"/>',
    helmet: '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M2 17h20v2H2zM10 9V5h4v4"/>',
    ruler: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7v4M10 7v3M14 7v4M18 7v3"/>',
    brick: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M3 15h18M9 5v5M15 10v5M9 15v4"/>',
    bank: '<path d="M3 10 12 4l9 6z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v3H8zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-.7-9.95A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17.5 9a4 4 0 0 1 0 6"/><path d="M20 6.5a8 8 0 0 1 0 11"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-.6-.3-1-.6-1.4-.4-.4-.6-.9-.6-1.4 0-1 .8-1.7 1.8-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    gamepad: '<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6l-.7-.8a2 2 0 0 0-1.5-.8h-1.6a2 2 0 0 0-1.5.8l-.7.8A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
    bed: '<path d="M3 18V6M3 13h18v5M21 13a4 4 0 0 0-4-4h-6v4"/><circle cx="7" cy="10" r="2"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    party: '<path d="M4 20 9 7l8 8z"/><path d="M14 4v1M19 9h1M17 6l1.5-1.5M12 8c1-2 3-2 3-4M16 12c2-1 2-3 4-3"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3M16 18v3"/>',
    factory: '<path d="M2 21V10l6 4V10l6 4V6h3l1-3h2l1 3v15z"/>',
    thread: '<rect x="7" y="3" width="10" height="4" rx="1"/><rect x="7" y="17" width="10" height="4" rx="1"/><path d="M9 7v10M15 7v10M9 10l6 2M9 13l6 2"/>',
    truck: '<path d="M2 6h12v10H2zM14 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    ship: '<path d="M3 15h18l-2.5 5h-13z"/><path d="M5 15V9h14v6M9 9V5h6v4"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM5 11h14"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 6 4 6c0 4 3 6 8 6zM12 10c0-3 2.5-5 7-5 0 3.5-2.5 5-7 5z"/>',
    fish: '<path d="M2 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3z"/><path d="M8 11h.01"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="M5 7 2 14a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.8 4 6"/>',
    broom: '<path d="M14 3 9.5 11.5"/><path d="M8 11h5l3 10H5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    news: '<rect x="3" y="4" width="15" height="16" rx="2"/><path d="M18 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-4 0M7 8h7M7 12h7M7 16h4"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>',
    gov: '<path d="M12 2v3M8 5h8l-1 3H9z"/><path d="M4 21V11h16v10M2 21h20M8 14v4M12 14v4M16 14v4"/>',
    hand: '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9.5V4a1.5 1.5 0 0 1 3 0v6M13 5.5a1.5 1.5 0 0 1 3 0V11M16 7.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14.5a1.6 1.6 0 0 1 2.6-1.8L7 14"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    handshake: '<path d="M2 11l4-4 4 2 3-2 3 1 4 3"/><path d="M2 11l6 6c1 1 2.5 1 3.5 0l5-5M20 11l2 2-5 5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 3-3"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    brain: '<path d="M9.5 3A3 3 0 0 0 6.6 6.8 3.2 3.2 0 0 0 4.5 12a3.2 3.2 0 0 0 1.7 4.8A3 3 0 0 0 9.5 21c1.4 0 2.5-1 2.5-2.3V5.2C12 4 11 3 9.5 3z"/><path d="M14.5 3a3 3 0 0 1 2.9 3.8 3.2 3.2 0 0 1 2.1 5.2 3.2 3.2 0 0 1-1.7 4.8 3 3 0 0 1-3.3 4.2c-1.4 0-2.5-1-2.5-2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    rocket: '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    wand: '<path d="m3 21 12-12"/><path d="m13 7 4 4"/><path d="M18 2v3M16.5 3.5h3M20.5 8v2M19.5 9h2M10 2v2M9 3h2"/>'
  };
  const ic = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.sparkle) + '</svg>';

  /* ------------------------------------------------------------ helpers UI */
  const btn = (label, cls, attrs, icon) => '<button class="b3d ' + (cls || '') + '" ' + (attrs || '') + '>' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + (label ? '<span>' + label + '</span>' : '') + '</button>';
  const link = (label, cls, href, icon, extra) => '<a class="b3d ' + (cls || '') + '" href="' + href + '" ' + (extra || '') + '>' + (/shine/.test(cls || '') ? '<span class="sh"></span>' : '') + (icon ? ic(icon) : '') + '<span>' + label + '</span></a>';
  const tile = (c, cls) => '<div class="tile3d ' + (cls || '') + '" style="--c1:' + c.col[0] + ';--c2:' + c.col[1] + '">' + ic(c.ic) + '</div>';
  const brand = () => '<a class="brand" href="#home" aria-label="Drabuff Prompt Hub"><img src="icons/icon-192.png" alt=""><span><b>Drabuff<span class="bw"> Prompt Hub</span></b><small>PHÁT TRIỂN BỞI TÂN AI</small></span></a>';
  const credit = () => '<div class="foot-note">Drabuff Prompt Hub · Phát triển bởi <b>Tân AI</b><br>Chuyên gia AI Nguyễn Văn Tân</div>';
  const fmt = n => n.toLocaleString('vi-VN');

  function toast(msg, kind, icon) {
    const box = $('#toast'), el = document.createElement('div');
    el.className = 'toast ' + (kind || ''); el.innerHTML = ic(icon || 'info') + '<span>' + msg + '</span>';
    box.appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2800);
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
  function copyText(t) {
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok; };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, () => fallback());
    return Promise.resolve(fallback());
  }
  function highlight(text, q) {
    const toks = norm(q).split(/\s+/).filter(t => t.length > 1);
    if (!toks.length) return esc(text);
    const chars = Array.from(text), nt = chars.map(normChar).join(''), mark = new Array(chars.length).fill(false);
    toks.forEach(t => { let i = nt.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) mark[k] = true; i = nt.indexOf(t, i + t.length); } });
    let out = '', on = false;
    chars.forEach((c, i) => { if (mark[i] && !on) { out += '<mark>'; on = true; } if (!mark[i] && on) { out += '</mark>'; on = false; } out += esc(c); });
    return out + (on ? '</mark>' : '');
  }

  /* ------------------------------------------------------------ nền mạng nơ-ron + confetti */
  (function neural() {
    const c = $('#bg'), x = c.getContext('2d'); let W, H; const nodes = [];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); }
    size(); addEventListener('resize', size);
    const N = innerWidth < 700 ? 30 : 60;
    for (let i = 0; i < N; i++) nodes.push({ x: rand() * W, y: rand() * H, vx: (rand() - 0.5) * 0.25, vy: (rand() - 0.5) * 0.25, r: 1 + rand() * 1.8, g: rand() < 0.18 });
    function frame() {
      if (!document.hidden) {
        x.clearRect(0, 0, W, H);
        for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20; if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20; }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy; if (d < 17000) { x.strokeStyle = 'rgba(90,170,255,' + (1 - d / 17000) * 0.25 + ')'; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
        for (const n of nodes) { x.fillStyle = n.g ? 'rgba(255,210,94,.9)' : 'rgba(120,230,255,.85)'; x.beginPath(); x.arc(n.x, n.y, n.r, 0, 7); x.fill(); }
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  })();
  function confetti() {
    const c = $('#fx'), x = c.getContext('2d'), d = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    const cols = ['#ffd25e', '#fff3c0', '#3ce3ff', '#a78bfa', '#4ade80', '#ff7eb3'], ps = [];
    for (let i = 0; i < 140; i++) ps.push({ x: W / 2 + (rand() - 0.5) * 80, y: H * 0.35, vx: (rand() - 0.5) * 14, vy: -4 - rand() * 10, s: 6 + rand() * 7, r: rand() * 6, vr: (rand() - 0.5) * 0.4, c: cols[i % cols.length], l: 140 + rand() * 60 });
    (function f() { x.clearRect(0, 0, W, H); let alive = 0; ps.forEach(p => { if (p.l-- <= 0) return; alive++; p.vy += 0.3; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.globalAlpha = Math.min(1, p.l / 40); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); if (alive) requestAnimationFrame(f); else x.clearRect(0, 0, W, H); })();
  }

  /* ------------------------------------------------------------ cài đặt PWA */
  let deferredPrompt = null, INST_TAB = ENV.ios ? 'ios' : ENV.android ? 'android' : 'desktop';
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; const b = $('#inst-body'); if (b) b.innerHTML = installBody(INST_TAB); });
  addEventListener('appinstalled', () => { deferredPrompt = null; toast('Đã cài đặt! Mở app <b>Drabuff Prompt</b> trên màn hình chính.', 'gold', 'check'); });
  async function doInstall() {
    if (deferredPrompt) { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; return; }
    if (location.hash && location.hash !== '#') { location.hash = ''; setTimeout(() => { const el = $('#cai-dat'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 350); return; }
    const el = $('#cai-dat'); if (el) el.scrollIntoView({ behavior: 'smooth' });
    toast('Làm theo các bước bên dưới để cài app', '', 'info');
  }
  const step = (n, t, p, ill) => '<div class="step"><span class="sn">' + n + '</span><div class="ill">' + ill + '</div><b>' + t + '</b><p>' + p + '</p></div>';
  function installBody(t) {
    if (standalone()) return '<div class="installed-note">' + ic('check') + ' Bạn đang dùng ứng dụng đã cài đặt.</div>';
    const appIcon = '<img src="icons/icon-192.png" alt="">', home = '<div class="home"><i></i><i></i>' + appIcon + '<i></i><i></i><i></i><i></i><i></i></div>';
    const copyBtn = btn('Sao chép liên kết', 'sm steel', 'data-act="copyLink"', 'link');
    if (t === 'android') {
      return (ENV.inApp && ENV.android ? '<div class="warn-box">' + ic('info') + '<div><b>Bạn đang mở trang trong ' + ENV.inAppName + '.</b><br>Hãy bấm ' + ic('dotsV') + ' rồi chọn <b>Mở bằng trình duyệt</b> (Chrome) để cài app.<div class="btn-row" style="margin-top:12px">' + copyBtn + '</div></div></div>' : '') +
        '<div class="install-cta">' + btn(deferredPrompt ? 'Cài ứng dụng ngay' : 'Cài ứng dụng', 'xl shine', 'data-act="install"', 'download') + '<small class="muted">' + (deferredPrompt ? 'Bấm nút rồi chọn <b>Cài đặt</b>.' : 'Nếu không hiện hộp thoại cài đặt, làm theo các bước dưới đây.') + '</small></div>' +
        '<div class="steps">' + step(1, 'Mở bằng Chrome', 'Mở trang này bằng <b>Chrome</b> trên Android.', '<div class="chrome">' + ic('dotsV') + '</div>' + ic('compass', 'hl')) + step(2, 'Bấm nút menu', 'Bấm <span class="kbd">' + ic('dotsV') + '</span> ở góc trên bên phải.', '<div class="chrome"><span class="hl">' + ic('dotsV') + '</span></div>') + step(3, 'Cài đặt ứng dụng', 'Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.', '<div class="menu3"><div>Thẻ mới</div><div>Dấu trang</div><div class="hl2">Cài đặt ứng dụng</div><div>Chia sẻ…</div></div>') + step(4, 'Mở app', 'Bấm biểu tượng <b>Drabuff Prompt</b> trên màn hình chính.', home) + '</div>';
    }
    if (t === 'ios') {
      return (ENV.inApp && ENV.ios ? '<div class="warn-box">' + ic('info') + '<div><b>Bạn đang mở trang trong ' + ENV.inAppName + '.</b><br>Bấm ' + ic('dots') + ' rồi chọn <b>Mở bằng Safari</b>.<div class="btn-row" style="margin-top:12px">' + copyBtn + '</div></div></div>' : '') +
        '<div class="steps">' + step(1, 'Bấm nút Chia sẻ', 'Trong <b>Safari</b>, bấm <span class="kbd">' + ic('share') + '</span> ở thanh dưới (iOS mới: bấm <span class="kbd">' + ic('dots') + '</span> rồi chọn Chia sẻ).', '<div class="sbar">' + ic('left') + ic('right') + '<span class="hl">' + ic('share') + '</span>' + ic('book') + ic('copy') + '</div>') +
        step(2, 'Thêm vào MH chính', 'Chọn <b>Thêm vào MH chính</b> <span class="kbd">' + ic('plusSq') + '</span>.', '<div class="sheet"><div>Sao chép ' + ic('copy') + '</div><div class="hl2">Thêm vào MH chính ' + ic('plusSq') + '</div><div>Đánh dấu ' + ic('book') + '</div></div>') +
        step(3, 'Bấm “Thêm”', 'Bấm <b>Thêm</b> ở góc trên bên phải.', '<div class="dlg"><div class="dt"><span>Hủy</span><span class="add">Thêm</span></div><div class="da">' + appIcon + 'Drabuff Prompt</div></div>') +
        step(4, 'Mở app', 'Biểu tượng <b>Drabuff Prompt</b> có trên màn hình chính.', home) + '</div>';
    }
    const url = location.origin + location.pathname;
    return '<div class="qr-box"><div class="qr" id="qr"></div><div style="max-width:380px;text-align:left"><b style="font-size:18px">Quét mã bằng điện thoại</b><p class="muted">Mở Camera, quét mã QR để mở trang này trên điện thoại rồi làm theo hướng dẫn Android hoặc iPhone.</p><p class="muted" style="font-size:13px;word-break:break-all">' + esc(url) + '</p>' + (deferredPrompt ? btn('Cài lên máy tính', 'cyan', 'data-act="install"', 'laptop') : '<p class="muted" style="font-size:13px">Cài lên máy tính: dùng Chrome hoặc Edge, bấm biểu tượng cài đặt ở cuối thanh địa chỉ.</p>') + '</div></div>';
  }
  function drawQR() { const el = $('#qr'); if (!el || !window.qrcode) return; try { const q = window.qrcode(0, 'M'); q.addData(location.origin + location.pathname); q.make(); el.innerHTML = '<img alt="Mã QR" src="' + q.createDataURL(8, 0) + '">'; } catch (e) {} }

  /* ------------------------------------------------------------ máy chủ (Cloudflare Pages Functions) */
  async function apiRegister(name, phone) {
    try {
      const r = await fetch('api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, ua: UA.slice(0, 160) }) });
      let j = null; try { j = await r.json(); } catch (e) {}
      if (r.ok && j && j.ok) return { ok: true, user: j.user };
      if (j && j.error && r.status >= 400 && r.status < 500) return { ok: false, error: j.error };
      return { ok: false, offline: true };
    } catch (e) { return { ok: false, offline: true }; }
  }
  async function syncPending() {
    if (!S.user || !S.pending) return;
    const r = await apiRegister(S.user.name, S.user.phone);
    if (r.ok) { S.pending = false; save(); }
  }

  /* ------------------------------------------------------------ khung app */
  function shell(inner, tab) {
    return '<div class="orb o1"></div><div class="orb o2"></div>' +
      '<header class="topbar"><div class="topbar-in">' + brand() + '<span class="sp"></span><a class="icon-btn" href="#s/" aria-label="Tìm kiếm">' + ic('search') + '</a><button class="icon-btn" data-act="mute" aria-label="Bật/tắt âm thanh">' + ic(S.settings.sfx ? 'volume' : 'mute') + '</button></div></header>' +
      '<main class="app"><div class="screen">' + inner + '</div></main>' +
      '<nav class="nav" aria-label="Điều hướng"><div class="nav-in">' + [['home', 'Trang chủ', 'home'], ['prompts', 'Kho prompt', 'grid'], ['glossary', 'Từ điển AI', 'dict'], ['favs', 'Yêu thích', 'star'], ['account', 'Tài khoản', 'user']].map(n => '<a href="#' + n[0] + '" class="' + (tab === n[0] ? 'on' : '') + '">' + ic(n[2]) + '<span>' + n[1] + '</span></a>').join('') + '</div></nav>';
  }
  const backRow = (href, title, extra) => '<div class="back-row"><a class="icon-btn" href="' + href + '" aria-label="Quay lại">' + ic('left') + '</a><h2>' + title + '</h2>' + (extra || '') + '</div>';
  const searchBox = (val, lg, ph) => '<form class="search3d ' + (lg ? 'lg' : '') + '" data-form="search" role="search">' + ic('search') + '<input id="q" name="q" type="search" autocomplete="off" placeholder="' + (ph || 'Tìm prompt: viết bài, tuyển dụng, spa, Excel…') + '" value="' + esc(val || '') + '">' + btn('Tìm', 'sm', 'type="submit"') + '</form>';

  /* ------------------------------------------------------------ landing */
  function landing() {
    const sample = PMAP['i-spa.fb-post'] || PROMPTS[0];
    const hasUser = !!S.user;
    const feats = [
      ['grid', '#5b8cff', '#8b5cf6', fmt(STATS.prompts) + '+ prompt sẵn dùng', 'Phủ ' + STATS.ind + ' ngành nghề, ' + STATS.dept + ' phòng ban và ' + STATS.need + ' nhóm nhu cầu công việc, cá nhân.'],
      ['dict', '#fbbf24', '#f97316', 'Từ điển AI từ A–Z', STATS.terms + ' thuật ngữ giải thích dễ hiểu, có ví dụ, tra cứu theo chữ cái và chủ đề.'],
      ['search', '#22d3ee', '#3b82f6', 'Tìm kiếm không cần dấu', 'Gõ “tuyen dung”, “spa”, “excel”… là ra ngay prompt phù hợp.'],
      ['wand', '#a78bfa', '#7c3aed', 'Điền nhanh – dùng ngay', 'Tự nhận các ô [ ] trong prompt để bạn điền, ghi nhớ thông tin cho lần sau, sao chép một chạm.'],
      ['external', '#34d399', '#059669', 'Mở thẳng ChatGPT, Claude', 'Gửi prompt sang công cụ AI yêu thích chỉ với một nút bấm.'],
      ['phone', '#f472b6', '#e11d48', 'Cài như app, dùng offline', 'Cài lên điện thoại và máy tính, không cần App Store hay CH Play.']
    ];
    return '<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="land">' +
      '<nav class="lnav"><div class="in">' + brand() + '<span class="sp"></span>' + (hasUser ? link('Vào kho prompt', 'sm', '#home', 'grid') : link('Đăng ký', 'sm', '#register', 'user')) + '</div></nav>' +
      '<section class="wrap hero"><div>' +
        '<span class="chip gold">' + ic('sparkle') + ' Phát triển bởi Tân AI</span>' +
        '<h1>Kho prompt AI <span class="gold-text">tất tần tật</span><br>&amp; <span class="cy-text">Từ điển AI A–Z</span></h1>' +
        '<p class="lead">' + fmt(STATS.prompts) + '+ prompt mẫu cho mọi ngành nghề, phòng ban và nhu cầu công việc, kèm ' + STATS.terms + ' thuật ngữ AI giải thích dễ hiểu. Biên soạn bởi <b>Chuyên gia AI Nguyễn Văn Tân</b>.</p>' +
        '<div class="cta">' + (hasUser ? link('Vào kho prompt', 'lg shine', '#home', 'grid') : link('Đăng ký miễn phí để sử dụng', 'lg shine', '#register', 'user')) + btn('Cài ứng dụng', 'lg steel', 'data-act="install"', 'download') + '</div>' +
        '<div class="hstat"><div><b class="gold-text">' + fmt(STATS.prompts) + '+</b><span>prompt</span></div><div><b class="gold-text">' + STATS.ind + '</b><span>ngành nghề</span></div><div><b class="gold-text">' + (STATS.dept + STATS.need) + '</b><span>phòng ban &amp; nhu cầu</span></div><div><b class="gold-text">' + STATS.terms + '</b><span>thuật ngữ AI</span></div></div>' +
      '</div><div class="panel hud gold" style="min-width:0"><span class="chip">' + ic('wand') + ' Prompt mẫu</span><h3 style="margin:10px 0 0;font:800 17px/1.3 var(--ui)">' + esc(sample.t) + ' – ' + esc(sample.cat.name) + '</h3><div class="pv blur-prev">' + pvHtml(sample.text, {}) + '</div><div class="lock-note">' + ic('lock') + ' Đăng ký bằng tên và số Zalo để xem đầy đủ và sao chép.</div></div></section>' +
      '<section class="lsec"><div class="wrap"><div class="center"><span class="chip gold">' + ic('sparkle') + ' Vì sao nên dùng</span></div><h2>Một kho – <span class="cy-text">mọi nhu cầu AI</span></h2><p class="sub">Không cần tự nghĩ prompt từ đầu. Chọn đúng ngành, đúng việc, điền vài thông tin là có ngay kết quả chuyên nghiệp.</p>' +
        '<div class="feat">' + feats.map(f => '<div class="panel hud"><div class="tile3d" style="--c1:' + f[1] + ';--c2:' + f[2] + '">' + ic(f[0]) + '</div><b>' + f[3] + '</b><p>' + f[4] + '</p></div>').join('') + '</div></div></section>' +
      '<section class="lsec"><div class="wrap"><h2>' + STATS.ind + ' ngành nghề <span class="gold-text">có sẵn</span></h2><p class="sub">Mỗi ngành ' + window.PH_TASKS.length + ' prompt chuyên biệt: marketing, bán hàng, chăm sóc khách hàng, vận hành, nhân sự, chiến lược và tài chính.</p><div class="tiles">' +
        CATS.filter(c => c.kind === 'ind').slice(0, 24).map(c => '<div class="cat-tile">' + tile(c) + '<b>' + esc(c.name) + '</b><small>' + c.prompts.length + ' prompt</small></div>').join('') + '</div><p class="muted center" style="text-align:center;margin-top:16px">…và ' + (STATS.ind - 24) + ' ngành khác, ' + STATS.dept + ' phòng ban, ' + STATS.need + ' nhóm nhu cầu.</p></div></section>' +
      '<section class="lsec" id="cai-dat"><div class="wrap"><div class="center"><span class="chip">' + ic('phone') + ' Không cần App Store / CH Play</span></div><h2>Cài ứng dụng trong <span class="gold-text">30 giây</span></h2><p class="sub">Cài thẳng từ trang web lên màn hình chính, mở toàn màn hình như app thật.</p>' +
        '<div class="install-box panel hud"><div class="tabs">' + [['android', 'Android', 'phone'], ['ios', 'iPhone / iPad', 'phone'], ['desktop', 'Máy tính', 'laptop']].map(t => btn(t[1], (INST_TAB === t[0] ? 'cyan' : 'steel') + ' sm', 'data-act="itab" data-t="' + t[0] + '"', t[2])).join('') + '</div><div id="inst-body">' + installBody(INST_TAB) + '</div></div></div></section>' +
      '<footer class="lfoot"><img src="icons/drabuff-logo-white.png" alt="Drabuff Agency & Academy" style="width:170px;margin:0 auto 14px;opacity:.9"><div>© ' + new Date().getFullYear() + ' Drabuff Prompt Hub · Phát triển bởi <b>Tân AI</b></div><div style="margin-top:4px">Biên soạn bởi Chuyên gia AI Nguyễn Văn Tân</div></footer></div>';
  }

  /* ------------------------------------------------------------ đăng ký */
  let afterLogin = '#home';
  function register() {
    return '<div class="orb o1"></div><div class="orb o2"></div><main class="app noshell"><div class="screen welcome reg">' +
      '<img class="logo3d" src="icons/icon-512.png" alt="Drabuff Prompt Hub">' +
      '<h1>' + (S.user ? 'Đăng nhập lại' : 'Tạo tài khoản') + '<br><span class="gold-text">Drabuff Prompt Hub</span></h1>' +
      '<div class="by">Miễn phí truy cập ' + fmt(STATS.prompts) + '+ prompt &amp; từ điển AI · Phát triển bởi <b>Tân AI</b></div>' +
      '<form class="panel hud" data-form="register" novalidate>' +
        '<div class="field"><label for="rn">Họ và tên</label><input id="rn" class="input3d" maxlength="60" autocomplete="name" autocapitalize="words" placeholder="Ví dụ: Nguyễn Thị Lan" required></div>' +
        '<div class="field"><label for="rp">Số Zalo</label><input id="rp" class="input3d" type="tel" inputmode="numeric" maxlength="13" autocomplete="tel" placeholder="Ví dụ: 0901234567" required></div>' +
        '<label class="check" style="margin-top:16px"><input type="checkbox" id="rc"><span class="box">' + ic('check') + '</span><span>Tôi đồng ý để Drabuff lưu họ tên và số Zalo nhằm hỗ trợ và gửi tài liệu AI hữu ích.</span></label>' +
        '<div id="rerr"></div>' +
        btn('Vào kho prompt', 'xl block shine', 'type="submit" id="rsub"', 'rocket') +
        '<div class="lock-note">' + ic('lock') + ' Đã đăng ký trước đó? Nhập lại đúng số Zalo để đăng nhập.</div>' +
      '</form>' + credit() + '</div></main>';
  }
  async function submitRegister(form) {
    const nameEl = $('#rn', form), phoneEl = $('#rp', form), err = $('#rerr', form), sub = $('#rsub', form);
    const name = nameEl.value.normalize('NFC').trim().replace(/\s+/g, ' ');
    let phone = phoneEl.value.replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
    const showErr = m => { err.innerHTML = '<div class="err">' + m + '</div>'; Snd.SFX.wrong(); };
    if (name.length < 2) return showErr('Vui lòng nhập họ và tên (ít nhất 2 ký tự).'), nameEl.focus();
    if (!/^0\d{9}$/.test(phone)) return showErr('Số Zalo chưa đúng. Nhập 10 số, bắt đầu bằng 0 (ví dụ 0901234567).'), phoneEl.focus();
    if (!$('#rc', form).checked) return showErr('Vui lòng đánh dấu đồng ý để tiếp tục.');
    err.innerHTML = ''; sub.disabled = true; sub.querySelector('span:last-child').textContent = 'Đang tạo tài khoản…';
    const r = await apiRegister(name, phone);
    sub.disabled = false; sub.querySelector('span:last-child').textContent = 'Vào kho prompt';
    if (!r.ok && !r.offline) return showErr(esc(r.error));
    S.user = { name, phone, at: Date.now() }; S.pending = !r.ok; save();
    Snd.SFX.success(); confetti();
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    go(afterLogin || '#home');
    setTimeout(() => toast(r.ok ? 'Chào mừng ' + esc(name.split(' ').pop()) + '! Tài khoản đã được tạo.' : 'Chào mừng ' + esc(name.split(' ').pop()) + '! (Chưa kết nối máy chủ – đã lưu tạm trên máy, sẽ tự đồng bộ sau)', 'gold', 'sparkle'), 400);
  }

  /* ------------------------------------------------------------ trang chủ */
  function daily(arr, n, salt) {
    const d = new Date(), seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate() + (salt || 0); let s = seed;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out = new Set(); while (out.size < Math.min(n, arr.length)) out.add(arr[Math.floor(r() * arr.length)]);
    return Array.from(out);
  }
  function home() {
    const first = S.user.name.split(' ').pop();
    const term = daily(GLOSS, 1, 7)[0];
    let h = '<div class="panel hud"><div class="hello"><div class="avatar">' + esc(first.charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:0"><div class="muted" style="font-size:13px">Xin chào,</div><h1>' + esc(S.user.name) + '</h1><div class="lvl"><span class="chip gold">' + ic('sparkle') + ' ' + fmt(STATS.prompts) + '+ prompt sẵn sàng</span></div></div></div><div style="margin-top:16px">' + searchBox('', true) + '</div></div>';
    h += '<div class="sec-title">Duyệt kho prompt</div><div class="big-tiles">' +
      bigTile('#prompts/ind', 'briefcase', '#5b8cff', '#8b5cf6', 'Ngành nghề', STATS.ind + ' ngành', STATS.ind) +
      bigTile('#prompts/dept', 'users', '#22d3ee', '#0e7fc9', 'Phòng ban', STATS.dept + ' phòng ban', STATS.dept) +
      bigTile('#prompts/need', 'bolt', '#f472b6', '#be123c', 'Nhu cầu công việc', STATS.need + ' nhóm nhu cầu', STATS.need) +
      bigTile('#glossary', 'dict', '#fbbf24', '#ea580c', 'Từ điển AI A–Z', STATS.terms + ' thuật ngữ', STATS.terms) + '</div>';
    if (S.recent.length) h += '<div class="sec-title">Xem gần đây</div><div class="plist two">' + S.recent.map(id => PMAP[id]).filter(Boolean).slice(0, 4).map(p => pcard(p)).join('') + '</div>';
    h += '<div class="sec-title">Prompt nổi bật hôm nay</div><div class="plist two">' + daily(PROMPTS, 6, 1).map(p => pcard(p)).join('') + '</div>';
    h += '<div class="sec-title">Thuật ngữ AI của ngày</div>' + termCard(term) + '<div style="margin-top:12px">' + link('Mở từ điển AI', 'steel', '#glossary', 'dict') + '</div>';
    return h + credit();
  }
  const bigTile = (href, icon, c1, c2, t, s, n) => '<a class="big-tile" href="' + href + '" style="--c1:' + c1 + ';--c2:' + c2 + '">' + ic(icon, 'bt') + '<span class="num">' + n + '</span><b>' + t + '</b><small>' + s + '</small></a>';
  function pcard(p, q) {
    const fav = S.favs.includes(p.id), first = p.text.split('\n').find(l => l.trim() && !/^Bạn là/.test(l)) || p.text;
    return '<a class="pcard" href="#p/' + encodeURIComponent(p.id) + '"><div class="pt"><h4>' + (q ? highlight(p.t, q) : esc(p.t)) + '</h4><div class="pa"><button class="mini-btn" data-act="qcopy" data-id="' + esc(p.id) + '" aria-label="Sao chép" data-sfx="tap">' + ic('copy') + '</button><button class="mini-btn ' + (fav ? 'on' : '') + '" data-act="fav" data-id="' + esc(p.id) + '" aria-label="Yêu thích" data-sfx="tap">' + ic('star') + '</button></div></div><p>' + esc(first.slice(0, 220)) + '</p><div class="pm"><span class="chip dim">' + esc(p.cat.name) + '</span>' + (p.f ? '<span class="chip">' + esc(p.f) + '</span>' : '') + '</div></a>';
  }

  /* ------------------------------------------------------------ duyệt danh mục */
  function browse(kind) {
    kind = KIND[kind] ? kind : 'ind';
    let h = '<div class="panel hud"><span class="chip">' + ic('grid') + ' Kho prompt</span><h1 class="h-display" style="font-size:24px;margin:10px 0 14px">' + fmt(STATS.prompts) + '+ prompt cho mọi công việc</h1>' + searchBox('') + '</div>';
    h += '<div class="seg" style="margin-top:16px">' + Object.keys(KIND).map(k => '<a href="#prompts/' + k + '" class="' + (k === kind ? 'on' : '') + '">' + KIND[k] + '</a>').join('') + '</div>';
    if (kind === 'ind') {
      GROUPS.forEach(g => {
        const cs = CATS.filter(c => c.kind === 'ind' && c.group === g[0]);
        h += '<div class="group-title"><h3>' + g[1] + '</h3><span>' + cs.length + ' ngành</span></div><div class="tiles">' + cs.map(catTile).join('') + '</div>';
      });
    } else {
      h += '<div class="tiles" style="margin-top:18px">' + CATS.filter(c => c.kind === kind).map(catTile).join('') + '</div>';
    }
    return h + credit();
  }
  const catTile = c => '<a class="cat-tile" href="#c/' + c.id + '">' + tile(c) + '<b>' + esc(c.name) + '</b><small>' + c.prompts.length + ' prompt</small></a>';
  let CAT_FILTER = { id: null, f: '' };
  function category(c) {
    if (CAT_FILTER.id !== c.id) CAT_FILTER = { id: c.id, f: '' };
    const fs = Array.from(new Set(c.prompts.map(p => p.f).filter(Boolean)));
    let h = backRow('#prompts/' + c.kind, KIND[c.kind]);
    h += '<div class="panel hud"><div style="display:flex;gap:14px;align-items:center">' + tile(c, 'lg') + '<div style="min-width:0"><span class="chip dim">' + KIND[c.kind] + '</span><h1 style="font:900 23px/1.2 var(--ui);margin-top:8px">' + esc(c.name) + '</h1><div class="muted" style="font-size:13px;margin-top:4px">' + c.prompts.length + ' prompt</div></div></div>';
    if (c.ind) h += '<div class="info-grid"><div><b>Khách hàng</b><span>' + esc(c.ind.k) + '</span></div><div><b>Sản phẩm</b><span>' + esc(c.ind.s) + '</span></div><div><b>Kênh</b><span>' + esc(c.ind.c) + '</span></div><div><b>Lưu ý</b><span>' + esc(c.ind.l) + '</span></div></div>';
    h += '</div>';
    if (fs.length) h += '<div class="chips" style="margin-top:16px">' + ['', ...fs].map(f => '<button data-act="catf" data-f="' + esc(f) + '" class="' + (CAT_FILTER.f === f ? 'on' : '') + '" data-sfx="tap">' + (f || 'Tất cả') + '</button>').join('') + '</div>';
    const list = c.prompts.filter(p => !CAT_FILTER.f || p.f === CAT_FILTER.f);
    h += '<div class="plist two" style="margin-top:16px">' + list.map(p => pcard(p)).join('') + '</div>';
    return h + credit();
  }

  /* ------------------------------------------------------------ chi tiết prompt */
  const PH_RE = /\[([^\[\]\n]{1,80})\]/g;
  const phNames = text => { const s = []; let m; PH_RE.lastIndex = 0; while ((m = PH_RE.exec(text))) if (!s.includes(m[1])) s.push(m[1]); return s; };
  const fillText = (text, vals) => text.replace(PH_RE, (m, n) => (vals[n] && vals[n].trim()) ? vals[n].trim() : m);
  function pvHtml(text, vals) {
    let out = '', last = 0; PH_RE.lastIndex = 0; let m;
    while ((m = PH_RE.exec(text))) { out += esc(text.slice(last, m.index)); const v = vals[m[1]] && vals[m[1]].trim(); out += '<span class="ph ' + (v ? 'ok' : '') + '">' + esc(v || m[0]) + '</span>'; last = m.index + m[0].length; }
    return out + esc(text.slice(last));
  }
  function promptView(p) {
    S.recent = [p.id, ...S.recent.filter(x => x !== p.id)].slice(0, 12); save();
    const names = phNames(p.text), fav = S.favs.includes(p.id);
    let h = backRow('#c/' + p.cat.id, esc(p.cat.name));
    h += '<div class="panel hud"><div class="pm" style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip dim">' + KIND[p.cat.kind] + '</span><span class="chip dim">' + esc(p.cat.name) + '</span>' + (p.f ? '<span class="chip">' + esc(p.f) + '</span>' : '') + '</div><h1 style="font:900 22px/1.3 var(--ui);margin:12px 0 0">' + esc(p.t) + '</h1>';
    if (names.length) h += '<div class="pv-head"><b>' + ic('wand') + ' Điền thông tin (' + names.length + ' ô)</b><button class="copy-btn" data-act="clearvars" data-sfx="tap">' + ic('refresh') + ' Xóa</button></div><div class="fill-grid">' + names.map((n, i) => { const long = /^Dán|Mô tả|Danh sách|Thông tin/i.test(n); const v = S.vars[n] || ''; return '<div style="' + (long ? 'grid-column:1/-1' : '') + '"><label for="v' + i + '">' + esc(n) + '</label>' + (long ? '<textarea id="v' + i + '" rows="3" data-var="' + esc(n) + '">' + esc(v) + '</textarea>' : '<input id="v' + i + '" data-var="' + esc(n) + '" value="' + esc(v) + '" autocomplete="off">') + '</div>'; }).join('') + '</div>';
    h += '<div class="pv-head"><b>' + ic('sparkle') + ' Prompt</b><span class="muted" style="font-size:12px">' + (names.length ? 'Ô vàng: chưa điền · Ô xanh: đã điền' : '') + '</span></div><div class="pv" id="pv">' + pvHtml(p.text, S.vars) + '</div>';
    h += '<div class="btn-row" style="margin-top:18px">' + btn('Sao chép prompt', 'lg shine', 'data-act="copyp" data-id="' + esc(p.id) + '"', 'copy') + btn(fav ? 'Đã lưu' : 'Lưu yêu thích', (fav ? 'violet' : 'steel') + ' lg', 'data-act="favbig" data-id="' + esc(p.id) + '"', 'star') + '</div>';
    h += '<div class="pv-head" style="margin-top:8px"><b>' + ic('external') + ' Mở trong công cụ AI</b></div><div class="ai-row" style="margin-top:10px">' +
      '<a class="b3d green" target="_blank" rel="noopener" data-ai="chatgpt" href="#">ChatGPT</a><a class="b3d cyan" target="_blank" rel="noopener" data-ai="claude" href="#">Claude</a><a class="b3d violet" target="_blank" rel="noopener" data-ai="gemini" href="https://gemini.google.com/app">Gemini</a></div>' +
      '<p class="muted" style="font-size:12.5px;margin:6px 0 0">Prompt được tự động sao chép. Với Gemini, hãy dán (Ctrl/Cmd + V) vào ô chat.</p></div>';
    const rel = p.cat.prompts.filter(x => x !== p && (!p.f || x.f === p.f)).slice(0, 4);
    if (rel.length) h += '<div class="sec-title">Prompt liên quan</div><div class="plist two">' + rel.map(x => pcard(x)).join('') + '</div>';
    return h + credit();
  }
  function promptAfter(p) {
    const pv = $('#pv'); if (!pv) return;
    $$('[data-var]').forEach(el => el.addEventListener('input', () => { S.vars[el.dataset.var] = el.value; save(); pv.innerHTML = pvHtml(p.text, S.vars); }));
    $$('[data-ai]').forEach(a => a.addEventListener('click', () => {
      const t = fillText(p.text, S.vars); copyText(t);
      if (a.dataset.ai === 'chatgpt') a.href = 'https://chatgpt.com/?q=' + encodeURIComponent(t);
      if (a.dataset.ai === 'claude') a.href = 'https://claude.ai/new?q=' + encodeURIComponent(t);
      toast('Đã sao chép prompt và mở ' + a.textContent, '', 'external');
    }));
  }

  /* ------------------------------------------------------------ tìm kiếm */
  let SEARCH = { q: '', kind: '', n: 40 };
  function searchPrompts(q, kind) {
    const toks = norm(q).split(/\s+/).filter(Boolean); if (!toks.length) return [];
    const res = [];
    for (const p of PROMPTS) {
      if (kind && p.cat.kind !== kind) continue;
      if (!toks.every(t => p.idx.includes(t))) continue;
      const nt = norm(p.t), nc = norm(p.cat.name); let s = 0;
      toks.forEach(t => { if (nt.includes(t)) s += 6; if (nc.includes(t)) s += 4; if (norm(p.f).includes(t)) s += 2; s += 1; });
      res.push([s, p]);
    }
    return res.sort((a, b) => b[0] - a[0]).map(r => r[1]);
  }
  function searchScreen(q) {
    if (SEARCH.q !== q) SEARCH = { q, kind: SEARCH.kind, n: 40 };
    const res = q ? searchPrompts(q, SEARCH.kind) : [];
    const terms = q ? GLOSS.filter(g => norm(q).split(/\s+/).filter(Boolean).every(t => g.idx.includes(t))).slice(0, 4) : [];
    let h = '<div class="panel hud">' + searchBox(q, true) + '<div class="chips" style="margin-top:14px">' + [['', 'Tất cả'], ['ind', 'Ngành nghề'], ['dept', 'Phòng ban'], ['need', 'Nhu cầu']].map(k => '<button data-act="skind" data-k="' + k[0] + '" class="' + (SEARCH.kind === k[0] ? 'on' : '') + '" data-sfx="tap">' + k[1] + '</button>').join('') + '</div></div>';
    if (!q) {
      h += '<div class="sec-title">Gợi ý tìm kiếm</div><div class="chips">' + ['viết bài facebook', 'tuyển dụng', 'kịch bản tiktok', 'excel', 'chăm sóc khách hàng', 'spa', 'bất động sản', 'email', 'phân tích đối thủ', 'kế hoạch kinh doanh', 'tạo ảnh', 'hợp đồng'].map(s => '<button data-act="suggest" data-q="' + s + '" data-sfx="tap">' + s + '</button>').join('') + '</div>';
      return h + credit();
    }
    if (terms.length) h += '<div class="sec-title">Thuật ngữ AI liên quan</div><div class="terms two">' + terms.map(termCard).join('') + '</div>';
    h += '<p class="count-line">Tìm thấy <b>' + fmt(res.length) + '</b> prompt cho “' + esc(q) + '”</p>';
    h += '<div class="plist two">' + res.slice(0, SEARCH.n).map(p => pcard(p, q)).join('') + '</div>';
    if (res.length > SEARCH.n) h += '<div class="more-row">' + btn('Xem thêm ' + Math.min(40, res.length - SEARCH.n) + ' kết quả', 'steel', 'data-act="more"', 'right') + '</div>';
    if (!res.length) h += '<div class="panel" style="text-align:center">Không tìm thấy. Hãy thử từ khóa ngắn hơn, ví dụ “bán hàng”, “email”, “nhà hàng”.</div>';
    return h + credit();
  }

  /* ------------------------------------------------------------ từ điển */
  let GL = { q: '', cat: '', letter: '' };
  function termCard(g) {
    return '<div class="term" id="t' + g.id + '"><div class="tt"><div class="letter">' + esc(g.letter) + '</div><div style="min-width:0"><h4>' + esc(g.term) + '</h4><div class="full">' + esc(g.full) + '</div><span class="chip dim" style="margin-top:8px">' + esc(window.PH_GCATS[g.cat] || '') + '</span></div></div><p>' + esc(g.def) + '</p>' + (g.ex ? '<div class="ex"><b>Ví dụ:</b> ' + esc(g.ex) + '</div>' : '') + '</div>';
  }
  function glossary() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), have = new Set(GLOSS.map(g => g.letter));
    const toks = norm(GL.q).split(/\s+/).filter(Boolean);
    const list = GLOSS.filter(g => (!GL.cat || g.cat === GL.cat) && (!GL.letter || g.letter === GL.letter) && toks.every(t => g.idx.includes(t)));
    let h = '<div class="panel hud gold"><span class="chip gold">' + ic('dict') + ' Từ điển AI A–Z</span><h1 class="h-display" style="font-size:24px;margin:10px 0 14px">' + STATS.terms + ' thuật ngữ AI dễ hiểu</h1><div class="search3d">' + ic('search') + '<input id="gq" type="search" placeholder="Tra thuật ngữ: token, RAG, ảo giác, agent…" value="' + esc(GL.q) + '" autocomplete="off"></div></div>';
    h += '<div class="az" style="margin-top:16px">' + '<button data-act="gl" data-l="" class="' + (GL.letter ? '' : 'on') + '" style="width:auto;padding:0 14px" data-sfx="tap">Tất cả</button>' + letters.map(l => '<button data-act="gl" data-l="' + l + '" class="' + (GL.letter === l ? 'on' : '') + '"' + (have.has(l) ? '' : ' disabled') + ' data-sfx="tap">' + l + '</button>').join('') + '</div>';
    h += '<div class="chips scroll">' + [['', 'Mọi chủ đề'], ...Object.entries(window.PH_GCATS)].map(c => '<button data-act="gcat" data-c="' + c[0] + '" class="' + (GL.cat === c[0] ? 'on' : '') + '" data-sfx="tap">' + c[1] + '</button>').join('') + '</div>';
    h += '<div id="glist">' + glossList(list) + '</div>';
    return h + credit();
  }
  function glossList(list) {
    if (!list.length) return '<div class="panel" style="text-align:center;margin-top:16px">Không có thuật ngữ phù hợp.</div>';
    let h = '<p class="count-line">' + list.length + ' thuật ngữ</p>', cur = '';
    list.forEach(g => { if (g.letter !== cur) { if (cur) h += '</div>'; cur = g.letter; h += '<div class="letter-head">' + cur + '</div><div class="terms two">'; } h += termCard(g); });
    return h + '</div>';
  }
  function glossAfter() {
    const i = $('#gq'); if (!i) return; let t;
    i.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { GL.q = i.value; const toks = norm(GL.q).split(/\s+/).filter(Boolean); const list = GLOSS.filter(g => (!GL.cat || g.cat === GL.cat) && (!GL.letter || g.letter === GL.letter) && toks.every(x => g.idx.includes(x))); $('#glist').innerHTML = glossList(list); }, 140); });
  }

  /* ------------------------------------------------------------ yêu thích & tài khoản */
  function favs() {
    const list = S.favs.map(id => PMAP[id]).filter(Boolean);
    let h = '<div class="panel hud gold"><span class="chip gold">' + ic('star') + ' Yêu thích</span><h1 class="h-display" style="font-size:24px;margin:10px 0 4px">Prompt đã lưu</h1><p class="muted" style="margin:0">' + list.length + ' prompt</p></div>';
    h += list.length ? '<div class="plist two" style="margin-top:16px">' + list.map(p => pcard(p)).join('') + '</div>' : '<div class="panel" style="text-align:center;margin-top:16px"><p>Chưa có prompt nào. Bấm biểu tượng ' + ic('star') + ' trên prompt để lưu lại dùng sau.</p>' + link('Khám phá kho prompt', 'shine', '#prompts', 'grid') + '</div>';
    return h + credit();
  }
  function account() {
    const u = S.user, masked = u.phone.slice(0, 3) + '****' + u.phone.slice(-3);
    let h = '<div class="panel hud" style="text-align:center"><div class="avatar lg" style="margin:4px auto 12px">' + esc(u.name.split(' ').pop().charAt(0).toUpperCase()) + '</div><h1 style="font:900 22px/1.2 var(--ui)">' + esc(u.name) + '</h1><div class="muted" style="margin-top:6px">Zalo: ' + masked + '</div><div style="margin-top:10px">' + (S.pending ? '<span class="chip gold">' + ic('refresh') + ' Chờ đồng bộ máy chủ</span>' : '<span class="chip green">' + ic('check') + ' Đã đồng bộ</span>') + '</div>' +
      '<div class="stats"><div class="stat"><b class="gold-text">' + S.favs.length + '</b><span>Yêu thích</span></div><div class="stat"><b class="gold-text">' + S.recent.length + '</b><span>Đã xem</span></div><div class="stat"><b class="gold-text">' + Object.keys(S.vars).filter(k => S.vars[k]).length + '</b><span>Thông tin đã nhớ</span></div></div></div>';
    h += '<div class="sec-title">Cài đặt</div><div class="panel"><div class="row"><div class="ri">' + ic('volume') + '</div><div class="rt"><b>Âm thanh</b><small>Tiếng bấm nút và thông báo</small></div><button class="switch ' + (S.settings.sfx ? 'on' : '') + '" data-act="tgl" aria-label="Âm thanh"></button></div>' +
      '<div class="row"><div class="ri">' + ic('wand') + '</div><div class="rt"><b>Thông tin đã điền</b><small>Tên doanh nghiệp, khu vực… được nhớ để tự điền lần sau</small></div>' + btn('Xóa', 'sm steel', 'data-act="clearvars"') + '</div>' +
      (standalone() ? '' : '<div class="row"><div class="ri">' + ic('download') + '</div><div class="rt"><b>Cài app lên thiết bị</b><small>Mở toàn màn hình, dùng offline</small></div>' + btn('Cài đặt', 'sm', 'data-act="install"') + '</div>') + '</div>';
    h += '<div class="sec-title">Giới thiệu</div><div class="panel"><div class="row"><div class="ri">' + ic('info') + '</div><div class="rt"><b>Drabuff Prompt Hub</b><small>Phiên bản 1.0 · Phát triển bởi <b style="color:var(--gold)">Tân AI</b></small></div></div><div class="row"><div class="ri">' + ic('sparkle') + '</div><div class="rt"><b>Nội dung</b><small>' + fmt(STATS.prompts) + ' prompt · ' + STATS.terms + ' thuật ngữ · Biên soạn bởi Chuyên gia AI Nguyễn Văn Tân</small></div></div></div>';
    h += '<div style="margin-top:22px">' + btn('Đăng xuất', 'red block', 'data-act="logout"', 'logout') + '</div>' + credit();
    return h;
  }
  function admin() {
    return backRow('#account', 'Quản trị') + '<div class="panel hud"><span class="chip gold">' + ic('key') + ' Danh sách tài khoản</span><p class="muted">Nhập mã quản trị (biến ADMIN_KEY đã đặt trên Cloudflare) để xem và tải danh sách tài khoản đã đăng ký.</p><form data-form="admin" class="search3d">' + ic('key') + '<input id="ak" type="password" placeholder="Mã quản trị" autocomplete="off">' + btn('Xem', 'sm', 'type="submit"') + '</form><div id="aout" style="margin-top:16px"></div></div>' + credit();
  }
  async function loadAdmin(key) {
    const out = $('#aout'); out.innerHTML = '<p class="muted">Đang tải…</p>';
    try {
      const r = await fetch('api/users?format=json&key=' + encodeURIComponent(key));
      if (r.status === 401) { out.innerHTML = '<div class="err">Sai mã quản trị.</div>'; return; }
      const j = await r.json();
      out.innerHTML = '<p class="count-line">Tổng cộng <b>' + j.users.length + '</b> tài khoản</p><div class="btn-row">' + link('Tải file .txt', 'shine', 'api/users?key=' + encodeURIComponent(key), 'download') + link('Tải file .csv (Excel)', 'steel', 'api/users?format=csv&key=' + encodeURIComponent(key), 'table') + '</div><div class="table-wrap" style="margin-top:12px"><table class="users"><thead><tr><th>#</th><th>Họ tên</th><th>Số Zalo</th><th>Đăng ký</th><th>Lần cuối</th><th>Lượt</th></tr></thead><tbody>' +
        j.users.map((u, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(u.name) + '</td><td>' + esc(u.phone) + '</td><td>' + esc(u.createdVN || '') + '</td><td>' + esc(u.lastVN || '') + '</td><td>' + (u.visits || 1) + '</td></tr>').join('') + '</tbody></table></div>';
    } catch (e) { out.innerHTML = '<div class="err">Không kết nối được máy chủ. Chức năng này chỉ hoạt động sau khi đưa lên Cloudflare Pages có Functions và KV.</div>'; }
  }

  /* ------------------------------------------------------------ router */
  function paint(html, after) { root.innerHTML = html; if (after) after(); }
  const parse = () => location.hash.replace(/^#\/?/, '').split('/');
  function route() {
    const parts = parse(), r = parts[0] || '', arg = decodeURIComponent(parts.slice(1).join('/'));
    $$('.modal-bg').forEach(e => e.remove()); window.scrollTo(0, 0);
    if (!r) { if (!standalone()) { document.title = 'Drabuff Prompt Hub – Kho prompt & Từ điển AI'; return paint(landing(), drawQR); } return go(S.user ? '#home' : '#register'); }
    if (r === 'register') return paint(register());
    if (!S.user && r !== 'admin') { afterLogin = location.hash; return paint(register()); }
    document.title = 'Drabuff Prompt Hub';
    switch (r) {
      case 'home': return paint(shell(home(), 'home'));
      case 'prompts': return paint(shell(browse(arg), 'prompts'));
      case 'c': { const c = CMAP[arg]; return c ? paint(shell(category(c), 'prompts')) : go('#prompts'); }
      case 'p': { const p = PMAP[arg]; return p ? paint(shell(promptView(p), 'prompts'), () => promptAfter(p)) : go('#prompts'); }
      case 's': return paint(shell(searchScreen(arg), 'prompts'), () => { const i = $('#q'); if (i && !arg) i.focus(); });
      case 'glossary': return paint(shell(glossary(), 'glossary'), glossAfter);
      case 'favs': return paint(shell(favs(), 'favs'));
      case 'account': return paint(shell(account(), 'account'));
      case 'admin': return paint(shell(admin(), 'account'));
      default: return go('#home');
    }
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  addEventListener('hashchange', route);

  /* ------------------------------------------------------------ hành động */
  function toggleFav(id) { const on = !S.favs.includes(id); S.favs = on ? [id, ...S.favs] : S.favs.filter(x => x !== id); save(); toast(on ? 'Đã lưu vào Yêu thích' : 'Đã bỏ khỏi Yêu thích', on ? 'gold' : '', 'star'); return on; }
  const ACT = {
    install: () => doInstall(),
    itab(el) { INST_TAB = el.dataset.t; $$('[data-act="itab"]').forEach(b => { b.classList.toggle('cyan', b === el); b.classList.toggle('steel', b !== el); }); $('#inst-body').innerHTML = installBody(INST_TAB); drawQR(); },
    async copyLink() { const ok = await copyText(location.origin + location.pathname); toast(ok ? 'Đã sao chép liên kết' : 'Không sao chép được', '', 'link'); },
    mute(el) { S.settings.sfx = !S.settings.sfx; save(); Snd.set('sfx', S.settings.sfx); el.innerHTML = ic(S.settings.sfx ? 'volume' : 'mute'); },
    tgl(el) { S.settings.sfx = !S.settings.sfx; save(); Snd.set('sfx', S.settings.sfx); el.classList.toggle('on', S.settings.sfx); },
    async qcopy(el) { const p = PMAP[el.dataset.id]; const ok = await copyText(fillText(p.text, S.vars)); if (ok) { Snd.SFX.correct(); toast('Đã sao chép: ' + esc(p.t), 'gold', 'copy'); } },
    async copyp(el) { const p = PMAP[el.dataset.id]; const t = fillText(p.text, S.vars); const ok = await copyText(t); if (ok) { Snd.SFX.correct(); const left = phNames(t).length; toast(left ? 'Đã sao chép. Còn ' + left + ' ô [ ] chưa điền.' : 'Đã sao chép prompt hoàn chỉnh!', 'gold', 'copy'); } else toast('Không sao chép được, hãy bôi đen để sao chép', '', 'info'); },
    fav(el) { const on = toggleFav(el.dataset.id); el.classList.toggle('on', on); },
    favbig(el) { const on = toggleFav(el.dataset.id); el.classList.toggle('violet', on); el.classList.toggle('steel', !on); el.querySelector('span:last-child').textContent = on ? 'Đã lưu' : 'Lưu yêu thích'; },
    catf(el) { CAT_FILTER.f = el.dataset.f; route(); },
    clearvars() { S.vars = {}; save(); toast('Đã xóa thông tin đã điền', '', 'refresh'); route(); },
    skind(el) { SEARCH.kind = el.dataset.k; SEARCH.n = 40; route(); },
    suggest(el) { go('#s/' + encodeURIComponent(el.dataset.q)); },
    more() { SEARCH.n += 40; const y = scrollY; route(); window.scrollTo(0, y); },
    gl(el) { GL.letter = el.dataset.l; route(); },
    gcat(el) { GL.cat = el.dataset.c; route(); },
    async logout() { if (await modal('Đăng xuất?', '<p>Yêu thích và thông tin đã điền vẫn được giữ trên máy này.</p>', [{ label: 'Hủy', value: false }, { label: 'Đăng xuất', cls: 'red', value: true }])) { S.user = null; save(); go(''); } }
  };
  document.addEventListener('click', e => {
    Snd.init();
    const s = e.target.closest('.b3d,.cat-tile,.big-tile,.pcard,.nav a,.icon-btn,.switch,.seg a,[data-sfx]');
    if (s && !s.disabled && !e.target.closest('[data-act="qcopy"],[data-act="fav"]')) (s.dataset.sfx === 'tap' ? Snd.SFX.tap : Snd.SFX.click)();
    else if (e.target.closest('[data-sfx]')) Snd.SFX.tap();
    const a = e.target.closest('[data-act]');
    if (a && !a.disabled) { const fn = ACT[a.dataset.act]; if (fn) { e.preventDefault(); e.stopPropagation(); fn(a, e); } }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    if (f.dataset.form === 'search') { const q = $('#q', f).value.trim(); go('#s/' + encodeURIComponent(q)); }
    if (f.dataset.form === 'register') submitRegister(f);
    if (f.dataset.form === 'admin') loadAdmin($('#ak', f).value);
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  window.PromptHub = { state: () => S, stats: STATS };
  syncPending();
  route();
})();
