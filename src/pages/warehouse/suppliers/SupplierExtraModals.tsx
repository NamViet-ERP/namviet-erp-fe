import { useQueryClient } from '@tanstack/react-query';
import SupplierContactFormModal from '../../../components/suppliers/SupplierContactFormModal';
import SupplierGradeHistoryModal from '../../../components/suppliers/SupplierGradeHistoryModal';
import SupplierImportExcelModal from '../../../components/suppliers/SupplierImportExcelModal';
import SupplierTierEvaluationModal from '../../../components/suppliers/SupplierTierEvaluationModal';
import { showToast } from '../../../components/ui/Toast';
import { useCreateSupplierContact } from '../../../hooks/useSupplierDirectory';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { queryKeys } from '../../../services/queryKeys';
import type { SupplierRow } from './SupplierShared';

interface SupplierExtraModalsProps {
  evaluatingSupplier: SupplierRow | null;
  onCloseEvaluating: () => void;
  historySupplier: SupplierRow | null;
  onCloseHistory: () => void;
  isImportModalOpen: boolean;
  onCloseImport: () => void;
  viewingSupplierId: number | null;
  isContactModalOpen: boolean;
  onCloseContact: () => void;
}

export default function SupplierExtraModals({
  evaluatingSupplier,
  onCloseEvaluating,
  historySupplier,
  onCloseHistory,
  isImportModalOpen,
  onCloseImport,
  viewingSupplierId,
  isContactModalOpen,
  onCloseContact,
}: SupplierExtraModalsProps) {
  const qc = useQueryClient();
  const createContact = useCreateSupplierContact();

  return (
    <>
      {evaluatingSupplier && (
        <SupplierTierEvaluationModal
          supplier={evaluatingSupplier}
          isOpen={Boolean(evaluatingSupplier)}
          onClose={onCloseEvaluating}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
          }}
        />
      )}

      {historySupplier && (
        <SupplierGradeHistoryModal
          supplier={historySupplier}
          isOpen={Boolean(historySupplier)}
          onClose={onCloseHistory}
        />
      )}

      {isImportModalOpen && (
        <SupplierImportExcelModal
          isOpen={isImportModalOpen}
          onClose={onCloseImport}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
          }}
        />
      )}

      {viewingSupplierId !== null && (
        <SupplierContactFormModal
          isOpen={isContactModalOpen}
          editing={null}
          defaultSupplierId={viewingSupplierId}
          isSaving={createContact.isPending}
          onClose={onCloseContact}
          onSubmit={async (data) => {
            try {
              await createContact.mutateAsync(data);
              showToast('success', 'Thêm người liên hệ thành công');
              onCloseContact();
              void qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
              void qc.invalidateQueries({ queryKey: queryKeys.supplierContacts.all });
            } catch (err) {
              showToast('error', getApiErrorMessage(err, 'Không thể thêm người liên hệ'));
            }
          }}
        />
      )}
    </>
  );
}
