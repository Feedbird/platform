'use client';
import { Form, FormField } from '@/lib/store/types';
import { formFieldSorter, mapPeriodicity } from '@/lib/utils/transformers';
import React from 'react';
import Loading from './loading';
import { Divider } from '@mui/material';
import ControlledPageVisualizer from './components/controlled-page-visualizer';
import ControlledSubmissionSummary from './components/controlled-submission-summary';
import { CanvasFormField } from '@/components/forms/form-canvas';

type Props = {
  formData: Form & { formFields: FormField[] };
};

export type FormSubmissionData = {
  [key: string]: { type: string; value: string | string[] | File };
};

const formValueInitializer = (field: FormField) => {
  let value: string | string[] = '';
  switch (field.type) {
    case 'checkbox':
      value = 'no';
      break;
    case 'option':
      if (field.config?.allowMultipleSelection?.value) {
        value = [];
      } else value = '';
      break;
    case 'spreadsheet':
      const columns = field.config?.spreadsheetColumns?.columns
        .map((col: { order: number; value: string }) => col.value)
        .join('|');
      value = [columns || ''];
      break;
    default:
      value = '';
  }

  return { type: field.type, value };
};

export default function SubmitFormVisualizer({ formData }: Props) {
  const [pages, setPages] = React.useState<FormField[][]>([]);
  const [formValues, setFormValues] = React.useState<FormSubmissionData>(
    {} as FormSubmissionData
  );
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [reviewActive, setReviewActive] = React.useState<boolean>(false);
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
      if (field.type === 'page-break') {
        tempPages[tempPages.length - 1].push(field);
        tempPages.push([]);
      } else {
        tempPages[tempPages.length - 1].push(field);
      }
    }
    setPages(tempPages);
    initializeFormValues(formFields);
  }, [formData]);

  React.useEffect(() => {
    return () => {
      setFormValues({} as FormSubmissionData);
      setPages([]);
      setCurrentPage(0);
      setReviewActive(false);
    };
  }, []);

  if (!formData) {
    return <Loading />;
  }

  return (
    <div className="h-full w-full overflow-auto bg-[#FBFBFB]">
      <div className="flex justify-center p-5 pb-12">
        {!reviewActive ? (
          <div className="flex w-full max-w-[900px] flex-col gap-5">
            <div className="flex flex-col gap-2 py-3 pr-3 pl-0">
              <span className="text-[18px] font-semibold text-[#1C1D1F]">
                Onboarding Questionnaire
              </span>
              <div className="flex flex-col gap-1.5">
                {formData?.services?.map((service, index) => (
                  <div
                    key={index}
                    className="flex flex-row gap-3 text-sm font-normal text-[#5C5E63]"
                  >
                    <p className="min-w-[170px]">{service.name}</p>
                    <Divider orientation="vertical" />
                    {service.service_plans &&
                      service.service_plans.length &&
                      service.service_plans.map((plan, planIndex) => (
                        <div
                          className="flex flex-col gap-2"
                          key={`plan-${planIndex}`}
                        >
                          <div className="flex gap-1">
                            <span>{plan.value}</span>
                            {' - '}
                            <span>
                              ${plan.price} /{' '}
                              {mapPeriodicity(plan.billing_period)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            <ControlledPageVisualizer
              pages={pages}
              formData={formData}
              formValues={formValues}
              setReviewActive={setReviewActive}
              setFormValues={setFormValues}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        ) : (
          <div className="flex w-full max-w-[900px] flex-col gap-5">
            <span className="text-lg font-semibold text-black">
              Almost done, review your information
            </span>
            <ControlledSubmissionSummary
              formData={formData}
              formValues={formValues}
              setReviewActive={setReviewActive}
            />
          </div>
        )}
      </div>
    </div>
  );
}
