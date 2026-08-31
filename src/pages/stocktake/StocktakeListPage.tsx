import { useMemo, useState } from 'react';
import { Plus, Eye, FileText, Download, Check, XCircle, Lock, Unlock } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PermissionGate from '../../components/auth/PermissionGate';
import {
  useStocktakes,
  useCreateStocktake,
  useUpdateStocktake,
  useApproveStocktake,
} from '../../hooks/useStocktakes';
import { useProjects, useProjectInventory } from '../../hooks/useProjects';
import { useMaterials } from '../../hooks/useMaterials';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { fmtStocktakeDiff, computeStocktakeDiff } from '../../lib/wms/stockQtyFormat';
import { printVoucherWithFeedback } from '../../lib/wms/printVoucher';
import { buildStocktakePrintPayload } from '../../lib/wms/voucherPrintBuilders';
import { showToast } from '../../components/ui/Toast';
import TabFilter from '../../components/ui/TabFilter';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import QtyStepper from '../../components/ui/QtyStepper';
import type { Stocktake, StocktakeItem, DropdownItem } from '../../types';
import type { CreateStocktakeDto } from '../../services/stocktakesService';
import type { Material } from '../../types';

interface FormItem {
  materialCode: string;
  systemQty: string;
  actualQty: string;
}

interface StocktakeForm {
  projectCode: string;
  note: string;
  items: FormItem[];
}

interface FormErrors {
  projectCode?: string;
  items?: string;
  [key: string]: string | undefined;
}

const emptyForm: StocktakeForm = {
  projectCode: '',
  note: '',
  items: [{ materialCode: '', systemQty: '', actualQty: '' }],
};

function diffTone(systemQty: number, actualQty: number): string {
  const diff = computeStocktakeDiff(systemQty, actualQty);
  if (Number.isNaN(diff)) return '';
  if (diff > 0) return 'text-[var(--md-success)]';
  if (diff < 0) return 'text-[var(--md-error)]';
  return 'text-[var(--md-on-surface-variant)]';
}

function buildStocktakeItem(
  materialCode: string,
  systemQty: number,
  actualQty: number,
  materials: Material[],
): StocktakeItem {
  const mat = materials.find(m => m.materialCode === materialCode);
  return {
    productId: materialCode,
    sku: materialCode,
    name: mat?.materialName ?? materialCode,
    systemQty,
    actualQty,
    diff: actualQty - systemQty,
  };
}

function toStocktakeUpdateDto(
  item: Stocktake,
  patch: Partial<CreateStocktakeDto> = {},
): CreateStocktakeDto & { id: string } {
  return {
    id: item.id,
    voucherCode: item.voucherCode,
    date: item.date,
    createdBy: item.createdBy,
    status: item.status,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    condition: item.condition,
    isFrozen: item.isFrozen,
    note: item.note ?? '',
    items: item.items,
    ...patch,
  };
}

