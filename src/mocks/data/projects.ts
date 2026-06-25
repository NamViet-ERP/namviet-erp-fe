export interface Project {
  id: string;
  name: string;
  stage: 'Chế tạo' | 'Lắp đặt' | 'Hoàn thiện' | 'Đóng/Hoàn thành';
  pm: string;
}

export interface ConsumableQuota {
  projectId: string;
  productId: string;
  quotaQty: number;
  issuedQty: number;
}

export interface ProjectStockCell {
  productId: string;
  projectId: string; // 'general' or 'proj-001' etc.
  openingQty: number;
  importQty: number;
  exportQty: number;
  closingQty: number;
}

export interface LendingLog {
  id: string;
  voucherCode: string;
  date: string;
  borrowingProjectId: string;
  lendingProjectId: string;
  productId: string;
  qty: number;
  status: 'pending' | 'borrowing' | 'returned';
  borrowPmSigned: boolean;
  lendPmSigned: boolean;
  note: string;
  createdBy?: string;
  createdTime?: string;
}

export const projects: Project[] = [
  { id: 'proj-001', name: 'Dự án Sabeco Bình Dương', stage: 'Chế tạo', pm: 'Nguyễn Văn Hùng' },
  { id: 'proj-002', name: 'Dự án Sữa Vinamilk Củ Chi', stage: 'Lắp đặt', pm: 'Trần Quốc Tuấn' },
  { id: 'proj-003', name: 'Dự án Thép Hòa Phát Dung Quất', stage: 'Chế tạo', pm: 'Phạm Minh Chính' },
  { id: 'proj-004', name: 'Dự án Lọc dầu Nghi Sơn Thanh Hóa', stage: 'Chế tạo', pm: 'Lê Hoàng Quân' },
  { id: 'proj-005', name: 'Dự án Vinhomes Grand Park', stage: 'Lắp đặt', pm: 'Nguyễn Tấn Dũng' },
  { id: 'proj-006', name: 'Nhà máy Bia Heineken Vũng Tàu', stage: 'Đóng/Hoàn thành', pm: 'Hoàng Trung Hải' },
];

export const initialConsumablesQuotas: ConsumableQuota[] = [
  // Sabeco
  { projectId: 'proj-001', productId: 'p-013', quotaQty: 100, issuedQty: 45 },
  { projectId: 'proj-001', productId: 'p-014', quotaQty: 50, issuedQty: 52 }, // Exceeds quota!
  { projectId: 'proj-001', productId: 'p-015', quotaQty: 300, issuedQty: 210 },
  // Vinamilk
  { projectId: 'proj-002', productId: 'p-013', quotaQty: 120, issuedQty: 60 },
  { projectId: 'proj-002', productId: 'p-014', quotaQty: 60, issuedQty: 35 },
  { projectId: 'proj-002', productId: 'p-015', quotaQty: 250, issuedQty: 240 },
  // Hòa Phát
  { projectId: 'proj-003', productId: 'p-013', quotaQty: 200, issuedQty: 180 },
  { projectId: 'proj-003', productId: 'p-014', quotaQty: 100, issuedQty: 90 },
  { projectId: 'proj-003', productId: 'p-015', quotaQty: 500, issuedQty: 520 }, // Exceeds quota!
  // Nghi Sơn
  { projectId: 'proj-004', productId: 'p-013', quotaQty: 80, issuedQty: 20 },
  { projectId: 'proj-004', productId: 'p-014', quotaQty: 40, issuedQty: 15 },
  { projectId: 'proj-004', productId: 'p-015', quotaQty: 200, issuedQty: 80 },
];

// Generate matrix stock values for 15 products across projects + general warehouse
export const initialProjectStocks: ProjectStockCell[] = [];

