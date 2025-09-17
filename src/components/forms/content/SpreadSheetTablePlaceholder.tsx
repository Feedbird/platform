import { FieldTypeEntitlements } from "@/lib/forms/field.config";
import React from "react";

type Props = {
  config: FieldTypeEntitlements;
  isPreview: boolean;
};

export default function SpreadSheetTablePlaceholder({
  config,
  isPreview,
}: Props) {
  const columns = config.spreadsheetColumns?.columns || [];
  const sampleRows = config.allowedRows?.value || 2;

  return (
    <table className="w-full border-separate border-spacing-0 rounded-lg overflow-hidden border border-[#EAE9E9]">
      <thead>
        <tr className="bg-[#FBFBFB] text-[#5C5E63] font-medium text-left text-xs">
          <th className="w-7 border-r border-b border-[#EAE9E9] first:rounded-tl-[6px]"></th>
          {columns.map((col, index) => (
            <th
              key={col.order}
              className={`border-r border-b border-[#EAE9E9] p-2.5 ${
                index === columns.length - 1
                  ? "rounded-tr-[6px] border-r-0"
                  : ""
              }`}
            >
              {col.value}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: sampleRows as number }).map((_, rowIndex) => {
          const isLastRow = rowIndex === (sampleRows as number) - 1;
          return (
            <tr key={rowIndex}>
              <td
                className={`w-7 border-r border-b border-[#EAE9E9] p-2.5 text-[#5C5E63] font-normal text-xs font-mono bg-[#FBFBFB] ${
                  isLastRow ? "rounded-bl-[6px] border-b-0" : ""
                }`}
              >
                {rowIndex + 1}
              </td>
              {columns.map((col, idx) => (
                <td
                  key={idx + 7}
                  className={`px-2.5 border-r border-b border-[#EAE9E9] bg-white ${
                    isLastRow && idx === columns.length - 1
                      ? "rounded-br-[6px] border-r-0 border-b-0"
                      : isLastRow
                      ? "border-b-0"
                      : idx === columns.length - 1
                      ? "border-r-0"
                      : ""
                  }`}
                >
                  {isPreview && (
                    <input
                      type="text"
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  )}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
