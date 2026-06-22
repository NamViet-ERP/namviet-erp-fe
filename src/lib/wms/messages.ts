import { UI_LOADING, UI_ERROR } from '../uiMessages';

/** Thông báo hiển thị cho người dùng — kho hàng (WMS). */

export const WMS_LOADING = {
  default: UI_LOADING.default,
  stock: 'Đang tải tồn kho...',
  suppliers: 'Đang tải danh mục nhà cung cấp...',
  categoryTree: 'Đang tải cây vật tư...',
  history: 'Đang tải lịch sử phiếu...',
} as const;

export const WMS_ERROR = {
  generic: UI_ERROR.generic,
  loadDefault: 'Không tải được dữ liệu. Vui lòng thử lại sau.',
  loadImports: 'Không tải được danh sách phiếu nhập kho.',
  loadExports: 'Không tải được danh sách phiếu xuất kho.',
  loadTransfers: 'Không tải được danh sách phiếu chuyển kho.',
  loadProjects: 'Không tải được danh sách kho dự án.',
  loadStock: 'Không tải được dữ liệu tồn kho.',
  loadSuppliers: 'Không tải được danh mục nhà cung cấp.',
  loadCategories: 'Không tải được cây vật tư.',
  loadMaterials: 'Không tải được danh sách vật tư.',
  loadHistory: 'Không tải được lịch sử phiếu kho dự án.',
  network: 'Không kết nối được máy chủ. Kiểm tra kết nối mạng và thử lại.',
  timeout: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
} as const;

export const WMS_EMPTY = {
  noData: 'Không có dữ liệu.',
  noStock: 'Không có dữ liệu tồn kho.',
  noImports: 'Không tìm thấy phiếu nhập kho nào.',
  noExports: 'Không tìm thấy phiếu xuất kho nào.',
  noTransfers: 'Không tìm thấy phiếu chuyển kho nào.',
  noMaterials: 'Không tìm thấy vật tư phù hợp.',
  dashboardPending:
    'Biểu đồ tổng quan đang được cập nhật. Vui lòng xem mục Tồn kho và các phiếu nhập, xuất, chuyển.',
} as const;
