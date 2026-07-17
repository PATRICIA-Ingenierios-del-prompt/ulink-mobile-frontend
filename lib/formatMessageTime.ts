/**
 * Formats a message timestamp for display in chat.
 *
 * Handles multiple formats that Spring Boot may return:
 * - ISO string:  "2025-11-15T14:32:00"
 * - Array:       [2025, 11, 15, 14, 32, 0]  (LocalDateTime serialized as array)
 * - Number:      epoch millis
 *
 * - Same day  → "14:32"
 * - Yesterday → "Ayer 14:32"
 * - Same year → "15 mar 14:32"
 * - Older     → "15 mar 2024 14:32"
 */
export function formatMessageTime(dateInput: string | number | number[] | Date | null | undefined): string {
  if (dateInput == null) return "";

  let date: Date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (Array.isArray(dateInput)) {
    // Spring Boot LocalDateTime serialized as [year, month, day, hour, minute, second?, nano?]
    // Month in JS Date is 0-indexed, Spring uses 1-indexed
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
    date = new Date(year, month - 1, day, hour, minute, second);
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else {
    // string — may be ISO or other format
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Ayer ${time}`;

  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const dayMonth = `${date.getDate()} ${MONTHS[date.getMonth()]}`;

  if (date.getFullYear() === now.getFullYear()) return `${dayMonth} ${time}`;

  return `${dayMonth} ${date.getFullYear()} ${time}`;
}
