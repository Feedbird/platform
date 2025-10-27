import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ComplexObjectType } from "@/lib/forms/field.config";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import React from "react";
import DraggableItems, { DraggableItemType } from "./draggable-items";

export function TitleInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[#5C5E63] text-sm font-normal">Title</label>
      <Input
        value={fieldConfig.title?.value as string}
        onChange={(e) =>
          setFieldConfig({
            ...fieldConfig,
            title: {
              ...(fieldConfig.title || {}),
              value: e.target.value,
            },
          })
        }
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-black min-h-[36px] bg-white"
      />
    </div>
  );
}

export function DescriptionInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-row gap-1 items-center">
        <label className="text-[#5C5E63] text-sm font-normal">
          Description
        </label>
        <p className="text-[#838488] font-light text-xs">(Optional)</p>
      </div>
      <Textarea
        value={(fieldConfig.description?.value as string) || ""}
        onChange={(e) =>
          setFieldConfig({
            ...fieldConfig,
            description: {
              ...(fieldConfig.description || {}),
              value: e.target.value,
            },
          })
        }
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-black min-h-[56px] bg-white"
      />
    </div>
  );
}

export function PlaceholderInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[#5C5E63] text-sm font-normal ">Placeholder</label>
      <Input
        value={fieldConfig.placeholder?.value || ""}
        onChange={(e) =>
          setFieldConfig({
            ...fieldConfig,
            placeholder: {
              ...(fieldConfig.placeholder || {}),
              value: e.target.value,
            },
          })
        }
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-black min-h-[36px] bg-white"
      />
    </div>
  );
}

export function RequiredInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-row justify-between w-full">
      <span className="text-[#5C5E63] text-sm font-normal">Required field</span>
      <Switch
        checked={fieldConfig.isRequired?.value || false}
        onCheckedChange={(checked) =>
          setFieldConfig({
            ...fieldConfig,
            isRequired: {
              ...(fieldConfig.isRequired || {}),
              value: checked,
            },
          })
        }
        className="data-[state=checked]:bg-[#4670F9] cursor-pointer"
      />
    </div>
  );
}

export function AllowMultipleSelectionInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-row justify-between w-full">
      <span className="text-[#5C5E63] text-sm font-normal">
        Allow multiple selections
      </span>
      <Switch
        checked={fieldConfig.allowMultipleSelection?.value || false}
        onCheckedChange={(checked) =>
          setFieldConfig({
            ...fieldConfig,
            allowMultipleSelection: {
              ...(fieldConfig.allowMultipleSelection || {}),
              value: checked,
            },
          })
        }
        className="data-[state=checked]:bg-[#4670F9] cursor-pointer"
      />
    </div>
  );
}

export function HelpTextInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-row gap-1 items-center">
        <label className="text-[#5C5E63] text-sm font-normal ">Help Text</label>
        <p className="text-[#838488] font-light text-xs">(Optional)</p>
      </div>
      <Input
        value={fieldConfig.helpText?.value as string}
        onChange={(e) =>
          setFieldConfig({
            ...fieldConfig,
            helpText: {
              ...(fieldConfig.helpText || {}),
              value: e.target.value,
            },
          })
        }
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-black min-h-[36px] bg-white"
      />
    </div>
  );
}

const normalizeItemOrders = (itemsArray: ComplexObjectType[]) => {
  return itemsArray.map((item, index) => ({
    ...item,
    order: index,
  }));
};

