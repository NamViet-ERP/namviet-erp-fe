import type React from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plus, Trash2, Package, Pencil, Tag, Layers } from 'lucide-react';
import HrmPanel from '../../components/hr/HrmPanel';
import SearchBar from '../../components/ui/SearchBar';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_LOADING } from '../../lib/uiMessages';
import {
  useMaterialOrigins,
  useCreateMaterialOrigin,
  useUpdateMaterialOrigin,
  useDeleteMaterialOrigin,
} from '../../hooks/useMaterialOrigins';
import {
  useMaterialRegions,
  useCreateMaterialRegion,
  useUpdateMaterialRegion,
  useDeleteMaterialRegion,
} from '../../hooks/useMaterialRegions';
import {
  useMaterialBrands,
  useCreateMaterialBrand,
  useUpdateMaterialBrand,
  useDeleteMaterialBrand,
} from '../../hooks/useMaterialBrands';
import type {
  MaterialOriginApiDto,
  MaterialRegionApiDto,
  MaterialBrandApiDto,
} from '../../types/wms';

export default function MaterialOriginsSettingsPanel() {
  const [activeTab, setActiveTab] = useState<'brands' | 'countries' | 'regions'>('brands');

  // ── 1. Brands Hook ────────────────────────────────────────────────────────
  const { data: brands = [], isLoading: loadingBrands, isError: errorBrands } = useMaterialBrands(false);
  const createBrandMutation = useCreateMaterialBrand();
  const updateBrandMutation = useUpdateMaterialBrand();
  const deleteBrandMutation = useDeleteMaterialBrand();

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [editBrandTarget, setEditBrandTarget] = useState<MaterialBrandApiDto | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandCountry, setEditBrandCountry] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<MaterialBrandApiDto | null>(null);

  // ── 2. Countries (Origins) Hook ──────────────────────────────────────────
  const { data: origins = [], isLoading: loadingOrigins, isError: errorOrigins } = useMaterialOrigins(false);
  const createOriginMutation = useCreateMaterialOrigin();
  const updateOriginMutation = useUpdateMaterialOrigin();
  const deleteOriginMutation = useDeleteMaterialOrigin();

  const [newOriginName, setNewOriginName] = useState('');
  const [newOriginRegion, setNewOriginRegion] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [editOriginTarget, setEditOriginTarget] = useState<MaterialOriginApiDto | null>(null);
  const [editOriginName, setEditOriginName] = useState('');
  const [editOriginRegion, setEditOriginRegion] = useState('');
  const [deleteOriginTarget, setDeleteOriginTarget] = useState<MaterialOriginApiDto | null>(null);

  // ── 3. Regions Hook ──────────────────────────────────────────────────────
  const { data: regions = [], isLoading: loadingRegions, isError: errorRegions } = useMaterialRegions(false);
  const createRegionMutation = useCreateMaterialRegion();
  const updateRegionMutation = useUpdateMaterialRegion();
  const deleteRegionMutation = useDeleteMaterialRegion();

  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionDesc, setNewRegionDesc] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [editRegionTarget, setEditRegionTarget] = useState<MaterialRegionApiDto | null>(null);
  const [editRegionName, setEditRegionName] = useState('');
  const [editRegionDesc, setEditRegionDesc] = useState('');
  const [deleteRegionTarget, setDeleteRegionTarget] = useState<MaterialRegionApiDto | null>(null);

  // ── Filtered data ────────────────────────────────────────────────────────
  const filteredBrands = useMemo(() => {
    let list = [...brands];
    if (brandSearch.trim()) {
      const q = brandSearch.trim().toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || (b.country && b.country.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [brands, brandSearch]);

  const filteredOrigins = useMemo(() => {
    let list = [...origins];
    if (originSearch.trim()) {
      const q = originSearch.trim().toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(q) || (o.region && o.region.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [origins, originSearch]);

  const filteredRegions = useMemo(() => {
    let list = [...regions];
    if (regionSearch.trim()) {
      const q = regionSearch.trim().toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [regions, regionSearch]);

  // ── Handlers: Brands ─────────────────────────────────────────────────────
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhãn hiệu/hãng');
      return;
    }
    try {
      await createBrandMutation.mutateAsync({
        name,
        country: newBrandCountry.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm nhãn hiệu "${name}"`);
      setNewBrandName('');
      setNewBrandCountry('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm nhãn hiệu'));
    }
  };

  const handleToggleBrand = async (item: MaterialBrandApiDto) => {
    try {
      await updateBrandMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, country: item.country, description: item.description, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditBrand = (item: MaterialBrandApiDto) => {
    setEditBrandTarget(item);
    setEditBrandName(item.name);
    setEditBrandCountry(item.country ?? '');
    setEditBrandDesc(item.description ?? '');
  };

  const handleEditBrandSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editBrandTarget) return;
    const name = editBrandName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhãn hiệu/hãng');
      return;
    }
    try {
      await updateBrandMutation.mutateAsync({
        id: editBrandTarget.id,
        body: {
          name,
          country: editBrandCountry.trim() || null,
          description: editBrandDesc.trim() || null,
          sortOrder: editBrandTarget.sortOrder,
          isActive: editBrandTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật nhãn hiệu "${name}"`);
      setEditBrandTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật nhãn hiệu'));
    }
  };

  const handleDeleteBrandConfirm = async () => {
    if (!deleteBrandTarget) return;
    try {
      await deleteBrandMutation.mutateAsync(deleteBrandTarget.id);
      showToast('success', `Đã xóa nhãn hiệu "${deleteBrandTarget.name}"`);
      setDeleteBrandTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhãn hiệu'));
    }
  };

  // ── Handlers: Countries (Origins) ────────────────────────────────────────
  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newOriginName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên quốc gia sản xuất');
      return;
    }
    try {
      await createOriginMutation.mutateAsync({
        name,
        region: newOriginRegion.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm quốc gia "${name}"`);
      setNewOriginName('');
      setNewOriginRegion('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm xuất xứ'));
    }
  };

  const handleToggleOrigin = async (item: MaterialOriginApiDto) => {
    try {
      await updateOriginMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, region: item.region, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditOrigin = (item: MaterialOriginApiDto) => {
    setEditOriginTarget(item);
    setEditOriginName(item.name);
    setEditOriginRegion(item.region ?? '');
  };

  const handleEditOriginSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editOriginTarget) return;
    const name = editOriginName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên quốc gia sản xuất');
      return;
    }
    try {
      await updateOriginMutation.mutateAsync({
        id: editOriginTarget.id,
        body: {
          name,
          region: editOriginRegion.trim() || null,
          sortOrder: editOriginTarget.sortOrder,
          isActive: editOriginTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật quốc gia "${name}"`);
      setEditOriginTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật'));
    }
  };

  const handleDeleteOriginConfirm = async () => {
    if (!deleteOriginTarget) return;
    try {
      await deleteOriginMutation.mutateAsync(deleteOriginTarget.id);
      showToast('success', `Đã xóa "${deleteOriginTarget.name}"`);
      setDeleteOriginTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa xuất xứ'));
    }
  };

  // ── Handlers: Regions ────────────────────────────────────────────────────
  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRegionName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhóm nước');
      return;
    }
    try {
      await createRegionMutation.mutateAsync({
        name,
        description: newRegionDesc.trim() || null,
        isActive: true,
      });
      showToast('success', `Đã thêm nhóm nước "${name}"`);
      setNewRegionName('');
      setNewRegionDesc('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm nhóm nước'));
    }
  };

  const handleToggleRegion = async (item: MaterialRegionApiDto) => {
    try {
      await updateRegionMutation.mutateAsync({
        id: item.id,
        body: { name: item.name, description: item.description, sortOrder: item.sortOrder, isActive: !item.isActive },
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const openEditRegion = (item: MaterialRegionApiDto) => {
    setEditRegionTarget(item);
    setEditRegionName(item.name);
    setEditRegionDesc(item.description ?? '');
  };

  const handleEditRegionSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editRegionTarget) return;
    const name = editRegionName.trim();
    if (!name) {
      showToast('warning', 'Vui lòng nhập tên nhóm nước');
      return;
    }
    try {
      await updateRegionMutation.mutateAsync({
        id: editRegionTarget.id,
        body: {
          name,
          description: editRegionDesc.trim() || null,
          sortOrder: editRegionTarget.sortOrder,
          isActive: editRegionTarget.isActive,
        },
      });
      showToast('success', `Đã cập nhật nhóm nước "${name}"`);
      setEditRegionTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật nhóm nước'));
    }
  };

  const handleDeleteRegionConfirm = async () => {
    if (!deleteRegionTarget) return;
    try {
      await deleteRegionMutation.mutateAsync(deleteRegionTarget.id);
      showToast('success', `Đã xóa nhóm nước "${deleteRegionTarget.name}"`);
      setDeleteRegionTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhóm nước'));
    }
  };

  return (
    <>
      <div className="hrm-settings-grid hrm-settings-grid--recruitment">
        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
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

          {/* TAB 1: BRANDS (NHÃN HIỆU / HÃNG) */}
          {activeTab === 'brands' && (
            <div className="space-y-4">
              <form onSubmit={handleAddBrand} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Tên hãng/nhãn hiệu (VD: Hòa Phát, Wilo, Ebara...)"
                  className="hrm-field-input flex-1"
                  disabled={createBrandMutation.isPending}
                />
                <input
                  type="text"
                  value={newBrandCountry}
                  onChange={e => setNewBrandCountry(e.target.value)}
                  placeholder="Quốc gia (tuỳ chọn)"
                  className="hrm-field-input sm:w-44"
                  disabled={createBrandMutation.isPending}
                />
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
                  disabled={createBrandMutation.isPending}
                >
                  <Plus size={18} />
                  Thêm hãng
                </button>
              </form>

              <div className="hrm-recruitment-position-search">
                <SearchBar
                  value={brandSearch}
                  onChange={setBrandSearch}
                  placeholder="Tìm theo tên hãng hoặc quốc gia..."
                />
              </div>

              {loadingBrands ? (
                <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
              ) : errorBrands ? (
                <div className="hrm-recruitment-positions-empty">Không thể tải danh sách nhãn hiệu.</div>
              ) : filteredBrands.length === 0 ? (
                <div className="hrm-recruitment-positions-empty">
                  {brandSearch ? 'Không tìm thấy nhãn hiệu phù hợp.' : 'Chưa có nhãn hiệu nào.'}
                </div>
              ) : (
                <div className="hrm-recruitment-positions-grid">
                  {filteredBrands.map(item => (
                    <div
                      key={item.id}
                      className={`hrm-recruitment-position-card hrm-admin-role-card${
                        item.isActive ? '' : ' hrm-recruitment-position-card--inactive'
                      }`}
                    >
                      <div className="hrm-admin-role-card__text min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="hrm-recruitment-position-card__name font-medium" title={item.name}>
                            {item.name}
                          </span>
                          {item.country && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.country}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 truncate" title={item.description}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="hrm-recruitment-position-card__actions">
                        <button
                          type="button"
                          onClick={() => openEditBrand(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Sửa nhãn hiệu"
                          aria-label={`Sửa nhãn hiệu ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleBrand(item)}
                          className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                          role="switch"
                          aria-checked={item.isActive}
                          title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                        >
                          <span className="hrm-toggle-switch__thumb" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteBrandTarget(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Xóa nhãn hiệu"
                          aria-label={`Xóa nhãn hiệu ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="hrm-recruitment-positions-meta">
                Tổng <strong>{filteredBrands.length}</strong> nhãn hiệu/hãng
                {brandSearch && <> · Đang lọc theo &ldquo;{brandSearch}&rdquo;</>}
              </p>
            </div>
          )}

          {/* TAB 2: COUNTRIES (NƯỚC SẢN XUẤT) */}
          {activeTab === 'countries' && (
            <div className="space-y-4">
              <form onSubmit={handleAddOrigin} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newOriginName}
                  onChange={e => setNewOriginName(e.target.value)}
                  placeholder="Tên quốc gia (VD: Việt Nam, Đức, Nhật Bản...)"
                  className="hrm-field-input flex-1"
                  disabled={createOriginMutation.isPending}
                />
                <select
                  value={newOriginRegion}
                  onChange={e => setNewOriginRegion(e.target.value)}
                  className="hrm-field-select sm:w-48"
                  disabled={createOriginMutation.isPending}
                >
                  <option value="">-- Nhóm nước --</option>
                  {regions.filter(r => r.isActive).map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
                  disabled={createOriginMutation.isPending}
                >
                  <Plus size={18} />
                  Thêm nước
                </button>
              </form>

              <div className="hrm-recruitment-position-search">
                <SearchBar
                  value={originSearch}
                  onChange={setOriginSearch}
                  placeholder="Tìm theo tên quốc gia hoặc nhóm nước..."
                />
              </div>

              {loadingOrigins ? (
                <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
              ) : errorOrigins ? (
                <div className="hrm-recruitment-positions-empty">Không thể tải danh sách xuất xứ.</div>
              ) : filteredOrigins.length === 0 ? (
                <div className="hrm-recruitment-positions-empty">
                  {originSearch ? 'Không tìm thấy xuất xứ phù hợp.' : 'Chưa có xuất xứ nào.'}
                </div>
              ) : (
                <div className="hrm-recruitment-positions-grid">
                  {filteredOrigins.map(item => (
                    <div
                      key={item.id}
                      className={`hrm-recruitment-position-card hrm-admin-role-card${
                        item.isActive ? '' : ' hrm-recruitment-position-card--inactive'
                      }`}
                    >
                      <div className="hrm-admin-role-card__text min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="hrm-recruitment-position-card__name font-medium" title={item.name}>
                            {item.name}
                          </span>
                          {item.region && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.region}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hrm-recruitment-position-card__actions">
                        <button
                          type="button"
                          onClick={() => openEditOrigin(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Sửa xuất xứ"
                          aria-label={`Sửa xuất xứ ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleOrigin(item)}
                          className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                          role="switch"
                          aria-checked={item.isActive}
                          title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                        >
                          <span className="hrm-toggle-switch__thumb" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteOriginTarget(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Xóa xuất xứ"
                          aria-label={`Xóa xuất xứ ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="hrm-recruitment-positions-meta">
                Tổng <strong>{filteredOrigins.length}</strong> quốc gia
                {originSearch && <> · Đang lọc theo &ldquo;{originSearch}&rdquo;</>}
              </p>
            </div>
          )}

          {/* TAB 3: REGIONS (NHÓM NƯỚC) */}
          {activeTab === 'regions' && (
            <div className="space-y-4">
              <form onSubmit={handleAddRegion} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newRegionName}
                  onChange={e => setNewRegionName(e.target.value)}
                  placeholder="Tên nhóm nước (VD: G7, EU, ĐNA, Châu Á, Khác...)"
                  className="hrm-field-input flex-1"
                  disabled={createRegionMutation.isPending}
                />
                <input
                  type="text"
                  value={newRegionDesc}
                  onChange={e => setNewRegionDesc(e.target.value)}
                  placeholder="Mô tả / Ghi chú (tuỳ chọn)"
                  className="hrm-field-input sm:w-56"
                  disabled={createRegionMutation.isPending}
                />
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
                  disabled={createRegionMutation.isPending}
                >
                  <Plus size={18} />
                  Thêm nhóm
                </button>
              </form>

              <div className="hrm-recruitment-position-search">
                <SearchBar
                  value={regionSearch}
                  onChange={setRegionSearch}
                  placeholder="Tìm theo tên nhóm nước hoặc mô tả..."
                />
              </div>

              {loadingRegions ? (
                <div className="hrm-recruitment-positions-empty">{UI_LOADING.default}</div>
              ) : errorRegions ? (
                <div className="hrm-recruitment-positions-empty">Không thể tải danh sách nhóm nước.</div>
              ) : filteredRegions.length === 0 ? (
                <div className="hrm-recruitment-positions-empty">
                  {regionSearch ? 'Không tìm thấy nhóm nước phù hợp.' : 'Chưa có nhóm nước nào.'}
                </div>
              ) : (
                <div className="hrm-recruitment-positions-grid">
                  {filteredRegions.map(item => (
                    <div
                      key={item.id}
                      className={`hrm-recruitment-position-card hrm-admin-role-card${
                        item.isActive ? '' : ' hrm-recruitment-position-card--inactive'
                      }`}
                    >
                      <div className="hrm-admin-role-card__text min-w-0">
                        <span className="hrm-recruitment-position-card__name font-bold" title={item.name}>
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 truncate" title={item.description}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="hrm-recruitment-position-card__actions">
                        <button
                          type="button"
                          onClick={() => openEditRegion(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Sửa nhóm nước"
                          aria-label={`Sửa nhóm nước ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleRegion(item)}
                          className={`hrm-toggle-switch${item.isActive ? ' hrm-toggle-switch--on' : ''}`}
                          role="switch"
                          aria-checked={item.isActive}
                          title={item.isActive ? 'Đang bật' : 'Đang tắt'}
                        >
                          <span className="hrm-toggle-switch__thumb" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRegionTarget(item)}
                          className="hrm-recruitment-position-card__delete"
                          title="Xóa nhóm nước"
                          aria-label={`Xóa nhóm nước ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="hrm-recruitment-positions-meta">
                Tổng <strong>{filteredRegions.length}</strong> nhóm nước
                {regionSearch && <> · Đang lọc theo &ldquo;{regionSearch}&rdquo;</>}
              </p>
            </div>
          )}
        </HrmPanel>

        {/* Cột hướng dẫn */}
        <HrmPanel className="hrm-settings-card">
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
        </HrmPanel>
      </div>

      {/* Modal Edit Brand */}
      <Modal
        isOpen={editBrandTarget !== null}
        onClose={() => setEditBrandTarget(null)}
        title="Sửa nhãn hiệu / hãng"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditBrandTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateBrandMutation.isPending}
              onClick={() => void handleEditBrandSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditBrandSave} className="space-y-3">
          <FormField label="Tên nhãn hiệu / hãng" required>
            <input
              type="text"
              value={editBrandName}
              onChange={e => setEditBrandName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Quốc gia (tuỳ chọn)">
            <input
              type="text"
              value={editBrandCountry}
              onChange={e => setEditBrandCountry(e.target.value)}
              className="form-input w-full"
              placeholder="VD: Việt Nam, Đức, Nhật Bản..."
            />
          </FormField>
          <FormField label="Mô tả / Ghi chú">
            <input
              type="text"
              value={editBrandDesc}
              onChange={e => setEditBrandDesc(e.target.value)}
              className="form-input w-full"
              placeholder="Ghi chú thêm về hãng..."
            />
          </FormField>
        </form>
      </Modal>

      {/* Modal Edit Country (Origin) */}
      <Modal
        isOpen={editOriginTarget !== null}
        onClose={() => setEditOriginTarget(null)}
        title="Sửa nước sản xuất"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditOriginTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateOriginMutation.isPending}
              onClick={() => void handleEditOriginSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditOriginSave} className="space-y-3">
          <FormField label="Tên nước sản xuất" required>
            <input
              type="text"
              value={editOriginName}
              onChange={e => setEditOriginName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Nhóm nước mặc định">
            <select
              value={editOriginRegion}
              onChange={e => setEditOriginRegion(e.target.value)}
              className="form-input w-full"
            >
              <option value="">-- Chưa gán nhóm nước --</option>
              {regions.filter(r => r.isActive).map(r => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      {/* Modal Edit Region */}
      <Modal
        isOpen={editRegionTarget !== null}
        onClose={() => setEditRegionTarget(null)}
        title="Sửa nhóm nước"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditRegionTarget(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateRegionMutation.isPending}
              onClick={() => void handleEditRegionSave()}
            >
              Lưu
            </button>
          </>
        }
      >
        <form onSubmit={handleEditRegionSave} className="space-y-3">
          <FormField label="Tên nhóm nước" required>
            <input
              type="text"
              value={editRegionName}
              onChange={e => setEditRegionName(e.target.value)}
              className="form-input w-full"
              autoFocus
            />
          </FormField>
          <FormField label="Mô tả / Diễn giải">
            <input
              type="text"
              value={editRegionDesc}
              onChange={e => setEditRegionDesc(e.target.value)}
              className="form-input w-full"
              placeholder="VD: Khối các nước công nghiệp tiên tiến..."
            />
          </FormField>
        </form>
      </Modal>

      {/* Confirm Delete Brand */}
      <ConfirmDialog
        isOpen={deleteBrandTarget !== null}
        title="Xóa nhãn hiệu"
        message={
          deleteBrandTarget
            ? `Bạn có chắc muốn xóa nhãn hiệu "${deleteBrandTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteBrandConfirm}
        onClose={() => setDeleteBrandTarget(null)}
      />

      {/* Confirm Delete Country */}
      <ConfirmDialog
        isOpen={deleteOriginTarget !== null}
        title="Xóa xuất xứ"
        message={
          deleteOriginTarget
            ? `Bạn có chắc muốn xóa xuất xứ "${deleteOriginTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteOriginConfirm}
        onClose={() => setDeleteOriginTarget(null)}
      />

      {/* Confirm Delete Region */}
      <ConfirmDialog
        isOpen={deleteRegionTarget !== null}
        title="Xóa nhóm nước"
        message={
          deleteRegionTarget
            ? `Bạn có chắc muốn xóa nhóm nước "${deleteRegionTarget.name}"? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={handleDeleteRegionConfirm}
        onClose={() => setDeleteRegionTarget(null)}
      />
    </>
  );
}
