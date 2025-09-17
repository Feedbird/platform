"use client";
import FieldRenderWrapper from "@/components/forms/content/FieldRenderWrapper";
import { PageEnding } from "@/components/forms/content/FormInputs";
import { CanvasFormField } from "@/components/forms/FormCanvas";
import { useFormEditor } from "@/contexts/FormEditorContext";
import { useForms } from "@/contexts/FormsContext";
import { Divider } from "@mui/material";
import Image from "next/image";
import React from "react";

export default function Page() {
  const { activeForm, setIsPreview } = useForms();
  const { formFields } = useFormEditor();

  const [pages, setPages] = React.useState<CanvasFormField[][]>([]);

  React.useEffect(() => {
    setIsPreview(true);

    const tempPages: CanvasFormField[][] = [[]];
    for (const field of formFields.sort((a, b) => a.position - b.position)) {
      if (field.type === "page-break") {
        tempPages[tempPages.length - 1].push(field);
        tempPages.push([]);
      } else {
        tempPages[tempPages.length - 1].push(field);
      }
    }
    setPages(tempPages);
    return () => setIsPreview(false);
  }, []);

  return (
    <div className="h-full overflow-auto bg-[#FBFBFB]">
      <div className="w-full h-9 bg-[#EDF6FF] grid items-center justify-center border-1 border-[#EAE9E9]">
        <span className="text-[#133495] font-medium text-sm">
          This is a preview
        </span>
      </div>
      <div className="flex justify-center p-5 pb-12">
        <div className="w-full max-w-[900px] flex flex-col gap-5">
          <div className="flex flex-col p-3 gap-2 px-6 py-3">
            <span className="font-semibold text-[18px] text-[#1C1D1F]">
              Onboarding Questionnaire
            </span>
            <div className="flex flex-col gap-1.5">
              {activeForm?.services?.map((service, index) => (
                <div className="flex flex-row gap-3 text-sm text-[#5C5E63] font-normal">
                  <p className="min-w-[170px]">{service.name}</p>
                  <Divider orientation="vertical" />
                  <p>
                    Quantity: {service.quantity} {service.qty_indicator} - $
                    {service.pricing}/mo
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-16">
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} className="flex flex-col">
                <div className="rounded-t-[4px] bg-[#4670F9] h-7 w-[85px] flex items-center justify-center">
                  <span className="text-white font-medium text-xs">
                    Page {pageIndex + 1} of {pages.length}
                  </span>
                </div>

                <div className="rounded-[8px] bg-white rounded-tl-none border-1 border-[#EAE9E9] flex flex-col overflow-hidden">
                  {pageIndex === 0 && activeForm?.cover_url && (
                    <div className="w-full relative h-[160px]">
                      <Image
                        src={activeForm.cover_url}
                        alt="form_cover_image"
                        width={920}
                        height={160}
                        className="w-full h-full object-cover object-top z-10"
                      />
                    </div>
                  )}
                  <div className="flex flex-col p-8">
                    <div className="flex flex-col gap-1 pb-10">
                      <span className="text-[24px] font-semibold text-[#1C1D1F]">
                        {pageIndex === 0
                          ? activeForm?.title
                          : pages[pageIndex - 1][
                              pages[pageIndex - 1].length - 1
                            ]?.config.title.value || `Page ${pageIndex + 1}`}
                      </span>
                      <p className="font-normal text-[#5C5E63] text-sm">
                        {pageIndex === 0
                          ? activeForm?.description
                          : pages[pageIndex - 1][
                              pages[pageIndex - 1].length - 1
                            ]?.config.description.value || ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-6">
                      {page.map((field, index) => (
                        <FieldRenderWrapper
                          pageNumber={pageIndex + 1}
                          isPreview={true}
                          key={`${pageIndex}-${index}`}
                          type={field.type}
                          config={field.config}
                        />
                      ))}
                    </div>
                    {pageIndex === pages.length - 1 && (
                      <PageEnding pages={pages.length} />
                    )}
                    <div className="min-h-[62px] w-full flex items-end">
                      <Image
                        src="/images/logo/logo(1).svg"
                        alt="feedbird_logo"
                        width={87}
                        height={14}
                        className="h-3.5"
                      />
                    </div>
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
