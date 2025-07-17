import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";

interface RenameBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => void;
}

export function RenameBoardDialog({ isOpen, onClose, currentName, onRename }: RenameBoardDialogProps) {
  const [name, setName] = React.useState(currentName);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError("");
    }
  }, [currentName, isOpen]);

  const handleRename = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("Board name cannot be empty");
      return;
    }
    
    if (trimmedName === currentName) {
      onClose();
      return;
    }
    
    if (trimmedName.length > 50) {
      setError("Board name must be 50 characters or less");
      return;
    }
    
    onRename(trimmedName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[489px] bg-white text-black p-4">
        <DialogTitle className="sr-only">Rename Board</DialogTitle>
        
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-lg font-semibold text-black leading-none">Rename Board</DialogTitle>
            <DialogDescription className="text-[13px] text-[#75777C] leading-tight">
              Give your board a new name to better reflect its purpose.
            </DialogDescription>
          </div>

          {/* Input Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="board-name" className="text-sm font-medium text-black">
                Board name
              </label>
              <Input
                id="board-name"
                value={name}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter board name"
                className="px-3 py-2 flex gap-2 rounded-[6px] border border-[#D3D3D3] text-black font-medium text-sm placeholder:text-[#5C5E63]"
                style={{
                  boxShadow: "0px 1px 2px -1px rgba(7,10,22,0.02)",
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
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
              onClick={handleRename}
              disabled={!name.trim() || name.trim() === currentName}
            >
              Rename
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 