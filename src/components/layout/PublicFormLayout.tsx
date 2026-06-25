import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

interface PublicFormLayoutProps {
  eyebrow?: string;
  eyebrowAsTitle?: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}

export default function PublicFormLayout({ eyebrow, eyebrowAsTitle = false, title, subtitle, children, wide = false }: PublicFormLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="hrm-public-page page-route-enter">
      <div className={`hrm-public-shell ${wide ? 'hrm-public-shell--wide' : ''}`}>
        <header className="hrm-public-topbar">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hrm-public-login-btn"
          >
            <LogIn size={16} aria-hidden />
            <span>Đăng nhập hệ thống</span>
          </button>
        </header>

        <div className="hrm-public-intro">
          {eyebrowAsTitle ? (
            <h1 className="hrm-public-intro__title">{eyebrow ?? 'NAM VIỆT GROUP TUYỂN DỤNG'}</h1>
          ) : (
            eyebrow ? (
              <p className="hrm-public-intro__eyebrow">{eyebrow}</p>
            ) : null
          )}

          {title && (
            <h2 className={eyebrowAsTitle ? 'hrm-public-intro__subtitle' : 'hrm-public-intro__title'}>
              {title}
            </h2>
          )}

          {subtitle && (
            <p className="hrm-public-intro__desc">{subtitle}</p>
          )}
        </div>

        <div className="hrm-public-card">
          {children}
        </div>

        <p className="hrm-public-footer">
          © {new Date().getFullYear()} NamViet Group. Bảo mật thông tin hồ sơ.
        </p>
      </div>
    </div>
  );
}
