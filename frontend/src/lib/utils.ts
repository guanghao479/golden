import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date/time range for display on event cards.
 * Examples:
 * - Same day: "Dec 31, 2025 · 10:00 AM - 2:00 PM"
 * - Multi-day: "Dec 31, 2025 10:00 AM - Jan 1, 2026 2:00 PM"
 * - No end time: "Dec 31, 2025 · 10:00 AM"
 * - No times: "Date TBD"
 */
export function formatEventDatetime(
  startTime: string | null,
  endTime: string | null
): string {
  if (!startTime) return "Date TBD";

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return "Date TBD";

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const startDate = start.toLocaleDateString("en-US", dateOptions);
  const startTimeStr = start.toLocaleTimeString("en-US", timeOptions);

  if (!endTime) {
    return `${startDate} · ${startTimeStr}`;
  }

  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) {
    return `${startDate} · ${startTimeStr}`;
  }

  const endDate = end.toLocaleDateString("en-US", dateOptions);
  const endTimeStr = end.toLocaleTimeString("en-US", timeOptions);

  // Check if same day
  if (startDate === endDate) {
    return `${startDate} · ${startTimeStr} - ${endTimeStr}`;
  }

  // Multi-day event
  return `${startDate} ${startTimeStr} - ${endDate} ${endTimeStr}`;
}
