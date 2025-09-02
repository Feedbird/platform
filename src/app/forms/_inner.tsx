"use client";
import FormsTable, { TableForm } from "@/components/forms/content/forms-table";
import { useFormStore } from "@/lib/store/forms-store";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useEffect } from "react";
import Loading from "./[id]/loading";
import { useForms } from "@/contexts/FormsContext";

export default function FormsInner() {
  const { activeWorkspaceId } = useFeedbirdStore();
  const { getFormsByWorkspaceId } = useFormStore();
  const { forms, setForms, activeForm, setActiveForm, loading, setLoading } =
    useForms();

  const fetchForms = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const { data } = await getFormsByWorkspaceId(activeWorkspaceId);
      setForms(data as TableForm[]);
      console.log("✅ Forms fetched successfully:", data);
    } catch (e) {
      console.error("❌ Error fetching forms:", e);
      //! TODO CHECK TOAST?
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
    <div>
      <FormsTable forms={forms} />
    </div>
  );
}
