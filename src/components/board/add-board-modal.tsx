import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, MoreHorizontal, Smile } from "lucide-react";
import * as React from "react";
import { useWorkspaceStore, BoardTemplate, BoardRules } from "@/lib/store";
import { IconAndColorPicker } from "@/components/board/icon-and-color-picker";
import { RenameTemplateDialog } from "@/components/board/rename-template-dialog";
import { ColorAndIconDialog } from "@/components/board/color-and-icon-dialog";
import { cn } from '@/lib/utils';
import { WorkspaceStore } from "@/lib/store/workspace-store";

const BLANK_TEMPLATE: BoardTemplate = {
  id: "blank",
  name: "Blank",
  image: "/images/boards/templates/t0-blank.svg",
  description: "",
  color: "#F4F5F6",
};

interface AddBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardDataReady: (data: {
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  }) => void;
  onUseTemplate: (data: {
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  }) => void;
  pendingBoardData?: {
    name: string;
    description: string;
    icon: string | undefined;
    color: string | undefined;
    rules?: BoardRules;
  } | null;
}

export function AddBoardModal({ isOpen, onClose, onBoardDataReady, onUseTemplate, pendingBoardData }: AddBoardModalProps) {
  const boardTemplates = useWorkspaceStore((s: WorkspaceStore) => s.boardTemplates);
  const addBoard = useWorkspaceStore((s: WorkspaceStore) => s.addBoard);
  const removeBoardTemplate = useWorkspaceStore((s: WorkspaceStore) => s.removeBoardTemplate);
  const updateBoardTemplate = useWorkspaceStore((s: WorkspaceStore) => s.updateBoardTemplate);

  const [selectedTemplate, setSelectedTemplate] = React.useState<BoardTemplate>(BLANK_TEMPLATE);
  const [boardName, setBoardName] = React.useState("");
  const [boardDescription, setBoardDescription] = React.useState("");
  const [boardIcon, setBoardIcon] = React.useState<string | undefined>(undefined);
  const [boardColor, setBoardColor] = React.useState<string | undefined>("#FFFFFF");
  
  const [templatePopoverOpen, setTemplatePopoverOpen] = React.useState(false);
  const [iconPickerOpen, setIconPickerOpen] = React.useState(false);

  const [renameTarget, setRenameTarget] = React.useState<BoardTemplate | null>(null);
  const [colorIconTarget, setColorIconTarget] = React.useState<BoardTemplate | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [templatePopoverOpen]); // Re-measure if popover opens, in case of layout shifts

  React.useEffect(() => {
    if (isOpen) {
      if (pendingBoardData) {
        // Restore form state from pending data
        setBoardName(pendingBoardData.name);
        setBoardDescription(pendingBoardData.description);
        setBoardIcon(pendingBoardData.icon);
        setBoardColor(pendingBoardData.color || "#FFFFFF");
        // Keep the selected template as is, or you could determine it based on the icon
      } else {
        // Reset to default values
        setSelectedTemplate(BLANK_TEMPLATE);
        setBoardName("");
        setBoardDescription("");
        setBoardIcon(undefined);
        setBoardColor("#F4F5F6");
      }
    }
  }, [isOpen, pendingBoardData]);

  const handleSelectTemplate = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    setBoardName(template.id === 'blank' ? '' : template.name);
    setBoardDescription(template.description ?? "");
    setBoardIcon(template.image);
    setBoardColor(template.color || "#F4F5F6");
    setTemplatePopoverOpen(false);
  };

  const handleCreateBoard = React.useCallback(() => {
    if (!boardName.trim()) {
      alert("Board name is required.");
      return;
    }
    onBoardDataReady({
      name: boardName,
      description: boardDescription,
      icon: boardIcon,
      color: boardColor,
      rules: selectedTemplate.rules,
    });
  }, [boardName, boardDescription, boardIcon, boardColor, selectedTemplate.rules, onBoardDataReady]);

  const handleUseTemplate = React.useCallback(() => {
    if (!boardName.trim()) {
      alert("Board name is required.");
      return;
    }
    onUseTemplate({
      name: boardName,
      description: boardDescription,
      icon: boardIcon,
      color: boardColor,
      rules: selectedTemplate.rules,
    });
  }, [boardName, boardDescription, boardIcon, boardColor, selectedTemplate.rules, onUseTemplate]);

  const handleRenameTemplate = (newName: string) => {
    if (renameTarget) {
      updateBoardTemplate(renameTarget.id, { name: newName });
    }
  };

  const handleUpdateColorAndIcon = (icon: string, color: string) => {
    if (colorIconTarget) {
      updateBoardTemplate(colorIconTarget.id, { image: icon, color: color });
    }
  };

  const IconDisplay = (
    boardIcon ? 
    <div className="w-4.5 h-4.5 rounded-[3px] p-[3px] flex items-center justify-center"style={{
      backgroundColor: boardColor ? boardColor : 'transparent',
    }}>
      <img src={boardIcon} alt="Board Icon" 
    className="w-3 h-3"
    /> </div> : <Smile className="w-3 h-3 text-black" />
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-white text-black p-4">
          <DialogTitle className="sr-only">Tell us more about the board</DialogTitle>
          <h2 className="font-semibold text-black text-lg leading-[18px]">Tell us more about the board</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-black">Template</p>
              <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button ref={triggerRef} variant="outline" className="flex w-full items-center justify-between gap-2 border border-[#D3D3D3] bg-white rounded-[6px] cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      padding: "4px 12px 4px 4px",
                    }}>
                    <span className="flex items-center gap-2">
                      {selectedTemplate.image && (
                        <div
                          className="flex w-7 h-7 justify-center items-center rounded-[4px]"
                          style={{ backgroundColor: selectedTemplate.color || '#F4F5F6' }}
                        >
                          <img src={selectedTemplate.image} className="w-4 h-4" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-black">{selectedTemplate.name}</span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#5C5E63]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="px-1 pt-3 pb-1 space-y-2" style={{ width: `${triggerWidth}px`}}>
                  <p className="pl-1.5 text-[10px] text-[#75777C] font-semibold">START FROM SCRATCH</p>
                  <div
                    className="flex items-center gap-2 px-3 pr-3 pl-1 py-1 hover:bg-[#F4F5F6] cursor-pointer rounded-md bg-white transition-colors"
                    onClick={() => handleSelectTemplate(BLANK_TEMPLATE)}
                  >
                    <div className="flex w-7 h-7 justify-center items-center rounded-[4px] bg-[#F4F5F6]">
                      <img src="/images/boards/templates/t0-blank.svg" className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-black">Blank</span>
                  </div>
                  <p className="pl-1.5 text-[10px] text-[#75777C] font-semibold">SAVED TEMPLATE</p>
                  <div className="max-h-60 overflow-y-auto pr-1">
                    {boardTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between gap-2 px-3 pr-3 pl-1 py-1 hover:bg-[#F4F5F6] cursor-pointer group rounded-md bg-white transition-colors" onClick={() => handleSelectTemplate(template)}>
                        <div className="flex items-center gap-2 flex-1">
                          {template.image && (
                            <div
                              className="flex w-7 h-7 justify-center items-center rounded-[4px]"
                              style={{ backgroundColor: template.color || '#F4F5F6' }}
                            >
                              <img src={template.image} className="w-4 h-4" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-black">{template.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-gray-200 rounded transition-all" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            onClick={(e) => e.stopPropagation()}
                            className="w-40 h-24 border-0 py-1 px-0 bg-white/95 rounded-md shadow-[0px_24px_24px_-12px_rgba(0,0,0,0.04)] shadow-[0px_12px_12px_-6px_rgba(0,0,0,0.04)] shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.06)] shadow-[0px_3px_3px_-1.5px_rgba(0,0,0,0.06)] shadow-[0px_1px_1px_-0.5px_rgba(0,0,0,0.06)] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06)] backdrop-blur-sm inline-flex flex-col justify-start items-start overflow-hidden"
                          >
                            <div className="self-stretch flex flex-col justify-center items-center gap-0.5">
                              <div className="self-stretch flex flex-col justify-start items-start">
                                <div className="self-stretch px-1 inline-flex justify-start items-center">
                                  <DropdownMenuItem 
                                    onClick={() => setRenameTarget(template)} 
                                    className="flex-1 px-2.5 py-1.5 rounded-md flex justify-start items-center gap-3 cursor-pointer hover:bg-[#F4F5F6] transition-colors"
                                  >
                                    <div className="flex-1 flex h-4 justify-start items-center gap-2">
                                      <div className="w-3.5 h-3.5 relative overflow-hidden">
                                        <img src="/images/boards/rename.svg" className="width={14} height={14}" alt="rename" />
                                      </div>
                                      <div className="flex-1 h-4 justify-start content-center text-black text-xs leading-none" style={{ fontSize: 13 }}>
                                        Rename
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                </div>
                                <div className="self-stretch px-1 inline-flex justify-start items-center">
                                  <DropdownMenuItem 
                                    onClick={() => setColorIconTarget(template)} 
                                    className="flex-1 px-2.5 py-1.5 rounded-md flex justify-start items-center gap-3 cursor-pointer hover:bg-[#F4F5F6] transition-colors"
                                  >
                                    <div className="flex-1 flex h-4 justify-start items-center gap-2">
                                      <div className="w-3.5 h-3.5 relative overflow-hidden">
                                        <img src="/images/boards/color-and-icon.svg" className="width={14} height={14}" alt="color-icon" />
                                      </div>
                                      <div className="flex-1 justify-start text-black text-xs leading-none" style={{ fontSize: 13 }}>
                                        Color & Icon
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                </div>
                              </div>
                              <div className="w-33 h-0 outline outline-1 outline-offset-[-0.50px] outline-gray-200"></div>
                              <div className="self-stretch flex flex-col justify-start items-start">
                                <div className="self-stretch px-1 inline-flex justify-start items-center">
                                  <DropdownMenuItem 
                                    onClick={() => removeBoardTemplate(template.id)} 
                                    className="flex-1 px-2.5 py-1.5 rounded-md flex justify-start items-center gap-3 cursor-pointer hover:bg-[#F4F5F6] transition-colors"
                                  >
                                    <div className="flex-1 flex h-4 justify-start items-center gap-2">
                                      <div className="w-3.5 h-3.5 relative overflow-hidden">
                                        <img src="/images/boards/delete.svg" className="width={14} height={14}" alt="delete" />
                                      </div>
                                      <div className="flex-1 justify-start text-black text-xs leading-none" style={{ fontSize: 13 }}>
                                        Delete
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-black">Icon & Name</p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                    <PopoverTrigger asChild>
                        <button className="focus:outline-none rounded-[6px] flex items-center justify-center w-9 h-9 hover:bg-gray-50 transition-colors cursor-pointer" style={{
                          boxShadow: "0px 1px 2px -1px rgba(7,10,22,0.02)",
                          border: "1px solid #D3D3D3",
                          background: "#FFFFFF",
                        }}>
                            {IconDisplay}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-60" side="right" align="center">
                        <IconAndColorPicker
                            selectedIcon={boardIcon}
                            onSelectIcon={setBoardIcon}
                            selectedColor={boardColor}
                            onSelectColor={setBoardColor}
                        />
                    </PopoverContent>
                </Popover>
                <Input placeholder="e.g. Marketing, Design, HR" value={boardName} onChange={(e) => setBoardName(e.target.value)} className="px-3 py-2 flex gap-2 rounded-[6px] border border-[#D3D3D3] text-black font-medium text-sm placeholder:text-[#5C5E63]" style={{
                  boxShadow: "0px 1px 2px -1px rgba(7,10,22,0.02)",
                }} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-black">Description <span className="font-normal text-[#838488]">(Optional)</span></p>
              <Textarea placeholder="" value={boardDescription} onChange={(e) => setBoardDescription(e.target.value)} className="px-3 py-2 gap-2 rounded-[6px] border border-[#D3D3D3] text-black font-medium text-sm placeholder:text-[#5C5E63]" style={{
                boxShadow: "0px 1px 2px -1px rgba(7,10,22,0.02)",
              }} />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between items-center">
            <Button variant="tertiary" onClick={onClose}>Back</Button>
            <div className="flex gap-2">
              {
                selectedTemplate.id === 'blank' ? (
                  <Button variant="disabled">
                    Use template
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={handleUseTemplate}>
                    Use template
                  </Button>
                )
              }
              <Button variant="primary" onClick={handleCreateBoard}>
                Next
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <RenameTemplateDialog
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        currentName={renameTarget?.name ?? ''}
        onRename={handleRenameTemplate}
      />

      <ColorAndIconDialog
        isOpen={!!colorIconTarget}
        onClose={() => setColorIconTarget(null)}
        icon={colorIconTarget?.image}
        color={colorIconTarget?.color}
        onSave={handleUpdateColorAndIcon}
      />
    </>
  );
} 