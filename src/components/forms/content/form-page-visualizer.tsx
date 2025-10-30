import React from 'react';
import { CanvasFormField } from '../form-canvas';
import { useForms } from '@/contexts/forms/forms-context';
import Image from 'next/image';
import FieldRenderWrapper from '../content/field-render-wrapper';
import { PageEnding } from '../content/form-inputs';

type Props = {
  pages: CanvasFormField[][];
};

export default function FormPageVisualizer({ pages }: Props) {
  const { activeForm } = useForms();
  return (
    <div className="flex flex-col gap-16">
      {pages.map((page, pageIndex) => (
        <div key={pageIndex} className="flex flex-col">
          <div className="flex h-7 w-[85px] items-center justify-center rounded-t-[4px] bg-[#4670F9]">
            <span className="text-xs font-medium text-white">
              Page {pageIndex + 1} of {pages.length}
            </span>
          </div>

          <div
            className={`rounded-[8px] rounded-tl-none bg-white ${
              pageIndex === 0 && activeForm?.coverUrl
                ? 'border-1 border-t-0'
                : 'border-1'
            } border-elementStroke flex flex-col overflow-hidden`}
          >
            {pageIndex === 0 && activeForm?.coverUrl && (
              <div className="relative h-[160px] w-full">
                <Image
                  src={activeForm.coverUrl}
                  alt="form_cover_image"
                  width={920}
                  height={160}
                  style={{
                    objectPosition: `50% ${activeForm?.coverOffset ?? 50}%`,
                  }}
                  className="z-10 h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col p-8">
              {(() => {
                const prevPage =
                  pageIndex > 0 ? pages[pageIndex - 1] : undefined;
                const prevPageLastField = prevPage?.[prevPage.length - 1];
                return (
                  <div className="flex flex-col gap-1 pb-10">
                    <span className="text-[24px] font-semibold text-[#1C1D1F]">
                      {pageIndex === 0
                        ? activeForm?.title
                        : prevPageLastField?.config?.title?.value ||
                          `Page ${pageIndex + 1}`}
                    </span>
                    <p className="text-sm font-normal text-[#5C5E63]">
                      {pageIndex === 0
                        ? activeForm?.description
                        : prevPageLastField?.config?.description?.value || ''}
                    </p>
                  </div>
                );
              })()}
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
              <div className="flex min-h-[62px] w-full items-end">
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
