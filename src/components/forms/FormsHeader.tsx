"use client";
import React, { Suspense } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useFormStore } from "@/lib/store/forms-store";
import { useForms } from "@/contexts/FormsContext";
import Image from "next/image";
import FormSettingsModal from "./content/FormSettingsModal";

export function FormsHeader() {
  return (
    <Suspense fallback={<header className="h-12" />}>
      <FormsHeaderContent />
    </Suspense>
  );
}

function FormsHeaderContent() {
  const [loading, isLoading] = React.useState(false);

  const router = useRouter();
  const { user, activeWorkspaceId } = useFeedbirdStore();
  const { createInitialForm } = useFormStore();
  const { activeForm, isEditing } = useForms();

  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);

  const handleInitialFormCreation = async () => {
    isLoading(true);
    try {
      if (!user || !activeWorkspaceId) {
        throw new Error("User or active workspace not found");
      }
      const newForm = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`/forms/${newForm.id}`);
    } catch (e) {
      console.error("Error creating initial form:", e);
      throw new Error("Error creating initial form"); //! TODO Check toasts
    } finally {
      isLoading(false);
    }
  };

  return (
    <>
      <header
        className="relative flex justify-between w-full items-between border-b border-border-primary pl-4 pr-2.5 py-2.5 gap-4 bg-white
    "
      >
        <div className="flex flex-row gap-2 items-center">
          <SidebarTrigger className="cursor-pointer shrink-0" />
          {isEditing && activeForm ? (
            <div className="flex flex-row items-center gap-1.5">
              <span className="text-[#5C5E63] text-sm font-normal">Form</span>
              <Image
                src="/images/forms/bar-gray.svg"
                alt="right_separator"
                width={12}
                height={12}
              />
              <span className="text-[#1C1D1F] font-medium text-base">
                {activeForm.title}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-lg tracking-[-0.6px] truncate max-w-[200px] text-[#1C1D1F]">
              Forms
            </span>
          )}
        </div>
        <div className="flex flex-row gap-4">
          <div className="flex flex-row gap-2">
            {isEditing && activeForm ? (
              <div className="flex flex-row gap-1.5">
                <Button
                  variant="ghost"
                  onClick={() => setSettingsModalOpen(true)}
                  className="p-1 aspect-square border-1 border-[#D3D3D3] rounded-[6px] hover:cursor-pointer"
                >
                  <Image
                    src="/images/forms/settings.svg"
                    alt="settings_icon"
                    width={18}
                    height={18}
                  />
                </Button>
                <Button
                  variant="ghost"
                  className="aspect-square border-1 border-[#D3D3D3] text-[#1C1D1F] flex flex-row gap-1 rounded-[6px] hover:cursor-pointer"
                >
                  <Image
                    src="/images/forms/play.svg"
                    alt="play_icon"
                    width={12}
                    height={12}
                  />
                  <span>Preview</span>
                </Button>
                <Button
                  onClick={() => setSettingsModalOpen(true)}
                  className="rounded-[4px] border-1 border-black/10 bg-[#4670F9] text-white font-medium text-sm hover:cursor-pointer"
                >
                  Publish
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="border border-border-button rounded-[6px] bg-main text-white px-[12px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium"
                onClick={handleInitialFormCreation}
              >
                {loading ? "Creating..." : "+ New Form"}
              </Button>
            )}
          </div>
          <UserButton afterSignOutUrl="/landing" />
        </div>
      </header>
      {activeForm && isEditing && (
        <FormSettingsModal
          open={settingsModalOpen}
          onClose={setSettingsModalOpen}
          form={activeForm}
        />
      )}
    </>
  );
}
