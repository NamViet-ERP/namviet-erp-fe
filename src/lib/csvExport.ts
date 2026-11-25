import { saveBlob } from './apiClient';

export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsvContent(
  header: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
): string {
  const lines = rows.map(row => row.map(escapeCsvCell).join(','));
  return `\uFEFF${[header.map(escapeCsvCell).join(','), ...lines].join('\n')}`;
}

export async function downloadCsvContent(content: string, fileName: string): Promise<boolean> {
  const normalized = content.startsWith('\uFEFF') ? content : `\uFEFF${content}`;
  const blob = new Blob([normalized], { type: 'text/csv;charset=utf-8' });
  return saveBlob(blob, fileName);
}

export async function downloadCsv(
  fileName: string,
  header: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
): Promise<boolean> {
  return downloadCsvContent(buildCsvContent(header, rows), fileName);
}
