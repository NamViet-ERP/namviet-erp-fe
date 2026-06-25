import { topMaterials, topProducts } from '../../mocks/pages/dashboardTopSales';

/** Top sales rows — mock until dashboard API is available. */
export function useTopSalesRows() {
  return {
    topProducts,
    topMaterials,
  };
}
