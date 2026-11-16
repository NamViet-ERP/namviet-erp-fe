export const SUPPLIER_ONBOARDING_DOC_TYPES = [
  {
    key: 'business_license',
    title: 'GPKD / ĐKKD doanh nghiệp',
    description: 'Giấy chứng nhận đăng ký kinh doanh hoặc giấy phép đầu tư (bắt buộc cho Hạng D).',
    required: true,
  },
  {
    key: 'company_profile',
    title: 'Hồ sơ năng lực (Profile)',
    description: 'Giới thiệu năng lực tài chính, máy móc, dự án tiêu biểu và chứng chỉ ngành nghề.',
    required: false,
  },
  {
    key: 'catalog_price_list',
    title: 'Catalog & Bảng giá sản phẩm',
    description: 'Bảng báo giá vật tư, catalog quy cách sản phẩm, chính sách chiết khấu/bảo hành.',
    required: false,
  },
] as const;

export type SupplierOnboardingDocType = typeof SUPPLIER_ONBOARDING_DOC_TYPES[number]['key'];
