import { PrismaClient } from "@prisma/client";

// One-shot maintenance: force every Classroom.studentCount to match the
// actual number of related Student rows. Safe to run any time — expected
// output on a clean DB is "0 mismatches".
//
// Usage: `tsx prisma/reconcile-student-counts.ts`

const prisma = new PrismaClient();

async function main() {
  const classrooms = await prisma.classroom.findMany({
    include: { _count: { select: { students: true } } },
  });

  let fixed = 0;
  for (const c of classrooms) {
    const actual = c._count.students;
    if (c.studentCount !== actual) {
      await prisma.classroom.update({
        where: { id: c.id },
        data: { studentCount: actual },
      });
      console.log(
        `  · ${c.label}: ${c.studentCount} → ${actual} (${actual - c.studentCount >= 0 ? "+" : ""}${actual - c.studentCount})`,
      );
      fixed++;
    }
  }

  console.log(
    fixed === 0
      ? `✓ ${classrooms.length} анги · зөрчил байхгүй.`
      : `✓ ${classrooms.length} ангиас ${fixed} мөр засагдлаа.`,
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
