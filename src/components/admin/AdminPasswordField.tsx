import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { generateTempPassword } from '../../lib/generatePassword';
import { PASSWORD_HINT } from '../../lib/translateErrorMessage';
import FormField from '../ui/FormField';

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
    <FormField label={label} required={required} error={error}>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            type={show ? 'text' : 'password'}
            className="form-input pr-10 w-full"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={PASSWORD_HINT}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)]"
            onClick={() => setShow(s => !s)}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
        <button
          type="button"
          className="btn btn-outline px-3"
          onClick={handleGenerate}
          aria-label="Sinh mật khẩu ngẫu nhiên"
          title="Sinh mật khẩu ngẫu nhiên"
        >
          <RefreshCw size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-outline px-3"
          onClick={handleCopy}
          aria-label="Sao chép mật khẩu"
          title="Sao chép mật khẩu"
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        </button>
      </div>
    </FormField>
  );
}
