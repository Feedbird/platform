import { formsApi } from "@/lib/api/api-service";
import FormInnerVisualizer from "./_inner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
export default async function FormVisualizer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const extractedParams = await params;
  const { data } = await formsApi.getFormById(extractedParams.id);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="max-w-[820px] w-full flex flex-col min-h-[400px] mt-4 gap-6">
        <header className="flex flex-col gap-5">
          <div className="p-4 rounded-[5px] border-1 border-[#D3D3D3] flex flex-col gap-2.5">
            <div className="flex flex-col">
              <span className="text-[#1C1D1F] font-medium text-base">
                Select Service
              </span>
              <p className="text-[13px] text-[#5C5E63]">
                Clients get access to this form after buying your service. Their
                order will remain Pending until the form is filled out.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#1C1D1F] font-medium">
                Choose Services
              </span>
              <div className="flex flex-row justify-between w-full">
                <Select>
                  <SelectTrigger className="w-1/2">
                    Select service form
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Service1">Service 1</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-[#4670F9] rounded-[6px] py-1.5 px-3 text-white text-[13px] flex flex-row hover:cursor-pointer">
                  Save
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-col not-visited:gap-1">
            <h1 className="text-black font-semibold">Intake Form</h1>
            <p className="text-gray-500 text-xs">
              Clients get access to this form after buying your service. Their
              order will remain Pending until the form is filled out.
            </p>
          </div>
        </header>

        <FormInnerVisualizer form={data} />
      </div>
    </div>
  );
}
