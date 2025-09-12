"use client";
import FormsTable, { TableForm } from "@/components/forms/content/forms-table";
import { useFormStore } from "@/lib/store/forms-store";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useEffect } from "react";
import Loading from "./[id]/loading";
import { useForms } from "@/contexts/FormsContext";
import { toast } from "sonner";

export default function FormsInner() {
  const { activeWorkspaceId } = useFeedbirdStore();
  const { getFormsByWorkspaceId } = useFormStore();
  const { forms, setForms, loading, setLoading } = useForms();

  const fetchForms = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const { data } = await getFormsByWorkspaceId(activeWorkspaceId);
      setForms(data as TableForm[]);
    } catch (e) {
      toast.error("Failed to fetch forms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [activeWorkspaceId]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full">
      <FormsTable forms={forms} />
    </div>
  );
}
