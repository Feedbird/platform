"use client";

import { FilterFn } from "@tanstack/react-table";
import { Post, Status } from "@/lib/store";
import { Platform } from "@/lib/social/platforms/platform-types";

export type OperatorLike =
  | "is"
  | "is_not"
  | "any_of"
  | "none_of"
  | "is_empty"
  | "not_empty"
  | "filename_contains"
  | "has_file_type";

export type ColumnFilterValue = { operator: OperatorLike; values?: string[] } | string[];

const isEmpty = (v: any) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

const evalBasic = (cellVal: string | number | string[] | undefined, fv: ColumnFilterValue): boolean => {
  if (Array.isArray(fv)) {
    const list = fv as string[];
    if (!list.length) return true;
    if (Array.isArray(cellVal)) return (cellVal as string[]).some((v) => list.includes(String(v)));
    return list.includes(String(cellVal ?? ""));
  }
  const { operator, values = [] } = fv;
  if (operator === "is_empty") return isEmpty(cellVal);
  if (operator === "not_empty") return !isEmpty(cellVal);
  const first = values[0];
  switch (operator) {
    case "is":
      if (Array.isArray(cellVal)) return (cellVal as string[]).includes(String(first ?? ""));
      return String(cellVal ?? "") === String(first ?? "");
    case "is_not":
      if (Array.isArray(cellVal)) return !(cellVal as string[]).includes(String(first ?? ""));
      return String(cellVal ?? "") !== String(first ?? "");
    case "any_of":
      if (Array.isArray(cellVal)) return (cellVal as string[]).some((v) => values.includes(String(v)));
      return values.includes(String(cellVal ?? ""));
    case "none_of":
      if (Array.isArray(cellVal)) return (cellVal as string[]).every((v) => !values.includes(String(v)));
      return !values.includes(String(cellVal ?? ""));
    default:
      return true;
  }
};

export const statusFilterFn: FilterFn<Post> = (row, colId, filterValue: ColumnFilterValue) => {
  const cellVal = row.getValue(colId) as string | undefined;
  return evalBasic(cellVal ?? "", filterValue);
};

export const formatFilterFn: FilterFn<Post> = (row, colId, filterValue: ColumnFilterValue) => {
  const cellVal = row.getValue(colId) as string | undefined;
  return evalBasic(cellVal ?? "", filterValue);
};

export const monthFilterFn: FilterFn<Post> = (row, colId, filterValue: ColumnFilterValue) => {
  const cellVal = row.getValue(colId);
  return evalBasic(String(cellVal ?? ""), filterValue);
};

export const previewFilterFn: FilterFn<Post> = (row, colId, filterValue: ColumnFilterValue) => {
  const blocks = (row.getValue(colId) as Post["blocks"]) || [];

  if (Array.isArray(filterValue)) {
    const kinds = filterValue;
    if (!kinds.length) return true;
    return blocks.some((b) => kinds.includes(String(b?.kind ?? "")));
  }
  const { operator, values = [] } = (filterValue || ({} as any)) as any;
  if (operator === "is_empty") return blocks.length === 0;
  if (operator === "not_empty") return blocks.length > 0;
  if (operator === "has_file_type") {
    const want = String(values[0] ?? "");
    if (!want) return true;
    return blocks.some((b) => String(b?.kind ?? "") === want);
  }
  if (operator === "filename_contains") {
    const needle = String(values[0] ?? "").toLowerCase();
    if (!needle) return true;
    for (const b of blocks) {
      for (const v of b?.versions || []) {
        const fileUrl = v?.file?.url || "";
        if (fileUrl.toLowerCase().includes(needle)) return true;
        const media = v?.media || [];
        if (media.some((m) => String(m?.name || "").toLowerCase().includes(needle))) return true;
      }
    }
    return false;
  }
  return true;
};

