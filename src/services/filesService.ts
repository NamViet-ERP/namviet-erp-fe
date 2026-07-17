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
    options?: { sessionId?: string; employeeId?: string; inviteToken?: string },
  ): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (options?.sessionId) form.append('sessionId', options.sessionId);
    if (options?.employeeId) form.append('employeeId', options.employeeId);
    if (options?.inviteToken) form.append('inviteToken', options.inviteToken);
    return apiClient.postForm<UploadResult>('/api/hr/files/upload', form);
  },

  async downloadPrivate(key: string, fileName?: string, signal?: AbortSignal): Promise<Blob> {
    return apiClient.getBlob(
      '/api/hr/files/download',
      { key, fileName: fileName?.trim() || undefined },
      { signal },
    );
  },
};
