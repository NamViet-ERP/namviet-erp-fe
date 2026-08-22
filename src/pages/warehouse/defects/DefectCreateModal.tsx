import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import { getApiErrorMessage } from '../../../lib/apiClient';
import {
  useCreateDefectFromPo,
  useCreateDefectFromStock,
  useEligibleDefectPurchaseOrders,
  usePoDefectPreview,
  useStockDefectPreview,
  useSubmitDefect,
} from '../../../hooks/useDefects';
import { useProjects } from '../../../hooks/useProjects';
import { useFrozenProjects } from '../../../hooks/useFrozenProjects';
import { defectsService } from '../../../services/defectsService';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import type { LineDraft, SourceType } from './defectTypes';
import DefectCreateEvidenceFields from './DefectCreateEvidenceFields';
import DefectCreateSourceSection from './DefectCreateSourceSection';

interface DefectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DefectCreateModal({ isOpen, onClose }: DefectCreateModalProps) {
  const [sourceType, setSourceType] = useState<SourceType>('po');
  const [selectedPoCode, setSelectedPoCode] = useState('');
  const [poLineDrafts, setPoLineDrafts] = useState<Record<number, LineDraft>>({});
  const [stockProjectCode, setStockProjectCode] = useState('');
  const [stockLineDrafts, setStockLineDrafts] = useState<Record<string, LineDraft>>({});
  const [createPhotoFiles, setCreatePhotoFiles] = useState<File[]>([]);
  const [createDocFiles, setCreateDocFiles] = useState<File[]>([]);

  const { data: projectsPage } = useProjects({ pageSize: 100, status: 'Active' });
  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const frozenByProjectCode = useFrozenProjects();
  const purchaseOrdersQuery = useEligibleDefectPurchaseOrders(isOpen && sourceType === 'po');
  const poPreviewQuery = usePoDefectPreview(
    selectedPoCode || undefined,
    isOpen && sourceType === 'po' && Boolean(selectedPoCode),
  );
  const stockPreviewQuery = useStockDefectPreview(
    stockProjectCode || undefined,
    isOpen && sourceType === 'stock' && Boolean(stockProjectCode),
  );
  const createFromPoMutation = useCreateDefectFromPo();
  const createFromStockMutation = useCreateDefectFromStock();
  const submitMutation = useSubmitDefect();

  const poOptions = purchaseOrdersQuery.data ?? [];

  const poPreviewLines = poPreviewQuery.data?.lines ?? [];
  const poPreviewKey = useMemo(
    () => `${selectedPoCode}|${poPreviewLines.map(l => `${l.poItemId}:${l.available}`).join(',')}`,
    [selectedPoCode, poPreviewLines],
  );

  const stockPreviewLines = stockPreviewQuery.data?.lines ?? [];
  const stockPreviewKey = useMemo(
    () => `${stockProjectCode}|${stockPreviewLines.map(l => `${l.materialCode}:${l.available}`).join(',')}`,
    [stockProjectCode, stockPreviewLines],
  );

  const selectablePoLines = useMemo(
    () => poPreviewLines.filter(l => l.available > 0),
    [poPreviewLines],
  );
  const allPoLinesSelected =
    selectablePoLines.length > 0
    && selectablePoLines.every(l => poLineDrafts[l.poItemId]?.selected);
  const somePoLinesSelected =
    selectablePoLines.some(l => poLineDrafts[l.poItemId]?.selected) && !allPoLinesSelected;

  const selectableStockLines = useMemo(
    () => stockPreviewLines.filter(l => l.available > 0),
    [stockPreviewLines],
  );
  const allStockLinesSelected =
    selectableStockLines.length > 0
    && selectableStockLines.every(l => stockLineDrafts[l.materialCode]?.selected);
  const someStockLinesSelected =
    selectableStockLines.some(l => stockLineDrafts[l.materialCode]?.selected) && !allStockLinesSelected;

  const toggleSelectAllPoLines = (checked: boolean) => {
    setPoLineDrafts(prev => {
      const next = { ...prev };
      for (const line of selectablePoLines) {
        const draft = next[line.poItemId] ?? {
          selected: false,
          qty: String(line.available),
          lineReason: '',
        };
        next[line.poItemId] = {
          ...draft,
          selected: checked,
          qty: checked
            ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
            : draft.qty,
        };
      }
      return next;
    });
  };

