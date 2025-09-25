"use client";
import { Form, FormField } from "@/lib/supabase/client";
import { formFieldSorter } from "@/lib/utils/transformers";
import React from "react";
import Loading from "./loading";
import { Divider } from "@mui/material";
import Image from "next/image";
import InputRender from "./controlled/InputRender";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Props = {
  formData?: Form & { formFields: FormField[] };
};

export type FormSubmissionData = {
  [key: string]: { type: string; value: string | string[] | File };
};

const formValueInitializer = (field: FormField) => {
  let value: string | string[] = "";
  switch (field.type) {
    case "checkbox":
      value = "no";
      break;
    case "option":
      if (field.config.allowMultipleSelection?.value) {
        value = [];
      } else value = "";
      break;
    case "spreadsheet":
      const columns = field.config.spreadsheetColumns?.columns
        .map((col: { order: number; value: string }) => col.value)
        .join("|");
      value = [columns];
      break;
    default:
      value = "";
  }

  return { type: field.type, value };
};

export default function SubmitFormVisualizer({ formData }: Props) {
  const [pages, setPages] = React.useState<FormField[][]>([]);
  const [formValues, setFormValues] = React.useState<FormSubmissionData>(
    {} as FormSubmissionData
  );
  const [currentPage, setCurrentPage] = React.useState<number>(0);

  const initializeFormValues = (fields: FormField[]) => {
    const initialMap = {} as FormSubmissionData;
    fields.forEach((field) => {
      initialMap[field.id] = formValueInitializer(field);
    });
    setFormValues(initialMap);
  };

  React.useEffect(() => {
    const tempPages: FormField[][] = [[]];
    const formFields = formData?.formFields || [];
    for (const field of formFields.sort(formFieldSorter)) {
      if (field.type === "page-break") {
        tempPages[tempPages.length - 1].push(field);
        tempPages.push([]);
      } else {
        tempPages[tempPages.length - 1].push(field);
      }
    }
    setPages(tempPages);
    initializeFormValues(formFields);
  }, [formData]);

  if (!formData) {
    return <Loading />;
  }

  const handleReviewSubmit = () => {
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
  };

  console.log(`Form being filled with: `, formValues);

  return (
    <div className="h-full overflow-auto bg-[#FBFBFB] w-full">
      <div className="w-full h-9 bg-[#EDF6FF] grid items-center justify-center border-1 border-[#EAE9E9]">
        <span className="text-[#133495] font-medium text-sm">
          This is a dev preview of the form submission
        </span>
      </div>
      <div className="flex justify-center p-5 pb-12">
        <div className="w-full max-w-[900px] flex flex-col gap-5">
          <div className="flex flex-col pr-3 pl-0 py-3 gap-2">
            <span className="font-semibold text-[18px] text-[#1C1D1F]">
              Onboarding Questionnaire
            </span>
            <div className="flex flex-col gap-1.5">
              {formData?.services?.map((service, index) => (
                <div
                  key={index}
                  className="flex flex-row gap-3 text-sm text-[#5C5E63] font-normal"
                >
                  <p className="min-w-[170px]">{service.name}</p>
                  <Divider orientation="vertical" />
                  <p>
                    Quantity: {service.service_plans?.[0]?.quantity ?? 0}{" "}
                    {service.service_plans?.[0]?.qty_indicator ?? "Not set"} - $
                    {service.service_plans?.[0]?.price ?? 0}/mo
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-16 relative">
            {pages.map((page, pageIndex) => (
              <div
                key={`page-${pageIndex}`}
                className={`rounded-[8px] ${
                  currentPage === pageIndex ? "block" : "hidden"
                } bg-white border-1 border-[#EAE9E9] flex flex-col overflow-hidden`}
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
                    <span className="text-[24px] font-semibold text-[#1C1D1F]">
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
                          onClick={handleReviewSubmit}
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
        </div>
      </div>
    </div>
  );
}
