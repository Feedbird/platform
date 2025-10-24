import { Row } from "@tanstack/react-table";
import { Post, UserColumn, ColumnType } from "@/lib/store";

/**
 * Type definition for final group structure
 */
export type FinalGroup = {
  groupValues: Record<string, any>; // the grouping values that led to this group
  rowCount: number; // how many leaf rows
  leafRows: Row<Post>[]; // the actual leaf row objects
  groupingColumns: string[]; // the columns that were grouped on
};

/**
 * Processes table rows into final groups for rendering
 */
export function getFinalGroupRows(
  rows: Row<Post>[],
  currentValues: Record<string, any> = {},
  comparator?: (a: Row<Post>, b: Row<Post>) => number
): FinalGroup[] {
  const finalGroups: FinalGroup[] = [];

  rows.forEach((row) => {
    if (row.getIsGrouped()) {
      const colId = row.groupingColumnId as string;
      const value = row.groupingValue;

      // Add or override the grouping value in the path:
      const newValues = { ...currentValues, [colId]: value };

      // If row.subRows are STILL grouped further, keep going:
      if (row.subRows.some((r) => r.getIsGrouped())) {
        const deeper = getFinalGroupRows(
          row.subRows as unknown as Row<Post>[],
          newValues,
          comparator
        );
        finalGroups.push(...deeper);
      } else {
        // If subRows are leaves, we have found a "lowest-level" group
        const leafRows = row.subRows as unknown as Row<Post>[];
        finalGroups.push({
          groupValues: newValues,
          leafRows: comparator ? [...leafRows].sort(comparator) : leafRows,
          rowCount: row.subRows.length,
          groupingColumns: Object.keys(newValues), // for convenience
        });
      }
    }
  });

  return finalGroups;
}

/**
 * Gets user column value from a post
 */
export function getUserColumnValue(post: Post, columnId: string): string {
  const arr = post.user_columns || [];
  const hit = arr.find((x) => x.id === columnId);
  return hit?.value ?? "";
}

/**
 * Builds updated user columns array for a post
 */
export function buildUpdatedUserColumnsArr(
  post: Post,
  columnId: string,
  value: string
): Array<{ id: string; value: string }> {
  const arr = [...(post.user_columns || [])];
  const idx = arr.findIndex((x) => x.id === columnId);

  if (idx >= 0) arr[idx] = { id: columnId, value };
  else arr.push({ id: columnId, value });
  return arr;
}

/**
 * Mapping between internal column ids and persisted display names
 */
export const defaultIdToName: Record<string, string> = {
  drag: "",
  rowIndex: "",
  status: "Status",
  preview: "Preview",
  caption: "Caption",
  platforms: "Socials",
  format: "Format",
  month: "Month",
  revision: "Revision",
  approve: "Approve",
  settings: "Settings",
  publish_date: "Post time",
  updated_at: "Updated",
};

/**
 * Reverse mapping from names to default column IDs
 */
export const nameToDefaultId: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  Object.entries(defaultIdToName).forEach(([id, nm]) => {
    if (nm) map[nm] = id;
  });
  return map;
})();

/**
 * Normalizes column order by keeping 'drag' and 'rowIndex' fixed at positions 0 and 1
 */
