import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsService, type CreateImportDto, type UpdateImportDto } from '../services/importsService';
import type { CreateImportFromPoRequest } from '../types/api/poImportApi';
import { queryKeys } from '../services/queryKeys';
import type { Import } from '../types';
import type { VoucherListParams } from '../lib/wms/voucherDateUtils';
import { suppressOwnWmsBellToast } from '../lib/wms/ownWmsBellToast';

function invalidateImportSideEffects(qc: ReturnType<typeof useQueryClient>, imp?: Import | null) {
  if (imp?.status === 'pending') suppressOwnWmsBellToast(imp.voucherCode);
  qc.invalidateQueries({ queryKey: queryKeys.imports.all });
  qc.invalidateQueries({ queryKey: queryKeys.wmsNotifications.all });
  qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
  qc.invalidateQueries({ queryKey: queryKeys.projects.all });
  const projectCode = imp?.project?.trim();
  if (projectCode) {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectCode) });
    qc.invalidateQueries({ queryKey: queryKeys.projects.inventory(projectCode) });
    qc.invalidateQueries({ queryKey: queryKeys.projects.ledger(projectCode) });
  }
}

/** List all import vouchers. */
export function useImports(params?: VoucherListParams) {
  return useQuery({
    queryKey: [...queryKeys.imports.all, params?.dateFrom ?? '', params?.dateTo ?? ''],
    queryFn: () => importsService.list(params),
  });
}

/** Fetch a single import voucher by id. */
export function useImport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.imports.detail(id ?? ''),
    queryFn: () => importsService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateImportDto) => importsService.create(dto),
    onSuccess: data => invalidateImportSideEffects(qc, data),
  });
}

/** Preview dòng PO còn nhập được (trừ pending NK). excludeTicketCode khi sửa phiếu. */
export function usePoImportPreview(
  poCode: string | undefined,
  enabled = true,
  excludeTicketCode?: string,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.imports.all,
      'from-po-preview',
      poCode ?? '',
      excludeTicketCode ?? '',
    ] as const,
    queryFn: () =>
      importsService.previewFromPurchaseOrder(poCode as string, {
        excludeTicketCode,
      }),
    enabled: Boolean(poCode) && enabled,
  });
}

/** Tạo phiếu nhập nháp từ PO đã đặt (chọn dòng + SL). */
export function useCreateImportFromPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      poCode,
      request,
    }: {
      poCode: string;
      request?: CreateImportFromPoRequest | null;
    }) => importsService.createFromPurchaseOrder(poCode, request),
    onSuccess: (data, { poCode }) => {
      invalidateImportSideEffects(qc, data);
      qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(poCode) });
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
      qc.invalidateQueries({ queryKey: [...queryKeys.imports.all, 'from-po-preview', poCode] });
    },
  });
}

export function useUpdateImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateImportDto }) =>
      importsService.update(id, dto),
    onSuccess: (data, { id }) => {
      invalidateImportSideEffects(qc, data);
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
    },
  });
}

export function useApproveImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmOverBudget }: { id: string; confirmOverBudget?: boolean }) =>
      importsService.approve(id, { confirmOverBudget: confirmOverBudget ?? false }),
    onSuccess: (data, { id }) => {
      invalidateImportSideEffects(qc, data);
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
      // PO.Received / DeliveryStatus may change when ReferenceCode is a PO code
      qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      qc.invalidateQueries({ queryKey: queryKeys.purchasePlans.all });
      const ref = data?.referenceCode?.trim();
      if (ref) qc.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(ref) });
    },
  });
}

export function useSubmitImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsService.submit(id),
    onSuccess: (data, id) => {
      suppressOwnWmsBellToast(data?.voucherCode);
      qc.invalidateQueries({ queryKey: queryKeys.imports.all });
      qc.invalidateQueries({ queryKey: queryKeys.imports.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.wmsNotifications.all });
    },
  });
}

export function useDeleteImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.imports.all }),
  });
}
