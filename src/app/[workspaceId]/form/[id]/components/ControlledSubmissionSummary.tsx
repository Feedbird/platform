import React from "react";
import { FormSubmissionData } from "../_inner";
import { Form, FormField } from "@/lib/supabase/interfaces";
import ReviewCard from "./ReviewCard";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formsApi } from "@/lib/api/api-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";

type Props = {
  formValues: FormSubmissionData;
  formData: Form & { formFields: FormField[] };
  setReviewActive: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ControlledSubmissionSummary({
  formValues,
  formData,
  setReviewActive,
}: Props) {
  const { activeWorkspaceId } = useFeedbirdStore();
  const [finalValues, setFinalValues] = React.useState(formValues);
  const router = useRouter();
  const [loading, isLoading] = React.useState<boolean>(false);

  const handleSubmitForm = async () => {
    isLoading(true);
    try {
      const schema = formData.formFields.reduce((acc, field) => {
        acc[field.id] = field.title;
        return acc;
      }, {} as Record<string, string>);

      const submission = await formsApi.submitForm({
        workspaceId: formData.workspace_id,
        formId: formData.id,
        submissions: finalValues,
        schema,
      });

      if (submission.data) {
        toast.success("Form submitted successfully! Thank you.");
        router.push(`/${activeWorkspaceId}`);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      toast.error("Failed to submit form. Please try again later.");
    } finally {
      isLoading(false);
    }
  };
  return (
    <div className="flex flex-col p-6 gap-2 border-1 rounded-[8px] border-elementStroke bg-white">
      {Object.keys(finalValues).map((key, index) => {
        const field = formData.formFields.find((f) => f.id === key);
        if (!field) return null;

        if (field.type === "page-break" || field.type === "section-break")
          return null;
        const value =
          field.type === "attachment"
            ? (finalValues[key].value as File).name
            : finalValues[key].value;
        return (
          <ReviewCard
            key={`review-card-${key}`}
            title={field.title}
            value={value as string | string[]}
            index={index + 1}
          />
        );
      })}
      <div className="p-3 flex flex-row items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setReviewActive(false)}
          className="hover:cursor-pointer border-1 border-[#D3D3D3] radius-[6px]"
        >
          Back
        </Button>
        <Button
          variant="default"
          onClick={handleSubmitForm}
          className="shadow-md bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5 border-1 border-black/10 flex flex-row"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              Submit Questionnaire
              <ChevronRight />
            </>
          )}
        </Button>
      </div>
      <div className="px-3 py-6">
        <Image
          src="/images/logo/logo.png"
          alt="feedbird_logo"
          width={87}
          height={14}
        />
      </div>
    </div>
  );
}
