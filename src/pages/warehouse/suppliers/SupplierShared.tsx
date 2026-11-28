import type { ReactNode } from 'react';
import { getApiErrorMessage, getApiFieldErrors } from '../../../lib/apiClient';
import { groupIndustryTags } from '../../../lib/suppliers/supplierGroupTree';
import {
  normalizeSupplierApproval,
  isSameSupplierName,
  parseCreditLimit,
  parseMaxDebtDays,
  restrictVnPhoneInput,
  supplierGradeLabel,
  SUPPLIER_APPROVAL,
  SUPPLIER_LIMITS,
  validateOptionalVietnamPhone,
} from '../../../lib/suppliers/supplierStatus';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { UpsertSupplierRequest } from '../../../types/wms';

// eslint-disable-next-line react-refresh/only-export-components
export const RATING_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const GROUPS_VISIBLE_IN_TABLE = 3;
export const COL_COUNT = 9;

export type FormErrors = Partial<
  Record<
    | 'supplierCode'
    | 'supplierName'
    | 'taxCode'
    | 'contactPhone'
    | 'maxDebtDays'
    | 'creditLimit'
    | 'paymentTerms',
    string
  >
>;
export type SupplierRow = SupplierApiDto;

// eslint-disable-next-line react-refresh/only-export-components
export const emptyForm = {
  supplierCode: '',
  supplierName: '',
  taxCode: '',
  contactPhone: '',
  contactName: '',
  contactEmail: '',
  contactPosition: '',
  supplierType: 'Nhà phân phối',
  scope: 'Trong nước',
  website: '',
  maxDebtDays: '30',
  creditLimit: '',
  paymentTerms: '',
  groupIds: [] as number[],
};

export type SupplierFormState = typeof emptyForm;

export type ValidateSupplierFormResult =
  | { ok: true; errors: FormErrors; body: UpsertSupplierRequest }
  | { ok: false; errors: FormErrors };

