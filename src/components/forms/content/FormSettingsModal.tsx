import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formsApi } from "@/lib/api/api-service";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import React, { SetStateAction, Dispatch } from "react";
import { TableForm } from "./forms-table";
import { ServicesMultiSelect } from "@/components/forms/ServicesMultiSelect";

type FormSettingsModalProps = {
  open: boolean;
  form: TableForm;
  onClose: Dispatch<SetStateAction<boolean>>;
  setForms: Dispatch<SetStateAction<TableForm[]>>;
};

type FormSettingsOptions = {
  title: string;
  description: string;
  serviceIds: string[];
};

export default function FormSettingsModal({
  open,
  onClose,
  form,
  setForms,
}: FormSettingsModalProps) {
  const [loading, isLoading] = React.useState(false);
  const { getActiveWorkspace } = useFeedbirdStore();
  const [settings, setSettings] = React.useState<FormSettingsOptions>({
    title: form?.title || "",
    description: form?.description || "",
    serviceIds: form?.services.map((s) => s.id.toString()) || [],
  });

  // Don't render if no form is provided
  if (!form) {
    return null;
  }

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleServicesChange = (selectedIds: string[]) => {
    setSettings((prev) => ({
      ...prev,
      serviceIds: selectedIds,
    }));
  };

  return (
    <Dialog onOpenChange={onClose} open={open} modal={true}>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent
          className="w-[420px] p-4 rounded-[6px]"
          hideCloseButton={true}
        >
          <DialogTitle>
            <div className="flex flex-row items-center gap-3">
              <span className="text-[16px] font-semibold text-[#1C1D1F]">
                Form Settings
              </span>
            </div>
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[#1C1D1F] font-medium text-[13px]">
                Title
              </span>
              <Input
                id="title"
                value={settings.title}
                className="text-[#1C1D1F] py-2 px-3 rounded-[6px] selection:bg-transparent"
                onChange={handleTextChange}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#1C1D1F] font-medium text-[13px]">
                Choose Services
              </span>
              <ServicesMultiSelect
                workspaceId={getActiveWorkspace()?.id || "1"}
                selectedServices={settings.serviceIds}
                onSelectionChange={handleServicesChange}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#1C1D1F] font-medium text-[13px]">
                Description
              </span>
              <Textarea
                id="description"
                value={settings.description}
                className="text-[#1C1D1F] py-2 px-3 rounded-[6px]"
                onChange={handleTextChange}
              />
            </div>
          </div>
          <div className="flex flex-row-reverse justify-between">
            <Button className="py-1.5 px-4 rounded-[6px] bg-[#4670F9] text-white text-[13px] font-medium hover:cursor-pointer">
              Save
            </Button>
            <Button
              className="py-1.5 px-4 rounded-[6px] border-1 border-[#D3D3D3] bg-transparent text-[#1C1D1F] text-[13px] font-medium hover:cursor-pointer"
              onClick={() => onClose(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
