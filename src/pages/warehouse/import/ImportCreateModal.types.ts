import type { Material, ImportAttachment } from '../../../types';
import type { ImportParseErrorApiDto } from '../../../types/api/importParseApi';
import type { PoImportLinePreviewApiDto } from '../../../types/api/poImportApi';
import type { SupplierApiDto } from '../../../services/suppliersService';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import type { MaterialQtyPriceLine } from '../voucher/voucherFormTypes';
import type { ImportFormFieldErrors } from '../../../lib/wms/importFormSchema';
import type { FrozenProjectMap } from '../../../lib/wms/stocktakeFreeze';

export interface ImportCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  isImportParsing?: boolean;
  projects: WarehouseProjectApiDto[];
  suppliers: SupplierApiDto[];
  materials: Material[];
  projectCode: string;
  onProjectCodeChange: (code: string) => void;
  defaultSupplier: string;
  onDefaultSupplierChange: (name: string) => void;
  referenceCode: string;
  onReferenceCodeChange: (code: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  items: MaterialQtyPriceLine[];
  onItemsChange: (items: MaterialQtyPriceLine[]) => void;
  formGrandTotal: number;
  errors?: ImportFormFieldErrors;
  frozenByProjectCode: FrozenProjectMap;
  importErrors?: ImportParseErrorApiDto[];
  onCreate: (status: 'draft' | 'pending', evidence?: { files: File[]; evaluation: string }) => void;
  onSave?: (payload?: { evaluation: string }) => void;
  onDownloadTemplate?: () => Promise<void>;
  onImportFile?: (file: File) => Promise<void>;
  onMaterialLineChange?: (index: number, materialCode: string) => void;
  onDuplicateMaterialAttempt?: (lineIndex: number) => void;
  editVoucher?: { code: string; receiptEvaluation?: string | null; status?: string } | null;
  materialUnit: (code: string) => string;
  poOptions?: PurchaseOrderApiDto[];
  selectedPoCode?: string;
  onSelectedPoCodeChange?: (code: string) => void;
  /** Khi true (tạo từ chi tiết PO): khóa chọn PO. */
  poLocked?: boolean;
  poLoading?: boolean;
  poPreviewLines?: PoImportLinePreviewApiDto[];
  /** Sửa phiếu: chứng từ đã lưu + upload ngay khi chọn file. */
  editAttachments?: ImportAttachment[];
  isEvidencePending?: boolean;
  onUploadEditAttachment?: (file: File, kind: 'document' | 'photo') => Promise<void>;
  onDeleteEditAttachment?: (attachmentId: string) => Promise<void>;
  onDownloadEditAttachment?: (attachmentId: string, fileName: string) => Promise<void>;
  /** Duyệt thực tế từ form sửa (phiếu pending). */
  canApprove?: boolean;
  onApprove?: (payload?: { evaluation: string }) => void;
  isApproving?: boolean;
}
