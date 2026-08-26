import type { PermissionKey } from '../lib/permissions';

/**
 * CSKH Phase 0 (khung empty) — tắt trước khi deploy API.
 * Bật `true` khi ship: menu + route `/cskh/*` hiện lại.
 */
export const CSKH_MODULE_ENABLED = false;

/** Phase 0: user thấy dự án Vận hành cũng vào được khung CSKH. */
export const CSKH_VIEW_PERMISSION: PermissionKey[] = [
  'cskh.dashboard.view',
  'wms.projects.view:all',
];

export const CSKH_PROJECT_STORAGE_KEY = 'nv-cskh-project';

export const CSKH_DOCUMENT_STEPS = [
  { id: 'approval', path: '/cskh/documents/approval', label: 'Soạn và duyệt' },
  { id: 'transit', path: '/cskh/documents/transit', label: 'Giao nhận hồ sơ' },
  { id: 'feedback', path: '/cskh/documents/feedback', label: 'Theo dõi phản hồi' },
  { id: 'archive', path: '/cskh/documents/archive', label: 'Lưu trữ' },
] as const;

export type CskhScreenId =
  | 'customers'
  | 'approval'
  | 'transit'
  | 'feedback'
  | 'archive'
  | 'bottlenecks'
  | 'requests'
  | 'gantt'
  | 'meetings'
  | 'warranties'
  | 'settings';

export interface CskhScreenCopy {
  title: string;
  subtitle: string;
  empty: string;
  needsProject: boolean;
}

export const CSKH_SCREENS: Record<CskhScreenId, CskhScreenCopy> = {
  customers: {
    title: 'Khách hàng CĐT',
    subtitle: 'Sổ chủ đầu tư. Gắn vào dự án ở SLC khi có API.',
    empty: 'Chưa có sổ CĐT. Phase 1 sẽ thêm hồ sơ khách (tên, MST, đầu mối, SĐT).',
    needsProject: false,
  },
  approval: {
    title: 'Soạn và duyệt nội bộ',
    subtitle: 'Khâu 1/4. Soạn thảo, xác nhận, trình ký, sẵn sàng gửi CĐT.',
    empty: 'Chưa có hồ sơ CĐT. Phase 2 mở pipeline 4 khâu.',
    needsProject: true,
  },
  transit: {
    title: 'Giao nhận hồ sơ',
    subtitle: 'Khâu 2/4. Nhật ký đi / về, bằng chứng đã ký.',
    empty: 'Chưa có lượt giao nhận. Gửi CĐT từ khâu 1 sẽ tạo dòng đi.',
    needsProject: true,
  },
  feedback: {
    title: 'Theo dõi phản hồi',
    subtitle: 'Khâu 3/4. Hồ sơ đã gửi, chờ CĐT. Quá hạn SLA thành điểm nghẽn.',
    empty: 'Không có hồ sơ đang chờ phản hồi.',
    needsProject: true,
  },
  archive: {
    title: 'Lưu trữ',
    subtitle: 'Khâu 4/4. Hợp đồng, phụ lục, biên bản đã đóng vòng.',
    empty: 'Chưa có hồ sơ lưu trữ cho dự án này.',
    needsProject: true,
  },
  bottlenecks: {
    title: 'Điểm nghẽn và tiến độ',
    subtitle: 'Vướng mắc có chủ, có hạn, có nguồn. Một nguồn một phiếu.',
    empty: 'Chưa có điểm nghẽn. Phase 3 tự sinh từ hồ sơ / yêu cầu quá hạn.',
    needsProject: true,
  },
  requests: {
    title: 'Yêu cầu',
    subtitle: 'Điều phối nội bộ và yêu cầu từ portal CĐT.',
    empty: 'Chưa có yêu cầu. Phase 3 thêm phiếu việc.',
    needsProject: true,
  },
  gantt: {
    title: 'Gantt và báo cáo',
    subtitle: 'Đọc tiến độ thi công và mua hàng. Không sửa % hiện trường.',
    empty: 'Chưa gắn Gantt CSKH. Phase 4 đọc construction-tasks đã có.',
    needsProject: true,
  },
  meetings: {
    title: 'Cuộc họp',
    subtitle: 'Agenda, biên bản, hành động sau họp.',
    empty: 'Chưa có cuộc họp. Phase 4 thêm lịch và hành động.',
    needsProject: true,
  },
  warranties: {
    title: 'Bảo hành CĐT',
    subtitle: 'Hạn bảo hành chiều khách, tách khỏi bảo hành NCC.',
    empty: 'Chưa có hạn bảo hành. Phase 1 gắn ngày nghiệm thu trên dự án.',
    needsProject: true,
  },
  settings: {
    title: 'Thiết lập CSKH',
    subtitle: 'Loại hồ sơ, SLA phản hồi, tháng bảo hành mặc định.',
    empty: 'Chưa có thiết lập. Phase 2 khóa các giá trị mặc định.',
    needsProject: false,
  },
};
