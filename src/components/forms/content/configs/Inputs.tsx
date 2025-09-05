import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ComplexObjectType } from "@/lib/forms/field.config";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import React from "react";
import ItemCard from "./ItemCard";

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
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[36px] bg-white"
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
        <label className="text-[#5C5E63] text-sm font-normal ">
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
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[56px] bg-white"
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
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[36px] bg-white"
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
        value={fieldConfig.isRequired?.value || false}
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
        value={fieldConfig.allowMultipleSelection?.value || false}
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
        className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[36px] bg-white"
      />
    </div>
  );
}

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

  // Helper function to normalize order values based on array index
  const normalizeItemOrders = (itemsArray: ComplexObjectType[]) => {
    return itemsArray.map((item, index) => ({
      ...item,
      order: index,
    }));
  };

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

  const itemsIds = items.map((item) => item.value);

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
    const newItem: ComplexObjectType = {
      value: `Option ${items.length + 1}`,
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
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[#5C5E63] text-sm font-normal ">Items</label>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={itemsIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <ItemCard
                handleDelete={handleItemDeletion}
                key={item.order + 1}
                order={index}
                setValue={handleSingleItemValueChange}
                value={item.value}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <span
        className="text-[#4670F9] font-medium text-sm mt-1 hover:underline cursor-pointer"
        onClick={handleCreateItem}
      >
        +Add Option
      </span>
    </div>
  );
}

// TODO is this relevant ? Ask to UX
// export function DefaultValueInput({
//   fieldConfig,
//   setFieldConfig,
// }: {
//   fieldConfig: any;
//   setFieldConfig: (config: any) => void;
// }) {
//   const values = React.useMemo(() => fieldConfig.defaultValue?.value, [fieldConfig]);
//   const [value, setValue] = React.useState()
//   return ()
// }
