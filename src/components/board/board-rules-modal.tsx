import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageIcon, X, Rows4, Rows3, Rows2, RectangleHorizontal, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarIcon, FolderOpen, Columns2, ChevronDown, ChevronUp, ListPlus, Film, EditIcon } from "lucide-react";

const GROUP_OPTIONS = [
    {
      id: "status",
      label: "Status",
      icon: <FolderOpen className="mr-1 h-3 w-3" />,
    },
    {
      id: "month",
      label: "Month",
      icon: <CalendarIcon className="mr-1 h-3 w-3" />,
    },
    {
      id: "platforms",
      label: "Socials",
      icon: <ListPlus className="mr-1 h-3 w-3" />,
    },
    {
      id: "format",
      label: "Format",
      icon: <Film className="mr-1 h-3 w-3" />,
    },
  ] as const;

const SORT_OPTIONS = [
    {
      id: "status",
      label: "Status",
      icon: <FolderOpen className="mr-1 h-3 w-3" />,
    },
    {
      id: "caption",
      label: "Caption",
      icon: <EditIcon className="mr-1 h-3 w-3" />,
    },
    {
      id: "platforms",
      label: "Socials",
      icon: <ListPlus className="mr-1 h-3 w-3" />,
    },
    {
      id: "format",
      label: "Format",
      icon: <Film className="mr-1 h-3 w-3" />,
    },
    {
      id: "month",
      label: "Month",
      icon: <CalendarIcon className="mr-1 h-3 w-3" />,
    },
    {
      id: "publishDate",
      label: "Post Time",
      icon: <CalendarIcon className="mr-1 h-3 w-3" />,
    },
    {
      id: "updatedAt",
      label: "Updated At",
      icon: <CalendarIcon className="mr-1 h-3 w-3" />,
    },
] as const;

const possibleHeights = [
  {
    value: 40,
    label: "Small",
    icon: <Rows4 fontSize="small"/>,
  },
  {
    value: 60,
    label: "Medium",
    icon: <Rows3 fontSize="small"/>,
  },
  {
    value: 90,
    label: "Large",
    icon: <Rows2 fontSize="small"/>,
  },
  {
    value: 130,
    label: "X-Large",
    icon: <RectangleHorizontal fontSize="small"/>,
  },
  {
    value: 160,
    label: "XX-Large",
    icon: <Maximize2 fontSize="small"/>,
  },
];

export interface BoardRules {
  autoSchedule: boolean;
  revisionRules: boolean;
  approvalDeadline: boolean;
  groupBy: string | null;
  sortBy: string | null;
  rowHeight: number;
  firstMonth?: number;
  ongoingMonth?: number;
  approvalDays?: number; // 7,14,30,60,custom
  approvalCustom?: string;
}

interface BoardRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void; // New prop for going back to add-board-modal
  onSave: (rules: BoardRules) => void;
  initialRules?: Partial<BoardRules>;
}

