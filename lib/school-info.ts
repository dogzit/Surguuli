import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Central source of truth for anything that used to be hardcoded in a
// component. Every field maps to a SchoolInfo key of the same name (with
// underscores). Values that don't exist in the DB return null — callers
// should render "—" or hide the field rather than fabricate a number.
//
// Array-shaped content (timeline, mission, locations) is stored as a
// single JSON-encoded string under one key. That keeps admin editing to
// one row and avoids a proliferation of tables for tiny lists.

export interface HistoryEntry {
  year: string;
  title: string;
  body: string;
  icon?: string; // lucide icon name
}

export interface MissionEntry {
  icon: string;
  title: string;
  body: string;
}

export interface LocationEntry {
  num: string;
  label: string;
  era: string;
}

export interface SchoolInfoBundle {
  // Identity
  name: string | null;
  shortName: string | null;
  foundedYear: string | null;

  // Contact / address
  address: string | null;
  district: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  workHours: string | null;
  mapUrl: string | null; // share link from Google Maps

  // Principal
  principalName: string | null;
  principalQuote: string | null;

  // Hero / stats
  heroStudents: string | null;
  heroStaff: string | null;
  olympiadMedals: string | null;

  // Quality page
  qualityNationalExam: string | null;
  qualityNationalExamDesc: string | null;
  qualityUniversityRate: string | null;
  qualityPisaScore: string | null;
  qualityTeacherDesc: string | null;

  // Protection
  protectionOfficer: string | null;
  protectionPhone: string | null;
  protectionEmail: string | null;
  protectionPolicies: string[]; // JSON array

  // Grade managers (headTeachers are per-classroom; this is per-grade)
  gradeManagers: Record<string, string>; // e.g. { "2": "Ц. Оюунтуяа" }

  // History / mission / locations (JSON arrays)
  history: HistoryEntry[];
  mission: MissionEntry[];
  locations: LocationEntry[];

  // Footer / meta
  developerCredit: string | null;
}

const KEYS = {
  name: "school_name",
  shortName: "school_short_name",
  foundedYear: "founded_year",
  address: "address",
  district: "district",
  city: "city",
  phone: "phone",
  email: "email",
  workHours: "work_hours",
  mapUrl: "map_url",
  principalName: "principal_name",
  principalQuote: "principal_quote",
  heroStudents: "hero_stats_students",
  heroStaff: "hero_stats_staff",
  olympiadMedals: "quality_olympiad_medals",
  qualityNationalExam: "quality_national_exam",
  qualityNationalExamDesc: "quality_national_exam_desc",
  qualityUniversityRate: "quality_university_rate",
  qualityPisaScore: "quality_pisa_score",
  qualityTeacherDesc: "quality_teacher_desc",
  protectionOfficer: "protection_officer",
  protectionPhone: "protection_phone",
  protectionEmail: "protection_email",
  protectionPolicies: "protection_policies", // JSON array of strings
  gradeManagers: "grade_managers", // JSON object { "2": "name" }
  history: "history_timeline", // JSON array
  mission: "mission_pillars", // JSON array
  locations: "history_locations", // JSON array
  developerCredit: "developer_credit",
} as const;

/** Parse a JSON blob stored in SchoolInfo without ever throwing. */
function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Load every school-info row in one query and turn it into a typed bundle.
 * Called from any server component that needs identity/contact/etc. data.
 * The public pages have `revalidate = 60/3600` so this runs at most once
 * per revalidation window.
 */
// Empty bundle used as a safe fallback when the DB is unreachable
// (Neon cold-start on the free tier, network blip, migration in flight).
// Every field matches the "no data yet" shape — components already
// handle nulls and empty arrays, so the page renders instead of 500ing.
function emptyBundle(): SchoolInfoBundle {
  return {
    name: null, shortName: null, foundedYear: null,
    address: null, district: null, city: null,
    phone: null, email: null, workHours: null, mapUrl: null,
    principalName: null, principalQuote: null,
    heroStudents: null, heroStaff: null, olympiadMedals: null,
    qualityNationalExam: null, qualityNationalExamDesc: null,
    qualityUniversityRate: null, qualityPisaScore: null, qualityTeacherDesc: null,
    protectionOfficer: null, protectionPhone: null, protectionEmail: null,
    protectionPolicies: [],
    gradeManagers: {},
    history: [], mission: [], locations: [],
    developerCredit: null,
  };
}

// Memoised per request: the root layout's metadata, the layout and the page
// all read it.
export const loadSchoolInfoBundle = cache(async (): Promise<SchoolInfoBundle> => {
  let rows: Array<{ key: string; value: string }>;
  try {
    rows = await prisma.schoolInfo.findMany();
  } catch (err) {
    // Neon free tier cold-starts take ~10s. Rather than 500 every ISR
    // page during that window, log and hand back an empty bundle;
    // the next revalidation picks up real data.
    console.warn("[school-info] DB unreachable, using empty bundle:", err instanceof Error ? err.message : err);
    return emptyBundle();
  }
  const map = new Map<string, string>();
  for (const r of rows) map.set(r.key, r.value);

  const get = (key: string): string | null => {
    const v = map.get(key);
    if (v === undefined) return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  return {
    name: get(KEYS.name),
    shortName: get(KEYS.shortName),
    foundedYear: get(KEYS.foundedYear),
    address: get(KEYS.address),
    district: get(KEYS.district),
    city: get(KEYS.city),
    phone: get(KEYS.phone),
    email: get(KEYS.email),
    workHours: get(KEYS.workHours),
    mapUrl: get(KEYS.mapUrl),
    principalName: get(KEYS.principalName),
    principalQuote: get(KEYS.principalQuote),
    heroStudents: get(KEYS.heroStudents),
    heroStaff: get(KEYS.heroStaff),
    olympiadMedals: get(KEYS.olympiadMedals),
    qualityNationalExam: get(KEYS.qualityNationalExam),
    qualityNationalExamDesc: get(KEYS.qualityNationalExamDesc),
    qualityUniversityRate: get(KEYS.qualityUniversityRate),
    qualityPisaScore: get(KEYS.qualityPisaScore),
    qualityTeacherDesc: get(KEYS.qualityTeacherDesc),
    protectionOfficer: get(KEYS.protectionOfficer),
    protectionPhone: get(KEYS.protectionPhone),
    protectionEmail: get(KEYS.protectionEmail),
    protectionPolicies: safeParseJson<string[]>(map.get(KEYS.protectionPolicies), []),
    gradeManagers: safeParseJson<Record<string, string>>(map.get(KEYS.gradeManagers), {}),
    history: safeParseJson<HistoryEntry[]>(map.get(KEYS.history), []),
    mission: safeParseJson<MissionEntry[]>(map.get(KEYS.mission), []),
    locations: safeParseJson<LocationEntry[]>(map.get(KEYS.locations), []),
    developerCredit: get(KEYS.developerCredit),
  };
});

/** Just the school display name — small helper used by page metadata. */
export async function loadSchoolName(): Promise<string> {
  try {
    const row = await prisma.schoolInfo.findUnique({ where: { key: KEYS.name } });
    return row?.value?.trim() || "";
  } catch {
    // Metadata is generated per request in dev; failing here would 500
    // every page during a Neon cold-start. Empty string is fine — the
    // caller falls back to a generic title.
    return "";
  }
}

/** Every configurable key, exported for the seed script and any admin UI. */
export const SCHOOL_INFO_KEYS = KEYS;
