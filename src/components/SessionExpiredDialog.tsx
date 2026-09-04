import { useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Modal from './ui/Modal';
import FormField from './ui/FormField';
import Button from './ui/Button';
import { authService } from '../services/authService';
import { getSessionUser } from '../constants/systemUsers';
import { getApiErrorMessage } from '../lib/apiClient';
import { UI_ERROR } from '../lib/uiMessages';
import {
  isSessionExpired,
  resolveSessionExpired,
  subscribeSessionExpired,
} from '../lib/sessionExpiry';

/**
 * Dialog đăng nhập lại tại chỗ khi phiên hết hạn (apiClient notify qua sessionExpiry).
 * Không điều hướng — form user đang nhập dở vẫn còn nguyên sau khi đăng nhập lại.
 */
export default function SessionExpiredDialog() {
  const expired = useSyncExternalStore(
    subscribeSessionExpired,
    isSessionExpired,
    isSessionExpired,
  );
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hydratedUsername, setHydratedUsername] = useState(false);

  // Prefill tài khoản hiện tại khi dialog mở (điều chỉnh state trong render).
  if (expired && !hydratedUsername) {
    const sessionUsername = getSessionUser()?.username ?? '';
    if (sessionUsername) setUsername(sessionUsername);
    setHydratedUsername(true);
  }
  if (!expired && hydratedUsername) {
    setHydratedUsername(false);
    setPassword('');
    setError('');
  }

  const handleRelogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }
    setSubmitting(true);
    try {
      await authService.login(username.trim(), password);
      resolveSessionExpired();
      // Query đang lỗi vì 401 sẽ được refetch với phiên mới.
      await queryClient.invalidateQueries();
    } catch (err) {
      setError(getApiErrorMessage(err, UI_ERROR.loginFailed));
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = async () => {
    try {
      await authService.logout();
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <Modal
      isOpen={expired}
      onClose={resolveSessionExpired}
      title="Phiên đăng nhập đã hết hạn"
      size="sm"
      footer={(
        <>
          <Button type="button" variant="text" onClick={() => void goToLogin()}>
            Về trang đăng nhập
          </Button>
          <Button
            type="submit"
            form="session-relogin-form"
            loading={submitting}
            disabled={submitting}
          >
            Đăng nhập lại
          </Button>
        </>
      )}
    >
      <form id="session-relogin-form" onSubmit={e => void handleRelogin(e)} className="space-y-3">
        <p className="text-[length:var(--fs-sm)] text-[var(--md-on-surface-variant)] m-0">
          Đăng nhập lại để tiếp tục làm việc. Dữ liệu bạn đang nhập trên màn hình vẫn được giữ nguyên.
        </p>
        {error ? (
          <div className="alert-banner alert-banner--error" role="alert" aria-live="polite">
            <ShieldAlert size={16} className="alert-banner__icon" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
        <FormField label="Email">
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </FormField>
        <FormField label="Mật khẩu">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input w-full pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(current => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-on-surface-variant)] bg-transparent border-none cursor-pointer p-0 flex"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>
      </form>
    </Modal>
  );
}
