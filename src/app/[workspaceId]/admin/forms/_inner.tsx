'use client';
import FormsTable, { TableForm } from '@/components/forms/content/forms-table';
import { useWorkspaceStore, useFormStore } from '@/lib/store';
import { useEffect } from 'react';
import Loading from './[id]/loading';
import { useForms } from '@/contexts/forms/forms-context';
import { toast } from 'sonner';

export default function FormsInner() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { getFormsByWorkspaceId } = useFormStore();
  const {
    forms,
    setForms,
    activeForm,
    setActiveForm,
    setIsEditing,
    loading,
    setLoading,
  } = useForms();

  const fetchForms = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const forms = await getFormsByWorkspaceId(activeWorkspaceId);
      setForms(forms as TableForm[]);
    } catch (e) {
      toast.error('Failed to fetch forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeForm) {
      setActiveForm(null);
      setIsEditing(false);
    }
  }, []);
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full">
      <FormsTable forms={forms} />
    </div>
  );
}
