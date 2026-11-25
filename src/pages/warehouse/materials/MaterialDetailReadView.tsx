import { Ban, RotateCcw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import SectionCard from '../../../components/ui/SectionCard';
import DetailFieldGrid from '../../../components/hr/DetailFieldGrid';
import { FieldView } from '../../../components/hr/DetailFields';
import { resolveMediaUrl } from '../../../lib/hrm/employeeApiMapper';
import { parseOriginParts } from '../../../constants/materialCategoryLevels';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { MaterialApiDto } from '../../../types/wms';

export interface MaterialDetailReadViewProps {
  material: MaterialApiDto;
  isActive: boolean;
  isReactivating: boolean;
  onRequestDiscontinue: () => void;
  onReactivate: () => void;
}

export function MaterialDetailInfoReadGrid({ material }: { material: MaterialApiDto }) {
  const parsed = parseOriginParts(material.origin);
  const hasOriginParts = Boolean(parsed.brand || parsed.country || parsed.region);
  const imageUrl = material.imageUrl?.trim();

  return (
    <DetailFieldGrid layout="responsive">
      <FieldView label="Mã vật tư" value={material.materialCode} />
      <FieldView label="Tên" value={material.materialName} />
      <FieldView label="Đơn vị tính" value={material.unit} />
      {hasOriginParts ? (
        <>
          <FieldView label="Hãng / Nhãn hiệu" value={parsed.brand || undefined} />
          <FieldView
            label="Nước sản xuất"
            value={
              parsed.country
                ? `${parsed.country}${parsed.region ? ` (${parsed.region})` : ''}`
                : undefined
            }
          />
          {parsed.region && !parsed.country ? (
            <FieldView label="Nhóm nước" value={parsed.region} />
          ) : null}
        </>
      ) : (
        <FieldView label="Xuất xứ" value={material.origin ?? undefined} />
      )}
      <FieldView label="Quy cách" value={material.technicalSpec ?? undefined} />
      <FieldView
        label="Giá trần tham chiếu"
        value={material.ceilingPrice != null ? formatCurrencyFull(material.ceilingPrice) : undefined}
      />
      <FieldView label="Tiêu chuẩn chất lượng" value={material.qualityStandard ?? undefined} />
      <FieldView
        className="col-span-full"
        label="Thông số kỹ thuật chung"
        value={material.generalTechnicalSpec ?? undefined}
        multiline
      />
      <div className="col-span-full pt-2">
        <span className="hrm-field__label block mb-2 font-medium">Hình ảnh vật tư</span>
        {imageUrl ? (
          <div className="flex items-start gap-4">
            <a
              href={resolveMediaUrl(imageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="mat-detail-image-link"
              title="Bấm để mở ảnh kích thước gốc"
            >
              <img
                src={resolveMediaUrl(imageUrl)}
                alt={material.materialName}
                className="mat-detail-image"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </a>
            <div className="text-xs text-[var(--color-text-muted)] pt-1 space-y-1">
              <p className="font-medium text-[var(--md-on-surface)]">Đã tải lên ảnh đại diện vật tư</p>
              <p>Bấm vào ảnh để xem kích thước gốc trong tab mới.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)] italic">Chưa có hình ảnh</p>
        )}
      </div>
    </DetailFieldGrid>
  );
}

export function MaterialDetailStatusCard({
  material,
  isActive,
  isReactivating,
  onRequestDiscontinue,
  onReactivate,
}: MaterialDetailReadViewProps) {
  return (
    <SectionCard
      variant="detail"
      className={isActive ? 'hrm-detail-section--status-active' : 'hrm-detail-section--status-inactive'}
      title={isActive ? 'Ngừng sử dụng' : 'Kích hoạt lại'}
      description={
        isActive
          ? 'Ẩn khỏi danh sách tạo phiếu mới; giữ nguyên tồn kho và lịch sử dự án.'
          : 'Cho phép chọn vật tư trong phiếu nhập/xuất mới.'
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--md-on-surface)]">
            {material.materialCode} — {material.materialName}
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
            {isActive
              ? 'Dùng khi mã không còn nhập mới nhưng dự án cũ vẫn cần đối soát.'
              : 'Vật tư hiện không xuất hiện khi lập phiếu mới.'}
          </p>
        </div>
        {isActive ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={Ban}
            className="shrink-0"
            onClick={onRequestDiscontinue}
          >
            Ngừng sử dụng
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlined"
            size="sm"
            leftIcon={RotateCcw}
            className="shrink-0"
            disabled={isReactivating}
            onClick={onReactivate}
          >
            Kích hoạt lại
          </Button>
        )}
      </div>
    </SectionCard>
  );
}
