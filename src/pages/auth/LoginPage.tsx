import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import CandidateForm from '../../components/recruitment/CandidateForm';
import logoWhite from '../../assets/logo-white.png';

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

    // Simulate network latency
    setTimeout(() => {
      setLoading(false);
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
    <div className="flex flex-col-reverse md:flex-row min-h-screen w-full overflow-x-hidden">
      
      {/* LEFT PANEL: Recruitment Submission Form */}
      <div className="w-full md:w-[55%] bg-[var(--md-surface)] p-6 md:p-12 overflow-y-auto md:h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Header branding for Recruitment */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '1.875rem',
                fontWeight: 700,
                color: 'var(--md-on-surface)',
                marginBottom: '8px',
              }}
            >
              Tiếp nhận CV - Vinh Việt HR
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--md-on-surface-variant)',
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              Vui lòng cung cấp các thông tin tuyển dụng dưới đây để nộp hồ sơ xin việc của bạn vào hệ thống nhân sự Vinh Việt.
            </p>
          </div>

          <div
            style={{
              background: 'var(--md-surface-container)',
              borderRadius: '24px',
              border: '1px solid var(--md-outline-variant)',
              padding: '32px 24px',
              boxShadow: 'var(--md-shadow-1)',
            }}
          >
            {/* Recruitment form component */}
            <CandidateForm />
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', color: 'var(--md-on-surface-variant)', fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} Vinh Việt HR. Bảo mật thông tin hồ sơ ứng viên.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: System Login Form */}
      <div 
        className="w-full md:w-[45%] flex items-center justify-center p-6 md:p-12 md:h-screen"
        style={{
          background: 'radial-gradient(circle at top right, var(--md-primary-container) 0%, var(--md-surface) 60%)',
          position: 'relative',
        }}
      >
        {/* Background decorative shapes */}
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            right: '-5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(14, 48, 99, 0.05)',
            filter: 'blur(60px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        
        {/* Login Card */}
        <div
          className="animate-scale-in w-full"
          style={{
            position: 'relative',
            maxWidth: '400px',
            background: 'var(--md-surface-container)',
            borderRadius: '28px',
            boxShadow: 'var(--md-shadow-3)',
            border: '1px solid var(--md-outline-variant)',
            padding: '36px 28px',
            zIndex: 10,
          }}
        >
          {/* Logo and Brand */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                background: '#0E3063',
                padding: '10px 18px',
                borderRadius: '12px',
                display: 'inline-block',
                margin: '0 auto 16px',
                boxShadow: 'var(--md-shadow-1)',
              }}
            >
              <img
                src={logoWhite}
                alt="Logo"
                style={{
                  height: '36px',
                  objectFit: 'contain',
                }}
              />
            </div>
            <h2
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--md-on-surface)',
                lineHeight: 1.2,
                marginBottom: '6px',
              }}
            >
              NamViệt <span style={{ color: 'var(--md-primary)' }}>WMS</span>
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--md-on-surface-variant)',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              HỆ THỐNG QUẢN LÝ KHO & CHUỖI CUNG ỨNG
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--md-error-container)',
                color: 'var(--md-on-error-container)',
                borderRadius: '12px',
                fontSize: '0.8125rem',
                marginBottom: '16px',
                border: '1px solid var(--md-outline-variant)',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--md-on-surface-variant)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px', width: '100%', height: '48px', paddingTop: '0', borderRadius: '8px' }}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                />
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--md-on-surface-variant)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--md-on-surface-variant)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%', height: '48px', paddingTop: '0', borderRadius: '8px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--md-on-surface-variant)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--md-on-surface-variant)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role Simulation */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--md-on-surface-variant)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Vai trò mô phỏng đăng nhập
              </label>
              <select
                className="form-select"
                style={{ width: '100%', height: '48px', borderRadius: '8px', borderBottom: '1px solid var(--md-outline)' }}
                value={role}
                onChange={e => {
                  setRole(e.target.value);
                  setUsername(e.target.value);
                }}
              >
                <option value="storekeeper">Thủ kho (Storekeeper) - vy.phan</option>
                <option value="pm">Quản lý dự án (PM) - hung.nguyen</option>
                <option value="accountant">Kế toán trưởng - hong.le</option>
                <option value="procurement">Phòng mua hàng - chi.my</option>
                <option value="admin">Quản trị viên (Admin) - tuan.nguyen</option>
              </select>
            </div>

            {/* Remember me checkbox and Forgot password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', paddingTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  style={{ accentColor: 'var(--md-primary)', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>Ghi nhớ đăng nhập</span>
              </label>
              
              <button 
                type="button" 
                onClick={() => showToast('info', 'Vui lòng liên hệ quản trị viên để khôi phục mật khẩu.', 'Quên mật khẩu')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  padding: 0
                }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                borderRadius: '9999px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={loading}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>
              Phiên bản thử nghiệm nghiệp vụ Mayzer WMS v1.2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
