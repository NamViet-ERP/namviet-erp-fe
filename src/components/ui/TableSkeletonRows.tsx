interface TableSkeletonRowsProps {
  colSpan: number;
  rows?: number;
}

/** Skeleton rows inside &lt;tbody&gt; while list data is loading. */
export default function TableSkeletonRows({ colSpan, rows = 5 }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
          <td colSpan={colSpan}>
            <div className="hrm-table-skeleton" />
          </td>
        </tr>
      ))}
    </>
  );
}
