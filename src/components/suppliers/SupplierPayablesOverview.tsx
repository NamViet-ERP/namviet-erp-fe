import { formatCurrencyFull } from '../../utils/formatCurrency';
import type {
  SupplierPayableAgingBucketApiDto,
  SupplierPayableKpiApiDto,
} from '../../types/api/purchasingApi';

const EMPTY_AGING: SupplierPayableAgingBucketApiDto[] = [
  { key: 'current', label: 'Chưa đến hạn', amount: 0, count: 0 },
  { key: 'd1_30', label: 'Quá hạn 1-30 ngày', amount: 0, count: 0 },
  { key: 'd31_60', label: 'Quá hạn 31-60 ngày', amount: 0, count: 0 },
  { key: 'd61_90', label: 'Quá hạn 61-90 ngày', amount: 0, count: 0 },
  { key: 'over90', label: 'Quá hạn trên 90 ngày', amount: 0, count: 0 },
];

function agingSeg(key: string): 'current' | 'd30' | 'd60' | 'd90' | 'over' {
  if (key === 'current') return 'current';
  if (key === 'd1_30') return 'd30';
  if (key === 'd31_60') return 'd60';
  if (key === 'd61_90') return 'd90';
  return 'over';
}

function agingPrio(seg: ReturnType<typeof agingSeg>): string {
  if (seg === 'current') return 'Trong hạn';
  if (seg === 'd30') return 'Cần theo dõi';
  if (seg === 'd60') return 'Gấp';
  if (seg === 'd90') return 'Rất gấp';
  return 'Khẩn';
}

type Props = {
  kpis: SupplierPayableKpiApiDto;
  aging: SupplierPayableAgingBucketApiDto[];
  upcoming7Total: number;
  upcoming30Total: number;
};

export default function SupplierPayablesOverview({
  kpis,
  aging,
  upcoming7Total,
  upcoming30Total,
}: Props) {
  const buckets = aging.length > 0 ? aging : EMPTY_AGING;
  const current = buckets.find(b => b.key === 'current');
  const showCash = upcoming7Total > 0 || upcoming30Total > 0;

  return (
    <section className="sup-ap-overview" aria-label="Tổng quan công nợ">
      <div className="sup-ap-overview__top">
        <div className="sup-ap-overview__hero">
          <p className="sup-ap-overview__kicker">Còn phải trả</p>
          <p className="sup-ap-overview__total">{formatCurrencyFull(kpis.outstandingTotal)}</p>
          <p className="sup-ap-overview__split">
            <span>
              Chưa đến hạn{' '}
              <strong>{formatCurrencyFull(current?.amount ?? 0)}</strong>
            </span>
            <span>
              Quá hạn{' '}
              <strong className={kpis.overdueTotal > 0 ? 'is-alert' : undefined}>
                {formatCurrencyFull(kpis.overdueTotal)}
              </strong>
            </span>
          </p>
        </div>
        <dl className="sup-ap-overview__aside">
          <div className={kpis.overdueTotal > 0 ? 'sup-ap-overview__metric is-alert' : 'sup-ap-overview__metric'}>
            <dt>Trong đó quá hạn</dt>
            <dd>{formatCurrencyFull(kpis.overdueTotal)}</dd>
          </div>
          <div className={kpis.overdueSupplierCount > 0 ? 'sup-ap-overview__metric is-alert' : 'sup-ap-overview__metric'}>
            <dt>NCC đang quá hạn</dt>
            <dd>{kpis.overdueSupplierCount}</dd>
          </div>
          <div className={kpis.overLimitSupplierCount > 0 ? 'sup-ap-overview__metric is-warn' : 'sup-ap-overview__metric'}>
            <dt>NCC vượt hạn mức</dt>
            <dd>{kpis.overLimitSupplierCount}</dd>
          </div>
        </dl>
      </div>

      <div className="sup-ap-aging">
        <p className="sup-ap-aging__caption">Tuổi nợ theo hạn thanh toán DNTT</p>
        <ul className="sup-ap-aging__cards">
          {buckets.map(bucket => {
            const seg = agingSeg(bucket.key);
            const zero = bucket.amount <= 0;
            return (
              <li
                key={bucket.key}
                className={zero
                  ? `sup-ap-aging__card sup-ap-aging__card--${seg} is-zero`
                  : `sup-ap-aging__card sup-ap-aging__card--${seg}`}
              >
                <p className="sup-ap-aging__prio">{agingPrio(seg)}</p>
                <p className="sup-ap-aging__name">{bucket.label}</p>
                <p className="sup-ap-aging__amt">{formatCurrencyFull(bucket.amount)}</p>
                <p className="sup-ap-aging__n">{bucket.count} DNTT</p>
              </li>
            );
          })}
        </ul>
      </div>

      {showCash ? (
        <p className="sup-ap-overview__cash">
          <span>
            Cần TT 7 ngày <strong>{formatCurrencyFull(upcoming7Total)}</strong>
          </span>
          <span>
            30 ngày <strong>{formatCurrencyFull(upcoming30Total)}</strong>
          </span>
        </p>
      ) : null}
    </section>
  );
}
