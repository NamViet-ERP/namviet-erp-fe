import { apiClient } from '../lib/apiClient';
import type {
  PriceBookCategoryRowApiDto,
  PriceBookItemApiDto,
  PriceBookItemDetailApiDto,
  PriceBookMarginRowApiDto,
  PriceBookMatrixApiDto,
  UpsertPurchaseSellPriceRequest,
} from '../types/api/purchasingApi';

const ENDPOINT = '/api/purchasing/price-book';

export const purchasePriceBookService = {
  items(search?: string, categoryId?: number) {
    return apiClient.get<PriceBookItemApiDto[]>(`${ENDPOINT}/items`, {
      search: search || undefined,
      categoryId,
    });
  },

  item(code: string) {
    return apiClient.get<PriceBookItemDetailApiDto>(
      `${ENDPOINT}/items/${encodeURIComponent(code)}`,
    );
  },

  matrix(categoryId: number) {
    return apiClient.get<PriceBookMatrixApiDto>(`${ENDPOINT}/matrix`, { categoryId });
  },

  categories() {
    return apiClient.get<PriceBookCategoryRowApiDto[]>(`${ENDPOINT}/categories`);
  },

  margins() {
    return apiClient.get<PriceBookMarginRowApiDto[]>(`${ENDPOINT}/margins`);
  },

  upsertSellPrice(body: UpsertPurchaseSellPriceRequest) {
    return apiClient.post(`${ENDPOINT}/sell-prices`, body);
  },
};
