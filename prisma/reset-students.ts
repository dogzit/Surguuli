import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Student table-ыг цэвэрлэж байна…");
  const deleted = await prisma.student.deleteMany();
  console.log(`  · ${deleted.count} мөр устгагдав.`);

  // Reset studentCount on every classroom
  const cls = await prisma.classroom.findMany();
  for (const c of cls) {
    await prisma.classroom.update({
      where: { id: c.id },
      data: { studentCount: 0 },
    });
  }
  console.log(`  · ${cls.length} ангийн studentCount 0 болгов.`);

  // Also remove any draft classrooms created by shuffle
  const drafts = await prisma.classroom.deleteMany({ where: { status: "draft" } });
  if (drafts.count > 0) console.log(`  · ${drafts.count} draft бүлэг устгагдав.`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
