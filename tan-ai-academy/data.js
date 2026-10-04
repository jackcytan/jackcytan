/* Nội dung khóa học Tân AI Academy.
   Câu hỏi: single (1 đáp án) | multi (nhiều đáp án) | tf (đúng/sai) | fill (điền chỗ trống)
            order (sắp xếp, o = thứ tự đúng) | match (ghép cặp) | case (tình huống, 1 đáp án) */
window.COURSE = {
  title: 'Chương trình Ứng dụng AI & Marketing Toàn diện',
  examMinutes: 10,
  passPct: 80,
  modules: [
/* ------------------------------------------------------------------ 1 */
{
  id: 'm1', code: 'AI101', icon: 'brain', c1: '#5b8cff', c2: '#8b5cf6',
  title: 'Nhập môn Trí tuệ nhân tạo',
  desc: 'Hiểu đúng AI, Machine Learning, Deep Learning, AI tạo sinh và giới hạn của chúng.',
  lessons: [
    { t: 'AI là gì? Bức tranh toàn cảnh', b: [
      'Trí tuệ nhân tạo (AI – Artificial Intelligence) là lĩnh vực giúp máy tính thực hiện những việc vốn cần trí thông minh của con người: hiểu ngôn ngữ, nhận diện hình ảnh, suy luận, ra quyết định và sáng tạo nội dung.',
      { h: '4 vòng tròn lồng nhau' },
      { ul: [
        '<b>AI</b> – lĩnh vực rộng nhất, bao trùm mọi kỹ thuật làm máy “thông minh”.',
        '<b>Machine Learning (Học máy)</b> – máy tự học quy luật từ dữ liệu thay vì được lập trình từng quy tắc.',
        '<b>Deep Learning (Học sâu)</b> – học máy dùng mạng nơ-ron nhiều lớp, rất mạnh với hình ảnh, giọng nói, ngôn ngữ.',
        '<b>Generative AI (AI tạo sinh)</b> – tạo ra nội dung mới: văn bản, hình ảnh, âm thanh, video.' ] },
      'AI ngày nay là <b>AI hẹp</b> (Narrow AI): rất giỏi ở những nhiệm vụ cụ thể. <b>AI tổng quát</b> (AGI) – thông minh ngang con người ở mọi lĩnh vực – vẫn là mục tiêu nghiên cứu.',
      { tip: 'Đừng hỏi “AI có thay thế tôi không?”. Hãy hỏi “Người biết dùng AI sẽ làm việc của tôi tốt hơn tôi bao nhiêu?”.' } ] },
    { t: 'Máy học như thế nào?', b: [
      'Quy trình cốt lõi: <b>Dữ liệu → Huấn luyện → Mô hình → Dự đoán</b>. Mô hình là “bộ quy luật” máy rút ra được sau khi học từ rất nhiều ví dụ.',
      { h: '3 kiểu học phổ biến' },
      { ul: [
        '<b>Học có giám sát</b>: dữ liệu đã gắn nhãn (email đã đánh dấu spam/không spam) → máy học cách dự đoán nhãn cho dữ liệu mới.',
        '<b>Học không giám sát</b>: dữ liệu không có nhãn, máy tự tìm ra các nhóm tương đồng (ví dụ phân khúc khách hàng).',
        '<b>Học tăng cường</b>: máy thử – sai – nhận thưởng/phạt để tìm chiến lược tốt nhất (AI chơi cờ, robot).' ] },
      'Chất lượng dữ liệu quyết định chất lượng mô hình: <b>“Garbage in, garbage out”</b> – rác vào thì rác ra.',
      { tip: 'Doanh nghiệp muốn ứng dụng AI tốt, hãy bắt đầu từ việc gom và chuẩn hóa dữ liệu của chính mình.' } ] },
    { t: 'AI tạo sinh và mô hình ngôn ngữ lớn (LLM)', b: [
      'LLM (Large Language Model) được huấn luyện trên lượng văn bản khổng lồ. Về bản chất, nó tạo câu trả lời bằng cách <b>dự đoán token tiếp theo</b> phù hợp nhất với ngữ cảnh.',
      { ul: [
        '<b>Token</b>: đơn vị văn bản nhỏ mà mô hình xử lý – có thể là một từ, một phần của từ hoặc dấu câu.',
        '<b>Context window</b> (cửa sổ ngữ cảnh): lượng thông tin tối đa mô hình “nhìn thấy” trong một phiên làm việc.',
        '<b>Đa phương thức</b> (multimodal): hiểu và tạo cả văn bản, hình ảnh, âm thanh, video.' ] },
      'Các trợ lý AI phổ biến: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Copilot (Microsoft)… Mỗi công cụ có thế mạnh riêng, nhưng nguyên tắc sử dụng là giống nhau.',
      { prompt: 'Giải thích cho tôi khái niệm “token” trong AI như đang giải thích cho học sinh lớp 8, dùng 1 ví dụ đời thường, dưới 100 chữ.' } ] },
    { t: 'Sức mạnh và giới hạn của AI', b: [
      '<b>Sức mạnh</b>: tốc độ, quy mô, soạn thảo, tóm tắt, dịch thuật, lên ý tưởng, lập trình, phân tích dữ liệu – làm trong vài giây những việc con người mất hàng giờ.',
      { h: 'Những giới hạn cần nhớ' },
      { ul: [
        '<b>Ảo giác (hallucination)</b>: AI có thể trả lời sai nhưng trình bày rất tự tin.',
        '<b>Mốc kiến thức</b>: có thể không biết sự kiện mới nếu không được kết nối tìm kiếm.',
        '<b>Thiên kiến</b>: AI học cả định kiến có sẵn trong dữ liệu.',
        '<b>Trách nhiệm</b>: AI không chịu trách nhiệm – con người mới là người quyết định cuối cùng.' ] },
      { tip: 'Nguyên tắc vàng của Tân AI: AI là trợ lý, bạn là tổng biên tập. Luôn kiểm chứng số liệu, tên riêng và trích dẫn.' } ] }
  ],
  cards: [
    ['AI (Trí tuệ nhân tạo)', 'Lĩnh vực giúp máy tính thực hiện các nhiệm vụ cần trí thông minh của con người.'],
    ['Machine Learning', 'Máy tự học quy luật từ dữ liệu thay vì được lập trình từng quy tắc.'],
    ['Deep Learning', 'Nhánh của học máy dùng mạng nơ-ron nhân tạo nhiều lớp.'],
    ['Generative AI', 'AI tạo ra nội dung mới: văn bản, hình ảnh, âm thanh, video.'],
    ['LLM', 'Mô hình ngôn ngữ lớn – tạo văn bản bằng cách dự đoán token tiếp theo.'],
    ['Token', 'Đơn vị văn bản nhỏ (từ, phần của từ, dấu câu) mà mô hình xử lý.'],
    ['Hallucination', 'Ảo giác: AI tạo ra thông tin sai nhưng trình bày rất thuyết phục.'],
    ['Context window', 'Lượng thông tin tối đa mô hình ghi nhớ và xử lý trong một phiên.']
  ],
  quiz: [
    { t: 'single', q: 'Quan hệ nào giữa AI, Machine Learning (ML) và Deep Learning (DL) là đúng?', o: ['AI bao gồm ML, ML bao gồm DL', 'DL bao gồm AI, AI bao gồm ML', 'ML bao gồm AI, AI bao gồm DL', 'Ba khái niệm hoàn toàn độc lập'], a: 0, e: 'AI là lĩnh vực rộng nhất, ML là một nhánh của AI, DL là một nhánh của ML.' },
    { t: 'single', q: 'Mô hình ngôn ngữ lớn (LLM) tạo câu trả lời chủ yếu bằng cách nào?', o: ['Tra cứu đáp án có sẵn trong một cơ sở dữ liệu cố định', 'Dự đoán token tiếp theo phù hợp nhất dựa trên ngữ cảnh', 'Sao chép nguyên văn một trang web', 'Chọn ngẫu nhiên các từ'], a: 1, e: 'LLM sinh văn bản bằng cách liên tục dự đoán token tiếp theo.' },
    { t: 'tf', q: 'Học có giám sát sử dụng dữ liệu đã được gắn nhãn.', a: true, e: 'Ví dụ: email đã được đánh dấu spam/không spam.' },
    { t: 'tf', q: 'AI hiện nay đã đạt mức AI tổng quát (AGI), thông minh hơn con người ở mọi lĩnh vực.', a: false, e: 'AI hiện nay vẫn là AI hẹp; AGI vẫn là mục tiêu nghiên cứu.' },
    { t: 'fill', q: 'Hiện tượng AI đưa ra thông tin sai nhưng rất tự tin được gọi là ___.', o: ['Overfitting', 'Ảo giác (hallucination)', 'Token hóa', 'Fine-tuning'], a: 1, e: 'Đó là lý do luôn phải kiểm chứng thông tin AI đưa ra.' },
    { t: 'multi', q: 'Đâu là ứng dụng của AI tạo sinh? (Chọn tất cả đáp án đúng)', o: ['Viết bài quảng cáo từ một yêu cầu ngắn', 'Tạo hình ảnh minh họa từ mô tả', 'Máy tính bỏ túi cộng hai số', 'Tạo giọng đọc từ văn bản'], a: [0, 1, 3], e: 'Máy tính bỏ túi chỉ thực hiện phép tính theo quy tắc, không “tạo sinh”.' },
    { t: 'match', q: 'Ghép kiểu học máy với ví dụ phù hợp.', p: [['Học có giám sát', 'Lọc email spam từ dữ liệu đã gắn nhãn'], ['Học không giám sát', 'Tự chia khách hàng thành các nhóm'], ['Học tăng cường', 'AI học chơi cờ qua thắng – thua']], e: 'Có nhãn – không nhãn – thưởng/phạt.' },
    { t: 'order', q: 'Sắp xếp đúng quy trình xây dựng một mô hình học máy.', o: ['Thu thập dữ liệu', 'Huấn luyện mô hình', 'Đánh giá mô hình', 'Triển khai để dự đoán'], e: 'Dữ liệu → Huấn luyện → Đánh giá → Triển khai.' },
    { t: 'case', s: 'Chị Lan dùng AI viết bài giới thiệu sản phẩm. Bài viết trích dẫn một số liệu thống kê rất ấn tượng nhưng không ghi nguồn.', q: 'Chị Lan nên làm gì?', o: ['Đăng ngay vì AI luôn chính xác', 'Kiểm chứng số liệu từ nguồn đáng tin cậy trước khi đăng', 'Xóa toàn bộ bài viết', 'Yêu cầu AI viết số liệu lớn hơn'], a: 1, e: 'Số liệu không nguồn rất có thể là ảo giác – phải kiểm chứng.' },
    { t: 'single', q: '“Garbage in, garbage out” nghĩa là gì?', o: ['Dữ liệu kém chất lượng sẽ tạo ra kết quả kém', 'Phải xóa dữ liệu cũ thường xuyên', 'AI tự động dọn dẹp dữ liệu rác', 'Càng nhiều dữ liệu rác càng tốt'], a: 0, e: 'Chất lượng dữ liệu quyết định chất lượng mô hình.' }
  ]
},
/* ------------------------------------------------------------------ 2 */
{
  id: 'm2', code: 'AI102', icon: 'wand', c1: '#22d3ee', c2: '#3b82f6',
  title: 'Prompt Engineering – Nghệ thuật ra lệnh cho AI',
  desc: 'Công thức 5 thành phần, few-shot, prompt chaining và cách tinh chỉnh để AI làm đúng ý.',
  lessons: [
    { t: 'Prompt là gì và vì sao quan trọng?', b: [
      '<b>Prompt</b> là câu lệnh, yêu cầu bạn gửi cho AI. Cùng một công cụ, prompt khác nhau cho kết quả khác nhau một trời một vực.',
      { h: 'Prompt kém' },
      { prompt: 'Viết bài về cà phê.' },
      { h: 'Prompt tốt' },
      { prompt: 'Bạn là chuyên gia content marketing ngành F&B. Hãy viết 1 bài Facebook 150 chữ giới thiệu món cà phê muối mới của quán, đối tượng là dân văn phòng 25–35 tuổi ở TP.HCM, giọng văn trẻ trung, có 3 emoji, kết thúc bằng lời kêu gọi đặt hàng qua inbox.' },
      { tip: 'Hãy viết prompt như đang giao việc cho một nhân viên giỏi nhưng mới vào công ty: càng rõ ràng, càng ít phải sửa.' } ] },
    { t: 'Công thức 5 thành phần của prompt hiệu quả', b: [
      { ul: [
        '<b>Vai trò (Role)</b>: AI đóng vai ai? “Bạn là chuyên gia SEO 10 năm kinh nghiệm…”',
        '<b>Bối cảnh (Context)</b>: thông tin nền, đối tượng khách hàng, mục tiêu.',
        '<b>Nhiệm vụ (Task)</b>: việc cụ thể cần làm, dùng động từ rõ ràng.',
        '<b>Định dạng (Format)</b>: bảng, gạch đầu dòng, độ dài, số phương án.',
        '<b>Ràng buộc (Constraints)</b>: giọng văn, điều cần tránh, tiêu chí chất lượng.' ] },
      { prompt: 'Vai trò: Bạn là chuyên viên tuyển dụng.\nBối cảnh: Công ty phần mềm 50 người ở Đà Nẵng cần tuyển nhân viên Marketing.\nNhiệm vụ: Viết tin tuyển dụng.\nĐịnh dạng: Tiêu đề + 4 mục (Mô tả, Yêu cầu, Quyền lợi, Cách ứng tuyển), dạng gạch đầu dòng.\nRàng buộc: Dưới 250 chữ, giọng thân thiện, không dùng từ “siêu”, “cực kỳ”.' } ] },
    { t: 'Kỹ thuật nâng cao', b: [
      { ul: [
        '<b>Few-shot</b>: đưa vài ví dụ mẫu để AI bắt chước đúng phong cách.',
        '<b>Prompt chaining</b>: chia nhiệm vụ lớn thành chuỗi bước – dàn ý → viết nháp → biên tập.',
        '<b>Suy luận từng bước</b>: “Hãy phân tích từng bước trước khi kết luận” – hữu ích với bài toán cần lập luận.',
        '<b>Cho phép AI hỏi lại</b>: “Nếu thiếu thông tin, hãy hỏi tôi trước khi trả lời”.',
        '<b>Dấu phân cách</b>: dùng """ hoặc thẻ &lt;tai_lieu&gt; để tách dữ liệu khỏi phần chỉ dẫn.' ] },
      { prompt: 'Dưới đây là 2 caption mẫu đúng phong cách thương hiệu:\n"""\n[Mẫu 1]\n[Mẫu 2]\n"""\nHãy viết 3 caption mới cho sản phẩm X theo đúng phong cách trên.' } ] },
    { t: 'Lặp lại và tinh chỉnh', b: [
      'Prompt hay hiếm khi đúng ngay lần đầu. Quy trình chuẩn: <b>Viết → Xem kết quả → Phản hồi cụ thể → Cải thiện</b>.',
      { ul: [
        'Phản hồi cụ thể thay vì chung chung: “Ngắn lại còn 80 chữ, bỏ các từ sáo rỗng”.',
        'Lưu prompt tốt thành <b>thư viện template</b> để cả đội dùng lại.',
        'Yêu cầu AI tự đánh giá: “Chấm bài viết theo thang 10 và đề xuất 3 điểm cải thiện”.' ] },
      { tip: 'Mẹo của Tân AI: kết thúc prompt quan trọng bằng câu “Trước khi làm, hãy tóm tắt lại yêu cầu của tôi” để chắc chắn AI hiểu đúng.' } ] }
  ],
  cards: [
    ['Prompt', 'Câu lệnh/yêu cầu gửi cho AI để nhận kết quả mong muốn.'],
    ['Role prompting', 'Giao cho AI một vai trò cụ thể để định hướng chuyên môn và giọng văn.'],
    ['Zero-shot', 'Yêu cầu AI thực hiện mà không đưa ví dụ mẫu.'],
    ['Few-shot', 'Đưa vài ví dụ mẫu để AI bắt chước phong cách, định dạng.'],
    ['Prompt chaining', 'Chia nhiệm vụ lớn thành chuỗi prompt nối tiếp nhau.'],
    ['Chain-of-thought', 'Yêu cầu AI suy luận từng bước trước khi đưa ra kết luận.'],
    ['Delimiter', 'Dấu phân cách (""", thẻ XML) tách dữ liệu khỏi chỉ dẫn.'],
    ['Prompt template', 'Mẫu prompt chuẩn hóa, có chỗ trống để điền và dùng lại.']
  ],
  quiz: [
    { t: 'multi', q: 'Đâu là thành phần của công thức prompt 5 yếu tố? (Chọn tất cả đáp án đúng)', o: ['Vai trò', 'Bối cảnh', 'Mật khẩu tài khoản', 'Định dạng đầu ra', 'Ràng buộc'], a: [0, 1, 3, 4], e: '5 yếu tố: Vai trò – Bối cảnh – Nhiệm vụ – Định dạng – Ràng buộc.' },
    { t: 'single', q: 'Kỹ thuật đưa vài ví dụ mẫu vào prompt để AI bắt chước gọi là gì?', o: ['Zero-shot', 'Few-shot', 'Fine-tuning', 'Prompt injection'], a: 1, e: 'Few-shot = vài ví dụ mẫu.' },
    { t: 'case', s: 'Bạn gõ “Viết bài về sản phẩm” và nhận được một bài viết chung chung, dài dòng.', q: 'Cách cải thiện tốt nhất là gì?', o: ['Lặp lại đúng câu lệnh đó nhiều lần', 'Bổ sung đối tượng khách hàng, mục tiêu, độ dài, giọng văn và định dạng', 'Chuyển sang viết bằng tiếng Anh', 'Viết hoa toàn bộ câu lệnh'], a: 1, e: 'Prompt càng cụ thể, kết quả càng đúng ý.' },
    { t: 'tf', q: 'Yêu cầu AI “phân tích từng bước trước khi kết luận” thường giúp cải thiện chất lượng với bài toán cần suy luận.', a: true, e: 'Đây là kỹ thuật chain-of-thought.' },
    { t: 'fill', q: 'Kỹ thuật chia một nhiệm vụ lớn thành chuỗi nhiều prompt nối tiếp nhau gọi là ___.', o: ['Prompt chaining', 'Prompt bombing', 'Data mining', 'Overprompting'], a: 0, e: 'Ví dụ: dàn ý → viết nháp → biên tập.' },
    { t: 'order', q: 'Sắp xếp đúng quy trình tinh chỉnh prompt.', o: ['Viết prompt ban đầu', 'Xem kết quả AI trả về', 'Đưa phản hồi cụ thể', 'Lưu thành template khi đạt yêu cầu'], e: 'Viết → Xem → Phản hồi → Lưu template.' },
    { t: 'match', q: 'Ghép thành phần prompt với ví dụ tương ứng.', p: [['Vai trò', '“Bạn là chuyên gia SEO 10 năm kinh nghiệm”'], ['Định dạng', '“Trình bày dạng bảng 3 cột”'], ['Ràng buộc', '“Không phóng đại, dưới 100 chữ”'], ['Bối cảnh', '“Khách hàng là mẹ bỉm sữa 25–35 tuổi”']], e: 'Mỗi thành phần trả lời một câu hỏi khác nhau.' },
    { t: 'single', q: 'Vì sao nên dùng dấu phân cách như """ hoặc thẻ <tai_lieu>?', o: ['Để prompt trông chuyên nghiệp hơn', 'Để tách rõ dữ liệu cần xử lý khỏi phần chỉ dẫn', 'Để AI trả lời nhanh gấp đôi', 'Vì AI không đọc được chữ thường'], a: 1, e: 'Giúp AI không nhầm dữ liệu với yêu cầu.' },
    { t: 'tf', q: 'Prompt càng ngắn, càng mơ hồ thì AI càng cho kết quả đúng ý.', a: false, e: 'Mơ hồ thì AI phải đoán – thường sai ý.' },
    { t: 'single', q: 'Câu nào giúp AI tránh đoán mò khi thiếu thông tin?', o: ['“Trả lời thật nhanh”', '“Nếu thiếu thông tin, hãy hỏi tôi trước khi trả lời”', '“Hãy tự bịa thêm chi tiết”', '“Đừng hỏi lại tôi bất cứ điều gì”'], a: 1, e: 'Cho phép AI hỏi lại giúp giảm sai sót.' }
  ]
},
/* ------------------------------------------------------------------ 3 */
{
  id: 'm3', code: 'MKT201', icon: 'pen', c1: '#f472b6', c2: '#e11d48',
  title: 'AI viết Content Marketing',
  desc: 'AIDA, PAS, 4U, FAB, giọng văn thương hiệu và tái sử dụng nội dung đa kênh cùng AI.',
  lessons: [
    { t: 'Quy trình sản xuất content cùng AI', b: [
      'Một quy trình content hiệu quả: <b>Nghiên cứu → Lên ý tưởng → Dàn ý → Viết nháp → Biên tập → Tái sử dụng đa kênh</b>.',
      'AI tăng tốc mọi bước, nhưng <b>chiến lược, insight khách hàng và cảm xúc thương hiệu</b> vẫn là phần việc của bạn.',
      { prompt: 'Gợi ý 20 ý tưởng bài đăng Facebook cho một tiệm bánh ngọt ở Hà Nội trong tháng 10, chia thành 4 nhóm: giáo dục, giải trí, bán hàng, câu chuyện thương hiệu. Trình bày dạng bảng.' },
      { tip: 'Hãy giữ một file “insight khách hàng” và dán vào đầu mỗi phiên làm việc với AI – chất lượng tăng thấy rõ.' } ] },
    { t: 'Công thức copywriting kinh điển', b: [
      { ul: [
        '<b>AIDA</b>: Attention (gây chú ý) – Interest (tạo hứng thú) – Desire (khơi gợi mong muốn) – Action (kêu gọi hành động).',
        '<b>PAS</b>: Problem (nêu vấn đề) – Agitate (khoét sâu nỗi đau) – Solution (đưa giải pháp).',
        '<b>4U</b> cho tiêu đề: Useful (hữu ích), Urgent (cấp bách), Unique (độc đáo), Ultra-specific (cực kỳ cụ thể).',
        '<b>FAB</b>: Features (tính năng) – Advantages (ưu điểm) – Benefits (lợi ích thực sự cho khách).' ] },
      { prompt: 'Viết quảng cáo Facebook cho khóa học Excel online theo công thức PAS, đối tượng là nhân viên văn phòng hay phải làm báo cáo, dưới 120 chữ, có lời kêu gọi đăng ký.' } ] },
    { t: 'Giữ giọng văn thương hiệu (Brand voice)', b: [
      'Nội dung AI dễ bị “nhạt” và giống nhau. Giải pháp là xây dựng một <b>Brand voice guide</b> ngắn gọn rồi đưa vào đầu mọi prompt:',
      { ul: [
        'Tính cách thương hiệu (ví dụ: chuyên nghiệp nhưng gần gũi, hài hước nhẹ).',
        'Cách xưng hô với khách hàng.',
        'Từ ngữ nên dùng và cần tránh.',
        '2–3 bài viết mẫu chuẩn phong cách (kỹ thuật few-shot).' ] },
      { tip: 'Tránh “văn AI”: yêu cầu AI không dùng các cụm sáo rỗng như “trong thời đại 4.0”, “không thể phủ nhận”, rồi tự thêm trải nghiệm thật của bạn.' } ] },
    { t: 'Tái sử dụng content đa kênh', b: [
      'Một bài blog chất lượng có thể “nhân bản” thành: chuỗi 5 bài Facebook, 1 kịch bản video ngắn, 1 email, 10 tiêu đề, 1 bộ slide carousel.',
      { prompt: 'Từ bài viết dưới đây, hãy tạo: (1) 1 kịch bản video TikTok 45 giây có hook trong 3 giây đầu, (2) 1 email gửi khách hàng, (3) 5 tiêu đề theo công thức 4U.\n"""\n[Dán bài viết]\n"""' },
      { h: 'Trước khi đăng' },
      { ul: [ 'Kiểm tra sự thật, số liệu, tên riêng.', 'Thêm câu chuyện, hình ảnh thật của thương hiệu.', 'Đối chiếu chính sách quảng cáo của nền tảng.' ] } ] }
  ],
  cards: [
    ['AIDA', 'Attention – Interest – Desire – Action.'],
    ['PAS', 'Problem – Agitate – Solution: nêu vấn đề, khoét sâu, đưa giải pháp.'],
    ['4U', 'Công thức tiêu đề: Useful, Urgent, Unique, Ultra-specific.'],
    ['FAB', 'Features – Advantages – Benefits.'],
    ['CTA', 'Call To Action – lời kêu gọi hành động.'],
    ['Brand voice', 'Giọng văn, tính cách nhất quán của thương hiệu.'],
    ['Content repurposing', 'Tái sử dụng một nội dung gốc thành nhiều định dạng, nhiều kênh.'],
    ['Hook', 'Câu/cảnh mở đầu giữ chân người xem trong vài giây đầu.']
  ],
  quiz: [
    { t: 'single', q: 'Chữ “D” trong công thức AIDA là gì?', o: ['Data – dữ liệu', 'Desire – khơi gợi mong muốn', 'Design – thiết kế', 'Discount – giảm giá'], a: 1, e: 'Attention – Interest – Desire – Action.' },
    { t: 'order', q: 'Sắp xếp đúng thứ tự công thức PAS.', o: ['Problem – Nêu vấn đề', 'Agitate – Khoét sâu nỗi đau', 'Solution – Đưa giải pháp'], e: 'P → A → S.' },
    { t: 'match', q: 'Ghép từng bước AIDA với ví dụ.', p: [['Attention', 'Tiêu đề gây chú ý'], ['Interest', 'Thông tin khiến người đọc tò mò'], ['Desire', 'Lợi ích khiến khách muốn sở hữu'], ['Action', '“Đăng ký ngay hôm nay”']], e: 'Đi từ chú ý đến hành động.' },
    { t: 'tf', q: 'Nên đưa hướng dẫn giọng văn thương hiệu vào prompt để nội dung AI viết được nhất quán.', a: true, e: 'Brand voice guide giúp nội dung đồng bộ.' },
    { t: 'case', s: 'Bài viết AI tạo ra đúng ý nhưng đọc rất máy móc, nhiều câu sáo rỗng như “trong thời đại công nghệ 4.0”.', q: 'Bạn nên làm gì?', o: ['Đăng luôn cho kịp tiến độ', 'Đưa bài mẫu đúng phong cách, liệt kê từ cần tránh và tự biên tập thêm trải nghiệm thật', 'Bỏ AI, quay lại viết thủ công 100%', 'Yêu cầu AI viết dài gấp đôi'], a: 1, e: 'Few-shot + danh sách từ cần tránh + biên tập của con người.' },
    { t: 'fill', q: 'Câu mở đầu giữ chân người xem trong vài giây đầu của video ngắn gọi là ___.', o: ['Hook', 'Footer', 'Hashtag', 'Slogan'], a: 0, e: '3 giây đầu quyết định người xem ở lại hay lướt qua.' },
    { t: 'multi', q: 'Từ một bài blog dài, AI có thể giúp tái sử dụng thành những gì? (Chọn tất cả đáp án đúng)', o: ['Chuỗi bài đăng mạng xã hội', 'Kịch bản video ngắn', 'Email gửi khách hàng', 'Giấy phép kinh doanh'], a: [0, 1, 2], e: 'Content repurposing giúp tiết kiệm công sức sản xuất.' },
    { t: 'single', q: 'Công thức 4U thường dùng để viết phần nào?', o: ['Tiêu đề (headline)', 'Hợp đồng', 'Báo cáo tài chính', 'Mã nguồn'], a: 0, e: 'Useful – Urgent – Unique – Ultra-specific.' },
    { t: 'tf', q: 'Content do AI viết có thể đăng ngay mà không cần kiểm tra vì AI không bao giờ sai.', a: false, e: 'AI có thể ảo giác – luôn kiểm tra trước khi đăng.' },
    { t: 'single', q: 'Trong FAB, “Benefit” là gì?', o: ['Tính năng kỹ thuật của sản phẩm', 'Giá bán', 'Lợi ích thực sự mà khách hàng nhận được', 'Đối thủ cạnh tranh'], a: 2, e: 'Khách mua lợi ích, không chỉ mua tính năng.' }
  ]
},
/* ------------------------------------------------------------------ 4 */
{
  id: 'm4', code: 'MKT202', icon: 'image', c1: '#fbbf24', c2: '#f97316',
  title: 'AI tạo Hình ảnh & Video',
  desc: 'Công thức prompt hình ảnh, tỉ lệ khung hình theo kênh, video AI và bản quyền.',
  lessons: [
    { t: 'Hệ sinh thái công cụ', b: [
      { ul: [
        '<b>Hình ảnh</b>: Midjourney, ChatGPT (tạo ảnh), Gemini, Stable Diffusion, Ideogram, Canva AI, Adobe Firefly…',
        '<b>Video</b>: tạo video từ văn bản hoặc từ ảnh (Sora, Veo, Runway, Kling…), avatar AI dẫn chương trình (HeyGen, Synthesia…).',
        '<b>Âm thanh</b>: lồng tiếng, nhân bản giọng, tạo nhạc (ElevenLabs, Suno…).' ] },
      'Công cụ thay đổi rất nhanh. <b>Nắm vững nguyên tắc quan trọng hơn nhớ tên công cụ</b> – nguyên tắc dùng được cho mọi công cụ.',
      { tip: 'Chọn 1 công cụ ảnh và 1 công cụ video, luyện thật sâu trong 30 ngày còn hơn thử 20 công cụ hời hợt.' } ] },
    { t: 'Công thức prompt hình ảnh', b: [
      '<b>Chủ thể + Bối cảnh + Phong cách + Ánh sáng + Góc máy + Tỉ lệ khung hình</b>.',
      { prompt: 'Ảnh sản phẩm ly cà phê muối trên bàn gỗ, hơi nước bốc lên, nắng sáng sớm chiếu xiên qua cửa sổ, phong cách nhiếp ảnh quảng cáo cao cấp, cận cảnh, ống kính 85mm, xóa phông, tỉ lệ 4:5' },
      { ul: [
        '<b>Negative prompt</b>: mô tả những thứ không muốn xuất hiện (chữ lỗi, người thừa, mờ nhòe…).',
        '<b>Ảnh tham chiếu</b>: tải ảnh mẫu để giữ phong cách, nhân vật, sản phẩm nhất quán.',
        '<b>Upscale</b>: tăng độ phân giải để in ấn hoặc dùng cho banner lớn.' ] } ] },
    { t: 'Tỉ lệ & định dạng theo kênh', b: [
      { ul: [
        '<b>9:16</b> – TikTok, Reels, YouTube Shorts, Stories.',
        '<b>4:5</b> – ảnh dọc tối ưu cho feed Facebook/Instagram.',
        '<b>1:1</b> – ảnh vuông đa năng.',
        '<b>16:9</b> – video YouTube, banner website, slide.' ] },
      'Với video ngắn, <b>3 giây đầu</b> quyết định người xem ở lại hay lướt qua: hãy mở bằng chuyển động, câu hỏi hoặc kết quả bất ngờ.',
      { tip: 'Giữ bộ màu và nhân vật thương hiệu cố định trong mọi prompt để khách nhận ra bạn chỉ sau 1 giây.' } ] },
    { t: 'Bản quyền & đạo đức hình ảnh AI', b: [
      { ul: [
        'Không mạo danh người thật, người nổi tiếng; không tạo deepfake gây hiểu lầm.',
        'Không sao chép logo, nhân vật, thương hiệu của người khác.',
        'Gắn nhãn nội dung tạo bởi AI khi nền tảng hoặc bối cảnh yêu cầu.',
        'Soát lỗi kỹ: bàn tay, chữ trong ảnh, chi tiết sản phẩm sai thực tế.',
        'Đọc điều khoản sử dụng thương mại của từng công cụ.' ] },
      { tip: 'Ảnh AI đẹp nhưng sai sự thật về sản phẩm có thể khiến khách thất vọng và bị coi là quảng cáo gian dối.' } ] }
  ],
  cards: [
    ['Text-to-image', 'Tạo hình ảnh từ mô tả bằng văn bản.'],
    ['Image-to-video', 'Biến một hình ảnh tĩnh thành video chuyển động.'],
    ['Negative prompt', 'Mô tả những yếu tố không muốn xuất hiện trong kết quả.'],
    ['Aspect ratio', 'Tỉ lệ khung hình: 9:16, 4:5, 1:1, 16:9…'],
    ['9:16', 'Tỉ lệ dọc cho TikTok, Reels, Shorts, Stories.'],
    ['Upscale', 'Tăng độ phân giải, làm ảnh sắc nét hơn.'],
    ['Deepfake', 'Hình ảnh/video/giọng nói giả mạo người thật bằng AI.'],
    ['Reference image', 'Ảnh tham chiếu giúp giữ phong cách, nhân vật nhất quán.']
  ],
  quiz: [
    { t: 'single', q: 'Tỉ lệ khung hình phù hợp nhất cho video TikTok/Reels là?', o: ['16:9', '9:16', '4:3', '21:9'], a: 1, e: 'Video dọc toàn màn hình điện thoại.' },
    { t: 'order', q: 'Sắp xếp các thành phần prompt hình ảnh theo công thức đã học.', o: ['Chủ thể', 'Bối cảnh', 'Phong cách & ánh sáng', 'Tỉ lệ khung hình'], e: 'Chủ thể → Bối cảnh → Phong cách, ánh sáng → Tỉ lệ.' },
    { t: 'fill', q: 'Phần mô tả những thứ KHÔNG muốn xuất hiện trong ảnh gọi là ___.', o: ['Negative prompt', 'Seed', 'Hashtag', 'Watermark'], a: 0, e: 'Giúp loại bỏ chi tiết thừa, lỗi.' },
    { t: 'tf', q: 'Dùng AI tạo video giả mạo người nổi tiếng quảng cáo sản phẩm khi chưa được phép là vi phạm đạo đức và có thể vi phạm pháp luật.', a: true, e: 'Đây là hành vi mạo danh, xâm phạm quyền hình ảnh.' },
    { t: 'match', q: 'Ghép tỉ lệ khung hình với kênh phù hợp.', p: [['9:16', 'Reels, TikTok, Shorts'], ['16:9', 'Video YouTube, banner web'], ['1:1', 'Bài đăng vuông trên feed'], ['4:5', 'Ảnh dọc tối ưu feed']], e: 'Đúng tỉ lệ = hiển thị tối ưu.' },
    { t: 'multi', q: 'Cần soát lỗi nào trước khi đăng ảnh AI? (Chọn tất cả đáp án đúng)', o: ['Bàn tay, ngón tay bất thường', 'Chữ trong ảnh bị sai chính tả', 'Chi tiết sản phẩm không đúng thực tế', 'Số lượt thích của đối thủ'], a: [0, 1, 2], e: 'Đây là những lỗi AI hay mắc.' },
    { t: 'case', s: 'Bạn cần 20 ảnh quảng cáo với cùng một linh vật thương hiệu nhưng mỗi lần AI lại tạo ra nhân vật trông khác nhau.', q: 'Giải pháp tốt nhất là gì?', o: ['Chấp nhận mỗi ảnh một kiểu', 'Dùng ảnh tham chiếu và mô tả nhân vật cố định trong mọi prompt', 'Đổi công cụ liên tục', 'Chỉ dùng 1 ảnh cho cả 20 bài'], a: 1, e: 'Ảnh tham chiếu + mô tả cố định giúp nhất quán.' },
    { t: 'single', q: '“Upscale” ảnh nghĩa là gì?', o: ['Tăng độ phân giải, làm ảnh sắc nét hơn', 'Thay đổi màu sắc', 'Xóa nền', 'Thêm chữ'], a: 0, e: 'Dùng khi cần in ấn hoặc banner lớn.' },
    { t: 'tf', q: 'Nhớ thật nhiều tên công cụ quan trọng hơn hiểu nguyên tắc viết prompt hình ảnh.', a: false, e: 'Công cụ thay đổi, nguyên tắc thì bền vững.' },
    { t: 'single', q: 'Yếu tố nào giúp ảnh sản phẩm trông “cao cấp” hơn khi viết prompt?', o: ['Mô tả ánh sáng, chất liệu và phong cách nhiếp ảnh quảng cáo', 'Viết prompt chỉ 2 chữ', 'Thêm thật nhiều emoji', 'Bỏ qua mô tả bối cảnh'], a: 0, e: 'Ánh sáng và phong cách quyết định cảm giác cao cấp.' }
  ]
},
/* ------------------------------------------------------------------ 5 */
{
  id: 'm5', code: 'MKT203', icon: 'megaphone', c1: '#34d399', c2: '#059669',
  title: 'AI trong Digital Marketing & Quảng cáo',
  desc: 'Persona, SEO thời AI, A/B testing quảng cáo và đo lường CTR, CPA, ROAS.',
  lessons: [
    { t: 'Nghiên cứu khách hàng & persona với AI', b: [
      'AI giúp tổng hợp hàng trăm đánh giá, bình luận, khảo sát để tìm ra <b>nỗi đau, mong muốn và rào cản mua hàng</b> của khách.',
      { ul: [ 'Nhân khẩu học: tuổi, nghề nghiệp, thu nhập, nơi sống.', 'Hành vi: kênh sử dụng, thói quen mua.', 'Nỗi đau & mục tiêu.', 'Rào cản khiến họ chưa mua.' ] },
      { prompt: 'Dưới đây là 50 đánh giá khách hàng. Hãy nhóm thành 5 nỗi đau chính, mỗi nhóm kèm 2 trích dẫn tiêu biểu và gợi ý 1 thông điệp quảng cáo.\n"""\n[Dán đánh giá]\n"""' } ] },
    { t: 'SEO & nội dung website thời AI', b: [
      'AI hỗ trợ nghiên cứu từ khóa, xây cụm chủ đề (topic cluster), dàn ý chuẩn SEO, viết meta description.',
      'Nhưng nội dung phải <b>hữu ích, có trải nghiệm và chuyên môn thật</b> theo tiêu chí <b>E-E-A-T</b>: Experience (Kinh nghiệm), Expertise (Chuyên môn), Authoritativeness (Thẩm quyền), Trustworthiness (Độ tin cậy).',
      'Người dùng ngày càng tìm kiếm qua AI. Hãy viết <b>rõ ràng, có cấu trúc, trả lời trực tiếp câu hỏi</b> để dễ được trích dẫn.',
      { tip: 'Sản xuất hàng loạt bài kém chất lượng chỉ để nhồi từ khóa là con đường ngắn nhất để mất thứ hạng.' } ] },
    { t: 'Quảng cáo: biến thể & A/B testing', b: [
      'AI tạo hàng chục biến thể tiêu đề, hình ảnh, CTA chỉ trong vài phút. Các nền tảng quảng cáo lớn cũng dùng AI để tối ưu phân phối tự động.',
      { h: 'A/B testing đúng cách' },
      { ul: [ 'Đặt giả thuyết rõ ràng.', 'Chỉ thay đổi <b>một yếu tố</b> mỗi lần.', 'Chạy đủ lâu, đủ dữ liệu mới kết luận.', 'Chọn phiên bản thắng và tiếp tục thử nghiệm mới.' ] } ] },
    { t: 'Đo lường hiệu quả', b: [
      { ul: [
        '<b>CTR</b> = Lượt nhấp ÷ Lượt hiển thị.',
        '<b>CR</b> (tỉ lệ chuyển đổi) = Số chuyển đổi ÷ Lượt truy cập.',
        '<b>CPA</b> = Chi phí ÷ Số chuyển đổi.',
        '<b>ROAS</b> = Doanh thu từ quảng cáo ÷ Chi phí quảng cáo.' ] },
      'Ví dụ: chi 10 triệu, thu về 40 triệu doanh thu → ROAS = 4.',
      { prompt: 'Đây là số liệu quảng cáo 4 tuần của tôi (bảng bên dưới). Hãy tính CTR, CPA, ROAS từng tuần, chỉ ra tuần bất thường và đề xuất 3 hành động tối ưu.' } ] }
  ],
  cards: [
    ['Persona', 'Chân dung khách hàng mục tiêu điển hình.'],
    ['SEO', 'Tối ưu để website xuất hiện cao trên công cụ tìm kiếm.'],
    ['E-E-A-T', 'Kinh nghiệm – Chuyên môn – Thẩm quyền – Độ tin cậy.'],
    ['A/B testing', 'So sánh 2 phiên bản khác nhau một yếu tố để chọn bản tốt hơn.'],
    ['CTR', 'Tỉ lệ nhấp = Lượt nhấp ÷ Lượt hiển thị.'],
    ['CPA', 'Chi phí cho mỗi chuyển đổi = Chi phí ÷ Số chuyển đổi.'],
    ['ROAS', 'Doanh thu quảng cáo ÷ Chi phí quảng cáo.'],
    ['Personalization', 'Cá nhân hóa nội dung, ưu đãi theo từng khách hàng.']
  ],
  quiz: [
    { t: 'single', q: 'ROAS được tính bằng công thức nào?', o: ['Doanh thu từ quảng cáo ÷ Chi phí quảng cáo', 'Chi phí ÷ Số lượt nhấp', 'Số lượt nhấp ÷ Số lượt hiển thị', 'Lợi nhuận ÷ Số nhân viên'], a: 0, e: 'Return On Ad Spend.' },
    { t: 'case', s: 'Một chiến dịch chi 10 triệu đồng và mang về 40 triệu đồng doanh thu.', q: 'ROAS của chiến dịch là bao nhiêu?', o: ['0,25', '4', '30', '400'], a: 1, e: '40 ÷ 10 = 4.' },
    { t: 'match', q: 'Ghép chỉ số với công thức.', p: [['CTR', 'Lượt nhấp ÷ Lượt hiển thị'], ['CPA', 'Chi phí ÷ Số chuyển đổi'], ['ROAS', 'Doanh thu ÷ Chi phí quảng cáo'], ['CR', 'Chuyển đổi ÷ Lượt truy cập']], e: '4 chỉ số cốt lõi của marketer.' },
    { t: 'tf', q: 'Khi A/B test, nên thay đổi nhiều yếu tố cùng lúc để có kết quả nhanh hơn.', a: false, e: 'Thay nhiều yếu tố sẽ không biết yếu tố nào tạo ra khác biệt.' },
    { t: 'fill', q: 'Bộ tiêu chí E-E-A-T gồm Kinh nghiệm, Chuyên môn, Thẩm quyền và ___.', o: ['Độ tin cậy', 'Độ dài', 'Tốc độ', 'Giá cả'], a: 0, e: 'Trustworthiness – Độ tin cậy.' },
    { t: 'multi', q: 'AI có thể hỗ trợ những việc nào trong nghiên cứu khách hàng? (Chọn tất cả đáp án đúng)', o: ['Tổng hợp nỗi đau từ hàng trăm đánh giá', 'Phân nhóm bình luận theo chủ đề', 'Gợi ý chân dung khách hàng', 'Đảm bảo 100% khách hàng sẽ mua'], a: [0, 1, 2], e: 'AI hỗ trợ phân tích, không đảm bảo doanh số.' },
    { t: 'order', q: 'Sắp xếp đúng quy trình A/B testing.', o: ['Đặt giả thuyết', 'Tạo 2 phiên bản khác nhau một yếu tố', 'Chạy thử với lượng dữ liệu đủ lớn', 'Phân tích và chọn phiên bản thắng'], e: 'Giả thuyết → Phiên bản → Chạy → Kết luận.' },
    { t: 'single', q: 'Chiến dịch có 20.000 lượt hiển thị và 400 lượt nhấp. CTR là bao nhiêu?', o: ['0,5%', '2%', '5%', '20%'], a: 1, e: '400 ÷ 20.000 = 2%.' },
    { t: 'tf', q: 'Dùng AI sản xuất hàng loạt bài viết kém chất lượng để nhồi từ khóa là chiến lược SEO bền vững.', a: false, e: 'Nội dung phải hữu ích cho người đọc.' },
    { t: 'single', q: 'Để nội dung dễ được các công cụ tìm kiếm AI trích dẫn, nên làm gì?', o: ['Viết rõ ràng, có cấu trúc, trả lời trực tiếp câu hỏi', 'Ẩn nội dung trong hình ảnh', 'Lặp từ khóa thật nhiều lần', 'Viết thật dài dù không liên quan'], a: 0, e: 'Rõ ràng và hữu ích luôn thắng.' }
  ]
},
/* ------------------------------------------------------------------ 6 */
{
  id: 'm6', code: 'BIZ301', icon: 'chat', c1: '#60a5fa', c2: '#6366f1',
  title: 'AI cho Bán hàng & Chăm sóc khách hàng',
  desc: 'Chatbot 24/7, kịch bản SPIN, xử lý từ chối, lead scoring và đo lường trải nghiệm.',
  lessons: [
    { t: 'Chatbot AI phục vụ 24/7', b: [
      'Chatbot AI trả lời câu hỏi thường gặp, tư vấn sản phẩm, đặt lịch và thu thập thông tin khách hàng tiềm năng (lead) mọi lúc.',
      { h: 'Điều kiện để chatbot làm tốt' },
      { ul: [ 'Kho kiến thức chuẩn: sản phẩm, giá, chính sách đổi trả, FAQ.', 'Kịch bản rõ ràng và giới hạn những gì bot được phép nói.', '<b>Chuyển cho người thật</b> (human handoff) khi khách phàn nàn, vấn đề phức tạp hoặc khách yêu cầu.' ] },
      { tip: 'Bot trả lời sai chính sách còn tệ hơn không có bot. Kho kiến thức phải được cập nhật mỗi khi chính sách thay đổi.' } ] },
    { t: 'Kịch bản bán hàng & xử lý từ chối', b: [
      'Mô hình hỏi <b>SPIN</b>: Situation (tình hình) – Problem (vấn đề) – Implication (hệ quả) – Need-payoff (giá trị của giải pháp).',
      'AI giúp soạn kịch bản tư vấn và các câu trả lời cho lời từ chối quen thuộc: “đắt quá”, “để suy nghĩ thêm”, “bên kia rẻ hơn”.',
      { prompt: 'Bạn đóng vai khách hàng 40 tuổi, chủ cửa hàng nhỏ, đang lưỡng lự vì nghĩ phần mềm quản lý bán hàng quá đắt. Hãy phản bác tôi từng câu một để tôi luyện xử lý từ chối. Sau 5 lượt, hãy chấm điểm và góp ý cho tôi.' } ] },
    { t: 'CRM thông minh & chấm điểm khách hàng', b: [
      { ul: [
        '<b>Lead scoring</b>: AI chấm điểm khả năng mua dựa trên hành vi (mở email, xem trang giá, hỏi báo giá).',
        'Tóm tắt lịch sử khách hàng trước mỗi cuộc gọi.',
        'Gợi ý thời điểm và nội dung chăm sóc phù hợp.',
        'Cá nhân hóa email follow-up theo nhu cầu từng khách.' ] },
      { tip: 'Ưu tiên gọi cho “lead nóng” trước – đội sale của bạn sẽ chốt nhiều hơn với cùng một quỹ thời gian.' } ] },
    { t: 'Trải nghiệm khách hàng & đo lường', b: [
      { ul: [
        '<b>CSAT</b>: mức độ hài lòng sau mỗi lần hỗ trợ.',
        '<b>NPS</b>: mức độ sẵn sàng giới thiệu thương hiệu (thang 0–10).',
        '<b>Thời gian phản hồi đầu tiên</b>.',
        '<b>Phân tích cảm xúc</b>: AI phân loại bình luận tích cực, tiêu cực, trung lập.' ] },
      'Nguyên tắc: minh bạch rằng khách đang trò chuyện với AI, không hứa điều chính sách không cho phép, bảo mật dữ liệu khách hàng.' ] }
  ],
  cards: [
    ['Chatbot', 'Chương trình trò chuyện tự động với khách hàng.'],
    ['Human handoff', 'Chuyển cuộc trò chuyện từ bot sang nhân viên thật.'],
    ['Lead', 'Khách hàng tiềm năng đã để lại thông tin.'],
    ['Lead scoring', 'Chấm điểm khả năng mua hàng của khách tiềm năng.'],
    ['CRM', 'Hệ thống quản lý quan hệ và dữ liệu khách hàng.'],
    ['SPIN', 'Situation – Problem – Implication – Need-payoff.'],
    ['NPS', 'Chỉ số sẵn sàng giới thiệu thương hiệu, thang 0–10.'],
    ['Sentiment analysis', 'Phân tích cảm xúc tích cực/tiêu cực/trung lập trong văn bản.']
  ],
  quiz: [
    { t: 'single', q: 'Khi nào chatbot nên chuyển cuộc trò chuyện cho nhân viên thật?', o: ['Khi khách phàn nàn gay gắt hoặc vấn đề phức tạp', 'Không bao giờ', 'Chỉ khi khách hỏi giá', 'Ngay từ tin nhắn đầu tiên'], a: 0, e: 'Human handoff đúng lúc giữ chân khách hàng.' },
    { t: 'tf', q: 'Có thể cho AI đóng vai khách hàng khó tính để nhân viên luyện kỹ năng xử lý từ chối.', a: true, e: 'Đây là cách luyện tập rất hiệu quả.' },
    { t: 'match', q: 'Ghép từng bước SPIN với mục đích.', p: [['Situation', 'Hỏi về tình hình hiện tại của khách'], ['Problem', 'Khai thác khó khăn khách đang gặp'], ['Implication', 'Làm rõ hệ quả nếu không giải quyết'], ['Need-payoff', 'Giúp khách thấy giá trị giải pháp']], e: 'SPIN dẫn dắt khách tự nhận ra nhu cầu.' },
    { t: 'fill', q: 'Việc AI chấm điểm khả năng mua hàng của từng khách tiềm năng gọi là ___.', o: ['Lead scoring', 'Lead magnet', 'Retargeting', 'Upsell'], a: 0, e: 'Giúp ưu tiên lead nóng.' },
    { t: 'case', s: 'Chatbot của shop trả lời khách “được đổi trả trong 60 ngày” trong khi chính sách thật chỉ là 7 ngày.', q: 'Cách khắc phục đúng nhất là gì?', o: ['Khách hiểu nhầm, không cần làm gì', 'Cập nhật kho kiến thức chính sách và giới hạn phạm vi trả lời của bot', 'Tắt chatbot vĩnh viễn', 'Đổi chính sách thành 60 ngày cho khớp'], a: 1, e: 'Kho kiến thức sai hoặc bot ảo giác – phải sửa từ gốc.' },
    { t: 'multi', q: 'Dữ liệu nào nên có trong kho kiến thức của chatbot bán hàng? (Chọn tất cả đáp án đúng)', o: ['Thông tin & giá sản phẩm', 'Chính sách đổi trả, bảo hành', 'Câu hỏi thường gặp (FAQ)', 'Mật khẩu hệ thống nội bộ'], a: [0, 1, 2], e: 'Tuyệt đối không đưa thông tin bảo mật vào bot.' },
    { t: 'single', q: 'NPS đo lường điều gì?', o: ['Mức độ sẵn sàng giới thiệu thương hiệu cho người khác', 'Số lượng hàng tồn kho', 'Tốc độ website', 'Chi phí mỗi lượt nhấp'], a: 0, e: 'Net Promoter Score.' },
    { t: 'order', q: 'Sắp xếp quy trình chăm sóc khách hàng tiềm năng với AI.', o: ['Thu thập lead từ chatbot/form', 'AI chấm điểm và phân loại lead', 'Gửi nội dung chăm sóc cá nhân hóa', 'Nhân viên chốt đơn với lead nóng'], e: 'Thu thập → Chấm điểm → Chăm sóc → Chốt.' },
    { t: 'tf', q: 'Chatbot nên giả vờ là người thật để khách tin tưởng hơn.', a: false, e: 'Minh bạch là nguyên tắc dùng AI có trách nhiệm.' },
    { t: 'single', q: '“Phân tích cảm xúc” (sentiment analysis) giúp doanh nghiệp làm gì?', o: ['Biết bình luận của khách là tích cực, tiêu cực hay trung lập', 'Tăng tốc độ in ấn', 'Tính thuế tự động', 'Thiết kế logo'], a: 0, e: 'Phát hiện sớm khủng hoảng và điểm khen chê.' }
  ]
},
/* ------------------------------------------------------------------ 7 */
{
  id: 'm7', code: 'AUTO301', icon: 'robot', c1: '#a78bfa', c2: '#7c3aed',
  title: 'Tự động hóa công việc & AI Agent',
  desc: 'Workflow Trigger → Action, công cụ no-code, AI Agent, MCP và nguyên tắc human-in-the-loop.',
  lessons: [
    { t: 'Tư duy tự động hóa', b: [
      'Hãy tìm những việc <b>lặp lại, tốn thời gian, theo quy tắc rõ ràng</b>. Đó là ứng viên số 1 để tự động hóa.',
      'Mọi workflow đều có cấu trúc: <b>Trigger</b> (sự kiện kích hoạt) → <b>Action</b> (các hành động).',
      { prompt: 'Ví dụ workflow: Khách điền form → AI phân loại nhu cầu → Lưu vào Google Sheets → Gửi email cảm ơn → Báo tin cho nhân viên sale qua Zalo/Slack.' },
      { tip: 'Tự động hóa một quy trình tồi chỉ khiến bạn làm sai nhanh hơn. Chuẩn hóa quy trình trước, tự động hóa sau.' } ] },
    { t: 'Công cụ no-code', b: [
      { ul: [ '<b>Zapier</b> – dễ dùng, kết nối hàng nghìn ứng dụng.', '<b>Make</b> – kéo thả trực quan, linh hoạt.', '<b>n8n</b> – mạnh, có thể tự cài đặt trên máy chủ riêng.', '<b>Power Automate</b> – phù hợp hệ sinh thái Microsoft.' ] },
      'Các ứng dụng “nói chuyện” với nhau qua <b>API</b>. Trong workflow, bước AI có thể: tóm tắt, phân loại, trích xuất thông tin, soạn thảo nội dung.' ] },
    { t: 'AI Agent – trợ lý tự hành', b: [
      '<b>AI Agent</b> nhận một mục tiêu, tự lập kế hoạch, sử dụng công cụ (tìm kiếm web, đọc file, gửi email, gọi API), ghi nhớ và lặp lại cho đến khi hoàn thành.',
      'Khác biệt cốt lõi: <b>chatbot trả lời – agent hành động</b>.',
      { ul: [ '<b>Mô hình AI</b> – bộ não suy luận.', '<b>Công cụ</b> – “tay chân” để hành động.', '<b>Bộ nhớ</b> – lưu ngữ cảnh, kết quả.', '<b>Mục tiêu/Chỉ dẫn</b> – định hướng việc cần làm.' ] },
      '<b>MCP (Model Context Protocol)</b> là chuẩn mở giúp kết nối AI với công cụ và nguồn dữ liệu bên ngoài theo cùng một cách.' ] },
    { t: 'Triển khai an toàn', b: [
      { ul: [
        '<b>Human-in-the-loop</b>: con người duyệt ở các bước quan trọng (chuyển tiền, gửi email hàng loạt, xóa dữ liệu).',
        'Bắt đầu nhỏ, đo thời gian tiết kiệm được.',
        'Cấp quyền tối thiểu cho agent.',
        'Ghi log hoạt động, luôn có nút dừng khẩn cấp.' ] },
      { tip: 'Tính nhanh: một việc mất 15 phút mỗi ngày, tự động hóa xong bạn lấy lại hơn 60 giờ mỗi năm.' } ] }
  ],
  cards: [
    ['Workflow', 'Chuỗi các bước công việc được sắp xếp theo trình tự.'],
    ['Trigger', 'Sự kiện kích hoạt workflow bắt đầu.'],
    ['Action', 'Hành động được thực hiện khi workflow chạy.'],
    ['No-code', 'Xây dựng ứng dụng/quy trình mà không cần lập trình.'],
    ['API', 'Giao diện giúp các phần mềm trao đổi dữ liệu với nhau.'],
    ['AI Agent', 'AI tự lập kế hoạch và dùng công cụ để hoàn thành mục tiêu.'],
    ['Human-in-the-loop', 'Con người kiểm duyệt ở các bước quan trọng.'],
    ['MCP', 'Model Context Protocol – chuẩn kết nối AI với công cụ, dữ liệu.']
  ],
  quiz: [
    { t: 'single', q: 'Trong một workflow tự động, “trigger” là gì?', o: ['Sự kiện kích hoạt quy trình bắt đầu', 'Bước cuối cùng của quy trình', 'Tên một phần mềm diệt virus', 'Báo cáo tổng kết'], a: 0, e: 'Trigger → Action.' },
    { t: 'single', q: 'Điểm khác biệt cốt lõi giữa AI Agent và chatbot thông thường?', o: ['Agent có thể tự lập kế hoạch và dùng công cụ để hành động', 'Agent chỉ trả lời bằng giọng nói', 'Chatbot luôn thông minh hơn agent', 'Không có khác biệt'], a: 0, e: 'Chatbot trả lời – agent hành động.' },
    { t: 'order', q: 'Sắp xếp workflow xử lý khách hàng mới.', o: ['Khách điền form đăng ký', 'AI phân loại nhu cầu khách', 'Lưu thông tin vào Google Sheets/CRM', 'Gửi email cảm ơn và báo cho sale'], e: 'Trigger là form, sau đó là các action.' },
    { t: 'tf', q: 'Nên để AI Agent tự động chuyển tiền và xóa dữ liệu quan trọng mà không cần con người phê duyệt.', a: false, e: 'Các bước rủi ro cao cần human-in-the-loop.' },
    { t: 'match', q: 'Ghép thành phần của AI Agent với vai trò.', p: [['Mô hình AI', 'Bộ não suy luận và ra quyết định'], ['Công cụ', 'Tìm kiếm web, gửi email, gọi API'], ['Bộ nhớ', 'Lưu ngữ cảnh và kết quả trước đó'], ['Mục tiêu/Chỉ dẫn', 'Định hướng việc cần hoàn thành']], e: '4 thành phần của một agent.' },
    { t: 'multi', q: 'Công việc nào phù hợp để tự động hóa đầu tiên? (Chọn tất cả đáp án đúng)', o: ['Lặp lại hằng ngày', 'Có quy tắc rõ ràng', 'Tốn nhiều thời gian thủ công', 'Cần phán đoán chiến lược phức tạp mỗi lần'], a: [0, 1, 2], e: 'Việc lặp lại, có quy tắc, tốn thời gian là ứng viên tốt nhất.' },
    { t: 'fill', q: 'Nguyên tắc để con người kiểm duyệt ở các bước quan trọng trong quy trình AI gọi là ___.', o: ['Human-in-the-loop', 'Zero-trust', 'Open-source', 'Low-code'], a: 0, e: 'Con người luôn nắm quyền quyết định cuối.' },
    { t: 'case', s: 'Quy trình xử lý đơn hàng của công ty đang lộn xộn, mỗi nhân viên làm một kiểu.', q: 'Việc nên làm trước khi tự động hóa là gì?', o: ['Tự động hóa ngay cho nhanh', 'Chuẩn hóa, thống nhất các bước rồi mới tự động hóa', 'Mua thật nhiều phần mềm', 'Cho AI tự quyết định mọi thứ'], a: 1, e: 'Chuẩn hóa trước, tự động hóa sau.' },
    { t: 'tf', q: 'Zapier, Make và n8n là các công cụ giúp tạo quy trình tự động mà không cần lập trình nhiều.', a: true, e: 'Đây là các nền tảng no-code/low-code phổ biến.' },
    { t: 'single', q: 'MCP (Model Context Protocol) dùng để làm gì?', o: ['Chuẩn kết nối AI với công cụ và nguồn dữ liệu bên ngoài', 'Định dạng file hình ảnh', 'Phần mềm kế toán', 'Giao thức gửi tin nhắn SMS'], a: 0, e: 'MCP giúp AI dùng công cụ theo một chuẩn chung.' }
  ]
},
/* ------------------------------------------------------------------ 8 */
{
  id: 'm8', code: 'DATA301', icon: 'chart', c1: '#2dd4bf', c2: '#0891b2',
  title: 'Phân tích dữ liệu với AI',
  desc: 'Quy trình phân tích, AI + Excel/Sheets, trực quan hóa và tư duy phản biện với số liệu.',
  lessons: [
    { t: 'Quy trình phân tích dữ liệu', b: [
      '<b>Câu hỏi kinh doanh → Thu thập → Làm sạch → Phân tích → Insight → Hành động</b>.',
      'Bắt đầu bằng câu hỏi đúng: “Vì sao doanh thu tháng 9 giảm ở khu vực phía Bắc?” thay vì “Phân tích dữ liệu này đi”.',
      { tip: 'Insight chỉ có giá trị khi dẫn tới một hành động cụ thể. Luôn kết thúc phân tích bằng câu “Vậy chúng ta nên làm gì?”.' } ] },
    { t: 'AI + Excel/Google Sheets', b: [
      { ul: [ 'Viết và giải thích công thức: XLOOKUP, SUMIFS, COUNTIFS…', 'Làm sạch dữ liệu: dòng trùng, định dạng ngày, ô trống.', 'Gợi ý bảng tổng hợp (pivot table) và biểu đồ.', 'Nhiều trợ lý AI có thể đọc file và chạy phân tích trực tiếp.' ] },
      { prompt: 'Tôi có bảng: cột A Ngày, B Sản phẩm, C Khu vực, D Doanh thu. Viết công thức tính tổng doanh thu sản phẩm “Cà phê muối” tại khu vực “Quận 1” trong tháng 9/2026 và giải thích từng phần của công thức.' } ] },
    { t: 'Trực quan hóa dữ liệu', b: [
      { ul: [ '<b>Biểu đồ đường</b>: xu hướng theo thời gian.', '<b>Biểu đồ cột</b>: so sánh giữa các nhóm.', '<b>Biểu đồ tròn</b>: tỉ trọng của một tổng thể (ít hạng mục).', '<b>Biểu đồ phân tán</b>: mối quan hệ giữa hai biến.' ] },
      'Dashboard tốt: KPI quan trọng nhất ở trên cùng, gọn gàng, đúng nhu cầu người xem.' ] },
    { t: 'Tư duy phản biện với số liệu', b: [
      { ul: [
        '<b>Tương quan không phải nhân quả</b>: hai chỉ số cùng tăng chưa chắc cái này gây ra cái kia.',
        'Cảnh giác với giá trị ngoại lai (outlier) và mẫu quá nhỏ.',
        'AI có thể tính sai: đối chiếu tổng, kiểm tra ngẫu nhiên vài dòng.',
        'Không tải dữ liệu cá nhân của khách lên công cụ AI công cộng khi chưa được phép – hãy ẩn danh hóa.' ] },
      { tip: 'Hỏi AI: “Có những cách giải thích nào khác cho kết quả này?” để tránh kết luận vội vàng.' } ] }
  ],
  cards: [
    ['Insight', 'Phát hiện có ý nghĩa giúp ra quyết định kinh doanh.'],
    ['Làm sạch dữ liệu', 'Xử lý trùng lặp, sai định dạng, ô trống trước khi phân tích.'],
    ['SUMIFS', 'Hàm tính tổng theo nhiều điều kiện trong Excel/Sheets.'],
    ['Pivot table', 'Bảng tổng hợp giúp xoay, nhóm và tóm tắt dữ liệu nhanh.'],
    ['Biểu đồ đường', 'Thể hiện xu hướng theo thời gian.'],
    ['Dashboard', 'Bảng điều khiển trực quan hiển thị các KPI chính.'],
    ['Tương quan ≠ Nhân quả', 'Hai biến cùng thay đổi chưa chắc biến này gây ra biến kia.'],
    ['Outlier', 'Giá trị ngoại lai, khác biệt bất thường so với phần còn lại.']
  ],
  quiz: [
    { t: 'order', q: 'Sắp xếp đúng quy trình phân tích dữ liệu.', o: ['Xác định câu hỏi kinh doanh', 'Thu thập dữ liệu', 'Làm sạch dữ liệu', 'Phân tích & tìm insight', 'Ra quyết định hành động'], e: 'Luôn bắt đầu từ câu hỏi.' },
    { t: 'single', q: 'Biểu đồ phù hợp nhất để thể hiện xu hướng doanh thu 12 tháng là?', o: ['Biểu đồ đường', 'Biểu đồ tròn', 'Bản đồ nhiệt', 'Biểu đồ radar'], a: 0, e: 'Xu hướng theo thời gian → biểu đồ đường.' },
    { t: 'fill', q: 'Để tính tổng doanh thu theo nhiều điều kiện (sản phẩm, khu vực, tháng) trong Excel, ta dùng hàm ___.', o: ['SUMIFS', 'COUNT', 'CONCAT', 'TODAY'], a: 0, e: 'SUMIFS = tổng theo nhiều điều kiện.' },
    { t: 'tf', q: 'Hai chỉ số tăng cùng lúc chứng tỏ chỉ số này chắc chắn là nguyên nhân gây ra chỉ số kia.', a: false, e: 'Tương quan không phải nhân quả.' },
    { t: 'match', q: 'Ghép loại biểu đồ với mục đích sử dụng.', p: [['Biểu đồ đường', 'Xu hướng theo thời gian'], ['Biểu đồ cột', 'So sánh giữa các nhóm'], ['Biểu đồ tròn', 'Tỉ trọng của một tổng thể'], ['Biểu đồ phân tán', 'Mối quan hệ giữa hai biến']], e: 'Chọn đúng biểu đồ = kể đúng câu chuyện.' },
    { t: 'case', s: 'Bạn muốn nhờ một công cụ AI công cộng phân tích file Excel chứa họ tên, số điện thoại và lịch sử mua hàng của 5.000 khách hàng.', q: 'Cách làm đúng là gì?', o: ['Tải nguyên file lên ngay', 'Ẩn danh hóa thông tin định danh hoặc dùng công cụ được doanh nghiệp phê duyệt', 'Gửi file qua mạng xã hội cho nhanh', 'Đăng file công khai để AI dễ đọc'], a: 1, e: 'Bảo vệ dữ liệu cá nhân của khách hàng.' },
    { t: 'multi', q: 'Làm sạch dữ liệu thường bao gồm những việc nào? (Chọn tất cả đáp án đúng)', o: ['Xóa dòng trùng lặp', 'Chuẩn hóa định dạng ngày tháng', 'Xử lý ô trống', 'Tự bịa số liệu cho đẹp'], a: [0, 1, 2], e: 'Không bao giờ bịa số liệu.' },
    { t: 'single', q: '“Insight” trong phân tích dữ liệu là gì?', o: ['Phát hiện có ý nghĩa giúp ra quyết định', 'Một loại biểu đồ', 'Tên một phần mềm', 'Bảng dữ liệu thô'], a: 0, e: 'Insight dẫn tới hành động.' },
    { t: 'tf', q: 'Nên đối chiếu lại các con số quan trọng do AI tính toán trước khi báo cáo lãnh đạo.', a: true, e: 'AI có thể tính sai.' },
    { t: 'single', q: 'Một dashboard tốt nên như thế nào?', o: ['KPI quan trọng nhất ở vị trí dễ thấy, gọn gàng', 'Nhồi càng nhiều biểu đồ càng tốt', 'Dùng 20 màu sắc khác nhau', 'Không có tiêu đề'], a: 0, e: 'Đơn giản và đúng trọng tâm.' }
  ]
},
/* ------------------------------------------------------------------ 9 */
{
  id: 'm9', code: 'GOV401', icon: 'shield', c1: '#f87171', c2: '#b91c1c',
  title: 'Đạo đức, Bảo mật & Pháp lý AI',
  desc: 'Rủi ro AI, bảo vệ dữ liệu cá nhân, EU AI Act, deepfake và dùng AI có trách nhiệm.',
  lessons: [
    { t: 'Những rủi ro khi dùng AI', b: [
      { ul: [ '<b>Ảo giác</b>: thông tin sai trình bày rất thuyết phục.', '<b>Thiên kiến (bias)</b>: AI lặp lại định kiến có trong dữ liệu.', '<b>Rò rỉ dữ liệu</b>: nhập thông tin mật vào công cụ công cộng.', '<b>Bản quyền</b>: nội dung sao chép tác phẩm của người khác.', '<b>Deepfake & lừa đảo</b>: giả giọng, giả mặt để chiếm đoạt tài sản.', '<b>Phụ thuộc quá mức</b>: mất dần kỹ năng tư duy.' ] },
      { tip: 'Khi nhận cuộc gọi video “sếp” hay “người thân” yêu cầu chuyển tiền gấp, hãy xác minh qua một kênh khác trước khi làm bất cứ điều gì.' } ] },
    { t: 'Bảo vệ dữ liệu cá nhân', b: [
      'Tại Việt Nam, <b>Nghị định 13/2023/NĐ-CP</b> quy định về bảo vệ dữ liệu cá nhân và <b>Luật Bảo vệ dữ liệu cá nhân</b> có hiệu lực từ 01/01/2026.',
      { ul: [ 'Có sự đồng ý của chủ thể dữ liệu.', '<b>Thu thập tối thiểu</b>: chỉ thu thập dữ liệu thật sự cần.', 'Sử dụng đúng mục đích đã thông báo.', 'Bảo mật, phân quyền truy cập.' ] },
      'Không nhập dữ liệu nhạy cảm (CCCD, tài khoản ngân hàng, sức khỏe, bí mật kinh doanh) vào công cụ AI công cộng. Ưu tiên bản dành cho doanh nghiệp và tắt chia sẻ dữ liệu để huấn luyện khi có thể.' ] },
    { t: 'Khung quản trị AI', b: [
      '<b>EU AI Act</b> – đạo luật AI của Liên minh châu Âu – phân loại theo mức độ rủi ro:',
      { ul: [ '<b>Không chấp nhận được</b>: bị cấm (ví dụ chấm điểm tín nhiệm xã hội).', '<b>Rủi ro cao</b>: AI trong tuyển dụng, tín dụng, y tế… – yêu cầu nghiêm ngặt.', '<b>Rủi ro hạn chế</b>: chatbot – phải minh bạch là AI.', '<b>Rủi ro tối thiểu</b>: lọc thư rác, AI trong game.' ] },
      'Doanh nghiệp nên ban hành <b>chính sách sử dụng AI nội bộ</b>: công cụ được phép, dữ liệu được phép, quy trình kiểm duyệt và người chịu trách nhiệm.' ] },
    { t: 'Dùng AI có trách nhiệm', b: [
      { ul: [ '<b>Minh bạch</b>: thông báo khi khách trò chuyện với AI, gắn nhãn nội dung AI khi cần.', '<b>Công bằng</b>: rà soát thiên kiến trong tuyển dụng, cho vay.', '<b>Kiểm chứng</b>: fact-check trước khi xuất bản.', '<b>Trách nhiệm giải trình</b>: con người chịu trách nhiệm cuối cùng.', '<b>Tôn trọng bản quyền</b> và quyền hình ảnh cá nhân.' ] },
      { tip: 'Tân AI khuyên: trước khi dùng AI cho một việc, hãy tự hỏi “Nếu khách hàng biết cách mình làm, họ có thấy thoải mái không?”.' } ] }
  ],
  cards: [
    ['Bias', 'Thiên kiến – AI lặp lại định kiến có trong dữ liệu huấn luyện.'],
    ['Dữ liệu cá nhân', 'Thông tin gắn với hoặc giúp xác định một con người cụ thể.'],
    ['Dữ liệu nhạy cảm', 'Sức khỏe, tài chính, sinh trắc học, tôn giáo… cần bảo vệ đặc biệt.'],
    ['Nghị định 13/2023/NĐ-CP', 'Văn bản của Việt Nam quy định về bảo vệ dữ liệu cá nhân.'],
    ['EU AI Act', 'Đạo luật AI của EU, quản lý theo mức độ rủi ro.'],
    ['Deepfake', 'Nội dung giả mạo người thật được tạo bằng AI.'],
    ['Fact-check', 'Kiểm chứng thông tin với nguồn đáng tin cậy.'],
    ['Chính sách AI nội bộ', 'Quy định công cụ, dữ liệu, quy trình dùng AI trong tổ chức.']
  ],
  quiz: [
    { t: 'single', q: 'Văn bản nào của Việt Nam ban hành năm 2023 quy định về bảo vệ dữ liệu cá nhân?', o: ['Nghị định 13/2023/NĐ-CP', 'Luật Giao thông đường bộ', 'Nghị định về thuế bảo vệ môi trường', 'Luật Hôn nhân và gia đình'], a: 0, e: 'Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.' },
    { t: 'tf', q: 'Có thể thoải mái dán số CCCD và thông tin tài khoản ngân hàng của khách vào chatbot AI công cộng để xử lý cho nhanh.', a: false, e: 'Đây là dữ liệu cần được bảo vệ.' },
    { t: 'match', q: 'Ghép mức rủi ro theo EU AI Act với ví dụ.', p: [['Không chấp nhận được', 'Bị cấm – chấm điểm tín nhiệm xã hội'], ['Rủi ro cao', 'AI dùng trong tuyển dụng, chấm điểm tín dụng'], ['Rủi ro hạn chế', 'Chatbot phải minh bạch là AI'], ['Rủi ro tối thiểu', 'Bộ lọc thư rác, AI trong game']], e: 'Quản lý theo mức độ rủi ro.' },
    { t: 'multi', q: 'Đâu là nguyên tắc dùng AI có trách nhiệm? (Chọn tất cả đáp án đúng)', o: ['Minh bạch', 'Kiểm chứng thông tin', 'Con người chịu trách nhiệm cuối cùng', 'Giấu việc dùng AI trong mọi trường hợp'], a: [0, 1, 2], e: 'Minh bạch – kiểm chứng – trách nhiệm.' },
    { t: 'case', s: 'Hệ thống AI sàng lọc hồ sơ tuyển dụng liên tục loại các ứng viên nữ cho vị trí kỹ sư.', q: 'Đây là dấu hiệu của vấn đề gì?', o: ['Thiên kiến (bias) từ dữ liệu huấn luyện', 'AI đang hoạt động hoàn hảo', 'Lỗi kết nối Internet', 'Ứng viên nữ không phù hợp'], a: 0, e: 'Cần rà soát dữ liệu và mô hình ngay.' },
    { t: 'fill', q: 'Video hoặc giọng nói giả mạo người thật được tạo bằng AI gọi là ___.', o: ['Deepfake', 'Deep learning', 'Dark mode', 'Data lake'], a: 0, e: 'Luôn xác minh qua kênh khác.' },
    { t: 'order', q: 'Sắp xếp quy trình kiểm chứng nội dung AI trước khi xuất bản.', o: ['Đánh dấu số liệu, tên riêng, trích dẫn', 'Tra cứu nguồn gốc đáng tin cậy', 'Sửa hoặc loại bỏ thông tin sai', 'Người phụ trách duyệt và xuất bản'], e: 'Đánh dấu → Tra cứu → Sửa → Duyệt.' },
    { t: 'tf', q: 'Doanh nghiệp nên ban hành chính sách sử dụng AI nội bộ quy định công cụ và loại dữ liệu được phép dùng.', a: true, e: 'Chính sách rõ ràng giúp giảm rủi ro.' },
    { t: 'single', q: 'Nhận cuộc gọi video từ “sếp” yêu cầu chuyển tiền gấp, giọng và mặt giống hệt. Bạn nên làm gì?', o: ['Chuyển ngay', 'Xác minh qua kênh khác (gọi lại số đã biết, hỏi trực tiếp) trước', 'Gửi thêm mật khẩu', 'Đăng lên mạng hỏi ý kiến'], a: 1, e: 'Deepfake lừa đảo ngày càng tinh vi.' },
    { t: 'single', q: 'Nguyên tắc “thu thập tối thiểu” trong bảo vệ dữ liệu nghĩa là gì?', o: ['Chỉ thu thập dữ liệu thật sự cần cho mục đích đã thông báo', 'Thu thập càng nhiều càng tốt để dùng sau', 'Không bao giờ lưu dữ liệu', 'Chỉ thu thập dữ liệu của người nổi tiếng'], a: 0, e: 'Ít dữ liệu hơn = ít rủi ro hơn.' }
  ]
},
/* ------------------------------------------------------------------ 10 */
{
  id: 'm10', code: 'STR501', icon: 'rocket', c1: '#facc15', c2: '#ca8a04',
  title: 'Chiến lược ứng dụng AI cho doanh nghiệp',
  desc: 'Chọn use-case, tính ROI, lộ trình POC → Pilot → Scale và xây dựng văn hóa AI.',
  lessons: [
    { t: 'Bắt đầu từ bài toán, không phải công cụ', b: [
      'Xác định nỗi đau kinh doanh trước: chi phí cao, xử lý chậm, sai sót nhiều, thiếu nhân lực…',
      'Liệt kê các use-case rồi chấm điểm trên <b>ma trận Tác động – Khả thi</b> (Impact – Feasibility). Ưu tiên <b>“quick win”</b>: tác động cao, dễ triển khai.',
      { tip: 'Câu hỏi đầu tiên Tân AI luôn đặt ra cho doanh nghiệp: “Nếu chỉ được làm MỘT dự án AI trong 90 ngày tới, đó là gì và đo thành công bằng con số nào?”' } ] },
    { t: 'Tính toán ROI', b: [
      '<b>ROI = (Lợi ích − Chi phí) ÷ Chi phí × 100%</b>',
      { ul: [ '<b>Lợi ích</b>: giờ công tiết kiệm × chi phí nhân sự, doanh thu tăng thêm, giảm lỗi.', '<b>Chi phí</b>: bản quyền công cụ, triển khai – tích hợp, đào tạo, vận hành – bảo trì.' ] },
      'Ví dụ: tiết kiệm 120 triệu/năm, tổng chi phí 40 triệu/năm → ROI = (120 − 40) ÷ 40 = <b>200%</b>.' ] },
    { t: 'Lộ trình POC → Pilot → Scale', b: [
      { ul: [ '<b>POC</b> (Proof of Concept): thử nghiệm vài tuần để chứng minh tính khả thi.', '<b>Pilot</b>: thí điểm thực tế tại một phòng ban, đo KPI.', '<b>Scale</b>: chuẩn hóa và mở rộng toàn doanh nghiệp.' ] },
      'Mỗi giai đoạn cần tiêu chí <b>“đi tiếp hay dừng”</b> rõ ràng bằng con số.' ] },
    { t: 'Con người & văn hóa AI', b: [
      'Công nghệ chỉ là một phần. <b>Con người và quy trình</b> mới quyết định thành bại.',
      { ul: [ 'Đào tạo theo cấp: lãnh đạo (chiến lược), quản lý (quy trình), nhân viên (kỹ năng công cụ).', 'Xây dựng <b>AI Champion</b> ở mỗi phòng ban.', 'Truyền thông rõ lý do, ghi nhận thành công nhỏ, giảm nỗi sợ bị thay thế.' ] },
      { tip: 'Chúc mừng bạn đã đến học phần cuối! Hãy áp dụng ngay một điều đã học vào công việc tuần này – đó mới là chứng chỉ giá trị nhất.' } ] }
  ],
  cards: [
    ['Use-case', 'Tình huống ứng dụng AI cụ thể để giải quyết một bài toán.'],
    ['Quick win', 'Use-case tác động cao, dễ làm – nên ưu tiên trước.'],
    ['Impact – Feasibility', 'Ma trận xếp hạng use-case theo Tác động và Khả thi.'],
    ['ROI', '(Lợi ích − Chi phí) ÷ Chi phí × 100%.'],
    ['POC', 'Proof of Concept – thử nghiệm chứng minh khả thi.'],
    ['Pilot', 'Thí điểm thực tế ở quy mô nhỏ, đo KPI.'],
    ['Scale', 'Chuẩn hóa và mở rộng triển khai toàn doanh nghiệp.'],
    ['AI Champion', 'Người dẫn dắt, lan tỏa ứng dụng AI trong phòng ban.']
  ],
  quiz: [
    { t: 'single', q: 'Công thức tính ROI đúng là?', o: ['(Lợi ích − Chi phí) ÷ Chi phí × 100%', 'Chi phí ÷ Lợi ích', 'Lợi ích × Chi phí', '(Chi phí − Lợi ích) × 100'], a: 0, e: 'Return On Investment.' },
    { t: 'case', s: 'Dự án chatbot tốn 50 triệu đồng/năm và giúp tiết kiệm 150 triệu đồng chi phí nhân sự/năm.', q: 'ROI của dự án là bao nhiêu?', o: ['50%', '100%', '200%', '300%'], a: 2, e: '(150 − 50) ÷ 50 = 200%.' },
    { t: 'order', q: 'Sắp xếp đúng lộ trình triển khai AI.', o: ['POC – Thử nghiệm khái niệm', 'Pilot – Thí điểm tại một phòng ban', 'Scale – Mở rộng toàn doanh nghiệp'], e: 'POC → Pilot → Scale.' },
    { t: 'tf', q: '“Quick win” là use-case có tác động cao và dễ triển khai, nên ưu tiên làm trước.', a: true, e: 'Tạo niềm tin và đà cho các dự án sau.' },
    { t: 'match', q: 'Ghép khái niệm với ý nghĩa.', p: [['POC', 'Chứng minh giải pháp khả thi trong thời gian ngắn'], ['Pilot', 'Chạy thử thực tế quy mô nhỏ, đo KPI'], ['Scale', 'Chuẩn hóa và triển khai rộng'], ['AI Champion', 'Người dẫn dắt ứng dụng AI ở phòng ban']], e: 'Lộ trình và con người.' },
    { t: 'multi', q: 'Chi phí nào cần tính khi lập business case cho dự án AI? (Chọn tất cả đáp án đúng)', o: ['Bản quyền/thuê bao công cụ', 'Chi phí triển khai, tích hợp', 'Đào tạo nhân sự', 'Chi phí vận hành, bảo trì'], a: [0, 1, 2, 3], e: 'Tính đủ chi phí để ROI chính xác.' },
    { t: 'fill', q: 'Công cụ xếp hạng ưu tiên use-case theo hai trục Tác động và Khả thi gọi là ma trận ___.', o: ['Impact – Feasibility', 'SWOT', 'BCG', 'Eisenhower'], a: 0, e: 'Impact – Feasibility.' },
    { t: 'single', q: 'Theo bài học, yếu tố quyết định thành bại lớn nhất khi chuyển đổi AI là gì?', o: ['Con người và quy trình', 'Mua công cụ đắt nhất', 'Số lượng máy chủ', 'Màu sắc giao diện phần mềm'], a: 0, e: 'Công nghệ chỉ là một phần.' },
    { t: 'tf', q: 'Doanh nghiệp nên chọn công cụ AI trước rồi mới đi tìm bài toán để áp dụng.', a: false, e: 'Bắt đầu từ bài toán kinh doanh.' },
    { t: 'case', s: 'Nhân viên lo lắng AI sẽ khiến họ mất việc nên ngại sử dụng.', q: 'Cách tiếp cận phù hợp của lãnh đạo là gì?', o: ['Phớt lờ và bắt buộc sử dụng', 'Truyền thông rõ mục tiêu, đào tạo kỹ năng và ghi nhận thành công nhỏ', 'Cấm nhân viên dùng AI', 'Giữ bí mật kế hoạch'], a: 1, e: 'Quản trị thay đổi bằng sự minh bạch và đào tạo.' }
  ]
}
  ]
};
