"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

type OptionItem = { id: string; value: string; color: string };

interface MultiSelectCellProps {
  value: string[]; // Array of option IDs
  options: Array<OptionItem> | undefined;
  isFocused?: boolean;
  isEditing?: boolean;
  enterEdit?: () => void;
  exitEdit?: () => void;
  onChange: (newValue: string[]) => void; // This will receive an array of option IDs
  onAddOption: (opt: OptionItem) => void;
}

export function MultiSelectCell({
  value,
  options,
  isFocused,
  isEditing,
  enterEdit,
  exitEdit,
  onChange,
  onAddOption,
}: MultiSelectCellProps) {
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

  function handleToggle(optionId: string) {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  }

  function handleRemove(optionId: string) {
    const newValue = value.filter(id => id !== optionId);
    onChange(newValue);
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

  const selectedOptions = React.useMemo(() => {
    if (!value || !Array.isArray(value)) return [];
    return normalizedOptions.filter(o => value.includes(o.id));
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
          {selectedOptions.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedOptions.slice(0, 2).map((option) => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="text-xs px-2 py-1 h-6"
                  style={{
                    backgroundColor: option.color || previewColor,
                    color: option.color ? "#000" : undefined,
                  }}
                >
                  {option.value}
                </Badge>
              ))}
              {selectedOptions.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                  +{selectedOptions.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Select options...</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search options..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Selected Options */}
        {selectedOptions.length > 0 && (
          <div className="p-3 border-b bg-muted/30">
            <div className="text-sm font-medium mb-2">Selected:</div>
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <Badge
                  key={option.id}
                  variant="secondary"
                  className="text-xs px-2 py-1 h-6 flex items-center gap-1"
                  style={{
                    backgroundColor: option.color || previewColor,
                    color: option.color ? "#000" : undefined,
                  }}
                >
                  {option.value}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.id);
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="max-h-60 overflow-y-auto">
          {filtered.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-none h-auto p-3",
                value.includes(option.id)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleToggle(option.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    value.includes(option.id)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {value.includes(option.id) && (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: option.color || previewColor,
                  }}
                />
                <span className="text-sm flex-1 text-left">{option.value}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Add New Option */}
        {showAddButton && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const newOption: OptionItem = {
                  id: query.trim(),
                  value: query.trim(),
                  color: previewColor,
                };
                onAddOption(newOption);
                setQuery("");
                // Auto-select the newly added option
                onChange([...value, newOption.id]);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add "{query.trim()}"
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
