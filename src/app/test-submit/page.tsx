import SubmitFormVisualizer from "./_inner";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const formId = params.form_id;
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
  return (
      <SubmitFormVisualizer formData={formData} />
  );
}
