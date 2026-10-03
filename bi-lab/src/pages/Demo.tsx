import { BarChart3, Briefcase, Factory, Landmark, Megaphone, PlayCircle, ShoppingBag, Truck, Users } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { Badge, Card, PageHeader } from '@/components/ui/primitives'
import { DEMOS, type DemoId } from '@/demo/generator'
import { loadDemo } from '@/app/actions'
import { fmtNumber } from '@/lib/format'

const ICONS: Record<DemoId, typeof Briefcase> = { executive: Briefcase, sales: BarChart3, retail: ShoppingBag, finance: Landmark, hr: Users, manufacturing: Factory, operations: Truck, marketing: Megaphone }

export default function Demo() {
  const { tr, lang } = useT()
  return (
    <div>
      <PageHeader
        eyebrow="Demo Center"
        icon={PlayCircle}
        title={tr('Dữ liệu demo theo ngành', 'Industry demo datasets')}
        subtitle={tr('Dữ liệu được tạo ngay trong trình duyệt bằng bộ sinh có seed cố định — mỗi lần demo cho cùng kết quả. Đi qua đúng quy trình như file thật: phân tích cú pháp → nhận diện → KPI → insight.', 'Generated in your browser by a fixed-seed generator — identical results every time. Runs through the same pipeline as real files: parsing → detection → KPIs → insights.')}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DEMOS.map((d) => {
          const I = ICONS[d.id]
          return (
            <button key={d.id} onClick={() => loadDemo(d.id)} className="card card-hover group flex flex-col p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><I size={20} /></span>
                <PlayCircle size={20} className="text-subtle transition-colors group-hover:text-accent" />
              </div>
              <div className="mt-4 text-[16px] font-semibold">{d.name[lang]}</div>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{d.description[lang]}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge>~{fmtNumber(d.rowsHint, 0, lang)} {tr('dòng', 'rows')}</Badge>
                <Badge>{d.headersLang === 'en' ? 'EN headers' : d.headersLang === 'vi' ? 'VI headers' : tr('VI không dấu', 'VI no accents')}</Badge>
              </div>
            </button>
          )
        })}
      </div>
      <Card className="mt-6 p-5 text-[13.5px] leading-relaxed text-muted">
        {tr('Gợi ý trình diễn: mở Sales Demo → xem Command Center → vào Ask Your Data, gõ "Top 5 sản phẩm doanh thu cao nhất" → Scenario Lab kéo Doanh thu +10% → Automation ROI → Executive Report → PRINT REPORT.', 'Demo flow: open Sales Demo → Command Center → Ask Your Data: "Top 5 products by revenue" → Scenario Lab: Revenue +10% → Automation ROI → Executive Report → PRINT REPORT.')}
      </Card>
    </div>
  )
}
