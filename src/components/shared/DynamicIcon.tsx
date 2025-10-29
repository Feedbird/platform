import DOMPurify from 'dompurify';

export function DynamicIcon({
  svg,
  className,
}: {
  svg: string;
  className?: string;
}) {
  const sanitized = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
