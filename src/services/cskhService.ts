import { apiClient } from '../lib/apiClient';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface ProjectBottleneckHistoryNoteDto {
  id: string;
  at: string;
  text: string;
}

export interface ProjectBottleneckDto {
  id: string;
  code: string;
  projectCode: string;
  name: string;
  severity: 'urgent' | 'medium' | 'low';
  status: 'open' | 'closed';
  startedAt: string;
  expectedAt: string;
  reason: string;
  ganttTask?: string | null;
  departmentId?: string | null;
  pic?: string | null;
  resolution?: string | null;
  source: string;
  history: ProjectBottleneckHistoryNoteDto[];
}

export interface CreateProjectBottleneckRequest {
  name: string;
  severity: 'urgent' | 'medium' | 'low';
  startedAt: string;
  expectedAt: string;
  reason: string;
  ganttTask?: string | null;
  departmentId?: string | null;
  pic?: string | null;
  resolution?: string | null;
  source?: string;
}

export interface UpdateProjectBottleneckRequest {
  name?: string | null;
  severity?: string | null;
  status?: string | null;
  expectedAt?: string | null;
  reason?: string | null;
  ganttTask?: string | null;
  departmentId?: string | null;
  pic?: string | null;
  resolution?: string | null;
  noteText?: string | null;
}

export interface ProjectRequestCenterDto {
  id: string;
  code: string;
  projectCode: string;
  name: string;
  requestType: string;
  fromParty: string;
  toDept?: string | null;
  createdAt: string;
  dueDate?: string | null;
  priority: 'urgent' | 'medium' | 'low';
  status: 'open' | 'processing' | 'closed';
  body?: string | null;
}

export interface CreateProjectRequestCenterRequest {
  name: string;
  requestType: string;
  fromParty: string;
  toDept?: string | null;
  dueDate?: string | null;
  priority: string;
  body?: string | null;
}

export interface UpdateProjectRequestCenterRequest {
  status: string;
  notes?: string | null;
}

export interface ProjectMeetingActionDto {
  id: string;
  name: string;
  dueDate: string;
  done: boolean;
  pic?: string | null;
  generatedBottleneck: boolean;
}

export interface ProjectMeetingAttachmentDto {
  name: string;
  size?: string | null;
  url?: string | null;
  uploadedAt?: string | null;
}

export interface ProjectMeetingDto {
  id: string;
  code: string;
  projectCode: string;
  name: string;
  date: string;
  attendees?: string | null;
  agenda?: string | null;
  minutes?: string | null;
  overdueActionCount: number;
  actions: ProjectMeetingActionDto[];
  attachments?: ProjectMeetingAttachmentDto[] | null;
}

export interface CreateProjectMeetingActionRequest {
  name: string;
  dueDate: string;
  pic?: string | null;
}

export interface CreateProjectMeetingRequest {
  name: string;
  date: string;
  attendees?: string | null;
  agenda?: string | null;
  actions: CreateProjectMeetingActionRequest[];
}

export interface UpdateProjectMeetingMinutesRequest {
  minutes: string;
}

export interface UpdateProjectMeetingActionRequest {
  actionId: string;
  done: boolean;
}

export interface ProjectDocumentDto {
  id: string;
  code: string;
  projectCode: string;
  name: string;
  docType: string;
  stage: string;
  author?: string | null;
  internalApproved: boolean;
  handoverSigned: boolean;
  handoverDate?: string | null;
  handoverRecipient?: string | null;
  slaDueDate?: string | null;
  overdueDays: number;
  status: string;
  statusLabel: string;
  category?: string | null;
  fileSize?: string | null;
  fileName?: string | null;
  downloadUrl?: string | null;
}

export interface CreateProjectDocumentRequest {
  code: string;
  name: string;
  docType: string;
  author?: string | null;
  slaDueDate?: string | null;
  category?: string | null;
  handoverDate?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  handoverRecipient?: string | null;
  stage?: string | null;
  status?: string | null;
  statusLabel?: string | null;
}

export interface UpdateProjectDocumentStatusRequest {
  stage: string;
  internalApproved?: boolean | null;
  handoverSigned?: boolean | null;
  handoverDate?: string | null;
  handoverRecipient?: string | null;
  status?: string | null;
  statusLabel?: string | null;
}

