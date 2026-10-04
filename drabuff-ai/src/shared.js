/* Drabuff AI — shared data for both designers */
window.COMMON = (function () {
  var industries = [
    { v: 'retail', label: 'Bán lẻ / TMĐT' },
    { v: 'realestate', label: 'Bất động sản' },
    { v: 'manufacturing', label: 'Sản xuất' },
    { v: 'finance', label: 'Tài chính / Bảo hiểm' },
    { v: 'education', label: 'Giáo dục / Đào tạo' },
    { v: 'fnb', label: 'F&B / Dịch vụ' },
    { v: 'health', label: 'Y tế / Thẩm mỹ' },
    { v: 'tech', label: 'Công nghệ / Agency' },
    { v: 'logistics', label: 'Logistics / XNK' },
    { v: 'other', label: 'Lĩnh vực khác' }
  ];
  var sizes = [
    { v: 's1', label: 'Dưới 20 người' },
    { v: 's2', label: '20 – 50 người' },
    { v: 's3', label: '50 – 200 người' },
    { v: 's4', label: '200 – 500 người' },
    { v: 's5', label: 'Trên 500 người' }
  ];
  // industry vocabulary used to make labs / use-cases concrete
  var ctx = {
    retail: { n: 'bán lẻ & thương mại điện tử', cust: 'khách mua hàng', item: 'sản phẩm', ex: ['viết mô tả 50 sản phẩm chuẩn SEO trong 15 phút', 'kịch bản trả lời inbox & chốt đơn', 'phân tích 500 đánh giá khách hàng để tìm điểm cần cải thiện'] },
    realestate: { n: 'bất động sản', cust: 'khách mua/thuê', item: 'dự án', ex: ['viết tin đăng dự án cho 5 kênh khác nhau', 'kịch bản tư vấn & xử lý từ chối "giá cao"', 'tóm tắt pháp lý và so sánh 3 dự án cho khách'] },
    manufacturing: { n: 'sản xuất', cust: 'đại lý & khách B2B', item: 'đơn hàng', ex: ['chuẩn hóa SOP sản xuất & hướng dẫn an toàn', 'phân tích dữ liệu lỗi sản phẩm theo ca', 'soạn báo giá & hồ sơ thầu B2B'] },
    finance: { n: 'tài chính – bảo hiểm', cust: 'khách hàng', item: 'hợp đồng', ex: ['tóm tắt hợp đồng/điều khoản cho khách dễ hiểu', 'kịch bản tư vấn sản phẩm theo chân dung khách', 'rà soát hồ sơ và đánh dấu điểm thiếu'] },
    education: { n: 'giáo dục – đào tạo', cust: 'phụ huynh & học viên', item: 'khóa học', ex: ['soạn giáo án, bài tập và đề kiểm tra', 'tư vấn tuyển sinh qua Zalo/Fanpage', 'cá nhân hóa nhận xét học viên'] },
    fnb: { n: 'F&B – dịch vụ', cust: 'thực khách', item: 'món & combo', ex: ['lên lịch content món mới & khuyến mãi', 'phản hồi đánh giá Google Maps', 'phân tích doanh thu theo khung giờ'] },
    health: { n: 'y tế – thẩm mỹ', cust: 'khách hàng/bệnh nhân', item: 'liệu trình', ex: ['tư vấn liệu trình & đặt lịch qua inbox', 'content chuyên môn đúng quy định quảng cáo', 'chăm sóc sau dịch vụ & nhắc lịch tái khám'] },
    tech: { n: 'công nghệ – agency', cust: 'khách hàng dự án', item: 'dự án', ex: ['viết proposal & báo giá dự án', 'tự động tạo báo cáo hiệu quả cho khách', 'tài liệu hóa quy trình & kỹ thuật'] },
    logistics: { n: 'logistics – xuất nhập khẩu', cust: 'chủ hàng', item: 'lô hàng', ex: ['trích xuất dữ liệu từ chứng từ, invoice, packing list', 'trả lời tra cứu trạng thái đơn hàng', 'soạn email giao dịch tiếng Anh với đối tác'] },
    other: { n: 'doanh nghiệp của bạn', cust: 'khách hàng', item: 'sản phẩm/dịch vụ', ex: ['soạn văn bản, email & báo cáo', 'trả lời câu hỏi lặp lại của khách', 'tổng hợp số liệu định kỳ'] }
  };
  function infoStep(sub) {
    return {
      title: 'Hồ sơ doanh nghiệp', sub: sub,
      qs: [
        { id: 'company', type: 'text', label: 'Tên doanh nghiệp', req: true, half: true, ph: 'VD: Công ty TNHH Minh Phát', ac: 'organization' },
        { id: 'contact', type: 'text', label: 'Người liên hệ', half: true, ph: 'VD: Anh Hoàng – Giám đốc', ac: 'name' },
        { id: 'zalo', type: 'tel', label: 'Số Zalo', req: true, half: true, ph: '09xx xxx xxx', help: 'Drabuff AI chỉ dùng số này để gửi đề xuất chi tiết.' },
        { id: 'size', type: 'single', label: 'Quy mô nhân sự', req: true, half: true, options: sizes },
        { id: 'industry', type: 'single', label: 'Lĩnh vực hoạt động', req: true, options: industries }
      ]
    };
  }
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i].label; return v || ''; }
  function labels(list, arr) { return (arr || []).map(function (v) { return label(list, v); }); }
  return { industries: industries, sizes: sizes, ctx: ctx, infoStep: infoStep, label: label, labels: labels };
})();
