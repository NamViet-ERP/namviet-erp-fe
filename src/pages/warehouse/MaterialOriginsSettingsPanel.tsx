import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Package, Tag, Layers } from 'lucide-react';
import SectionCard from '../../components/ui/SectionCard';
import { useMaterialOrigins } from '../../hooks/useMaterialOrigins';
import { useMaterialRegions } from '../../hooks/useMaterialRegions';
import { useMaterialBrands } from '../../hooks/useMaterialBrands';
import BrandsTabPanel from './origins/BrandsTabPanel';
import CountriesTabPanel from './origins/CountriesTabPanel';
import RegionsTabPanel from './origins/RegionsTabPanel';

export default function MaterialOriginsSettingsPanel() {
  const [activeTab, setActiveTab] = useState<'brands' | 'countries' | 'regions'>('brands');

  const { data: brands = [] } = useMaterialBrands(false);
  const { data: origins = [] } = useMaterialOrigins(false);
  const { data: regions = [] } = useMaterialRegions(false);

  return (
    <div className="hrm-settings-grid hrm-settings-grid--recruitment">
      <SectionCard className="hrm-settings-card hrm-settings-card--featured">
        <div className="hrm-settings-card__head">
          <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="hrm-settings-card__title">Xuất xứ & Nhãn hiệu vật tư</h2>
            <p className="hrm-settings-card__desc">
              Quản lý 3 phân mục: Hãng sản xuất, Nước xuất xứ (kèm nhóm nước mặc định) và Khối nhóm nước.
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'brands'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag size={14} className={activeTab === 'brands' ? 'text-blue-600' : ''} />
            Nhãn hiệu / Hãng ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('countries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'countries'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe size={14} className={activeTab === 'countries' ? 'text-blue-600' : ''} />
            Nước sản xuất ({origins.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('regions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'regions'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className={activeTab === 'regions' ? 'text-blue-600' : ''} />
            Nhóm nước ({regions.length})
          </button>
        </div>

        {activeTab === 'brands' && <BrandsTabPanel />}
        {activeTab === 'countries' && <CountriesTabPanel />}
        {activeTab === 'regions' && <RegionsTabPanel />}
      </SectionCard>

      {/* Cột hướng dẫn */}
      <SectionCard className="hrm-settings-card">
        <div className="hrm-settings-card__head">
          <div className="hrm-settings-card__icon hrm-settings-card__icon--neutral">
            <Package size={20} />
          </div>
          <div>
            <h2 className="hrm-settings-card__title">Hướng dẫn vận hành</h2>
          </div>
        </div>
        <ul className="hrm-settings-list space-y-2 text-xs text-slate-600">
          <li>
            <strong>Nhãn hiệu / Hãng:</strong> Quản lý danh mục thương hiệu (Hòa Phát, Wilo, Ebara...). Dropdown tạo vật tư sẽ lấy danh sách này, có hỗ trợ nhập tay nếu là hãng mới.
          </li>
          <li>
            <strong>Nước sản xuất:</strong> Quốc gia xuất xứ hàng hóa. Có thể gắn sẵn <em>Nhóm nước</em> tương ứng để khi tạo vật tư, chọn Nước là hệ thống tự động điền Nhóm nước.
          </li>
          <li>
            <strong>Nhóm nước:</strong> Phân nhóm xuất xứ theo khối kinh tế (G7, EU, ĐNA, Châu Á, Khác...). Dùng khi lọc báo cáo tồn kho và đánh giá mua hàng.
          </li>
          <li>
            <strong>Bật/Tắt:</strong> Bật để hiện trong dropdown chọn; Tắt để ẩn đi khi tạo mới mà không làm mất dữ liệu của các vật tư cũ.
          </li>
        </ul>
        <Link to="/operations/materials" className="hrm-settings-link mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
          <Package size={15} />
          Đi tới danh mục vật tư
        </Link>
      </SectionCard>
    </div>
  );
}
