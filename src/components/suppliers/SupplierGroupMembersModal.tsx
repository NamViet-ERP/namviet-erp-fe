import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import SearchBar from '../ui/SearchBar';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useSupplierGroupMembers } from '../../hooks/useSupplierDirectory';
import type { SupplierApiDto } from '../../services/suppliersService';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';

interface SupplierGroupMembersModalProps {
  group: SupplierGroupApiDto | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (supplierIds: number[]) => void;
}

const SIZE = 'xl' as const;

function title(group: SupplierGroupApiDto | null) {
  return group ? `Gán nhà cung cấp — ${group.name}` : 'Gán nhà cung cấp';
}

export default function SupplierGroupMembersModal({
  group,
  isSaving,
  onClose,
  onSubmit,
}: SupplierGroupMembersModalProps) {
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers({ all: true });
  const { data: members, isLoading: loadingMembers } = useSupplierGroupMembers(group?.id ?? null);

  if (group && (loadingSuppliers || loadingMembers || !suppliers || !members)) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={title(group)}
        size={SIZE}
        footer={<button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>}
      >
        <Skeleton variant="rect" height={36} count={6} />
      </Modal>
    );
  }

  return (
    <Modal isOpen={group !== null} onClose={onClose} title={title(group)} size={SIZE} footer={null}>
      {group && suppliers && members ? (
        <MembersPicker
          suppliers={suppliers.items}
          initialSelected={members.map(m => m.supplierId)}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

interface MembersPickerProps {
  suppliers: SupplierApiDto[];
  /** Chỉ đọc lúc mount — modal đóng lại là remount nên không cần đồng bộ qua effect. */
  initialSelected: number[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (supplierIds: number[]) => void;
}

function MembersPicker({
  suppliers,
  initialSelected,
  isSaving,
  onClose,
  onSubmit,
}: MembersPickerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>(initialSelected);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      s => s.supplierName.toLowerCase().includes(q) || s.supplierCode.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const toggle = (id: number) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm mã NCC, tên nhà cung cấp…" />

      {rows.length === 0 ? (
        <EmptyState
          message={
            search
              ? 'Không tìm thấy NCC phù hợp.'
              : 'Chưa có nhà cung cấp nào để gán. Thêm NCC ở mục Nhà cung cấp trước.'
          }
        />
      ) : (
        <ul className="max-h-[52vh] overflow-y-auto divide-y divide-[var(--md-outline-variant)]">
          {rows.map(s => (
            <li key={s.id}>
              <label className="flex items-center gap-3 px-1 py-2 text-sm cursor-pointer hover:bg-[var(--md-surface-container-high)]">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="font-mono text-xs font-semibold w-28 shrink-0 truncate">
                  {s.supplierCode}
                </span>
                <span className="truncate">{s.supplierName}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--md-outline-variant)]">
        <span className="text-xs text-[var(--md-on-surface-variant)] mr-auto tabular-nums">
          Đã chọn {selected.length} NCC
        </span>
        <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
        <button
          type="button"
          className="btn btn-filled"
          disabled={isSaving}
          onClick={() => onSubmit(selected)}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
