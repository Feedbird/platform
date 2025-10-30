'use client';
import { CanvasFormField } from '@/components/forms/form-canvas';
import { useFormEditor } from '@/contexts/forms/FormEditorContext';
import { useForms } from '@/contexts/forms/FormsContext';
import { formsApi } from '@/lib/api/api-service';
import { Divider } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';
import Loading from './loading';
import { formFieldSorter, mapPeriodicity } from '@/lib/utils/transformers';
import FormPageVisualizer from '@/components/forms/content/form-page-visualizer';

export default function Page() {
  const { activeForm, setIsPreview, setActiveForm, setIsEditing } = useForms();
  const { formFields, setFormFields, setOriginalFields } = useFormEditor();
  const params = useParams();

  const [pages, setPages] = React.useState<CanvasFormField[][]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const retrieveForm = async (formId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await formsApi.getFormById(formId);
      const { formFields } = await formsApi.getFormFields(formId);
      setFormFields(formFields.sort(formFieldSorter));
      setOriginalFields(formFields.sort(formFieldSorter));
      const tableForm = {
        ...data,
        services: data.services || [],
        submissionsCount: 0,
        fieldsCount: 0,
      };
      setActiveForm(tableForm);
      setIsEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeForm) {
      setIsPreview(true);

      /**
       * Pages would be generated from page breaks, using the page-break title
       * as page title and the description as page description
       */
      const tempPages: CanvasFormField[][] = [[]];
      for (const field of formFields.sort(formFieldSorter)) {
        if (field.type === 'page-break') {
          tempPages[tempPages.length - 1].push(field);
          tempPages.push([]);
        } else {
          tempPages[tempPages.length - 1].push(field);
        }
      }
      setPages(tempPages);
    } else {
      retrieveForm(params.id as string);
    }
    return () => setIsPreview(false);
  }, [activeForm]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">Error Loading Form</h2>
          <p className="text-gray-600">{error || 'Form not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#FBFBFB]">
      <div className="border-elementStroke grid h-9 w-full items-center justify-center border-b-1 bg-[#EDF6FF]">
        <span className="text-sm font-medium text-[#133495]">
          This is a preview
        </span>
      </div>
      <div className="flex justify-center p-5 pb-12">
        <div className="flex w-full max-w-[900px] flex-col gap-5">
          <div className="flex flex-col gap-2 py-3 pr-3 pl-0">
            <span className="text-[18px] font-semibold text-black">
              Onboarding Questionnaire
            </span>
            <div className="flex flex-col gap-1.5">
              {activeForm?.services?.map((service, index) => (
                <div
                  key={index}
                  className="text-darkGrey flex flex-row gap-3 text-sm font-normal"
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
          <FormPageVisualizer pages={pages} />
        </div>
      </div>
    </div>
  );
}
