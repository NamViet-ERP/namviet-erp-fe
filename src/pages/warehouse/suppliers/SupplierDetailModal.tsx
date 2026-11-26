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

function PrimaryContactBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[length:var(--fs-micro)] font-semibold text-[var(--md-on-warning-container)] bg-[var(--md-warning-container)] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--tint-warning-border)]">
      <Star size={10} className="fill-current text-[var(--md-warning)]" /> Chính
    </span>
  );
}

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
        <span className="text-[length:var(--fs-xs)] font-bold uppercase tracking-wider text-[var(--md-on-surface)] flex items-center gap-1.5">
          <Users size={15} className="text-[var(--md-primary)]" />
          Danh sách Người liên hệ ({contacts.length})
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outlined"
            size="sm"
            leftIcon={Plus}
            onClick={onAddContact}
          >
            Thêm liên hệ
          </Button>
          <Link
            to={`/suppliers/contacts?supplierId=${supplierId}`}
            className="text-[length:var(--fs-xs)] text-[var(--md-primary)] hover:underline flex items-center gap-1"
          >
            Quản lý <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] py-3 text-center">
          Đang tải danh sách người liên hệ...
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-3 text-center text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] border border-dashed border-[var(--md-outline-variant)] rounded-lg">
          Chưa có thông tin người liên hệ nào cho NCC này. Bấm &quot;Thêm liên hệ&quot; để bổ sung trực tiếp.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg border-[var(--md-outline-variant)]">
          <table className="w-full text-[length:var(--fs-xs)] text-left">
            <thead className="bg-[var(--md-surface-container-low)] text-[var(--md-on-surface-variant)]">
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
                <tr key={c.id} className="hover:bg-[var(--tint-primary-weak)]">
                  <td className="py-2 px-3 font-medium text-[var(--md-on-surface)]">
                    <div className="flex items-center gap-1.5">
                      {c.fullName}
                      {c.role === 'primary' && <PrimaryContactBadge />}
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
          <Button type="button" variant="outlined" size="sm" onClick={onClose}>
            Đóng
          </Button>
          {viewing ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onOpenBlacklist(viewing)}
            >
              Thêm vào blacklist
            </Button>
          ) : null}
          {viewing && canApproveSupplier
          && normalizeSupplierApproval(viewing.approvalStatus) !== SUPPLIER_APPROVAL.Approved ? (
            <>
              <Button
                type="button"
                variant="outlined"
                size="sm"
                onClick={() => onReject(viewing)}
              >
                Từ chối
              </Button>
              <Button
                type="button"
                variant="filled"
                size="sm"
                onClick={() => onApprove(viewing)}
              >
                Duyệt NCC
              </Button>
            </>
          ) : null}
          {viewing ? (
            <Button
              type="button"
              variant="filled"
              size="sm"
              disabled={openingEdit}
              onClick={() => onEdit(viewing)}
            >
              Sửa
            </Button>
          ) : null}
        </>
      }
    >
      {viewing ? (
        <div>
          {/* 360° Action Hub */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 mb-4 rounded-xl bg-[var(--md-surface-variant05)] border border-[var(--md-outline-variant)]">
            <span className="text-[length:var(--fs-xs)] font-semibold text-[var(--md-on-surface-variant)] mr-1">
              360° Hub:
            </span>
            <Link
              to={`/suppliers/debt?supplierId=${viewing.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--fs-xs)] font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <Banknote size={14} className="text-[var(--md-success)]" />
              Công nợ &amp; DNTT
            </Link>
            <Link
              to={`/purchasing/orders?search=${encodeURIComponent(viewing.supplierCode)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--fs-xs)] font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <ClipboardList size={14} className="text-[var(--md-primary)]" />
              Đơn mua hàng PO
            </Link>
            <Link
              to={`/suppliers/evaluations?supplierId=${viewing.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--fs-xs)] font-medium rounded-full bg-[var(--md-surface)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] hover:bg-[var(--md-primary-container)] hover:text-[var(--md-on-primary-container)] hover:border-[var(--md-primary)] transition-colors"
            >
              <Award size={14} className="text-[var(--md-warning)]" />
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
                    <PrimaryContactBadge />
                  </div>
                  <div className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] mt-0.5">
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
                  className="text-[var(--md-primary)] hover:underline font-mono text-[length:var(--fs-xs)]"
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
                  className="text-[length:var(--fs-xs)] text-[var(--md-primary)] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
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
                  className="text-[length:var(--fs-xs)] text-[var(--md-primary)] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
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
                  className="text-[length:var(--fs-xs)] text-[var(--md-primary)] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
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
                  className="text-[length:var(--fs-xs)] text-[var(--md-primary)] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap"
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
