import type { PermissionKey } from '../lib/permissions';

/**
 * CSKH — menu + route `/cskh/*`.
 * Tắt `false` nếu cần ẩn phân hệ trước khi có API nghiệp vụ.
 */
export const CSKH_MODULE_ENABLED = true;

/**
 * Khóa phân hệ CSKH — giữ menu trên sidebar nhưng khóa truy cập
 * và hiển thị màn hình thông báo phân hệ đang được nâng cấp / bảo trì.
 */
export const CSKH_MODULE_LOCKED = false;

/** User thấy dự án Vận hành cũng vào được khung CSKH. */
export const CSKH_VIEW_PERMISSION: PermissionKey[] = [
  'cskh.dashboard.view',
  'wms.projects.view:all',
];

export const CSKH_PROJECT_STORAGE_KEY = 'nv-cskh-project';
