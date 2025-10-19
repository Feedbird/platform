import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

type Props = {
  status: boolean;
  statusHandler: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  description?: string;
  className?: string;
  ComponentWhenExtended: React.FC;
};

/**
 * This is a normal checkbox input that expands when checked to show more options
 */
export default function ExpansibleCheckbox({
  status,
  statusHandler,
  title,
  description,
  className,
  ComponentWhenExtended,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [status]);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <Checkbox
            className="bg-white border-buttonStroke"
            checked={status}
            onCheckedChange={(val) => statusHandler(!status)}
          />
          <span className="text-black font-normal text-sm">{title}</span>
        </div>
        {description && (
          <p className="pl-6 text-xs font-black/70">{description}</p>
        )}
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: status ? `${contentHeight}px` : "0px",
          opacity: status ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <ComponentWhenExtended />
        </div>
      </div>
    </div>
  );
}
