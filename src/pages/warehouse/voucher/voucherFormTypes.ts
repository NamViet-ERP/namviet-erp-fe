/** Shared line-item shape for WMS voucher create forms. */
export interface MaterialQtyLine {
  materialCode: string;
  qty: string;
}

export interface MaterialQtyPriceLine extends MaterialQtyLine {
  unitPrice: string;
  /** Giữ notes từ phiếu (vd. poItem:{id}) khi sửa — không hiện UI. */
  notes?: string | null;
  /** Tên/đơn vị từ PO preview — hiện khi tạo NK từ PO (không phụ thuộc catalog). */
  materialName?: string;
  unit?: string;
}

export const emptyQtyLine: MaterialQtyLine = { materialCode: '', qty: '' };

export const emptyQtyPriceLine: MaterialQtyPriceLine = {
  materialCode: '',
  qty: '',
  unitPrice: '',
  notes: undefined,
};

export interface MaterialQtyPhaseLine extends MaterialQtyLine {
  constructionPhase: string;
}

export const emptyQtyPhaseLine: MaterialQtyPhaseLine = {
  materialCode: '',
  qty: '',
  constructionPhase: '',
};
