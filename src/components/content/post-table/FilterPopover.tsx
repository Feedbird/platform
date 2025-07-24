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

import {
  Filter as FilterIcon,
  X,
  FolderOpen,
  Edit as EditIcon,
  ListPlus,
  Film,
  Calendar as CalendarIcon,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn, getMonthColor } from "@/lib/utils";

import {
  StatusChip,
  ChannelIcons,
  FormatBadge,
} from "@/components/content/shared/content-post-ui";
import { Status, ContentFormat } from "@/lib/store/use-feedbird-store";
import { Platform } from "@/lib/social/platforms/platform-types";

/* ------------------------------------------------------------------ */
/* 1.  Types, constants                                               */
/* ------------------------------------------------------------------ */

export interface Condition {
  id: string;
  field: string;
  selectedValues: string[];
}

export interface ConditionGroup {
  id: string;
  andOr: "AND" | "OR";
  children: Condition[];
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

  React.useEffect(() => {
    if (popOpen) setDraft(structuredClone(rootGroup));
  }, [popOpen, rootGroup]);

  /* helpers ------------------------------------------------------- */
  const mkCond = (): Condition => ({
    id: nanoid(),
    field: columns[0]?.id || "status",
    selectedValues: [],
  });

  const updateCondition = (id: string, patch: Partial<Condition>) =>
    setDraft((prev) => ({
      ...prev,
      children: prev.children.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));

  const addCondition = () =>
    setDraft((prev) => ({ ...prev, children: [...prev.children, mkCond()] }));

  const removeCondition = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      children: prev.children.filter((c) => c.id !== id),
    }));

  const clearFilters = () => {
    const cleared = { ...draft, children: [] };
    setDraft(cleared);
    setRootGroup(cleared);
    setPopOpen(false);
  };

  const applyFilters = () => {
    setRootGroup(draft);
    setPopOpen(false);
  };

  /* field-specific value selector --------------------------------- */
  const FieldValueSelector = ({ condition }: { condition: Condition }) => {
    const onSel = (values: string[]) =>
      updateCondition(condition.id, { selectedValues: values });

    switch (condition.field) {
      case "status":
        return (
          <StatusMultiSelect
            selectedValues={condition.selectedValues}
            onChange={onSel}
          />
        );
      case "platforms":
        return (
          <PlatformsMultiSelect
            selectedValues={condition.selectedValues}
            onChange={onSel}
          />
        );
      case "format":
        return (
          <FormatMultiSelect
            selectedValues={condition.selectedValues}
            onChange={onSel}
          />
        );
      case "month":
        return (
          <MonthMultiSelect
            selectedValues={condition.selectedValues}
            onChange={onSel}
          />
        );
      default:
        return (
          <div className="text-xs text-muted-foreground">
            Select field type
          </div>
        );
    }
  };

  const CondRow = ({
    condition,
    index,
  }: {
    condition: Condition;
    index: number;
  }) => (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border rounded-xl bg-gradient-to-r from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-200 mb-3">
      <div className="flex items-center gap-3 lg:w-20 lg:flex-shrink-0">
        <div className="flex items-center justify-center w-16 h-8 rounded-lg bg-blue-50 border border-blue-200">
          <span className="text-xs font-bold text-blue-700">
            {index === 0 ? "WHERE" : "AND"}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 w-full lg:w-40">
        <Select
          value={condition.field}
          onValueChange={(v) =>
            updateCondition(condition.id, { field: v, selectedValues: [] })
          }
        >
          <SelectTrigger className="h-10 text-sm font-medium bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-48">
            {columns.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100">
                    {col.icon}
                  </div>
                  <span className="font-medium capitalize">{col.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <FieldValueSelector condition={condition} />
      </div>

      <div className="flex justify-end lg:justify-center flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 border border-transparent"
          onClick={() => removeCondition(condition.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  /* render -------------------------------------------------------- */
  return (
    <Popover open={popOpen} onOpenChange={setPopOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-[8px] py-[4px] rounded-[100px] border border-[#D3D3D3] shadow-none cursor-pointer",
          )}
        >
          <Image
            src="/images/icons/table-toolbar-filter.svg"
            alt="Filter"
            width={12}
            height={12}
          />
          <span className="text-sm font-medium text-black leading-[16px]">
            {hasFilters ? `Filtered by ${rootGroup.children.length} fields` : "Filter"}
          </span>
          {/* {popOpen ? (
            <ChevronUp className="h-4 w-4 opacity-70" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-70" />
          )} */}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[90vw] max-w-2xl p-0"
        side="bottom"
        align="start"
      >
        {/* Header */}
        <div className="p-6 rounded-t-xl border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/icons/table-toolbar-filter.svg"
                alt="Filter"
                width={28}
                height={28}
              />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  Filter records
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Define conditions to filter your content
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer"
              >
                Clear all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={applyFilters}
                className="text-sm font-medium bg-white border border-border-button shadow-none cursor-pointer"
              >
                Apply filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <ScrollArea className="max-h-[60vh]">
            {draft.children.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100">
                  <ListFilter className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No filters applied
                </h4>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Click "Add condition" below to start filtering your content
                  based on specific criteria
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {draft.children.map((c, i) => (
                  <CondRow key={c.id} condition={c} index={i} />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add condition */}
          <div className="mt-6 pt-6 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={addCondition}
              className="w-full h-12 text-sm font-medium border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              <ListPlus className="h-4 w-4 mr-2" />
              Add condition
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* 3.  Multi-select helpers                                           */
/* ------------------------------------------------------------------ */

type MSProps = {
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

/* ---------- 3.1  Status ------------------------------------------ */

const StatusMultiSelect: React.FC<MSProps> = ({ selectedValues, onChange }) => {
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

  const handleToggle = (status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const next = localValues.includes(status)
      ? localValues.filter((s) => s !== status)
      : [...localValues, status];

    setLocalValues(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between text-sm font-medium bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
        >
          <span className="truncate text-left">
            {localValues.length === 0
              ? "Select statuses..."
              : localValues.length === 1
              ? localValues[0]
              : `${localValues.length} statuses selected`}
          </span>
          <div className="flex items-center gap-1">
            {localValues.length > 0 && (
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
          {/* header */}
          <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                Select Statuses
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-5 w-5 p-0 hover:bg-white/60"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localValues.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {localValues.length} selected
              </p>
            )}
          </div>

          {/* list */}
          <ScrollArea className="max-h-64 overflow-auto">
            <div className="p-2 flex flex-col gap-1">
              {statusOptions.map((s) => (
                <Button
                  key={s}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleToggle(s, e)}
                  className={cn(
                    "justify-start px-2 py-1.5 h-auto rounded transition-all duration-100",
                    localValues.includes(s)
                      ? "bg-blue-50 text-blue-900 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <StatusChip status={s} widthFull={false} />
                    {localValues.includes(s) && (
                      <div className="flex items-center justify-center w-4 h-4 bg-blue-600 rounded-full ml-2">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ---------- 3.2  Platforms --------------------------------------- */

const PlatformsMultiSelect: React.FC<MSProps> = ({
  selectedValues,
  onChange,
}) => {
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

  const handleToggle = (p: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const next = localValues.includes(p)
      ? localValues.filter((x) => x !== p)
      : [...localValues, p];

    setLocalValues(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between text-sm font-medium bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
        >
          <span className="truncate text-left">
            {localValues.length === 0
              ? "Select platforms..."
              : localValues.length === 1
              ? localValues[0].charAt(0).toUpperCase() + localValues[0].slice(1)
              : `${localValues.length} platforms selected`}
          </span>
          <div className="flex items-center gap-1">
            {localValues.length > 0 && (
              <div className="flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {localValues.length}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-64 border shadow-lg"
        align="start"
        sideOffset={4}
      >
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                Select Platforms
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-5 w-5 p-0 hover:bg-white/60"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localValues.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {localValues.length} selected
              </p>
            )}
          </div>

          <ScrollArea className="max-h-64 overflow-auto">
            <div className="p-2 flex flex-col gap-1">
              {platformOptions.map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleToggle(p, e)}
                  className={cn(
                    "justify-start px-2 py-1.5 h-auto rounded transition-all duration-100",
                    localValues.includes(p)
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <ChannelIcons channels={[p as Platform]} />
                      <span className="text-sm font-medium capitalize">{p}</span>
                    </div>
                    {localValues.includes(p) && (
                      <div className="flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ---------- 3.3  Formats ----------------------------------------- */

const FormatMultiSelect: React.FC<MSProps> = ({ selectedValues, onChange }) => {
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

  const handleToggle = (fmt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const next = localValues.includes(fmt)
      ? localValues.filter((x) => x !== fmt)
      : [...localValues, fmt];

    setLocalValues(next);
  };

  const label = (f: string): string =>
    formatDisplayNames[f as ContentFormat] ?? f;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between text-sm font-medium bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
        >
          <span className="truncate text-left">
            {localValues.length === 0
              ? "Select formats..."
              : localValues.length === 1
              ? label(localValues[0])
              : `${localValues.length} formats selected`}
          </span>
          <div className="flex items-center gap-1">
            {localValues.length > 0 && (
              <div className="flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {localValues.length}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-56 border shadow-lg"
        align="start"
        sideOffset={4}
      >
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                Select Formats
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-5 w-5 p-0 hover:bg-white/60"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localValues.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {localValues.length} selected
              </p>
            )}
          </div>

          <ScrollArea className="max-h-64 overflow-auto">
            <div className="p-2 flex flex-col gap-1">
              {formatOptions.map((f) => (
                <Button
                  key={f}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleToggle(f, e)}
                  className={cn(
                    "justify-start px-2 py-1.5 h-auto rounded transition-all duration-100",
                    localValues.includes(f)
                      ? "bg-purple-50 text-purple-900 border border-purple-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <FormatBadge kind={f as ContentFormat} widthFull={false} />
                    {localValues.includes(f) && (
                      <div className="flex items-center justify-center w-4 h-4 bg-purple-600 rounded-full ml-2">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ---------- 3.4  Months ------------------------------------------ */

const MonthMultiSelect: React.FC<MSProps> = ({ selectedValues, onChange }) => {
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

  const handleToggle = (m: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const next = localValues.includes(m)
      ? localValues.filter((x) => x !== m)
      : [...localValues, m];

    setLocalValues(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-9 justify-between text-sm font-medium bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all duration-150"
        >
          <span className="truncate text-left">
            {localValues.length === 0
              ? "Select months..."
              : localValues.length === 1
              ? `Month ${localValues[0]}`
              : `${localValues.length} months selected`}
          </span>
          <div className="flex items-center gap-1">
            {localValues.length > 0 && (
              <div className="flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {localValues.length}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-56 border shadow-lg"
        align="start"
        sideOffset={4}
      >
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                Select Months
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-5 w-5 p-0 hover:bg-white/60"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {localValues.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {localValues.length} selected
              </p>
            )}
          </div>

          <ScrollArea className="max-h-64 overflow-auto">
            <div className="p-2 flex flex-col gap-1">
              {monthOptions.map((m) => (
                <Button
                  key={m}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleToggle(m, e)}
                  className={cn(
                    "justify-start px-2 py-1.5 h-auto rounded transition-all duration-100",
                    localValues.includes(m)
                      ? "bg-orange-50 text-orange-900 border border-orange-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      style={{
                        display: "inline-flex",
                        padding: "4px 8px",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "6px",
                        border: "1px solid rgba(28, 29, 31, 0.08)",
                        background: getMonthColor(parseInt(m)),
                        boxShadow: "0px 1px 2px -1px rgba(7, 10, 22, 0.04)",
                      }}
                      className="text-xs font-semibold"
                    >
                      <span style={{ color: "#1C1D1F" }}>Month {m}</span>
                    </div>
                    {localValues.includes(m) && (
                      <div className="flex items-center justify-center w-4 h-4 bg-orange-600 rounded-full">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* 4.  Helper icon map (export for PostTable)                         */
/* ------------------------------------------------------------------ */

export const iconMap: Record<string, React.JSX.Element> = {
  status: <FolderOpen className="mr-1 h-3 w-3" />,
  month: <CalendarIcon className="mr-1 h-3 w-3" />,
  platforms: <ListPlus className="mr-1 h-3 w-3" />,
  format: <Film className="mr-1 h-3 w-3" />,
};
