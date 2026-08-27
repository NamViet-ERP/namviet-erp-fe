import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmSelect from '../../components/hr/HrmSelect';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { ICON_SIZE } from '../../constants/icons';
import { useCskhMasterData } from '../../hooks/cskh/useCskhMasterData';
import {
  CSKH_TIME_RELATION_OPTIONS,
  emptyScheduleCombo,
  findScheduleCombo,
  newMasterId,
  scheduleSpan,
  upsertScheduleCombo,
  type CskhCapacityBand,
  type CskhScheduleCombo,
  type CskhScheduleRow,
  type CskhTimeRelation,
} from '../../lib/cskh/masterData';

function parseTon(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function tonInput(value: number | null): string {
  return value === null ? '' : String(value);
}

export default function CskhSchedulePage() {
  const navigate = useNavigate();
  const { store, persist } = useCskhMasterData();
  const [boilerTypeId, setBoilerTypeId] = useState(store.boilerTypes[0]?.id ?? '');
  const [priorityId, setPriorityId] = useState(store.priorities[0]?.id ?? '');
  const [deleteBand, setDeleteBand] = useState<CskhCapacityBand | null>(null);

  const boilerOptions = store.boilerTypes.map(item => ({ value: item.id, label: item.name }));
  const priorityOptions = store.priorities.map(item => ({
    value: item.id,
    label: item.name,
    tone: item.color,
  }));
  const missingBoiler = store.boilerTypes.length === 0;
  const missingPriority = store.priorities.length === 0;
  const ready = !missingBoiler && !missingPriority;

  const selectedBoiler = boilerTypeId || boilerOptions[0]?.value || '';
  const selectedPriority = priorityId || priorityOptions[0]?.value || '';
  const combo = ready ? findScheduleCombo(store, selectedBoiler, selectedPriority) : undefined;

  const writeCombo = (next: CskhScheduleCombo) => {
    persist(current => upsertScheduleCombo(current, next));
  };

  const createCombo = () => {
    if (!selectedBoiler || !selectedPriority) return;
    writeCombo(emptyScheduleCombo(selectedBoiler, selectedPriority));
    showToast('success', 'Đã tạo bảng tiến độ cho tổ hợp này.');
  };

  const patchBand = (bandId: string, patch: Partial<CskhCapacityBand>) => {
    if (!combo) return;
    writeCombo({
      ...combo,
      bands: combo.bands.map(band => (band.id === bandId ? { ...band, ...patch } : band)),
    });
  };

  const patchRow = (bandId: string, rowId: string, patch: Partial<CskhScheduleRow>) => {
    if (!combo) return;
    writeCombo({
      ...combo,
      bands: combo.bands.map(band => {
        if (band.id !== bandId) return band;
        return {
          ...band,
          rows: band.rows.map(row => (row.id === rowId ? { ...row, ...patch } : row)),
        };
      }),
    });
  };

  const addRow = (bandId: string) => {
    if (!combo) return;
    const row: CskhScheduleRow = {
      id: newMasterId(),
      name: '',
      days: 0,
      relation: 'from_advance',
      dependsOnId: null,
      offsetDays: 0,
    };
    patchBand(bandId, {
      rows: [...(combo.bands.find(band => band.id === bandId)?.rows ?? []), row],
    });
  };

  const removeRow = (bandId: string, rowId: string) => {
    if (!combo) return;
    patchBand(bandId, {
      rows: (combo.bands.find(band => band.id === bandId)?.rows ?? []).filter(row => row.id !== rowId),
    });
  };

  const addBand = () => {
    if (!combo) return;
    writeCombo({
      ...combo,
      bands: [...combo.bands, { id: newMasterId(), minTon: null, maxTon: null, rows: [] }],
    });
  };

  const confirmDeleteBand = () => {
    if (!combo || !deleteBand) return;
    writeCombo({
      ...combo,
      bands: combo.bands.filter(band => band.id !== deleteBand.id),
    });
    setDeleteBand(null);
    showToast('success', 'Đã xóa mức công suất.');
  };

  return (
    <>
      <PageHeader
        title="Bảng tiến độ chuẩn"
        subtitle="Mốc thời gian theo loại lò, ưu tiên và dải công suất."
        actions={combo ? (
          <span className="page-header__updated tabular-nums">{combo.bands.length} mức công suất</span>
        ) : undefined}
      />

      <HrmPanel className="cskh-desk__panel">
        {!ready ? (
          <EmptyState
            icon={CalendarDays}
            message={
              missingBoiler && missingPriority
                ? 'Thêm loại lò và mức ưu tiên trước khi lập bảng tiến độ.'
                : missingBoiler
                  ? 'Thêm loại lò trước khi lập bảng tiến độ.'
                  : 'Thêm mức ưu tiên trước khi lập bảng tiến độ.'
            }
            action={(
              <div className="cskh-empty-actions">
                {missingBoiler ? (
                  <Button type="button" leftIcon={Plus} onClick={() => navigate('/cskh/settings/boiler-types')}>
                    Thêm loại lò
                  </Button>
                ) : null}
                {missingPriority ? (
                  <Button
                    type="button"
                    variant={missingBoiler ? 'outlined' : 'filled'}
                    leftIcon={Plus}
                    onClick={() => navigate('/cskh/settings/status-priority')}
                  >
                    Thêm ưu tiên
                  </Button>
                ) : null}
              </div>
            )}
          />
        ) : (
          <>
            <div className="cskh-sched-filters">
              <label className="cskh-sched-filter">
                <span className="form-label">Loại lò</span>
                <HrmSelect
                  aria-label="Loại lò"
                  value={selectedBoiler}
                  options={boilerOptions}
                  allowEmpty={false}
                  onChange={setBoilerTypeId}
                />
              </label>
              <label className="cskh-sched-filter">
                <span className="form-label">Mức độ ưu tiên</span>
                <HrmSelect
                  aria-label="Mức độ ưu tiên"
                  value={selectedPriority}
                  options={priorityOptions}
                  allowEmpty={false}
                  onChange={setPriorityId}
                />
              </label>
            </div>

            {!combo ? (
              <EmptyState
                icon={CalendarDays}
                message="Chưa có bảng tiến độ cho tổ hợp loại lò và ưu tiên này."
                action={(
                  <Button type="button" leftIcon={Plus} onClick={createCombo}>
                    Tạo bảng cho tổ hợp này
                  </Button>
                )}
              />
            ) : (
              <div className="cskh-sched-bands">
                {combo.bands.map((band, index) => (
                  <ScheduleBand
                    key={band.id}
                    index={index}
                    band={band}
                    onPatch={patch => patchBand(band.id, patch)}
                    onPatchRow={(rowId, patch) => patchRow(band.id, rowId, patch)}
                    onAddRow={() => addRow(band.id)}
                    onRemoveRow={rowId => removeRow(band.id, rowId)}
                    onDelete={() => setDeleteBand(band)}
                  />
                ))}
                <Button type="button" variant="outlined" leftIcon={Plus} onClick={addBand}>
                  Thêm mức công suất cho tổ hợp này
                </Button>
              </div>
            )}
          </>
        )}
      </HrmPanel>

      <ConfirmDialog
        isOpen={Boolean(deleteBand)}
        onClose={() => setDeleteBand(null)}
        onConfirm={confirmDeleteBand}
        title="Xóa mức công suất"
        message="Xóa mức công suất này và các hạng mục bên trong?"
        confirmLabel="Xóa"
      />
    </>
  );
}

function ScheduleBand({
  index,
  band,
  onPatch,
  onPatchRow,
  onAddRow,
  onRemoveRow,
  onDelete,
}: {
  index: number;
  band: CskhCapacityBand;
  onPatch: (patch: Partial<CskhCapacityBand>) => void;
  onPatchRow: (rowId: string, patch: Partial<CskhScheduleRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onDelete: () => void;
}) {
  const span = scheduleSpan(band.rows);
  const depOptions = band.rows.map(row => ({
    value: row.id,
    label: row.name.trim() || 'Hạng mục chưa đặt tên',
  }));

  return (
    <section className="cskh-sched-band">
      <div className="cskh-desk__section-head">
        <div className="cskh-settings-lead">
          <h3 className="section-heading__title m-0">Mức công suất {index + 1}</h3>
          <div className="cskh-sched-capacity">
            <span className="form-label">Dải tấn</span>
            <input
              className="form-input cskh-sched-ton"
              type="number"
              min={0}
              aria-label="Công suất tối thiểu"
              value={tonInput(band.minTon)}
              onChange={e => onPatch({ minTon: parseTon(e.target.value) })}
            />
            <span aria-hidden>-</span>
            <input
              className="form-input cskh-sched-ton"
              type="number"
              min={0}
              aria-label="Công suất tối đa"
              value={tonInput(band.maxTon)}
              onChange={e => onPatch({ maxTon: parseTon(e.target.value) })}
            />
            <span className="section-heading__sub mb-0">tấn (để trống cả hai: áp dụng mọi công suất)</span>
          </div>
        </div>
        <Button type="button" variant="danger" onClick={onDelete}>
          Xóa mức công suất này
        </Button>
      </div>

      <div className="wms-inventory-table-wrap cskh-desk__table">
        <table className="wms-inventory-table">
          <thead>
            <tr>
              <th className="table-header-cell cskh-sched-col-name">Hạng mục</th>
              <th className="table-header-cell cskh-sched-col-days">Số ngày</th>
              <th className="table-header-cell cskh-sched-col-rel">Quan hệ thời gian</th>
              <th className="table-header-cell cskh-sched-col-offset">Lệch (ngày)</th>
              <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {band.rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={CalendarDays}
                    message="Chưa có hạng mục trong mức công suất này."
                    action={(
                      <Button type="button" leftIcon={Plus} onClick={onAddRow}>
                        Thêm hạng mục
                      </Button>
                    )}
                  />
                </td>
              </tr>
            ) : (
              band.rows.map(row => {
                const needsDep = row.relation !== 'from_advance';
                return (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell cskh-sched-col-name">
                      <input
                        className="form-input"
                        aria-label="Hạng mục"
                        value={row.name}
                        onChange={e => onPatchRow(row.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="table-cell cskh-sched-col-days">
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        aria-label="Số ngày"
                        value={row.days}
                        onChange={e => onPatchRow(row.id, { days: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="table-cell cskh-sched-col-rel">
                      <div className="cskh-sched-rel">
                        <HrmSelect
                          aria-label="Quan hệ thời gian"
                          value={row.relation}
                          options={CSKH_TIME_RELATION_OPTIONS}
                          allowEmpty={false}
                          onChange={value => onPatchRow(row.id, {
                            relation: value as CskhTimeRelation,
                            dependsOnId: value === 'from_advance' ? null : row.dependsOnId,
                          })}
                        />
                        {needsDep && (
                          <HrmSelect
                            aria-label="Hạng mục phụ thuộc"
                            value={row.dependsOnId ?? ''}
                            options={depOptions.filter(item => item.value !== row.id)}
                            placeholder="Chọn hạng mục"
                            onChange={value => onPatchRow(row.id, { dependsOnId: value || null })}
                          />
                        )}
                      </div>
                    </td>
                    <td className="table-cell cskh-sched-col-offset">
                      <input
                        className="form-input"
                        type="number"
                        aria-label="Lệch ngày"
                        value={row.offsetDays}
                        onChange={e => onPatchRow(row.id, { offsetDays: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="table-cell hrm-table-col-actions">
                      <div className="hrm-table-row-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          title="Xóa hạng mục"
                          aria-label={`Xóa ${row.name || 'hạng mục'}`}
                          onClick={() => onRemoveRow(row.id)}
                        >
                          <Trash2 size={ICON_SIZE.dense} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {band.rows.length > 0 && (
        <div className="cskh-sched-foot">
          <dl className="cskh-sched-metrics">
            <div>
              <dt className="form-label">Timeline</dt>
              <dd className="section-heading__title m-0 tabular-nums">{span.timelineDays} ngày</dd>
            </div>
            <div>
              <dt className="form-label">Tổng effort</dt>
              <dd className="section-heading__title m-0 tabular-nums">{span.effortDays} ngày</dd>
            </div>
          </dl>
          <p className="section-heading__sub mb-0">
            Timeline không cộng các hạng mục chạy song song.
          </p>
          <Button type="button" variant="outlined" leftIcon={Plus} onClick={onAddRow}>
            Thêm hạng mục
          </Button>
        </div>
      )}
    </section>
  );
}
