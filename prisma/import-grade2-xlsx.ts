import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import fs from "node:fs";

const prisma = new PrismaClient();

const FILE = process.argv[2] || "/Users/zolo/Downloads/Анги-хуваарилалт.xlsx";
const GRADE = 2;
const SECTIONS = ["А", "Б", "В", "Г", "Д"] as const;

// Rows highlighted yellow (parent-flagged for the new Е бүлэг) → chosen=true
const HIGHLIGHT_COLORS = new Set(["FFFF00", "FFFFFF00"]);

function cellFillColor(cell: XLSX.CellObject | undefined): string | null {
  if (!cell || !cell.s) return null;
  // xlsx encodes fill color under s.fgColor.rgb or bgColor.rgb
  const s = cell.s as { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } };
  return s.fgColor?.rgb ?? s.bgColor?.rgb ?? null;
}

function normalizeGender(raw: unknown): "M" | "F" {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s.startsWith("эм") || s === "f" || s === "female") return "F";
  return "M";
}

function normalizeName(raw: unknown): string {
  return String(raw ?? "").trim().replace(/\s+/g, " ");
}

interface ParsedRow {
  lastName: string;
  firstName: string;
  gender: "M" | "F";
  address: string;
  chosen: boolean;
}

function parseSheet(ws: XLSX.WorkSheet): ParsedRow[] {
  const ref = ws["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const out: ParsedRow[] = [];

  // Find header row: the row that has "Овог" in column B or C
  let headerRow = -1;
  for (let R = range.s.r; R <= Math.min(range.e.r, 5); R++) {
    for (let C = range.s.c; C <= Math.min(range.e.c, 3); C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })] as XLSX.CellObject | undefined;
      if (cell && String(cell.v ?? "").trim() === "Овог") {
        headerRow = R;
        break;
      }
    }
    if (headerRow >= 0) break;
  }
  if (headerRow < 0) headerRow = range.s.r + 2; // fall back

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    const noCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })] as XLSX.CellObject | undefined;
    const lastCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })] as XLSX.CellObject | undefined;
    const firstCell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })] as XLSX.CellObject | undefined;
    const genderCell = ws[XLSX.utils.encode_cell({ r: R, c: 3 })] as XLSX.CellObject | undefined;
    const addrCell = ws[XLSX.utils.encode_cell({ r: R, c: 4 })] as XLSX.CellObject | undefined;

    const num = noCell?.v;
    const lastName = normalizeName(lastCell?.v);
    const firstName = normalizeName(firstCell?.v);
    if (!firstName) continue; // skip blank rows
    if (num === undefined || num === "") {
      // some rows may lack the № column but still have names
      if (!lastName && !firstName) continue;
    }

    // Yellow highlight can be on any of the row cells — check name/address cells.
    const chosen = [lastCell, firstCell, addrCell].some((c) => {
      const rgb = cellFillColor(c);
      return rgb ? HIGHLIGHT_COLORS.has(rgb.toUpperCase()) : false;
    });

    out.push({
      lastName: lastName || "-",
      firstName,
      gender: normalizeGender(genderCell?.v),
      address: normalizeName(addrCell?.v),
      chosen,
    });
  }

  return out;
}

async function ensureClassroom(section: string, index: number) {
  const existing = await prisma.classroom.findUnique({
    where: { grade_section: { grade: GRADE, section } },
  });
  if (existing) return existing;
  return prisma.classroom.create({
    data: {
      grade: GRADE,
      section,
      label: `${GRADE}${section} анги`,
      headTeacher: "Тодорхойлогдоогүй",
      room: `${208 + index} тоот`,
      capacity: 32,
      studentCount: 0,
      status: "official",
    },
  });
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error("Файл олдсонгүй:", FILE);
    process.exit(1);
  }
  console.log(`Импорт эх сурвалж: ${FILE}`);
  const wb = XLSX.read(fs.readFileSync(FILE), { type: "buffer", cellStyles: true });

  let totalImported = 0;
  let totalChosen = 0;

  for (let i = 0; i < SECTIONS.length; i++) {
    const section = SECTIONS[i]!;
    const ws = wb.Sheets[section];
    if (!ws) {
      console.log(`\n${GRADE}${section}: sheet олдсонгүй — алгасав.`);
      continue;
    }

    const parsed = parseSheet(ws);
    if (parsed.length === 0) {
      console.log(`\n${GRADE}${section}: сурагч олдсонгүй.`);
      continue;
    }

    const classroom = await ensureClassroom(section, i);
    console.log(`\n${classroom.label}: ${parsed.length} сурагч — импорт эхлүүлж байна`);

    // Clear existing students in this classroom to avoid mixed state
    await prisma.student.deleteMany({ where: { classroomId: classroom.id } });

    let chosenCount = 0;
    for (let k = 0; k < parsed.length; k++) {
      const s = parsed[k]!;
      const code = `${GRADE}${section}-${String(k + 1).padStart(3, "0")}`;
      // Use idempotent upsert on the unique `code` field
      await prisma.student.upsert({
        where: { code },
        create: {
          code,
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          attendance: 95,
          gpa: 3.5,
          chosen: s.chosen,
          classroomId: classroom.id,
        },
        update: {
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender,
          chosen: s.chosen,
          classroomId: classroom.id,
        },
      });
      if (s.chosen) chosenCount++;
    }

    await prisma.classroom.update({
      where: { id: classroom.id },
      data: { studentCount: parsed.length },
    });

    console.log(`  → нийт: ${parsed.length}, сонгосон: ${chosenCount}`);
    totalImported += parsed.length;
    totalChosen += chosenCount;
  }

  console.log(
    `\nБэлэн: ${totalImported} сурагч импортлогдож, ${totalChosen} нь "сонгосон" гэж тэмдэглэгдлээ.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