export function BoardRulesModal({ 
  isOpen, 
  onClose, 
  onBack,
  onSave, 
  initialRules = {} 
}: BoardRulesModalProps) {
  const [rules, setRules] = React.useState<BoardRules>({
    autoSchedule: false,
    revisionRules: false,
    approvalDeadline: false,
    groupBy: null,
    sortBy: null,
    rowHeight: 48,
    ...initialRules,
  });

  React.useEffect(() => {
    if (isOpen) {
      setRules({
        autoSchedule: false,
        revisionRules: false,
        approvalDeadline: false,
        groupBy: "month",
        sortBy: "status",
        rowHeight: 48,
        ...initialRules,
      });
    } else {
      // Reset rules when modal closes
      setRules({
        autoSchedule: false,
        revisionRules: false,
        approvalDeadline: false,
        groupBy: null,
        sortBy: null,
        rowHeight: 48,
      });
    }
  }, [isOpen]); // Remove initialRules from dependency array

  const handleSave = React.useCallback(() => {
    onSave(rules);
    onClose();
  }, [rules, onSave, onClose]);

  const updateRule = React.useCallback(<K extends keyof BoardRules>(key: K, value: BoardRules[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
  }, []);

  // Memoized handlers for each switch and select
  const handleAutoScheduleChange = React.useCallback((checked: boolean) => {
    updateRule('autoSchedule', checked);
  }, [updateRule]);

  const handleRevisionRulesChange = React.useCallback((checked: boolean) => {
    updateRule('revisionRules', checked);
  }, [updateRule]);

  const handleApprovalDeadlineChange = React.useCallback((checked: boolean) => {
    updateRule('approvalDeadline', checked);
  }, [updateRule]);

  const handleGroupByChange = React.useCallback((value: string | null) => {
    updateRule('groupBy', value);
  }, [updateRule]);

  const handleSortByChange = React.useCallback((value: string | null) => {
    updateRule('sortBy', value);
  }, [updateRule]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[489px] bg-white text-black p-4">
        <DialogTitle className="sr-only">Board rules</DialogTitle>
        
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-black leading-none">Board rules</h2>
            <p className="text-[13px] text-[#75777C] leading-tight">
              Set the rules for how your board handles revisions and scheduling.
            </p>
          </div>

          {/* Rules Content */}
          <div className="flex flex-col gap-4">
            {/* Auto-schedule */}
            <div
              className={
                [
                  "p-3 rounded-md",
                  "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
                  "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
                  "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
                  "border",
                  rules.autoSchedule ? "border-[#125AFF]" : "border-[#D3D3D3]",
                  "flex justify-start items-center gap-2"
                ].join(" ")
              }
            >
              <div className="flex-1 flex justify-start items-start gap-3">
                <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
                  <div className="inline-flex justify-start items-center gap-1.5">
                    <div className="w-4 h-4 relative overflow-hidden">
                        <img src="/images/boards/stars-01.svg" className="rounded-sm" alt="auto-schedule" />
                    </div>
                    <div className="text-sm font-medium text-black leading-none">Auto-schedule</div>
                  </div>
                  <div className="h-5 flex items-center text-[13px] text-[#75777C] leading-tight">
                    Automatically plan content based on your set rules and timeline.
                  </div>
                </div>
              </div>
              <Switch
                checked={rules.autoSchedule}
                onCheckedChange={handleAutoScheduleChange}
                className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
                icon={
                  <span className="flex items-center justify-center w-full h-full">
                    <img
                      src="/images/boards/stars-01.svg"
                      alt="star"
                      className="w-3 h-3"
                      style={{
                        filter: rules.autoSchedule
                          ? undefined
                          : 'grayscale(2) brightness(0.85)',
                      }}
                    />
                  </span>
                }
              />
            </div>

            {/* Add revision rules */}
            <div className="p-3 rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex flex-col gap-4 bg-white data-[state=checked]:bg-[#F5FAFF]"
              style={{ borderColor: rules.revisionRules ? '#125AFF' : '#D3D3D3' }}>
              {/* header row */}
              <div className="flex justify-between items-center">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-sm font-medium text-black leading-none">Add revision rules</span>
                  <span className="text-[13px] text-[#75777C] leading-tight">Customize how content is reviewed and approved over time.</span>
                </div>
                <Switch
                  checked={rules.revisionRules}
                  onCheckedChange={handleRevisionRulesChange}
                  className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
                />
              </div>
              {/* extra config shown only when enabled */}
              {rules.revisionRules && (
                <div className="w-full flex flex-col lg:flex-row gap-4 mt-2">
                  {/* first month */}
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-black leading-none text-left">First month</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={rules.firstMonth ? String(rules.firstMonth) : ''}
                        onValueChange={(val) => updateRule('firstMonth', Number(val))}
                      >
                        <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] shadow-sm text-left">
                          <SelectValue placeholder="Select how many revision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ongoing months */}
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-black leading-none text-left">Ongoing months</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={rules.ongoingMonth ? String(rules.ongoingMonth) : ''}
                        onValueChange={(val) => updateRule('ongoingMonth', Number(val))}
                      >
                        <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] shadow-sm text-left">
                          <SelectValue placeholder="Select how many revision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Approval deadline */}
            <div
              className={[
                "p-3 rounded-md",
                "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
                "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
                "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
                "border",
                rules.approvalDeadline ? "border-[#125AFF]" : "border-[#D3D3D3]",
                "flex flex-col gap-3"
              ].join(" ")}
            >
              <div className="w-full flex justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-black leading-none">Approval deadline</div>
                  <div className="h-5 flex items-center text-[13px] text-[#75777C] leading-tight">
                    Customize how content is reviewed and approved over time.
                  </div>
                </div>
                <Switch
                  checked={rules.approvalDeadline}
                  onCheckedChange={handleApprovalDeadlineChange}
                  className="data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer"
                />
              </div>
              {/* pills inside block */}
              {rules.approvalDeadline && (
                <>
                  <div className="w-full flex flex-wrap gap-2">
                    {['7','14','30','60','custom'].map(opt => {
                      const isCustom = opt === 'custom';
                      const selected = isCustom ? rules.approvalDays === undefined : rules.approvalDays === Number(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateRule('approvalDays', isCustom ? undefined : Number(opt))}
                          className={cn(
                            "flex-1 h-8 px-3 rounded-full border outline outline-1 outline-offset-[-1px] text-[13px] font-medium cursor-pointer",
                            selected ? 'bg-blue-600 text-white outline-blue-600' : 'bg-white text-black outline-slate-300'
                          )}
                        >
                          {opt === 'custom' ? 'Custom' : `${opt} days`}
                        </button>
                      );
                    })}
                  </div>
                  {rules.approvalDays === undefined && rules.approvalDeadline && (
                    <div className="w-full mt-1">
                      <input
                        type="number"
                        min={0}
                        placeholder="Select custom deadline"
                        className="small-spin w-full px-2.5 py-2 text-[13px] border border-[#D3D3D3] rounded-md"
                        value={rules.approvalCustom ?? ''}
                        onChange={e => updateRule('approvalCustom', e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            
            </div>

            {/* Display Settings */}
            <div className="flex w-full gap-3">
              {/* Group by */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="text-[13px] font-medium text-black leading-none">Group by</div>
                <div className="w-full">
                  <Select value={rules.groupBy || ""} onValueChange={(value) => handleGroupByChange(value === "" ? null : value)}>
                    <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex items-center gap-2 overflow-hidden text-left">
                      {(() => {
                        const current = GROUP_OPTIONS.find(opt => opt.id === rules.groupBy);
                        return current ? (
                          <div className="flex items-center gap-1 w-full">
                            {current.icon}
                            <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                              {current.label}
                            </span>
                          </div>
                        ) : (
                          <SelectValue placeholder="None" />
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-1">
                          <span className="text-[#75777C]">None</span>
                        </div>
                      </SelectItem>
                      {GROUP_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          <div className="flex items-center gap-1">
                            {opt.icon}
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sort by */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="text-[13px] font-medium text-black leading-none">Sort by</div>
                <div className="w-full">
                  <Select value={rules.sortBy || ""} onValueChange={(value) => handleSortByChange(value === "" ? null : value)}>
                    <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex items-center gap-2 overflow-hidden text-left">
                      {(() => {
                        const current = SORT_OPTIONS.find(opt => opt.id === rules.sortBy);
                        return current ? (
                          <div className="flex items-center gap-1 w-full">
                            {current.icon}
                            <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                              {current.label}
                            </span>
                          </div>
                        ) : (
                          <SelectValue placeholder="None" />
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-1">
                          <span className="text-[#75777C]">None</span>
                        </div>
                      </SelectItem>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          <div className="flex items-center gap-1">
                            {opt.icon}
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row Height */}
              <div className="flex-1 flex flex-col justify-start items-start gap-2">
                <div className="text-[13px] font-medium text-black leading-none">Row Height</div>
                <div className="w-full">
                  <Select
                    value={String(rules.rowHeight)}
                    onValueChange={(val) => updateRule('rowHeight', Number(val))}
                  >
                    <SelectTrigger className="w-full px-3 py-2 bg-white rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border border-[#D3D3D3] flex justify-start items-center gap-2 overflow-hidden">
                      {(() => {
                        const current = possibleHeights.find(h => h.value === rules.rowHeight);
                        return current ? (
                          <div className="flex items-center gap-2 w-full">
                            {current.icon}
                            <span className="flex-1 text-black text-[13px] font-medium leading-tight text-left">
                              {current.label}
                            </span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select" />
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      {possibleHeights.map(h => (
                        <SelectItem key={h.value} value={String(h.value)}>
                          <div className="flex items-center gap-2">
                            {h.icon}
                            {h.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
                </div>
            </div>
          </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between sm:justify-between items-center border-t pt-4">
          <Button 
            className="bg-white text-black cursor-pointer border border-[#D3D3D3]" 
            variant="outline" 
            onClick={onBack}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              className="bg-[#125AFF] text-white cursor-pointer" 
              onClick={handleSave}
            >
              Create
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 