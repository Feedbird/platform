import SubmitFormVisualizer from "./_inner";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formId } = await params;
  if (!formId) {
    return <div>No form ID provided</div>;
  }

  const data = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/forms/${formId}?include_fields=1`,
    { cache: "no-store" }
  );

  if (!data.ok) {
    return <div>Unable to load form. Please try again later</div>;
  }

  const { data: formData } = await data.json();
  return <SubmitFormVisualizer formData={formData} />;
}
