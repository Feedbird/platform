import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { Table as ReactTableType } from "@tanstack/react-table";
import { UserColumn, ColumnType } from "@/lib/store";
import { buildColumnsPayloadForOrder } from "./utils";

export interface InlineEditFieldPanelProps {
  // Panel state
  editFieldOpen: boolean;
  editFieldPanelPos: { top: number; left: number; align: "left" | "right" } | null;
  editFieldPanelRef: React.RefObject<HTMLDivElement | null>;
  
  // Field data
  editFieldColumnId: string | null;
  editFieldType: string;
  editFieldTypeOpen: boolean;
  editFieldOptions: Array<{ id: string; value: string; color: string }>;
  newFieldLabel: string;
  
  // Column data
  userColumns: UserColumn[];
  columnNames: Record<string, string>;
  
  // Setters
  setEditFieldOpen: (open: boolean) => void;
  setEditFieldTypeOpen: (open: boolean) => void;
  setEditFieldType: (type: string) => void;
  setEditFieldOptions: (options: Array<{ id: string; value: string; color: string }>) => void;
  setNewFieldLabel: (label: string) => void;
  setUserColumns: React.Dispatch<React.SetStateAction<UserColumn[]>>;
  setColumnNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
  // Handlers
  handleAddColumn: (name: string, type: ColumnType, options?: any) => void;
  handleOptionRemoval: (columnId: string, optionId: string) => Promise<void>;
  mapEditFieldTypeToColumnType: (type: string) => ColumnType;
  
  // Board data
  activeBoardId: string | null;
  updateBoard: (boardId: string, data: any) => void;
  table: ReactTableType<any>;
}

