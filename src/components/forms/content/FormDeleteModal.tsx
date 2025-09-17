import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formsApi } from "@/lib/api/api-service";
import Image from "next/image";
import React, { SetStateAction, Dispatch, useEffect } from "react";
import { TableForm } from "./forms-table";
import { toast } from "sonner";

type FormDeleteModal = {
  open: boolean;
  formId: string;
  onClose: Dispatch<SetStateAction<boolean>>;
  setForms: Dispatch<SetStateAction<TableForm[]>>;
};

export default function FormDeleteModal({
  open,
  onClose,
  formId,
  setForms,
}: FormDeleteModal) {
  const [loading, isLoading] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<string>("");

  const handleConfirmationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmation(e.target.value);
  };

  const handleFormDeletion = async () => {
    isLoading(true);
    try {
      await formsApi.deleteForm(formId);
      setForms((prevForms) => prevForms.filter((form) => form.id !== formId));
      onClose(false);
      setConfirmation("");
    } catch (e) {
      toast.error("Error deleting form. Please try again later.");
    } finally {
      isLoading(false);
    }
  };

  useEffect(() => {
    return setConfirmation("");
  }, []);

  return (
    <Dialog onOpenChange={onClose} open={open} modal={true}>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent
          className="w-[420px] p-4 rounded-[6px]"
          hideCloseButton={true}
        >
          <DialogTitle>
            <div className="flex flex-row items-center gap-3">
              <Image
                src="/images/forms/delete-red.svg"
                alt="delete_icon"
                width={18}
                height={18}
              />
              <span className="text-[16px] font-semibold text-[#1C1D1F]">
                Delete Form
              </span>
            </div>
          </DialogTitle>
          <div className="flex flex-col gap-4">
            <p className="font-normal text-[#5C5E63] text-[13px]">
              This action cannot be undone. This will permanently delete your
              Form.
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-[#1C1D1F] text-[13px] font-medium">
                Enter the word "Delete" to confirm
              </span>
              <Input
                className="py-2 px-3 rounded-[6px] border-1 border-[#D3D3D3]"
                value={confirmation}
                onChange={handleConfirmationInput}
              />
            </div>
          </div>
          <div className="flex flex-row justify-between">
            <Button
              onClick={handleFormDeletion}
              className="rounded-[6px] bg-[#EC5050] text-white text-[13px] font-medium hover:cursor-pointer"
              disabled={confirmation !== "Delete" || loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
            <Button
              className="rounded-[5px] bg-[#F4F5F6] text-[#1C1D1F] text-[13px] font-medium hover:cursor-pointer"
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
