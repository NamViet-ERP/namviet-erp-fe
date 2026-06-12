import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface PublicFormLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
}

export default function PublicFormLayout({ title, subtitle, children, wide = false }: PublicFormLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="hrm-public-page">
      <div className={`mx-auto ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}>
        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] text-sm font-semibold text-[var(--md-primary)] shadow-sm hover:bg-[var(--nv-surface-hover)] hover:border-[var(--md-primary)] transition-all duration-200"
          >
            <LogIn size={16} />
            Đăng nhập hệ thống
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--md-primary)] mb-2">NamViet Group · HR</p>
          <h1 className="text-3xl font-bold text-[var(--md-on-surface)] mb-2">{title}</h1>
          <p className="text-sm text-[var(--md-on-surface-variant)] max-w-lg mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="hrm-public-card">
          {children}
        </div>

        <p className="text-center mt-6 text-xs text-[var(--md-on-surface-variant)]">
          © {new Date().getFullYear()} NamViet Group. Bảo mật thông tin hồ sơ.
        </p>
      </div>
    </div>
  );
}