// eslint-disable-next-line react-refresh/only-export-components
export function mapSupplierSaveErrors(err: unknown): FormErrors {
  const fromApi = getApiFieldErrors(err);
  const next: FormErrors = {};
  for (const [key, message] of Object.entries(fromApi)) {
    if (key in emptyForm || key === 'supplierCode') next[key as keyof FormErrors] = message;
  }

  const message = getApiErrorMessage(err, '');
  const lower = message.toLowerCase();
  if (!next.taxCode && (lower.includes('mã số thuế') || lower.includes('mst') || lower.includes('taxcode'))) {
    next.taxCode = message;
  }
  if (!next.contactPhone && (lower.includes('điện thoại') || lower.includes('sđt'))) {
    next.contactPhone = message;
  }
  if (!next.supplierName && (lower.includes('tên nhà cung cấp') || lower.includes('đã tồn tại'))) {
    next.supplierName = message;
  }
  if (!next.maxDebtDays && lower.includes('hạn công nợ')) {
    next.maxDebtDays = message;
  }
  if (!next.creditLimit && lower.includes('hạn mức')) {
    next.creditLimit = message;
  }
  return next;
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateSupplierForm(
  form: SupplierFormState,
  items: SupplierRow[],
  editingId?: number,
): ValidateSupplierFormResult {
  const supplierCode = form.supplierCode.trim();
  const supplierName = form.supplierName.trim();
  const taxCode = form.taxCode.trim();
  const paymentTerms = form.paymentTerms.trim();
  const errors: FormErrors = {};

  if (supplierCode) {
    if (supplierCode.length > SUPPLIER_LIMITS.codeMax) {
      errors.supplierCode = `Mã nhà cung cấp tối đa ${SUPPLIER_LIMITS.codeMax} ký tự.`;
    } else if (
      items.some(s => s.id !== editingId && s.supplierCode.toLowerCase() === supplierCode.toLowerCase())
    ) {
      errors.supplierCode = 'Mã nhà cung cấp đã tồn tại.';
    }
  }

  if (!supplierName) errors.supplierName = 'Tên nhà cung cấp là bắt buộc.';
  else if (supplierName.length > SUPPLIER_LIMITS.nameMax) {
    errors.supplierName = `Tên nhà cung cấp tối đa ${SUPPLIER_LIMITS.nameMax} ký tự.`;
  } else if (
    items.some(s => s.id !== editingId && isSameSupplierName(s.supplierName, supplierName))
  ) {
    errors.supplierName = 'Tên nhà cung cấp đã tồn tại.';
  }

  if (taxCode.length > 50) {
    errors.taxCode = 'Mã số thuế tối đa 50 ký tự.';
  }

  const contactPhone = restrictVnPhoneInput(form.contactPhone);
  const phoneError = validateOptionalVietnamPhone(contactPhone);
  if (phoneError) errors.contactPhone = phoneError;

  const debt = parseMaxDebtDays(form.maxDebtDays);
  if (!debt.ok) errors.maxDebtDays = debt.error;

  const limit = parseCreditLimit(form.creditLimit);
  if (!limit.ok) errors.creditLimit = limit.error;

  if (paymentTerms.length > SUPPLIER_LIMITS.paymentTermsMax) {
    errors.paymentTerms = `Điều khoản thanh toán tối đa ${SUPPLIER_LIMITS.paymentTermsMax} ký tự.`;
  }

  if (Object.keys(errors).length > 0 || !debt.ok || !limit.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors,
    body: {
      supplierCode: supplierCode || null,
      supplierName,
      taxCode: taxCode || null,
      contactPhone: contactPhone || null,
      contactName: form.contactName.trim() || null,
      contactPosition: form.contactPosition.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      supplierType: form.supplierType || null,
      scope: form.scope || null,
      website: form.website.trim() || null,
      maxDebtDays: debt.value,
      creditLimit: limit.value,
      paymentTerms: paymentTerms || null,
    },
  };
}

export function RatingBadge({ rating }: { rating?: string | null }) {
  return (
    <span className="hrm-badge hrm-badge--neutral">Hạng {supplierGradeLabel(rating)}</span>
  );
}

export function ApprovalStatusBadge({ status }: { status?: string | null }) {
  const value = normalizeSupplierApproval(status);
  if (value === SUPPLIER_APPROVAL.New) {
    return <span className="hrm-badge hrm-badge--warning">Mới - chờ duyệt</span>;
  }
  if (value === SUPPLIER_APPROVAL.Rejected) {
    return <span className="hrm-badge hrm-badge--danger">Từ chối</span>;
  }
  return <span className="hrm-badge hrm-badge--success">Đã duyệt</span>;
}

export function IndustryGroupsCell({ groups }: { groups: string[] }) {
  const clusters = groupIndustryTags(groups);
  if (clusters.length === 0) return <span>—</span>;

  const visibleClusters = clusters.slice(0, GROUPS_VISIBLE_IN_TABLE);
  const hiddenClusters = clusters.slice(GROUPS_VISIBLE_IN_TABLE);
  const hiddenCount = hiddenClusters.reduce((sum, cluster) => sum + cluster.rawItems.length, 0);
  const hiddenTitles = hiddenClusters.flatMap(cluster => cluster.rawItems).join(', ');
  const allTitle = clusters.flatMap(cluster => cluster.rawItems).join(', ');

  return (
    <div className="ncc-master-groups" title={allTitle} aria-label={`Nhóm ngành hàng: ${allTitle}`}>
      {visibleClusters.map(cluster =>
        cluster.children.length > 0 ? (
          <span key={cluster.key} className="ncc-master-groups__cluster">
            <span className="ncc-master-groups__parent">{cluster.parent}</span>
            {cluster.children.slice(0, 3).map(child => (
              <span key={child} className="ncc-master-groups__sub-chip">
                {child}
              </span>
            ))}
            {cluster.children.length > 3 ? (
              <span
                className="ncc-master-groups__more"
                title={cluster.children.slice(3).join(', ')}
              >
                +{cluster.children.length - 3}
              </span>
            ) : null}
          </span>
        ) : (
          <span key={cluster.key} className="ncc-master-groups__chip">
            {cluster.parent}
          </span>
        ),
      )}
      {hiddenCount > 0 ? (
        <span className="ncc-master-groups__more" title={hiddenTitles}>
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

export function DetailField({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? 'ncc-master-detail-span' : undefined}>
      <span className="ncc-master-detail-label">{label}</span>
      <div className="ncc-master-detail-value">{children}</div>
    </div>
  );
}
