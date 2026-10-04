/* Drabuff AI — enterprise AI service map v2 */
(function () {
  var C = window.DRABUFF, CATS = window.CATS, SV = window.SERVICES, LAYERS = window.LAYERS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer:fine)').matches;
  var byId = {}; SV.forEach(function (s) { byId[s.id] = s; });
  var catById = {}; CATS.forEach(function (c) { catById[c.id] = c; });
  var layerOf = {}; LAYERS.forEach(function (l, i) { l.ids.forEach(function (id) { layerOf[id] = i; }); });
  var zDigits = C.zalo.replace(/\D/g, '');
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var go = function (el, block) { if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: block || 'start' }); };

  var KEY = 'drabuff-catalog-v2', st = { wish: [], seen: [], lvl: 0 };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) { st.wish = raw.wish || []; st.seen = raw.seen || []; st.lvl = raw.lvl || 0; } } catch (e) {}
  st.wish = st.wish.filter(function (id) { return byId[id]; }); st.seen = st.seen.filter(function (id) { return byId[id]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var curTab = 'cx', cur = 'chatbot', query = '';
  var chip = function (id, extra) { var s = byId[id]; return '<button type="button" class="chip2' + (extra || '') + '" data-open="' + id + '"><span>' + s.code + '</span>' + s.n + '</button>'; };
  var dots = function (n, max) { var h = ''; for (var k = 1; k <= (max || 3); k++) h += '<i' + (k <= n ? ' class="on"' : '') + '></i>'; return h; };
  var cxName = ['', 'Nhanh gọn', 'Trung bình', 'Chuyên sâu'];

  /* =============== PAGE =============== */
  var isoLayers = LAYERS.slice().reverse();
  var tickerRow = function (list) { var h = list.map(function (s) { return '<button type="button" class="tk" data-open="' + s.id + '"><b>' + s.code + '</b>' + s.n + '</button>'; }).join(''); return h + h; };
  var half = Math.ceil(SV.length / 2);

  $('#app').innerHTML =
  /* ---------- HERO ---------- */
  '<section class="hero" id="hero">' +
    '<div class="hero-txt reveal">' +
      '<p class="eyebrow"><span class="dot"></span>DRABUFF AI · BẢN ĐỒ DỊCH VỤ AI DOANH NGHIỆP</p>' +
      '<h1 class="shine">Toàn bộ AI cho doanh nghiệp, <em>từ A đến Z</em></h1>' +
      '<p class="typer mono" aria-hidden="true"><span class="tp-p">drabuff.deploy(</span><span id="typer"></span><span class="caret"></span><span class="tp-p">)</span></p>' +
      '<p class="lead"><span class="cnt" data-count="' + SV.length + '">' + SV.length + '</span> dịch vụ, từ chatbot, robot phần mềm, AI Agent đến LLM trên cloud riêng và máy chủ on-premise. Mỗi dịch vụ có <b>sơ đồ hoạt động từng bước</b>, so sánh trước và sau khi có AI, ví dụ thực tế, chỉ số đo lường và những gì doanh nghiệp cần chuẩn bị.</p>' +
      '<div class="hero-cta"><a class="btn primary" href="#finder">Tìm giải pháp cho tôi <span class="arr">→</span></a><a class="btn ghost" href="#catalog">Xem ' + SV.length + ' dịch vụ</a></div>' +
      '<ul class="facts">' +
        '<li><b class="cnt" data-count="' + SV.length + '">' + SV.length + '</b><span>dịch vụ AI triển khai</span></li>' +
        '<li><b><span class="cnt" data-count="' + CATS.length + '">' + CATS.length + '</span> nhóm</b><span>từ điểm chạm đến hạ tầng</span></li>' +
        '<li><b><span class="cnt" data-count="' + LAYERS.length + '">' + LAYERS.length + '</span> tầng</b><span>kiến trúc AI doanh nghiệp</span></li>' +
      '</ul>' +
    '</div>' +
    '<div class="hero-vis reveal" style="animation-delay:.12s"><div class="iso-wrap"><div class="iso" id="iso">' +
      isoLayers.map(function (l, i) {
        var li = LAYERS.indexOf(l);
        return '<button type="button" class="slab' + (i === 0 ? ' base' : '') + '" style="--i:' + i + ';--d:' + (i * 0.12) + 's" data-ly="' + li + '" aria-label="Tầng ' + (li + 1) + ': ' + l.n + '"><span class="side"></span><span class="side r"></span><span class="top"><span><small>TẦNG ' + pad(li + 1) + ' · ' + l.ids.length + ' DỊCH VỤ</small><b>' + l.n + '</b></span></span></button>';
      }).join('') +
    '</div><span class="iso-cap">BẤM VÀO TỪNG TẦNG ĐỂ XEM</span></div></div>' +
  '</section>' +
  '<div class="ticker" aria-label="Danh sách dịch vụ"><div class="tk-row">' + tickerRow(SV.slice(0, half)) + '</div><div class="tk-row rev">' + tickerRow(SV.slice(half)) + '</div></div>' +

  /* ---------- DOCK ---------- */
  '<nav class="dock" aria-label="Mục lục"><div class="dock-in">' +
    [['finder', 'Tìm giải pháp'], ['catalog', 'Danh mục'], ['arch', 'Kiến trúc & mô phỏng'], ['maturity', 'Bậc trưởng thành'], ['llm', 'Đặt LLM ở đâu'], ['table', 'Bảng tra cứu'], ['glossary', 'Từ điển AI'], ['journey', 'Quy trình'], ['faq', 'Hỏi đáp'], ['contact', 'Liên hệ']]
      .map(function (d) { return '<a href="#' + d[0] + '" data-sec="' + d[0] + '">' + d[1] + '</a>'; }).join('') +
  '</div></nav>' +

  /* ---------- FINDER ---------- */
  '<section class="sec" id="finder">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>TÌM GIẢI PHÁP TRONG 10 GIÂY</p><h2>Doanh nghiệp bạn đang gặp vấn đề gì?</h2>' +
    '<p>Chọn một hoặc nhiều vấn đề. Drabuff AI xếp hạng ngay những dịch vụ phù hợp nhất để bạn xem chi tiết.</p></div>' +
    '<div class="finder rv"><div class="pains" id="pains">' + window.PAINS.map(function (p, i) { return '<button type="button" class="pain" data-p="' + i + '" aria-pressed="false">' + p.t + '</button>'; }).join('') + '</div>' +
    '<div class="fr-out"><div class="fr-h"><span class="mono" id="frLabel"></span><button type="button" class="btn ghost sm" id="frWish" hidden>+ Đánh dấu tất cả</button></div><div class="fr-list" id="frList"></div></div></div>' +
  '</section>' +

  /* ---------- CATALOG ---------- */
  '<section class="sec" id="catalog">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>DANH MỤC ' + SV.length + ' DỊCH VỤ</p><h2>Bấm vào một dịch vụ để xem nó hoạt động thế nào</h2>' +
    '<p>Chọn nhóm hoặc gõ tìm. Sơ đồ chạy từng bước cho thấy dữ liệu đi đâu, AI làm gì và con người kiểm soát ở đâu. Bấm vào từng bước để dừng lại xem kỹ.</p></div>' +
    '<div class="cat-bar"><label class="search"><span class="mono">TÌM</span><input id="q" type="search" placeholder="VD: hóa đơn, Zalo, on-premise, tuyển dụng…" autocomplete="off"></label><span class="explored" id="explored"></span></div>' +
    '<div class="tabs" role="tablist" aria-label="Nhóm dịch vụ">' +
      '<button type="button" class="tab" role="tab" data-tab="all">Tất cả <span class="ct">' + SV.length + '</span></button>' +
      CATS.map(function (c) { return '<button type="button" class="tab" role="tab" data-tab="' + c.id + '">' + c.n + ' <span class="ct">' + SV.filter(function (s) { return s.cat === c.id; }).length + '</span></button>'; }).join('') +
    '</div>' +
    '<p class="cat-desc" id="catDesc"></p>' +
    '<div class="keys" id="keys"></div>' +
    '<article class="panel viewer spot" id="viewer" aria-live="polite"></article>' +
  '</section>' +

  /* ---------- ARCH + SIM ---------- */
  '<section class="sec" id="arch">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>BỨC TRANH TỔNG THỂ</p><h2>Các dịch vụ ghép lại với nhau như thế nào</h2>' +
    '<p>Đọc từ trên xuống: yêu cầu bắt đầu ở nơi khách hàng và nhân viên chạm vào, đi xuống các lớp xử lý, tới "bộ não" AI ở dưới cùng, rồi kết quả đi ngược lên. Bấm <b>Chạy mô phỏng</b> để xem một yêu cầu thật đi qua hệ thống.</p></div>' +
    '<div class="arch2"><div class="stack2" id="stack">' +
      LAYERS.map(function (l, i) {
        var arrow = i < LAYERS.length - 1 ? '<div class="ly-arrow" aria-hidden="true"><span class="dn"><em>giao việc</em><i></i></span><span class="up"><i></i><em>trả kết quả</em></span></div>' : '';
        return '<div class="ly spot" id="ly-' + i + '"><div class="ly-h"><span class="mono">TẦNG ' + pad(i + 1) + '</span><h4>' + l.n + '</h4><p>' + l.d + '</p></div><div class="ly-b">' + l.ids.map(function (id) { return chip(id); }).join('') + '</div></div>' + arrow;
      }).join('') +
    '</div><aside class="side-col">' +
      '<div class="sim" id="sim"><span class="mono">MÔ PHỎNG MỘT YÊU CẦU</span><h4>Chọn tình huống</h4>' +
        '<div class="sim-sc">' + window.SCENARIOS.map(function (s, i) { return '<button type="button" class="tab sc" data-sc="' + i + '" aria-pressed="' + (i === 0) + '">' + s.n + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn primary" id="simRun">▶ Chạy mô phỏng</button>' +
        '<ol class="sim-log" id="simLog"></ol></div>' +
      '<div class="gov"><span class="mono">XUYÊN SUỐT MỌI TẦNG</span><h4>Chiến lược, quản trị & con người</h4><p>Không thuộc riêng tầng nào: quyết định làm gì, dùng an toàn ra sao, kiểm thử, đào tạo và chăm sóc hệ thống.</p><div class="ly-b">' +
        SV.filter(function (s) { return s.cat === 'gov'; }).map(function (s) { return chip(s.id); }).join('') + '</div></div>' +
    '</aside></div>' +
  '</section>' +

  /* ---------- MATURITY ---------- */
  '<section class="sec" id="maturity">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>5 BẬC TRƯỞNG THÀNH AI</p><h2>Doanh nghiệp bạn đang đứng ở bậc nào?</h2>' +
    '<p>Mỗi bậc là một bước lên: bấm vào bậc giống doanh nghiệp bạn nhất để xem dấu hiệu nhận biết, bước tiếp theo và dịch vụ nên làm.</p></div>' +
    '<div class="stairs rv" id="stairs">' + window.MATURITY.map(function (m, i) { return '<button type="button" class="stair" data-lv="' + i + '" style="--h:' + (i + 1) + '"><span class="st-top"><b>BẬC ' + (i + 1) + '</b>' + m.n + '</span></button>'; }).join('') + '</div>' +
    '<div class="panel lv-card spot rv" id="lvCard"></div>' +
  '</section>' +

  /* ---------- LLM ---------- */
  '<section class="sec" id="llm">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>ĐẶT "BỘ NÃO" AI Ở ĐÂU?</p><h2>Cloud công cộng, cloud riêng, on-premise hay ngay tại thiết bị</h2>' +
    '<p>Câu hỏi đầu tiên của hầu hết lãnh đạo: dữ liệu của tôi đi đâu? Chọn điều bạn ưu tiên nhất, Drabuff AI chỉ ra phương án phù hợp.</p></div>' +
    '<div class="prio2 rv" id="prio">' + [['llmapi', 'Bắt đầu nhanh nhất'], ['llmprivate', 'Cân bằng bảo mật & linh hoạt'], ['llmonprem', 'Bảo mật tuyệt đối'], ['edge', 'Nhiều điểm, mạng không ổn định'], ['hybrid', 'Kết hợp nhiều phương án']].map(function (p) { return '<button type="button" class="tab" data-pr="' + p[0] + '" aria-pressed="false">' + p[1] + '</button>'; }).join('') + '</div>' +
    '<div class="cmp" id="cmp">' + [
      { id: 'llmapi', t: 'Cloud công cộng', an: 'Như dùng điện lưới', m: [2, 5, 2, 1], where: 'Trung tâm dữ liệu của nhà cung cấp AI; bản doanh nghiệp không dùng dữ liệu của bạn để huấn luyện', mdl: 'Mạnh nhất thị trường: GPT, Claude, Gemini', gov: 'Nhà cung cấp vận hành, bạn quản lý tài khoản & quyền', fit: 'Bắt đầu nhanh, dữ liệu thông thường' },
      { id: 'llmprivate', t: 'Cloud riêng', an: 'Như căn hộ có khóa riêng', m: [4, 3, 4, 1], where: 'Vùng mạng riêng trên cloud, chỉ doanh nghiệp truy cập', mdl: 'Mã nguồn mở hoặc bản doanh nghiệp riêng', gov: 'IT của bạn cùng Drabuff AI quản trị', fit: 'Ngân hàng, bảo hiểm, chuỗi lớn, dữ liệu nhạy cảm' },
      { id: 'llmonprem', t: 'On-premise', an: 'Như tự xây nhà máy điện', m: [5, 2, 5, 5], where: 'Phòng server ngay tại công ty, không cần internet', mdl: 'Mã nguồn mở, có thể fine-tune riêng', gov: 'Doanh nghiệp toàn quyền kiểm soát', fit: 'Cơ quan nhà nước, y tế, sản xuất, dữ liệu mật' },
      { id: 'edge', t: 'Edge AI', an: 'Như chuyên gia đứng tại hiện trường', m: [5, 2, 4, 5], where: 'Ngay trên thiết bị: camera, máy tính nhúng tại chỗ', mdl: 'Mô hình nhỏ, đã được nén cho thiết bị', gov: 'Quản lý tập trung, cập nhật từ xa', fit: 'Nhà máy, chuỗi cửa hàng, nơi mạng yếu' }
    ].map(function (m) {
      var bars = function (n) { return '<span class="bars">' + dots(n, 5) + '</span>'; };
      return '<div class="cm spot" data-cm="' + m.id + '"><span class="badge">PHÙ HỢP NHẤT</span><span class="mono">' + byId[m.id].code + '</span><h4>' + m.t + '</h4><p class="an">' + m.an + '</p>' +
        '<div class="meter"><div><span>Kiểm soát dữ liệu</span>' + bars(m.m[0]) + '</div><div><span>Tốc độ bắt đầu</span>' + bars(m.m[1]) + '</div><div><span>Mức tùy biến</span>' + bars(m.m[2]) + '</div><div><span>Chạy khi mất mạng</span>' + bars(m.m[3]) + '</div></div>' +
        '<dl><div><dt>DỮ LIỆU NẰM Ở</dt><dd>' + m.where + '</dd></div><div><dt>MÔ HÌNH</dt><dd>' + m.mdl + '</dd></div><div><dt>QUẢN TRỊ</dt><dd>' + m.gov + '</dd></div><div><dt>PHÙ HỢP</dt><dd>' + m.fit + '</dd></div></dl>' +
        '<button type="button" class="btn ghost sm" data-open="' + m.id + '">Xem quy trình triển khai <span class="arr">→</span></button></div>';
    }).join('') + '</div>' +
    '<div class="hybrid rv" id="hybrid"><span class="mono">PHƯƠNG ÁN KẾT HỢP (HYBRID)</span><div class="hy-flow"><span class="hy-n">Yêu cầu từ nhân viên, khách hàng</span><i></i><span class="hy-n acc">AI Gateway (L05) phân loại</span><i></i><span class="hy-split"><span class="hy-n">Việc thông thường → Cloud công cộng</span><span class="hy-n">Dữ liệu mật → Cloud riêng / On-premise</span><span class="hy-n">Tại hiện trường → Edge AI</span></span></div><p>Nhiều doanh nghiệp không chọn một mà kết hợp: mỗi yêu cầu tự đi đúng đường theo mức độ nhạy cảm của dữ liệu.</p></div>' +
  '</section>' +

  /* ---------- TABLE ---------- */
  '<section class="sec" id="table">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>BẢNG TRA CỨU NHANH</p><h2>Toàn bộ ' + SV.length + ' dịch vụ trên một bảng</h2>' +
    '<p>Lọc theo nhóm, độ phức tạp hoặc gõ tìm. Bấm vào một dòng để xem sơ đồ chi tiết.</p></div>' +
    '<div class="tb-bar rv"><label class="search"><span class="mono">TÌM</span><input id="tq" type="search" placeholder="Tên, mã, công nghệ…" autocomplete="off"></label>' +
      '<select id="tcat" aria-label="Lọc theo nhóm"><option value="">Tất cả nhóm</option>' + CATS.map(function (c) { return '<option value="' + c.id + '">' + c.n + '</option>'; }).join('') + '</select>' +
      '<div class="seg" id="tcx">' + ['Mọi mức', 'Nhanh gọn', 'Trung bình', 'Chuyên sâu'].map(function (t, i) { return '<button type="button" data-cx="' + i + '" aria-pressed="' + (i === 0) + '">' + t + '</button>'; }).join('') + '</div>' +
      '<select id="tsort" aria-label="Sắp xếp"><option value="code">Sắp xếp: theo mã</option><option value="fast">Triển khai nhanh nhất</option><option value="cx">Độ phức tạp tăng dần</option></select>' +
      '<span class="explored" id="tcount"></span></div>' +
    '<div class="tb-wrap rv"><table class="tb"><thead><tr><th>Mã</th><th>Dịch vụ</th><th>Nhóm</th><th>Triển khai</th><th>Độ phức tạp</th><th>Quy mô phù hợp</th><th>Cần chuẩn bị chính</th></tr></thead><tbody id="tbody"></tbody></table></div>' +
  '</section>' +

  /* ---------- GLOSSARY ---------- */
  '<section class="sec" id="glossary">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>TỪ ĐIỂN AI CHO NGƯỜI MỚI</p><h2>' + window.GLOSSARY.length + ' thuật ngữ, giải thích bằng lời thường</h2>' +
    '<p>Bấm vào thẻ để lật xem định nghĩa và ví dụ so sánh đời thường.</p></div>' +
    '<div class="gl rv">' + window.GLOSSARY.map(function (g) { return '<button type="button" class="flip"><span class="fl-in"><span class="fl-f"><b>' + g[0] + '</b><small>Bấm để lật</small></span><span class="fl-b"><b>' + g[0] + '</b><span>' + g[1] + '</span><em>' + g[2] + '</em></span></span></button>'; }).join('') + '</div>' +
  '</section>' +

  /* ---------- JOURNEY ---------- */
  '<section class="sec" id="journey">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>LÀM VIỆC CÙNG DRABUFF AI</p><h2>Từ buổi trao đổi đầu tiên đến hệ thống chạy thật</h2></div>' +
    '<ol class="jr rv">' + [
      ['Trao đổi', '30–60 phút để hiểu bài toán, mục tiêu và mức độ bảo mật cần có.', 'Hướng đi ban đầu'],
      ['Khảo sát & đánh giá', 'Xem quy trình, dữ liệu, hệ thống hiện có; chọn việc đáng làm nhất.', 'Báo cáo hiện trạng & danh sách ưu tiên'],
      ['Chạy thử (POC)', 'Dựng bản thử trên dữ liệu thật, đo kết quả trước khi mở rộng.', 'Bản chạy thử có số liệu'],
      ['Triển khai & đào tạo', 'Tích hợp vào hệ thống, kiểm thử, đào tạo đội ngũ sử dụng.', 'Hệ thống chạy thật + đội ngũ thành thạo'],
      ['Vận hành & mở rộng', 'Theo dõi KPI hằng tháng, tối ưu và mở rộng sang việc tiếp theo.', 'Báo cáo KPI định kỳ']
    ].map(function (j) { return '<li><b>' + j[0] + '</b><span>' + j[1] + '</span><small><i>NHẬN ĐƯỢC</i>' + j[2] + '</small></li>'; }).join('') + '</ol>' +
  '</section>' +

  /* ---------- FAQ ---------- */
  '<section class="sec" id="faq">' +
    '<div class="sec-top rv"><p class="eyebrow"><span class="dot"></span>CÂU HỎI THƯỜNG GẶP</p><h2>Những điều lãnh đạo hay hỏi trước khi bắt đầu</h2></div>' +
    '<div class="faq rv">' + [
      ['AI có thay thế nhân viên của tôi không?', 'AI nhận phần việc lặp lại: trả lời câu hỏi giống nhau, nhập liệu, tổng hợp báo cáo. Con người tập trung vào việc cần phán đoán và quan hệ. Phần lớn doanh nghiệp không cắt giảm người mà làm được nhiều việc hơn với cùng đội ngũ.'],
      ['Dữ liệu công ty có bị lộ khi dùng AI không?', 'Tùy cách triển khai. Bản doanh nghiệp của các nền tảng cloud lớn cam kết không dùng dữ liệu của bạn để huấn luyện. Dữ liệu nhạy cảm có thể chạy trên cloud riêng, on-premise hoặc ngay tại thiết bị. Hệ thống luôn có che dữ liệu, phân quyền và ghi nhật ký.'],
      ['Không có đội IT thì có triển khai được không?', 'Được. Drabuff AI triển khai trọn gói, bàn giao màn hình quản trị đơn giản, đào tạo nhân sự và có dịch vụ vận hành, bảo trì hằng tháng (S04).'],
      ['Nên bắt đầu từ dịch vụ nào?', 'Thường là những việc thấy kết quả nhanh trong 2–4 tuần: Chatbot đa kênh (C01), Workflow Automation (A01) hoặc Trợ lý AI cho nhân viên (G04). Nếu chưa rõ, hãy dùng bộ Tìm giải pháp ở đầu trang hoặc bắt đầu bằng Tư vấn chiến lược (S01).'],
      ['AI có trả lời sai không?', 'Có thể. Vì vậy Drabuff AI giới hạn AI trả lời trong phạm vi tài liệu của bạn kèm trích nguồn, kiểm thử trước khi ra mắt (S05), để con người duyệt ở các bước quan trọng và giám sát chất lượng liên tục.'],
      ['Làm sao biết giải pháp nào hợp với doanh nghiệp tôi?', 'Mỗi doanh nghiệp có quy trình, dữ liệu và mục tiêu khác nhau. Hãy dùng bộ Tìm giải pháp để có gợi ý ban đầu, rồi liên hệ Drabuff AI để được tư vấn chi tiết theo đúng bài toán của bạn.'],
      ['Sau khi triển khai, Drabuff AI có đồng hành không?', 'Có. Drabuff AI theo dõi hệ thống, kiểm thử định kỳ, cập nhật kiến thức mới cho AI và báo cáo KPI hằng tháng.']
    ].map(function (f, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + f[0] + '</summary><p>' + f[1] + '</p></details>'; }).join('') + '</div>' +
  '</section>' +

  /* ---------- CTA ---------- */
  '<section class="sec" id="contact"><div class="panel cta glow-border">' +
    '<div class="cta-l"><p class="eyebrow"><span class="dot"></span>BƯỚC TIẾP THEO</p>' +
      '<h2>Liên hệ Drabuff AI để được tư vấn chi tiết</h2>' +
      '<p>Drabuff AI sẽ nghe bài toán của bạn, đề xuất tổ hợp dịch vụ phù hợp với mục tiêu và mức độ bảo mật, rồi gửi lộ trình triển khai chi tiết. Mọi thông tin về phương án được tư vấn trực tiếp.</p>' +
      '<p class="explored" style="margin-top:22px">DỊCH VỤ BẠN ĐÃ ĐÁNH DẤU QUAN TÂM</p><div id="wish"></div>' +
    '</div><div class="cta-r">' +
      '<div class="idbox"><div class="z"><span>ZALO ' + C.brand.toUpperCase() + '</span><b>' + C.display + '</b></div><div><span>ĐÃ ĐÁNH DẤU</span><b id="wishN">0 dịch vụ</b></div></div>' +
      '<a class="btn primary" href="https://zalo.me/' + zDigits + '" target="_blank" rel="noopener">Nhắn Zalo cho ' + C.brand + ' <span class="arr">→</span></a>' +
      '<button class="btn ghost" id="copy" type="button">Sao chép danh sách để gửi</button>' +
      '<p class="copied" id="copied" aria-live="polite"></p><textarea id="sumtxt" readonly hidden></textarea>' +
    '</div></div></section>';

  document.body.insertAdjacentHTML('beforeend', '<div class="progress" aria-hidden="true"><i id="prog"></i></div><div class="sim-toast" id="simToast" aria-live="polite"></div><a class="fab" href="#contact"><span class="fab-dot"></span><span class="fab-t">Tư vấn cùng Drabuff AI</span><b id="fabN">0</b></a>');

  /* =============== FINDER =============== */
  var painSel = [];
  function renderFinder() {
    $$('.pain').forEach(function (b) { b.setAttribute('aria-pressed', painSel.indexOf(+b.dataset.p) > -1); });
    var list, label;
    if (!painSel.length) {
      list = ['chatbot', 'workflow', 'copilot', 'rag', 'strategy', 'training'].map(function (id) { return { id: id, pct: 0, why: [] }; });
      label = 'GỢI Ý PHỔ BIẾN ĐỂ BẮT ĐẦU · CHỌN VẤN ĐỀ ĐỂ XẾP HẠNG RIÊNG';
    } else {
      var sc = {}, why = {}, max = 0;
      painSel.forEach(function (pi) {
        var p = window.PAINS[pi]; max += 3;
        p.ids.forEach(function (id, k) { sc[id] = (sc[id] || 0) + Math.max(1, 3 - k * 0.5); (why[id] = why[id] || []).push(p.t); });
      });
      list = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a] || byId[a].cx - byId[b].cx; }).slice(0, 6)
        .map(function (id) { return { id: id, pct: Math.min(99, Math.round(sc[id] / max * 100)), why: why[id] }; });
      var top = list[0].pct; list.forEach(function (r) { r.pct = Math.max(35, Math.round(r.pct / top * 96)); });
      label = 'XẾP HẠNG THEO ' + painSel.length + ' VẤN ĐỀ BẠN CHỌN';
    }
    $('#frLabel').textContent = label;
    $('#frWish').hidden = !painSel.length;
    $('#frList').innerHTML = list.map(function (r, i) {
      var s = byId[r.id];
      return '<button type="button" class="fr spot" data-open="' + s.id + '" style="--dl:' + (i * 0.06) + 's"><span class="fr-rk mono">' + pad(i + 1) + '</span><span class="fr-b"><span class="kc">' + s.code + ' · ' + catById[s.cat].n + '</span><b>' + s.n + '</b><small>' + s.tag + '</small>' +
        (r.pct ? '<span class="fr-bar"><i style="width:' + r.pct + '%"></i></span><span class="fr-w">Giải quyết: ' + r.why.join(' · ') + '</span>' : '') + '</span><span class="fr-go">Xem →</span></button>';
    }).join('');
    $('#frList').dataset.ids = list.map(function (r) { return r.id; }).join(',');
  }

  /* =============== CATALOG =============== */
  function match(s, q) { q = q.toLowerCase(); return (s.code + ' ' + s.n + ' ' + s.tag + ' ' + s.easy + ' ' + (s.tech || []).join(' ') + ' ' + catById[s.cat].n).toLowerCase().indexOf(q) > -1; }
  function renderTabs() {
    $$('#catalog .tab').forEach(function (t) { t.setAttribute('aria-selected', !query && t.dataset.tab === curTab); });
    var c = catById[curTab], list;
    if (query) { list = SV.filter(function (s) { return match(s, query); }); $('#catDesc').innerHTML = 'Tìm thấy <b>' + list.length + ' dịch vụ</b> khớp với "' + window.UI_esc(query) + '".'; }
    else { list = curTab === 'all' ? SV : SV.filter(function (s) { return s.cat === curTab; }); $('#catDesc').innerHTML = c ? '<b>' + c.n + ':</b> ' + c.d : 'Toàn bộ <b>' + SV.length + ' dịch vụ</b> Drabuff AI triển khai, xếp theo nhóm.'; }
    $('#keys').innerHTML = list.length ? list.map(function (s, i) {
      return '<button type="button" class="key spot" data-id="' + s.id + '" aria-pressed="' + (s.id === cur) + '" style="--dl:' + Math.min(i, 12) * 0.03 + 's">' +
        (st.wish.indexOf(s.id) > -1 ? '<span class="star" title="Đã đánh dấu quan tâm"></span>' : '') +
        '<span class="kc">' + s.code + '<i>' + (st.seen.indexOf(s.id) > -1 ? 'đã xem' : cxName[s.cx]) + '</i></span><b>' + s.n + '</b><small>' + s.tag + '</small></button>';
    }).join('') : '<p class="empty">Chưa có dịch vụ khớp. Hãy thử từ khóa khác, hoặc <a href="#contact">hỏi trực tiếp Drabuff AI</a>.</p>';
  }
  window.UI_esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function renderExplored() {
    $('#explored').innerHTML = 'ĐÃ KHÁM PHÁ <b>' + st.seen.length + '</b> / ' + SV.length;
    window.Scene3D.setProgress(0.08 + st.seen.length / SV.length * 0.92);
  }

  var timer = null, step = 0, playing = true;
  function renderViewer(id) {
    var s = byId[id], n = s.flow.length, cat = catById[s.cat];
    var br = s.branch, bs = 1, bx = '25%';
    if (br) { bs = Math.min(br[0] + 1, n - 1); bx = bs === br[0] + 1 ? '25%' : '75%'; }
    var idx = SV.indexOf(s), prev = SV[(idx - 1 + SV.length) % SV.length], next = SV[(idx + 1) % SV.length];
    var inList = st.wish.indexOf(id) > -1;
    var ly = layerOf[id];
    var related = SV.filter(function (x) { return x.cat === s.cat && x.id !== id; }).slice(0, 4);
    var box = function (title, items, cls) { return '<div class="vc"><h5>' + title + '</h5><ul' + (cls ? ' class="' + cls + '"' : '') + '>' + (items || []).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>'; };
    $('#viewer').innerHTML = '<div class="vw-in">' +
      '<div class="vw-h"><div class="cube3"><span>' + s.code + '</span></div>' +
        '<div><p class="eyebrow">' + cat.n.toUpperCase() + (ly != null ? ' · TẦNG ' + pad(ly + 1) : ' · XUYÊN SUỐT') + '</p><h3>' + s.n + '</h3><p class="tg">' + s.tag + '</p></div>' +
        '<div class="vw-meta"><div><span>TRIỂN KHAI</span><b>' + s.tl + '</b></div><div><span>ĐỘ PHỨC TẠP</span><span class="cxm">' + dots(s.cx) + '</span><small>' + cxName[s.cx] + '</small></div><div><span>QUY MÔ PHÙ HỢP</span><b>' + (s.sz || 'Mọi quy mô') + '</b></div></div></div>' +
      '<div class="easy"><span>NÓI CHO DỄ HIỂU</span><p>' + s.easy + '</p></div>' +
      '<div class="fl-h"><div><h4>Cách hoạt động, từng bước</h4><p>Chấm sáng đi theo đúng thứ tự dữ liệu được xử lý. Bấm vào một bước để dừng lại xem.</p></div>' +
        '<div class="fl-ctl"><span class="mono" id="stepTxt"></span><button type="button" class="btn ghost sm" id="pp">❚❚ Tạm dừng</button><button type="button" class="btn ghost sm" id="replay">↺ Chạy lại</button></div></div>' +
      '<div class="flow2" id="flow" style="--n:' + n + '"><div class="track"><span class="fill"></span><span class="pk"></span></div>' +
        s.flow.map(function (f, i) {
          return '<button type="button" class="nd" data-i="' + i + '">' + (br && br[0] === i ? '<span class="bt">NHÁNH</span>' : '') +
            '<span class="nd-k">' + pad(i + 1) + '<span class="ring"></span></span><span class="nd-t">' + f[0] + '</span><span class="nd-p">' + f[1] + '</span></button>';
        }).join('') + '</div>' +
      (br ? '<div class="branch" style="--n:' + n + '"><div class="br-box" style="--bs:' + bs + ';--bx:' + bx + '"><span class="mono">NHÁNH XỬ LÝ TẠI BƯỚC ' + pad(br[0] + 1) + '</span><b>Nếu</b> ' + br[1].charAt(0).toLowerCase() + br[1].slice(1) + ' <b>→</b> ' + br[2] + '</div></div>' : '') +
      (s.ba ? '<div class="ba"><div class="ba-h"><h4>Trước và sau khi có AI</h4><div class="seg" id="baSeg"><button type="button" data-ba="both" aria-pressed="true">So sánh</button><button type="button" data-ba="before" aria-pressed="false">Trước</button><button type="button" data-ba="after" aria-pressed="false">Sau</button></div></div>' +
        '<div class="ba-g" id="baG"><div class="ba-row ba-hd"><span></span><span class="b">TRƯỚC</span><span></span><span class="a">SAU KHI CÓ AI</span></div>' +
        s.ba.map(function (r, i) { return '<div class="ba-row" style="--dl:' + i * 0.08 + 's"><span class="lb">' + r[0] + '</span><span class="b">' + r[1] + '</span><span class="ar" aria-hidden="true"></span><span class="a">' + r[2] + '</span></div>'; }).join('') + '</div></div>' : '') +
      '<div class="vw-cols four">' + box('VÍ DỤ THỰC TẾ', s.ex) + box('DOANH NGHIỆP NHẬN ĐƯỢC', s.get, 'checks') + box('CẦN CHUẨN BỊ', s.need, 'need') + box('ĐO HIỆU QUẢ BẰNG', s.kpi, 'kpi') + '</div>' +
      '<div class="vw-cols two">' +
        '<div class="vc"><h5>CÔNG NGHỆ & TÍCH HỢP</h5><div class="chips">' + (s.tech || []).map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div><h5 style="margin-top:12px">PHÙ HỢP KHI</h5><ul>' + s.fit.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="vc human"><h5>CON NGƯỜI KIỂM SOÁT Ở ĐÂU</h5><p>' + (s.human || '') + '</p>' + (related.length ? '<h5 style="margin-top:14px">CÙNG NHÓM</h5><div class="ly-b">' + related.map(function (x) { return chip(x.id); }).join('') + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="vw-foot"><div class="grp"><button type="button" class="btn ghost sm" data-open="' + prev.id + '">← ' + prev.code + '</button><button type="button" class="btn ghost sm" data-open="' + next.id + '">' + next.code + ' →</button></div>' +
        '<div class="grp"><button type="button" class="btn ghost sm' + (inList ? ' on-list' : '') + '" id="wishBtn">' + (inList ? '✓ Đã đánh dấu quan tâm' : '+ Đánh dấu quan tâm') + '</button>' +
        '<a class="btn primary sm" href="#contact">Tư vấn giải pháp này cùng Drabuff AI <span class="arr">→</span></a></div></div>' +
    '</div>';
    playing = !reduce; play();
  }

  function paintFlow() {
    var flow = $('#flow'); if (!flow) return;
    var nodes = $$('.nd', flow), n = nodes.length;
    var all = step >= n;
    nodes.forEach(function (nd, i) { nd.classList.toggle('on', !all && i === step); nd.classList.toggle('done', all || i < step); });
    $('.track', flow).style.setProperty('--p', (all ? 100 : (n > 1 ? step / (n - 1) * 100 : 0)) + '%');
    $('#stepTxt').textContent = all ? 'HOÀN TẤT ' + n + '/' + n : 'BƯỚC ' + (step + 1) + '/' + n;
    $('#pp').textContent = playing ? '❚❚ Tạm dừng' : '▶ Chạy tiếp';
  }
  function play() {
    clearInterval(timer); step = reduce ? 99 : 0;
    var n = byId[cur].flow.length;
    if (reduce) { step = n; paintFlow(); return; }
    paintFlow();
    timer = setInterval(function () { if (!playing) return; step = step >= n ? 0 : step + 1; paintFlow(); }, 1600);
  }

  function open(id, scroll) {
    if (!byId[id]) return;
    cur = id;
    if (!query && curTab !== 'all' && byId[id].cat !== curTab) curTab = byId[id].cat;
    if (st.seen.indexOf(id) < 0) { st.seen.push(id); save(); }
    renderTabs(); renderViewer(id); renderExplored();
    if (window.Scene3D.burst) window.Scene3D.burst();
    if (scroll) go($('#viewer'));
  }

  /* =============== SIMULATOR =============== */
  var sc = 0, simT = null;
  function simReset() {
    clearTimeout(simT);
    $$('#stack .chip2.hot').forEach(function (c) { c.classList.remove('hot'); });
    $$('.ly.flash').forEach(function (l) { l.classList.remove('flash'); });
    var s = window.SCENARIOS[sc];
    $('#simLog').innerHTML = s.steps.map(function (p, i) { var x = byId[p[0]]; return '<li data-i="' + i + '"><span class="sl-k">' + x.code + '</span><span><b>' + (p[1] === 'down' ? '↓ ' : '↑ ') + 'Tầng ' + pad(layerOf[p[0]] + 1) + ' · ' + x.n + '</b>' + p[2] + '</span></li>'; }).join('');
    $('#simRun').textContent = '▶ Chạy mô phỏng';
  }
  function simRun() {
    simReset();
    var s = window.SCENARIOS[sc], i = 0;
    $('#simRun').textContent = '■ Đang chạy…';
    var tick = function () {
      $$('#stack .chip2.hot').forEach(function (c) { c.classList.remove('hot'); });
      $$('.ly.flash').forEach(function (l) { l.classList.remove('flash'); });
      $$('#simLog li').forEach(function (li, k) { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); });
      if (i >= s.steps.length) { setTimeout(function () { $('#simToast').classList.remove('on'); }, 1500); $('#simRun').textContent = '↺ Chạy lại'; $$('#simLog li').forEach(function (li) { li.classList.add('done'); }); return; }
      var id = s.steps[i][0], c = $('#stack .chip2[data-open="' + id + '"]');
      if (c) c.classList.add('hot');
      var l = $('#ly-' + layerOf[id]); if (l) l.classList.add('flash');
      if (l) { var rr = l.getBoundingClientRect(); if (rr.top < 120 || rr.bottom > innerHeight - 40) go(l, 'center'); }
      var stp = s.steps[i], tt = $('#simToast'); tt.innerHTML = '<span class="mono">BƯỚC ' + (i + 1) + '/' + s.steps.length + ' · ' + byId[id].code + (stp[1] === 'down' ? ' ↓' : ' ↑') + '</span>' + stp[2]; tt.classList.add('on');
      if (window.Scene3D.burst) window.Scene3D.burst();
      i++; simT = setTimeout(tick, reduce ? 900 : 1900);
    };
    tick();
  }

  /* =============== MATURITY =============== */
  function renderLevel() {
    var m = window.MATURITY[st.lvl];
    $$('.stair').forEach(function (b, i) { b.classList.toggle('on', i === st.lvl); b.classList.toggle('below', i < st.lvl); });
    $('#lvCard').innerHTML = '<div class="lv-in"><div><span class="mono">BẬC ' + (st.lvl + 1) + ' / 5</span><h3>' + m.n + '</h3><p class="lv-d">' + m.d + '</p>' +
      '<div class="lv-next"><span class="mono">BƯỚC TIẾP THEO</span>' + m.next + '</div></div>' +
      '<div><h5>DẤU HIỆU NHẬN BIẾT</h5><ul class="checks">' + m.sign.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
      '<div><h5>DỊCH VỤ NÊN TRIỂN KHAI Ở BẬC NÀY</h5><div class="ly-b">' + m.ids.map(function (id) { return chip(id); }).join('') + '</div></div></div>';
  }

  /* =============== TABLE =============== */
  var tcx = 0;
  var weeks = function (s) { var m = /(\d+)/.exec(s.tl); return m ? +m[1] : 0; };
  function renderTable() {
    var q = ($('#tq').value || '').trim(), cat = $('#tcat').value, sort = $('#tsort').value;
    var list = SV.filter(function (s) { return (!q || match(s, q)) && (!cat || s.cat === cat) && (!tcx || s.cx === tcx); });
    if (sort === 'fast') list = list.slice().sort(function (a, b) { return weeks(a) - weeks(b) || a.cx - b.cx; });
    if (sort === 'cx') list = list.slice().sort(function (a, b) { return a.cx - b.cx || weeks(a) - weeks(b); });
    $('#tcount').innerHTML = 'HIỂN THỊ <b>' + list.length + '</b> / ' + SV.length;
    $('#tbody').innerHTML = list.map(function (s) {
      return '<tr data-open="' + s.id + '" tabindex="0"><td class="mono c">' + s.code + '</td><td><b>' + s.n + '</b><small>' + s.tag + '</small></td><td>' + catById[s.cat].n + '</td><td class="nw">' + s.tl + '</td><td><span class="cxm">' + dots(s.cx) + '</span></td><td class="nw">' + (s.sz || '') + '</td><td>' + ((s.need || [])[0] || '') + '</td></tr>';
    }).join('') || '<tr><td colspan="7" class="empty">Không có dịch vụ khớp bộ lọc.</td></tr>';
  }

  /* =============== WISH / CTA =============== */
  function summary() {
    var items = st.wish.map(function (id) { return byId[id]; });
    return ['[Drabuff AI] Yêu cầu tư vấn triển khai AI',
      items.length ? 'Tôi quan tâm ' + items.length + ' dịch vụ:' : 'Tôi muốn được tư vấn giải pháp AI cho doanh nghiệp.'
    ].concat(items.map(function (s) { return '- ' + s.code + ' · ' + s.n; }))
      .concat(painSel.length ? ['Vấn đề đang gặp: ' + painSel.map(function (i) { return window.PAINS[i].t; }).join('; ')] : [])
      .concat(['Bậc trưởng thành AI hiện tại: Bậc ' + (st.lvl + 1) + ' – ' + window.MATURITY[st.lvl].n, 'Tên doanh nghiệp: ', 'Người liên hệ: ']).join('\n');
  }
  function renderWish() {
    $('#wish').innerHTML = st.wish.length
      ? '<div class="wish">' + st.wish.map(function (id) { var s = byId[id]; return '<button type="button" class="chip2" data-unwish="' + id + '" title="Bỏ khỏi danh sách"><span>' + s.code + '</span>' + s.n + '<em>×</em></button>'; }).join('') + '</div>'
      : '<p class="wish-empty">Chưa có dịch vụ nào. Khi xem một dịch vụ, bấm "Đánh dấu quan tâm" để thêm vào đây; danh sách sẽ được gửi kèm khi bạn nhắn Drabuff AI.</p>';
    $('#wishN').textContent = st.wish.length + ' dịch vụ';
    $('#fabN').textContent = st.wish.length;
    $('#fabN').hidden = !st.wish.length;
    $('#sumtxt').value = summary();
  }
  function toggleWish(id, force) {
    var i = st.wish.indexOf(id);
    if (i > -1 && force !== true) st.wish.splice(i, 1); else if (i < 0) st.wish.push(id);
    save(); renderWish(); renderTabs();
    var fab = $('.fab'); fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
  }

  /* =============== EVENTS =============== */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var q;
    if ((q = t.closest('#catalog .tab'))) { curTab = q.dataset.tab; query = ''; $('#q').value = ''; renderTabs(); return; }
    if ((q = t.closest('.key'))) { open(q.dataset.id, true); return; }
    if ((q = t.closest('.nd'))) { playing = false; step = +q.dataset.i; paintFlow(); return; }
    if ((q = t.closest('#pp'))) { playing = !playing; if (step >= byId[cur].flow.length && playing) step = 0; paintFlow(); return; }
    if ((q = t.closest('#replay'))) { playing = true; play(); return; }
    if ((q = t.closest('#baSeg button'))) { $$('#baSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b === q); }); $('#baG').dataset.mode = q.dataset.ba; return; }
    if ((q = t.closest('#wishBtn'))) { var on = st.wish.indexOf(cur) < 0; toggleWish(cur); q.classList.toggle('on-list', on); q.textContent = on ? '✓ Đã đánh dấu quan tâm' : '+ Đánh dấu quan tâm'; return; }
    if ((q = t.closest('[data-unwish]'))) { toggleWish(q.dataset.unwish); if (q.dataset.unwish === cur) renderViewer(cur); return; }
    if ((q = t.closest('.pain'))) { var p = +q.dataset.p, k = painSel.indexOf(p); if (k > -1) painSel.splice(k, 1); else painSel.push(p); renderFinder(); renderWish(); return; }
    if ((q = t.closest('#frWish'))) { $('#frList').dataset.ids.split(',').forEach(function (id) { toggleWish(id, true); }); q.textContent = '✓ Đã đánh dấu'; return; }
    if ((q = t.closest('[data-sc]'))) { sc = +q.dataset.sc; $$('[data-sc]').forEach(function (b) { b.setAttribute('aria-pressed', b === q); }); simReset(); return; }
    if ((q = t.closest('#simRun'))) { simRun(); return; }
    if ((q = t.closest('.stair'))) { st.lvl = +q.dataset.lv; save(); renderLevel(); renderWish(); return; }
    if ((q = t.closest('[data-pr]'))) {
      var pr = q.dataset.pr; $$('[data-pr]').forEach(function (b) { b.setAttribute('aria-pressed', b === q); });
      $$('.cm').forEach(function (c) { c.classList.toggle('pick', c.dataset.cm === pr); c.classList.toggle('dim', pr !== 'hybrid' && c.dataset.cm !== pr); });
      $('#hybrid').classList.toggle('pick', pr === 'hybrid'); return;
    }
    if ((q = t.closest('#tcx button'))) { tcx = +q.dataset.cx; $$('#tcx button').forEach(function (b) { b.setAttribute('aria-pressed', b === q); }); renderTable(); return; }
    if ((q = t.closest('.flip'))) { q.classList.toggle('on'); return; }
    if ((q = t.closest('[data-open]'))) { var id = q.dataset.open; if (!query) curTab = byId[id].cat; open(id, true); return; }
    if ((q = t.closest('.slab'))) {
      var ly = document.getElementById('ly-' + q.dataset.ly); go(ly, 'center');
      ly.classList.add('flash'); setTimeout(function () { ly.classList.remove('flash'); }, 1800); return;
    }
    if ((q = t.closest('#copy'))) {
      var txt = summary(), ok = function () { $('#copied').textContent = 'Đã sao chép. Mở Zalo ' + C.display + ' và dán vào tin nhắn.'; };
      var fb = function () { var ta = $('#sumtxt'); ta.hidden = false; ta.focus(); ta.select(); $('#copied').textContent = 'Trình duyệt chặn sao chép tự động. Nội dung đã được bôi đen, nhấn Ctrl/⌘ + C.'; };
      try { navigator.clipboard.writeText(txt).then(ok, fb); } catch (err) { fb(); }
    }
  });
  document.addEventListener('keydown', function (e) {
    var tr = e.target.closest && e.target.closest('tr[data-open]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(tr.dataset.open, true); return; }
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var r = $('#viewer').getBoundingClientRect();
    if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      var i = SV.indexOf(byId[cur]); open(SV[(i + (e.key === 'ArrowRight' ? 1 : -1) + SV.length) % SV.length].id, false);
    }
  });
  var qT; $('#q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { query = e.target.value.trim(); renderTabs(); }, 120); });
  ['#tq', '#tcat', '#tsort'].forEach(function (s) { $(s).addEventListener(s === '#tq' ? 'input' : 'change', renderTable); });

  /* =============== EFFECTS =============== */
  // spotlight follows pointer on .spot surfaces
  if (fine && !reduce) document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.spot'); if (!el) return;
    var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  // hero iso tilt
  if (fine && !reduce) {
    var iso = $('#iso'), host = iso.parentElement;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      iso.style.transform = 'rotateX(' + (58 - y * 14) + 'deg) rotateZ(' + (-40 + x * 18) + 'deg)';
    });
    host.addEventListener('pointerleave', function () { iso.style.transform = ''; });
  }
  // typewriter
  (function () {
    var el = $('#typer'), words = SV.map(function (s) { return s.n; }), w = 0, c = 0, del = false;
    if (reduce) { el.textContent = words[0]; return; }
    (function loop() {
      var word = words[w];
      c += del ? -1 : 1; el.textContent = word.slice(0, c);
      var d = del ? 28 : 55;
      if (!del && c >= word.length) { del = true; d = 1400; }
      else if (del && c <= 0) { del = false; w = (w + 1) % words.length; d = 300; }
      setTimeout(loop, d);
    })();
  })();
  // count-up
  if (!reduce) $$('.cnt').forEach(function (el) {
    var to = +el.dataset.count, t0 = performance.now();
    (function f(now) { var p = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  });
  // scroll progress + dock active section
  var secs = $$('.sec'), prog = $('#prog');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight; prog.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    var active = null; secs.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.35) active = s.id; });
    $$('.dock a').forEach(function (a) { var on = a.dataset.sec === active; if (on !== a.classList.contains('on')) { a.classList.toggle('on', on); if (on && a.scrollIntoView && a.parentElement.scrollWidth > a.parentElement.clientWidth) a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' }); } });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // reveal on scroll (only for elements that start below the fold, so the first frame is complete)
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('rv-wait'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('rv-wait'); io.observe(el); } });
  }

  /* =============== INIT =============== */
  renderFinder(); renderTabs(); renderViewer(cur); renderExplored(); simReset(); renderLevel(); renderTable(); renderWish(); onScroll();
  if (st.seen.indexOf(cur) < 0) { st.seen.push(cur); save(); renderExplored(); }
  $('.prio2 [data-pr="llmprivate"]').click();
})();
