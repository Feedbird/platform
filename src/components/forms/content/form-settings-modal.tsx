import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { SetStateAction, Dispatch } from "react";
import { TableForm } from "./forms-table";
import { ModalMultiSelect } from "./modal-multi-select";
import { useFormStore } from "@/lib/store";
import { formsApi } from "@/lib/api/api-service";
import { toast } from "sonner";
import { nestedObjectEqual } from "@/lib/utils/transformers";

type FormSettingsModalProps = {
  open: boolean;
  setForm: Dispatch<SetStateAction<TableForm | null>>;
  form: TableForm;
  onClose: Dispatch<SetStateAction<boolean>>;
};

type FormSettingsOptions = {
  title: string;
  description: string;
  serviceIds: string[];
};

export default function FormSettingsModal({
  open,
  onClose,
  setForm,
  form,
}: FormSettingsModalProps) {
  const [loading, isLoading] = React.useState(false);

  const { services } = useFormStore();

  const initialSettings: FormSettingsOptions = {
    title: form?.title || "",
    description: form?.description || "",
    serviceIds: form?.services.map((s) => s.id.toString()) || [],
  };

  const [settings, setSettings] =
    React.useState<FormSettingsOptions>(initialSettings);
  const [hasChanged, setHasChanged] = React.useState(false);

  React.useEffect(() => {
    const changed = nestedObjectEqual(settings, initialSettings);
    setHasChanged(!changed);
  }, [settings]);

  React.useEffect(() => {
    if (form) {
      setSettings(initialSettings);
    }
  }, [form]);

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

  const handleSave = async () => {
    isLoading(true);
    try {
      const { data } = await formsApi.updateForm(form.id, {
        title: settings.title,
        description: settings.description,
        services: settings.serviceIds as any,
      });

      setForm(data);
      onClose(false);
      toast.success("Form updated successfully!");
    } catch (error) {
      toast.error("Failed to update form. Please try again.");
    } finally {
      isLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={open} modal={true}>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent
          className="w-[450px] p-4 rounded-[6px]"
          hideCloseButton={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Hidden element to receive initial focus instead of the input */}
          <div tabIndex={-1} className="sr-only" />

          <DialogTitle>
            <div className="flex flex-row items-center gap-3">
              <span className="text-[16px] font-semibold text-black">
                Form Settings
              </span>
            </div>
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-black font-medium text-[13px]">Title</span>
              <Input
                autoFocus
                disabled={loading}
                id="title"
                value={settings.title}
                className="text-black py-2 px-3 rounded-[6px]"
                onChange={handleTextChange}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-black font-medium text-[13px]">
                Choose Services
              </span>
              <ModalMultiSelect
                loadingParent={loading}
                options={services}
                selectedValues={settings.serviceIds}
                onSelectionChange={handleServicesChange}
                className="w-full"
                placeholder="Select services..."
                maxDisplayTags={2}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-black font-medium text-[13px]">
                Description
              </span>
              <Textarea
                disabled={loading}
                id="description"
                value={settings.description}
                className="text-black py-2 px-3 rounded-[6px]"
                onChange={handleTextChange}
              />
            </div>
          </div>
          <div className="flex flex-row-reverse justify-between">
            <Button
              disabled={loading || !hasChanged}
              variant="default"
              className="rounded-[6px] bg-[#4670F9] text-white text-[13px] font-medium hover:cursor-pointer"
              onClick={handleSave}
            >
              {loading && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
              )}
              Save
            </Button>
            <Button
              variant={"ghost"}
              className="rounded-[6px] border-1 border-[#D3D3D3] text-black text-[13px] font-medium hover:cursor-pointer"
              onClick={() => {
                onClose(false);
                setSettings(initialSettings);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