  const toggleSelectAllStockLines = (checked: boolean) => {
    setStockLineDrafts(prev => {
      const next = { ...prev };
      for (const line of selectableStockLines) {
        const draft = next[line.materialCode] ?? {
          selected: false,
          qty: String(line.available),
          lineReason: '',
        };
        next[line.materialCode] = {
          ...draft,
          selected: checked,
          qty: checked
            ? (Number(draft.qty) > 0 ? draft.qty : String(line.available))
            : draft.qty,
        };
      }
      return next;
    });
  };

  useEffect(() => {
    if (!selectedPoCode || poPreviewLines.length === 0) {
      setPoLineDrafts({});
      return;
    }
    // Chỉ khởi tạo danh sách — không tick sẵn; user tự chọn dòng.
    const next: Record<number, LineDraft> = {};
    for (const line of poPreviewLines) {
      next[line.poItemId] = {
        selected: false,
        qty: line.available > 0 ? String(line.available) : '0',
        lineReason: '',
      };
    }
    setPoLineDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi PO/preview
  }, [poPreviewKey]);

  useEffect(() => {
    if (!stockProjectCode || stockPreviewLines.length === 0) {
      setStockLineDrafts({});
      return;
    }
    const next: Record<string, LineDraft> = {};
    for (const line of stockPreviewLines) {
      next[line.materialCode] = {
        selected: false,
        qty: line.available > 0 ? String(line.available) : '0',
        lineReason: '',
      };
    }
    setStockLineDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ reset khi đổi kho/preview
  }, [stockPreviewKey]);

  const resetCreate = () => {
    setSourceType('po');
    setSelectedPoCode('');
    setPoLineDrafts({});
    setStockProjectCode('');
    setStockLineDrafts({});
    setCreatePhotoFiles([]);
    setCreateDocFiles([]);
  };

  const handleSourceTypeChange = (next: SourceType) => {
    setSourceType(next);
    setSelectedPoCode('');
    setPoLineDrafts({});
    setStockProjectCode('');
    setStockLineDrafts({});
  };

  const handleClose = () => {
    onClose();
    resetCreate();
  };

  const handleCreate = async (asPending: boolean) => {
    if (asPending && createPhotoFiles.length < 1) {
      showToast('error', 'Gửi duyệt cần ít nhất 1 ảnh hàng lỗi.');
      return;
    }

    try {
      let created: PurchaseDefectApiDto;

      if (sourceType === 'po') {
        if (!selectedPoCode) {
          showToast('error', 'Vui lòng chọn PO.');
          return;
        }
        const items = poPreviewLines
          .filter(line => poLineDrafts[line.poItemId]?.selected)
          .map(line => {
            const draft = poLineDrafts[line.poItemId]!;
            return {
              poItemId: line.poItemId,
              qty: Number(draft.qty),
              lineReason: draft.lineReason.trim() || null,
            };
          })
          .filter(x => Number.isFinite(x.qty) && x.qty > 0);

        if (items.length === 0) {
          showToast('error', 'Chọn ít nhất một dòng còn SL để ghi lỗi.');
          return;
        }
        if (items.some(x => !x.lineReason)) {
          showToast('error', 'Mỗi dòng đã chọn cần nhập lý do dòng.');
          return;
        }

        created = await createFromPoMutation.mutateAsync({
          poCode: selectedPoCode,
          request: { items, reason: null, note: null },
        });
      } else {
        if (!stockProjectCode) {
          showToast('error', 'Vui lòng chọn kho dự án.');
          return;
        }
        const items = stockPreviewLines
          .filter(line => stockLineDrafts[line.materialCode]?.selected)
          .map(line => {
            const draft = stockLineDrafts[line.materialCode]!;
            return {
              materialCode: line.materialCode,
              qty: Number(draft.qty),
              lineReason: draft.lineReason.trim() || null,
            };
          })
          .filter(x => Number.isFinite(x.qty) && x.qty > 0);

        if (items.length === 0) {
          showToast('error', 'Chọn ít nhất một dòng còn tồn để ghi lỗi.');
          return;
        }
        if (items.some(x => !x.lineReason)) {
          showToast('error', 'Mỗi dòng đã chọn cần nhập lý do dòng.');
          return;
        }

        created = await createFromStockMutation.mutateAsync({
          projectCode: stockProjectCode,
          items,
          reason: null,
          note: null,
        });
      }

      for (const file of createPhotoFiles) {
        await defectsService.uploadAttachment(created.ticketCode, file, 'photo');
      }
      for (const file of createDocFiles) {
        await defectsService.uploadAttachment(created.ticketCode, file, 'document');
      }

      if (asPending) {
        await submitMutation.mutateAsync(created.ticketCode);
        showToast('success', `Đã tạo và gửi duyệt ${created.ticketCode}.`);
      } else {
        showToast('success', `Đã lưu nháp ${created.ticketCode}.`);
      }
      onClose();
      resetCreate();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không tạo được phiếu hàng lỗi'));
    }
  };