export function InlineEditFieldPanel({
  editFieldOpen,
  editFieldPanelPos,
  editFieldPanelRef,
  editFieldColumnId,
  editFieldType,
  editFieldTypeOpen,
  editFieldOptions,
  newFieldLabel,
  userColumns,
  columnNames,
  setEditFieldOpen,
  setEditFieldTypeOpen,
  setEditFieldType,
  setEditFieldOptions,
  setNewFieldLabel,
  setUserColumns,
  setColumnNames,
  handleAddColumn,
  handleOptionRemoval,
  mapEditFieldTypeToColumnType,
  activeBoardId,
  updateBoard,
  table,
}: InlineEditFieldPanelProps) {
  if (!editFieldOpen || !editFieldPanelPos) {
    return null;
  }

  return (
    <div
      className="absolute z-50 bg-white border border-[#E4E7EC] shadow-md rounded"
      style={{
        top: editFieldPanelPos.top,
        left: editFieldPanelPos.left,
        width: 280,
      }}
      ref={editFieldPanelRef}
    >
      <div className="p-3">
        <div className="space-y-2">
          <Label
            htmlFor="inline-edit-name"
            className="text-sm font-medium text-darkGrey"
          >
            Name
          </Label>
          {editFieldColumnId ? (
            <Input
              id="inline-edit-name"
              value={(() => {
                // For user columns, use the label; for default columns, use columnNames
                const userColumn = userColumns.find(
                  (col) => col.id === editFieldColumnId
                );
                if (userColumn) {
                  return userColumn.label;
                }
                return (
                  columnNames[editFieldColumnId] ||
                  editFieldColumnId
                );
              })()}
              onChange={(e) => {
                const newLabel = e.target.value;
                // For user columns, update the label in userColumns
                const userColumn = userColumns.find(
                  (col) => col.id === editFieldColumnId
                );
                if (userColumn) {
                  setUserColumns((prev) =>
                    prev.map((col) =>
                      col.id === editFieldColumnId
                        ? { ...col, label: newLabel }
                        : col
                    )
                  );
                } else {
                  // For default columns, update columnNames
                  setColumnNames((prev) => ({
                    ...prev,
                    [editFieldColumnId]: newLabel,
                  }));
                }
              }}
            />
          ) : (
            <Input
              id="inline-edit-name"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="New field name"
            />
          )}
          <div className="text-[12px] text-darkGrey font-normal pb-2">
            The underlying attribute names will still be visible
            on hover.
          </div>

          <Label className="text-sm font-medium text-darkGrey">
            Field type
          </Label>
          <Select
            open={editFieldTypeOpen}
            onOpenChange={setEditFieldTypeOpen}
            value={editFieldType}
            onValueChange={(v) => {
              setEditFieldType(v);
              // Clear options if changing from select type to non-select type
              if (
                (editFieldType === "Single select" ||
                  editFieldType === "Multiple select") &&
                v !== "Single select" &&
                v !== "Multiple select"
              ) {
                setEditFieldOptions([
                  {
                    id: "opt_1",
                    value: "Option A",
                    color: "#3B82F6",
                  },
                  {
                    id: "opt_2",
                    value: "Option B",
                    color: "#10B981",
                  },
                  {
                    id: "opt_3",
                    value: "Option C",
                    color: "#F59E0B",
                  },
                ]);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single line text">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/single-line-text.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Single line text</span>
                </div>
              </SelectItem>
              <SelectItem value="Long text">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/long-text.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Long text</span>
                </div>
              </SelectItem>
              <SelectItem value="Attachment">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/preview.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Attachment</span>
                </div>
              </SelectItem>
              <SelectItem value="Checkbox">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/approve.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Checkbox</span>
                </div>
              </SelectItem>
              <SelectItem value="Single select">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/format.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Single select</span>
                </div>
              </SelectItem>
              <SelectItem value="Multiple select">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/status.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Multiple select</span>
                </div>
              </SelectItem>
              <SelectItem value="Calendar">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/post-time.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Calendar</span>
                </div>
              </SelectItem>
              <SelectItem value="Setting">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/settings.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Setting</span>
                </div>
              </SelectItem>
              <SelectItem value="social media">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/social-media.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Social media</span>
                </div>
              </SelectItem>
              <SelectItem value="Created by">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/created-by.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Created by</span>
                </div>
              </SelectItem>
              <SelectItem value="Last modified by">
                <div className="flex items-center gap-2 text-sm font-medium text-black">
                  <img
                    src="/images/columns/updated-time.svg"
                    alt="Edit field"
                    className="w-4 h-4"
                  />
                  <span>Last modified by</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options section for single select and multiple select */}
        {(editFieldType === "Single select" ||
          editFieldType === "Multiple select") && (
          <div className="mt-4">
            <Label className="text-sm font-medium text-darkGrey">
              Options
            </Label>
            <div className="space-y-2 mt-2">
              {editFieldOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: option.color }}
                      onClick={() => {
                        const input =
                          document.createElement("input");
                        input.type = "color";
                        input.value = option.color;
                        input.onchange = (e) => {
                          const target =
                            e.target as HTMLInputElement;
                          const newOptions = [
                            ...editFieldOptions,
                          ];
                          newOptions[index].color = target.value;
                          setEditFieldOptions(newOptions);
                        };
                        input.click();
                      }}
                    />
                    <Input
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...editFieldOptions];
                        newOptions[index].value = e.target.value;
                        setEditFieldOptions(newOptions);
                      }}
                      placeholder="Option value"
                      className="flex-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const optionToRemove =
                        editFieldOptions[index];
                      const newOptions = editFieldOptions.filter(
                        (_, i) => i !== index
                      );
                      setEditFieldOptions(newOptions);

                      // Handle option removal from posts if we have a column ID
                      if (editFieldColumnId && optionToRemove) {
                        await handleOptionRemoval(
                          editFieldColumnId,
                          optionToRemove.id
                        );
                      }
                    }}
                    className="px-2 py-1 h-8 w-8"
                  >
                    <XIcon size={14} />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditFieldOptions([
                    ...editFieldOptions,
                    {
                      id: "opt_" + (editFieldOptions.length + 1),
                      value: "New Option",
                      color: "#6B7280",
                    },
                  ]);
                }}
                className="w-full"
              >
                <PlusIcon size={14} className="mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            className="text-black text-sm font-medium"
            size="sm"
            onClick={() => setEditFieldOpen(false)}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-main text-white text-sm font-medium"
            size="sm"
            onClick={() => {
              if (!editFieldColumnId) {
                // plus-button flow: create new column
                const inferredType =
                  mapEditFieldTypeToColumnType(editFieldType);
                const trimmed = newFieldLabel.trim();
                if (trimmed.length === 0) {
                  toast.error("Please enter a column name");
                  return; // keep panel open
                }

                // Include options for select types
                let options;
                if (
                  inferredType === "singleSelect" ||
                  inferredType === "multiSelect"
                ) {
                  options = editFieldOptions;
                }

                handleAddColumn(trimmed, inferredType, options);
                setNewFieldLabel("");
              } else {
                // Edit existing column flow
                const inferredType =
                  mapEditFieldTypeToColumnType(editFieldType);
                // For user columns, use the label; for default columns, use columnNames
                const userColumn = userColumns.find(
                  (col) => col.id === editFieldColumnId
                );
                const trimmed = userColumn
                  ? userColumn.label
                  : columnNames[editFieldColumnId] ||
                    editFieldColumnId;

                // Find removed options by comparing with existing column options
                const existingColumn = userColumns.find(
                  (col) => col.id === editFieldColumnId
                );
                const removedOptions: string[] = [];

                if (
                  existingColumn &&
                  existingColumn.options &&
                  Array.isArray(existingColumn.options)
                ) {
                  const existingOptionIds =
                    existingColumn.options.map((opt: any) =>
                      typeof opt === "string" ? opt : opt.id
                    );
                  const newOptionIds = editFieldOptions.map(
                    (opt) => opt.id
                  );

                  removedOptions.push(
                    ...existingOptionIds.filter(
                      (id) => !newOptionIds.includes(id)
                    )
                  );
                }

                // Update the column in userColumns
                setUserColumns((prev) =>
                  prev.map((col) =>
                    col.id === editFieldColumnId
                      ? {
                          ...col,
                          label: trimmed,
                          type: inferredType,
                          options:
                            inferredType === "singleSelect" ||
                            inferredType === "multiSelect"
                              ? editFieldOptions
                              : undefined,
                        }
                      : col
                  )
                );

                // Update column names
                setColumnNames((prev) => ({
                  ...prev,
                  [editFieldColumnId]: trimmed,
                }));

                // Persist changes to the board
                if (activeBoardId) {
                  const currentOrder = table
                    .getAllLeafColumns()
                    .map((c) => c.id);
                  const updatedUserColumns = userColumns.map(
                    (col) =>
                      col.id === editFieldColumnId
                        ? {
                            ...col,
                            label: trimmed,
                            type: inferredType,
                            options:
                              inferredType === "singleSelect" ||
                              inferredType === "multiSelect"
                                ? editFieldOptions
                                : undefined,
                          }
                        : col
                  );
                  const payload = buildColumnsPayloadForOrder(
                    currentOrder,
                    updatedUserColumns
                  );
                  updateBoard(activeBoardId, {
                    columns: payload as any,
                  });

                  // Handle removed options after board update
                  if (removedOptions.length > 0) {
                    removedOptions.forEach((removedOptionId) => {
                      handleOptionRemoval(
                        editFieldColumnId,
                        removedOptionId
                      );
                    });
                  }
                }
              }
              setEditFieldOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
