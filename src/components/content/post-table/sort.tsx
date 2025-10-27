"use client";

import { SortingFn } from "@tanstack/react-table";
import { Post, Status } from "@/lib/store";

export const statusSortOrder: Status[] = [
  "Draft",
  "Pending Approval",
  "Needs Revisions",
  "Revised",
  "Approved",
  "Scheduled",
  "Publishing",
  "Published",
  "Failed Publishing",
];

export const statusSortingFn: SortingFn<Post> = (rowA, rowB, columnId) => {
  const statusA = rowA.getValue<Status>(columnId);
  const statusB = rowB.getValue<Status>(columnId);

  const indexA = statusSortOrder.indexOf(statusA);
  const indexB = statusSortOrder.indexOf(statusB);

  return indexA - indexB;
};

// Sort formats so empty appears last
export const formatSortingFn: SortingFn<Post> = (rowA, rowB, columnId) => {
  const fmtA = String(rowA.getValue(columnId) || "");
  const fmtB = String(rowB.getValue(columnId) || "");
  const emptyA = fmtA === "";
  const emptyB = fmtB === "";
  if (emptyA && !emptyB) return 1;
  if (!emptyA && emptyB) return -1;
  return fmtA.localeCompare(fmtB);
};

// Create platforms sorting function factory
export function createPlatformsSortingFn(pageIdToPlatformMap: Map<string, string>): SortingFn<Post> {
  return (rowA, rowB, columnId) => {
    const a: string[] = rowA.getValue(columnId) as string[];
    const b: string[] = rowB.getValue(columnId) as string[];

    const emptyA = !a || a.length === 0;
    const emptyB = !b || b.length === 0;
    if (emptyA && !emptyB) return 1;
    if (!emptyA && emptyB) return -1;

    const strA = (a ?? [])
      .map((id) => pageIdToPlatformMap.get(id) ?? "")
      .join(",");
    const strB = (b ?? [])
      .map((id) => pageIdToPlatformMap.get(id) ?? "")
      .join(",");
    return strA.localeCompare(strB);
  };
}
