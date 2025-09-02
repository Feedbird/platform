/**
 * Place any data transformers here, for humanizing / normalizing data
 */

export function humanizeDate(date: Date | string): string {
  const standardizedDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  // Check if the date is within the same minute
  const timeDiffInMs = Math.abs(now.getTime() - standardizedDate.getTime());
  const oneMinuteInMs = 60 * 1000;

  if (timeDiffInMs < oneMinuteInMs) {
    return "Just now";
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = months[standardizedDate.getMonth()];
  const day = standardizedDate.getDate();
  const year = standardizedDate.getFullYear();

  return `${month} ${day}, ${year}`;
}
