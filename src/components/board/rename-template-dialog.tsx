import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";

interface RenameTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => void;
}

export function RenameTemplateDialog({ isOpen, onClose, currentName, onRename }: RenameTemplateDialogProps) {
  const [name, setName] = React.useState(currentName);

  React.useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [currentName, isOpen]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim());
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Template</DialogTitle>
        </DialogHeader>
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 