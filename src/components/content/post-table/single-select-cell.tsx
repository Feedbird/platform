"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type OptionItem = { id: string; value: string; color: string };

interface SingleSelectCellProps {
  value: string; // This will now store the option ID
  options: Array<OptionItem> | undefined;
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
  onChange: (newValue: string) => void; // This will now receive the option ID
  onAddOption: (opt: OptionItem) => void;
}

export function SingleSelectCell({
  value,
  options,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
  onChange,
  onAddOption,
}: SingleSelectCellProps) {
  const open = !!isEditing;
  const [query, setQuery] = React.useState("");

  const normalizedOptions: OptionItem[] = React.useMemo(() => {
    if (!options) return [];
    // already OptionItem[]
    return options.map((o: any) =>
      typeof o === "string" ? { id: o, value: o, color: "" } : (o as OptionItem)
    );
  }, [options]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) => o.value.toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  const showAddButton = React.useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    const exists = normalizedOptions.some((o) =>
      o.value.toLowerCase().includes(q.toLowerCase())
    );
    return !exists;
  }, [normalizedOptions, query]);

  function handlePick(val: string) {
    onChange(val);
    exitEdit?.();
  }

  // Deterministic color for a given label (stable across renders)
  const previewColor = React.useMemo(() => {
    const palette = [
      "#FDE68A", "#A7F3D0", "#93C5FD", "#FCA5A5", "#C4B5FD",
      "#F9A8D4", "#FDBA74", "#86EFAC", "#67E8F9", "#FEE2E2",
    ];
    const t = query.trim();
    if (!t) return palette[0];
    let acc = 0;
    for (let i = 0; i < t.length; i++) acc = (acc + t.charCodeAt(i) * 31) % 997;
    return palette[acc % palette.length];
  }, [query]);

  const selectedOption = React.useMemo(() => {
    if (!value) return undefined;
    return normalizedOptions.find(o => o.id === value);
  }, [value, normalizedOptions]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) {
          if (isFocused) enterEdit?.();
          // if not focused, do nothing so first click only focuses via parent
        } else {
          exitEdit?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className={cn(
            "cursor-pointer inline-flex items-center w-full h-full overflow-hidden px-[8px] py-[6px]",
            "hover:opacity-90"
          )}
        >
          {value ? (
            <span
              className="text-xs rounded-full px-2 py-0.5 truncate"
              style={{ backgroundColor: selectedOption?.color || "#EEF2F7", color: "#111827" }}
            >
              {selectedOption?.value || value}
            </span>
          ) : (
            <div
              className="flex flex-row items-center gap-1 rounded-[4px] bg-white"
              style={{ padding: "3px 6px 3px 4px", boxShadow: "0px 0px 0px 1px #D3D3D3" }}
            >
              <div className="flex flex-row items-center p-[1px] rounded-[3px] bg-[#E6E4E2]">
                <Plus className="w-3 h-3 text-[#5C5E63]" />
              </div>
              <span className="text-xs text-[#5C5E63] font-semibold">Select option</span>
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent 
        className="p-0 w-[240px] !z-[9999]" 
        align="start" 
        side="bottom" 
        sideOffset={6} 
        onPointerDown={(e) => e.stopPropagation()}
        style={{ zIndex: 9999 }}
      >
        <div className="w-full flex flex-col rounded-[6px] border border-[1px] border-[#EAECF0] overflow-hidden">
          <div className="p-2">
            <Input
              className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Find an option"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-56 overflow-auto">
            {/* Empty option when query empty */}
            {query.trim() === "" && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer h-9 flex items-center"
                onClick={() => handlePick("")}
              >
              
              </button>
            )}

            {(query.trim() ? filtered : normalizedOptions).map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer h-9 flex items-center",
                  value === opt.id && "bg-primary/10 text-primary"
                )}
                onClick={() => handlePick(opt.id)}
              >
                <span
                  className="text-xs rounded-full px-2 py-0.5 truncate"
                  style={{ backgroundColor: opt.color || "#EEF2F7", color: "#111827" }}
                >
                  {opt.value}
                </span>
              </button>
            ))}
          </div>

          {showAddButton && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 hover:bg-[#F4F5F6] rounded-none"
                onClick={() => {
                  const val = query.trim();
                  if (!val) return;
                  const newOpt: OptionItem = { id: `opt_${Date.now()}`, value: val, color: previewColor };
                  onAddOption(newOpt);
                  // auto-select newly created by ID
                  handlePick(newOpt.id);
                }}
              >
                <span className="text-sm text-[#475467]">Add option:</span>
                <span
                  className="text-xs rounded-full px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: previewColor, color: "#111827" }}
                >
                  {query.trim()}
                </span>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


