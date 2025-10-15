/* ----------------------------------------------------------------------
 * FilterPopover.tsx  –  full file
 * -------------------------------------------------------------------- */
"use client";

import * as React from "react";
import Image from "next/image";
import { nanoid } from "nanoid";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Filter as FilterIcon,
  X,
  FolderOpen,
  Edit as EditIcon,
  ListPlus,
  Film,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Check,
  GripVertical,
  Plus,
  CircleHelp,
  Trash2,
} from "lucide-react";
import { cn, getMonthColor } from "@/lib/utils";

import {
  StatusChip,
  ChannelIcons,
  FormatBadge,
} from "@/components/content/shared/content-post-ui";
import { Status, ContentFormat } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";
import type { FileKind } from "@/lib/store/use-feedbird-store";

// dnd-kit
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ------------------------------------------------------------------ */
/* 1.  Types, constants                                               */
/* ------------------------------------------------------------------ */

export type JoinOp = "and" | "or";

export type Operator =
  | "is"
  | "is_not"
  | "any_of"
  | "none_of"
  | "is_empty"
  | "not_empty"
  // Preview-specific
  | "filename_contains"
  | "has_file_type"
  // Date-specific
  | "is_within"
  | "before"
  | "after"
  | "on_or_before"
  | "on_or_after";

export interface BaseNode {
  id: string;
  type: "condition" | "group";
  /** Preceding join operator for non-first items within a group */
  join?: JoinOp;
}

export interface Condition extends BaseNode {
  type: "condition";
  field: string;
  operator: Operator;
  selectedValues: string[];
}

export interface ConditionGroup extends BaseNode {
  type: "group";
  /** Optional legacy field (ignored), kept for compatibility */
  andOr?: JoinOp;
  children: Array<Condition | ConditionGroup>;
}

export interface ColumnMeta {
  id: string;
  label: string;
  icon?: React.JSX.Element;
}

interface Props {
  columns: ColumnMeta[];
  rootGroup: ConditionGroup;
  setRootGroup: (g: ConditionGroup) => void;
  hasFilters: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const statusOptions: Status[] = [
  "Draft",
  "Pending Approval",
  "Needs Revisions",
  "Revised",
  "Approved",
  "Scheduled",
  "Published",
  "Failed Publishing",
];

const platformOptions: Platform[] = [
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "youtube",
  "tiktok",
  "google",
];

const formatOptions: ContentFormat[] = [
  "image",
  "carousel",
  "story",
  "video",
];

const monthOptions = Array.from({ length: 50 }, (_, i) => (i + 1).toString());

/* ------------------------------------------------------------------ */
/* Field Configuration Helper                                         */
/* ------------------------------------------------------------------ */

interface FieldConfig {
  options: string[];
  placeholder: string;
  renderItem: (value: string) => React.ReactNode;
  renderMultiItem: (value: string) => React.ReactNode;
  multiSelectTitle: string;
  multiSelectColor: string;
}

const getFieldConfig = (field: string): FieldConfig | null => {
  switch (field) {
    case "status":
      return {
        options: statusOptions,
        placeholder: "Select status...",
        renderItem: (value) => <StatusChip status={value as Status} widthFull={false} />,
        renderMultiItem: (value) => <StatusChip status={value as Status} widthFull={false} />,
        multiSelectTitle: "Select Statuses",
        multiSelectColor: "blue",
      };
    case "platforms":
      return {
        options: platformOptions,
        placeholder: "Select platform...",
        renderItem: (value) => (
          <div className="flex items-center gap-2">
            <ChannelIcons channels={[value as Platform]} />
            <span className="text-sm font-medium capitalize">{value}</span>
          </div>
        ),
        renderMultiItem: (value) => (
          <div className="flex items-center gap-2">
            <ChannelIcons channels={[value as Platform]} />
            <span className="text-sm font-medium capitalize">{value}</span>
          </div>
        ),
        multiSelectTitle: "Select Platforms",
        multiSelectColor: "emerald",
      };
    case "format":
      return {
        options: formatOptions,
        placeholder: "Select format...",
        renderItem: (value) => <FormatBadge kind={value as ContentFormat} widthFull={false} />,
        renderMultiItem: (value) => <FormatBadge kind={value as ContentFormat} widthFull={false} />,
        multiSelectTitle: "Select Formats",
        multiSelectColor: "purple",
      };
    case "month":
      return {
        options: monthOptions,
        placeholder: "Select month...",
        renderItem: (value) => (
          <div
            style={{
              display: "inline-flex",
              padding: "4px 8px",
              alignItems: "center",
              gap: "4px",
              borderRadius: "6px",
              border: "1px solid rgba(28, 29, 31, 0.08)",
              background: getMonthColor(parseInt(value)),
              boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.04)",
            }}
            className="text-xs font-semibold"
          >
            <span style={{ color: "#1C1D1F" }}>Month {value}</span>
          </div>
        ),
        renderMultiItem: (value) => (
          <div
            style={{
              display: "inline-flex",
              padding: "4px 8px",
              alignItems: "center",
              gap: "4px",
              borderRadius: "6px",
              border: "1px solid rgba(28, 29, 31, 0.08)",
              background: getMonthColor(parseInt(value)),
              boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.04)",
            }}
            className="text-xs font-semibold"
          >
            <span style={{ color: "#1C1D1F" }}>Month {value}</span>
          </div>
        ),
        multiSelectTitle: "Select Months",
        multiSelectColor: "orange",
      };
    case "file_kind":
      return {
        options: ["image", "video"],
        placeholder: "Select file type...",
        renderItem: (value) => (
          <div className="text-xs font-medium capitalize">{value}</div>
        ),
        renderMultiItem: (value) => (
          <div className="text-xs font-medium capitalize">{value}</div>
        ),
        multiSelectTitle: "Select File Types",
        multiSelectColor: "purple",
      };
    case "approve":
      return {
        options: ["Revision", "Approved", "none_of"],
        placeholder: "Select approval...",
        renderItem: (value) => (
          value === "Approved" ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px",
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#DDF9E4",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/approved.svg" alt="approved" width={14} height={14} />
              <span>Approved</span>
            </div>
          ) : value === "Revision" ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px",
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#FCE4E5",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/needs-revision.svg" alt="needs revision" width={14} height={14} />
              <span>Revision</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                padding: "4px",
                alignItems: "center",
                gap: "10px",
                borderRadius: "6px",
                background: "#FFF",
                boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              }}
              className="border border-border-button"
            >
              <img src="/images/icons/approvals.svg" alt="approve" style={{ width: '18px', height: '18px' }} />
            </div>
          )
        ),
        renderMultiItem: (value) => (
          value === "Approved" ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px",
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#DDF9E4",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/approved.svg" alt="approved" width={14} height={14} />
              <span>Approved</span>
            </div>
          ) : value === "Revision" ? (
            <div
              style={{
                display: "inline-flex",
                padding: "2px 6px 2px 4px",
                alignItems: "center",
                gap: "4px",
                borderRadius: "4px",
                border: "1px solid rgba(28, 29, 31, 0.05)",
                background: "#FCE4E5",
              }}
              className="text-xs font-medium leading-[18px] relative"
            >
              <Image src="/images/status/needs-revision.svg" alt="needs revision" width={14} height={14} />
              <span>Revision</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                padding: "2px",
                alignItems: "center",
                gap: "10px",
                borderRadius: "6px",
                background: "#FFF",
                boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.02)",
              }}
              className="border border-border-button"
            >
              <img src="/images/icons/approvals.svg" alt="approve" style={{ width: '18px', height: '18px' }} />
            </div>
          )
        ),
        multiSelectTitle: "Select Approval States",
        multiSelectColor: "blue",
      };
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* Operator options per field                                          */
/* ------------------------------------------------------------------ */

