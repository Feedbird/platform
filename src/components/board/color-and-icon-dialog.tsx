import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { IconAndColorPicker } from "@/components/board/icon-and-color-picker";
  import * as React from "react";
  
  interface ColorAndIconDialogProps {
    isOpen: boolean;  
    onClose: () => void;
    icon?: string;
    color?: string;
    onSave: (icon: string, color: string) => void;
  }
  
  export function ColorAndIconDialog({ isOpen, onClose, icon, color, onSave }: ColorAndIconDialogProps) {
    const [currentIcon, setCurrentIcon] = React.useState(icon);
    const [currentColor, setCurrentColor] = React.useState(color);
  
    React.useEffect(() => {
      if (isOpen) {
        setCurrentIcon(icon);
        setCurrentColor(color);
      }
    }, [isOpen, icon, color]);
  
    const handleSave = () => {
      onSave(currentIcon || '', currentColor || '');
      onClose();
    };
  
      return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[489px] bg-white text-black p-4">
        <DialogTitle className="sr-only">Edit Color & Icon</DialogTitle>
        
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-lg font-semibold text-black leading-none">Edit Color & Icon</DialogTitle>
            <DialogDescription className="text-[13px] text-[#75777C] leading-tight">
              Customize the appearance of your board with a unique icon and color.
            </DialogDescription>
          </div>

          {/* IconAndColorPicker Content */}
          <div className="flex flex-col gap-4">
            <IconAndColorPicker
              selectedIcon={currentIcon}
              onSelectIcon={setCurrentIcon}
              selectedColor={currentColor}
              onSelectColor={setCurrentColor}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between sm:justify-between items-center border-t pt-4">
          <Button 
            className="bg-white text-black cursor-pointer border border-[#D3D3D3]" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              className="bg-[#125AFF] text-white cursor-pointer" 
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  } 