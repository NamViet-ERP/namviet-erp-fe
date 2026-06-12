import { Hash, Shield, Bell, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

interface SettingSection {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  content: 'codes' | 'perms' | 'notif' | 'general';
}

const settingSections: SettingSection[] = [
  {
    id: 'codes',
    icon: Hash,
    iconColor: 'var(--status-info)',
    iconBg: 'color-mix(in srgb, var(--status-info) 12%, transparent)',
    title: 'Mã tự động',
    desc: 'Cấu hình định dạng mã chứng từ',
    content: 'codes',
  },
  {
    id: 'perms',
    icon: Shield,
    iconColor: 'var(--chart-5)',
    iconBg: 'color-mix(in srgb, var(--chart-5) 12%, transparent)',
    title: 'Phân quyền',
    desc: 'Quản lý quyền truy cập module kho',
    content: 'perms',
  },
  {
    id: 'notif',
    icon: Bell,
    iconColor: 'var(--md-primary)',
    iconBg: 'color-mix(in srgb, var(--md-primary) 12%, transparent)',
    title: 'Thông báo',
    desc: 'Cấu hình thông báo kho hàng',
    content: 'notif',
  },
  {
    id: 'general',
    icon: Globe,
    iconColor: 'var(--status-success)',
    iconBg: 'color-mix(in srgb, var(--status-success) 12%, transparent)',
    title: 'Cài đặt chung',
    desc: 'Cấu hình hệ thống chung',
    content: 'general',
  },
];

interface CodeItem {
  label: string;
  prefix: string;
  example: string;
}

const codeItems: CodeItem[] = [
  { label: 'Phiếu nhập kho', prefix: 'NK', example: 'NK-002147' },
  { label: 'Phiếu xuất kho', prefix: 'XK', example: 'XK-001893' },
  { label: 'Phiếu chuyển kho', prefix: 'CK', example: 'CK-000125' },
  { label: 'Phiếu chuyển đổi kho', prefix: 'CDK', example: 'CDK-000057' },
];

const roles: string[] = ['Quản lý kho', 'Thủ kho', 'Nhân viên', 'Xem báo cáo'];

interface NotifItem {
  label: string;
  enabled: boolean;
}

const notifItems: NotifItem[] = [
  { label: 'Cảnh báo tồn kho thấp', enabled: true },
  { label: 'Thông báo nhập kho mới', enabled: true },
  { label: 'Thông báo xuất kho', enabled: false },
  { label: 'Thông báo chuyển kho', enabled: true },
];

interface SettingCardProps {
  section: SettingSection;
}

function SettingCard({ section }: SettingCardProps) {
  const Icon = section.icon;
  return (
    <div
      className="rounded-2xl p-6 shadow-card transition-all duration-200"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: section.iconBg }}
        >
          <Icon size={19} style={{ color: section.iconColor }} />
        </div>
        <div>
          <h3
            className="text-[14px] font-bold"
            style={{ color: 'var(--nv-text-primary)' }}
          >
            {section.title}
          </h3>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'var(--nv-text-muted)' }}
          >
            {section.desc}
          </p>
        </div>
      </div>

      {/* Card content */}
      <div className="space-y-0">
        {section.content === 'codes' && codeItems.map((item) => (
          <div
            key={item.prefix}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: '1px solid var(--nv-border-subtle)' }}
          >
            <span className="text-[13px]" style={{ color: 'var(--nv-text-secondary)' }}>
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <code
                className="text-[11px] px-2 py-1 rounded font-mono"
                style={{
                  background: 'var(--nv-surface-subtle)',
                  color: 'var(--nv-accent)',
                  border: '1px solid var(--nv-border-default)',
                }}
              >
                {item.prefix}-######
              </code>
              <span className="text-[11px]" style={{ color: 'var(--nv-text-muted)' }}>
                VD: {item.example}
              </span>
            </div>
          </div>
        ))}

        {section.content === 'perms' && roles.map((role) => (
          <div
            key={role}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: '1px solid var(--nv-border-subtle)' }}
          >
            <span className="text-[13px]" style={{ color: 'var(--nv-text-secondary)' }}>
              {role}
            </span>
            <span className="badge badge-approved text-[10px]">Đang hoạt động</span>
          </div>
        ))}

        {section.content === 'notif' && notifItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: '1px solid var(--nv-border-subtle)' }}
          >
            <span className="text-[13px]" style={{ color: 'var(--nv-text-secondary)' }}>
              {item.label}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
              <div
                className="w-9 h-5 rounded-full transition-colors peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                style={{
                  background: item.enabled ? 'var(--nv-accent)' : 'var(--nv-border-strong)',
                }}
              />
            </label>
          </div>
        ))}

        {section.content === 'general' && (
          <div className="space-y-4 pt-1">
            <div>
              <label className="form-label">Đơn vị tiền tệ</label>
              <select className="form-select" defaultValue="VND">
                <option value="VND">VND - Việt Nam Đồng</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="form-label">Định dạng ngày</label>
              <select className="form-select" defaultValue="dd/MM/yyyy">
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      {/* Premium page header */}
      <PageHeader eyebrow="KHO HÀNG" title="THIẾT LẬP KHO HÀNG" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section) => (
          <SettingCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
