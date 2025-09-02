import { formsApi } from "@/lib/api/api-service";
import FormInnerVisualizer from "./_inner";
export default async function FormVisualizer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const extractedParams = await params;
  const { data } = await formsApi.getFormById(extractedParams.id);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full flex min-h-[400px]">
        <FormInnerVisualizer form={data} />
      </div>
    </div>
  );
}
