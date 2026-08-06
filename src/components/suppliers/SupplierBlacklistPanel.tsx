import { useMemo, useState } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import {
  useRemoveSupplierBlacklist,
  useSupplierBlacklist,
} from '../../hooks/useSupplierDirectory';
import type { SupplierBlacklistApiDto } from '../../types/api/supplierDirectoryApi';

type Props = {
  /** Khi true: bỏ padding/help ngoài (page layout đã bọc). */
  embedded?: boolean;
};

export default function SupplierBlacklistPanel({ embedded = false }: Props) {
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<SupplierBlacklistApiDto | null>(null);

  const { data, isLoading, isError } = useSupplierBlacklist();
  const removeMutation = useRemoveSupplierBlacklist();

  const items = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(row =>
      [row.supplierCode, row.supplierName, row.blacklistReason, row.blacklistedByName]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [data, search]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.id);
      showToast('success', `Đã gỡ blacklist: ${removeTarget.supplierName}`);
      setRemoveTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể gỡ blacklist'));
    }
  };

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-4 p-4'}>
      {!embedded ? (
        <p className="text-sm text-pretty rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2 text-[var(--md-on-surface-variant)]">
          Danh sách NCC bị hạn chế hợp tác. Gỡ blacklist khi đã xử lý xong rủi ro và muốn tiếp tục mua hàng.
        </p>
      ) : null}

      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã, tên NCC, lý do…"
          />
        </div>
      </div>

      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--750">
          <thead>
            <tr>
              <th className="table-header-cell">Mã NCC</th>
              <th className="table-header-cell">Tên NCC</th>
              <th className="table-header-cell">Điện thoại</th>
              <th className="table-header-cell">Xếp hạng</th>
              <th className="table-header-cell">Lý do</th>
              <th className="table-header-cell">Người blacklist</th>
              <th className="table-header-cell">Thời điểm</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={8} />
            ) : isError ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message="Không tải được danh sách blacklist." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    message={
                      search.trim()
                        ? 'Không tìm thấy NCC phù hợp.'
                        : 'Chưa có NCC trong blacklist. Thêm từ tab Nhà cung cấp → tác vụ «Thêm vào blacklist».'
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell whitespace-nowrap font-mono text-sm">{row.supplierCode}</td>
                  <td className="table-cell font-semibold">{row.supplierName}</td>
                  <td className="table-cell whitespace-nowrap">{row.contactPhone || '—'}</td>
                  <td className="table-cell text-center">{row.rating || '—'}</td>
                  <td className="table-cell max-w-[240px]">
                    <span className="line-clamp-2" title={row.blacklistReason || undefined}>
                      {row.blacklistReason || '—'}
                    </span>
                  </td>
                  <td className="table-cell">{row.blacklistedByName || '—'}</td>
                  <td className="table-cell whitespace-nowrap tabular-nums text-sm">
                    {formatDateTimeVi(row.blacklistedAt)}
                  </td>
                  <td className="table-cell text-center">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setRemoveTarget(row)}
                    >
                      Gỡ blacklist
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        title="Gỡ khỏi blacklist?"
        message={
          removeTarget
            ? `Cho phép tiếp tục hợp tác với «${removeTarget.supplierName}»?`
            : ''
        }
        confirmLabel="Gỡ blacklist"
        onConfirm={() => void handleRemove()}
        onClose={() => setRemoveTarget(null)}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