const getOperatorOptions = (field: string): Array<{ value: Operator; label: string }> => {
  if (field === "preview") {
    return [
      { value: "filename_contains", label: "filenames contain..." },
      { value: "has_file_type", label: "has file type..." },
      { value: "is_empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ];
  }
  if (field === "publish_date") {
    return [
      { value: "is", label: "is" },
      { value: "is_within", label: "is within" },
      { value: "before", label: "is before" },
      { value: "after", label: "is after" },
      { value: "on_or_before", label: "is on or before" },
      { value: "on_or_after", label: "is on or after" },
      { value: "is_not", label: "is not" },
      { value: "is_empty", label: "is empty" },
      { value: "not_empty", label: "is not empty" },
    ];
  }
  // Default operators
  return [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "any_of", label: "is any of" },
    { value: "none_of", label: "is none of" },
    { value: "is_empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ];
};

/* ------------------------------------------------------------------ */
/* Common Select Components                                           */
/* ------------------------------------------------------------------ */

interface CommonSingleSelectProps {
  field: string;
  selectedValue: string;
  onChange: (value: string) => void;
}

const CommonSingleSelect: React.FC<CommonSingleSelectProps> = ({ field, selectedValue, onChange }) => {
  const config = getFieldConfig(field);
  if (!config) return null;

  return (
    <Select value={selectedValue} onValueChange={onChange}>
      <SelectTrigger className="!h-8 !w-50 text-[13px] font-normal text-black bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0">
        <SelectValue placeholder={config.placeholder} />
      </SelectTrigger>
      <SelectContent className="border border-buttonStroke">
        {config.options.map((option) => (
          <SelectItem key={option} value={option} className="text-[12px] font-normal text-black">
            {config.renderItem(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

interface CommonMultiSelectProps {
  field: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const CommonMultiSelect: React.FC<CommonMultiSelectProps> = ({ field, selectedValues, onChange }) => {
  const config = getFieldConfig(field);
  if (!config) return null;

  const [open, setOpen] = React.useState(false);
  const [localValues, setLocalValues] = React.useState<string[]>(selectedValues);

  // Sync local values with props when component receives new selectedValues
  React.useEffect(() => {
    setLocalValues(selectedValues);
  }, [selectedValues]);

  // Handle closing and syncing with parent
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // When closing, sync local values with parent
      onChange(localValues);
    }
  };

  const handleToggle = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const next = localValues.includes(value)
      ? localValues.filter((v) => v !== value)
      : [...localValues, value];

    setLocalValues(next);
  };

  const getDisplayContent = (): { node: React.ReactNode; isPlaceholder: boolean } => {
    if (localValues.length === 0) {
      return { node: `Select ${field}...`, isPlaceholder: true };
    }
    if (localValues.length === 1) {
      // Render the same component as in the options list for single selection
      return { node: config.renderMultiItem(localValues[0]), isPlaceholder: false };
    }
    return { node: `${localValues.length} ${field} selected`, isPlaceholder: false };
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          header: "from-blue-50 to-indigo-50",
          item: "bg-blue-50 text-blue-900 border-blue-200",
          check: "bg-blue-600",
        };
      case "emerald":
        return {
          header: "from-emerald-50 to-green-50",
          item: "bg-emerald-50 text-emerald-900 border-emerald-200",
          check: "bg-emerald-600",
        };
      case "purple":
        return {
          header: "from-purple-50 to-violet-50",
          item: "bg-purple-50 text-purple-900 border-purple-200",
          check: "bg-purple-600",
        };
      case "orange":
        return {
          header: "from-orange-50 to-amber-50",
          item: "bg-orange-50 text-orange-900 border-orange-200",
          check: "bg-orange-600",
        };
      default:
        return {
          header: "from-gray-50 to-gray-50",
          item: "bg-gray-50 text-gray-900 border-gray-200",
          check: "bg-gray-600",
        };
    }
  };

  const colorClasses = getColorClasses(config.multiSelectColor);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full !h-8 !w-50 justify-between text-[13px] font-normal bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main [&>svg]:text-[#75777C]"
        >
          {(() => {
            const { node, isPlaceholder } = getDisplayContent();
            if (isPlaceholder) {
              return (
                <span className="truncate text-left text-grey">{node as any}</span>
              );
            }
            // For single selection, node is a component; for multi, it's text
            return (
              <div className="truncate text-left flex items-center gap-1">{node}</div>
            );
          })()}
          <div className="flex items-center gap-1">
            {localValues.length > 1 && (
              <div className="flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {localValues.length}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-72 border shadow-lg"
        align="start"
        sideOffset={4}
      >
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <ScrollArea className="max-h-64 overflow-auto">
            <div className="p-2 flex flex-col gap-1">
              {config.options.map((option) => {
                const checked = localValues.includes(option);
                return (
                  <div
                    key={option}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 h-auto rounded cursor-pointer transition-colors",
                      checked ? "bg-gray-50" : "hover:bg-gray-50"
                    )}
                    onClick={(e) => handleToggle(option, e)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isOn = !!val;
                        const next = isOn
                          ? [...localValues, option]
                          : localValues.filter((v) => v !== option);
                        setLocalValues(next);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      {config.renderMultiItem(option)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const formatDisplayNames: Record<ContentFormat, string> = {
  image: "Static Image",
  carousel: "Carousel",
  story: "Story",
  video: "Video",
  email: "Email",
};

const statusDisplayNames: Record<Status | 'any', string> = {
  any: "Any Status",
  Draft: "Draft",
  "Pending Approval": "Pending Approval",
  "Needs Revisions": "Needs Revisions",
  Revised: "Revised",
  Approved: "Approved",
  Scheduled: "Scheduled",
  Publishing: "Publishing",
  Published: "Published",
  "Failed Publishing": "Failed Publishing",
};

/* ------------------------------------------------------------------ */
/* 2.  Main component                                                 */
/* ------------------------------------------------------------------ */

export function FilterPopover({
  columns,
  rootGroup,
  setRootGroup,
  hasFilters,
  open,
  onOpenChange,
}: Props) {
  /* controlled/uncontrolled popover state ------------------------- */
  const [intOpen, setIntOpen] = React.useState(false);
  const isCtrl = open !== undefined;
  const popOpen = isCtrl ? open! : intOpen;
  const setPopOpen = isCtrl ? onOpenChange! : setIntOpen;

  /* local draft while editing ------------------------------------- */
  const [draft, setDraft] = React.useState<ConditionGroup>(rootGroup);
  const isUpdatingRef = React.useRef(false);

  React.useEffect(() => {
    if (popOpen) setDraft(structuredClone(rootGroup));
  }, [popOpen, rootGroup]);

  // // Auto-save: automatically apply changes to the store when draft changes
  React.useEffect(() => {
    // Only auto-save if the draft is different from the current rootGroup
    // This prevents infinite loops and unnecessary updates
    const draftStr = JSON.stringify(draft);
    const rootStr = JSON.stringify(rootGroup);
    if (draftStr !== rootStr && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      setRootGroup(draft);
      // Reset the flag after a brief delay to allow the update to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [draft, rootGroup, setRootGroup]);

  /* helpers ------------------------------------------------------- */
  const MAX_DEPTH = 3; // max allowed levels including root (depth starts at 0)
  const isConditionComplete = (cond: Condition): boolean => {
    if (["is_empty", "not_empty"].includes(cond.operator)) return true;
    const vals = cond.selectedValues || [];
    return vals.length > 0 && vals.some((v) => v != null && String(v).trim() !== "");
  };

  const countFilledConditions = (group: ConditionGroup): number => {
    let total = 0;
    for (const child of group.children) {
      if (child.type === "condition") {
        if (isConditionComplete(child)) total += 1;
      } else if (child.type === "group") {
        total += countFilledConditions(child);
      }
    }
    return total;
  };
  const mkCond = (join?: JoinOp): Condition => ({
    id: nanoid(),
    type: "condition",
    join,
    field: columns[0]?.id || "status",
    operator: "is",
    selectedValues: [],
  });

  const mkGroup = (join?: JoinOp): ConditionGroup => ({
    id: nanoid(),
    type: "group",
    join,
    children: [],
  });

  // ---------- Tree helpers ----------
  type Node = Condition | ConditionGroup;

  const findParentOf = (
    parent: ConditionGroup,
    nodeId: string,
  ): { parent: ConditionGroup; index: number } | null => {
    const idx = parent.children.findIndex((c) => c.id === nodeId);
    if (idx !== -1) return { parent, index: idx };
    for (const child of parent.children) {
      if (child.type === "group") {
        const res = findParentOf(child, nodeId);
        if (res) return res;
      }
    }
    return null;
  };

  const normalizeChildrenJoins = (children: Node[], forceJoin?: JoinOp): Node[] => {
    if (children.length === 0) return children;
    const joinVal = forceJoin ?? (children[1]?.join ?? "and");
    return children.map((n, i) => ({
      ...n,
      join: i === 0 ? undefined : joinVal,
    })) as Node[];
  };

  const getNodeById = (parent: ConditionGroup, nodeId: string): Node | null => {
    if (parent.id === nodeId) return parent;
    for (const child of parent.children) {
      if (child.id === nodeId) return child;
      if (child.type === "group") {
        const res = getNodeById(child, nodeId);
        if (res) return res;
      }
    }
    return null;
  };

  const getDepthOfNode = (
    parent: ConditionGroup,
    nodeId: string,
    currentDepth: number = 0,
  ): number | null => {
    if (parent.id === nodeId) {
      return currentDepth;
    }
    for (const child of parent.children) {
      if (child.id === nodeId && parent) return currentDepth + 1;
      if (child.type === "group") {
        const d = getDepthOfNode(child, nodeId, currentDepth + 1);
        if (d !== null) return d;
      }
    }
    return null;
  };

  const getSubtreeHeight = (node: Node): number => {
    if (node.type === "condition") return 1;
    const children = node.children || [];
    if (children.length === 0) return 1;
    let maxChild = 0;
    for (const ch of children) {
      const h = getSubtreeHeight(ch as Node);
      if (h > maxChild) maxChild = h;
    }
    return 1 + maxChild;
  };

  const isDescendant = (maybeAncestorId: string, nodeId: string): boolean => {
    const ancestor = getNodeById(draft, maybeAncestorId);
    if (!ancestor || ancestor.type !== "group") return false;
    return !!getNodeById(ancestor, nodeId);
  };

  // Derive a consistent drop target (parent/index) for both preview and commit
  const getDropTarget = (activeId: string, overId: string): { parentId: string; index: number } | null => {
    const overNode = getNodeById(draft, overId);
    if (!overNode) return null;
    if (overNode.type === "group") {
      return { parentId: overNode.id, index: overNode.children.length };
    }
    const dst = findParentOf(draft, overId);
    if (dst) {
      return { parentId: dst.parent.id, index: dst.index };
    }
    return null;
  };

  const updateNode = (id: string, patch: Partial<Condition | ConditionGroup>) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const parentInfo = findParentOf(clone, id);
      if (!parentInfo) return prev;
      const curr = parentInfo.parent.children[parentInfo.index];
      parentInfo.parent.children[parentInfo.index] = {
        ...curr,
        ...patch,
      } as Node;
      return clone;
    });
  };

  const removeNode = (id: string) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const parentInfo = findParentOf(clone, id);
      if (!parentInfo) return prev;
      parentInfo.parent.children.splice(parentInfo.index, 1);
      parentInfo.parent.children = normalizeChildrenJoins(parentInfo.parent.children);
      return clone;
    });
  };

  const insertNodeAt = (parentId: string, index: number, node: Node) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const parentNode = getNodeById(clone, parentId);
      if (!parentNode || parentNode.type !== "group") return prev;
      const at = Math.max(0, Math.min(index, parentNode.children.length));
      parentNode.children.splice(at, 0, node);
      parentNode.children = normalizeChildrenJoins(parentNode.children);
      return clone;
    });
  };

  const moveNode = (
    sourceParentId: string,
    sourceIndex: number,
    targetParentId: string,
    targetIndex: number,
  ) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const sourceParent = getNodeById(clone, sourceParentId);
      const targetParent = getNodeById(clone, targetParentId);
      if (!sourceParent || sourceParent.type !== "group") return prev;
      if (!targetParent || targetParent.type !== "group") return prev;
      const [node] = sourceParent.children.splice(sourceIndex, 1);
      // Insert at the computed target index directly to match visual preview
      const at = Math.max(0, Math.min(targetIndex, targetParent.children.length));
      targetParent.children.splice(at, 0, node);
      // Normalize joins in both parents (second item controls the rest)
      sourceParent.children = normalizeChildrenJoins(sourceParent.children);
      targetParent.children = normalizeChildrenJoins(targetParent.children);
      return clone;
    });
  };

  const addChildToGroup = (groupId: string, child: Node) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const target = getNodeById(clone, groupId);
      if (!target || target.type !== "group") return prev;
      target.children.push(child);
      target.children = normalizeChildrenJoins(target.children);
      return clone;
    });
  };

  const setAllSiblingJoins = (nodeId: string, joinVal: JoinOp) => {
    setDraft((prev) => {
      const clone = structuredClone(prev);
      const parentInfo = findParentOf(clone, nodeId);
      if (!parentInfo) return prev;
      parentInfo.parent.children = normalizeChildrenJoins(parentInfo.parent.children, joinVal);
      return clone;
    });
  };

  const clearFilters = () => {
    const cleared = { ...draft, children: [] };
    setDraft(cleared);
    // Auto-save will handle calling setRootGroup
    setPopOpen(false);
  };

  /* field-specific value selector --------------------------------- */
  const FieldValueSelector = ({ condition }: { condition: Condition }) => {
    const onSel = (values: string[]) =>
      updateNode(condition.id, { selectedValues: values });

    // Stable id to help preserve focus across re-renders
    const valueInputId = React.useMemo(() => `filter-input-${condition.id}`,[condition.id]);

    // Always render a container to maintain space
    const renderContainer = (content: React.ReactNode) => (
      <div className="flex-1 min-w-0">
        {content}
      </div>
    );

    // Global: empty operators occupy fixed width
    if (["is_empty", "not_empty"].includes(condition.operator)) {
      return (
        <div style={{ width: 200 }} className="shrink-0 h-8" />
      );
    }

    // Preview field
    if (condition.field === "preview") {
      if (condition.operator === "filename_contains") {
        return renderContainer(
          <Input
            className="!h-8 !w-[200px] text-[13px] font-normal text-black rounded-[4px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-main placeholder:text-[13px] placeholder:font-normal placeholder:text-grey"
            placeholder="Type filename text..."
            value={condition.selectedValues?.[0] || ""}
            id={valueInputId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const el = e.target as HTMLInputElement;
              const start = el.selectionStart;
              const end = el.selectionEnd;
              onSel([el.value]);
              // Restore focus and caret after state update
              setTimeout(() => {
                const node = document.getElementById(valueInputId) as HTMLInputElement | null;
                if (!node) return;
                try {
                  node.focus({ preventScroll: true } as any);
                  if (start != null && end != null) node.setSelectionRange(start, end);
                } catch { /* noop */ }
              }, 0);
            }}
          />
        );
      }
      if (condition.operator === "has_file_type") {
        return renderContainer(
          <CommonSingleSelect
            field={"file_kind"}
            selectedValue={condition.selectedValues[0] || ""}
            onChange={(value: string) => onSel(value ? [value] : [])}
          />
        );
      }
      return (
        <div style={{ width: 200 }} className="shrink-0 h-8" />
      );
    }

    // Post time field
    if (condition.field === "publish_date") {
      const value = condition.selectedValues?.[0] || "";
      const dateOption = value || "today";

      const relativeOptions = [
        { v: "today", l: "today" },
        { v: "tomorrow", l: "tomorrow" },
        { v: "yesterday", l: "yesterday" },
        { v: "one_week_ago", l: "one week ago" },
        { v: "one_week_from_now", l: "one week from now" },
        { v: "one_month_ago", l: "one month ago" },
        { v: "one_month_from_now", l: "one month from now" },
        { v: "days_ago", l: "number of days ago..." },
        { v: "days_from_now", l: "number of days from now..." },
        { v: "exact_date", l: "exact date..." },
      ];

      const numberVal = condition.selectedValues?.[1] || "";
      const exactDate = condition.selectedValues?.[1] || "";
      const exactTime = condition.selectedValues?.[2] || "";

      return (
        <div className="flex items-center gap-2">
          <Select
            value={dateOption}
            onValueChange={(v) => {
              if (v === "days_ago" || v === "days_from_now") {
                onSel([v, numberVal || "1"]);
              } else if (v === "exact_date") {
                onSel([v, exactDate || "", exactTime || ""]);
              } else {
                onSel([v]);
              }
            }}
          >
            <SelectTrigger className={cn(dateOption == "exact_date" ? "!w-36":"!w-50", "!h-8 text-[13px] font-normal text-black bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0", dateOption === "exact_date" ? "!w-[135px]" : "")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-48 border border-buttonStroke">
              {relativeOptions.map((opt) => (
                <SelectItem key={opt.v} value={opt.v} className="text-[12px] font-normal text-black">
                  {opt.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateOption === "days_ago" || dateOption === "days_from_now" ? (
            <Input
              type="number"
              className="!h-8 !w-[90px] text-[13px] text-black bg-white border-buttonStroke pl-2.5 pr-2 py-2 rounded-[4px] leading-[16px] focus-visible:border-main focus-visible:ring-0 focus-visible:ring-offset-0 appearance-none placeholder:text-[13px] placeholder:font-normal placeholder:text-grey [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Enter days"
              value={numberVal}
              id={`date-num-${condition.id}`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const el = e.target as HTMLInputElement;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                onSel([dateOption, el.value]);
                setTimeout(() => {
                  const node = document.getElementById(`date-num-${condition.id}`) as HTMLInputElement | null;
                  if (!node) return;
                  try {
                    node.focus({ preventScroll: true } as any);
                    if (start != null && end != null) node.setSelectionRange(start, end);
                  } catch { /* noop */ }
                }, 0);
              }}
              min={"0"}
            />
          ) : null}

          {dateOption === "exact_date" ? (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="!h-8 !w-[135px] justify-between text-[13px] font-normal bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main [&>svg]:text-[#75777C]"
                  >
                    <span className={cn("truncate text-left", exactDate ? "text-black" : "text-grey")}>
                      {exactDate
                        ? (() => {
                            const parts = exactDate.split("-").map(Number);
                            const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
                            return format(d, "MMMM d");
                          })()
                        : "Select date..."}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={exactDate ? new Date(exactDate) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      // Store as local date string to avoid timezone shifts
                      const isoLocal = format(d, "yyyy-MM-dd");
                      onSel([dateOption, isoLocal]);
                    }}
                    className="mx-auto"
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center justify-center h-8 w-16 bg-backgroundHover rounded-[4px] text-[13px] text-grey font-normal whitespace-nowrap">GMT+2</div>
            </div>
          ) : null}
        </div>
      );
    }

    // Get field configuration
    const fieldConfig = getFieldConfig(condition.field);
    if (!fieldConfig) {
      return renderContainer(
        <div className="text-xs text-muted-foreground">
          Select field type
        </div>
      );
    }

    if (["is", "is_not"].includes(condition.operator)) {
      return renderContainer(
        <CommonSingleSelect
          field={condition.field}
          selectedValue={condition.selectedValues[0] || ""}
          onChange={(value: string) => onSel(value ? [value] : [])}
        />
      );
    } else if (["any_of", "none_of"].includes(condition.operator)) {
      return renderContainer(
        <CommonMultiSelect
          field={condition.field}
          selectedValues={condition.selectedValues}
          onChange={onSel}
        />
      );
    } else {
      return (
        <div style={{ width: 200 }} className="shrink-0 h-8" />
      );
    }
  };

  // ---------- Sortable wrappers ----------
  const DragHandleCtx = React.createContext<{
    setActivatorNodeRef: (el: HTMLElement | null) => void;
    listeners: any;
    attributes: any;
  } | null>(null);

  const SortableRow: React.FC<{
    id: UniqueIdentifier;
    children: React.ReactNode;
  }> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
    // Allow the grabbed item to move freely; clamp others to vertical-only movement
    const clampedTransform = !isDragging && transform ? { ...transform, x: 0 } : transform;
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(clampedTransform),
      transition,
      opacity: isDragging ? 0.6 : 1,
    };
    return (
      <DragHandleCtx.Provider value={{ setActivatorNodeRef, listeners, attributes }}>
        <div ref={(el) => { setNodeRef(el as any); const key = id as UniqueIdentifier; if (el) rowElMapRef.current.set(key, el); else rowElMapRef.current.delete(key); }} style={style}>
          {children}
        </div>
      </DragHandleCtx.Provider>
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Collision detection that considers only the vertical (y) position to decide targets
  const verticalCollisionDetection: CollisionDetection = (args) => {
    const { pointerCoordinates, droppableContainers } = args;
    if (!pointerCoordinates) return [];
    const { y } = pointerCoordinates;

    // Measure distance by vertical delta to each container's center
    const collisions = droppableContainers.map((container) => {
      const rect = container.rect.current;
      if (!rect) return { id: container.id, data: { value: Number.POSITIVE_INFINITY } } as any;
      const centerY = rect.top + rect.height / 2;
      const dy = Math.abs(y - centerY);
      return { id: container.id, data: { value: dy } } as any;
    });

    // Sort ascending by vertical distance
    collisions.sort((a: any, b: any) => (a.data.value as number) - (b.data.value as number));
    return collisions as any;
  };

  // Track activator elements per row and overlay transform adjustment to align grab icon under cursor
  const activatorMapRef = React.useRef(new Map<UniqueIdentifier, HTMLElement>());
  const overlayAdjustRef = React.useRef<{ x: number; y: number } | null>(null);
  const overlaySizeBiasRef = React.useRef<{ x: number; y: number } | null>(null);
  const overlayElRef = React.useRef<HTMLDivElement | null>(null);
  const rowElMapRef = React.useRef(new Map<UniqueIdentifier, HTMLElement>());

  const adjustOverlayTransform = (args: { transform: { x: number; y: number; scaleX: number; scaleY: number } }) => {
    const adj = overlayAdjustRef.current;
    if (!adj) return args.transform as any;
    return { ...args.transform, x: args.transform.x - adj.x, y: args.transform.y - adj.y } as any;
  };

  // ---------- Row renderers ----------
  const ConditionRow: React.FC<{ condition: Condition; index: number; isOverlay?: boolean }> = ({ condition, index, isOverlay }) => {
    const drag = React.useContext(DragHandleCtx);
    return (
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-2">
        {(!isOverlay) ? (
          <div className="flex items-center w-15">
            {/* Join chip or selector */}
            {index === 0 ? (
              <div className="flex items-center justify-start px-2.5">
                <span className="text-[12px] font-normal text-black">Where</span>
              </div>
            ) : index === 1 ? (
              <Select
                value={condition.join || "and"}
                onValueChange={(v) => setAllSiblingJoins(condition.id, v as JoinOp)}
              >
                <SelectTrigger className="!h-8 !w-15 text-[13px] font-normal text-black bg-white border-buttonStroke pl-2.5 pr-2 py-2 rounded-[4px] leading-[16px] !gap-0 data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-buttonStroke">
                  <SelectItem value="and" className="text-[12px] font-normal text-black">and</SelectItem>
                  <SelectItem value="or" className="text-[12px] font-normal text-black">or</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-start px-2.5">
                <span className="text-[12px] font-normal text-black">{(findParentOf(draft, condition.id)?.parent.children[1]?.join as JoinOp) || "and"}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-15" />
        )}
        {/* Condition content container */}
        <div className="flex items-center gap-2">
          {/* Column selector */}
            <Select
              value={condition.field}
              onValueChange={(v) => {
                const ops = getOperatorOptions(v);
                const nextOperator = (ops[0]?.value ?? "is") as Operator;
                updateNode(condition.id, { field: v, operator: nextOperator, selectedValues: [] });
              }}
            >
              <SelectTrigger className="!h-8 !w-37 text-[13px] font-normal text-black bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent className="min-w-48 border border-buttonStroke">
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    <div className="flex items-center gap-2 text-[12px] font-normal text-black">
                      {col.icon}
                      <span className="font-normal capitalize">{col.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          {/* Operator selector */}
            <Select
              value={condition.operator}
              onValueChange={(v) => {
                const nextOp = v as Operator;
                const prevOp = condition.operator;
                const prevVals = condition.selectedValues || [];

                // Empty/not_empty always clear values
                if (["is_empty", "not_empty"].includes(nextOp)) {
                  updateNode(condition.id, { operator: nextOp, selectedValues: [] });
                  return;
                }

                const isSingle = (op: Operator) => op === "is" || op === "is_not" || op === "is_within" || op === "before" || op === "after" || op === "on_or_before" || op === "on_or_after";
                const isMulti = (op: Operator) => op === "any_of" || op === "none_of";

                let nextVals: string[] = [];
                if (isSingle(prevOp) && isSingle(nextOp)) {
                  nextVals = prevVals.length ? [prevVals[0]] : [];
                } else if (isMulti(prevOp) && isMulti(nextOp)) {
                  nextVals = [...prevVals];
                } else {
                  nextVals = [];
                }

                updateNode(condition.id, { operator: nextOp, selectedValues: nextVals });
              }}
            >
              <SelectTrigger className="!h-8 !w-37 text-[13px] font-normal text-black bg-white border-buttonStroke hover:border-buttonStroke focus:border-main transition-colors px-2.5 py-2 rounded-[4px] data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-48 border border-buttonStroke">
                {getOperatorOptions(condition.field).map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-[12px] font-normal text-black">
                    {op.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Value selector */}
          <FieldValueSelector condition={condition} />

          {/* Trash + Grab */}
          <div className="flex items-center">
            <div
              className="cursor-pointer text-grey px-[5px]"
              onClick={() => removeNode(condition.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </div>
            <div
              className="text-grey cursor-grab px-[5px]"
              ref={(el) => {
                if (drag) drag.setActivatorNodeRef(el);
                const id = (condition.id as unknown as UniqueIdentifier);
                if (el) activatorMapRef.current.set(id, el);
                else activatorMapRef.current.delete(id);
              }}
              {...(drag ? drag.listeners : {})}
              {...(drag ? drag.attributes : {})}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const GroupBox: React.FC<{ group: ConditionGroup; index: number; depth?: number; isOverlay?: boolean }> = ({ group, index, depth = 0, isOverlay }) => {
    const drag = React.useContext(DragHandleCtx);
    return (
      <div className="flex flex-row gap-2 mb-2">
        {(!isOverlay) ? (
          <div className="w-15">
            {index === 0 ? (
              <div className="flex items-center justify-start px-2.5">
                <span className="text-[12px] font-normal text-black">Where</span>
              </div>
            ) : index === 1 ? (
              <Select
                value={group.join || "and"}
                onValueChange={(v) => setAllSiblingJoins(group.id, v as JoinOp)}
              >
                <SelectTrigger className="!h-8 !w-15 text-[13px] font-normal text-black bg-white border-buttonStroke pl-2.5 pr-2 py-2 rounded-[4px] leading-[16px] !gap-0 data-[state=open]:border-main data-[placeholder]:text-grey [&>svg]:text-[#75777C] focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-buttonStroke">
                  <SelectItem value="and" className="text-[12px] font-normal text-black">and</SelectItem>
                  <SelectItem value="or" className="text-[12px] font-normal text-black">or</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-start px-2.5">
                <span className="text-[12px] font-normal text-black">{(findParentOf(draft, group.id)?.parent.children[1]?.join as JoinOp) || "and"}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-15" />
        )}

        <div className="border rounded-[4px] bg-[#F6F8FC] p-3 flex-1">
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const children = group.children || [];
              const joinVal: "and" | "or" = (children[1]?.join as any) || "and";
              const hasAny = children.length > 0;
              const desc = !hasAny
                ? "Drag conditions here to add them to this group"
                : joinVal === "and" || children.length === 1
                  ? "All of the following are true..."
                  : "Any of the following are true...";
              return (
                <div className="text-[12px] font-normal text-grey">{desc}</div>
              );
            })()}
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <Plus className="h-4 w-4 text-grey" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-1 w-44">
                  <DropdownMenuItem
                    onClick={() => addChildToGroup(group.id, mkCond((group.children.length === 0 ? undefined : (group.children[1]?.join || "and")) as any))}
                  >
                    Add condition
                  </DropdownMenuItem>
                  {(() => {
                    const disableAddGroup = depth >= (MAX_DEPTH - 1);
                    return (
                      <DropdownMenuItem
                        data-disabled={disableAddGroup ? true : undefined}
                        disabled={disableAddGroup}
                        onClick={() => addChildToGroup(group.id, mkGroup((group.children.length === 0 ? undefined : (group.children[1]?.join || "and")) as any))}
                      >
                        Add condition group
                      </DropdownMenuItem>
                    );
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
              <div
                onClick={() => removeNode(group.id)}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-grey" />
              </div>
              <div
                className="text-grey cursor-grab"
                ref={(el) => {
                  if (drag) drag.setActivatorNodeRef(el);
                  const id = (group.id as unknown as UniqueIdentifier);
                  if (el) activatorMapRef.current.set(id, el);
                  else activatorMapRef.current.delete(id);
                }}
                {...(drag ? drag.listeners : {})}
                {...(drag ? drag.attributes : {})}
              >
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Droppable area: entire group body acts as drop target by virtue of SortableContext */}
          <GroupEditor group={group} depth={depth} />
        </div>
      </div>
    );
  };

  const GroupEditor: React.FC<{ group: ConditionGroup; depth?: number }> = ({ group, depth = 0 }) => {
    // Build a local list with preview insertion when applicable
    const childIds = group.children.map((c) => c.id);
    const activeIdStr = activeDragId ? String(activeDragId) : null;
    const previewApplies = !!dragPreview && dragPreview.parentId === group.id && !!activeIdStr;
    const srcInfo = activeIdStr ? findParentOf(draft, activeIdStr) : null;

    let renderedChildren: Array<Condition | ConditionGroup> = group.children;

    // If hovering a different group, hide the active item from its source group's list
    if (activeIdStr && dragPreview && srcInfo && srcInfo.parent.id !== dragPreview.parentId) {
      if (group.id === srcInfo.parent.id) {
        renderedChildren = renderedChildren.filter((c) => c.id !== activeIdStr);
      }
    }

    if (previewApplies && activeIdStr) {
      // Remove from current location if present in this group's list, then insert at preview index
      const withoutActive = renderedChildren.filter((c) => c.id !== activeIdStr);
      const activeNode = getNodeById(draft, activeIdStr) as Condition | ConditionGroup | null;
      if (activeNode) {
        const insertIndex = Math.max(0, Math.min(dragPreview!.index, withoutActive.length));
        renderedChildren = [
          ...withoutActive.slice(0, insertIndex),
          activeNode,
          ...withoutActive.slice(insertIndex),
        ];
      }
    }

    return (
      <SortableContext items={renderedChildren.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0">
          {renderedChildren.map((child, i) => (
            <SortableRow key={child.id} id={child.id}>
              {child.type === "condition" ? (
                <ConditionRow condition={child as Condition} index={i} />
              ) : (
                <GroupBox group={child as ConditionGroup} index={i} depth={depth + 1} />
              )}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    );
  };

  /* render -------------------------------------------------------- */
  const [activeDragId, setActiveDragId] = React.useState<UniqueIdentifier | null>(null);
  const [dragPreview, setDragPreview] = React.useState<{ parentId: string; index: number } | null>(null);
  const previewRafRef = React.useRef<number | null>(null);
  const pendingPreviewRef = React.useRef<{ parentId: string; index: number } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id);
    setDragPreview(null);
    // Reset initial transform anchor; it will be captured in the overlay modifier
    overlayAdjustRef.current = null;
    overlaySizeBiasRef.current = null;
    if (overlayElRef.current) overlayElRef.current.style.width = "";
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { if (dragPreview) setDragPreview(null); return; }
    // If we're hovering the dragged item due to preview re-rendering, keep current preview to avoid flapping
    if (active.id === over.id) { return; }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const src = findParentOf(draft, activeIdStr);
    const target = src ? getDropTarget(activeIdStr, overIdStr) : null;
    if (!src || !target) { if (dragPreview) setDragPreview(null); return; }
    if (isDescendant(activeIdStr, target.parentId)) { if (dragPreview) setDragPreview(null); return; }

    // Throttle preview updates to once per animation frame
    const changed = !dragPreview || dragPreview.parentId !== target.parentId || dragPreview.index !== target.index;
    if (!changed) return;
    pendingPreviewRef.current = target;
    if (previewRafRef.current != null) return;
    previewRafRef.current = requestAnimationFrame(() => {
      previewRafRef.current = null;
      const next = pendingPreviewRef.current;
      pendingPreviewRef.current = null;
      if (!next) return;
      // Double-check equality right before commit
      if (!dragPreview || dragPreview.parentId !== next.parentId || dragPreview.index !== next.index) {
        setDragPreview(next);
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) { setActiveDragId(null); setDragPreview(null); overlayAdjustRef.current = null; return; }

    // Resolve source context
    const src = findParentOf(draft, String(active.id));
    if (!src) { setActiveDragId(null); setDragPreview(null); overlayAdjustRef.current = null; return; }

    // Prefer preview target; if none, compute from current over
    const computed = dragPreview ?? getDropTarget(String(active.id), String(over.id));
    if (computed && !isDescendant(String(active.id), computed.parentId)) {
      moveNode(src.parent.id, src.index, computed.parentId, computed.index);
    }
    setActiveDragId(null);
    setDragPreview(null);
    if (previewRafRef.current != null) { cancelAnimationFrame(previewRafRef.current); previewRafRef.current = null; }
    pendingPreviewRef.current = null;
    overlayAdjustRef.current = null;
  };

  return (
    <Popover open={popOpen} onOpenChange={setPopOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-2 py-[3px] rounded-xs hover:bg-[#F4F5F6] shadow-none cursor-pointer",
            hasFilters ? "!bg-[#EFFFE3]" : ""
          )}
        >
          <Image
            src="/images/icons/table-toolbar-filter.svg"
            alt="Filter"
            width={12}
            height={12}
          />
          <span className="text-sm font-medium text-black leading-[16px]">
            {hasFilters ? `Filtered by ${countFilledConditions(rootGroup)} fields` : "Filter"}
          </span>
          {/* {popOpen ? (
            <ChevronUp className="h-4 w-4 opacity-70" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-70" />
          )} */}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-3"
        side="bottom"
        align="start"
      >
        {/* Header */}
        <div className="flex items-center">
          <p className="text-[12px] text-grey font-normal">
            In this view, show clients
          </p>
        </div>

        {/* Content */}
        <div className="my-2">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={verticalCollisionDetection}>
            <ScrollArea className="max-h-[60vh]">
                <GroupEditor group={draft} depth={0} />
            </ScrollArea>
            <DragOverlay adjustScale={false} dropAnimation={null} modifiers={[({ transform }) => {
              // On first frame, compute DOM delta between overlay wrapper and source row top-left
              if (!overlayAdjustRef.current && overlayElRef.current && activeDragId) {
                try {
                  const overlayRect = overlayElRef.current.getBoundingClientRect();
                  const srcEl = rowElMapRef.current.get(activeDragId);
                  if (srcEl) {
                    const srcRect = srcEl.getBoundingClientRect();
                    if (!overlayElRef.current.style.width) {
                      overlayElRef.current.style.width = `${srcRect.width}px`;
                    }
                    overlayAdjustRef.current = { x: overlayRect.left - srcRect.left, y: overlayRect.top - srcRect.top };
                  } else {
                    overlayAdjustRef.current = { x: transform.x, y: transform.y };
                  }
                } catch {
                  overlayAdjustRef.current = { x: transform.x, y: transform.y };
                }
              }
              const adj = overlayAdjustRef.current || { x: 0, y: 0 };
              return { ...transform, x: transform.x - adj.x, y: transform.y - adj.y };
            }]}> 
              {(() => {
                if (!activeDragId) return null;
                const node = getNodeById(draft, String(activeDragId));
                if (!node) return null;
                const parentInfo = findParentOf(draft, node.id);
                const index = parentInfo?.index ?? 0;
                if (node.type === 'condition') {
                  return (
                    <div className="w-full" style={{ pointerEvents: 'none' }} ref={overlayElRef}>
                      <ConditionRow condition={node} index={index} isOverlay />
                    </div>
                  );
                }
                return (
                  <div className="w-full" style={{ pointerEvents: 'none' }} ref={overlayElRef}>
                    <GroupBox group={node} index={index} depth={0} isOverlay />
                  </div>
                );
              })()}
            </DragOverlay>
          </DndContext>

        </div>
          {/* Footer actions */}
          <div className="py-2 flex items-center gap-3">
            <div
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  children: [ 
                    ...prev.children,
                    mkCond(prev.children.length === 0 ? undefined : "and"),
                  ],
                }))
              }
              className="flex gap-1 text-[12px] font-medium text-main items-center cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add condition
            </div>
            <div
              className="flex gap-1 items-center"
            >
              <div
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    children: [
                      ...prev.children,
                      mkGroup(prev.children.length === 0 ? undefined : "and"),
                    ],
                  }))
                }
                className="flex gap-1 text-[12px] font-medium text-darkGrey items-center cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add condition group
              </div>
              <div className="cursor-pointer">
                <CircleHelp className="h-4 w-4 text-darkGrey" />
              </div>
            </div>
          </div>
      </PopoverContent>
    </Popover>
  );
}