// ── Service Definition ───────────────────────────────────────────────────────

const BASE_PROJECTS = '/api/warehouse/projects';

export const cskhService = {
  // Bottlenecks
  listBottlenecks(projectCode: string): Promise<ProjectBottleneckDto[]> {
    return apiClient.get<ProjectBottleneckDto[]>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/bottlenecks`);
  },

  createBottleneck(projectCode: string, request: CreateProjectBottleneckRequest): Promise<ProjectBottleneckDto> {
    return apiClient.post<ProjectBottleneckDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/bottlenecks`, request);
  },

  updateBottleneck(projectCode: string, id: string, request: UpdateProjectBottleneckRequest): Promise<ProjectBottleneckDto> {
    return apiClient.put<ProjectBottleneckDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/bottlenecks/${encodeURIComponent(id)}`, request);
  },

  deleteBottleneck(projectCode: string, id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/bottlenecks/${encodeURIComponent(id)}`);
  },

  // Requests Center
  listRequests(projectCode: string): Promise<ProjectRequestCenterDto[]> {
    return apiClient.get<ProjectRequestCenterDto[]>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/requests`);
  },

  createRequest(projectCode: string, request: CreateProjectRequestCenterRequest): Promise<ProjectRequestCenterDto> {
    return apiClient.post<ProjectRequestCenterDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/requests`, request);
  },

  updateRequest(projectCode: string, id: string, request: UpdateProjectRequestCenterRequest): Promise<ProjectRequestCenterDto> {
    return apiClient.put<ProjectRequestCenterDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/requests/${encodeURIComponent(id)}`, request);
  },

  deleteRequest(projectCode: string, id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/requests/${encodeURIComponent(id)}`);
  },

  // Meetings
  listMeetings(projectCode: string): Promise<ProjectMeetingDto[]> {
    return apiClient.get<ProjectMeetingDto[]>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings`);
  },

  createMeeting(projectCode: string, request: CreateProjectMeetingRequest): Promise<ProjectMeetingDto> {
    return apiClient.post<ProjectMeetingDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings`, request);
  },

  updateMeeting(projectCode: string, id: string, request: CreateProjectMeetingRequest): Promise<ProjectMeetingDto> {
    return apiClient.put<ProjectMeetingDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings/${encodeURIComponent(id)}`, request);
  },

  updateMeetingMinutes(projectCode: string, id: string, request: UpdateProjectMeetingMinutesRequest): Promise<ProjectMeetingDto> {
    return apiClient.put<ProjectMeetingDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings/${encodeURIComponent(id)}/minutes`, request);
  },

  toggleMeetingAction(projectCode: string, id: string, actionId: string, done: boolean): Promise<ProjectMeetingDto> {
    return apiClient.put<ProjectMeetingDto>(
      `${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`,
      { actionId, done }
    );
  },

  deleteMeeting(projectCode: string, id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/meetings/${encodeURIComponent(id)}`);
  },

  // Documents
  listDocuments(projectCode: string): Promise<ProjectDocumentDto[]> {
    return apiClient.get<ProjectDocumentDto[]>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/documents`);
  },

  createDocument(projectCode: string, request: CreateProjectDocumentRequest): Promise<ProjectDocumentDto> {
    return apiClient.post<ProjectDocumentDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/documents`, request);
  },

  updateDocument(projectCode: string, id: string, request: CreateProjectDocumentRequest): Promise<ProjectDocumentDto> {
    return apiClient.put<ProjectDocumentDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/documents/${encodeURIComponent(id)}`, request);
  },

  updateDocumentStatus(projectCode: string, id: string, request: UpdateProjectDocumentStatusRequest): Promise<ProjectDocumentDto> {
    return apiClient.put<ProjectDocumentDto>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/documents/${encodeURIComponent(id)}/status`, request);
  },

  deleteDocument(projectCode: string, id: string): Promise<void> {
    return apiClient.delete<void>(`${BASE_PROJECTS}/${encodeURIComponent(projectCode)}/documents/${encodeURIComponent(id)}`);
  },
};
