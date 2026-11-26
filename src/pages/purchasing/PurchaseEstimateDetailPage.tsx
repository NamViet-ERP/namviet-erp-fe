import { useParams } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import TableShell from '../../components/ui/TableShell';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  canEditEstimate,
  canSubmitEstimate,
  estimateStatusBadge,
  estimateStatusLabel,
} from '../../lib/purchaseEstimateStatus';
import EstimateApprovalsPanel from './estimates/EstimateApprovalsPanel';
import EstimateLinesEditor from './estimates/EstimateLinesEditor';
import EstimateLinesReadView from './estimates/EstimateLinesReadView';
import EstimateVersionSidebar from './estimates/EstimateVersionSidebar';
import { useEstimateDetailController } from './estimates/useEstimateDetailController';

export default function PurchaseEstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vm = useEstimateDetailController(id);
  const { row } = vm;

  return (
    <PageShell variant="detail" className="pur-estimate-detail">
      <PageHeader
        variant="detail"
        onBack={vm.back}
        breadcrumbs={[
          { label: 'Mua hàng', to: '/purchasing/dashboard' },
          { label: 'Mua hàng dự toán', to: '/operations/estimate-procurement?tab=estimates' },
          { label: row?.code ?? 'Dự toán' },
        ]}
        title={row ? `${row.code} · ${row.title}` : 'Dự toán'}
        subtitle={row ? `${row.projectCode} · ${vm.meta}` : 'Mua hàng dự toán'}
        actions={(
          <div className="flex flex-wrap gap-2 justify-end">
            {vm.canShare && vm.viewingLatest && !vm.editing ? (
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={Link2}
                disabled={vm.busy}
                onClick={() => void vm.runShareLink()}
              >
                Lấy link xem
              </Button>
            ) : null}
            {vm.canEdit && vm.viewingLatest && !vm.editing && canEditEstimate(row?.status) ? (
              <Button type="button" variant="outlined" size="sm" onClick={vm.startEdit}>
                Sửa dòng vật tư
              </Button>
            ) : null}
            {vm.canEdit && vm.viewingLatest && !vm.editing && canSubmitEstimate(row?.status) ? (
              <Button
                type="button"
                variant="filled"
                size="sm"
                disabled={vm.busy}
                onClick={() => void vm.runSubmit()}
              >
                Gửi duyệt
              </Button>
            ) : null}
            {vm.canConvert && vm.viewingLatest && row?.status === 'approved' && !row.convertedPlanCode ? (
              <Button
                type="button"
                variant="filled"
                size="sm"
                disabled={vm.busy}
                onClick={() => void vm.runConvert()}
              >
                Tạo kế hoạch mua hàng
              </Button>
            ) : null}
          </div>
        )}
      />

      {vm.detail.isError ? (
        <EmptyState message={getApiErrorMessage(vm.detail.error, 'Không tải được dự toán.')} />
      ) : vm.detail.isLoading || !row ? (
        <TableShell loading colSpan={6} tableClassName="wms-inventory-table" />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`badge ${estimateStatusBadge(row.status)}`}>
              {estimateStatusLabel(row.status)}
            </span>
            {row.convertedPlanCode ? (
              <Button
                type="button"
                variant="text"
                size="sm"
                onClick={() => vm.openPlan(row.convertedPlanCode!)}
              >
                KHMH {row.convertedPlanCode}
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <EstimateVersionSidebar
              versions={vm.versions}
              latestVersion={vm.latest}
              viewVersion={vm.viewVersion}
              disabled={vm.editing}
              onSelectVersion={vm.setViewVersion}
            />

            <div className="min-w-0 flex-1 space-y-3">
              {vm.editing ? (
                <EstimateLinesEditor
                  title={vm.title}
                  draftLines={vm.draftLines}
                  materials={vm.materials}
                  saving={vm.saving}
                  onTitleChange={vm.setTitle}
                  onAddLine={vm.addDraftLine}
                  onUpdateLine={vm.updateDraftLine}
                  onRemoveLine={vm.removeDraftLine}
                  onCancel={() => vm.setEditing(false)}
                  onSave={() => void vm.save()}
                />
              ) : (
                <>
                  <EstimateLinesReadView
                    lines={row.lines}
                    proposals={vm.proposals}
                    workflowLocked={vm.workflowLocked}
                  />

                  <EstimateApprovalsPanel
                    approvals={row.approvals}
                    nextApproval={vm.nextApproval}
                    canDecide={vm.canDecideCurrent && row.status === 'pending_approval'}
                    latestVersion={vm.latest}
                    decideNote={vm.decideNote}
                    busy={vm.busy}
                    onDecideNoteChange={vm.setDecideNote}
                    onApprove={() => void vm.runApprove()}
                    onReject={() => void vm.runReject()}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
