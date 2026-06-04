import { Settings, Hash, Bell } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

/** Shape for a voucher code config row */
interface CodeConfigItem {
  label: string;
  prefix: string;
  example: string;
}

/** Shape for a notification config row */
interface NotificationItem {
  label: string;
  enabled: boolean;
}

/** Shape for a workflow step description */
interface WorkflowStep {
  step: number;
  title: string;
  desc: string;
}

export default function StocktakeSettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="KIỂM KÊ" title="THIẾT LẬP KIỂM KÊ" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mã tự động */}
        <div className="rounded-2xl p-6 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-info-container)', border: '1px solid var(--md-outline-variant)' }}>
              <Hash size={20} style={{ color: 'var(--md-info)' }} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--md-on-surface)' }}>Mã tự động</h3>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Cấu hình định dạng mã chứng từ kiểm kê</p>
            </div>
          </div>
          <div className="space-y-3">
            {([
              { label: 'Phiếu kiểm kê', prefix: 'KK', example: 'KK-001530' },
              { label: 'Phiếu điều chỉnh', prefix: 'ĐCT', example: 'ĐCT-001453' },
            ] as CodeConfigItem[]).map((item) => (
              <div key={item.prefix} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs px-2 py-1 rounded font-mono font-semibold"
                    style={{ background: 'var(--md-surface-container-low)', color: 'var(--md-primary)', border: '1px solid var(--md-outline-variant)' }}
                  >{item.prefix}-######</code>
                  <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>VD: {item.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thông báo kiểm kê */}
        <div className="rounded-2xl p-6 shadow-card" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-warning-container)', border: '1px solid var(--md-outline-variant)' }}>
              <Bell size={20} style={{ color: 'var(--md-warning)' }} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--md-on-surface)' }}>Thông báo kiểm kê</h3>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Cấu hình thông báo cho module kiểm kê</p>
            </div>
          </div>
          <div className="space-y-3">
            {([
              { label: 'Thông báo tạo phiếu kiểm kê mới', enabled: true },
              { label: 'Thông báo đóng băng SKU', enabled: true },
              { label: 'Thông báo chênh lệch kiểm kê', enabled: true },
              { label: 'Thông báo duyệt điều chỉnh', enabled: false },
            ] as NotificationItem[]).map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.label}</span>
                <input type="checkbox" defaultChecked={item.enabled}
                  className="w-4 h-4 accent-[var(--md-primary)] cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quy trình kiểm kê */}
        <div className="rounded-2xl p-6 shadow-card col-span-1 lg:col-span-2" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-success-container)', border: '1px solid var(--md-outline-variant)' }}>
              <Settings size={20} style={{ color: 'var(--md-success)' }} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--md-on-surface)' }}>Quy trình kiểm kê</h3>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Cấu hình luồng xử lý kiểm kê</p>
            </div>
          </div>

          {/* Progress Step Bar */}
          <div className="flex flex-wrap items-center gap-y-4 py-2">
            {['Tạo phiếu', 'Đóng băng SKU', 'Đếm thực tế', 'So sánh chênh lệch', 'Duyệt điều chỉnh', 'Mở băng'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Step badge — uses accent for contrast in both modes */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--md-on-surface)' }}>{step}</span>
                </div>
                {i < 5 && (
                  <div className="w-6 h-px mx-1 flex-shrink-0" style={{ background: 'var(--md-outline-variant)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step descriptions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
            {([
              { step: 1, title: 'Tạo phiếu', desc: 'Khởi tạo phiếu kiểm kê, chọn kho và danh mục SKU cần kiểm.' },
              { step: 2, title: 'Đóng băng SKU', desc: 'Khóa số liệu tồn kho hiện tại để tạo mốc so sánh.' },
              { step: 3, title: 'Đếm thực tế', desc: 'Nhập liệu đếm thực tế từ tất cả vị trí kho.' },
              { step: 4, title: 'So sánh', desc: 'Hệ thống tự động phát hiện chênh lệch thừa/thiếu.' },
              { step: 5, title: 'Duyệt điều chỉnh', desc: 'Ban quản lý phê duyệt phiếu điều chỉnh tồn kho.' },
              { step: 6, title: 'Mở băng', desc: 'Giải phóng khóa SKU, kết thúc phiếu kiểm kê.' },
            ] as WorkflowStep[]).map(s => (
              <div key={s.step} className="rounded-xl p-3"
                style={{ background: 'var(--md-surface-container-low)', border: '1px solid var(--md-outline-variant)' }}>
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--md-primary)' }}>Bước {s.step}: {s.title}</div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