  const isSaving =
    createFromPoMutation.isPending
    || createFromStockMutation.isPending
    || submitMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo phiếu hàng lỗi / bảo hành"
      size="full"
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
          <div className="md-dialog__footer-actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={isSaving}
              onClick={() => void handleCreate(false)}
            >
              Lưu nháp
            </button>
            <button
              type="button"
              className="btn btn-filled"
              disabled={isSaving}
              onClick={() => void handleCreate(true)}
            >
              Lưu & gửi duyệt
            </button>
          </div>
        </>
      )}
    >
      <div className="space-y-3 modal-form-bordered defect-create-form">
        <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2 text-xs text-[var(--md-on-surface-variant)] flex gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Phiếu HL không cộng tồn. Với hàng lỗi PO, duyệt sẽ tăng SL lỗi trên PO/KHMH và giảm SL còn lại.
            Với hàng lỗi tồn kho, gửi duyệt sẽ giữ chỗ trên tồn kho dự án - xuất/chuyển kho không lấy phần đó.
            Duyệt HL mới trừ tồn thực tế. Gửi duyệt cần ít nhất 1 ảnh.
          </span>
        </div>

        <DefectCreateSourceSection
          sourceType={sourceType}
          onSourceTypeChange={handleSourceTypeChange}
          selectedPoCode={selectedPoCode}
          onSelectedPoCodeChange={setSelectedPoCode}
          poOptions={poOptions}
          purchaseOrdersLoading={purchaseOrdersQuery.isLoading}
          stockProjectCode={stockProjectCode}
          onStockProjectCodeChange={code => {
            setStockProjectCode(code);
            setStockLineDrafts({});
          }}
          projects={projects}
          frozenByProjectCode={frozenByProjectCode}
          poProjectCode={poPreviewQuery.data?.projectCode}
          poSupplierName={poPreviewQuery.data?.supplierName}
          poPreviewLoading={poPreviewQuery.isLoading}
          poPreviewError={poPreviewQuery.error}
          poPreviewErrorState={poPreviewQuery.isError}
          poPreviewLines={poPreviewLines}
          poLineDrafts={poLineDrafts}
          setPoLineDrafts={setPoLineDrafts}
          selectablePoLines={selectablePoLines}
          allPoLinesSelected={allPoLinesSelected}
          somePoLinesSelected={somePoLinesSelected}
          onToggleSelectAllPoLines={toggleSelectAllPoLines}
          stockPreviewLoading={stockPreviewQuery.isLoading}
          stockPreviewLines={stockPreviewLines}
          stockLineDrafts={stockLineDrafts}
          setStockLineDrafts={setStockLineDrafts}
          selectableStockLines={selectableStockLines}
          allStockLinesSelected={allStockLinesSelected}
          someStockLinesSelected={someStockLinesSelected}
          onToggleSelectAllStockLines={toggleSelectAllStockLines}
        />

        <DefectCreateEvidenceFields
          photoFiles={createPhotoFiles}
          docFiles={createDocFiles}
          onPhotoFilesChange={setCreatePhotoFiles}
          onDocFilesChange={setCreateDocFiles}
        />
      </div>
    </Modal>
  );
}
