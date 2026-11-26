import { act, createElement, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AlertTriangle, Building2, Package, ShieldCheck } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PageShell from './PageShell';
import PageHeader, { BackButton } from './PageHeader';
import FilterToolbar from './FilterToolbar';
import TableShell from './TableShell';
import KpiCard from './KpiCard';
import MetricsStrip from './MetricsStrip';
import StatusBadge, { STATUS_TONE_CLASS } from './StatusBadge';
import PurchasingStatusBadge from '../purchasing/PurchasingStatusBadge';
import SectionCard from './SectionCard';
import FormSection, { FormSectionHeader } from './FormSection';
import SelectField from './SelectField';
import DateRangeField from './DateRangeField';
import VoucherDateFilter from '../warehouse/VoucherDateFilter';
import { getCandidateStatusBadge } from '../../utils/recruitmentStatusBadge';

describe('Design System UI primitives', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('PageShell', () => {
    it('renders default list variant and full width classes', async () => {
      await act(() =>
        root.render(
          createElement(PageShell, {
            children: createElement('p', null, 'Danh sách vật tư Dự án Cầu Rạch Miễu 2'),
          }),
        ),
      );
      const shell = container.firstElementChild as HTMLElement;
      expect(shell.className).toContain('page-shell');
      expect(shell.className).toContain('erp-page-shell');
      expect(shell.className).toContain('erp-page-shell--list');
      expect(shell.className).not.toContain('erp-page-shell--narrow');
    });

    it('applies dashboard variant, narrow width, and custom className', async () => {
      await act(() =>
        root.render(
          createElement(PageShell, {
            variant: 'dashboard',
            width: 'narrow',
            className: 'wms-reports-shell',
            children: createElement('span', null, 'Báo cáo nhập xuất kho'),
          }),
        ),
      );
      const shell = container.firstElementChild as HTMLElement;
      expect(shell.className).toContain('erp-page-shell--dashboard');
      expect(shell.className).toContain('erp-page-shell--narrow');
      expect(shell.className).toContain('wms-reports-shell');
    });
  });

  describe('PageHeader', () => {
    it('renders default header without back button', async () => {
      await act(() =>
        root.render(
          createElement(PageHeader, {
            eyebrow: 'Kho hàng',
            title: 'Danh mục vật tư',
            subtitle: 'Quản lý mã vật tư và đơn vị tính chuẩn',
            actions: createElement('button', { type: 'button' }, 'Thêm vật tư'),
          }),
        ),
      );
      expect(container.querySelector('.page-header')).not.toBeNull();
      expect(container.querySelector('.page-header--detail')).toBeNull();
      expect(container.querySelector('.page-header__back')).toBeNull();
      expect(container.querySelector('h1.page-header__title')?.textContent).toBe('Danh mục vật tư');
      expect(container.querySelector('.page-header__eyebrow')?.textContent).toBe('Kho hàng');
      expect(container.querySelector('.page-header__subtitle')?.textContent).toBe(
        'Quản lý mã vật tư và đơn vị tính chuẩn',
      );
      expect(container.querySelector('.page-header__actions button')?.textContent).toBe('Thêm vật tư');
    });

    it('renders detail variant with back button and invokes onBack', async () => {
      const onBack = vi.fn();
      await act(() =>
        root.render(
          createElement(PageHeader, {
            variant: 'detail',
            onBack,
            backLabel: 'Về danh sách dự án',
            eyebrow: 'Dự án EPC',
            title: 'Dự án Cầu Rạch Miễu 2',
            subtitle: 'Nhà cung cấp: Công ty TNHH VLXD Minh Long',
            actions: createElement('button', { type: 'button' }, 'Cập nhật'),
          }),
        ),
      );
      const header = container.querySelector('header.page-header.page-header--detail');
      expect(header).not.toBeNull();
      expect(container.querySelector('.page-header__detail-row')).not.toBeNull();

      const backBtn = container.querySelector<HTMLButtonElement>('.page-header__back')!;
      expect(backBtn).not.toBeNull();
      expect(backBtn.textContent).toContain('Về danh sách dự án');
      await act(() => backBtn.click());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders default backLabel "Quay lại" when onBack is given without variant', async () => {
      const onBack = vi.fn();
      await act(() =>
        root.render(createElement(PageHeader, { title: 'Chi tiết phiếu nhập NK-2026-014', onBack })),
      );
      expect(container.querySelector('.page-header--detail')).not.toBeNull();
      expect(container.querySelector('.page-header__back')?.textContent).toContain('Quay lại');
    });

    it('hides back button when hideBackButton is true while preserving detail layout', async () => {
      const onBack = vi.fn();
      await act(() =>
        root.render(
          createElement(PageHeader, {
            variant: 'detail',
            onBack,
            hideBackButton: true,
            title: 'Đơn hàng PO-2026-089',
            subtitle: 'Nhà cung cấp: Công ty TNHH VLXD Minh Long',
          }),
        ),
      );
      expect(container.querySelector('.page-header--detail')).not.toBeNull();
      expect(container.querySelector('.page-header__back')).toBeNull();
      expect(container.querySelector('.page-header__subtitle')?.textContent).toBe(
        'Nhà cung cấp: Công ty TNHH VLXD Minh Long',
      );
    });

    it('renders standalone BackButton with default/custom label and invokes onBack', async () => {
      const onBack = vi.fn();
      await act(() =>
        root.render(
          createElement(BackButton, {
            onBack,
            label: 'Về danh sách phân quyền',
            className: 'custom-back',
          }),
        ),
      );
      const btn = container.querySelector<HTMLButtonElement>('button.page-header__back.custom-back');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toContain('Về danh sách phân quyền');
      await act(() => btn!.click());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders optional breadcrumbs with Router Links and aria-current="page" on final item', async () => {
      await act(() =>
        root.render(
          createElement(
            MemoryRouter,
            null,
            createElement(PageHeader, {
              variant: 'detail',
              onBack: vi.fn(),
              title: 'Thép hình H300',
              breadcrumbs: [
                { label: 'Kho vận & Tồn kho', to: '/warehouse/dashboard-warehouse' },
                { label: 'Danh mục vật tư', to: '/warehouse/materials' },
                { label: 'VT-THEP-H300' },
              ],
            }),
          ),
        ),
      );

      const nav = container.querySelector('nav[aria-label="Breadcrumb"]');
      expect(nav).not.toBeNull();
      const links = nav!.querySelectorAll<HTMLAnchorElement>('a.page-header__breadcrumb-link');
      expect(links).toHaveLength(2);
      expect(links[0].getAttribute('href')).toBe('/warehouse/dashboard-warehouse');
      expect(links[0].textContent).toBe('Kho vận & Tồn kho');
      expect(links[1].getAttribute('href')).toBe('/warehouse/materials');
      expect(links[1].textContent).toBe('Danh mục vật tư');

      const current = nav!.querySelector<HTMLSpanElement>('span[aria-current="page"].page-header__breadcrumb-current');
      expect(current).not.toBeNull();
      expect(current?.textContent).toBe('VT-THEP-H300');
      expect(nav!.querySelectorAll('.page-header__breadcrumb-sep')).toHaveLength(2);
    });

    it('renders zero breadcrumb nav when breadcrumbs prop is omitted', async () => {
      await act(() =>
        root.render(
          createElement(PageHeader, {
            title: 'Danh mục vật tư',
          }),
        ),
      );
      expect(container.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
    });
  });

  describe('FilterToolbar', () => {
    it('composes TabFilter, SearchBar, filters, actions, and conditional reset button', async () => {
      const onSearchChange = vi.fn();
      const onTabChange = vi.fn();
      const onReset = vi.fn();

      const renderToolbar = (hasActiveFilters: boolean) =>
        root.render(
          createElement(FilterToolbar, {
            search: 'Thép hộp',
            onSearchChange,
            searchPlaceholder: 'Tìm mã vật tư, tên vật tư...',
            tabs: [
              { id: 'all', label: 'Tất cả', count: 24 },
              { id: 'active', label: 'Đang sử dụng', count: 18 },
            ],
            activeTab: 'all',
            onTabChange,
            filters: createElement('select', { 'aria-label': 'Nhóm vật tư' }, createElement('option', null, 'Thép hình')),
            actions: createElement('button', { type: 'button' }, 'Xuất Excel'),
            hasActiveFilters,
            onReset,
          }),
        );

      await act(() => renderToolbar(false));
      expect(container.querySelector('.tab-filter')).not.toBeNull();
      expect(container.querySelector('input[type="search"]')).not.toBeNull();
      expect(container.querySelector('select[aria-label="Nhóm vật tư"]')).not.toBeNull();
      expect(container.querySelector('.erp-filter-toolbar__actions button')?.textContent).toBe('Xuất Excel');
      expect(container.querySelector('.hrm-filter-reset')).toBeNull();

      const tabButtons = container.querySelectorAll<HTMLButtonElement>('.tab-filter__tab');
      await act(() => tabButtons[1].click());
      expect(onTabChange).toHaveBeenCalledWith('active');

      await act(() => renderToolbar(true));
      const resetBtn = container.querySelector<HTMLButtonElement>('.hrm-filter-reset')!;
      expect(resetBtn).not.toBeNull();
      expect(resetBtn.textContent).toContain('Xóa lọc');
      await act(() => resetBtn.click());
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('TableShell', () => {
    const tableHeader = createElement(
      'tr',
      null,
      createElement('th', { className: 'table-header-cell' }, 'Mã VT'),
      createElement('th', { className: 'table-header-cell' }, 'Tên vật tư'),
      createElement('th', { className: 'table-header-cell' }, 'Nhà cung cấp'),
    );

    it('renders loading skeleton rows inside scroll wrapper', async () => {
      await act(() =>
        root.render(
          createElement(TableShell, {
            header: tableHeader,
            colSpan: 3,
            loading: true,
            skeletonRows: 4,
            flushTop: true,
          }),
        ),
      );
      const scroll = container.querySelector('.erp-table-shell__scroll');
      expect(scroll).not.toBeNull();
      expect(scroll?.className).toContain('hrm-table-wrap');
      expect(scroll?.className).toContain('wms-inventory-table-wrap--flush-top');
      expect(container.querySelectorAll('.hrm-table-skeleton-row')).toHaveLength(4);
    });

    it('renders error alert when error is provided', async () => {
      await act(() =>
        root.render(
          createElement(TableShell, {
            header: tableHeader,
            colSpan: 3,
            error: 'Không tải được tồn kho Dự án Cầu Rạch Miễu 2.',
          }),
        ),
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.textContent).toBe('Không tải được tồn kho Dự án Cầu Rạch Miễu 2.');
    });

    it('renders EmptyState with action when isEmpty is true', async () => {
      await act(() =>
        root.render(
          createElement(TableShell, {
            header: tableHeader,
            colSpan: 3,
            isEmpty: true,
            emptyMessage: 'Chưa có vật tư tồn kho trong Dự án Cầu Rạch Miễu 2.',
            emptyIcon: Package,
            emptyAction: createElement('button', { type: 'button' }, 'Nhập kho ngay'),
          }),
        ),
      );
      expect(container.querySelector('.erp-table-shell--empty')).not.toBeNull();
      expect(container.querySelector('.erp-table-shell__empty-cell')).not.toBeNull();
      expect(container.querySelector('.erp-table-shell__sticky-center')).not.toBeNull();
      expect(container.querySelector('.empty-state__message')?.textContent).toBe(
        'Chưa có vật tư tồn kho trong Dự án Cầu Rạch Miễu 2.',
      );
      expect(container.querySelector('.empty-state__action button')?.textContent).toBe('Nhập kho ngay');
    });

    it('renders structured data rows, tfoot, caption, and embedded pagination', async () => {
      const onPageChange = vi.fn();
      await act(() =>
        root.render(
          createElement(
            TableShell,
            {
              header: tableHeader,
              colSpan: 3,
              tfoot: createElement(
                'tr',
                null,
                createElement('td', { colSpan: 3 }, 'Tổng cộng: 2 dòng vật tư'),
              ),
              caption: 'Đơn giá đã bao gồm VAT theo hợp đồng với Công ty TNHH VLXD Minh Long.',
              pagination: {
                currentPage: 1,
                totalPages: 3,
                pageSize: 15,
                totalItems: 38,
                onPageChange,
              },
            },
            createElement(
              'tr',
              { className: 'table-row' },
              createElement('td', { className: 'table-cell' }, 'VT-TH-50100'),
              createElement('td', { className: 'table-cell' }, 'Thép hộp 50x100x2mm'),
              createElement('td', { className: 'table-cell' }, 'Công ty TNHH VLXD Minh Long'),
            ),
            createElement(
              'tr',
              { className: 'table-row' },
              createElement('td', { className: 'table-cell' }, 'VT-XM-PCB40'),
              createElement('td', { className: 'table-cell' }, 'Xi măng Hà Tiên PCB40'),
              createElement('td', { className: 'table-cell' }, 'Công ty TNHH VLXD Minh Long'),
            ),
          ),
        ),
      );

      expect(container.querySelector('.erp-table-shell--empty')).toBeNull();
      expect(container.textContent).toContain('Thép hộp 50x100x2mm');
      expect(container.textContent).toContain('Xi măng Hà Tiên PCB40');
      expect(container.querySelector('tfoot')?.textContent).toContain('Tổng cộng: 2 dòng vật tư');
      expect(container.querySelector('.erp-table-shell__caption')?.textContent).toContain(
        'Công ty TNHH VLXD Minh Long',
      );
      expect(container.querySelector('.erp-table-shell__footer .pagination-bar--embedded')).not.toBeNull();

      const nextPageBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Trang sau"]')!;
      await act(() => nextPageBtn.click());
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('supports wrapper mode when header is omitted', async () => {
      await act(() =>
        root.render(
          createElement(
            TableShell,
            { tableClassName: 'hrm-table' },
            createElement(
              'thead',
              null,
              createElement('tr', null, createElement('th', null, 'Vật tư')),
            ),
            createElement(
              'tbody',
              null,
              createElement('tr', null, createElement('td', null, 'Xi măng Hà Tiên PCB40')),
            ),
          ),
        ),
      );
      const scroll = container.querySelector('.erp-table-shell__scroll');
      expect(scroll).not.toBeNull();
      expect(scroll?.querySelector('table.hrm-table')).not.toBeNull();
      expect(scroll?.textContent).toContain('Xi măng Hà Tiên PCB40');
    });
  });

  describe('KpiCard & MetricsStrip', () => {
    it('renders loading skeleton with aria-busy="true"', async () => {
      await act(() =>
        root.render(
          createElement(MetricsStrip, {
            columns: 5,
            ariaLabel: 'Chỉ số kho vận',
            children: createElement(KpiCard, {
              label: 'Tổng giá trị nhập kho',
              loading: true,
              tone: 'primary',
            }),
          }),
        ),
      );
      const list = container.querySelector('[role="list"]');
      expect(list?.getAttribute('aria-label')).toBe('Chỉ số kho vận');
      expect(list?.className).toContain('erp-metrics-strip--cols-5');

      const item = container.querySelector('[role="listitem"]');
      expect(item?.getAttribute('aria-busy')).toBe('true');
      expect(item?.className).toContain('erp-kpi-card--loading');
      expect(item?.querySelector('.skeleton')).not.toBeNull();
    });

    it('renders clickable card with aria-pressed and maps tones to CardAccent', async () => {
      const onClick = vi.fn();
      await act(() =>
        root.render(
          createElement(
            MemoryRouter,
            null,
            createElement(MetricsStrip, {
              columns: 3,
              children: [
                createElement(KpiCard, {
                  key: 'stock',
                  label: 'Thép hộp 50x100x2mm tồn kho',
                  value: '1.250 cây',
                  hint: 'Dự án Cầu Rạch Miễu 2',
                  tone: 'warning',
                  icon: Building2,
                  selected: true,
                  onClick,
                }),
                createElement(KpiCard, {
                  key: 'pass',
                  label: 'Đạt chuẩn nghiệm thu',
                  value: '98%',
                  tone: 'success',
                  to: '/warehouse/reports',
                }),
              ],
            }),
          ),
        ),
      );

      const buttonCard = container.querySelector<HTMLButtonElement>('button[role="listitem"]')!;
      expect(buttonCard).not.toBeNull();
      expect(buttonCard.getAttribute('aria-pressed')).toBe('true');
      expect(buttonCard.className).toContain('kpi-card--accent-warning');
      expect(buttonCard.textContent).toContain('1.250 cây');
      await act(() => buttonCard.click());
      expect(onClick).toHaveBeenCalledTimes(1);

      const linkCard = container.querySelector<HTMLAnchorElement>('a[role="listitem"]')!;
      expect(linkCard.className).toContain('kpi-card--accent-success');
      expect(linkCard.getAttribute('href')).toBe('/warehouse/reports');
    });

    it('supports mobileColumns={1} and defaults to 2-col mobile grid behavior', async () => {
      await act(() =>
        root.render(
          createElement(MetricsStrip, {
            columns: 4,
            ariaLabel: 'Thống kê nhập xuất kho',
            children: createElement(KpiCard, {
              label: 'Tổng tồn kho VLXD',
              value: '482 tấn',
              tone: 'primary',
            }),
          }),
        ),
      );
      let list = container.querySelector('[role="list"]');
      expect(list?.className).toContain('erp-metrics-strip--cols-4');
      expect(list?.className).not.toContain('erp-metrics-strip--mobile-1');

      await act(() =>
        root.render(
          createElement(MetricsStrip, {
            columns: 4,
            mobileColumns: 1,
            ariaLabel: 'Thống kê nhập xuất kho',
            children: createElement(KpiCard, {
              label: 'Tổng tồn kho VLXD',
              value: '482 tấn',
              tone: 'primary',
            }),
          }),
        ),
      );
      list = container.querySelector('[role="list"]');
      expect(list?.className).toContain('erp-metrics-strip--cols-4');
      expect(list?.className).toContain('erp-metrics-strip--mobile-1');

      await act(() =>
        root.render(
          createElement(MetricsStrip, {
            columns: 4,
            mobileColumns: 2,
            ariaLabel: 'Thống kê nhập xuất kho',
            children: createElement(KpiCard, {
              label: 'Tổng tồn kho VLXD',
              value: '482 tấn',
              tone: 'primary',
            }),
          }),
        ),
      );
      list = container.querySelector('[role="list"]');
      expect(list?.className).not.toContain('erp-metrics-strip--mobile-1');
    });
  });

  describe('StatusBadge & PurchasingStatusBadge', () => {
    it('delegates to Badge when status is provided without tone', async () => {
      await act(() =>
        root.render(createElement(StatusBadge, { status: 'approved' })),
      );
      const badge = container.querySelector('.badge');
      expect(badge?.className).toContain('badge-approved');
      expect(badge?.textContent).toContain('Đã duyệt');
    });

    it('renders explicit tone, label, and optional icon', async () => {
      await act(() =>
        root.render(
          createElement(StatusBadge, {
            tone: 'error',
            label: 'Thiếu chứng từ CO/CQ',
            icon: AlertTriangle,
          }),
        ),
      );
      const badge = container.querySelector('.badge');
      expect(badge?.className).toContain(STATUS_TONE_CLASS.error);
      expect(badge?.querySelector('svg')).not.toBeNull();
      expect(badge?.textContent).toContain('Thiếu chứng từ CO/CQ');
    });

    it('delegates PurchasingStatusBadge danger tone to error badge class', async () => {
      await act(() =>
        root.render(
          createElement(PurchasingStatusBadge, {
            tone: 'danger',
            label: 'Quá hạn giao hàng',
          }),
        ),
      );
      const badge = container.querySelector('.badge');
      expect(badge?.className).toContain('badge-error');
      expect(badge?.textContent).toBe('Quá hạn giao hàng');
    });

    it('maps recruitment candidate pipeline statuses via getCandidateStatusBadge onto StatusBadge', async () => {
      const newCfg = getCandidateStatusBadge('New');
      expect(newCfg).toEqual({ tone: 'primary', label: 'CV mới', className: 'badge-hrm-new' });

      const rejectedCfg = getCandidateStatusBadge('Rejected');
      expect(rejectedCfg).toEqual({ tone: 'error', label: 'PV không đạt' });

      const unknownCfg = getCandidateStatusBadge('');
      expect(unknownCfg).toEqual({ tone: 'neutral', label: '—' });

      await act(() =>
        root.render(
          createElement(StatusBadge, {
            tone: newCfg.tone,
            label: newCfg.label,
            className: newCfg.className,
          }),
        ),
      );
      const badge = container.querySelector('.badge');
      expect(badge?.className).toContain('badge-md-primary');
      expect(badge?.className).toContain('badge-hrm-new');
      expect(badge?.textContent).toBe('CV mới');
    });
  });

  describe('SectionCard & FormSection', () => {
    it('renders SectionCard with footer, highlighted state, id, and forwarded ref', async () => {
      const ref = createRef<HTMLElement>();
      await act(() =>
        root.render(
          createElement(SectionCard, {
            ref,
            id: 'pending-vouchers-section',
            title: 'Phiếu chờ duyệt',
            subtitle: 'Kho trung tâm và các kho dự án',
            highlighted: true,
            actions: createElement(StatusBadge, { tone: 'info', label: 'Đang theo dõi', icon: ShieldCheck }),
            footer: createElement('span', null, 'Cập nhật theo dữ liệu máy chủ'),
            children: createElement('p', null, 'Xi măng Hà Tiên PCB40 — chờ kiểm nhận'),
          }),
        ),
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.id).toBe('pending-vouchers-section');
      expect(ref.current?.className).toContain('erp-section-card--highlighted');
      expect(container.querySelector('.erp-section-card__footer')?.textContent).toBe(
        'Cập nhật theo dữ liệu máy chủ',
      );
    });

    it('renders SectionCard variant="detail" with hrm-detail-section structure and description', async () => {
      const ref = createRef<HTMLElement>();
      await act(() =>
        root.render(
          createElement(SectionCard, {
            ref,
            variant: 'detail',
            title: 'Thông số vật tư',
            description: 'Quy cách tiêu chuẩn Dự án Cầu Rạch Miễu 2',
            className: 'hrm-detail-section--status-active',
            actions: createElement('button', { type: 'button' }, 'Chỉnh sửa'),
            children: createElement('p', null, 'Thép hình H300 · VT-THEP-001'),
          }),
        ),
      );

      const section = container.querySelector('section.erp-section-card.hrm-detail-section');
      expect(section).not.toBeNull();
      expect(section).toBe(ref.current);
      expect(section?.className).toContain('hrm-detail-section--status-active');
      expect(container.querySelector('h3.hrm-detail-section__title')?.textContent).toBe(
        'Thông số vật tư',
      );
      expect(container.querySelector('p.hrm-detail-section__desc')?.textContent).toBe(
        'Quy cách tiêu chuẩn Dự án Cầu Rạch Miễu 2',
      );
      expect(container.querySelector('.hrm-detail-section__body')?.textContent).toBe(
        'Thép hình H300 · VT-THEP-001',
      );
      expect(container.querySelector('.hrm-detail-section__head button')?.textContent).toBe(
        'Chỉnh sửa',
      );
    });

    it('renders FormSection with step badge, description, and responsive grid columns', async () => {
      await act(() =>
        root.render(
          createElement(FormSection, {
            step: 1,
            title: 'Thông tin vật tư nhập kho',
            description: 'Chọn đúng quy cách và nhà cung cấp đã duyệt',
            columns: 3,
            children: [
              createElement('div', { key: 'code' }, 'Mã VT: VT-THEP-001'),
              createElement('div', { key: 'name' }, 'Tên: Thép hình H300'),
              createElement('div', { key: 'supplier' }, 'NCC: Công ty TNHH VLXD Minh Long'),
            ],
          }),
        ),
      );

      expect(container.querySelector('.hrm-form-section-header__step')?.textContent).toBe('1');
      expect(container.querySelector('.hrm-form-section-header__title')?.textContent).toBe(
        'Thông tin vật tư nhập kho',
      );
      expect(container.querySelector('.erp-form-section__desc')?.textContent).toBe(
        'Chọn đúng quy cách và nhà cung cấp đã duyệt',
      );
      expect(container.querySelector('.erp-form-section__grid--cols-3')).not.toBeNull();
    });

    it('renders standalone named FormSectionHeader with optional step and className', async () => {
      await act(() =>
        root.render(
          createElement(FormSectionHeader, {
            step: 2,
            title: 'Chứng từ CO/CQ đính kèm',
            className: 'hrm-form-section-header--spaced',
          }),
        ),
      );

      const header = container.querySelector('.hrm-form-section-header');
      expect(header?.className).toContain('hrm-form-section-header--spaced');
      expect(container.querySelector('.hrm-form-section-header__step')?.textContent).toBe('2');
      expect(container.querySelector('.hrm-form-section-header__title')?.textContent).toBe(
        'Chứng từ CO/CQ đính kèm',
      );
    });
  });

  describe('SelectField', () => {
    it('renders form variant with accessible htmlFor/id, placeholder, typed options, hint, and error state', async () => {
      const onChange = vi.fn();
      const renderSelect = (props: Partial<Parameters<typeof SelectField>[0]>) =>
        root.render(
          createElement(SelectField, {
            label: 'Đơn vị tính chuẩn',
            value: '',
            onChange,
            placeholder: '— Chọn ĐVT —',
            options: [
              'Cây',
              { value: 'tan', label: 'Tấn' },
              { value: 'cuon-ngung', label: 'Cuộn (ngưng dùng)', disabled: true },
            ],
            required: true,
            hint: 'Áp dụng cho vật tư Dự án Cầu Rạch Miễu 2',
            ...props,
          }),
        );

      await act(() => renderSelect({}));
      const label = container.querySelector<HTMLLabelElement>('label.form-label')!;
      const select = container.querySelector<HTMLSelectElement>('select.form-select')!;
      expect(label.htmlFor).toBe(select.id);
      expect(label.textContent).toContain('*');
      expect(select.required).toBe(true);
      expect(select.getAttribute('aria-invalid')).toBeNull();
      expect(container.querySelector('.erp-select-field__hint')?.textContent).toBe(
        'Áp dụng cho vật tư Dự án Cầu Rạch Miễu 2',
      );
      expect(select.options).toHaveLength(4);
      expect(select.options[3].disabled).toBe(true);

      select.value = 'tan';
      await act(() => select.dispatchEvent(new Event('change', { bubbles: true })));
      expect(onChange).toHaveBeenCalledWith('tan');

      await act(() => renderSelect({ error: 'Vui lòng chọn đơn vị tính' }));
      const erroredSelect = container.querySelector<HTMLSelectElement>('select.form-select')!;
      expect(erroredSelect.getAttribute('aria-invalid')).toBe('true');
      expect(erroredSelect.className).toContain('form-input--error');
      expect(container.querySelector('[role="alert"]')?.textContent).toBe('Vui lòng chọn đơn vị tính');
      expect(container.querySelector('.erp-select-field__hint')).toBeNull();
    });

    it('renders hrm variant, preserveUnknownValue legacy option, and loading/disabled state', async () => {
      await act(() =>
        root.render(
          createElement(SelectField, {
            variant: 'hrm',
            label: 'Xuất xứ vật tư',
            value: 'Nhật Bản (tiêu chuẩn JIS)',
            onChange: vi.fn(),
            options: ['Việt Nam', 'Hàn Quốc'],
            preserveUnknownValue: true,
            required: true,
            loading: true,
            error: 'Cần cập nhật xuất xứ theo danh mục mới',
          }),
        ),
      );

      expect(container.querySelector('.hrm-field')).not.toBeNull();
      const label = container.querySelector<HTMLLabelElement>('label.hrm-field__label')!;
      const select = container.querySelector<HTMLSelectElement>('select.hrm-field-select')!;
      expect(label.htmlFor).toBe(select.id);
      expect(label.className).toContain('hrm-field__label--required');
      expect(select.disabled).toBe(true);
      expect(select.getAttribute('aria-busy')).toBe('true');
      expect(select.className).toContain('hrm-field-input--error');
      expect(Array.from(select.options).map(o => o.value)).toContain('Nhật Bản (tiêu chuẩn JIS)');
      expect(container.querySelector('.hrm-field__error[role="alert"]')?.textContent).toBe(
        'Cần cập nhật xuất xứ theo danh mục mới',
      );
    });
  });

  describe('DateRangeField & VoucherDateFilter', () => {
    it('links htmlFor/id, cross-clamps min/max bounds, and toggles reset button', async () => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 20,
        y: 80,
        top: 80,
        left: 20,
        right: 220,
        bottom: 116,
        width: 200,
        height: 36,
        toJSON: () => ({}),
      } as DOMRect);

      const onReset = vi.fn();
      const renderRange = (from: string, to: string, includeReset = true) =>
        root.render(
          createElement(DateRangeField, {
            from,
            to,
            onFromChange: vi.fn(),
            onToChange: vi.fn(),
            onReset: includeReset ? onReset : undefined,
          }),
        );

      await act(() => renderRange('', ''));
      const labels = container.querySelectorAll<HTMLLabelElement>('label.voucher-date-filter__label');
      const triggers = container.querySelectorAll<HTMLButtonElement>('.hrm-date-picker__trigger');
      expect(labels).toHaveLength(2);
      expect(triggers).toHaveLength(2);
      expect(labels[0].htmlFor).toBe(triggers[0].id);
      expect(labels[1].htmlFor).toBe(triggers[1].id);
      expect(container.querySelector('.hrm-filter-reset')).toBeNull();

      await act(() => renderRange('2026-10-10', '2026-10-20'));
      const resetBtn = container.querySelector<HTMLButtonElement>('.hrm-filter-reset')!;
      expect(resetBtn).not.toBeNull();
      await act(() => resetBtn.click());
      expect(onReset).toHaveBeenCalledTimes(1);

      // Opening `from` picker enforces `max="2026-10-20"` so day 25 is disabled
      await act(() => triggers[0].click());
      const fromPopover = document.getElementById(triggers[0].getAttribute('aria-controls')!)!;
      const day25 = Array.from(fromPopover.querySelectorAll<HTMLButtonElement>('.hrm-date-picker__day')).find(
        b => b.textContent === '25',
      )!;
      expect(day25.disabled).toBe(true);

      // Opening `to` picker enforces `min="2026-10-10"` so day 5 is disabled
      await act(() => triggers[1].click());
      const toPopover = document.getElementById(triggers[1].getAttribute('aria-controls')!)!;
      const day5 = Array.from(toPopover.querySelectorAll<HTMLButtonElement>('.hrm-date-picker__day')).find(
        b => b.textContent === '5',
      )!;
      expect(day5.disabled).toBe(true);
    });

    it('VoucherDateFilter wraps DateRangeField cleanly with reset action', async () => {
      const onReset = vi.fn();
      await act(() =>
        root.render(
          createElement(VoucherDateFilter, {
            from: '2026-11-01',
            to: '',
            onFromChange: vi.fn(),
            onToChange: vi.fn(),
            onReset,
            className: 'wms-voucher-dates',
          }),
        ),
      );
      const wrapper = container.querySelector('.voucher-date-filter');
      expect(wrapper?.className).toContain('wms-voucher-dates');
      const resetBtn = container.querySelector<HTMLButtonElement>('.hrm-filter-reset')!;
      expect(resetBtn.textContent).toBe('Xóa lọc ngày');
      await act(() => resetBtn.click());
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
