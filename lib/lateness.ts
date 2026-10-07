// Client-safe helpers for late-arrival tracking. Dates are school-day keys
// in Asia/Ulaanbaatar so "today" means the same thing to the duty teacher's
// phone, the server (UTC on Vercel) and the social worker's report.

export const SCHOOL_TZ = "Asia/Ulaanbaatar";

// A student late this many times inside REPEAT_WINDOW_DAYS is flagged for
// the social worker as a repeat case.
export const REPEAT_THRESHOLD = 3;
export const REPEAT_WINDOW_DAYS = 30;

export const MAX_MINUTES_LATE = 240;
export const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45] as const;
export const MAX_NAME = 80;
export const MAX_COMES_FROM = 80;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(v: string): boolean {
  return DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

/** Today's school-day key, e.g. "2026-10-07". */
export function schoolDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SCHOOL_TZ }).format(at);
}

/** Shift a date key by whole days ("2026-10-07", -1 → "2026-10-06"). */
export function addDays(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/** "2026.10.07 · Лхагва" */
export function formatDateKey(key: string): string {
  const weekday = WEEKDAYS[new Date(`${key}T00:00:00Z`).getUTCDay()];
  return `${key.replaceAll("-", ".")} · ${weekday}`;
}

// Phones often switch to a Latin keyboard; map the letters that sections
// actually use so "5b" and "5Б" land in the same class.
const LATIN_SECTION: Record<string, string> = {
  A: "А", B: "Б", V: "В", G: "Г", D: "Д", E: "Е",
};

/**
 * Turn whatever the duty teacher typed into one canonical class label:
 * "5б", "5 Б анги", "5-b" → "5Б"; "10-2" → "10-2". Null when unrecognisable.
 */
export function normalizeClassLabel(raw: string): string | null {
  const s = raw.toUpperCase().replace(/АНГИ/g, "").replace(/\s+/g, "");
  const m = /^(\d{1,2})[-.]?([А-ЯЁӨҮA-Z]|\d{1,2})$/.exec(s);
  if (!m) return null;
  const grade = Number(m[1]);
  if (grade < 1 || grade > 12) return null;
  let section = m[2]!;
  if (/\d/.test(section)) return `${grade}-${section}`;
  if (/[A-Z]/.test(section)) {
    const mapped = LATIN_SECTION[section];
    if (!mapped) return null;
    section = mapped;
  }
  return `${grade}${section}`;
}

export function classLabelFor(grade: number, section: string): string {
  return `${grade}${section.toUpperCase()}`;
}

/** Sort "2А" < "2Б" < "10А" (numeric grade first). */
export function compareClassLabels(a: string, b: string): number {
  const ga = parseInt(a, 10);
  const gb = parseInt(b, 10);
  return ga !== gb ? ga - gb : a.localeCompare(b, "mn");
}

export function cleanText(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Same person despite spacing/dots/case: "Б. Тэмүүлэн" ≡ "б.тэмүүлэн". */
export function nameKey(name: string): string {
  return name.toLowerCase().replace(/[\s.]/g, "");
}

/** Grouping key for one child across records, linked or typed. */
export function studentKey(r: {
  studentId: string | null;
  studentName: string;
  classLabel: string;
}): string {
  return r.studentId ?? `${r.classLabel}|${nameKey(r.studentName)}`;
}

/** Student table stores the surname mostly as an initial ("Б"). */
export function studentDisplayName(lastName: string, firstName: string): string {
  return lastName.length <= 2 ? `${lastName}. ${firstName}` : `${lastName} ${firstName}`;
}
