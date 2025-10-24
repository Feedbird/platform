import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PopoverPortal } from '@radix-ui/react-popover';
import Image from 'next/image';
import React from 'react';
import { TableForm } from './forms-table';
import { Row } from '@tanstack/table-core';
import { formsApi } from '@/lib/api/api-service';
import { toast } from 'sonner';
import { useWorkspaceStore } from '@/lib/store';
import { Ellipsis, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForms } from '@/contexts/FormsContext';

type Props = {
  setLocalActiveForm: React.Dispatch<React.SetStateAction<TableForm | null>>;
  setSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setTableData: React.Dispatch<React.SetStateAction<TableForm[]>>;
  tabledData: TableForm[];
  row: Row<TableForm>;
};

type LoadingPopover = {
  isLoading: boolean;
  action: 'duplicate' | null;
};

export default function FormTableContextMenu({
  setLocalActiveForm,
  setSettingsModalOpen,
  setTableData,
  setDeleteModalOpen,
  tabledData,
  row,
}: Props) {
  const [loading, isLoading] = React.useState<LoadingPopover>({
    isLoading: false,
    action: null,
  });
  const [open, isOpen] = React.useState(false);
  const { activeWorkspaceId } = useWorkspaceStore();
  const { setActiveForm } = useForms();

  const router = useRouter();

  const handleFormDuplication = async () => {
    isLoading({ isLoading: true, action: 'duplicate' });
    try {
      const { data } = await formsApi.duplicateForm(row.original.id);
      setTableData((prev) => [...prev, data as TableForm]);
      toast.success('Form duplicated');
    } catch (e) {
      toast.error(
        (e as Error).message || 'An error occurred while duplicating the form.'
      );
    } finally {
      isOpen(false);
      isLoading({ isLoading: false, action: null });
    }
  };
  return (
    <div className="flex items-center justify-center">
      <Popover onOpenChange={isOpen} open={open}>
        <PopoverTrigger
          onClick={(e) => {
            e.stopPropagation();
            isOpen(true);
            setLocalActiveForm(
              tabledData.find((f) => f.id === row.original.id) ?? tabledData[0]
            );
          }}
          className="border-buttonStroke min-w-4 rounded-[6px] border-1 p-1 transition-colors hover:cursor-pointer hover:bg-gray-100"
        >
          <Ellipsis size={14} />
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent className="border-border-primary relative mr-6 flex max-w-[130px] min-w-24 flex-col gap-0.5 rounded-sm border-1 p-2 text-[13px] font-medium text-black">
            {loading.isLoading && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 left-0 z-20 h-full w-full rounded-sm bg-black/10"
              ></div>
            )}
            <button
              className="flex w-full flex-row items-center gap-2 rounded-xs p-1 transition-colors hover:cursor-pointer hover:bg-gray-100 active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setActiveForm(row.original);
                router.push(
                  `/${activeWorkspaceId}/admin/forms/${row.original.id}/submissions`
                );
              }}
            >
              <span>Submissions</span>
            </button>
            <button
              className="flex w-full flex-row gap-2 rounded-xs p-1 transition-colors hover:cursor-pointer hover:bg-gray-100 active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsModalOpen(true);
              }}
            >
              <span>Settings</span>
            </button>
            <button
              className="flex w-full flex-row gap-2 rounded-xs p-1 transition-colors hover:cursor-pointer hover:bg-gray-100 active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleFormDuplication();
              }}
              disabled={loading.action === 'duplicate'}
            >
              {loading.isLoading && loading.action === 'duplicate' ? (
                <div className="border-buttonStroke h-5 w-5 animate-spin self-center rounded-full border-2 border-t-transparent"></div>
              ) : (
                <>
                  <span>Duplicate</span>
                </>
              )}
            </button>
            <button
              className="flex w-full flex-row gap-2 rounded-xs p-1 transition-colors hover:cursor-pointer hover:bg-gray-100 active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_APP_URL}/${activeWorkspaceId}/form/${row.original.id}`
                );
                toast.success('Form link copied to clipboard');
                isOpen(false);
              }}
            >
              <span>Share</span>
            </button>
            <button
              className="flex w-full flex-row gap-2 rounded-xs p-1 transition-colors hover:cursor-pointer hover:bg-gray-100 active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModalOpen(true);
              }}
            >
              <span>Delete</span>
            </button>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  );
}
