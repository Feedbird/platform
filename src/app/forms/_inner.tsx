"use client";
import FormsTable from "@/components/forms/content/forms-table";
import { useFormStore } from "@/lib/store/forms-store";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Form } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Loading from "./[id]/loading";

// Sleep function that waits for specified milliseconds
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function FormsInner() {
  const [loading, isLoading] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const { activeWorkspaceId } = useFeedbirdStore();
  const { getFormsByWorkspaceId } = useFormStore();

  const fetchForms = async () => {
    if (!activeWorkspaceId) return;
    isLoading(true);
    try {
      const { data } = await getFormsByWorkspaceId(activeWorkspaceId);
      setForms(data);
      console.log("✅ Forms fetched successfully:", data);
    } catch (e) {
      console.error("❌ Error fetching forms:", e);
      //! TODO CHECK TOAST?
    } finally {
      isLoading(false);
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
