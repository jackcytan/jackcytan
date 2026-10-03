/* Bản Đồ Kiếm Tiền — dữ liệu (phần 4) — © Tân AI */
M.push(
/* ===================== THU NHẬP THỤ ĐỘNG ===================== */
{id:"thuexe",c:"thudong",n:"Cho thuê xe ô tô / xe máy",i:"🚗",d:"Cho thuê xe tự lái, cho công ty thuê xe, hoặc đưa xe vào hợp tác xã/nền tảng cho thuê.",v:3,k:2,r:3,t:"1–2 tháng",inc:"5–25 triệu/xe/tháng",m:"off",p:1,s:["finance","care"],
 st:["Chọn xe phổ thông, tiết kiệm nhiên liệu, dễ thuê","Đăng trên nền tảng cho thuê xe hoặc ký hợp đồng với doanh nghiệp","Mua bảo hiểm đầy đủ, hợp đồng chặt chẽ, định vị GPS","Bảo dưỡng định kỳ, giữ xe sạch đẹp"],
 pro:["Thu nhập đều","Tài sản hữu hình","Có thể mở rộng đội xe"],con:["Xe mất giá theo năm","Rủi ro tai nạn, hư hỏng","Thủ tục giấy tờ"],
 tip:"Tính kỹ khấu hao: lợi nhuận thật = tiền thuê – (khấu hao + bảo hiểm + bảo dưỡng + lãi vay)."},
{id:"maytudong",c:"thudong",n:"Máy bán hàng tự động / Giặt sấy tự động",i:"🥤",d:"Đặt máy bán nước, máy gắp thú, tủ đồ thông minh, tiệm giặt sấy tự phục vụ — vận hành gần như không cần người.",v:3,k:2,r:3,t:"1–3 tháng",inc:"3–20 triệu/máy/tháng",m:"off",p:1,s:["finance"],
 st:["Tìm vị trí đông người: trường học, bệnh viện, khu công nghiệp, ký túc xá","Đàm phán chia sẻ doanh thu hoặc thuê mặt bằng","Lắp máy có thanh toán QR, theo dõi từ xa","Bổ sung hàng, bảo trì định kỳ"],
 pro:["Vận hành ít công","Hoạt động 24/7","Dễ nhân rộng"],con:["Vị trí quyết định tất cả","Hư hỏng, phá hoại","Vốn đầu tư máy"],
 tip:"Bắt đầu với 1 máy để học dữ liệu bán hàng, sau đó mới mở rộng sang vị trí có lưu lượng tương tự."},
{id:"stock",c:"thudong",n:"Bán ảnh / Video / Nhạc stock",i:"🖼️",d:"Đưa ảnh, video, nhạc, icon lên Shutterstock, Adobe Stock, Pond5… nhận tiền mỗi lần có người tải.",v:1,k:2,r:1,t:"6–12 tháng",inc:"Vài chục – vài trăm USD/tháng (tăng dần)",m:"on",p:1,s:["creative"],
 st:["Nghiên cứu chủ đề người mua cần (kinh doanh, con người Việt Nam, ẩm thực, du lịch)","Chụp/quay chất lượng cao, đầy đủ giấy phép người mẫu","Gắn từ khóa chuẩn, đăng số lượng lớn","Đăng đều mỗi tuần để tích lũy kho"],
 pro:["Thu nhập thụ động lâu dài","Bán toàn cầu","Tận dụng ảnh có sẵn"],con:["Giá mỗi lượt tải thấp","Cần số lượng lớn","Cạnh tranh với ảnh AI"],
 tip:"Ảnh về con người, văn hóa, đời sống Việt Nam chân thực đang thiếu và được tìm kiếm nhiều."},
{id:"banquyen",c:"thudong",n:"Bản quyền: Âm nhạc, Sách, Phát minh",i:"©️",d:"Tạo tài sản trí tuệ một lần và nhận tiền bản quyền (royalty) mỗi khi được sử dụng, phát hành, cấp phép.",v:0,k:4,r:2,t:"1–3 năm",inc:"Có thể kéo dài hàng chục năm",m:"mix",p:1,s:["creative","tech"],
 st:["Sáng tác nhạc, viết sách, thiết kế, phát minh sản phẩm","Đăng ký bản quyền/sở hữu trí tuệ","Phát hành qua nhà phân phối âm nhạc số, nhà xuất bản","Cấp phép cho doanh nghiệp sử dụng"],
 pro:["Thu nhập thụ động thật sự","Tài sản để lại cho con cháu","Không giới hạn"],con:["Khó tạo tác phẩm ăn khách","Bị sao chép, vi phạm","Thu nhập khó đoán"],
 tip:"Nhạc nền không lời (cho video, quán cà phê, quảng cáo) là thị trường cấp phép ổn định ít người để ý."},
{id:"thuedo",c:"thudong",n:"Cho thuê đồ dùng",i:"🎒",d:"Cho thuê máy ảnh, đồ cắm trại, váy cưới, trang phục, đồ chơi trẻ em, thiết bị sự kiện…",v:2,k:2,r:2,t:"1–2 tháng",inc:"3–30 triệu/tháng",m:"off",p:1,s:["sales","care"],
 st:["Chọn món đồ đắt tiền nhưng ít khi dùng","Định giá thuê theo ngày, đặt cọc an toàn","Đăng trên mạng xã hội, hội nhóm chuyên ngành","Vệ sinh, bảo trì sau mỗi lần thuê"],
 pro:["Món đồ tự hoàn vốn nhiều lần","Tận dụng đồ sẵn có","Vốn linh hoạt"],con:["Hư hỏng, mất mát","Cần quản lý lịch","Thị trường ngách"],
 tip:"Một bộ lều cắm trại cao cấp cho thuê 20 lần đã thu hồi vốn, phần còn lại là lợi nhuận."},
{id:"tenmien",c:"thudong",n:"Mua bán tên miền & Website",i:"🔤",d:"Mua tên miền đẹp hoặc website đang có thu nhập, phát triển thêm rồi bán lại với giá cao hơn.",v:2,k:4,r:3,t:"6–36 tháng",inc:"Lợi nhuận theo thương vụ",m:"on",p:1,s:["tech","finance"],
 st:["Học cách định giá tên miền và website (thường 24–40 lần lợi nhuận tháng)","Mua trên các sàn chuyển nhượng website uy tín","Tối ưu nội dung, SEO, chuyển đổi để tăng thu nhập","Bán lại khi giá trị đã tăng"],
 pro:["Tài sản số có thể sinh lời","Không giới hạn địa lý","Có thể vừa nhận thu nhập vừa chờ bán"],con:["Rủi ro bị lừa khi mua","Thuật toán thay đổi","Cần kiến thức sâu"],
 tip:"Luôn dùng dịch vụ trung gian (escrow) khi mua bán website, kiểm tra kỹ số liệu traffic và doanh thu thật."},
{id:"phongtrong",c:"thudong",n:"Cho thuê phòng trống / Chỗ đậu xe / Kho",i:"🔑",d:"Tận dụng tài sản sẵn có: phòng trống, sân, gara, tầng trệt, nóc nhà (đặt biển quảng cáo, điện mặt trời).",v:0,k:1,r:1,t:"Vài tuần",inc:"1–15 triệu/tháng",m:"off",p:1,s:["care"],
 st:["Liệt kê không gian, tài sản đang bỏ trống","Kiểm tra quy định và thỏa thuận với gia đình/ban quản lý","Đăng cho thuê trên các nền tảng, hội nhóm khu vực","Lập hợp đồng rõ ràng"],
 pro:["Không cần vốn mới","Gần như thụ động","Tận dụng tài sản"],con:["Giảm không gian riêng tư","Rủi ro người thuê","Thu nhập nhỏ"],
 tip:"Lắp điện mặt trời áp mái vừa giảm tiền điện vừa có thể bán điện dư — tùy chính sách địa phương."},
{id:"muadn",c:"thudong",n:"Mua lại doanh nghiệp nhỏ",i:"🏛️",d:"Mua lại một doanh nghiệp đang có lãi (tiệm, công ty nhỏ) từ chủ cũ muốn nghỉ, thuê quản lý vận hành.",v:4,k:5,r:3,t:"Ngay khi tiếp quản",inc:"Lợi nhuận doanh nghiệp",m:"off",p:1,s:["finance","sales"],
 st:["Tìm doanh nghiệp có lịch sử lợi nhuận ổn định 3+ năm","Thẩm định kỹ: sổ sách, khách hàng, nhân sự, pháp lý","Đàm phán giá (thường 2–5 lần lợi nhuận năm) và thời gian chuyển giao","Giữ đội ngũ cũ, cải tiến dần, thuê quản lý"],
 pro:["Có dòng tiền ngay","Tránh rủi ro khởi nghiệp từ 0","Có thể tăng giá trị"],con:["Vốn lớn","Rủi ro thông tin bất cân xứng","Cần năng lực quản lý"],
 tip:"Nhiều chủ doanh nghiệp lớn tuổi không có người kế nghiệp — đây là cơ hội ít người để ý."},

/* ===================== SỰ NGHIỆP ===================== */
{id:"tangluong",c:"sunghiep",n:"Thăng tiến & Đàm phán tăng lương",i:"📈",d:"Cách nhanh nhất để tăng thu nhập cho đa số người: nâng giá trị bản thân trong công việc hiện tại và đàm phán đúng lúc.",v:0,k:2,r:1,t:"3–12 tháng",inc:"Tăng 10–50% thu nhập",m:"off",p:0,s:["sales","teach"],
 st:["Hiểu rõ mức lương thị trường cho vị trí của bạn","Ghi lại thành tích đo lường được (doanh thu, tiết kiệm, cải tiến)","Nhận việc khó, giải quyết vấn đề sếp quan tâm nhất","Đàm phán vào thời điểm đánh giá hiệu suất, với dữ liệu cụ thể","Sẵn sàng chuyển việc nếu giá trị không được ghi nhận"],
 pro:["Không vốn, không rủi ro","Tác động lũy kế cả sự nghiệp","Tăng kỹ năng"],con:["Phụ thuộc tổ chức","Cần thời gian chứng minh","Có giới hạn trần"],
 tip:"Chuyển việc đúng thời điểm thường giúp tăng lương 20–40%, nhiều hơn so với tăng lương nội bộ hằng năm."},
{id:"nghekythuat",c:"sunghiep",n:"Nghề kỹ thuật tay nghề cao",i:"⚙️",d:"Thợ hàn, điện công nghiệp, vận hành CNC, cơ khí chính xác, sửa chữa ô tô điện… luôn thiếu người giỏi.",v:1,k:3,r:1,t:"6–24 tháng học nghề",inc:"12–50 triệu/tháng",m:"off",p:0,s:["hand","tech"],
 st:["Học tại trường nghề, trung tâm đào tạo có chứng chỉ","Thực tập tại nhà máy, doanh nghiệp","Nâng cấp chứng chỉ quốc tế để làm việc ở nước ngoài","Có thể mở xưởng dịch vụ riêng"],
 pro:["Thiếu nhân lực, dễ có việc","Khó bị AI thay thế","Cơ hội đi nước ngoài"],con:["Môi trường vất vả","Rủi ro an toàn lao động","Cần học bài bản"],
 tip:"Kỹ thuật viên xe điện, năng lượng mặt trời, tự động hóa là các nghề tay nghề có tương lai sáng nhất."},
{id:"remote",c:"sunghiep",n:"Làm remote cho công ty nước ngoài",i:"🌏",d:"Làm việc từ xa toàn thời gian cho công ty quốc tế, nhận lương bằng ngoại tệ cao hơn mặt bằng trong nước.",v:0,k:4,r:1,t:"3–12 tháng",inc:"1.000 – 6.000+ USD/tháng",m:"on",p:0,s:["tech","creative","sales"],
 st:["Nâng tiếng Anh lên mức làm việc thành thạo","Có kỹ năng chuyên môn được cần (lập trình, thiết kế, marketing, hỗ trợ khách hàng)","Tối ưu hồ sơ LinkedIn, portfolio","Ứng tuyển trên các trang việc làm remote quốc tế","Chuẩn bị phỏng vấn trực tuyến và bài test"],
 pro:["Thu nhập cao","Làm tại nhà","Môi trường quốc tế"],con:["Lệch múi giờ","Cạnh tranh toàn cầu","Thuế, hợp đồng phức tạp"],
 tip:"Tiếng Anh là đòn bẩy thu nhập lớn nhất với người Việt — cùng một kỹ năng, lương remote có thể gấp 2–4 lần."},
{id:"xkld",c:"sunghiep",n:"Làm việc ở nước ngoài (chính ngạch)",i:"🛫",d:"Đi làm việc tại Nhật, Hàn, Đài Loan, Đức, Úc… qua chương trình chính thức để tích lũy vốn và kỹ năng.",v:2,k:3,r:3,t:"6–12 tháng chuẩn bị",inc:"25–60 triệu/tháng",m:"off",p:0,s:["hand","care"],
 st:["Tìm hiểu chương trình chính thức do cơ quan nhà nước quản lý","Chỉ chọn doanh nghiệp được cấp phép, kiểm tra giấy phép công khai","Học ngoại ngữ và tay nghề theo yêu cầu","Lập kế hoạch tài chính: tích lũy, gửi về, đầu tư khi về nước"],
 pro:["Thu nhập cao","Học kỹ năng, kỷ luật","Tích lũy vốn khởi nghiệp"],con:["Xa gia đình","Rủi ro lừa đảo môi giới","Chi phí ban đầu"],
 tip:"Cảnh giác các “cò” thu phí cao, hứa hẹn việc nhẹ lương cao — luôn xác minh doanh nghiệp được cấp phép."},
{id:"salesb2b",c:"sunghiep",n:"Sales B2B / Bán hàng hưởng hoa hồng",i:"💼",d:"Bán sản phẩm, dịch vụ giá trị cao cho doanh nghiệp (phần mềm, thiết bị, logistics, quảng cáo) với hoa hồng hấp dẫn.",v:0,k:3,r:2,t:"3–6 tháng",inc:"15–100+ triệu/tháng",m:"mix",p:0,s:["sales"],
 st:["Chọn ngành có giá trị hợp đồng lớn và sản phẩm tốt","Học quy trình bán hàng tư vấn: khám phá nhu cầu, demo, đàm phán","Xây mạng lưới trên LinkedIn, hội doanh nghiệp","Theo dõi phễu bán hàng bằng CRM"],
 pro:["Thu nhập không giới hạn","Kỹ năng quý nhất trong kinh doanh","Mối quan hệ chất lượng"],con:["Áp lực chỉ tiêu","Thu nhập biến động","Chu kỳ bán dài"],
 tip:"Kỹ năng bán hàng là “siêu năng lực” — mọi founder thành công đều phải bán được ý tưởng, sản phẩm và tầm nhìn."},
{id:"tuvantc",c:"sunghiep",n:"Tư vấn tài chính / Bảo hiểm",i:"☂️",d:"Tư vấn kế hoạch tài chính, bảo hiểm, đầu tư cho cá nhân và gia đình, hưởng hoa hồng và phí tư vấn.",v:0,k:3,r:2,t:"3–6 tháng",inc:"10–100 triệu/tháng",m:"off",p:0,s:["sales","finance","care"],
 st:["Lấy chứng chỉ hành nghề theo quy định","Gia nhập công ty uy tín để được đào tạo","Tư vấn trung thực, đúng nhu cầu khách hàng","Chăm sóc khách lâu dài để có giới thiệu"],
 pro:["Thu nhập cao, có hoa hồng tái tục","Giúp người khác an toàn tài chính","Không vốn"],con:["Định kiến xã hội","Áp lực doanh số","Cần đạo đức nghề nghiệp cao"],
 tip:"Tư vấn đúng sản phẩm khách thật sự cần — uy tín sẽ biến một khách hàng thành cả mạng lưới giới thiệu."},
{id:"parttime",c:"sunghiep",n:"Việc làm thêm / Bán thời gian",i:"⏰",d:"Phục vụ, thu ngân, PG/PB sự kiện, khảo sát thị trường, trực tổng đài, nhập liệu… phù hợp sinh viên và người cần thêm thu nhập.",v:0,k:1,r:1,t:"Ngay lập tức",inc:"20–50k/giờ",m:"off",p:0,s:["care","sales"],
 st:["Xác định khung giờ rảnh cố định","Tìm việc qua trang tuyển dụng uy tín, hội nhóm trường","Chọn việc giúp bạn học kỹ năng (bán hàng, giao tiếp)","Tiết kiệm và đầu tư một phần thu nhập"],
 pro:["Bắt đầu ngay","Học kỹ năng xã hội","Linh hoạt"],con:["Thu nhập thấp","Mệt mỏi nếu làm quá sức","Ít cơ hội thăng tiến"],
 tip:"Tuyệt đối tránh công việc yêu cầu đóng phí, nạp tiền, “nhận nhiệm vụ” — đó là lừa đảo."}
);

