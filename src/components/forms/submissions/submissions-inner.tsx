"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formsApi } from "@/lib/api/api-service";
import { Loading } from "@/components/shared/loading";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForms } from "@/contexts/forms-context";
import { TableForm } from "../content/forms-table";
import { humanizeDate } from "@/lib/utils/transformers";
import { SquareChartGantt } from "lucide-react";
import ReviewCard from "@/app/[workspaceId]/form/[id]/components/review-card";
import Image from "next/image";
import { useWorkspaceStore } from "@/lib/store";
import { FormSubmission } from "@/lib/store/types";

type Props = {
  formId?: string;
};

export default function SubmissionsInner({ formId }: Props) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { activeForm, setActiveForm } = useForms();
  const [localLoading, isLocalLoading] = useState(false);
  const [activeSubmission, setActiveSubmission] =
    useState<FormSubmission | null>(null);
  const router = useRouter();
  const handleRedirection = () => {
    router.push(`/${activeWorkspaceId}/admin/forms`);
    toast.error("Unable to find form to load submissions for.");
  };

  if (!formId) {
    handleRedirection();
    return;
  }

  useEffect(() => {
    const fetchForm = async () => {
      isLocalLoading(true);
      try {
        const form = await formsApi.getFormById(formId);
        setActiveForm(form.data as TableForm);
      } catch (e) {
        handleRedirection();
      } finally {
        isLocalLoading(false);
      }
    };
    if (!activeForm || activeForm.id !== formId) {
      fetchForm();
    }
  }, [activeForm]);

  const {
    data: submissionsData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["submissions", formId],
    queryFn: () => formsApi.getFormSubmissions(formId),
  });

  if (isLoading || localLoading) {
    return <Loading entity="submissions" />;
  }

  if (error || !submissionsData) {
    handleRedirection();
    return;
  }

  const { data: submissions } = submissionsData;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1 p-8">
        <span className="font-normal text-sm">Form submissions</span>
        <h2 className="text-black font-semibold text-lg">
          {activeForm?.title}
        </h2>
        <div className="flex flex-col gap-2">
          <span className="font-normal text-sm">
            Questions: {Object.keys(submissions[0].answers).length}
          </span>
        </div>
      </div>
      <Table className="border-b-1 border-buttonStroke">
        <TableHeader className="border-y-1 bg-[#FBFBFB]">
          <TableRow className="">
            <TableHead className="border-r-1 w-8"></TableHead>
            <TableHead className="py-2 border-r-1 text-black font-medium">
              Submitted By
            </TableHead>
            <TableHead className="py-2 border-r-1 text-black font-medium">
              Date
            </TableHead>
            <TableHead className="py-2 border-r-1 text-black font-medium">
              Form version
            </TableHead>
            <TableHead className="py-2 w-52 text-black font-medium">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission: FormSubmission) => (
            <TableRow key={submission.id}>
              <TableCell className="border-r-1 py-5"></TableCell>
              <TableCell className="border-r-1">
                {submission.submittedBy}
              </TableCell>
              <TableCell className="border-r-1">
                {humanizeDate(submission.createdAt)}
              </TableCell>
              <TableCell className="border-r-1">1</TableCell>
              <TableCell>
                <div className="flex h-full gap-2 items-center hover:underline hover:cursor-pointer text-blue-600">
                  <SquareChartGantt width={14} height={14} />
                  <span onClick={() => setActiveSubmission(submission)}>
                    See answers
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {activeSubmission && (
        <div className="mt-10 flex justify-center">
          <div className="max-w-[1000px] w-full">
            <div className="flex flex-col p-6 gap-2 border-1 rounded-[8px] border-elementStroke bg-white">
              {Object.keys(activeSubmission.answers).map((fieldId, index) => {
                const title =
                  activeSubmission.schemaSnapshot[fieldId] || "Untitled";
                const value = activeSubmission.answers[fieldId].value;

                return (
                  <ReviewCard
                    editable={false}
                    key={fieldId}
                    title={title}
                    value={value as string | string[]}
                    index={index + 1}
                  />
                );
              })}
              <div className="px-3 py-6">
                <Image
                  src="/images/logo/logo.png"
                  alt="feedbird_logo"
                  width={87}
                  height={14}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
