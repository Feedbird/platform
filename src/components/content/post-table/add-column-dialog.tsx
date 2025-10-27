"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColumnType } from "@/lib/store";
import {
  EditIcon,
  FilePlus,
  CheckSquare,
  MessageSquare,
  CalendarIcon,
  PlusCircle,
  ListPlus,
} from "lucide-react";

/** Column type → { label, icon } */
const columnTypeOptions: {
  type: ColumnType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "singleLine", label: "Single Line Text", icon: <EditIcon size={14} /> },
  { type: "longText", label: "Long text", icon: <EditIcon size={14} /> },
  { type: "attachment", label: "Attachment", icon: <FilePlus size={14} /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare size={14} /> },
  { type: "feedback", label: "Feedback", icon: <MessageSquare size={14} /> },
  { type: "singleSelect", label: "Single Select", icon: <PlusCircle size={14} /> },
  { type: "multiSelect", label: "Multiple Select", icon: <ListPlus size={14} /> },
  { type: "date", label: "Date", icon: <CalendarIcon size={14} /> },
  { type: "lastUpdatedTime", label: "Last Updated Time", icon: <CalendarIcon size={14} /> },
];

export function AddColumnDialog({
  open,
  onOpenChange,
  onAddColumn,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAddColumn: (
    label: string,
    type: ColumnType,
    options?: Array<{ id: string; value: string; color: string }> | string[]
  ) => void;
}) {
  const [fieldLabel, setFieldLabel] = React.useState("");
  const [fieldType, setFieldType] = React.useState<ColumnType>("singleLine");
  const [multiOptions, setMultiOptions] = React.useState([{ id: "option-a", value: "Option A", color: "#FDE68A" }]);

  function handleSubmit() {
    onAddColumn(fieldLabel, fieldType, fieldType === "multiSelect" ? multiOptions : undefined);
    onOpenChange(false);
    setFieldLabel("");
    setFieldType("singleLine");
    setMultiOptions([{ id: "option-a", value: "Option A", color: "#FDE68A" }]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
          <DialogDescription>
            Specify a field title and type. Extra settings appear if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="fieldTitle">Field Title</Label>
          <Input
            id="fieldTitle"
            value={fieldLabel}
            autoComplete={"off"}
            onChange={(e) => setFieldLabel(e.target.value)}
          />

          <Label>Field Type</Label>
          <div className="relative">
            <select
              className="border p-1 rounded w-full"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as ColumnType)}
            >
              {columnTypeOptions.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {fieldType === "multiSelect" && (
            <div className="border rounded p-2">
              <Label className="text-sm">Options</Label>
              <div className="space-y-1 mt-1">
                {multiOptions.map((o, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <Input
                      value={o.value}
                      onChange={(e) => {
                        const arr = [...multiOptions];
                        arr[idx] = { ...arr[idx], value: e.target.value };
                        setMultiOptions(arr);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMultiOptions((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = `option-${Date.now()}`;
                    const newColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
                    setMultiOptions((prev) => [...prev, { id: newId, value: "New Option", color: newColor }]);
                  }}
                  className="mt-1"
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSubmit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
