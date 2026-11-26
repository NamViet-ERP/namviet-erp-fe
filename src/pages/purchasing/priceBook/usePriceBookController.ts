import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../auth/AuthProvider';
import { rootCategoryIdOf } from '../../../components/purchasing/MaterialByGroupFields';
import { showToast } from '../../../components/ui/Toast';
import { isSessionAdmin } from '../../../constants/systemUsers';
import { useCategoryTree } from '../../../hooks/useCategories';
import { useMarkupSettings } from '../../../hooks/useMarkupSettings';
import { useMaterials } from '../../../hooks/useMaterials';
import { usePermission } from '../../../hooks/usePermission';
import { useProjects } from '../../../hooks/useProjects';
import {
  usePriceBookCategories,
  usePriceBookEstimates,
  usePriceBookItem,
  usePriceBookItems,
  usePriceBookMargins,
  usePriceBookMatrix,
  useUpsertEstimatePrice,
  useUpsertSellPrice,
} from '../../../hooks/usePurchasePriceBook';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type {
  PriceBookEstimateRowApiDto,
  PriceBookMarginRowApiDto,
} from '../../../types/api/purchasingApi';
import type { EstimateFormState, SellFormState } from './PriceBookUpsertModals';
import {
  PRICE_BOOK_THIS_YEAR,
  PRICE_BOOK_YEARS,
  categoryOption,
  periodRange,
  type PriceBookPeriodType,
  type PriceBookTab,
} from './priceBookHelpers';

const PERIOD_LABELS: Record<PriceBookPeriodType, string> = {
  all: 'Tất cả (toàn bộ lịch sử)',
  month: 'Theo tháng',
  quarter: 'Theo quý',
  year: 'Theo năm',
};

export const PRICE_BOOK_PERIOD_OPTIONS = [
  'Tất cả (toàn bộ lịch sử)',
  'Theo tháng',
  'Theo quý',
  'Theo năm',
];
export const PRICE_BOOK_YEAR_OPTIONS = PRICE_BOOK_YEARS.map(String);
export const PRICE_BOOK_QUARTER_OPTIONS = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];
export const PRICE_BOOK_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

