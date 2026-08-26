import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const FILE = process.argv[2] ?? "/Users/zolo/Downloads/нэр (1).xlsx";

interface Row {
  name: string;
  position: string;
}

function generateUniquePin(existing: Set<string>): string {
  let pin: string;
  do {
    pin = String(Math.floor(1000 + Math.random() * 9000));
  } while (existing.has(pin));
  existing.add(pin);
  return pin;
}

async function main() {
  console.log(`Reading: ${FILE}`);
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
    header: 1,
    defval: null,
  });

  const rows: Row[] = [];
  for (const r of raw) {
    const idx = Number(r[0]);
    const name = typeof r[1] === "string" ? r[1].trim() : "";
    const position = typeof r[2] === "string" ? r[2].trim() : "";
    if (!Number.isFinite(idx) || !name) continue;
    rows.push({ name, position: position || "Багш" });
  }
  console.log(`Parsed ${rows.length} teachers.`);

  console.log("Removing old TEACHER users (signatures cascade)...");
  await prisma.user.deleteMany({ where: { role: "TEACHER" } });

  const usedPins = new Set<string>();
  const data = rows.map((r) => ({
    name: r.name,
    position: r.position,
    role: "TEACHER" as const,
    pin: generateUniquePin(usedPins),
  }));

  await prisma.user.createMany({ data });

  const count = await prisma.user.count({ where: { role: "TEACHER" } });
  console.log(`✓ Inserted ${data.length} teachers. Total in DB: ${count}.`);
  console.log("\nTeacher PIN codes:");
  console.log("─".repeat(40));
  for (const t of data) {
    console.log(`${t.pin}  ${t.name} (${t.position})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
