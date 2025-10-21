import { Form, FormField } from "@/lib/supabase/interfaces";
import Image from "next/image";
import React from "react";
import InputRender from "../controlled/InputRender";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { FormSubmissionData } from "../_inner";
import { toast } from "sonner";

type Props = {
  pages: FormField[][];
  currentPage: number;
  formData: Form & { formFields: FormField[] };
  formValues: FormSubmissionData;
  setReviewActive: React.Dispatch<React.SetStateAction<boolean>>;
  setFormValues: React.Dispatch<React.SetStateAction<FormSubmissionData>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function ControlledPageVisualizer({
  pages,
  currentPage,
  formData,
  formValues,
  setReviewActive,
  setFormValues,
  setCurrentPage,
}: Props) {
  const handleActivateReview = async () => {
    // Verify required fields
    const requiredFieldIds = formData.formFields
      .filter((f) => f.config.isRequired?.value)
      .map((f) => f.id);
    for (const fieldId of requiredFieldIds) {
      const localValue = formValues[fieldId]?.value;
      if (
        localValue === "" ||
        (Array.isArray(localValue) && localValue.length === 0)
      ) {
        toast.warning("Please fill all required fields before submitting.");
        return;
      }
    }
    setReviewActive(true);
  };
  return (
    <div className="flex flex-col gap-16 relative">
      {pages.map((page, pageIndex) => (
        <div
          key={`page-${pageIndex}`}
          className={`rounded-[8px] ${
            currentPage === pageIndex ? "block" : "hidden"
          } bg-white border-1 border-elementStroke flex flex-col overflow-hidden`}
        >
          {pageIndex === 0 && formData?.cover_url && (
            <div className="w-full relative h-[160px]">
              <Image
                src={formData.cover_url}
                alt="form_cover_image"
                width={920}
                height={160}
                style={{
                  objectPosition: `50% ${formData?.cover_offset ?? 50}%`,
                }}
                className="w-full h-full object-cover z-10"
              />
            </div>
          )}
          <div className="flex flex-col p-8">
            <div className="flex flex-col gap-1 pb-10">
              <span className="text-[24px] font-semibold text-black">
                {pageIndex === 0
                  ? formData?.title
                  : pages[pageIndex - 1][pages[pageIndex - 1].length - 1]
                      ?.config.title.value || `Page ${pageIndex + 1}`}
              </span>
              <p className="font-normal text-[#5C5E63] text-sm">
                {pageIndex === 0
                  ? formData?.description
                  : pages[pageIndex - 1][pages[pageIndex - 1].length - 1]
                      ?.config.description.value || ""}
              </p>
            </div>
            <InputRender
              parent={formValues}
              key={`fields-page-${pageIndex}`}
              setParent={setFormValues}
              fields={page}
            />

            <div className="flex flex-row justify-between mt-6">
              {pages.length > 1 && (
                <>
                  {currentPage > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="hover:cursor-pointer border-1 border-[#D3D3D3] radius-[6px]"
                    >
                      Back
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  {currentPage < pages.length - 1 && (
                    <Button
                      variant="default"
                      onClick={(e) => setCurrentPage((prev) => prev + 1)}
                      className="shadow-md bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5 border-1 border-black/10 flex flex-row"
                    >
                      Next
                      <ChevronRight />
                    </Button>
                  )}
                </>
              )}
              {currentPage === pages.length - 1 && (
                <>
                  <div></div>
                  <Button
                    variant="default"
                    onClick={handleActivateReview}
                    className="shadow-md bg-[#4670F9] rounded-[6px] text-white cursor-pointer px-3 py-1.5 border-1 border-black/10 flex flex-row"
                  >
                    Review
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
