import { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { useCategoryTree } from '../../hooks/useCategories';
import type { CategoryMarkupItem, MarkupSettingsConfig } from '../../hooks/useMarkupSettings';
import { getApiErrorMessage } from '../../lib/apiClient';
import { childrenOf } from '../../lib/wms/materialCategoryTree';
import { DEFAULT_MARKUP_CONFIG } from '../../services/markupSettingsService';
import type { MaterialCategoryApiDto } from '../../types/wms';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';

interface AdminMarkupSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MarkupSettingsConfig;
  onSave: (newConfig: MarkupSettingsConfig) => Promise<void> | void;
  isSaving?: boolean;
}

function buildEditableCategories(
  dbCategories: MaterialCategoryApiDto[],
  savedCategories: CategoryMarkupItem[],
  fallbackPercent: number,
): CategoryMarkupItem[] {
  if (dbCategories.length === 0) {
    return savedCategories;
  }

  return dbCategories.map(dbCat => {
    const codeUpper = dbCat.code.trim().toUpperCase();
    const nameUpper = dbCat.name.trim().toUpperCase();
    const matched = savedCategories.find(
      saved =>
        saved.id.trim().toUpperCase() === codeUpper ||
        saved.name.trim().toUpperCase() === nameUpper,
    );

    return {
      id: dbCat.code,
      name: dbCat.name,
      percent: matched ? matched.percent : fallbackPercent,
      note: matched?.note,
    };
  });
}

