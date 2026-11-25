import type { ComponentProps } from 'react';
import {
  CheckCircle2,
  CopyPlus,
  Eye,
  FolderLock,
  FolderOpen,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { DropdownItem } from '../../../types';
import type { PurchasePlanApiDto } from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import {
  planApprovalMeta,
  planStatusBadgeClass,
  planStatusLabel,
} from './planStatusHelpers';

interface PurchasePlansTableProps {
  items: PurchasePlanApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  emptyMessage: string;
  isAdhoc: boolean;
  codeLabel: string;
  detailBase: string;
  canSubmit: boolean;
  canApproveL1: boolean;
  canApproveL2: boolean;
  canReject: boolean;
  canRemake: boolean;
  onNavigateDetail: (code: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (code: string) => void;
  onRequestDelete: (code: string) => void;
  onRequestClose: (code: string) => void;
  onRequestReject: (code: string) => void;
  onReopen: (code: string) => void;
  onSubmitPlan: (code: string) => void;
  onApproveL1: (code: string) => void;
  onApproveL2: (code: string) => void;
  onRemakePlan: (code: string) => void;
  pagination?: ComponentProps<typeof Pagination>;
}

export default function PurchasePlansTable({
  items,
  isLoading,
  errorMessage,
  emptyMessage,
  isAdhoc,
  codeLabel,
  detailBase,
  canSubmit,
  canApproveL1,
  canApproveL2,
  canReject,
  canRemake,
  onNavigateDetail,
  onOpenCreate,
  onOpenEdit,
  onRequestDelete,
  onRequestClose,
  onRequestReject,
  onReopen,
  onSubmitPlan,
  onApproveL1,
  onApproveL2,
  onRemakePlan,
  pagination,
}: PurchasePlansTableProps) {
  return (
    <TableShell
      tableClassName="pur-erp__table pur-erp__table--plans-list"
      colSpan={10}
      loading={isLoading}
      skeletonRows={8}
      error={errorMessage}
      isEmpty={items.length === 0}
      emptyMessage={emptyMessage}
      emptyAction={(
        <Button type="button" variant="filled" size="sm" onClick={onOpenCreate}>
          {isAdhoc ? 'Tạo phiếu phát sinh' : 'Tạo KHMH'}
        </Button>
      )}
      pagination={pagination}
      header={(
        <tr>
          <th>Ngày tạo</th>
          <th>{codeLabel}</th>
          <th>Dự án</th>
          <th className="pur-erp__th-num">Dự toán</th>
          <th className="pur-erp__th-num">Đề xuất</th>
          <th className="pur-erp__th-num">Mua hàng</th>
          <th className="pur-erp__th-num">Tổng chi</th>
          <th className="pur-erp__th-status">Trạng thái</th>
          <th>Ghi chú</th>
          <th className="pur-erp__th-actions">Tác vụ</th>
        </tr>
      )}
    >
      {items.map(row => {
        const isDraft = row.status === 'draft';
        const isPendingL1 = row.status === 'pending_l1';
        const isPendingL2 = row.status === 'pending_l2';
        const isApproved = row.status === 'approved' || row.status === 'active';
        const isRejected = row.status === 'rejected';
        const isClosed = row.status === 'closed';
        const approvalMeta = planApprovalMeta(row);

        const actionItems: DropdownItem[] = [
          {
            label: 'Xem chi tiết',
            icon: Eye,
            onClick: () => onNavigateDetail(row.code),
          },
          ...(isDraft && canSubmit
            ? [{ label: 'Gửi duyệt', icon: Send, onClick: () => onSubmitPlan(row.code) }]
            : []),
          ...(isPendingL1 && canApproveL1
            ? [{ label: 'Duyệt cấp 1', icon: CheckCircle2, onClick: () => onApproveL1(row.code) }]
            : []),
          ...(isPendingL2 && canApproveL2
            ? [{ label: 'Duyệt cấp 2', icon: CheckCircle2, onClick: () => onApproveL2(row.code) }]
            : []),
          ...((isPendingL1 || isPendingL2) && canReject
            ? [{ label: 'Từ chối', icon: XCircle, danger: true, onClick: () => onRequestReject(row.code) }]
            : []),
          ...(isRejected && canRemake
            ? [{ label: 'Lập phiếu mới', icon: CopyPlus, onClick: () => onRemakePlan(row.code) }]
            : []),
          ...(isClosed
            ? [{ label: 'Mở lại', icon: FolderOpen, onClick: () => onReopen(row.code) }]
            : []),
          ...(isApproved
            ? [{ label: 'Đóng', icon: FolderLock, danger: true, onClick: () => onRequestClose(row.code) }]
            : []),
          ...(isDraft
            ? [
                { label: 'Sửa', icon: Pencil, onClick: () => onOpenEdit(row.code) },
                { label: 'Xóa', icon: Trash2, danger: true, onClick: () => onRequestDelete(row.code) },
              ]
            : []),
        ];

        const rowClasses = [
          'pur-erp__row-clickable cursor-pointer',
          isRejected ? 'pur-erp__row--rejected' : '',
        ].filter(Boolean).join(' ');

        return (
          <tr
            key={row.code}
            className={rowClasses}
            role="button"
            tabIndex={0}
            title={`Nhấn để xem chi tiết ${row.code}`}
            onClick={() => onNavigateDetail(row.code)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateDetail(row.code);
              }
            }}
          >
            <td className="tabular-nums">{formatDateTimeVi(row.createdAt) ?? '-'}</td>
            <td className="pur-erp__td-code" onClick={e => e.stopPropagation()}>
              <EntityCodeLink
                code={row.code}
                to={`${detailBase}/${encodeURIComponent(row.code)}`}
              />
            </td>
            <td className="pur-erp__td-project">
              {row.projectName
                ? `${row.projectName} (${row.projectCode})`
                : (row.projectCode || '-')}
            </td>
            <td className="pur-erp__td-num">{formatCurrency(row.budgetTotal)} (VNĐ)</td>
            <td className="pur-erp__td-num">{formatCurrency(row.proposalTotal)} (VNĐ)</td>
            <td className="pur-erp__td-num">{formatCurrency(row.purchaseTotal)} (VNĐ)</td>
            <td className="pur-erp__td-num">{formatCurrency(row.paidTotal)} (VNĐ)</td>
            <td className="pur-erp__td-status">
              <div className="pur-plan-status-cell">
                <span className={`pur-plan-status ${planStatusBadgeClass(row.status)}`}>
                  {planStatusLabel(row.status)}
                </span>
                {approvalMeta ? (
                  <div className="pur-plan-status-meta">
                    {approvalMeta.approvedTime ? (
                      <div className="tabular-nums">{approvalMeta.approvedTime}</div>
                    ) : null}
                    {approvalMeta.approver ? (
                      <div className="pur-plan-status-meta__name" title={approvalMeta.approver}>
                        {approvalMeta.approver}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {isRejected && row.rejectReason ? (
                  <div className="pur-erp__muted text-xs mt-1">{row.rejectReason}</div>
                ) : null}
              </div>
            </td>
            <td className="pur-erp__td-note">{row.note || '-'}</td>
            <td className="pur-erp__td-actions" onClick={e => e.stopPropagation()}>
              <Dropdown items={actionItems} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}
