import { Link } from 'react-router-dom';
import {
  Award,
  Banknote,
  ClipboardList,
  ExternalLink,
  Plus,
  Star,
  Users,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import SupplierAttachmentUploader from '../../../components/suppliers/SupplierAttachmentUploader';
import { useSupplierContacts } from '../../../hooks/useSupplierDirectory';
import { normalizeSupplierApproval, SUPPLIER_APPROVAL } from '../../../lib/suppliers/supplierStatus';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import {
  ApprovalStatusBadge,
  DetailField,
  RatingBadge,
  type SupplierRow,
} from './SupplierShared';

function SupplierViewingContacts({
  supplierId,
  onAddContact,
}: {
  supplierId: number;
  onAddContact: () => void;
}) {
  const { data, isLoading } = useSupplierContacts({ supplierId, pageSize: 50 });
  const contacts = data?.items ?? [];

  return (
    <div className="space-y-2.5 mt-3 pt-3 border-t border-[var(--md-outline-variant)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
          <Users size={15} className="text-primary-600 dark:text-primary-400" />
          Danh sách Người liên hệ ({contacts.length})
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outlined"
            size="sm"
            onClick={onAddContact}
            className="text-xs"
          >
            <Plus size={13} className="mr-1" /> Thêm liên hệ
          </Button>
          <Link
            to={`/suppliers/contacts?supplierId=${supplierId}`}
            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
          >
            Quản lý <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-[var(--md-on-surface-variant)] py-3 text-center">
          Đang tải danh sách người liên hệ...
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-3 text-center text-xs text-[var(--md-on-surface-variant)] border border-dashed rounded-lg">
          Chưa có thông tin người liên hệ nào cho NCC này. Bấm &quot;Thêm liên hệ&quot; để bổ sung trực tiếp.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg border-[var(--md-outline-variant)]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--md-surface-variant)]/40 text-[var(--md-on-surface-variant)]">
              <tr>
                <th className="py-2 px-3">Họ tên</th>
                <th className="py-2 px-3">Chức vụ</th>
                <th className="py-2 px-3">Điện thoại</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3 text-center">Vai trò</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-outline-variant)]">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-[var(--md-surface-variant)]/20">
                  <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                    <div className="flex items-center gap-1.5">
                      {c.fullName}
                      {c.role === 'primary' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                          <Star size={10} className="fill-amber-500 text-amber-500" /> Chính
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-[var(--md-on-surface-variant)]">{c.position || '—'}</td>
                  <td className="py-2 px-3 font-mono text-[var(--md-on-surface)]">{c.phone || '—'}</td>
                  <td className="py-2 px-3 text-[var(--md-on-surface-variant)]">{c.email || '—'}</td>
                  <td className="py-2 px-3 text-center text-[var(--md-on-surface-variant)]">
                    {c.roleLabel || c.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface SupplierDetailModalProps {
  viewing: SupplierRow | null;
  canApproveSupplier: boolean;
  openingEdit: boolean;
  onClose: () => void;
  onOpenBlacklist: (supplier: SupplierRow) => void;
  onApprove: (supplier: SupplierRow) => void;
  onReject: (supplier: SupplierRow) => void;
  onEdit: (supplier: SupplierRow) => void;
  onAddContact: () => void;
  onAttachmentChanged: () => void;
}

export default function SupplierDetailModal({
  viewing,
  canApproveSupplier,
  openingEdit,
  onClose,
  onOpenBlacklist,
  onApprove,
  onReject,
  onEdit,
  onAddContact,
  onAttachmentChanged,
}: SupplierDetailModalProps) {
  return (
    <Modal
      isOpen={viewing !== null}
      onClose={onClose}
      title={viewing ? `Chi tiết · ${viewing.supplierCode}` : 'Chi tiết nhà cung cấp'}
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          {viewing ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onOpenBlacklist(viewing)}
            >
              Thêm vào blacklist
            </button>
          ) : null}
          {viewing && canApproveSupplier
          && normalizeSupplierApproval(viewing.approvalStatus) !== SUPPLIER_APPROVAL.Approved ? (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onReject(viewing)}
              >
                Từ chối
              </button>
              <button
                type="button"
                className="btn btn-filled"
                onClick={() => onApprove(viewing)}
              >
                Duyệt NCC
              </button>
            </>
          ) : null}
          {viewing ? (
            <button
              type="button"
              className="btn btn-filled"
              disabled={openingEdit}
              onClick={() => onEdit(viewing)}
            >
              Sửa
            </button>
          ) : null}
        </>
      }
    >
      {viewing ? (
        <div>
          {/* 360° Action Hub */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 mb-4 rounded-xl bg-[var(--md-surface-variant05)] border border-[var(--md-outline-variant)]">
            <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] mr-1">360° Hub:</span>
            <Link
              to={`/suppliers/debt?supplierId=${viewing.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <Banknote size={14} className="text-emerald-600 dark:text-emerald-400" />
              Công nợ &amp; DNTT
            </Link>
            <Link
              to={`/purchasing/orders?search=${encodeURIComponent(viewing.supplierCode)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <ClipboardList size={14} className="text-blue-600 dark:text-blue-400" />
              Đơn mua hàng PO
            </Link>
            <Link
              to={`/suppliers/evaluations?supplierId=${viewing.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <Award size={14} className="text-amber-600 dark:text-amber-400" />
              Đánh giá &amp; Thăng hạng
            </Link>
          </div>

          <div className="ncc-master-detail-grid">
            <DetailField label="Mã NCC">{viewing.supplierCode}</DetailField>
            <DetailField label="Hạng">
              <RatingBadge rating={viewing.rating} />
            </DetailField>
            <DetailField label="Trạng thái">
              <ApprovalStatusBadge status={viewing.approvalStatus} />
            </DetailField>
            <DetailField label="Tên nhà cung cấp" span>{viewing.supplierName}</DetailField>
            <DetailField label="Loại hình đối tác">{viewing.supplierType || '—'}</DetailField>
            <DetailField label="Phạm vi">{viewing.scope || '—'}</DetailField>
            <DetailField label="Mã số thuế (MST)">{viewing.taxCode || '—'}</DetailField>
            <DetailField label="Người liên hệ chính">
              {viewing.primaryContact ? (
                <div>
                  <div className="font-semibold text-[var(--md-on-surface)] flex items-center gap-1.5">
                    {viewing.primaryContact.fullName}
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                      <Star size={10} className="fill-amber-500 text-amber-500" /> Chính
                    </span>
                  </div>
                  <div className="text-xs text-[var(--md-on-surface-variant)] mt-0.5">
                    {viewing.primaryContact.position ? `${viewing.primaryContact.position} · ` : ''}
                    {viewing.primaryContact.phone || viewing.contactPhone || ''}
                    {viewing.primaryContact.email ? ` · ${viewing.primaryContact.email}` : ''}
                  </div>
                </div>
              ) : (
                viewing.contactPhone || '—'
              )}
            </DetailField>
            <DetailField label="Website" span>
              {viewing.website ? (
                <a
                  href={viewing.website.startsWith('http') ? viewing.website : `https://${viewing.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                >
                  {viewing.website}
                </a>
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Hạn công nợ">
              <div className="flex items-center justify-between gap-2">
                <span>{viewing.maxDebtDays} ngày</span>
                <Link
                  to={`/suppliers/debt?supplierId=${viewing.id}`}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                >
                  Xem bảng kê công nợ <ExternalLink size={11} />
                </Link>
              </div>
            </DetailField>
            <DetailField label="Hạn mức công nợ">
              <div className="flex items-center justify-between gap-2">
                <span>{viewing.creditLimit ? formatCurrencyFull(viewing.creditLimit) : 'Không giới hạn'}</span>
                <Link
                  to={`/suppliers/debt?supplierId=${viewing.id}`}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                >
                  Xem bảng kê công nợ <ExternalLink size={11} />
                </Link>
              </div>
            </DetailField>
            <DetailField label="Điều khoản thanh toán" span>
              {viewing.paymentTerms || '—'}
            </DetailField>
            <DetailField label={`Nhóm ngành hàng (${viewing.industryGroups?.length ?? 0})`} span>
              {(viewing.industryGroups?.length ?? 0) > 0 ? (
                <div className="ncc-master-groups" style={{ maxWidth: '100%' }}>
                  {viewing.industryGroups.map(group => (
                    <span key={group} className="ncc-master-groups__chip">{group}</span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </DetailField>
            <DetailField label="Doanh số đã mua">
              <div className="flex items-center justify-between gap-2">
                <span>{formatCurrencyFull(viewing.purchasedRevenue)}</span>
                <Link
                  to={`/purchasing/orders?search=${encodeURIComponent(viewing.supplierCode)}`}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                >
                  Xem đơn hàng PO <ExternalLink size={11} />
                </Link>
              </div>
            </DetailField>
            <DetailField label="Đánh giá định kỳ gần nhất">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {viewing.latestEvaluation
                    ? `${viewing.latestEvaluation.period} · ${viewing.latestEvaluation.gradeLabel || viewing.latestEvaluation.grade} · ${viewing.latestEvaluation.evaluatedAt}`
                    : '—'}
                </span>
                <Link
                  to={`/suppliers/evaluations?supplierId=${viewing.id}&tab=kpi`}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
                >
                  Lịch sử đánh giá <ExternalLink size={11} />
                </Link>
              </div>
            </DetailField>
            <DetailField label="Điểm KPI gần nhất">
              {viewing.latestEvaluation ? viewing.latestEvaluation.score : '—'}
            </DetailField>

            {/* Attachments Section */}
            <div className="ncc-master-detail-span pt-3 mt-2 border-t border-[var(--md-outline-variant)]">
              <SupplierAttachmentUploader
                supplierId={viewing.id}
                initialAttachments={viewing.attachments ?? []}
                onAttachmentChanged={onAttachmentChanged}
              />
            </div>

            {/* Contacts Section */}
            <div className="ncc-master-detail-span">
              <SupplierViewingContacts
                supplierId={viewing.id}
                onAddContact={onAddContact}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