export default function AdminMarkupSettingModal({
  isOpen,
  onClose,
  config,
  onSave,
  isSaving = false,
}: AdminMarkupSettingModalProps) {
  const { data: categoryTree = [], isLoading: categoriesLoading } = useCategoryTree();

  const dbLevel1Categories = useMemo(
    () => childrenOf(categoryTree, null).filter(c => c.code !== 'UNCATEGORIZED'),
    [categoryTree],
  );

  const [globalPercent, setGlobalPercent] = useState<number>(config.globalMarkupPercent);
  const [categories, setCategories] = useState<CategoryMarkupItem[]>(() =>
    buildEditableCategories(dbLevel1Categories, config.categories, config.globalMarkupPercent),
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDirty(false);
      return;
    }
    if (!dirty) {
      setGlobalPercent(config.globalMarkupPercent);
      setCategories(
        buildEditableCategories(dbLevel1Categories, config.categories, config.globalMarkupPercent),
      );
    }
  }, [isOpen, config, dbLevel1Categories, dirty]);

  const busy = saving || isSaving;

  const handleApplyGlobalToAll = () => {
    setDirty(true);
    setCategories(prev =>
      prev.map(c => ({
        ...c,
        percent: globalPercent,
      })),
    );
    showToast('info', `Đã gán ${globalPercent}% cho toàn bộ ${categories.length} nhóm hàng.`);
  };

  const handlePercentChange = (id: string, val: number) => {
    setDirty(true);
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, percent: clamped } : c)),
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setDirty(true);
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, note } : c)),
    );
  };

  const handleResetDefaults = () => {
    setDirty(true);
    const defaultPct = DEFAULT_MARKUP_CONFIG.globalMarkupPercent;
    setGlobalPercent(defaultPct);
    setCategories(prev => prev.map(c => ({ ...c, percent: defaultPct })));
    showToast('info', `Đã đặt lại mức Markup mặc định ${defaultPct}%.`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        globalMarkupPercent: globalPercent,
        categories,
        itemOverrides: config.itemOverrides,
      });
      showToast('success', 'Đã lưu cấu hình Hệ số Markup Quản Trị thành công!');
      onClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không lưu được cấu hình Hệ số Markup.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!busy) onClose(); }}
      title="Cài Đặt Hệ Số Markup Quản Trị Chào Thầu"
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--md-warning-container)] border border-[var(--tint-warning-border)] text-[var(--md-on-warning-container)]">
          <ShieldAlert className="w-5 h-5 mt-0.5 text-[var(--md-warning)] shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="font-semibold block text-sm mb-0.5">
              Khu vực Quản trị Biên Lợi Nhuận của Ban Lãnh Đạo
            </strong>
            Hệ số Markup (%) là tỷ lệ cộng thêm trên giá vốn mua vào để tính ra đơn giá chào thầu cho Dự án EPC.
            Kỹ sư và nhân viên dự án <strong>bị ẩn hoàn toàn cấu hình này</strong> và chỉ nhìn thấy đơn giá chào thầu cuối cùng.
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--md-outline-variant02)] bg-[var(--md-surface-container-low)] flex flex-wrap items-center justify-between gap-4">
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
                disabled={busy}
                className="form-input form-input-sm w-20 text-center font-bold text-[var(--md-warning)]"
                value={globalPercent}
                onChange={e => {
                  setDirty(true);
                  setGlobalPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)));
                }}
              />
              <span className="text-xs font-semibold">%</span>
            </div>
            <span className="text-xs text-[var(--md-on-surface-variant)]">
              (Hệ số: <strong>x{(1 + globalPercent / 100).toFixed(2)}</strong>)
            </span>
          </div>

          <Button
            type="button"
            variant="tonal"
            size="sm"
            leftIcon={Check}
            disabled={busy || categories.length === 0}
            onClick={handleApplyGlobalToAll}
            title="Gán hệ số chung cho tất cả các nhóm bên dưới"
          >
            Áp dụng cho tất cả nhóm
          </Button>
        </div>

        <div className="border border-[var(--md-outline-variant02)] rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky top-0 z-20 bg-[var(--md-surface)] border-b border-[var(--md-outline-variant02)] py-2.5 px-3 font-semibold text-[var(--md-on-surface)] shadow-sm">
                  Nhóm / Hệ Hàng
                </th>
                <th className="sticky top-0 z-20 bg-[var(--md-surface)] border-b border-[var(--md-outline-variant02)] py-2.5 px-3 font-semibold text-[var(--md-on-surface)] shadow-sm">
                  Định hướng & Ghi chú
                </th>
                <th className="sticky top-0 z-20 bg-[var(--md-surface)] border-b border-[var(--md-outline-variant02)] py-2.5 px-3 font-semibold text-center text-[var(--md-on-surface)] w-28 shadow-sm">
                  Markup (%)
                </th>
                <th className="sticky top-0 z-20 bg-[var(--md-surface)] border-b border-[var(--md-outline-variant02)] py-2.5 px-3 font-semibold text-right text-[var(--md-on-surface)] w-24 shadow-sm">
                  Hệ số
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-outline-variant02)]">
              {categoriesLoading && categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-[var(--md-on-surface-variant)]">
                    Đang tải danh mục nhóm hàng từ hệ thống...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-3 text-center text-[var(--md-on-surface-variant)]">
                    Chưa có danh mục nhóm hàng cấp 1 trong hệ thống. Hệ thống sẽ áp dụng Markup chung mặc định ({globalPercent}%).
                  </td>
                </tr>
              ) : (
                categories.map(cat => {
                  const multiplier = (1 + cat.percent / 100).toFixed(2);
                  return (
                    <tr key={cat.id} className="hover:bg-[var(--md-surface-container-low)] transition-colors">
                      <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                        <div className="flex items-center gap-1.5">
                          <span className="pur-item-badge pur-item-badge--material font-mono">
                            {cat.id}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[var(--md-on-surface-variant)] text-[length:var(--fs-xs)]">
                        <input
                          type="text"
                          disabled={busy}
                          className="form-input form-input-sm w-full"
                          placeholder="Ghi chú nhóm hàng..."
                          value={cat.note ?? ''}
                          onChange={e => handleNoteChange(cat.id, e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            disabled={busy}
                            className="form-input form-input-sm w-16 text-center font-bold text-[var(--md-warning)]"
                            value={cat.percent}
                            onChange={e => handlePercentChange(cat.id, Number(e.target.value) || 0)}
                          />
                          <span className="text-[length:var(--fs-xs)] font-medium">%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--md-on-surface)]">
                        x{multiplier}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] pt-1">
          <div>
            {config.updatedAt ? (
              <span>
                Cập nhật lần cuối: <strong>{new Date(config.updatedAt).toLocaleDateString('vi-VN')}</strong> bởi{' '}
                <strong>{config.updatedBy || 'BLĐ'}</strong>
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="text"
            size="sm"
            leftIcon={RotateCcw}
            disabled={busy}
            onClick={handleResetDefaults}
          >
            Khôi phục định mức mặc định
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-outline-variant02)]">
          <Button type="button" variant="outlined" size="sm" disabled={busy} onClick={onClose}>
            Đóng
          </Button>
          <Button type="button" variant="filled" size="sm" leftIcon={Save} disabled={busy} onClick={() => void handleSave()}>
            {busy ? 'Đang lưu...' : 'Lưu Cấu Hình Quản Trị'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
