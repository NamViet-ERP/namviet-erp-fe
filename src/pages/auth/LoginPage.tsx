import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import ToastContainer from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { authService } from '../../services/authService';
import { REMEMBER_KEY, SAVED_USER_KEY } from '../../lib/authSession';
import { getDefaultRoute } from '../../utils/getDefaultRoute';
import { getActiveRole } from '../../lib/getActiveRole';
import { NAMVIET_GROUP_LOGO_URL } from '../../constants/branding';

const HAS_API = Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export default function LoginPage() {
  const [username, setUsername] = useState(() => {
    if (localStorage.getItem(REMEMBER_KEY) === 'true') {
      return localStorage.getItem(SAVED_USER_KEY) ?? '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem(REMEMBER_KEY) === 'true',
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setError('Vui lòng điền đầy đủ email và mật khẩu');
        return;
      }

      if (!HAS_API) {
        setError(UI_ERROR.serverUnavailable);
        return;
      }

      await authService.login(username.trim(), password, rememberMe);

      showToast('success', 'Chào mừng bạn quay trở lại hệ thống!', 'Đăng nhập thành công');
      setError('');
      navigate(getDefaultRoute(getActiveRole()));
    } catch (err) {
      setError(getApiErrorMessage(err, UI_ERROR.loginFailed));
    } finally {
      setLoading(false);
    }
  };

  const alertMessage = error || (sessionExpired ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : '');
  const alertVariant = error ? 'error' : 'warning';

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--tr" />
      <div className="login-page__glow login-page__glow--bl" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="login-card">
          <div className="text-center mb-7">
            <div className="login-brand">
              <img src={NAMVIET_GROUP_LOGO_URL} alt="NamViet Group" className="login-brand__logo" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-on-surface)]">
              Nam Việt <span className="text-[var(--md-primary)]">ERP</span>
            </h2>
            <p className="text-xs font-medium tracking-wide text-[var(--md-on-surface-variant)]">
              HỆ THỐNG QUẢN LÝ CHO NHÂN SỰ & KHO MAYZER
            </p>
          </div>

          <div
            className={`login-alert-slot${alertMessage ? ' login-alert-slot--visible' : ''}`}
            role="alert"
            aria-live="polite"
          >
            <div className={`alert-banner alert-banner--${alertVariant}`}>
              <ShieldAlert size={16} className="alert-banner__icon" aria-hidden />
              <span>{alertMessage || '\u00A0'}</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="hrm-field__label">Email</label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input w-full h-11 rounded-lg"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="vd: tuan.nguyen@namviet.vn"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="hrm-field__label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input w-full h-11 pr-10 rounded-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)] bg-transparent border-none cursor-pointer p-0 flex"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="form-checkbox-accent"
                />
                <span className="text-[var(--md-on-surface-variant)] font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => showToast('info', 'Vui lòng liên hệ quản trị viên để khôi phục mật khẩu.', 'Quên mật khẩu')}
                className="bg-transparent border-none text-[var(--md-primary)] font-semibold cursor-pointer text-sm p-0"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn w-full py-3 text-sm font-bold rounded-full mt-2"
              disabled={loading}
              aria-busy={loading}
            >
              <span className="login-submit-btn__label">ĐĂNG NHẬP</span>
              {loading && (
                <Loader2 size={18} className="login-submit-btn__spinner" aria-hidden />
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--md-outline-variant)]">
            <p className="text-center text-xs text-[var(--md-on-surface-variant)] mb-3">
              Bạn là ứng viên? Nộp hồ sơ tại đây
            </p>
            <button
              type="button"
              onClick={() => navigate('/recruitment/apply')}
              className="btn btn-outlined w-full py-2.5 text-sm font-semibold rounded-full flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Nộp đơn ứng tuyển
            </button>
          </div>

          <p className="text-center mt-5 text-xs text-[var(--md-on-surface-variant)]">
            Phiên bản thử nghiệm Mayzer WMS v1.2.0
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