/* ===================== LỊCH SỬ ===================== */
const HISTORY=[
 {y:"~10.000 TCN",t:"Trao đổi hàng hóa (Barter)",d:"Con người đổi lúa lấy thịt, rìu đá lấy da thú. Chưa có tiền — giá trị nằm ở thứ người khác cần.",l:"Bài học: giá trị = giải quyết nhu cầu của người khác."},
 {y:"~3.000 TCN",t:"Nông nghiệp & Tín dụng Lưỡng Hà",d:"Đền thờ Sumer ghi nợ trên bảng đất sét, cho vay lúa mạch có lãi. Đất đai và lương thực trở thành tài sản.",l:"Bài học: ai sở hữu tài sản sinh lợi sẽ giàu lên."},
 {y:"~600 TCN",t:"Đồng xu đầu tiên ở Lydia",d:"Đồng xu hợp kim vàng – bạc ra đời, thương mại bùng nổ vì việc trao đổi trở nên dễ dàng.",l:"Bài học: công cụ mới mở ra cách kiếm tiền mới."},
 {y:"~130 TCN",t:"Con đường Tơ lụa",d:"Thương nhân đưa lụa, gia vị, trà từ Đông sang Tây. Mua nơi rẻ – bán nơi khan hiếm.",l:"Bài học: chênh lệch thông tin và địa lý tạo ra lợi nhuận."},
 {y:"Thế kỷ 11–15",t:"Phường hội & Ngân hàng",d:"Phường thủ công ở châu Âu và phố phường Thăng Long phát triển. Gia tộc Medici xây dựng ngân hàng hiện đại.",l:"Bài học: tay nghề giỏi và chữ tín là tài sản."},
 {y:"1602",t:"Cổ phiếu đầu tiên",d:"Công ty Đông Ấn Hà Lan phát hành cổ phiếu, sàn Amsterdam ra đời. Người thường có thể sở hữu một phần doanh nghiệp.",l:"Bài học: sở hữu doanh nghiệp là con đường làm giàu bền vững."},
 {y:"1760–1900",t:"Cách mạng Công nghiệp",d:"Máy hơi nước, nhà máy, đường sắt. Lao động làm công ăn lương trở nên phổ biến; nhà tư bản sở hữu máy móc.",l:"Bài học: đòn bẩy (máy móc, vốn) nhân năng suất lên nhiều lần."},
 {y:"1955",t:"Nhượng quyền & Bán lẻ đại chúng",d:"Mô hình nhượng quyền thương hiệu bùng nổ, chuỗi cửa hàng phủ khắp thế giới.",l:"Bài học: hệ thống hóa để nhân bản thành công."},
 {y:"1986",t:"Đổi Mới tại Việt Nam",d:"Kinh tế tư nhân được khuyến khích, hàng triệu hộ kinh doanh và doanh nghiệp ra đời.",l:"Bài học: thời điểm và chính sách mở ra làn sóng cơ hội."},
 {y:"1995–2000",t:"Kỷ nguyên Internet",d:"Thương mại điện tử, website, email ra đời. Năm 2000, sàn chứng khoán TP.HCM chính thức hoạt động.",l:"Bài học: người đến sớm với công nghệ mới thường thắng lớn."},
 {y:"2005–2012",t:"Kinh tế sáng tạo & Chia sẻ",d:"YouTube, mạng xã hội, smartphone, xe công nghệ, cho thuê nhà ngắn ngày. Ai cũng có thể là nhà xuất bản.",l:"Bài học: sự chú ý là tài sản mới."},
 {y:"2009",t:"Tài sản số",d:"Bitcoin ra đời, mở ra lĩnh vực blockchain — đi kèm cả cơ hội lẫn rủi ro và lừa đảo.",l:"Bài học: công nghệ mới luôn kèm rủi ro mới."},
 {y:"2018–2022",t:"Video ngắn & Livestream bán hàng",d:"TikTok, Reels, livestream thương mại. Một chiếc điện thoại có thể tạo ra doanh nghiệp triệu đô.",l:"Bài học: rào cản gia nhập thấp — cạnh tranh bằng sự khác biệt."},
 {y:"2023 → nay",t:"Kỷ nguyên AI",d:"AI tạo sinh thay đổi cách làm việc: một người với AI làm được việc của cả đội. Cơ hội cho người biết ứng dụng.",l:"Bài học: AI không thay bạn, người dùng AI giỏi sẽ thay bạn."}
];

