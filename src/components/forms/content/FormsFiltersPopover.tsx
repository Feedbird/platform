import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ListFilter, ListPlus } from "lucide-react";
import Image from "next/image";
import React from "react";

// TODO This should go from a shared types file
export interface ColumnMeta {
  id: string;
  label: string;
  icon?: React.JSX.Element;
}

export interface ConditionGroup {
  id: string;
  andOr: "AND" | "OR";
  children: Condition[];
}

export interface Condition {
  id: string;
  field: string;
  selectedValues: string[];
}

// TODO -----------------------------

type FilterPopoverProps = {
  columns: ColumnMeta[];
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  rootGroup: ConditionGroup;
  setRootGroup: (group: ConditionGroup) => void;
  hasFilters: boolean;
};

export default function FormsFiltersPopover({
  open,
  onOpenChange,
  rootGroup,
  setRootGroup,
  hasFilters,
}: FilterPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const popOpen = isControlled ? open! : internalOpen;
  const setOpenControl = isControlled ? onOpenChange! : setInternalOpen;

  const [draft, setDraft] = React.useState<ConditionGroup>(rootGroup);

  const clearFilters = () => {
    const cleared = { ...draft, children: [] };
    setDraft(cleared);
    setRootGroup(cleared);
    setOpenControl(false);
  };

  const applyFilters = () => {
    setRootGroup(draft);
    setOpenControl(false);
  };

  return (
    <Popover open={popOpen} onOpenChange={setOpenControl}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-[6px] px-2 py-[3px] rounded-xs hover:bg-[#F4F5F6] shadow-none cursor-pointer"
          )}
        >
          <Image
            src="/images/icons/table-toolbar-filter.svg"
            alt="Filter"
            width={12}
            height={12}
          />
          <span className="text-sm font-medium text-black leading-[16px]">
            {hasFilters
              ? `Filtered by ${rootGroup.children.length} fields`
              : "Filter"}
          </span>
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
                {/* {draft.children.map((c, i) => (
                  <CondRow key={c.id} condition={c} index={i} />
                ))} */}
              </div>
            )}
          </ScrollArea>

          {/* Add condition */}
          <div className="mt-6 pt-6 border-t">
            <Button
              size="sm"
              variant="outline"
              //   onClick={addCondition}
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
