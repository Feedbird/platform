"use client";
import EmptyFormPreview from "./content/EmptyFormPreview";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useFormStore } from "@/lib/store/forms-store";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

export default function EmptyFormsComponent() {
  const router = useRouter();
  const { activeWorkspaceId, user } = useFeedbirdStore();
  const { createInitialForm } = useFormStore();

  const handleInitialFormCreation = async () => {
    try {
      if (!user || !activeWorkspaceId) {
        throw new Error("User or active workspace not found");
      }
      const newForm = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`/forms/${newForm.id}`);
    } catch (e) {
      console.error("Error creating initial form:", e);
      throw new Error("Error creating initial form"); //! TODO Check toasts
    }
  };
  return (
    <div className="w-full h-full bg-[#F8F8F8] items-center justify-center flex flex-col p-4">
      <div className="w-full md:max-w-[230px] flex flex-col gap-4">
        <div className="flex flex-col gap-2 p-5">
          <EmptyFormPreview iconColor="#A288DE" />
          <EmptyFormPreview iconColor="#FF8251" iconOpacity={0.6} />
          <EmptyFormPreview iconColor="#79C4E4" />
        </div>
        <div className="flex flex-col text-center">
          <span className="font-semibold text-medium text-[#1C1D1F]">
            No forms yet
          </span>
          <p className="font-normal text-[13px]">
            No form created yet. Start by creating your first form.
          </p>
        </div>

        <Button
          onClick={handleInitialFormCreation}
          className="bg-[#4670F9] hover:cursor-pointer self-center w-24 text-white py-1 px-[10px] rounded-[4px] font-medium text-[13px]"
        >
          + New Form
        </Button>
      </div>
    </div>
  );
}
