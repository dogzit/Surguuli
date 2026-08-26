import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LAST_NAMES = [
  "Батбаяр", "Дорж", "Энхбаяр", "Ганбат", "Мөнхбат", "Отгонбаяр", "Пүрэв",
  "Сүхбаатар", "Түвшин", "Ундрах", "Хишиг", "Цогт", "Чулуун", "Шижир",
  "Эрдэнэ", "Ялалт", "Баясгалан", "Наранбаатар", "Гэрэлт", "Мандах",
  "Бат-Эрдэнэ", "Түмэн", "Оюун", "Дэлгэр", "Соёлбаатар", "Ганзориг",
];

const MALE_NAMES = [
  "Тэмүүлэн", "Билгүүн", "Тэмүүжин", "Ану", "Батсайхан", "Мөнхбилэг",
  "Түвшинжаргал", "Одбаяр", "Энхтөр", "Хүслэн", "Заяа", "Мөнх-Эрдэнэ",
  "Ганзориг", "Дөлгөөн", "Хангай", "Батжаргал", "Наранбат", "Отгонжаргал",
  "Гантулга", "Батмөнх", "Уянгын", "Ганбаяр", "Батсүх",
];

const FEMALE_NAMES = [
  "Номин", "Мишээл", "Ариунзаяа", "Хулан", "Оюунтуяа", "Сарнай", "Нандин",
  "Мөнхзул", "Уянга", "Мандухай", "Долгион", "Энхжин", "Түмэн-Өлзий",
  "Соёлмаа", "Жаргалмаа", "Ариунтуяа", "Дэлгэрмаа", "Отгонбаяр", "Мөнхцэцэг",
  "Гэрэлмаа", "Нарантуяа", "Оюунбилэг", "Батчимэг",
];

function mulberry32(seedStr: string) {
  let a = 0;
  for (let i = 0; i < seedStr.length; i++) a = (a + seedStr.charCodeAt(i) * (i + 1)) >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

async function seedStudentsForGrade(grade: number) {
  const classrooms = await prisma.classroom.findMany({
    where: { grade },
    orderBy: { section: "asc" },
  });

  if (classrooms.length === 0) {
    console.log(`  · ${grade}-р анги: бүлэг олдсонгүй, алгасав.`);
    return { added: 0, kept: 0 };
  }

  let added = 0;
  let kept = 0;

  for (const c of classrooms) {
    const existing = await prisma.student.count({ where: { classroomId: c.id } });
    if (existing > 0) {
      kept += existing;
      console.log(`  · ${c.label}: ${existing} сурагч аль хэдийн бүртгэлтэй, алгасав.`);
      continue;
    }

    const rng = mulberry32(`${c.grade}-${c.section}-v1`);
    const count = Math.max(24, c.studentCount || 26);

    const rows = [];
    for (let i = 0; i < count; i++) {
      const gender: "M" | "F" = i % 2 === 0 ? "F" : "M";
      const first = gender === "M" ? pick(MALE_NAMES, rng) : pick(FEMALE_NAMES, rng);
      const last = pick(LAST_NAMES, rng);
      const code = `${c.grade}${c.section}-${String(i + 1).padStart(3, "0")}`;
      const attendance = 85 + Math.floor(rng() * 14);
      const gpa = Number((3.0 + rng() * 1.0).toFixed(2));
      rows.push({
        code,
        firstName: first,
        lastName: last,
        gender,
        attendance,
        gpa,
        classroomId: c.id,
      });
    }

    await prisma.student.createMany({ data: rows });
    await prisma.classroom.update({
      where: { id: c.id },
      data: { studentCount: rows.length },
    });
    added += rows.length;
    console.log(`  · ${c.label}: ${rows.length} сурагч нэмэв.`);
  }

  return { added, kept };
}

async function main() {
  const gradesArg = process.argv.slice(2).map(Number).filter((n) => n >= 1 && n <= 12);
  const grades = gradesArg.length > 0 ? gradesArg : [2];

  console.log(`Seeding students for grades: ${grades.join(", ")}`);
  let totalAdded = 0;
  let totalKept = 0;
  for (const g of grades) {
    console.log(`\n${g}-р анги:`);
    const { added, kept } = await seedStudentsForGrade(g);
    totalAdded += added;
    totalKept += kept;
  }
  console.log(`\nБэлэн: +${totalAdded} шинэ, ${totalKept} өөрчлөгдөөгүй.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
