/* Drabuff AI — Inhouse AI Course Designer */
(function () {
  var CM = window.COMMON, esc = function (s) { return window.UI.esc(s); };

  var audiences = [
    { v: 'leaders', label: 'Ban lãnh đạo', desc: 'CEO, Giám đốc, chủ doanh nghiệp' },
    { v: 'managers', label: 'Quản lý cấp trung', desc: 'Trưởng phòng, trưởng nhóm' },
    { v: 'sales', label: 'Sales & CSKH', desc: 'Kinh doanh, tư vấn, chăm sóc khách' },
    { v: 'marketing', label: 'Marketing & Truyền thông', desc: 'Content, ads, thương hiệu' },
    { v: 'hr', label: 'HR & Hành chính', desc: 'Tuyển dụng, đào tạo, văn phòng' },
    { v: 'finance', label: 'Kế toán & Tài chính', desc: 'Số liệu, báo cáo, chứng từ' },
    { v: 'ops', label: 'Vận hành & Kỹ thuật', desc: 'Sản xuất, kho, dự án, IT' },
    { v: 'all', label: 'Toàn bộ nhân sự', desc: 'Phổ cập AI cho cả công ty' }
  ];
  var levels = [
    { v: 'l0', label: 'Chưa dùng AI', desc: 'Đội ngũ gần như chưa tiếp xúc' },
    { v: 'l1', label: 'Dùng tự phát', desc: 'Vài người tự dùng ChatGPT, chưa có chuẩn chung' },
    { v: 'l2', label: 'Đã dùng ở vài phòng ban', desc: 'Có kết quả nhưng rời rạc, chưa đo được' },
    { v: 'l3', label: 'Đã có quy trình AI', desc: 'Muốn nâng lên tự động hóa & AI Agent' }
  ];
  var goals = [
    { v: 'productivity', label: 'Tăng năng suất văn phòng', desc: 'Email, văn bản, họp, tài liệu' },
    { v: 'content', label: 'Content & Marketing', desc: 'Bài viết, hình ảnh, video, quảng cáo' },
    { v: 'sales', label: 'Bán hàng & CSKH', desc: 'Kịch bản, chốt đơn, chăm sóc' },
    { v: 'data', label: 'Dữ liệu & báo cáo', desc: 'Excel, dashboard, ra quyết định' },
    { v: 'automation', label: 'Tự động hóa quy trình', desc: 'Workflow, AI Agent, không cần code' },
    { v: 'strategy', label: 'Chiến lược AI cho lãnh đạo', desc: 'Lộ trình, ROI, quản trị rủi ro' },
    { v: 'knowledge', label: 'Quản trị tri thức nội bộ', desc: 'Tài liệu, SOP, onboarding' }
  ];
  var pains = [
    { v: 'repetitive', label: 'Mất nhiều giờ cho việc lặp lại' },
    { v: 'generic', label: 'Dùng AI nhưng kết quả chung chung' },
    { v: 'security', label: 'Lo ngại lộ dữ liệu khi dùng AI' },
    { v: 'start', label: 'Không biết bắt đầu từ đâu' },
    { v: 'nostandard', label: 'Mỗi người dùng một kiểu, không có chuẩn' },
    { v: 'roi', label: 'Lãnh đạo chưa thấy rõ hiệu quả' }
  ];
  var ecos = [
    { v: 'google', label: 'Google Workspace' },
    { v: 'ms365', label: 'Microsoft 365' },
    { v: 'zalo', label: 'Zalo / Facebook' },
    { v: 'crm', label: 'CRM' },
    { v: 'erp', label: 'ERP / MISA' },
    { v: 'canva', label: 'Canva / Adobe' }
  ];
  var formats = [
    { v: 'offline', label: 'Offline tại doanh nghiệp', desc: 'Tương tác cao, thực hành tại chỗ' },
    { v: 'online', label: 'Online trực tuyến', desc: 'Linh hoạt cho nhiều chi nhánh' },
    { v: 'hybrid', label: 'Kết hợp', desc: 'Offline khai giảng + online thực hành' }
  ];
  var durations = [
    { v: 'd1', label: '1 ngày', desc: 'Intensive · 7 giờ' },
    { v: 'd2', label: '2 ngày', desc: '14 giờ · cân bằng lý thuyết & thực hành' },
    { v: 'd3', label: '3 ngày', desc: '21 giờ · chuyên sâu + dự án' },
    { v: 'e6', label: '6 buổi tối', desc: '3 tuần · 3 giờ/buổi, không ảnh hưởng công việc' }
  ];

  /* ---- module library ---- */
  var MOD = {
    F1: { t: 'Nền tảng AI tạo sinh cho doanh nghiệp', tr: ['all'], it: ['AI tạo sinh hoạt động thế nào và giới hạn của nó', 'So sánh ChatGPT, Claude, Gemini, Copilot: dùng công cụ nào cho việc gì', 'Nguyên tắc dùng AI an toàn với dữ liệu công ty'], lab: 'Mỗi học viên giải 3 việc thật của mình bằng 3 công cụ AI khác nhau rồi so sánh.' },
    F2: { t: 'Prompt Engineering thực chiến', tr: ['all'], it: ['Khung prompt 6 thành phần: Vai trò · Bối cảnh · Nhiệm vụ · Định dạng · Ví dụ · Ràng buộc', 'Kỹ thuật chia nhỏ, phản biện và tự kiểm tra kết quả', 'Biến prompt tốt thành mẫu dùng chung cho cả phòng'], lab: 'Viết lại 5 prompt "chung chung" thành prompt cho ra kết quả dùng được ngay.' },
    F3: { t: 'Quy chế dùng AI an toàn & có trách nhiệm', tr: ['leadership', 'security'], it: ['Phân loại dữ liệu: được đưa vào AI / cần ẩn danh / cấm', 'Kiểm chứng thông tin, tránh "AI bịa"', 'Dự thảo quy chế sử dụng AI nội bộ'], lab: 'Dự thảo quy chế dùng AI 1 trang cho doanh nghiệp.' },
    P1: { t: 'AI cho email, văn bản & cuộc họp', tr: ['productivity'], it: ['Soạn email, công văn, đề xuất theo giọng văn công ty', 'Tóm tắt tài liệu dài, biên bản họp tự động', 'NotebookLM: hỏi đáp trên bộ tài liệu nội bộ'], lab: 'Biến 1 file ghi âm cuộc họp thành biên bản + danh sách việc cần làm.' },
    P2: { t: 'Trợ lý AI riêng cho từng vị trí', tr: ['productivity', 'automation'], it: ['Tạo Custom GPT / Claude Project / Gemini Gem theo vai trò', 'Nạp tài liệu, quy trình, giọng văn công ty', 'Chia sẻ & quản lý trợ lý trong đội'], lab: 'Mỗi nhóm build 1 trợ lý AI cho đúng vị trí của mình và dùng thử.' },
    M1: { t: 'AI Content Engine', tr: ['marketing'], it: ['Insight khách hàng & chân dung persona bằng AI', 'Lịch nội dung 30 ngày đa kênh trong 1 buổi', 'Huấn luyện AI viết đúng giọng thương hiệu'], lab: 'Ra lịch content 30 ngày + 10 bài hoàn chỉnh cho {item} thật của công ty.' },
    M2: { t: 'Hình ảnh & video ngắn bằng AI', tr: ['marketing'], it: ['Canva AI, tạo ảnh sản phẩm & banner', 'Kịch bản video ngắn TikTok/Reels có hook', 'Quy trình sản xuất hình ảnh hàng loạt'], lab: 'Sản xuất bộ 5 visual + 2 kịch bản video cho chiến dịch sắp tới.' },
    M3: { t: 'AI cho quảng cáo & phân tích đối thủ', tr: ['marketing', 'sales'], it: ['Phân tích đối thủ & định vị khác biệt', 'Tạo nhiều mẫu quảng cáo để test A/B', 'Đọc số liệu quảng cáo và đề xuất tối ưu'], lab: 'Phân tích 3 đối thủ và ra 6 mẫu quảng cáo để test.' },
    S1: { t: 'Kịch bản bán hàng & xử lý từ chối với AI', tr: ['sales'], it: ['Kịch bản tư vấn theo từng chân dung khách', 'Thư viện câu trả lời từ chối phổ biến', 'Luyện tập đóng vai với AI làm "khách khó tính"'], lab: 'Roleplay với AI: xử lý 5 tình huống từ chối thường gặp của {cust}.' },
    S2: { t: 'AI chăm sóc khách hàng đa kênh', tr: ['sales'], it: ['Bộ mẫu trả lời Zalo/Fanpage chuẩn giọng thương hiệu', 'Phân loại & tóm tắt phản hồi khách tự động', 'Xây bộ FAQ làm nền cho chatbot'], lab: 'Xây bộ 30 câu hỏi–trả lời mẫu cho {cust}.' },
    S3: { t: 'Chăm sóc pipeline & chấm điểm khách tiềm năng', tr: ['sales', 'data'], it: ['Phân tích dữ liệu khách từ CRM/Excel', 'Chấm điểm lead nóng – ấm – lạnh', 'Lịch chăm sóc tự động theo hành vi'], lab: 'Chấm điểm danh sách khách mẫu và lên kịch bản chăm sóc 7 ngày.' },
    D1: { t: 'Phân tích dữ liệu Excel/Sheets bằng AI', tr: ['data'], it: ['Làm sạch dữ liệu, viết công thức, pivot bằng tiếng Việt', 'Hỏi đáp trực tiếp với bảng số liệu', 'Tìm bất thường và xu hướng'], lab: 'Phân tích file dữ liệu thật (đã ẩn danh) và rút ra 5 insight.' },
    D2: { t: 'Báo cáo & dashboard tự động', tr: ['data', 'leadership'], it: ['Thiết kế báo cáo tuần/tháng chuẩn', 'Looker Studio / Power BI + AI viết nhận xét', 'Tự động gửi báo cáo cho lãnh đạo'], lab: 'Dựng dashboard 1 trang cho chỉ số quan trọng nhất của phòng.' },
    A1: { t: 'Bản đồ quy trình & điểm chèn AI', tr: ['automation', 'leadership'], it: ['Vẽ lại quy trình hiện tại, tìm điểm lãng phí', 'Chọn bước nào giao cho AI, bước nào giữ người', 'Ma trận tác động – độ khó để chọn quick win'], lab: 'Vẽ bản đồ 1 quy trình thật và đánh dấu 3 điểm chèn AI.' },
    A2: { t: 'Xây workflow tự động không cần code', tr: ['automation'], it: ['Make / n8n / Zapier: trigger – xử lý – đầu ra', 'Kết nối Form → Sheets → AI → Email/Zalo', 'Xử lý lỗi và giám sát workflow'], lab: 'Build 1 workflow chạy thật: nhận yêu cầu → AI xử lý → gửi kết quả.' },
    A3: { t: 'AI Agent nhập môn', tr: ['automation'], it: ['Agent khác chatbot ở đâu', 'Agent đọc email, phân loại, soạn phản hồi nháp', 'Giới hạn & kiểm soát con người (human-in-the-loop)'], lab: 'Cấu hình 1 agent xử lý hộp thư chung của phòng.' },
    H1: { t: 'AI trong tuyển dụng & nhân sự', tr: ['hr'], it: ['Viết JD hấp dẫn, sàng lọc CV theo tiêu chí', 'Bộ câu hỏi phỏng vấn theo năng lực', 'Chính sách, quy chế, thông báo nội bộ'], lab: 'Sàng lọc 20 CV mẫu và ra shortlist có giải thích.' },
    H2: { t: 'Đào tạo nội bộ & onboarding bằng AI', tr: ['hr', 'knowledge'], it: ['Biến SOP thành tài liệu đào tạo, quiz', 'Sổ tay nhân viên mới hỏi–đáp được', 'Đo lường hiệu quả đào tạo'], lab: 'Biến 1 SOP thành bài học + bài kiểm tra 10 câu.' },
    K1: { t: 'Kho tri thức nội bộ với AI', tr: ['knowledge'], it: ['Tổ chức tài liệu để AI hiểu được', 'Trợ lý hỏi–đáp trên tài liệu công ty', 'Phân quyền & cập nhật tri thức'], lab: 'Dựng trợ lý hỏi–đáp trên bộ tài liệu nội bộ mẫu.' },
    L1: { t: 'Chiến lược AI & bản đồ use-case', tr: ['leadership'], it: ['AI đang thay đổi ngành {n} thế nào', 'Xác định 10 use-case và chọn 3 ưu tiên', 'Mô hình tổ chức: ai chịu trách nhiệm AI'], lab: 'Ban lãnh đạo chốt 3 use-case ưu tiên trên ma trận tác động – độ khó.' },
    L2: { t: 'ROI & lộ trình chuyển đổi AI 90 ngày', tr: ['leadership'], it: ['Cách đo hiệu quả AI: giờ tiết kiệm, doanh thu, chất lượng', 'Ngân sách, rủi ro và cách kiểm soát', 'Lộ trình 30–60–90 ngày'], lab: 'Lập lộ trình AI 90 ngày có KPI cho từng mốc.' },
    L3: { t: 'Lãnh đạo đội ngũ trong thời đại AI', tr: ['leadership'], it: ['Thay đổi vai trò & KPI khi có AI', 'Xây văn hóa thử nghiệm, chia sẻ prompt', 'Xử lý tâm lý "sợ AI thay thế"'], lab: 'Thiết kế chương trình "AI Champion" cho từng phòng ban.' },
    CAP: { t: 'Capstone: dự án AI trên bài toán thật', tr: ['all'], it: ['Mỗi nhóm giải 1 bài toán thật của doanh nghiệp', 'Demo trước ban lãnh đạo, nhận phản biện', 'Cam kết hành động 30 ngày'], lab: '' }
  };

  var TRACKS = {
    leadership: { name: 'AI Leadership', full: 'AI Leadership: Lãnh đạo & chiến lược chuyển đổi AI', mods: ['L1', 'L2', 'F3', 'L3', 'A1', 'D2'] },
    marketing: { name: 'AI Marketing Thực Chiến', full: 'AI Marketing Thực Chiến: Content, hình ảnh & quảng cáo', mods: ['M1', 'M2', 'M3', 'P2'] },
    sales: { name: 'AI Sales & CSKH', full: 'AI Sales & CSKH: Bán nhanh hơn, chăm sóc sâu hơn', mods: ['S1', 'S2', 'S3', 'M3', 'P2'] },
    data: { name: 'AI Data & Báo cáo', full: 'AI Data & Báo cáo: Ra quyết định từ dữ liệu', mods: ['D1', 'D2', 'S3', 'P1'] },
    automation: { name: 'AI Workflow', full: 'AI Workflow: Tự động hóa quy trình không cần code', mods: ['A1', 'A2', 'P2', 'A3'] },
    hr: { name: 'AI cho HR & Back-office', full: 'AI cho HR & Back-office: Tuyển dụng, đào tạo, vận hành', mods: ['H1', 'H2', 'P1', 'K1'] },
    productivity: { name: 'AI Productivity', full: 'AI Productivity: Nâng cấp năng suất toàn đội ngũ', mods: ['P1', 'P2', 'D1', 'K1'] }
  };
  var AUD2T = { leaders: { leadership: 4 }, managers: { leadership: 1, productivity: 2, data: 1 }, sales: { sales: 4 }, marketing: { marketing: 4 }, hr: { hr: 4 }, finance: { data: 4 }, ops: { automation: 3, data: 1 }, all: { productivity: 4 } };
  var GOAL2T = { productivity: 'productivity', content: 'marketing', sales: 'sales', data: 'data', automation: 'automation', strategy: 'leadership', knowledge: 'hr' };
  var GOAL2M = { productivity: ['P1', 'P2'], content: ['M1', 'M2'], sales: ['S1', 'S2'], data: ['D1', 'D2'], automation: ['A1', 'A2'], strategy: ['L1', 'L2'], knowledge: ['K1', 'H2'] };
  var KPI = {
    productivity: 'Tiết kiệm 4–8 giờ/người/tuần cho tác vụ văn bản & tài liệu',
    content: 'Rút ngắn 60–70% thời gian sản xuất một bài content',
    sales: 'Phản hồi khách nhanh gấp 2–3 lần với kịch bản chuẩn hóa',
    data: 'Giảm khoảng 50% thời gian lập báo cáo định kỳ',
    automation: 'Đưa 2–3 quy trình vào chạy tự động trong 30 ngày sau khóa',
    strategy: 'Có lộ trình AI 90 ngày được ban lãnh đạo thông qua',
    knowledge: 'Nhân viên mới tự tra cứu được 70% câu hỏi thường gặp'
  };
  var SLOTS = { d1: [['Ngày 1', 'Sáng'], ['Ngày 1', 'Chiều']], d2: [['Ngày 1', 'Sáng'], ['Ngày 1', 'Chiều'], ['Ngày 2', 'Sáng'], ['Ngày 2', 'Chiều']], d3: [['Ngày 1', 'Sáng'], ['Ngày 1', 'Chiều'], ['Ngày 2', 'Sáng'], ['Ngày 2', 'Chiều'], ['Ngày 3', 'Sáng'], ['Ngày 3', 'Chiều']], e6: [['Tuần 1', 'Buổi 1'], ['Tuần 1', 'Buổi 2'], ['Tuần 2', 'Buổi 3'], ['Tuần 2', 'Buổi 4'], ['Tuần 3', 'Buổi 5'], ['Tuần 3', 'Buổi 6']] };
  var PER = { d1: 2, d2: 2, d3: 2, e6: 1 }; // modules per session
  var HOURS = { d1: 7, d2: 14, d3: 21, e6: 18 };
  var TIME = { 'Sáng': '08:30 – 12:00', 'Chiều': '13:30 – 17:00' };

  function fill(s, c) { return s.replace('{item}', c.item).replace('{cust}', c.cust).replace('{n}', c.n); }

  function build(A) {
    var c = CM.ctx[A.industry] || CM.ctx.other;
    var aud = A.audience || [], gl = A.goals || [], pn = A.pains || [], eco = A.eco || [];
    // score tracks
    var sc = {}; Object.keys(TRACKS).forEach(function (k) { sc[k] = 0; });
    aud.forEach(function (a) { var m = AUD2T[a] || {}; for (var k in m) sc[k] += m[k]; });
    gl.forEach(function (g, i) { sc[GOAL2T[g]] += 3 - i * 0.5; });
    var order = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; });
    var main = order[0], second = sc[order[1]] > 0 ? order[1] : null;
    if (sc[main] === 0) main = 'productivity';

    var lvl = A.level || 'l1', dur = A.duration || 'd2';
    var slots = SLOTS[dur], cap = slots.length * PER[dur];
    var pick = [];
    var add = function (id) { if (pick.indexOf(id) < 0 && pick.length < cap - 1) pick.push(id); };
    if (lvl === 'l0' || lvl === 'l1') add('F1');
    add('F2');
    if (main === 'leadership' || pn.indexOf('security') > -1 || aud.indexOf('leaders') > -1) { if (cap >= 6) add('F3'); }
    gl.forEach(function (g) { add(GOAL2M[g][0]); });
    TRACKS[main].mods.forEach(add);
    gl.forEach(function (g) { add(GOAL2M[g][1]); });
    if (second) TRACKS[second].mods.forEach(add);
    if (lvl === 'l3') { add('A2'); add('A3'); }
    ['P2', 'P1', 'A1', 'D1', 'F3'].forEach(add);
    if (lvl === 'l3') pick = pick.filter(function (x) { return x !== 'F1'; });
    pick.push('CAP');

    // sessions
    var sessions = slots.map(function (s) { return { day: s[0], part: s[1], mods: [] }; });
    pick.forEach(function (id, i) { var si = Math.min(sessions.length - 1, Math.floor(i / PER[dur])); sessions[si].mods.push(id); });
    sessions = sessions.filter(function (s) { return s.mods.length; });
    return { c: c, main: main, second: second, sessions: sessions, pick: pick, lvl: lvl, dur: dur };
  }

  function tools(A, main) {
    var t = ['ChatGPT', 'Claude', 'Gemini'], e = A.eco || [], g = A.goals || [];
    if (e.indexOf('ms365') > -1) t.push('Microsoft Copilot');
    if (e.indexOf('google') > -1 || g.indexOf('knowledge') > -1) t.push('NotebookLM');
    if (g.indexOf('content') > -1 || main === 'marketing' || e.indexOf('canva') > -1) t.push('Canva AI', 'CapCut');
    if (g.indexOf('automation') > -1 || main === 'automation' || A.level === 'l3') t.push('Make', 'n8n');
    if (g.indexOf('data') > -1 || main === 'data') t.push(e.indexOf('ms365') > -1 ? 'Excel + Copilot' : 'Google Sheets + Gemini', e.indexOf('ms365') > -1 ? 'Power BI' : 'Looker Studio');
    if (e.indexOf('zalo') > -1 && (main === 'sales' || g.indexOf('sales') > -1)) t.push('Zalo OA');
    if (e.indexOf('crm') > -1) t.push('CRM + AI');
    return t.filter(function (x, i) { return t.indexOf(x) === i; });
  }

  window.PAGE = {
    id: 'course', codePrefix: 'DRB-AC',
    kicker: 'DRABUFF AI · THIẾT KẾ KHÓA HỌC INHOUSE',
    title: 'Khóa học AI <em>may đo</em> cho đội ngũ của bạn',
    lead: 'Trả lời 5 khối câu hỏi trong khoảng 3 phút. Drabuff AI sẽ thiết kế một <b>chương trình đào tạo AI Inhouse</b> riêng cho doanh nghiệp: chủ đề, nội dung từng buổi, bài thực hành theo đúng ngành, công cụ sử dụng và kết quả đội ngũ đạt được.',
    startLabel: 'Bắt đầu thiết kế khóa học', finishLabel: 'Thiết kế khóa học',
    hint: '5 KHỐI · ~3 PHÚT · MIỄN PHÍ',
    facts: [['5 khối', 'câu hỏi trắc nghiệm & trả lời ngắn'], ['Theo buổi', 'lịch học chi tiết từng ngày'], ['100%', 'thực hành trên bài toán thật']],
    sample:
      '<div class="sm-card"><div class="sm-tag"><span>Ví dụ đề xuất</span><span>DRB-AC-7K2F</span></div>' +
      '<div class="sm-title">AI Marketing Thực Chiến cho chuỗi bán lẻ</div>' +
      '<div class="sm-meta"><span>2 ngày · 14 giờ</span><span>24 học viên</span><span>Kết hợp</span></div>' +
      '<div class="sm-rows">' +
        '<div class="sm-row"><b>N1·SÁNG</b><span class="sm-bar" style="width:92%">Prompt Engineering thực chiến</span></div>' +
        '<div class="sm-row"><b>N1·CHIỀU</b><span class="sm-bar" style="width:80%">AI Content Engine</span></div>' +
        '<div class="sm-row"><b>N2·SÁNG</b><span class="sm-bar" style="width:86%">Hình ảnh & video ngắn bằng AI</span></div>' +
        '<div class="sm-row"><b>N2·CHIỀU</b><span class="sm-bar" style="width:70%">Capstone: dự án thật</span></div>' +
      '</div></div>' +
      '<div class="sm-float f1"><b>-65%</b><small>thời gian làm content</small></div>' +
      '<div class="sm-float f2"><span class="sm-chip"><i></i>Bàn giao: 50+ prompt mẫu</span></div>',
    thinkTitle: 'Đang thiết kế chương trình đào tạo cho bạn',
    steps: [
      CM.infoStep('Thông tin để Drabuff AI gửi đề xuất và hiểu bối cảnh ngành của bạn.'),
      { title: 'Đội ngũ học viên', sub: 'Ai sẽ tham gia khóa học và họ đang ở đâu trên hành trình AI?', qs: [
        { id: 'audience', type: 'multi', label: 'Nhóm học viên tham gia', req: true, max: 3, exclusive: ['all'], options: audiences },
        { id: 'level', type: 'single', label: 'Mức độ sử dụng AI hiện tại', req: true, wide: true, options: levels },
        { id: 'learners', type: 'range', label: 'Số lượng học viên dự kiến', min: 5, max: 200, step: 5, def: 30, unit: 'người', plus: true }
      ] },
      { title: 'Mục tiêu & vấn đề', sub: 'Sau khóa học, doanh nghiệp muốn thay đổi điều gì?', qs: [
        { id: 'goals', type: 'multi', label: 'Mục tiêu ưu tiên', req: true, max: 3, help: 'Chọn theo thứ tự quan trọng, mục chọn trước được ưu tiên hơn.', options: goals },
        { id: 'pains', type: 'multi', label: 'Vấn đề đang gặp', options: pains }
      ] },
      { title: 'Hình thức tổ chức', sub: 'Để lịch học và công cụ thực hành khớp với hệ thống bạn đang dùng.', qs: [
        { id: 'eco', type: 'multi', label: 'Công cụ doanh nghiệp đang dùng', options: ecos },
        { id: 'format', type: 'single', label: 'Hình thức học', req: true, options: formats },
        { id: 'duration', type: 'single', label: 'Thời lượng mong muốn', req: true, options: durations }
      ] },
      { title: 'Bài toán thực tế', sub: 'Hai câu trả lời ngắn giúp Drabuff AI đưa đúng bài toán của bạn vào phần thực hành.', qs: [
        { id: 'task', type: 'textarea', label: 'Việc lặp đi lặp lại tốn thời gian nhất của đội bạn là gì?', req: true, ph: 'VD: Mỗi tuần mất 2 ngày tổng hợp báo cáo bán hàng từ 5 chi nhánh…', sugs: ['Viết content & bài đăng hằng ngày', 'Trả lời tin nhắn khách lặp lại', 'Tổng hợp báo cáo tuần', 'Soạn báo giá & hợp đồng'] },
        { id: 'expect', type: 'textarea', label: 'Sau khóa học, bạn muốn đội ngũ làm được gì ngay?', ph: 'VD: Mỗi nhân viên tự build được trợ lý AI cho công việc của mình…', sugs: ['Tự viết prompt ra kết quả dùng được', 'Có bộ quy trình AI chuẩn cho từng phòng', 'Tự động hóa ít nhất 1 quy trình'] }
      ] }
    ],
    logs: function (A) {
      var c = CM.ctx[A.industry] || CM.ctx.other;
      return [
        'Nạp hồ sơ: ' + esc(A.company) + ' · ngành ' + c.n,
        'Phân tích ' + (A.audience || []).length + ' nhóm học viên · mức AI: ' + CM.label(levels, A.level),
        'Đối chiếu ' + (A.goals || []).length + ' mục tiêu với ' + Object.keys(MOD).length + ' module trong thư viện Drabuff AI',
        'Chọn lộ trình chính & sắp xếp theo độ khó tăng dần',
        'Gắn bài toán thực tế vào phần Capstone',
        'Ghép công cụ thực hành theo hệ sinh thái ' + (CM.labels(ecos, A.eco).join(', ') || 'phổ thông'),
        'Ước tính kết quả & tài sản bàn giao',
        'Hoàn tất đề xuất khóa học'
      ];
    },
    generate: function (A, code) {
      var B = build(A), c = B.c, T = TRACKS[B.main];
      var nLearn = Number(A.learners || 30), classes = nLearn > 40 ? Math.ceil(nLearn / 35) : 1;
      var groups = Math.max(1, Math.round(Math.min(nLearn, 35) / 5));
      var lvLabel = { l0: 'Nền tảng → Ứng dụng', l1: 'Nền tảng → Ứng dụng', l2: 'Ứng dụng', l3: 'Nâng cao' }[B.lvl];
      var audL = CM.labels(audiences, A.audience), goalL = CM.labels(goals, A.goals);
      var title = T.full + (B.second && B.second !== B.main && B.sessions.length > 2 ? ' × ' + TRACKS[B.second].name : '');
      var tl = tools(A, B.main);

      var why = [
        ['Học viên', 'Thiết kế cho <b>' + audL.join(', ') + '</b> ở mức <b>' + CM.label(levels, A.level).toLowerCase() + '</b>, nên khóa học bắt đầu ở cấp độ ' + lvLabel.toLowerCase() + '.'],
        ['Mục tiêu', 'Ưu tiên <b>' + goalL.join(', ').toLowerCase() + '</b>; các module được chọn để mỗi buổi học tạo ra một sản phẩm dùng được ngay.'],
        ['Ngành', 'Ví dụ và bài tập lấy từ ngành <b>' + c.n + '</b>: ' + c.ex.slice(0, 2).join('; ') + '.']
      ];
      if ((A.pains || []).indexOf('security') > -1) why.push(['Bảo mật', 'Có phần <b>quy chế dùng AI an toàn</b> vì bạn lo ngại lộ dữ liệu.']);

      // timeline
      var days = {}, dayOrder = [];
      B.sessions.forEach(function (s) { if (!days[s.day]) { days[s.day] = []; dayOrder.push(s.day); } days[s.day].push(s); });
      var labIdx = 0;
      var tlHTML = dayOrder.map(function (d) {
        var ss = days[d];
        return '<div class="day"><div class="day-l"><b>' + d + '</b><span>' + ss.length + ' buổi · ' + ss.reduce(function (n, s) { return n + s.mods.length; }, 0) + ' module</span></div><div class="sess">' +
          ss.map(function (s) {
            var time = B.dur === 'e6' ? '19:00 – 22:00' : TIME[s.part];
            return '<div class="ses"><div class="ses-h"><span>' + s.part.toUpperCase() + '</span><span>' + time + '</span></div>' +
              s.mods.map(function (id) {
                var m = MOD[id], lab;
                if (id === 'CAP') lab = 'Bài toán của bạn: “' + esc((A.task || '').slice(0, 180)) + '”. Các nhóm dùng AI giải quyết và demo kết quả.';
                else lab = fill(m.lab, c);
                labIdx++;
                return '<div class="mod"><h4>' + fill(m.t, c) + '</h4><ul>' + m.it.map(function (x) { return '<li>' + fill(x, c) + '</li>'; }).join('') + '</ul>' +
                  '<div class="lab"><span class="mono">THỰC HÀNH</span><span>' + lab + '</span></div></div>';
              }).join('') + '</div>';
          }).join('') + '</div></div>';
      }).join('');

      var outcomes = [];
      outcomes.push(['Viết prompt ra kết quả dùng được ngay', 'Mỗi học viên làm chủ khung prompt 6 thành phần và thư viện prompt của phòng.']);
      if (B.pick.indexOf('P2') > -1) outcomes.push(['Có trợ lý AI riêng cho vị trí của mình', 'Trợ lý được nạp sẵn quy trình & giọng văn công ty.']);
      (A.goals || []).forEach(function (g) {
        var map = { productivity: ['Xử lý email, văn bản, biên bản họp nhanh gấp 3 lần', ''], content: ['Tự sản xuất lịch content 30 ngày cho ' + c.item, ''], sales: ['Bộ kịch bản tư vấn & chăm sóc ' + c.cust + ' chuẩn hóa', ''], data: ['Tự phân tích số liệu & dựng báo cáo không cần IT', ''], automation: ['Tự build workflow AI tự động cho phòng ban', ''], strategy: ['Lãnh đạo chốt được 3 use-case AI và lộ trình 90 ngày', ''], knowledge: ['Kho tri thức nội bộ hỏi–đáp được bằng AI', ''] };
        if (map[g]) outcomes.push([map[g][0], '']);
      });
      if (A.expect) outcomes.push(['Kỳ vọng của bạn: “' + esc(A.expect.slice(0, 140)) + '”', 'Được đưa vào tiêu chí nghiệm thu khóa học.']);
      var kpis = (A.goals || []).map(function (g) { return KPI[g]; });

      var assets = [
        ['Thư viện 50+ prompt mẫu', 'Riêng cho ngành ' + c.n + ', chia theo phòng ban'],
        ['Slide, tài liệu & video ghi hình', 'Học viên xem lại bất cứ lúc nào'],
        ['Bài kiểm tra đầu vào – đầu ra', 'Đo mức tiến bộ của từng học viên'],
        ['Chứng nhận hoàn thành', 'Cấp bởi Drabuff AI'],
        ['Đồng hành 30 ngày sau khóa', 'Nhóm Zalo hỏi đáp & review sản phẩm AI']
      ];
      if (B.pick.indexOf('F3') > -1) assets.splice(1, 0, ['Mẫu quy chế sử dụng AI nội bộ', 'Sẵn sàng ban hành']);
      if (B.pick.indexOf('P2') > -1) assets.splice(1, 0, ['Bộ trợ lý AI theo vị trí', 'Build ngay trong lớp, dùng tiếp sau khóa']);

      var html =
        '<section class="panel r-head reveal">' +
          '<p class="eyebrow"><span><span class="dot" style="display:inline-block;margin-right:10px"></span>ĐỀ XUẤT KHÓA HỌC AI INHOUSE</span><span class="mono">' + code + '</span></p>' +
          '<p class="r-for">Thiết kế riêng cho <b>' + esc(A.company) + '</b>' + (A.contact ? ' · ' + esc(A.contact) : '') + ' · ' + CM.label(CM.industries, A.industry) + ' · ' + CM.label(CM.sizes, A.size) + '</p>' +
          '<h2 class="r-title">' + title.replace(':', ':<br><em>').replace(/$/, '</em>') + '</h2>' +
          '<p class="r-sum">Chương trình ' + HOURS[B.dur] + ' giờ, ' + B.sessions.length + ' buổi, ' + B.pick.length + ' module. Học viên học xong buổi nào áp dụng ngay buổi đó vào công việc thật của ' + esc(A.company) + ', và kết thúc bằng một dự án AI giải quyết chính bài toán bạn đã mô tả.</p>' +
          '<div class="tiles">' +
            '<div class="tile"><span>Thời lượng</span><b>' + CM.label(durations, B.dur) + '</b><small>' + HOURS[B.dur] + ' giờ học</small></div>' +
            '<div class="tile"><span>Hình thức</span><b>' + CM.label(formats, A.format).replace(' tại doanh nghiệp', '').replace(' trực tuyến', '') + '</b><small>' + (A.format === 'online' ? 'Zoom/Meet + phòng thực hành' : 'Tại văn phòng doanh nghiệp') + '</small></div>' +
            '<div class="tile"><span>Học viên</span><b>' + (nLearn >= 200 ? '200+' : nLearn) + ' người</b><small>' + (classes > 1 ? classes + ' lớp · ' : '') + '~' + groups + ' nhóm thực hành/lớp</small></div>' +
            '<div class="tile"><span>Cấp độ</span><b>' + lvLabel + '</b><small>' + B.pick.length + ' module</small></div>' +
          '</div>' +
        '</section>' +
        '<div class="grid2">' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">VÌ SAO LÀ KHÓA NÀY</p><h3>Được thiết kế từ chính câu trả lời của bạn</h3></div>' +
            '<ul class="why">' + why.map(function (w, i) { return '<li><span class="k">' + w[0] + '</span><span>' + w[1] + '</span></li>'; }).join('') + '</ul></section>' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">HỌC VIÊN ĐẠT ĐƯỢC</p><h3>Kết quả sau khóa học</h3></div>' +
            '<ul class="checks">' + outcomes.map(function (o) { return '<li>' + o[0] + (o[1] ? '<small>' + o[1] + '</small>' : '') + '</li>'; }).join('') + '</ul></section>' +
        '</div>' +
        '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">NỘI DUNG CHI TIẾT</p><h3>Lộ trình học theo từng buổi</h3><p>Mỗi module gồm phần hướng dẫn ngắn và bài thực hành trên dữ liệu, tình huống của ngành ' + c.n + '.</p></div>' +
          '<div class="days">' + tlHTML + '</div></section>' +
        '<div class="grid2">' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">CHỈ SỐ MỤC TIÊU</p><h3>Đo hiệu quả sau 30 ngày</h3><p>Mức tham khảo từ các doanh nghiệp cùng quy mô. Con số cụ thể sẽ được chốt sau buổi khảo sát.</p></div>' +
            '<ul class="checks">' + kpis.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' +
            '<div class="sec-h" style="margin:26px 0 12px"><p class="eyebrow">CÔNG CỤ THỰC HÀNH</p></div><div class="chips">' + tl.map(function (t, i) { return '<span class="chip' + (i < 3 ? ' acc' : '') + '">' + t + '</span>'; }).join('') + '</div></section>' +
          '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">TÀI SẢN BÀN GIAO</p><h3>Doanh nghiệp nhận được</h3></div>' +
            '<ul class="checks">' + assets.map(function (a) { return '<li>' + a[0] + '<small>' + a[1] + '</small></li>'; }).join('') + '</ul></section>' +
        '</div>' +
        '<section class="panel reveal"><div class="sec-h"><p class="eyebrow">CÁCH DRABUFF AI TRIỂN KHAI</p><h3>Từ đề xuất đến lớp học</h3></div>' +
          '<ol class="howto"><li><b>Khảo sát sâu</b>Phỏng vấn quản lý và kiểm tra đầu vào học viên.</li><li><b>May đo giáo trình</b>Đưa quy trình, dữ liệu mẫu (đã ẩn danh) của doanh nghiệp vào bài tập.</li><li><b>Đào tạo thực chiến</b>Học đi đôi với làm, mỗi buổi ra một sản phẩm.</li><li><b>Đồng hành 30 ngày</b>Review kết quả áp dụng và đo chỉ số sau khóa.</li></ol></section>';

      var sum = [
        '[' + code + '] ĐỀ XUẤT KHÓA HỌC AI INHOUSE · DRABUFF AI',
        'Doanh nghiệp: ' + A.company + (A.contact ? ' · ' + A.contact : '') + ' · Zalo: ' + A.zalo,
        'Ngành: ' + CM.label(CM.industries, A.industry) + ' · Quy mô: ' + CM.label(CM.sizes, A.size),
        'Khóa học: ' + title,
        'Thời lượng: ' + CM.label(durations, B.dur) + ' (' + HOURS[B.dur] + ' giờ) · ' + CM.label(formats, A.format) + ' · ' + nLearn + ' học viên',
        'Học viên: ' + audL.join(', ') + ' · Mức AI: ' + CM.label(levels, A.level),
        'Mục tiêu: ' + goalL.join(', '),
        'Module: ' + B.pick.map(function (id) { return fill(MOD[id].t, c); }).join(' | '),
        'Bài toán thực tế: ' + (A.task || ''),
        A.expect ? 'Kỳ vọng: ' + A.expect : ''
      ].filter(Boolean).join('\n');
      return { code: code, html: html, summary: sum };
    },
    cta: {
      title: 'Trao đổi cùng chuyên gia Drabuff AI để chốt giáo trình',
      text: 'Đề xuất này là bản phác thảo đầu tiên. Trong buổi trao đổi, Drabuff AI sẽ đi sâu vào quy trình thực tế, điều chỉnh nội dung từng buổi và gửi kế hoạch đào tạo hoàn chỉnh.',
      next: 'tư vấn chi tiết và hoàn thiện giáo trình'
    }
  };
})();
