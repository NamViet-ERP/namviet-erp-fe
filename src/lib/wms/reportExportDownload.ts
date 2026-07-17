import { apiClient, saveBlob } from '../apiClient';

export async function downloadReportExport(
  endpoint: string,
  fileName: string,
  params?: Record<string, string | undefined>,
): Promise<void> {
  saveBlob(await apiClient.getBlob(endpoint, params), fileName);
}
