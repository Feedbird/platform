import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncate text to a maximum number of characters, appending an ellipsis
 * when the input exceeds the limit.
 */
export function truncateText(value: string, maxCharacters: number, ellipsis: string = '…'): string {
  if (!value) return ''
  if (value.length <= maxCharacters) return value
  return value.slice(0, maxCharacters) + ellipsis
}

/**
 * Calculate the nearest aspect ratio from the target ratios (1:1, 4:5, 9:16)
 * and return the appropriate width for a given height
 */
export function calculateAspectRatioWidth(width: number, height: number, targetHeight: number): number {
  const aspectRatio = width / height;
  
  // Target aspect ratios: 1:1, 4:5, 9:16
  const targetRatios = [
    { ratio: 1, name: "1:1" },      // Square
    { ratio: 4/5, name: "4:5" },    // Portrait
    { ratio: 9/16, name: "9:16" }   // Portrait
  ];
  
  // Find the nearest target ratio
  let nearestRatio = targetRatios[0];
  let minDifference = Math.abs(aspectRatio - targetRatios[0].ratio);
  
  for (const target of targetRatios) {
    const difference = Math.abs(aspectRatio - target.ratio);
    if (difference < minDifference) {
      minDifference = difference;
      nearestRatio = target;
    }
  }
  
  // Calculate width based on target height and nearest ratio
  return targetHeight * nearestRatio.ratio;
}

/**
 * Get the aspect ratio type (1:1, 4:5, 9:16) for a given width and height
 */
export function getAspectRatioType(width: number, height: number): "1:1" | "4:5" | "9:16" {
  const aspectRatio = width / height;
  
  // Target aspect ratios: 1:1, 4:5, 9:16
  const targetRatios = [
    { ratio: 1, name: "1:1" as const },
    { ratio: 4/5, name: "4:5" as const },
    { ratio: 9/16, name: "9:16" as const }
  ];
  
  // Find the nearest target ratio
  let nearestRatio = targetRatios[0];
  let minDifference = Math.abs(aspectRatio - targetRatios[0].ratio);
  
  for (const target of targetRatios) {
    const difference = Math.abs(aspectRatio - target.ratio);
    if (difference < minDifference) {
      minDifference = difference;
      nearestRatio = target;
    }
  }
  
  return nearestRatio.name;
}

export function getPageName(pathname: string): string {
  // Remove leading slash and split by '/'
  const segments = pathname.replace(/^\//, '').split('/');
  
  // Handle root path
  if (segments.length === 0 || segments[0] === '') {
    return 'Dashboard';
  }

  // Handle content pages with board names
  if (segments[0] === 'content' && segments[1]) {
    const boardId = segments[1];
    // Map board IDs to readable names
    const boardNameMap: Record<string, string> = {
      'static-posts': 'Static Posts',
      'short-form-videos': 'Short-Form Videos',
      'email-design': 'Email Design',
    };
    return boardNameMap[boardId] || 'Content';
  }

  // Handle other main pages
  const pageNameMap: Record<string, string> = {
    'messages': 'Messages',
    'analytics': 'Analytics',
    'brands': 'Brands',
    'approvals': 'Approvals',
    'notifications': 'Notifications',
    'settings': 'Settings',
    'social': 'Social',
    'landing': 'Welcome',
  };

  const pageName = pageNameMap[segments[0]];
  if (pageName) {
    return pageName;
  }

  // Handle social pages with page IDs
  if (segments[0] === 'social' && segments[1]) {
    return 'Social Posts';
  }

  // Default fallback
  return 'Dashboard';
}

/**
 * Row height configuration and utilities
 */
export const ROW_HEIGHT_CONFIG = {
  "Small": 40,
  "Medium": 48,
  "Large": 72,
  "X-Large": 120,
  "XX-Large": 308,
} as const;

export type RowHeightType = keyof typeof ROW_HEIGHT_CONFIG;

/**
 * Convert row height string to pixel value
 */
export function getRowHeightPixels(rowHeight: RowHeightType): number {
  return ROW_HEIGHT_CONFIG[rowHeight];
}

/**
 * Convert pixel value to row height string
 */
export function getRowHeightString(pixels: number): RowHeightType {
  const entries = Object.entries(ROW_HEIGHT_CONFIG);
  const closest = entries.reduce((prev, curr) => {
    return Math.abs(curr[1] - pixels) < Math.abs(prev[1] - pixels) ? curr : prev;
  });
  return closest[0] as RowHeightType;
}

/**
 * Get all available row height options
 */
export function getRowHeightOptions() {
  return Object.entries(ROW_HEIGHT_CONFIG).map(([label, value]) => ({
    label,
    value,
  }));
}

/**
 * Format a date as a concise relative time string (e.g., "Just now", "5m ago", "2h ago").
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)}w ago`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffSeconds / 31536000)}y ago`;
}

/**
 * Compute a robust initial(s) string for avatar fallbacks.
 * Priority:
 * 1) firstName + lastName → two initials
 * 2) fullName (two+ words) → first + last initials; else first initial
 * 3) email/identifier → first character
 * 4) fallback → '?'
 */
export function getFullnameInitial(
  firstName?: string | null,
  lastName?: string | null,
  fullNameOrEmail?: string | null,
  fallback: string = "?"
): string {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();

  const full = (fullNameOrEmail || "").trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0][0]!.toUpperCase();
  }

  return fallback;
}

