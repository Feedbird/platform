import { UIFormFieldDefaults } from "@/lib/forms/fields";
import React from "react";

type Props = {
  isVisible?: boolean;
  type: string;
};

export default function FormTypeConfig({ isVisible = true, type }: Props) {
  const fieldConfig =
    UIFormFieldDefaults[type as keyof typeof UIFormFieldDefaults] || null;

  console.log(JSON.stringify(fieldConfig, null, 2));
  return (
    <div
      className={`absolute right-0 border-border-primary z-20 border-l-1 w-[320px] bg-[#FAFAFA] h-full flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${
        isVisible ? "transform translate-x-0" : "transform translate-x-full"
      }`}
    >
      <header className="border-border-primary border-b-1 w-full p-3 text-black font-medium">
        Edit Field
      </header>
    </div>
  );
}
