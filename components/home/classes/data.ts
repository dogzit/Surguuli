import type { Classroom, Student } from "./types";

const LAST_NAMES = [
  "Батбаяр", "Дорж", "Энхбаяр", "Ганбат", "Мөнхбат", "Отгонбаяр", "Пүрэв",
  "Сүхбаатар", "Түвшин", "Ундрах", "Хишиг", "Цогт", "Чулуун", "Шижир",
  "Эрдэнэ", "Ялалт", "Баясгалан", "Наранбаатар", "Гэрэлт", "Мандах",
];

const MALE_NAMES = [
  "Тэмүүлэн", "Билгүүн", "Тэмүүжин", "Ану", "Батсайхан", "Мөнхбилэг",
  "Түвшинжаргал", "Одбаяр", "Энхтөр", "Хүслэн", "Заяа", "Мөнх-Эрдэнэ",
  "Ганзориг", "Дөлгөөн", "Хангай",
];

const FEMALE_NAMES = [
  "Номин", "Мишээл", "Ариунзаяа", "Хулан", "Оюунтуяа", "Сарнай", "Нандин",
  "Мөнхзул", "Уянга", "Мандухай", "Долгион", "Энхжин", "Түмэн-Өлзий",
  "Соёлмаа", "Жаргалмаа",
];

function makeStudent(seed: number, gender: "M" | "F", code: string): Student {
  const lastName = LAST_NAMES[seed % LAST_NAMES.length]!;
  const pool = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
  const firstName = pool[Math.floor(seed / LAST_NAMES.length) % pool.length]!;
  const attendance = 88 + ((seed * 7) % 11);
  const gpa = Number((3.1 + ((seed * 13) % 90) / 100).toFixed(2));
  return { id: `stu-${code}`, code, lastName, firstName, gender, attendance, gpa };
}

export function buildRoster(prefix: string, count: number, startSeed: number): Student[] {
  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const gender: "M" | "F" = i % 2 === 0 ? "F" : "M";
    const code = `${prefix}-${String(i + 1).padStart(3, "0")}`;
    students.push(makeStudent(startSeed + i, gender, code));
  }
  return students;
}

export interface ClassroomInput {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  studentCount: number;
  status: string;
}

export function hydrateGrade2(rows: ClassroomInput[]): Classroom[] {
  return rows
    .filter((r) => r.grade === 2)
    .map((r, idx) => ({
      id: r.id,
      label: r.label,
      headTeacher: r.headTeacher,
      room: r.room ?? "-",
      capacity: r.capacity,
      createdAt: "2025-09-01",
      status: r.status === "draft" ? "draft" : "official",
      students: buildRoster(`2${r.section}`, r.studentCount, 3 + idx * 40),
    }));
}

export const NEW_SECTION_TEACHERS = [
  "А. Дэлгэрмөрөн", "Ц. Батзориг", "Н. Сэлэнгэ", "Б. Ариунтуяа", "Д. Мөнхбат",
];

export const NEW_SECTION_ROOMS = ["210 тоот", "212 тоот", "215 тоот", "218 тоот"];
