import { useState, useEffect, useCallback } from 'react';

/** Shared view/edit form state for HRM detail pages. */
export function useEditableForm<T>(source: T | undefined) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<T | null>(null);

  useEffect(() => {
    if (source) setForm({ ...source });
  }, [source]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const resetForm = useCallback(() => {
    if (source) setForm({ ...source });
  }, [source]);

  const cancelEdit = useCallback(() => {
    resetForm();
    setIsEditing(false);
  }, [resetForm]);

  return {
    isEditing,
    setIsEditing,
    form,
    setForm,
    setField,
    resetForm,
    cancelEdit,
  };
}
