/**
 * RECOMMENDED ACTION TEMPLATES
 * Rule-based, evidence-referencing and deliberately non-causal ("Xem xét", "Kiểm tra", "Rà soát").
 */
import type { L10n } from '@/types/core'

const R = (vi: string, en: string): L10n => ({ vi, en })

export const RECOMMENDATIONS: Record<string, L10n> = {
  investigate_decline: R('Kiểm tra biến động theo sản phẩm, khách hàng, khu vực và nhân viên kinh doanh để xác định nhóm đóng góp chính vào mức giảm.', 'Investigate movements by product, customer, region and salesperson to identify which groups drive the decline.'),
  review_segment: R('Kiểm tra biến động doanh số theo sản phẩm, khách hàng và nhân viên kinh doanh tại {dim} này.', 'Review sales movements by product, customer and salesperson within this {dim}.'),
  scale_winner: R('Xem xét nhân rộng các yếu tố đang giúp {dim} này tăng trưởng (sản phẩm, kênh, đội ngũ) sang các nhóm khác.', 'Consider replicating what is driving growth in this {dim} (products, channels, team) to other groups.'),
  diversify_customers: R('Đánh giá kế hoạch đa dạng hóa khách hàng để giảm phụ thuộc vào một nguồn doanh thu.', 'Evaluate a customer diversification plan to reduce dependence on a single revenue source.'),
  protect_key_accounts: R('Rà soát kế hoạch chăm sóc và hợp đồng của các khách hàng trọng yếu để giảm rủi ro mất doanh thu.', 'Review account plans and contracts for key customers to reduce revenue-loss risk.'),
  review_portfolio: R('Rà soát danh mục sản phẩm: tập trung nguồn lực cho nhóm chủ lực, đánh giá lại nhóm đóng góp thấp.', 'Review the product portfolio: focus resources on core items and reassess low contributors.'),
  decompose_margin: R('Phân rã Doanh thu, Giá, Sản lượng và Chi phí để xác định nguồn gây giảm biên lợi nhuận.', 'Decompose revenue, price, volume and cost to locate the source of margin decline.'),
  review_costs: R('Rà soát các khoản chi phí tăng nhanh nhất và đối chiếu với kế hoạch / hợp đồng nhà cung cấp.', 'Review the fastest-growing cost items and compare them against plans and supplier contracts.'),
  review_pricing: R('Xem xét lại chính sách giá và chiết khấu để cân bằng giữa sản lượng và biên lợi nhuận.', 'Consider revisiting pricing and discount policies to balance volume and margin.'),
  monitor_trend: R('Theo dõi chỉ số này trong các kỳ tiếp theo trước khi đưa ra điều chỉnh lớn.', 'Monitor this metric over the next periods before making major adjustments.'),
  smooth_volatility: R('Xem xét nguyên nhân biến động theo mùa vụ, chiến dịch hoặc đơn hàng lớn để cải thiện dự báo.', 'Check whether seasonality, campaigns or large orders explain volatility, to improve planning.'),
  sustain_growth: R('Xác định các yếu tố đang thúc đẩy tăng trưởng và đánh giá khả năng duy trì nguồn lực cho chúng.', 'Identify the drivers of growth and evaluate whether resources behind them can be sustained.'),
  close_target_gap: R('Xem xét kế hoạch hành động theo từng nhóm (khu vực, nhân viên, sản phẩm) để thu hẹp khoảng cách với mục tiêu.', 'Consider a gap-closing action plan by group (region, salesperson, product).'),
  review_targets: R('Đánh giá lại mức mục tiêu hiện tại so với năng lực thực tế và xu hướng thị trường.', 'Reassess current targets against actual capacity and market trends.'),
  budget_control: R('Rà soát các khoản mục vượt ngân sách lớn nhất và quy trình phê duyệt chi.', 'Review the largest over-budget line items and the spending approval process.'),
  budget_reallocate: R('Xem xét phân bổ lại ngân sách chưa sử dụng cho các hạng mục hiệu quả hơn.', 'Consider reallocating unused budget to higher-return items.'),
  reduce_returns: R('Kiểm tra nguyên nhân hoàn trả theo sản phẩm và kênh bán để giảm tỷ lệ hoàn trả.', 'Investigate return reasons by product and channel to reduce returns.'),
  reduce_cancellations: R('Rà soát quy trình xác nhận đơn và giao hàng tại các nhóm có tỷ lệ hủy cao.', 'Review order confirmation and delivery processes where cancellation is high.'),
  upsell: R('Xem xét chương trình bán kèm / gói sản phẩm để cải thiện giá trị đơn trung bình.', 'Consider cross-sell / bundling programmes to lift average order value.'),
  retention: R('Kiểm tra tỷ lệ quay lại của khách hàng và các chương trình giữ chân khách hàng.', 'Check customer return rates and retention programmes.'),
  sales_coaching: R('Xem xét chia sẻ phương pháp của nhân viên dẫn đầu và giảm phụ thuộc bằng phân bổ khách hàng hợp lý.', 'Consider sharing top-performer practices and balancing account allocation to reduce dependence.'),
  quality_rootcause: R('Phân tích lỗi theo dây chuyền, máy, ca và sản phẩm để khoanh vùng nguồn phát sinh lỗi.', 'Analyse defects by line, machine, shift and product to isolate where they originate.'),
  maintenance: R('Rà soát kế hoạch bảo trì phòng ngừa cho các máy / dây chuyền có thời gian dừng cao.', 'Review preventive maintenance for machines / lines with high downtime.'),
  capacity_plan: R('Kiểm tra năng lực, nhân công và nguyên vật liệu tại các ca / dây chuyền chưa đạt kế hoạch.', 'Check capacity, labour and materials at shifts / lines below plan.'),
  replenish: R('Kiểm tra mức tồn tối thiểu và chu kỳ đặt hàng cho các mặt hàng hết hàng.', 'Check minimum stock levels and reorder cycles for out-of-stock items.'),
  reduce_stock: R('Xem xét giảm tồn kho chậm luân chuyển để giải phóng vốn lưu động.', 'Consider reducing slow-moving stock to free working capital.'),
  optimize_channels: R('Xem xét dịch chuyển ngân sách sang kênh / chiến dịch có ROAS và CPL tốt hơn.', 'Consider shifting budget towards channels / campaigns with better ROAS and CPL.'),
  creative_test: R('Kiểm tra nội dung quảng cáo, nhắm chọn và trang đích để cải thiện tỷ lệ nhấp và chuyển đổi.', 'Test ad creative, targeting and landing pages to improve click-through and conversion.'),
  lead_followup: R('Rà soát quy trình tiếp nhận và chăm sóc lead (tốc độ phản hồi, phân loại) để cải thiện chuyển đổi.', 'Review lead handling (response speed, qualification) to improve conversion.'),
  attendance_review: R('Kiểm tra vắng mặt theo phòng ban và thời điểm để phát hiện điểm nóng cần hỗ trợ.', 'Check absence by department and period to spot hotspots needing support.'),
  performance_program: R('Xem xét chương trình đào tạo / kèm cặp cho nhóm có điểm hiệu suất thấp.', 'Consider training or coaching for groups with low performance scores.'),
  payroll_review: R('Rà soát cơ cấu quỹ lương so với đóng góp của từng phòng ban.', 'Review payroll structure against each department\'s contribution.'),
  service_capacity: R('Kiểm tra năng lực xử lý theo ca / kênh để giảm thời gian phản hồi.', 'Check handling capacity by shift / channel to reduce response time.'),
  service_quality: R('Phân tích phản hồi của khách hàng theo kênh và nhân viên để cải thiện mức hài lòng.', 'Analyse customer feedback by channel and agent to improve satisfaction.'),
  process_review: R('Rà soát quy trình tại các bước có tỷ lệ trễ / chưa hoàn thành cao.', 'Review process steps with high late / incomplete rates.'),
  data_cleanup: R('Bổ sung dữ liệu thiếu và chuẩn hóa định dạng trước khi dùng kết quả cho quyết định quan trọng.', 'Fill missing data and standardise formats before using results for key decisions.'),
  check_anomalies: R('Kiểm tra các điểm bất thường trong mục Anomalies để xác nhận đó là sự kiện thật hay lỗi nhập liệu.', 'Review the flagged anomalies to confirm whether they are real events or data-entry issues.'),
  cost_benchmark: R('So sánh tỷ lệ chi phí với các kỳ tốt nhất để đặt mục tiêu tối ưu chi phí thực tế.', 'Benchmark the cost ratio against your best periods to set realistic cost-optimisation goals.'),
  focus_tail: R('Xem xét gom nhóm / tối ưu chi phí phục vụ cho nhóm đóng góp thấp thay vì dàn trải nguồn lực.', 'Consider grouping low contributors or reducing cost-to-serve rather than spreading resources thin.'),
}

export function recommendationCount(): number {
  return Object.keys(RECOMMENDATIONS).length
}
