import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { APPROVER_POSITIONS } from "../lib/positions";

const prisma = new PrismaClient();

const DEFAULT_PIN = "0000";

async function main() {
  console.log("Seeding database...");
  const hashedPin = await bcrypt.hash(DEFAULT_PIN, 10);

  const teachers = Array.from({ length: 100 }, (_, i) => ({
    name: `Багш ${String(i + 1).padStart(3, "0")}`,
    position: "Багш",
    role: "TEACHER",
    pin: hashedPin,
  }));

  const approvers = APPROVER_POSITIONS.map((position) => ({
    name: position,
    position,
    role: "APPROVER",
    pin: hashedPin,
  }));

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
