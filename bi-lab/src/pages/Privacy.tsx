import { CheckCircle2, Cloud, Cpu, Database, HardDrive, Lock, Server, ShieldCheck, Trash2, WifiOff } from 'lucide-react'
import { clearLocalData, setState, toast, useStore } from '@/app/store'
import { closeDataset } from '@/app/actions'
import { useT } from '@/i18n/useT'
import { Button, Card, CardHeader, PageHeader } from '@/components/ui/primitives'

export default function Privacy() {
  const { tr } = useT()
  const hasData = useStore((s) => !!s.dataset)
  const status = [
    { icon: Cpu, k: 'Local Processing', v: 'ON', ok: true },
    { icon: Server, k: 'External API', v: 'NONE', ok: true },
    { icon: Cloud, k: 'Cloud Upload', v: 'OFF', ok: true },
    { icon: Lock, k: 'Third-party AI', v: 'NONE', ok: true },
  ]
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Privacy Center" icon={ShieldCheck} title={tr('Trung tâm quyền riêng tư', 'Privacy Center')} subtitle={tr('Dữ liệu được xử lý trực tiếp trên thiết bị của bạn. Không gửi dữ liệu lên máy chủ. Không gửi dữ liệu tới mô hình AI bên thứ ba.', 'Your data is processed directly on your device. Nothing is sent to a server. Nothing is sent to third-party AI models.')} />
      <Card className="relative overflow-hidden p-8">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative flex flex-col items-center gap-8 lg:flex-row">
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--positive)_30%,transparent)]" />
            <div className="absolute inset-4 rounded-full border border-[color-mix(in_srgb,var(--positive)_20%,transparent)]" />
            <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--positive) 18%, transparent), transparent)' }} />
            <ShieldCheck size={64} strokeWidth={1.5} className="relative text-positive" />
          </div>
          <div className="grid w-full flex-1 gap-3 sm:grid-cols-2">
            {status.map((s) => (
              <div key={s.k} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-4">
                <s.icon size={20} className="text-accent" />
                <span className="flex-1 text-[14.5px] font-medium">{s.k}</span>
                <span className="inline-flex items-center gap-1.5 text-[14px] font-bold tracking-wide text-positive"><CheckCircle2 size={16} />{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          [Database, tr('Dữ liệu ở đâu?', 'Where is my data?'), tr('File được đọc vào bộ nhớ của tab trình duyệt và xử lý trong Web Worker. Không có máy chủ ứng dụng, không có cơ sở dữ liệu đám mây. Đóng/tải lại trang là dữ liệu biến mất.', 'Files are read into this browser tab\'s memory and processed in a Web Worker. There is no application server and no cloud database. Closing or reloading the page clears the data.')],
          [WifiOff, tr('Hoạt động ngoại tuyến', 'Works offline'), tr('Sau lần tải đầu tiên, ứng dụng có thể mở lại khi không có mạng. Chính sách bảo mật (CSP) chặn mọi kết nối ra ngoài từ ứng dụng.', 'After the first load the app can reopen offline. A strict Content-Security-Policy blocks any outbound connection from the app.')],
          [HardDrive, tr('Lưu trữ cục bộ', 'Local storage'), tr('Mặc định không lưu dữ liệu tải lên. Chỉ cài đặt (nếu bật "Ghi nhớ cài đặt") và kịch bản Scenario được lưu trên thiết bị này.', 'Uploaded data is never persisted by default. Only settings (when "Remember settings" is on) and saved scenarios are stored on this device.')],
        ].map(([I, t, d]) => {
          const Icon = I as typeof Database
          return (
            <Card key={t as string} className="p-6">
              <Icon size={20} className="text-accent" />
              <div className="mt-3 text-[15px] font-semibold">{t as string}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{d as string}</p>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHeader icon={Trash2} title="CLEAR LOCAL DATA" subtitle={tr('Xóa dữ liệu đang mở trong bộ nhớ, cài đặt và kịch bản đã lưu trên thiết bị này.', 'Remove the open dataset from memory, plus settings and saved scenarios stored on this device.')} />
        <div className="flex flex-wrap gap-2 p-5">
          <Button variant="danger" icon={Trash2} onClick={() => {
            clearLocalData()
            if (hasData) closeDataset()
            setState({ rememberSettings: false })
            toast(tr('Đã xóa toàn bộ dữ liệu cục bộ', 'All local data cleared'), 'success')
          }}>CLEAR LOCAL DATA</Button>
        </div>
      </Card>
    </div>
  )
}
