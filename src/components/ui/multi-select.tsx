"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  name: string;
  value: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplayTags?: number;
  loading?: boolean;
  searchable?: boolean;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  className = "",
  maxDisplayTags = 3,
  loading = false,
  searchable = true,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option objects
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );

  const handleToggleOption = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    onSelectionChange(newSelectedValues);
  };

  const handleRemoveTag = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter((v) => v !== value);
    onSelectionChange(newSelectedValues);
  };

  const displayedTags = selectedOptions.slice(0, maxDisplayTags);
  const remainingCount = selectedOptions.length - maxDisplayTags;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        className={cn(
          "flex min-h-[40px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer",
          "hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
          isOpen && "border-blue-500 ring-1 ring-blue-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <>
              {displayedTags.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900"
                >
                  <span>{option.name}</span>
                  <button
                    type="button"
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    onClick={(e) => handleRemoveTag(option.value, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  +{remainingCount} more
                </div>
              )}
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform text-gray-400 self-center",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Options List */}
          <div className="py-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-2 text-sm text-gray-500">
                  Loading services...
                </span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                {searchTerm ? "No services found" : "No services available"}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                      isSelected && "bg-blue-50"
                    )}
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <span
                      className={cn(isSelected && "font-medium text-blue-900")}
                    >
                      {option.name}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
