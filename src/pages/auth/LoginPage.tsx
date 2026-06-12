import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldAlert, FileText } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import ToastContainer from '../../components/ui/Toast';
import { systemUsers, getLoginEligibleUsers, getUserByRole, canUserLogin } from '../../constants/systemUsers';
import { getAccountLockReason } from '../../services/employeesService';
import namvietGroupLogo from '../../assets/NamViet Group.png';

export default function LoginPage() {
  const [username, setUsername] = useState('storekeeper');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('storekeeper');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      const user = getUserByRole(role) ?? systemUsers.find(u => u.username === username);
      if (user && !canUserLogin(user)) {
        setError(getAccountLockReason(user.employeeId) ?? 'Tài khoản không còn hoạt động.');
        return;
      }
      localStorage.setItem('nv-logged-in', 'true');
      localStorage.setItem('nv-user-role', role);
      if (rememberMe) {
        localStorage.setItem('nv-remember-me', 'true');
        localStorage.setItem('nv-saved-user', username);
      } else {
        localStorage.removeItem('nv-remember-me');
        localStorage.removeItem('nv-saved-user');
      }
      showToast('success', 'Chào mừng bạn quay trở lại hệ thống!', 'Đăng nhập thành công');
      navigate('/warehouse/dashboard');
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--tr" />
      <div className="login-page__glow login-page__glow--bl" />

      <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
        <div className="login-card">
          <div className="text-center mb-7">
            <div className="inline-block rounded-xl mb-4 overflow-hidden">
              <img src={namvietGroupLogo} alt="NamViet Group" className="h-14 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-on-surface)] mb-1">
              NamViệt <span className="text-[var(--md-primary)]">WMS</span>
            </h2>
            <p className="text-xs font-medium tracking-wide text-[var(--md-on-surface-variant)]">
              HỆ THỐNG QUẢN LÝ KHO & CHUỖI CUNG ỨNG
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
              <label className="hrm-field__label">Tên đăng nhập</label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input w-full h-12 pl-10 rounded-lg"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
              </div>
            </div>

            <div>
              <label className="hrm-field__label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input w-full h-12 pl-10 pr-10 rounded-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)] bg-transparent border-none cursor-pointer p-0 flex"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="hrm-field__label">Vai trò mô phỏng đăng nhập</label>
              <select
                className="form-select w-full h-12 rounded-lg"
                value={role}
                onChange={e => {
                  setRole(e.target.value);
                  const user = systemUsers.find(u => u.role === e.target.value);
                  if (user) setUsername(user.username);
                }}
              >
                {getLoginEligibleUsers().map(u => (
                  <option key={u.id} value={u.role}>
                    {u.roleLabel} - {u.username}
                  </option>
                ))}
              </select>
            </div>

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