const warehouseStocksMap: Record<string, number[]> = {
  'p-001': [30, 10, 0, 5, 2, 0, 0], // General, Proj1, Proj2, Proj3, Proj4, Proj5, Proj6
  'p-002': [15, 2, 4, 1, 0, 0, 0],
  'p-003': [10, 1, 1, 2, 0, 0, 0],
  'p-004': [25, 5, 2, 10, 3, 0, 0],
  'p-005': [18, 4, 3, 5, 2, 0, 0],
  'p-006': [45, 10, 5, 15, 0, 0, 0],
  'p-007': [20, 2, 3, 8, 1, 0, 0],
  'p-008': [8, 1, 2, 0, 1, 0, 0],
  'p-009': [150, 40, 20, 50, 10, 0, 0],
  'p-010': [80, 15, 10, 30, 5, 0, 0],
  'p-011': [5, 1, 0, 1, 0, 0, 0],
  'p-012': [3, 0, 1, 0, 0, 0, 0],
  'p-013': [500, 100, 150, 80, 40, 20, 0],
  'p-014': [300, 60, 80, 50, 30, 10, 0],
  'p-015': [1200, 300, 400, 200, 100, 50, 0],
};

Object.entries(warehouseStocksMap).forEach(([prodId, qtys]) => {
  // general
  initialProjectStocks.push({
    productId: prodId,
    projectId: 'general',
    openingQty: qtys[0] * 1.2,
    importQty: qtys[0],
    exportQty: qtys[0] * 0.2,
    closingQty: qtys[0]
  });

  // projects 1 to 6
  projects.forEach((proj, index) => {
    const qty = qtys[index + 1] || 0;
    initialProjectStocks.push({
      productId: prodId,
      projectId: proj.id,
      openingQty: qty * 1.5,
      importQty: qty,
      exportQty: qty * 0.5,
      closingQty: qty
    });
  });
});

export const initialLendingLogs: LendingLog[] = [
  {
    id: 'lend-001',
    voucherCode: 'ML-00241',
    date: '04/06/2026',
    borrowingProjectId: 'proj-001',
    lendingProjectId: 'proj-002',
    productId: 'p-002', // Máy nén khí 15HP
    qty: 1,
    status: 'borrowing',
    borrowPmSigned: true,
    lendPmSigned: true,
    note: 'Mượn tạm phục vụ lắp ráp dây chuyền chiết chai bia Sabeco',
    createdBy: 'Nguyễn Văn Hùng',
    createdTime: '09:15'
  },
  {
    id: 'lend-002',
    voucherCode: 'ML-00242',
    date: '05/06/2026',
    borrowingProjectId: 'proj-003',
    lendingProjectId: 'proj-001',
    productId: 'p-010', // Dầu máy nén khí
    qty: 5,
    status: 'pending',
    borrowPmSigned: true,
    lendPmSigned: false,
    note: 'Yêu cầu mượn khẩn cấp chờ hàng mua về',
    createdBy: 'Phạm Minh Chính',
    createdTime: '14:30'
  },
  {
    id: 'lend-003',
    voucherCode: 'ML-00240',
    date: '01/06/2026',
    borrowingProjectId: 'proj-002',
    lendingProjectId: 'proj-004',
    productId: 'p-009',
    qty: 10,
    status: 'returned',
    borrowPmSigned: true,
    lendPmSigned: true,
    note: 'Đã hoàn trả đủ khi lô hàng nhập PO-002372 về',
    createdBy: 'Trần Quốc Tuấn',
    createdTime: '10:00'
  }
];

export const mockProjectBoms: Record<string, Record<string, number>> = {
  'proj-001': { 'p-001': 5, 'p-002': 2, 'p-006': 10, 'p-009': 50, 'p-010': 20 },
  'proj-002': { 'p-002': 5, 'p-003': 2, 'p-007': 5, 'p-009': 30 },
  'proj-003': { 'p-001': 10, 'p-003': 5, 'p-006': 15, 'p-010': 40 },
  'proj-004': { 'p-004': 5, 'p-005': 2, 'p-007': 5 },
  'proj-005': { 'p-001': 2, 'p-004': 3, 'p-006': 5 },
  'proj-006': { 'p-001': 0, 'p-002': 0 },
};
