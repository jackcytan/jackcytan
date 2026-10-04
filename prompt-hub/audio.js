/* Âm thanh Tân AI Academy – tổng hợp 100% bằng Web Audio (không cần file nhạc).
   SFX.click/tap/correct/wrong/flip/success/fanfare/tick/whoosh · Music.play('exam'|'honor') · Music.stop() */
(function () {
  const S = { music: true, sfx: true };
  let ctx = null, master, musicBus, sfxBus, revIn, dlyIn, noiseBuf;

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.25;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    // reverb
    const len = Math.floor(ctx.sampleRate * 2.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    revIn = ctx.createGain(); revIn.gain.value = 0.32; revIn.connect(conv); conv.connect(master);
    // delay
    const dl = ctx.createDelay(1.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    dl.delayTime.value = 0.34; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2600;
    dlyIn = ctx.createGain(); dlyIn.gain.value = 0.35;
    dlyIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(master);
    // noise
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // iOS unlock: phát 1 buffer im lặng
    const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
    return ctx;
  }

  // ---- voice helpers -------------------------------------------------------
  function tone(o) {
    const t = o.t != null ? o.t : ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
    if (o.det) osc.detune.value = o.det;
    const a = o.a || 0.005, d = o.d || 0.2, v = o.v || 0.2, r = o.r || 0.08;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.sus) { g.gain.setValueAtTime(v, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + r); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    let node = osc;
    if (o.lp || o.hp || o.bp) {
      const fl = ctx.createBiquadFilter();
      fl.type = o.lp ? 'lowpass' : o.hp ? 'highpass' : 'bandpass';
      fl.frequency.setValueAtTime(o.lp || o.hp || o.bp, t);
      if (o.lp2) fl.frequency.exponentialRampToValueAtTime(o.lp2, t + (o.lpT || d));
      fl.Q.value = o.q || 0.7;
      osc.connect(fl); node = fl;
    }
    node.connect(g);
    g.connect(o.out || sfxBus);
    if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    if (o.dly) { const s = ctx.createGain(); s.gain.value = o.dly; g.connect(s); s.connect(dlyIn); }
    osc.start(t); osc.stop(t + a + d + r + 0.05);
  }
  function noise(o) {
    const t = o.t != null ? o.t : ctx.currentTime;
    const src = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    src.buffer = noiseBuf;
    fl.type = o.type || 'highpass'; fl.frequency.setValueAtTime(o.f || 4000, t); fl.Q.value = o.q || 0.8;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
    const v = o.v || 0.1, d = o.d || 0.05;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(o.out || sfxBus);
    if (o.rev) { const s = ctx.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revIn); }
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.05);
  }
  function ok() { return S.sfx && init(); }

  // ---- SFX -----------------------------------------------------------------
  const SFX = {
    click() { if (!ok()) return; const p = 1 + (Math.random() - 0.5) * 0.08;
      tone({ type: 'triangle', f: 1250 * p, f2: 520 * p, glide: 0.06, d: 0.07, v: 0.22 });
      tone({ type: 'sine', f: 180, f2: 90, d: 0.06, v: 0.18 });
      noise({ f: 5000, d: 0.025, v: 0.05 }); },
    tap() { if (!ok()) return; tone({ type: 'sine', f: 880, f2: 660, d: 0.06, v: 0.16 }); noise({ f: 6000, d: 0.02, v: 0.03 }); },
    correct() { if (!ok()) return; const t = ctx.currentTime;
      [76, 83, 88].forEach((m, i) => { tone({ t: t + i * 0.075, type: 'triangle', f: mtof(m), d: 0.35, v: 0.17, rev: 0.4 }); tone({ t: t + i * 0.075, type: 'sine', f: mtof(m + 12), d: 0.25, v: 0.05 }); }); },
    wrong() { if (!ok()) return; const t = ctx.currentTime;
      tone({ t, type: 'sawtooth', f: 220, f2: 110, d: 0.3, v: 0.12, lp: 900 });
      tone({ t: t + 0.02, type: 'square', f: 233, f2: 104, d: 0.3, v: 0.05, lp: 700 }); },
    flip() { if (!ok()) return; noise({ type: 'bandpass', f: 700, f2: 3200, d: 0.2, v: 0.12, q: 1.2 }); tone({ type: 'sine', f: 500, f2: 900, d: 0.1, v: 0.05 }); },
    whoosh() { if (!ok()) return; noise({ type: 'bandpass', f: 400, f2: 2400, d: 0.35, v: 0.07, q: 0.9, a: 0.1 }); },
    tick() { if (!ok()) return; tone({ type: 'sine', f: 1500, d: 0.03, v: 0.1 }); },
    success() { if (!ok()) return; const t = ctx.currentTime;
      [72, 76, 79, 84].forEach((m, i) => tone({ t: t + i * 0.09, type: 'triangle', f: mtof(m), d: 0.4, v: 0.16, rev: 0.45 }));
      [60, 64, 67, 72].forEach(m => tone({ t: t + 0.38, type: 'sawtooth', f: mtof(m), d: 0.9, v: 0.05, lp: 2200, sus: true, r: 0.8, rev: 0.5 })); },
    fanfare() { if (!ok()) return; const t = ctx.currentTime;
      const brass = (tt, ms, dur, v) => ms.forEach(m => { tone({ t: tt, type: 'sawtooth', f: mtof(m), d: dur, v: v, lp: 700, lp2: 3200, lpT: 0.08, sus: true, r: 0.25, rev: 0.35 }); tone({ t: tt, type: 'sawtooth', f: mtof(m), det: 9, d: dur, v: v * 0.6, lp: 900, lp2: 2800, lpT: 0.1, sus: true, r: 0.25 }); });
      brass(t, [67, 72], 0.12, 0.07); brass(t + 0.16, [67, 72], 0.12, 0.07); brass(t + 0.32, [67, 72], 0.12, 0.07);
      brass(t + 0.5, [64, 67, 72, 76], 1.1, 0.07);
      tone({ t: t + 0.5, type: 'sine', f: 65, f2: 40, d: 0.5, v: 0.4 });
      noise({ t: t + 0.5, type: 'lowpass', f: 9000, d: 1.6, v: 0.05, rev: 0.6 });
      [88, 91, 96, 100].forEach((m, i) => tone({ t: t + 0.6 + i * 0.07, type: 'triangle', f: mtof(m), d: 0.5, v: 0.05, rev: 0.6 })); },
    sparkle() { if (!ok()) return; const t = ctx.currentTime;
      for (let i = 0; i < 7; i++) tone({ t: t + i * 0.05, type: 'sine', f: mtof(84 + [0, 4, 7, 12, 16, 19, 24][i]), d: 0.3, v: 0.06, rev: 0.6 }); }
  };

  // ---- Music sequencer -----------------------------------------------------
  const SONGS = {
    /* Nhạc khi thi: lo-fi tập trung, La thứ, 86 BPM */
    exam: {
      bpm: 86, steps: 128,
      chords: [[57, 60, 64, 67], [57, 60, 64, 65], [55, 60, 62, 64], [55, 59, 62, 64]],
      bass: [45, 41, 48, 43],
      play(s, t, sp, out) {
        const ci = Math.floor(s / 32) % 4, ch = this.chords[ci], st = s % 16;
        if (s % 32 === 0) ch.forEach(m => { tone({ t, out, type: 'sawtooth', f: mtof(m), d: sp * 30, v: 0.022, a: 1.2, lp: 1000, sus: true, r: 1.6, rev: 0.5 }); tone({ t, out, type: 'sawtooth', f: mtof(m), det: 8, d: sp * 30, v: 0.016, a: 1.4, lp: 900, sus: true, r: 1.6 }); });
        if (s % 2 === 0) { const pat = [0, 1, 2, 3, 2, 1, 3, 2]; const m = ch[pat[(s / 2) % 8]] + 12; tone({ t, out, type: 'triangle', f: mtof(m), d: 0.28, v: 0.045, dly: 0.5, rev: 0.25 }); }
        if (st === 0 || st === 10) tone({ t, out, type: 'sine', f: mtof(this.bass[ci]), d: 0.5, v: 0.16, a: 0.01 });
        if (st === 0 || st === 7 || st === 10) tone({ t, out, type: 'sine', f: 120, f2: 42, glide: 0.14, d: 0.18, v: 0.28 });
        if (st === 4 || st === 12) noise({ t, out, type: 'bandpass', f: 1800, d: 0.12, v: 0.05, q: 0.7, rev: 0.25 });
        if (s % 2 === 0) noise({ t, out, f: 7500, d: st % 4 === 2 ? 0.06 : 0.025, v: 0.018 });
        if (s % 64 === 48) [88, 91].forEach((m, i) => tone({ t: t + i * sp * 2, out, type: 'sine', f: mtof(m), d: 0.9, v: 0.03, rev: 0.7, dly: 0.4 }));
      }
    },
    /* Nhạc vinh danh: hùng tráng, Đô trưởng, 104 BPM */
    honor: {
      bpm: 104, steps: 64,
      chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]],
      roots: [36, 43, 45, 41],
      mel: [[[76, 0, 6], [74, 6, 2], [72, 8, 4], [79, 12, 4]], [[79, 0, 6], [81, 6, 2], [83, 8, 4], [86, 12, 4]], [[84, 0, 6], [83, 6, 2], [81, 8, 4], [76, 12, 4]], [[77, 0, 4], [81, 4, 4], [79, 8, 8]]],
      play(s, t, sp, out) {
        const bar = Math.floor(s / 16) % 4, st = s % 16, ch = this.chords[bar];
        if (st === 0) ch.concat(ch.map(m => m - 12)).forEach(m => { tone({ t, out, type: 'sawtooth', f: mtof(m), d: sp * 15, v: 0.018, a: 0.25, lp: 2400, sus: true, r: 0.5, rev: 0.5 }); tone({ t, out, type: 'sawtooth', f: mtof(m), det: -10, d: sp * 15, v: 0.012, a: 0.3, lp: 2000, sus: true, r: 0.5 }); });
        if ([0, 3, 6, 10].includes(st)) ch.forEach(m => tone({ t, out, type: 'sawtooth', f: mtof(m), d: sp * 1.6, v: 0.03, lp: 600, lp2: 3400, lpT: 0.05, sus: true, r: 0.12, rev: 0.3 }));
        this.mel[bar].forEach(n => { if (n[1] === st) { tone({ t, out, type: 'triangle', f: mtof(n[0]), d: sp * n[2] * 0.95, v: 0.07, sus: true, r: 0.3, rev: 0.5, dly: 0.25 }); tone({ t, out, type: 'sine', f: mtof(n[0] + 12), d: sp * n[2] * 0.8, v: 0.025, sus: true, r: 0.3, rev: 0.5 }); } });
        if (st === 0 || st === 8) tone({ t, out, type: 'sawtooth', f: mtof(this.roots[bar]), d: sp * 5, v: 0.09, lp: 420, sus: true, r: 0.1 });
        if (st === 6 || st === 14) tone({ t, out, type: 'sawtooth', f: mtof(this.roots[bar] + 12), d: sp * 1.5, v: 0.07, lp: 500, sus: true, r: 0.08 });
        if (st === 0 || st === 8 || st === 11) tone({ t, out, type: 'sine', f: 110, f2: 40, glide: 0.2, d: 0.3, v: 0.42 });
        if (st === 4 || st === 12) { noise({ t, out, type: 'bandpass', f: 2000, d: 0.18, v: 0.13, q: 0.6, rev: 0.4 }); tone({ t, out, type: 'triangle', f: 190, f2: 140, d: 0.1, v: 0.08 }); }
        if (s % 2 === 0) noise({ t, out, f: 8000, d: st % 4 === 2 ? 0.09 : 0.03, v: 0.025 });
        if (bar === 3 && st >= 12) tone({ t, out, type: 'sine', f: [196, 175, 147, 131][st - 12], f2: 70, glide: 0.18, d: 0.2, v: 0.3, rev: 0.3 });
        if (s % 64 === 0) noise({ t, out, type: 'highpass', f: 5000, d: 1.4, v: 0.05, rev: 0.6 });
      }
    }
  };

  const seq = { name: null, timer: null, step: 0, next: 0, gain: null, want: null };
  function schedule() {
    const song = SONGS[seq.name]; if (!song || !ctx) return;
    const sp = 60 / song.bpm / 4;
    while (seq.next < ctx.currentTime + 0.15) {
      song.play(seq.step % song.steps, seq.next, sp, seq.gain);
      seq.next += sp; seq.step++;
    }
  }
  const Music = {
    play(name) {
      seq.want = name;
      if (!S.music || !init()) return;
      if (seq.name === name) return;
      Music.stop(0.4);
      seq.name = name; seq.step = 0; seq.next = ctx.currentTime + 0.12;
      seq.gain = ctx.createGain(); seq.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      seq.gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      seq.gain.connect(musicBus);
      seq.timer = setInterval(schedule, 30); schedule();
    },
    stop(fade, keepWant) {
      if (!keepWant) seq.want = null;
      if (seq.timer) clearInterval(seq.timer);
      seq.timer = null; seq.name = null;
      if (seq.gain && ctx) { const g = seq.gain, f = fade == null ? 0.8 : fade; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + f); setTimeout(() => g.disconnect(), f * 1000 + 300); }
      seq.gain = null;
    },
    get current() { return seq.name; }
  };

  window.Sound = {
    init, SFX, Music,
    set(k, v) {
      S[k] = v;
      if (k === 'music') { if (!v) { const w = seq.want; Music.stop(0.3); seq.want = w; } else if (seq.want) Music.play(seq.want); }
    },
    get: k => S[k]
  };
})();
