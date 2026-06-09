import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import logoWhite from '../../assets/logo-white.png';

export default function LoginPage() {
  const [username, setUsername] = useState('storekeeper');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('storekeeper');
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
      showToast('success', 'Chào mừng bạn quay trở lại hệ thống!', 'Đăng nhập thành công');
      navigate('/warehouse/dashboard');
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at top right, var(--md-primary-container) 0%, var(--md-surface) 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blurred background shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(14, 48, 99, 0.08)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(52, 211, 153, 0.05)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      {/* Login Card */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'var(--md-surface-container)',
          borderRadius: '28px',
          boxShadow: 'var(--md-shadow-3)',
          border: '1px solid var(--md-outline-variant)',
          padding: '40px 32px',
          zIndex: 10,
        }}
      >
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              background: '#0E3063',
              padding: '12px 20px',
              borderRadius: '12px',
              display: 'inline-block',
              margin: '0 auto 16px',
              boxShadow: 'var(--md-shadow-1)',
            }}
          >
            <img
              src={logoWhite}
              alt="Mayzer Logo"
              style={{
                height: '40px',
                objectFit: 'contain',
              }}
            />
          </div>
          <h1
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--md-on-surface)',
              lineHeight: 1.2,
              marginBottom: '6px',
            }}
          >
            NamViệt <span style={{ color: 'var(--md-primary)' }}>WMS</span>
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--md-on-surface-variant)',
              fontWeight: 500,
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
              marginBottom: '20px',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
                style={{ paddingLeft: '40px', width: '100%' }}
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
                style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
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
              style={{ width: '100%' }}
              value={role}
              onChange={e => {
                setRole(e.target.value);
                // Auto-fill username matching role for convenience
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
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={loading}
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐẦNG NHẬP'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)' }}>
            Phiên bản thử nghiệm nghiệp vụ Mayzer WMS v1.2.0
          </span>
        </div>
      </div>
    </div>
  );
}