/* ===================== LỪA ĐẢO ===================== */
const SCAMS=[
 {i:"🎣",t:"“Việc nhẹ lương cao” / Làm nhiệm vụ",d:"Like video, đánh giá sản phẩm, “chốt đơn ảo” nhận hoa hồng — ban đầu trả tiền nhỏ, sau đó yêu cầu nạp tiền lớn để “rút”.",s:"Dấu hiệu: yêu cầu bạn nạp tiền để được nhận tiền."},
 {i:"🔺",t:"Đa cấp biến tướng / Ponzi",d:"Lợi nhuận đến chủ yếu từ việc tuyển người mới, không từ sản phẩm thật. Lấy tiền người sau trả người trước.",s:"Dấu hiệu: “kéo càng nhiều người càng giàu”."},
 {i:"📉",t:"Sàn đầu tư, Forex, Crypto không phép",d:"Sàn ảo do kẻ gian điều khiển giá, cho rút ít lúc đầu, sau đó khóa tài khoản khi bạn nạp nhiều.",s:"Dấu hiệu: cam kết lãi cố định 1–5%/ngày."},
 {i:"🎓",t:"Khóa học “làm giàu siêu tốc”",d:"Bán khóa học giá cao với lời hứa thu nhập trăm triệu sau vài tuần, khoe xe sang, ảnh chuyển khoản.",s:"Dấu hiệu: bán giấc mơ thay vì kỹ năng."},
 {i:"📞",t:"Giả danh cơ quan, ngân hàng, người quen",d:"Gọi điện, nhắn tin giả mạo yêu cầu chuyển tiền, cung cấp mã OTP, cài ứng dụng lạ.",s:"Dấu hiệu: tạo áp lực khẩn cấp, yêu cầu bí mật."},
 {i:"💳",t:"Tuyển CTV đặt cọc / Mua hàng trước",d:"Tuyển cộng tác viên bán hàng hoặc gia công tại nhà nhưng yêu cầu đặt cọc, mua bộ nguyên liệu, phí hồ sơ.",s:"Dấu hiệu: phải trả tiền để được đi làm."}
];
const FLAGS=["Cam kết lợi nhuận cao, cố định, “không rủi ro”","Yêu cầu nạp tiền / đặt cọc trước để nhận thu nhập","Thu nhập chủ yếu đến từ việc kéo thêm người mới","Thúc ép quyết định gấp: “chỉ còn hôm nay”, “suất cuối”","Không có pháp nhân rõ ràng, không giấy phép kinh doanh","Khoe tiền, xe, chuyển khoản thay vì giải thích mô hình kinh doanh","Yêu cầu mã OTP, mật khẩu, cài ứng dụng lạ","Rút tiền khó khăn, liên tục phát sinh “phí”"];

