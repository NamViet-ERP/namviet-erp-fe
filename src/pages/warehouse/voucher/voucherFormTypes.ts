/** Shared line-item shape for WMS voucher create forms. */
export interface MaterialQtyLine {
  materialCode: string;
  qty: string;
}

export interface MaterialQtyPriceLine extends MaterialQtyLine {
  unitPrice: string;
}

export const emptyQtyLine: MaterialQtyLine = { materialCode: '', qty: '' };

export const emptyQtyPriceLine: MaterialQtyPriceLine = {
  materialCode: '',
  qty: '',
  unitPrice: '',
};

export interface MaterialQtyPhaseLine extends MaterialQtyLine {
  constructionPhase: string;
}

export const emptyQtyPhaseLine: MaterialQtyPhaseLine = {
  materialCode: '',
  qty: '',
  constructionPhase: '',
};
