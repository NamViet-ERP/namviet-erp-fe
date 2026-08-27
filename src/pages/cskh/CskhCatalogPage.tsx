import { useMemo, useState } from 'react';
import { Factory, Flame, ListOrdered, Plus, type LucideIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import {
  nextCatalogCode,
  newMasterId,
  removeById,
  upsertById,
  type CskhCatalogItem,
  type CskhPhaseItem,
} from '../../lib/cskh/masterData';
import CskhMasterTable from './CskhMasterTable';

type CatalogId = 'industries' | 'boilerTypes' | 'phases';

interface CatalogDef {
  key: CatalogId;
  title: string;
  subtitle: string;
  addLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  prefix: string;
  extra: 'none' | 'description' | 'tech' | 'phase';
  empty: string;
  emptyIcon: LucideIcon;
}

const CATALOGS: Record<string, CatalogDef> = {
  industries: {
    key: 'industries',
    title: 'Ngành nghề / Lĩnh vực',
    subtitle: 'Ngành nghề gắn với dự án khi tạo thẻ trên tổng quan.',
    addLabel: 'Thêm ngành nghề / lĩnh vực',
    nameLabel: 'Tên ngành nghề / lĩnh vực',
    namePlaceholder: 'VD: Hoá chất',
    prefix: 'NN',
    extra: 'description',
    empty: 'Chưa có ngành nghề. Thêm một mục để gắn vào thẻ dự án trên tổng quan.',
    emptyIcon: Factory,
  },
  'boiler-types': {
    key: 'boilerTypes',
    title: 'Loại lò',
    subtitle: 'Loại lò và mô tả công nghệ dùng khi tạo dự án.',
    addLabel: 'Thêm loại lò',
    nameLabel: 'Tên loại lò',
    namePlaceholder: 'VD: Tầng sôi',
    prefix: 'BT',
    extra: 'tech',
    empty: 'Chưa có loại lò. Thêm loại lò trước khi lập bảng tiến độ chuẩn.',
    emptyIcon: Flame,
  },
  phases: {
    key: 'phases',
    title: 'Giai đoạn chuẩn dự án',
    subtitle: 'Thứ tự giai đoạn chuẩn dùng khi theo dõi dự án CSKH.',
    addLabel: 'Thêm giai đoạn chuẩn dự án',
    nameLabel: 'Tên giai đoạn',
    namePlaceholder: 'VD: Lắp đặt cơ khí',
    prefix: 'GD',
    extra: 'phase',
    empty: 'Chưa có giai đoạn. Thêm theo thứ tự dùng khi theo dõi dự án.',
    emptyIcon: ListOrdered,
  },
};

const PHASE_STATUS_OPTIONS = [
  { value: 'active', label: 'Đang sử dụng', tone: 'ok' as const },
  { value: 'inactive', label: 'Tạm ẩn', tone: 'warn' as const },
];

interface CskhCatalogPageProps {
  tab: string;
}

type FormState = {
  name: string;
  description: string;
  order: string;
  active: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  order: '1',
  active: '',
};

export default function CskhCatalogPage({ tab }: CskhCatalogPageProps) {
  const def = CATALOGS[tab] ?? CATALOGS.industries;
  const { store, persist } = useCskhMasterData();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nameError, setNameError] = useState('');
  const [techError, setTechError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const rows = store[def.key] as CskhCatalogItem[];

  const openCreate = () => {
    const nextOrder = def.extra === 'phase'
      ? String((store.phases.reduce((max, row) => Math.max(max, row.order), 0) || 0) + 1)
      : '1';
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: nextOrder });
    setNameError('');
    setTechError('');
    setStatusError('');
    setFormOpen(true);
  };

  const openEdit = (row: CskhCatalogItem) => {
    const phase = row as CskhPhaseItem;
    setEditingId(row.id);
    setForm({
      name: row.name,
      description: row.description ?? '',
      order: String(phase.order ?? 1),
      active: phase.active === false ? 'inactive' : 'active',
    });
    setNameError('');
    setTechError('');
    setStatusError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setNameError('');
    setTechError('');
    setStatusError('');
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      setNameError(`Nhập ${def.nameLabel.toLowerCase()}.`);
      return;
    }
    if (def.extra === 'description' && !form.description.trim()) {
      setTechError('Nhập mô tả.');
      return;
    }
    if (def.extra === 'tech' && !form.description.trim()) {
      setTechError('Nhập mô tả công nghệ.');
      return;
    }
    if (def.extra === 'phase' && form.active !== 'active' && form.active !== 'inactive') {
      setStatusError('Chọn trạng thái.');
      return;
    }
    const existing = rows.find(row => row.id === editingId);
    const code = existing?.code ?? nextCatalogCode(def.prefix, rows.map(row => row.code));
    const id = existing?.id ?? newMasterId();
    const base: CskhCatalogItem = {
      id,
      code,
      name,
      description: form.description.trim() || undefined,
    };

    persist(current => {
      if (def.key === 'phases') {
        const order = Number(form.order);
        const item: CskhPhaseItem = {
          ...base,
          order: Number.isFinite(order) && order > 0 ? order : 1,
          active: form.active === 'active',
        };
        return { ...current, phases: upsertById(current.phases, item) };
      }
      return { ...current, [def.key]: upsertById(current[def.key] as CskhCatalogItem[], base) };
    });
    showToast('success', editingId ? 'Đã cập nhật danh mục.' : 'Đã thêm vào danh mục.');
    closeForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    persist(current => {
      if (def.key === 'phases') return { ...current, phases: removeById(current.phases, deleteTarget.id) };
      return { ...current, [def.key]: removeById(current[def.key] as CskhCatalogItem[], deleteTarget.id) };
    });
    showToast('success', `Đã xóa ${deleteTarget.name}.`);
    setDeleteTarget(null);
  };

  const columns = useMemo(() => {
    const codeCol = {
      key: 'code',
      label: 'Mã',
      className: 'cskh-col-code',
      render: (row: CskhCatalogItem) => <span className="font-mono">{row.code}</span>,
    };
    if (def.extra === 'description') {
      return [
        codeCol,
        { key: 'name', label: 'Ngành nghề / lĩnh vực', render: (row: CskhCatalogItem) => row.name },
        {
          key: 'desc',
          label: 'Mô tả',
          render: (row: CskhCatalogItem) => row.description || '-',
        },
      ];
    }
    if (def.extra === 'tech') {
      return [
        codeCol,
        { key: 'name', label: 'Loại lò', render: (row: CskhCatalogItem) => row.name },
        {
          key: 'desc',
          label: 'Mô tả công nghệ',
          render: (row: CskhCatalogItem) => row.description || '-',
        },
      ];
    }
    if (def.extra === 'phase') {
      return [
        codeCol,
        {
          key: 'order',
          label: 'Thứ tự',
          className: 'cskh-col-order',
          render: (row: CskhCatalogItem) => (
            <span className="tabular-nums">{(row as CskhPhaseItem).order}</span>
          ),
        },
        { key: 'name', label: 'Giai đoạn chuẩn', render: (row: CskhCatalogItem) => row.name },
        {
          key: 'desc',
          label: 'Mô tả',
          render: (row: CskhCatalogItem) => row.description || '-',
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: CskhCatalogItem) => {
            const active = (row as CskhPhaseItem).active !== false;
            return (
              <span className={`cskh-status ${active ? 'cskh-status--ok' : 'cskh-status--warn'}`}>
                <span className="cskh-status__dot" aria-hidden />
                {active ? 'Đang sử dụng' : 'Tạm ẩn'}
              </span>
            );
          },
        },
      ];
    }
    return [
      codeCol,
      { key: 'name', label: 'Tên', render: (row: CskhCatalogItem) => row.name },
    ];
  }, [def.extra]);

  const sortedRows = useMemo(() => {
    if (def.extra === 'phase') {
      return [...(rows as CskhPhaseItem[])].sort((a, b) => a.order - b.order);
    }
    return rows;
  }, [def.extra, rows]);

  return (
    <>
      <PageHeader
        title={def.title}
        subtitle={def.subtitle}
        actions={(
          <>
            <span className="page-header__updated tabular-nums">{sortedRows.length} mục</span>
            <Button type="button" leftIcon={Plus} onClick={openCreate}>
              {def.addLabel}
            </Button>
          </>
        )}
      />

      <HrmPanel className="cskh-desk__panel">
        <CskhMasterTable
          columns={columns}
          rows={sortedRows}
          emptyMessage={def.empty}
          emptyIcon={def.emptyIcon}
          emptyAction={(
            <Button type="button" leftIcon={Plus} onClick={openCreate}>
              {def.addLabel}
            </Button>
          )}
          onEdit={openEdit}
          onDelete={row => setDeleteTarget({ id: row.id, name: row.name })}
        />
      </HrmPanel>

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingId ? def.addLabel.replace('Thêm', 'Sửa') : def.addLabel}
        size="md"
        footer={(
          <>
            <Button type="button" variant="outlined" onClick={closeForm}>Hủy</Button>
            <Button type="button" onClick={save}>Lưu</Button>
          </>
        )}
      >
        <FormField label={def.nameLabel} required error={nameError}>
          <input
            className="form-input"
            value={form.name}
            onChange={e => {
              setForm(current => ({ ...current, name: e.target.value }));
              setNameError('');
            }}
            placeholder={def.namePlaceholder}
          />
        </FormField>
        {(def.extra === 'description' || def.extra === 'tech') && (
          <FormField
            label={def.extra === 'tech' ? 'Mô tả công nghệ' : 'Mô tả'}
            required
            error={techError}
          >
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={e => {
                setForm(current => ({ ...current, description: e.target.value }));
                setTechError('');
              }}
              placeholder={
                def.extra === 'tech'
                  ? 'VD: Đốt tầng sôi, nhiên liệu rắn đa dạng'
                  : 'VD: Nhà máy sản xuất hoá chất'
              }
            />
          </FormField>
        )}
        {def.extra === 'phase' && (
          <>
            <FormField label="Thứ tự hiển thị" required>
              <input
                className="form-input"
                type="number"
                min={1}
                value={form.order}
                onChange={e => setForm(current => ({ ...current, order: e.target.value }))}
                placeholder="VD: 1"
              />
            </FormField>
            <FormField label="Trạng thái" required error={statusError}>
              <div className="cskh-field-preview">
                <HrmSelect
                  value={form.active}
                  onChange={value => {
                    setForm(current => ({ ...current, active: value }));
                    setStatusError('');
                  }}
                  options={PHASE_STATUS_OPTIONS}
                  placeholder="Chọn trạng thái"
                  error={Boolean(statusError)}
                />
                {form.active === 'active' || form.active === 'inactive' ? (
                  <span className={`cskh-status ${form.active === 'active' ? 'cskh-status--ok' : 'cskh-status--warn'}`}>
                    <span className="cskh-status__dot" aria-hidden />
                    {form.active === 'active' ? 'Đang sử dụng' : 'Tạm ẩn'}
                  </span>
                ) : null}
              </div>
            </FormField>
            <FormField label="Mô tả">
              <textarea
                className="form-input"
                rows={2}
                value={form.description}
                onChange={e => setForm(current => ({ ...current, description: e.target.value }))}
                placeholder="Ghi chú / phạm vi của giai đoạn"
              />
            </FormField>
          </>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa khỏi danh mục"
        message={deleteTarget ? `Xóa ${deleteTarget.name}?` : ''}
        confirmLabel="Xóa"
      />
    </>
  );
}
