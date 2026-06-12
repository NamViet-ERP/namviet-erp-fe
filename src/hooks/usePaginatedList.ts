import { useState, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 10;

/** Pagination state shared by HRM list pages. */
export function usePaginatedList<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const paginated = useMemo(
    () => items.slice((page - 1) * size, page * size),
    [items, page, size],
  );

  const resetPage = () => setPage(1);

  const changePageSize = (next: number) => {
    setSize(next);
    setPage(1);
  };

  return {
    page,
    setPage,
    pageSize: size,
    setPageSize: changePageSize,
    totalPages,
    paginated,
    resetPage,
  };
}