const PRINCIPLES=[
 {n:"01",t:"Trả cho mình trước",d:"Trích ít nhất 10–20% thu nhập để tiết kiệm & đầu tư ngay khi nhận lương, trước khi chi tiêu."},
 {n:"02",t:"Quỹ dự phòng 3–6 tháng",d:"Một tấm đệm an toàn giúp bạn không phải bán tháo tài sản hay vay nóng khi biến cố."},
 {n:"03",t:"Lãi kép là kỳ quan",d:"Thời gian quan trọng hơn số tiền. Bắt đầu sớm 10 năm có thể gấp đôi tài sản lúc về hưu."},
 {n:"04",t:"Đa dạng nguồn thu",d:"Người giàu trung bình có nhiều nguồn thu nhập. Đừng phụ thuộc hoàn toàn vào một nguồn."},
 {n:"05",t:"Đầu tư vào bản thân",d:"Kỹ năng là tài sản không ai lấy được và có lợi suất cao nhất trong những năm đầu sự nghiệp."},
 {n:"06",t:"Hiểu rõ trước khi xuống tiền",d:"Không đầu tư vào thứ bạn không thể giải thích cho người khác trong 2 phút."},
 {n:"07",t:"Tránh nợ tiêu dùng",d:"Lãi thẻ tín dụng, vay tiêu dùng 20–40%/năm là kẻ thù số một của sự giàu có."},
 {n:"08",t:"Kiên nhẫn & kỷ luật",d:"Giàu nhanh thường nghèo nhanh. Đa số tài sản lớn được xây dựng trong 10–20 năm."}
];
