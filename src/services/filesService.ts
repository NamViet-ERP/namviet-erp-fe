import { apiClient } from '../lib/apiClient';

export type UploadCategory = 'profile' | 'cccd-front' | 'cccd-back' | 'degree' | 'cv';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export const filesService = {
  async upload(
    file: File,
    category: UploadCategory,
    options?: { sessionId?: string; employeeId?: string },
  ): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (options?.sessionId) form.append('sessionId', options.sessionId);
    if (options?.employeeId) form.append('employeeId', options.employeeId);
    return apiClient.postForm<UploadResult>('/api/hr/files/upload', form);
  },
};
