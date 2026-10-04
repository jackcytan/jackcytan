/* Drabuff AI — AI Automation Blueprint Designer */
(function () {
  var CM = window.COMMON, esc = function (s) { return window.UI.esc(s); };

  var depts = [
    { v: 'cskh', label: 'Chăm sóc khách hàng' },
    { v: 'sales', label: 'Kinh doanh / Sales' },
    { v: 'marketing', label: 'Marketing' },
    { v: 'ops', label: 'Vận hành / Kho / Sản xuất' },
    { v: 'finance', label: 'Kế toán / Tài chính' },
    { v: 'hr', label: 'Nhân sự' },
    { v: 'mgmt', label: 'Báo cáo cho lãnh đạo' }
  ];
  var channels = [
    { v: 'zalo', label: 'Zalo / Zalo OA' },
    { v: 'facebook', label: 'Facebook / Messenger' },
    { v: 'web', label: 'Website / Live chat' },
    { v: 'phone', label: 'Điện thoại / Tổng đài' },
    { v: 'email', label: 'Email' },
    { v: 'shop', label: 'Sàn TMĐT / TikTok Shop' }
  ];
  var pains = [
    { v: 'slow_reply', label: 'Trả lời khách chậm, sót tin ngoài giờ' },
    { v: 'manual_entry', label: 'Nhập liệu thủ công, copy giữa các hệ thống' },
    { v: 'reports', label: 'Lập báo cáo mất nhiều giờ, số liệu rời rạc' },
    { v: 'content', label: 'Content không đều, phụ thuộc vài người' },
    { v: 'leads', label: 'Bỏ sót lead, không biết khách nào đang "nóng"' },
    { v: 'docs', label: 'Xử lý hóa đơn, chứng từ, hợp đồng thủ công' },
    { v: 'hiring', label: 'Lọc CV & tuyển dụng tốn thời gian' },
    { v: 'knowledge', label: 'Nhân viên mới hỏi lặp lại, tri thức nằm trong đầu người cũ' },
    { v: 'calls', label: 'Tổng đài quá tải cuộc gọi' }
  ];
  var systems = [
    { v: 'sheets', label: 'Google Sheets / Excel' },
    { v: 'crm', label: 'CRM', desc: 'HubSpot, Getfly, Salesforce…' },
    { v: 'erp', label: 'ERP / Kế toán', desc: 'MISA, Odoo, SAP…' },
    { v: 'pos', label: 'Phần mềm bán hàng / POS', desc: 'KiotViet, Sapo, Haravan…' },
    { v: 'drive', label: 'Google Drive / SharePoint' },
    { v: 'none', label: 'Chưa có hệ thống', desc: 'Chủ yếu giấy tờ, chat' }
  ];
  var techs = [
    { v: 'none', label: 'Không có IT', desc: 'Cần đơn vị triển khai trọn gói' },
    { v: 'it', label: 'Có IT nội bộ cơ bản', desc: 'Quản trị hệ thống, phần mềm' },
    { v: 'dev', label: 'Có đội lập trình', desc: 'Có thể cùng phát triển & tích hợp' }
  ];
  var datas = [
    { v: 'normal', label: 'Dữ liệu thông thường', desc: 'Dùng được nền tảng AI đám mây' },
    { v: 'sensitive', label: 'Dữ liệu nhạy cảm', desc: 'Ưu tiên máy chủ riêng, kiểm soát chặt' }
  ];
  var timelines = [
    { v: 'asap', label: 'Trong 1 tháng tới' },
    { v: 'q', label: '1 – 3 tháng tới' },
    { v: 'later', label: 'Đang tìm hiểu' }
  ];
  var budgets = [
    { v: 's', label: 'Thử nghiệm nhỏ', desc: 'Bắt đầu với 1 giải pháp, đo kết quả' },
    { v: 'm', label: 'Đầu tư có trọng tâm', desc: '2–3 giải pháp, ROI rõ ràng' },
    { v: 'l', label: 'Chuyển đổi toàn diện', desc: 'Nhiều phòng ban, lộ trình dài hạn' }
  ];

  /* ---- service catalogue ---- */
  var S = {
    chatbot: { n: 'AI Chatbot CSKH đa kênh', cx: 1, tl: '2–4 tuần',
      d: 'Trợ lý AI trả lời khách 24/7 trên Zalo OA, Fanpage và website bằng chính kiến thức sản phẩm của doanh nghiệp, tự chuyển cho nhân viên khi cần.',
      f: [['ĐẦU VÀO', 'Tin nhắn {ch}'], ['AI XỬ LÝ', 'Hiểu ý định, tra kho tri thức {item}'], ['HÀNH ĐỘNG', 'Trả lời, tư vấn, đặt lịch / lên đơn'], ['ĐẦU RA', 'Chuyển nhân viên + lưu vào {sys}']],
      ft: ['Huấn luyện trên FAQ, bảng giá, chính sách', 'Thu thập tên, SĐT, nhu cầu tự động', 'Báo cáo câu hỏi thường gặp mỗi tuần'],
      im: 'Phản hồi dưới 10 giây, tự xử lý 60–80% câu hỏi lặp lại' },
    sales: { n: 'AI Sales Assistant & chấm điểm lead', cx: 2, tl: '3–5 tuần',
      d: 'Gom lead từ mọi kênh về một nơi, AI chấm điểm mức độ quan tâm, gợi ý kịch bản và nhắc sales chăm sóc đúng lúc.',
      f: [['ĐẦU VÀO', 'Lead từ form, inbox, quảng cáo'], ['AI XỬ LÝ', 'Làm sạch, chấm điểm nóng/ấm/lạnh'], ['HÀNH ĐỘNG', 'Phân bổ sales + gợi ý kịch bản'], ['ĐẦU RA', 'Nhắc follow-up, cập nhật {sys}']],
      ft: ['Không trùng, không sót lead', 'Tóm tắt lịch sử khách trước mỗi cuộc gọi', 'Báo cáo tỷ lệ chuyển đổi theo nguồn'],
      im: 'Tăng 15–30% tỷ lệ chốt nhờ chăm sóc đúng thời điểm' },
    content: { n: 'AI Content Engine', cx: 1, tl: '2–3 tuần',
      d: 'Dây chuyền sản xuất nội dung: AI lên lịch, viết bài, gợi ý hình ảnh theo giọng thương hiệu; người duyệt trước khi đăng.',
      f: [['ĐẦU VÀO', 'Brief, sản phẩm, chiến dịch'], ['AI XỬ LÝ', 'Lên lịch & viết theo giọng thương hiệu'], ['HÀNH ĐỘNG', 'Duyệt 1 chạm trên Sheets/Zalo'], ['ĐẦU RA', 'Lên lịch đăng đa kênh']],
      ft: ['Bộ "giọng thương hiệu" huấn luyện riêng', 'Đa định dạng: bài đăng, email, kịch bản video', 'Kho nội dung tái sử dụng'],
      im: 'Gấp 3–5 lần sản lượng nội dung với cùng nhân sự' },
    reports: { n: 'Báo cáo tự động & AI Dashboard', cx: 2, tl: '3–4 tuần',
      d: 'Kéo số liệu từ các nguồn về một dashboard, AI tự viết nhận xét và gửi báo cáo cho lãnh đạo theo lịch.',
      f: [['ĐẦU VÀO', 'Số liệu {sys}'], ['AI XỬ LÝ', 'Gộp, làm sạch, phát hiện bất thường'], ['HÀNH ĐỘNG', 'Viết nhận xét & cảnh báo'], ['ĐẦU RA', 'Dashboard + báo cáo qua Zalo/Email']],
      ft: ['Báo cáo ngày/tuần/tháng tự động', 'Cảnh báo khi chỉ số vượt ngưỡng', 'Hỏi đáp số liệu bằng tiếng Việt'],
      im: 'Giảm 70–90% thời gian lập báo cáo định kỳ' },
    docs: { n: 'AI xử lý chứng từ & hợp đồng', cx: 2, tl: '3–5 tuần',
      d: 'AI đọc hóa đơn, chứng từ, hợp đồng (ảnh/PDF), trích xuất thông tin, kiểm tra sai lệch và đẩy vào hệ thống.',
      f: [['ĐẦU VÀO', 'Ảnh, PDF, email đính kèm'], ['AI XỬ LÝ', 'OCR + trích xuất trường dữ liệu'], ['HÀNH ĐỘNG', 'Đối chiếu, đánh dấu điểm bất thường'], ['ĐẦU RA', 'Ghi vào {sys} + lưu trữ']],
      ft: ['Nhận dạng tiếng Việt & tiếng Anh', 'Kiểm tra chéo số tiền, mã số thuế, điều khoản', 'Người duyệt các trường hợp nghi vấn'],
      im: 'Giảm 60–80% thời gian nhập liệu, hạn chế sai sót' },
    workflow: { n: 'Tự động hóa quy trình nội bộ', cx: 1, tl: '2–4 tuần',
      d: 'Kết nối các công cụ đang dùng thành quy trình chạy tự động: từ form, email, Zalo đến bảng tính và phần mềm, có AI xử lý ở giữa.',
      f: [['TRIGGER', 'Form, email, tin nhắn, lịch'], ['AI XỬ LÝ', 'Phân loại, tóm tắt, soạn nội dung'], ['HÀNH ĐỘNG', 'Tạo việc, cập nhật dữ liệu, phê duyệt'], ['ĐẦU RA', 'Thông báo đúng người qua Zalo/Email']],
      ft: ['Xây trên n8n / Make, dễ mở rộng', 'Nhật ký chạy & cảnh báo lỗi', 'Bàn giao tài liệu vận hành'],
      im: 'Cắt bỏ 30–50% thao tác thủ công ở quy trình được tự động' },
    knowledge: { n: 'Trợ lý tri thức nội bộ', cx: 2, tl: '3–4 tuần',
      d: 'Một "đồng nghiệp AI" đã đọc toàn bộ SOP, chính sách, tài liệu sản phẩm; nhân viên hỏi gì đáp nấy, có trích nguồn.',
      f: [['ĐẦU VÀO', 'SOP, chính sách, tài liệu {item}'], ['AI XỬ LÝ', 'Lập chỉ mục & tìm đoạn liên quan'], ['HÀNH ĐỘNG', 'Trả lời kèm trích dẫn nguồn'], ['ĐẦU RA', 'Chat trên Zalo / web nội bộ']],
      ft: ['Phân quyền theo phòng ban', 'Tự cập nhật khi tài liệu thay đổi', 'Thống kê câu hỏi để cải thiện SOP'],
      im: 'Rút ngắn 40–60% thời gian onboarding nhân viên mới' },
    hiring: { n: 'AI Tuyển dụng & Onboarding', cx: 1, tl: '2–3 tuần',
      d: 'AI viết JD, sàng lọc CV theo tiêu chí, xếp hạng ứng viên, đặt lịch phỏng vấn và gửi lộ trình onboarding.',
      f: [['ĐẦU VÀO', 'CV từ email, website, job board'], ['AI XỬ LÝ', 'Chấm điểm theo tiêu chí vị trí'], ['HÀNH ĐỘNG', 'Shortlist + câu hỏi phỏng vấn'], ['ĐẦU RA', 'Đặt lịch & gửi thông báo']],
      ft: ['Tiêu chí minh bạch, giải thích được', 'Mẫu email tuyển dụng tự động', 'Checklist onboarding theo vị trí'],
      im: 'Giảm 50–70% thời gian sàng lọc hồ sơ' },
    voice: { n: 'Voice AI – Tổng đài thông minh', cx: 3, tl: '4–6 tuần',
      d: 'Tổng đài viên AI nghe – hiểu – trả lời bằng giọng nói tiếng Việt, gọi xác nhận đơn, nhắc lịch và ghi chép cuộc gọi.',
      f: [['ĐẦU VÀO', 'Cuộc gọi đến / danh sách gọi đi'], ['AI XỬ LÝ', 'Nhận dạng & tổng hợp giọng nói'], ['HÀNH ĐỘNG', 'Trả lời, xác nhận, đặt lịch'], ['ĐẦU RA', 'Tóm tắt cuộc gọi vào {sys}']],
      ft: ['Giọng đọc tự nhiên', 'Chuyển máy cho nhân viên khi cần', 'Chấm điểm chất lượng cuộc gọi'],
      im: 'Xử lý cuộc gọi lặp lại không giới hạn, giảm tải tổng đài' },
    agent: { n: 'AI Agent chuyên biệt', cx: 3, tl: '6–10 tuần',
      d: 'Agent được thiết kế riêng cho nghiệp vụ lõi, tự thực hiện chuỗi công việc nhiều bước và tích hợp sâu vào hệ thống hiện có.',
      f: [['MỤC TIÊU', 'Nghiệp vụ lõi của {n}'], ['AI LẬP KẾ HOẠCH', 'Chia nhỏ việc, gọi công cụ'], ['HÀNH ĐỘNG', 'Thao tác trên {sys} qua API'], ['KIỂM SOÁT', 'Người duyệt ở điểm quan trọng']],
      ft: ['Thiết kế cùng đội IT/dev của bạn', 'Nhật ký & kiểm soát quyền chặt chẽ', 'Đo hiệu quả theo KPI nghiệp vụ'],
      im: 'Tự động hóa trọn một nghiệp vụ nhiều bước' }
  };

  function score(A) {
    var p = A.pains || [], d = A.depts || [], ch = A.channels || [], sy = A.systems || [], v = Number(A.volume || 0);
    var has = function (arr, x) { return arr.indexOf(x) > -1; };
    var sc = {}, why = {};
    var add = function (k, n, w) { sc[k] = (sc[k] || 0) + n; if (w) (why[k] = why[k] || []).push(w); };
    if (has(p, 'slow_reply')) add('chatbot', 6, 'khách đang phải chờ phản hồi');
    if (has(d, 'cskh')) add('chatbot', 3, 'bạn muốn ứng dụng cho CSKH');
    ['zalo', 'facebook', 'web', 'shop'].forEach(function (c) { if (has(ch, c)) add('chatbot', 1); });
    if (v >= 50) add('chatbot', 2, 'khoảng ' + v.toLocaleString('vi-VN') + ' lượt hỏi mỗi ngày');
    if (v >= 300) add('chatbot', 3);
    if (has(p, 'leads')) add('sales', 6, 'lead đang bị bỏ sót');
    if (has(d, 'sales')) add('sales', 3, 'đội sales cần công cụ hỗ trợ');
    if (has(sy, 'crm')) add('sales', 2, 'đã có CRM để tích hợp');
    if (has(p, 'content')) add('content', 6, 'content đang phụ thuộc vài người');
    if (has(d, 'marketing')) add('content', 3, 'bạn muốn ứng dụng cho marketing');
    if (has(p, 'reports')) add('reports', 6, 'báo cáo đang làm thủ công');
    if (has(d, 'mgmt')) add('reports', 4, 'lãnh đạo cần số liệu kịp thời');
    if (has(d, 'finance')) add('reports', 1);
    if (has(sy, 'sheets') || has(sy, 'erp') || has(sy, 'pos')) add('reports', 1);
    if (has(p, 'docs')) add('docs', 6, 'chứng từ & hợp đồng đang xử lý tay');
    if (has(d, 'finance')) add('docs', 3, 'phòng kế toán xử lý nhiều chứng từ');
    if (has(p, 'manual_entry')) { add('docs', 2); add('workflow', 6, 'nhân sự đang nhập liệu, copy giữa các hệ thống'); }
    if (has(d, 'ops')) add('workflow', 3, 'vận hành có nhiều bước lặp lại');
    add('workflow', 1);
    if (has(p, 'knowledge')) add('knowledge', 6, 'tri thức đang nằm trong đầu người cũ');
    if (A.size === 's3' || A.size === 's4' || A.size === 's5') add('knowledge', 2, 'quy mô nhân sự lớn');
    if (has(p, 'hiring')) add('hiring', 6, 'lọc CV đang tốn nhiều thời gian');
    if (has(d, 'hr')) add('hiring', 3, 'bạn muốn ứng dụng cho nhân sự');
    if (has(p, 'calls')) add('voice', 6, 'tổng đài đang quá tải');
    if (has(ch, 'phone')) add('voice', 2);
    if (A.tech === 'dev') add('agent', 3, 'có đội lập trình để cùng phát triển');
    if (A.budget === 'l') add('agent', 3, 'định hướng chuyển đổi toàn diện');
    return { sc: sc, why: why };
  }

  function pickServices(A) {
    var r = score(A), keys = Object.keys(r.sc).sort(function (a, b) { return r.sc[b] - r.sc[a] || S[a].cx - S[b].cx; });
    var max = A.budget === 's' ? 3 : A.budget === 'l' ? 6 : 4;
    var list = keys.filter(function (k) { return r.sc[k] >= 3; }).slice(0, max);
    if (list.length < 3) keys.forEach(function (k) { if (list.length < 3 && list.indexOf(k) < 0) list.push(k); });
    // phase: first quick win = highest score with cx<=2
    var phase = {}, qw = list.filter(function (k) { return S[k].cx <= 2; })[0] || list[0];
    list.forEach(function (k, i) { phase[k] = k === qw ? 1 : (S[k].cx === 3 || i >= 3 ? 3 : 2); });
    list.sort(function (a, b) { return phase[a] - phase[b] || r.sc[b] - r.sc[a]; });
    return { list: list, phase: phase, why: r.why, sc: r.sc };
  }

  window.PAGE = {
    id: 'automation', codePrefix: 'DRB-AX',
    kicker: 'DRABUFF AI · THIẾT KẾ TỰ ĐỘNG HÓA DOANH NGHIỆP',
    title: 'Bản thiết kế <em>AI Automation</em> cho doanh nghiệp của bạn',
    lead: 'Trả lời 5 khối câu hỏi trong khoảng 3 phút. Drabuff AI sẽ phân tích quy trình, kênh khách hàng và hệ thống bạn đang dùng, rồi đề xuất <b>những dịch vụ AI nên triển khai</b>: chạy thế nào, tích hợp với đâu, tiết kiệm bao nhiêu giờ và làm gì trước.',
    startLabel: 'Bắt đầu thiết kế quy trình', finishLabel: 'Tạo bản thiết kế',
    hint: '5 KHỐI · ~3 PHÚT · MIỄN PHÍ',
    facts: [['10', 'giải pháp AI trong thư viện'], ['3 giai đoạn', 'lộ trình triển khai rõ ràng'], ['Giờ/tháng', 'ước tính thời gian tiết kiệm']],
    sample:
      '<div class="sm-card"><div class="sm-tag"><span>Ví dụ bản thiết kế</span><span>DRB-AX-4QN8</span></div>' +
      '<div class="sm-title">Chuỗi spa 6 chi nhánh: tự động hóa CSKH & báo cáo</div>' +
      '<div class="sm-meta"><span>4 giải pháp</span><span>3 giai đoạn</span><span>~320 giờ/tháng</span></div>' +
      '<div class="sm-rows">' +
        '<div class="sm-row"><b>GĐ 1</b><span class="sm-bar" style="width:94%">AI Chatbot CSKH đa kênh</span></div>' +
        '<div class="sm-row"><b>GĐ 2</b><span class="sm-bar" style="width:82%">Báo cáo tự động & AI Dashboard</span></div>' +
        '<div class="sm-row"><b>GĐ 2</b><span class="sm-bar" style="width:74%">Tự động hóa quy trình nội bộ</span></div>' +
        '<div class="sm-row"><b>GĐ 3</b><span class="sm-bar" style="width:62%">Voice AI nhắc lịch</span></div>' +
      '</div></div>' +
      '<div class="sm-float f1"><b>24/7</b><small>phản hồi khách tự động</small></div>' +
      '<div class="sm-float f2"><span class="sm-chip"><i></i>Zalo OA → AI → CRM → Báo cáo</span></div>',
    thinkTitle: 'Đang thiết kế hệ thống AI cho doanh nghiệp bạn',
    steps: [
      CM.infoStep('Thông tin để Drabuff AI gửi bản thiết kế và hiểu bối cảnh vận hành của bạn.'),
      { title: 'Phạm vi & kênh khách hàng', sub: 'AI sẽ được đặt vào đâu trong doanh nghiệp?', qs: [
        { id: 'depts', type: 'multi', label: 'Bộ phận muốn ứng dụng AI', req: true, options: depts },
        { id: 'channels', type: 'multi', label: 'Khách hàng liên hệ qua kênh nào?', options: channels },
        { id: 'volume', type: 'range', label: 'Lượt tin nhắn / yêu cầu khách mỗi ngày', min: 0, max: 2000, step: 10, def: 120, unit: 'lượt/ngày', plus: true }
      ] },
      { title: 'Điểm nghẽn vận hành', sub: 'Chọn những vấn đề đang tốn thời gian hoặc làm mất doanh thu.', qs: [
        { id: 'pains', type: 'multi', label: 'Vấn đề đang gặp', req: true, max: 4, wide: true, options: pains },
        { id: 'hours', type: 'range', label: 'Tổng số giờ làm việc thủ công, lặp lại mỗi tuần (cả công ty)', help: 'Ước lượng: số người × số giờ mỗi người dành cho việc lặp lại.', min: 5, max: 400, step: 5, def: 60, unit: 'giờ/tuần', plus: true }
      ] },
      { title: 'Hệ thống & nguồn lực', sub: 'Để giải pháp tích hợp được với những gì bạn đang có.', qs: [
        { id: 'systems', type: 'multi', label: 'Hệ thống đang sử dụng', exclusive: ['none'], options: systems },
        { id: 'tech', type: 'single', label: 'Đội ngũ kỹ thuật', req: true, options: techs },
        { id: 'data', type: 'single', label: 'Tính chất dữ liệu', req: true, half: true, options: datas },
        { id: 'timeline', type: 'single', label: 'Muốn triển khai khi nào?', req: true, half: true, options: timelines },
        { id: 'budget', type: 'single', label: 'Định hướng đầu tư', req: true, options: budgets }
      ] },
      { title: 'Quy trình cụ thể', sub: 'Hai câu trả lời ngắn để Drabuff AI thiết kế sát thực tế nhất.', qs: [
        { id: 'process', type: 'textarea', label: 'Mô tả 1 quy trình đang làm thủ công mà bạn muốn tự động hóa nhất', req: true, ph: 'VD: Khách nhắn Zalo hỏi giá → nhân viên tra bảng giá → báo giá → nhập vào Excel → cuối ngày tổng hợp gửi sếp…', sugs: ['Tiếp nhận & trả lời tin nhắn khách', 'Nhập đơn hàng vào phần mềm', 'Tổng hợp báo cáo doanh số', 'Xử lý hóa đơn đầu vào'] },
        { id: 'success', type: 'textarea', label: 'Sau 3 tháng, thế nào là thành công với bạn?', ph: 'VD: Không còn tin nhắn nào bị trả lời sau 5 phút; báo cáo tự đến lúc 8h sáng…', sugs: ['Giảm một nửa thời gian làm thủ công', 'Không bỏ sót khách hàng nào', 'Lãnh đạo xem số liệu theo thời gian thực'] }
      ] }
    ],
    logs: function (A) {
      var c = CM.ctx[A.industry] || CM.ctx.other;
      return [
        'Nạp hồ sơ: ' + esc(A.company) + ' · ngành ' + c.n,
        'Lập bản đồ ' + (A.depts || []).length + ' bộ phận · ' + (A.channels || []).length + ' kênh khách hàng',
        'Phân tích ' + (A.pains || []).length + ' điểm nghẽn · ' + Number(A.hours || 0) + ' giờ thủ công/tuần',
        'Chấm điểm phù hợp cho ' + Object.keys(S).length + ' giải pháp trong thư viện Drabuff AI',
        'Kiểm tra khả năng tích hợp với ' + (CM.labels(systems, A.systems).join(', ') || 'hệ thống hiện tại'),
        'Xếp giai đoạn: quick win → mở rộng → nâng cao',
        'Ước tính thời gian tiết kiệm & mức tự động hóa',
        'Hoàn tất bản thiết kế AI Automation'
      ];
    },
    generate: function (A, code) {
      var c = CM.ctx[A.industry] || CM.ctx.other, R = pickServices(A);
      var chL = CM.labels(channels, A.channels), syL = CM.labels(systems, (A.systems || []).filter(function (x) { return x !== 'none'; }));
      var SHORT = { sheets: 'Google Sheets', crm: 'CRM', erp: 'ERP/MISA', pos: 'phần mềm bán hàng', drive: 'Drive' };
      var sysTxt = (A.systems || []).filter(function (x) { return SHORT[x]; }).slice(0, 2).map(function (x) { return SHORT[x]; }).join(' / ') || 'Google Sheets', chTxt = chL.length ? chL.slice(0, 3).join(', ') : 'Zalo, Facebook, website';
      var fill = function (s) { return s.replace('{ch}', chTxt).replace('{sys}', sysTxt).replace('{item}', c.item).replace('{n}', c.n); };
      var hours = Number(A.hours || 0), vol = Number(A.volume || 0);
      var covMap = { chatbot: 0.12, sales: 0.1, content: 0.12, reports: 0.14, docs: 0.14, workflow: 0.16, knowledge: 0.08, hiring: 0.08, voice: 0.08, agent: 0.12 };
      var cov = Math.min(0.65, R.list.reduce(function (s, k) { return s + covMap[k]; }, 0));
      var saved = Math.round(hours * cov * 4.3 / 5) * 5;
      var autoMsg = R.list.indexOf('chatbot') > -1 ? Math.round(vol * 0.7 * 30 / 10) * 10 : 0;
      var p1 = R.list.filter(function (k) { return R.phase[k] === 1; }).map(function (k) { return S[k].tl; })[0] || '2–4 tuần';
      var prioName = { 1: 'GĐ 1 · QUICK WIN', 2: 'GĐ 2 · MỞ RỘNG', 3: 'GĐ 3 · NÂNG CAO' };

      var lanes =
        '<div class="arch">' +
          '<div class="lane"><h5>KÊNH & NGUỒN DỮ LIỆU</h5>' + (chL.length ? chL : ['Tin nhắn khách hàng']).concat(['Form, email nội bộ']).map(function (x) { return '<div class="node">' + x + '</div>'; }).join('') + '</div>' +
          '<div class="lane core"><h5>DRABUFF AI LAYER</h5>' + R.list.map(function (k) { return '<div class="node">' + S[k].n + '</div>'; }).join('') + '</div>' +
          '<div class="lane"><h5>HỆ THỐNG TÍCH HỢP</h5>' + (syL.length ? syL : ['Google Sheets (đề xuất)']).map(function (x) { return '<div class="node">' + x + '</div>'; }).join('') + '<div class="node">Workflow n8n / Make</div></div>' +
          '<div class="lane"><h5>ĐẦU RA</h5><div class="node">Khách được phục vụ 24/7</div><div class="node">Thông báo Zalo cho nhân sự</div><div class="node">Dashboard cho lãnh đạo</div></div>' +
        '</div>';

      var cards = R.list.map(function (k) {
        var s = S[k], ph = R.phase[k], w = (R.why[k] || []).slice(0, 3);
        return '<article class="svc reveal"><div class="svc-h"><div><h4>' + s.n + '</h4><p>' + s.d + '</p></div><span class="prio' + (ph > 1 ? ' p' + ph : '') + '">' + prioName[ph] + '</span></div>' +
          (w.length ? '<p class="fit"><b>Phù hợp vì:</b> ' + w.join('; ') + '.</p>' : '') +
          '<div class="flow">' + s.f.map(function (f) { return '<div class="fs"><span>' + f[0] + '</span>' + fill(f[1]) + '</div>'; }).join('') + '</div>' +
          '<div class="svc-b"><div><h5>Tính năng chính</h5><ul>' + s.ft.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
          '<div><h5>Hiệu quả kỳ vọng</h5><p>' + s.im + '</p></div>' +
          '<div><h5>Thời gian triển khai</h5><p>' + s.tl + '</p></div></div></article>';
      }).join('');

      var phases = [1, 2, 3].map(function (n) {
        var ks = R.list.filter(function (k) { return R.phase[k] === n; });
        var head = { 1: ['TUẦN 1 – 4', 'Quick win: thấy kết quả ngay'], 2: ['THÁNG 2 – 3', 'Mở rộng sang các bộ phận'], 3: ['THÁNG 4 – 6', 'Nâng cao & tối ưu'] }[n];
        var items = ks.map(function (k) { return S[k].n; });
        if (n === 1) items.push('Đo chỉ số nền (baseline) trước khi chạy');
        if (n === 2) items.push('Kết nối dữ liệu giữa các giải pháp');
        if (n === 3) items.push('Đánh giá ROI, tinh chỉnh mô hình', 'Đào tạo đội ngũ tự vận hành');
        return '<div class="ph"><span class="mono">' + head[0] + '</span><h4>' + head[1] + '</h4><ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      }).join('');

      var deploy = [];
      deploy.push(A.data === 'sensitive'
        ? ['Hạ tầng riêng cho dữ liệu nhạy cảm', 'Triển khai n8n và kho tri thức trên máy chủ riêng, ẩn danh dữ liệu trước khi gửi tới mô hình AI, phân quyền và ghi nhật ký truy cập.']
        : ['Nền tảng đám mây bảo mật', 'Dùng API AI doanh nghiệp (không dùng dữ liệu để huấn luyện), phân quyền theo vai trò.']);
      deploy.push({ none: ['Triển khai trọn gói', 'Drabuff AI làm toàn bộ phần kỹ thuật, bàn giao màn hình quản trị đơn giản và hướng dẫn nhân sự vận hành.'], it: ['Phối hợp cùng IT nội bộ', 'Drabuff AI xây dựng, IT của bạn được đào tạo để quản trị và xử lý sự cố cấp 1.'], dev: ['Cùng phát triển với đội dev', 'Drabuff AI thiết kế kiến trúc & agent; đội dev của bạn tham gia tích hợp API và tiếp quản mã nguồn.'] }[A.tech || 'none']);
      deploy.push({ asap: ['Khởi động nhanh', 'Khảo sát trong tuần đầu, bản chạy thử (POC) giải pháp quick win sau ' + p1 + '.'], q: ['Lộ trình 1–3 tháng', 'Khảo sát & POC trong tháng đầu, đưa vào vận hành chính thức từ tháng thứ 2.'], later: ['Bắt đầu bằng buổi khảo sát', 'Drabuff AI đánh giá hiện trạng và ước tính ROI chi tiết để bạn quyết định.'] }[A.timeline || 'q']);

      var html =
        '<section class="panel r-head reveal">' +
          '<p class="eyebrow"><span><span class="dot" style="display:inline-block;margin-right:10px"></span>BẢN THIẾT KẾ AI AUTOMATION</span><span class="mono">' + code + '</span></p>' +
          '<p class="r-for">Thiết kế riêng cho <b>' + esc(A.company) + '</b>' + (A.contact ? ' · ' + esc(A.contact) : '') + ' · ' + CM.label(CM.industries, A.industry) + ' · ' + CM.label(CM.sizes, A.size) + '</p>' +
          '<h2 class="r-title">' + R.list.length + ' dịch vụ AI nên triển khai<br><em>theo đúng thứ tự ưu tiên</em></h2>' +
          '<p class="r-sum">Dựa trên ' + (A.pains || []).length + ' điểm nghẽn, ' + (A.depts || []).length + ' bộ phận và hệ thống hiện có, Drabuff AI đề xuất bắt đầu bằng <b style="color:var(--fg)">' + S[R.list[0]].n + '</b> để có kết quả trong ' + p1 + ', sau đó mở rộng theo lộ trình 3 giai đoạn.</p>' +
          '<div class="tiles">' +
            '<div class="tile"><span>Giải pháp</span><b>' + R.list.length + '</b><small>chia 3 giai đoạn</small></div>' +
            '<div class="tile"><span>Giờ tiết kiệm</span><b>~' + saved.toLocaleString('vi-VN') + '</b><small>giờ/tháng (ước tính)</small></div>' +
            '<div class="tile"><span>Tự động hóa</span><b>' + (autoMsg ? '~' + autoMsg.toLocaleString('vi-VN') : Math.round(cov * 100) + '%') + '</b><small>' + (autoMsg ? 'tin nhắn/tháng do AI xử lý' : 'khối lượng việc lặp lại') + '</small></div>' +
            '<div class="tile"><span>Quick win</span><b>' + p1 + '</b><small>có kết quả đầu tiên</small></div>' +
          '</div>' +
        '</section>' +
        '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">KIẾN TRÚC TỔNG THỂ</p><h3>Dữ liệu chảy qua hệ thống AI như thế nào</h3><p>Từ kênh khách hàng, qua lớp AI của Drabuff, kết nối với hệ thống bạn đang dùng và trả kết quả về đúng người.</p></div>' + lanes + '</section>' +
        '<section class="reveal"><div class="sec-h" style="padding-inline:4px"><p class="eyebrow">DỊCH VỤ ĐỀ XUẤT</p><h3>Chi tiết từng giải pháp</h3></div><div class="svcs">' + cards + '</div></section>' +
        '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">LỘ TRÌNH TRIỂN KHAI</p><h3>3 giai đoạn, làm cái tạo kết quả nhanh nhất trước</h3></div><div class="phases">' + phases + '</div></section>' +
        '<div class="grid2">' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">PHƯƠNG ÁN TRIỂN KHAI</p><h3>Phù hợp nguồn lực của bạn</h3></div><ul class="checks">' + deploy.map(function (d) { return '<li>' + d[0] + '<small>' + d[1] + '</small></li>'; }).join('') + '</ul></section>' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">ĐIỂM XUẤT PHÁT</p><h3>Quy trình bạn muốn tự động hóa</h3></div>' +
            '<div class="quote"><span>BẠN MÔ TẢ</span>“' + esc(A.process || '') + '”</div>' +
            (A.success ? '<div class="quote" style="margin-top:12px"><span>TIÊU CHÍ THÀNH CÔNG SAU 3 THÁNG</span>“' + esc(A.success) + '”</div>' : '') +
            '<p class="note">Drabuff AI sẽ vẽ lại quy trình này thành sơ đồ trước/sau và dùng tiêu chí của bạn làm KPI nghiệm thu.</p></section>' +
        '</div>' +
        '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">CÁCH LÀM VIỆC CÙNG DRABUFF AI</p><h3>Từ bản thiết kế đến hệ thống chạy thật</h3></div>' +
          '<ol class="howto"><li><b>Khảo sát quy trình</b>Làm việc với từng bộ phận, đo chỉ số hiện tại.</li><li><b>Chạy thử (POC)</b>Dựng giải pháp quick win trên dữ liệu thật.</li><li><b>Triển khai & tích hợp</b>Kết nối hệ thống, đào tạo nhân sự vận hành.</li><li><b>Vận hành & tối ưu</b>Theo dõi KPI hằng tháng, mở rộng giai đoạn tiếp theo.</li></ol>' +
          '<p class="note">Các con số giờ tiết kiệm và mức tự động hóa là ước tính tham khảo từ câu trả lời của bạn; số liệu chính xác được chốt sau buổi khảo sát.</p></section>';

      var sum = [
        '[' + code + '] BẢN THIẾT KẾ AI AUTOMATION · DRABUFF AI',
        'Doanh nghiệp: ' + A.company + (A.contact ? ' · ' + A.contact : '') + ' · Zalo: ' + A.zalo,
        'Ngành: ' + CM.label(CM.industries, A.industry) + ' · Quy mô: ' + CM.label(CM.sizes, A.size),
        'Bộ phận: ' + CM.labels(depts, A.depts).join(', '),
        'Điểm nghẽn: ' + CM.labels(pains, A.pains).join('; '),
        'Dịch vụ đề xuất: ' + R.list.map(function (k) { return S[k].n + ' (GĐ ' + R.phase[k] + ')'; }).join(' | '),
        'Ước tính tiết kiệm: ~' + saved + ' giờ/tháng',
        'Kỹ thuật: ' + CM.label(techs, A.tech) + ' · Dữ liệu: ' + CM.label(datas, A.data) + ' · Thời điểm: ' + CM.label(timelines, A.timeline) + ' · Đầu tư: ' + CM.label(budgets, A.budget),
        'Quy trình muốn tự động: ' + (A.process || ''),
        A.success ? 'Thành công sau 3 tháng: ' + A.success : ''
      ].filter(Boolean).join('\n');
      return { code: code, html: html, summary: sum };
    },
    cta: {
      title: 'Trao đổi cùng chuyên gia Drabuff AI để triển khai',
      text: 'Bản thiết kế này là bước phác thảo. Trong buổi trao đổi, Drabuff AI sẽ khảo sát quy trình thực tế, xác nhận khả năng tích hợp và gửi phương án triển khai chi tiết kèm báo giá cho từng giai đoạn.',
      next: 'khảo sát quy trình, chốt phạm vi chạy thử và gửi báo giá'
    }
  };
})();
