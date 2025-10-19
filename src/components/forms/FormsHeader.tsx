"use client";
import React, { Suspense, useEffect } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { useFormStore } from "@/lib/store/forms-store";
import { useForms } from "@/contexts/FormsContext";
import Image from "next/image";
import FormSettingsModal from "./content/FormSettingsModal";
import { ChevronDown, ChevronRight } from "lucide-react";
import FormStatusBadge from "./content/configs/FormStatusBadge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { Input } from "../ui/input";
import { formsApi } from "@/lib/api/api-service";
import ConfirmationModal from "./content/ConfirmationModal";

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
  const { user, activeWorkspaceId, unsavedFormChanges } = useFeedbirdStore();
  const { createInitialForm } = useFormStore();
  const { activeForm, setActiveForm, isEditing, isPreview } = useForms();

  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [alertModalOpen, setAlertModalOpen] = React.useState(false);
  const [alertType, setAlertType] = React.useState<string>("");

  const [formLink, setFormLink] = React.useState(
    "https://nazmijavier.feedbird.com/form/a59b8a7c-2a8f-473a-aea0-648170827cff"
  );

  const handleInitialFormCreation = async () => {
    isLoading(true);
    try {
      if (!user || !activeWorkspaceId) {
        throw new Error("User or active workspace not found");
      }
      const newForm = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`forms/${newForm.id}`);
    } catch (e) {
      toast.error("Error creating Form. Please try again later");
    } finally {
      isLoading(false);
    }
  };

  const [isDropDownOpen, setIsDropdownOpen] = React.useState(false);

  const handleFormPublish = async () => {
    isLoading(true);
    try {
      await formsApi.updateForm(activeForm!.id, { status: "published" });
      toast.success("Form published successfully");
      setActiveForm({ ...activeForm!, status: "published" });
      setIsDropdownOpen(false);
    } catch (e) {
      toast.error("Error publishing form. Please try again later");
    } finally {
      isLoading(false);
    }
  };

  const handleFormUnpublish = async () => {
    isLoading(true);
    try {
      await formsApi.updateForm(activeForm!.id, { status: "draft" });
      toast.success("Form unpublished successfully");
      setActiveForm({ ...activeForm!, status: "draft" });
      setIsDropdownOpen(false);
    } catch (e) {
      toast.error("Error unpublishing form. Please try again later");
    } finally {
      isLoading(false);
    }
  };

  return (
    <>
      <header
        className="relative flex justify-between w-full items-between border-b h-12 border-border-primary px-3 py-2.5 2xl:py-2 bg-white
    "
      >
        <div className="flex flex-row gap-2 items-center">
          <SidebarTrigger className="cursor-pointer shrink-0" color="#838488" />
          {isEditing && activeForm ? (
            <div className="flex flex-row items-center gap-1.5">
              <span
                onClick={() => {
                  if (unsavedFormChanges) {
                    setAlertModalOpen(true);
                    setAlertType("navigate");
                  } else {
                    router.push(`/${activeWorkspaceId}/admin/forms`);
                  }
                }}
                className="text-[#5C5E63] text-sm font-normal cursor-pointer"
              >
                Form
              </span>
              <ChevronRight width={12} height={12} color="#838488" />
              <span
                onClick={() => {
                  if (isPreview)
                    router.push(
                      `/${activeWorkspaceId}/admin/forms/${activeForm.id}`
                    );
                }}
                className={`${
                  isPreview
                    ? "text-[#5C5E63] text-sm font-normal cursor-pointer"
                    : "text-black font-medium text-sm"
                }`}
              >
                {activeForm.title}
              </span>
              {!isPreview && (
                <div className="ml-1">
                  <FormStatusBadge status={activeForm.status} />
                </div>
              )}
              {isPreview && (
                <>
                  <ChevronRight width={12} height={12} color="#838488" />
                  <span className="text-black font-medium text-sm">
                    Preview
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="font-semibold text-base tracking-[-0.6px] truncate max-w-[200px] text-black">
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
                  className="p-1 aspect-square border-1 border-[#D3D3D3] rounded-[4px] hover:cursor-pointer h-7"
                >
                  <Image
                    src="/images/forms/settings.svg"
                    alt="settings_icon"
                    width={16}
                    height={16}
                  />
                </Button>
                {!isPreview && (
                  <Button
                    onClick={() => router.push(`${activeForm.id}/preview`)}
                    variant="ghost"
                    className="border-1 w-[84px] border-[#D3D3D3] text-black flex flex-row gap-1 rounded-[4px] hover:cursor-pointer h-7"
                  >
                    <Image
                      src="/images/forms/play.svg"
                      alt="play_icon"
                      width={12}
                      height={12}
                    />
                    <span className="font-medium text-[13px]">Preview</span>
                  </Button>
                )}
                <DropdownMenu
                  open={isDropDownOpen}
                  onOpenChange={(open) => setIsDropdownOpen(open)}
                >
                  <DropdownMenuTrigger
                    className={`flex rounded-[4px] w-[86px] border-1 border-black/10 ${
                      isDropDownOpen ? "bg-gray-600" : "bg-[#4670F9]"
                    } text-white font-medium h-7 text-[13px] hover:cursor-pointer transition-colors hover:bg-gray-600 p-0 gap-0`}
                  >
                    <p className="px-2.5 py-1">Publish</p>
                    <div className="h-full w-6 border-l-1 border-black/10 flex items-center justify-center">
                      <ChevronDown
                        width={14}
                        height={14}
                        className={`transition-transform ${
                          isDropDownOpen ? "rotate-180" : "rotate-0"
                        } duration-150`}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent>
                      <div className="bg-white w-[340px] flex flex-col gap-2 mt-1.5 mr-2 shadow-md z-10 border-1 border-[#D3D3D3] rounded-[6px] p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-row gap-2 items-center">
                            <span className="font-semibold text-black">
                              Publish form
                            </span>
                            {loading && (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black/80 border-t-transparent"></div>
                            )}
                          </div>
                          <p className="font-normal text-[#838488] text-sm">
                            Publishing new changes to the sharable URL that will
                            publicly visible
                          </p>
                        </div>
                        <Input
                          className="border-1 border-[#D3D3D3] rounded-[6px] text-black"
                          onChange={(e) => setFormLink(e.target.value)}
                          value={formLink}
                        />
                        <Button
                          disabled={
                            activeForm.status === "published" || loading
                          }
                          onClick={() => {
                            if (unsavedFormChanges) {
                              setIsDropdownOpen(false);
                              setAlertModalOpen(true);
                              setAlertType("publish");
                            } else {
                              handleFormPublish();
                            }
                          }}
                          className="bg-[#4670F9] mt-2 rounded-[4px] text-white font-medium text-sm hover:cursor-pointer"
                        >
                          Publish
                        </Button>
                        <Button
                          disabled={
                            activeForm.status !== "published" || loading
                          }
                          variant="ghost"
                          onClick={handleFormUnpublish}
                          className="mt-1 rounded-[4px] border-[#D3D3D3] border-1 font-medium text-sm hover:cursor-pointer text-black"
                        >
                          <Image
                            src="/images/forms/unlink.svg"
                            alt="unlink_icon"
                            width={14}
                            height={14}
                          />
                          Unpublish
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-[90px] h-full border-1 border-black/10 rounded-[4px] bg-[#4670F9] text-white cursor-pointer text-[13px] py-1.5 px-2.5"
                onClick={handleInitialFormCreation}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                ) : (
                  "+New Form"
                )}
              </Button>
            )}
          </div>
          <UserButton afterSignOutUrl="/landing" />
        </div>

        <ConfirmationModal
          open={alertModalOpen}
          title="You have unsaved changes"
          onClose={() => setAlertModalOpen(false)}
          message="If you publish this form, your changes will be lost. Are you sure you want to continue?"
          action={
            alertType === "publish"
              ? handleFormPublish
              : () => router.push(`/${activeWorkspaceId}/admin/forms`)
          }
        />
      </header>
      {activeForm && isEditing && (
        <FormSettingsModal
          setForm={setActiveForm}
          open={settingsModalOpen}
          onClose={setSettingsModalOpen}
          form={activeForm}
        />
      )}
    </>
  );
}
