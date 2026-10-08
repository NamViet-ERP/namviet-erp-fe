import { useState, useCallback, useMemo } from 'react';
import { projectsService } from '../../services/projectsService';
import { showToast } from '../../components/ui/Toast';
import {  } from '../../lib/dates';

export interface CskhRequestItem {
  id: string;
  code: string;
  name: string;
  requestType: string;
  fromParty: string;
  toDept?: string;
  createdAt: string;
  dueDate?: string;
  priority: 'urgent' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'done' | 'rejected';
  notes?: string;
  attachments?: { name: string; url: string }[];
}

export function useRequestsData(projectCode: string) {
  const [requests, setRequests] = useState<CskhRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsService.listRequests(projectCode);
      setRequests(data || []);
    } catch {
      showToast('error', 'Lỗi tải danh sách yêu cầu nội bộ');
    } finally {
      setLoading(false);
    }
  }, [projectCode]);

  const kpis = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'done').length,
    };
  }, [requests]);

  const createRequest = async (form: Partial<CskhRequestItem>) => {
    await projectsService.createRequest(projectCode, {
      name: form.name?.trim(),
      requestType: form.requestType,
      fromParty: form.fromParty,
      toDept: form.toDept,
      dueDate: form.dueDate,
      priority: form.priority,
      body: form.notes,
    });
    showToast('success', 'Đã tạo yêu cầu mới');
    await loadData();
  };

  const updateRequest = async (id: string, form: Partial<CskhRequestItem>) => {
    await projectsService.updateRequest(projectCode, id, {
      status: form.status,
      notes: form.notes,
    });
    showToast('success', 'Đã cập nhật yêu cầu');
    await loadData();
  };

  const deleteRequest = async (id: string) => {
    await projectsService.deleteRequest(projectCode, id);
    showToast('success', 'Đã xóa yêu cầu');
    await loadData();
  };

  return {
    requests,
    loading,
    kpis,
    loadData,
    createRequest,
    updateRequest,
    deleteRequest,
  };
}
