'use client';
import React, { Suspense, useEffect } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore, useUserStore, useFormStore } from '@/lib/store';
import { useForms } from '@/contexts/FormsContext';
import Image from 'next/image';
import FormSettingsModal from './content/FormSettingsModal';
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import FormStatusBadge from './content/configs/FormStatusBadge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Input } from '../ui/input';
import { formsApi } from '@/lib/api/api-service';
import ConfirmationModal from './content/ConfirmationModal';

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
  const { user } = useUserStore();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { unsavedFormChanges } = useFormStore();
  const { createInitialForm } = useFormStore();
  const { activeForm, setActiveForm, isEditing, isPreview } = useForms();

  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [alertModalOpen, setAlertModalOpen] = React.useState(false);
  const [alertType, setAlertType] = React.useState<string>('');

  const [formLink, setFormLink] = React.useState(
    `${process.env.NEXT_PUBLIC_APP_URL}/${activeWorkspaceId}/form/${activeForm?.id}`
  );

  const handleInitialFormCreation = async () => {
    isLoading(true);
    try {
      if (!user || !activeWorkspaceId) {
        throw new Error('User or active workspace not found');
      }
      const newForm = await createInitialForm(user.email, activeWorkspaceId);
      router.push(`forms/${newForm.id}`);
    } catch (e) {
      toast.error('Error creating Form. Please try again later');
    } finally {
      isLoading(false);
    }
  };

  const [isDropDownOpen, setIsDropdownOpen] = React.useState(false);

  const handleFormPublish = async () => {
    isLoading(true);
    try {
      await formsApi.updateForm(activeForm!.id, { status: 'published' });
      toast.success('Form published successfully');
      setActiveForm({ ...activeForm!, status: 'published' });
      setIsDropdownOpen(false);
    } catch (e) {
      toast.error('Error publishing form. Please try again later');
    } finally {
      isLoading(false);
    }
  };

  React.useEffect(() => {
    setFormLink(
      `${process.env.NEXT_PUBLIC_APP_URL}/${activeWorkspaceId}/form/${activeForm?.id}`
    );
  }, [activeForm, activeWorkspaceId]);

  const handleFormUnpublish = async () => {
    isLoading(true);
    try {
      await formsApi.updateForm(activeForm!.id, { status: 'draft' });
      toast.success('Form unpublished successfully');
      setActiveForm({ ...activeForm!, status: 'draft' });
      setIsDropdownOpen(false);
    } catch (e) {
      toast.error('Error unpublishing form. Please try again later');
    } finally {
      isLoading(false);
    }
  };

  return (
    <>
      <header className="items-between border-border-primary relative flex h-12 w-full justify-between border-b bg-white px-3 py-2.5 2xl:py-2">
        <div className="flex flex-row items-center gap-2">
          <SidebarTrigger className="shrink-0 cursor-pointer" color="#838488" />
          {isEditing && activeForm ? (
            <div className="flex flex-row items-center gap-1.5">
              <span
                onClick={() => {
                  if (unsavedFormChanges) {
                    setAlertModalOpen(true);
                    setAlertType('navigate');
                  } else {
                    router.push(`/${activeWorkspaceId}/admin/forms`);
                  }
                }}
                className="cursor-pointer text-sm font-normal text-[#5C5E63]"
              >
                Forms
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
                    ? 'cursor-pointer text-sm font-normal text-[#5C5E63]'
                    : 'text-sm font-medium text-black'
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
                  <span className="text-sm font-medium text-black">
                    Preview
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="max-w-[200px] truncate text-base font-semibold tracking-[-0.6px] text-black">
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
                  className="aspect-square h-7 rounded-[4px] border-1 border-[#D3D3D3] p-1 hover:cursor-pointer"
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
                    className="flex h-7 w-[84px] flex-row gap-1 rounded-[4px] border-1 border-[#D3D3D3] text-black hover:cursor-pointer"
                  >
                    <Image
                      src="/images/forms/play.svg"
                      alt="play_icon"
                      width={12}
                      height={12}
                    />
                    <span className="text-[13px] font-medium">Preview</span>
                  </Button>
                )}
                <DropdownMenu
                  open={isDropDownOpen}
                  onOpenChange={(open) => setIsDropdownOpen(open)}
                >
                  <DropdownMenuTrigger
                    className={`flex w-[86px] rounded-[4px] border-1 border-black/10 ${
                      isDropDownOpen ? 'bg-gray-600' : 'bg-[#4670F9]'
                    } h-7 gap-0 p-0 text-[13px] font-medium text-white transition-colors hover:cursor-pointer hover:bg-gray-600`}
                  >
                    <p className="px-2.5 py-1">Publish</p>
                    <div className="flex h-full w-6 items-center justify-center border-l-1 border-black/10">
                      <ChevronDown
                        width={14}
                        height={14}
                        className={`transition-transform ${
                          isDropDownOpen ? 'rotate-180' : 'rotate-0'
                        } duration-150`}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent>
                      <div className="z-10 mt-1.5 mr-2 flex w-[340px] flex-col gap-2 rounded-[6px] border-1 border-[#D3D3D3] bg-white p-4 shadow-md">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-row items-center gap-2">
                            <span className="font-semibold text-black">
                              Publish form
                            </span>
                            {loading && (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/80 border-t-transparent"></div>
                            )}
                          </div>
                          <p className="text-sm font-normal text-[#838488]">
                            Publishing new changes to the sharable URL that will
                            publicly visible
                          </p>
                        </div>
                        <div className="relative">
                          <Input
                            className="rounded-[6px] border-1 border-[#D3D3D3] pr-16 text-black"
                            readOnly={true}
                            value={formLink.slice(0, 33) + '...'}
                          />
                          <div className="flex flex-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(formLink);
                                toast.success('Link copied to clipboard');
                              }}
                              className="absolute top-1/2 right-8 -translate-y-1/2 transform rounded p-1 hover:bg-gray-100"
                            >
                              <Copy width={14} height={14} />
                            </button>
                            <button
                              onClick={() => {
                                window.open(formLink, '_blank');
                              }}
                              className="absolute top-1/2 right-3 -translate-y-1/2 transform rounded p-1 hover:bg-gray-100"
                            >
                              <ExternalLink width={14} height={14} />
                            </button>
                          </div>
                        </div>
                        <Button
                          disabled={
                            activeForm.status === 'published' || loading
                          }
                          onClick={() => {
                            if (unsavedFormChanges) {
                              setIsDropdownOpen(false);
                              setAlertModalOpen(true);
                              setAlertType('publish');
                            } else {
                              handleFormPublish();
                            }
                          }}
                          className="mt-2 rounded-[4px] bg-[#4670F9] text-sm font-medium text-white hover:cursor-pointer"
                        >
                          Publish
                        </Button>
                        <Button
                          disabled={
                            activeForm.status !== 'published' || loading
                          }
                          variant="ghost"
                          onClick={handleFormUnpublish}
                          className="mt-1 rounded-[4px] border-1 border-[#D3D3D3] text-sm font-medium text-black hover:cursor-pointer"
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
                className="h-full w-[90px] cursor-pointer rounded-[4px] border-1 border-black/10 bg-[#4670F9] px-2.5 py-1.5 text-[13px] text-white"
                onClick={handleInitialFormCreation}
              >
                {loading ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  '+New Form'
                )}
              </Button>
            )}
          </div>
        </div>

        <ConfirmationModal
          open={alertModalOpen}
          title="You have unsaved changes"
          onClose={() => setAlertModalOpen(false)}
          message="If you publish this form, your changes will be lost. Are you sure you want to continue?"
          action={
            alertType === 'publish'
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
