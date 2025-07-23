import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    'analytics': 'Analytics',
    'brands': 'Brands',
    'approvals': 'Approvals',
    'notifications': 'Notifications',
    'settings': 'Settings',
    'social': 'Social',
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
