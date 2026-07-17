import { useMemo, useState } from 'react';
import { ArrowDownUp, Download, Pencil, RefreshCw, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import Pagination from '../ui/Pagination';
import EditYcmhModal from './EditYcmhModal';
import { usePurchasingStore } from '../../lib/purchasing/purchasingStore';
import type { PurchaseRequestRow } from '../../data/purchasingMock';
import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS, type ListPageSize } from '../../constants/pagination';
import { showToast } from '../ui/Toast';

interface PlanYcmhHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

type SortKey = 'createdAt' | 'code' | 'requester' | 'status' | 'note' | 'orderStatusLabel';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** ERP list: cột ngày chỉ hiện dd/MM/yyyy */
function displayDocDate(createdAt: string): string {
  const m = createdAt.trim().match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
  return m ? m[1] : createdAt;
}

function PersonCell({ name }: { name: string }) {
  return (
    <div className="pur-ycmh-history__person">
      <span className="pur-ycmh-history__avatar" aria-hidden title={name}>
        {initials(name)}
      </span>
      <span className="pur-ycmh-history__person-name">{name}</span>
    </div>
  );
}

function statusBadgeClass(status: string): string {
  if (status === 'Kết thúc') return 'pur-ycmh-history__badge pur-ycmh-history__badge--ended';
  if (status === 'Đã Duyệt' || status === 'Đã duyệt') return 'pur-ycmh-history__badge pur-ycmh-history__badge--approved';
  if (status === 'Chờ duyệt' || status === 'Nháp') return 'pur-ycmh-history__badge pur-ycmh-history__badge--pending';
  return 'pur-ycmh-history__badge';
}

function orderStatusClass(label: string): string {
  if (/1 phần|một phần/i.test(label)) return 'pur-ycmh-history__po pur-ycmh-history__po--partial';
  if (/đủ|Đặt hàng đủ/i.test(label)) return 'pur-ycmh-history__po pur-ycmh-history__po--full';
  return 'pur-ycmh-history__po pur-ycmh-history__po--none';
}

function SortTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th>
      <button type="button" className="pur-ycmh-history__th-btn" onClick={onClick}>
        <span>{label}</span>
        <ArrowDownUp
          size={12}
          className={`pur-ycmh-history__sort${active ? ' pur-ycmh-history__sort--active' : ''}`}
          aria-hidden
          style={active && dir === 'desc' ? { transform: 'scaleY(-1)' } : undefined}
        />
      </button>
    </th>
  );
}

/** Modal lịch sử YCMH — UI bám ERP view_list_purchases. */
export default function PlanYcmhHistoryModal({ open, onClose }: PlanYcmhHistoryModalProps) {
  const { requests } = usePurchasingStore();
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editing, setEditing] = useState<PurchaseRequestRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = requests;
    if (q) {
      rows = requests.filter(r =>
        [r.code, r.requester, r.status, r.note, r.orderStatusLabel, r.orderCode, r.item, r.project]
          .some(v => (v ?? '').toLowerCase().includes(q)),
      );
    }
    const mul = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = (a[sortKey] ?? '').toString();
      const bv = (b[sortKey] ?? '').toString();
      return av.localeCompare(bv, 'vi') * mul;
    });
  }, [requests, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const editingLive = editing
    ? (requests.find(r => r.id === editing.id) ?? editing)
    : null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const resetSearch = () => {
    setQuery('');
    setPage(1);
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title="Lịch sử yêu cầu mua hàng"
        size="full"
        footer={(
          <div className="md-dialog__footer-actions">
            <button type="button" className="btn btn-outlined" onClick={onClose}>Thoát</button>
          </div>
        )}
      >
        <div className="pur-ycmh-history">
          <div className="pur-ycmh-history__toolbar">
            <div className="pur-ycmh-history__toolbar-left">
              <select
                className="pur-ycmh-history__pagesize"
                value={pageSize}
                aria-label="Số dòng mỗi trang"
                onChange={e => {
                  setPageSize(Number(e.target.value) as ListPageSize);
                  setPage(1);
                }}
              >
                {LIST_PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="button"
                className="pur-ycmh-history__export"
                onClick={() => showToast('info', `Xuất ${filtered.length} phiếu (UI demo).`)}
              >
                <Download size={14} aria-hidden />
                Xuất ra
              </button>
              <button
                type="button"
                className="pur-ycmh-history__icon-btn"
                aria-label="Làm mới"
                onClick={resetSearch}
              >
                <RefreshCw size={15} />
              </button>
            </div>
            <div className="pur-ycmh-history__search">
              <Search size={15} className="pur-ycmh-history__search-icon" aria-hidden />
              <input
                type="search"
                className="pur-ycmh-history__search-input"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder="Tìm kiếm"
                aria-label="Tìm kiếm"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)] py-6 text-center">
              Chưa có yêu cầu mua hàng.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto table-scroll">
                <table className="pur-ycmh-history__table">
                  <thead>
                    <tr>
                      <SortTh label="Ngày chứng từ" active={sortKey === 'createdAt'} dir={sortDir} onClick={() => toggleSort('createdAt')} />
                      <SortTh label="Mã chứng từ" active={sortKey === 'code'} dir={sortDir} onClick={() => toggleSort('code')} />
                      <SortTh label="Người đề nghị" active={sortKey === 'requester'} dir={sortDir} onClick={() => toggleSort('requester')} />
                      <SortTh label="Trạng thái" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
                      <SortTh label="Ghi chú" active={sortKey === 'note'} dir={sortDir} onClick={() => toggleSort('note')} />
                      <SortTh label="Trạng thái đơn hàng" active={sortKey === 'orderStatusLabel'} dir={sortDir} onClick={() => toggleSort('orderStatusLabel')} />
                      <th className="pur-ycmh-history__act-h">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(r => (
                      <tr key={r.id}>
                        <td className="pur-ycmh-history__date">{displayDocDate(r.createdAt)}</td>
                        <td className="pur-ycmh-history__code">{r.code}</td>
                        <td>
                          <PersonCell name={r.requester} />
                        </td>
                        <td>
                          <div className="pur-ycmh-history__status">
                            <span className={statusBadgeClass(r.status)}>{r.status}</span>
                            {r.confirmedBy ? (
                              <div className="pur-ycmh-history__confirm">
                                <span>Xác nhận :</span>
                                <PersonCell name={r.confirmedBy} />
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="pur-ycmh-history__note">{r.note || ''}</td>
                        <td className="pur-ycmh-history__po-cell">
                          <button
                            type="button"
                            className={orderStatusClass(r.orderStatusLabel)}
                            title={r.orderCode ?? undefined}
                            onClick={() => {
                              if (r.orderCode) showToast('info', `Xem ${r.orderCode} (UI demo).`);
                            }}
                          >
                            {r.orderStatusLabel}
                          </button>
                        </td>
                        <td className="pur-ycmh-history__act">
                          <button
                            type="button"
                            className="pur-ycmh-history__edit"
                            title={`Sửa ${r.code}`}
                            aria-label={`Sửa ${r.code}`}
                            onClick={() => setEditing(r)}
                          >
                            <Pencil size={13} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                embedded
                itemLabel="phiếu"
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                totalItems={filtered.length}
              />
            </>
          )}
        </div>
      </Modal>

      <EditYcmhModal
        open={Boolean(editing)}
        request={editingLive}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
