export interface YMD {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parse 'YYYY-MM-DD' strictly (no Date object → no timezone drift). */
export function parseDate(s: string): YMD {
  const m = ISO_DATE.exec(s);
  if (!m) throw new Error(`Invalid date (expected YYYY-MM-DD): ${JSON.stringify(s)}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid calendar date: ${s}`);
  }
  return { year, month, day };
}

export function formatDate(d: YMD): string {
  const mm = String(d.month).padStart(2, '0');
  const dd = String(d.day).padStart(2, '0');
  return `${d.year}-${mm}-${dd}`;
}

/** Device-local calendar date as YYYY-MM-DD (only used when no refDate is given). */
export function todayLocal(): string {
  const now = new Date();
  return formatDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}
