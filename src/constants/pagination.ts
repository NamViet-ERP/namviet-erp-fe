/** Tuỳ chọn số dòng / trang — dùng chung HRM, Admin, Kho dự án. */
export const LIST_PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;

export type ListPageSize = (typeof LIST_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_LIST_PAGE_SIZE: ListPageSize = 15;
