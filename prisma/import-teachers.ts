import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const FILE = process.argv[2] ?? "/Users/zolo/Downloads/нэр.xlsx";
const DEFAULT_PIN = "0000";

interface Row {
  name: string;
  position: string;
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

  const data = rows.map((r) => ({
    name: r.name,
    position: r.position,
    role: "TEACHER",
    pin: DEFAULT_PIN,
  }));

  await prisma.user.createMany({ data });

  const count = await prisma.user.count({ where: { role: "TEACHER" } });
  console.log(
    `✓ Inserted ${data.length} teachers. Total in DB: ${count}. Анхны PIN: ${DEFAULT_PIN}`,
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