export function DropdownItemsInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  const [items, setItems] = React.useState<ComplexObjectType[]>(
    fieldConfig.dropdownItems?.dropdownValues || []
  );

  // Normalize orders when component initializes to fix any existing gaps
  React.useEffect(() => {
    const initialItems: ComplexObjectType[] =
      fieldConfig.dropdownItems?.dropdownValues || [];
    if (initialItems.length > 0) {
      const normalizedItems = normalizeItemOrders(initialItems);

      // Only update if there were gaps in the orders
      const hasGaps = initialItems.some(
        (item: ComplexObjectType, index: number) => item.order !== index
      );
      if (hasGaps) {
        setItems(normalizedItems);
        setFieldConfig({
          ...fieldConfig,
          dropdownItems: {
            ...(fieldConfig.dropdownItems || {}),
            dropdownValues: normalizedItems,
          },
        });
      } else {
        setItems(initialItems);
      }
    }
  }, []);

  const handleItemDeletion = (order: number) => {
    const filteredItems = items.filter((item, index) => index !== order);
    const reindexedItems = normalizeItemOrders(filteredItems);

    setItems(reindexedItems);
    setFieldConfig({
      ...fieldConfig,
      dropdownItems: {
        ...(fieldConfig.dropdownItems || {}),
        dropdownValues: reindexedItems,
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Find the old and new positions
    const oldIndex = items.findIndex((item) => item.value === active.id);
    const newIndex = items.findIndex((item) => item.value === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder the array
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      const normalizedItems = normalizeItemOrders(reorderedItems);

      setItems(normalizedItems);
      setFieldConfig({
        ...fieldConfig,
        dropdownItems: {
          ...(fieldConfig.dropdownItems || {}),
          dropdownValues: normalizedItems,
        },
      });
    }
  };

  const handleSingleItemValueChange = (order: number, val: string) => {
    const newItems = items.map((item, index) =>
      index === order ? { ...item, value: val } : item
    );
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      dropdownItems: {
        ...(fieldConfig.dropdownItems || {}),
        dropdownValues: newItems,
      },
    });
  };

  const handleCreateItem = () => {
    // Find the next available option number to avoid duplicates
    const existingNumbers = items
      .map((item) => {
        const match = item.value.match(/^Option (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const newItem: ComplexObjectType = {
      value: `Option ${nextNumber}`,
      order: items.length,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      dropdownItems: {
        ...(fieldConfig.dropdownItems || {}),
        dropdownValues: newItems,
      },
    });
  };

  return (
    <DraggableItems
      items={items}
      addText="+Add Option"
      handleCreateItem={handleCreateItem}
      handleDragEnd={handleDragEnd}
      handleItemDeletion={handleItemDeletion}
      handleSingleItemValueChange={handleSingleItemValueChange}
    />
  );
}

export function RowsSelectInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex flex-row gap-1 items-center">
        <label className="text-[#5C5E63] text-sm font-normal ">
          How many rows to allow?
        </label>
      </div>
      <Input
        value={fieldConfig.allowedRows?.value || 0}
        onChange={(e) =>
          setFieldConfig({
            ...fieldConfig,
            allowedRows: {
              ...(fieldConfig.allowedRows || {}),
              value: parseInt(e.target.value, 10) || 0,
            },
          })
        }
        type="number"
        className="bg-white rounded-[6px] border-1 border-[#D3D3D3]"
      />
      <p className="text-xs font-normal text-[#838488]">
        Initial number of rows matches purchased quantity, user can add more
        rows if needed.
      </p>
    </div>
  );
}

export function ColumnSelectInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  const [items, setItems] = React.useState<DraggableItemType[]>(
    fieldConfig.spreadsheetColumns?.columns || []
  );

  React.useEffect(() => {
    const initialItems: DraggableItemType[] =
      fieldConfig.spreadsheetColumns?.columns || [];
    if (initialItems.length > 0) {
      const normalizedItems = normalizeItemOrders(initialItems);

      const hasGaps = initialItems.some(
        (item: DraggableItemType, index: number) => item.order !== index
      );
      if (hasGaps) {
        setItems(normalizedItems);
        setFieldConfig({
          ...fieldConfig,
          spreadsheetColumns: {
            ...(fieldConfig.spreadsheetColumns || {}),
            columns: normalizedItems,
          },
        });
      } else {
        setItems(initialItems);
      }
    }
  }, []);

  const handleItemDeletion = (order: number) => {
    const filteredItems = items.filter((item, index) => index !== order);
    const reindexedItems = normalizeItemOrders(filteredItems);

    setItems(reindexedItems);
    setFieldConfig({
      ...fieldConfig,
      spreadsheetColumns: {
        ...(fieldConfig.spreadsheetColumns || {}),
        columns: reindexedItems,
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.value === active.id);
    const newIndex = items.findIndex((item) => item.value === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      const normalizedItems = normalizeItemOrders(reorderedItems);

      setItems(normalizedItems);
      setFieldConfig({
        ...fieldConfig,
        spreadsheetColumns: {
          ...(fieldConfig.spreadsheetColumns || {}),
          columns: normalizedItems,
        },
      });
    }
  };

  const handleSingleItemValueChange = (order: number, val: string) => {
    const newItems = items.map((item, index) =>
      index === order ? { ...item, value: val } : item
    );
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      spreadsheetColumns: {
        ...(fieldConfig.spreadsheetColumns || {}),
        columns: newItems,
      },
    });
  };

  const handleCreateItem = () => {
    // Find the next available option number to avoid duplicates
    const existingNumbers = items
      .map((item) => {
        const match = item.value.match(/^Option (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const newItem: ComplexObjectType = {
      value: `Option ${nextNumber}`,
      order: items.length,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      spreadsheetColumns: {
        ...(fieldConfig.spreadsheetColumns || {}),
        columns: newItems,
      },
    });
  };

  return (
    <DraggableItems
      addText="+Add Column"
      items={items}
      handleCreateItem={handleCreateItem}
      handleDragEnd={handleDragEnd}
      handleItemDeletion={handleItemDeletion}
      handleSingleItemValueChange={handleSingleItemValueChange}
    />
  );
}

export function OptionSelectInput({
  fieldConfig,
  setFieldConfig,
}: {
  fieldConfig: any;
  setFieldConfig: (config: any) => void;
}) {
  const [items, setItems] = React.useState<DraggableItemType[]>(
    fieldConfig.optionItems?.optionValues || []
  );

  React.useEffect(() => {
    const initialItems: DraggableItemType[] =
      fieldConfig.optionItems?.optionValues || [];
    if (initialItems.length > 0) {
      const normalizedItems = normalizeItemOrders(initialItems);

      const hasGaps = initialItems.some(
        (item: DraggableItemType, index: number) => item.order !== index
      );
      if (hasGaps) {
        setItems(normalizedItems);
        setFieldConfig({
          ...fieldConfig,
          optionItems: {
            ...(fieldConfig.optionItems || {}),
            optionValues: normalizedItems,
          },
        });
      } else {
        setItems(initialItems);
      }
    }
  }, []);

  const handleItemDeletion = (order: number) => {
    const filteredItems = items.filter((item, index) => index !== order);
    const reindexedItems = normalizeItemOrders(filteredItems);

    setItems(reindexedItems);
    setFieldConfig({
      ...fieldConfig,
      optionItems: {
        ...(fieldConfig.optionItems || {}),
        optionValues: reindexedItems,
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.value === active.id);
    const newIndex = items.findIndex((item) => item.value === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      const normalizedItems = normalizeItemOrders(reorderedItems);

      setItems(normalizedItems);
      setFieldConfig({
        ...fieldConfig,
        optionItems: {
          ...(fieldConfig.optionItems || {}),
          optionValues: normalizedItems,
        },
      });
    }
  };

  const handleCreateItem = () => {
    // Find the next available option number to avoid duplicates
    const existingNumbers = items
      .map((item) => {
        const match = item.value.match(/^Option (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const newItem: DraggableItemType = {
      value: `Option ${nextNumber}`,
      order: items.length,
      image: "",
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      optionItems: {
        ...(fieldConfig.optionItems || {}),
        optionValues: newItems,
      },
    });
  };

  const handleSingleItemValueChange = (
    order: number,
    val: string,
    image?: string
  ) => {
    const newItems = items.map((item, index) =>
      index === order
        ? { ...item, value: val, ...(image !== undefined ? { image } : {}) }
        : item
    );
    setItems(newItems);
    setFieldConfig({
      ...fieldConfig,
      optionItems: {
        ...(fieldConfig.optionItems || {}),
        optionValues: newItems,
      },
    });
  };
  return (
    <DraggableItems
      items={items}
      isOptionConfig={true}
      addText="+Add Option"
      handleCreateItem={handleCreateItem}
      handleDragEnd={handleDragEnd}
      handleItemDeletion={handleItemDeletion}
      handleSingleItemValueChange={handleSingleItemValueChange}
    />
  );
}
