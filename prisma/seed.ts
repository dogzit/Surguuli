import { PrismaClient } from "@prisma/client";
import { APPROVER_POSITIONS } from "../lib/positions";

const prisma = new PrismaClient();

const DEFAULT_PIN = "0000";

const teachers = Array.from({ length: 100 }, (_, i) => ({
  name: `Багш ${String(i + 1).padStart(3, "0")}`,
  position: "Багш",
  role: "TEACHER",
  pin: DEFAULT_PIN,
}));

const approvers = APPROVER_POSITIONS.map((position) => ({
  name: position,
  position,
  role: "APPROVER",
  pin: DEFAULT_PIN,
}));

async function main() {
  console.log("Seeding database...");
  await prisma.signature.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.createMany({ data: teachers });
  await prisma.user.createMany({ data: approvers });
  console.log(
    `Seeded ${teachers.length} багш, ${approvers.length} гарын үсэг зурагч. Анхны PIN: ${DEFAULT_PIN}`,
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
