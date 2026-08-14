import FormField from '../../../components/ui/FormField';
import type { PurchaseWarrantyApiDto } from '../../../services/purchaseWarrantiesService';
import { statusLabel } from './warrantyLabels';

interface WarrantyLotSelectProps {
  lots: PurchaseWarrantyApiDto[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export default function WarrantyLotSelect({ lots, value, onChange, error }: WarrantyLotSelectProps) {
  const options = lots.filter(lot => lot.status !== 'void');
  return (
    <FormField label="Lô hàng đã nhận" required error={error}>
      <select
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Chọn lô hàng đã nhận</option>
        {options.map(lot => (
          <option key={lot.id} value={lot.id}>
            {lot.code} · {lot.poCode} · {lot.materialName} · {lot.supplierName || 'NCC'} · {statusLabel(lot.status)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
