import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SECTIONS = ["А", "Б", "В", "Г"] as const;

const HEAD_TEACHERS = [
  "Б. Мөнхцэцэг", "Д. Оюунчимэг", "Ц. Батжаргал", "Н. Батчимэг",
  "Х. Түмэндэмбэрэл", "Б. Оюунбилэг", "Г. Наранцэцэг", "Ц. Энхтуяа",
  "Р. Пүрэвсүрэн", "Э. Батсайхан", "Т. Долгорсүрэн", "Ж. Мөнхзаяа",
  "С. Ганбаатар", "О. Уянга", "А. Дэлгэрмөрөн", "Ц. Батзориг",
  "Н. Сэлэнгэ", "Б. Ариунтуяа", "Д. Мөнхбат", "А. Түмэн-Өлзий",
  "Р. Ганзориг", "Ч. Наранцэцэг", "У. Соёлмаа", "Э. Мөнхтуяа",
  "Т. Хишигжаргал", "Б. Отгонбаяр", "Ц. Дэлгэрмаа", "Х. Ундрал",
  "Ө. Мөнхжаргал", "Д. Нямсүрэн", "Г. Батбаяр", "Н. Оюунтуяа",
  "Б. Энхжаргал", "Т. Гансүх", "Ц. Мөнхтуяа", "Р. Батсүх",
  "Ц. Дэлгэрсайхан",
];

function buildRows() {
  const rows: Array<{
    grade: number;
    section: string;
    label: string;
    headTeacher: string;
    room: string;
    capacity: number;
    studentCount: number;
    status: string;
  }> = [];

  let teacherIdx = 0;
  for (let grade = 1; grade <= 12; grade++) {
    const sectionCount = grade >= 7 && grade <= 9 ? 4 : 3;
    for (let i = 0; i < sectionCount; i++) {
      const section = SECTIONS[i]!;
      const teacher = HEAD_TEACHERS[teacherIdx++ % HEAD_TEACHERS.length]!;
      rows.push({
        grade,
        section,
        label: `${grade}${section} анги`,
        headTeacher: teacher,
        room: `${200 + grade * 4 + i} тоот`,
        capacity: 32,
        studentCount: 26 + ((grade + i * 3) % 8),
        status: "official",
      });
    }
  }
  return rows;
}

async function main() {
  console.log("Seeding classrooms only (users/signatures unaffected)...");
  await prisma.classroom.deleteMany();
  const rows = buildRows();
  await prisma.classroom.createMany({ data: rows });
  const count = await prisma.classroom.count();
  console.log(`Seeded ${count} анги.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
