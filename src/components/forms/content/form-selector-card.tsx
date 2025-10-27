"use client";
import { Card } from "@/components/ui/card";
import React from "react";

type FormSelectorCardProps = {
  text: string;
  onClick?: () => void;
};

export default function FormSelectorCard({
  text,
  onClick,
}: FormSelectorCardProps) {
  return (
    <Card
      onClick={onClick}
      className="w-full aspect-square shadow-lg md:max-w-[300px] p-5 font-bold text-lg hover:bg-gray-200 hover:cursor-pointer active:bg-gray-300 transition-colors duration-200"
    >
      {text}
    </Card>
  );
}
