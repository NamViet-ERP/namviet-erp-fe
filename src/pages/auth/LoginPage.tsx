import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldAlert, FileText } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import ToastContainer from '../../components/ui/Toast';
import { getUserById, canUserLogin, setSessionUser, findUserByLogin } from '../../constants/systemUsers';
import { getAccountLockReason } from '../../services/employeesService';
import { authService } from '../../services/authService';
import { USE_MOCK } from '../../lib/mock';
import RoleSwitcher from '../../components/layout/RoleSwitcher';

const HAS_API = Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export default function LoginPage() {
  const [username, setUsername] = useState(() => {
    if (localStorage.getItem('nv-remember-me') === 'true') {
      return localStorage.getItem('nv-saved-user') ?? '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [mockUserId, setMockUserId] = useState('');
  const [useMockQuickLogin, setUseMockQuickLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('nv-remember-me') === 'true',
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (USE_MOCK && useMockQuickLogin) {
        if (!mockUserId) {
          setError('Vui lòng chọn vai trò mô phỏng');
          return;
        }
        await new Promise(r => setTimeout(r, 800));
        const user = getUserById(mockUserId);
        if (!user) {
          setError('Không tìm thấy vai trò mô phỏng');
          return;
        }
        if (!canUserLogin(user)) {
          setError(getAccountLockReason(user.employeeId) ?? 'Tài khoản không còn hoạt động.');
          return;
        }
        localStorage.setItem('nv-logged-in', 'true');
        setSessionUser(user);
      } else {
        if (!username.trim() || !password.trim()) {
          setError('Vui lòng điền đầy đủ email/tên đăng nhập và mật khẩu');
          return;
        }

        if (HAS_API) {
          await authService.loginFe(username.trim(), password);
        } else if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 800));
          const user = findUserByLogin(username);
          if (!user) {
            setError('Tài khoản không tồn tại');
            return;
          }
          if (!canUserLogin(user)) {
            setError(getAccountLockReason(user.employeeId) ?? 'Tài khoản không còn hoạt động.');
            return;
          }
          localStorage.setItem('nv-logged-in', 'true');
          setSessionUser(user);
        } else {
          setError('Chưa cấu hình API. Thêm VITE_API_BASE_URL=http://localhost:8080 vào file .env');
          return;
        }
      }

      if (rememberMe && !useMockQuickLogin) {
        localStorage.setItem('nv-remember-me', 'true');
        localStorage.setItem('nv-saved-user', username.trim());
      } else {
        localStorage.removeItem('nv-remember-me');
        localStorage.removeItem('nv-saved-user');
      }
      showToast('success', 'Chào mừng bạn quay trở lại hệ thống!', 'Đăng nhập thành công');
      navigate('/warehouse/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--tr" />
      <div className="login-page__glow login-page__glow--bl" />

      <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
        <div className="login-card">
          <div className="text-center mb-7">
            <div className="inline-block rounded-xl overflow-hidden">
              <img src="/nam viet group-bac.png" alt="NamViet Group" className="h-28 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-on-surface)]">
              Nam Việt <span className="text-[var(--md-primary)]">ERP</span>
            </h2>
            <p className="text-xs font-medium tracking-wide text-[var(--md-on-surface-variant)]">
              HỆ THỐNG QUẢN LÝ CHO NHÂN SỰ & KHO MAYZER
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-4 border border-[var(--md-outline-variant)]"
              style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
            >
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="hrm-field__label">
                {USE_MOCK ? 'Email hoặc tên đăng nhập' : 'Email'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input w-full h-11 rounded-lg"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={USE_MOCK ? 'vd: vy.phan hoặc vy.phan@namviet.vn' : 'vd: tuan.nguyen@namviet.vn'}
                  disabled={USE_MOCK && useMockQuickLogin}
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
                  disabled={USE_MOCK && useMockQuickLogin}
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

            {USE_MOCK && (
              <>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={useMockQuickLogin}
                    onChange={e => {
                      setUseMockQuickLogin(e.target.checked);
                      if (!e.target.checked) setMockUserId('');
                    }}
                    style={{ accentColor: 'var(--md-primary)' }}
                  />
                  <span className="text-[var(--md-on-surface-variant)] font-medium">
                    Đăng nhập nhanh theo vai trò mô phỏng
                  </span>
                </label>

                {useMockQuickLogin && (
                  <div className="rounded-xl border border-[var(--md-outline-variant)] overflow-hidden bg-[var(--md-surface-container-low)]">
                    <RoleSwitcher
                      compact
                      embedded
                      previewOnly
                      activeUserId={mockUserId || undefined}
                      onSwitch={user => {
                        setMockUserId(user.id);
                        setUsername(user.email);
                      }}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--md-primary)' }}
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
              className="btn btn-primary w-full py-3 text-sm font-bold rounded-full mt-2"
              disabled={loading}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
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
