"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface CheckboxCellProps {
  value: string | boolean;
  isFocused?: boolean;
  onChange: (newValue: boolean) => void;
}

/**
 * A checkbox cell for user columns that displays a centered checkbox
 * - When not focused: shows the checkbox in its current state
 * - When focused: shows the checkbox with enhanced styling
 * - Handles boolean values (true/false) or string values ("true"/"false")
 */
export function CheckboxCell({
  value,
  isFocused,
  onChange,
}: CheckboxCellProps) {
  // Convert string values to boolean for checkbox
  const isChecked = React.useMemo(() => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value === "true";
    return false;
  }, [value]);

  const handleChange = React.useCallback((checked: boolean) => {
    onChange(checked);
  }, [onChange]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
