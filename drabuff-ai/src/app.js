/* Drabuff AI — wizard engine (shared by both pages) */
(function () {
  var P = window.PAGE, C = window.DRABUFF;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  window.UI = { esc: esc };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var KEY = 'drabuff-' + P.id + '-v1', A = {};
  try { A = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { A = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} }

  var app = $('#app'), step = 0, steps = P.steps;

  /* ---------- render shell ---------- */
  app.innerHTML =
    '<section class="hero" id="hero">' +
      '<div class="hero-txt reveal">' +
        '<p class="eyebrow"><span class="dot"></span>' + P.kicker + '</p>' +
        '<h1>' + P.title + '</h1>' +
        '<p class="lead">' + P.lead + '</p>' +
        '<div class="hero-cta"><button class="btn primary" id="start" type="button">' + P.startLabel + ' <span class="arr">→</span></button>' +
        '<span class="hint mono">' + P.hint + '</span></div>' +
        '<ul class="facts">' + P.facts.map(function (f) { return '<li><b>' + f[0] + '</b><span>' + f[1] + '</span></li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="hero-vis reveal" style="animation-delay:.12s"><div class="sample" data-tilt>' + P.sample + '</div></div>' +
    '</section>' +
    '<section class="wiz" id="wiz" hidden>' +
      '<aside class="rail" aria-label="Tiến trình"><p class="rail-h">TIẾN TRÌNH · ' + steps.length + ' KHỐI</p><ol class="stack">' +
        steps.map(function (s, i) { return '<li data-i="' + i + '"><span class="blk"></span><span class="t">' + s.title + '</span></li>'; }).join('') +
      '</ol></aside>' +
      '<div class="panel">' +
        '<div class="panel-h"><span class="step-no mono"></span><h2 class="step-title"></h2><p class="step-sub"></p></div>' +
        '<div class="qs"></div>' +
        '<p class="err" role="alert" hidden></p>' +
        '<div class="nav"><button class="btn ghost" id="back" type="button">← Quay lại</button><span class="cnt"></span><button class="btn primary" id="next" type="button">Tiếp tục <span class="arr">→</span></button></div>' +
      '</div>' +
    '</section>' +
    '<section class="think" id="think" hidden><div class="think-box">' +
      '<p class="eyebrow"><span class="dot"></span>DRABUFF AI ENGINE · ĐANG XỬ LÝ</p>' +
      '<h2>' + P.thinkTitle + '</h2><ul class="log mono" id="log"></ul><div class="bar"><i id="bar"></i></div>' +
    '</div></section>' +
    '<section class="result" id="result" hidden></section>';

  /* ---------- questions ---------- */
  function val(q) { return A[q.id]; }
  function qHTML(q) {
    var v = val(q);
    var lab = q.type === 'text' || q.type === 'tel' || q.type === 'textarea' || q.type === 'range'
      ? '<label class="q-l" for="q_' + q.id + '">' + q.label + (q.req ? '<i>*</i>' : '') + '</label>'
      : '<span class="q-l" id="ql_' + q.id + '">' + q.label + (q.req ? '<i>*</i>' : '') + '</span>';
    var tag = q.type === 'multi' ? '<span class="q-tag">Chọn nhiều' + (q.max ? ' · tối đa ' + q.max : '') + '</span>' : q.type === 'single' ? '<span class="q-tag">Chọn 1</span>' : '';
    var head = '<div class="q-h">' + tag + lab + (q.help ? '<p class="q-help">' + q.help + '</p>' : '') + '</div>';
    var cls = 'q' + (q.half ? ' half' : '');
    if (q.type === 'text' || q.type === 'tel') {
      return '<div class="' + cls + '" data-q="' + q.id + '">' + head + '<input class="inp" id="q_' + q.id + '" type="' + q.type + '"' +
        (q.type === 'tel' ? ' inputmode="tel" autocomplete="tel"' : ' autocomplete="' + (q.ac || 'off') + '"') +
        ' placeholder="' + esc(q.ph || '') + '" value="' + esc(v || '') + '" maxlength="120"></div>';
    }
    if (q.type === 'textarea') {
      return '<div class="' + cls + '" data-q="' + q.id + '">' + head + '<textarea class="ta" id="q_' + q.id + '" placeholder="' + esc(q.ph || '') + '" maxlength="600">' + esc(v || '') + '</textarea>' +
        (q.sugs ? '<div class="sugs">' + q.sugs.map(function (s) { return '<button type="button" class="sug" data-s="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>' : '') + '</div>';
    }
    if (q.type === 'range') {
      if (v == null) { v = q.def; A[q.id] = v; }
      return '<div class="' + cls + '" data-q="' + q.id + '">' + head + '<div class="rng"><input type="range" id="q_' + q.id + '" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + v + '">' +
        '<output class="mono" for="q_' + q.id + '">' + fmtR(q, v) + '</output><div class="rng-l"><span>' + q.min + '</span><span>' + q.max + (q.plus ? '+' : '') + '</span></div></div></div>';
    }
    // single / multi
    return '<div class="' + cls + '" data-q="' + q.id + '" role="group" aria-labelledby="ql_' + q.id + '">' + head +
      '<div class="opts' + (q.wide ? ' wide' : '') + '">' + q.options.map(function (o) {
        var on = q.type === 'single' ? v === o.v : (v || []).indexOf(o.v) > -1;
        return '<button type="button" class="opt" data-v="' + o.v + '" aria-pressed="' + on + '"><span class="o-l">' + o.label + '</span>' +
          (o.desc ? '<span class="o-d">' + o.desc + '</span>' : '') + '<span class="o-k" aria-hidden="true">' + (q.type === 'multi' ? '✓' : '●') + '</span></button>';
      }).join('') + '</div></div>';
  }
  function fmtR(q, v) { return (Number(v) >= q.max && q.plus ? q.max + '+' : Number(v).toLocaleString('vi-VN')) + '<small>' + (q.unit || '') + '</small>'; }
  function qById(id) { var s = steps[step]; for (var i = 0; i < s.qs.length; i++) if (s.qs[i].id === id) return s.qs[i]; }
  function rangeFill(inp) { var p = (inp.value - inp.min) / (inp.max - inp.min) * 100; inp.style.setProperty('--p', p + '%'); }

  function renderStep() {
    var s = steps[step];
    $('.step-no').textContent = 'KHỐI ' + String(step + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('.step-title').innerHTML = s.title;
    $('.step-sub').innerHTML = s.sub || '';
    $('.qs').innerHTML = s.qs.map(qHTML).join('');
    $$('.qs input[type=range]').forEach(rangeFill);
    $('.err').hidden = true;
    $('#back').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('#next').innerHTML = step === steps.length - 1 ? P.finishLabel + ' <span class="arr">→</span>' : 'Tiếp tục <span class="arr">→</span>';
    $$('.stack li').forEach(function (li, i) { li.className = i < step ? 'done' : i === step ? 'cur' : ''; });
    $('.cnt').textContent = s.qs.length + ' câu hỏi';
    window.Scene3D.setProgress(0.12 + step / steps.length * 0.7);
  }

  var qsEl = $('.qs');
  qsEl.addEventListener('click', function (e) {
    var sug = e.target.closest('.sug');
    if (sug) {
      var qd = sug.closest('.q'), ta = $('textarea', qd), cur = ta.value.trim();
      ta.value = cur ? cur.replace(/[.;,\s]*$/, '') + '; ' + sug.dataset.s : sug.dataset.s;
      A[qd.dataset.q] = ta.value; save(); ta.focus(); return;
    }
    var b = e.target.closest('.opt'); if (!b) return;
    var qe = b.closest('.q'), q = qById(qe.dataset.q), v = b.dataset.v;
    qe.classList.remove('bad');
    if (q.type === 'single') {
      A[q.id] = v; $$('.opt', qe).forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
    } else {
      var arr = (A[q.id] || []).slice(), ix = arr.indexOf(v);
      if (ix > -1) arr.splice(ix, 1);
      else {
        if (q.max && arr.length >= q.max) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); showErr('Câu này chọn tối đa ' + q.max + ' mục — bỏ bớt 1 mục trước khi chọn mục mới.'); return; }
        if (q.exclusive && q.exclusive.indexOf(v) > -1) arr = [];
        else if (q.exclusive) arr = arr.filter(function (x) { return q.exclusive.indexOf(x) < 0; });
        arr.push(v);
      }
      A[q.id] = arr;
      $$('.opt', qe).forEach(function (o) { o.setAttribute('aria-pressed', arr.indexOf(o.dataset.v) > -1); });
    }
    save();
  });
  qsEl.addEventListener('input', function (e) {
    var qe = e.target.closest('.q'); if (!qe) return;
    var q = qById(qe.dataset.q); qe.classList.remove('bad');
    if (q.type === 'range') { A[q.id] = Number(e.target.value); $('output', qe).innerHTML = fmtR(q, e.target.value); rangeFill(e.target); }
    else A[q.id] = e.target.value;
    save();
  });

  function showErr(m) { var e = $('.err'); e.textContent = m; e.hidden = false; }
  function validPhone(s) { var d = String(s || '').replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0'); return /^0[35789]\d{8}$/.test(d); }
  function validate() {
    var s = steps[step], bad = [];
    s.qs.forEach(function (q) {
      var v = A[q.id], ok = true;
      if (q.req) ok = Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== '';
      if (ok && q.type === 'tel' && v) ok = validPhone(v);
      if (!ok) { bad.push(q); $('[data-q="' + q.id + '"]').classList.add('bad'); }
    });
    if (bad.length) {
      var q = bad[0];
      showErr(q.type === 'tel' && A[q.id] ? 'Số Zalo chưa đúng định dạng. Nhập 10 số, ví dụ 0912 345 678.' : 'Vui lòng hoàn thành: ' + q.label.replace(/<[^>]+>/g, '') + '.');
      var el = $('[data-q="' + q.id + '"] input, [data-q="' + q.id + '"] textarea, [data-q="' + q.id + '"] .opt'); if (el) el.focus();
      return false;
    }
    return true;
  }

  function go(id) { var el = document.getElementById(id); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }

  $('#start').addEventListener('click', function () {
    $('#wiz').hidden = false; $('#result').hidden = true; $('#think').hidden = true;
    step = 0; renderStep(); window.Scene3D.setMode('idle'); go('wiz');
  });
  $('#back').addEventListener('click', function () { if (step > 0) { step--; renderStep(); go('wiz'); } });
  $('#next').addEventListener('click', function () {
    if (!validate()) return;
    if (step < steps.length - 1) { step++; renderStep(); go('wiz'); }
    else run();
  });

  /* ---------- engine ---------- */
  function run() {
    $$('.stack li').forEach(function (li) { li.className = 'done'; });
    $('#wiz').hidden = true; var th = $('#think'); th.hidden = false; go('think');
    window.Scene3D.setMode('thinking');
    var lines = P.logs(A), log = $('#log'), bar = $('#bar'), i = 0; log.innerHTML = ''; bar.style.width = '0';
    var tick = function () {
      if (i < lines.length) {
        var li = document.createElement('li'); if (i === lines.length - 1) li.className = 'ok';
        li.innerHTML = '<b>' + (i === lines.length - 1 ? '[OK]' : '[' + String(i + 1).padStart(2, '0') + ']') + '</b><span>' + lines[i] + '</span>';
        log.appendChild(li); i++; bar.style.width = (i / lines.length * 100) + '%';
        setTimeout(tick, reduce ? 120 : 420 + Math.random() * 260);
      } else setTimeout(show, 500);
    };
    tick();
  }

  function code(prefix) {
    var s = (A.company || '') + (A.zalo || '') + (A.industry || ''), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return prefix + '-' + h.toString(36).toUpperCase().slice(-4).padStart(4, '0');
  }

  function show() {
    var R = P.generate(A, code(P.codePrefix));
    var zDigits = C.zalo.replace(/\D/g, '');
    var res = $('#result');
    res.innerHTML = R.html +
      '<section class="panel cta reveal" id="contact"><div class="cta-l">' +
        '<p class="eyebrow"><span class="dot"></span>BƯỚC TIẾP THEO</p>' +
        '<h2>' + P.cta.title + '</h2><p>' + P.cta.text + '</p>' +
        '<ol class="cta-steps"><li>Bấm <b>Sao chép đề xuất</b> để lưu bản tóm tắt.</li><li>Nhắn Zalo <b>' + C.display + '</b>, dán bản tóm tắt kèm mã <b>' + R.code + '</b>.</li><li>Chuyên gia ' + C.brand + ' liên hệ lại để ' + P.cta.next + '.</li></ol>' +
      '</div><div class="cta-r">' +
        '<div class="idbox"><div><span>MÃ ĐỀ XUẤT</span><b>' + R.code + '</b></div><div class="z"><span>ZALO ' + C.brand.toUpperCase() + '</span><b>' + C.display + '</b></div></div>' +
        '<a class="btn primary" href="https://zalo.me/' + zDigits + '" target="_blank" rel="noopener">Nhắn Zalo cho ' + C.brand + ' <span class="arr">→</span></a>' +
        '<button class="btn ghost" id="copy" type="button">Sao chép đề xuất</button>' +
        '<p class="copied" id="copied" aria-live="polite"></p>' +
        '<textarea id="sumtxt" readonly hidden></textarea>' +
        '<button class="btn link" id="redo" type="button">Làm lại khảo sát</button>' +
      '</div></section>';
    $('#think').hidden = true; res.hidden = false;
    window.Scene3D.setMode('done');
    go('result');
    $('#sumtxt').value = R.summary;
    $('#copy').addEventListener('click', function () {
      var t = R.summary, ok = function () { $('#copied').textContent = 'Đã sao chép. Mở Zalo và dán vào tin nhắn gửi ' + C.brand + '.'; };
      var fb = function () { var ta = $('#sumtxt'); ta.hidden = false; ta.focus(); ta.select(); $('#copied').textContent = 'Trình duyệt chặn sao chép tự động — bản tóm tắt đã được bôi đen, nhấn Ctrl/⌘ + C.'; };
      try { navigator.clipboard.writeText(t).then(ok, fb); } catch (e) { fb(); }
    });
    $('#redo').addEventListener('click', function () { $('#start').click(); });
    if (C.webhook) {
      try { fetch(C.webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ page: P.id, code: R.code, at: new Date().toISOString(), answers: A, summary: R.summary }) }).catch(function () {}); } catch (e) {}
    }
    bindTilt();
  }

  /* ---------- 3D tilt ---------- */
  function bindTilt() {
    if (reduce || !(window.matchMedia && matchMedia('(pointer:fine)').matches)) return;
    $$('[data-tilt]').forEach(function (el) {
      if (el._t) return; el._t = 1;
      var host = el.parentElement;
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 26 - 6) + 'deg'); el.style.setProperty('--rx', (-y * 20 + 4) + 'deg');
      });
      host.addEventListener('pointerleave', function () { el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); });
    });
  }
  bindTilt();
})();
