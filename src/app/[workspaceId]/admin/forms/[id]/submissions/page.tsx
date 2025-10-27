import SubmissionsInner from "@/components/forms/submissions/submissions-inner";

export default async function Submissions({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SubmissionsInner formId={id} />;
}
