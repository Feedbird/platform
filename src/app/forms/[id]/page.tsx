import FormInnerVisualizer from "./_inner";

export default function FormVisualizer() {
  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full flex min-h-[400px]">
        <FormInnerVisualizer />
      </div>
    </div>
  );
}