export const publishDateFilterFn: FilterFn<Post> = (row, colId, filterValue: ColumnFilterValue) => {
  const rowDateRaw = row.getValue(colId) as Date | string | null | undefined;
  const rowDate = rowDateRaw ? new Date(rowDateRaw as any) : null;

  if (Array.isArray(filterValue)) return true;

  const { operator, values = [] } = (filterValue || { operator: "is" }) as any;

  if (operator === "is_empty") return !rowDate;
  if (operator === "not_empty") return !!rowDate;
  if (!rowDate) return false;

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());

  const opt = String(values[0] || "today");
  const num = Number(values[1] || 0);

  const resolveTarget = (): { start: Date; end: Date } | null => {
    switch (opt) {
      case "today": {
        const s = startOfDay(now);
        const e = endOfDay(now);
        return { start: s, end: e };
      }
      case "tomorrow": {
        const d = addDays(now, 1);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "yesterday": {
        const d = addDays(now, -1);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "one_week_ago": {
        const d = addDays(now, -7);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "one_week_from_now": {
        const d = addDays(now, 7);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "one_month_ago": {
        const d = addDays(now, -30);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "one_month_from_now": {
        const d = addDays(now, 30);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "days_ago": {
        const d = addDays(now, -Math.max(0, isFinite(num) ? num : 0));
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "days_from_now": {
        const d = addDays(now, Math.max(0, isFinite(num) ? num : 0));
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      case "exact_date": {
        const iso = String(values[1] || "");
        if (!iso) return null;
        const parts = iso.split("-").map(Number);
        const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      default: {
        const s = startOfDay(now);
        const e = endOfDay(now);
        return { start: s, end: e };
      }
    }
  };

  const target = resolveTarget();
  if (!target) return true;

  const rd = new Date(rowDate);
  switch (operator) {
    case "is":
      return rd >= target.start && rd <= target.end;
    case "before":
      return rd < target.start;
    case "on_or_before":
      return rd <= target.end;
    case "after":
      return rd > target.end;
    case "on_or_after":
      return rd >= target.start;
    case "is_within": {
      if (opt === "days_ago" || opt === "one_week_ago" || opt === "one_month_ago") {
        const windowStart = startOfDay(addDays(now, opt === "days_ago" ? -Math.max(0, num) : opt === "one_week_ago" ? -7 : -30));
        const windowEnd = endOfDay(now);
        return rd >= windowStart && rd <= windowEnd;
      }
      if (opt === "days_from_now" || opt === "one_week_from_now" || opt === "one_month_from_now") {
        const windowStart = startOfDay(now);
        const windowEnd = endOfDay(addDays(now, opt === "days_from_now" ? Math.max(0, num) : opt === "one_week_from_now" ? 7 : 30));
        return rd >= windowStart && rd <= windowEnd;
      }
      return rd >= target.start && rd <= target.end;
    }
    case "is_not":
      return !(rd >= target.start && rd <= target.end);
    default:
      return true;
  }
};

export const approveFilterFn: FilterFn<Post> = (row, _colId, filterValue: ColumnFilterValue) => {
  const status = (row.original.status || "") as string;
  const scheduledOrPosted = row.original.status === "Scheduled" || row.original.status === "Published";

  const isApprovedState = status === "Approved" || scheduledOrPosted;
  const isRevisionState = status === "Needs Revisions";
  const isNoneState = !isApprovedState && !isRevisionState;

  const matchFor = (val: string): boolean => {
    if (val === "Approved") return isApprovedState;
    if (val === "Revision") return isRevisionState;
    if (val === "none_of") return isNoneState;
    return false;
  };

  if (Array.isArray(filterValue)) {
    const list = filterValue as string[];
    if (!list.length) return true;
    return list.some(matchFor);
  }

  const { operator, values = [] } = (filterValue || { operator: "any_of" }) as any;
  if (!values.length && (operator !== "is_empty" && operator !== "not_empty")) return true;

  switch (operator) {
    case "is":
      return matchFor(String(values[0]));
    case "is_not":
      return !matchFor(String(values[0]));
    case "any_of": {
      const arr: string[] = values as string[];
      return arr.some((val: string) => matchFor(String(val)));
    }
    case "none_of": {
      const arr: string[] = values as string[];
      return arr.every((val: string) => !matchFor(String(val)));
    }
    case "is_empty":
      return isNoneState;
    case "not_empty":
      return !isNoneState;
    default:
      return true;
  }
};

// Create platforms filter function factory
export function createPlatformsFilterFn(pageIdToPlatformMap: Map<string, string>): FilterFn<Post> {
  return (row, colId, filterValues: string[]) => {
    if (!filterValues.length) return true;
    const rowPages = row.getValue(colId) as string[];
    if (!rowPages || !Array.isArray(rowPages)) return false;

    const rowPlatforms = rowPages
      .map((pageId) => pageIdToPlatformMap.get(pageId))
      .filter((platform): platform is Platform => platform !== undefined);

    return rowPlatforms.some((platform) => filterValues.includes(platform));
  };
}


