import { formsApi } from "@/lib/api/api-service";
import FormInnerVisualizer from "./_inner";
import ServiceSelector from "@/components/forms/content/ServiceSelector";
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
        <FormInnerVisualizer form={data} />
      </div>
    </div>
  );
}
