import { useNavigate } from 'react-router-dom';
import { Headphones, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export default function CskhMaintenancePage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Hệ thống ERP Nam Việt"
        title="Chăm sóc khách hàng (CSKH)"
      />

      <div className="max-w-md mx-auto my-16 p-8 text-center rounded-2xl bg-[var(--md-surface,#ffffff)] border border-[var(--md-outline-variant,#e2e8f0)] shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
          <Headphones size={32} strokeWidth={1.75} />
        </div>

        <h2 className="text-lg font-bold text-[var(--md-on-surface,#1e293b)] mb-2">
          Phân hệ đang được nâng cấp
        </h2>

        <p className="text-sm text-[var(--md-on-surface-variant,#64748b)] leading-relaxed mb-6">
          Chức năng Chăm sóc khách hàng (CSKH) hiện đang được nâng cấp hệ thống. Vui lòng quay lại sau.
        </p>

        <Button
          type="button"
          variant="filled"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/')}
        >
          Quay lại Trang chủ
        </Button>
      </div>
    </div>
  );
}