export default function StocktakeListPage() {
  const { data: list = [], isLoading, isError, error } = useStocktakes();
  const { data: projectsPage } = useProjects({ pageSize: 200, status: 'Active' });
  const { data: materialsPage } = useMaterials({ pageSize: 500 });
  const createMutation = useCreateStocktake();
  const updateMutation = useUpdateStocktake();
  const approveMutation = useApproveStocktake();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Stocktake | null>(null);
  const [form, setForm] = useState<StocktakeForm>({ ...emptyForm });
  const [errors, setErrors] = useState<FormErrors>({});

  const projects = useMemo(() => projectsPage?.items ?? [], [projectsPage?.items]);
  const materials = useMemo(() => materialsPage?.items ?? [], [materialsPage?.items]);
  const { data: projectInventory = [] } = useProjectInventory(form.projectCode || undefined);

  const inventoryByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of projectInventory) {
      map.set(row.materialCode, row.actualInventoryQty);
    }
    return map;
  }, [projectInventory]);

  const tabs = [
    { id: 'all', label: 'Tất cả', count: list.length },
    { id: 'approved', label: 'Đã duyệt', count: list.filter(s => s.status === 'approved').length },
    { id: 'pending', label: 'Chưa duyệt', count: list.filter(s => s.status === 'pending').length },
    { id: 'cancelled', label: 'Đã hủy', count: list.filter(s => s.status === 'cancelled').length },
  ];

  let filtered = list;
  if (activeTab !== 'all') filtered = filtered.filter(s => s.status === activeTab);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      s =>
        s.voucherCode.toLowerCase().includes(q) ||
        s.createdBy.toLowerCase().includes(q) ||
        s.warehouseName.toLowerCase().includes(q) ||
        s.warehouseId.toLowerCase().includes(q),
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const projectName = (code: string) =>
    projects.find(p => p.projectCode === code)?.projectName ?? code;

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.projectCode) errs.projectCode = 'Vui lòng chọn kho dự án kiểm kê';
    const validItems = form.items.filter(it => it.materialCode);
    if (validItems.length === 0) errs.items = 'Phải có ít nhất 1 vật tư kiểm kê';
    form.items.forEach((it, i) => {
      if (it.materialCode) {
        if (it.systemQty === '' || Number(it.systemQty) < 0) errs[`sysqty_${i}`] = 'Tồn hệ thống phải ≥ 0';
        if (it.actualQty === '' || Number(it.actualQty) < 0) errs[`actqty_${i}`] = 'Số đếm thực tế phải ≥ 0';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildCreateDto = (): CreateStocktakeDto | null => {
    if (!validate()) return null;
    const whName = projectName(form.projectCode);
    const mappedItems = form.items
      .filter(it => it.materialCode)
      .map(it =>
        buildStocktakeItem(it.materialCode, Number(it.systemQty), Number(it.actualQty), materials),
      );

    return {
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'pending',
      warehouseId: form.projectCode,
      warehouseName: whName,
      condition: 'counting',
      isFrozen: true,
      note: form.note,
      items: mappedItems,
    };
  };

  const handleSubmit = async (): Promise<void> => {
    const dto = buildCreateDto();
    if (!dto) return;
    try {
      const created = await createMutation.mutateAsync(dto);
      setShowCreate(false);
      setForm({ ...emptyForm });
      setErrors({});
      showToast(
        'success',
        `Phiếu kiểm kê ${created.voucherCode} đã được tạo. Vật tư đã đóng băng cho đến khi duyệt.`,
        'Tạo phiếu thành công',
      );
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể tạo phiếu kiểm kê'));
    }
  };

  const handleApprove = async (item: Stocktake): Promise<void> => {
    try {
      await approveMutation.mutateAsync(item.id);
      showToast('success', `Đã duyệt phiếu ${item.voucherCode}. Tồn dự án đã được điều chỉnh theo chênh lệch.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể duyệt phiếu kiểm kê'));
    }
  };

  const handleToggleFreeze = async (item: Stocktake): Promise<void> => {
    const newFrozen = !item.isFrozen;
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        dto: toStocktakeUpdateDto(item, { isFrozen: newFrozen }),
      });
      showToast(
        newFrozen ? 'warning' : 'success',
        newFrozen
          ? `Vật tư phiếu ${item.voucherCode} đã đóng băng.`
          : `Vật tư phiếu ${item.voucherCode} đã mở băng.`,
      );
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật trạng thái đóng băng'));
    }
  };

  const handleCancel = async (item: Stocktake): Promise<void> => {
    if (item.status === 'approved') {
      showToast('error', 'Không thể hủy phiếu đã duyệt');
      return;
    }
    if (item.status === 'cancelled') {
      showToast('error', 'Phiếu đã được hủy');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        dto: toStocktakeUpdateDto(item, { status: 'cancelled', isFrozen: false }),
      });
      if (selectedItem?.id === item.id) setShowDetail(false);
      showToast('warning', `Đã hủy phiếu ${item.voucherCode} — vẫn tra cứu được ở tab Đã hủy.`);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể hủy phiếu kiểm kê'));
    }
  };

  const addItem = (): void =>
    setForm({ ...form, items: [...form.items, { materialCode: '', systemQty: '', actualQty: '' }] });

  const removeItem = (i: number): void =>
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const updateItem = (i: number, field: keyof FormItem, val: string): void => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };

    if (field === 'materialCode' && val) {
      const sys = inventoryByCode.get(val);
      items[i].systemQty = sys !== undefined ? String(sys) : '0';
      if (items[i].actualQty === '') items[i].actualQty = items[i].systemQty;
    }

    setForm({ ...form, items });
  };

  const freezeBadgeClass = (tone: 'frozen' | 'open') =>
    [
      'badge inline-flex h-6 min-w-[6.75rem] shrink-0 items-center justify-center gap-1',
      tone === 'frozen' ? 'badge-error' : 'badge-success',
    ].join(' ');

  const renderFreezeBadge = (item: Stocktake) => {
    if (item.status !== 'pending') {
      return <span className="text-xs text-[var(--md-on-surface-variant)]">—</span>;
    }
    if (item.isFrozen) {
      return (
        <span className={freezeBadgeClass('frozen')}>
          <Lock size={12} className="shrink-0" aria-hidden />
          Đóng băng
        </span>
      );
    }
    return (
      <span className={freezeBadgeClass('open')}>
        <Unlock size={12} className="shrink-0" aria-hidden />
        Mở băng
      </span>
    );
  };

  const getActions = (item: Stocktake): DropdownItem[] => {
    const a: DropdownItem[] = [
      { label: 'Xem chi tiết', icon: Eye, onClick: () => { setSelectedItem(item); setShowDetail(true); } },
    ];
    if (item.status === 'pending') {
      a.push({ label: 'Duyệt phiếu', icon: Check, onClick: () => handleApprove(item) });
      a.push({
        label: item.isFrozen ? 'Mở băng' : 'Đóng băng',
        icon: item.isFrozen ? Unlock : Lock,
        onClick: () => handleToggleFreeze(item),
      });
      a.push({ divider: true });
      a.push({ label: 'Hủy phiếu', icon: XCircle, onClick: () => handleCancel(item), danger: true });
    }
    a.push({
      label: 'In phiếu',
      icon: FileText,
      onClick: () => printVoucherWithFeedback(buildStocktakePrintPayload(item)),
    });
    return a;
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="KIỂM KÊ"
        title="KIỂM KÊ KHO DỰ ÁN"
        actions={
          <>
            <button type="button" className="btn btn-outline text-xs"><Download size={14} /> XUẤT RA</button>
            <PermissionGate permission="wms.stocktakes.create">
              <button type="button" className="btn btn-filled" onClick={() => { setForm({ ...emptyForm }); setShowCreate(true); }}>
                <Plus size={16} /> TẠO MỚI
              </button>
            </PermissionGate>
          </>
        }
      />

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="px-4 pt-4">
          <TabFilter tabs={tabs} activeTab={activeTab} onChange={id => { setActiveTab(id); setPage(1); }} />
        </div>
        <div className="surface-panel__filter-bar px-4 pb-3 page-filter-bar">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm mã phiếu, kho dự án..." />
        </div>

        <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
          <table className="wms-inventory-table">
            <thead>
              <tr>
                <th className="table-header-cell">Ngày chứng từ</th>
                <th className="table-header-cell">Mã chứng từ</th>
                <th className="table-header-cell">Người tạo</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">Kho dự án</th>
                <th className="table-header-cell">Tình trạng</th>
                <th className="table-header-cell text-center w-28 min-w-[7rem]">Đóng băng</th>
                <th className="table-header-cell">Ghi chú</th>
                <th className="table-header-cell text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={9} />
              ) : isError ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message={getApiErrorMessage(error, UI_ERROR.loadStocktakes)} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState message="Không tìm thấy phiếu kiểm kê nào." />
                  </td>
                </tr>
              ) : (
                paginated.map(st => (
                  <tr
                    key={st.id}
                    className="table-row wms-inventory-row--interactive"
                    onClick={() => { setSelectedItem(st); setShowDetail(true); }}
                  >
                    <td className="table-cell">{st.date}</td>
                    <td className="table-cell">
                      <EntityCodeLink
                        code={st.voucherCode}
                        onClick={() => { setSelectedItem(st); setShowDetail(true); }}
                      />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="table-user-avatar">
                          <span>{st.createdBy.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                        </div>
                        <span>{st.createdBy}</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge status={st.status} /></td>
                    <td className="table-cell font-medium">
                      <div>{st.warehouseName}</div>
                      {st.warehouseId ? (
                        <span className="entity-code">{st.warehouseId}</span>
                      ) : null}
                    </td>
                    <td className="table-cell"><Badge status={st.condition} /></td>
                    <td className="table-cell text-center w-28 min-w-[7rem]">{renderFreezeBadge(st)}</td>
                    <td className="table-cell text-[var(--md-on-surface-variant)] max-w-[180px] truncate">{st.note || '—'}</td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <Dropdown items={getActions(st)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={filtered.length}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setErrors({}); }}
        title="TẠO PHIẾU KIỂM KÊ"
        size="full"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => { setShowCreate(false); setErrors({}); }}>
              Hủy bỏ
            </button>
            <button type="button" className="btn btn-primary" disabled={createMutation.isPending} onClick={handleSubmit}>
              Tạo phiếu kiểm kê
            </button>
          </>
        }
      >
        <div className="space-y-4 modal-form-bordered">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormField label="Kho dự án kiểm kê" required error={errors.projectCode}>
              <select
                className="form-select"
                value={form.projectCode}
                onChange={e => setForm({ ...emptyForm, projectCode: e.target.value, note: form.note })}
              >
                <option value="">— Chọn kho dự án —</option>
                {projects.map(p => (
                  <option key={p.projectCode} value={p.projectCode}>
                    {p.projectCode} — {p.projectName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Ghi chú">
              <input
                className="form-input"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Kiểm kê cuối tháng..."
              />
            </FormField>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h4 className="wms-section-heading">Danh sách vật tư kiểm kê</h4>
            <button type="button" className="btn btn-outline text-xs" onClick={addItem} disabled={!form.projectCode}>
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div className="alert-banner alert-banner--info mb-3 text-xs">
            <p>
              Chọn kho dự án trước. <strong>Tồn hệ thống</strong> tự điền từ tồn thực tế dự án.
              Chênh lệch = số đếm thực tế − tồn hệ thống (+ thừa, − thiếu, 0 khớp).
            </p>
          </div>

          {!form.projectCode && (
            <p className="text-xs text-[var(--md-on-surface-variant)] mb-2">Chọn kho dự án để thêm vật tư kiểm kê.</p>
          )}
          {errors.items && <p className="text-[var(--md-error)] text-xs mb-2">{errors.items}</p>}

          <div className="overflow-x-auto table-scroll">
            <table className="form-table text-xs table-min-w--850">
              <thead>
                <tr>
                  <th className="table-header-cell w-12">STT</th>
                  <th className="table-header-cell">Vật tư</th>
                  <th className="table-header-cell w-28">Tồn hệ thống</th>
                  <th className="table-header-cell w-28">SL thực tế</th>
                  <th className="table-header-cell w-24 text-right">Chênh lệch</th>
                  <th className="table-header-cell w-12" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, i) => {
                  const sys = it.systemQty === '' ? NaN : Number(it.systemQty);
                  const act = it.actualQty === '' ? NaN : Number(it.actualQty);
                  const diffClass = it.materialCode && !Number.isNaN(sys) && !Number.isNaN(act)
                    ? diffTone(sys, act)
                    : '';

                  return (
                    <tr key={i} className="table-row">
                      <td className="table-cell text-center">{i + 1}</td>
                      <td className="table-cell">
                        <MaterialAutocomplete
                          value={it.materialCode}
                          onChange={code => updateItem(i, 'materialCode', code)}
                          materials={materials}
                          disabled={!form.projectCode}
                          placeholder={form.projectCode ? 'Chọn vật tư...' : 'Chọn kho trước'}
                        />
                      </td>
                      <td className="table-cell w-28">
                        <input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          aria-readonly
                          className="form-input text-right tabular-nums cursor-default"
                          value={it.systemQty || '—'}
                        />
                      </td>
                      <td className="table-cell w-28">
                        <div className={!it.materialCode ? 'opacity-40 pointer-events-none' : undefined}>
                          <QtyStepper
                            value={it.actualQty === '' ? '0' : it.actualQty}
                            onChange={val => updateItem(i, 'actualQty', val)}
                            min={0}
                            className={errors[`actqty_${i}`] ? 'ring-1 ring-[var(--md-error)] rounded-md' : ''}
                          />
                        </div>
                        {errors[`actqty_${i}`] && (
                          <p className="text-[var(--md-error)] text-[10px] mt-1">{errors[`actqty_${i}`]}</p>
                        )}
                      </td>
                      <td className={`table-cell text-right font-bold text-sm tabular-nums w-24 min-w-24 ${diffClass}`}>
                        <span className="inline-block min-w-[4rem] text-right">
                          {it.materialCode && !Number.isNaN(sys) && !Number.isNaN(act)
                            ? fmtStocktakeDiff(sys, act)
                            : '—'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {form.items.length > 1 && (
                          <button type="button" className="p-1 text-[var(--md-error)] hover:opacity-80" onClick={() => removeItem(i)}>
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={`PHIẾU KIỂM KÊ — ${selectedItem?.voucherCode || ''}`}
        size="xl"
        footer={
          selectedItem ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => printVoucherWithFeedback(buildStocktakePrintPayload(selectedItem))}
              >
                <FileText size={14} /> In phiếu
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setShowDetail(false)}>Đóng</button>
          )
        }
      >
        {selectedItem && (
          <>
            <div className="wms-detail-summary">
              <div><span className="wms-detail-tile__label">Mã chứng từ</span><p className="entity-code">{selectedItem.voucherCode}</p></div>
              <div><span className="wms-detail-tile__label">Ngày</span><p className="font-medium text-sm">{selectedItem.date}</p></div>
              <div><span className="wms-detail-tile__label">Kho dự án</span><p className="font-medium text-sm">{selectedItem.warehouseName}</p></div>
              <div><span className="wms-detail-tile__label">Trạng thái</span><div className="mt-0.5"><Badge status={selectedItem.status} /></div></div>
              <div><span className="wms-detail-tile__label">Tình trạng</span><div className="mt-0.5"><Badge status={selectedItem.condition} /></div></div>
              <div><span className="wms-detail-tile__label">Đóng băng</span>
                <p className={`text-sm font-medium ${selectedItem.isFrozen ? 'text-[var(--md-error)]' : 'text-[var(--md-success)]'}`}>
                  {selectedItem.isFrozen ? 'Đang đóng băng' : 'Đã mở băng'}
                </p>
              </div>
              {selectedItem.note && (
                <div className="col-span-2">
                  <span className="wms-detail-tile__label">Ghi chú</span>
                  <p className="text-sm">{selectedItem.note}</p>
                </div>
              )}
            </div>
            {selectedItem.items?.length > 0 ? (
              <table className="wms-inventory-table wms-voucher-detail-table">
                <thead>
                  <tr>
                    <th className="table-header-cell">Tên hàng</th>
                    <th className="table-header-cell">Mã VT</th>
                    <th className="table-header-cell text-right">Tồn HT</th>
                    <th className="table-header-cell text-right">SL thực tế</th>
                    <th className="table-header-cell text-right">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.items.map((it, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell">{it.name}</td>
                      <td className="table-cell font-mono text-xs">{it.sku}</td>
                      <td className="table-cell text-right tabular-nums">{it.systemQty}</td>
                      <td className="table-cell text-right tabular-nums">{it.actualQty}</td>
                      <td className={`table-cell text-right font-bold tabular-nums ${diffTone(it.systemQty, it.actualQty)}`}>
                        {fmtStocktakeDiff(it.systemQty, it.actualQty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-[var(--md-on-surface-variant)] py-8">Không có mặt hàng nào</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
