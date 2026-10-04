/* Âm thanh Z-LAB – tổng hợp bằng Web Audio: nhạc nền kinh dị + hiệu ứng (không cần file âm thanh). */
(function () {
  const S = { music: true, sfx: true };
  let ctx = null, master, musicBus, sfxBus, revIn, dlyIn, noiseBuf;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85; sfxBus.connect(master);
    const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = ctx.createConvolver(); conv.buffer = ir; revIn = ctx.createGain(); revIn.gain.value = 0.4; revIn.connect(conv); conv.connect(master);
    const dl = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); dl.delayTime.value = 0.48; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2200;
    dlyIn = ctx.createGain(); dlyIn.gain.value = 0.4; dlyIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
    document.addEventListener('visibilitychange', () => { if (ctx) document.hidden ? ctx.suspend() : ctx.resume(); });
    return ctx;
  }
  function tone(o) {
    const t = o.t != null ? o.t : ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
    if (o.det) osc.detune.value = o.det;
    const a = o.a || 0.005, d = o.d || 0.2, v = o.v || 0.2, r = o.r || 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.sus) { g.gain.setValueAtTime(v, t + Math.max(a, d)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, d) + r); } else g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    let node = osc;
    if (o.lp || o.bp || o.hp) { const fl = ctx.createBiquadFilter(); fl.type = o.lp ? 'lowpass' : o.bp ? 'bandpass' : 'highpass'; fl.frequency.setValueAtTime(o.lp || o.bp || o.hp, t); if (o.lp2) fl.frequency.exponentialRampToValueAtTime(o.lp2, t + (o.lpT || d)); fl.Q.value = o.q || 0.7; osc.connect(fl); node = fl; }
    if (o.lfo) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.lfo; lg.gain.value = o.lfoAmt || 20; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + a + d + r + 0.1); }
    node.connect(g); g.connect(o.out || sfxBus);
    if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    if (o.dly) { const s = ctx.createGain(); s.gain.value = o.dly; g.connect(s); s.connect(dlyIn); }
    osc.start(t); osc.stop(t + Math.max(a, d) + r + a + 0.1);
  }
  function noise(o) {
    const t = o.t != null ? o.t : ctx.currentTime, src = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    src.buffer = noiseBuf; fl.type = o.type || 'lowpass'; fl.frequency.setValueAtTime(o.f || 1000, t); fl.Q.value = o.q || 0.8;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + (o.d || 0.2));
    const v = o.v || 0.1, d = o.d || 0.2, a = o.a || 0.003;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    src.connect(fl); fl.connect(g); g.connect(o.out || sfxBus);
    if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    src.start(t, Math.random() * 1.5); src.stop(t + a + d + 0.1);
  }
  const ok = () => S.sfx && init();
  const SFX = {
    click() { if (!ok()) return; tone({ type: 'square', f: 320, f2: 140, d: 0.06, v: 0.08, lp: 1800 }); noise({ type: 'bandpass', f: 2400, d: 0.03, v: 0.05 }); tone({ type: 'sine', f: 90, f2: 55, d: 0.08, v: 0.15 }); },
    tap() { if (!ok()) return; tone({ type: 'triangle', f: 520, f2: 380, d: 0.05, v: 0.08 }); },
    squish() { if (!ok()) return; const t = ctx.currentTime; noise({ t, type: 'lowpass', f: 900, f2: 200, d: 0.22, v: 0.25, q: 4 }); tone({ t, type: 'sine', f: 180, f2: 60, d: 0.18, v: 0.25 }); tone({ t: t + 0.05, type: 'sine', f: 420, f2: 900, d: 0.06, v: 0.05 }); noise({ t: t + 0.08, type: 'bandpass', f: 300, d: 0.12, v: 0.1, q: 6 }); },
    bubble() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone({ t: t + i * 0.06, type: 'sine', f: 300 + Math.random() * 300, f2: 700 + Math.random() * 400, d: 0.05, v: 0.06 }); },
    growl() { if (!ok()) return; const t = ctx.currentTime;
      tone({ t, type: 'sawtooth', f: 95, f2: 62, d: 1.1, v: 0.22, a: 0.08, lp: 700, lfo: 23, lfoAmt: 18, sus: true, r: 0.4, rev: 0.4 });
      tone({ t, type: 'sawtooth', f: 141, f2: 88, d: 1.0, v: 0.12, a: 0.1, lp: 900, lfo: 31, lfoAmt: 25, sus: true, r: 0.4 });
      noise({ t, type: 'bandpass', f: 500, f2: 260, d: 1.3, v: 0.22, q: 3, a: 0.1, rev: 0.4 });
      noise({ t: t + 0.05, type: 'bandpass', f: 1400, f2: 700, d: 0.9, v: 0.08, q: 5 }); },
    thunder() { if (!ok()) return; const t = ctx.currentTime; noise({ t, type: 'highpass', f: 3000, d: 0.12, v: 0.35 }); noise({ t: t + 0.05, type: 'lowpass', f: 900, f2: 120, d: 2.6, v: 0.5, a: 0.02, rev: 0.6 }); tone({ t: t + 0.05, type: 'sine', f: 70, f2: 30, d: 1.8, v: 0.4 }); },
    zap() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 6; i++) { noise({ t: t + i * 0.09, type: 'highpass', f: 2500 + Math.random() * 3000, d: 0.07, v: 0.18 }); tone({ t: t + i * 0.09, type: 'sawtooth', f: 900 + Math.random() * 1200, f2: 200, d: 0.07, v: 0.06 }); } tone({ t, type: 'square', f: 60, d: 0.7, v: 0.06, lfo: 50, lfoAmt: 30, sus: true, r: 0.2 }); },
    heartbeat() { if (!ok()) return; const t = ctx.currentTime; [0, 0.22].forEach((o, i) => tone({ t: t + o, type: 'sine', f: i ? 55 : 62, f2: 38, d: 0.18, v: 0.45 })); },
    success() { if (!ok()) return; const t = ctx.currentTime; [57, 60, 64, 69].forEach((m, i) => tone({ t: t + i * 0.11, type: 'triangle', f: mtof(m), d: 0.6, v: 0.12, rev: 0.6, dly: 0.3 })); tone({ t: t + 0.45, type: 'sawtooth', f: mtof(45), d: 1.2, v: 0.08, lp: 900, sus: true, r: 0.8, rev: 0.5 }); },
    discover() { if (!ok()) return; const t = ctx.currentTime; [69, 72, 76, 81, 84].forEach((m, i) => tone({ t: t + i * 0.08, type: 'sine', f: mtof(m), d: 0.7, v: 0.08, rev: 0.7, dly: 0.4 })); noise({ t, type: 'highpass', f: 6000, d: 1.4, v: 0.05, rev: 0.6 }); },
    wrong() { if (!ok()) return; tone({ type: 'sawtooth', f: 180, f2: 70, d: 0.35, v: 0.12, lp: 600 }); },
    hit() { if (!ok()) return; noise({ type: 'lowpass', f: 1200, f2: 200, d: 0.15, v: 0.35 }); tone({ type: 'sine', f: 120, f2: 45, d: 0.15, v: 0.3 }); },
    page() { if (!ok()) return; noise({ type: 'bandpass', f: 600, f2: 1800, d: 0.25, v: 0.06, a: 0.06 }); }
  };
  /* nhạc nền */
  const SONGS = {
    lab: { bpm: 56, steps: 64,
      play(s, t, sp, out) {
        const bar = Math.floor(s / 16) % 4, st = s % 16, roots = [45, 46, 44, 41];
        if (st === 0) { const r = roots[bar]; [r - 12, r - 11.6].forEach(m => tone({ t, out, type: 'sawtooth', f: mtof(m), d: sp * 15.5, v: 0.05, a: 1.5, lp: 380, sus: true, r: 1.5, rev: 0.5 })); tone({ t, out, type: 'sine', f: mtof(r + 12), d: sp * 14, v: 0.02, a: 2, sus: true, r: 1.5, lfo: 5, lfoAmt: 6, rev: 0.7 }); }
        if (st === 0 || st === 3) tone({ t, out, type: 'sine', f: st ? 52 : 58, f2: 36, d: 0.2, v: 0.32 });
        if (st % 4 === 2 && Math.random() < 0.55) { const sc = [69, 70, 72, 75, 76, 77, 80, 81]; tone({ t, out, type: 'sine', f: mtof(sc[Math.floor(Math.random() * sc.length)] + 12), d: 0.9, v: 0.035, rev: 0.8, dly: 0.5 }); tone({ t, out, type: 'triangle', f: mtof(sc[Math.floor(Math.random() * sc.length)] + 24), d: 0.4, v: 0.012, rev: 0.8 }); }
        if (s % 32 === 20 && Math.random() < 0.6) noise({ t, out, type: 'bandpass', f: 900 + Math.random() * 900, f2: 400, d: 1.4, v: 0.04, q: 6, a: 0.4, rev: 0.7 });
        if (s % 64 === 48) tone({ t, out, type: 'sawtooth', f: mtof(33), f2: mtof(32), d: 3, v: 0.04, a: 1, lp: 200, sus: true, r: 1, rev: 0.6 });
      } },
    arena: { bpm: 128, steps: 32,
      play(s, t, sp, out) {
        const st = s % 16, bar = Math.floor(s / 16) % 2, root = [40, 41][bar];
        if (st % 4 === 0) tone({ t, out, type: 'sine', f: 110, f2: 42, glide: 0.18, d: 0.25, v: 0.45 });
        if (st === 4 || st === 12) { noise({ t, out, type: 'bandpass', f: 1600, d: 0.16, v: 0.15, rev: 0.3 }); tone({ t, out, type: 'triangle', f: 190, f2: 120, d: 0.1, v: 0.1 }); }
        if (st % 2 === 0) noise({ t, out, type: 'highpass', f: 7000, d: 0.03, v: 0.03 });
        if ([0, 3, 6, 10, 13].includes(st)) tone({ t, out, type: 'sawtooth', f: mtof(root), d: sp * 1.5, v: 0.09, lp: 500, lp2: 1800, lpT: 0.05, sus: true, r: 0.05 });
        if (st === 0) [root + 12, root + 15, root + 19].forEach(m => tone({ t, out, type: 'sawtooth', f: mtof(m), d: sp * 14, v: 0.02, a: 0.3, lp: 1500, sus: true, r: 0.3, rev: 0.4 }));
        if (st === 8 && bar) [0, 1, 2, 3].forEach(i => tone({ t: t + i * sp, out, type: 'sine', f: [150, 130, 115, 100][i], f2: 60, d: 0.15, v: 0.25 }));
      } }
  };
  const seq = { name: null, timer: null, step: 0, next: 0, gain: null, want: null };
  function schedule() { const song = SONGS[seq.name]; if (!song || !ctx) return; const sp = 60 / song.bpm / 4; while (seq.next < ctx.currentTime + 0.15) { song.play(seq.step % song.steps, seq.next, sp, seq.gain); seq.next += sp; seq.step++; } }
  const Music = {
    play(name) { seq.want = name; if (!S.music || !init()) return; if (seq.name === name) return; Music.stop(0.6, true); seq.name = name; seq.step = 0; seq.next = ctx.currentTime + 0.12; seq.gain = ctx.createGain(); seq.gain.gain.setValueAtTime(0.0001, ctx.currentTime); seq.gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2); seq.gain.connect(musicBus); seq.timer = setInterval(schedule, 30); schedule(); },
    stop(f, keep) { if (!keep) seq.want = null; if (seq.timer) clearInterval(seq.timer); seq.timer = null; seq.name = null; if (seq.gain && ctx) { const g = seq.gain, ff = f == null ? 0.8 : f; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ff); setTimeout(() => g.disconnect(), ff * 1000 + 300); } seq.gain = null; },
    get current() { return seq.name; }
  };
  window.ZSound = { init, SFX, Music, set(k, v) { S[k] = v; if (k === 'music') { if (!v) { const w = seq.want; Music.stop(0.3); seq.want = w; } else if (seq.want) Music.play(seq.want); } }, get: k => S[k] };
})();
