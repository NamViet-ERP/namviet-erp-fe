import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { showToast } from '../../components/ui/Toast';

const ONBOARDING_PATH = '/employee/onboarding';

export default function MembersSettingsPage() {
  const [copied, setCopied] = useState(false);

  const copyOnboardingLink = () => {
    const link = `${window.location.origin}${ONBOARDING_PATH}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast('success', 'Đã sao chép liên kết form khai báo nhân viên');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="NHÂN VIÊN" title="THIẾT LẬP NHÂN SỰ" />

      <div className="max-w-xl">
        <div
          className="rounded-2xl p-6 shadow-card"
          style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--md-info-container)', border: '1px solid var(--md-outline-variant)' }}
            >
              <Link2 size={20} style={{ color: 'var(--md-info)' }} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--md-on-surface)' }}>
                Form khai báo nhân viên công khai
              </h3>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                Đường dẫn biểu mẫu dành cho nhân viên mới khai báo hồ sơ
              </p>
            </div>
          </div>

          <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
            Gửi liên kết này cho nhân viên mới (sau khi nhận việc) để họ tự điền thông tin cá nhân, liên hệ,
            học vấn và ngân hàng. Dữ liệu sẽ được ghi nhận vào hệ thống quản lý nhân sự.
          </p>

          <div
            className="flex items-center gap-2 p-2.5 rounded-lg mb-4 text-xs font-mono break-all"
            style={{
              background: 'var(--md-surface-container-low)',
              border: '1px solid var(--md-outline-variant)',
              color: 'var(--md-primary)',
            }}
          >
            {window.location.origin}
            {ONBOARDING_PATH}
          </div>

          <button
            type="button"
            onClick={copyOnboardingLink}
            className="btn btn-outline w-full flex items-center justify-center gap-2 text-sm py-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép liên kết'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