export function usePriceBookController() {
  const { has } = usePermission();
  const { user, permissions } = useSession();
  const isAdmin = isSessionAdmin(user);
  const roleLower = (user?.role ?? '').toLowerCase();
  const isBoss =
    isAdmin ||
    roleLower.includes('director') ||
    roleLower.includes('manager') ||
    roleLower.includes('giam_doc') ||
    roleLower.includes('truong_phong') ||
    roleLower.includes('bld') ||
    permissions.includes('admin.users.view:all') ||
    permissions.includes('purchasing.pricebook.update');

  const {
    config: markupConfig,
    isSaving: isSavingMarkup,
    saveConfig: saveMarkupConfig,
    getMarkupPercent,
    saveItemMarkup,
  } = useMarkupSettings();
  const [markupModalOpen, setMarkupModalOpen] = useState(false);

  const canWriteRfq = has('purchasing.rfq.create');
  const canUpdateRfq = has('purchasing.rfq.update');
  const canUpdateBook = has('purchasing.pricebook.update');

  const [tab, setTab] = useState<PriceBookTab>('items');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [periodType, setPeriodType] = useState<PriceBookPeriodType>('all');
  const [periodYear, setPeriodYear] = useState(PRICE_BOOK_THIS_YEAR);
  const [periodQuarter, setPeriodQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [matrixCategoryId, setMatrixCategoryId] = useState<number | ''>('');
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [rfqPresetCode, setRfqPresetCode] = useState('');
  const [sellOpen, setSellOpen] = useState(false);
  const [sellForm, setSellForm] = useState<SellFormState>({
    materialCode: '',
    projectCode: '',
    sellPrice: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateCategoryId, setEstimateCategoryId] = useState<number | ''>('');
  const [estimateForm, setEstimateForm] = useState<EstimateFormState>({
    materialCode: '',
    projectCode: '',
    estimatePrice: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const range = periodRange(periodType, periodYear, periodQuarter, periodMonth);
  const items = usePriceBookItems(
    search.trim() || undefined,
    categoryId === '' ? undefined : categoryId,
    tab === 'items',
    range.from,
    range.to,
  );
  const allItems = usePriceBookItems(
    undefined,
    undefined,
    tab === 'matrix' || tab === 'margins' || tab === 'estimates',
  );
  const matrix = usePriceBookMatrix(matrixCategoryId === '' ? undefined : matrixCategoryId);
  const groups = usePriceBookCategories(tab === 'groups' || tab === 'matrix');
  const margins = usePriceBookMargins(tab === 'margins');
  const estimates = usePriceBookEstimates(tab === 'estimates');
  const detail = usePriceBookItem(detailCode ?? undefined);
  const upsertSell = useUpsertSellPrice();
  const upsertEstimate = useUpsertEstimatePrice();
  const { data: categories = [] } = useCategoryTree();
  const { data: materialsPage } = useMaterials({
    page: 1,
    pageSize: 500,
    categoryId: estimateCategoryId === '' ? undefined : estimateCategoryId,
  });
  const { data: projectsPage } = useProjects({ page: 1, pageSize: 200 });
  const materials = materialsPage?.items ?? [];
  const projects = projectsPage?.items ?? [];

  const rootCategories = useMemo(
    () => categories.filter(c => c.level === 1 && c.code !== 'UNCATEGORIZED' && c.isActive),
    [categories],
  );

  const matrixCategories = useMemo(() => {
    const fromGroups = (groups.data ?? []).map(row => ({
      id: row.categoryId,
      code: row.categoryCode,
      name: row.categoryName,
    }));
    return fromGroups.length > 0 ? fromGroups : rootCategories;
  }, [groups.data, rootCategories]);

  const categoryLabels = useMemo(() => rootCategories.map(categoryOption), [rootCategories]);
  const matrixCategoryLabels = useMemo(() => matrixCategories.map(categoryOption), [matrixCategories]);
  const itemsCategoryValue = rootCategories.find(c => c.id === categoryId);
  const matrixCategoryValue = matrixCategories.find(c => c.id === matrixCategoryId);

  useEffect(() => {
    if (tab === 'matrix' && matrixCategories.length > 0) {
      const valid =
        matrixCategoryId !== '' && matrixCategories.some(c => c.id === matrixCategoryId);
      if (!valid) {
        setMatrixCategoryId(matrixCategories[0]!.id);
      }
    }
  }, [tab, matrixCategories, matrixCategoryId]);

  const saveSell = async () => {
    const price = Number(String(sellForm.sellPrice).replace(/[^\d.-]/g, ''));
    if (!sellForm.materialCode || !sellForm.effectiveDate || !(price > 0)) {
      showToast('error', 'Nhập vật tư, ngày hiệu lực và giá bán.');
      return;
    }
    try {
      await upsertSell.mutateAsync({
        materialCode: sellForm.materialCode,
        projectCode: sellForm.projectCode || null,
        sellPrice: price,
        effectiveDate: sellForm.effectiveDate,
        note: sellForm.note || null,
      });
      showToast('success', 'Đã ghi giá bán.');
      setSellForm(f => ({ ...f, sellPrice: '', note: '' }));
      setSellOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không ghi được giá bán.'));
    }
  };

  const saveEstimate = async () => {
    const price = Number(String(estimateForm.estimatePrice).replace(/[^\d.-]/g, ''));
    if (estimateCategoryId === '' || !estimateForm.materialCode || !estimateForm.effectiveDate || !(price > 0)) {
      showToast('error', 'Chọn nhóm vật tư, vật tư, ngày hiệu lực và giá dự toán.');
      return;
    }
    try {
      await upsertEstimate.mutateAsync({
        materialCode: estimateForm.materialCode,
        projectCode: estimateForm.projectCode || null,
        estimatePrice: price,
        effectiveDate: estimateForm.effectiveDate,
        note: estimateForm.note || null,
      });
      showToast('success', 'Đã ghi giá dự toán.');
      setEstimateForm(f => ({ ...f, estimatePrice: '', note: '' }));
      setEstimateOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không ghi được giá dự toán.'));
    }
  };

  const openCreateEstimateModal = () => {
    setEstimateCategoryId('');
    setEstimateForm({
      materialCode: '',
      projectCode: '',
      estimatePrice: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
      note: '',
    });
    setEstimateOpen(true);
  };

  const openEditEstimateModal = (row: PriceBookEstimateRowApiDto) => {
    const mat = materials.find(m => m.materialCode === row.materialCode);
    setEstimateCategoryId(rootCategoryIdOf(mat?.categoryId, categories));
    setEstimateForm({
      materialCode: row.materialCode,
      projectCode: row.projectCode ?? '',
      estimatePrice: String(row.estimatePrice),
      effectiveDate: row.effectiveDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      note: '',
    });
    setEstimateOpen(true);
  };

  const openAddEstimateForMaterial = (code: string) => {
    const mat = materials.find(m => m.materialCode === code);
    setEstimateCategoryId(rootCategoryIdOf(mat?.categoryId, categories));
    setEstimateForm(f => ({ ...f, materialCode: code, projectCode: '', estimatePrice: '' }));
    setEstimateOpen(true);
  };

  const openEditSellModal = (row: PriceBookMarginRowApiDto) => {
    setSellForm(f => ({
      ...f,
      materialCode: row.materialCode,
      projectCode: row.projectCode ?? '',
      sellPrice: String(row.sellPrice),
      effectiveDate: row.effectiveDate?.slice(0, 10) || f.effectiveDate,
    }));
    setSellOpen(true);
  };

  const openAddSellForMaterial = (code: string) => {
    setSellForm(f => ({ ...f, materialCode: code, projectCode: '', sellPrice: '' }));
    setSellOpen(true);
  };

  const missingEstimate =
    allItems.data?.filter(
      i => i.latestPrice != null && !(estimates.data ?? []).some(m => m.materialCode === i.materialCode),
    ) ?? [];

  const missingSell =
    allItems.data?.filter(
      i => i.latestPrice != null && !(margins.data ?? []).some(m => m.materialCode === i.materialCode),
    ) ?? [];

  return {
    isBoss,
    setMarkupModalOpen,
    canWriteRfq,
    canUpdateRfq,
    canUpdateBook,
    tab,
    setTab,
    search,
    setSearch,
    hasActiveItemsFilter: Boolean(search.trim() || categoryId || periodType !== 'all'),
    periodType,
    periodLabel: PERIOD_LABELS[periodType],
    selectPeriodLabel: (label: string) => {
      if (label.startsWith('Tất cả')) setPeriodType('all');
      else if (label === 'Theo tháng') setPeriodType('month');
      else if (label === 'Theo quý') setPeriodType('quarter');
      else setPeriodType('year');
    },
    periodYear,
    setPeriodYear,
    periodQuarter,
    setPeriodQuarter,
    periodMonth,
    setPeriodMonth,
    matrixCategoryId,
    setMatrixCategoryId,
    rfqPresetCode,
    setSellOpen,
    items,
    matrix,
    groups,
    margins,
    estimates,
    categoryLabels,
    matrixCategoryLabels,
    itemsCategoryLabel: itemsCategoryValue ? categoryOption(itemsCategoryValue) : '',
    selectItemsCategoryLabel: (label: string) => {
      setCategoryId(rootCategories.find(c => categoryOption(c) === label)?.id ?? '');
    },
    matrixCategoryLabel: matrixCategoryValue ? categoryOption(matrixCategoryValue) : '',
    selectMatrixCategoryLabel: (label: string) => {
      setMatrixCategoryId(matrixCategories.find(c => categoryOption(c) === label)?.id ?? '');
    },
    openCreateEstimateModal,
    resetItemsFilter: () => {
      setCategoryId('');
      setSearch('');
      setPeriodType('all');
    },
    itemsTableProps: {
      loading: items.isLoading,
      rows: items.data ?? [],
      onOpen: setDetailCode,
      isBoss,
      getMarkupPercent,
      onSaveItemMarkup: saveItemMarkup,
    },
    estimatesTableProps: {
      loading: estimates.isLoading,
      rows: estimates.data ?? [],
      missingEstimate,
      canUpdate: canUpdateBook,
      onEdit: openEditEstimateModal,
      onAdd: openAddEstimateForMaterial,
      onHistory: setDetailCode,
    },
    marginsTableProps: {
      loading: margins.isLoading,
      rows: margins.data ?? [],
      missingSell,
      canUpdate: canUpdateBook,
      onEdit: openEditSellModal,
      onAddSell: openAddSellForMaterial,
      onHistory: setDetailCode,
    },
    estimateModalProps: {
      isOpen: estimateOpen,
      onClose: () => setEstimateOpen(false),
      categoryId: estimateCategoryId,
      onCategoryChange: setEstimateCategoryId,
      form: estimateForm,
      setForm: setEstimateForm,
      rootCategories,
      materials,
      projects,
      isPending: upsertEstimate.isPending,
      onSave: saveEstimate,
    },
    sellModalProps: {
      isOpen: sellOpen,
      onClose: () => setSellOpen(false),
      form: sellForm,
      setForm: setSellForm,
      materials,
      projects,
      isPending: upsertSell.isPending,
      onSave: saveSell,
    },
    historyModalProps: {
      detailCode,
      detail,
      canWriteRfq,
      onClose: () => setDetailCode(null),
      onAddRfq: (code: string) => {
        setRfqPresetCode(code);
        setDetailCode(null);
        setTab('rfq');
      },
    },
    adminMarkupModalProps: {
      isOpen: markupModalOpen,
      onClose: () => setMarkupModalOpen(false),
      config: markupConfig,
      onSave: saveMarkupConfig,
      isSaving: isSavingMarkup,
    },
  };
}
