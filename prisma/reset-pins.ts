import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: "TEACHER" },
    data: { pin: "0000" },
  });

  console.log(`✓ Reset ${result.count} teachers' PINs to 0000`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
