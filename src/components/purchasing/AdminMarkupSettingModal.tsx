import { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, Check, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import {
  DEFAULT_MARKUP_CATEGORIES,
  type CategoryMarkupItem,
  type MarkupSettingsConfig,
} from '../../hooks/useMarkupSettings';

interface AdminMarkupSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MarkupSettingsConfig;
  onSave: (newConfig: MarkupSettingsConfig) => void;
}

export default function AdminMarkupSettingModal({
  isOpen,
  onClose,
  config,
  onSave,
}: AdminMarkupSettingModalProps) {
  const [globalPercent, setGlobalPercent] = useState<number>(config.globalMarkupPercent);
  const [categories, setCategories] = useState<CategoryMarkupItem[]>(config.categories);

  useEffect(() => {
    if (isOpen) {
      setGlobalPercent(config.globalMarkupPercent);
      setCategories(config.categories);
    }
  }, [isOpen, config]);

  const handleApplyGlobalToAll = () => {
    setCategories(prev =>
      prev.map(c => ({
        ...c,
        percent: globalPercent,
      })),
    );
    showToast('info', `Đã gán ${globalPercent}% cho toàn bộ ${categories.length} nhóm hàng.`);
  };

  const handlePercentChange = (id: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, percent: clamped } : c)),
    );
  };

  const handleResetDefaults = () => {
    setGlobalPercent(15);
    setCategories(DEFAULT_MARKUP_CATEGORIES);
    showToast('info', 'Đã khôi phục mức Markup chuẩn.');
  };

  const handleSave = () => {
    onSave({
      globalMarkupPercent: globalPercent,
      categories,
    });
    showToast('success', 'Đã lưu cấu hình Hệ số Markup Quản Trị thành công!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Cài Đặt Hệ Số Markup Quản Trị Chào Thầu"
      size="lg"
    >
      <div className="space-y-4">
        {/* Banner cảnh báo bảo mật BLĐ */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-5 h-5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="font-semibold block text-sm mb-0.5">
              Khu vực Quản trị Biên Lợi Nhuận của Ban Lãnh Đạo
            </strong>
            Hệ số Markup (%) là tỷ lệ cộng thêm trên giá vốn mua vào để tính ra đơn giá chào thầu cho Dự án EPC.
            Kỹ sư và nhân viên dự án <strong>bị ẩn hoàn toàn cấu hình này</strong> và chỉ nhìn thấy đơn giá chào thầu cuối cùng.
          </div>
        </div>

        {/* Cài đặt Markup chung */}
        <div className="p-3.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-variant)]/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--md-on-surface)]">
              Markup Chung Mặc Định:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className="form-input form-input-sm w-20 text-center font-bold text-amber-600 dark:text-amber-400"
                value={globalPercent}
                onChange={e => setGlobalPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              />
              <span className="text-xs font-semibold">%</span>
            </div>
            <span className="text-xs text-[var(--md-on-surface-variant)]">
              (Hệ số: <strong>x{(1 + globalPercent / 100).toFixed(2)}</strong>)
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
            onClick={handleApplyGlobalToAll}
            title="Gán hệ số chung cho tất cả các nhóm bên dưới"
          >
            <Check size={14} />
            <span>Áp dụng cho tất cả nhóm</span>
          </button>
        </div>

        {/* Bảng chi tiết từng nhóm/hệ hàng */}
        <div className="border border-[var(--md-outline-variant02)] rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[var(--md-surface-variant)]/40 sticky top-0 z-10 border-b border-[var(--md-outline-variant02)]">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-[var(--md-on-surface)]">Nhóm / Hệ Hàng</th>
                <th className="py-2.5 px-3 font-semibold text-[var(--md-on-surface)]">Định hướng & Ghi chú</th>
                <th className="py-2.5 px-3 font-semibold text-center text-[var(--md-on-surface)] w-28">Markup (%)</th>
                <th className="py-2.5 px-3 font-semibold text-right text-[var(--md-on-surface)] w-24">Hệ số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-outline-variant02)]/50">
              {categories.map(cat => {
                const multiplier = (1 + cat.percent / 100).toFixed(2);
                return (
                  <tr key={cat.id} className="hover:bg-[var(--md-surface-variant)]/20 transition-colors">
                    <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {cat.id}
                        </span>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[var(--md-on-surface-variant)] text-[11px]">
                      {cat.note || '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          className="form-input form-input-sm w-16 text-center font-bold text-amber-700 dark:text-amber-300"
                          value={cat.percent}
                          onChange={e => handlePercentChange(cat.id, Number(e.target.value) || 0)}
                        />
                        <span className="text-[11px] font-medium">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--md-on-surface)]">
                      x{multiplier}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Thông tin cập nhật lần cuối & Khôi phục mặc định */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--md-on-surface-variant)] pt-1">
          <div>
            {config.updatedAt ? (
              <span>
                Cập nhật lần cuối: <strong>{new Date(config.updatedAt).toLocaleDateString('vi-VN')}</strong> bởi{' '}
                <strong>{config.updatedBy || 'BLĐ'}</strong>
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] underline inline-flex items-center gap-1 cursor-pointer"
            onClick={handleResetDefaults}
          >
            <RotateCcw size={12} />
            <span>Khôi phục định mức mặc định</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-outline-variant02)]">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold"
            onClick={handleSave}
          >
            <Save size={14} />
            <span>Lưu Cấu Hình Quản Trị</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
