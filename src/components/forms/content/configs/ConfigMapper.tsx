import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UIFormField } from "@/lib/forms/fields";

export function configInputMapper(
  field: UIFormField
): (() => React.JSX.Element)[] {
  if (!field || !field.config) return [];

  console.log(field);
  const keys = Object.keys(field.config);
  const elements: (() => React.JSX.Element)[] = [];

  for (const element of keys) {
    switch (element) {
      case "title":
        elements.push(() => (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[#5C5E63] text-sm font-normal ">Title</label>
            <Input
              value={field.label}
              className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[36px] bg-white"
            />
          </div>
        ));
        break;
      case "placeholder":
        elements.push(() => (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[#5C5E63] text-sm font-normal ">
              Placeholder
            </label>
            <Input className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[36px] bg-white" />
          </div>
        ));
        break;
      case "description":
        elements.push(() => (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-row gap-1 items-center">
              <label className="text-[#5C5E63] text-sm font-normal ">
                Description
              </label>
              <p className="text-[#838488] font-light text-xs">(Optional)</p>
            </div>
            <Textarea className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 text-[#1C1D1F] min-h-[56px] bg-white" />
          </div>
        ));
        break;
      case "isRequired":
        elements.push(() => (
          <div className="flex flex-row justify-between w-full">
            <span className="text-[#5C5E63] text-sm font-normal">
              Required field
            </span>
            <Switch className="data-[state=checked]:bg-[#4670F9] cursor-pointer" />
          </div>
        ));
        break;
      case "allowMultipleSelection":
        elements.push(() => (
          <div className="flex flex-row justify-between w-full">
            <span className="text-[#5C5E63] text-sm font-normal">
              Allow multiple selections
            </span>
            <Switch className="data-[state=checked]:bg-[#4670F9] cursor-pointer" />
          </div>
        ));
        break;
      case "defaultOption":
        elements.push(() => (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-row gap-1 items-center">
              <label className="text-[#5C5E63] text-sm font-normal ">
                Default option
              </label>
            </div>
            <Select>
              <SelectTrigger className="border-1 border-[#D3D3D3] rounded-[6px] px-2.5 py-2 w-full text-[#1C1D1F] min-h-[36px] bg-white"></SelectTrigger>
              <SelectContent>
                <SelectItem value="something">Something</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ));
        break;
      case "optionItems":
        elements.push(() => (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[#5C5E63] text-sm font-normal ">Items</label>
            <p>...Under construction</p>
          </div>
        ));
    }
  }

  return elements;
}
