import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverPortal } from "@radix-ui/react-popover";
import Image from "next/image";
import React from "react";
import { TableForm } from "./forms-table";
import { Row } from "@tanstack/table-core";
import { formsApi } from "@/lib/api/api-service";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForms } from "@/contexts/FormsContext";

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
  action: "duplicate" | null;
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
    isLoading({ isLoading: true, action: "duplicate" });
    try {
      const { data } = await formsApi.duplicateForm(row.original.id);
      setTableData((prev) => [...prev, data as TableForm]);
      toast.success("Form duplicated");
    } catch (e) {
      toast.error(
        (e as Error).message || "An error occurred while duplicating the form."
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
          className="hover:bg-gray-100 rounded transition-colors hover:cursor-pointer min-w-4"
        >
          <Image
            src="/images/forms/actions.svg"
            alt="actions_icon"
            width={16}
            height={16}
          />
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent className="mr-6 rounded-sm border-1 border-border-primary p-2 flex flex-col font-medium text-sm text-black gap-0.5 max-w-[130px] relative">
            {loading.isLoading && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-black/10 absolute w-full h-full rounded-sm top-0 left-0 z-20"
              ></div>
            )}
            <button
              className="flex flex-row items-center w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setActiveForm(row.original);
                router.push(
                  `/${activeWorkspaceId}/admin/forms/${row.original.id}/submissions`
                );
              }}
            >
              <Send width={14} height={14} color="#9099A6" />
              <span>Submissions</span>
            </button>
            <button
              className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsModalOpen(true);
              }}
            >
              <Image
                src="/images/boards/settings.svg"
                alt="settings_icon"
                width={14}
                height={14}
              />
              <span>Settings</span>
            </button>
            <button
              className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleFormDuplication();
              }}
              disabled={loading.action === "duplicate"}
            >
              {loading.isLoading && loading.action === "duplicate" ? (
                <div className="animate-spin rounded-full self-center h-5 w-5 border-2 border-buttonStroke border-t-transparent"></div>
              ) : (
                <>
                  <Image
                    src="/images/boards/duplicate.svg"
                    alt="duplicate_icon"
                    width={14}
                    height={14}
                  />
                  <span>Duplicate</span>
                </>
              )}
            </button>
            <button
              className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_APP_URL}/${activeWorkspaceId}/form/${row.original.id}`
                );
                toast.success("Form link copied to clipboard");
                isOpen(false);
              }}
            >
              <Image
                src="/images/boards/share.svg"
                alt="share_icon"
                width={14}
                height={14}
              />
              <span>Share</span>
            </button>
            <button
              className="flex flex-row w-full gap-2 p-1 hover:bg-gray-100 rounded-xs transition-colors hover:cursor-pointer active:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModalOpen(true);
              }}
            >
              <Image
                src="/images/boards/delete.svg"
                alt="delete_icon"
                width={14}
                height={14}
              />
              <span>Delete</span>
            </button>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  );
}