export function normalizeOrder(order: string[]): string[] {
  const seen = new Set<string>();
  const rest = order.filter((id) => {
    if (id === "drag" || id === "rowIndex") return false;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return ["drag", "rowIndex", ...rest];
}

/**
 * Builds column payload for persistence given an explicit order
 */
export function buildColumnsPayloadForOrder(
  orderIds: string[],
  columnsList: UserColumn[] = []
): Array<{
  name: string;
  id?: string;
  is_default: boolean;
  order: number;
  type?: ColumnType;
  options?: any;
}> {
  const filtered = orderIds.filter(
    (id) => id !== "drag" && id !== "rowIndex"
  );
  const payload: Array<{
    name: string;
    id?: string;
    is_default: boolean;
    order: number;
    type?: ColumnType;
    options?: any;
  }> = [];
  let ord = 0;
  for (const id of filtered) {
    if (defaultIdToName[id]) {
      // Default columns: we can optionally set a type for well-known ones
      // For now, omit type for defaults to preserve existing behavior
      payload.push({
        name: defaultIdToName[id],
        is_default: true,
        order: ord++,
      });
      continue;
    }
    const u = columnsList.find((c) => c.id === id);
    if (u) {
      // Normalize options: support legacy string[] and new {value,color}[]
      let optionsPayload = [];
      if (Array.isArray(u.options)) {
        optionsPayload = u.options.map((opt: any) => {
          if (typeof opt === "string") {
            return { id: `opt_${Math.random()}`, value: opt, color: "#6B7280" };
          }
          return opt;
        });
      }
      payload.push({
        name: u.label,
        id: u.id,
        is_default: false,
        order: ord++,
        type: u.type,
        options: optionsPayload.length > 0 ? optionsPayload : undefined,
      });
    }
  }
  return payload;
}

/**
 * Sticky columns that should remain fixed during horizontal scrolling
 */
export const STICKY_COLUMNS = ["drag", "rowIndex", "status"] as const;

/**
 * Sticky column offsets for positioning
 */
export const STICKY_OFFSETS: Record<string, number> = {
  drag: 0,
  rowIndex: 24, // 0 + 40 from "drag"
  status: 24 + 80, // 120, because rowIndex is 80 wide
};

/**
 * Checks if a column ID is sticky
 */
export function isSticky(colId: string): colId is (typeof STICKY_COLUMNS)[number] {
  return STICKY_COLUMNS.includes(colId as any);
}

/**
 * Gets sticky styles for a column
 */
export function stickyStyles(
  columnId: string,
  zIndex: number = 10
): React.CSSProperties | undefined {
  if (!isSticky(columnId)) return undefined;

  const styles: React.CSSProperties = {
    position: "sticky",
    left: STICKY_OFFSETS[columnId],
    zIndex,
  };

  // Smooth shadow transition
  if (columnId === "status") {
    // Base transition; actual box-shadow handled by CSS when
    // the scroll container has `.scrolling-horiz` class.
    styles.transition = "box-shadow 0.2s ease-in-out";
  }

  return styles;
}

/**
 * Maps edit field type labels to column types
 */
export function mapEditFieldTypeToColumnType(label: string): ColumnType {
  const s = (label || "").toLowerCase().trim();
  switch (s) {
    case "single line text":
      return "singleLine";
    case "long text":
      return "longText";
    case "attachment":
      return "attachment";
    case "checkbox":
      return "checkbox";
    case "single select":
      return "singleSelect";
    case "multiple select":
      return "multiSelect";
    case "calendar":
      return "date";
    case "last updated time":
      return "lastUpdatedTime";
    case "created by":
      return "createdBy";
    case "last modified by":
      return "lastUpdatedBy";
    default:
      return "singleLine";
  }
}

/**
 * Maps column types to edit field type labels
 */
export function mapColumnTypeToEditFieldType(columnType: ColumnType): string {
  switch (columnType) {
    case "singleLine":
      return "single line text";
    case "longText":
      return "Long text";
    case "attachment":
      return "Attachment";
    case "checkbox":
      return "Checkbox";
    case "singleSelect":
      return "Single select";
    case "multiSelect":
      return "Multiple select";
    case "date":
      return "Calendar";
    case "lastUpdatedTime":
      return "Last modified by";
    case "createdBy":
      return "Created by";
    case "lastUpdatedBy":
      return "Last modified by";
    default:
      return "single line text";
  }
}

/**
 * Generates a random revision round for a group
 */
export function getPassedRevisionRound(
  groupKey: string,
  boardRules: { firstMonth?: number; revisionRules?: any } | null
): number {
  const firstMonthLimit = boardRules?.firstMonth ?? 0;
  if (!boardRules?.revisionRules || !(firstMonthLimit > 0)) return 0;
  
  // For now, we'll generate a random value each time
  // In the original code, this was stored in a ref, but for utility functions
  // we'll keep it simple and generate fresh each time
  const maxInclusive = Math.max(0, firstMonthLimit - 1);
  return maxInclusive > 0 ? Math.floor(Math.random() * (maxInclusive + 1)) : 0;
}