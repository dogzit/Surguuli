"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import {
  SCHOOL_INFO_KEYS,
  type HistoryEntry,
  type LocationEntry,
  type MissionEntry,
} from "@/lib/school-info";
import type { Result } from "./admin";

// Plain-text fields. Each maps 1:1 to a SchoolInfo key; an empty value
// deletes the row so public pages hide the field instead of showing "".
const TEXT_FIELDS = [
  "name",
  "shortName",
  "foundedYear",
  "address",
  "district",
  "city",
  "phone",
  "email",
  "workHours",
  "mapUrl",
  "principalName",
  "principalQuote",
  "heroStudents",
  "heroStaff",
  "olympiadMedals",
  "qualityNationalExam",
  "qualityNationalExamDesc",
  "qualityUniversityRate",
  "qualityPisaScore",
  "qualityTeacherDesc",
  "protectionOfficer",
  "protectionPhone",
  "protectionEmail",
  "developerCredit",
] as const;

type TextField = (typeof TEXT_FIELDS)[number];

// Long-form fields get a bigger cap than names/numbers.
const LONG_FIELDS = new Set<TextField>([
  "principalQuote",
  "qualityNationalExamDesc",
  "qualityTeacherDesc",
]);
const MAX_SHORT = 200;
const MAX_LONG = 2000;
const MAX_LIST_ITEMS = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SchoolInfoInput = Record<TextField, string> & {
  protectionPolicies: string[];
  gradeManagers: Record<string, string>;
  history: HistoryEntry[];
  mission: MissionEntry[];
  locations: LocationEntry[];
};

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function saveSchoolInfo(input: SchoolInfoInput): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const text = {} as Record<TextField, string>;
  for (const field of TEXT_FIELDS) {
    text[field] = clip(input[field], LONG_FIELDS.has(field) ? MAX_LONG : MAX_SHORT);
  }

  if (text.foundedYear && !/^\d{4}$/.test(text.foundedYear)) {
    return { ok: false, error: "Байгуулагдсан он 4 оронтой тоо байх ёстой (жишээ нь 1921)." };
  }
  if (text.mapUrl && !/^https:\/\/\S+$/.test(text.mapUrl)) {
    return { ok: false, error: "Google Maps холбоос https:// -ээр эхэлсэн байх ёстой." };
  }
  for (const field of ["email", "protectionEmail"] as const) {
    if (text[field] && !EMAIL_RE.test(text[field])) {
      return { ok: false, error: "И-мэйл хаяг буруу байна." };
    }
  }

  // Drop blank rows so a half-filled "add" never reaches the public page.
  const policies = (input.protectionPolicies ?? [])
    .map((p) => clip(p, MAX_LONG))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

  const gradeManagers: Record<string, string> = {};
  for (let g = 1; g <= 12; g++) {
    const name = clip(input.gradeManagers?.[String(g)], MAX_SHORT);
    if (name) gradeManagers[String(g)] = name;
  }

  const history: HistoryEntry[] = (input.history ?? [])
    .map((h) => ({
      year: clip(h.year, 60),
      title: clip(h.title, MAX_SHORT),
      body: clip(h.body, MAX_LONG),
      icon: clip(h.icon, 40) || undefined,
    }))
    .filter((h) => h.year || h.title || h.body)
    .slice(0, MAX_LIST_ITEMS);

  const mission: MissionEntry[] = (input.mission ?? [])
    .map((m) => ({
      icon: clip(m.icon, 40),
      title: clip(m.title, MAX_SHORT),
      body: clip(m.body, MAX_LONG),
    }))
    .filter((m) => m.title || m.body)
    .slice(0, MAX_LIST_ITEMS);

  const locations: LocationEntry[] = (input.locations ?? [])
    .map((l) => ({
      num: clip(l.num, 10),
      label: clip(l.label, MAX_SHORT),
      era: clip(l.era, MAX_SHORT),
    }))
    .filter((l) => l.label)
    .slice(0, MAX_LIST_ITEMS);

  const values: Array<{ key: string; value: string | null }> = [
    ...TEXT_FIELDS.map((f) => ({ key: SCHOOL_INFO_KEYS[f], value: text[f] || null })),
    {
      key: SCHOOL_INFO_KEYS.protectionPolicies,
      value: policies.length ? JSON.stringify(policies) : null,
    },
    {
      key: SCHOOL_INFO_KEYS.gradeManagers,
      value: Object.keys(gradeManagers).length ? JSON.stringify(gradeManagers) : null,
    },
    { key: SCHOOL_INFO_KEYS.history, value: history.length ? JSON.stringify(history) : null },
    { key: SCHOOL_INFO_KEYS.mission, value: mission.length ? JSON.stringify(mission) : null },
    { key: SCHOOL_INFO_KEYS.locations, value: locations.length ? JSON.stringify(locations) : null },
  ];

  await prisma.$transaction(
    values.map(({ key, value }) =>
      value === null
        ? prisma.schoolInfo.deleteMany({ where: { key } })
        : prisma.schoolInfo.upsert({
            where: { key },
            create: { key, value },
            update: { value },
          }),
    ),
  );

  await logAudit({
    action: "school_info.update",
    targetType: "SchoolInfo",
    metadata: { filled: values.filter((v) => v.value !== null).map((v) => v.key) },
  });

  // School name/contacts appear in the root layout (metadata, footer), so
  // flush every page rather than guessing which ones read which key.
  revalidatePath("/", "layout");
  return { ok: true, message: "Сургуулийн мэдээлэл хадгалагдлаа." };
}
