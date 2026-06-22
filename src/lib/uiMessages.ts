/** Thông báo hiển thị chung — dùng trên toàn hệ thống. */

export const UI_LOADING = {
  default: 'Đang tải dữ liệu...',
  positions: 'Đang tải danh sách vị trí...',
  roles: 'Đang tải danh sách vai trò...',
} as const;

export const UI_ERROR = {
  generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  loadMembers: 'Không tải được danh sách nhân viên.',
  loadCandidates: 'Không tải được danh sách ứng viên.',
  loadUsers: 'Không tải được danh sách tài khoản.',
  loadStocktakes: 'Không tải được danh sách phiếu kiểm kê.',
  loadAdjustments: 'Không tải được danh sách phiếu điều chỉnh.',
  loadCv: 'Không tải được CV.',
  saveFailed: 'Không lưu được thông tin. Vui lòng thử lại.',
  loginFailed: 'Đăng nhập thất bại. Vui lòng thử lại.',
  serverUnavailable: 'Hệ thống chưa sẵn sàng. Vui lòng liên hệ quản trị.',
} as const;