// Backward-compat alias for potential alternate naming used elsewhere
export const getFullnameinitial = getFullnameInitial;

/**
 * Exact palettes for months 1–10.
 */
const MONTH_COLORS: string[] = [
  '#D2E2FF', // 1
  '#C4ECFF', // 2
  '#C2F4F0', // 3
  '#DDF9E4', // 4
  '#FEEAB6', // 5
  '#FFE0CD', // 6
  '#FFD4E0', // 7
  '#FBD1FC', // 8
  '#E0DAFD', // 9
  '#E5E9F0', // 10
];

const BULLET_COLORS: string[] = [
  '#4076D7', // 1
  '#58C2F5', // 2
  '#3CD3C7', // 3
  '#0DAD69', // 4
  '#E6BB4B', // 5
  '#E08852', // 6
  '#E26286', // 7
  '#DB68DD', // 8
  '#836FE1', // 9
  '#85A3D7', // 10
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const isShort = normalized.length === 3;
  const full = isShort
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Darken by mixing toward black by a small fraction (e.g., 0.08 → 8%)
function darkenHex(hex: string, fraction: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = Math.max(0, Math.min(1, fraction));
  const nr = Math.round(r * (1 - f));
  const ng = Math.round(g * (1 - f));
  const nb = Math.round(b * (1 - f));
  return rgbToHex(nr, ng, nb);
}

// Lighten by mixing toward white by a small fraction (e.g., 0.08 → 8%)
function lightenHex(hex: string, fraction: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = Math.max(0, Math.min(1, fraction));
  const nr = Math.round(r + (255 - r) * f);
  const ng = Math.round(g + (255 - g) * f);
  const nb = Math.round(b + (255 - b) * f);
  return rgbToHex(nr, ng, nb);
}

/**
 * Return a background color for a given month number.
 * - Months 1–10: fixed, stable colors
 * - Months 11–12: similar to months 1–2 with small saturation/lightness tweaks
 */
export function getMonthColor(month: number): string {
  const m = Math.max(1, Math.min(50, Math.floor(month)));
  const decadeIndex = Math.floor((m - 1) / 10); // 0..4 for 1..50
  const baseIndex = (m - 1) % 10; // 0..9 maps within decade
  const base = MONTH_COLORS[baseIndex];

  if (decadeIndex === 0) return base; // 1..10 exact
  if (decadeIndex === 1) return lightenHex(base, 0.06); // 11..20
  if (decadeIndex === 2) return lightenHex(base, 0.12); // 21..30
  if (decadeIndex === 3) return darkenHex(base, 0.06); // 31..40
  return darkenHex(base, 0.12); // 41..50
}

/**
 * Darker variant for bullets/indicators using the same base hue rules.
 */
export function getBulletColor(month: number): string {
  const m = Math.max(1, Math.min(50, Math.floor(month)));
  const decadeIndex = Math.floor((m - 1) / 10); // 0..4
  const baseIndex = (m - 1) % 10;
  const base = BULLET_COLORS[baseIndex];

  if (decadeIndex === 0) return base; // 1..10 exact
  if (decadeIndex === 1) return lightenHex(base, 0.04); // 11..20
  if (decadeIndex === 2) return lightenHex(base, 0.06); // 21..30
  if (decadeIndex === 3) return darkenHex(base, 0.06); // 31..40
  return darkenHex(base, 0.08); // 41..50
}
