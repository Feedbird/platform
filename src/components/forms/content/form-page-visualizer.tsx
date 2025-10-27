import React from "react";
import { CanvasFormField } from "../form-canvas";
import { useForms } from "@/contexts/forms-context";
import Image from "next/image";
import FieldRenderWrapper from "./field-render-wrapper";
import { PageEnding } from "./form-inputs";

type Props = {
  pages: CanvasFormField[][];
};

export default function FormPageVisualizer({ pages }: Props) {
  const { activeForm } = useForms();
  return (
    <div className="flex flex-col gap-16">
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="flex flex-col">
          <div className="rounded-t-[4px] bg-[#4670F9] h-7 w-[85px] flex items-center justify-center">
            <span className="text-white font-medium text-xs">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>

          <div
            className={`rounded-[8px] bg-white rounded-tl-none ${
              pageIndex === 0 && activeForm?.coverUrl
                ? "border-1 border-t-0"
                : "border-1"
            } border-elementStroke flex flex-col overflow-hidden`}
          >
            {pageIndex === 0 && activeForm?.coverUrl && (
              <div className="w-full relative h-[160px]">
                <Image
                  src={activeForm.coverUrl}
                  alt="form_cover_image"
                  width={920}
                  height={160}
                  style={{
                    objectPosition: `50% ${activeForm?.coverOffset ?? 50}%`,
                  }}
                  className="w-full h-full object-cover z-10"
                />
              </div>
            )}
            <div className="flex flex-col p-8">
              <div className="flex flex-col gap-1 pb-10">
                <span className="text-[24px] font-semibold text-[#1C1D1F]">
                  {pageIndex === 0
                    ? activeForm?.title
                    : pages[pageIndex - 1][pages[pageIndex - 1].length - 1]
                        ?.config.title.value || `Page ${pageIndex + 1}`}
                </span>
                <p className="font-normal text-[#5C5E63] text-sm">
                  {pageIndex === 0
                    ? activeForm?.description
                    : pages[pageIndex - 1][pages[pageIndex - 1].length - 1]
                        ?.config.description.value || ""}
                </p>
              </div>
              <div className="space-y-8">
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
  );
}
