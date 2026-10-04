/* Drabuff AI — enterprise AI service catalogue app */
(function () {
  var C = window.DRABUFF, CATS = window.CATS, SV = window.SERVICES, LAYERS = window.LAYERS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var byId = {}; SV.forEach(function (s) { byId[s.id] = s; });
  var catById = {}; CATS.forEach(function (c) { catById[c.id] = c; });
  var zDigits = C.zalo.replace(/\D/g, '');

  var KEY = 'drabuff-catalog-v1', st = { wish: [], seen: [] };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) st = { wish: raw.wish || [], seen: raw.seen || [] }; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var curTab = 'cx', cur = 'chatbot';
  var app = $('#app');

  /* ---------- static sections ---------- */
  var isoLayers = LAYERS.slice().reverse(); // bottom slab = platform
  app.innerHTML =
    '<section class="hero" id="hero">' +
      '<div class="hero-txt reveal">' +
        '<p class="eyebrow"><span class="dot"></span>DRABUFF AI · BẢN ĐỒ DỊCH VỤ AI DOANH NGHIỆP</p>' +
        '<h1>Toàn bộ AI cho doanh nghiệp, <em>từ A đến Z</em></h1>' +
        '<p class="lead">' + SV.length + ' dịch vụ, từ chatbot, tự động hóa, robot phần mềm, AI Agent đến LLM trên cloud riêng và máy chủ on-premise. Mỗi dịch vụ có <b>sơ đồ hoạt động từng bước</b>, giải thích bằng ngôn ngữ đời thường, ví dụ thực tế và thời gian triển khai.</p>' +
        '<div class="hero-cta"><a class="btn primary" href="#catalog">Khám phá ' + SV.length + ' dịch vụ <span class="arr">→</span></a><a class="btn ghost" href="#contact">Nhờ Drabuff AI tư vấn</a></div>' +
        '<ul class="facts"><li><b>' + SV.length + '</b><span>dịch vụ AI triển khai</span></li><li><b>' + CATS.length + ' nhóm</b><span>từ điểm chạm đến hạ tầng</span></li><li><b>' + LAYERS.length + ' tầng</b><span>kiến trúc AI doanh nghiệp</span></li></ul>' +
      '</div>' +
      '<div class="hero-vis reveal" style="animation-delay:.12s"><div class="iso-wrap"><div class="iso" id="iso">' +
        isoLayers.map(function (l, i) {
          var li = LAYERS.indexOf(l);
          return '<button type="button" class="slab' + (i === 0 ? ' base' : '') + '" style="--i:' + i + '" data-ly="' + li + '" aria-label="Tầng ' + (li + 1) + ': ' + l.n + '"><span class="side"></span><span class="side r"></span><span class="top"><span><small>TẦNG ' + String(li + 1).padStart(2, '0') + '</small><b>' + l.n + '</b></span></span></button>';
        }).join('') +
      '</div><span class="iso-cap">BẤM VÀO TỪNG TẦNG ĐỂ XEM</span></div></div>' +
    '</section>' +

    '<section class="sec" id="catalog">' +
      '<div class="sec-top"><p class="eyebrow"><span class="dot"></span>DANH MỤC DỊCH VỤ</p><h2>Bấm vào một dịch vụ để xem nó hoạt động thế nào</h2>' +
      '<p>Chọn nhóm, rồi bấm phím dịch vụ. Sơ đồ bên dưới chạy từng bước để bạn thấy dữ liệu đi đâu, AI làm gì và con người can thiệp ở đâu.</p></div>' +
      '<div class="tabs" role="tablist" aria-label="Nhóm dịch vụ">' +
        '<button type="button" class="tab" role="tab" data-tab="all">Tất cả <span class="ct">' + SV.length + '</span></button>' +
        CATS.map(function (c) { return '<button type="button" class="tab" role="tab" data-tab="' + c.id + '">' + c.n + ' <span class="ct">' + SV.filter(function (s) { return s.cat === c.id; }).length + '</span></button>'; }).join('') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline"><p class="cat-desc" id="catDesc"></p><span class="explored" id="explored"></span></div>' +
      '<div class="keys" id="keys"></div>' +
      '<article class="panel viewer" id="viewer" aria-live="polite"></article>' +
    '</section>' +

    '<section class="sec" id="arch">' +
      '<div class="sec-top"><p class="eyebrow"><span class="dot"></span>BỨC TRANH TỔNG THỂ</p><h2>Các dịch vụ AI ghép lại với nhau như thế nào</h2>' +
      '<p>Đọc từ trên xuống: yêu cầu bắt đầu ở nơi khách hàng và nhân viên chạm vào, đi xuống các lớp xử lý, tới "bộ não" AI ở dưới cùng, rồi kết quả đi ngược lên. Bấm bất kỳ ô nào để xem chi tiết.</p></div>' +
      '<div class="arch2"><div class="stack2">' +
        LAYERS.map(function (l, i) {
          var arrow = i < LAYERS.length - 1 ? '<div class="ly-arrow" aria-hidden="true"><span class="dn"><em style="font-style:normal">giao việc</em><i></i></span><span class="up"><i></i><em style="font-style:normal">trả kết quả</em></span></div>' : '';
          return '<div class="ly" id="ly-' + i + '"><div class="ly-h"><span class="mono">TẦNG ' + String(i + 1).padStart(2, '0') + '</span><h4>' + l.n + '</h4><p>' + l.d + '</p></div><div class="ly-b">' +
            l.ids.map(function (id) { return '<button type="button" class="chip2" data-open="' + id + '"><span>' + byId[id].code + '</span>' + byId[id].n + '</button>'; }).join('') + '</div></div>' + arrow;
        }).join('') +
      '</div><aside class="gov"><span class="mono">XUYÊN SUỐT MỌI TẦNG</span><h4>Chiến lược, quản trị & con người</h4><p>Không thuộc riêng tầng nào: quyết định làm gì, dùng an toàn ra sao, đào tạo ai và ai chăm sóc hệ thống.</p><div class="ly-b">' +
        SV.filter(function (s) { return s.cat === 'gov'; }).map(function (s) { return '<button type="button" class="chip2" data-open="' + s.id + '"><span>' + s.code + '</span>' + s.n + '</button>'; }).join('') +
      '</div></aside></div>' +
    '</section>' +

    '<section class="sec" id="llm">' +
      '<div class="sec-top"><p class="eyebrow"><span class="dot"></span>ĐẶT "BỘ NÃO" AI Ở ĐÂU?</p><h2>Cloud công cộng, cloud riêng hay on-premise</h2>' +
      '<p>Câu hỏi đầu tiên của hầu hết doanh nghiệp: dữ liệu của tôi đi đâu? Ba cách đặt mô hình ngôn ngữ lớn (LLM), so sánh bằng ngôn ngữ đời thường.</p></div>' +
      '<div class="cmp">' + [
        { id: 'llmapi', t: 'Cloud công cộng', an: 'Như dùng điện lưới', ctl: 2, spd: 5, cost: 1, where: 'Trung tâm dữ liệu của nhà cung cấp AI (bản doanh nghiệp không dùng dữ liệu của bạn để huấn luyện)', inv: 'Gần như bằng 0', run: 'Trả theo lượng sử dụng', mdl: 'Mạnh nhất thị trường: GPT, Claude, Gemini', fit: 'Doanh nghiệp vừa và nhỏ, muốn bắt đầu nhanh, dữ liệu thông thường' },
        { id: 'llmprivate', t: 'Cloud riêng', an: 'Như thuê căn hộ có khóa riêng', ctl: 4, spd: 3, cost: 3, where: 'Vùng mạng riêng trên cloud, chỉ doanh nghiệp truy cập', inv: 'Thấp đến trung bình', run: 'Thuê máy chủ GPU theo tháng', mdl: 'Mô hình mã nguồn mở hoặc bản doanh nghiệp riêng', fit: 'Ngân hàng, bảo hiểm, chuỗi lớn, dữ liệu nhạy cảm' },
        { id: 'llmonprem', t: 'On-premise', an: 'Như tự xây nhà máy điện', ctl: 5, spd: 2, cost: 5, where: 'Phòng server ngay tại công ty, không ra internet', inv: 'Cao (mua máy chủ GPU)', run: 'Cố định: điện, bảo trì, nhân sự', mdl: 'Mã nguồn mở, có thể fine-tune riêng', fit: 'Cơ quan nhà nước, y tế, sản xuất, dữ liệu mật' }
      ].map(function (m, i) {
        var bars = function (n) { var h = ''; for (var k = 1; k <= 5; k++) h += '<i' + (k <= n ? ' class="on"' : '') + '></i>'; return '<span class="bars">' + h + '</span>'; };
        return '<div class="cm' + (i === 1 ? ' mid' : '') + '"><span class="mono">' + byId[m.id].code + '</span><h4>' + m.t + '</h4><p class="an">' + m.an + '</p>' +
          '<div class="meter"><div><span>Kiểm soát dữ liệu</span>' + bars(m.ctl) + '</div><div><span>Tốc độ bắt đầu</span>' + bars(m.spd) + '</div><div><span>Vốn đầu tư ban đầu</span>' + bars(m.cost) + '</div></div>' +
          '<dl><div><dt>DỮ LIỆU NẰM Ở</dt><dd>' + m.where + '</dd></div><div><dt>ĐẦU TƯ BAN ĐẦU</dt><dd>' + m.inv + '</dd></div><div><dt>CHI PHÍ VẬN HÀNH</dt><dd>' + m.run + '</dd></div><div><dt>MÔ HÌNH</dt><dd>' + m.mdl + '</dd></div><div><dt>PHÙ HỢP</dt><dd>' + m.fit + '</dd></div></dl>' +
          '<button type="button" class="btn ghost sm" data-open="' + m.id + '">Xem quy trình triển khai <span class="arr">→</span></button></div>';
      }).join('') + '</div>' +
      '<div class="hybrid"><span class="mono">PHƯƠNG ÁN LAI (HYBRID)</span>Nhiều doanh nghiệp kết hợp cả hai: việc thông thường như viết content dùng cloud công cộng cho mạnh và rẻ, dữ liệu mật như hợp đồng hay hồ sơ khách chạy trên cloud riêng hoặc on-premise. Một AI Gateway (L05) đứng giữa tự chọn đường đi cho từng yêu cầu.</div>' +
    '</section>' +

    '<section class="sec" id="journey">' +
      '<div class="sec-top"><p class="eyebrow"><span class="dot"></span>LÀM VIỆC CÙNG DRABUFF AI</p><h2>Từ buổi trao đổi đầu tiên đến hệ thống chạy thật</h2></div>' +
      '<ol class="jr"><li><b>Trao đổi miễn phí</b><span>30–60 phút để hiểu bài toán và mục tiêu của bạn.</span></li><li><b>Khảo sát & đánh giá</b><span>Xem quy trình, dữ liệu, hệ thống hiện có; chọn việc đáng làm nhất.</span></li><li><b>Chạy thử (POC)</b><span>Dựng bản thử trên dữ liệu thật, đo kết quả trước khi đầu tư lớn.</span></li><li><b>Triển khai & đào tạo</b><span>Tích hợp vào hệ thống, đào tạo đội ngũ sử dụng.</span></li><li><b>Vận hành & mở rộng</b><span>Theo dõi KPI hằng tháng, mở rộng sang việc tiếp theo.</span></li></ol>' +
    '</section>' +

    '<section class="sec" id="faq">' +
      '<div class="sec-top"><p class="eyebrow"><span class="dot"></span>CÂU HỎI THƯỜNG GẶP</p><h2>Những điều lãnh đạo hay hỏi trước khi bắt đầu</h2></div>' +
      '<div class="faq">' + [
        ['AI có thay thế nhân viên của tôi không?', 'AI nhận phần việc lặp lại: trả lời câu hỏi giống nhau, nhập liệu, tổng hợp báo cáo. Con người tập trung vào việc cần phán đoán và quan hệ. Phần lớn doanh nghiệp không cắt giảm người mà làm được nhiều việc hơn với cùng đội ngũ.'],
        ['Dữ liệu công ty có bị lộ khi dùng AI không?', 'Tùy cách triển khai. Bản doanh nghiệp của các nền tảng cloud lớn cam kết không dùng dữ liệu của bạn để huấn luyện. Dữ liệu nhạy cảm có thể chạy trên cloud riêng hoặc máy chủ on-premise. Hệ thống luôn có che dữ liệu, phân quyền và ghi nhật ký.'],
        ['Không có đội IT thì có triển khai được không?', 'Được. Drabuff AI triển khai trọn gói, bàn giao màn hình quản trị đơn giản, đào tạo nhân sự và có gói vận hành, bảo trì hằng tháng (S04).'],
        ['Nên bắt đầu từ dịch vụ nào?', 'Thường là những việc thấy kết quả nhanh trong 2–4 tuần: Chatbot đa kênh (C01), Workflow Automation (A01) hoặc Trợ lý AI cho nhân viên (G04). Nếu chưa rõ, bắt đầu bằng Tư vấn chiến lược (S01).'],
        ['AI có trả lời sai không?', 'Có thể. Vì vậy Drabuff AI giới hạn AI trả lời trong phạm vi tài liệu của bạn kèm trích nguồn, để con người duyệt ở các bước quan trọng và giám sát chất lượng liên tục.'],
        ['Chi phí khoảng bao nhiêu?', 'Phụ thuộc vào dịch vụ, quy mô người dùng và nơi đặt mô hình. Sau buổi trao đổi, Drabuff AI gửi báo giá theo từng giai đoạn để bạn bắt đầu nhỏ, đo kết quả rồi mới mở rộng.']
      ].map(function (f, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + f[0] + '</summary><p>' + f[1] + '</p></details>'; }).join('') + '</div>' +
    '</section>' +

    '<section class="sec" id="contact"><div class="panel cta">' +
      '<div class="cta-l"><p class="eyebrow"><span class="dot"></span>BƯỚC TIẾP THEO</p>' +
        '<h2>Chưa chắc nên bắt đầu từ đâu? Hỏi chuyên gia Drabuff AI</h2>' +
        '<p>Drabuff AI sẽ nghe bài toán của bạn, đề xuất tổ hợp dịch vụ phù hợp với ngân sách và mức độ bảo mật, rồi gửi lộ trình triển khai kèm báo giá theo từng giai đoạn.</p>' +
        '<p class="explored" style="margin-top:20px">DỊCH VỤ BẠN ĐÃ ĐÁNH DẤU QUAN TÂM</p><div id="wish"></div>' +
      '</div><div class="cta-r">' +
        '<div class="idbox"><div class="z"><span>ZALO ' + C.brand.toUpperCase() + '</span><b>' + C.display + '</b></div><div><span>ĐÃ ĐÁNH DẤU</span><b id="wishN">0 dịch vụ</b></div></div>' +
        '<a class="btn primary" href="https://zalo.me/' + zDigits + '" target="_blank" rel="noopener">Nhắn Zalo cho ' + C.brand + ' <span class="arr">→</span></a>' +
        '<button class="btn ghost" id="copy" type="button">Sao chép danh sách để gửi</button>' +
        '<p class="copied" id="copied" aria-live="polite"></p><textarea id="sumtxt" readonly hidden></textarea>' +
      '</div></div></section>';

  /* ---------- catalog ---------- */
  function renderTabs() {
    $$('.tab').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.tab === curTab); });
    var c = catById[curTab];
    $('#catDesc').innerHTML = c ? '<b>' + c.n + ':</b> ' + c.d : 'Toàn bộ <b>' + SV.length + ' dịch vụ</b> Drabuff AI triển khai, xếp theo nhóm.';
    var list = curTab === 'all' ? SV : SV.filter(function (s) { return s.cat === curTab; });
    $('#keys').innerHTML = list.map(function (s) {
      return '<button type="button" class="key" data-id="' + s.id + '" aria-pressed="' + (s.id === cur) + '">' +
        (st.wish.indexOf(s.id) > -1 ? '<span class="star" title="Đã đánh dấu quan tâm"></span>' : '') +
        '<span class="kc">' + s.code + '<i>' + (st.seen.indexOf(s.id) > -1 ? 'đã xem' : '') + '</i></span><b>' + s.n + '</b><small>' + s.tag + '</small></button>';
    }).join('');
  }
  function renderExplored() {
    $('#explored').innerHTML = 'ĐÃ XEM <b>' + st.seen.length + '</b> / ' + SV.length;
    window.Scene3D.setProgress(0.08 + st.seen.length / SV.length * 0.92);
  }

  var timer = null, step = 0;
  function renderViewer(id) {
    var s = byId[id], n = s.flow.length, cat = catById[s.cat];
    var cx = ''; for (var k = 1; k <= 3; k++) cx += '<i' + (k <= s.cx ? ' class="on"' : '') + '></i>';
    var br = s.branch, bs = 1, bx = '25%';
    if (br) { bs = Math.min(br[0] + 1, n - 1); bx = bs === br[0] + 1 ? '25%' : '75%'; }
    var idx = SV.indexOf(s), prev = SV[(idx - 1 + SV.length) % SV.length], next = SV[(idx + 1) % SV.length];
    var inList = st.wish.indexOf(id) > -1;
    $('#viewer').innerHTML =
      '<div class="vw-h"><div class="cube3"><span>' + s.code + '</span></div>' +
        '<div><p class="eyebrow">' + cat.n.toUpperCase() + '</p><h3>' + s.n + '</h3><p class="tg">' + s.tag + '</p></div>' +
        '<div class="vw-meta"><div><span>THỜI GIAN TRIỂN KHAI</span><b>' + s.tl + '</b></div><div><span>ĐỘ PHỨC TẠP</span><span class="cxm">' + cx + '</span></div></div></div>' +
      '<div class="easy"><span>NÓI CHO DỄ HIỂU</span><p>' + s.easy + '</p></div>' +
      '<div class="fl-h"><div><h4>Cách hoạt động, từng bước</h4><p>Chấm sáng đi qua từng bước theo đúng thứ tự dữ liệu được xử lý.</p></div><button type="button" class="btn ghost sm" id="replay">Chạy lại sơ đồ</button></div>' +
      '<div class="flow2" id="flow" style="--n:' + n + '"><div class="track"><span class="fill"></span><span class="pk"></span></div>' +
        s.flow.map(function (f, i) {
          return '<div class="nd" data-i="' + i + '">' + (br && br[0] === i ? '<span class="bt">NHÁNH</span>' : '') +
            '<div class="nd-k">' + String(i + 1).padStart(2, '0') + '</div><h5>' + f[0] + '</h5><p>' + f[1] + '</p></div>';
        }).join('') + '</div>' +
      (br ? '<div class="branch" style="--n:' + n + '"><div class="br-box" style="--bs:' + bs + ';--bx:' + bx + '"><span class="mono">NHÁNH XỬ LÝ TẠI BƯỚC ' + String(br[0] + 1).padStart(2, '0') + '</span><b>Nếu</b> ' + br[1].charAt(0).toLowerCase() + br[1].slice(1) + ' <b>→</b> ' + br[2] + '</div></div>' : '') +
      '<div class="vw-cols">' +
        '<div class="vc"><h5>VÍ DỤ THỰC TẾ</h5><ul>' + s.ex.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="vc"><h5>DOANH NGHIỆP NHẬN ĐƯỢC</h5><ul class="checks">' + s.get.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="vc"><h5>PHÙ HỢP KHI</h5><ul>' + s.fit.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '</div>' +
      '<div class="vw-foot"><div class="grp"><button type="button" class="btn ghost sm" data-open="' + prev.id + '">← ' + prev.code + '</button><button type="button" class="btn ghost sm" data-open="' + next.id + '">' + next.code + ' →</button></div>' +
        '<div class="grp"><button type="button" class="btn ghost sm' + (inList ? ' on-list' : '') + '" id="wishBtn">' + (inList ? '✓ Đã đánh dấu quan tâm' : '+ Đánh dấu quan tâm') + '</button>' +
        '<a class="btn primary sm" href="#contact">Hỏi Drabuff AI về giải pháp này <span class="arr">→</span></a></div></div>';
    play();
  }

  function play() {
    clearInterval(timer); step = 0;
    var flow = $('#flow'); if (!flow) return;
    var nodes = $$('.nd', flow), n = nodes.length, track = $('.track', flow);
    var paint = function () {
      nodes.forEach(function (nd, i) { nd.classList.toggle('on', i === step); nd.classList.toggle('done', i < step); });
      track.style.setProperty('--p', (n > 1 ? step / (n - 1) * 100 : 0) + '%');
    };
    if (reduce) { step = n - 1; paint(); nodes.forEach(function (nd) { nd.classList.add('done'); }); return; }
    paint();
    timer = setInterval(function () {
      step++;
      if (step >= n + 1) { step = 0; }
      if (step === n) { nodes.forEach(function (nd) { nd.classList.remove('on'); nd.classList.add('done'); }); track.style.setProperty('--p', '100%'); return; }
      paint();
    }, 1500);
  }

  function open(id, scroll) {
    if (!byId[id]) return;
    cur = id;
    if (curTab !== 'all' && byId[id].cat !== curTab) curTab = byId[id].cat;
    if (st.seen.indexOf(id) < 0) { st.seen.push(id); save(); }
    renderTabs(); renderViewer(id); renderExplored();
    if (scroll) $('#viewer').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- wish list / CTA ---------- */
  function summary() {
    var items = st.wish.map(function (id) { return byId[id]; });
    return ['[Drabuff AI] Yêu cầu tư vấn triển khai AI',
      items.length ? 'Tôi quan tâm ' + items.length + ' dịch vụ:' : 'Tôi muốn được tư vấn giải pháp AI cho doanh nghiệp.'
    ].concat(items.map(function (s) { return '- ' + s.code + ' · ' + s.n; }))
      .concat(['Tên doanh nghiệp: ', 'Người liên hệ: ', 'Nhu cầu chính: ']).join('\n');
  }
  function renderWish() {
    var w = $('#wish');
    w.innerHTML = st.wish.length
      ? '<div class="wish">' + st.wish.map(function (id) { var s = byId[id]; return '<button type="button" class="chip2" data-unwish="' + id + '" title="Bỏ khỏi danh sách"><span>' + s.code + '</span>' + s.n + '<em>×</em></button>'; }).join('') + '</div>'
      : '<p class="wish-empty">Chưa có dịch vụ nào. Khi xem một dịch vụ, bấm "Đánh dấu quan tâm" để thêm vào đây; danh sách sẽ được gửi kèm khi bạn nhắn Drabuff AI.</p>';
    $('#wishN').textContent = st.wish.length + ' dịch vụ';
    $('#sumtxt').value = summary();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('.tab'))) { curTab = t.dataset.tab; renderTabs(); return; }
    if ((t = e.target.closest('.key'))) { open(t.dataset.id, true); return; }
    if ((t = e.target.closest('[data-open]'))) { curTab = byId[t.dataset.open].cat; open(t.dataset.open, true); return; }
    if ((t = e.target.closest('#replay'))) { play(); return; }
    if ((t = e.target.closest('#wishBtn'))) {
      var i = st.wish.indexOf(cur); if (i > -1) st.wish.splice(i, 1); else st.wish.push(cur);
      save(); renderWish(); renderTabs();
      t.classList.toggle('on-list', i < 0); t.textContent = i < 0 ? '✓ Đã đánh dấu quan tâm' : '+ Đánh dấu quan tâm';
      return;
    }
    if ((t = e.target.closest('[data-unwish]'))) { st.wish.splice(st.wish.indexOf(t.dataset.unwish), 1); save(); renderWish(); renderTabs(); if (t.dataset.unwish === cur) renderViewer(cur); return; }
    if ((t = e.target.closest('.slab'))) {
      var ly = document.getElementById('ly-' + t.dataset.ly);
      ly.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      ly.classList.add('flash'); setTimeout(function () { ly.classList.remove('flash'); }, 1800);
      return;
    }
    if ((t = e.target.closest('#copy'))) {
      var txt = summary(), ok = function () { $('#copied').textContent = 'Đã sao chép. Mở Zalo ' + C.display + ' và dán vào tin nhắn.'; };
      var fb = function () { var ta = $('#sumtxt'); ta.hidden = false; ta.focus(); ta.select(); $('#copied').textContent = 'Trình duyệt chặn sao chép tự động. Nội dung đã được bôi đen, nhấn Ctrl/⌘ + C.'; };
      try { navigator.clipboard.writeText(txt).then(ok, fb); } catch (err) { fb(); }
    }
  });

  // hero iso tilt follows pointer
  if (!reduce && window.matchMedia && matchMedia('(pointer:fine)').matches) {
    var iso = $('#iso'), host = iso.parentElement;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      iso.style.transform = 'rotateX(' + (58 - y * 14) + 'deg) rotateZ(' + (-40 + x * 18) + 'deg)';
    });
    host.addEventListener('pointerleave', function () { iso.style.transform = ''; });
  }

  renderTabs(); renderViewer(cur); renderExplored(); renderWish();
  if (st.seen.indexOf(cur) < 0) { st.seen.push(cur); save(); renderExplored(); }
})();
