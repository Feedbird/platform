import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ListFilter, ListFilterIcon, ListPlus } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

// TODO This should go from a shared types file
export interface ColumnMeta {
  id: string;
  label: string;
  icon?: React.JSX.Element;
}

export interface ConditionGroup {
  id: string;
  andOr: 'AND' | 'OR';
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
            'flex cursor-pointer items-center gap-1.5 rounded-xs px-2 py-[3px] shadow-none hover:bg-[#F4F5F6]'
          )}
        >
          <ListFilterIcon size={14} color="black" />
          <span className="text-sm leading-[16px] font-medium text-black">
            {hasFilters
              ? `Filtered by ${rootGroup.children.length} fields`
              : 'Filter'}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[90vw] max-w-2xl p-0"
        side="bottom"
        align="start"
      >
        {/* Header */}
        <div className="rounded-t-xl border-b bg-gradient-to-r from-gray-50 to-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/icons/table-toolbar-filter.svg"
                alt="Filter"
                width={24}
                height={24}
              />
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Filter records
                </h3>
                <p className="mt-0.5 text-sm text-gray-600">
                  Define conditions to filter your content
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="border-border-button cursor-pointer border bg-white text-sm font-medium shadow-none"
              >
                Clear all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={applyFilters}
                className="border-border-button cursor-pointer border bg-white text-sm font-medium shadow-none"
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
              <div className="py-4 text-center text-gray-500">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  <ListFilter className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="mb-2 text-lg font-medium text-gray-900">
                  No filters applied
                </h4>
                <p className="mx-auto max-w-sm text-sm text-gray-600">
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
          <div className="mt-6 border-t pt-6">
            <Button
              size="sm"
              variant="outline"
              //   onClick={addCondition}
              className="h-12 w-full border-2 border-dashed border-gray-300 text-sm font-medium transition-all duration-200 hover:border-gray-400 hover:bg-gray-50"
            >
              <ListPlus className="mr-2 h-4 w-4" />
              Add condition
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
