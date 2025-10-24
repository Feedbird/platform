/**
 * Place any data transformers here, for humanizing / normalizing data
 */

import { CanvasFormField } from '@/components/forms/FormCanvas';

export function humanizeDate(date: Date | string): string {
  const standardizedDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Check if the date is within the same minute
  const timeDiffInMs = Math.abs(now.getTime() - standardizedDate.getTime());
  const oneMinuteInMs = 60 * 1000;

  if (timeDiffInMs < oneMinuteInMs) {
    return 'Just now';
  }

  // Check if it's today (but not within the last minute)
  const isToday =
    standardizedDate.getFullYear() === now.getFullYear() &&
    standardizedDate.getMonth() === now.getMonth() &&
    standardizedDate.getDate() === now.getDate();

  if (isToday) {
    return 'Today';
  }

  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // Compare just the date parts (year, month, day) ignoring time
  const isYesterday =
    standardizedDate.getFullYear() === yesterday.getFullYear() &&
    standardizedDate.getMonth() === yesterday.getMonth() &&
    standardizedDate.getDate() === yesterday.getDate();

  if (isYesterday) {
    return 'Yesterday';
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = months[standardizedDate.getMonth()];
  const day = standardizedDate.getDate();
  const year = standardizedDate.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Compares two plain arrays (of strings or numbers) for equality.
 *
 * @param a Array of strings or numbers
 * @param b Second array of strings or numbers
 * @returns Boolean indicating if arrays are equal (same length and same content no matter the order)
 */
export function plainArrayEqual<T extends string | number>(
  a: Array<T>,
  b: Array<T>
): boolean {
  if (a.length !== b.length) return false;

  // Sort both arrays once, then compare
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Simple object deep equality check using JSON stringification.
 * This will also compare order of keys, so make sure both objects are
 * ordered. Otherwise use lodash isEqual or similar for a more robust solution.
 *
 * @param a Object 1
 * @param b Object 2
 * @returns Boolean indicating if objects are deeply equal (same keys and values)
 */
export function nestedObjectEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function formFieldSorter(
  a: CanvasFormField,
  b: CanvasFormField
): number {
  return (a.position || 0) - (b.position || 0);
}
