import { useNavigate } from 'react-router-dom';
import { Headphones, Wrench, ArrowLeft, ShieldCheck, FileCheck, Layers, Sparkles } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import Button from '../../components/ui/Button';

export default function CskhMaintenancePage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Hệ thống ERP Nam Việt"
        title="Chăm sóc khách hàng (CSKH)"
        subtitle="Thông báo tình trạng vận hành phân hệ"
      />

      <HrmPanel className="max-w-4xl mx-auto my-6 p-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge & Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Headphones size={36} strokeWidth={1.75} />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 shadow-sm">
              <Wrench size={15} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 mb-4">
            <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
            Phân hệ đang được nâng cấp
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-[var(--md-on-surface,#1e293b)] mb-3">
            Phân hệ CSKH tạm khóa để hoàn thiện nghiệp vụ
          </h2>

          <p className="text-sm md:text-base text-[var(--md-on-surface-variant,#64748b)] max-w-2xl leading-relaxed mb-8">
            Bộ phận phát triển hệ thống đang tiến hành chuẩn hóa quy trình tiếp nhận hồ sơ A-B,
            tối ưu phân quyền đối tác và liên kết dữ liệu thời gian thực với phân hệ Vận hành & Kho hàng.
            Tính năng sẽ sớm được mở lại sau khi hoàn tất kiểm thử.
          </p>

          {/* Upgrade Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left mb-8">
            <div className="p-4 rounded-xl border border-[var(--md-outline-variant,#e2e8f0)] bg-[var(--md-surface,#ffffff)] shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--md-on-surface,#1e293b)] mb-1">
                Hồ sơ & Biên bản A-B
              </h3>
              <p className="text-xs text-[var(--md-on-surface-variant,#64748b)] leading-relaxed">
                Chuẩn hóa luồng đệ trình kỹ thuật, hồ sơ nghiệm thu và kiểm soát tiến độ xử lý hồ sơ.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--md-outline-variant,#e2e8f0)] bg-[var(--md-surface,#ffffff)] shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--md-on-surface,#1e293b)] mb-1">
                Phân quyền & Bảo mật
              </h3>
              <p className="text-xs text-[var(--md-on-surface-variant,#64748b)] leading-relaxed">
                Tách biệt quyền truy cập dữ liệu kỹ thuật theo dự án, chủ đầu tư và đối tác giám sát.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--md-outline-variant,#e2e8f0)] bg-[var(--md-surface,#ffffff)] shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Layers size={18} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--md-on-surface,#1e293b)] mb-1">
                Liên kết Kho & Mua hàng
              </h3>
              <p className="text-xs text-[var(--md-on-surface-variant,#64748b)] leading-relaxed">
                Tích hợp trạng thái vật tư thực tế từ kho và tiến độ cung ứng PO của từng công trình.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="filled"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Quay lại Trang chủ
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate('/operations/dashboard')}
            >
              Xem Vận hành SLC
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate('/warehouse/dashboard-warehouse')}
            >
              Xem Kho hàng
            </Button>
          </div>
        </div>
      </HrmPanel>
    </div>
  );
}
