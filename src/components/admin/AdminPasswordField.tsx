import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { generateTempPassword } from '../../lib/generatePassword';
import { PASSWORD_HINT } from '../../lib/translateErrorMessage';

interface AdminPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export default function AdminPasswordField({
  value,
  onChange,
  error,
  label = 'Mật khẩu',
  required = true,
}: AdminPasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    onChange(generateTempPassword());
  };

  const handleCopy = async () => {
    if (!value.trim()) {
      showToast('warning', 'Chưa có mật khẩu để sao chép');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast('success', 'Đã sao chép mật khẩu');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Không thể sao chép');
    }
  };

  return (
    <div>
      <label className="hrm-field__label">
        {label}
        {required && <span className="text-[var(--md-error)]"> *</span>}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            className="form-input pr-10"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={PASSWORD_HINT}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)]"
            onClick={() => setShow(s => !s)}
            title={show ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="button"
          className="btn btn-outline px-3"
          onClick={handleGenerate}
          title="Sinh mật khẩu ngẫu nhiên"
        >
          <RefreshCw size={16} />
        </button>
        <button
          type="button"
          className="btn btn-outline px-3"
          onClick={handleCopy}
          title="Sao chép"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--md-error)] mt-1">{error}</p>}
    </div>
  );
}
