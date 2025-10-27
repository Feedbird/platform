import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

type Props = {
  status: "draft" | "published";
};

export default function FormStatusBadge({ status }: Props) {
  const badgeBg = status === "published" ? "bg-[#E5EEFF]" : "bg-[#F4F7FA]";
  const innerBg = status === "published" ? "bg-[#387DFF]" : "bg-[#9B9DAB]";
  return (
    <Badge
      className={cn(
        "rounded-[4px] border-border-primary border-1 flex justify-start py-[2px] px-1",
        badgeBg
      )}
    >
      <div
        className={cn(
          "content-center p-0.5 rounded-[3px] w-3.5 h-3.5",
          innerBg
        )}
      >
        <Image
          src={
            status === "published"
              ? "/images/forms/send.svg"
              : "/images/forms/minus.svg"
          }
          alt="badge_icon"
          width={9}
          height={9}
        />
      </div>
      <span>{status === "draft" ? "Draft" : "Published"}</span>
    </Badge>
  );
}
