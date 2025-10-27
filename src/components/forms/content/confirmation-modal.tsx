import React, { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  message: string;
  open: boolean;
  onClose: () => void;
  action: (...args: any[]) => void | Promise<void>;
};

export default function ConfirmationModal({
  message,
  action,
  title,
  open,
  onClose,
}: Props) {
  const [loading, isLoading] = React.useState(false);

  const handleAction = async () => {
    isLoading(true);
    await action();
    isLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent
          className="w-[450px] p-4 rounded-[6px]"
          hideCloseButton={true}
        >
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {/* Hidden element to receive initial focus instead of the input */}
          <div tabIndex={-1} className="sr-only" />
          <div className="text-sm">{message}</div>
          <div className="flex flex-row justify-between pt-2">
            <Button
              variant="outline"
              className="rounded-[6px] cursor-pointer"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleAction}
              className="rounded-[6px] text-white bg-[#4670F9] cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  );
}
