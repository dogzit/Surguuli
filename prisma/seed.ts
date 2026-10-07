import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { APPROVER_POSITIONS } from "../lib/positions";

// Safe bootstrap for a fresh database. It only creates the approver
// accounts that the signature workflow needs (one per position in
// lib/positions.ts) and never deletes or overwrites anything, so running
// it against a live database is harmless.
//
// Real content — teachers, students, classrooms, news, school info — is
// entered through the admin panel or imported from the school's own files
// (db:import-grade2, prisma/import-teachers.ts). No demo data lives here.

const prisma = new PrismaClient();

const DEFAULT_PIN = "0000";

async function main() {
  const hashedPin = await bcrypt.hash(DEFAULT_PIN, 10);

  let created = 0;
  for (const position of APPROVER_POSITIONS) {
    const existing = await prisma.user.findFirst({
      where: { role: "APPROVER", position },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.user.create({
      data: { name: position, position, role: "APPROVER", pin: hashedPin },
    });
    created++;
    console.log(`  + ${position}`);
  }

  console.log(
    created > 0
      ? `✓ ${created} гарын үсэг зурагч үүсгэв. Анхны PIN: ${DEFAULT_PIN} — нэвтэрмэгц солино уу.`
      : "✓ Бүх гарын үсэг зурагч бүртгэлтэй байна. Өөрчлөлт хийгдсэнгүй.",
  );
  console.log(
    "Сургуулийн мэдээлэл, мэдээ, ангиудыг /dashboard/admin хэсгээс оруулна уу.",
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
