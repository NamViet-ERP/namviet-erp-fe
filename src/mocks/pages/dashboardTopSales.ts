import { Package, Activity, Wrench, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardTopRow {
  imageIcon: LucideIcon;
  code: string;
  name: string;
  qty: number;
}

export const topProducts: DashboardTopRow[] = [
  { imageIcon: Wrench, code: '2102205001', name: 'Bảo trì máy, thay vật tư, kiểm tra tổng thể, vệ sinh máy', qty: 57 },
  { imageIcon: Settings, code: 'LD-ONG', name: 'Lắp đặt đường ống cụm máy', qty: 14 },
  { imageIcon: Activity, code: 'KPF50-T', name: 'Bộ lọc thô King Power', qty: 5 },
  { imageIcon: Activity, code: 'KPF50-A', name: 'Bộ lọc tinh King Power', qty: 5 },
  { imageIcon: Package, code: 'MZ1000-8', name: 'Bình chứa khí nén', qty: 5 },
];

export const topMaterials: DashboardTopRow[] = [
  { imageIcon: Activity, code: '101615004', name: 'King Power Air Compressor Oil (18L)', qty: 63 },
  { imageIcon: Settings, code: '2101602002', name: 'King Power oil filter', qty: 48 },
  { imageIcon: Activity, code: '2101605005', name: 'Motor grease GSR NO.2', qty: 19 },
  { imageIcon: Activity, code: '2101705001', name: 'King Power air filter', qty: 19 },
  { imageIcon: Settings, code: '2101610002', name: 'King Power oil filter', qty: 18 },
];
