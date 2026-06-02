import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  const name = arg ?? "Админ";
  const pin = process.argv[3] ?? "0000";

  const existing = await prisma.user.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  const hashedPin = await bcrypt.hash(pin, 10);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", pin: hashedPin },
    });
    console.log(`✔ Шинэчлэгдсэн: "${existing.name}" → ADMIN. PIN: ${pin}`);
  } else {
    const created = await prisma.user.create({
      data: {
        name,
        position: "Системийн админ",
        role: "ADMIN",
        pin: hashedPin,
      },
    });
    console.log(`✔ Шинээр үүсгэв: "${created.name}" (ADMIN). PIN: ${pin}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
