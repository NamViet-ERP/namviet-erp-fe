import { Package, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  materialCodeParts,
  parseOriginParts,
} from '../../../constants/materialCategoryLevels';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import { resolveMediaUrl } from '../../../lib/hrm/employeeApiMapper';
import type { MaterialApiDto } from '../../../types/wms';

interface MaterialsTableRowProps {
  material: MaterialApiDto;
  isAdmin: boolean;
  isDeleting: boolean;
  onSelect: (code: string) => void;
  onDeleteRequest: (code: string, name: string) => void;
}

export default function MaterialsTableRow({
  material: m,
  isAdmin,
  isDeleting,
  onSelect,
  onDeleteRequest,
}: MaterialsTableRowProps) {
  const parsedOrigin = parseOriginParts(m.origin);
  const codeParts = materialCodeParts(m.materialCode);
  const categoryBreadcrumb = [
    m.categoryPath?.danhMuc,
    m.categoryPath?.nhomVatTu,
    m.categoryPath?.loaiVatTu,
  ]
    .filter(Boolean)
    .join(' › ');
  const subCategoryBreadcrumb = [
    m.categoryPath?.phanLoai,
    m.categoryPath?.kieu,
  ]
    .filter(Boolean)
    .join(' › ');
  const hasImage = Boolean(m.imageUrl?.trim());

  return (
    <tr
      className="table-row mat-catalog-row"
      onClick={() => onSelect(m.materialCode)}
      {...getInteractiveRowProps(() => onSelect(m.materialCode), `Xem chi tiết vật tư ${m.materialCode}`)}
    >
      {/* 1. Ảnh */}
      <td className="table-cell text-center mat-col-thumb">
        {hasImage ? (
          <img
            src={resolveMediaUrl(m.imageUrl!.trim())}
            alt={m.materialName}
            className="mat-thumb-img inline-block"
            onError={e => {
              const img = e.currentTarget;
              img.classList.add('hidden');
              const sibling = img.nextElementSibling as HTMLElement | null;
              if (sibling) {
                sibling.classList.remove('hidden');
                sibling.classList.add('flex');
              }
            }}
          />
        ) : null}
        <div className={`mat-thumb-fallback ${hasImage ? 'hidden' : 'flex'}`}>
          <Package size={16} className="opacity-40" aria-hidden />
        </div>
      </td>

      {/* 2. Mã vật tư */}
      <td className="table-cell">
        <div className="mat-code-cell">
          <span className="mat-code-cell__badge">{m.materialCode}</span>
          {codeParts.length > 1 && (
            <div className="mat-code-cell__parts" aria-hidden>
              {codeParts.map((part, i) => (
                <span
                  key={`${m.materialCode}-${i}`}
                  className={`mat-code-cell__part mat-code-cell__part--${(i % 4) + 1}`}
                >
                  {part}
                </span>
              ))}
            </div>
          )}
          {(parsedOrigin.brand || parsedOrigin.country || m.origin) && (
            <div className="mat-origin-chips">
              {parsedOrigin.brand && (
                <span
                  className="mat-origin-chip mat-origin-chip--brand"
                  title={`Hãng: ${parsedOrigin.brand}`}
                >
                  <span className="mat-origin-chip__prefix">Hãng:</span>
                  {parsedOrigin.brand}
                </span>
              )}
              {(parsedOrigin.country || m.origin) && (
                <span
                  className="mat-origin-chip mat-origin-chip--country"
                  title={`Xuất xứ: ${parsedOrigin.country || m.origin}${parsedOrigin.region ? ` (${parsedOrigin.region})` : ''}`}
                >
                  <span className="mat-origin-chip__prefix">XX:</span>
                  {parsedOrigin.country || m.origin}
                  {parsedOrigin.region && (
                    <span className="mat-region-pill">{parsedOrigin.region}</span>
                  )}
                </span>
              )}
            </div>
          )}
          {m.isActive === false && (
            <span className="badge badge-warning mat-inactive-badge">Ngừng SD</span>
          )}
        </div>
      </td>

      {/* 3. Tên vật tư */}
      <td className="table-cell">
        <div className="mat-name-cell">
          <span className="mat-name-cell__title text-sm">
            {m.materialName}
          </span>
          {m.qualityStandard && (
            <span className="mat-cell-meta">
              Tiêu chuẩn: <span className="mat-cell-meta__strong">{m.qualityStandard}</span>
            </span>
          )}
        </div>
      </td>

      {/* 4. Phân cấp danh mục */}
      <td className="table-cell">
        <div className="flex flex-col gap-0.5 py-0.5">
          <span className="mat-cell-primary">
            {categoryBreadcrumb || '-'}
          </span>
          {subCategoryBreadcrumb && (
            <span className="mat-cell-sub">{subCategoryBreadcrumb}</span>
          )}
        </div>
      </td>

      {/* 5. ĐVT */}
      <td className="table-cell text-center whitespace-nowrap">
        <span className="mat-unit-pill">{m.unit || '-'}</span>
      </td>

      {/* 6. Quy cách / Thông số chính */}
      <td className="table-cell">
        <div className="flex flex-col gap-0.5 py-0.5 max-w-sm">
          {m.technicalSpec ? (
            <span className="mat-cell-spec-primary">{m.technicalSpec}</span>
          ) : null}
          {m.generalTechnicalSpec ? (
            <span className="mat-cell-spec-sub line-clamp-2" title={m.generalTechnicalSpec}>
              {m.generalTechnicalSpec}
            </span>
          ) : null}
          {!m.technicalSpec && !m.generalTechnicalSpec && (
            <span className="mat-cell-dash">-</span>
          )}
        </div>
      </td>

      {/* 7. Hãng */}
      <td className="table-cell whitespace-nowrap">
        {parsedOrigin.brand ? (
          <span className="mat-cell-brand">{parsedOrigin.brand}</span>
        ) : (
          <span className="mat-cell-dash">-</span>
        )}
      </td>

      {/* 8. Xuất xứ */}
      <td className="table-cell whitespace-nowrap">
        {parsedOrigin.country ? (
          <span className="mat-cell-origin">
            {parsedOrigin.country}
            {parsedOrigin.region ? (
              <span className="mat-region-pill">{parsedOrigin.region}</span>
            ) : null}
          </span>
        ) : m.origin ? (
          <span className="mat-cell-origin">{m.origin}</span>
        ) : (
          <span className="mat-cell-dash">-</span>
        )}
      </td>

      {/* 9. Thao tác xóa lẻ (Chỉ Quản trị viên) */}
      {isAdmin && (
        <td
          className="table-cell text-center whitespace-nowrap"
          onClick={e => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="text"
            size="sm"
            className="btn-icon mat-row-delete-btn"
            title={`Xóa vật tư ${m.materialCode}`}
            aria-label={`Xóa vật tư ${m.materialCode}`}
            disabled={isDeleting}
            onClick={e => {
              e.stopPropagation();
              onDeleteRequest(m.materialCode, m.materialName);
            }}
          >
            <Trash2 size={15} aria-hidden />
          </Button>
        </td>
      )}
    </tr>
  );
}
